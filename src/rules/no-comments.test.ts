import { tester } from "../../test/tester.ts";
import rule from "./no-comments.ts";

const error = { messageId: "comment" };

tester.run("oxslop/no-comments", rule, {
  valid: [
    "const x = 1;",
    "// SAFETY: the buffer is bounds-checked above\nconst y = buf[0];",
    "/* SAFETY(io): handle is open until close() */\nconst z = 1;",
    "/** Documents the API. */\nexport const api = 1;",
    "// oxlint-disable-next-line no-console\nconsole.log(1);",
    "// eslint-disable-next-line\nconsole.log(1);",
    "/* biome-ignore lint: reason */\nconsole.log(1);",
    "// prettier-ignore\nconst m = [1, 0, 0, 1];",
    "// @ts-expect-error missing types\nconst t = untyped;",
    "/* c8 ignore next */\nconst c = 1;",
    "/* v8 ignore next */\nconst v = 1;",
    "/* istanbul ignore next */\nconst i = 1;",
    "// #region setup\nconst r = 1;\n// #endregion",
    '/// <reference types="node" />\nconst n = 1;',
    "#!/usr/bin/env node\nconst s = 1;",
    "/*! MIT License */\nconst l = 1;",
    "const x = /*#__PURE__*/ build();",
    "const x = /* @__PURE__ */ build();",
    { code: "// TODO: later\nconst x = 1;", options: [{ allow: ["TODO"] }] },
    { code: "// SAFETY: still fine\nconst x = 1;", options: [{ allow: ["SAFETY", "TODO"] }] },
  ],
  invalid: [
    { name: "line comment", code: "// increments the counter\ncount++;", errors: [error] },
    { name: "block comment", code: "/* legacy path */\nconst x = 1;", errors: [error] },
    { name: "trailing comment", code: "const x = 1; // one", errors: [error] },
    {
      name: "marker without colon",
      code: "// SAFETY the buffer is fine\nconst x = 1;",
      errors: [error],
    },
    {
      name: "marker is case-sensitive",
      code: "// safety: lowercase\nconst x = 1;",
      errors: [error],
    },
    {
      name: "jsdoc when disallowed",
      code: "/** Documents the API. */\nexport const api = 1;",
      options: [{ allowJsdoc: false }],
      errors: [error],
    },
    {
      name: "default marker replaced by option",
      code: "// SAFETY: no longer allowed\nconst x = 1;",
      options: [{ allow: ["TODO"] }],
      errors: [error],
    },
    {
      name: "several comments",
      code: "// one\nconst a = 1;\n// two\nconst b = 2;",
      errors: [error, error],
    },
  ],
});
