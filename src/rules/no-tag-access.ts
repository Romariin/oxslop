import { staticMemberName } from "../shared/globals.ts";
import { defineRule } from "../shared/rule.ts";

/**
 * Reports runtime reads of `_tag`: member access (`x._tag`, `x["_tag"]`, `x?._tag`) and
 * destructuring (`const { _tag } = x`, `({ _tag: t }) => ...`).
 *
 * Not reported: type positions (`T["_tag"]`, `{ _tag: "A" }` type literals), object literal keys
 * (covered by `no-manual-tagged-construction`), class field declarations, writes such as
 * `this._tag = "A"`, and reads of `this._tag` inside the class that owns the tag.
 */

export default defineRule({
  meta: {
    type: "suggestion",
    docs: {
      description:
        "Disallow reading `_tag` directly; use `Match`, `Effect.catchTag` or `Predicate.isTagged`.",
    },
    messages: {
      tagAccess:
        "Replace the `_tag` read with `Match.tag(...)`, `Effect.catchTag(...)` or `Predicate.isTagged(...)`.",
    },
    schema: [],
  },
  createOnce(context) {
    return {
      MemberExpression(node) {
        if (staticMemberName(node) !== "_tag" || node.object.type === "ThisExpression") return;
        const { parent } = node;

        if (
          parent.type === "AssignmentExpression" &&
          parent.left === node &&
          parent.operator === "="
        )
          return;

        if (parent.type === "UnaryExpression" && parent.operator === "delete") return;
        context.report({ node, messageId: "tagAccess" });
      },
      ObjectPattern(node) {
        for (const property of node.properties) {
          if (property.type !== "Property") continue;
          const { key } = property;
          const isTag =
            (key.type === "Literal" && key.value === "_tag") ||
            (!property.computed && key.type === "Identifier" && key.name === "_tag");

          if (isTag) context.report({ node: property, messageId: "tagAccess" });
        }
      },
    };
  },
});
