import { tester } from "../../test/tester.ts";
import rule from "./no-tag-access.ts";

const error = { messageId: "tagAccess" };

tester.run("oxslop/no-tag-access", rule, {
  valid: [
    'type Tag = Result["_tag"];',
    'type A = Extract<E, { _tag: "A" }>;',
    'const a = { _tag: "A", value: 1 };',
    'Match.value(x).pipe(Match.when({ _tag: "A" }, (a) => a.value));',
    'class A { readonly _tag = "A"; }',
    'class A { _tag: string; constructor() { this._tag = "A"; } }',
    'class A { _tag = "A"; describe() { return this._tag; } }',
    "const tag = x.tag;",
    "const { tag } = x;",
    "const { _tagged } = x;",
    'Effect.catchTag("NotFound", () => Effect.void);',
    "if (Predicate.isTagged(x, 'A')) { x.value; }",
  ],
  invalid: [
    { name: "member read", code: "const t = x._tag;", errors: [error] },
    { name: "computed read", code: 'const t = x["_tag"];', errors: [error] },
    { name: "template read", code: "const t = x[`_tag`];", errors: [error] },
    { name: "optional chain", code: "const t = x?._tag;", errors: [error] },
    { name: "switch discriminant", code: 'switch (x._tag) { case "A": break; }', errors: [error] },
    { name: "comparison", code: 'if (x._tag === "A") { use(x); }', errors: [error] },
    { name: "string key destructure", code: 'const { "_tag": t } = x;', errors: [error] },
    { name: "shorthand destructure", code: "const { _tag } = x;", errors: [error] },
    { name: "renamed destructure", code: "const { _tag: t } = x;", errors: [error] },
    { name: "parameter destructure", code: "const f = ({ _tag }) => _tag;", errors: [error] },
    { name: "assignment destructure", code: "let t; ({ _tag: t } = x);", errors: [error] },
    { name: "chained read", code: "const t = self.error._tag;", errors: [error] },
    { name: "filter callback", code: 'items.filter((i) => i._tag !== "B");', errors: [error] },
  ],
});
