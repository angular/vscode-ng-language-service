import * as fs from 'fs';
import * as minimist from 'minimist';
import * as rpc from 'vscode-jsonrpc';

let errorsDetected = false;

const start = Date.now();

function reportError(arg: string): boolean {
  console.error(`Unknown argument: ${arg}`);
  errorsDetected = true;
  return false;
}

function help() {
  console.log('JSON serilizer validator')
  console.log(`${process.argv[1]} [--expect <file-name> | --golden] [--pwd <dir>]`);
  console.log(`
  Validate that the emitted output produces the expect JSON.`)
}

let args = minimist(process.argv.slice(2), { string: ['expect', 'pwd'], boolean: ['golden'], unknown: reportError });

if (errorsDetected) {
  help();
  process.exit(2);
}

function isPrimitive(value: any): boolean {
  return Object(value) !== value;
}

function expectPrimitive(received: any, expected: any) {
  if (received !== expected) {
    throw new Error(`Expected ${expected} but received ${received}`);
  }
}

function expectArray(received: any, expected: any[]) {
  if (!Array.isArray(received)) {
    throw new Error(`Expected an array, received ${JSON.stringify(received)}`);
  }
  if (received.length != expected.length) {
    throw new Error(`Expected an array length ${expected.length}, received ${JSON.stringify(received)}`);
  }
  for (let i = 0; i < expected.length; i++) {
    expect(received[i], expected[i]);
  }
}

function expectObject(received: any, expected: any) {
  for (const name of Object.getOwnPropertyNames(expected)) {
    if (!received.hasOwnProperty(name)) {
      throw new Error(`Expected object an object containing a field ${name}, received  ${JSON.stringify(expected)}`);
    }
    expect(received[name], expected[name]);
  }
}

function expect(received: any, expected: any) {
  if (isPrimitive(expected)) {
    expectPrimitive(received, expected);
  } else if (Array.isArray(expected)) {
    expectArray(received, expected);
  } else {
    expectObject(received, expected);
  }
}

interface LogMessage extends rpc.Message {
  params: {
    message: string;
  }
}

function isLogMessage(data: rpc.Message): data is LogMessage {
  return data.jsonrpc == '2.0' && (data as any).method === 'window/logMessage';
}

const isGolden = !!args['golden'];

const expectedFile = args['expect'];

if (!isGolden && !expectedFile) {
  console.log('Requires an --expect with the expected result or --golden');
  process.exit(2)
}

const reader = new rpc.StreamMessageReader(process.stdin);

const PWD_TOKEN = '$$PWD$$';
const RE_PWD = /\$\$PWD\$\$/g;

if (isGolden) {
  const results: rpc.Message[] = [];
  reader.listen(data => {
    if (!isLogMessage(data)) {
      results.push(data);
    }
  });
  reader.onClose(() => {
    let json = JSON.stringify(results);
    if (args['pwd']) {
      while (true) {
        const newJson = json.replace(args['pwd'], PWD_TOKEN);
        if (newJson == json) break;
        json = newJson;
      }
    }
    console.log(json);
  });
  reader.onError((e: Error) => {
    console.log(`ERROR: ${e.name} ${e.message}\n${e.stack}`);
    process.exit(1);
  });
} else {
  let expectedText = fs.readFileSync(expectedFile, 'utf8');
  if (args['pwd']) {
    expectedText = expectedText.replace(RE_PWD, args['pwd']);
  }
  const expected = JSON.parse(expectedText);
  let index = 0;
  console.log('listening...')
  reader.listen(data => {
    console.log(data)
    if (!isLogMessage(data)) {
      if (index >= expected.length) {
        console.log(`Received an unexpected additional message ${JSON.stringify(data)}`);
        process.exit(1);
      }
      expect(data, expected[index++]);
    } else {
      console.log(data.params.message);
    }
  });
  reader.onClose(() => {
    if (index != expected.length) {
      console.log(`Unexpected more output. Received ${index} messages. Expected ${expected.length} messages`);
      process.exit(1);
    }
    console.log(`PASSED ${Date.now() - start}ms`);
    process.exit(0);
  });
}
