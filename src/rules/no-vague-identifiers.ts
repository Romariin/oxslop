import { defineRule, readOptions } from "../shared/rule.ts";
import type { ESTree } from "../shared/rule.ts";

interface Options {
  /** Placeholder names, compared after lowercasing and stripping leading `_` and trailing digits. */
  names: string[];
}

const DEFAULTS: Options = {
  names: [
    "data",
    "info",
    "temp",
    "tmp",
    "obj",
    "val",
    "foo",
    "bar",
    "baz",
    "helper",
    "result",
    "res",
    "stuff",
    "thing",
    "misc",
    "util",
    "utils",
  ],
};

const normalize = (name: string): string =>
  name.toLowerCase().replace(/^_+/, "").replace(/\d+$/, "");

/** Identifiers bound by a pattern: destructuring, defaults, rest and parameter properties. */
const bindings = (pattern: ESTree.Node | null, out: ESTree.Node[]): ESTree.Node[] => {
  if (pattern === null) return out;
  switch (pattern.type) {
    case "Identifier":
      out.push(pattern);
      break;
    case "ObjectPattern":
      for (const property of pattern.properties) {
        bindings(property.type === "RestElement" ? property.argument : property.value, out);
      }
      break;
    case "ArrayPattern":
      for (const element of pattern.elements) bindings(element, out);
      break;
    case "AssignmentPattern":
      bindings(pattern.left, out);
      break;
    case "RestElement":
      bindings(pattern.argument, out);
      break;
    case "TSParameterProperty":
      bindings(pattern.parameter, out);
      break;
  }

  return out;
};

/**
 * Checks names introduced by variable declarators, function and class names, parameters and
 * catch clauses. Imports, property keys and type-level parameter names are left alone: renaming
 * them is either impossible or a different problem.
 */
export default defineRule({
  meta: {
    type: "suggestion",
    docs: {
      description:
        "Disallow placeholder names such as `data`, `temp`, `result` or `obj` on local bindings.",
    },
    messages: {
      vague:
        "Rename `{{name}}` after what it holds (`user`, `bytes`, `parsedConfig`); `{{name}}` describes nothing.",
    },
    schema: [
      {
        type: "object",
        properties: { names: { type: "array", items: { type: "string" }, uniqueItems: true } },
        additionalProperties: false,
      },
    ],
  },
  createOnce(context) {
    let vague = new Set(DEFAULTS.names);
    const check = (pattern: ESTree.Node | null): void => {
      for (const node of bindings(pattern, [])) {
        if (node.type !== "Identifier") continue;
        const { name } = node;

        if (vague.has(normalize(name)))
          context.report({ node, messageId: "vague", data: { name } });
      }
    };

    const checkFunction = (node: ESTree.Function | ESTree.ArrowFunctionExpression): void => {
      if ("id" in node) check(node.id);
      for (const param of node.params) check(param);
    };

    return {
      before() {
        vague = new Set(readOptions(context, DEFAULTS).names.map(normalize));
      },
      VariableDeclarator(node) {
        check(node.id);
      },
      CatchClause(node) {
        check(node.param);
      },
      "ClassDeclaration, ClassExpression"(node) {
        if (node.type === "ClassDeclaration" || node.type === "ClassExpression") check(node.id);
      },
      "FunctionDeclaration, FunctionExpression, TSDeclareFunction, TSEmptyBodyFunctionExpression"(
        node,
      ) {
        checkFunction(node as ESTree.Function);
      },
      ArrowFunctionExpression: checkFunction,
    };
  },
});
