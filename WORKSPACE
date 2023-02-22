load("@bazel_tools//tools/build_defs/repo:http.bzl", "http_archive")

http_archive(
    name = "aspect_rules_js",
    sha256 = "f93c6d2c4437a9fdc2c711912b6b9b3f3806c2dd2c9c0ec0240f26d3f2ea3030",
    strip_prefix = "rules_js-1.8.1",
    url = "https://github.com/aspect-build/rules_js/archive/refs/tags/v1.8.1.tar.gz",
)

load("@aspect_rules_js//js:repositories.bzl", "rules_js_dependencies")

rules_js_dependencies()

http_archive(
    name = "aspect_rules_ts",
    sha256 = "5b501313118b06093497b6429f124b973f99d1eb5a27a1cc372e5d6836360e9d",
    strip_prefix = "rules_ts-1.0.2",
    url = "https://github.com/aspect-build/rules_ts/archive/refs/tags/v1.0.2.tar.gz",
)

load("@aspect_rules_ts//ts:repositories.bzl", "rules_ts_dependencies")

rules_ts_dependencies(ts_version_from = "//:package.json",)

http_archive(
    name = "aspect_rules_jasmine",
    sha256 = "28bd02acbcd78dd4fbe0ee133b21b11977acd70329a83fc987ff8c0a6ffae9e2",
    strip_prefix = "rules_jasmine-0.2.3",
    url = "https://github.com/aspect-build/rules_jasmine/archive/refs/tags/v0.2.3.tar.gz",
)

load("@aspect_rules_jasmine//jasmine:dependencies.bzl", "rules_jasmine_dependencies")

rules_jasmine_dependencies()

http_archive(
    name = "aspect_rules_esbuild",
    sha256 = "f9b5bf16251e3e4e127337ef968e6a398c9a4f353f1730e6c7ff6c9a8981e858",
    strip_prefix = "rules_esbuild-0.13.4",
    url = "https://github.com/aspect-build/rules_esbuild/archive/refs/tags/v0.13.4.tar.gz",
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
    package_json = "//:package.json",
    npmrc = "//:.npmrc",
    data = [
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
    package_json = "//integration/workspace:package.json",
    npmrc = "//:.npmrc",
    verify_node_modules_ignored = "//:.bazelignore",
)

load("@npm_integration_workspace//:repositories.bzl", npm_integration_workspace_repositories = "npm_repositories")

npm_integration_workspace_repositories()

npm_translate_lock(
    name = "npm_integration_pre_apf_project",
    yarn_lock = "//integration/pre_apf_project:yarn.lock",
    package_json = "//integration/pre_apf_project:package.json",
    npmrc = "//:.npmrc",
    verify_node_modules_ignored = "//:.bazelignore",
)

load("@npm_integration_pre_apf_project//:repositories.bzl", npm_integration_pre_apf_project_repositories = "npm_repositories")

npm_integration_pre_apf_project_repositories()

npm_translate_lock(
    name = "npm_integration_project",
    yarn_lock = "//integration/project:yarn.lock",
    package_json = "//integration/project:package.json",
    npmrc = "//:.npmrc",
    verify_node_modules_ignored = "//:.bazelignore",
)

load("@npm_integration_project//:repositories.bzl", npm_integration_project_repositories = "npm_repositories")

npm_integration_project_repositories()
