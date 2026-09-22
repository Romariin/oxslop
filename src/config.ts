import { createRequire } from "node:module";
import { join } from "node:path";

import type { OxlintConfig } from "oxlint";

import { CATALOG, GROUPS, PLUGIN_NAME, RULE_NAMES } from "./catalog.ts";
import type { Group, RuleName } from "./catalog.ts";

export type { Group, RuleName };

export { CATALOG, GROUPS, PLUGIN_NAME, RULE_NAMES };

export type Severity = "off" | "warn" | "error";

export type GroupSetting = boolean | Severity;

export type RuleSetting = Severity | [Severity, ...unknown[]];

export interface OxslopOptions {
  /** Evidence and type-safety rules. Default `true`. */
  core?: GroupSetting;
  /**
   * Effect rules. Default `"auto"`: enabled when the `effect` package resolves from `cwd`.
   * Pass `false` for projects that do not use Effect.
   */
  effect?: GroupSetting | "auto";
  /** Signal-over-noise style rules. Default `true`. */
  style?: GroupSetting;
  /** Test-file rules. Default `true`. */
  testing?: GroupSetting;
  /** Default severity for enabled rules. Default `"error"`. */
  severity?: Exclude<Severity, "off">;
  /** Enable non-recommended rules of enabled groups too. Default `false`. */
  strict?: boolean;
  /** Per-rule overrides. Keys accept `no-comments` or `oxslop/no-comments`. Applied last. */
  rules?: Partial<Record<RuleName | `${typeof PLUGIN_NAME}/${RuleName}`, RuleSetting>>;
  /** Globs receiving test-only rules. Default matches `*.test.*`, `*.spec.*` and `__tests__`. */
  testFiles?: string[];
  /** Module specifier used to load the plugin. Default `"oxslop"`. Override when vendoring. */
  specifier?: string;
  /** Directory used to auto-detect Effect. Default `process.cwd()`. */
  cwd?: string;
}

export const DEFAULT_TEST_FILES = [
  "**/*.test.{ts,tsx,mts,cts,js,jsx,mjs,cjs}",
  "**/*.spec.{ts,tsx,mts,cts,js,jsx,mjs,cjs}",
  "**/__tests__/**",
  "**/test/**",
  "**/tests/**",
];

const prefixed = (name: RuleName): `${typeof PLUGIN_NAME}/${RuleName}` => `${PLUGIN_NAME}/${name}`;

const detectEffect = (cwd: string): boolean => {
  try {
    createRequire(join(cwd, "package.json")).resolve("effect/package.json");

    return true;
  } catch {
    return false;
  }
};

const groupSeverity = (
  setting: GroupSetting | "auto" | undefined,
  fallback: GroupSetting,
  base: Exclude<Severity, "off">,
  cwd: string,
): Severity => {
  const resolved = setting === "auto" ? detectEffect(cwd) : (setting ?? fallback);

  if (resolved === true) return base;
  if (resolved === false) return "off";
  return resolved;
};

/**
 * Build an Oxlint config fragment for `extends`.
 *
 * @example
 * ```ts
 * import { defineConfig } from "oxlint";
 * import { oxslop } from "oxslop/config";
 *
 * export default defineConfig({
 *   extends: [oxslop({ effect: false, rules: { "no-emoji": "warn" } })],
 * });
 * ```
 */
export const oxslop = (options: OxslopOptions = {}): OxlintConfig => {
  const base = options.severity ?? "error";
  const cwd = options.cwd ?? process.cwd();
  const severityByGroup: Record<Group, Severity> = {
    core: groupSeverity(options.core, true, base, cwd),
    effect: groupSeverity(options.effect ?? "auto", true, base, cwd),
    style: groupSeverity(options.style, true, base, cwd),
    testing: groupSeverity(options.testing, true, base, cwd),
  };

  const rules: Record<string, RuleSetting> = {};
  const testRules: Record<string, RuleSetting> = {};

  for (const name of RULE_NAMES) {
    const info = CATALOG[name];
    const severity = severityByGroup[info.group];

    if (severity === "off" || (!info.recommended && !options.strict)) continue;
    (info.testOnly ? testRules : rules)[prefixed(name)] = severity;
  }

  for (const [key, setting] of Object.entries(options.rules ?? {})) {
    if (setting === undefined) continue;
    const name = (
      key.startsWith(`${PLUGIN_NAME}/`) ? key.slice(PLUGIN_NAME.length + 1) : key
    ) as RuleName;

    if (!(name in CATALOG)) throw new Error(`oxslop: unknown rule "${key}"`);
    const target = CATALOG[name].testOnly ? testRules : rules;

    if (setting === "off") delete target[prefixed(name)];
    else target[prefixed(name)] = setting;
  }

  const config: OxlintConfig = {
    jsPlugins: [{ name: PLUGIN_NAME, specifier: options.specifier ?? PLUGIN_NAME }],
    rules,
  };

  if (Object.keys(testRules).length > 0) {
    config.overrides = [{ files: options.testFiles ?? DEFAULT_TEST_FILES, rules: testRules }];
  }

  return config;
};
