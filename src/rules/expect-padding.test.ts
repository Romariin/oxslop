import { tester } from "../../test/tester.ts";
import rule from "./expect-padding.ts";

tester.run("oxslop/expect-padding", rule, {
  valid: [
    "test('a', () => {\n  const value = compute();\n\n  expect(value).toBe(1);\n  expect(value).not.toBe(2);\n});",
    "test('a', () => {\n  expect(compute()).toBe(1);\n  expect(other()).toBe(2);\n});",
    "test('a', () => {\n  const value = compute();\n\n  expect(value).toBe(1);\n});",
    "test('a', async () => {\n  const promise = load();\n\n  await expect(promise).resolves.toBe(1);\n  expect.soft(1).toBe(1);\n\n  cleanup();\n});",
    "test('a', () => {\n  const value = compute();\n  // documented\n\n  expect(value).toBe(1);\n});",
    "test('a', () => {\n  const value = compute();\n\n  // documented\n  expect(value).toBe(1);\n});",
    "test('a', () => {\n  expect(value).toBe(1);\n\n\n  cleanup();\n});",
    "test('a', () => {\n  const expected = expect.objectContaining({ a: 1 });\n  check(expected);\n});",
    "test('a', () => {\n  act();\n  expect;\n});",
    "function f() {\n  setup();\n  run();\n}",
  ],
  invalid: [
    {
      name: "missing blank before run",
      code: "test('a', () => {\n  const value = compute();\n  expect(value).toBe(1);\n});",
      output: "test('a', () => {\n  const value = compute();\n\n  expect(value).toBe(1);\n});",
      errors: [{ messageId: "beforeRun" }],
    },
    {
      name: "missing blank after run",
      code: "test('a', () => {\n  expect(value).toBe(1);\n  expect(value).toBe(2);\n  cleanup();\n});",
      output:
        "test('a', () => {\n  expect(value).toBe(1);\n  expect(value).toBe(2);\n\n  cleanup();\n});",
      errors: [{ messageId: "afterRun" }],
    },
    {
      name: "missing on both sides",
      code: "test('a', () => {\n  act();\n  expect(a).toBe(1);\n  expect(b).toBe(2);\n  reset();\n});",
      output:
        "test('a', () => {\n  act();\n\n  expect(a).toBe(1);\n  expect(b).toBe(2);\n\n  reset();\n});",
      errors: [{ messageId: "beforeRun" }, { messageId: "afterRun" }],
    },
    {
      name: "awaited and soft expects",
      code: "test('a', async () => {\n  const p = load();\n  await expect(p).resolves.toBe(1);\n  expect.soft(2).toBe(2);\n});",
      output:
        "test('a', async () => {\n  const p = load();\n\n  await expect(p).resolves.toBe(1);\n  expect.soft(2).toBe(2);\n});",
      errors: [{ messageId: "beforeRun" }],
    },
    {
      name: "leading comment stays attached to the expect",
      code: "test('a', () => {\n  const value = compute(); // trailing\n  // asserts\n  expect(value).toBe(1);\n});",
      output:
        "test('a', () => {\n  const value = compute(); // trailing\n\n  // asserts\n  expect(value).toBe(1);\n});",
      errors: [{ messageId: "beforeRun" }],
    },
    {
      name: "two runs split by a statement",
      code: "test('a', () => {\n  expect(a).toBe(1);\n  act();\n  expect(b).toBe(2);\n});",
      output: "test('a', () => {\n  expect(a).toBe(1);\n\n  act();\n\n  expect(b).toBe(2);\n});",
      errors: [{ messageId: "afterRun" }, { messageId: "beforeRun" }],
    },
    {
      name: "same line",
      code: "test('a', () => { act(); expect(a).toBe(1); });",
      output: "test('a', () => { act();\n\n expect(a).toBe(1); });",
      errors: [{ messageId: "beforeRun" }],
    },
  ],
});
