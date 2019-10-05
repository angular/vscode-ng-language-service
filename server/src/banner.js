function define(modules, cb) {
  function parseStringArray(argName) {
    const index = process.argv.indexOf(argName);
    if (index < 0 || index === process.argv.length - 1) {
        return [];
    }
    const arg = process.argv[index + 1];
    return arg.split(',');
  }
  function resolve(packageName, paths) {
    try {
      return require.resolve(packageName, {paths});
    }
    catch {}
  }
  const TSSERVER = 'typescript/lib/tsserverlibrary';
  const resolvedModules = modules.map(m => {
    if (m === TSSERVER || m === 'typescript') {
      const tsProbeLocations = parseStringArray('--tsProbeLocations');
      m = resolve(TSSERVER, tsProbeLocations) || TSSERVER;
    }
    return require(m);
  });
  cb(...resolvedModules);
}
