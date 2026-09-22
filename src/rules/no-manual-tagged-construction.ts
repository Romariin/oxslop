import type { ESTree } from "@oxlint/plugins";

import { effectMemberOf } from "../shared/effect.ts";
import { defineRule } from "../shared/rule.ts";

/**
 * Reports object literals carrying a `_tag` property whose value is a plain string: the literal
 * impersonates a tagged union member instead of using a generated constructor.
 *
 * Not reported: patterns passed (directly or nested) to `Match.when`, `Match.whenOr`, `Match.not`,
 * `Match.tag`, `Match.tagStartsWith` or `Match.discriminator`, and type literals (they are not
 * expressions). The walk towards a `Match` call stops at function boundaries, so a handler that
 * builds a tagged object is still reported.
 */

const MATCH_PATTERN_MEMBERS = [
  "when",
  "whenOr",
  "not",
  "tag",
  "tagStartsWith",
  "discriminator",
] as const;

export default defineRule({
  meta: {
    type: "suggestion",
    docs: {
      description:
        "Disallow object literals with a `_tag` field; use `Data.taggedEnum`, `Schema.TaggedClass` or tagged errors.",
    },
    messages: {
      manualTag:
        "Replace the hand-written `_tag` object with a constructor from `Data.taggedEnum`, `Schema.TaggedClass`/`Schema.TaggedError` or `Data.TaggedError`.",
    },
    schema: [],
  },
  createOnce(context) {
    const insideMatchPattern = (object: ESTree.ObjectExpression): boolean => {
      let child: ESTree.Node = object;
      let { parent } = object;

      while (parent !== null) {
        switch (parent.type) {
          case "CallExpression": {
            const found = effectMemberOf(context, parent.callee);

            if (
              found !== undefined &&
              found.module === "Match" &&
              (MATCH_PATTERN_MEMBERS as readonly string[]).includes(found.member) &&
              parent.arguments.includes(child as ESTree.Argument)
            ) {
              return true;
            }

            break;
          }
          case "ArrowFunctionExpression":
          case "FunctionExpression":
          case "FunctionDeclaration":
          case "Program":
            return false;
          default:
            break;
        }

        child = parent;
        parent = parent.parent;
      }

      return false;
    };

    return {
      ObjectExpression(node) {
        for (const property of node.properties) {
          if (property.type !== "Property" || property.kind !== "init" || property.method) continue;
          const { key, value } = property;
          const isTag =
            (key.type === "Literal" && key.value === "_tag") ||
            (!property.computed && key.type === "Identifier" && key.name === "_tag");

          if (!isTag) continue;
          const plainString =
            (value.type === "Literal" && typeof value.value === "string") ||
            (value.type === "TemplateLiteral" && value.expressions.length === 0);

          if (plainString && !insideMatchPattern(node)) {
            context.report({ node: property, messageId: "manualTag" });
          }

          return;
        }
      },
    };
  },
});
