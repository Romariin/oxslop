import { tester } from "../../test/tester.ts";
import rule from "./no-unsafe-dictionary-type.ts";

const error = { messageId: "unsafeDictionary" };

tester.run("oxslop/no-unsafe-dictionary-type", rule, {
  valid: [
    "type Dict = Record<string, number>;",
    "type Dict = Record<string, User>;",
    "type Dict = { [key: string]: string };",
    "type Dict = { [K in string]: string };",
    "type Dict = Partial<Record<string, string>>;",
    "type Dict = Readonly<Record<string, string>>;",
    "type Keys = { [K in 'a' | 'b']: unknown };",
    "type Keys = { [K in keyof T]: unknown };",
    "function f<T extends Record<string, unknown>>(value: T) {}",
    "function f<T extends { [key: string]: unknown }>(value: T) {}",
    "type IsDict<T> = T extends Record<string, unknown> ? true : false;",
    "type Box = { value: unknown };",
    "type List = unknown[];",
    "type Custom<K, V> = Record<K, V>;",
    "interface Repo { [id: string]: User }",
    "type Record<K, V> = { key: K; value: V }; type D = Record<string, unknown>;",
  ],
  invalid: [
    { name: "Record unknown", code: "type Dict = Record<string, unknown>;", errors: [error] },
    { name: "Record any", code: "type Dict = Record<string, any>;", errors: [error] },
    { name: "Record object", code: "type Dict = Record<string, object>;", errors: [error] },
    { name: "Record empty literal", code: "type Dict = Record<string, {}>;", errors: [error] },
    { name: "Record number keys", code: "type Dict = Record<number, unknown>;", errors: [error] },
    { name: "index signature", code: "type Dict = { [key: string]: unknown };", errors: [error] },
    {
      name: "interface index signature",
      code: "interface Dict { [key: string]: any }",
      errors: [error],
    },
    { name: "mapped type", code: "type Dict = { [K in string]: unknown };", errors: [error] },
    { name: "mapped type number", code: "type Dict = { [K in number]: object };", errors: [error] },
    {
      name: "Partial wrapper reported once",
      code: "type Dict = Partial<Record<string, unknown>>;",
      errors: [error],
    },
    {
      name: "Readonly wrapper reported once",
      code: "type Dict = Readonly<Record<string, unknown>>;",
      errors: [error],
    },
    {
      name: "nested dictionary reported once at the outer",
      code: "type Dict = Record<string, Record<string, unknown>>;",
      errors: [error],
    },
    {
      name: "index signature of records reported once",
      code: "type Dict = { [key: string]: Record<string, unknown> };",
      errors: [error],
    },
    {
      name: "union value containing unknown",
      code: "type Dict = Record<string, string | unknown>;",
      errors: [error],
    },
    {
      name: "aliased value",
      code: "type Loose = unknown; type Dict = Record<string, Loose>;",
      errors: [error],
    },
    {
      name: "parameter position",
      code: "function f(value: Record<string, unknown>) {}",
      errors: [error],
    },
    {
      name: "return position",
      code: "function f(): { [key: string]: any } { return {}; }",
      errors: [error],
    },
    {
      name: "type parameter default",
      code: "function f<T = Record<string, unknown>>() {}",
      errors: [error],
    },
    {
      name: "sibling dictionaries each reported",
      code: "type Pair = { a: Record<string, unknown>; b: { [key: string]: unknown } };",
      errors: [error, error],
    },
    {
      name: "nested inside a non-dictionary literal",
      code: "type Dict = { [key: string]: { nested: Record<string, unknown> } };",
      errors: [error],
    },
  ],
});
