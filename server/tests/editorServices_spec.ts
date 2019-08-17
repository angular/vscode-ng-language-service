import {LineIndexSnapshot, ProjectService, ScriptInfo} from '../src/editorServices';

import * as u from './test_utils';
import {QUICKSTART} from './test_data';

describe('editor services', () => {
  let projectService: ProjectService;
  beforeAll(() => {
    projectService = new ProjectService(new u.MockProjectServiceHost(QUICKSTART), new u.MockLogger());
  });

  it('should be able to get the information for a file', () => {
    projectService.openClientFile('/app/app.component.ts');
    const info = projectService.getScriptInfo('/app/app.component.ts');
    expect(info).not.toBeUndefined();
  });

  describe('file', () => {
    function tests(fileName: string, content: string) {
      let info: ScriptInfo;
      let snap: LineIndexSnapshot;
      let len: number;

      beforeEach(() => {
        projectService.openClientFile(fileName, content);
        info = projectService.getScriptInfo(fileName);
        snap = info.snap();
        len = snap.getLength();
      })

      it('should be able to get pieces of a file', () => {
        const firstText = snap.getText(0, len);
        for (let i = 0; i < len; i++) {
          expect(snap.getText(i, i + 1)).toEqual(firstText[i]);
        }
      });

      it('should be able to modify the file and get the expected content', () => {
        const offsetOfComponent = content.indexOf('@Component');
        projectService.clientFileChanges(fileName, [{start: offsetOfComponent, end: offsetOfComponent, insertText: ' '}]);
        const text = info.getText();
        expect(text).toEqual(content.replace('@Component', ' @Component'));
      });

      describe('and line starts', () => {
        let lineStarts: number[];

        beforeAll(() => {
          lineStarts = getLineStarts(content);
        });

        it('should be able to get the expected line columns', () => {
          for (let i = 0; i < len; i++) {
            const expected = lineColOf(i, lineStarts)!;
            const result = projectService.positionsToLineOffsets(fileName, [i]);
            expect(result).toEqual([expected]);
          }
        });

        it('should be able to turn line columns in offsets', () => {
          for (let i = 0; i < len; i++) {
            const expected = lineColOf(i, lineStarts)!;
            const result = projectService.lineOffsetsToPositions(fileName, [expected]);
            expect(result).toEqual([i]);
          }
        });
      });
    }

    const fileName = '/app/app.component.ts';
    describe('with LF', () => {
      tests(fileName, u.read(fileName, QUICKSTART)!);
    });
    describe('with LF/CR', () => {
      tests(fileName, u.read(fileName, QUICKSTART)!.replace(/\n/g, '\r\n'));
    });
  });
});

function getLineStarts(content: string): number[] {
  const result = [0];
  const len = content.length;
  for (let i = 0; i < len; i++) {
    if (content[i] == `\n`) result.push(i + 1);
  }
  result.push(len);
  return result;
}

function lineColOf(position: number, lineStarts: number[]) {
  for (let line = 0; line < lineStarts.length; line++) {
    if (lineStarts[line + 1] > position) {
      return {line: line + 1, col: position - lineStarts[line] + 1};
    }
  }
}
