import { defineRule } from "../shared/rule.ts";

export default defineRule({
  meta: {
    type: "suggestion",
    docs: { description: "Disallow `switch`; use `Match`." },
    messages: {
      noSwitch:
        "Replace `switch` with `Match.value(...).pipe(Match.when(...), Match.exhaustive)` or a lookup object.",
    },
    schema: [],
  },
  createOnce(context) {
    return {
      SwitchStatement(node) {
        context.report({ node, messageId: "noSwitch" });
      },
    };
  },
});
