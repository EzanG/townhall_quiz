#!/usr/bin/env sh
set -e
cd /app
node scripts/migrate.mjs
exec pnpm exec tsx server.ts
