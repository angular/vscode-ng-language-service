/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import {filePathToUri, uriToFilePath} from '../utils';

describe('filePathToUri', () => {
  it('should return URI with File scheme', () => {
    const uri = filePathToUri('/project/main.ts');
    expect(uri).toMatch(/^file/);
  });

  it('should handle network path', () => {
    const uri = filePathToUri('//project/main.ts');
    expect(uri).toBe('file://project/main.ts');
  });

  if (process.platform === 'win32') {
    it('should handle windows path', () => {
      const uri = filePathToUri('C:\\project\\main.ts');
      expect(uri).toBe('file:///c%3A/project/main.ts');
    });
  }
});

describe('uriToFilePath', () => {
  if (process.platform === 'win32') {
    it('should return valid fsPath for windows', () => {
      const filePath = uriToFilePath('file:///c%3A/project/main.ts');
      expect(filePath).toBe('c:\\project\\main.ts');
    });

    it('should return valid fsPath for network file uri', () => {
      const filePath = uriToFilePath('file://project/main.ts');
      expect(filePath).toBe('\\\\project\\main.ts');
    });
  }

  if (process.platform !== 'win32') {
    it('should return valid fsPath for unix', () => {
      const filePath = uriToFilePath('file:///project/main.ts');
      expect(filePath).toBe('/project/main.ts');
    });

    it('should return valid fsPath for network file uri', () => {
      const filePath = uriToFilePath('file://project/main.ts');
      expect(filePath).toBe('//project/main.ts');
    });
  }
});
