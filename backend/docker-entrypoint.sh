#!/bin/sh
set -e

# Génère des secrets absents (uniquement si non fournis) — en production, fournis-les via .env
if [ -z "$JWT_ACCESS_SECRET" ]; then
  JWT_ACCESS_SECRET=$(openssl rand -hex 64); export JWT_ACCESS_SECRET
  echo "JWT_ACCESS_SECRET généré (fournis-le en prod pour la persistance)"
fi
if [ -z "$JWT_REFRESH_SECRET" ]; then
  JWT_REFRESH_SECRET=$(openssl rand -hex 64); export JWT_REFRESH_SECRET
  echo "JWT_REFRESH_SECRET généré (fournis-le en prod pour la persistance)"
fi
if [ -z "$WEBHOOK_SECRET" ]; then
  WEBHOOK_SECRET=$(openssl rand -hex 32); export WEBHOOK_SECRET
  echo "WEBHOOK_SECRET généré (fournis-le en prod pour la persistance)"
fi

# Attente PostgreSQL direct (hors PgBouncer)
echo "Attente PostgreSQL (${DB_HOST:-postgres}:${DB_PORT:-5432})..."
until pg_isready -U "${DB_USER:-samadokita}" -d "${DB_NAME:-samadokita}" -h "${DB_HOST:-postgres}" -p "${DB_PORT:-5432}" >/dev/null 2>&1; do
  sleep 2
done
echo "PostgreSQL prêt."

# Migrations Prisma : TOUJOURS via connexion directe (le Schema Engine ne supporte pas PgBouncer).
if [ "${SKIP_MIGRATE:-0}" != "1" ]; then
  echo "Application des migrations Prisma (connexion directe)..."
  if [ -n "$DIRECT_DATABASE_URL" ]; then
    DATABASE_URL="$DIRECT_DATABASE_URL" npx prisma migrate deploy --schema=/app/prisma/schema.prisma
  else
    npx prisma migrate deploy --schema=/app/prisma/schema.prisma
  fi
  echo "Migrations appliquées."
else
  echo "SKIP_MIGRATE=1 — migrations ignorées."
fi

exec node dist/main
