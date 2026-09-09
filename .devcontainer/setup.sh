#!/usr/bin/env bash
# Runs once, when the container is first created.
set -euo pipefail

cd /workspace

echo "==> Enabling pnpm"
corepack enable
corepack prepare pnpm@latest --activate

echo "==> Installing dependencies (native addons build here; this is slow the first time)"
pnpm install

if [ ! -f .env ]; then
  echo "==> Creating .env from .env.example"
  cp .env.example .env

  # Point at the compose services and generate real JWT secrets so the app
  # boots without manual editing.
  set_env() {
    if grep -q "^$1=" .env; then
      sed -i "s|^$1=.*|$1=$2|" .env
    else
      echo "$1=$2" >> .env
    fi
  }

  set_env DB_HOST mysql
  set_env DB_PORT 3306
  set_env DB_NAME exchangex
  set_env DB_USER exchangex
  set_env DB_PASSWORD exchangex
  set_env NEXT_PUBLIC_SITE_URL http://localhost:3000
  set_env NEXT_PUBLIC_SITE_NAME ExchangeX
  set_env NEXT_PUBLIC_FRONTEND_PORT 3000
  set_env NEXT_PUBLIC_BACKEND_PORT 4000
  set_env NEXT_PUBLIC_DEFAULT_LANGUAGE en
  set_env NODE_ENV development

  for k in ACCESS REFRESH RESET VERIFY; do
    set_env "APP_${k}_TOKEN_SECRET" "\"$(openssl rand -hex 64)\""
  done

  echo "==> .env created with generated JWT secrets"
else
  echo "==> .env already present, leaving it alone"
fi

echo "==> Seeding reference data"
pnpm seed || echo "!! Seeding failed — run 'pnpm seed' by hand once MySQL is up."

cat <<'BANNER'

  ExchangeX devcontainer is ready.

    pnpm dev            frontend  -> http://localhost:3000
    pnpm dev:backend    backend   -> http://localhost:4000
    pnpm test           test suite
    pnpm lint           eslint

  MySQL  mysql:3306  (exchangex / exchangex)
  Redis  redis:6379

BANNER
