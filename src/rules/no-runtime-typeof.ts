import type { ESTree } from "@oxlint/plugins";

import { insideTypePredicate, unwrapExpression } from "../shared/known-values.ts";
import { defineRule, readOptions } from "../shared/rule.ts";

interface Options {
  /** Allow `typeof` comparisons inside functions returning `x is T` or `asserts x`. */
  readonly allowInTypePredicates: boolean;
}

const DEFAULTS: Options = { allowInTypePredicates: true };

const EQUALITY: readonly string[] = ["===", "!==", "==", "!="];

const isTypeof = (node: ESTree.Expression): node is ESTree.UnaryExpression =>
  node.type === "UnaryExpression" && node.operator === "typeof";

/** `"undefined"` as a string or expression-free template literal. */
const isUndefinedString = (node: ESTree.Expression): boolean =>
  (node.type === "Literal" && node.value === "undefined") ||
  (node.type === "TemplateLiteral" &&
    node.expressions.length === 0 &&
    node.quasis[0]?.value.cooked === "undefined");

/**
 * Reports value-level `typeof` comparisons and `switch (typeof x)`. Comparisons against
 * `"undefined"` are existence probes and stay valid. `typeof` in type positions is a
 * `TSTypeQuery` node and is never visited.
 */
export default defineRule({
  meta: {
    type: "problem",
    docs: {
      description:
        'Disallow runtime `typeof` comparisons and switches, except `"undefined"` probes and, by default, type-predicate functions.',
    },
    messages: {
      runtimeTypeof:
        "Replace the `typeof` check with parsing at the boundary; decode the value into a named type once and branch on that type.",
    },
    schema: [
      {
        type: "object",
        properties: { allowInTypePredicates: { type: "boolean" } },
        additionalProperties: false,
      },
    ],
  },
  createOnce(context) {
    let options = DEFAULTS;
    const allowed = (node: ESTree.Node): boolean =>
      options.allowInTypePredicates && insideTypePredicate(node);

    return {
      before() {
        options = readOptions(context, DEFAULTS);
      },
      BinaryExpression(node) {
        if (!EQUALITY.includes(node.operator)) return;
        const left = unwrapExpression(node.left);
        const right = unwrapExpression(node.right);
        const probe = isTypeof(left) ? right : isTypeof(right) ? left : undefined;

        if (probe === undefined || isUndefinedString(probe) || allowed(node)) return;
        context.report({ node, messageId: "runtimeTypeof" });
      },
      SwitchStatement(node) {
        const discriminant = unwrapExpression(node.discriminant);

        if (!isTypeof(discriminant) || allowed(node)) return;
        context.report({ node: discriminant, messageId: "runtimeTypeof" });
      },
    };
  },
});
