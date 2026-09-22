import { tester } from "../../test/tester.ts";
import rule from "./no-runtime-typeof.ts";

const error = { messageId: "runtimeTypeof" };

tester.run("oxslop/no-runtime-typeof", rule, {
  valid: [
    "if (typeof window === 'undefined') { skip(); }",
    "if (typeof document !== 'undefined') { attach(); }",
    "if ('undefined' == typeof globalThis.fetch) { polyfill(); }",
    "if (typeof value === `undefined`) { skip(); }",
    "type Kind = typeof value; const key: keyof typeof table = 'a';",
    "const kind = typeof value;",
    "function isString(value: unknown): value is string { return typeof value === 'string'; }",
    "const isNumber = (value: unknown): value is number => typeof value === 'number';",
    "function assertString(value: unknown): asserts value is string { if (typeof value !== 'string') throw new Error(); }",
    "function isStringArray(value: unknown[]): value is string[] { return value.every((item) => typeof item === 'string'); }",
    "function isFunction(value: unknown): value is Function { switch (typeof value) { case 'function': return true; default: return false; } }",
    "const parsed = Schema.decodeUnknownSync(User)(input);",
  ],
  invalid: [
    {
      name: "strict equality",
      code: "if (typeof input === 'string') { useName(input); }",
      errors: [error],
    },
    {
      name: "strict inequality",
      code: "if (typeof input !== 'number') { fail(); }",
      errors: [error],
    },
    { name: "loose equality", code: "const ok = typeof input == 'object';", errors: [error] },
    {
      name: "typeof on the right",
      code: "const ok = 'boolean' === typeof input;",
      errors: [error],
    },
    {
      name: "compared to a variable",
      code: "const ok = typeof input === expected;",
      errors: [error],
    },
    {
      name: "switch discriminant",
      code: "switch (typeof input) { case 'string': break; default: break; }",
      errors: [error],
    },
    {
      name: "boolean-returning function is not a predicate",
      code: "function isString(value: unknown): boolean { return typeof value === 'string'; }",
      errors: [error],
    },
    {
      name: "predicate allowance disabled",
      code: "function isString(value: unknown): value is string { return typeof value === 'string'; }",
      options: [{ allowInTypePredicates: false }],
      errors: [error],
    },
    {
      name: "undefined probe beside a narrowing check",
      code: "const ok = typeof value !== 'undefined' && typeof value === 'string';",
      errors: [error],
    },
  ],
});
