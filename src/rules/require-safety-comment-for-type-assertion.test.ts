import { tester } from "../../test/tester.ts";
import rule from "./require-safety-comment-for-type-assertion.ts";

const error = { messageId: "missingSafetyComment" };

tester.run("oxslop/require-safety-comment-for-type-assertion", rule, {
  valid: [
    "const tuple = [1, 2] as const;",
    "const tuple = <const>[1, 2];",
    "const value = input satisfies Shape;",
    "const value = input!;",
    "// SAFETY: the element is created in this module\nconst root = node as HTMLElement;",
    "const root = node as HTMLElement; // SAFETY: created above",
    "/* SAFETY: created above */ const root = node as HTMLElement;",
    "const root = /* SAFETY: created above */ node as HTMLElement;",
    "/** SAFETY: created above */\nconst root = node as HTMLElement;",
    "/**\n * SAFETY: created above\n */\nconst root = node as HTMLElement;",
    "// Some other note\n// SAFETY: created above\nconst root = node as HTMLElement;",
    "// SAFETY: created above\n// followed by more detail\nconst root = node as HTMLElement;",
    "// SAFETY: both come from the same parser\nconst pair = [a as Left, b as Right];",
    "// SAFETY: exported node\nexport const root = node as HTMLElement;",
    "function f() {\n  // SAFETY: checked by caller\n  return node as HTMLElement;\n}",
    "if (ok) {\n  // SAFETY: checked by caller\n  use(node as HTMLElement);\n}",
    "class A {\n  // SAFETY: created in constructor\n  root = node as HTMLElement;\n}",
    "const value = <HTMLElement>node; // SAFETY: created above",
    {
      code: "// TRUSTED: created above\nconst root = node as HTMLElement;",
      options: [{ markers: ["TRUSTED"] }],
    },
    {
      code: "// SAFETY: created above\nconst root = node as HTMLElement;",
      options: [{ markers: ["TRUSTED", "SAFETY"] }],
    },
  ],
  invalid: [
    { name: "bare as", code: "const root = node as HTMLElement;", errors: [error] },
    { name: "bare angle bracket", code: "const root = <HTMLElement>node;", errors: [error] },
    {
      name: "unrelated comment",
      code: "// created above\nconst root = node as HTMLElement;",
      errors: [error],
    },
    {
      name: "marker without reason",
      code: "// SAFETY:\nconst root = node as HTMLElement;",
      errors: [error],
    },
    {
      name: "marker without colon",
      code: "// SAFETY created above\nconst root = node as HTMLElement;",
      errors: [error],
    },
    {
      name: "blank line between comment and statement",
      code: "// SAFETY: created above\n\nconst root = node as HTMLElement;",
      errors: [error],
    },
    {
      name: "comment above the outer block does not reach inside",
      code: "// SAFETY: created above\nfunction f() {\n  return node as HTMLElement;\n}",
      errors: [error],
    },
    {
      name: "comment on a later line",
      code: "const root = node as HTMLElement;\n// SAFETY: created above",
      errors: [error],
    },
    {
      name: "each unjustified assertion is reported",
      code: "const pair = [a as Left, b as Right];",
      errors: [error, error],
    },
    {
      name: "custom marker replaces the default",
      code: "// SAFETY: created above\nconst root = node as HTMLElement;",
      options: [{ markers: ["TRUSTED"] }],
      errors: [error],
    },
  ],
});
