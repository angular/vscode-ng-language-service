load("@bazel_tools//tools/build_defs/repo:http.bzl", "http_archive")

http_archive(
    name = "aspect_rules_js",
    sha256 = "5af82fe13fecb467e9c2c19765a593de2e1976afd0a1e18a80d930a2465508fc",
    strip_prefix = "rules_js-1.33.2",
    url = "https://github.com/aspect-build/rules_js/releases/download/v1.33.2/rules_js-v1.33.2.tar.gz",
)

load("@aspect_rules_js//js:repositories.bzl", "rules_js_dependencies")

rules_js_dependencies()

http_archive(
    name = "aspect_rules_ts",
    sha256 = "4c3f34fff9f96ffc9c26635d8235a32a23a6797324486c7d23c1dfa477e8b451",
    strip_prefix = "rules_ts-1.4.5",
    url = "https://github.com/aspect-build/rules_ts/releases/download/v1.4.5/rules_ts-v1.4.5.tar.gz",
)

load("@aspect_rules_ts//ts:repositories.bzl", "rules_ts_dependencies")

# TODO: should use version from package.json but this version isn't yet supported by aspect/rules_ts
# rules_ts_dependencies(ts_version_from = "//:package.json")
rules_ts_dependencies(
    ts_version = "5.2.2",
    ts_integrity = "sha512-mI4WrpHsbCIcwT9cF4FZvr80QUeKvsUsUvKDoR+X/7XHQH98xYD8YHZg7ANtz2GtZt/CBq2QJ0thkGJMHfqc1w==",
)

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
    node_repositories = {
        "18.19.1-darwin_arm64": ("node-v18.19.1-darwin-arm64.tar.gz", "node-v18.19.1-darwin-arm64", "0c7249318868877032ed21cc0ed450015ee44b31b9b281955521cd3fc39fbfa3"),
        "18.19.1-darwin_amd64": ("node-v18.19.1-darwin-x64.tar.gz", "node-v18.19.1-darwin-x64", "ab67c52c0d215d6890197c951e1bd479b6140ab630212b96867395e21d813016"),
        "18.19.1-linux_arm64": ("node-v18.19.1-linux-arm64.tar.xz", "node-v18.19.1-linux-arm64", "228ad1eee660fba3f9fd2cccf02f05b8ebccc294d27f22c155d20b233a9d76b3"),
        "18.19.1-linux_ppc64le": ("node-v18.19.1-linux-ppc64le.tar.xz", "node-v18.19.1-linux-ppc64le", "2e5812b8fc00548e2e8ab9daa88ace13974c16b6ba5595a7a50c35f848f7d432"),
        "18.19.1-linux_s390x": ("node-v18.19.1-linux-s390x.tar.xz", "node-v18.19.1-linux-s390x", "15106acf4c9e3aca02416dd89fb5c71af77097042455a73f9caa064c1988ead5"),
        "18.19.1-linux_amd64": ("node-v18.19.1-linux-x64.tar.xz", "node-v18.19.1-linux-x64", "f35f24edd4415cd609a2ebc03be03ed2cfe211d7333d55c752d831754fb849f0"),
        "18.19.1-windows_amd64": ("node-v18.19.1-win-x64.zip", "node-v18.19.1-win-x64", "ff08f8fe253fba9274992d7052e9d9a70141342d7b36ddbd6e84cbe823e312c6"),
    },
    node_version = "18.19.1",
)

load("@aspect_rules_js//npm:npm_import.bzl", "npm_translate_lock")

npm_translate_lock(
    name = "npm",
    data = [
        "//:package.json",
        "//:pnpm-workspace.yaml",
        # PLACE_HOLDER_FOR_angular/angular_packages/language-service/build.sh
    ],
    npmrc = "//:.npmrc",
    pnpm_lock = "//:pnpm-lock.yaml",
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
    verify_node_modules_ignored = "//:.bazelignore",
    yarn_lock = "//:yarn.lock",
    # PLACE_HOLDER_FOR_packages/language-service/build.sh_IN_angular_REPO
)

load("@npm//:repositories.bzl", "npm_repositories")

npm_repositories()

npm_translate_lock(
    name = "npm_integration_workspace",
    data = [
        "//integration/workspace:package.json",
        "//integration/workspace:pnpm-workspace.yaml",
    ],
    npmrc = "//:.npmrc",
    pnpm_lock = "//integration/workspace:pnpm-lock.yaml",
    verify_node_modules_ignored = "//:.bazelignore",
    yarn_lock = "//integration/workspace:yarn.lock",
)

load("@npm_integration_workspace//:repositories.bzl", npm_integration_workspace_repositories = "npm_repositories")

npm_integration_workspace_repositories()

npm_translate_lock(
    name = "npm_integration_pre_apf_project",
    data = [
        "//integration/pre_apf_project:package.json",
        "//integration/pre_apf_project:pnpm-workspace.yaml",
    ],
    npmrc = "//:.npmrc",
    pnpm_lock = "//integration/pre_apf_project:pnpm-lock.yaml",
    verify_node_modules_ignored = "//:.bazelignore",
    yarn_lock = "//integration/pre_apf_project:yarn.lock",
)

load("@npm_integration_pre_apf_project//:repositories.bzl", npm_integration_pre_apf_project_repositories = "npm_repositories")

npm_integration_pre_apf_project_repositories()

npm_translate_lock(
    name = "npm_integration_project",
    data = [
        "//integration/project:package.json",
        "//integration/project:pnpm-workspace.yaml",
    ],
    npmrc = "//:.npmrc",
    pnpm_lock = "//integration/project:pnpm-lock.yaml",
    verify_node_modules_ignored = "//:.bazelignore",
    yarn_lock = "//integration/project:yarn.lock",
)

load("@npm_integration_project//:repositories.bzl", npm_integration_project_repositories = "npm_repositories")

npm_integration_project_repositories()
