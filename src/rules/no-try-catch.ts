import { defineRule, readOptions } from "../shared/rule.ts";

interface Options {
  /** Allow `try { } finally { }` blocks that have no `catch` clause. */
  allowFinally: boolean;
}

const DEFAULTS: Options = { allowFinally: false };

export default defineRule({
  meta: {
    type: "suggestion",
    docs: { description: "Disallow `try`/`catch`; use `Effect.try` or `Effect.tryPromise`." },
    messages: {
      noTryCatch:
        "Replace `try`/`catch` with `Effect.try`, `Effect.tryPromise`, or `Effect.acquireUseRelease`.",
    },
    schema: [
      {
        type: "object",
        properties: { allowFinally: { type: "boolean" } },
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
      TryStatement(node) {
        if (options.allowFinally && node.handler === null) return;
        context.report({ node, messageId: "noTryCatch" });
      },
    };
  },
});
