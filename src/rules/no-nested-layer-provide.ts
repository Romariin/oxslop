import type { Context, ESTree } from "@oxlint/plugins";

import { effectMemberOf, isPipeCall } from "../shared/effect.ts";
import { defineRule } from "../shared/rule.ts";

/**
 * Reports a `Layer.provide`/`Layer.provideMerge` call that appears as an argument of another
 * `Layer.provide*` call, either directly or through a `pipe(...)`/`.pipe(...)` chain passed as the
 * argument. The inner call is reported.
 *
 * Only arguments are inspected: `Layer.provide` used in separate statements, or wrapped with
 * `Layer.merge`/`Layer.mergeAll`, is not reported.
 */

const isLayerProvide = (context: Context, node: ESTree.CallExpression): boolean => {
  const found = effectMemberOf(context, node.callee);

  return (
    found !== undefined &&
    found.module === "Layer" &&
    (found.member === "provide" || found.member === "provideMerge")
  );
};

const unwrap = (node: ESTree.Node): ESTree.Node => {
  let current = node;

  while (
    current.type === "ParenthesizedExpression" ||
    current.type === "TSAsExpression" ||
    current.type === "TSSatisfiesExpression" ||
    current.type === "TSNonNullExpression"
  ) {
    current = current.expression;
  }

  return current;
};

export default defineRule({
  meta: {
    type: "suggestion",
    docs: { description: "Disallow `Layer.provide` nested inside another `Layer.provide`." },
    messages: {
      nestedProvide:
        "Flatten the nested `Layer.provide`: combine the layers with `Layer.merge`/`Layer.mergeAll` and provide them in one stage.",
    },
    schema: [],
  },
  createOnce(context) {
    const reportProvides = (argument: ESTree.Node): void => {
      const node = unwrap(argument);

      if (node.type !== "CallExpression") return;
      if (isLayerProvide(context, node)) {
        context.report({ node, messageId: "nestedProvide" });

        return;
      }

      if (!isPipeCall(context, node)) return;
      if (node.callee.type === "MemberExpression") reportProvides(node.callee.object);
      for (const stage of node.arguments) reportProvides(stage);
    };

    return {
      CallExpression(node) {
        if (!isLayerProvide(context, node)) return;
        for (const argument of node.arguments) reportProvides(argument);
      },
    };
  },
});
