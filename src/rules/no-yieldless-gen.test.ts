import { tester } from "../../test/tester.ts";
import rule from "./no-yieldless-gen.ts";

const error = { messageId: "yieldlessGen" };

tester.run("oxslop/no-yieldless-gen", rule, {
  valid: [
    'import { Effect } from "effect"; Effect.gen(function* () { const a = yield* Effect.succeed(1); return a; });',
    'import { Effect } from "effect"; Effect.gen(function* () { if (x) { for (const i of xs) { yield* step(i); } } });',
    'import { Effect } from "effect"; Effect.gen(this, function* () { yield* Effect.succeed(1); });',
    'import { Effect } from "effect"; Effect.fn("name")(function* (n: number) { return yield* Effect.succeed(n); });',
    'import { Effect } from "effect"; Effect.fn(function* () { yield* Effect.succeed(1); });',
    'import { Effect } from "effect"; Effect.fnUntraced(function* () { yield* Effect.succeed(1); });',
    'import { Effect } from "effect"; Effect.fn("name")((n: number) => Effect.succeed(n));',
    'import { Effect } from "effect"; Effect.succeed(1);',
    "function* numbers() { return 1; }",
    "const it = { *[Symbol.iterator]() { return 1; } };",
    "gen(function* () { return 1; });",
    "Stream.gen(function* () { return 1; });",
    {
      name: "local Effect binding is not the effect module",
      code: "const Effect = { gen: (f: () => unknown) => f() }; Effect.gen(function* () { return 1; });",
    },
    {
      name: "Effect imported from another package",
      code: 'import { Effect } from "other"; Effect.gen(function* () { return 1; });',
    },
    {
      name: "outer generator yields even when nested one does not",
      code: 'import { Effect } from "effect"; Effect.gen(function* () { yield* Effect.succeed(1); function* inner() { return 2; } return inner; });',
    },
  ],
  invalid: [
    {
      name: "return only",
      code: 'import { Effect } from "effect"; Effect.gen(function* () { return 1; });',
      errors: [error],
    },
    {
      name: "unresolved Effect global",
      code: "Effect.gen(function* () { return 1; });",
      errors: [error],
    },
    {
      name: "aliased import",
      code: 'import { Effect as E } from "effect"; E.gen(function* () { return 1; });',
      errors: [error],
    },
    {
      name: "namespace import",
      code: 'import * as Eff from "effect/Effect"; Eff.gen(function* () { return 1; });',
      errors: [error],
    },
    {
      name: "bare gen import",
      code: 'import { gen } from "effect/Effect"; gen(function* () { return 1; });',
      errors: [error],
    },
    {
      name: "with this argument",
      code: 'import { Effect } from "effect"; Effect.gen(this, function* () { return 1; });',
      errors: [error],
    },
    {
      name: "Effect.fn with name",
      code: 'import { Effect } from "effect"; Effect.fn("name")(function* (n: number) { return n; });',
      errors: [error],
    },
    {
      name: "Effect.fn without name",
      code: 'import { Effect } from "effect"; Effect.fn(function* (n: number) { return n; });',
      errors: [error],
    },
    {
      name: "Effect.fnUntraced",
      code: 'import { Effect } from "effect"; Effect.fnUntraced(function* () { return 1; });',
      errors: [error],
    },
    {
      name: "yield only in nested generator",
      code: 'import { Effect } from "effect"; Effect.gen(function* () { function* inner() { yield* Effect.succeed(1); } return inner; });',
      errors: [error],
    },
    {
      name: "yield only in nested Effect.gen",
      code: 'import { Effect } from "effect"; Effect.gen(function* () { return Effect.gen(function* () { yield* Effect.succeed(1); }); });',
      errors: [error],
    },
  ],
});
