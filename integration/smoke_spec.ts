import {ChildProcess, fork} from 'child_process';
import {EventEmitter} from 'events';
import {resolve} from 'path';
import {IPCMessageWriter} from 'vscode-jsonrpc';
import {isNotificationMessage, Message, NotificationMessage, RequestMessage, ResponseMessage} from 'vscode-jsonrpc/lib/messages';

class ResponseEmitter extends EventEmitter {}

describe('Angular Language Service', () => {
  jasmine.DEFAULT_TIMEOUT_INTERVAL = 10000; /* 10 seconds */
  const PROJECT_PATH = resolve(__dirname, '../project');
  const SERVER_PATH = resolve(__dirname, '../../server/out/server.js');
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
    server = fork(SERVER_PATH, ['--node-ipc']);
    server.on('error', fail);
    server.on('close', (code, signal) => {
      console.log(`Server 'close' event received`, code, signal);
      expect(code).toBe(0);
    });
    server.on('message', (data: Message) => {
      if (isNotificationMessage(data)) {
        console.log('[server]', data.params.message);
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
        'processId': server.pid,
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
          'completionProvider': {
            'resolveProvider': false,
            'triggerCharacters': ['<', '.', '*', '[', '(']
          },
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
        'processId': server.pid,
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
          'completionProvider': {
            'resolveProvider': false,
            'triggerCharacters': ['<', '.', '*', '[', '(']
          },
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
        'textDocument': {
          'uri': `file://${PROJECT_PATH}/app/app.component.ts`,
          'version': 2
        },
        'contentChanges': [{
          'range': {
            'start': {'line': 4, 'character': 29},
            'end': {'line': 4, 'character': 29}
          },
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
    expect(response).toEqual({
      'jsonrpc': '2.0',
      'id': 1,
      'result': [
        {
          'label': 'toString',
          'kind': 2,
          'detail': 'method',
          'sortText': 'toString',
          'insertText': 'toString'
        },
        {
          'label': 'charAt',
          'kind': 2,
          'detail': 'method',
          'sortText': 'charAt',
          'insertText': 'charAt'
        },
        {
          'label': 'charCodeAt',
          'kind': 2,
          'detail': 'method',
          'sortText': 'charCodeAt',
          'insertText': 'charCodeAt'
        },
        {
          'label': 'concat',
          'kind': 2,
          'detail': 'method',
          'sortText': 'concat',
          'insertText': 'concat'
        },
        {
          'label': 'indexOf',
          'kind': 2,
          'detail': 'method',
          'sortText': 'indexOf',
          'insertText': 'indexOf'
        },
        {
          'label': 'lastIndexOf',
          'kind': 2,
          'detail': 'method',
          'sortText': 'lastIndexOf',
          'insertText': 'lastIndexOf'
        },
        {
          'label': 'localeCompare',
          'kind': 2,
          'detail': 'method',
          'sortText': 'localeCompare',
          'insertText': 'localeCompare'
        },
        {
          'label': 'match',
          'kind': 2,
          'detail': 'method',
          'sortText': 'match',
          'insertText': 'match'
        },
        {
          'label': 'replace',
          'kind': 2,
          'detail': 'method',
          'sortText': 'replace',
          'insertText': 'replace'
        },
        {
          'label': 'search',
          'kind': 2,
          'detail': 'method',
          'sortText': 'search',
          'insertText': 'search'
        },
        {
          'label': 'slice',
          'kind': 2,
          'detail': 'method',
          'sortText': 'slice',
          'insertText': 'slice'
        },
        {
          'label': 'split',
          'kind': 2,
          'detail': 'method',
          'sortText': 'split',
          'insertText': 'split'
        },
        {
          'label': 'substring',
          'kind': 2,
          'detail': 'method',
          'sortText': 'substring',
          'insertText': 'substring'
        },
        {
          'label': 'toLowerCase',
          'kind': 2,
          'detail': 'method',
          'sortText': 'toLowerCase',
          'insertText': 'toLowerCase'
        },
        {
          'label': 'toLocaleLowerCase',
          'kind': 2,
          'detail': 'method',
          'sortText': 'toLocaleLowerCase',
          'insertText': 'toLocaleLowerCase'
        },
        {
          'label': 'toUpperCase',
          'kind': 2,
          'detail': 'method',
          'sortText': 'toUpperCase',
          'insertText': 'toUpperCase'
        },
        {
          'label': 'toLocaleUpperCase',
          'kind': 2,
          'detail': 'method',
          'sortText': 'toLocaleUpperCase',
          'insertText': 'toLocaleUpperCase'
        },
        {
          'label': 'trim',
          'kind': 2,
          'detail': 'method',
          'sortText': 'trim',
          'insertText': 'trim'
        },
        {
          'label': 'length',
          'kind': 10,
          'detail': 'property',
          'sortText': 'length',
          'insertText': 'length'
        },
        {
          'label': 'substr',
          'kind': 2,
          'detail': 'method',
          'sortText': 'substr',
          'insertText': 'substr'
        },
        {
          'label': 'valueOf',
          'kind': 2,
          'detail': 'method',
          'sortText': 'valueOf',
          'insertText': 'valueOf'
        },
        {
          'label': 'codePointAt',
          'kind': 2,
          'detail': 'method',
          'sortText': 'codePointAt',
          'insertText': 'codePointAt'
        },
        {
          'label': 'includes',
          'kind': 2,
          'detail': 'method',
          'sortText': 'includes',
          'insertText': 'includes'
        },
        {
          'label': 'endsWith',
          'kind': 2,
          'detail': 'method',
          'sortText': 'endsWith',
          'insertText': 'endsWith'
        },
        {
          'label': 'normalize',
          'kind': 2,
          'detail': 'method',
          'sortText': 'normalize',
          'insertText': 'normalize'
        },
        {
          'label': 'repeat',
          'kind': 2,
          'detail': 'method',
          'sortText': 'repeat',
          'insertText': 'repeat'
        },
        {
          'label': 'startsWith',
          'kind': 2,
          'detail': 'method',
          'sortText': 'startsWith',
          'insertText': 'startsWith'
        },
        {
          'label': 'anchor',
          'kind': 2,
          'detail': 'method',
          'sortText': 'anchor',
          'insertText': 'anchor'
        },
        {
          'label': 'big',
          'kind': 2,
          'detail': 'method',
          'sortText': 'big',
          'insertText': 'big'
        },
        {
          'label': 'blink',
          'kind': 2,
          'detail': 'method',
          'sortText': 'blink',
          'insertText': 'blink'
        },
        {
          'label': 'bold',
          'kind': 2,
          'detail': 'method',
          'sortText': 'bold',
          'insertText': 'bold'
        },
        {
          'label': 'fixed',
          'kind': 2,
          'detail': 'method',
          'sortText': 'fixed',
          'insertText': 'fixed'
        },
        {
          'label': 'fontcolor',
          'kind': 2,
          'detail': 'method',
          'sortText': 'fontcolor',
          'insertText': 'fontcolor'
        },
        {
          'label': 'fontsize',
          'kind': 2,
          'detail': 'method',
          'sortText': 'fontsize',
          'insertText': 'fontsize'
        },
        {
          'label': 'italics',
          'kind': 2,
          'detail': 'method',
          'sortText': 'italics',
          'insertText': 'italics'
        },
        {
          'label': 'link',
          'kind': 2,
          'detail': 'method',
          'sortText': 'link',
          'insertText': 'link'
        },
        {
          'label': 'small',
          'kind': 2,
          'detail': 'method',
          'sortText': 'small',
          'insertText': 'small'
        },
        {
          'label': 'strike',
          'kind': 2,
          'detail': 'method',
          'sortText': 'strike',
          'insertText': 'strike'
        },
        {
          'label': 'sub',
          'kind': 2,
          'detail': 'method',
          'sortText': 'sub',
          'insertText': 'sub'
        },
        {
          'label': 'sup',
          'kind': 2,
          'detail': 'method',
          'sortText': 'sup',
          'insertText': 'sup'
        },
      ]
    });
  });
});
