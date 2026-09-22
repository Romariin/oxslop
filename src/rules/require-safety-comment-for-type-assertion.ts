import type { Comment } from "@oxlint/plugins";

import { isConstAssertion } from "../shared/assertions.ts";
import type { TypeAssertion } from "../shared/assertions.ts";
import { defineRule, readOptions } from "../shared/rule.ts";
import type { ESTree } from "../shared/rule.ts";

interface Options {
  markers: string[];
}

const DEFAULTS: Options = { markers: ["SAFETY"] };

const STATEMENT_LIKE = /(?:Statement|Declaration)$|^(?:PropertyDefinition|AccessorProperty)$/;

/** Nearest enclosing statement, class field, or export wrapper of `node`. */
const enclosingStatement = (node: ESTree.Node): ESTree.Node => {
  let current = node;

  while (!STATEMENT_LIKE.test(current.type) && current.parent) current = current.parent;
  const { parent } = current;

  return parent &&
    (parent.type === "ExportNamedDeclaration" || parent.type === "ExportDefaultDeclaration")
    ? parent
    : current;
};

/** `// SAFETY: reason`, `/* SAFETY: reason *\/`, or a JSDoc block whose first text is the marker. */
const justifies = (comment: Comment, markers: readonly string[]): boolean => {
  const text = comment.value.replace(/^[\s*]+/, "");

  return markers.some(
    (marker) => text.startsWith(`${marker}:`) && text.slice(marker.length + 1).trim() !== "",
  );
};

/**
 * A comment justifies an assertion when it shares a line with the assertion or sits in the
 * contiguous comment block right above the enclosing statement (no blank line between). A trailing
 * comment of the previous statement on the line above therefore also counts; no heuristics decide
 * which statement it belongs to.
 */
export default defineRule({
  meta: {
    type: "suggestion",
    docs: { description: "Require a `SAFETY:` comment justifying every non-const type assertion." },
    messages: {
      missingSafetyComment:
        "Add a `{{marker}}: <reason>` comment on this line or directly above the statement explaining why the assertion holds, or replace it with a parse or type guard.",
    },
    schema: [
      {
        type: "object",
        properties: {
          markers: { type: "array", items: { type: "string", minLength: 1 }, minItems: 1 },
        },
        additionalProperties: false,
      },
    ],
  },
  createOnce(context) {
    let markers: readonly string[] = DEFAULTS.markers;
    let comments: Comment[] = [];

    const justifiedAbove = (statement: ESTree.Node): boolean => {
      let line = statement.loc.start.line;

      for (const comment of comments.toReversed()) {
        if (comment.end > statement.start) continue;
        if (comment.loc.end.line < line - 1) return false;
        if (justifies(comment, markers)) return true;
        line = comment.loc.start.line;
      }

      return false;
    };

    const check = (node: TypeAssertion): void => {
      if (isConstAssertion(node)) return;
      const first = node.loc.start.line;
      const last = node.loc.end.line;
      const sameLine = comments.some(
        (comment) =>
          comment.loc.end.line >= first &&
          comment.loc.start.line <= last &&
          justifies(comment, markers),
      );

      if (sameLine || justifiedAbove(enclosingStatement(node))) return;
      context.report({
        node,
        messageId: "missingSafetyComment",
        data: { marker: markers[0] ?? "SAFETY" },
      });
    };

    return {
      before() {
        markers = readOptions(context, DEFAULTS).markers;
        comments = [];
      },
      Program() {
        comments = context.sourceCode.getAllComments();
      },
      TSAsExpression: check,
      TSTypeAssertion: check,
    };
  },
});
