import { tester } from "../../test/tester.ts";
import rule from "./no-chained-type-assertions.ts";

const error = { messageId: "chainedAssertion" };

tester.run("oxslop/no-chained-type-assertions", rule, {
  valid: [
    "const value = input as string;",
    "const value = <string>input;",
    "const tuple = [1, 2] as const;",
    "const tuple = ([1, 2] as const) as const;",
    "const tuple = ([1, 2] as const) as readonly number[];",
    "const tuple = (['a'] as readonly string[]) as const;",
    "const tuple = <const>(<const>[1]);",
    "const value = (input satisfies Shape) as Shape;",
    "const value = (input as Shape) satisfies Shape;",
    "const value = (input as Shape).field as string;",
    "const value = fn(input as Shape) as string;",
  ],
  invalid: [
    { name: "as unknown as", code: "const value = input as unknown as Shape;", errors: [error] },
    { name: "as any as", code: "const value = input as any as Shape;", errors: [error] },
    {
      name: "parenthesized chain",
      code: "const value = (input as Loose) as Shape;",
      errors: [error],
    },
    { name: "angle brackets", code: "const value = <Shape>(<unknown>input);", errors: [error] },
    { name: "mixed syntax", code: "const value = <Shape>(input as unknown);", errors: [error] },
    {
      name: "three links reported once at the outermost",
      code: "const value = input as unknown as Loose as Shape;",
      errors: [error],
    },
    {
      name: "const link does not excuse two loose links",
      code: "const value = (input as const) as unknown as Shape;",
      errors: [error],
    },
    { name: "in a call argument", code: "fn(input as unknown as Shape);", errors: [error] },
  ],
});
