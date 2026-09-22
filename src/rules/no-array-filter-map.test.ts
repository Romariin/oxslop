import { tester } from "../../test/tester.ts";
import rule from "./no-array-filter-map.ts";

const error = { messageId: "filterMap" };

tester.run("oxslop/no-array-filter-map", rule, {
  valid: [
    "items.flatMap((item) => (item.ok ? [item.value] : []));",
    "items.filter((item) => item.ok);",
    "items.map((item) => item.value);",
    "items.values().filter((item) => item.ok).map((item) => item.value).toArray();",
    "map.entries().map(([key, value]) => value).filter(Boolean);",
    "Iterator.from(items).filter((item) => item.ok).map((item) => item.value);",
    "text.matchAll(/\\d+/g).map((match) => match[0]).filter((digits) => digits.length > 1);",
    "items[Symbol.iterator]().filter((item) => item.ok).map((item) => item.value);",
    "items.iterator.filter((item) => item.ok).map((item) => item.value);",
    "items.filter((item) => item.ok).forEach((item) => use(item));",
    "items.map((item) => item.value).sort().filter(Boolean);",
    "(await load()).keys().map(String).filter(Boolean);",
  ],
  invalid: [
    {
      name: "filter then map",
      code: "items.filter((item) => item.ok).map((item) => item.value);",
      errors: [error],
    },
    {
      name: "map then filter",
      code: "items.map((item) => item.value).filter(Boolean);",
      errors: [error],
    },
    {
      name: "optional chaining",
      code: "items?.filter((item) => item.ok)?.map((item) => item.value);",
      errors: [error],
    },
    { name: "computed method names", code: "items['filter'](f)['map'](g);", errors: [error] },
    {
      name: "three passes report once",
      code: "items.filter(f).map(g).filter(h);",
      errors: [error],
    },
    {
      name: "repeated trailing method does not hide mixed passes",
      code: "[1, 2].filter(Boolean).map(String).map(Number);",
      errors: [error],
    },
    {
      name: "long mixed chain reports once",
      code: "items.filter(f).map(g).map(h).filter(i);",
      errors: [error],
    },
    {
      name: "Object values produce an array rather than an iterator",
      code: "Object.values(items).filter(Boolean).map(String);",
      errors: [error],
    },
    {
      name: "iterator materialised before the passes",
      code: "items.values().toArray().filter(f).map(g);",
      errors: [error],
    },
    { name: "awaited receiver", code: "(await load()).filter(f).map(g);", errors: [error] },
  ],
});
