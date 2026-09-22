import { isGlobalMethodCall } from "../shared/globals.ts";
import { defineRule } from "../shared/rule.ts";

export default defineRule({
  meta: {
    type: "problem",
    docs: { description: "Disallow `Reflect.get`; use typed property access or parse the input." },
    messages: {
      reflectGet:
        "Replace `Reflect.get` with typed property access. Parse dynamic input into a named type before reading it.",
    },
    schema: [],
  },
  createOnce(context) {
    return {
      CallExpression(node) {
        if (isGlobalMethodCall(context, node, "Reflect", "get")) {
          context.report({ node, messageId: "reflectGet" });
        }
      },
    };
  },
});
