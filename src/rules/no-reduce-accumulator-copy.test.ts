import { tester } from "../../test/tester.ts";
import rule from "./no-reduce-accumulator-copy.ts";

const error = { messageId: "accumulatorCopy" };

tester.run("oxslop/no-reduce-accumulator-copy", rule, {
  valid: [
    "items.reduce((acc, item) => { acc.push(item.value); return acc; }, []);",
    "items.reduce((acc, item) => { acc[item.id] = item; return acc; }, {});",
    "items.reduce((sum, item) => sum + item.value, 0);",
    "items.reduce((acc, item) => acc.concat, []);",
    "items.reduce((acc, item) => [...item.tags, item.value], []);",
    "items.reduce((acc, item) => acc.slice(0, 2), []);",
    "items.reduce((acc, item) => { acc.set(item.id, item); return acc; }, new Map());",
    "items.reduce((acc, item) => Object.assign(acc, { [item.id]: item }), {});",
    "items.reduce((acc, item) => { const inner = (acc) => [...acc, item]; return acc; }, []);",
    "const acc: number[] = []; items.forEach((item) => { acc.push(item); }); const copy = [...acc];",
    "items.reduce(combine, []);",
    "const structuredClone = (value) => value; items.reduce((acc, item) => structuredClone(acc), {});",
    "items.reduce(({ count }, item) => ({ count: count + 1 }), { count: 0 });",
  ],
  invalid: [
    {
      name: "array spread append",
      code: "items.reduce((acc, item) => [...acc, item], []);",
      errors: [error],
    },
    {
      name: "array spread prepend",
      code: "items.reduceRight((acc, item) => [item, ...acc], []);",
      errors: [error],
    },
    {
      name: "object spread",
      code: "items.reduce((acc, item) => ({ ...acc, [item.id]: item }), {});",
      errors: [error],
    },
    { name: "concat", code: "items.reduce((acc, item) => acc.concat(item), []);", errors: [error] },
    {
      name: "slice inside block body",
      code: "items.reduce(function (acc, item) { const next = acc.slice(); next.push(item); return next; }, []);",
      errors: [error],
    },
    {
      name: "Object.assign onto an empty object",
      code: "items.reduce((acc, item) => Object.assign({}, acc, { [item.id]: item }), {});",
      errors: [error],
    },
    {
      name: "Array.from",
      code: "items.reduce((acc, item) => Array.from(acc), []);",
      errors: [error],
    },
    {
      name: "structuredClone",
      code: "items.reduce((acc, item) => structuredClone(acc), {});",
      errors: [error],
    },
    {
      name: "new Map",
      code: "items.reduce((acc, item) => new Map(acc).set(item.id, item), new Map());",
      errors: [error],
    },
    {
      name: "new Set",
      code: "items.reduce((acc, item) => new Set(acc).add(item), new Set());",
      errors: [error],
    },
    {
      name: "computed method name",
      code: "items['reduce']((acc, item) => [...acc, item], []);",
      errors: [error],
    },
    {
      name: "two copies in one callback",
      code: "items.reduce((acc, item) => (item.ok ? [...acc, item] : acc.concat([])), []);",
      errors: [error, error],
    },
  ],
});
