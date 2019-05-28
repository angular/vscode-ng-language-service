import * as ts from 'typescript';
import * as url from 'url';

import {LanguageService} from '@angular/language-service';

import {
  IConnection, TextDocumentSyncKind, RemoteConsole,
	TextDocumentIdentifier, Position
} from 'vscode-languageserver';

import {Logger as ProjectLogger, ProjectService, ProjectServiceEvent, ProjectServiceHost} from './editorServices';

// Delegate project service host to TypeScript's sys implementation
class ProjectServiceHostImpl implements ProjectServiceHost {
  getCurrentDirectory(): string {
    return ts.sys.getCurrentDirectory();
  }

  readFile(path: string, encoding?: string): string {
    return ts.sys.readFile(path, encoding);
  }

  directoryExists(path: string): boolean {
    return ts.sys.directoryExists(path);
  }

  getExecutingFilePath(): string {
    return ts.sys.getExecutingFilePath();
  }

  resolvePath(path: string): string {
    return ts.sys.resolvePath(path);
  }

  fileExists(path: string): boolean {
    return ts.sys.fileExists(path);
  }

  getDirectories(path: string): string[] {
    return ts.sys.getDirectories(path);
  }

  watchDirectory(path: string, callback: ts.DirectoryWatcherCallback, recursive?: boolean): ts.FileWatcher {
    return ts.sys.watchDirectory(path, callback, recursive);
  }

  watchFile(path: string, callback: ts.FileWatcherCallback): ts.FileWatcher {
    return ts.sys.watchFile(path, callback);
  }

  readDirectory(path: string, extensions?: string[], exclude?: string[], include?: string[]): string[] {
    return ts.sys.readDirectory(path, extensions, exclude, include);
  }

  get useCaseSensitiveFileNames() {
    return ts.sys.useCaseSensitiveFileNames;
  }

  get newLine(): string {
    return ts.sys.newLine;
  }

  setTimeout(callback: (...args: any[]) => void, ms: number, ...args: any[]): any {
    return setTimeout(callback, ms, ...args);
  }

  clearTimeout(timeoutId: any): void {
    return clearTimeout(timeoutId);
  }
}

class ProjectLoggerImpl implements ProjectLogger {
  private console: RemoteConsole;

  connect(console: RemoteConsole) {
    this.console = console;
  }

  close(): void {
    this.console = null;
  }

  isVerbose(): boolean {
    return false;
  }

  info(s: string): void {
    if (this.console)
      this.console.info(s);
  }

  startGroup(): void {}
  endGroup(): void {}

  msg(s: string, type?: string): void {
    if (this.console)
      this.console.log(s);
  }
}

declare function escape(text: string): string;
declare function unescape(text: string): string;

function uriToFileName(uri: string): string {
  const parsedUrl = url.parse(uri);
  switch (parsedUrl.protocol) {
  case 'file:':
  case 'private:':
    let result = unescape(parsedUrl.path);
    if (result.match(/^\/\w:/)) {
      result = result.substr(1);
    }
    return result;
  }
}

const fileProtocol = "file://";
export function fileNameToUri(fileName: string): string {
  if (fileName.match(/^\w:/)) {
    fileName = '/' + fileName;
  }
  return fileProtocol + escape(fileName);
}

export interface NgServiceInfo {
  fileName?: string;
  languageId?: string;
  service?: LanguageService;
  offset?: number;
}

export interface TextDocumentEvent {
  kind: 'context'|'opened'|'closed'|'change';
  document: TextDocumentIdentifier;
}

export interface TextDocumentLine {
  text: string;
  line: number;
  start: number;
}

export class TextDocuments {
  private projectService: ProjectService;
  private logger: ProjectLoggerImpl;
  private host: ProjectServiceHostImpl;
  private languageIds = new Map<string, string>();
  private changeNumber = 0;

  constructor(private event?: (event: TextDocumentEvent) => void) {
    this.logger = new ProjectLoggerImpl();
    this.host = new ProjectServiceHostImpl();
    this.projectService = new ProjectService(this.host, this.logger, this.handleProjectEvent.bind(this));
  }

  public get syncKind(): TextDocumentSyncKind {
    return TextDocumentSyncKind.Incremental;
  }

