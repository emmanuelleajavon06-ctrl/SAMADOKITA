#!/usr/bin/env bash
# SamaDokita — Backup PostgreSQL + upload S3 (MinIO/SeaweedFS)
# Déclenché par cron dans le conteneur "backup". Idempotent, safe à relancer.
set -euo pipefail

: "${PGHOST:=postgres}"
: "${PGPORT:=5432}"
: "${PGUSER:=samadokita}"
: "${PGDATABASE:=samadokita}"
: "${BACKUP_DIR:=/backups}"
: "${BACKUP_KEEP:=14}"
: "${S3_BUCKET:=samadokita-backups}"
: "${S3_ENDPOINT:=http://minio:9000}"
: "${S3_ACCESS_KEY:=}"
: "${S3_SECRET_KEY:=}"

STAMP="$(date +%Y%m%d-%H%M%S)"
FILE="${BACKUP_DIR}/samadokita-${STAMP}.sql.gz"

log() { echo "[backup] $(date -u +%FT%TZ) $*"; }

mkdir -p "${BACKUP_DIR}"

log "Dump ${PGDATABASE}@${PGHOST}:${PGPORT} → ${FILE}"
PGPASSWORD="${PGPASSWORD:-}" pg_dump \
  --host="${PGHOST}" \
  --port="${PGPORT}" \
  --username="${PGUSER}" \
  --dbname="${PGDATABASE}" \
  --no-owner \
  --no-privileges \
  --format=custom \
  --compress=6 \
  --file="${FILE}"

SIZE="$(wc -c < "${FILE}" | tr -d ' ')"
log "Dump terminé (${SIZE} octets)"

# Upload S3 si les credentials sont fournis
if [ -n "${S3_ACCESS_KEY}" ] && [ -n "${S3_SECRET_KEY}" ]; then
  if command -v mc >/dev/null 2>&1; then
    log "Upload vers ${S3_ENDPOINT}/${S3_BUCKET}"
    mc alias set backup "${S3_ENDPOINT}" "${S3_ACCESS_KEY}" "${S3_SECRET_KEY}" >/dev/null 2>&1 || true
    mc mb --ignore-existing "backup/${S3_BUCKET}" >/dev/null 2>&1 || true
    mc cp "${FILE}" "backup/${S3_BUCKET}/$(basename "${FILE}")" && log "Upload S3 OK" || log "Upload S3 ÉCHEC (non fatal)"
  else
    log "mc absent — upload S3 ignoré"
  fi
else
  log "Credentials S3 absents — upload S3 ignoré"
fi

# Purge des anciens backups locaux (garde les N plus récents)
log "Purge : conservation des ${BACKUP_KEEP} plus récents"
ls -1t "${BACKUP_DIR}"/samadokita-*.sql.gz 2>/dev/null | tail -n +$((BACKUP_KEEP + 1)) | while read -r old; do
  log "Suppression $(basename "${old}")"
  rm -f "${old}"
done

log "Backup terminé avec succès"
