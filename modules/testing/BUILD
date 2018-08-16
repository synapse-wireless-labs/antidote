package(default_visibility = ["//visibility:public"])

load("//tools:defaults.bzl", "npm_package", "ts_library", "ts_test_library", "jasmine_node_test")

ts_test_library(
    name = "test_lib",
    srcs = glob(
        [
            "**/src/**/*.spec.ts",
        ],
    ),
    deps = [
        ":testing",
        "//modules/core",
    ],
)

jasmine_node_test(
    name = "test",
    deps = [
        ":test_lib",
    ],
)

ts_library(
    name = "testing",
    srcs = glob(
        [
            "**/src/**/*.ts",
        ],
        exclude = [
            "**/src/**/*.spec.ts",
        ],
    ),
    module_name = "@antidote/testing",
    tsconfig = ":tsconfig-build.json",
    deps = [
        "//modules/core",
    ],
)

npm_package(
    name = "npm_package",
    srcs = [
        ":README.md",
        ":package.json",
    ],
    deps = [
        ":testing",
        "//modules/core",
    ],
)
