import type { Context, ESTree, Scope } from "@oxlint/plugins";

import { isGlobalName } from "./globals.ts";

type TSType = ESTree.TSType;

/**
 * Same-file type alias resolution.
 *
 * Follows `type A = B` chains declared anywhere in the file (block scoped, forward references) and
 * transparent generic aliases (`type Wrap<T> = T`). Stops at interfaces, imported types, and any
 * alias that is not a plain rename. Never consults a type checker.
 */

const MAX_DEPTH = 16;

const aliasDeclaration = (
  context: Context,
  name: ESTree.TSTypeName,
): ESTree.TSTypeAliasDeclaration | undefined => {
  if (name.type !== "Identifier") return undefined;
  let scope: Scope | null = context.sourceCode.getScope(name);

  while (scope) {
    const variable = scope.set.get(name.name);

    if (variable) {
      for (const def of variable.defs) {
        if (def.node.type === "TSTypeAliasDeclaration") return def.node;
      }

      return undefined;
    }

    scope = scope.upper;
  }

  return undefined;
};

/** Strip parentheses and follow same-file aliases until a structural type is reached. */
export const resolveType = (context: Context, type: TSType, depth = 0): TSType => {
  if (depth > MAX_DEPTH) return type;
  if (type.type === "TSParenthesizedType")
    return resolveType(context, type.typeAnnotation, depth + 1);

  if (type.type !== "TSTypeReference") return type;

  const alias = aliasDeclaration(context, type.typeName);

  if (!alias) return type;

  const params = alias.typeParameters?.params ?? [];

  if (params.length === 0) return resolveType(context, alias.typeAnnotation, depth + 1);

  // Transparent generic alias: `type Wrap<T> = T` → resolve to the matching argument.
  let body = alias.typeAnnotation;

  while (body.type === "TSParenthesizedType") body = body.typeAnnotation;

  if (body.type === "TSTypeReference" && body.typeName.type === "Identifier") {
    const index = params.findIndex(
      (param) => param.name.name === (body.typeName as ESTree.IdentifierReference).name,
    );

    const argument = type.typeArguments?.params[index] ?? params[index]?.default;

    if (index !== -1 && argument) return resolveType(context, argument, depth + 1);
  }

  return type;
};

/** Members of a union after resolution; a non-union yields itself. */
export const unionMembers = (context: Context, type: TSType, seen?: Set<TSType>): TSType[] => {
  const resolved = resolveType(context, type);

  if (resolved.type !== "TSUnionType") return [resolved];
  if (seen?.has(resolved)) return [];
  const visited = seen ?? new Set<TSType>();
  visited.add(resolved);

  return resolved.types.flatMap((member) => unionMembers(context, member, visited));
};

export const isUnknown = (context: Context, type: TSType): boolean =>
  resolveType(context, type).type === "TSUnknownKeyword";

export const isAny = (context: Context, type: TSType): boolean =>
  resolveType(context, type).type === "TSAnyKeyword";

export const isObjectKeyword = (context: Context, type: TSType): boolean =>
  resolveType(context, type).type === "TSObjectKeyword";

/** `{}`: the empty type literal. */
export const isEmptyTypeLiteral = (context: Context, type: TSType): boolean => {
  const resolved = resolveType(context, type);

  return resolved.type === "TSTypeLiteral" && resolved.members.length === 0;
};

/** Name of a type reference: `Foo` → `"Foo"`, `Ns.Foo` → `"Ns.Foo"`. */
export const referenceName = (name: ESTree.TSTypeName): string => {
  if (name.type === "Identifier") return name.name;
  if (name.type === "ThisExpression") return "this";
  return `${referenceName(name.left)}.${name.right.name}`;
};

/**
 * Value type of a dictionary-like type, when the type is one:
 * `Record<K, V>`, `{ [key: string]: V }`, `Partial<Record<K, V>>`, `Readonly<...>`.
 */
export const dictionaryValueType = (
  context: Context,
  type: TSType,
  seen?: Set<TSType>,
): TSType | undefined => {
  const resolved = resolveType(context, type);

  if (resolved.type === "TSTypeLiteral") {
    const index = resolved.members.find((member) => member.type === "TSIndexSignature");

    return index?.type === "TSIndexSignature" ? index.typeAnnotation.typeAnnotation : undefined;
  }

  if (
    resolved.type !== "TSTypeReference" ||
    resolved.typeName.type !== "Identifier" ||
    !isGlobalName(context, resolved.typeName)
  ) {
    return undefined;
  }

  const name = referenceName(resolved.typeName);
  const args = resolved.typeArguments?.params ?? [];

  if (name === "Record" && args.length === 2) return args[1];
  if ((name === "Partial" || name === "Readonly" || name === "Required") && args[0]) {
    if (seen?.has(resolved)) return undefined;
    const visited = seen ?? new Set<TSType>();
    visited.add(resolved);

    return dictionaryValueType(context, args[0], visited);
  }

  return undefined;
};

