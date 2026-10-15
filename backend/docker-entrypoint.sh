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

# --- Diagnostic réseau + attente de la base via PRISMA -------------------------
# Contexte Render : depuis le conteneur, le TLS vers le Postgres public échoue
# (libpq/psql : "SSL connection has been closed unexpectedly"), alors que
# l'application (Prisma) utilise une pile TLS différente. On gate donc sur une
# vraie requête Prisma, avec repli automatique sur le réseau interne Render.
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
INTERNAL_P=$(printf '%s' "$HOST_P" | sed -e 's/\..*$//')

tcp_test() { # host port -> OK/KO (toujours code 0)
  timeout 6 node -e 'const s=require("net").connect(+process.argv[2],process.argv[1],()=>{console.log("OK");s.end();process.exit(0)});s.on("error",e=>{console.log("KO "+e.message);process.exit(0)});setTimeout(()=>{console.log("KO timeout");process.exit(0)},5000)' "$1" "$2" 2>/dev/null || echo "KO"
}

probe_prisma() { # url -> 0 si joignable (journalise la raison en échec)
  DATABASE_URL="$1" timeout 30 node -e '
    const { PrismaClient } = require("@prisma/client");
    const p = new PrismaClient({ datasourceUrl: process.env.DATABASE_URL });
    p.$queryRaw`select 1`.then(() => process.exit(0)).catch(e => {
      console.log("      probe: " + String(e.message).split("\n").slice(0, 2).join(" | ").slice(0, 260));
      process.exit(1);
    });
  '
}

echo "--- diagnostic réseau ---"
echo "externe=$HOST_P:$PORT_P  interne=$INTERNAL_P:$PORT_P"
echo "TCP externe: $(tcp_test "$HOST_P" "$PORT_P")"
echo "TCP interne: $(tcp_test "$INTERNAL_P" "$PORT_P")"
echo "psql externe (require): $(PGCONNECT_TIMEOUT=5 PGSSLMODE=require PGPASSWORD="$PASS_P" psql -h "$HOST_P" -p "$PORT_P" -U "$USER_P" -d "$NAME_P" -tAc 'SELECT 1' 2>&1 | head -n 1)"
echo "psql interne (prefer):  $(PGCONNECT_TIMEOUT=5 PGPASSWORD="$PASS_P" psql -h "$INTERNAL_P" -p "$PORT_P" -U "$USER_P" -d "$NAME_P" -tAc 'SELECT 1' 2>&1 | head -n 1)"
echo "TLS externe (openssl s_client):"
(echo | timeout 8 openssl s_client -connect "$HOST_P:$PORT_P" -starttls postgres 2>&1 || true) | head -n 8
echo "--- fin diagnostic ---"

URL_EXT="${DATABASE_URL:-}"
if [ -z "$URL_EXT" ]; then
  echo "ABANDON: DATABASE_URL absente."
  exit 1
fi
URL_INT=$(printf '%s' "$URL_EXT" | sed -e "s|@[^/]*[:0-9]*/|@$INTERNAL_P:$PORT_P/|")
URL_INT_DIS=$(printf '%s' "$URL_INT" | sed -e 's/sslmode=[a-z]*/sslmode=disable/')

echo "Attente de la base de données (externe, puis réseau interne)..."
n=0
SELECTED=""
while [ "$n" -lt 20 ]; do
  n=$((n + 1))
  if probe_prisma "$URL_EXT"; then SELECTED="$URL_EXT"; break; fi
  if probe_prisma "$URL_INT"; then SELECTED="$URL_INT"; break; fi
  if probe_prisma "$URL_INT_DIS"; then SELECTED="$URL_INT_DIS"; break; fi
  echo "  tentative #$n : aucune cible joignable"
  sleep 2
done

if [ -z "$SELECTED" ]; then
  echo "ABANDON: base de données injoignable après $n tentatives."
  exit 1
fi

export DATABASE_URL="$SELECTED"
case "$SELECTED" in
  *"$INTERNAL_P"*)
    if [ -n "${DIRECT_DATABASE_URL:-}" ]; then
      D=$(printf '%s' "$DIRECT_DATABASE_URL" | sed -e "s|@[^/]*[:0-9]*/|@$INTERNAL_P:$PORT_P/|")
      case "$SELECTED" in
        *sslmode=disable*) D=$(printf '%s' "$D" | sed -e 's/sslmode=[a-z]*/sslmode=disable/') ;;
      esac
      export DIRECT_DATABASE_URL="$D"
    fi
    ;;
esac
echo "Base joignable via: $(printf '%s' "$SELECTED" | sed -e 's|://[^@]*@|://***@|')"

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
