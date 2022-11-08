load("@bazel_tools//tools/build_defs/repo:http.bzl", "http_archive")

http_archive(
    name = "aspect_rules_js",
    sha256 = "b9fde0f20de6324ad443500ae738bda00facbd73900a12b417ce794856e01407",
    strip_prefix = "rules_js-1.5.0",
    url = "https://github.com/aspect-build/rules_js/archive/refs/tags/v1.5.0.tar.gz",
)

load("@aspect_rules_js//js:repositories.bzl", "rules_js_dependencies")

rules_js_dependencies()

http_archive(
    name = "aspect_rules_ts",
    sha256 = "1ed2dc702b3d5fcf2b8e6ca4a5dae23fbc8e5570643d2a5cf8f5f09c7c44bc15",
    strip_prefix = "rules_ts-1.0.0-rc6",
    url = "https://github.com/aspect-build/rules_ts/archive/refs/tags/v1.0.0-rc6.tar.gz",
)

load("@aspect_rules_ts//ts:repositories.bzl", "rules_ts_dependencies")

rules_ts_dependencies(ts_version_from = "//:package.json",)

http_archive(
    name = "aspect_rules_jasmine",
    sha256 = "938a2818100fd89e7600a45b7ba4fcd4114c11c5b5741db30ff7c6e0dcb2ea4b",
    strip_prefix = "rules_jasmine-0.1.0",
    url = "https://github.com/aspect-build/rules_jasmine/archive/refs/tags/v0.1.0.tar.gz",
)

load("@aspect_rules_jasmine//jasmine:dependencies.bzl", "rules_jasmine_dependencies")

rules_jasmine_dependencies()

http_archive(
    name = "aspect_rules_esbuild",
    sha256 = "1e365451341ffb2490193292dfd9953f2ca009586c2381cb4dc08d01e48866b7",
    strip_prefix = "rules_esbuild-0.12.0",
    url = "https://github.com/aspect-build/rules_esbuild/archive/refs/tags/v0.12.0.tar.gz",
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

load("@rules_nodejs//nodejs:repositories.bzl", "nodejs_register_toolchains")

nodejs_register_toolchains(
    name = "nodejs",
    node_version = "14.20.0",
)

load("@aspect_rules_js//npm:npm_import.bzl", "npm_translate_lock")

npm_translate_lock(
    name = "npm",
    yarn_lock = "//:yarn.lock",
    package_json = "//:package.json",
    npmrc = "//:.npmrc",
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
