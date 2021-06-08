import Jasmine = require('jasmine');

export async function run(): Promise<void> {
  const jasmine = new Jasmine({projectBaseDir: __dirname});

  jasmine.loadConfig({
    spec_files: [
      '*_spec.js',
    ],
  });

  console.log(`Expecting to run ${jasmine.specFiles.length} specs.`);

  if (jasmine.specFiles.length === 0) {
    throw new Error('No specs found');
  }

  await jasmine.execute();
}
