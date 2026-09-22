import type { Fix, Fixer, SourceCode, Span } from "@oxlint/plugins";

/**
 * Blank-line helpers for padding rules.
 *
 * Comments written above a statement belong to that statement, so a blank line "before" a
 * statement means a blank line somewhere between the previous sibling's last token (including
 * trailing same-line comments) and the statement's first leading comment.
 */

const commentsBetween = (sourceCode: SourceCode, previous: Span, node: Span) =>
  sourceCode.getTokensBetween(previous, node, { includeComments: true });

/** `true` when at least one blank line separates `previous` from `node` or its leading comments. */
export const hasBlankLineBetween = (
  sourceCode: SourceCode,
  previous: Span,
  node: Span,
): boolean => {
  let line = previous.loc.end.line;

  for (const item of [...commentsBetween(sourceCode, previous, node), node]) {
    if (item.loc.start.line - line >= 2) return true;
    line = item.loc.end.line;
  }

  return false;
};

/**
 * Fix inserting a blank line after the last token or trailing comment on `previous`'s final line,
 * so leading comments stay attached to `node`.
 */
export const insertBlankLineBetween = (
  sourceCode: SourceCode,
  fixer: Fixer,
  previous: Span,
  node: Span,
): Fix => {
  let anchor: Span = previous;
  let next: Span = node;

  for (const comment of commentsBetween(sourceCode, previous, node)) {
    if (comment.loc.start.line !== anchor.loc.end.line) {
      next = comment;

      break;
    }

    anchor = comment;
  }

  return fixer.insertTextAfter(anchor, next.loc.start.line === anchor.loc.end.line ? "\n\n" : "\n");
};
