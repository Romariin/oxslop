import { tester } from "../../test/tester.ts";
import rule from "./no-conditional-empty-object-spread.ts";

const error = { messageId: "conditionalSpread" };

tester.run("oxslop/no-conditional-empty-object-spread", rule, {
  valid: [
    "const options = { ...defaults, timeout };",
    "const options = { ...(mode === 'fast' ? { timeout: 1 } : { timeout: 10 }) };",
    "const options = { ...(override ?? defaults) };",
    "const options = { ...(flag ? fast : slow) };",
    "const items = [...(flag ? [1] : [])];",
    "call(...(flag ? [1] : []));",
    "const options = { ...(flag && defaults) };",
    "const options = { ...load() };",
  ],
  invalid: [
    {
      name: "empty alternate",
      code: "const options = { ...(timeout !== undefined ? { timeout } : {}) };",
      errors: [error],
    },
    {
      name: "empty consequent",
      code: "const options = { ...(skip ? {} : { timeout }) };",
      errors: [error],
    },
    {
      name: "logical and",
      code: "const options = { ...(timeout && { timeout }) };",
      errors: [error],
    },
    {
      name: "nullish empty fallback",
      code: "const options = { ...(override ?? {}) };",
      errors: [error],
    },
    {
      name: "or empty fallback",
      code: "const options = { ...(override || {}) };",
      errors: [error],
    },
    {
      name: "nested parentheses",
      code: "const options = { ...((flag ? { a: 1 } : {})) };",
      errors: [error],
    },
    {
      name: "each spread reported",
      code: "const options = { ...(a ? { a } : {}), b, ...(c && { c }) };",
      errors: [error, error],
    },
  ],
});
