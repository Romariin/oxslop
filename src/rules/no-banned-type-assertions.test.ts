import { tester } from "../../test/tester.ts";
import rule from "./no-banned-type-assertions.ts";

const error = (type: string) => ({ messageId: "bannedAssertion", data: { type } });

tester.run("oxslop/no-banned-type-assertions", rule, {
  valid: [
    "const tuple = [1, 2] as const;",
    "const tuple = <const>[1, 2];",
    "const value = input as string;",
    "const value = <number>input;",
    "const value = input satisfies unknown;",
    "const value = input as string | number;",
    "type Id = string; const value = input as Id;",
    "type Wrap<T> = T; const value = input as Wrap<string>;",
    "const value = input as Array<unknown>;",
    "const value = input as { key: unknown };",
    { code: "const value = input as unknown;", options: [{ banned: ["any"] }] },
    { code: "const value = input as never;", options: [{ banned: ["any", "unknown"] }] },
  ],
  invalid: [
    { name: "as any", code: "const value = input as any;", errors: [error("any")] },
    { name: "as never", code: "const value = input as never;", errors: [error("never")] },
    { name: "as unknown", code: "const value = input as unknown;", errors: [error("unknown")] },
    { name: "angle bracket any", code: "const value = <any>input;", errors: [error("any")] },
    {
      name: "angle bracket unknown",
      code: "const value = <unknown>input;",
      errors: [error("unknown")],
    },
    {
      name: "same-file alias to unknown",
      code: "type Loose = unknown; const value = input as Loose;",
      errors: [error("unknown")],
    },
    {
      name: "alias chain to any",
      code: "type A = any; type B = A; const value = input as B;",
      errors: [error("any")],
    },
    {
      name: "union containing unknown",
      code: "const value = input as string | unknown;",
      errors: [error("unknown")],
    },
    {
      name: "aliased union containing any",
      code: "type Loose = string | any; const value = input as Loose;",
      errors: [error("any")],
    },
    {
      name: "transparent generic alias",
      code: "type Wrap<T> = T; const value = input as Wrap<never>;",
      errors: [error("never")],
    },
    {
      name: "chained through unknown reports the inner link",
      code: "const value = input as unknown as string;",
      errors: [error("unknown")],
    },
    {
      name: "option restricts the banned set",
      code: "const a = input as any; const b = input as unknown;",
      options: [{ banned: ["unknown"] }],
      errors: [error("unknown")],
    },
  ],
});
