import { isGlobalMethodCall } from "../shared/globals.ts";
import { defineRule } from "../shared/rule.ts";

export default defineRule({
  meta: {
    type: "problem",
    docs: { description: "Disallow `Reflect.apply`; call the function directly." },
    messages: {
      reflectApply:
        "Replace `Reflect.apply(fn, thisArg, args)` with a direct call: `fn.call(thisArg, ...args)` or `fn(...args)`.",
    },
    schema: [],
  },
  createOnce(context) {
    return {
      CallExpression(node) {
        if (isGlobalMethodCall(context, node, "Reflect", "apply")) {
          context.report({ node, messageId: "reflectApply" });
        }
      },
    };
  },
});
