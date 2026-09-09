# ExchangeX-Platform — Agent Context

<!-- codify-owned: graph-agent-context v1 -->

_Generated graph context owned by `cg agentmd`. Regenerate with `cg agentmd --write` after significant changes. Workflow instructions remain owned by `cg spec render`._

## Languages

| Language | Files | Lines |
|---|---:|---:|
| typescript | 2908 | 270227 |
| javascript | 59 | 5719 |

2967 source files, 275946 lines total.

## Directory map

- `backend/` — 1154 files, 111793 lines (mostly typescript)
- `(root)` — 13 files, 647 lines (mostly javascript)
- `ecosystem/` — 3 files, 65 lines (mostly javascript)
- `models/` — 111 files, 16902 lines (mostly typescript)
- `packages/` — 24 files, 2546 lines (mostly javascript)
- `scripts/` — 1 files, 87 lines (mostly javascript)
- `seeders/` — 15 files, 2613 lines (mostly javascript)
- `src/` — 1063 files, 125845 lines (mostly typescript)
- `tests/` — 63 files, 7074 lines (mostly typescript)
- `themes/` — 389 files, 2103 lines (mostly typescript)
- `types/` — 131 files, 6271 lines (mostly typescript)

## Build & tooling

- `package.json` — npm/node (scripts: `dev` `dev:backend` `dev:thread` `benchmark` `start` `start:thread` `start:frontend` `start:backend` `start:backend:thread` `stop` `build` `build:backend` `build:all` `seed` `updator` `updator:thread` `updator:backend` `lint` `format` `style` `i18n:wrap` `gate` `test`)
- `Dockerfile` — Docker
- `docker-compose.yml` — Docker Compose

## Entry points

- function `main` — `packages/multispinner/extras/examples/cli-with-promises/index.js:25`

## HTTP routes

