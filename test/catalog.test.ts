import assert from "node:assert/strict";
import { test } from "node:test";

import { CATALOG, RULE_NAMES } from "../src/catalog.ts";
import plugin, { rules } from "../src/index.ts";

test("plugin registers exactly the catalog rules", () => {
  assert.deepEqual(Object.keys(rules).sort(), [...RULE_NAMES].sort());
  assert.deepEqual(Object.keys(plugin.rules ?? {}).sort(), [...RULE_NAMES].sort());
});

test("rule metadata matches the catalog", () => {
  for (const name of RULE_NAMES) {
    const rule = rules[name];
    assert.ok(rule, `${name} missing`);
    assert.equal(rule.meta?.docs?.description, CATALOG[name].description, `${name} description`);
    assert.equal(
      rule.meta?.fixable !== undefined,
      CATALOG[name].fixable === true,
      `${name} fixable flag`,
    );

    assert.ok(rule.meta?.schema !== undefined, `${name} must declare an options schema`);
  }
});
