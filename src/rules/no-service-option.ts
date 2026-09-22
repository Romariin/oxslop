import { effectMemberOf } from "../shared/effect.ts";
import { defineRule } from "../shared/rule.ts";

/** Reports calls to `Effect.serviceOption` and `Effect.serviceOptional`; point-free references are not tracked. */

export default defineRule({
  meta: {
    type: "suggestion",
    docs: {
      description:
        "Disallow `Effect.serviceOption`; require the service or provide a default layer.",
    },
    messages: {
      serviceOption:
        "Replace `Effect.{{member}}` with a required service (`yield* Service`) and supply a default `Layer` where the service may be absent.",
    },
    schema: [],
  },
  createOnce(context) {
    return {
      CallExpression(node) {
        const found = effectMemberOf(context, node.callee);

        if (found?.module !== "Effect") return;
        if (found.member !== "serviceOption" && found.member !== "serviceOptional") return;
        context.report({ node, messageId: "serviceOption", data: { member: found.member } });
      },
    };
  },
});
