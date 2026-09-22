import { defineRule, readOptions } from "../shared/rule.ts";
import { FUNCTION_SELECTOR } from "../shared/types.ts";
import type { FunctionNode } from "../shared/types.ts";

interface Options {
  /** Allow a trailing `?` parameter, the one position where callers can simply omit it. */
  allowLast: boolean;
}

const DEFAULTS: Options = { allowLast: false };

/**
 * Flags the `?` modifier on function, method and signature parameters, including constructor
 * parameter properties. Defaults, `T | undefined` annotations, optional object properties and
 * `this` parameters are untouched: they make the absent case explicit.
 */
export default defineRule({
  meta: {
    type: "suggestion",
    docs: { description: "Disallow `param?: T`; use `param: T | undefined` or a default value." },
    messages: {
      optionalParameter:
        "Replace `{{name}}?: T` with `{{name}}: T | undefined` or a default value so callers pass the absent case on purpose.",
    },
    schema: [
      {
        type: "object",
        properties: { allowLast: { type: "boolean" } },
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
      [FUNCTION_SELECTOR](node) {
        const { params } = node as FunctionNode;
        const last = options.allowLast ? params.length - 1 : -1;
        params.forEach((param, index) => {
          if (index === last) return;
          const binding = param.type === "TSParameterProperty" ? param.parameter : param;

          if (binding.type === "RestElement" || binding.type === "AssignmentPattern") return;
          // Published types declare `optional?: false` on binding patterns; the parser sets `true` for `x?: T`.
          const flags: { optional?: boolean } = binding;

          if (flags.optional !== true) return;
          const name =
            binding.type === "Identifier"
              ? binding.name
              : binding.type === "ObjectPattern"
                ? "{ ... }"
                : "[ ... ]";

          context.report({ node: binding, messageId: "optionalParameter", data: { name } });
        });
      },
    };
  },
});