  public listen(connection: IConnection) {
    // Connect the logger to the connection
    this.logger.connect(connection.console);

    connection.onDidOpenTextDocument(event => this.logErrors(() => {
      // An interersting text document was opened in the client. Inform TypeScirpt's project services about it.
      const file = uriToFileName(event.textDocument.uri);
      if (file) {
        const { configFileName, configFileErrors } = this.projectService.openClientFile(file, event.textDocument.text);
        if (configFileErrors && configFileErrors.length) {
          // TODO: Report errors
          this.logger.msg(`Config errors encountered and need to be reported: ${configFileErrors.length}\n  ${configFileErrors.map(error => error.messageText).join('\n  ')}`);
        }
        this.languageIds.set(event.textDocument.uri, event.textDocument.languageId);
      }
    }));

    connection.onDidCloseTextDocument(event => this.logErrors(() => {
      const file = uriToFileName(event.textDocument.uri);
      if (file) {
        this.projectService.closeClientFile(file);
      }
    }));

    connection.onDidChangeTextDocument(event => this.logErrors(() => {
      const file = uriToFileName(event.textDocument.uri);
      if (file) {
        const positions = this.projectService.lineOffsetsToPositions(file,
          ([] as {line: number, col: number}[]).concat(...event.contentChanges.map(change => [{
            // VSCode is 0 based, editor services is 1 based.
            line: change.range.start.line + 1,
            col: change.range.start.character + 1
          }, {
            line: change.range.end.line + 1,
            col: change.range.end.character + 1
          }])));
        if (positions) {
          this.changeNumber++;
          const mappedChanges = event.contentChanges.map((change, i) => {
            const start = positions[i * 2];
            const end = positions[i * 2 + 1];
            return {start, end, insertText: change.text};
          });
          this.projectService.clientFileChanges(file, mappedChanges);
          this.changeNumber++;
        }
      }
    }));

    connection.onDidSaveTextDocument(event => this.logErrors(() => {
      // If the file is saved, force the content to be reloaded from disk as the content might have changed on save.
      this.changeNumber++;
      const file = uriToFileName(event.textDocument.uri);
      if (file) {
        const savedContent = this.host.readFile(file);
        this.projectService.closeClientFile(file);
        this.projectService.openClientFile(file, savedContent);
        this.changeNumber++;
      }
    }));
  }

  public offsetsToPositions(document: TextDocumentIdentifier, offsets: number[]): Position[] {
    const file = uriToFileName(document.uri);
    if (file) {
      const lineOffsets = this.projectService.positionsToLineOffsets(file, offsets)
      if (lineOffsets) {
        return lineOffsets.map(lineOffset => Position.create(lineOffset.line - 1, lineOffset.col - 1));
      }
    }
    return [];
  }

  public getDocumentLine(document: TextDocumentIdentifier, offset: number): TextDocumentLine {
    const info = this.getServiceInfo(document);
    if (info) {
      const lineInfo = this.projectService.positionToLineOffset(info.fileName, offset);
      if (lineInfo) {
        return { line: lineInfo.line, start: offset - lineInfo.offset, text: lineInfo.text };
      }
    }
  }

  public getNgService(document: TextDocumentIdentifier): LanguageService | undefined {
    return this.getServiceInfo(document).service;
  }

  public getServiceInfo(document: TextDocumentIdentifier, position?: Position): NgServiceInfo {
    const fileName = uriToFileName(document.uri);
    if (fileName) {
      const project = this.projectService.getProjectForFile(fileName);
      const languageId = this.languageIds.get(document.uri);
      if (project) {
        const service = project.compilerService.ngService;
        if (position) {
          // VSCode is 0 based, editor services are 1 based.
          const offset = this.projectService.lineOffsetsToPositions(fileName, [{line: position.line + 1, col: position.character + 1}])[0];
          return {fileName, service, offset, languageId};
        }
        return {fileName, service, languageId};
      }
      return {fileName, languageId};
    }
    return {};
  }

  public ifUnchanged(f: () => void): () => void {
    const currentChange = this.changeNumber;
    return () => {
      if (currentChange == this.changeNumber) f();
    };
  }

  private logErrors(f: () => void) {
    try {
      f();
    } catch (e) {
      if (e.message && e.stack) this.logger.msg(`SERVER ERROR: ${e.message}\n${e.stack}`);
      throw e;
    }
  }

  private handleProjectEvent(event: ProjectServiceEvent) {
    if (this.event) {
      switch (event.eventName) {
        case 'context':
        case 'opened':
        case 'closed':
        case 'change':
          this.event({kind: event.eventName,  document: { uri: fileNameToUri(event.data.fileName)} });
      }
    }
  }
}
