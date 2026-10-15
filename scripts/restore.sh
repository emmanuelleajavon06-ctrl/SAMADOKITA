#!/usr/bin/env bash
# SamaDokita — Restauration PostgreSQL depuis un backup .sql.gz (format custom)
# Usage :
#   ./restore.sh /backups/samadokita-YYYYMMDD-HHMMSS.sql.gz
#   ./restore.sh --latest
#   FORCE=1 ./restore.sh --latest   (saute la confirmation de DROP)
set -euo pipefail

: "${PGHOST:=postgres}"
: "${PGPORT:=5432}"
: "${PGUSER:=samadokita}"
: "${PGDATABASE:=samadokita}"
: "${BACKUP_DIR:=/backups}"

log() { echo "[restore] $(date -u +%FT%TZ) $*"; }
die() { echo "[restore] ERREUR : $*" >&2; exit 1; }

# --- Sélection du fichier -------------------------------------------------
if [ "${1:-}" = "--latest" ] || [ -z "${1:-}" ]; then
  FILE="$(ls -1t "${BACKUP_DIR}"/samadokita-*.sql.gz 2>/dev/null | head -n1 || true)"
  [ -n "${FILE}" ] || die "aucun backup trouvé dans ${BACKUP_DIR}"
else
  FILE="$1"
  [ -f "${FILE}" ] || die "fichier introuvable : ${FILE}"
fi

log "Restauration de ${FILE} → ${PGDATABASE}@${PGHOST}:${PGPORT}"

# --- Confirmation ---------------------------------------------------------
if [ "${FORCE:-0}" != "1" ]; then
  printf "Cette opération VIDERA la base '%s'. Tapez 'oui' pour continuer : " "${PGDATABASE}"
  read -r answer
  [ "${answer}" = "oui" ] || die "annulé par l'utilisateur"
fi

# --- DROP des objets existants (schéma public) ----------------------------
log "Nettoyage du schéma public"
PGPASSWORD="${PGPASSWORD:-}" psql \
  --host="${PGHOST}" --port="${PGPORT}" --username="${PGUSER}" --dbname="${PGDATABASE}" \
  --set=ON_ERROR_STOP=1 \
  --command="DROP SCHEMA IF EXISTS public CASCADE; CREATE SCHEMA public; GRANT ALL ON SCHEMA public TO public;"

# --- Restauration ---------------------------------------------------------
log "pg_restore en cours..."
PGPASSWORD="${PGPASSWORD:-}" pg_restore \
  --host="${PGHOST}" --port="${PGPORT}" --username="${PGUSER}" --dbname="${PGDATABASE}" \
  --no-owner --no-privileges --exit-on-error \
  "${FILE}"

# --- Vérification ---------------------------------------------------------
COUNT="$(PGPASSWORD="${PGPASSWORD:-}" psql \
  --host="${PGHOST}" --port="${PGPORT}" --username="${PGUSER}" --dbname="${PGDATABASE}" \
  --tuples-only --no-align \
  --command="SELECT count(*) FROM information_schema.tables WHERE table_schema='public';")"

log "Restauration terminée. ${COUNT} tables présentes."
