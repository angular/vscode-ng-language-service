load("@bazel_tools//tools/build_defs/repo:http.bzl", "http_archive")

http_archive(
    name = "aspect_rules_js",
    sha256 = "1aa0ab76d1f9520bb8993e2d84f82da2a9c87da1e6e8d121dbb4c857a292c2cd",
    strip_prefix = "rules_js-1.20.1",
    url = "https://github.com/aspect-build/rules_js/releases/download/v1.20.1/rules_js-v1.20.1.tar.gz",
)

load("@aspect_rules_js//js:repositories.bzl", "rules_js_dependencies")

rules_js_dependencies()

http_archive(
    name = "aspect_rules_ts",
    sha256 = "02480b6a1cd12516edf364e678412e9da10445fe3f1070c014ac75e922c969ea",
    strip_prefix = "rules_ts-1.3.1",
    url = "https://github.com/aspect-build/rules_ts/releases/download/v1.3.1/rules_ts-v1.3.1.tar.gz",
)

load("@aspect_rules_ts//ts:repositories.bzl", "rules_ts_dependencies")

rules_ts_dependencies(ts_version_from = "//:package.json",)

http_archive(
    name = "aspect_rules_jasmine",
    sha256 = "b3b2ff30ed222db653092d8280e0b62a4d54c5e65c598df09a0a1d7aae78fc8f",
    strip_prefix = "rules_jasmine-0.3.1",
    url = "https://github.com/aspect-build/rules_jasmine/releases/download/v0.3.1/rules_jasmine-v0.3.1.tar.gz",
)

load("@aspect_rules_jasmine//jasmine:dependencies.bzl", "rules_jasmine_dependencies")

rules_jasmine_dependencies()

http_archive(
    name = "aspect_rules_esbuild",
    sha256 = "c78d38d6ec2e7497dde4f8d67f49c71614daf11e2bbe276e23f5b09a89801677",
    strip_prefix = "rules_esbuild-0.14.1",
    url = "https://github.com/aspect-build/rules_esbuild/releases/download/v0.14.1/rules_esbuild-v0.14.1.tar.gz",
)

load("@aspect_rules_esbuild//esbuild:dependencies.bzl", "rules_esbuild_dependencies")

rules_esbuild_dependencies()

load("@aspect_rules_jasmine//jasmine:repositories.bzl", "jasmine_repositories")

jasmine_repositories(name = "jasmine")

load("@jasmine//:npm_repositories.bzl", jasmine_npm_repositories = "npm_repositories")

jasmine_npm_repositories()

load("@aspect_rules_esbuild//esbuild:repositories.bzl", "esbuild_register_toolchains", ESBUILD_LATEST_VERSION = "LATEST_VERSION")

esbuild_register_toolchains(
    name = "esbuild",
    esbuild_version = ESBUILD_LATEST_VERSION,
)

load("@rules_nodejs//nodejs:repositories.bzl", "nodejs_register_toolchains")

nodejs_register_toolchains(
    name = "nodejs",
    node_version = "16.13.0",
)

load("@aspect_rules_js//npm:npm_import.bzl", "npm_translate_lock")

npm_translate_lock(
    name = "npm",
    yarn_lock = "//:yarn.lock",
    pnpm_lock = "//:pnpm-lock.yaml",
    npmrc = "//:.npmrc",
    data = [
        "//:package.json",
        "//:pnpm-workspace.yaml",
        # PLACE_HOLDER_FOR_angular/angular_packages/language-service/build.sh
    ],
    verify_node_modules_ignored = "//:.bazelignore",
    public_hoist_packages = {
        # Hoist transitive closure of npm deps needed for vsce; this set was determined manually by
        # running `bazel build //:vsix` and burning down missing packages. We do this so that we
        # don't have to run an additional `npm install` action to create a node_modules within the
        # //:npm npm_package where the vsce build takes place.
        "balanced-match@1.0.0": [""],
        "brace-expansion@1.1.11": [""],
        "concat-map@0.0.1": [""],
        "lru-cache@6.0.0": [""],
        "minimatch@3.1.2": [""],
        "semver@7.3.7": [""],
        "vscode-languageserver-types@3.16.0": [""],
        "vscode-nls@5.2.0": [""],
        "yallist@4.0.0": [""],
    },
    # PLACE_HOLDER_FOR_packages/language-service/build.sh_IN_angular_REPO
)

load("@npm//:repositories.bzl", "npm_repositories")

npm_repositories()

npm_translate_lock(
    name = "npm_integration_workspace",
    yarn_lock = "//integration/workspace:yarn.lock",
    pnpm_lock = "//integration/workspace:pnpm-lock.yaml",
    data = [
        "//integration/workspace:package.json",
        "//integration/workspace:pnpm-workspace.yaml",
    ],
    npmrc = "//:.npmrc",
    verify_node_modules_ignored = "//:.bazelignore",
)

load("@npm_integration_workspace//:repositories.bzl", npm_integration_workspace_repositories = "npm_repositories")

npm_integration_workspace_repositories()

npm_translate_lock(
    name = "npm_integration_pre_apf_project",
    yarn_lock = "//integration/pre_apf_project:yarn.lock",
    pnpm_lock = "//integration/pre_apf_project:pnpm-lock.yaml",
    data = [
        "//integration/pre_apf_project:package.json",
        "//integration/pre_apf_project:pnpm-workspace.yaml",
    ],
    npmrc = "//:.npmrc",
    verify_node_modules_ignored = "//:.bazelignore",
)

load("@npm_integration_pre_apf_project//:repositories.bzl", npm_integration_pre_apf_project_repositories = "npm_repositories")

npm_integration_pre_apf_project_repositories()

npm_translate_lock(
    name = "npm_integration_project",
    yarn_lock = "//integration/project:yarn.lock",
    pnpm_lock = "//integration/project:pnpm-lock.yaml",
    data = [
        "//integration/project:package.json",
        "//integration/project:pnpm-workspace.yaml",
    ],
    npmrc = "//:.npmrc",
    verify_node_modules_ignored = "//:.bazelignore",
)

load("@npm_integration_project//:repositories.bzl", npm_integration_project_repositories = "npm_repositories")

npm_integration_project_repositories()
