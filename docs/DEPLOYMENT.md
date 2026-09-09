# Deployment

Two processes to run: the Next.js frontend (`3000`) and the backend API (`4000`). Put a
reverse proxy in front of both.

---

## Prerequisites

- Node.js ≥ 20 (22 recommended)
- pnpm ≥ 9
- MySQL ≥ 8, `utf8mb4` / `utf8mb4_general_ci`
- Redis (strongly recommended in production — caching and rate limiting depend on it)
- A TLS certificate

---

## Build

```bash
pnpm install --frozen-lockfile
pnpm build:all          # next build  +  tsc -> dist/
```

`build:all` is `pnpm build && pnpm build:backend`. Both must succeed before starting.

> `NEXT_PUBLIC_*` variables are compiled into the frontend bundle. They must be set
> **before** `pnpm build`, not just before `pnpm start`. Changing one requires a rebuild.

---

## PM2

```bash
pnpm start              # pm2 start production.config.js --env production
pnpm stop
pm2 logs
pm2 monit
pm2 save && pm2 startup # survive reboots
```

`production.config.js` defines two fork-mode apps:

| App | Script | Port |
|---|---|---|
| `backend` | `dist/index.js` | 4000 |
| `frontend` | `next start` | 3000 |

For the multi-threaded backend use `production.thread.config.js` (`pnpm start:thread`) and
set `NEXT_PUBLIC_BACKEND_THREADS`.

### Updating a running install

```bash
pnpm updator            # stop → update deps → seed → build:all → start
```

Back up the database first — see [DATABASE.md](DATABASE.md).

---

## Docker

```bash
cp .env.example .env && $EDITOR .env
docker compose up -d
docker compose logs -f backend
```

Brings up `frontend`, `backend`, `mysql`, `redis`. `db/initial.sql` is mounted into
`/docker-entrypoint-initdb.d/` and loads **only on first boot**, when the MySQL volume is
empty. To re-seed a schema later you must import it manually or drop the volume.

Seed reference data once the stack is healthy:

```bash
docker compose exec backend pnpm seed
```

The image builds both processes and selects one via the container command, so `frontend`
and `backend` share a single build.

---

## Reverse proxy

The backend serves **both** REST and WebSocket on port 4000, so the proxy must handle
upgrade headers. Getting this wrong is the most common deployment failure — the app loads
but prices never tick.

### nginx

```nginx
map $http_upgrade $connection_upgrade {
    default upgrade;
    ''      close;
}

upstream exchangex_frontend { server 127.0.0.1:3000; keepalive 32; }
upstream exchangex_backend  { server 127.0.0.1:4000; keepalive 32; }

server {
    listen 443 ssl http2;
    server_name exchange.example.com;

    ssl_certificate     /etc/letsencrypt/live/exchange.example.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/exchange.example.com/privkey.pem;

    client_max_body_size 25m;          # KYC document uploads

    # API + WebSocket
    location /api/ {
        proxy_pass http://exchangex_backend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade    $http_upgrade;
        proxy_set_header Connection $connection_upgrade;
        proxy_set_header Host              $host;
        proxy_set_header X-Real-IP         $remote_addr;
        proxy_set_header X-Forwarded-For   $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        proxy_read_timeout  7d;        # long-lived streams
        proxy_send_timeout  7d;
        proxy_buffering     off;       # do not buffer streaming responses
    }

    # Everything else → Next.js
    location / {
        proxy_pass http://exchangex_frontend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade    $http_upgrade;
        proxy_set_header Connection $connection_upgrade;
        proxy_set_header Host              $host;
        proxy_set_header X-Real-IP         $remote_addr;
        proxy_set_header X-Forwarded-For   $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}

server {
    listen 80;
    server_name exchange.example.com;
    return 301 https://$host$request_uri;
}
```

Key points:

- `proxy_read_timeout 7d` — the default 60s silently kills WebSocket streams.
- `proxy_buffering off` on `/api/` — buffering breaks streaming responses.
- `client_max_body_size` must exceed your largest KYC/avatar upload.
- Always forward `X-Forwarded-For`; rate limiting keys on client IP.

### Caddy

```
exchange.example.com {
    handle /api/* { reverse_proxy 127.0.0.1:4000 }
    handle       { reverse_proxy 127.0.0.1:3000 }
}
```

Caddy handles TLS and WebSocket upgrades automatically.

---

## Post-deploy checklist

- [ ] All four `APP_*_TOKEN_SECRET` values are unique, random, ≥ 64 hex chars
- [ ] `NEXT_PUBLIC_SITE_URL` matches the real public URL (`https://`, no trailing slash)
- [ ] No credential is behind a `NEXT_PUBLIC_` prefix — see [CONFIGURATION.md](CONFIGURATION.md#naming-gotchas)
- [ ] MySQL is not reachable from the public internet
- [ ] Redis is bound to localhost or firewalled, and password-protected if remote
- [ ] `NODE_ENV=production`
- [ ] `NEXT_PUBLIC_DEMO_STATUS` is off
- [ ] Superadmin password rotated from the seeded default
- [ ] Exchange provider API keys have **trade** but not **withdraw-to-unlisted-address**
- [ ] Server public IP allowlisted in the exchange account
- [ ] Automated database backups scheduled and a restore actually tested
- [ ] `pm2 save && pm2 startup` done
- [ ] TLS auto-renewal verified
- [ ] Log rotation configured (`logs/` grows unbounded otherwise)

---

## Scaling notes

**Frontend** scales horizontally without ceremony — it is stateless. Add instances behind
the load balancer.

**Backend** holds WebSocket connections and in-memory market state. Before running multiple
instances, note:

- Sticky sessions are required so a client stays on the socket that holds its subscriptions.
- `pnpm start:thread` scales within one host via `NEXT_PUBLIC_BACKEND_THREADS`; prefer this
  to multiple hosts until you have measured a real need.
- Cron jobs are **not** leader-elected. Running two full backend instances will double-execute
  scheduled work — investment payouts, staking distributions. Run crons on exactly one
  instance, or disable them on the others.

**MySQL** is the first bottleneck under trading load. Add read replicas for reporting
queries before sharding anything.

---

## Troubleshooting

| Symptom | Likely cause |
|---|---|
| Prices never update; no WS errors | Proxy missing `Upgrade`/`Connection` headers, or `proxy_read_timeout` too low |
| `502` on `/api/*` | Backend not running, or on a different port than the proxy expects |
| Login works, admin pages 403 | Permission missing from the seeder, or `pnpm seed` not re-run |
| Frontend shows old site name | `NEXT_PUBLIC_*` changed without a rebuild |
| Uploads fail over ~1 MB | `client_max_body_size` too small |
| Rate limiting not applying | Redis unreachable, or `X-Forwarded-For` not forwarded |
| Exchange calls fail with auth errors | Server IP not allowlisted, or key lacks trade permission |
