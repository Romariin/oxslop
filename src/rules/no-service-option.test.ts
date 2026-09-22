import { tester } from "../../test/tester.ts";
import rule from "./no-service-option.ts";

const error = { messageId: "serviceOption" };

tester.run("oxslop/no-service-option", rule, {
  valid: [
    'import { Effect } from "effect"; const program = Effect.gen(function* () { const db = yield* Db; return db; });',
    'import { Effect } from "effect"; const program = Effect.service(Db);',
    'import { Effect } from "effect"; const program = Effect.serviceFunctions(Db);',
    'import { Effect } from "effect"; const program = Effect.provide(app, Db.Default);',
    'import { Option } from "effect"; const value = Option.fromNullable(service);',
    "const Effect = { serviceOption: (tag: unknown) => tag }; Effect.serviceOption(Db);",
    "function read(Effect: { serviceOption: (tag: unknown) => unknown }) { return Effect.serviceOption(Db); }",
    'import { Effect } from "other-lib"; Effect.serviceOption(Db);',
    'import * as Effect from "effect"; Effect.serviceOption(Db);',
    'import * as Fx from "effect"; function f(Fx) { Fx.Effect.serviceOption(Db); }',
  ],
  invalid: [
    {
      name: "serviceOption",
      code: 'import { Effect } from "effect"; Effect.serviceOption(Db);',
      errors: [error],
    },
    {
      name: "serviceOptional",
      code: 'import { Effect } from "effect"; Effect.serviceOptional(Db);',
      errors: [error],
    },
    {
      name: "aliased named import",
      code: 'import { Effect as E } from "effect"; E.gen(function* () { const db = yield* E.serviceOption(Db); return db; });',
      errors: [error],
    },
    {
      name: "namespace import",
      code: 'import * as E from "effect/Effect"; E.serviceOption(Db);',
      errors: [error],
    },
    {
      name: "bare member import",
      code: 'import { serviceOption } from "effect/Effect"; serviceOption(Db);',
      errors: [error],
    },
    {
      name: "root namespace import",
      code: 'import * as Fx from "effect"; Fx.Effect.serviceOption(Db);',
      errors: [error],
    },
    { name: "unresolved global Effect", code: "Effect.serviceOption(Db);", errors: [error] },
  ],
});
