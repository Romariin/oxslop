import { tester } from "../../test/tester.ts";
import rule from "./no-unknown-returns.ts";

const error = (type: string) => ({ messageId: "unknownReturn", data: { type } });

tester.run("oxslop/no-unknown-returns", rule, {
  valid: [
    "function f() { return value; }",
    "function f(): string { return ''; }",
    "const f = (): Promise<string> => fetch();",
    "function f(value: unknown): value is Foo { return true; }",
    "function f(value: unknown): asserts value is Foo {}",
    "async function f(): Promise<void> {}",
    "function f(): Array<unknown> { return []; }",
    "function f(): Record<string, unknown> { return {}; }",
    "function f(): { value: unknown } { return { value: 1 }; }",
    "type Wrap<T> = T; function f(): Wrap<string> { return ''; }",
    "type Result = Promise<string>; function f(): Result { return fetch(); }",
    "function f(value: unknown) { return value; }",
    "interface A { run(): string; }",
  ],
  invalid: [
    { name: "unknown", code: "function f(): unknown { return 1; }", errors: [error("unknown")] },
    { name: "arrow", code: "const f = (): unknown => 1;", errors: [error("unknown")] },
    {
      name: "method",
      code: "class A { run(): unknown { return 1; } }",
      errors: [error("unknown")],
    },
    {
      name: "method signature",
      code: "interface A { run(): unknown; }",
      errors: [error("unknown")],
    },
    { name: "function type", code: "type F = () => unknown;", errors: [error("unknown")] },
    {
      name: "declare function",
      code: "declare function f(): unknown;",
      errors: [error("unknown")],
    },
    {
      name: "Promise<unknown>",
      code: "async function f(): Promise<unknown> { return 1; }",
      errors: [error("Promise<unknown>")],
    },
    {
      name: "PromiseLike<unknown>",
      code: "function f(): PromiseLike<unknown> { return p; }",
      errors: [error("PromiseLike<unknown>")],
    },
    {
      name: "union with unknown",
      code: "function f(): string | unknown { return 1; }",
      errors: [error("unknown")],
    },
    {
      name: "promise of union with unknown",
      code: "async function f(): Promise<string | unknown> { return 1; }",
      errors: [error("Promise<unknown>")],
    },
    {
      name: "alias",
      code: "type Loose = unknown; function f(): Loose { return 1; }",
      errors: [error("unknown")],
    },
    {
      name: "alias to promise",
      code: "type Loose = Promise<unknown>; function f(): Loose { return p; }",
      errors: [error("Promise<unknown>")],
    },
    {
      name: "aliased promise argument",
      code: "type Loose = unknown; async function f(): Promise<Loose> { return 1; }",
      errors: [error("Promise<unknown>")],
    },
    {
      name: "union of promises",
      code: "function f(): Promise<string> | Promise<unknown> { return p; }",
      errors: [error("Promise<unknown>")],
    },
  ],
});
