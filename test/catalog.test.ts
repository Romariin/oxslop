import assert from "node:assert/strict";
import { test } from "node:test";

import { CATALOG, RULE_NAMES } from "../src/catalog.ts";
import plugin, { rules } from "../src/index.ts";

test("plugin registers exactly the catalog rules", () => {
  assert.deepEqual(Object.keys(rules).sort(), [...RULE_NAMES].sort());
  assert.deepEqual(Object.keys(plugin.rules ?? {}).sort(), [...RULE_NAMES].sort());
});

test("catalog autofix claims agree with registered rules", () => {
  for (const name of RULE_NAMES) {
    const rule = rules[name];
    assert.equal(
      rule.meta?.fixable !== undefined,
      CATALOG[name].fixable === true,
      `${name} fixable flag`,
    );
  }
});
