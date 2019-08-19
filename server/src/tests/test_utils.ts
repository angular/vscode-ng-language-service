import * as ts from 'typescript';
import {Logger, ProjectServiceHost} from '../editorServices';

export type MockData = string | MockDirectory;

export type MockDirectory = {
  [name: string]: MockData | undefined;
}

export function find(fileName: string, data: MockData): MockData|undefined {
  const names = fileName.split('/');
  if (names.length && !names[0].length) names.shift();
  let current = data;
  for (let name of names) {
    if (typeof current === 'string') {
      return undefined;
    } else {
      current = (current as MockDirectory)[name]!;
    }
    if (!current) return undefined;
  }
  return current;
}

export function read(fileName: string, data: MockData): string|undefined {
  const result = find(fileName, data);
  if (typeof result === 'string') {
    return result;
  }
  return undefined;
}

export function fileExists(fileName: string, data: MockData): boolean {
  let result = find(fileName, data);
  return !!result && typeof result == 'string';
}

export function directoryExists(dirname: string, data: MockData): boolean {
  let result = find(dirname, data);
  return !!result && typeof result !== 'string';
}

export function getDirectories(path: string, data: MockData): string[] {
  let result = find(path, data);
  if (!result || typeof result !== 'object') {
    return [];
  }
  return Object.keys(result);
}

export class MockProjectServiceHost implements ProjectServiceHost {
  readonly useCaseSensitiveFileNames = false;
  constructor(private data: MockData) {}
  getCurrentDirectory(): string { return "/"; }
  readFile(path: string, encoding?: string): string { return read(path, this.data)!; }
  directoryExists(path: string): boolean { return directoryExists(path, this.data); }
  getExecutingFilePath(): string { return "/"; }
  resolvePath(path: string): string { return path; }
  fileExists(path: string): boolean { return fileExists(path, this.data); }
  getDirectories(path: string): string[] { return [] }
  watchDirectory(path: string, callback: ts.DirectoryWatcherCallback, recursive?: boolean): ts.FileWatcher { return new MockFileWatcher(); }
  watchFile(path: string, callback: ts.FileWatcherCallback): ts.FileWatcher { return new MockFileWatcher(); }
  readDirectory(path: string, extensions?: string[], exclude?: string[], include?: string[]): string[] { return []; }
  setTimeout(callback: (...args: any[]) => void, ms: number, ...args: any[]): any { return undefined; }
  clearTimeout(timeoutId: any): void { }
}

export class MockLogger implements Logger {
  close(): void {}
  isVerbose(): boolean { return false; }
  info(s: string): void { }
  startGroup(): void {}
  endGroup(): void {}
  msg(s: string, type?: string): void {}
}

export class MockFileWatcher {
  close() {}
}
