#!/bin/sh
# Container entrypoint: apply Prisma migrations, then start the Next.js server.
#
# Migrations run only when DATABASE_URL is set (mirroring
# scripts/prisma-migrate-if-configured.mjs) and can be disabled with
# RUN_MIGRATIONS=false, for example when a deployment pipeline owns them.
set -eu

if [ -n "${DATABASE_URL:-}" ] && [ "${RUN_MIGRATIONS:-true}" = "true" ]; then
  attempts=0
  max_attempts=10
  until (cd /app/migrate && ./node_modules/.bin/prisma migrate deploy); do
    attempts=$((attempts + 1))
    if [ "$attempts" -ge "$max_attempts" ]; then
      echo "Prisma migrations failed after $max_attempts attempts." >&2
      exit 1
    fi
    echo "Prisma migration attempt $attempts failed; retrying in 5 seconds..." >&2
    sleep 5
  done
else
  echo "Skipping Prisma migrations (DATABASE_URL unset or RUN_MIGRATIONS=false)."
fi

exec node server.js
