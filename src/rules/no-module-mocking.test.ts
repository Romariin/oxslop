import { tester } from "../../test/tester.ts";
import rule from "./no-module-mocking.ts";

const error = { messageId: "moduleMock" };

tester.run("oxslop/no-module-mocking", rule, {
  valid: [
    "import { vi } from 'vitest'; const fn = vi.fn();",
    "import { vi } from 'vitest'; vi.spyOn(console, 'log');",
    "vi.useFakeTimers();",
    "jest.fn();",
    "import { mock } from 'bun:test'; const fn = mock(() => 1);",
    "const mock = { module: () => {} }; mock.module('./dep', () => ({}));",
    "const vi = { mock: () => {} }; vi.mock('./dep');",
    "function run(jest: { mock(id: string): void }) { jest.mock('./dep'); }",
    "import { vi } from './my-utils'; vi.mock('./dep');",
    "import { it as vi } from 'vitest'; vi.mock('./dep');",
    "mock.module('./dep', () => ({}));",
    "import * as t from 'vitest'; t.expect(1).toBe(1);",
  ],
  invalid: [
    {
      name: "vi.mock imported",
      code: "import { vi } from 'vitest'; vi.mock('./dep', () => ({}));",
      errors: [error],
    },
    { name: "vi.doMock global", code: "vi.doMock('./dep');", errors: [error] },
    {
      name: "aliased vi",
      code: "import { vi as v } from 'vitest'; v.mock('./dep');",
      errors: [error],
    },
    {
      name: "namespace import",
      code: "import * as t from 'vitest'; t.vi.mock('./dep');",
      errors: [error],
    },
    { name: "jest.mock global", code: "jest.mock('./dep');", errors: [error] },
    {
      name: "jest.unstable_mockModule imported",
      code: "import { jest } from '@jest/globals'; jest.unstable_mockModule('./dep', () => ({}));",
      errors: [error],
    },
    { name: "jest.doMock", code: "jest.doMock('./dep');", errors: [error] },
    {
      name: "bun mock.module",
      code: "import { mock } from 'bun:test'; mock.module('./dep', () => ({}));",
      errors: [error],
    },
    {
      name: "bun mock aliased",
      code: "import { mock as m } from 'bun:test'; m.module('./dep', () => ({}));",
      errors: [error],
    },
    { name: "computed method", code: "vi['mock']('./dep');", errors: [error] },
    {
      name: "shadow in sibling scope does not leak",
      code: "{ const vi = { mock() {} }; } vi.mock('./dep');",
      errors: [error],
    },
  ],
});
