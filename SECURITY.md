# Security

## Reporting a vulnerability

**Do not open a public issue, PR, or discussion for a security problem.**

Report privately through GitHub's **Security → Report a vulnerability** (private advisory),
or email the address configured in `NEXT_PUBLIC_APP_EMAIL` for this deployment.

Include: what you found, how to reproduce it, the impact, affected version/commit, and any
suggested fix. A working proof of concept helps but is not required.

Expect an acknowledgement within a few business days. Please give a reasonable window to
ship a fix before disclosing publicly.

### In scope

Anything that lets an attacker move funds they do not own, read another user's data,
escalate privileges, bypass authentication or KYC, or take over the host: authentication and
session handling, the RBAC permission layer, wallet and withdrawal logic, balance
arithmetic, order matching, API input validation, SQL/NoSQL injection, XSS, SSRF, IDOR,
secret exposure.

### Out of scope

Findings against a deployment's own misconfiguration (weak passwords, exposed MySQL,
missing TLS), rate-limit tuning, third-party services (Stripe, Twilio, exchange providers),
social engineering, physical access, and automated-scanner output with no demonstrated
impact.

---

## Deployment hardening

This is a self-hosted financial application. Most real incidents come from deployment
mistakes, not code.

### Secrets

- Four **distinct**, random secrets: `APP_ACCESS_TOKEN_SECRET`, `APP_REFRESH_TOKEN_SECRET`,
  `APP_RESET_TOKEN_SECRET`, `APP_VERIFY_TOKEN_SECRET`. Generate with
  `openssl rand -hex 64`. Reusing one value across all four means a reset token can be
  replayed as a session token.
- **Never prefix a secret with `NEXT_PUBLIC_`.** That prefix inlines the value into the
  client bundle, where anyone can read it. Note that `.env.example` ships
  `NEXT_PUBLIC_GOOGLE_RECAPTCHA_SECRET_KEY`, which is public despite its name — see
  [docs/CONFIGURATION.md](docs/CONFIGURATION.md#naming-gotchas).
- `.env` is gitignored. Keep it that way; use your platform's secret store in production.
- Rotate the seeded superadmin password immediately after first login.

### Network

- MySQL must not be reachable from the internet. Bind to localhost or a private network.
- Redis must be firewalled and password-protected if it is not on localhost.
- Terminate TLS at the proxy; redirect all HTTP to HTTPS.
- Forward `X-Forwarded-For` — rate limiting keys on client IP and is ineffective without it.

### Exchange provider keys

- Grant **read** and **trade**. Do **not** grant withdraw-to-unlisted-address.
- Allowlist the server's public IP in the exchange account.
- Store them server-side only (`APP_<PROVIDER>_API_*`, never `NEXT_PUBLIC_`).

### Operations

- Keep dependencies patched; `pnpm audit` in CI.
- Automated database backups, stored off-host, with a **tested** restore.
- Rotate `logs/` — it grows unbounded and may contain request context.
- Turn `NEXT_PUBLIC_DEMO_STATUS` off in production.
- Review admin role assignments; grant the narrowest permission set that works.

---

## Notes for contributors

**Money is not a float.** Use `BigNumber` for balance arithmetic. Floating-point rounding on
financial values is a correctness bug and, at scale, an exploitable one.

**Authorize every endpoint.** `metadata.requiresAuth` and `metadata.permission` are the
enforcement mechanism, not documentation. An endpoint that touches funds and omits them is
open to the internet. The contract tests verify metadata is present and permissions exist,
but they cannot tell you the permission is the *right* one.

**Validate at the boundary.** Route input is validated by AJV from the `metadata` schema.
Keep schemas accurate and tight, especially on withdrawal and transfer paths.

**Never log secrets.** No tokens, keys, passwords, or full request bodies on auth routes.

**Watch for IDOR.** Scope every query by the authenticated user. `findByPk(params.id)`
without an ownership check is the single most common vulnerability shape in this codebase's
domain.

