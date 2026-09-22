import assert from "node:assert/strict";
import { mkdtempSync, mkdirSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";

import type { OxlintConfig } from "oxlint";

import { CATALOG, RULE_NAMES, oxslop } from "../src/config.ts";
import type { Group, RuleName } from "../src/config.ts";

const emptyDir = () => mkdtempSync(join(tmpdir(), "oxslop-"));

const effectDir = () => {
  const dir = emptyDir();
  mkdirSync(join(dir, "node_modules", "effect"), { recursive: true });
  writeFileSync(join(dir, "node_modules", "effect", "package.json"), '{"name":"effect"}');

  return dir;
};

const groupsIn = (rules: NonNullable<OxlintConfig["rules"]>): Set<Group> =>
  new Set(Object.keys(rules).map((key) => CATALOG[key.slice("oxslop/".length) as RuleName].group));

test("defaults: recommended rules, effect off when the package is absent", () => {
  const config = oxslop({ cwd: emptyDir() });
  assert.deepEqual(config.jsPlugins, [{ name: "oxslop", specifier: "oxslop" }]);
  const rules = config.rules ?? {};
  assert.deepEqual([...groupsIn(rules)].sort(), ["core", "style", "testing"]);
  assert.equal(rules["oxslop/no-comments"], undefined, "non-recommended rule stays off");
  assert.equal(rules["oxslop/no-emoji"], "error");
});

test("effect auto-detection enables the group when effect resolves", () => {
  const rules = oxslop({ cwd: effectDir() }).rules ?? {};
  assert.equal(rules["oxslop/no-tag-access"], "error");
});

test("effect: false disables the group even when effect resolves", () => {
  const rules = oxslop({ cwd: effectDir(), effect: false }).rules ?? {};
  assert.ok(!groupsIn(rules).has("effect"));
});

test("group severity and global severity", () => {
  const rules =
    oxslop({ cwd: emptyDir(), severity: "warn", style: "error", testing: false }).rules ?? {};

  assert.equal(rules["oxslop/no-reflect-get"], "warn");
  assert.equal(rules["oxslop/no-emoji"], "error");
  assert.equal(rules["oxslop/no-module-mocking"], undefined);
});

test("strict enables non-recommended rules", () => {
  const rules = oxslop({ cwd: emptyDir(), strict: true }).rules ?? {};
  assert.equal(rules["oxslop/no-comments"], "error");
});

test("per-rule overrides accept bare and prefixed names, apply last", () => {
  const config = oxslop({
    cwd: emptyDir(),
    rules: {
      "no-emoji": "off",
      "oxslop/no-comments": ["warn", { allowJsdoc: false }],
      "no-reflect-get": "warn",
    },
  });

  const rules = config.rules ?? {};
  assert.equal(rules["oxslop/no-emoji"], undefined);
  assert.deepEqual(rules["oxslop/no-comments"], ["warn", { allowJsdoc: false }]);
  assert.equal(rules["oxslop/no-reflect-get"], "warn");
});

test("unknown rule names throw", () => {
  const rules = { ["no-such-rule" as RuleName]: "error" as const };
  assert.throws(() => oxslop({ cwd: emptyDir(), rules }), /unknown rule/);
});

test("test-only rules go into a test-file override", () => {
  const config = oxslop({ cwd: emptyDir(), testFiles: ["**/*.spec.ts"] });
  assert.equal(config.rules?.["oxslop/expect-padding"], undefined);
  assert.deepEqual(config.overrides, [
    { files: ["**/*.spec.ts"], rules: { "oxslop/expect-padding": "error" } },
  ]);
});

test("custom specifier for vendored installs", () => {
  const config = oxslop({ cwd: emptyDir(), specifier: "./tools/oxslop/index.ts" });
  assert.deepEqual(config.jsPlugins, [{ name: "oxslop", specifier: "./tools/oxslop/index.ts" }]);
});

test("every catalog rule is reachable through some configuration", () => {
  const rules = oxslop({ cwd: effectDir(), strict: true });
  const all = { ...rules.rules, ...rules.overrides?.[0]?.rules };
  assert.deepEqual(Object.keys(all).sort(), RULE_NAMES.map((name) => `oxslop/${name}`).sort());
});
