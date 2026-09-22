import type { Context, ESTree, Scope } from "@oxlint/plugins";

import { isGlobalName, staticMemberName } from "../shared/globals.ts";
import { defineRule } from "../shared/rule.ts";

/**
 * Flags module-level mocking: `vi.mock`/`vi.doMock` (vitest), `jest.mock`/`jest.doMock`/
 * `jest.unstable_mockModule`, and `mock.module` (bun:test).
 *
 * The API object is resolved through scope: an import from the framework package (under any
 * alias, including `import * as t from "vitest"; t.vi.mock(...)`), or, for `vi`/`jest`, an
 * unshadowed global. A local `mock` object is never reported; `vi.fn`/`vi.spyOn` are fine.
 */

interface Api {
  readonly packages: readonly string[];
  readonly methods: readonly string[];
  /** Framework injects the object as a global, so an unresolved name is accepted. */
  readonly global: boolean;
}

const APIS: Record<string, Api> = {
  vi: { packages: ["vitest"], methods: ["mock", "doMock"], global: true },
  jest: {
    packages: ["@jest/globals"],
    methods: ["mock", "doMock", "unstable_mockModule"],
    global: true,
  },
  mock: { packages: ["bun:test"], methods: ["module"], global: false },
};

const importOf = (
  context: Context,
  node: ESTree.Node & { type: "Identifier"; name: string },
): { source: string; specifier: ESTree.ImportDeclarationSpecifier } | undefined => {
  let scope: Scope | null = context.sourceCode.getScope(node);

  while (scope) {
    const variable = scope.set.get(node.name);

    if (variable) {
      const def = variable.defs[0];

      if (def?.type !== "ImportBinding" || def.parent?.type !== "ImportDeclaration")
        return undefined;

      return {
        source: def.parent.source.value,
        specifier: def.node as ESTree.ImportDeclarationSpecifier,
      };
    }

    scope = scope.upper;
  }

  return undefined;
};

/** Framework API name (`vi`, `jest`, `mock`) that `node` denotes, or `undefined`. */
const apiOf = (context: Context, node: ESTree.Node): string | undefined => {
  if (node.type === "Identifier") {
    const imported = importOf(context, node);

    if (imported) {
      if (imported.specifier.type !== "ImportSpecifier") return undefined;
      const { imported: name } = imported.specifier;
      const key = name.type === "Literal" ? name.value : name.name;

      return APIS[key]?.packages.includes(imported.source) ? key : undefined;
    }

    return APIS[node.name]?.global && isGlobalName(context, node) ? node.name : undefined;
  }

  if (node.type === "MemberExpression" && node.object.type === "Identifier") {
    const key = staticMemberName(node);
    const imported = importOf(context, node.object);

    return key !== undefined &&
      imported?.specifier.type === "ImportNamespaceSpecifier" &&
      APIS[key]?.packages.includes(imported.source)
      ? key
      : undefined;
  }

  return undefined;
};

export default defineRule({
  meta: {
    type: "problem",
    docs: {
      description:
        "Disallow module mocking (`vi.mock`, `jest.mock`, `mock.module`); use real dependency seams.",
    },
    messages: {
      moduleMock:
        "Remove `{{api}}.{{method}}`; pass the dependency through a real seam (parameter, constructor or Layer) and substitute it there.",
    },
    schema: [],
  },
  createOnce(context) {
    return {
      CallExpression(node) {
        if (node.callee.type !== "MemberExpression") return;
        const method = staticMemberName(node.callee);

        if (method === undefined) return;
        const api = apiOf(context, node.callee.object);

        if (api === undefined || !APIS[api]?.methods.includes(method)) return;
        context.report({ node, messageId: "moduleMock", data: { api, method } });
      },
    };
  },
});
