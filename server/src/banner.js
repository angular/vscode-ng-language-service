function define(modules, cb) {
  function parseStringArray(argName) {
    const index = process.argv.indexOf(argName);
    if (index < 0 || index === process.argv.length - 1) {
        return [];
    }
    const arg = process.argv[index + 1];
    return arg.split(',');
  }
  const TSSERVER = 'typescript/lib/tsserverlibrary';
  let tsserverPath;
  try {
    tsserverPath = require.resolve(TSSERVER, {
      paths: parseStringArray('--typeScriptProbeLocations'),
    });
  }
  catch {}
  const resolvedModules = modules.map(m => {
    if (m === 'typescript') {
      throw new Error(`'typescript' should never be used. Use '${TSSERVER}' instead.`)
    }
    if (tsserverPath && m === TSSERVER) {
      return require(tsserverPath);
    }
    return require(m);
  });
  cb(...resolvedModules);
}
