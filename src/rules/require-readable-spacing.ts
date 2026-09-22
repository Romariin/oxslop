import type { ESTree } from "@oxlint/plugins";

import { hasBlankLineBetween, insertBlankLineBetween } from "../shared/padding.ts";
import { defineRule } from "../shared/rule.ts";

/**
 * Requires a blank line before a statement when any of these hold:
 * - it is a top-level statement (directives included);
 * - it is control flow (`return`, `throw`, `break`, `continue`, `if`, loops, `switch`, `try`)
 *   and the previous sibling is not itself control flow;
 * - the previous sibling spans two or more lines.
 *
 * Grouped statements stay tight: import after import, `export ... from` after `export ... from`,
 * a single-line variable declaration after another, and overload signatures with the function
 * they declare. The first statement of a body is never reported. `switch` case bodies are not
 * inspected, since `case x: go(); break;` is idiomatic.
 */

type Body = ESTree.Program | ESTree.BlockStatement | ESTree.StaticBlock | ESTree.TSModuleBlock;

type Statement = Body["body"][number];

const CONTROL_FLOW: Record<string, true> = {
  ReturnStatement: true,
  ThrowStatement: true,
  BreakStatement: true,
  ContinueStatement: true,
  IfStatement: true,
  ForStatement: true,
  ForOfStatement: true,
  ForInStatement: true,
  WhileStatement: true,
  DoWhileStatement: true,
  SwitchStatement: true,
  TryStatement: true,
};

/** The declaration a statement carries, looking through `export`. */
const declarationOf = (statement: Statement): ESTree.Node =>
  statement.type === "ExportNamedDeclaration" && statement.declaration
    ? statement.declaration
    : statement;

const isExportFrom = (statement: Statement): boolean =>
  statement.type === "ExportAllDeclaration" ||
  (statement.type === "ExportNamedDeclaration" && statement.source !== null);

const isSingleLineVariable = (statement: Statement): boolean => {
  const declaration = declarationOf(statement);

  return (
    declaration.type === "VariableDeclaration" &&
    declaration.loc.start.line === declaration.loc.end.line
  );
};

const overloadName = (node: ESTree.Node, implementation: boolean): string | undefined =>
  node.type === "TSDeclareFunction" || (implementation && node.type === "FunctionDeclaration")
    ? node.id?.name
    : undefined;

/** Statement pairs that legitimately sit on adjacent lines. */
const isGrouped = (previous: Statement, next: Statement): boolean => {
  if (previous.type === "ImportDeclaration") return next.type === "ImportDeclaration";
  if (isExportFrom(previous)) return isExportFrom(next);
  if (isSingleLineVariable(previous)) return isSingleLineVariable(next);
  const overload = overloadName(declarationOf(previous), false);

  return overload !== undefined && overloadName(declarationOf(next), true) === overload;
};

export default defineRule({
  meta: {
    type: "layout",
    docs: {
      description: "Require blank lines around top-level declarations, control flow and returns.",
    },
    messages: {
      expectedBlankLine:
        "Insert a blank line above this statement to separate it from the previous one.",
    },
    schema: [],
    fixable: "whitespace",
  },
  createOnce(context) {
    const check = (body: Body): void => {
      const topLevel = body.type === "Program" || body.type === "TSModuleBlock";

      for (let index = 1; index < body.body.length; index += 1) {
        const previous = body.body[index - 1];
        const next = body.body[index];

        if (!previous || !next || isGrouped(previous, next)) continue;
        const required =
          topLevel ||
          previous.loc.start.line !== previous.loc.end.line ||
          (CONTROL_FLOW[next.type] === true && CONTROL_FLOW[previous.type] !== true);

        if (!required || hasBlankLineBetween(context.sourceCode, previous, next)) continue;
        context.report({
          node: next,
          messageId: "expectedBlankLine",
          fix: (fixer) => insertBlankLineBetween(context.sourceCode, fixer, previous, next),
        });
      }
    };

    return {
      Program: check,
      BlockStatement: check,
      StaticBlock: check,
      TSModuleBlock: check,
    };
  },
});
