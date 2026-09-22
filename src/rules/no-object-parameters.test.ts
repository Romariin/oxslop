import { tester } from "../../test/tester.ts";
import rule from "./no-object-parameters.ts";

const error = { messageId: "objectParameter" };

tester.run("oxslop/no-object-parameters", rule, {
  valid: [
    "function f(value: string) {}",
    "function f(value) {}",
    "function f(value: { id: string }) {}",
    "function f(value: Record<string, unknown>) {}",
    "function f(value: {}) {}",
    "function f(value: Object) {}",
    "function isFoo(value: object): value is Foo { return true; }",
    "function assertFoo(value: object): asserts value is Foo {}",
    "function f(value: { nested: object }) {}",
    "function f(values: Array<object>) {}",
    "type Wrap<T> = T; function f(value: Wrap<string>) {}",
    "function f(...args: string[]) {}",
    "function f(): object { return {}; }",
  ],
  invalid: [
    { name: "function declaration", code: "function f(value: object) {}", errors: [error] },
    { name: "arrow function", code: "const f = (value: object) => value;", errors: [error] },
    { name: "method", code: "class A { run(value: object) {} }", errors: [error] },
    {
      name: "method signature",
      code: "interface A { run(value: object): void; }",
      errors: [error],
    },
    { name: "function type", code: "type Handler = (value: object) => void;", errors: [error] },
    { name: "constructor type", code: "type Ctor = new (value: object) => A;", errors: [error] },
    {
      name: "union containing object",
      code: "function f(value: object | null) {}",
      errors: [error],
    },
    {
      name: "same-file alias",
      code: "type Loose = object; function f(value: Loose) {}",
      errors: [error],
    },
    {
      name: "aliased union",
      code: "type Loose = object | undefined; function f(value: Loose) {}",
      errors: [error],
    },
    { name: "destructured", code: "function f({ a }: object) {}", errors: [error] },
    { name: "default value", code: "function f(value: object = {}) {}", errors: [error] },
    {
      name: "parameter property",
      code: "class A { constructor(readonly value: object) {} }",
      errors: [error],
    },
    { name: "rest array", code: "function f(...args: object[]) {}", errors: [error] },
    { name: "rest tuple", code: "function f(...args: [object, string]) {}", errors: [error] },
    {
      name: "named variadic tuple element",
      code: "function f(...args: [head: string, ...tail: object[]]) {}",
      errors: [error],
    },
    {
      name: "predicate subject exemption is per name",
      code: "function isFoo(value: object, other: object): value is Foo { return true; }",
      errors: [error],
    },
    {
      name: "each parameter reported",
      code: "function f(a: object, b: object) {}",
      errors: [error, error],
    },
  ],
});
