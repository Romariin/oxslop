import { tester } from "../../test/tester.ts";
import rule from "./no-vague-identifiers.ts";

const error = (name: string) => ({ messageId: "vague", data: { name } });

tester.run("oxslop/no-vague-identifiers", rule, {
  valid: [
    "const user = load();",
    "const { data: user } = response;",
    "import { data } from './data';",
    "import * as utils from './utils';",
    "const user = payload.data;",
    "const config = { data: 1, result: 2 };",
    "type T = { data: string };",
    "function f(this: Window, user: string) {}",
    "const database = open();",
    "const value = 1;",
    "const item = list[0];",
    "class UserRepository {}",
    "try {} catch (error) {}",
    { code: "const data = 1;", options: [{ names: ["blob"] }] },
    { code: "const bytes = 1;", options: [{ names: ["blob"] }] },
  ],
  invalid: [
    { name: "variable", code: "const data = load();", errors: [error("data")] },
    { name: "let with digits", code: "let result2 = 1;", errors: [error("result2")] },
    { name: "leading underscore", code: "const _tmp = 1;", errors: [error("_tmp")] },
    { name: "uppercase", code: "const DATA = 1;", errors: [error("DATA")] },
    {
      name: "object destructuring shorthand",
      code: "const { data } = response;",
      errors: [error("data")],
    },
    {
      name: "object destructuring renamed",
      code: "const { body: obj } = response;",
      errors: [error("obj")],
    },
    {
      name: "array destructuring with default",
      code: "const [res = 1, ...stuff] = pair;",
      errors: [error("res"), error("stuff")],
    },
    { name: "function name", code: "function helper() {}", errors: [error("helper")] },
    { name: "function parameter", code: "function f(data: string) {}", errors: [error("data")] },
    { name: "arrow parameter", code: "list.map((val) => val);", errors: [error("val")] },
    {
      name: "destructured parameter",
      code: "const f = ({ info }: Props) => info;",
      errors: [error("info")],
    },
    {
      name: "parameter property",
      code: "class A { constructor(private readonly obj: B) {} }",
      errors: [error("obj")],
    },
    { name: "catch parameter", code: "try {} catch (thing) {}", errors: [error("thing")] },
    { name: "class name", code: "class Util {}", errors: [error("Util")] },
    { name: "class expression", code: "const A = class Misc {};", errors: [error("Misc")] },
    {
      name: "declare function",
      code: "declare function foo(bar: number): void;",
      errors: [error("foo"), error("bar")],
    },
    {
      name: "custom names",
      code: "const blob = 1;",
      options: [{ names: ["blob"] }],
      errors: [error("blob")],
    },
  ],
});
