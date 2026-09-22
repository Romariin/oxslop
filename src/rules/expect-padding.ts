import type { ESTree } from "@oxlint/plugins";

import { hasBlankLineBetween, insertBlankLineBetween } from "../shared/padding.ts";
import { defineRule } from "../shared/rule.ts";

/**
 * A maximal run of consecutive `expect(...)`-rooted statements (`expect(x).toBe(y)`,
 * `await expect(p).resolves.toBe(y)`, `expect.soft(x)...`) inside a block must be separated from
 * the surrounding statements by a blank line on both sides. Runs at the start or end of a block
 * need no padding there. `expect` is matched by name; a differently named assertion helper is
 * not recognised.
 */

/** `true` when the statement is an expression whose call chain is rooted at `expect`. */
const isExpectStatement = (statement: ESTree.Statement): boolean => {
  if (statement.type !== "ExpressionStatement") return false;
  let current: ESTree.Node = statement.expression;

  for (;;) {
    switch (current.type) {
      case "AwaitExpression":
        current = current.argument;
        continue;
      case "ChainExpression":
        current = current.expression;
        continue;
      case "CallExpression":
        current = current.callee;
        continue;
      case "MemberExpression":
        current = current.object;
        continue;
      case "Identifier":
        return current.name === "expect" && current !== statement.expression;
      default:
        return false;
    }
  }
};

export default defineRule({
  meta: {
    type: "layout",
    docs: { description: "Require blank lines isolating runs of `expect()` calls." },
    messages: {
      beforeRun: "Insert a blank line before this run of `expect()` calls.",
      afterRun: "Insert a blank line between the preceding `expect()` calls and this statement.",
    },
    schema: [],
    fixable: "whitespace",
  },
  createOnce(context) {
    const pad = (
      previous: ESTree.Statement,
      node: ESTree.Statement,
      messageId: "beforeRun" | "afterRun",
    ): void => {
      if (hasBlankLineBetween(context.sourceCode, previous, node)) return;
      context.report({
        node,
        messageId,
        fix: (fixer) => insertBlankLineBetween(context.sourceCode, fixer, previous, node),
      });
    };

    return {
      BlockStatement(node) {
        const { body } = node;
        let index = 0;

        while (index < body.length) {
          const first = body[index];

          if (first === undefined || !isExpectStatement(first)) {
            index += 1;

            continue;
          }

          const previous = body[index - 1];

          if (previous) pad(previous, first, "beforeRun");
          while (index < body.length && isExpectStatement(body[index] as ESTree.Statement))
            index += 1;

          const last = body[index - 1];
          const next = body[index];

          if (last && next) pad(last, next, "afterRun");
        }
      },
    };
  },
});
