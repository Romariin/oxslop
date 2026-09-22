import type { ESTree } from "@oxlint/plugins";

import {
  enclosingFunction,
  isEmptyContainer,
  isKnownValueExpression,
} from "../shared/known-values.ts";
import { defineRule } from "../shared/rule.ts";
import { dictionaryValueType, isWideType, parameterType } from "../shared/types.ts";

/**
 * Reports known values written into a wide target: a `const` (or never-reassigned `let`)
 * annotation, a parameter default, or a `return` in a function with a wide explicit return type.
 * `{}`/`[]` into a dictionary target is the accumulator idiom and stays valid. Calls, identifiers
 * and member reads are not known values, so `const x: unknown = JSON.parse(s)` is untouched.
 */
export default defineRule({
  meta: {
    type: "suggestion",
    docs: {
      description:
        "Disallow annotating literals of known shape with `unknown`, `object` or an open dictionary type.",
    },
    messages: {
      knownValueWidening:
        "Drop the `{{type}}` annotation on this known value; let its type be inferred, or check it with `satisfies` without widening.",
    },
    schema: [],
  },
  createOnce(context) {
    const check = (value: ESTree.Expression, target: ESTree.TSType): void => {
      if (!isWideType(context, target) || !isKnownValueExpression(value)) return;
      if (isEmptyContainer(value) && dictionaryValueType(context, target) !== undefined) return;
      context.report({
        node: value,
        messageId: "knownValueWidening",
        data: { type: context.sourceCode.getText(target) },
      });
    };

    return {
      VariableDeclarator(node) {
        if (node.id.type !== "Identifier" || node.init === null) return;
        const annotation = node.id.typeAnnotation?.typeAnnotation;

        if (annotation === undefined || node.parent.type !== "VariableDeclaration") return;
        if (node.parent.kind === "var") return;
        if (node.parent.kind !== "const") {
          const variable = context.sourceCode.getDeclaredVariables(node)[0];

          if (variable?.references.some((reference) => reference.isWrite() && !reference.init))
            return;
        }

        check(node.init, annotation);
      },
      AssignmentPattern(node) {
        const parent =
          node.parent.type === "TSParameterProperty" ? node.parent.parent : node.parent;

        if (
          parent.type !== "FunctionDeclaration" &&
          parent.type !== "FunctionExpression" &&
          parent.type !== "ArrowFunctionExpression"
        ) {
          return;
        }

        const type = parameterType(node);

        if (type !== undefined) check(node.right, type);
      },
      ReturnStatement(node) {
        if (node.argument === null) return;
        const type = enclosingFunction(node)?.returnType?.typeAnnotation;

        if (type !== undefined) check(node.argument, type);
      },
      ArrowFunctionExpression(node) {
        const type = node.returnType?.typeAnnotation;

        if (node.expression && type !== undefined) check(node.body as ESTree.Expression, type);
      },
    };
  },
});
