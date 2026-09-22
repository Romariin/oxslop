import type { ESTree } from "@oxlint/plugins";

import { defineRule, readOptions } from "../shared/rule.ts";

/**
 * Nested ternaries whose tests all compare one subject against literals with `===` / `!==`:
 * `a === 1 ? x : a === 2 ? y : z`. Only the `alternate` branch is followed, which is the shape a
 * `switch`-like chain takes; the subject is compared by source text, so `a.b` and `a["b"]` count as
 * different subjects. `if`/`else if` chains are out of scope.
 */

interface Options {
  /** Smallest number of chained conditionals that triggers the rule. */
  minCases: number;
}

const DEFAULTS: Options = { minCases: 2 };

const unwrap = (node: ESTree.Expression): ESTree.Expression =>
  node.type === "ParenthesizedExpression" ? unwrap(node.expression) : node;

const isLiteral = (node: ESTree.Expression): boolean =>
  node.type === "Literal" || (node.type === "TemplateLiteral" && node.expressions.length === 0);

/** Source text of the non-literal side of a strict-equality test against a literal. */
const equalitySubject = (
  test: ESTree.Expression,
  getText: (node: ESTree.Node) => string,
): string | undefined => {
  if (test.type !== "BinaryExpression" || (test.operator !== "===" && test.operator !== "!=="))
    return undefined;

  const left = unwrap(test.left as ESTree.Expression);
  const right = unwrap(test.right);

  if (isLiteral(right) && !isLiteral(left)) return getText(left);
  if (isLiteral(left) && !isLiteral(right)) return getText(right);
  return undefined;
};

export default defineRule({
  meta: {
    type: "suggestion",
    docs: { description: "Prefer `Match` over chained literal ternaries on the same subject." },
    messages: {
      preferMatch:
        "Replace the ternary chain on `{{subject}}` with `Match.value({{subject}}).pipe(Match.when(...), Match.orElse(...))`.",
    },
    schema: [
      {
        type: "object",
        properties: { minCases: { type: "integer", minimum: 2 } },
        additionalProperties: false,
      },
    ],
  },
  createOnce(context) {
    let options = DEFAULTS;
    const getText = (node: ESTree.Node): string => context.sourceCode.getText(node);

    return {
      before() {
        options = readOptions(context, DEFAULTS);
      },
      ConditionalExpression(node) {
        const subject = equalitySubject(unwrap(node.test), getText);

        if (subject === undefined) return;

        const { parent } = node;

        if (
          parent.type === "ConditionalExpression" &&
          unwrap(parent.alternate) === node &&
          equalitySubject(unwrap(parent.test), getText) === subject
        ) {
          return;
        }

        let cases = 1;
        let next = unwrap(node.alternate);

        while (
          next.type === "ConditionalExpression" &&
          equalitySubject(unwrap(next.test), getText) === subject
        ) {
          cases += 1;
          next = unwrap(next.alternate);
        }

        if (cases < options.minCases) return;
        context.report({ node, messageId: "preferMatch", data: { subject } });
      },
    };
  },
});