| Method | Pattern | Handler | Where |
|---|---|---|---|
| * | `/` | — | `src/components/builder/utils/fetch.ts:47` |
| * | `/` | — | `src/middleware.ts:208` |
| * | `/` | — | `src/stores/admin/builder/index.tsx:32` |
| OPTIONS | `/*` | — | `backend/server.ts:238` |
| * | `/admin/content/category?name=[category.name]` | — | `src/pages/admin/content/post/index.tsx:42` |
| * | `/admin/content/category?name=[category.name]` | — | `src/pages/user/blog/author/[id]/index.tsx:27` |
| * | `/admin/content/post?slug=[post.slug]` | — | `src/pages/admin/content/comment/index.tsx:18` |
| * | `/admin/crm/kyc?status=APPROVED` | — | `src/pages/admin/crm/kyc/applicant/analysis.tsx:22` |
| * | `/admin/crm/kyc?status=PENDING` | — | `src/pages/admin/crm/kyc/applicant/analysis.tsx:15` |
| * | `/admin/crm/kyc?status=REJECTED` | — | `src/pages/admin/crm/kyc/applicant/analysis.tsx:29` |
| * | `/admin/crm/support/ticket?importance=HIGH` | — | `src/pages/admin/crm/support/ticket/analysis.tsx:61` |
| * | `/admin/crm/support/ticket?importance=LOW` | — | `src/pages/admin/crm/support/ticket/analysis.tsx:47` |
| * | `/admin/crm/support/ticket?importance=MEDIUM` | — | `src/pages/admin/crm/support/ticket/analysis.tsx:54` |
| * | `/admin/crm/support/ticket?status=CLOSED` | — | `src/pages/admin/crm/support/ticket/analysis.tsx:37` |
| * | `/admin/crm/support/ticket?status=OPEN` | — | `src/pages/admin/crm/support/ticket/analysis.tsx:23` |
| * | `/admin/crm/support/ticket?status=PENDING` | — | `src/pages/admin/crm/support/ticket/analysis.tsx:16` |
| * | `/admin/crm/support/ticket?status=REPLIED` | — | `src/pages/admin/crm/support/ticket/analysis.tsx:30` |
| * | `/admin/crm/user?email=[author.user.email]` | — | `src/pages/admin/content/post/index.tsx:27` |
| * | `/admin/crm/user?email=[raisedBy.email]` | — | `src/pages/admin/ext/p2p/dispute/index.tsx:16` |
| * | `/admin/crm/user?email=[referred.email]` | — | `src/pages/admin/ext/affiliate/referral/index.tsx:32` |
| * | `/admin/crm/user?email=[referrer.email]` | — | `src/pages/admin/ext/affiliate/referral/index.tsx:16` |
| * | `/admin/crm/user?email=[reviewed.email]` | — | `src/pages/admin/ext/p2p/review/index.tsx:32` |
| * | `/admin/crm/user?email=[reviewer.email]` | — | `src/pages/admin/ext/p2p/review/index.tsx:16` |
| * | `/admin/crm/user?email=[seller.email]` | — | `src/pages/admin/ext/p2p/trade/index.tsx:30` |
| * | `/admin/crm/user?email=[user.email]` | — | `src/pages/admin/api/key/index.tsx:20` |
| * | `/admin/crm/user?email=[user.email]` | — | `src/pages/admin/content/author/index.tsx:15` |
| * | `/admin/crm/user?email=[user.email]` | — | `src/pages/admin/content/comment/index.tsx:28` |
| * | `/admin/crm/user?email=[user.email]` | — | `src/pages/admin/crm/kyc/applicant/index.tsx:15` |
| * | `/admin/crm/user?email=[user.email]` | — | `src/pages/admin/crm/support/ticket/index.tsx:15` |
| * | `/admin/crm/user?email=[user.email]` | — | `src/pages/admin/ext/ai/investment/log/index.tsx:15` |
| * | `/admin/crm/user?email=[user.email]` | — | `src/pages/admin/ext/ecommerce/order/index.tsx:15` |
| * | `/admin/crm/user?email=[user.email]` | — | `src/pages/admin/ext/ecommerce/review/index.tsx:15` |
| * | `/admin/crm/user?email=[user.email]` | — | `src/pages/admin/ext/ecommerce/wishlist/index.tsx:15` |
| * | `/admin/crm/user?email=[user.email]` | — | `src/pages/admin/ext/forex/investment/index.tsx:16` |
| * | `/admin/crm/user?email=[user.email]` | — | `src/pages/admin/ext/forex/account/index.tsx:15` |
| * | `/admin/crm/user?email=[user.email]` | — | `src/pages/admin/ext/ico/contribution/index.tsx:15` |
| * | `/admin/crm/user?email=[user.email]` | — | `src/pages/admin/ext/p2p/offer/index.tsx:15` |
| * | `/admin/crm/user?email=[user.email]` | — | `src/pages/admin/ext/p2p/payment/method/index.tsx:15` |
| * | `/admin/crm/user?email=[user.email]` | — | `src/pages/admin/ext/p2p/trade/index.tsx:15` |
| * | `/admin/crm/user?email=[user.email]` | — | `src/pages/admin/ext/staking/log/index.tsx:16` |
| * | `/admin/crm/user?email=[user.email]` | — | `src/pages/admin/finance/investment/history/index.tsx:16` |
| * | `/admin/crm/user?email=[user.email]` | — | `src/pages/admin/finance/order/binary/index.tsx:15` |
| * | `/admin/crm/user?email=[user.email]` | — | `src/pages/admin/finance/order/exchange/index.tsx:15` |
| * | `/admin/crm/user?email=[user.email]` | — | `src/pages/admin/finance/transaction/index.tsx:22` |
| * | `/admin/crm/user?email=[user.email]` | — | `src/pages/admin/finance/wallet/index.tsx:15` |
| * | `/admin/crm/user?email=[wallet.user.email]` | — | `src/pages/admin/ext/ecosystem/ledger/index.tsx:16` |
| * | `/admin/crm/user?email={referrer.email}` | — | `src/pages/admin/ext/affiliate/reward/index.tsx:16` |
| * | `/admin/crm/user?email={user.email}` | — | `src/pages/admin/ext/payment/intent/index.tsx:17` |
| * | `/admin/crm/user?status=ACTIVE` | — | `src/pages/admin/crm/user/analysis.tsx:15` |
| * | `/admin/crm/user?status=BANNED` | — | `src/pages/admin/crm/user/analysis.tsx:29` |
| * | `/admin/crm/user?status=INACTIVE` | — | `src/pages/admin/crm/user/analysis.tsx:22` |
| * | `/admin/crm/user?status=SUSPENDED` | — | `src/pages/admin/crm/user/analysis.tsx:36` |
| * | `/admin/ext/ecommerce/category?name=[name]` | — | `src/pages/admin/ext/ecommerce/product/index.tsx:28` |
| * | `/admin/ext/ecommerce/category?name=[product.category.name]` | — | `src/pages/admin/ext/ecommerce/discount/index.tsx:16` |
| * | `/admin/ext/ecommerce/category?name=[product.category.name]` | — | `src/pages/admin/ext/ecommerce/review/index.tsx:31` |
| * | `/admin/ext/ecommerce/product?name=[name]` | — | `src/pages/admin/ext/ecommerce/order/index.tsx:30` |
| * | `/admin/ext/ecommerce/product?name=[product.name]` | — | `src/pages/admin/ext/ecommerce/discount/index.tsx:15` |
| * | `/admin/ext/ecommerce/product?name=[product.name]` | — | `src/pages/admin/ext/ecommerce/review/index.tsx:30` |
| * | `/admin/ext/ecommerce/product?name={name}` | — | `src/pages/admin/ext/ecommerce/wishlist/index.tsx:30` |
| * | `/admin/ext/faq/category?id=[faqCategory.id]` | — | `src/pages/admin/ext/faq/question/index.tsx:37` |

