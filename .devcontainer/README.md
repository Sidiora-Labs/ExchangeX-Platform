# Devcontainer

A ready-to-code environment: Node 22, pnpm, MySQL 8 with the schema loaded, and Redis.

## Use it

**VS Code** — install the Dev Containers extension, open the repo, then
**Dev Containers: Reopen in Container**.

**GitHub Codespaces** — Code → Codespaces → Create codespace.

First creation takes several minutes: native modules (`uWebSockets.js`, `sharp`, `argon2`)
compile from source. Subsequent starts are fast.

## What setup does

`setup.sh` runs once on creation and:

1. Enables pnpm via corepack.
2. Runs `pnpm install`.
3. Creates `.env` from `.env.example` if absent, pointing at the `mysql` and `redis`
   services and generating four real JWT secrets with `openssl rand -hex 64`.
4. Runs `pnpm seed`.

If `.env` already exists it is left untouched, so your local config survives a rebuild.

## Then

```bash
pnpm dev            # frontend  -> http://localhost:3000
pnpm dev:backend    # backend   -> http://localhost:4000
pnpm test
```

Ports 3000, 4000, 3306, and 6379 forward automatically.

## Services

| Service | Host | Credentials |
|---|---|---|
| MySQL | `mysql:3306` | `exchangex` / `exchangex`, database `exchangex` (root: `root`) |
| Redis | `redis:6379` | none |

These credentials are for local development only.

`db/initial.sql` is mounted into the MySQL init directory and loads **only on first boot**,
while the data volume is empty. To reload it, remove the volume and rebuild.

## Notes

`node_modules` lives in a named volume rather than a bind mount. Native addons built for
Linux inside the container would otherwise collide with host builds. It also makes installs
substantially faster.

To start over, **Dev Containers: Rebuild Container**. To also discard the database:

```bash
docker compose -f .devcontainer/docker-compose.yml down -v
```

## Troubleshooting

| Symptom | Fix |
|---|---|
| `ER_NO_SUCH_TABLE` | Schema never loaded. `docker compose -f .devcontainer/docker-compose.yml down -v`, then rebuild. |
| `pnpm seed` failed during setup | MySQL was still starting. Re-run `pnpm seed`. |
| Native module errors after a host install | `rm -rf node_modules && pnpm install` inside the container. |
| Port already allocated | Something on the host holds 3000/4000/3306/6379. Stop it or change the mapping. |
