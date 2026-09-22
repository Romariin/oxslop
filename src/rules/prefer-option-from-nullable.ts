import type { ESTree, Fixer } from "@oxlint/plugins";

import { effectMemberOf } from "../shared/effect.ts";
import { isGlobalName } from "../shared/globals.ts";
import { defineRule } from "../shared/rule.ts";

/**
 * `x == null ? Option.none() : Option.some(x)` and its variants (`=== null`, `=== undefined`,
 * `=== undefined || === null`, and the negated forms with swapped branches). The subject is matched
 * by source text. Single-sided checks (`=== null` alone) are reported too, although
 * `Option.fromNullable` widens them to cover both `null` and `undefined`.
 *
 * The autofix runs only when the subject is a plain identifier, `this`, or a member chain without
 * calls, and only when `Option` is referenced through an object (`Option.some`), so the same
 * binding text can be reused for `fromNullable`.
 */

interface NullishTest {
  subject: ESTree.Expression;
  /** `true` for `x == null`, `false` for `x != null`. */
  nullish: boolean;
}

const unwrap = (node: ESTree.Expression): ESTree.Expression =>
  node.type === "ParenthesizedExpression" ? unwrap(node.expression) : node;

export default defineRule({
  meta: {
    type: "suggestion",
    fixable: "code",
    docs: {
      description:
        "Prefer `Option.fromNullable` over a nullish ternary producing `Option.some`/`Option.none`.",
    },
    messages: {
      fromNullable: "Replace the nullish ternary with `{{option}}.fromNullable({{subject}})`.",
    },
    schema: [],
  },
  createOnce(context) {
    const getText = (node: ESTree.Node): string => context.sourceCode.getText(node);

    const isNullish = (node: ESTree.Expression): boolean =>
      (node.type === "Literal" && node.value === null) ||
      (node.type === "Identifier" && node.name === "undefined" && isGlobalName(context, node));

    /** `x === null`, `x == undefined`, `null !== x`... with the null-ish side stripped. */
    const comparison = (node: ESTree.Expression, loose: boolean): NullishTest | undefined => {
      if (node.type !== "BinaryExpression") return undefined;
      const { operator } = node;
      const strictEq = operator === "===" || operator === "!==";
      const looseEq = operator === "==" || operator === "!=";

      if (!(strictEq || (loose && looseEq))) return undefined;
      const left = unwrap(node.left as ESTree.Expression);
      const right = unwrap(node.right);
      const subject = isNullish(right) ? left : isNullish(left) ? right : undefined;

      if (subject === undefined || isNullish(subject)) return undefined;
      return { subject, nullish: operator === "===" || operator === "==" };
    };

    const nullishTest = (test: ESTree.Expression): NullishTest | undefined => {
      const direct = comparison(test, true);

      if (direct !== undefined) return direct;
      if (test.type !== "LogicalExpression") return undefined;
      const left = comparison(unwrap(test.left), false);
      const right = comparison(unwrap(test.right), false);

      if (left === undefined || right === undefined || left.nullish !== right.nullish)
        return undefined;

      if (test.operator !== (left.nullish ? "||" : "&&")) return undefined;
      return getText(left.subject) === getText(right.subject) ? left : undefined;
    };

    const optionCall = (
      node: ESTree.Expression,
      member: string,
    ): ESTree.CallExpression | undefined => {
      const call = unwrap(node);

      if (call.type !== "CallExpression") return undefined;
      const found = effectMemberOf(context, call.callee);

      return found?.module === "Option" && found.member === member ? call : undefined;
    };

    const isPure = (node: ESTree.Expression): boolean => {
      if (node.type === "Identifier" || node.type === "ThisExpression") return true;
      if (node.type === "ChainExpression") {
        return node.expression.type === "MemberExpression" && isPure(node.expression);
      }

      return (
        node.type === "MemberExpression" &&
        node.object.type !== "Super" &&
        isPure(node.object) &&
        (!node.computed || node.property.type === "Literal")
      );
    };

    return {
      ConditionalExpression(node) {
        const test = nullishTest(unwrap(node.test));

        if (test === undefined) return;
        const [noneBranch, someBranch] = test.nullish
          ? [node.consequent, node.alternate]
          : [node.alternate, node.consequent];

        const none = optionCall(noneBranch, "none");
        const some = optionCall(someBranch, "some");

        if (none === undefined || none.arguments.length !== 0 || some === undefined) return;
        const [argument] = some.arguments;

        if (
          some.arguments.length !== 1 ||
          argument === undefined ||
          argument.type === "SpreadElement"
        )
          return;

        const subject = getText(test.subject);

        if (getText(unwrap(argument)) !== subject) return;

        const option =
          some.callee.type === "MemberExpression" ? getText(some.callee.object) : "Option";

        const fix =
          some.callee.type === "MemberExpression" && isPure(test.subject)
            ? (fixer: Fixer) => fixer.replaceText(node, `${option}.fromNullable(${subject})`)
            : undefined;

        if (fix === undefined) {
          context.report({ node, messageId: "fromNullable", data: { option, subject } });
        } else {
          context.report({ node, messageId: "fromNullable", data: { option, subject }, fix });
        }
      },
    };
  },
});
