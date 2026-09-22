import type { Context, ESTree } from "@oxlint/plugins";

import { isGlobalName, staticMemberName } from "../shared/globals.ts";
import { defineRule } from "../shared/rule.ts";

/**
 * Flags `x.filter(f).map(g)` and `x.map(g).filter(f)`: two eager passes and an intermediate array.
 *
 * Iterator helper pipelines (`x.values().filter(f).map(g)`, `Iterator.from(x)`, `str.matchAll(re)`)
 * are lazy, so a receiver chain containing an iterator-producing step is left alone. A chain of
 * three or more passes is reported once, at the outermost call. Without a type checker, arrays
 * cannot be told apart from user types that happen to expose `filter`/`map`.
 */

const PASSES = ["filter", "map"] as const;
const ITERATOR_METHODS = ["values", "keys", "entries", "matchAll"] as const;

const isIn = (list: readonly string[], name: string | undefined): boolean =>
  name !== undefined && list.includes(name);

/** Method name when `node` is `receiver.method(...)`. */
const methodName = (node: ESTree.Node): string | undefined =>
  node.type === "CallExpression" && node.callee.type === "MemberExpression"
    ? staticMemberName(node.callee)
    : undefined;

/** `true` when the receiver chain produces an iterator rather than an array. */
const producesIterator = (context: Context, receiver: ESTree.Node): boolean => {
  let current: ESTree.Node = receiver;

  for (;;) {
    switch (current.type) {
      case "ChainExpression":
        current = current.expression;
        continue;
      case "AwaitExpression":
        current = current.argument;
        continue;
      case "CallExpression": {
        const method = methodName(current);

        if (method === "toArray") return false;
        if (isIn(ITERATOR_METHODS, method)) {
          return !(
            current.callee.type === "MemberExpression" &&
            current.callee.object.type === "Identifier" &&
            current.callee.object.name === "Object" &&
            isGlobalName(context, current.callee.object)
          );
        }

        if (
          current.callee.type === "MemberExpression" &&
          current.callee.object.type === "Identifier" &&
          current.callee.object.name === "Iterator" &&
          staticMemberName(current.callee) === "from"
        ) {
          return true;
        }

        current = current.callee;

        continue;
      }
      case "MemberExpression":
        if (
          staticMemberName(current) === "iterator" ||
          (current.computed &&
            current.property.type === "MemberExpression" &&
            current.property.object.type === "Identifier" &&
            current.property.object.name === "Symbol" &&
            staticMemberName(current.property) === "iterator")
        ) {
          return true;
        }
        current = current.object;
        continue;
      default:
        return false;
    }
  }
};

export default defineRule({
  meta: {
    type: "suggestion",
    docs: {
      description:
        "Disallow adjacent eager `filter`/`map` passes; use a single `flatMap` or iterator helpers.",
    },
    messages: {
      filterMap:
        "Replace the adjacent `filter`/`map` passes with a single `flatMap((x) => (cond ? [x] : []))`, one loop, or lazy iterator helpers (`.values().filter().map().toArray()`).",
    },
    schema: [],
  },
  createOnce(context) {
    return {
      CallExpression(node) {
        const outer = methodName(node);

        if (!isIn(PASSES, outer) || node.callee.type !== "MemberExpression") return;
        const { parent } = node;

        if (
          parent.type === "MemberExpression" &&
          parent.object === node &&
          parent.parent.type === "CallExpression" &&
          parent.parent.callee === parent &&
          isIn(PASSES, staticMemberName(parent))
        ) {
          return;
        }

        let receiver: ESTree.Node = node.callee.object;
        let mixedPasses = false;

        while (receiver.type === "CallExpression" && receiver.callee.type === "MemberExpression") {
          const inner = methodName(receiver);

          if (!isIn(PASSES, inner)) break;
          if (inner !== outer) mixedPasses = true;
          receiver = receiver.callee.object;
        }

        if (!mixedPasses || producesIterator(context, receiver)) return;

        context.report({ node: node.callee.property, messageId: "filterMap" });
      },
    };
  },
});
