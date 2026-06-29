"use strict";

const js = require("@eslint/js");

const browserGlobals = {
  window: "readonly",
  document: "readonly",
  navigator: "readonly",
  alert: "readonly",
  console: "readonly",
  requestAnimationFrame: "readonly",
  cancelAnimationFrame: "readonly",
  setTimeout: "readonly",
  clearTimeout: "readonly",
  chrome: "readonly",
  $: "readonly"
};

const nodeGlobals = {
  module: "readonly",
  require: "readonly",
  exports: "writable",
  __dirname: "readonly",
  process: "readonly",
  console: "readonly"
};

const jestGlobals = {
  describe: "readonly",
  test: "readonly",
  it: "readonly",
  expect: "readonly",
  beforeEach: "readonly",
  afterEach: "readonly",
  beforeAll: "readonly",
  afterAll: "readonly",
  jest: "readonly"
};

module.exports = [
  {
    ignores: [
      "node_modules/**",
      "coverage/**",
      "dist/**",
      "snake/js/jquery.js",
      "snake/js/jquery-ui.min.js",
      "snake/bs/**",
      "snake/lang/**"
    ]
  },
  js.configs.recommended,
  {
    // Pure, dependency-free game engine (runs in both browser and Node).
    files: ["snake/js/engine.js"],
    languageOptions: {
      ecmaVersion: 2021,
      sourceType: "script",
      globals: { module: "readonly", self: "readonly" }
    }
  },
  {
    // Browser glue: DOM, Canvas, jQuery, chrome APIs and cross-file globals.
    files: [
      "snake/js/game.js",
      "snake/js/main.js",
      "snake/js/translate.js",
      "snake/js/background.js"
    ],
    languageOptions: {
      ecmaVersion: 2021,
      sourceType: "script",
      globals: browserGlobals
    },
    rules: {
      // These files form a single program loaded via <script> tags, sharing a
      // global lexical scope. "undefined" / "unused" per-file checks therefore
      // produce false positives, so they are relaxed here. The dependency-free
      // engine (linted above) keeps the strict defaults.
      "no-undef": "off",
      "no-unused-vars": "off"
    }
  },
  {
    // Jest test-suite.
    files: ["tests/**/*.js"],
    languageOptions: {
      ecmaVersion: 2021,
      sourceType: "commonjs",
      globals: { ...nodeGlobals, ...jestGlobals }
    }
  },
  {
    // Node-based tooling scripts.
    files: ["scripts/**/*.js"],
    languageOptions: {
      ecmaVersion: 2021,
      sourceType: "commonjs",
      globals: nodeGlobals
    }
  },
  {
    // This config file itself.
    files: ["eslint.config.js"],
    languageOptions: {
      ecmaVersion: 2021,
      sourceType: "commonjs",
      globals: nodeGlobals
    }
  }
];
