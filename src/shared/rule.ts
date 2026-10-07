import type { Context, CreateOnceRule, ESTree, Rule } from "@oxlint/plugins";

export type { Context, CreateOnceRule, ESTree, Rule };

export type Node = ESTree.Node;

/** Every oxslop rule uses `createOnce`, so plugin-level wrappers can compose its visitor hooks. */
export const defineRule = (rule: CreateOnceRule): CreateOnceRule => rule;

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
