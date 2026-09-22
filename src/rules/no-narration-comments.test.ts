import { tester } from "../../test/tester.ts";
import rule from "./no-narration-comments.ts";

const error = { messageId: "narration" };

tester.run("oxslop/no-narration-comments", rule, {
  valid: [
    "// Ports below 1024 need root, so the fallback is 8080.\nconst port = 8080;",
    "// SAFETY: the index is checked above\nconst x = arr[i];",
    "// TODO: import the schema once published\nconst schema = {};",
    "// FIXME(bob): return early here\nreturn x;",
    "// NOTE: create is idempotent\nconst c = create();",
    "// eslint-disable-next-line no-console\nconsole.log(1);",
    "// @ts-expect-error import types missing\nimport x from 'untyped';",
    "const x = 1; // Set the initial value",
    "// Import the user module\n// because the resolver needs it\nimport user from './user';",
    "function f() {\n  const x = 1;\n  // Return\n}",
    "/* Return the result */\nreturn x;",
    "// Users must be loaded lazily.\nconst users = load();",
    "// Log\n",
    "// Import x\n\n// SAFETY: also fine\nconst y = 1;",
    {
      code: "// Import the user module\nimport user from './user';",
      options: [{ verbs: ["return"] }],
    },
    {
      code: "// WHY: import order matters\nimport a from './a';",
      options: [{ allowMarkers: ["WHY"] }],
    },
  ],
  invalid: [
    {
      name: "import verb",
      code: "// Import the user module\nimport user from './user';",
      errors: [error],
    },
    {
      name: "return verb",
      code: "function f() {\n  // Return the result\n  return 1;\n}",
      errors: [error],
    },
    { name: "case-insensitive verb", code: "// INITIALIZE counters\nlet n = 0;", errors: [error] },
    {
      name: "punctuation before verb",
      code: "// -- Set up the client\nconst c = make();",
      errors: [error],
    },
    { name: "echo of the next line", code: "// const x = 1\nconst x = 1;", errors: [error] },
    { name: "echo with different casing", code: "// Users.Load()\nusers.load();", errors: [error] },
    {
      name: "indented",
      code: "if (a) {\n  // Increment the counter\n  count++;\n}",
      errors: [error],
    },
    { name: "sequencing word", code: "// Then send the payload\nsend(payload);", errors: [error] },
    {
      name: "several narrations",
      code: "// Define x\nconst x = 1;\n// Log it\nconsole.log(x);",
      errors: [error, error],
    },
    {
      name: "custom verbs",
      code: "// Grab the config\nconst c = read();",
      options: [{ verbs: ["grab"] }],
      errors: [error],
    },
  ],
});
