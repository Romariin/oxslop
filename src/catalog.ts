/**
 * Rule catalog: metadata only, no rule code.
 *
 * `oxslop/config` and the preset generator depend on this file alone, so enabling or disabling a
 * group never loads rule implementations. `src/index.ts` must register exactly these names; a
 * test enforces the invariant.
 */

export const PLUGIN_NAME = "oxslop";

export const GROUPS = ["core", "effect", "style", "testing"] as const;

export type Group = (typeof GROUPS)[number];

export interface RuleInfo {
  readonly group: Group;
  /** Enabled by `oxslop()` when its group is on. Non-recommended rules need `strict: true` or an explicit entry. */
  readonly recommended: boolean;
  readonly description: string;
  /** `true` when the rule offers an autofix. */
  readonly fixable?: true;
  /** Rule only makes sense on test files; the config builder scopes it through `overrides`. */
  readonly testOnly?: true;
}

const defineCatalog = <const T extends Record<string, RuleInfo>>(
  entries: T,
): { readonly [K in keyof T]: RuleInfo } => entries;

export const CATALOG = defineCatalog({
  // core: evidence and type safety
  "no-banned-type-assertions": {
    group: "core",
    recommended: true,
    description: "Disallow assertions to `any`, `never` or `unknown`; parse or narrow instead.",
  },
  "no-chained-type-assertions": {
    group: "core",
    recommended: true,
    description:
      "Disallow nested assertions such as `x as unknown as T`; chains of `as const` stay valid.",
  },
  "no-unknown-parameters": {
    group: "core",
    recommended: true,
    description:
      "Disallow `unknown` in parameter types, except an explicit `cause` and type-predicate subjects.",
  },
  "no-unknown-returns": {
    group: "core",
    recommended: true,
    description:
      "Disallow explicit return types that resolve to `unknown`, `Promise<unknown>` or `PromiseLike<unknown>`.",
  },
  "no-unknown-type-aliases": {
    group: "core",
    recommended: true,
    description: "Disallow type aliases whose resolved type is `unknown`.",
  },
  "no-object-parameters": {
    group: "core",
    recommended: true,
    description: "Disallow the `object` type (and aliases resolving to it) in parameter positions.",
  },
  "no-unsafe-dictionary-type": {
    group: "core",
    recommended: true,
    description: "Disallow dictionaries whose values are `unknown`, `any`, `object` or `{}`.",
  },
  "no-reflect-get": {
    group: "core",
    recommended: true,
    description: "Disallow `Reflect.get`; use typed property access or parse the input.",
  },
  "no-reflect-apply": {
    group: "core",
    recommended: true,
    description: "Disallow `Reflect.apply`; call the function directly.",
  },
  "no-runtime-typeof": {
    group: "core",
    recommended: true,
    description:
      'Disallow runtime `typeof` comparisons and switches, except `"undefined"` probes and, by default, type-predicate functions.',
  },
  "no-in-operator": {
    group: "core",
    recommended: true,
    description:
      "Disallow the `in` operator as an object-key probe; parse into a discriminated type instead.",
  },
  "no-conditional-empty-object-spread": {
    group: "core",
    recommended: true,
    description: "Disallow `...(cond ? { a } : {})` and `...(cond && { a })` used to omit fields.",
  },
  "no-widen-then-assert": {
    group: "core",
    recommended: true,
    description:
      "Disallow widening a known value to `unknown`/`any`/`object` and asserting it back later.",
  },
  "no-known-value-widening": {
    group: "core",
    recommended: true,
    description:
      "Disallow annotating literals of known shape with `unknown`, `object` or an open dictionary type.",
  },
  "require-safety-comment-for-type-assertion": {
    group: "core",
    recommended: true,
    description: "Require a `SAFETY:` comment justifying every non-const type assertion.",
  },

  // effect: idiomatic Effect
  "no-tag-access": {
    group: "effect",
    recommended: true,
    description:
      "Disallow reading `_tag` directly; use `Match`, `Effect.catchTag` or `Predicate.isTagged`.",
  },
  "no-manual-tagged-construction": {
    group: "effect",
    recommended: true,
    description:
      "Disallow object literals with a `_tag` field; use `Data.taggedEnum`, `Schema.TaggedClass` or tagged errors.",
  },
  "no-nested-layer-provide": {
    group: "effect",
    recommended: true,
    description: "Disallow `Layer.provide` nested inside another `Layer.provide`.",
  },
  "no-cascading-layer-provide": {
    group: "effect",
    recommended: true,
    description:
      "Disallow several `Layer.provide` stages inside one `pipe`; merge the layers first.",
  },
  "no-service-option": {
    group: "effect",
    recommended: true,
    description: "Disallow `Effect.serviceOption`; require the service or provide a default layer.",
  },
  "no-disable-validation": {
    group: "effect",
    recommended: true,
    description: "Disallow `disableValidation: true`, which decodes without checking.",
  },
  "no-silent-error-swallow": {
    group: "effect",
    recommended: true,
    description: "Disallow catch handlers that discard the error and return `Effect.void`.",
  },
  "no-yieldless-gen": {
    group: "effect",
    recommended: true,
    description:
      "Disallow `Effect.gen` generators that never yield; use `Effect.succeed` or `Effect.sync`.",
  },
  "prefer-effect-match": {
    group: "effect",
    recommended: true,
    description: "Prefer `Match` over chained literal ternaries on the same subject.",
  },
  "prefer-option-from-nullable": {
    group: "effect",
    recommended: true,
    description:
      "Prefer `Option.fromNullable` over a nullish ternary producing `Option.some`/`Option.none`.",
    fixable: true,
  },
  "pipe-max-arguments": {
    group: "effect",
    recommended: true,
    description: "Limit the number of arguments passed to `pipe` / `.pipe()`.",
  },
  "no-try-catch": {
    group: "effect",
    recommended: true,
    description: "Disallow `try`/`catch`; use `Effect.try` or `Effect.tryPromise`.",
  },
  "no-switch": {
    group: "effect",
    recommended: true,
    description: "Disallow `switch`; use `Match`.",
  },

  // style: signal over noise
  "no-comments": {
    group: "style",
    recommended: false,
    description:
      "Disallow comments other than `SAFETY:`, tooling directives and, by default, JSDoc.",
  },
  "no-narration-comments": {
    group: "style",
    recommended: true,
    description:
      "Disallow comments that narrate the next statement (`// Import x`, `// Return the result`).",
  },
  "no-emoji": {
    group: "style",
    recommended: true,
    description: "Disallow emoji in source code, strings and comments.",
  },
  "no-vague-identifiers": {
    group: "style",
    recommended: false,
    description:
      "Disallow placeholder names such as `data`, `temp`, `result` or `obj` on local bindings.",
  },
  "no-reexport-only-modules": {
    group: "style",
    recommended: true,
    description: "Disallow barrel modules that only re-export.",
  },
  "no-optional-function-parameters": {
    group: "style",
    recommended: false,
    description: "Disallow `param?: T`; use `param: T | undefined` or a default value.",
  },
  "no-array-filter-map": {
    group: "style",
    recommended: false,
    description:
      "Disallow adjacent eager `filter`/`map` passes; use a single `flatMap` or iterator helpers.",
  },
  "no-reduce-accumulator-copy": {
    group: "style",
    recommended: true,
    description: "Disallow copying the accumulator on every iteration inside `reduce`.",
  },
  "require-readable-spacing": {
    group: "style",
    recommended: true,
    description: "Require blank lines around top-level declarations, control flow and returns.",
    fixable: true,
  },

  // testing
  "no-module-mocking": {
    group: "testing",
    recommended: true,
    description:
      "Disallow module mocking (`vi.mock`, `jest.mock`, `mock.module`); use real dependency seams.",
  },
  "expect-padding": {
    group: "testing",
    recommended: true,
    description: "Require blank lines isolating runs of `expect()` calls.",
    fixable: true,
    testOnly: true,
  },
});

export type RuleName = keyof typeof CATALOG;

export const RULE_NAMES = Object.keys(CATALOG) as RuleName[];

export const rulesInGroup = (group: Group): RuleName[] =>
  RULE_NAMES.filter((name) => CATALOG[name].group === group);
