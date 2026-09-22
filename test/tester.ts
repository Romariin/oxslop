import { RuleTester } from "oxlint/plugins-dev";

/** TypeScript-parsing tester shared by every rule test. Use `tsx` for JSX cases. */
export const tester = new RuleTester({
  languageOptions: { parserOptions: { lang: "ts" }, env: { builtin: true } },
});

export const tsx = new RuleTester({
  languageOptions: { parserOptions: { lang: "tsx" }, env: { builtin: true } },
});
