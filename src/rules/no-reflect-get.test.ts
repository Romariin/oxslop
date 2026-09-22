import { tester } from "../../test/tester.ts";
import rule from "./no-reflect-get.ts";

const error = { messageId: "reflectGet" };

tester.run("oxslop/no-reflect-get", rule, {
  valid: [
    "const value = owner.property;",
    "const value = owner[key];",
    "Reflect.set(owner, key, value);",
    "const Reflect = { get() { return 1; } }; Reflect.get();",
    "function read(Reflect: { get(): number }) { return Reflect.get(); }",
    "{ const Reflect = { get: () => 1 }; Reflect.get(); }",
  ],
  invalid: [
    { name: "static access", code: "const value = Reflect.get(owner, key);", errors: [error] },
    { name: "computed access", code: "const value = Reflect['get'](owner, key);", errors: [error] },
    { name: "template access", code: "const value = Reflect[`get`](owner, key);", errors: [error] },
    {
      name: "shadow in sibling scope does not leak",
      code: "{ const Reflect = { get: () => 1 }; } Reflect.get(a, b);",
      errors: [error],
    },
  ],
});
