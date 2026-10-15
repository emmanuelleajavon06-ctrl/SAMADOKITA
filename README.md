# SamaDokita V3 — Dossier Médical National du Sénégal

> **Votre santé, partout avec vous**
> Plateforme SaaS Santé Numérique Souveraine — Ministère de la Santé du Sénégal

## Démarrage production

```bash
cp .env.example .env
# Renseigner les secrets JWT et les clés paiement dans .env
docker compose up --build -d
```

- Frontend : http://localhost:3000
- API Docs : http://localhost:3001/api/docs

## Architecture

```
frontend/          Next.js 15 App Router, TS strict, Tailwind, Framer Motion, Lenis
backend/           NestJS 10, Prisma 5, PostgreSQL 16, Redis 7, BullMQ
prisma/schema.prisma  Tous les models + @index sur FK + AuditLog + LoginAttempt
docker-compose.yml  postgres, redis, minio, backend, frontend, nginx
k6/load-test.js    Test charge 1200 RPS pour 800K utilisateurs
```

## Modules (16)

| # | Module | Route |
|---|--------|-------|
| 1 | Auth + 2FA TOTP | `/auth/*` |
| 2 | Patients (DMP) | `/patients` |
| 3 | Médecins | `/doctors` |
| 4 | Rendez-vous + téléconsultation Jitsi | `/appointments` |
| 5 | Téléconsultation WebRTC | `/teleconsultation` |
| 6 | Ordonnances + QR + PDF S3 | `/prescriptions` |
| 7 | Pharmacies (scan QR) | `/pharmacies` |
| 8 | Laboratoires | `/laboratories` |
| 9 | Assurance santé | `/insurance` |
| 10 | Vaccination (carnet) | `/vaccination` |
| 11 | Grossesse (timeline) | `/pregnancy` |
| 12 | Urgences SOS (rayon 5km) | `/emergency` |
| 13 | Notifications SSE | `/notifications` |
| 14 | Tableau de bord + statistiques | `/dashboard` |
| 15 | Assistant IA (stream) | `/ai/chat` |
| 16 | Recherche globale Cmd+K | `/search` |

## Modèle économique

| Plan | Prix | Utilisateurs | Patients |
|------|------|--------------|----------|
| STARTER | 20 000 FCFA/mois | 5 | 500 |
| PROFESSIONAL | 35 000 FCFA/mois | 20 | 5 000 |
| ENTERPRISE | 75 000 FCFA/mois | Illimité | Illimité |

**Paiements** : Wave, Orange Money, Free Money, Carte Bancaire
**Webhooks** : `/api/billing/webhook/:provider` (signature HMAC + idempotency)

## Sécurité

- JWT Access 15min + Refresh 7j avec rotation (Redis blacklist)
- RBAC : SUPER_ADMIN, ADMIN_INFRA, MEDECIN, PHARMACIEN, LABORANTIN, ASSURANCE, PATIENT
- ABAC + `@Roles()` + `SubscriptionGuard` (bloque si `SUSPENDED`)
- 2FA TOTP (Google Authenticator)
- Bcrypt 12, Rate Limit 100 req/min global + 10 req/s auth
- AuditLog inviolable sur chaque POST/PUT/DELETE
- LoginAttempt anti brute-force (5 échecs = lock 15min)
- Helmet, CORS strict, ValidationPipe whitelist

## Performance 800K utilisateurs

- Prisma `@index` sur tous les FK + createdAt, curseur pagination
- Cache Redis 60s sur tous les GET
- BullMQ : 3 workers (notification, pdf, billing)
- Frontend : TanStack Query staleTime 5min, react-virtuoso listes
- Rate limit ThrottlerModule
- Lazy components + dynamic import
- Lazy loading images Next/Image

## Test de charge

```bash
k6 run k6/load-test.js
# Objectif : 1200 RPS, p95 < 500ms
```

## Déploiement production

Le workflow GitHub Actions (`.github/workflows/ci.yml`) :
1. Lance les tests backend (build + migration)
2. Build le frontend
3. Déploie via SSH sur le serveur cible
4. `docker compose up --build -d`

## Licence

Propriétaire — SamaDokita / Ministère de la Santé du Sénégal
