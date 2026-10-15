# SamaDokita — conteneur de backup PostgreSQL + MinIO client (mc)
FROM postgres:16-alpine

# MinIO client (mc) pour l'upload S3
ARG MC_VERSION=RELEASE.2025-04-16T18-13-26Z
RUN apk add --no-cache bash curl ca-certificates tzdata \
  && curl -fsSL -o /usr/local/bin/mc \
       "https://dl.min.io/mc/release/linux-amd64/archive/mc.${MC_VERSION}" \
  && chmod +x /usr/local/bin/mc \
  && apk del curl

ENV BACKUP_DIR=/backups \
    BACKUP_KEEP=14 \
    BACKUP_CRON="0 2 * * *" \
    TZ=Africa/Dakar

RUN mkdir -p /backups /scripts

COPY scripts/backup.sh /scripts/backup.sh
COPY scripts/backup-entrypoint.sh /scripts/backup-entrypoint.sh
RUN chmod +x /scripts/backup.sh /scripts/backup-entrypoint.sh

VOLUME ["/backups"]

ENTRYPOINT ["/scripts/backup-entrypoint.sh"]
