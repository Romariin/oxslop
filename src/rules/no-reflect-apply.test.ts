import { tester } from "../../test/tester.ts";
import rule from "./no-reflect-apply.ts";

const error = { messageId: "reflectApply" };

tester.run("oxslop/no-reflect-apply", rule, {
  valid: [
    "operation(...args);",
    "operation.call(owner, ...args);",
    "operation.apply(owner, args);",
    "Reflect.ownKeys(owner);",
    "const Reflect = { apply() { return 1; } }; Reflect.apply();",
    "function run(Reflect: { apply(): number }) { return Reflect.apply(); }",
    "{ const Reflect = { apply: () => 1 }; Reflect.apply(); }",
  ],
  invalid: [
    {
      name: "static access",
      code: "const value = Reflect.apply(operation, owner, args);",
      errors: [error],
    },
    {
      name: "computed access",
      code: "const value = Reflect['apply'](operation, owner, args);",
      errors: [error],
    },
    {
      name: "template access",
      code: "const value = Reflect[`apply`](operation, owner, args);",
      errors: [error],
    },
    {
      name: "shadow in sibling scope does not leak",
      code: "{ const Reflect = { apply: () => 1 }; } Reflect.apply(operation, owner, args);",
      errors: [error],
    },
  ],
});
