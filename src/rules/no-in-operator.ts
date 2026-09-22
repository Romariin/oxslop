import { insideTypePredicate } from "../shared/known-values.ts";
import { defineRule, readOptions } from "../shared/rule.ts";

interface Options {
  /** Allow `in` inside functions returning `x is T` or `asserts x`. */
  readonly allowInTypePredicates: boolean;
}

const DEFAULTS: Options = { allowInTypePredicates: true };

/**
 * Only the binary `in` operator is a key probe. `for (const key in object)` is a
 * `ForInStatement` and `#brand in object` is a private brand check; neither is reported.
 */
export default defineRule({
  meta: {
    type: "problem",
    docs: {
      description:
        "Disallow the `in` operator as an object-key probe; parse into a discriminated type instead.",
    },
    messages: {
      inOperator:
        "Replace the `in` key probe with a parsed discriminated union; branch on a `_tag`/`kind` field or decode the value with a schema.",
    },
    schema: [
      {
        type: "object",
        properties: { allowInTypePredicates: { type: "boolean" } },
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
      BinaryExpression(node) {
        if (node.operator !== "in" || (node.left.type as string) === "PrivateIdentifier") return;
        if (options.allowInTypePredicates && insideTypePredicate(node)) return;
        context.report({ node, messageId: "inOperator" });
      },
    };
  },
});
