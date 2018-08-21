import * as fs from 'fs';
import * as rpc from 'vscode-jsonrpc';
import * as minimist from 'minimist';

const RE_PWD = /\$\$PWD\$\$/g;

let errorsDetected = false;

function reportError(arg: string): boolean {
  console.error(`Unknown argument: ${arg}`);
  errorsDetected = true;
  return false;
}

function help() {
  console.log('Mock host')
  console.log(`${process.argv[1]} --file <file-name> [--pwd <pwd>]`);
  console.log(`
  Send JSON message using the JSON RPC protocol to stdout.
  `)
}

let args = minimist(process.argv.slice(2), { string: ['file', 'pwd'], unknown: reportError });

if (errorsDetected) {
  help();
  process.exit(1);
}

const file = args['file'];
if (!file) {
  console.log('stdin form not supported yet.')
  process.exit(1);
}

var writer = new rpc.StreamMessageWriter(process.stdout);

try {
  let content = fs.readFileSync(file, 'utf8');
  if (args['pwd']) {
    content = content.replace(RE_PWD, args['pwd']);
  }
  const json = JSON.parse(content);

  if (Array.isArray(json)) {
    for (const message of json) {
      console.error(`Sending request: ${JSON.stringify(message)}`);
      writer.write(message as any);
    }
  }

  // Do not terminate the process for 5 seconds to allow messages to
  // propagate. vscode-jsonrpc detects the process exit and terminates
  // the service. This prevents the detection from causing the test
  // to fail.
  setTimeout(() => {}, 6000);
} catch(e) {
  console.error(`Error: ${e.message}`);
  process.exit(2);
}
