import { tester } from "../../test/tester.ts";
import rule from "./no-cascading-layer-provide.ts";

const error = { messageId: "cascadingProvide" };
const effect = 'import { Layer } from "effect"; ';

tester.run("oxslop/no-cascading-layer-provide", rule, {
  valid: [
    `${effect}const Live = App.pipe(Layer.provide(Db));`,
    `${effect}const Live = App.pipe(Layer.provide(Layer.mergeAll(Db, Cache, Logger)));`,
    `${effect}const Live = App.pipe(Layer.provide(Db), Layer.orDie);`,
    `${effect}const Live = App.pipe(Layer.tap(() => log), Layer.provide(Db), Layer.memoize);`,
    `${effect}const Infra = App.pipe(Layer.provide(Db)); const Live = Infra.pipe(Layer.provide(Config));`,
    'import { Effect, Layer } from "effect"; program.pipe(Effect.provide(Db), Effect.provide(Config));',
    "const Layer = { provide: (a: unknown) => a }; App.pipe(Layer.provide(Db), Layer.provide(Config));",
    `${effect}const Live = Layer.mergeAll(App.pipe(Layer.provide(Db)), Other.pipe(Layer.provide(Config)));`,
  ],
  invalid: [
    {
      name: "two provide stages",
      code: `${effect}App.pipe(Layer.provide(Db), Layer.provide(Config));`,
      errors: [error],
    },
    {
      name: "provide followed by provideMerge",
      code: `${effect}App.pipe(Layer.provide(Db), Layer.provideMerge(Config));`,
      errors: [error],
    },
    {
      name: "three stages report the trailing two",
      code: `${effect}App.pipe(Layer.provide(Db), Layer.provide(Cache), Layer.provide(Config));`,
      errors: [error, error],
    },
    {
      name: "bare pipe function",
      code: 'import { Layer, pipe } from "effect"; pipe(App, Layer.provide(Db), Layer.provide(Config));',
      errors: [error],
    },
    {
      name: "other combinators between stages",
      code: `${effect}App.pipe(Layer.provide(Db), Layer.orDie, Layer.provide(Config));`,
      errors: [error],
    },
    {
      name: "aliased named import",
      code: 'import { Layer as L } from "effect"; App.pipe(L.provide(Db), L.provide(Config));',
      errors: [error],
    },
    {
      name: "namespace import",
      code: 'import * as L from "effect/Layer"; App.pipe(L.provide(Db), L.provide(Config));',
      errors: [error],
    },
    {
      name: "bare member import",
      code: 'import { provide } from "effect/Layer"; App.pipe(provide(Db), provide(Config));',
      errors: [error],
    },
  ],
});
