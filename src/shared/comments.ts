import type { Comment } from "@oxlint/plugins";

export type { Comment };

/** Prefixes of comments that tools consume rather than humans. */
const DIRECTIVE_PREFIXES = [
  "oxlint-",
  "eslint-",
  "biome-",
  "prettier-",
  "@ts-",
  "c8 ",
  "v8 ",
  "istanbul ",
  "#region",
  "#endregion",
] as const;

/** Comment body without delimiters, trimmed. */
export const commentText = (comment: Comment): string => comment.value.trim();

/**
 * `true` for comments machinery reads: linter/formatter/coverage directives, region markers,
 * triple-slash references, shebangs and `/*!` license banners.
 */
export const isDirectiveComment = (comment: Comment): boolean => {
  if (comment.type === "Shebang") return true;
  const { value } = comment;

  if (comment.type === "Block" && value.startsWith("!")) return true;
  if (comment.type === "Block" && /^[@#]__(?:PURE|NO_SIDE_EFFECTS)__$/.test(value.trim()))
    return true;

  if (comment.type === "Line" && /^\/\s*</.test(value)) return true;
  const text = value.trimStart();

  return DIRECTIVE_PREFIXES.some((prefix) => text.startsWith(prefix));
};

/** `/** ... *\/` block comments. */
export const isJsdocComment = (comment: Comment): boolean =>
  comment.type === "Block" && comment.value.startsWith("*");

/** `true` when the trimmed body opens with one of `markers` followed by `:` or `(`, e.g. `SAFETY:` or `TODO(bob):`. */
export const startsWithMarker = (comment: Comment, markers: readonly string[]): boolean => {
  const text = commentText(comment);

  return markers.some((marker) => text.startsWith(`${marker}:`) || text.startsWith(`${marker}(`));
};
