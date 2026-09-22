import { defineConfig } from "tsdown";

export default defineConfig({
  entry: {
    index: "src/index.ts",
    config: "src/config.ts",
    oxfmt: "src/oxfmt.ts",
  },
  format: "esm",
  fixedExtension: true,
  dts: true,
  clean: true,
  platform: "node",
  deps: { neverBundle: ["@oxlint/plugins", "oxlint", "oxfmt"] },
});
