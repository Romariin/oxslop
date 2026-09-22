import { tester } from "../../test/tester.ts";
import rule from "./prefer-effect-match.ts";

const error = { messageId: "preferMatch" };

tester.run("oxslop/prefer-effect-match", rule, {
  valid: [
    "const label = kind === 'a' ? 'A' : 'other';",
    "const label = kind === 'a' ? 'A' : other === 'b' ? 'B' : 'C';",
    "const label = kind === 'a' ? 'A' : kind == 'b' ? 'B' : 'C';",
    "const label = kind === 'a' ? 'A' : kind > 2 ? 'B' : 'C';",
    "const label = kind === 'a' ? 'A' : isB(kind) ? 'B' : 'C';",
    "const label = kind === other ? 'A' : kind === third ? 'B' : 'C';",
    "const label = kind === `${a}` ? 'A' : kind === `${b}` ? 'B' : 'C';",
    "const label = ok ? 'A' : ok2 ? 'B' : 'C';",
    "const label = kind === 'a' ? (mode === 1 ? 'A1' : 'A') : 'other';",
    "const label = Match.value(kind).pipe(Match.when('a', () => 'A'), Match.orElse(() => 'C'));",
    {
      name: "below custom minCases",
      code: "const label = kind === 'a' ? 'A' : kind === 'b' ? 'B' : 'C';",
      options: [{ minCases: 3 }],
    },
  ],
  invalid: [
    {
      name: "string literals",
      code: "const label = kind === 'a' ? 'A' : kind === 'b' ? 'B' : 'C';",
      errors: [{ ...error, data: { subject: "kind" } }],
    },
    {
      name: "number literals with member subject",
      code: "const label = state.code === 1 ? 'one' : state.code === 2 ? 'two' : state.code === 3 ? 'three' : 'many';",
      errors: [{ ...error, data: { subject: "state.code" } }],
    },
    {
      name: "mixed operators and literal on the left",
      code: "const v = x !== null ? a : 0 === x ? b : x === true ? c : d;",
      errors: [error],
    },
    {
      name: "template literal without expressions",
      code: "const v = x === `a` ? 1 : x === `b` ? 2 : 3;",
      errors: [error],
    },
    {
      name: "parenthesised nested ternary",
      code: "const v = x === 1 ? a : (x === 2 ? b : c);",
      errors: [error],
    },
    {
      name: "chain after unrelated outer ternary reports once",
      code: "const v = ok ? a : x === 1 ? b : x === 2 ? c : d;",
      errors: [error],
    },
    {
      name: "custom minCases met",
      code: "const v = x === 1 ? a : x === 2 ? b : x === 3 ? c : d;",
      options: [{ minCases: 3 }],
      errors: [error],
    },
  ],
});
