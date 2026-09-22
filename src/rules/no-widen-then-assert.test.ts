import { tester } from "../../test/tester.ts";
import rule from "./no-widen-then-assert.ts";

const error = { messageId: "widenThenAssert" };

tester.run("oxslop/no-widen-then-assert", rule, {
  valid: [
    "const user = { id: 1 }; use(user.id);",
    "const user: User = { id: 1 }; use(user as Admin);",
    "const input: unknown = JSON.parse(text); use(input as User);",
    "const input: unknown = { id: 1 }; use(input);",
    "const input: unknown = { id: 1 }; use(input as unknown);",
    "const input = { id: 1 } as const; use(input as const);",
    "let input: unknown = { id: 1 }; input = load(); use(input as User);",
    "var input: unknown = { id: 1 }; use(input as User);",
    "const input: unknown = { id: 1 }; function later() { return input as User; }",
    "function outer() { const input: unknown = { id: 1 }; return () => input as User; }",
    "function read(input: unknown) { return input as User; }",
    "const input: unknown = { id: 1 }; const [first] = [input] as User[];",
    "type Payload = { id: number }; const input: Payload = { id: 1 }; use(input as User);",
  ],
  invalid: [
    {
      name: "unknown annotation",
      code: "const input: unknown = { id: 1 }; use(input as User);",
      errors: [error],
    },
    {
      name: "any annotation",
      code: "const input: any = [1, 2]; use(input as number[]);",
      errors: [error],
    },
    {
      name: "object annotation",
      code: "const input: object = new Box(); use(input as Box);",
      errors: [error],
    },
    {
      name: "empty type literal",
      code: "const input: {} = 'text'; use(input as string);",
      errors: [error],
    },
    {
      name: "wide dictionary",
      code: "const input: Record<string, unknown> = { id: 1 }; use(input as User);",
      errors: [error],
    },
    {
      name: "angle bracket assertion",
      code: "const input: unknown = { id: 1 }; use(<User>input);",
      errors: [error],
    },
    {
      name: "parenthesised subject",
      code: "const input: unknown = { id: 1 }; use((input) as User);",
      errors: [error],
    },
    {
      name: "widened by initializer assertion",
      code: "const input = { id: 1 } as unknown; use(input as User);",
      errors: [error],
    },
    {
      name: "never-reassigned let",
      code: "let input: unknown = { id: 1 }; use(input as User);",
      errors: [error],
    },
    {
      name: "same-file alias resolves to unknown",
      code: "type Json = unknown; const input: Json = { id: 1 }; use(input as User);",
      errors: [error],
    },
    {
      name: "inside one function",
      code: "function build() { const input: unknown = () => 1; return input as () => number; }",
      errors: [error],
    },
    {
      name: "each assertion reported",
      code: "const input: unknown = { id: 1 }; use(input as User); use(input as Admin);",
      errors: [error, error],
    },
  ],
});
