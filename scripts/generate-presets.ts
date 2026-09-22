/**
 * Generate `presets/*.json` for `.oxlintrc.json` users, who cannot import `oxslop/config`.
 *
 * One preset per group plus `recommended` (core + style + testing) and `all` (every group,
 * strict). Each preset loads the plugin through a path relative to itself so `extends` works from
 * `node_modules/oxslop/presets/<name>.json`.
 *
 * `--check` exits non-zero when the committed files are stale.
 */
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

import { CATALOG, DEFAULT_TEST_FILES, GROUPS, PLUGIN_NAME, RULE_NAMES } from "../src/config.ts";
import type { Group } from "../src/config.ts";

const OUT_DIR = join(import.meta.dirname, "..", "presets");
const SPECIFIER = "../dist/index.mjs";

interface Preset {
  $schema: string;
  jsPlugins: { name: string; specifier: string }[];
  rules: Record<string, "error">;
  overrides?: { files: string[]; rules: Record<string, "error"> }[];
}

const preset = (groups: readonly Group[], strict: boolean): Preset => {
  const rules: Record<string, "error"> = {};
  const testRules: Record<string, "error"> = {};

  for (const name of RULE_NAMES) {
    const info = CATALOG[name];

    if (!groups.includes(info.group) || (!info.recommended && !strict)) continue;
    (info.testOnly ? testRules : rules)[`${PLUGIN_NAME}/${name}`] = "error";
  }

  const result: Preset = {
    $schema: "../../oxlint/configuration_schema.json",
    jsPlugins: [{ name: PLUGIN_NAME, specifier: SPECIFIER }],
    rules,
  };

  if (Object.keys(testRules).length > 0) {
    result.overrides = [{ files: DEFAULT_TEST_FILES, rules: testRules }];
  }

  return result;
};

const presets: Record<string, Preset> = {
  recommended: preset(["core", "style", "testing"], false),
  all: preset(GROUPS, true),
  ...Object.fromEntries(GROUPS.map((group) => [group, preset([group], true)])),
};

const GROUP_TITLES: Record<Group, string> = {
  core: "Core: evidence and type safety",
  effect: "Effect",
  style: "Style: signal over noise",
  testing: "Testing",
};

const ruleTables = (): string =>
  GROUPS.map((group) => {
    const rows = RULE_NAMES.filter((name) => CATALOG[name].group === group).map((name) => {
      const info = CATALOG[name];
      const flags = [info.recommended ? "R" : "", info.fixable ? "F" : ""]
        .filter(Boolean)
        .join(" ");

      return `| \`${name}\` | ${info.description} | ${flags} |`;
    });

    return `### ${GROUP_TITLES[group]}\n\n| Rule | Rejects | |\n| --- | --- | --- |\n${rows.join("\n")}`;
  }).join("\n\n");

const README = join(import.meta.dirname, "..", "README.md");
const README_START = "<!-- rules:start -->";
const README_END = "<!-- rules:end -->";

const outputs: Record<string, string> = Object.fromEntries(
  Object.entries(presets).map(([name, content]) => [
    join(OUT_DIR, `${name}.json`),
    `${JSON.stringify(content, null, 2)}\n`,
  ]),
);

const readme = readFileSync(README, "utf8");
const start = readme.indexOf(README_START);
const end = readme.indexOf(README_END);

if (start === -1 || end === -1) throw new Error("README.md is missing the rules markers");

outputs[README] =
  `${readme.slice(0, start + README_START.length)}\n\n${ruleTables()}\n\n${readme.slice(end)}`;

const check = process.argv.includes("--check");

mkdirSync(OUT_DIR, { recursive: true });

let stale = 0;

for (const [file, next] of Object.entries(outputs)) {
  let current = "";

  try {
    current = readFileSync(file, "utf8");
  } catch {
    current = "";
  }

  if (current === next) continue;
  stale++;

  if (check) console.error(`stale: ${file}`);
  else writeFileSync(file, next);
}

if (check && stale > 0) process.exit(1);

console.log(check ? "presets and README up to date" : `updated ${stale} file(s)`);
