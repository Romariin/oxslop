import { tester } from "../../test/tester.ts";
import rule from "./no-try-catch.ts";

const error = { messageId: "noTryCatch" };

tester.run("oxslop/no-try-catch", rule, {
  valid: [
    "Effect.try(() => JSON.parse(input));",
    "Effect.tryPromise({ try: () => fetch(url), catch: (e) => new FetchError(e) });",
    "promise.then(ok).catch(fail).finally(done);",
    "const s = 'try { } catch (e) { }';",
    "// try { } catch (e) { }",
    {
      name: "try/finally allowed by option",
      code: "try { run(); } finally { release(); }",
      options: [{ allowFinally: true }],
    },
    {
      name: "nested try/finally allowed by option",
      code: "function f() { try { return run(); } finally { release(); } }",
      options: [{ allowFinally: true }],
    },
  ],
  invalid: [
    { name: "try/catch", code: "try { run(); } catch (e) { report(e); }", errors: [error] },
    {
      name: "try/finally by default",
      code: "try { run(); } finally { release(); }",
      errors: [error],
    },
    {
      name: "try/catch/finally",
      code: "try { run(); } catch { fail(); } finally { release(); }",
      errors: [error],
    },
    {
      name: "try/catch/finally with option still reports",
      code: "try { run(); } catch (e) { fail(e); } finally { release(); }",
      options: [{ allowFinally: true }],
      errors: [error],
    },
    {
      name: "try/catch inside async function",
      code: "async function f() { try { await run(); } catch (e) { return fallback; } }",
      errors: [error],
    },
    {
      name: "nested try reports each",
      code: "try { try { a(); } catch (e) { b(); } } catch (e) { c(); }",
      errors: [error, error],
    },
  ],
});
