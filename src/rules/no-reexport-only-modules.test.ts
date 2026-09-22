import { tester } from "../../test/tester.ts";
import rule from "./no-reexport-only-modules.ts";

const error = { messageId: "barrel" };

tester.run("oxslop/no-reexport-only-modules", rule, {
  valid: [
    "",
    "export const a = 1;",
    "export * from './a'; export const b = 2;",
    "import { a } from './a'; export const b = a + 1;",
    "import { a } from './a'; export { a }; console.log(a);",
    "import { a } from './a'; export { a }; import './polyfill';",
    "export { a } from './a'; export default function main() {}",
    "export type { A } from './a'; export interface B { a: A }",
    "const a = 1; export { a };",
    "export default 42;",
    "import { a } from './a'; export default a(); ",
    "import { a } from './a';",
    "export {} from './register';",
    "export {} from './register'; export { a } from './a';",
    {
      code: "export * from './a';",
      filename: "src/index.ts",
      options: [{ allowFiles: ["index."] }],
    },
    {
      code: "export * from './a';",
      filename: "src/public-api.ts",
      options: [{ allowFiles: ["public-api"] }],
    },
  ],
  invalid: [
    { name: "export star", code: "export * from './a';", errors: [error] },
    { name: "export star as namespace", code: "export * as ns from './a';", errors: [error] },
    {
      name: "named re-exports",
      code: "export { a, b as c } from './a';\nexport { d } from './d';",
      errors: [error],
    },
    { name: "type re-export", code: "export type { A } from './a';", errors: [error] },
    {
      name: "import then export",
      code: "import { a } from './a';\nimport b from './b';\nexport { a, b };",
      errors: [error],
    },
    {
      name: "import then default export",
      code: "import { a } from './a';\nexport default a;",
      errors: [error],
    },
    {
      name: "namespace import re-exported",
      code: "import * as ns from './a';\nexport { ns };",
      errors: [error],
    },
    {
      name: "allowFiles does not match",
      code: "export * from './a';",
      filename: "src/index.ts",
      options: [{ allowFiles: ["public-api"] }],
      errors: [error],
    },
  ],
});
