import { tester } from "../../test/tester.ts";
import rule from "./no-unknown-type-aliases.ts";

const error = (name: string) => ({ messageId: "unknownAlias", data: { name } });

tester.run("oxslop/no-unknown-type-aliases", rule, {
  valid: [
    "type Id = string;",
    "type Maybe = string | null;",
    "type Identity<T> = T;",
    "type Wrap<T> = { value: T };",
    "type Box = { value: unknown };",
    "type List = unknown[];",
    "type Dict = Record<string, unknown>;",
    "type Fn = (value: unknown) => void;",
    "type Wrap<T> = T; type Value = Wrap<string>;",
    "type Cond<T> = T extends string ? unknown : never;",
    "interface Foo { value: unknown }",
  ],
  invalid: [
    { name: "direct", code: "type Loose = unknown;", errors: [error("Loose")] },
    {
      name: "alias chain",
      code: "type A = unknown; type B = A;",
      errors: [error("A"), error("B")],
    },
    {
      name: "forward reference",
      code: "type B = A; type A = unknown;",
      errors: [error("B"), error("A")],
    },
    {
      name: "union containing unknown",
      code: "type Loose = string | unknown;",
      errors: [error("Loose")],
    },
    { name: "parenthesized", code: "type Loose = (unknown);", errors: [error("Loose")] },
    {
      name: "transparent generic instantiation",
      code: "type Wrap<T> = T; type Loose = Wrap<unknown>;",
      errors: [error("Loose")],
    },
    { name: "exported", code: "export type Loose = unknown;", errors: [error("Loose")] },
    {
      name: "block scoped",
      code: "function f() { type Loose = unknown; }",
      errors: [error("Loose")],
    },
  ],
});
