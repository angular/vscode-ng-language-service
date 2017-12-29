import {DiagnosticSeverity, IConnection, Range, TextDocumentIdentifier} from 'vscode-languageserver';
import {TextDocuments} from './documents';
import {DiagnosticMessageChain} from '@angular/language-service/src/types';

export class ErrorCollector {
  private timer: NodeJS.Timer | undefined;

  constructor(
    private documents: TextDocuments,
    private connection: IConnection,
    private initialDelay: number = 750,
    private nextDelay: number = 20) {}

  public requestErrors(...documents: TextDocumentIdentifier[]) {
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = undefined;
    }
    let index = 0;
    let process: () => void;

    process = () => {
      this.timer = undefined;
      this.sendErrorsFor(documents[index++]);
      if (index < documents.length) this.timer = setTimeout(process, this.nextDelay);
    }
    this.timer = setTimeout(process, this.initialDelay);
  }

  private sendErrorsFor(document: TextDocumentIdentifier) {
    const {fileName, service} = this.documents.getServiceInfo(document);
    if (service) {
      const diagnostics = service.getDiagnostics(fileName);
      if (diagnostics) {
        const offsets = ([] as number[]).concat(...diagnostics.map(d => [d.span.start, d.span.end]));
        const positions = this.documents.offsetsToPositions(document, offsets);
        const ranges: Range[] = [];
        for (let i = 0; i < positions.length; i += 2) {
          ranges.push(Range.create(positions[i], positions[i+1]));
        }
        this.connection.sendDiagnostics({
          uri: document.uri,
          diagnostics: diagnostics.map((diagnostic, i) => ({
            range: ranges[i],
            message: flattenChain(diagnostic.message, ''),
            severity: DiagnosticSeverity.Error,
            source: 'Angular'
          }))
        });
      }
    }
  }
}

function flattenChain(message: string | DiagnosticMessageChain, prefix: string) {
  if (typeof message === 'string') {
    return `${prefix}${message}`;
  }
  if (message.next) {
    return `${prefix}${message.message}\n${flattenChain(message.next, prefix + '  ')}`;
  }
  return `${prefix}${message.message}`
}
