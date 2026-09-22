import type { ESTree } from "@oxlint/plugins";

/** `x as T` or `<T>x`. `satisfies` and `!` are not assertions. */
export type TypeAssertion = ESTree.TSAsExpression | ESTree.TSTypeAssertion;

export const ASSERTION_SELECTOR = "TSAsExpression, TSTypeAssertion";

export const isTypeAssertion = (node: ESTree.Node): node is TypeAssertion =>
  node.type === "TSAsExpression" || node.type === "TSTypeAssertion";

/** `x as const` / `<const>x`. */
export const isConstAssertion = (node: TypeAssertion): boolean =>
  node.typeAnnotation.type === "TSTypeReference" &&
  node.typeAnnotation.typeName.type === "Identifier" &&
  node.typeAnnotation.typeName.name === "const" &&
  node.typeAnnotation.typeArguments === null;

/** Expression under any number of parentheses. */
export const unwrapParens = (node: ESTree.Expression): ESTree.Expression => {
  let current = node;

  while (current.type === "ParenthesizedExpression") current = current.expression;
  return current;
};

/** Assertion directly wrapped by `node`, ignoring parentheses: `(x as A) as B` → `x as A`. */
export const innerAssertion = (node: TypeAssertion): TypeAssertion | undefined => {
  const inner = unwrapParens(node.expression);

  return isTypeAssertion(inner) ? inner : undefined;
};
