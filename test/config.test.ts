import assert from "node:assert/strict";
import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, test } from "node:test";

import type { OxlintConfig } from "oxlint";

import { CATALOG, RULE_NAMES, oxslop } from "../src/config.ts";
import type { Group, RuleName } from "../src/config.ts";

const tempDirs = new Set<string>();

afterEach(() => {
  for (const dir of tempDirs) rmSync(dir, { recursive: true, force: true });
  tempDirs.clear();
});

const emptyDir = () => {
  const dir = mkdtempSync(join(tmpdir(), "oxslop-"));
  tempDirs.add(dir);

  return dir;
};

const effectDir = () => {
  const dir = emptyDir();
  mkdirSync(join(dir, "node_modules", "effect"), { recursive: true });
  writeFileSync(join(dir, "node_modules", "effect", "package.json"), '{"name":"effect"}');

  return dir;
};

const groupsIn = (rules: NonNullable<OxlintConfig["rules"]>): Set<Group> =>
  new Set(Object.keys(rules).map((key) => CATALOG[key.slice("oxslop/".length) as RuleName].group));

test("effect auto-detection excludes the group when the package is absent", () => {
  const rules = oxslop({ cwd: emptyDir(), effect: "auto" }).rules ?? {};
  assert.ok(!groupsIn(rules).has("effect"));
});

test("effect auto-detection enables the group when effect resolves", () => {
  const rules = oxslop({ cwd: effectDir(), effect: "auto", severity: "warn" }).rules ?? {};
  assert.equal(rules["oxslop/no-tag-access"], "warn");
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
  const rules = oxslop({ cwd: emptyDir(), strict: true, severity: "warn" }).rules ?? {};
  assert.equal(rules["oxslop/no-comments"], "warn");
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

test("inherited object properties are not rule names", () => {
  const rules = { ["toString" as RuleName]: "error" as const };
  assert.throws(() => oxslop({ effect: false, rules }), /unknown rule/);
});

test("test-only rules go into a test-file override", () => {
  const config = oxslop({ cwd: emptyDir(), testing: "warn", testFiles: ["**/*.spec.ts"] });
  assert.equal(config.rules?.["oxslop/expect-padding"], undefined);
  assert.deepEqual(config.overrides, [
    { files: ["**/*.spec.ts"], rules: { "oxslop/expect-padding": "warn" } },
  ]);
});

test("every catalog rule is reachable through some configuration", () => {
  const rules = oxslop({ cwd: effectDir(), strict: true });
  const all = { ...rules.rules, ...rules.overrides?.[0]?.rules };
  assert.deepEqual(Object.keys(all).sort(), RULE_NAMES.map((name) => `oxslop/${name}`).sort());
});
