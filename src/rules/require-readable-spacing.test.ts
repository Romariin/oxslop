import { tester } from "../../test/tester.ts";
import rule from "./require-readable-spacing.ts";

const error = { messageId: "expectedBlankLine" };

tester.run("oxslop/require-readable-spacing", rule, {
  valid: [
    "import { a } from 'a';\nimport { b } from 'b';\n\nexport const c = a + b;",
    "export { a } from 'a';\nexport * from 'b';\n\nexport const c = 1;",
    "const a = 1;\nconst b = 2;\nlet c = 3;\n\nexport const d = a + b + c;",
    "export const a = 1;\nexport const b = 2;",
    "function f(a: string): string;\nfunction f(a: number): number;\nfunction f(a: string | number) { return a; }",
    "export function f(a: string): string;\nexport function f(a: number): number;\nexport function f(a: string | number) { return a; }",
    "declare function g(a: string): void;\ndeclare function g(a: number): void;",
    "function f() {\n  const a = 1;\n  const b = 2;\n\n  return a + b;\n}",
    "function f() { return 1; }",
    "function f() {\n  if (a) return 1;\n  if (b) return 2;\n  return 3;\n}",
    "function f() {\n  go();\n  stop();\n}",
    "function f() {\n  if (ok) {\n    go();\n  }\n\n  stop();\n}",
    "function f() {\n  // return docs\n  return 1;\n}",
    "const a = 1;\n\n\nconst b = 2;",
    "export type A = string;\n\n/** B documentation. */\nexport type B = number;",
    "switch (x) {\n  case 1:\n    go();\n    break;\n  default:\n    stop();\n}",
    "for (const item of items) {\n  const value = item.value;\n\n  if (!value) continue;\n  if (value > 1) break;\n}",
    "function f() {\n  const a = 1;\n\n  try {\n    go();\n  } catch {\n    stop();\n  }\n}",
    "class C {\n  static {\n    init();\n\n    if (ok) go();\n  }\n}",
    "'use strict';\n\nimport { a } from 'a';",
    "function f() {\n  const a = 1;\n  const b = {\n    c: 2,\n  };\n}",
  ],
  invalid: [
    {
      name: "top-level statements",
      code: "go();\nstop();",
      output: "go();\n\nstop();",
      errors: [error],
    },
    {
      name: "import then code",
      code: "import { a } from 'a';\nconst b = a;",
      output: "import { a } from 'a';\n\nconst b = a;",
      errors: [error],
    },
    {
      name: "export-from then declaration",
      code: "export * from 'a';\nexport const b = 1;",
      output: "export * from 'a';\n\nexport const b = 1;",
      errors: [error],
    },
    {
      name: "directive then import",
      code: "'use strict';\nimport { a } from 'a';",
      output: "'use strict';\n\nimport { a } from 'a';",
      errors: [error],
    },
    {
      name: "multi-line variable then variable",
      code: "const a = {\n  b: 1,\n};\nconst c = 2;",
      output: "const a = {\n  b: 1,\n};\n\nconst c = 2;",
      errors: [error],
    },
    {
      name: "leading comment stays with the statement",
      code: "export const a = 1; // trailing\n/** B docs. */\nexport type B = number;",
      output: "export const a = 1; // trailing\n\n/** B docs. */\nexport type B = number;",
      errors: [error],
    },
    {
      name: "trailing next-line directive stays adjacent to its target",
      code: "go(); // oxlint-disable-next-line no-console\nconsole.log(1);",
      output: "go();\n\n // oxlint-disable-next-line no-console\nconsole.log(1);",
      errors: [error],
    },
    {
      name: "same line",
      code: "go(); stop();",
      output: "go();\n\n stop();",
      errors: [error],
    },
    {
      name: "return after variable",
      code: "function f() {\n  const a = 1;\n  return a;\n}",
      output: "function f() {\n  const a = 1;\n\n  return a;\n}",
      errors: [error],
    },
    {
      name: "if after call",
      code: "function f() {\n  go();\n  if (a) stop();\n}",
      output: "function f() {\n  go();\n\n  if (a) stop();\n}",
      errors: [error],
    },
    {
      name: "throw after variable",
      code: "function f() {\n  const e = new Error('x');\n  throw e;\n}",
      output: "function f() {\n  const e = new Error('x');\n\n  throw e;\n}",
      errors: [error],
    },
    {
      name: "loops after call",
      code: "function f() {\n  go();\n  for (const x of xs) use(x);\n  while (ok) tick();\n}",
      output: "function f() {\n  go();\n\n  for (const x of xs) use(x);\n  while (ok) tick();\n}",
      errors: [error],
    },
    {
      name: "after a block-like statement",
      code: "function f() {\n  if (ok) {\n    go();\n  }\n  stop();\n}",
      output: "function f() {\n  if (ok) {\n    go();\n  }\n\n  stop();\n}",
      errors: [error],
    },
    {
      name: "multi-line control flow then control flow",
      code: "function f() {\n  if (a) {\n    go();\n  }\n  if (b) stop();\n}",
      output: "function f() {\n  if (a) {\n    go();\n  }\n\n  if (b) stop();\n}",
      errors: [error],
    },
    {
      name: "nested function body",
      code: "const f = Effect.gen(function* () {\n  const a = yield* A;\n  const dispatch = Effect.fn('dispatch')(function* () {\n    yield* a;\n  });\n  return dispatch;\n});",
      output:
        "const f = Effect.gen(function* () {\n  const a = yield* A;\n  const dispatch = Effect.fn('dispatch')(function* () {\n    yield* a;\n  });\n\n  return dispatch;\n});",
      errors: [error],
    },
    {
      name: "overload group then unrelated function",
      code: "function f(a: string): string;\nfunction f(a: unknown) { return a; }\nfunction g() {}",
      output:
        "function f(a: string): string;\nfunction f(a: unknown) { return a; }\n\nfunction g() {}",
      errors: [error],
    },
    {
      name: "statement continuing on the terminator line",
      code: "const a = 1\n;[1].forEach(f)",
      output: "const a = 1\n;\n\n[1].forEach(f)",
      errors: [error],
    },
    {
      name: "namespace body",
      code: "namespace N {\n  export const a = 1;\n  export function f() {}\n}",
      output: "namespace N {\n  export const a = 1;\n\n  export function f() {}\n}",
      errors: [error],
    },
  ],
});
