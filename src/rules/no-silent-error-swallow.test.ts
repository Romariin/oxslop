import { tester } from "../../test/tester.ts";
import rule from "./no-silent-error-swallow.ts";

const error = { messageId: "silentSwallow" };
const effect = 'import { Effect } from "effect"; ';

tester.run("oxslop/no-silent-error-swallow", rule, {
  valid: [
    `${effect}program.pipe(Effect.catchAll((e) => Effect.logError(e)));`,
    `${effect}program.pipe(Effect.catchAll((e) => Effect.logError(e).pipe(Effect.andThen(Effect.void))));`,
    `${effect}program.pipe(Effect.catchAll((e) => e._tag === "NotFound" ? Effect.void : Effect.fail(e)));`,
    `${effect}program.pipe(Effect.catchAll((e) => { console.error(e); return Effect.void; }));`,
    `${effect}program.pipe(Effect.catchTag("NotFound", () => Effect.succeed(fallback)));`,
    `${effect}program.pipe(Effect.catchAll(() => Effect.succeed(0)));`,
    `${effect}program.pipe(Effect.ignore);`,
    `${effect}program.pipe(Effect.ignoreLogged);`,
    `${effect}program.pipe(Effect.orElse(() => fallbackProgram));`,
    `${effect}program.pipe(Effect.catchTags({ NotFound: () => Effect.succeed(fallback), Timeout: retry }));`,
    `${effect}program.pipe(Effect.map(() => Effect.void));`,
    `${effect}program.pipe(Effect.catchAll((_) => Effect.void.pipe(Effect.tap(() => log(_)))));`,
    "const Effect = { catchAll: (f: unknown) => f, void: 0 }; program.pipe(Effect.catchAll(() => Effect.void));",
    'import { Effect } from "effect"; const Effect2 = { void: 0 }; program.pipe(Effect.catchAll(() => Effect2.void));',
  ],
  invalid: [
    {
      name: "arrow returning Effect.void",
      code: `${effect}program.pipe(Effect.catchAll(() => Effect.void));`,
      errors: [error],
    },
    {
      name: "underscore parameter",
      code: `${effect}program.pipe(Effect.catchAll((_) => Effect.void));`,
      errors: [error],
    },
    {
      name: "underscore-prefixed parameter",
      code: `${effect}program.pipe(Effect.catchAll((_error) => Effect.void));`,
      errors: [error],
    },
    {
      name: "named but unused parameter",
      code: `${effect}program.pipe(Effect.catchAll((error) => Effect.void));`,
      errors: [error],
    },
    {
      name: "block body with single return",
      code: `${effect}program.pipe(Effect.catchAll(() => { return Effect.void; }));`,
      errors: [error],
    },
    {
      name: "function expression",
      code: `${effect}program.pipe(Effect.catchAll(function () { return Effect.unit; }));`,
      errors: [error],
    },
    {
      name: "Effect.succeed with no argument",
      code: `${effect}program.pipe(Effect.catchAllCause(() => Effect.succeed()));`,
      errors: [error],
    },
    {
      name: "Effect.succeed(undefined)",
      code: `${effect}program.pipe(Effect.catchAllDefect(() => Effect.succeed(undefined)));`,
      errors: [error],
    },
    {
      name: "Effect.succeed(null)",
      code: `${effect}program.pipe(Effect.catchSome(() => Effect.succeed(null)));`,
      errors: [error],
    },
    {
      name: "Effect.succeed(void 0)",
      code: `${effect}program.pipe(Effect.orElse(() => Effect.succeed(void 0)));`,
      errors: [error],
    },
    {
      name: "catchTag handler",
      code: `${effect}program.pipe(Effect.catchTag("NotFound", () => Effect.void));`,
      errors: [error],
    },
    {
      name: "catchIf handler",
      code: `${effect}program.pipe(Effect.catchIf((e) => e._tag === "A", () => Effect.void));`,
      errors: [error],
    },
    {
      name: "data-first call",
      code: `${effect}Effect.catchAll(program, () => Effect.void);`,
      errors: [error],
    },
    {
      name: "catchTags reports each silent handler",
      code: `${effect}program.pipe(Effect.catchTags({ NotFound: () => Effect.void, Timeout: () => Effect.succeed(1), Denied() { return Effect.void; } }));`,
      errors: [error, error],
    },
    {
      name: "parenthesised handler",
      code: `${effect}program.pipe(Effect.catch("_tag", (() => (Effect.void))));`,
      errors: [error],
    },
    {
      name: "aliased named import",
      code: 'import { Effect as E } from "effect"; program.pipe(E.catchAll(() => E.void));',
      errors: [error],
    },
    {
      name: "namespace import",
      code: 'import * as E from "effect/Effect"; program.pipe(E.catchAll(() => E.void));',
      errors: [error],
    },
    {
      name: "mixed import styles",
      code: 'import { catchAll } from "effect/Effect"; import { Effect } from "effect"; program.pipe(catchAll(() => Effect.void));',
      errors: [error],
    },
  ],
});
