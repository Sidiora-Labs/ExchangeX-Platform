# Contributing

## Setup

```bash
pnpm install
cp .env.example .env      # fill DB_*, NEXT_PUBLIC_SITE_*, APP_*_TOKEN_SECRET
mysql -u root -p exchangex < db/initial.sql
pnpm seed

pnpm dev                  # frontend :3000
pnpm dev:backend          # backend  :4000
```

Or open the repo in a devcontainer, which provisions Node, pnpm, MySQL, and Redis for you.

## Workflow

1. Branch from `main`: `feat/short-description`, `fix/short-description`, `docs/…`, `chore/…`
2. Make the change.
3. `pnpm style` — prettier + eslint --fix.
4. `pnpm test` — must pass.
5. Open a PR against `main` and fill in the template.

CI runs lint, typecheck, tests, and a build on every PR. All must be green.

---

## Code style

Prettier and ESLint are configured; do not hand-format.

```bash
pnpm format     # prettier
pnpm lint       # eslint
pnpm style      # both, with --fix
```

Beyond the linters:

- **TypeScript everywhere.** `strict` is off repo-wide but `strictNullChecks` is on. Do not
  add `any` where a real type is knowable.
- **Path aliases, not deep relatives.** `@/components/...`, `@b/utils/...`, `@db/...` —
  not `../../../utils`.
- **Match the surrounding file.** Its naming, comment density, and idiom beat any general rule.
- **Comment the why.** The what is in the code.

---

## Adding a backend route

Create the file at the path matching its URL, with the verb as the suffix:

```
backend/api/user/widget/index.get.ts   →  GET /api/user/widget
backend/api/user/widget/[id]/index.put.ts  →  PUT /api/user/widget/:id
```

```ts
import { models } from "@b/db";

export const metadata = {
  summary: "Lists the caller's widgets",
  operationId: "listUserWidgets",     // must be globally unique
  tags: ["User", "Widget"],
  requiresAuth: true,
  responses: { /* ... */ },
};

export default async (data: Handler) => {
  const { user } = data;
  return models.widget.findAll({ where: { userId: user.id } });
};
```

There is no registration step — the router discovers files at boot.

`metadata` is load-bearing: it drives the OpenAPI document, auth enforcement, and permission
checks. A duplicated `operationId` corrupts the generated spec, and `tests/contract/` will
fail the build for it.

If the route needs a permission:

1. Add the string to `seeders/20240402234643-permissions.js`
2. Set `permission: "Your Permission"` in `metadata`
3. Re-run `pnpm seed`

## Adding a frontend page

Pages Router, under `src/pages/`. Admin pages must declare their permission:

```tsx
export const permission = "Access Widget Management";
```

Then run `pnpm gate` to regenerate the route→permission map in `src/utils/gate.ts`.

## Styling

Use design tokens, never hardcoded colors:

```tsx
<div className="text-primary-500 bg-muted-900" />   // ✅
<div className="text-[#3b4dff] bg-[#121416]" />     // ❌
```

Hardcoded hex does not follow theme changes. `long`/`short` and `red-*`/`green-*` are
**semantic** — they mean price direction, not decoration. See [docs/BRANDING.md](docs/BRANDING.md).

Every surface must work in both light and dark mode.

---

## Tests

Add tests with behavior changes. See [docs/TESTING.md](docs/TESTING.md) for conventions.

```bash
pnpm test
pnpm test -- --coverage
```

Two rules worth restating:

- **Never commit a failing test.** If you find a bug you are not fixing, assert the current
  behavior and mark it with a `// NOTE:` explaining the defect.
- **Derive expectations from the implementation**, not from what you assume it does.

---

## Commits

Conventional Commits:

```
feat(trade): add stop-limit order type
fix(wallet): correct rounding on BTC withdrawals
docs(deploy): document websocket proxy headers
chore(deps): bump ethers to 6.13.5
test(utils): cover formatFiatBalance edge cases
refactor(api): extract shared exchange schema
```

Types: `feat` `fix` `docs` `style` `refactor` `perf` `test` `build` `ci` `chore` `revert`.

Imperative mood, no trailing period, body explains why.

---

## Pull requests

Keep them focused — one concern per PR. A 50-line PR gets a real review; a 5,000-line PR
gets a rubber stamp.

The PR must state:

- **What** changed and **why**
- How you verified it (commands run, manual steps)
- Screenshots for UI changes, both light and dark mode
- Any migration or `.env` change a deployer must make

Flag explicitly if you touch:

- **Database schema** — include the `ALTER TABLE` for existing installs
- **Permissions** — seeder changes require `pnpm seed` on deploy
- **`NEXT_PUBLIC_*` variables** — these need a frontend rebuild, not just a restart
- **Design tokens** — these cascade everywhere

---

## Security

Do not open a public issue or PR for a vulnerability. See [SECURITY.md](SECURITY.md).

This is financial software. Extra care around: balance arithmetic (use `BigNumber`, never
floats for money), authorization on every endpoint that touches funds, input validation on
withdrawal paths, and anything that logs or serializes secrets.
