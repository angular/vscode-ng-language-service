load("@bazel_tools//tools/build_defs/repo:http.bzl", "http_archive")

http_archive(
    name = "aspect_rules_js",
    sha256 = "538049993bec3ee1ae9b1c3cd669156bca04eb67027b222883e47b0a2aed2e67",
    strip_prefix = "rules_js-1.0.0",
    url = "https://github.com/aspect-build/rules_js/archive/refs/tags/v1.0.0.tar.gz",
)

load("@aspect_rules_js//js:repositories.bzl", "rules_js_dependencies")

rules_js_dependencies()

http_archive(
    name = "aspect_rules_ts",
    sha256 = "1945d5a356d0ec85359dea411467dec0f98502503a53798ead7f54aef849598b",
    strip_prefix = "rules_ts-1.0.0-rc1",
    url = "https://github.com/aspect-build/rules_ts/archive/refs/tags/v1.0.0-rc1.tar.gz",
)

load("@aspect_rules_ts//ts:repositories.bzl", "rules_ts_dependencies")

rules_ts_dependencies(ts_version_from = "//:package.json",)

http_archive(
    name = "aspect_rules_jasmine",
    sha256 = "741d3376fdbf0c0c742e3bac0f854b1d49dbe1998d3530ef6f22f467675ca177",
    strip_prefix = "rules_jasmine-0.0.1",
    url = "https://github.com/aspect-build/rules_jasmine/archive/refs/tags/v0.0.1.tar.gz",
)

load("@aspect_rules_jasmine//jasmine:dependencies.bzl", "rules_jasmine_dependencies")

rules_jasmine_dependencies()

http_archive(
    name = "aspect_rules_esbuild",
    sha256 = "6fdec78dd65916dd69d3f6f439ae030f51cbecec0ec32e5af05e879b7eceb517",
    strip_prefix = "rules_esbuild-4ca5cdab4dd0f1c7190d06b4b0c617eb5dffb4b8",
    url = "https://github.com/aspect-build/rules_esbuild/archive/4ca5cdab4dd0f1c7190d06b4b0c617eb5dffb4b8.tar.gz",
)

load("@aspect_rules_esbuild//esbuild:dependencies.bzl", "rules_esbuild_dependencies")

rules_esbuild_dependencies()

load("@aspect_rules_jasmine//jasmine:repositories.bzl", "rules_jasmine_repositories", JASMINE_LATEST_VERSION = "LATEST_VERSION")

rules_jasmine_repositories(
    name = "jasmine",
    jasmine_version = JASMINE_LATEST_VERSION,
)

load("@aspect_rules_esbuild//esbuild:repositories.bzl", "esbuild_register_toolchains", ESBUILD_LATEST_VERSION = "LATEST_VERSION")

esbuild_register_toolchains(
    name = "esbuild",
    esbuild_version = ESBUILD_LATEST_VERSION,
)

load("@rules_nodejs//nodejs:repositories.bzl", "DEFAULT_NODE_VERSION", "nodejs_register_toolchains")

nodejs_register_toolchains(
    name = "nodejs",
    node_version = DEFAULT_NODE_VERSION,
)

load("@aspect_rules_js//npm:npm_import.bzl", "npm_translate_lock")

npm_translate_lock(
    name = "npm",
    yarn_lock = "//:yarn.lock",
    package_json = "//:package.json",
    verify_node_modules_ignored = "//:.bazelignore",
    public_hoist_packages = {
        # Hoist transitive closure of npm deps needed for vsce; this set was determined manually by
        # running `bazel build //:vsix` and burning down missing packages. We do this so that we
        # don't have to run an additional `npm install` action to create a node_modules within the
        # //:npm npm_package where the vsce build takes place.
        "semver@7.3.7": [""],
        "lru-cache@6.0.0": [""],
        "yallist@4.0.0": [""],
        "minimatch@3.1.2": [""],
        "brace-expansion@1.1.11": [""],
        "vscode-languageserver-types@3.16.0": [""],
        "concat-map@0.0.1": [""],
        "balanced-match@1.0.0": [""],
    },
)

load("@npm//:repositories.bzl", "npm_repositories")

npm_repositories()

npm_translate_lock(
    name = "npm_integration_workspace",
    yarn_lock = "//integration/workspace:yarn.lock",
    package_json = "//integration/workspace:package.json",
    verify_node_modules_ignored = "//:.bazelignore",
)

load("@npm_integration_workspace//:repositories.bzl", npm_integration_workspace_repositories = "npm_repositories")

npm_integration_workspace_repositories()

npm_translate_lock(
    name = "npm_integration_pre_apf_project",
    yarn_lock = "//integration/pre_apf_project:yarn.lock",
    package_json = "//integration/pre_apf_project:package.json",
    verify_node_modules_ignored = "//:.bazelignore",
)

load("@npm_integration_pre_apf_project//:repositories.bzl", npm_integration_pre_apf_project_repositories = "npm_repositories")

npm_integration_pre_apf_project_repositories()

npm_translate_lock(
    name = "npm_integration_project",
    yarn_lock = "//integration/project:yarn.lock",
    package_json = "//integration/project:package.json",
    verify_node_modules_ignored = "//:.bazelignore",
)

load("@npm_integration_project//:repositories.bzl", npm_integration_project_repositories = "npm_repositories")

npm_integration_project_repositories()
