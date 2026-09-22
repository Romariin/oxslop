/**
 * Shared Oxfmt preset.
 *
 * @example
 * ```ts
 * import { defineConfig } from "oxfmt";
 * import { oxfmt } from "oxslop/oxfmt";
 *
 * export default defineConfig({ ...oxfmt(), printWidth: 80 });
 * ```
 */

export interface OxfmtOptions {
  /** Sort imports. Default `true`. */
  sortImports?: boolean;
  /** Sort Tailwind classes. Default `false`. */
  sortTailwindcss?: boolean;
  /** Extra ignore globs appended to the defaults. */
  ignorePatterns?: string[];
}

export const DEFAULT_IGNORE_PATTERNS = [
  "**/node_modules/**",
  "**/dist/**",
  "**/build/**",
  "**/coverage/**",
  "**/.next/**",
  "**/.turbo/**",
  "**/*.min.*",
  "**/*.generated.*",
  "**/.agent/**",
  "**/.agents/**",
  "**/.claude/**",
  "**/.codex/**",
  "**/.cursor/**",
  "**/.gemini/**",
  "**/.opencode/**",
];

export interface OxfmtPreset {
  printWidth: number;
  tabWidth: number;
  useTabs: boolean;
  semi: boolean;
  singleQuote: boolean;
  trailingComma: "all";
  arrowParens: "always";
  bracketSpacing: boolean;
  endOfLine: "lf";
  insertFinalNewline: boolean;
  sortPackageJson: boolean;
  sortImports?: Record<string, never>;
  sortTailwindcss?: Record<string, never>;
  ignorePatterns: string[];
}

export const oxfmt = (options: OxfmtOptions = {}): OxfmtPreset => {
  const preset: OxfmtPreset = {
    printWidth: 100,
    tabWidth: 2,
    useTabs: false,
    semi: true,
    singleQuote: false,
    trailingComma: "all",
    arrowParens: "always",
    bracketSpacing: true,
    endOfLine: "lf",
    insertFinalNewline: true,
    sortPackageJson: true,
    ignorePatterns: [...DEFAULT_IGNORE_PATTERNS, ...(options.ignorePatterns ?? [])],
  };

  if (options.sortImports ?? true) preset.sortImports = {};
  if (options.sortTailwindcss === true) preset.sortTailwindcss = {};
  return preset;
};