/**
 * `true` when the type is a wide escape hatch: `unknown`, `any`, `object`, `{}`, or a dictionary
 * whose values are one of those. Unions are wide when any member is wide.
 */
export const isWideType = (context: Context, type: TSType, seen?: Set<TSType>): boolean => {
  if (seen?.has(type)) return false;
  seen?.add(type);

  return unionMembers(context, type).some((member) => {
    if (
      member.type === "TSUnknownKeyword" ||
      member.type === "TSAnyKeyword" ||
      member.type === "TSObjectKeyword" ||
      (member.type === "TSTypeLiteral" && member.members.length === 0)
    ) {
      return true;
    }

    const value = dictionaryValueType(context, member);

    return value !== undefined && isWideType(context, value, seen ?? new Set([type]));
  });
};

/** Function-like nodes that carry parameters and an optional return type. */
export type FunctionNode =
  | ESTree.Function
  | ESTree.ArrowFunctionExpression
  | ESTree.TSFunctionType
  | ESTree.TSMethodSignature
  | ESTree.TSCallSignatureDeclaration
  | ESTree.TSConstructSignatureDeclaration
  | ESTree.TSConstructorType;

export const FUNCTION_SELECTOR =
  "FunctionDeclaration, FunctionExpression, ArrowFunctionExpression, TSDeclareFunction, TSEmptyBodyFunctionExpression, TSFunctionType, TSMethodSignature, TSCallSignatureDeclaration, TSConstructSignatureDeclaration, TSConstructorType";

/** Type annotation of a parameter pattern, unwrapping `TSParameterProperty` and assignment defaults. */
export const parameterType = (param: ESTree.Node): TSType | undefined => {
  if (param.type === "TSParameterProperty") return parameterType(param.parameter);
  if (param.type === "AssignmentPattern") return parameterType(param.left);
  if (param.type === "RestElement") return param.typeAnnotation?.typeAnnotation;
  if ("typeAnnotation" in param) {
    const annotation = param.typeAnnotation;

    if (annotation && typeof annotation === "object" && annotation.type === "TSTypeAnnotation") {
      return annotation.typeAnnotation;
    }
  }

  return undefined;
};

/** Binding name of a parameter, when it is a plain identifier. */
export const parameterName = (param: ESTree.Node): string | undefined => {
  if (param.type === "TSParameterProperty") return parameterName(param.parameter);
  if (param.type === "AssignmentPattern") return parameterName(param.left);
  if (param.type === "RestElement") return parameterName(param.argument);
  return param.type === "Identifier" ? param.name : undefined;
};

/** Element types a rest parameter receives: `T[]`, `Array<T>`, `ReadonlyArray<T>`, `[A, B]`; empty when unrecognised. */
export const restElementTypes = (context: Context, type: TSType, seen?: Set<TSType>): TSType[] => {
  if (seen?.has(type)) return [];
  seen?.add(type);
  const resolved = resolveType(context, type);

  if (resolved.type === "TSUnionType") {
    const visited = seen ?? new Set([type]);

    return resolved.types.flatMap((member) => restElementTypes(context, member, visited));
  }

  if (resolved.type === "TSTypeOperator" && resolved.operator === "readonly") {
    return restElementTypes(context, resolved.typeAnnotation, seen ?? new Set([type]));
  }

  if (resolved.type === "TSNamedTupleMember") {
    const element = resolved.elementType;

    return restElementTypes(
      context,
      element.type === "TSRestType" || element.type === "TSOptionalType"
        ? element.typeAnnotation
        : element,
      seen ?? new Set([type]),
    );
  }

  if (resolved.type === "TSArrayType") return [resolved.elementType];
  if (resolved.type === "TSTupleType") {
    return resolved.elementTypes.flatMap((element) => {
      const inner = element.type === "TSNamedTupleMember" ? element.elementType : element;

      if (inner.type === "TSRestType") {
        return restElementTypes(context, inner.typeAnnotation, seen ?? new Set([type]));
      }

      return [inner.type === "TSOptionalType" ? inner.typeAnnotation : inner];
    });
  }

  if (resolved.type === "TSTypeReference" && resolved.typeName.type === "Identifier") {
    const argument = resolved.typeArguments?.params[0];

    if (
      (resolved.typeName.name === "Array" || resolved.typeName.name === "ReadonlyArray") &&
      argument &&
      isGlobalName(context, resolved.typeName)
    ) {
      return [argument];
    }
  }

  return [];
};
