import type { ESTree } from "@oxlint/plugins";

import { isGlobalMethodCall, isGlobalName, staticMemberName } from "../shared/globals.ts";
import { defineRule } from "../shared/rule.ts";

/**
 * Inside a `reduce`/`reduceRight` callback, flags expressions that copy the accumulator (the
 * first callback parameter) on every iteration: `[...acc, x]`, `{ ...acc, k }`, `acc.concat(x)`,
 * `acc.slice()`, `Object.assign({}, acc)`, `Array.from(acc)`, `structuredClone(acc)`,
 * `new Map(acc)`, `new Set(acc)`. Each turns an O(n) fold into O(n^2).
 *
 * Only callbacks written inline as a function literal with a plain identifier accumulator are
 * inspected; references are resolved through scope, so a shadowing inner `acc` is ignored.
 */

const COPY_CONSTRUCTORS = ["Map", "Set"] as const;

export default defineRule({
  meta: {
    type: "problem",
    docs: { description: "Disallow copying the accumulator on every iteration inside `reduce`." },
    messages: {
      accumulatorCopy:
        "Mutate the accumulator in place (`acc.push(x)`, `acc[key] = value`) or build the result in a local array/object outside `reduce` instead of copying it on every iteration.",
    },
    schema: [],
  },
  createOnce(context) {
    /** The copy expression wrapping an accumulator reference, if it is one. */
    const copyOf = (id: ESTree.Node): ESTree.Node | undefined => {
      const { parent } = id as ESTree.Node & { parent: ESTree.Node };

      switch (parent.type) {
        case "SpreadElement": {
          const container = parent.parent;

          return container.type === "ArrayExpression" || container.type === "ObjectExpression"
            ? container
            : undefined;
        }
        case "MemberExpression": {
          const call = parent.parent;

          if (parent.object !== id || call.type !== "CallExpression" || call.callee !== parent)
            return undefined;

          const method = staticMemberName(parent);

          return method === "concat" || (method === "slice" && call.arguments.length === 0)
            ? call
            : undefined;
        }
        case "NewExpression":
          return parent.arguments[0] === id &&
            parent.callee.type === "Identifier" &&
            (COPY_CONSTRUCTORS as readonly string[]).includes(parent.callee.name) &&
            isGlobalName(context, parent.callee)
            ? parent
            : undefined;
        case "CallExpression": {
          const { callee } = parent;
          const first = parent.arguments[0];

          if (first === id) {
            const clones =
              (callee.type === "Identifier" &&
                callee.name === "structuredClone" &&
                isGlobalName(context, callee)) ||
              isGlobalMethodCall(context, parent, "Array", "from");

            return clones ? parent : undefined;
          }

          return first?.type === "ObjectExpression" &&
            first.properties.length === 0 &&
            isGlobalMethodCall(context, parent, "Object", "assign")
            ? parent
            : undefined;
        }
        default:
          return undefined;
      }
    };

    return {
      CallExpression(node) {
        if (node.callee.type !== "MemberExpression") return;
        const method = staticMemberName(node.callee);

        if (method !== "reduce" && method !== "reduceRight") return;
        const callback = node.arguments[0];

        if (callback?.type !== "ArrowFunctionExpression" && callback?.type !== "FunctionExpression")
          return;

        const accumulator = callback.params[0];

        if (accumulator?.type !== "Identifier") return;
        const variable = context.sourceCode
          .getDeclaredVariables(callback)
          .find((candidate) => candidate.name === accumulator.name);

        if (!variable) return;
        for (const reference of variable.references) {
          const copy = copyOf(reference.identifier);

          if (copy) context.report({ node: copy, messageId: "accumulatorCopy" });
        }
      },
    };
  },
});
