import { defineRule } from "../shared/rule.ts";

/**
 * Extended pictographic characters plus the keycap/flag machinery. Excludes symbols that also
 * appear in plain text (`©`, `®`, `™`, `↩`, digits, `#`, `*`) unless followed by U+FE0F.
 */
const EMOJI =
  /(?:\p{Extended_Pictographic}(?!\uFE0E)|\p{Regional_Indicator}{2}|[#*0-9]\uFE0F?\u20E3)(?:\uFE0F|\u200D\p{Extended_Pictographic}|\p{Emoji_Modifier})*/gu;

const TEXT_SYMBOLS = new Set([
  "©",
  "®",
  "™",
  "↩",
  "↪",
  "↔",
  "↕",
  "↖",
  "↗",
  "↘",
  "↙",
  "‼",
  "⁉",
  "Ⓜ",
  "〰",
  "〽",
]);

export default defineRule({
  meta: {
    type: "suggestion",
    docs: { description: "Disallow emoji in source code, strings and comments." },
    messages: { emoji: "Remove the emoji `{{emoji}}`; source code is not a chat message." },
    schema: [],
  },
  createOnce(context) {
    return {
      Program() {
        const { text } = context.sourceCode;

        for (const match of text.matchAll(EMOJI)) {
          const emoji = match[0];

          if (TEXT_SYMBOLS.has(emoji)) continue;
          const start = match.index;
          context.report({
            messageId: "emoji",
            data: { emoji },
            loc: {
              start: context.sourceCode.getLocFromIndex(start),
              end: context.sourceCode.getLocFromIndex(start + emoji.length),
            },
          });
        }
      },
    };
  },
});
