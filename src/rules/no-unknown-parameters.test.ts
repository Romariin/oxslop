import { tester } from "../../test/tester.ts";
import rule from "./no-unknown-parameters.ts";

const error = { messageId: "unknownParameter" };

tester.run("oxslop/no-unknown-parameters", rule, {
  valid: [
    "function f(value: string) {}",
    "function f(value) {}",
    "const f = (value: string | number) => value;",
    "function f(cause: unknown) {}",
    "class E extends Error { constructor(message: string, cause: unknown) { super(message, { cause }); } }",
    "function isFoo(value: unknown): value is Foo { return true; }",
    "const isFoo = (value: unknown): value is Foo => true;",
    "function assertFoo(value: unknown): asserts value is Foo {}",
    "type Guard = (value: unknown) => value is Foo;",
    "interface Guards { isFoo(value: unknown): value is Foo; }",
    "function f(values: unknown[]) {}",
    "function f(value: Record<string, unknown>) {}",
    "function f(value: { nested: unknown }) {}",
    "type Wrap<T> = T; function f(value: Wrap<string>) {}",
    "function f(...args: string[]) {}",
    "function f(...args: [string, number]) {}",
    { code: "function f(input: unknown) {}", options: [{ allowNames: ["input"] }] },
  ],
  invalid: [
    {
      name: "recursive union still checks its unknown branch",
      code: "type U = U | unknown; function f(value: U) {}",
      errors: [error],
    },
    {
      name: "recursive narrow union does not hide nearby unknown parameter",
      code: "type U = U | string; function narrow(value: U) {}\nfunction wide(value: unknown) {}",
      errors: [{ ...error, line: 2 }],
    },
    {
      name: "readonly rest tuple",
      code: "function f(...args: readonly [unknown]) {}",
      errors: [error],
    },
    {
      name: "variadic rest tuple",
      code: "function f(...args: [...unknown[]]) {}",
      errors: [error],
    },
    {
      name: "union of rest tuples",
      code: "function f(...args: [string] | [unknown]) {}",
      errors: [error],
    },
    { name: "function declaration", code: "function f(value: unknown) {}", errors: [error] },
    { name: "arrow function", code: "const f = (value: unknown) => value;", errors: [error] },
    { name: "method", code: "class A { run(value: unknown) {} }", errors: [error] },
    {
      name: "method signature",
      code: "interface A { run(value: unknown): void; }",
      errors: [error],
    },
    { name: "function type", code: "type Handler = (value: unknown) => void;", errors: [error] },
    { name: "call signature", code: "interface A { (value: unknown): void; }", errors: [error] },
    {
      name: "declare function",
      code: "declare function f(value: unknown): void;",
      errors: [error],
    },
    {
      name: "union containing unknown",
      code: "function f(value: string | unknown) {}",
      errors: [error],
    },
    {
      name: "same-file alias",
      code: "type Loose = unknown; function f(value: Loose) {}",
      errors: [error],
    },
    {
      name: "aliased union",
      code: "type Loose = string | unknown; function f(value: Loose) {}",
      errors: [error],
    },
    { name: "destructured", code: "function f({ a }: unknown) {}", errors: [error] },
    { name: "default value", code: "function f(value: unknown = 1) {}", errors: [error] },
    {
      name: "parameter property",
      code: "class A { constructor(private value: unknown) {} }",
      errors: [error],
    },
    { name: "rest array", code: "function f(...args: unknown[]) {}", errors: [error] },
    {
      name: "rest Array reference",
      code: "function f(...args: Array<unknown>) {}",
      errors: [error],
    },
    { name: "rest tuple", code: "function f(...args: [string, unknown]) {}", errors: [error] },
    {
      name: "predicate subject exemption is per name",
      code: "function isFoo(value: unknown, other: unknown): value is Foo { return true; }",
      errors: [error],
    },
    {
      name: "cause exemption is disabled by options",
      code: "function f(cause: unknown) {}",
      options: [{ allowNames: [] }],
      errors: [error],
    },
    {
      name: "each parameter reported",
      code: "function f(a: unknown, b: unknown) {}",
      errors: [error, error],
    },
  ],
});
