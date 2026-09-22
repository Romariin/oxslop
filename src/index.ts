import { eslintCompatPlugin } from "@oxlint/plugins";
import type { Rule } from "@oxlint/plugins";

import { PLUGIN_NAME } from "./catalog.ts";
import type { RuleName } from "./catalog.ts";
import expectPadding from "./rules/expect-padding.ts";
import noArrayFilterMap from "./rules/no-array-filter-map.ts";
import noBannedTypeAssertions from "./rules/no-banned-type-assertions.ts";
import noCascadingLayerProvide from "./rules/no-cascading-layer-provide.ts";
import noChainedTypeAssertions from "./rules/no-chained-type-assertions.ts";
import noComments from "./rules/no-comments.ts";
import noConditionalEmptyObjectSpread from "./rules/no-conditional-empty-object-spread.ts";
import noDisableValidation from "./rules/no-disable-validation.ts";
import noEmoji from "./rules/no-emoji.ts";
import noInOperator from "./rules/no-in-operator.ts";
import noKnownValueWidening from "./rules/no-known-value-widening.ts";
import noManualTaggedConstruction from "./rules/no-manual-tagged-construction.ts";
import noModuleMocking from "./rules/no-module-mocking.ts";
import noNarrationComments from "./rules/no-narration-comments.ts";
import noNestedLayerProvide from "./rules/no-nested-layer-provide.ts";
import noObjectParameters from "./rules/no-object-parameters.ts";
import noOptionalFunctionParameters from "./rules/no-optional-function-parameters.ts";
import noReduceAccumulatorCopy from "./rules/no-reduce-accumulator-copy.ts";
import noReexportOnlyModules from "./rules/no-reexport-only-modules.ts";
import noReflectApply from "./rules/no-reflect-apply.ts";
import noReflectGet from "./rules/no-reflect-get.ts";
import noRuntimeTypeof from "./rules/no-runtime-typeof.ts";
import noServiceOption from "./rules/no-service-option.ts";
import noSilentErrorSwallow from "./rules/no-silent-error-swallow.ts";
import noSwitch from "./rules/no-switch.ts";
import noTagAccess from "./rules/no-tag-access.ts";
import noTryCatch from "./rules/no-try-catch.ts";
import noUnknownParameters from "./rules/no-unknown-parameters.ts";
import noUnknownReturns from "./rules/no-unknown-returns.ts";
import noUnknownTypeAliases from "./rules/no-unknown-type-aliases.ts";
import noUnsafeDictionaryType from "./rules/no-unsafe-dictionary-type.ts";
import noVagueIdentifiers from "./rules/no-vague-identifiers.ts";
import noWidenThenAssert from "./rules/no-widen-then-assert.ts";
import noYieldlessGen from "./rules/no-yieldless-gen.ts";
import pipeMaxArguments from "./rules/pipe-max-arguments.ts";
import preferEffectMatch from "./rules/prefer-effect-match.ts";
import preferOptionFromNullable from "./rules/prefer-option-from-nullable.ts";
import requireReadableSpacing from "./rules/require-readable-spacing.ts";
import requireSafetyCommentForTypeAssertion from "./rules/require-safety-comment-for-type-assertion.ts";

export const rules: Record<RuleName, Rule> = {
  "no-banned-type-assertions": noBannedTypeAssertions,
  "no-chained-type-assertions": noChainedTypeAssertions,
  "no-unknown-parameters": noUnknownParameters,
  "no-unknown-returns": noUnknownReturns,
  "no-unknown-type-aliases": noUnknownTypeAliases,
  "no-object-parameters": noObjectParameters,
  "no-unsafe-dictionary-type": noUnsafeDictionaryType,
  "no-reflect-get": noReflectGet,
  "no-reflect-apply": noReflectApply,
  "no-runtime-typeof": noRuntimeTypeof,
  "no-in-operator": noInOperator,
  "no-conditional-empty-object-spread": noConditionalEmptyObjectSpread,
  "no-widen-then-assert": noWidenThenAssert,
  "no-known-value-widening": noKnownValueWidening,
  "require-safety-comment-for-type-assertion": requireSafetyCommentForTypeAssertion,
  "no-tag-access": noTagAccess,
  "no-manual-tagged-construction": noManualTaggedConstruction,
  "no-nested-layer-provide": noNestedLayerProvide,
  "no-cascading-layer-provide": noCascadingLayerProvide,
  "no-service-option": noServiceOption,
  "no-disable-validation": noDisableValidation,
  "no-silent-error-swallow": noSilentErrorSwallow,
  "no-yieldless-gen": noYieldlessGen,
  "prefer-effect-match": preferEffectMatch,
  "prefer-option-from-nullable": preferOptionFromNullable,
  "pipe-max-arguments": pipeMaxArguments,
  "no-try-catch": noTryCatch,
  "no-switch": noSwitch,
  "no-comments": noComments,
  "no-narration-comments": noNarrationComments,
  "no-emoji": noEmoji,
  "no-vague-identifiers": noVagueIdentifiers,
  "no-reexport-only-modules": noReexportOnlyModules,
  "no-optional-function-parameters": noOptionalFunctionParameters,
  "no-array-filter-map": noArrayFilterMap,
  "no-reduce-accumulator-copy": noReduceAccumulatorCopy,
  "require-readable-spacing": requireReadableSpacing,
  "no-module-mocking": noModuleMocking,
  "expect-padding": expectPadding,
};

/** Oxlint plugin. Also loads in ESLint v9+ through `eslintCompatPlugin`. */
const plugin = eslintCompatPlugin({ meta: { name: PLUGIN_NAME }, rules });

export default plugin;
