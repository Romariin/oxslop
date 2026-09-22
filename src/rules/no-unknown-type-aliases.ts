import { defineRule } from "../shared/rule.ts";
import { unionMembers } from "../shared/types.ts";

/**
 * Reports `type X = unknown`, aliases of such aliases, and unions containing `unknown` (which
 * collapse to `unknown`). Generic aliases that merely forward a parameter (`type X<T> = T`) are
 * valid; instantiations are not inspected.
 */
export default defineRule({
  meta: {
    type: "problem",
    docs: { description: "Disallow type aliases whose resolved type is `unknown`." },
    messages: {
      unknownAlias:
        "Give `{{name}}` a concrete shape instead of `unknown`; an alias for `unknown` only hides the missing type.",
    },
    schema: [],
  },
  createOnce(context) {
    return {
      TSTypeAliasDeclaration(node) {
        const wide = unionMembers(context, node.typeAnnotation).some(
          (member) => member.type === "TSUnknownKeyword",
        );

        if (wide) context.report({ node, messageId: "unknownAlias", data: { name: node.id.name } });
      },
    };
  },
});
