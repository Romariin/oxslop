import { tester } from "../../test/tester.ts";
import rule from "./no-optional-function-parameters.ts";

const error = (name: string) => ({ messageId: "optionalParameter", data: { name } });

tester.run("oxslop/no-optional-function-parameters", rule, {
  valid: [
    "function f(a: string, b: number | undefined) {}",
    "function f(a: string, b = 1) {}",
    "const f = (a: string, { b }: Options = {}) => a;",
    "function f(this: Window, a: string) {}",
    "interface Options { b?: number }",
    "type T = { b?: number };",
    "class A { b?: number; }",
    "function f(...rest: string[]) {}",
    "type Fn = (a: string, b: number | undefined) => void;",
    "interface I { m(a: string, b: number | undefined): void }",
    "class A { constructor(private readonly b: number | undefined) {} }",
    { code: "function f(a: string, b?: number) {}", options: [{ allowLast: true }] },
    { code: "const f = (b?: number) => b;", options: [{ allowLast: true }] },
    { code: "interface I { m(a: string, b?: number): void }", options: [{ allowLast: true }] },
  ],
  invalid: [
    { name: "function declaration", code: "function f(a?: string) {}", errors: [error("a")] },
    { name: "arrow function", code: "const f = (a?: string) => a;", errors: [error("a")] },
    {
      name: "function expression",
      code: "const f = function (a?: string) {};",
      errors: [error("a")],
    },
    { name: "class method", code: "class A { m(a?: string) {} }", errors: [error("a")] },
    {
      name: "parameter property",
      code: "class A { constructor(private a?: string) {} }",
      errors: [error("a")],
    },
    { name: "method signature", code: "interface I { m(a?: string): void }", errors: [error("a")] },
    { name: "function type", code: "type Fn = (a?: string) => void;", errors: [error("a")] },
    { name: "call signature", code: "interface I { (a?: string): void }", errors: [error("a")] },
    {
      name: "declare function",
      code: "declare function f(a?: string): void;",
      errors: [error("a")],
    },
    {
      name: "destructured parameter",
      code: "type Fn = ({ a }?: Options) => void;",
      errors: [error("{ ... }")],
    },
    {
      name: "array pattern parameter",
      code: "type Fn = ([a]?: Pair) => void;",
      errors: [error("[ ... ]")],
    },
    {
      name: "several",
      code: "function f(a?: string, b?: number) {}",
      errors: [error("a"), error("b")],
    },
    {
      name: "allowLast keeps only the trailing one",
      code: "function f(a?: string, b?: number) {}",
      options: [{ allowLast: true }],
      errors: [error("a")],
    },
    {
      name: "allowLast ignores a trailing default",
      code: "function f(a?: string, b = 1) {}",
      options: [{ allowLast: true }],
      errors: [error("a")],
    },
  ],
});
