import type { Context, ESTree, Scope } from "@oxlint/plugins";

import { staticMemberName } from "./globals.ts";

/**
 * Effect module member detection that follows imports.
 *
 * Recognises `Effect.gen` through:
 * - `import { Effect } from "effect"` (any alias: `import { Effect as E }`)
 * - `import * as Effect from "effect/Effect"` (any alias)
 * - `import { gen } from "effect/Effect"` (bare member import, any alias)
 *
 * Falls back to the plain name when no import binds it (scripts, ambient globals).
 */

const EFFECT_PACKAGES = new Set(["effect", "@effect/platform", "@effect/sql", "@effect/schema"]);

const isEffectSource = (source: string): boolean => {
  if (EFFECT_PACKAGES.has(source)) return true;
  const root = source.startsWith("@")
    ? source.split("/").slice(0, 2).join("/")
    : source.split("/")[0];

  return root !== undefined && EFFECT_PACKAGES.has(root);
};

const submodule = (source: string): string | undefined => {
  if (EFFECT_PACKAGES.has(source)) return undefined;
  const parts = source.split("/");

  return parts.length >= 2 ? parts[parts.length - 1] : undefined;
};

type Binding =
  | { kind: "import"; source: string; specifier: ESTree.ImportDeclarationSpecifier }
  | { kind: "local" }
  | { kind: "unresolved" };

/** How an identifier is bound: an import, some other local declaration, or nothing in this file. */
const bindingOf = (
  context: Context,
  node: ESTree.Node & { type: "Identifier"; name: string },
): Binding => {
  let scope: Scope | null = context.sourceCode.getScope(node);

  while (scope) {
    const variable = scope.set.get(node.name);

    if (variable) {
      const def = variable.defs[0];

      if (def === undefined) return { kind: "unresolved" };
      const declaration = def.parent;

      if (def.type !== "ImportBinding" || declaration?.type !== "ImportDeclaration")
        return { kind: "local" };

      if (
        declaration.importKind === "type" ||
        (def.node.type === "ImportSpecifier" && def.node.importKind === "type")
      )
        return { kind: "local" };

      return {
        kind: "import",
        source: declaration.source.value,
        specifier: def.node as ESTree.ImportDeclarationSpecifier,
      };
    }

    scope = scope.upper;
  }

  return { kind: "unresolved" };
};

/**
 * Resolve the Effect module an identifier denotes: `Effect`, `Layer`, `Option`...
 * Returns `undefined` when the identifier is bound to something other than an Effect module.
 */
export const effectModuleOf = (context: Context, node: ESTree.Node): string | undefined => {
  if (node.type === "ParenthesizedExpression") return effectModuleOf(context, node.expression);
  if (node.type === "MemberExpression" && node.object.type === "Identifier") {
    const binding = bindingOf(context, node.object);

    return binding.kind === "import" &&
      EFFECT_PACKAGES.has(binding.source) &&
      binding.specifier.type === "ImportNamespaceSpecifier"
      ? staticMemberName(node)
      : undefined;
  }

  if (node.type !== "Identifier") return undefined;
  const binding = bindingOf(context, node);

  if (binding.kind === "local") return undefined;
  if (binding.kind === "unresolved") return node.name;
  if (!isEffectSource(binding.source)) return undefined;
  const { specifier } = binding;

  if (specifier.type === "ImportNamespaceSpecifier") return submodule(binding.source);
  if (specifier.type === "ImportSpecifier" && submodule(binding.source) === undefined) {
    return specifier.imported.type === "Identifier"
      ? specifier.imported.name
      : specifier.imported.value;
  }

  return undefined;
};

export interface EffectMember {
  module: string;
  member: string;
}

/**
 * Identify `Module.member` references: `Effect.gen`, `Layer.provide`, `Option.some`.
 * Also recognises bare member imports: `import { provide } from "effect/Layer"`.
 */
export const effectMemberOf = (context: Context, node: ESTree.Node): EffectMember | undefined => {
  if (node.type === "ParenthesizedExpression") return effectMemberOf(context, node.expression);
  if (node.type === "MemberExpression") {
    const member = staticMemberName(node);

    if (member === "pipe" && node.object.type === "Identifier") {
      const binding = bindingOf(context, node.object);

      if (
        binding.kind === "import" &&
        binding.source === "effect" &&
        binding.specifier.type === "ImportNamespaceSpecifier"
      )
        return { module: "Function", member };
    }

    const module = effectModuleOf(context, node.object);

    return member !== undefined && module !== undefined ? { module, member } : undefined;
  }

  if (node.type !== "Identifier") return undefined;
  const binding = bindingOf(context, node);

  if (
    binding.kind !== "import" ||
    !isEffectSource(binding.source) ||
    binding.specifier.type !== "ImportSpecifier"
  ) {
    return undefined;
  }

  const module = submodule(binding.source);

  if (module === undefined || module === binding.source) return undefined;
  const { imported } = binding.specifier;

  return { module, member: imported.type === "Identifier" ? imported.name : imported.value };
};

/** `true` when `node` is `Module.member` for the given pair. */
export const isEffectMember = (
  context: Context,
  node: ESTree.Node,
  module: string,
  member: string,
): boolean => {
  const found = effectMemberOf(context, node);

  return found !== undefined && found.module === module && found.member === member;
};

/** `true` when `node` calls `Module.member(...)`. */
export const isEffectCall = (
  context: Context,
  node: ESTree.Node,
  module: string,
  member: string,
): boolean =>
  node.type === "CallExpression" && isEffectMember(context, node.callee, module, member);

/**
 * `true` when `node` is a `pipe` invocation: `pipe(a, f, g)` from `effect`/`effect/Function`,
 * or the `.pipe(f, g)` method.
 */
export const isPipeCall = (context: Context, node: ESTree.CallExpression): boolean => {
  const { callee } = node;

  if (callee.type === "MemberExpression") return staticMemberName(callee) === "pipe";
  if (callee.type !== "Identifier") return false;
  const binding = bindingOf(context, callee);

  if (binding.kind === "unresolved") return callee.name === "pipe";
  if (binding.kind !== "import" || !isEffectSource(binding.source)) return false;
  if (binding.specifier.type !== "ImportSpecifier") return false;
  const { imported } = binding.specifier;

  return (imported.type === "Identifier" ? imported.name : imported.value) === "pipe";
};
