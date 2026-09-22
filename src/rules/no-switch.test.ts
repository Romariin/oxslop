import { tester } from "../../test/tester.ts";
import rule from "./no-switch.ts";

const error = { messageId: "noSwitch" };

tester.run("oxslop/no-switch", rule, {
  valid: [
    "if (kind === 'a') { run(); } else if (kind === 'b') { stop(); }",
    "const handler = { a: run, b: stop }[kind]; handler();",
    "Match.value(kind).pipe(Match.when('a', run), Match.exhaustive);",
    "const label = kind === 'a' ? 'A' : 'other';",
    "const s = 'switch (x) { case 1: break; }';",
    "// switch (x) { case 1: break; }",
  ],
  invalid: [
    { name: "plain switch", code: "switch (kind) { case 'a': run(); break; }", errors: [error] },
    { name: "switch with default", code: "switch (kind) { default: run(); }", errors: [error] },
    { name: "empty switch", code: "switch (kind) {}", errors: [error] },
    {
      name: "nested switch reports each",
      code: "switch (a) { case 1: switch (b) { case 2: break; } }",
      errors: [error, error],
    },
    {
      name: "switch in function body",
      code: "function f(x: number) { switch (x) { case 1: return 'one'; default: return 'many'; } }",
      errors: [error],
    },
  ],
});
