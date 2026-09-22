import type { ESTree } from "@oxlint/plugins";

/**
 * Syntactic evidence about values: expressions whose shape is evident at the site, and the
 * functions that enclose them. Never consults a type checker.
 */

export type FunctionLike = ESTree.Function | ESTree.ArrowFunctionExpression;

const FUNCTION_TYPES: readonly string[] = [
  "FunctionDeclaration",
  "FunctionExpression",
  "ArrowFunctionExpression",
  "TSDeclareFunction",
  "TSEmptyBodyFunctionExpression",
];

const KNOWN_VALUE_TYPES: readonly string[] = [
  "ObjectExpression",
  "ArrayExpression",
  "NewExpression",
  "Literal",
  "TemplateLiteral",
  "ArrowFunctionExpression",
  "FunctionExpression",
  "ClassExpression",
];

/** `x as const` / `<const>x`. */
export const isConstAssertion = (node: ESTree.Expression): boolean =>
  (node.type === "TSAsExpression" || node.type === "TSTypeAssertion") &&
  node.typeAnnotation.type === "TSTypeReference" &&
  node.typeAnnotation.typeName.type === "Identifier" &&
  node.typeAnnotation.typeName.name === "const" &&
  node.typeAnnotation.typeArguments === null;

/** Strip parentheses, `as const` and `satisfies` wrappers; none of them change the value. */
export const unwrapExpression = (node: ESTree.Expression): ESTree.Expression => {
  let current = node;

  for (;;) {
    if (current.type === "ParenthesizedExpression" || current.type === "TSSatisfiesExpression") {
      current = current.expression;
    } else if (
      (current.type === "TSAsExpression" || current.type === "TSTypeAssertion") &&
      isConstAssertion(current)
    ) {
      current = current.expression;
    } else {
      return current;
    }
  }
};

/**
 * `true` for expressions whose shape is evident where they are written: object and array
 * literals, `new X()`, primitive and template literals, function, arrow and class expressions.
 * Identifiers, calls and member reads are not known values even when they resolve to one.
 */
export const isKnownValueExpression = (node: ESTree.Expression): boolean =>
  KNOWN_VALUE_TYPES.includes(unwrapExpression(node).type);

/** `{}` or `[]`: the empty accumulator initializers. */
export const isEmptyContainer = (node: ESTree.Expression): boolean => {
  const value = unwrapExpression(node);

  return (
    (value.type === "ObjectExpression" && value.properties.length === 0) ||
    (value.type === "ArrayExpression" && value.elements.length === 0)
  );
};

/** Nearest function enclosing `node`, or `undefined` at module level. */
export const enclosingFunction = (node: ESTree.Node): FunctionLike | undefined => {
  let current: ESTree.Node | null = node.parent;

  while (current) {
    if (FUNCTION_TYPES.includes(current.type)) return current as FunctionLike;
    current = current.parent;
  }

  return undefined;
};

/** `true` when any function enclosing `node` has an `x is T` or `asserts x` return type. */
export const insideTypePredicate = (node: ESTree.Node): boolean => {
  for (let fn = enclosingFunction(node); fn; fn = enclosingFunction(fn)) {
    if (fn.returnType?.typeAnnotation.type === "TSTypePredicate") return true;
  }

  return false;
};
