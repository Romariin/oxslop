import { isPipeCall } from "../shared/effect.ts";
import { defineRule, readOptions } from "../shared/rule.ts";

interface Options {
  /** Largest argument count a `pipe(...)` / `.pipe(...)` call may have. */
  max: number;
}

const DEFAULTS: Options = { max: 12 };

export default defineRule({
  meta: {
    type: "suggestion",
    docs: { description: "Limit the number of arguments passed to `pipe` / `.pipe()`." },
    messages: {
      tooManyArguments:
        "`pipe` receives {{count}} arguments (max {{max}}). Split the pipeline into named intermediate steps.",
    },
    schema: [
      {
        type: "object",
        properties: { max: { type: "integer", minimum: 1 } },
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
      CallExpression(node) {
        const count = node.arguments.length;

        if (count <= options.max || !isPipeCall(context, node)) return;
        context.report({
          node: node.callee,
          messageId: "tooManyArguments",
          data: { count: String(count), max: String(options.max) },
        });
      },
    };
  },
});
