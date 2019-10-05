/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import * as ts from 'typescript/lib/tsserverlibrary';

/**
 * NOTE:
 * There are three types of `project`:
 * 1. Configured project - basically all source files that belong to a tsconfig
 * 2. Inferred project - other files that do not belong to a tsconfig
 * 3. External project - not used in this context
 * For more info, see link below.
 * https://github.com/Microsoft/TypeScript/wiki/Standalone-Server-%28tsserver%29#project-system
 */

/**
 * `ProjectService` is a singleton service for the entire lifespan of the
 * language server. This specific implementation is a very thin wrapper
 * around TypeScript's `ProjectService`. On creation, it spins up tsserver and
 * loads `@angular/language-service` as a global plugin.
 * `ProjectService` is used to manage both TS document as well as HTML.
 * Using tsserver to handle non-TS files is fine as long as the ScriptKind is
 * configured correctly and `getSourceFile()` is never called on non-TS files.
 */
export class ProjectService {
  private readonly tsProjSvc: ts.server.ProjectService;

  constructor(options: ts.server.ProjectServiceOptions) {
    this.tsProjSvc = new ts.server.ProjectService(options);

    this.tsProjSvc.setHostConfiguration({
      formatOptions: this.tsProjSvc.getHostFormatCodeOptions(),
      extraFileExtensions: [
        {
          extension: '.html',
          isMixedContent: false,
          scriptKind: ts.ScriptKind.External,
        },
      ],
    });

    this.tsProjSvc.configurePlugin({
      pluginName: '@angular/language-service',
      configuration: {
        angularOnly: true,
      },
    });
  }

  /**
   * Open file whose contents is managed by the client
   * @param filename is absolute pathname
   * @param fileContent is a known version of the file content that is more up to date than the one
   *     on disk
   */
  openClientFile(
      fileName: string, fileContent?: string, scriptKind?: ts.ScriptKind,
      projectRootPath?: string): ts.server.OpenConfiguredProjectResult {
    return this.tsProjSvc.openClientFile(fileName, fileContent, scriptKind, projectRootPath);
  }

  /**
   * Close file whose contents is managed by the client
   * @param filename is absolute pathname
   */
  closeClientFile(uncheckedFileName: string): void {
    this.tsProjSvc.closeClientFile(uncheckedFileName);
  }

  findProject(projectName: string): ts.server.Project|undefined {
    return this.tsProjSvc.findProject(projectName);
  }

  getScriptInfo(uncheckedFileName: string): ts.server.ScriptInfo|undefined {
    return this.tsProjSvc.getScriptInfo(uncheckedFileName);
  }

  /**
   * Return the default project for the specified `scriptInfo` if it is already
   * a configured project. If not, attempt to find a relevant config file and
   * make that project its default. This method is to ensure HTML files always
   * belong to a configured project instead of the default behavior of being in
   * an inferred project.
   * @param scriptInfo
   */
  getDefaultProjectForScriptInfo(scriptInfo: ts.server.ScriptInfo): ts.server.Project|undefined {
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
}
