# oxslop

Configurable [Oxlint](https://oxc.rs/docs/guide/usage/linter) plugin and [Oxfmt](https://oxc.rs/docs/guide/usage/formatter) preset that reject AI slop: low-evidence TypeScript, non-idiomatic Effect, and low-signal style.

Rules are organised in **groups** you switch on and off per project. A repo that uses Effect enables the `effect` group; one that does not, does not. Everything else stays identical across projects.

Inspired by [dmmulroy/anti-slop](https://github.com/dmmulroy/anti-slop), [jliocsar/begone-slop](https://github.com/jliocsar/begone-slop) and [typeonce-dev/ai-automation](https://github.com/typeonce-dev/ai-automation). Unlike anti-slop, this is a published package with a config builder rather than a vendored copy.

## Install

```sh
bun add -d oxslop oxlint oxfmt
# or: npm i -D oxslop oxlint oxfmt
```

`oxlint >= 1.85` is required (JS plugin API). `@oxlint/plugins` is a runtime dependency of `oxslop` and installs automatically.

## Configure Oxlint

### `oxlint.config.ts` (recommended)

```ts
import { defineConfig } from "oxlint";
import { oxslop } from "oxslop/config";

export default defineConfig({
  extends: [
    oxslop({
      effect: false, // this project does not use Effect
      rules: { "no-emoji": "warn" },
    }),
  ],
});
```

`oxslop()` returns a plain config object (`jsPlugins` + `rules` + a test-file `overrides` entry). Because it is just data, you can spread, inspect or post-process it.

TypeScript configs need Node 22.18+/24 or Bun (`bunx --bun oxlint`).

#### Options

| Option      | Type                                           | Default                                                | Effect                                                                                                                            |
| ----------- | ---------------------------------------------- | ------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------- |
| `core`      | `boolean \| "warn" \| "error"`                 | `true`                                                 | Evidence and type-safety rules.                                                                                                   |
| `effect`    | `boolean \| "warn" \| "error" \| "auto"`       | `"auto"`                                               | Effect rules. `"auto"` enables them when the `effect` package resolves from `cwd`. Pass `false` to force off, `true` to force on. |
| `style`     | `boolean \| "warn" \| "error"`                 | `true`                                                 | Signal-over-noise rules.                                                                                                          |
| `testing`   | `boolean \| "warn" \| "error"`                 | `true`                                                 | Test-file rules. Test-only rules (`expect-padding`) are scoped through `overrides`.                                               |
| `severity`  | `"warn" \| "error"`                            | `"error"`                                              | Severity for every enabled rule; a group set to `"warn"`/`"error"` overrides it.                                                  |
| `strict`    | `boolean`                                      | `false`                                                | Also enable the non-recommended rules of enabled groups (see tables below).                                                       |
| `rules`     | `Record<string, Severity \| [Severity, opts]>` | `{}`                                                   | Per-rule overrides, applied last. Keys accept `no-comments` or `oxslop/no-comments`. `"off"` removes a rule; unknown names throw. |
| `testFiles` | `string[]`                                     | `*.test.*`, `*.spec.*`, `__tests__`, `test/`, `tests/` | Globs that receive test-only rules.                                                                                               |
| `specifier` | `string`                                       | `"oxslop"`                                             | Module specifier used in `jsPlugins`. A package name or an **absolute** path (Oxlint rejects relative paths inside `extends`), e.g. `fileURLToPath(new URL("./tools/oxslop/index.ts", import.meta.url))` when vendoring. |
| `cwd`       | `string`                                       | `process.cwd()`                                        | Directory used for Effect auto-detection.                                                                                         |

Monorepo with mixed packages: put one `oxlint.config.ts` per package (Oxlint uses the nearest config) or use `overrides`:

```ts
export default defineConfig({
  extends: [oxslop({ effect: false })],
  overrides: [
    {
      files: ["packages/effect-*/**"],
      rules: Object.fromEntries(
        Object.entries(
          oxslop({ core: false, style: false, testing: false, effect: true }).rules ?? {},
        ),
      ),
    },
  ],
});
```

### `.oxlintrc.json`

JSON configs cannot import packages, so `oxslop` ships static presets. `extends` resolves relative to the config file, hence the `node_modules` path.

```jsonc
{
  "extends": [
    "./node_modules/oxslop/presets/recommended.json", // core + style + testing
    "./node_modules/oxslop/presets/effect.json", // add only in Effect projects
  ],
  "rules": {
    "oxslop/no-emoji": "warn",
  },
}
```

Available presets: `recommended`, `all` (every rule, including non-recommended), `core`, `effect`, `style`, `testing`. Later `extends` entries and your own `rules` win.

## Configure Oxfmt

```ts
// oxfmt.config.ts
import { defineConfig } from "oxfmt";
import { oxfmt } from "oxslop/oxfmt";

export default defineConfig({
  ...oxfmt({ sortTailwindcss: true }),
  printWidth: 80,
});
```

The preset: 100 columns, 2 spaces, semicolons, double quotes, trailing commas, LF, sorted imports, sorted `package.json`, and ignore patterns for build output and agent tooling directories. Options: `sortImports` (default `true`), `sortTailwindcss` (default `false`), `ignorePatterns` (appended).

## Rules

Rules use Oxlint's ESTree and scope APIs, not a type checker. They resolve same-file type aliases (including block-scoped and transparent generic aliases) and follow Effect imports (`import { Effect as E }`, `import * as L from "effect/Layer"`), but never infer imported types. Precision is preferred over recall.

`R` = enabled by its group by default. Other rules need `strict: true`, the `all` preset, or an explicit `rules` entry. `F` = autofix.

<!-- rules:start -->

### Core: evidence and type safety

| Rule | Rejects | |
| --- | --- | --- |
| `no-banned-type-assertions` | Disallow assertions to `any`, `never` or `unknown`; parse or narrow instead. | R |
| `no-chained-type-assertions` | Disallow nested assertions such as `x as unknown as T`; chains of `as const` stay valid. | R |
| `no-unknown-parameters` | Disallow `unknown` in parameter types, except an explicit `cause` and type-predicate subjects. | R |
| `no-unknown-returns` | Disallow explicit return types that resolve to `unknown`, `Promise<unknown>` or `PromiseLike<unknown>`. | R |
| `no-unknown-type-aliases` | Disallow type aliases whose resolved type is `unknown`. | R |
| `no-object-parameters` | Disallow the `object` type (and aliases resolving to it) in parameter positions. | R |
| `no-unsafe-dictionary-type` | Disallow dictionaries whose values are `unknown`, `any`, `object` or `{}`. | R |
| `no-reflect-get` | Disallow `Reflect.get`; use typed property access or parse the input. | R |
| `no-reflect-apply` | Disallow `Reflect.apply`; call the function directly. | R |
| `no-runtime-typeof` | Disallow `typeof` narrowing on values that were never parsed; `typeof x === "undefined"` probes stay valid. | R |
| `no-in-operator` | Disallow the `in` operator as an object-key probe; parse into a discriminated type instead. | R |
| `no-conditional-empty-object-spread` | Disallow `...(cond ? { a } : {})` and `...(cond && { a })` used to omit fields. | R |
| `no-widen-then-assert` | Disallow widening a known value to `unknown`/`any`/`object` and asserting it back later. | R |
| `no-known-value-widening` | Disallow annotating literals of known shape with `unknown`, `object` or an open dictionary type. | R |
| `require-safety-comment-for-type-assertion` | Require a `SAFETY:` comment justifying every non-const type assertion. | R |

### Effect

| Rule | Rejects | |
| --- | --- | --- |
| `no-tag-access` | Disallow reading `_tag` directly; use `Match`, `Effect.catchTag` or `Predicate.isTagged`. | R |
| `no-manual-tagged-construction` | Disallow object literals with a `_tag` field; use `Data.taggedEnum`, `Schema.TaggedClass` or tagged errors. | R |
| `no-nested-layer-provide` | Disallow `Layer.provide` nested inside another `Layer.provide`. | R |
| `no-cascading-layer-provide` | Disallow several `Layer.provide` stages inside one `pipe`; merge the layers first. | R |
| `no-service-option` | Disallow `Effect.serviceOption`; require the service or provide a default layer. | R |
| `no-disable-validation` | Disallow `disableValidation: true`, which decodes without checking. | R |
| `no-silent-error-swallow` | Disallow catch handlers that discard the error and return `Effect.void`. | R |
| `no-yieldless-gen` | Disallow `Effect.gen` generators that never `yield*`; use `Effect.succeed` or `Effect.sync`. | R |
| `prefer-effect-match` | Prefer `Match` over chained literal ternaries on the same subject. | R |
| `prefer-option-from-nullable` | Prefer `Option.fromNullable` over a nullish ternary producing `Option.some`/`Option.none`. | R F |
| `pipe-max-arguments` | Limit the number of arguments passed to `pipe` / `.pipe()`. | R |
| `no-try-catch` | Disallow `try`/`catch`; use `Effect.try` or `Effect.tryPromise`. | R |
| `no-switch` | Disallow `switch`; use `Match`. | R |

### Style: signal over noise

| Rule | Rejects | |
| --- | --- | --- |
| `no-comments` | Disallow comments other than `SAFETY:` and tooling directives. |  |
| `no-narration-comments` | Disallow comments that narrate the next statement (`// Import x`, `// Return the result`). | R |
| `no-emoji` | Disallow emoji in source code, strings and comments. | R |
| `no-vague-identifiers` | Disallow placeholder names such as `data`, `temp`, `result` or `obj` on local bindings. |  |
| `no-reexport-only-modules` | Disallow barrel modules that only re-export. | R |
| `no-optional-function-parameters` | Disallow `param?: T`; use `param: T | undefined` or a default value. |  |
| `no-array-filter-map` | Disallow adjacent eager `filter`/`map` passes; use a single `flatMap` or iterator helpers. |  |
| `no-reduce-accumulator-copy` | Disallow copying the accumulator on every iteration inside `reduce`. | R |
| `require-readable-spacing` | Require blank lines around top-level declarations, control flow and returns. | R F |

### Testing

| Rule | Rejects | |
| --- | --- | --- |
| `no-module-mocking` | Disallow module mocking (`vi.mock`, `jest.mock`, `mock.module`); use real dependency seams. | R |
| `expect-padding` | Require blank lines isolating runs of `expect()` calls. | R F |

<!-- rules:end -->

### Rule options

Every option has a JSON schema; Oxlint rejects unknown keys.

```ts
oxslop({
  rules: {
    "no-banned-type-assertions": ["error", { banned: ["any", "never"] }],
    "require-safety-comment-for-type-assertion": ["error", { markers: ["SAFETY", "INVARIANT"] }],
    "no-unknown-parameters": ["error", { allowNames: ["cause", "input"] }],
    "no-runtime-typeof": ["error", { allowInTypePredicates: true }],
    "no-in-operator": ["error", { allowInTypePredicates: true }],
    "prefer-effect-match": ["error", { minCases: 3 }],
    "pipe-max-arguments": ["error", { max: 8 }],
    "no-try-catch": ["error", { allowFinally: true }],
    "no-comments": ["error", { allow: ["SAFETY", "TODO"], allowJsdoc: true }],
    "no-narration-comments": ["error", { verbs: ["import", "return"], allowMarkers: ["TODO"] }],
    "no-vague-identifiers": ["error", { names: ["data", "tmp"] }],
    "no-reexport-only-modules": ["error", { allowFiles: ["public-api."] }],
    "no-optional-function-parameters": ["error", { allowLast: true }],
  },
});
```

## Development

```sh
bun install
bun run check   # typecheck, lint, format check, presets check, tests, build
bun run smoke   # runs the real oxlint binary against the built package
```

Tests run under Node (`node --test`): Oxlint's `RuleTester` needs Node's raw-transfer parser and is not supported under Bun.

The repo lints itself with its own rules (`.oxlintrc.json` loads `./src/index.ts` as a JS plugin), so every rule runs on real code before it ships.

Adding a rule: add its metadata to `src/catalog.ts`, implement `src/rules/<name>.ts` + `<name>.test.ts`, register it in `src/index.ts`, run `bun run presets` (regenerates presets and this README's tables). `test/catalog.test.ts` fails until catalog, plugin and README agree.

## License

MIT
