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

# Attente PostgreSQL direct (hors PgBouncer).
# ⚠️ pg_isready ne négocie PAS le TLS : Render Postgres rejette les connexions
# non-SSL (FATAL) → attente infinie → "Port scan timeout" côté Render.
# On utilise donc psql (libpq complet : SSL + authentification).
HOST_P="${DB_HOST:-postgres}"
PORT_P="${DB_PORT:-5432}"
USER_P="${DB_USER:-samadokita}"
NAME_P="${DB_NAME:-samadokita}"
PASS_P="${DB_PASSWORD:-}"
if [ -z "$PASS_P" ]; then
  # Repli : extraction du mot de passe depuis DATABASE_URL
  PASS_P=$(printf '%s' "${DATABASE_URL:-}" | sed -e 's|^[a-zA-Z][a-zA-Z0-9+.-]*://[^:/@]*:\([^@]*\)@.*|\1|')
  case "$PASS_P" in *":://"*) PASS_P="" ;; esac
fi

echo "Attente PostgreSQL ($HOST_P:$PORT_P)..."
n=0
until PGPASSWORD="$PASS_P" psql -h "$HOST_P" -p "$PORT_P" -U "$USER_P" -d "$NAME_P" -tAc 'SELECT 1' >/dev/null 2>&1; do
  n=$((n + 1))
  if [ $((n % 5)) -eq 1 ]; then
    ERR=$(PGPASSWORD="$PASS_P" psql -h "$HOST_P" -p "$PORT_P" -U "$USER_P" -d "$NAME_P" -tAc 'SELECT 1' 2>&1 | head -n 2 | tr '\n' ' ')
    echo "  ...tentative #$n : $ERR"
  fi
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
