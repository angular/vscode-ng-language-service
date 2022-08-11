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

load("@aspect_rules_jasmine//jasmine:repositories.bzl", "rules_jasmine_repositories", JASMINE_LATEST_VERSION = "LATEST_VERSION")

rules_jasmine_repositories(
    name = "jasmine",
    jasmine_version = JASMINE_LATEST_VERSION,
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
