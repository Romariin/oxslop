import { innerAssertion, isConstAssertion, isTypeAssertion } from "../shared/assertions.ts";
import type { TypeAssertion } from "../shared/assertions.ts";
import type { ESTree } from "../shared/rule.ts";
import { defineRule } from "../shared/rule.ts";

/**
 * A chain is every assertion reachable through the asserted expression, ignoring parentheses.
 * Chains with at most one non-`const` link are valid, so `([] as const) as readonly string[]`
 * passes while `x as unknown as T` and `<T>(<U>x)` are reported once, at the outermost link.
 */
export default defineRule({
  meta: {
    type: "problem",
    docs: {
      description:
        "Disallow nested assertions such as `x as unknown as T`; chains of `as const` stay valid.",
    },
    messages: {
      chainedAssertion:
        "Replace the chained assertion with a single conversion: parse the value with a schema or narrow it with a type guard.",
    },
    schema: [],
  },
  createOnce(context) {
    const check = (node: TypeAssertion): void => {
      if (!innerAssertion(node)) return;
      let outer: ESTree.Node = node.parent;

      while (outer.type === "ParenthesizedExpression") outer = outer.parent;
      if (isTypeAssertion(outer)) return;

      let loose = 0;

      for (let link: TypeAssertion | undefined = node; link; link = innerAssertion(link)) {
        if (!isConstAssertion(link)) loose += 1;
      }

      if (loose > 1) context.report({ node, messageId: "chainedAssertion" });
    };

    return { TSAsExpression: check, TSTypeAssertion: check };
  },
});
