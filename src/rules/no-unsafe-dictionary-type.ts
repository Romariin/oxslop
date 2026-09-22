import { defineRule } from "../shared/rule.ts";
import type { ESTree } from "../shared/rule.ts";
import { dictionaryValueType, isWideType, referenceName, unionMembers } from "../shared/types.ts";

const DICTIONARY_REFERENCES = ["Record", "Partial", "Readonly", "Required"];

/** Ancestor chain of `node` within the same type annotation, innermost first. */
const typeAncestors = function* (node: ESTree.Node): Generator<ESTree.Node> {
  let current = node.parent;

  while (current && current.type.startsWith("TS") && current.type !== "TSTypeAliasDeclaration") {
    yield current;
    current = current.parent;
  }
};

/**
 * Dictionaries are `Record<K, V>` (optionally wrapped in `Partial`/`Readonly`/`Required`), index
 * signatures, and mapped types over `string`/`number`. Values are wide per `isWideType`, so nested
 * dictionaries of wide values are wide too and only the outermost construct is reported. Type
 * parameter constraints and conditional `extends` checks are exempt: they narrow, not declare.
 */
export default defineRule({
  meta: {
    type: "problem",
    docs: {
      description: "Disallow dictionaries whose values are `unknown`, `any`, `object` or `{}`.",
    },
    messages: {
      unsafeDictionary:
        "Give the dictionary values a concrete type or parse the data into a named shape; `unknown`, `any`, `object` and `{}` values push every check onto the consumer.",
    },
    schema: [],
  },
  createOnce(context) {
    let reported = new Set<ESTree.Node>();

    const covered = (node: ESTree.Node): boolean => {
      let child: ESTree.Node = node;

      for (const ancestor of typeAncestors(node)) {
        if (reported.has(ancestor)) return true;
        if (ancestor.type === "TSTypeParameter" && ancestor.constraint === child) return true;
        if (ancestor.type === "TSConditionalType" && ancestor.extendsType === child) return true;
        child = ancestor;
      }

      return false;
    };

    const check = (node: ESTree.Node, value: ESTree.TSType | undefined): void => {
      if (!value || !isWideType(context, value) || covered(node)) return;
      reported.add(node);
      context.report({ node, messageId: "unsafeDictionary" });
    };

    return {
      before() {
        reported = new Set();
      },
      TSTypeReference(node) {
        if (!DICTIONARY_REFERENCES.includes(referenceName(node.typeName))) return;
        check(node, dictionaryValueType(context, node));
      },
      TSIndexSignature(node) {
        check(node, node.typeAnnotation.typeAnnotation);
      },
      TSMappedType(node) {
        const keys = unionMembers(context, node.constraint);
        const dictionary =
          keys.length > 0 &&
          keys.every((key) => key.type === "TSStringKeyword" || key.type === "TSNumberKeyword");

        if (dictionary) check(node, node.typeAnnotation ?? undefined);
      },
    };
  },
});
