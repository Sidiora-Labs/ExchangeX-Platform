# Known issues

Defects found while building the test suite. Each is baselined in tests so it cannot get
worse, and documented here so it does not get forgotten.

Verify any of these yourself with the commands given.

---

## 1. Seven permissions are referenced but never seeded

**Severity:** high — the affected endpoints are unreachable by every user, superadmin included.

31 route files across 7 distinct permission strings declare `metadata.permission` values that
do not exist in `seeders/20240402234643-permissions.js`. Since a role can only be granted a
permission that exists, no role can ever satisfy these checks.

| Permission | Affects |
|---|---|
| `Access Admin Profits` | `admin/finance/profit/**` (7 routes) |
| `Access Page Management` | `admin/content/page/**` |
| `Access Slider Management` | `admin/content/slider/**` (9 routes) |
| `Access Futures Order Management` | `admin/ext/futures/order/**` |
| `Access Futures Position Management` | `admin/ext/futures/position/**` |
| `Access Blockchain Management` | `admin/ext/ecosystem/blockchain/[id]/status.put.ts` |
| `Test Emailer` | `admin/system/notification/email/test.get.ts` |

`Access Blockchain Management` is also declared by the admin page
`src/pages/admin/ext/ecosystem/blockchain/[productId]/index.tsx`.

**Fix:** add the seven strings to the permission seeder, grant them to the appropriate roles
in `seeders/20240402234649-roles.js`, and re-run `pnpm seed`. Confirm nothing should be
gated differently before granting broadly.

**Guarded by:** `tests/contract/route-metadata.test.ts` → *"keeps the unseeded-permission gap
from growing"*. That test fails if an eighth appears.

```bash
pnpm test tests/contract
```

---

## 2. 88 duplicate `operationId` values across 192 route files

**Severity:** medium — corrupts the generated OpenAPI document.

`backend/docs.ts` keys operations by `operationId`. Where two routes share one, the second
overwrites the first, so `/api/docs/v1` silently under-reports the API and generated clients
lose methods.

Worst offenders:

| operationId | Files |
|---|---|
| `getAnalyticsData` | 7 |
| `getCurrencies` | 3 |
| `listWallets` | 3 |
| `getWallet` | 3 |
| `listOrders` | 3 |
| `getTransactionsStructure` | 3 |
| `verifyStripeCheckoutSession` | 3 — including a **PayPal** route |

That last one looks like a copy-paste slip worth checking on its own:
`finance/deposit/fiat/paypal/verify.post.ts` carries the Stripe operationId.

**Fix:** namespace them by scope — `listUserWallets`, `listAdminWallets`,
`listEcosystemWallets` rather than three `listWallets`.

**Guarded by:** `tests/contract/route-metadata.test.ts` → the duplicate-count tripwire.

---

## 3. Three routes have no default export

**Severity:** medium — the routes cannot handle a request.

The router resolves each module's default export as the handler. These three export
`metadata` but no handler:

- `backend/api/admin/ext/ecosystem/token/[id]/holder.get.ts`
- `backend/api/admin/ext/ecosystem/wallet/master/balance.get.ts`
- `backend/api/admin/ext/ecosystem/wallet/master/[chain]/[address]/transactions/index.get.ts`

**Guarded by:** `tests/contract/route-metadata.test.ts` → *"does not add new routes without a
default export"*.

---

## 4. `groupByPrice` double-counts runs of three or more identical prices

**Severity:** medium — displays wrong order book depth.

`src/utils/orderbook.ts` looks only one level ahead and one behind. For three levels at the
same price it emits two rows and counts the middle level's size twice:

```
input   [[1000, 100], [1000, 200], [1000, 300]]     // total size 600
output  [[1000, 300], [1000, 500]]                  // total size 800
```

The aggregation is correct for pairs, which is the common case — hence it going unnoticed.

**Fix:** replace the neighbour comparison with a single reduce keyed on price.

**Guarded by:** `tests/unit/utils/orderbook.test.ts` → *"double-counts a run of three
identical prices"*, which asserts current behavior with the trace in a comment.

---

## 5. `capitalize("")` throws

**Severity:** low.

`src/utils/text.ts` indexes `text[0]` with no guard, so an empty string raises
`TypeError: Cannot read properties of undefined (reading 'toUpperCase')`.

**Fix:** `if (!text) return text;`

**Guarded by:** `tests/unit/utils/text.test.ts` → *"throws on an empty string"*.

---

## 6. `formatNumber` expands all negative numbers

**Severity:** low — cosmetic.

`src/utils/strings.ts` branches on `value < 0.001`, which every negative number satisfies.
So `formatNumber(-5)` returns the string `"-5.00000000"` while `formatNumber(5)` returns the
number `5` — different type and different formatting for the same magnitude.

**Fix:** compare on `Math.abs(value)`.

**Guarded by:** `tests/unit/utils/strings.test.ts` → *"passes negative numbers through when
not small"*.

---

## 7. `roundToNearest` floors rather than rounding

**Severity:** low — naming, not behavior.

`src/utils/orderbook.ts` implements `Math.floor(value / interval) * interval`, so
`roundToNearest(1999, 1000)` is `1000`, not `2000`. Flooring is correct for order book
bucketing; the name is what misleads.

**Fix:** rename to `floorToInterval`.

---

## Not a defect, but worth knowing

**`NEXT_PUBLIC_GOOGLE_RECAPTCHA_SECRET_KEY` is public.** The `NEXT_PUBLIC_` prefix inlines it
into the client bundle despite the name. See
[CONFIGURATION.md](CONFIGURATION.md#naming-gotchas).

**Three dead tables.** `frontend`, `forex_currency`, and `mailwizard_block` exist in the
schema with no code referencing them. Retained deliberately — see [DATABASE.md](DATABASE.md).

**No leader election for crons.** Running two backend instances double-executes scheduled
payouts. See [DEPLOYMENT.md](DEPLOYMENT.md#scaling-notes).
