import { tester } from "../../test/tester.ts";
import rule from "./no-disable-validation.ts";

const error = { messageId: "disableValidation" };

tester.run("oxslop/no-disable-validation", rule, {
  valid: [
    "const user = new User({ name }, { disableValidation: false });",
    "const user = new User({ name });",
    "const disableValidation = true; if (disableValidation) { skip(); }",
    "const options = { disableValidation };",
    "const options = { disableValidation: flag };",
    "const options = { validate: true };",
    "type Options = { disableValidation: true };",
    'const options = { disableValidation: "true" };',
    "const { disableValidation = true } = options;",
    "const options = { [disableValidation]: true };",
  ],
  invalid: [
    {
      name: "identifier key",
      code: "new User({ name }, { disableValidation: true });",
      errors: [error],
    },
    {
      name: "string key",
      code: 'new User({ name }, { "disableValidation": true });',
      errors: [error],
    },
    {
      name: "computed string key",
      code: 'new User({ name }, { ["disableValidation"]: true });',
      errors: [error],
    },
    {
      name: "standalone options object",
      code: "const options = { disableValidation: true }; Schema.decodeSync(S)(input, options);",
      errors: [error],
    },
    {
      name: "nested in another object",
      code: "const config = { decode: { disableValidation: true } };",
      errors: [error],
    },
    {
      name: "as const",
      code: "const options = { disableValidation: true } as const;",
      errors: [error],
    },
  ],
});
