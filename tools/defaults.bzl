"""Re-export of some bazel rules with repository-wide defaults."""
load("@build_bazel_rules_typescript//:defs.bzl", _ts_library="ts_library")
load("@build_bazel_rules_nodejs//:defs.bzl",
     _jasmine_node_test="jasmine_node_test", _npm_package="npm_package")

DEFAULT_TSCONFIG = "//:tsconfig.json"

ANTIDOTE_SCOPED_PACKAGES = ["@antidote/%s" % p for p in [
    "core",
]]

ANTIDOTE_GLOBALS = dict({
    "tslib": "tslib",
}, **{p: p for p in ANTIDOTE_SCOPED_PACKAGES})

PKG_GROUP_REPLACEMENTS = {
    "\"NG_UPDATE_PACKAGE_GROUP\"": """[
      %s
    ]""" % ",\n      ".join(["\"%s\"" % s for s in ANTIDOTE_SCOPED_PACKAGES]),
}


def ts_library(tsconfig=None, node_modules=None, **kwargs):
    if not tsconfig:
        tsconfig = DEFAULT_TSCONFIG
    _ts_library(tsconfig=tsconfig, **kwargs)


def ts_test_library(node_modules=None, **kwargs):
    ts_library(testonly=1, **kwargs)


def jasmine_node_test(node_modules=None, bootstrap=None, deps=[], **kwargs):
    _jasmine_node_test(
        bootstrap=bootstrap,
        deps=deps,
        **kwargs
    )


def npm_package(name, replacements={}, **kwargs):
    _npm_package(
        name=name,
        replacements=dict(replacements, **PKG_GROUP_REPLACEMENTS),
        **kwargs)
