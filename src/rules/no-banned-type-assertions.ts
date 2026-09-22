import { isConstAssertion } from "../shared/assertions.ts";
import type { TypeAssertion } from "../shared/assertions.ts";
import { defineRule, readOptions } from "../shared/rule.ts";
import { unionMembers } from "../shared/types.ts";

const BANNED = ["any", "never", "unknown"] as const;

type Banned = (typeof BANNED)[number];

const KEYWORD: Record<Banned, string> = {
  any: "TSAnyKeyword",
  never: "TSNeverKeyword",
  unknown: "TSUnknownKeyword",
};

/**
 * Same-file aliases and unions are resolved (`x as MaybeUnknown` where `type MaybeUnknown = unknown
 * | string`); imported aliases are not. `as const`, `satisfies` and concrete assertions are valid.
 */
export default defineRule({
  meta: {
    type: "problem",
    docs: {
      description: "Disallow assertions to `any`, `never` or `unknown`; parse or narrow instead.",
    },
    messages: {
      bannedAssertion:
        "Remove the assertion to `{{type}}`; parse the value with a schema or narrow it with a type guard instead.",
    },
    schema: [
      {
        type: "object",
        properties: {
          banned: {
            type: "array",
            items: { type: "string", enum: [...BANNED] },
            uniqueItems: true,
          },
        },
        additionalProperties: false,
      },
    ],
  },
  createOnce(context) {
    let banned: readonly Banned[] = BANNED;

    const check = (node: TypeAssertion): void => {
      if (isConstAssertion(node)) return;
      for (const member of unionMembers(context, node.typeAnnotation)) {
        const type = banned.find((name) => KEYWORD[name] === member.type);

        if (type !== undefined) {
          context.report({ node, messageId: "bannedAssertion", data: { type } });

          return;
        }
      }
    };

    return {
      before() {
        banned = readOptions<{ banned: readonly Banned[] }>(context, { banned: BANNED }).banned;
      },
      TSAsExpression: check,
      TSTypeAssertion: check,
    };
  },
});
