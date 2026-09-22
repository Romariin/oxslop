import { effectMemberOf, isPipeCall } from "../shared/effect.ts";
import { defineRule } from "../shared/rule.ts";

/**
 * Reports the second and later `Layer.provide`/`Layer.provideMerge` stages inside a single
 * `pipe(...)` or `.pipe(...)` call. One provide stage mixed with other combinators is fine.
 */

export default defineRule({
  meta: {
    type: "suggestion",
    docs: {
      description:
        "Disallow several `Layer.provide` stages inside one `pipe`; merge the layers first.",
    },
    messages: {
      cascadingProvide:
        "Merge the layers with `Layer.mergeAll(...)` and keep a single `Layer.provide` stage in this pipe.",
    },
    schema: [],
  },
  createOnce(context) {
    return {
      CallExpression(node) {
        if (!isPipeCall(context, node)) return;
        let provides = 0;
        const firstStage =
          node.callee.type === "Identifier" ||
          effectMemberOf(context, node.callee)?.module === "Function"
            ? 1
            : 0;

        for (let index = firstStage; index < node.arguments.length; index += 1) {
          let call = node.arguments[index];

          if (call === undefined) continue;
          while (call.type === "ParenthesizedExpression") call = call.expression;
          if (call.type !== "CallExpression") continue;
          const found = effectMemberOf(context, call.callee);

          if (
            found?.module !== "Layer" ||
            (found.member !== "provide" && found.member !== "provideMerge")
          ) {
            continue;
          }

          provides += 1;

          if (provides > 1) context.report({ node: call, messageId: "cascadingProvide" });
        }
      },
    };
  },
});
