import { commentText, isDirectiveComment, startsWithMarker } from "../shared/comments.ts";
import { defineRule, readOptions } from "../shared/rule.ts";

interface Options {
  /** Markers (without the colon) that make a comment intentional rather than narrative. */
  allowMarkers: string[];
  /** Lowercase first words that announce what the next statement does. */
  verbs: string[];
}

const DEFAULTS: Options = {
  allowMarkers: ["SAFETY", "TODO", "FIXME", "NOTE"],
  verbs: [
    "import",
    "define",
    "declare",
    "create",
    "initialize",
    "initialise",
    "set",
    "get",
    "return",
    "call",
    "check",
    "loop",
    "iterate",
    "increment",
    "decrement",
    "update",
    "add",
    "remove",
    "export",
    "log",
    "print",
    "handle",
    "process",
    "convert",
    "parse",
    "validate",
    "fetch",
    "render",
    "compute",
    "calculate",
    "build",
    "make",
    "use",
    "invoke",
    "assign",
    "store",
    "save",
    "load",
    "read",
    "write",
    "send",
    "wait",
    "sleep",
    "start",
    "stop",
    "run",
    "then",
    "now",
    "first",
    "next",
    "finally",
  ],
};

const CLOSERS = ["}", "]", ")"];

const firstWord = (text: string): string => (/[\p{L}\p{N}]+/u.exec(text)?.[0] ?? "").toLowerCase();

const squash = (text: string): string => text.toLowerCase().replace(/[^a-z0-9]/g, "");

/**
 * Only `//` comments that stand alone on their line and are immediately followed by code are
 * considered; trailing comments and comments followed by another comment are ignored. A comment
 * narrates when its first word is one of `verbs`, or when its text collapses to the same
 * alphanumerics as the line beneath it.
 */
export default defineRule({
  meta: {
    type: "suggestion",
    docs: {
      description:
        "Disallow comments that narrate the next statement (`// Import x`, `// Return the result`).",
    },
    messages: {
      narration:
        "Delete the comment; it narrates the statement below. Express the intent with a name, a type or a test.",
    },
    schema: [
      {
        type: "object",
        properties: {
          allowMarkers: { type: "array", items: { type: "string" }, uniqueItems: true },
          verbs: { type: "array", items: { type: "string" }, uniqueItems: true },
        },
        additionalProperties: false,
      },
    ],
  },
  createOnce(context) {
    let options = DEFAULTS;
    let verbs = new Set(DEFAULTS.verbs);

    return {
      before() {
        options = readOptions(context, DEFAULTS);
        verbs = new Set(options.verbs.map((verb) => verb.toLowerCase()));
      },
      Program() {
        const { sourceCode } = context;
        const { lines } = sourceCode;

        for (const comment of sourceCode.getAllComments()) {
          if (comment.type !== "Line") continue;
          if (isDirectiveComment(comment) || startsWithMarker(comment, options.allowMarkers))
            continue;

          const { start } = comment.loc;

          if (lines[start.line - 1]?.slice(0, start.column).trim() !== "") continue;
          const next = sourceCode.getTokenAfter(comment, { includeComments: true });

          if (next === null || next.type === "Line" || next.type === "Block") continue;
          if (next.type === "Punctuator" && CLOSERS.includes(next.value)) continue;
          const text = commentText(comment);
          const codeLine = lines[next.loc.start.line - 1] ?? "";
          const echo = squash(text);

          if (verbs.has(firstWord(text)) || (echo !== "" && echo === squash(codeLine))) {
            context.report({ messageId: "narration", loc: comment.loc });
          }
        }
      },
    };
  },
});
