# SamaDokita — PgBouncer (pooling transaction pour Prisma @ 800K users)
FROM alpine:3.20

RUN apk add --no-cache pgbouncer bash gettext

COPY scripts/pgbouncer/pgbouncer.ini /etc/pgbouncer/pgbouncer.ini.tpl
COPY scripts/pgbouncer/entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

EXPOSE 6432

HEALTHCHECK --interval=10s --timeout=5s --retries=5 \
  CMD nc -z 127.0.0.1 6432 || exit 1

ENTRYPOINT ["/entrypoint.sh"]
