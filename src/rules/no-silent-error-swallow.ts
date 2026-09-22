import type { Context, ESTree } from "@oxlint/plugins";

import { effectMemberOf, isEffectMember } from "../shared/effect.ts";
import { defineRule } from "../shared/rule.ts";

/**
 * Reports recovery handlers passed to `Effect.catch*`/`Effect.orElse` that ignore the error and
 * return nothing: `() => Effect.void`, `(_) => Effect.succeed(undefined)`,
 * `function () { return Effect.unit; }`. For `Effect.catchTags` every handler in the object literal is checked.
 *
 * A handler is only reported when its body is exactly one of those expressions and its error
 * parameter is absent or never referenced, so any logging or branching keeps it valid.
 * `Effect.ignore` is not reported: it states the intent explicitly.
 */

const HANDLER_MEMBERS = [
  "catchAll",
  "catchAllCause",
  "catch",
  "catchAllDefect",
  "catchIf",
  "catchSome",
  "orElse",
  "catchTag",
  "catchTags",
] as const;

type Handler = ESTree.Function | ESTree.ArrowFunctionExpression;

const unwrap = (node: ESTree.Node): ESTree.Node => {
  let current = node;

  while (current.type === "ParenthesizedExpression") current = current.expression;
  return current;
};

/** `Effect.void`, `Effect.unit`, `Effect.succeed()`, `Effect.succeed(undefined)`, `Effect.succeed(null)`. */
const isEmptySuccess = (context: Context, node: ESTree.Node): boolean => {
  if (
    isEffectMember(context, node, "Effect", "void") ||
    isEffectMember(context, node, "Effect", "unit")
  ) {
    return true;
  }

  if (node.type !== "CallExpression" || !isEffectMember(context, node.callee, "Effect", "succeed"))
    return false;

  const [argument, ...rest] = node.arguments;

  if (argument === undefined) return true;
  if (rest.length > 0) return false;
  const value = unwrap(argument);

  return (
    (value.type === "Literal" && value.value === null) ||
    (value.type === "Identifier" &&
      value.name === "undefined" &&
      context.sourceCode.isGlobalReference(value)) ||
    (value.type === "UnaryExpression" &&
      value.operator === "void" &&
      unwrap(value.argument).type === "Literal")
  );
};

/** The single expression a handler evaluates to, when its body is that trivial. */
const handlerResult = (handler: Handler): ESTree.Node | undefined => {
  const { body } = handler;

  if (body === null) return undefined;
  if (body.type !== "BlockStatement") return unwrap(body);
  const [statement, ...rest] = body.body;

  if (statement?.type !== "ReturnStatement" || rest.length > 0 || statement.argument === null)
    return undefined;

  return unwrap(statement.argument);
};

export default defineRule({
  meta: {
    type: "suggestion",
    docs: {
      description: "Disallow catch handlers that discard the error and return `Effect.void`.",
    },
    messages: {
      silentSwallow:
        "Log the swallowed error with `Effect.tapError`/`Effect.ignoreLogged`, or handle it by tag with `Effect.catchTag`.",
    },
    schema: [],
  },
  createOnce(context) {
    const errorParameterUnused = (handler: Handler): boolean => {
      const [parameter] = handler.params;

      if (parameter === undefined) return true;
      if (parameter.type !== "Identifier") return false;
      return context.sourceCode
        .getDeclaredVariables(handler)
        .every((variable) => variable.name !== parameter.name || variable.references.length === 0);
    };

    const checkHandler = (candidate: ESTree.Node): void => {
      const handler = unwrap(candidate);

      if (handler.type !== "ArrowFunctionExpression" && handler.type !== "FunctionExpression")
        return;

      const result = handlerResult(handler);

      if (
        result === undefined ||
        !isEmptySuccess(context, result) ||
        !errorParameterUnused(handler)
      )
        return;

      context.report({ node: handler, messageId: "silentSwallow" });
    };

    return {
      CallExpression(node) {
        const found = effectMemberOf(context, node.callee);

        if (
          found?.module !== "Effect" ||
          !(HANDLER_MEMBERS as readonly string[]).includes(found.member)
        )
          return;

        const last = node.arguments[node.arguments.length - 1];

        if (last === undefined) return;
        if (found.member === "catchTags") {
          const handlers = unwrap(last);

          if (handlers.type !== "ObjectExpression") return;
          for (const property of handlers.properties) {
            if (property.type === "Property" && property.kind === "init")
              checkHandler(property.value);
          }

          return;
        }

        checkHandler(last);
      },
    };
  },
});
