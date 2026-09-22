import { defineRule, readOptions } from "../shared/rule.ts";
import {
  FUNCTION_SELECTOR,
  parameterName,
  parameterType,
  restElementTypes,
  unionMembers,
} from "../shared/types.ts";
import type { FunctionNode } from "../shared/types.ts";

interface Options {
  allowNames: string[];
}

const DEFAULTS: Options = { allowNames: ["cause"] };

/**
 * Same-file aliases and unions are resolved; imported aliases are not. The subject of a type
 * predicate (`(x: unknown): x is Foo`) and parameters listed in `allowNames` are exempt.
 */
export default defineRule({
  meta: {
    type: "problem",
    docs: {
      description:
        "Disallow `unknown` in parameter types, except an explicit `cause` and type-predicate subjects.",
    },
    messages: {
      unknownParameter:
        "Replace `unknown` with a concrete type for {{subject}}; parse untrusted input with a schema before it reaches this function.",
    },
    schema: [
      {
        type: "object",
        properties: { allowNames: { type: "array", items: { type: "string" }, uniqueItems: true } },
        additionalProperties: false,
      },
    ],
  },
  createOnce(context) {
    let allowNames: readonly string[] = DEFAULTS.allowNames;

    return {
      before() {
        allowNames = readOptions(context, DEFAULTS).allowNames;
      },
      [FUNCTION_SELECTOR](node: FunctionNode) {
        const returned = node.returnType?.typeAnnotation;
        const subject =
          returned?.type === "TSTypePredicate" && returned.parameterName.type === "Identifier"
            ? returned.parameterName.name
            : undefined;

        for (const param of node.params) {
          const name = parameterName(param);

          if (name !== undefined && (name === subject || allowNames.includes(name))) continue;
          const type = parameterType(param);

          if (!type) continue;
          const candidates =
            param.type === "RestElement" ? restElementTypes(context, type) : [type];

          const wide = candidates.some((candidate) =>
            unionMembers(context, candidate).some((member) => member.type === "TSUnknownKeyword"),
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
            messageId: "unknownParameter",
            data: { subject: subjectText },
          });
        }
      },
    };
  },
});
