import {ChildProcess, fork} from 'child_process';
import {EventEmitter} from 'events';
import {resolve} from 'path';
import {IPCMessageWriter} from 'vscode-jsonrpc';
import {isNotificationMessage, Message, NotificationMessage, RequestMessage, ResponseMessage} from 'vscode-jsonrpc/lib/messages';

class ResponseEmitter extends EventEmitter {}

describe('Angular Language Service', () => {
  jasmine.DEFAULT_TIMEOUT_INTERVAL = 10000; /* 10 seconds */
  const PACKAGE_ROOT = resolve(__dirname, '../../..');
  const PROJECT_PATH = resolve(__dirname, '../../project');
  const SERVER_PATH = resolve(__dirname, '../../../dist/server/index.js');
  const responseEmitter = new ResponseEmitter();
  let server: ChildProcess;

  async function send(request: RequestMessage|NotificationMessage) {
    const writer = new IPCMessageWriter(server);
    writer.write(request);
    if (isNotificationMessage(request)) {
      return Promise.resolve(null);  // No response for notification message
    }
    return new Promise<any>((resolve, reject) => {
      responseEmitter.once('response', (response: ResponseMessage) => {
        if (response.error) {
          reject(new Error(response.error.message));
        } else {
          resolve(response);
        }
      });
    });
  }

  beforeEach(() => {
    server = fork(
        SERVER_PATH,
        [
          '--node-ipc',
          '--tsProbeLocations',
          PACKAGE_ROOT,
          '--ngProbeLocations',
          SERVER_PATH,
        ],
        {
          cwd: PROJECT_PATH,
          env: {
            TSC_NONPOLLING_WATCHER: 'true',
          },
        });
    server.on('error', fail);
    server.on('close', (code, signal) => {
      console.log(`Server 'close' event received`, code, signal);
      expect(code).toBe(0);
    });
    server.on('message', (data: Message) => {
      if (isNotificationMessage(data)) {
        const toLog = ['[server]', data.method];
        if (data.params && data.params.message) toLog.push(data.params.message);
        console.log(...toLog);
      } else {
        responseEmitter.emit('response', data);
      }
    });
  });

  afterEach(async () => {
    const response = await send({
      'jsonrpc': '2.0',
      'id': 2,
      'method': 'shutdown',
    });
    expect(response).toEqual({
      'jsonrpc': '2.0',
      'id': 2,
      'result': null,
    });
    await send({'jsonrpc': '2.0', 'method': 'exit'});
  });

  it('should handle startup', async () => {
    const response = await send({
      'jsonrpc': '2.0',
      'id': 0,
      'method': 'initialize',
      'params': {
        /**
         * The process Id of the parent process that started
         * the server. Is null if the process has not been started by another
         * process. If the parent process is not alive then the server should
         * exit (see exit notification) its process.
         */
        'processId': process.pid,
        'rootUri': `file://${PROJECT_PATH}`,
        'capabilities': {},
        /**
         * Options are 'off' | 'messages' | 'verbose'.
         * To debug test failure, set to 'verbose'.
         */
        'trace': 'off'
      }
    });
    expect(response).toEqual({
      'jsonrpc': '2.0',
      'id': 0,
      'result': {
        'capabilities': {
          'textDocumentSync': 2,
          'completionProvider':
              {'resolveProvider': false, 'triggerCharacters': ['<', '.', '*', '[', '(']},
          'definitionProvider': true,
          'hoverProvider': true
        }
      }
    });
  });

  it('should handle completion', async () => {
    let response;
    response = await send({
      'jsonrpc': '2.0',
      'id': 0,
      'method': 'initialize',
      'params': {
        'processId': process.pid,
        'rootUri': `file://${PROJECT_PATH}`,
        'capabilities': {},
        'trace': 'off'
      }
    });
    expect(response).toEqual({
      'jsonrpc': '2.0',
      'id': 0,
      'result': {
        'capabilities': {
          'textDocumentSync': 2,
          'completionProvider':
              {'resolveProvider': false, 'triggerCharacters': ['<', '.', '*', '[', '(']},
          'definitionProvider': true,
          'hoverProvider': true
        }
      }
    });
    response = await send({
      'jsonrpc': '2.0',
      'method': 'textDocument/didOpen',
      'params': {
        'textDocument': {
          'uri': `file://${PROJECT_PATH}/app/app.component.ts`,
          'languageId': 'typescript',
          'version': 1,
          'text':
              'import { Component } from \'@angular/core\';\n\n@Component({\n  selector: \'my-app\',\n  template: `<h1>Hello {{name}}</h1>`,\n})\nexport class AppComponent  { name = \'Angular\'; }\n'
        }
      }
    });
    expect(response).toBe(null);
    response = await send({
      'jsonrpc': '2.0',
      'method': 'textDocument/didChange',
      'params': {
        'textDocument': {'uri': `file://${PROJECT_PATH}/app/app.component.ts`, 'version': 2},
        'contentChanges': [{
          'range': {'start': {'line': 4, 'character': 29}, 'end': {'line': 4, 'character': 29}},
          'rangeLength': 0,
          'text': '.'
        }]
      }
    });
    expect(response).toBe(null);
    response = await send({
      'jsonrpc': '2.0',
      'id': 1,
      'method': 'textDocument/completion',
      'params': {
        'textDocument': {'uri': `file://${PROJECT_PATH}/app/app.component.ts`},
        'position': {'line': 4, 'character': 30}
      }
    });
    // TODO: Match the response with a golden file instead of hardcoding result.
    expect(response).toEqual({
      'jsonrpc': '2.0',
      'id': 1,
      'result': [
        {
          'label': 'toString',
          'kind': 2,
          'detail': 'method',
          'sortText': 'toString',
          'textEdit': {
            'range': {'start': {'line': 4, 'character': 30}, 'end': {'line': 4, 'character': 30}},
            'newText': 'toString()'
          }
        },
        {
          'label': 'charAt',
          'kind': 2,
          'detail': 'method',
          'sortText': 'charAt',
          'textEdit': {
            'range': {'start': {'line': 4, 'character': 30}, 'end': {'line': 4, 'character': 30}},
            'newText': 'charAt()'
          }
        },
        {
          'label': 'charCodeAt',
          'kind': 2,
          'detail': 'method',
          'sortText': 'charCodeAt',
          'textEdit': {
            'range': {'start': {'line': 4, 'character': 30}, 'end': {'line': 4, 'character': 30}},
            'newText': 'charCodeAt()'
          }
        },
        {
          'label': 'concat',
          'kind': 2,
          'detail': 'method',
          'sortText': 'concat',
          'textEdit': {
            'range': {'start': {'line': 4, 'character': 30}, 'end': {'line': 4, 'character': 30}},
            'newText': 'concat()'
          }
        },
        {
          'label': 'indexOf',
          'kind': 2,
          'detail': 'method',
          'sortText': 'indexOf',
          'textEdit': {
            'range': {'start': {'line': 4, 'character': 30}, 'end': {'line': 4, 'character': 30}},
            'newText': 'indexOf()'
          }
        },
        {
          'label': 'lastIndexOf',
          'kind': 2,
          'detail': 'method',
          'sortText': 'lastIndexOf',
          'textEdit': {
            'range': {'start': {'line': 4, 'character': 30}, 'end': {'line': 4, 'character': 30}},
            'newText': 'lastIndexOf()'
          }
        },
        {
          'label': 'localeCompare',
          'kind': 2,
          'detail': 'method',
          'sortText': 'localeCompare',
          'textEdit': {
            'range': {'start': {'line': 4, 'character': 30}, 'end': {'line': 4, 'character': 30}},
            'newText': 'localeCompare()'
          }
        },
        {
          'label': 'match',
          'kind': 2,
          'detail': 'method',
          'sortText': 'match',
          'textEdit': {
            'range': {'start': {'line': 4, 'character': 30}, 'end': {'line': 4, 'character': 30}},
            'newText': 'match()'
          }
        },
        {
          'label': 'replace',
          'kind': 2,
          'detail': 'method',
          'sortText': 'replace',
          'textEdit': {
            'range': {'start': {'line': 4, 'character': 30}, 'end': {'line': 4, 'character': 30}},
            'newText': 'replace()'
          }
        },
        {
          'label': 'search',
          'kind': 2,
          'detail': 'method',
          'sortText': 'search',
          'textEdit': {
            'range': {'start': {'line': 4, 'character': 30}, 'end': {'line': 4, 'character': 30}},
            'newText': 'search()'
          }
        },
        {
          'label': 'slice',
          'kind': 2,
          'detail': 'method',
          'sortText': 'slice',
          'textEdit': {
            'range': {'start': {'line': 4, 'character': 30}, 'end': {'line': 4, 'character': 30}},
            'newText': 'slice()'
          }
        },
        {
          'label': 'split',
          'kind': 2,
          'detail': 'method',
          'sortText': 'split',
          'textEdit': {
            'range': {'start': {'line': 4, 'character': 30}, 'end': {'line': 4, 'character': 30}},
            'newText': 'split()'
          }
        },
        {
          'label': 'substring',
          'kind': 2,
          'detail': 'method',
          'sortText': 'substring',
          'textEdit': {
            'range': {'start': {'line': 4, 'character': 30}, 'end': {'line': 4, 'character': 30}},
            'newText': 'substring()'
          }
        },
        {
          'label': 'toLowerCase',
          'kind': 2,
          'detail': 'method',
          'sortText': 'toLowerCase',
          'textEdit': {
            'range': {'start': {'line': 4, 'character': 30}, 'end': {'line': 4, 'character': 30}},
            'newText': 'toLowerCase()'
          }
        },
        {
          'label': 'toLocaleLowerCase',
          'kind': 2,
          'detail': 'method',
          'sortText': 'toLocaleLowerCase',
          'textEdit': {
            'range': {'start': {'line': 4, 'character': 30}, 'end': {'line': 4, 'character': 30}},
            'newText': 'toLocaleLowerCase()'
          }
        },
        {
          'label': 'toUpperCase',
          'kind': 2,
          'detail': 'method',
          'sortText': 'toUpperCase',
          'textEdit': {
            'range': {'start': {'line': 4, 'character': 30}, 'end': {'line': 4, 'character': 30}},
            'newText': 'toUpperCase()'
          }
        },
        {
          'label': 'toLocaleUpperCase',
          'kind': 2,
          'detail': 'method',
          'sortText': 'toLocaleUpperCase',
          'textEdit': {
            'range': {'start': {'line': 4, 'character': 30}, 'end': {'line': 4, 'character': 30}},
            'newText': 'toLocaleUpperCase()'
          }
        },
        {
          'label': 'trim',
          'kind': 2,
          'detail': 'method',
          'sortText': 'trim',
          'textEdit': {
            'range': {'start': {'line': 4, 'character': 30}, 'end': {'line': 4, 'character': 30}},
            'newText': 'trim()'
          }
        },
        {
          'label': 'length',
          'kind': 10,
          'detail': 'property',
          'sortText': 'length',
          'textEdit': {
            'range': {'start': {'line': 4, 'character': 30}, 'end': {'line': 4, 'character': 30}},
            'newText': 'length'
          }
        },
        {
          'label': 'substr',
          'kind': 2,
          'detail': 'method',
          'sortText': 'substr',
          'textEdit': {
            'range': {'start': {'line': 4, 'character': 30}, 'end': {'line': 4, 'character': 30}},
            'newText': 'substr()'
          }
        },
        {
          'label': 'valueOf',
          'kind': 2,
          'detail': 'method',
          'sortText': 'valueOf',
          'textEdit': {
            'range': {'start': {'line': 4, 'character': 30}, 'end': {'line': 4, 'character': 30}},
            'newText': 'valueOf()'
          }
        },
        {
          'label': 'codePointAt',
          'kind': 2,
          'detail': 'method',
          'sortText': 'codePointAt',
          'textEdit': {
            'range': {'start': {'line': 4, 'character': 30}, 'end': {'line': 4, 'character': 30}},
            'newText': 'codePointAt()'
          }
        },
        {
          'label': 'includes',
          'kind': 2,
          'detail': 'method',
          'sortText': 'includes',
          'textEdit': {
            'range': {'start': {'line': 4, 'character': 30}, 'end': {'line': 4, 'character': 30}},
            'newText': 'includes()'
          }
        },
        {
          'label': 'endsWith',
          'kind': 2,
          'detail': 'method',
          'sortText': 'endsWith',
          'textEdit': {
            'range': {'start': {'line': 4, 'character': 30}, 'end': {'line': 4, 'character': 30}},
            'newText': 'endsWith()'
          }
        },
        {
          'label': 'normalize',
          'kind': 2,
          'detail': 'method',
          'sortText': 'normalize',
          'textEdit': {
            'range': {'start': {'line': 4, 'character': 30}, 'end': {'line': 4, 'character': 30}},
            'newText': 'normalize()'
          }
        },
        {
          'label': 'repeat',
          'kind': 2,
          'detail': 'method',
          'sortText': 'repeat',
          'textEdit': {
            'range': {'start': {'line': 4, 'character': 30}, 'end': {'line': 4, 'character': 30}},
            'newText': 'repeat()'
          }
        },
        {
          'label': 'startsWith',
          'kind': 2,
          'detail': 'method',
          'sortText': 'startsWith',
          'textEdit': {
            'range': {'start': {'line': 4, 'character': 30}, 'end': {'line': 4, 'character': 30}},
            'newText': 'startsWith()'
          }
        },
        {
          'label': 'anchor',
          'kind': 2,
          'detail': 'method',
          'sortText': 'anchor',
          'textEdit': {
            'range': {'start': {'line': 4, 'character': 30}, 'end': {'line': 4, 'character': 30}},
            'newText': 'anchor()'
          }
        },
        {
          'label': 'big',
          'kind': 2,
          'detail': 'method',
          'sortText': 'big',
          'textEdit': {
            'range': {'start': {'line': 4, 'character': 30}, 'end': {'line': 4, 'character': 30}},
            'newText': 'big()'
          }
        },
        {
          'label': 'blink',
          'kind': 2,
          'detail': 'method',
          'sortText': 'blink',
          'textEdit': {
            'range': {'start': {'line': 4, 'character': 30}, 'end': {'line': 4, 'character': 30}},
            'newText': 'blink()'
          }
        },
        {
          'label': 'bold',
          'kind': 2,
          'detail': 'method',
          'sortText': 'bold',
          'textEdit': {
            'range': {'start': {'line': 4, 'character': 30}, 'end': {'line': 4, 'character': 30}},
            'newText': 'bold()'
          }
        },
        {
          'label': 'fixed',
          'kind': 2,
          'detail': 'method',
          'sortText': 'fixed',
          'textEdit': {
            'range': {'start': {'line': 4, 'character': 30}, 'end': {'line': 4, 'character': 30}},
            'newText': 'fixed()'
          }
        },
        {
          'label': 'fontcolor',
          'kind': 2,
          'detail': 'method',
          'sortText': 'fontcolor',
          'textEdit': {
            'range': {'start': {'line': 4, 'character': 30}, 'end': {'line': 4, 'character': 30}},
            'newText': 'fontcolor()'
          }
        },
        {
          'label': 'fontsize',
          'kind': 2,
          'detail': 'method',
          'sortText': 'fontsize',
          'textEdit': {
            'range': {'start': {'line': 4, 'character': 30}, 'end': {'line': 4, 'character': 30}},
            'newText': 'fontsize()'
          }
        },
        {
          'label': 'italics',
          'kind': 2,
          'detail': 'method',
          'sortText': 'italics',
          'textEdit': {
            'range': {'start': {'line': 4, 'character': 30}, 'end': {'line': 4, 'character': 30}},
            'newText': 'italics()'
          }
        },
        {
          'label': 'link',
          'kind': 2,
          'detail': 'method',
          'sortText': 'link',
          'textEdit': {
            'range': {'start': {'line': 4, 'character': 30}, 'end': {'line': 4, 'character': 30}},
            'newText': 'link()'
          }
        },
        {
          'label': 'small',
          'kind': 2,
          'detail': 'method',
          'sortText': 'small',
          'textEdit': {
            'range': {'start': {'line': 4, 'character': 30}, 'end': {'line': 4, 'character': 30}},
            'newText': 'small()'
          }
        },
        {
          'label': 'strike',
          'kind': 2,
          'detail': 'method',
          'sortText': 'strike',
          'textEdit': {
            'range': {'start': {'line': 4, 'character': 30}, 'end': {'line': 4, 'character': 30}},
            'newText': 'strike()'
          }
        },
        {
          'label': 'sub',
          'kind': 2,
          'detail': 'method',
          'sortText': 'sub',
          'textEdit': {
            'range': {'start': {'line': 4, 'character': 30}, 'end': {'line': 4, 'character': 30}},
            'newText': 'sub()'
          }
        },
        {
          'label': 'sup',
          'kind': 2,
          'detail': 'method',
          'sortText': 'sup',
          'textEdit': {
            'range': {'start': {'line': 4, 'character': 30}, 'end': {'line': 4, 'character': 30}},
            'newText': 'sup()'
          }
        }
      ]
    });
  });

  it('should work with external template', async () => {
    const r0 = await send({
      jsonrpc: '2.0',
      id: 0,
      method: 'initialize',
      params: {
        processId: process.pid,
        rootUri: `file://${PROJECT_PATH}`,
        capabilities: {},
      }
    });
    expect(r0).toBeDefined();
    const n0 = await send({
      jsonrpc: '2.0',
      method: 'textDocument/didOpen',
      params: {
        textDocument: {
          uri: `file://${PROJECT_PATH}/app/foo.component.html`,
          languageId: 'typescript',
          version: 1,
        }
      }
    });
    expect(n0).toBe(null);  // no response expected from notification
    const r1 = await send({
      jsonrpc: '2.0',
      id: 1,
      method: 'textDocument/hover',
      params: {
        textDocument: {uri: `file://${PROJECT_PATH}/app/foo.component.html`},
        position: {line: 0, character: 3}
      }
    });
    expect(r1).toEqual({
      jsonrpc: '2.0',
      id: 1,
      result: {
        contents: [{
          language: 'typescript',
          value: '(property) FooComponent.title: string',
        }],
        range: {
          start: {line: 0, character: 2},
          end: {line: 0, character: 7},
        }
      }
    });
  });
});
