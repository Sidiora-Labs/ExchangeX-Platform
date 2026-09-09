# Testing

Jest + `ts-jest`, `testEnvironment: node`. Config in `jest.config.js`, shared setup in
`tests/setup.ts`.

```bash
pnpm test                              # everything
pnpm test tests/unit                   # one directory
pnpm test -- --coverage                # coverage → coverage/
pnpm test -- -t "formatFiatBalance"    # by test name
pnpm test -- --watch                   # watch mode
```

## Layout

| Directory | Contains |
|---|---|
| `tests/unit/api/` | Route handler behavior, grouped by API area |
| `tests/unit/utils/` | Pure functions from `src/utils/` |
| `tests/contract/` | Repo-wide invariants: route metadata, operationIds, permissions |
| `tests/__mocks__/` | Style and static-file stubs |
| `tests/helpers` + `setup*.ts` | Shared fixtures and per-project setup |
| `backend/api/**/*.test.ts` | Service tests colocated with their subject |

Aliases `@/`, `@b/`, `@db/` resolve in tests exactly as in the app.

## Setup

`tests/setup.ts` runs before every file. It pins `TZ=UTC` (so date assertions are stable),
provides default `NEXT_PUBLIC_SITE_*` values, rethrows unhandled rejections, and sets a
15s timeout. `clearMocks` and `restoreMocks` are on, so mocks reset between tests
automatically — do not hand-roll that in `afterEach`.

---

## Mocking the database

Nothing in the test suite touches a real database. Mock `@b/db` at module scope:

```ts
jest.mock("@b/db", () => ({
  sequelize: {
    transaction: jest.fn(),
    LOCK: { UPDATE: "UPDATE" },
  },
  models: {
    user: { findByPk: jest.fn() },
    wallet: { findOne: jest.fn(), update: jest.fn() },
  },
}));

import { models } from "@b/db";
```

Mock the other side-effect boundaries the same way:

```ts
jest.mock("@b/utils/logger", () => ({ logError: jest.fn() }));
jest.mock("@b/utils/emails", () => ({ sendInvestmentEmail: jest.fn() }));
jest.mock("@b/utils/notifications", () => ({ handleNotification: jest.fn() }));
```

Two existing suites are the reference for house style:

- `backend/api/finance/investment/util/investment.test.ts`
- `backend/api/exchange/binary/order/util/BinaryOrderService.test.ts`

### Env read at import time

Some modules read `process.env` when first imported. Set those **before** the import:

```ts
process.env.NEXT_PUBLIC_BINARY_PROFIT = "87";

import { BinaryOrderService } from "./BinaryOrderService";
```

`import` statements hoist above assignments, so use `require` or place the assignment in a
module that is imported first if ordering bites.

---

## Conventions

**Test real behavior, not assumed behavior.** Read the implementation and derive expected
values from it. A test that encodes a guess is worse than no test — it locks in the guess.

**Never commit a failing test.** If you find a genuine bug, assert what the code *currently*
does and mark it:

```ts
// NOTE: returns "0" rather than "0.00" for zero input — inconsistent with
// the non-zero path. Asserting current behavior; see issue #NN.
expect(formatCryptoBalance(0)).toBe("0");
```

That keeps the suite green while making the defect visible and greppable.

**Cover the edges.** Zero, negative, empty string, `null`, `undefined`, `NaN`, very large
numbers, and unexpected types. Most real bugs live there.

**Name tests as sentences.** `it("returns an empty array when the order book has no asks")`
beats `it("works")`. The name is what you read when it fails in CI.

**Fake timers for anything time-based.**

```ts
jest.useFakeTimers();
const fn = jest.fn();
const debounced = debounce(fn, 100);
debounced();
expect(fn).not.toHaveBeenCalled();
jest.advanceTimersByTime(100);
expect(fn).toHaveBeenCalledTimes(1);
```

---

## Contract tests

`tests/contract/` enforces invariants across the whole `backend/api` tree by reading files
statically rather than importing them (importing a route pulls in a DB connection). They check:

- every route file exports `metadata` and a default function
- `operationId` is present and globally unique
- `summary` is non-empty
- any `permission` string exists in `seeders/20240402234643-permissions.js`

These catch a whole class of mistake that type-checking cannot: a duplicated `operationId`
silently breaks the generated OpenAPI document, and a typo'd permission string locks out an
endpoint with no error at boot.

## Coverage

`pnpm test -- --coverage` writes to `coverage/`, collected from `src/utils`,
`backend/utils`, `backend/api`, and `models`.

No global threshold is enforced yet. Aim to raise coverage where the logic is real — money
math, order handling, validation — rather than chasing a percentage across generated
CRUD routes.

---

## Not covered yet

Worth knowing what the suite does **not** do:

- **No React component tests.** Would need `jest-environment-jsdom` and
  `@testing-library/react`, neither currently a dependency.
- **No integration tests.** Nothing exercises a real MySQL or Redis.
- **No E2E.** No Playwright/Cypress.
- **No WebSocket tests.** The uWebSockets.js layer is untested.

Each is a reasonable next step; none is wired up today.
