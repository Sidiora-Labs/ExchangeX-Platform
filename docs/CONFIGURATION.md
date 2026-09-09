# Configuration

Everything is environment variables, read from `.env` at the repo root. Start from
`.env.example`.

> **`NEXT_PUBLIC_*` is public.** Anything with that prefix is inlined into the JavaScript
> bundle at build time and is visible to every visitor. Never put a secret behind it.
> Note that `.env.example` ships a few misleading names — see [Naming gotchas](#naming-gotchas).

Changing `.env` requires a **restart of the affected process**. Frontend variables also
require a **rebuild** (`pnpm build`), because they are compiled in.

---

## Required

Without these the app will not start correctly.

### Database

| Variable | Example | Notes |
|---|---|---|
| `DB_NAME` | `exchangex` | Must exist before first boot |
| `DB_USER` | `exchangex` | |
| `DB_PASSWORD` | | |
| `DB_HOST` | `localhost` | |
| `DB_PORT` | `3306` | |

MySQL 8+, `utf8mb4` / `utf8mb4_general_ci`.

### Identity

| Variable | Example |
|---|---|
| `NEXT_PUBLIC_SITE_URL` | `https://exchange.example.com` |
| `NEXT_PUBLIC_SITE_NAME` | `ExchangeX` |
| `NEXT_PUBLIC_SITE_DESCRIPTION` | free text, used in meta tags |

### JWT secrets

Four separate secrets so a token minted for one purpose cannot be replayed as another.

```bash
for k in ACCESS REFRESH RESET VERIFY; do
  echo "APP_${k}_TOKEN_SECRET=\"$(openssl rand -hex 64)\""
done
```

| Variable | Purpose |
|---|---|
| `APP_ACCESS_TOKEN_SECRET` | Session access tokens |
| `APP_REFRESH_TOKEN_SECRET` | Refresh tokens |
| `APP_RESET_TOKEN_SECRET` | Password reset links |
| `APP_VERIFY_TOKEN_SECRET` | Email verification links |

Expiries: `JWT_EXPIRY`, `JWT_REFRESH_EXPIRY`, `JWT_RESET_EXPIRY` (e.g. `15m`, `7d`, `1h`).

---

## Runtime

| Variable | Default | Notes |
|---|---|---|
| `NODE_ENV` | | `development` or `production` |
| `NEXT_PUBLIC_FRONTEND_PORT` | `3000` | |
| `NEXT_PUBLIC_BACKEND_PORT` | `4000` | Read by `index.ts` |
| `NEXT_PUBLIC_BACKEND_THREADS` | | Worker count for threaded mode |
| `NEXT_PUBLIC_DEMO_STATUS` | | Demo-mode banner and write restrictions |
| `NEXT_PUBLIC_MAINTENANCE_STATUS` | | Serves the maintenance page |

### Rate limiting

| Variable | Notes |
|---|---|
| `RATE_LIMIT` | Requests per window |
| `RATE_LIMIT_EXPIRY` | Window length in seconds |

Backed by Redis. Without Redis, limiting degrades.

---

## Localization & theme

| Variable | Notes |
|---|---|
| `NEXT_PUBLIC_DEFAULT_LANGUAGE` | e.g. `en` |
| `NEXT_PUBLIC_LANGUAGES` | Comma-separated allowlist; 86 bundles ship in `public/locales/` |
| `NEXT_PUBLIC_DEFAULT_THEME` | `light` / `dark` |
| `NEXT_PUBLIC_DEFAULT_LAYOUT` | Default dashboard layout |
| `NEXT_PUBLIC_FRONTEND` | Selects the marketing frontend variant |

---

## Authentication

| Variable | Notes |
|---|---|
| `NEXT_PUBLIC_GOOGLE_AUTH_STATUS` | `true` enables Google sign-in |
| `NEXT_PUBLIC_GOOGLE_CLIENT_ID` | OAuth client ID |
| `NEXT_PUBLIC_VERIFY_EMAIL_STATUS` | Require verified email before login |
| `NEXT_PUBLIC_GOOGLE_RECAPTCHA_STATUS` | Enable reCAPTCHA |
| `NEXT_PUBLIC_GOOGLE_RECAPTCHA_SITE_KEY` | Public site key |
| `NEXT_PUBLIC_GOOGLE_RECAPTCHA_SECRET_KEY` | ⚠️ See [Naming gotchas](#naming-gotchas) |

---

## Mail

Pick a transport with `APP_EMAILER`, then fill that transport's group.

| `APP_EMAILER` | Required variables |
|---|---|
| `nodemailer-service` | `APP_NODEMAILER_SERVICE`, `APP_NODEMAILER_SERVICE_SENDER`, `APP_NODEMAILER_SERVICE_PASSWORD` |
| `nodemailer-smtp` | `APP_NODEMAILER_SMTP_HOST`, `APP_NODEMAILER_SMTP_PORT`, `APP_NODEMAILER_SMTP_SENDER`, `APP_NODEMAILER_SMTP_PASSWORD` |
| `nodemailer-sendgrid` | `APP_SENDGRID_API_KEY`, `APP_SENDGRID_SENDER` |
| `nodemailer-sendmail` | `APP_SENDMAIL_PATH` |

`NEXT_PUBLIC_APP_EMAIL` is the public support address shown in UI and email footers. When
empty, the "Contact Support" link is omitted rather than rendered as a dead `mailto:`.

---

## SMS & 2FA

| Variable |
|---|
| `APP_TWILIO_ACCOUNT_SID` |
| `APP_TWILIO_AUTH_TOKEN` |
| `APP_TWILIO_VERIFY_SERVICE_SID` |
| `APP_TWILIO_PHONE_NUMBER` |
| `APP_SUPPORT_PHONE_NUMBER` |

---

## Payments

| Provider | Variables |
|---|---|
| Stripe | `APP_STRIPE_PUBLIC_KEY`, `APP_STRIPE_SECRET_KEY` |
| Paystack | `APP_PAYSTACK_PUBLIC_KEY`, `APP_PAYSTACK_SECRET_KEY` |
| PayPal | `NEXT_PUBLIC_APP_PAYPAL_CLIENT_ID`, `APP_PAYPAL_CLIENT_SECRET` |

---

## Exchange provider

Set `NEXT_PUBLIC_EXCHANGE` to one of `binance`, `kucoin`, `okx`, `xt`, then supply that
provider's credentials:

```
APP_<PROVIDER>_API_KEY
APP_<PROVIDER>_API_SECRET
APP_<PROVIDER>_API_PASSPHRASE     # kucoin, okx
```

e.g. `APP_KUCOIN_API_KEY`, `APP_BINANCE_API_SECRET`.

Enable the provider at Admin → Finance → Exchange → Provider. Activating one deactivates
the others — exactly one provider is live at a time.

Most providers require the server's public IP to be allowlisted in the exchange account,
and the API key to carry read + trade permissions (but not withdraw-to-unlisted-address).

`OANDA_API_KEY` is used by the forex extension.

---

## Feature flags

| Variable | Notes |
|---|---|
| `NEXT_PUBLIC_BINARY_STATUS` | Enable binary options |
| `NEXT_PUBLIC_BINARY_PRACTICE_STATUS` | Practice/demo binary accounts |
| `NEXT_PUBLIC_BINARY_PROFIT` | Default payout %, e.g. `87` |
| `NEXT_PUBLIC_BINARY_*_PROFIT` | Per-mode overrides (higher/lower, touch/no-touch, call/put, turbo) |
| `NEXT_PUBLIC_BLOG_STATUS` | Enable the blog |
| `NEXT_PUBLIC_GOOGLE_ANALYTICS_STATUS` / `_ID` | Analytics |
| `NEXT_PUBLIC_FACEBOOK_PIXEL_STATUS` / `_ID` | Pixel |

Larger features are toggled through the `extension` table, not env — see
Admin → System → Extensions.

---

## Naming gotchas

Two variables are named misleadingly in the shipped `.env.example`:

- **`NEXT_PUBLIC_GOOGLE_RECAPTCHA_SECRET_KEY`** — despite `SECRET`, the `NEXT_PUBLIC_`
  prefix means it *is* bundled into client JavaScript. Treat it as compromised if you rely
  on it for server-side verification, and prefer a server-only variable.
- **`NEXT_PUBLIC_APP_PAYPAL_CLIENT_ID`** — correctly public (client IDs are not secret),
  but sits next to `APP_PAYPAL_CLIENT_SECRET`, which is server-only. Do not mirror the
  secret behind a public prefix.

Audit anything you add: if it is a credential, it must **not** start with `NEXT_PUBLIC_`.

