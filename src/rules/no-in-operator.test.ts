import { tester } from "../../test/tester.ts";
import rule from "./no-in-operator.ts";

const error = { messageId: "inOperator" };

tester.run("oxslop/no-in-operator", rule, {
  valid: [
    "for (const key in object) { use(key); }",
    "if (value._tag === 'Some') { use(value.value); }",
    "class Box { #brand = 1; static is(value: object) { return #brand in value; } }",
    "function isUser(value: object): value is User { return 'id' in value; }",
    "const isUser = (value: object): value is User => 'id' in value && 'name' in value;",
    "function assertUser(value: object): asserts value is User { if (!('id' in value)) throw new Error(); }",
    "function isUser(value: object): value is User { return keys.every((key) => key in value); }",
    "type Guard = (value: object) => boolean; const guard: Guard = (value) => value !== null;",
  ],
  invalid: [
    { name: "string key probe", code: "if ('id' in value) { use(value.id); }", errors: [error] },
    { name: "identifier key probe", code: "const has = key in object;", errors: [error] },
    { name: "negated probe", code: "if (!('id' in value)) { fail(); }", errors: [error] },
    {
      name: "plain boolean function is not a predicate",
      code: "function hasId(value: object): boolean { return 'id' in value; }",
      errors: [error],
    },
    {
      name: "predicate allowance disabled",
      code: "function isUser(value: object): value is User { return 'id' in value; }",
      options: [{ allowInTypePredicates: false }],
      errors: [error],
    },
    {
      name: "multiple probes report each",
      code: "const ok = 'id' in value && 'name' in value;",
      errors: [error, error],
    },
  ],
});
