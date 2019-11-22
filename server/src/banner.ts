import {parseCommandLine} from './cmdline_utils';

/**
 * This method provides a custom implementation for the AMD loader to resolve
 * `typescript` module at runtime.
 * @param modules modules to resolve
 * @param cb function to invoke with resolved modules
 */
export function define(modules: string[], cb: (...modules: any[]) => void) {
  function resolve(packageName: string, paths: string[]) {
    try {
      return require.resolve(packageName, {paths});
    } catch {
    }
  }
  const TSSERVER = 'typescript/lib/tsserverlibrary';
  const resolvedModules = modules.map(m => {
    if (m === TSSERVER || m === 'typescript') {
      const {tsProbeLocations} = parseCommandLine(process.argv);
      m = resolve(TSSERVER, tsProbeLocations) || TSSERVER;
    }
    return require(m);
  });
  cb(...resolvedModules);
}
