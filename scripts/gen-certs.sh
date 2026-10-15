#!/usr/bin/env bash
# SamaDokita — Génération d'un certificat TLS pour nginx.
#
# Usage :
#   DOMAIN=samadokita.sn ./scripts/gen-certs.sh          # certificat auto-signé (bootstrap)
#   EMAIL=admin@samadokita.sn ./scripts/gen-certs.sh --letsencrypt   # Let's Encrypt (certbot)
#
# Les fichiers sont écrits dans ./nginx/certs/ (fullchain.pem + privkey.pem),
# montés dans le conteneur nginx par docker-compose.yml.
set -euo pipefail

DOMAIN="${DOMAIN:-samadokita.sn}"
EMAIL="${EMAIL:-admin@${DOMAIN}}"
CERT_DIR="$(cd "$(dirname "$0")/.." && pwd)/nginx/certs"
mkdir -p "${CERT_DIR}"

if [ "${1:-}" = "--letsencrypt" ]; then
  echo "[certs] Génération Let's Encrypt via certbot ( nécessite certbot installé + port 80 ouvert )"
  certbot certonly --standalone -d "${DOMAIN}" -d "www.${DOMAIN}" --email "${EMAIL}" --agree-tos --non-interactive
  # Symlinks vers les fichiers attendus par nginx
  LIVE="/etc/letsencrypt/live/${DOMAIN}"
  ln -sf "${LIVE}/fullchain.pem" "${CERT_DIR}/fullchain.pem"
  ln -sf "${LIVE}/privkey.pem"    "${CERT_DIR}/privkey.pem"
  echo "[certs] OK → ${CERT_DIR}/fullchain.pem (+ privkey.pem)"
  echo "[certs] Renouvellement : certbot renew (cron). Recharger nginx : docker exec samadokita-nginx nginx -s reload"
else
  echo "[certs] Génération certificat auto-signé pour ${DOMAIN} (bootstrap uniquement)"
  openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
    -keyout "${CERT_DIR}/privkey.pem" \
    -out "${CERT_DIR}/fullchain.pem" \
    -subj "/C=SN/ST=Dakar/L=Dakar/O=SamaDokita/CN=${DOMAIN}" \
    -addext "subjectAltName=DNS:${DOMAIN},DNS:www.${DOMAIN},DNS:localhost"
  echo "[certs] OK → ${CERT_DIR}/fullchain.pem + privkey.pem (valide 365 jours)"
  echo "[certs] ⚠ En production, remplace par un certificat Let's Encrypt :"
  echo "[certs]   DOMAIN=${DOMAIN} EMAIL=${EMAIL} ./scripts/gen-certs.sh --letsencrypt"
fi
