## What and why

<!-- What changed, and what problem it solves. Link the issue if there is one. -->

Closes #

## How I verified it

<!-- Commands you ran, manual steps you took. "It builds" is not verification. -->

- [ ] `pnpm lint`
- [ ] `pnpm test`
- [ ] Exercised the change in a running app

## Screenshots

<!-- UI changes only. Include BOTH light and dark mode. -->

## Deployer actions

Tick anything a deployer must do beyond pulling and restarting:

- [ ] **Database change** — `ALTER TABLE` statement included below
- [ ] **New/changed permission** — requires `pnpm seed`
- [ ] **`NEXT_PUBLIC_*` change** — requires a frontend rebuild, not just a restart
- [ ] **New environment variable** — documented in `.env.example` and `docs/CONFIGURATION.md`
- [ ] **Design token change** — cascades across the whole UI
- [ ] None of the above

```sql
-- migration for existing installs, if any
```

## Checklist

- [ ] Tests added or updated for the behavior I changed
- [ ] No failing tests committed (known defects assert current behavior with a `// NOTE:`)
- [ ] Colors use design tokens, not hardcoded hex
- [ ] No secret is behind a `NEXT_PUBLIC_` prefix
- [ ] New routes export `metadata` with a globally unique `operationId`
- [ ] Endpoints touching funds declare `requiresAuth` and the correct `permission`
