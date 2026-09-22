import { tester } from "../../test/tester.ts";
import rule from "./no-manual-tagged-construction.ts";

const error = { messageId: "manualTag" };

tester.run("oxslop/no-manual-tagged-construction", rule, {
  valid: [
    'import { Match } from "effect"; Match.value(x).pipe(Match.when({ _tag: "A" }, (a) => a.value));',
    'import { Match as M } from "effect"; M.value(x).pipe(M.when({ _tag: "A" }, (a) => a.value));',
    'import * as M from "effect/Match"; M.value(x).pipe(M.whenOr({ _tag: "A" }, { _tag: "B" }, () => 1));',
    'import { Match } from "effect"; Match.value(x).pipe(Match.not({ _tag: "A" }, () => 1));',
    'import { Match } from "effect"; Match.when({ user: { _tag: "Admin" } }, () => 1);',
    'import { Match } from "effect"; Match.when({ items: [{ _tag: "A" }] }, () => 1);',
    'type A = { _tag: "A"; value: number };',
    'interface B { readonly _tag: "B" }',
    "const a = { _tag: tag, value: 1 };",
    "const a = { _tag: `${prefix}A` };",
    "const a = { tag: 'A' };",
    'const a = { _tag: "A".toUpperCase() };',
    'Schema.Struct({ _tag: Schema.Literal("A") });',
    'class A { readonly _tag = "A"; }',
  ],
  invalid: [
    { name: "plain literal", code: 'const a = { _tag: "A", value: 1 };', errors: [error] },
    { name: "template literal", code: "const a = { _tag: `A` };", errors: [error] },
    { name: "string key", code: 'const a = { "_tag": "A" };', errors: [error] },
    { name: "computed string key", code: 'const a = { ["_tag"]: "A" };', errors: [error] },
    { name: "as const", code: 'const a = { _tag: "A" } as const;', errors: [error] },
    { name: "returned object", code: 'const make = () => ({ _tag: "A" });', errors: [error] },
    { name: "non-match call argument", code: 'emit({ _tag: "A" });', errors: [error] },
    {
      name: "constructed inside a Match handler",
      code: 'import { Match } from "effect"; Match.when({ _tag: "A" }, () => ({ _tag: "B" }));',
      errors: [error],
    },
    {
      name: "Match.value is not a pattern position",
      code: 'import { Match } from "effect"; Match.value({ _tag: "A" });',
      errors: [error],
    },
    {
      name: "local Match object is not the Effect module",
      code: 'const Match = { when: (p: unknown) => p }; Match.when({ _tag: "A" });',
      errors: [error],
    },
    {
      name: "nested tagged objects report each",
      code: 'const a = { _tag: "A", inner: { _tag: "B" } };',
      errors: [error, error],
    },
  ],
});
