#!/usr/bin/env bash
# Génère la config PgBouncer + userlist à partir des variables d'environnement.
set -euo pipefail

: "${DB_HOST:=postgres}"
: "${DB_PORT:=5432}"
: "${DB_NAME:=samadokita}"
: "${DB_USER:=samadokita}"
: "${DB_PASSWORD:?DB_PASSWORD manquant}"
: "${PGBOUNCER_MAX_CLIENT_CONN:=1000}"
: "${PGBOUNCER_DEFAULT_POOL_SIZE:=40}"
: "${PGBOUNCER_MIN_POOL_SIZE:=10}"
: "${PGBOUNCER_RESERVE_POOL_SIZE:=10}"

# userlist.txt : mot de passe en clair requis par auth_type=scram-sha-256 (poids standard).
printf '"%s" "%s"\n' "${DB_USER}" "${DB_PASSWORD}" > /etc/pgbouncer/userlist.txt
chmod 0600 /etc/pgbouncer/userlist.txt

# Substitution ${VAR} du template de config (auth_file reste tel quel).
export DB_HOST DB_PORT DB_NAME DB_USER
export PGBOUNCER_MAX_CLIENT_CONN PGBOUNCER_DEFAULT_POOL_SIZE PGBOUNCER_MIN_POOL_SIZE PGBOUNCER_RESERVE_POOL_SIZE

envsubst < /etc/pgbouncer/pgbouncer.ini.tpl > /etc/pgbouncer/pgbouncer.ini

echo "[pgbouncer] config générée → base=${DB_NAME} pool_mode=transaction pool=${PGBOUNCER_DEFAULT_POOL_SIZE}"

exec pgbouncer /etc/pgbouncer/pgbouncer.ini
