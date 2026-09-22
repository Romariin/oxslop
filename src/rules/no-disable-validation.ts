import { defineRule } from "../shared/rule.ts";

/** Reports the `disableValidation: true` property in any object literal, whatever the receiving call. */

export default defineRule({
  meta: {
    type: "problem",
    docs: { description: "Disallow `disableValidation: true`, which decodes without checking." },
    messages: {
      disableValidation:
        "Remove `disableValidation: true` so the schema checks its input; fix the schema or the data instead of skipping validation.",
    },
    schema: [],
  },
  createOnce(context) {
    return {
      Property(node) {
        if (node.parent.type !== "ObjectExpression" || node.kind !== "init") return;
        const { key, value } = node;
        const isKey =
          (key.type === "Literal" && key.value === "disableValidation") ||
          (!node.computed && key.type === "Identifier" && key.name === "disableValidation");

        if (isKey && value.type === "Literal" && value.value === true) {
          context.report({ node, messageId: "disableValidation" });
        }
      },
    };
  },
});
