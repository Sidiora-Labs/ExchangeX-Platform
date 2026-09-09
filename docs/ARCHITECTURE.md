# Architecture

How a request moves through ExchangeX, and why the pieces are shaped the way they are.

## Two processes, one codebase

```
exchangex/
├── src/       → Next.js frontend   (port 3000)
├── backend/   → uWebSockets.js API (port 4000)
└── models/    → shared Sequelize layer
```

They are separate processes with separate lifecycles. The frontend never touches the database
directly; it calls the backend over HTTP, both from the browser (`$fetch`) and during SSR
(`$serverFetch`).

Path aliases are declared in `tsconfig.json` and mirrored in `package.json` `_moduleAliases`
(for the compiled backend) and `jest.config.js` (for tests). All three must stay in sync:

| Alias | Resolves to |
|---|---|
| `@/` | `src/` |
| `@b/` | `backend/` |
| `@db/` | `models/` |

---

## Backend request lifecycle

```
uWS socket
   │
   ▼
ExchangeXServer            backend/server.ts
   │  extends RouteHandler
   ▼
RouteHandler               backend/handler/RouteHandler.ts
   │  matches path → module, parses :params
   ▼
Middleware                 backend/handler/Middleware.ts
   │  ① rate limit
   │  ② auth: verify JWT → attach user
   │  ③ permission: metadata.permission vs user's role permissions
   │  ④ body parse + AJV validation against metadata schema
   ▼
route handler              backend/api/**/<name>.<verb>.ts  (default export)
   │
   ▼
models / services          models/*.ts via @b/db
   │
   ▼
Response                   backend/handler/Response.ts
```

### File-based routing

`backend/api/` is walked at boot. The path becomes the URL; the filename suffix becomes the verb.

| File | Route |
|---|---|
| `api/user/profile/index.get.ts` | `GET /api/user/profile` |
| `api/admin/api/[id]/index.put.ts` | `PUT /api/admin/api/:id` |
| `api/exchange/market/index.ws.ts` | `WS /api/exchange/market` |
| `api/admin/system/log/clean.del.ts` | `DELETE /api/admin/system/log/clean` |

Bracketed segments (`[id]`, `[productId]`) become named params, available as `data.params.id`.

### The `metadata` contract

Every route module exports `metadata`. It is not documentation — it is load-bearing:

```ts
export const metadata = {
  summary: "Retrieves system logs",      // OpenAPI summary
  operationId: "getSystemLogs",          // must be globally unique
  tags: ["Admin", "System"],             // OpenAPI grouping
  requiresAuth: true,                    // middleware rejects anonymous requests
  permission: "Access Log Monitor",      // middleware checks RBAC
  parameters: [...],                     // validated
  requestBody: {...},                    // validated by AJV
  responses: {...},                      // OpenAPI response shapes
};
```

Three consumers read it:

1. **Middleware** — `requiresAuth` and `permission` gate the request before the handler runs.
2. **AJV** — `requestBody` / `parameters` schemas validate input; invalid requests never reach the handler.
3. **`backend/docs.ts`** — generates the OpenAPI document served at `/api/docs/v1`.

`tests/contract/` asserts this contract across the whole tree: metadata present, `operationId`
unique, referenced permissions exist in the seeder.

---

## Authentication and authorization

### Tokens

Four independently-signed JWT secrets, each for a different purpose:

| Secret | Token | Typical lifetime |
|---|---|---|
| `APP_ACCESS_TOKEN_SECRET` | Access token | `JWT_EXPIRY` |
| `APP_REFRESH_TOKEN_SECRET` | Refresh token | `JWT_REFRESH_EXPIRY` |
| `APP_RESET_TOKEN_SECRET` | Password reset | `JWT_RESET_EXPIRY` |
| `APP_VERIFY_TOKEN_SECRET` | Email verification | short |

Using distinct secrets means a leaked reset token cannot be replayed as an access token.

### RBAC

```
user ──roleId──▶ role ──rolePermission──▶ permission
```

Permissions are strings like `"Access Log Monitor"`. The canonical list lives in
`seeders/20240402234643-permissions.js`. A route declares one via `metadata.permission`;
an admin page declares one via `export const permission` plus an entry in `src/utils/gate.ts`.

`pnpm gate` regenerates `src/utils/gate.ts` by scanning page exports. Run it after adding
admin pages so the route→permission map stays accurate.

Adding a permission is a three-step change: add it to the seeder, reference it from the
route/page, re-run `pnpm seed`.

---

## Data layer

`backend/db.ts` exposes a `SequelizeSingleton`. Import from `@b/db`:

```ts
import { models, sequelize } from "@b/db";
```

`models/init.ts` registers every model and its associations. Models are plain
`Model.init()` classes (not decorators), each with `validate:` rules that run on write.

Schema comes from `db/initial.sql` for fresh installs. There is no incremental migration
framework — `sequelize.sync({ alter: true })` reconciles model changes against the live
schema. Treat destructive column changes with care and back up first.

### Caching

`backend/utils/cache.ts` provides a `CacheManager` singleton over Redis. Settings and
extension status are cached; mutating them calls `clearCache()`. If Redis is absent the
app still runs, but every settings read hits MySQL.

---

## Frontend

Next.js **Pages Router** (not App Router). Notable pieces:

| Path | Role |
|---|---|
| `src/pages/` | Routes; admin pages export a `permission` |
| `src/stores/` | Zustand stores — `dashboard` (settings, profile, theme), `trade`, `user/wallet`, … |
| `src/utils/api.ts` | `$fetch` (browser) and `$serverFetch` (SSR) |
| `src/utils/gate.ts` | Route → permission map for admin gating |
| `src/layouts/` | `Default`, `Nav`, and layout switching |
| `src/styles/globals.css` | Tailwind 4 `@theme` design tokens |

### Styling

Tailwind **4**. The palette is defined as CSS custom properties in a `@theme` block in
`src/styles/globals.css` — `--color-primary-500`, `--color-muted-800`, and so on — which
Tailwind turns into utilities (`text-primary-500`, `bg-muted-800`).

`tailwind.config.js` is pulled in via `@config` and adds the shadcn-style semantic layer
(`--background`, `--card`, `--border`) plus trading colors (`long`, `short`).

Use token classes, never hardcoded hex. See [BRANDING.md](BRANDING.md).

---

## Real-time

WebSocket routes are `*.ws.ts` files handled by `backend/handler/Websocket.ts`. Clients
subscribe to streams (ticker, order book, orders); the server fans out updates from the
configured CCXT provider or the native ecosystem engine.

`src/utils/ws.ts` wraps the browser client with reconnect and subscription bookkeeping.

---

## Background work

`backend/utils/crons/` holds scheduled jobs — investment maturation, forex rollovers,
staking payouts, market data refresh. The cron monitor at Admin → System → Cron shows
last-run state.

`pnpm dev:thread` / `production.thread.config.js` run the backend in a multi-threaded
configuration; `NEXT_PUBLIC_BACKEND_THREADS` sets the worker count.

---

## Extensions

Optional modules under `backend/api/ext/` and `src/pages/admin/ext/`, gated by rows in the
`extension` table keyed on `productId`. Toggling status flips the row and clears the cache.

There is **no remote installer**. Extension code ships with the repo or is placed on disk
manually; the admin UI only enables and disables what is already present.
