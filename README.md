<div align="center">

<img src="public/wordmark_xchange_blb.png#gh-light-mode-only" alt="ExchangeX" width="360">
<img src="public/wordmark_xchange_blw.png#gh-dark-mode-only" alt="ExchangeX" width="360">

**A full-stack cryptocurrency exchange platform.**
Spot & futures trading, custodial and on-chain wallets, KYC, P2P, staking, and an extension system.

<sub>Next.js 15 · React 18 · TypeScript · uWebSockets.js · Sequelize · MySQL · Tailwind 4</sub>

</div>

---

## Contents

- [What this is](#what-this-is)
- [Architecture](#architecture)
- [Quick start](#quick-start)
- [Configuration](#configuration)
- [Development](#development)
- [Testing](#testing)
- [Deployment](#deployment)
- [Extensions](#extensions)
- [Project layout](#project-layout)
- [Further reading](#further-reading)

---

## What this is

ExchangeX is a monorepo containing two deployable processes that share one TypeScript codebase:

| Process | Entry point | Default port | What it does |
|---|---|---|---|
| **Frontend** | `next` (Pages Router) | `3000` | Server-rendered React UI, admin panel, trading terminal |
| **Backend** | `index.ts` → `dist/index.js` | `4000` | REST + WebSocket API on uWebSockets.js, cron workers, blockchain adapters |

They share `models/` (Sequelize), `types/`, and the path aliases `@/` → `src/`, `@b/` → `backend/`, `@db/` → `models/`.

### Feature surface

**Trading** — spot order book and matching, futures with leverage, binary options, TradingView charting, live market data over WebSocket.
**Wallets** — fiat, spot, and on-chain ecosystem wallets; deposits/withdrawals; UTXO and EVM chains; master/custodial wallet management.
**Finance** — investment plans, staking pools, forex accounts, P2P trading with escrow, ICO/token offerings, affiliate MLM (binary + unilevel).
**Platform** — RBAC with granular permissions, KYC templates and applications, support tickets, CMS pages and blog, a drag-and-drop page builder, mail campaigns, e-commerce store, NFT marketplace.
**Ops** — admin dashboard, cron monitor, log viewer, database backup/restore, notification templates, 86-locale i18n.

---

## Architecture

```
┌────────────────────────────────────────────────────────────┐
│                        Browser                             │
└───────────────┬──────────────────────────┬─────────────────┘
                │ HTTP/SSR                 │ WebSocket
                ▼                          ▼
    ┌───────────────────────┐   ┌────────────────────────────┐
    │  Next.js  (port 3000) │   │  uWebSockets.js (port 4000)│
    │  src/pages            │   │  backend/api/**            │
    │  src/components       │   │  file-based route handlers │
    │  src/stores (zustand) │   │  backend/handler/*         │
    └───────────┬───────────┘   └─────────────┬──────────────┘
                │  $fetch / $serverFetch      │
                └──────────────┬──────────────┘
                               ▼
              ┌────────────────────────────────────┐
              │  models/  (Sequelize, ~110 models) │
              └────────────────┬───────────────────┘
                               ▼
        ┌──────────┬───────────────────┬──────────────────┐
        │  MySQL   │  Redis (cache)    │  ScyllaDB (opt.) │
        └──────────┴───────────────────┴──────────────────┘
                               │
                               ▼
              ┌────────────────────────────────────┐
              │  CCXT providers · EVM/UTXO wallets │
              │  SOL · TRON · TON · XMR adapters   │
              └────────────────────────────────────┘
```

### Backend routing

Routes are **file-based**, mirroring the URL. The filename suffix is the HTTP verb:

```
backend/api/admin/system/log/index.get.ts   →  GET    /api/admin/system/log
backend/api/exchange/order/index.post.ts    →  POST   /api/exchange/order
backend/api/exchange/market/index.ws.ts     →  WS     /api/exchange/market
backend/api/admin/api/[id]/index.del.ts     →  DELETE /api/admin/api/:id
```

Every route file exports two things:

```ts
export const metadata = {
  summary: "Retrieves system logs",
  operationId: "getSystemLogs",
  tags: ["Admin", "System"],
  requiresAuth: true,
  permission: "Access Log Monitor",   // checked against the RBAC tables
  responses: { /* OpenAPI response shapes */ },
};

export default async (data: Handler) => {
  const { user, params, query, body } = data;
  // ...
};
```

`metadata` drives three things at once: the OpenAPI spec at `/api/docs/v1`, auth enforcement, and permission gating. Keep it accurate — there is a contract test that verifies every route has valid, unique metadata.

---

## Quick start

### Requirements

- **Node.js** ≥ 20 (22 recommended)
- **pnpm** ≥ 9
- **MySQL** ≥ 8
- **Redis** (optional but recommended — used for caching and rate limiting)

### Local setup

```bash
git clone <your-repo-url> exchangex && cd exchangex
pnpm install

cp .env.example .env
$EDITOR .env                 # at minimum: DB_*, NEXT_PUBLIC_SITE_*, APP_*_TOKEN_SECRET

mysql -u root -p -e "CREATE DATABASE exchangex CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci;"
mysql -u root -p exchangex < db/initial.sql

pnpm seed                    # roles, permissions, currencies, pages, extensions
```

Then run the two processes in separate terminals:

```bash
pnpm dev                     # frontend  → http://localhost:3000
pnpm dev:backend             # backend   → http://localhost:4000
```

API docs are served at `http://localhost:4000/api/docs/v1`.

### Devcontainer

If you use VS Code or GitHub Codespaces, `.devcontainer/` provisions Node, pnpm, MySQL, and Redis with the schema pre-loaded:

> **Dev Containers: Reopen in Container**

See [`.devcontainer/README.md`](.devcontainer/README.md).

---

## Configuration

All configuration is environment variables. Copy `.env.example` → `.env`.

`NEXT_PUBLIC_*` variables are **inlined into the client bundle at build time** and are publicly visible. Never put a secret behind that prefix.

### Required

| Variable | Description |
|---|---|
| `DB_NAME` `DB_USER` `DB_PASSWORD` `DB_HOST` `DB_PORT` | MySQL connection |
| `NEXT_PUBLIC_SITE_URL` | Public base URL, e.g. `https://exchange.example.com` |
| `NEXT_PUBLIC_SITE_NAME` | Display name used in UI and emails |
| `APP_ACCESS_TOKEN_SECRET` | JWT signing secret — generate with `openssl rand -hex 64` |
| `APP_REFRESH_TOKEN_SECRET` | " |
| `APP_RESET_TOKEN_SECRET` | " |
| `APP_VERIFY_TOKEN_SECRET` | " |

### Common optional groups

| Group | Variables |
|---|---|
| Ports | `NEXT_PUBLIC_FRONTEND_PORT` `NEXT_PUBLIC_BACKEND_PORT` `NEXT_PUBLIC_BACKEND_THREADS` |
| i18n | `NEXT_PUBLIC_DEFAULT_LANGUAGE` `NEXT_PUBLIC_LANGUAGES` |
| Theme | `NEXT_PUBLIC_DEFAULT_THEME` `NEXT_PUBLIC_DEFAULT_LAYOUT` |
| Auth | `NEXT_PUBLIC_GOOGLE_AUTH_STATUS` `NEXT_PUBLIC_GOOGLE_CLIENT_ID` `NEXT_PUBLIC_VERIFY_EMAIL_STATUS` |
| Captcha | `NEXT_PUBLIC_GOOGLE_RECAPTCHA_*` |
| Mail | `APP_EMAILER` + one of the `APP_NODEMAILER_*` / `APP_SENDGRID_*` / `APP_SENDMAIL_PATH` sets |
| SMS / 2FA | `APP_TWILIO_*` |
| Payments | `APP_STRIPE_*` `APP_PAYSTACK_*` `APP_PAYPAL_*` |
| Exchange provider | `NEXT_PUBLIC_EXCHANGE` + `APP_<PROVIDER>_API_KEY` / `_API_SECRET` / `_API_PASSPHRASE` |
| Rate limiting | `RATE_LIMIT` `RATE_LIMIT_EXPIRY` |

Supported exchange providers: `binance`, `kucoin`, `okx`, `xt`. Set `NEXT_PUBLIC_EXCHANGE` to one, then supply that provider's credentials. Changing `.env` requires a backend restart.

---

## Development

```bash
pnpm dev                # frontend, turbopack
pnpm dev:backend        # backend, nodemon
pnpm dev:thread         # backend in multi-threaded mode

pnpm lint               # eslint over src, backend, models
pnpm format             # prettier
pnpm style              # format + lint --fix

pnpm test               # jest
pnpm test --coverage    # with coverage report

pnpm gate               # regenerate the route→permission map in src/utils/gate.ts
pnpm i18n:wrap          # wrap bare JSX strings in t() for translation
pnpm benchmark          # API benchmark harness
```

### Adding a backend route

1. Create the file at the path matching its URL, suffixed with the verb: `backend/api/user/thing/index.get.ts`
2. Export `metadata` (see [Backend routing](#backend-routing)) and a default handler.
3. If it needs a permission, add that permission string to `seeders/20240402234643-permissions.js` and re-run `pnpm seed`.
4. Run `pnpm gate` if you also added an admin page that needs route gating.

No registration step — the router discovers files at boot.

### Adding a frontend page

Pages Router, under `src/pages/`. Admin pages should export a `permission` constant:

```tsx
export const permission = "Access Log Monitor";
```

and be listed in `src/utils/gate.ts` (or regenerated via `pnpm gate`).

---

## Testing

Jest with `ts-jest`, `testEnvironment: node`. Aliases `@/`, `@b/`, `@db/` resolve in tests.

```bash
pnpm test                              # everything
pnpm test tests/unit                   # unit only
pnpm test tests/contract               # repo-wide invariants
pnpm test -- --coverage                # coverage → coverage/
pnpm test -- -t "formatFiatBalance"    # by name
```

| Suite | Location | Purpose |
|---|---|---|
| API unit | `tests/unit/api/` | Route handler behavior, grouped by API area |
| Utils unit | `tests/unit/utils/` | Pure functions in `src/utils` |
| Contract | `tests/contract/` | Repo-wide route metadata and permission invariants |
| Colocated | `backend/api/**/*.test.ts` | Service-level tests next to their subject |

See [`docs/TESTING.md`](docs/TESTING.md) for conventions and how to mock the DB.

---

## Deployment

### PM2

```bash
pnpm build:all          # next build + tsc
pnpm start              # pm2 start production.config.js
pnpm stop
```

`production.config.js` runs `backend` (`dist/index.js`, port 4000) and `frontend` (`next start`, port 3000) in fork mode. Use `production.thread.config.js` for the multi-threaded backend.

### Docker

```bash
docker compose up -d
```

See [`docs/DEPLOYMENT.md`](docs/DEPLOYMENT.md) for reverse-proxy config, TLS, WebSocket upgrade headers, and scaling notes.

### Updating

```bash
pnpm updator            # stop → update deps → seed → build → start
```

---

## Extensions

Optional feature modules live in `backend/api/ext/` and `src/pages/admin/ext/`, gated by rows in the `extension` table. Admin → System → Extensions toggles them.

Bundled extension slots: AI investment, ecosystem (native trading), forex, ICO, staking, knowledge base, e-commerce, wallet connect, P2P, MLM, mailwizard, futures, NFT, payment gateway, swap.

An extension is enabled when its `extension` row has `status = true` and its code is present on disk. There is no remote installer — extension code ships with the repo or is added manually.

---

## Project layout

```
.
├── backend/              Backend service
│   ├── api/              File-based routes (verb suffix = HTTP method)
│   │   ├── admin/        Admin endpoints
│   │   ├── ext/          Extension endpoints
│   │   └── ...
│   ├── blockchains/      Non-EVM chain adapters (SOL, TRON, TON, XMR)
│   ├── handler/          Request/Response/Middleware/RouteHandler
│   ├── utils/            Shared backend utilities, crons, mailer, cache
│   ├── db.ts             Sequelize singleton
│   └── server.ts         ExchangeXServer (uWebSockets.js)
├── src/                  Frontend
│   ├── pages/            Next.js Pages Router
│   ├── components/       UI components
│   ├── stores/           Zustand stores
│   ├── styles/           Tailwind 4 tokens + global CSS
│   └── utils/            Frontend utilities
├── models/               Sequelize models (~110)
├── types/                Ambient TypeScript declarations
├── seeders/              sequelize-cli seed data
├── tests/                Unit, contract, regression suites
├── ecosystem/            Smart contract artifacts, wallet helpers
├── public/               Static assets, 86 locale bundles
├── docs/                 Extended documentation
├── db/                   Database schema
│   └── initial.sql       Full schema for a fresh install
└── production.config.js  PM2 process definitions
```

---

## Further reading

| Document | Contents |
|---|---|
| [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) | Request lifecycle, routing internals, auth, caching |
| [`docs/CONFIGURATION.md`](docs/CONFIGURATION.md) | Every environment variable, annotated |
| [`docs/DEPLOYMENT.md`](docs/DEPLOYMENT.md) | Production deploy, nginx, TLS, scaling |
| [`docs/TESTING.md`](docs/TESTING.md) | Test conventions, mocking the DB |
| [`docs/BRANDING.md`](docs/BRANDING.md) | Design tokens, logo assets, theming |
| [`docs/DATABASE.md`](docs/DATABASE.md) | Schema overview, migrations, backup/restore |
| [`CONTRIBUTING.md`](CONTRIBUTING.md) | Workflow, commit style, PR checklist |
| [`SECURITY.md`](SECURITY.md) | Vulnerability reporting, hardening checklist |
| [`CHANGELOG.md`](CHANGELOG.md) | Release history |

---

## License

See [`LICENSE.md`](LICENSE.md).
