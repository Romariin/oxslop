import { defineRule, readOptions } from "../shared/rule.ts";
import type { ESTree } from "../shared/rule.ts";

interface Options {
  /** Substrings of `context.filename` that opt a file out. */
  allowFiles: string[];
}

const DEFAULTS: Options = { allowFiles: [] };

const exportName = (name: ESTree.ModuleExportName): string =>
  name.type === "Identifier" ? name.name : name.value;

/**
 * A module is re-export-only when every statement is `export ... from`, `export * from`, an
 * import, or an `export { x }` / `export default x` whose local was imported. Side-effect imports
 * (`import "./polyfill"`) and any declaration or runtime statement make the module legitimate.
 * Type-only re-exports count like value re-exports.
 */
export default defineRule({
  meta: {
    type: "suggestion",
    docs: { description: "Disallow barrel modules that only re-export." },
    messages: {
      barrel:
        "Import each symbol from the module that defines it and delete this barrel; re-export-only modules hide dependencies and defeat tree-shaking.",
    },
    schema: [
      {
        type: "object",
        properties: { allowFiles: { type: "array", items: { type: "string" }, uniqueItems: true } },
        additionalProperties: false,
      },
    ],
  },
  createOnce(context) {
    let options = DEFAULTS;

    return {
      before() {
        options = readOptions(context, DEFAULTS);
      },
      Program(node) {
        if (node.body.length === 0) return;
        if (options.allowFiles.some((part) => context.filename.includes(part))) return;
        const imported = new Set<string>();
        const exportedLocals: string[] = [];
        let reexports = 0;

        for (const statement of node.body) {
          switch (statement.type) {
            case "ExportAllDeclaration":
              reexports++;
              break;
            case "ExportNamedDeclaration":
              if (statement.declaration !== null) return;
              if (statement.source !== null) {
                reexports++;

                break;
              }
              for (const specifier of statement.specifiers)
                exportedLocals.push(exportName(specifier.local));
              break;
            case "ExportDefaultDeclaration":
              if (statement.declaration.type !== "Identifier") return;
              exportedLocals.push(statement.declaration.name);
              break;
            case "ImportDeclaration":
              if (statement.specifiers.length === 0) return;
              for (const specifier of statement.specifiers) imported.add(specifier.local.name);
              break;
            default:
              return;
          }
        }

        if (reexports + exportedLocals.length === 0) return;
        if (exportedLocals.every((name) => imported.has(name))) {
          context.report({ node, messageId: "barrel" });
        }
      },
    };
  },
});
