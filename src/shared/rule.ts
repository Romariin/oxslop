import { defineRule } from "@oxlint/plugins";
import type { Context, ESTree, Rule } from "@oxlint/plugins";

export type { Context, ESTree, Rule };

export type Node = ESTree.Node;

export { defineRule };

/**
 * Reads the first options object of a rule, merged over `defaults`.
 *
 * Options are per file: `context.options` is `null` while `createOnce` runs. Call this inside the
 * `before()` hook (or a `Program` visitor) and store the result in a closure variable.
 */
export const readOptions = <T extends object>(context: Context, defaults: T): T => {
  const given = context.options?.[0];

  if (given === null || given === undefined || typeof given !== "object" || Array.isArray(given))
    return defaults;

  return { ...defaults, ...(given as Partial<T>) };
};
