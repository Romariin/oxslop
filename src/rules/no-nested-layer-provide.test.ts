import { tester } from "../../test/tester.ts";
import rule from "./no-nested-layer-provide.ts";

const error = { messageId: "nestedProvide" };
const effect = 'import { Layer } from "effect"; ';

tester.run("oxslop/no-nested-layer-provide", rule, {
  valid: [
    `${effect}const Live = Layer.provide(App, Layer.merge(Db, Cache));`,
    `${effect}const Live = Layer.provide(App, Layer.mergeAll(Db, Cache, Logger));`,
    `${effect}const Infra = Layer.provide(Db, Config); const Live = Layer.provide(App, Infra);`,
    `${effect}const Live = App.pipe(Layer.provide(Layer.mergeAll(Db, Cache)));`,
    `${effect}const Live = Layer.provideMerge(App, Db);`,
    `${effect}const Live = App.pipe(Layer.provide(Db), Layer.orDie);`,
    'import { Effect, Layer } from "effect"; const run = Effect.provide(program, Layer.provide(App, Db));',
    "const Layer = { provide: (a: unknown, b: unknown) => b }; Layer.provide(A, Layer.provide(B, C));",
    "function build(Layer: { provide: (a: unknown, b: unknown) => unknown }) { return Layer.provide(A, Layer.provide(B, C)); }",
  ],
  invalid: [
    {
      name: "direct nesting",
      code: `${effect}Layer.provide(App, Layer.provide(Db, Config));`,
      errors: [error],
    },
    {
      name: "nesting through provideMerge",
      code: `${effect}Layer.provideMerge(App, Layer.provide(Db, Config));`,
      errors: [error],
    },
    {
      name: "nesting inside a pipe argument",
      code: `${effect}Layer.provide(App, Db.pipe(Layer.provide(Config)));`,
      errors: [error],
    },
    {
      name: "nesting inside a bare pipe argument",
      code: 'import { Layer, pipe } from "effect"; Layer.provide(App, pipe(Db, Layer.provide(Config)));',
      errors: [error],
    },
    {
      name: "data-last chain",
      code: `${effect}App.pipe(Layer.provide(Db.pipe(Layer.provide(Config))));`,
      errors: [error],
    },
    {
      name: "parenthesised inner call",
      code: `${effect}Layer.provide(App, (Layer.provide(Db, Config)));`,
      errors: [error],
    },
    {
      name: "aliased named import",
      code: 'import { Layer as L } from "effect"; L.provide(App, L.provide(Db, Config));',
      errors: [error],
    },
    {
      name: "namespace import",
      code: 'import * as L from "effect/Layer"; L.provide(App, L.provide(Db, Config));',
      errors: [error],
    },
    {
      name: "bare member import",
      code: 'import { provide } from "effect/Layer"; provide(App, provide(Db, Config));',
      errors: [error],
    },
    {
      name: "three levels report each inner call",
      code: `${effect}Layer.provide(App, Layer.provide(Db, Layer.provide(Config, Env)));`,
      errors: [error, error],
    },
    {
      name: "unresolved Layer is treated as the Effect module",
      code: "Layer.provide(App, Layer.provide(Db, Config));",
      errors: [error],
    },
  ],
});
