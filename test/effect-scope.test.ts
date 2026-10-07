import { rules } from "../src/index.ts";
import { tester } from "./tester.ts";

const TRY = "try { run(); } catch (e) { report(e); }";
const SWITCH = "switch (kind) { case 'a': break; }";

tester.run("oxslop/no-try-catch (registered)", rules["no-try-catch"], {
  valid: [
    { name: "file without imports", code: TRY },
    { name: "file importing other packages", code: `import { z } from "zod";\n${TRY}` },
    { name: "type-only import declaration", code: `import type { Effect } from "effect";\n${TRY}` },
    {
      name: "every specifier type-only",
      code: `import { type Effect, type Layer } from "effect";\n${TRY}`,
    },
    { name: "lookalike package name", code: `import { x } from "effect-ts";\n${TRY}` },
    {
      name: "rule option still applies in Effect files",
      code: `import { Effect } from "effect";\ntry { run(); } finally { release(); }`,
      options: [{ allowFinally: true }],
    },
  ],
  invalid: [
    {
      name: "import from effect",
      code: `import { Effect } from "effect";\n${TRY}`,
      errors: [{ messageId: "noTryCatch" }],
    },
    {
      name: "import from effect submodule",
      code: `import * as Match from "effect/Match";\n${TRY}`,
      errors: [{ messageId: "noTryCatch" }],
    },
    {
      name: "import from @effect scope",
      code: `import { HttpClient } from "@effect/platform";\n${TRY}`,
      errors: [{ messageId: "noTryCatch" }],
    },
    {
      name: "mixed value and type specifiers",
      code: `import { type Layer, Effect } from "effect";\n${TRY}`,
      errors: [{ messageId: "noTryCatch" }],
    },
    {
      name: "side-effect import",
      code: `import "effect";\n${TRY}`,
      errors: [{ messageId: "noTryCatch" }],
    },
  ],
});

tester.run("oxslop/no-switch (registered)", rules["no-switch"], {
  valid: [
    { name: "file without imports", code: SWITCH },
    {
      name: "type-only import declaration",
      code: `import type { Effect } from "effect";\n${SWITCH}`,
    },
  ],
  invalid: [
    {
      name: "import from effect",
      code: `import { Effect } from "effect";\n${SWITCH}`,
      errors: [{ messageId: "noSwitch" }],
    },
    {
      name: "import from effect/Match",
      code: `import { value } from "effect/Match";\n${SWITCH}`,
      errors: [{ messageId: "noSwitch" }],
    },
    {
      name: "import from @effect/platform",
      code: `import { FileSystem } from "@effect/platform";\n${SWITCH}`,
      errors: [{ messageId: "noSwitch" }],
    },
  ],
});

tester.run("oxslop/no-reflect-get (registered, non-Effect)", rules["no-reflect-get"], {
  valid: [],
  invalid: [
    {
      name: "reports in a file without Effect imports",
      code: "const id = Reflect.get(owner, 'id');",
      errors: 1,
    },
  ],
});
