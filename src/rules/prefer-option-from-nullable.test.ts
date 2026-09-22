import { tester } from "../../test/tester.ts";
import rule from "./prefer-option-from-nullable.ts";

const IMPORT = 'import { Option } from "effect";';
const error = { messageId: "fromNullable" };

tester.run("oxslop/prefer-option-from-nullable", rule, {
  valid: [
    `${IMPORT} const o = Option.fromNullable(x);`,
    `${IMPORT} const o = x == null ? Option.none() : Option.some(y);`,
    `${IMPORT} const o = x == null ? Option.some(x) : Option.none();`,
    `${IMPORT} const o = x != null ? Option.none() : Option.some(x);`,
    `${IMPORT} const o = x == null ? Option.none() : Option.some(x.length);`,
    `${IMPORT} const o = x == null ? Option.none() : Option.some(x, y);`,
    `${IMPORT} const o = x === undefined || y === null ? Option.none() : Option.some(x);`,
    `${IMPORT} const o = x === undefined && x === null ? Option.none() : Option.some(x);`,
    `${IMPORT} const o = x == null ? Option.none() : Option.liftPredicate(x, isPositive);`,
    `${IMPORT} const o = x == null ? Option.none : Option.some(x);`,
    `${IMPORT} const o = x == undefined ? Either.left(x) : Either.right(x);`,
    `${IMPORT} const o = x == 0 ? Option.none() : Option.some(x);`,
    `${IMPORT} const o = null == null ? Option.none() : Option.some(null);`,
    {
      name: "local Option binding",
      code: "const Option = { none: () => 0, some: (v: unknown) => v }; const o = x == null ? Option.none() : Option.some(x);",
    },
    {
      name: "Option from another package",
      code: 'import { Option } from "fp-ts"; const o = x == null ? Option.none() : Option.some(x);',
    },
    {
      name: "shadowed undefined",
      code: `${IMPORT} function f(undefined: string) { return x === undefined ? Option.none() : Option.some(x); }`,
    },
  ],
  invalid: [
    {
      name: "loose null check",
      code: `${IMPORT} const o = x == null ? Option.none() : Option.some(x);`,
      output: `${IMPORT} const o = Option.fromNullable(x);`,
      errors: [{ ...error, data: { option: "Option", subject: "x" } }],
    },
    {
      name: "inverted loose check",
      code: `${IMPORT} const o = x != null ? Option.some(x) : Option.none();`,
      output: `${IMPORT} const o = Option.fromNullable(x);`,
      errors: [error],
    },
    {
      name: "strict null",
      code: `${IMPORT} const o = x === null ? Option.none() : Option.some(x);`,
      output: null,
      errors: [error],
    },
    {
      name: "strict undefined with member subject",
      code: `${IMPORT} const o = a.b.c === undefined ? Option.none() : Option.some(a.b.c);`,
      output: null,
      errors: [error],
    },
    {
      name: "null on the left, loose undefined",
      code: `${IMPORT} const o = undefined == x ? Option.none() : Option.some(x);`,
      output: `${IMPORT} const o = Option.fromNullable(x);`,
      errors: [error],
    },
    {
      name: "double strict check",
      code: `${IMPORT} const o = x === undefined || x === null ? Option.none() : Option.some(x);`,
      output: `${IMPORT} const o = Option.fromNullable(x);`,
      errors: [error],
    },
    {
      name: "double negated check",
      code: `${IMPORT} const o = x !== undefined && x !== null ? Option.some(x) : Option.none();`,
      output: `${IMPORT} const o = Option.fromNullable(x);`,
      errors: [error],
    },
    {
      name: "parenthesised test",
      code: `${IMPORT} const o = (x == null) ? (Option.none()) : (Option.some(x));`,
      output: `${IMPORT} const o = Option.fromNullable(x);`,
      errors: [error],
    },
    {
      name: "aliased import keeps binding text",
      code: 'import { Option as O } from "effect"; const o = x == null ? O.none() : O.some(x);',
      output: 'import { Option as O } from "effect"; const o = O.fromNullable(x);',
      errors: [{ ...error, data: { option: "O", subject: "x" } }],
    },
    {
      name: "namespace import",
      code: 'import * as Opt from "effect/Option"; const o = x == null ? Opt.none() : Opt.some(x);',
      output: 'import * as Opt from "effect/Option"; const o = Opt.fromNullable(x);',
      errors: [error],
    },
    {
      name: "unresolved Option global",
      code: "const o = x == null ? Option.none() : Option.some(x);",
      output: "const o = Option.fromNullable(x);",
      errors: [error],
    },
    {
      name: "optional chain subject",
      code: `${IMPORT} const o = a?.b == null ? Option.none() : Option.some(a?.b);`,
      output: null,
      errors: [error],
    },
    {
      name: "call subject reports without fix",
      code: `${IMPORT} const o = f() == null ? Option.none() : Option.some(f());`,
      errors: [error],
    },
    {
      name: "computed member subject reports without fix",
      code: `${IMPORT} const o = a[k] == null ? Option.none() : Option.some(a[k]);`,
      errors: [error],
    },
    {
      name: "member getter must retain repeated reads",
      code: `${IMPORT} let reads = 0; const a = { get b() { return ++reads; } }; const o = a.b == null ? Option.none() : Option.some(a.b);`,
      output: null,
      errors: [error],
    },
    {
      name: "duplicated strict null check does not cover undefined",
      code: `${IMPORT} const o = x === null || x === null ? Option.none() : Option.some(x);`,
      output: null,
      errors: [error],
    },
    {
      name: "duplicated strict undefined inequality does not cover null",
      code: `${IMPORT} const o = x !== undefined && x !== undefined ? Option.some(x) : Option.none();`,
      output: null,
      errors: [error],
    },
    {
      name: "this is safe to evaluate once",
      code: `${IMPORT} function f() { return this == null ? Option.none() : Option.some(this); }`,
      output: `${IMPORT} function f() { return Option.fromNullable(this); }`,
      errors: [error],
    },
    {
      name: "root namespace import preserves qualified Option",
      code: 'import * as Fx from "effect"; const o = x == null ? Fx.Option.none() : Fx.Option.some(x);',
      output: 'import * as Fx from "effect"; const o = Fx.Option.fromNullable(x);',
      errors: [error],
    },
    {
      name: "bare member imports report without fix",
      code: 'import { none, some } from "effect/Option"; const o = x == null ? none() : some(x);',
      errors: [error],
    },
  ],
});
