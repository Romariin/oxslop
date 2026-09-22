import type { ESTree, Variable } from "@oxlint/plugins";

import {
  enclosingFunction,
  isConstAssertion,
  isKnownValueExpression,
  unwrapExpression,
} from "../shared/known-values.ts";
import { defineRule } from "../shared/rule.ts";
import { isWideType } from "../shared/types.ts";

/** The declarator behind a variable, when it is a `const` or a never-reassigned `let`. */
const immutableDeclarator = (variable: Variable): ESTree.VariableDeclarator | undefined => {
  const def = variable.defs[0];

  if (
    variable.defs.length !== 1 ||
    def?.type !== "Variable" ||
    def.node.type !== "VariableDeclarator"
  ) {
    return undefined;
  }

  if (def.node.parent.type !== "VariableDeclaration" || def.node.parent.kind === "var")
    return undefined;

  if (variable.references.some((reference) => reference.isWrite() && !reference.init))
    return undefined;

  return def.node;
};

/**
 * Follows one immutable binding: a variable declared with a wide annotation, or widened through
 * an `as unknown`-style initializer, from a known value. Only assertions in the same function
 * (or module scope) as the declaration are reported, and only when the asserted type is itself
 * narrow. Bindings that flow through calls, parameters or other files are not tracked.
 */
export default defineRule({
  meta: {
    type: "problem",
    docs: {
      description:
        "Disallow widening a known value to `unknown`/`any`/`object` and asserting it back later.",
    },
    messages: {
      widenThenAssert:
        "Remove the assertion and the wide type on `{{name}}`; keep the inferred type of its initializer instead of widening it and asserting it back.",
    },
    schema: [],
  },
  createOnce(context) {
    return {
      VariableDeclarator(node) {
        if (node.id.type !== "Identifier" || node.init === null) return;
        const variable = context.sourceCode.getDeclaredVariables(node)[0];

        if (variable === undefined || immutableDeclarator(variable) !== node) return;

        const init = unwrapExpression(node.init);
        const annotation = node.id.typeAnnotation?.typeAnnotation;
        const widened =
          annotation !== undefined
            ? isWideType(context, annotation) && isKnownValueExpression(init)
            : (init.type === "TSAsExpression" || init.type === "TSTypeAssertion") &&
              isWideType(context, init.typeAnnotation) &&
              isKnownValueExpression(init.expression);

        if (!widened) return;

        const boundary = enclosingFunction(node);

        for (const reference of variable.references) {
          if (!reference.isRead()) continue;
          let expression: ESTree.Node = reference.identifier;

          while (expression.parent.type === "ParenthesizedExpression")
            expression = expression.parent;

          const assertion = expression.parent;

          if (assertion.type !== "TSAsExpression" && assertion.type !== "TSTypeAssertion") continue;
          if (isConstAssertion(assertion) || isWideType(context, assertion.typeAnnotation))
            continue;

          if (enclosingFunction(assertion) !== boundary) continue;
          context.report({
            node: assertion,
            messageId: "widenThenAssert",
            data: { name: node.id.name },
          });
        }
      },
    };
  },
});
