import type { ESTree } from "@oxlint/plugins";

import { unwrapExpression } from "../shared/known-values.ts";
import { defineRule } from "../shared/rule.ts";

const isEmptyObject = (node: ESTree.Expression): boolean => {
  const value = unwrapExpression(node);

  return value.type === "ObjectExpression" && value.properties.length === 0;
};

/**
 * Reports spreads whose argument omits fields through an empty object: a conditional with a
 * `{}` branch, `cond && { ... }`, or a `{}` fallback on `||`/`??`. Spreading identifiers,
 * calls, or a conditional whose branches are both non-empty is untouched. No autofix: omitting
 * a property is not the same as assigning `undefined`.
 */
export default defineRule({
  meta: {
    type: "suggestion",
    docs: {
      description:
        "Disallow `...(cond ? { a } : {})` and `...(cond && { a })` used to omit fields.",
    },
    messages: {
      conditionalSpread:
        "Remove the conditional empty-object spread; build the object first and assign the property in a separate `if`, or spread the optional object directly.",
    },
    schema: [],
  },
  createOnce(context) {
    return {
      "ObjectExpression > SpreadElement"(node: ESTree.SpreadElement) {
        const argument = unwrapExpression(node.argument);
        const omits =
          argument.type === "ConditionalExpression"
            ? isEmptyObject(argument.consequent) || isEmptyObject(argument.alternate)
            : argument.type === "LogicalExpression" &&
              (isEmptyObject(argument.left) ||
                isEmptyObject(argument.right) ||
                (argument.operator === "&&" &&
                  unwrapExpression(argument.right).type === "ObjectExpression"));

        if (omits) context.report({ node, messageId: "conditionalSpread" });
      },
    };
  },
});