## Load-bearing symbols (most referenced)

- `baseStringSchema` (function, 727 refs) — `backend/utils/schema/index.ts:1`
- `error` (function, 676 refs) — `backend/utils/eco/utxo.ts:113`
- `createError` (function, 599 refs) — `backend/utils/error.ts:26`
- `set` (method, 432 refs) — `models/depositMethod.ts:111`
- `get` (method, 356 refs) — `models/depositMethod.ts:107`
- `notFoundMetadataResponse` (function, 308 refs) — `backend/utils/query.ts:387`
- `logError` (function, 231 refs) — `backend/utils/logger.ts:55`
- `baseNumberSchema` (function, 223 refs) — `backend/utils/schema/index.ts:25`
- `updateRecordResponses` (function, 205 refs) — `backend/utils/query.ts:463`
- `adminHandler` (function, 204 refs) — `tests/unit/api/helpers.ts:29`
- `createHandler` (function, 187 refs) — `tests/unit/api/helpers.ts:19`
- `baseDateTimeSchema` (function, 159 refs) — `backend/utils/schema/index.ts:59`
- `updateStatus` (function, 120 refs) — `backend/utils/query.ts:307`
- `Overrides` (interface, 114 refs) — `src/data/charting_library/charting_library.d.ts:15815`
- `fromBigInt` (function, 112 refs) — `backend/utils/eco/blockchain.ts:102`

## Querying this codebase

This project is indexed by Codify (SQLite + FTS5, 100% local). Prefer these over grep/file-walking — one call returns definitions, snippets, and call edges:

```bash
cg context <query>      # symbols + snippets + callers/callees + routes
cg search <text>        # instant name/full-text search
cg symbol <name>        # definition + snippet + reference count
cg impact <name> -d 3   # who breaks if this changes
cg routes [filter]      # URL pattern -> handler
cg changes              # impact radius of uncommitted edits
```

All of the above accept `--json`. The graph auto-syncs via `cg watch`, or connect over MCP with `cg mcp-install`.
