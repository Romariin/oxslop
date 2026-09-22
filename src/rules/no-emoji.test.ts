import { tester } from "../../test/tester.ts";
import rule from "./no-emoji.ts";

tester.run("oxslop/no-emoji", rule, {
  valid: [
    'const s = "plain text";',
    "// copyright © 2026 — no emoji here",
    'const arrows = "↩ ↔";',
    'const digits = "#1 *2 3";',
    'const accents = "héllo wörld ñ";',
    'const cjk = "日本語";',
  ],
  invalid: [
    {
      name: "in string",
      code: 'console.log("Done ✅");',
      errors: [{ messageId: "emoji", data: { emoji: "✅" } }],
    },
    {
      name: "in comment",
      code: "// 🚀 launch\nconst x = 1;",
      errors: [{ messageId: "emoji", data: { emoji: "🚀" } }],
    },
    {
      name: "zwj sequence counts once",
      code: 'const s = "👨‍👩‍👧";',
      errors: [{ messageId: "emoji", data: { emoji: "👨‍👩‍👧" } }],
    },
    { name: "flag", code: 'const s = "🇫🇷";', errors: [{ messageId: "emoji" }] },
    { name: "keycap", code: 'const s = "1️⃣";', errors: [{ messageId: "emoji" }] },
    {
      name: "keycap without variation selector",
      code: 'const s = "1\u20e3";',
      errors: [{ messageId: "emoji", data: { emoji: "1\u20e3" } }],
    },
    {
      name: "multiple",
      code: 'const s = "🎉🎉";',
      errors: [{ messageId: "emoji" }, { messageId: "emoji" }],
    },
  ],
});
