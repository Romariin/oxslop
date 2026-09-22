import { isDirectiveComment, isJsdocComment, startsWithMarker } from "../shared/comments.ts";
import { defineRule, readOptions } from "../shared/rule.ts";

interface Options {
  /** Markers (without the colon) whose comments stay: `SAFETY:` by default. */
  allow: string[];
  /** Keep `/** ... *\/` blocks, which document the API rather than the implementation. */
  allowJsdoc: boolean;
}

const DEFAULTS: Options = { allow: ["SAFETY"], allowJsdoc: true };

/**
 * Every comment is reported except tooling directives (see `isDirectiveComment`), comments opened
 * by an allowed marker and, by default, JSDoc blocks. Marker matching is case-sensitive and
 * requires the colon or a parenthesised scope right after the marker.
 */
export default defineRule({
  meta: {
    type: "suggestion",
    docs: {
      description:
        "Disallow comments other than `SAFETY:`, tooling directives and, by default, JSDoc.",
    },
    messages: {
      comment:
        "Delete the comment; express it through a name, a type or a test. Allowed markers: `{{allowed}}`. Tooling directives and configured JSDoc stay.",
    },
    schema: [
      {
        type: "object",
        properties: {
          allow: { type: "array", items: { type: "string" }, uniqueItems: true },
          allowJsdoc: { type: "boolean" },
        },
        additionalProperties: false,
      },
    ],
  },
  createOnce(context) {
    let options = DEFAULTS;

    return {
      before() {
        options = readOptions(context, DEFAULTS);
      },
      Program() {
        const allowed = options.allow.map((marker) => `${marker}:`).join("`, `");

        for (const comment of context.sourceCode.getAllComments()) {
          if (isDirectiveComment(comment)) continue;
          if (options.allowJsdoc && isJsdocComment(comment)) continue;
          if (startsWithMarker(comment, options.allow)) continue;
          context.report({ messageId: "comment", data: { allowed }, loc: comment.loc });
        }
      },
    };
  },
});
