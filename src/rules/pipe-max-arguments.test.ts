import { tester } from "../../test/tester.ts";
import rule from "./pipe-max-arguments.ts";

const args = (count: number): string => Array.from({ length: count }, (_, i) => `f${i}`).join(", ");

tester.run("oxslop/pipe-max-arguments", rule, {
  valid: [
    `import { pipe } from "effect"; pipe(${args(12)});`,
    `import { pipe } from "effect/Function"; pipe(${args(5)});`,
    `import { Effect } from "effect"; Effect.succeed(1).pipe(${args(12)});`,
    `pipe(${args(3)});`,
    {
      name: "custom max respected",
      code: `import { pipe } from "effect"; pipe(${args(4)});`,
      options: [{ max: 4 }],
    },
    {
      name: "local pipe binding is not the effect pipe",
      code: `const pipe = (...fns: unknown[]) => fns; pipe(${args(20)});`,
    },
    {
      name: "pipe imported from another package",
      code: `import { pipe } from "lodash/fp"; pipe(${args(20)});`,
    },
    {
      name: "non-pipe call with many arguments",
      code: `import { pipe } from "effect"; run(${args(20)});`,
    },
  ],
  invalid: [
    {
      name: "bare pipe from effect",
      code: `import { pipe } from "effect"; pipe(${args(13)});`,
      errors: [{ messageId: "tooManyArguments", data: { count: "13", max: "12" } }],
    },
    {
      name: "aliased pipe import",
      code: `import { pipe as p } from "effect/Function"; p(${args(13)});`,
      errors: [{ messageId: "tooManyArguments" }],
    },
    {
      name: "method pipe",
      code: `import { Effect } from "effect"; Effect.succeed(1).pipe(${args(13)});`,
      errors: [{ messageId: "tooManyArguments" }],
    },
    {
      name: "unresolved pipe",
      code: `pipe(${args(13)});`,
      errors: [{ messageId: "tooManyArguments" }],
    },
    {
      name: "custom max exceeded",
      code: `import { pipe } from "effect"; pipe(${args(5)});`,
      options: [{ max: 4 }],
      errors: [{ messageId: "tooManyArguments", data: { count: "5", max: "4" } }],
    },
  ],
});
