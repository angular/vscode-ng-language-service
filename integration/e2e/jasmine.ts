import Jasmine = require('jasmine');

export async function run(): Promise<void> {
  const jasmine = new Jasmine({});

  jasmine.loadConfig({
    spec_dir: 'dist/integration/e2e',
    spec_files: [
      '*_spec.js',
    ],
  });

  if (jasmine.specFiles.length === 0) {
    throw new Error('No specs found');
  }

  await jasmine.execute();
}
