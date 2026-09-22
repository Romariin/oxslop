import { defineRule } from "../shared/rule.ts";
import {
  FUNCTION_SELECTOR,
  parameterName,
  parameterType,
  restElementTypes,
  unionMembers,
} from "../shared/types.ts";
import type { FunctionNode } from "../shared/types.ts";

/**
 * Reports the `object` keyword, same-file aliases resolving to it, and unions containing it, in
 * every parameter position including rest element types (`...args: object[]`). The subject of a
 * type predicate (`(x: object): x is Foo`) is exempt because narrowing is the point of the guard.
 * `Record<string, unknown>` and `{}` are left to `no-unsafe-dictionary-type` and typed rules.
 */
export default defineRule({
  meta: {
    type: "problem",
    docs: {
      description:
        "Disallow the `object` type (and aliases resolving to it) in parameter positions.",
    },
    messages: {
      objectParameter:
        "Replace `object` with a named shape for {{subject}}; `object` only rules out primitives and leaves every property unchecked.",
    },
    schema: [],
  },
  createOnce(context) {
    return {
      [FUNCTION_SELECTOR](node: FunctionNode) {
        const returned = node.returnType?.typeAnnotation;
        const subject =
          returned?.type === "TSTypePredicate" && returned.parameterName.type === "Identifier"
            ? returned.parameterName.name
            : undefined;

        for (const param of node.params) {
          const name = parameterName(param);

          if (name !== undefined && name === subject) continue;
          const type = parameterType(param);

          if (!type) continue;
          const candidates =
            param.type === "RestElement" ? restElementTypes(context, type) : [type];

          const wide = candidates.some((candidate) =>
            unionMembers(context, candidate).some((member) => member.type === "TSObjectKeyword"),
          );

          if (!wide) continue;
          const subjectText =
            name === undefined
              ? "the destructured parameter"
              : param.type === "RestElement"
                ? `the rest parameter \`${name}\``
                : `parameter \`${name}\``;

          context.report({
            node: param,
            messageId: "objectParameter",
            data: { subject: subjectText },
          });
        }
      },
    };
  },
});
