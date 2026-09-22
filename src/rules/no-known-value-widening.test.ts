import { tester } from "../../test/tester.ts";
import rule from "./no-known-value-widening.ts";

const error = { messageId: "knownValueWidening" };

tester.run("oxslop/no-known-value-widening", rule, {
  valid: [
    "const user = { id: 1 };",
    "const user: User = { id: 1 };",
    "const user = { id: 1 } satisfies Record<string, unknown>;",
    "const input: unknown = JSON.parse(text);",
    "const input: unknown = value;",
    "const input: unknown = owner.value;",
    "const acc: Record<string, unknown> = {};",
    "const acc: { [key: string]: unknown } = {};",
    "const acc: Partial<Record<string, unknown>> = {};",
    "const handlers: Record<Kind, Handler> = { start: startHandler };",
    "let state: unknown = null; state = load();",
    "var legacy: unknown = 1;",
    "function read(input: unknown = load()) { return input; }",
    "function read(input: User = { id: 1 }) { return input; }",
    "function read(): unknown { return load(); }",
    "function read(): User { return { id: 1 }; }",
    "const read = (): unknown => load();",
    "const read = (): Record<string, unknown> => ({});",
    "type Guard = (value: unknown) => boolean;",
  ],
  invalid: [
    { name: "unknown const", code: "const input: unknown = { id: 1 };", errors: [error] },
    { name: "object const", code: "const input: object = new Box();", errors: [error] },
    { name: "empty type literal", code: "const input: {} = 'text';", errors: [error] },
    {
      name: "open dictionary with keys",
      code: "const handlers: Record<string, unknown> = { start: 1 };",
      errors: [error],
    },
    { name: "empty object into unknown", code: "const input: unknown = {};", errors: [error] },
    { name: "arrow into unknown", code: "const handler: unknown = () => 1;", errors: [error] },
    {
      name: "class expression into unknown",
      code: "const Box: unknown = class {};",
      errors: [error],
    },
    {
      name: "template literal into unknown",
      code: "const name: unknown = `user`;",
      errors: [error],
    },
    {
      name: "as const into unknown",
      code: "const kinds: unknown = ['a', 'b'] as const;",
      errors: [error],
    },
    { name: "never-reassigned let", code: "let input: unknown = { id: 1 };", errors: [error] },
    { name: "wide union", code: "const input: unknown | string = { id: 1 };", errors: [error] },
    {
      name: "same-file alias resolves to wide",
      code: "type Json = Record<string, unknown>; const input: Json = { id: 1 };",
      errors: [error],
    },
    {
      name: "parameter default",
      code: "function read(input: unknown = { id: 1 }) { return input; }",
      errors: [error],
    },
    {
      name: "return in wide function",
      code: "function read(): unknown { return { id: 1 }; }",
      errors: [error],
    },
    {
      name: "arrow expression body",
      code: "const read = (): object => ({ id: 1 });",
      errors: [error],
    },
    {
      name: "return inside nested arrow uses inner type",
      code: "function outer(): User { return items.map((): unknown => { return { id: 1 }; }); }",
      errors: [error],
    },
  ],
});
