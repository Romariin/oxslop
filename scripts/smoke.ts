/**
 * End-to-end check of the built package as a consumer sees it.
 *
 * Creates a temp project whose `node_modules/oxslop` links to this repo, then runs the real
 * `oxlint` binary twice: once with `oxlint.config.ts` + `oxslop()` and once with `.oxlintrc.json`
 * + JSON presets. Asserts the expected rule ids fire and that `effect: false` removes Effect rules.
 * Requires `bun run build` first.
 */
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdirSync, mkdtempSync, rmSync, symlinkSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const dir = mkdtempSync(join(tmpdir(), "oxslop-smoke-"));

mkdirSync(join(dir, "node_modules"));

for (const pkg of ["oxlint", "@oxlint"])
  symlinkSync(join(root, "node_modules", pkg), join(dir, "node_modules", pkg));

symlinkSync(root, join(dir, "node_modules", "oxslop"));

writeFileSync(join(dir, "package.json"), '{ "name": "smoke", "type": "module" }\n');

const SOURCE = `import { Effect } from "effect";

export const read = (owner: object) => Reflect.get(owner, "id"); // done \u{1F680}

export const value = "x" as unknown as string;

export const program = Effect.gen(function* () {
  return 1;
});

export const tag = (e: { _tag: string }) => e._tag === "A";
`;

writeFileSync(join(dir, "src.ts"), SOURCE);

interface Diagnostic {
  code: string;
  filename: string;
}

const lint = (): Set<string> => {
  const result = spawnSync(
    process.execPath,
    [join(root, "node_modules", "oxlint", "bin", "oxlint"), "--format", "json", "src.ts"],
    {
      cwd: dir,
      encoding: "utf8",
    },
  );

  const start = result.stdout.indexOf("{");
  assert.notEqual(start, -1, `oxlint produced no JSON:\n${result.stdout}\n${result.stderr}`);
  const parsed = JSON.parse(result.stdout.slice(start)) as { diagnostics: Diagnostic[] };

  return new Set(
    parsed.diagnostics.map((d) => d.code).filter((code) => code.startsWith("oxslop(")),
  );
};

const expectRules = (codes: Set<string>, present: string[], absent: string[]) => {
  for (const rule of present)
    assert.ok(codes.has(`oxslop(${rule})`), `expected ${rule} in ${[...codes].join(", ")}`);

  for (const rule of absent) assert.ok(!codes.has(`oxslop(${rule})`), `unexpected ${rule}`);
};

const CORE = ["no-reflect-get", "no-chained-type-assertions", "no-object-parameters", "no-emoji"];
const EFFECT = ["no-yieldless-gen", "no-tag-access"];

// 1. TypeScript config, Effect enabled explicitly.
writeFileSync(
  join(dir, "oxlint.config.ts"),
  `import { defineConfig } from "oxlint";
import { oxslop } from "oxslop/config";
export default defineConfig({ extends: [oxslop({ effect: true, rules: { "no-emoji": "off" } })] });
`,
);

expectRules(lint(), [...CORE.filter((r) => r !== "no-emoji"), ...EFFECT], ["no-emoji"]);

// 2. TypeScript config, Effect disabled.
writeFileSync(
  join(dir, "oxlint.config.ts"),
  `import { defineConfig } from "oxlint";
import { oxslop } from "oxslop/config";
export default defineConfig({ extends: [oxslop({ effect: false })] });
`,
);

expectRules(lint(), CORE, EFFECT);

rmSync(join(dir, "oxlint.config.ts"));

// 3. JSON config with presets.
writeFileSync(
  join(dir, ".oxlintrc.json"),
  JSON.stringify({
    extends: [
      "./node_modules/oxslop/presets/recommended.json",
      "./node_modules/oxslop/presets/effect.json",
    ],
  }),
);

expectRules(lint(), [...CORE, ...EFFECT], []);

rmSync(dir, { recursive: true, force: true });

console.log("smoke ok");
