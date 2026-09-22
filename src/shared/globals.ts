import type { Context, ESTree, Scope } from "@oxlint/plugins";

/**
 * `true` when the identifier is not bound by any declaration in the file: either a configured
 * global (`isGlobalReference`) or an unresolved name, which at runtime can only be a global.
 */
export const isGlobalName = (
  context: Context,
  node: ESTree.Node & { type: "Identifier"; name: string },
): boolean => {
  if (context.sourceCode.isGlobalReference(node)) return true;
  let scope: Scope | null = context.sourceCode.getScope(node);

  while (scope) {
    const variable = scope.set.get(node.name);

    if (variable) return variable.defs.length === 0;
    scope = scope.upper;
  }

  return true;
};

/** Static property name of a member expression: `a.b` → `"b"`, `a["b"]` → `"b"`, `a[b]` → `undefined`. */
export const staticMemberName = (node: ESTree.MemberExpression): string | undefined => {
  if (!node.computed && node.property.type === "Identifier") return node.property.name;
  if (node.property.type === "Literal" && typeof node.property.value === "string")
    return node.property.value;

  if (node.property.type === "TemplateLiteral" && node.property.expressions.length === 0) {
    return node.property.quasis[0]?.value.cooked ?? undefined;
  }

  return undefined;
};

/** `true` for `Global.method(...)` where `Global` is the unshadowed global binding. */
export const isGlobalMethodCall = (
  context: Context,
  node: ESTree.CallExpression,
  object: string,
  method: string,
): boolean =>
  node.callee.type === "MemberExpression" &&
  staticMemberName(node.callee) === method &&
  node.callee.object.type === "Identifier" &&
  node.callee.object.name === object &&
  isGlobalName(context, node.callee.object);
