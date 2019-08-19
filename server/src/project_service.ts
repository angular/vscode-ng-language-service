import * as ts from 'typescript/lib/tsserverlibrary'; // used as value
import * as lsp from 'vscode-languageserver';
import {tsDiagnosticToLspDiagnostic} from './diagnostic';
import {filePathToUri} from './utils';

// NOTE:
// There are three types of `project`:
// 1. Configured project - basically all source files that belong to a tsconfig
// 2. Inferred project - other files that do not belong to a tsconfig
// 3. External project - not used in this context
// For more info, see link below.
// https://github.com/Microsoft/TypeScript/wiki/Standalone-Server-%28tsserver%29#project-system

/**
 * `ProjectService` is a singleton service for the entire lifespan of the
 * language server. This specific implementation is a very thin wrapper
 * around TypeScript's `ProjectService`. On creation, it spins up tsserver and
 * loads `@angular/language-service` as a tsserver plugin.
 * Care must be taken to load `@angular/language-service` from the project or
 * workspace. This extension shoud not bundle its own
 * `@angular/language-service`, not even as a backup. This is to ensure that
 * the extension becomes a no-op when non-Angular TS projects are opened.
 * `ProjectService` is used to manage both TS document as well as HTML.
 * Using tsserver to handle non-TS files is fine as long as the ScriptKind is
 * configured correctly and `getSourceFile()` is never called on non-TS files.
 */
export class ProjectService {
  public readonly tsProjSvc: ts.server.ProjectService;

  constructor(
      private readonly serverHost: ts.server.ServerHost,
      private readonly logger: ts.server.Logger,
      private readonly connection: lsp.IConnection,
      options: Map<string, string>,
  ) {
    const pluginProbeLocation =
        options.get('pluginProbeLocation') || serverHost.getCurrentDirectory();
    connection.console.info(
        `Angular LS probe location: ${pluginProbeLocation}`);
    // TODO: Should load TypeScript from workspace.
    this.tsProjSvc = new ts.server.ProjectService({
      host: serverHost,
      logger,
      cancellationToken: ts.server.nullCancellationToken,
      useSingleInferredProject: true,
      useInferredProjectPerProjectRoot: true,
      typingsInstaller: ts.server.nullTypingsInstaller,
      suppressDiagnosticEvents: false,
      eventHandler: (e) => this.handleProjectServiceEvent(e),
      globalPlugins: ['@angular/language-service'],
      pluginProbeLocations: [pluginProbeLocation],
      allowLocalPluginLoads: false,  // do not load plugins from tsconfig.json
    });

    this.tsProjSvc.configurePlugin({
      pluginName: '@angular/language-service',
      configuration: {
        'angularOnly': true,
      },
    });

    const globalPlugins = this.tsProjSvc.globalPlugins;
    if (globalPlugins.includes('@angular/language-service')) {
      // TODO: Even if the plugin fails to load, it still remains a global plugin
      // in TS ProjectService. Figure out a a better way to determine the status
      // of the plugin. For now, best way to check is manually inspect the
      // log file.
      connection.console.info('Success: @angular/language-service loaded');
    } else {
      connection.console.error('Failed to load @angular/language-service');
    }
  }

  /**
   * Return the default project for the specified `scriptInfo` if it is already
   * a configured project. If not, attempt to find a relevant config file and
   * make that project its default. This method is to ensure HTML files always
   * belong to a configured project instead of the default behavior of being in
   * an inferred project.
   * @param scriptInfo
   */
  getDefaultProjectForScriptInfo(scriptInfo: ts.server.ScriptInfo): ts.server.Project
      |undefined {
    let project = this.tsProjSvc.getDefaultProjectForFile(
        scriptInfo.fileName,
        // ensureProject tries to find a default project for the scriptInfo if
        // it does not already have one. It is not needed here because we are
        // going to assign it a project below if it does not have one.
        false  // ensureProject
    );

    // TODO: verify that HTML files are attached to Inferred project by default.
    // If they are already part of a ConfiguredProject then the following is
    // not needed.
    if (!project || project.projectKind !== ts.server.ProjectKind.Configured) {
      const {configFileName} = this.tsProjSvc.openClientFile(scriptInfo.fileName);
      if (!configFileName) {
        // Failed to find a config file. There is nothing we could do.
        return;
      }
      project = this.tsProjSvc.findProject(configFileName);
      if (!project) {
        return;
      }
      scriptInfo.detachAllProjects();
      scriptInfo.attachToProject(project);
    }

    return project;
  }

  /**
   * An event handler that gets invoked whenever the program changes and
   * TS ProjectService sends `ProjectUpdatedInBackgroundEvent`. This particular
   * event is used to trigger diagnostic checks.
   * @param event
   */
  private handleProjectServiceEvent(event: ts.server.ProjectServiceEvent) {
    if (event.eventName !== ts.server.ProjectsUpdatedInBackgroundEvent) {
      return;
    }
    // ProjectsUpdatedInBackgroundEvent is sent whenever diagnostics are
    // requested via project.refreshDiagnostics()
    const {openFiles} = event.data;
    for (const fileName of openFiles) {
      const scriptInfo = this.tsProjSvc.getScriptInfo(fileName);
      if (!scriptInfo) {
        continue;
      }
      const project = this.getDefaultProjectForScriptInfo(scriptInfo);
      if (!project) {
        continue;
      }
      const ngLS = project.getLanguageService();
      const diagnostics = ngLS.getSemanticDiagnostics(fileName);
      // Need to send diagnostics even if it's empty otherwise editor state will
      // not be updated.
      this.connection.sendDiagnostics({
        uri: filePathToUri(fileName),
        diagnostics:
            diagnostics.map(d => tsDiagnosticToLspDiagnostic(d, scriptInfo)),
      });
    }
  }
}
