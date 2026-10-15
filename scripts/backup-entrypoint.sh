#!/usr/bin/env bash
# Point d'entrée du conteneur backup — planifie backup.sh via crond (Alpine/busybox).
set -euo pipefail

: "${BACKUP_CRON:=0 2 * * *}"
: "${BACKUP_DIR:=/backups}"

log() { echo "[backup-entrypoint] $(date -u +%FT%TZ) $*"; }

mkdir -p "${BACKUP_DIR}"
CRON_FILE="/etc/crontabs/root"

# crond d'Alpine attend une 5e colonne utilisateur pour /etc/crontabs/*
printf '%s root /scripts/backup.sh >> /proc/1/fd/1 2>&1\n' "${BACKUP_CRON}" > "${CRON_FILE}"
chmod 0600 "${CRON_FILE}"

log "Cron planifié : '${BACKUP_CRON}' → /scripts/backup.sh"

# Premier backup immédiat au démarrage (optionnel, évite d'attendre 24h)
if [ "${BACKUP_ON_START:-1}" = "1" ]; then
  log "Backup initial au démarrage..."
  /scripts/backup.sh || log "Backup initial échoué (non fatal)"
fi

log "Démarrage de crond (foreground)"
exec crond -f -l 2
