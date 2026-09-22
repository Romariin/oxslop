import { defineRule } from "../shared/rule.ts";
import type { ESTree } from "../shared/rule.ts";
import { FUNCTION_SELECTOR, referenceName, unionMembers } from "../shared/types.ts";
import type { FunctionNode } from "../shared/types.ts";

const PROMISE_LIKE = ["Promise", "PromiseLike"];

/**
 * Only explicit annotations are inspected; inferred return types and type predicates are valid.
 * Same-file aliases and unions are resolved, and `Promise<...>` / `PromiseLike<...>` wrappers are
 * looked through at any depth (`Promise<string | Promise<unknown>>`).
 */
export default defineRule({
  meta: {
    type: "problem",
    docs: {
      description:
        "Disallow explicit return types that resolve to `unknown`, `Promise<unknown>` or `PromiseLike<unknown>`.",
    },
    messages: {
      unknownReturn:
        "Replace `{{type}}` in the return type with a concrete type; parse or narrow the value inside the function so callers receive a typed result.",
    },
    schema: [],
  },
  createOnce(context) {
    const findUnknown = (type: ESTree.TSType): string | undefined => {
      for (const member of unionMembers(context, type)) {
        if (member.type === "TSUnknownKeyword") return "unknown";
        if (member.type !== "TSTypeReference") continue;
        const name = referenceName(member.typeName);
        const argument = member.typeArguments?.params[0];

        if (PROMISE_LIKE.includes(name) && argument && findUnknown(argument))
          return `${name}<unknown>`;
      }

      return undefined;
    };

    return {
      [FUNCTION_SELECTOR](node: FunctionNode) {
        const annotation = node.returnType;

        if (!annotation || annotation.typeAnnotation.type === "TSTypePredicate") return;
        const type = findUnknown(annotation.typeAnnotation);

        if (type)
          context.report({
            node: annotation.typeAnnotation,
            messageId: "unknownReturn",
            data: { type },
          });
      },
    };
  },
});
