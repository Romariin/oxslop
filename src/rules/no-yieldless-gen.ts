import type { ESTree } from "@oxlint/plugins";

import { effectMemberOf } from "../shared/effect.ts";
import { defineRule } from "../shared/rule.ts";

/**
 * Generator functions handed to `Effect.gen`, `Effect.fn` or `Effect.fnUntraced` that never
 * yield. Yields inside nested functions do not count (they cannot exist in non-generator nested
 * functions anyway, and a nested generator is its own Effect boundary).
 *
 * Recognised shapes:
 * - `Effect.gen(function* () {})`, `Effect.gen(this, function* () {})`
 * - `Effect.fn(function* () {})`, `Effect.fn("name")(function* () {})`, same for `fnUntraced`
 */

const GENERATOR_TAKERS = ["gen", "fn", "fnUntraced"] as const;

type Generator = ESTree.Function & { generator: true };

export default defineRule({
  meta: {
    type: "problem",
    docs: {
      description:
        "Disallow `Effect.gen` generators that never yield; use `Effect.succeed` or `Effect.sync`.",
    },
    messages: {
      yieldlessGen:
        "Replace `Effect.{{member}}` with `Effect.succeed`, `Effect.sync` or `Effect.suspend`; this generator never yields.",
    },
    schema: [],
  },
  createOnce(context) {
    let generators: Generator[] = [];
    let yielding = new Set<Generator>();

    const takerMember = (call: ESTree.CallExpression): string | undefined => {
      let callee: ESTree.Node = call.callee;

      if (callee.type === "CallExpression") callee = callee.callee;
      const found = effectMemberOf(context, callee);

      if (found === undefined || found.module !== "Effect") return undefined;
      return (GENERATOR_TAKERS as readonly string[]).includes(found.member)
        ? found.member
        : undefined;
    };

    return {
      before() {
        generators = [];
        yielding = new Set();
      },
      "FunctionExpression, FunctionDeclaration"(node: ESTree.Function) {
        if (node.generator) generators.push(node as Generator);
      },
      YieldExpression() {
        const current = generators[generators.length - 1];

        if (current !== undefined) yielding.add(current);
      },
      "FunctionExpression, FunctionDeclaration:exit"(node: ESTree.Function) {
        if (!node.generator) return;
        generators.pop();

        if (yielding.has(node as Generator) || node.parent.type !== "CallExpression") return;
        const member = takerMember(node.parent);

        if (member === undefined || !node.parent.arguments.includes(node)) return;
        context.report({ node, messageId: "yieldlessGen", data: { member } });
      },
    };
  },
});
