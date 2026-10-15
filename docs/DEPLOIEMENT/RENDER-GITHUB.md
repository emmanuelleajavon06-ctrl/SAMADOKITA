# Déploiement — GitHub + Render

Guide de mise en production de **SamaDokita V3** sur **Render** ( hébergement ) + **GitHub**
( code + CI/CD ).

> **Différence claire** : le dépôt contient un `docker-compose.yml` ( Postgres, Redis,
> PgBouncer, SeaweedFS, nginx ). **Render ne l'utilise pas** — Render gère chaque service
> **séparément** et fournit Postgres + Redis **managés**. Ce guide explique l'équivalence
> service par service.

---

## 1. Architecture cible sur Render

| Composant ( docker-compose ) | Sur Render | Remarque |
|------------------------------|-----------|----------|
| `backend` ( NestJS ) | **Web Service** ( Dockerfile `backend/` ) | port 3001 |
| `frontend` ( Next.js ) | **Web Service** ( Dockerfile `frontend/` ) | port 3000 |
| `postgres` | **Render Postgres** ( managé ) | backups auto + PITR ( plans payants ) |
| `redis` | **Render Key Value** ( Redis-compatible ) | refresh tokens, cache, BullMQ |
| **`pgbouncer`** | **Inutile** ✅ | Render Postgres fournit déjà une **chaîne « pooled »** — voir §5 |
| **`minio` / SeaweedFS** | **Externalisé** ( R2 / B2 / Scaleway ) | Render n'a pas de S3 managé — voir §6 |
| **`nginx`** | **Inutile** ✅ | Render gère TLS + reverse proxy ; sécurité headers déjà via `helmet` |
| `backup` ( cron ) | **Cron Job** Render ( optionnel ) | ou s'appuyer sur les backups managés |

**Région :** choisir **Frankfurt ( Allemagne, UE )** pour une résidence des données en
Europe — voir la mise en garde de §2.

---

## 2. Choix de l'hébergeur — mise en garde santé/souveraineté

C'est le point le plus sensible du projet, à trancher **avant** tout déploiement.

| Critère | Render | Alternative UE / souveraine |
|---------|--------|------------------------------|
| Siège juridique | **États-Unis** ( Delaware ) — exposition au **CLOUD Act** | UE ( Scaleway, OVHcloud ) — pas de loi extra-territoriale |
| Région des données | Frankfurt ( UE ) disponible | UE, voire France |
| Certification santé | SOC 2 / ISO 27001 / HIPAA ( **plan Scale** ) | **HDS** ( Hébergeur de Données de Santé ) — référentiel santé français, haut standard |
| Prix de départ | bon marché, simple | un peu plus cher, mais souverain |

**Recommandation** pour une **plateforme de santé nationale** :
- **Si l'immédiateté et le coût priment** → Render ( région Frankfurt ), en documentant le
  transfert et le risque dans le dossier CDP ( [`../conformite/07`](../conformite/07-securite-confidentialite.md) ).
- **Si la souveraineté prime** → un **hébergeur certifié HDS** ( Scaleway, OVHcloud ) ou un
  hébergement de droit local. C'est la posture la plus robuste juridiquement.

> Dans les deux cas, un **contrat de sous-traitance** est obligatoire, et la demande
> d'autorisation **CDP** doit mentionner la localisation des données
> ( [`../conformite/06`](../conformite/06-demande-autorisation-cdp.md) ).

---

## 3. Dépôt GitHub

1. Créer un **repo privé** `samadokita`.
2. Pousser le code :
   ```bash
   git init
   git add .
   git commit -m "SamaDokita V3 — init"
   git branch -M main
   git remote add origin https://github.com/<vous>/samadokita.git
   git push -u origin main
   ```
3. **`.gitignore`** : s'assurer que `.env`, `nginx/certs/*.pem`, `node_modules`, `.next`,
   `dist` sont ignorés ( les secrets ne doivent **jamais** être commités ).

> Le déploiement Render peut se faire par **connexion du repo** ( git-push : chaque push sur
> `main` déploie ) ou par **Dockerfile**. Les deux Dockerfiles sont déjà présents.

---

## 4. Services Render à créer

Ordre de création ( les dépendances d'abord ) :

```
1. Render Postgres      ──► 2. Render Key Value      ──► 3. Backend ( Web Service )
                                                            │
4. Stockage objet ( externe )  ◄───────────────────────────┘
                                                            │
                                                            ▼
                                                    5. Frontend ( Web Service )
                                                            │
                                                            ▼
                                                    6. Domaine + TLS
```

### 4.1 Render Postgres
- Type : flexible, **1 CPU / 2 Go** ( ou Basic au démarrage ).
- Région : **Frankfurt**.
- Activer les **backups** ; **PITR** sur plan payant.
- Noter les **deux chaînes** fournies : `External URL` et **`Internal URL` ( pooled )** → §5.

### 4.2 Render Key Value ( Redis )
- **1 Go** minimum ( files BullMQ + cache + refresh tokens ).
- Région : **Frankfurt**, même réseau privé que le backend.

### 4.3 Backend — Web Service
- **Source** : repo GitHub, dossier racine `backend/`, **Dockerfile** `backend/Dockerfile`.
- **Port** : `3001`.
- **Health Check Path** : `/health/live`.
- **Env** : voir §7.
- Le `docker-entrypoint.sh` applique les **migrations Prisma** au démarrage ( via
  `DIRECT_DATABASE_URL` ).

### 4.4 Frontend — Web Service
- **Source** : dossier `frontend/`, **Dockerfile** `frontend/Dockerfile` ( build `standalone` ).
- **Port** : `3000`.
- **Env** : `NEXT_PUBLIC_API_URL` = chemin relatif ( §7 ).

### 4.5 Stockage objet ( MinIO / SeaweedFS remplacés )
Render n'offre **pas** de S3 managé. Solutions :
- **Cloudflare R2** ( S3-compatible, egress gratuit ) — le plus simple ;
- **Backblaze B2** ou **Scaleway Object Storage** ;
- ou un service **SeaweedFS** sur Render avec **disque persistant** ( plus lourd ).

Toutes ces solutions parlent l'API S3 : seule l'variable `MINIO_ENDPOINT` + les clés
changent, **le code ne bouge pas**.

### 4.6 Cron Job ( backups — optionnel )
Si l'on tient à nos `pg_dump` personnalisés en plus des backups managés : créer un
**Cron Job** Render exécutant `scripts/backup.sh`. Sinon, les backups Postgres managés
suffisent.

---

## 5. Pourquoi PAS de PgBouncer sur Render

Render Postgres expose déjà une **chaîne de connexion « pooled »** ( mode transaction ),
conçue pour le multiplexage. Cela remplace notre PgBouncer :
- utiliser l'**Internal URL** fournie par Render ( réseau privé, plus rapide ) ;
- **ne pas** ajouter `pgbouncer=true` dans la chaîne ( règle PgBouncer ≥ 1.21, cf. nos
  notes techniques ) ;
- les **migrations** restent sur la chaîne **directe** ( non pooled ), car le moteur de
  schéma Prisma ne supporte pas le pooling — déjà géré par `DIRECT_DATABASE_URL`.

> En résumé : sur Render, `DATABASE_URL` = chaîne **pooled**, `DIRECT_DATABASE_URL` =
> chaîne **directe**.

---

## 6. Configuration du domaine

1. **Domaine `.sn`** : le `.sn` est géré par l'**ANTS** via des **registrar accrédités**
   ( Sonatel, Orange, Sudy, … ). Réserver le domaine, puis exposer le **DNS**.
2. Dans **Render** → service **Frontend** → **Custom Domains** → ajouter
   `votredomaine.sn` et `www.votredomaine.sn`. Render fournit le **TLS automatique**.
3. Ajouter les **enregistrements DNS** demandés par Render ( `CNAME` ).
4. Dans **Render** → service **Backend** → domaine interne ou sous-domaine
   `api.votredomaine.sn` ( le frontend appelle l'API ).

**Coût du domaine `.sn`** : quelques milliers de FCFA / an selon le registrar.

---

## 7. Variables d'environnement ( Render → Backend )

`docker compose` n'existe pas ici : on renseigne les **Environment** dans Render.
Le `DATABASE_URL` et `DIRECT_DATABASE_URL` proviennent de Render Postgres.

```dotenv
# Base (fournies par Render Postgres)
DATABASE_URL=<Internal URL — pooled — de Render Postgres>
DIRECT_DATABASE_URL=<External URL — directe — de Render Postgres>
DB_HOST=cast-a-day.db.internal
DB_PORT=5432
DB_USER=<user>
DB_NAME=<db>

# Redis (fourni par Render Key Value)
REDIS_URL=<chaîne Redis de Render Key Value>

# Stockage objet (S3 — R2 / B2 / Scaleway / SeaweedFS)
MINIO_ENDPOINT=https://<votre-bucket>.<region>.<fournisseur>
MINIO_ROOT_USER=<access key>
MINIO_ROOT_PASSWORD=<secret key>
MINIO_BUCKET=samadokita

# Sécurité — GÉNÉRER, ne jamais réutiliser un brouillon
JWT_ACCESS_SECRET=<openssl rand -hex 64>
JWT_REFRESH_SECRET=<openssl rand -hex 64>
WEBHOOK_SECRET=<openssl rand -hex 32>

# Application
FRONTEND_URL=https://votredomaine.sn
CORS_ORIGINS=https://votredomaine.sn
NODE_ENV=production

# Frontend : API relatif derrière le proxy Render
NEXT_PUBLIC_API_URL=/api

# Email (SMTP) — requis pour forgot-password + notifications
SMTP_HOST=<smtp.resend.com | smtp.sendgrid.net | …>
SMTP_PORT=587
SMTP_USER=<…>
SMTP_PASS=<…>
MAIL_FROM=SamaDokita <no-reply@votredomaine.sn>

# Monitoring
SENTRY_DSN=<…>
SENTRY_TRACES_SAMPLE_RATE=0.1
```

**Note `NEXT_PUBLIC_API_URL`** : le code appelle l'API via une baseURL relative ( `axios` ).
Derrière le proxy Render, le frontend appelle `/api/...`. Il faut donc que le **backend**
soit exposé **sous le même domaine** que le frontend — sur Render, la solution la plus
propre est un **sous-domaine** `api.` + config CORS, ou un **rewrite**. Voir §8.

---

## 8. Routing frontend → API

Le code utilise une **baseURL relative** ( `axios` ), ce qui impose de servir l'API sous le
même origine que le frontend. Options sur Render :

**Option A — sous-domaine API ( recommandée )**
- Backend : `api.votredomaine.sn` ( domaine custom Render )
- Frontend : `votredomaine.sn`
- `CORS_ORIGINS=https://votredomaine.sn`
- `NEXT_PUBLIC_API_URL=https://api.votredomaine.sn`
- Adapter l'intercepteur axios pour accepter cette URL absolue si la config le permet.

**Option B — un seul domaine + reverse proxy**
Render ne fait pas de reverse proxy multi-service comme notre `nginx`. Un seul domaine avec
`/api` → backend n'est pas nativement supporté. D'où la préférence pour l'**option A**.

---

## 9. CI/CD GitHub Actions

Trois workflows sont **déjà présents** dans le dépôt ( `.github/workflows/` ), validés YAML :

| Fichier | Déclencheur | Rôle |
|---------|-------------|------|
| **`ci.yml`** | push `main`/`develop` + PR | Build backend + frontend, **démarre le serveur**, vérifie `/health/live`, exécute les **tests e2e** ( 12 scénarios ) |
| **`deploy.yml`** | **après CI verte** sur `main` ( ou manuel ) | Déclenche le déploiement **Render** des 2 services via l'**API Render** |
| **`loadtest.yml`** | **manuel** ( workflow_dispatch ) | Test de charge **k6** ( pic ~1200, ≈16 min ) |

### `ci.yml` — validation à chaque push / PR
- **Backend** : services `postgres:16` + `redis:7` éphémères → `npm ci` → `prisma generate`
  → `migrate deploy` → `build` → **démarre `node dist/main`** → attend `/health/live` →
  **`node tests/e2e/run-e2e.mjs`** ( logs dumpés si échec ).
- **Frontend** : `npm ci` → `next build` ( `NEXT_PUBLIC_API_URL=/api` ).
- Secrets de test **internes** au workflow ( JWT/webhook de test ) : aucun secret réel requis.

### `deploy.yml` — déploiement Render
Se déclenche **uniquement si la CI est verte** ( `workflow_run` ) sur `main`, ou à la main.
Appelle l'API Render pour déployer **backend puis frontend**. Si un secret manque, le service
est simplement ignoré ( utile pour n'en déployer qu'un seul ).

**Secrets GitHub requis** ( `Settings → Secrets and variables → Actions` ) :

| Secret | Objet |
|--------|-------|
| `RENDER_API_KEY` | clé API Render ( `Account → API Keys` ) |
| `RENDER_BACKEND_SERVICE_ID` | ID du Web Service backend ( `.../srv-XXXX` ) |
| `RENDER_FRONTEND_SERVICE_ID` | ID du Web Service frontend ( `.../srv-YYYY` ) |
| `TEST_EMAIL` / `TEST_PASSWORD` | compte de test ( pour `loadtest.yml` seulement ) |

> Astuce : l'ID de service Render est le suffixe `srv-…` dans l'URL du dashboard Render.
> Si vous préférez le **git-push natif** de Render ( connecter le repo dans le dashboard ),
> `deploy.yml` devient optionnel — la CI `ci.yml` reste utile comme garde-fou avant merge.

---

## 10. Estimation de coût ( Render, ordre de grandeur )

| Composant | Configuration | Coût / mois |
|-----------|---------------|-------------|
| Workspace | Hobby ( 1 membre ) ou Pro | **$0 – $25** |
| Frontend — Web Service | Standard 2 Go | **$25** |
| Backend — Web Service | Standard 2 Go | **$25** |
| Render Postgres | Basic 256 Mo → 1–2 Go | **$6 – $20** + stockage $0.30/Go |
| Render Key Value | 1 Go | **$10** |
| **Total démarrage** | | **≈ $65 – $105 / mois** |

Le **stockage objet** ( R2/B2 ) est facturé à part ( très peu cher ). Coût du **domaine
`.sn`** : quelques milliers de FCFA / an.

---

## 11. Check-list de mise en production

- [ ] Choix de l'hébergeur **tranché** ( Render vs HDS/souverain ) — §2
- [ ] Repo **GitHub privé** créé, `.gitignore` vérifié ( aucun secret commité )
- [ ] **Secrets GitHub Actions** configurés : `RENDER_API_KEY`, `RENDER_BACKEND_SERVICE_ID`, `RENDER_FRONTEND_SERVICE_ID` → `ci.yml` verte, puis `deploy.yml` OK
- [ ] **Render Postgres** + **Key Value** créés ( région Frankfurt )
- [ ] **Backend** déployé, `/health/live` en **200**
- [ ] **Frontend** déployé
- [ ] **Stockage objet** externe configuré ( bucket + clés S3 )
- [ ] **SMTP** configuré → test `forgot-password` ( email reçu )
- [ ] **Sentry** branché → erreur de test remontée
- [ ] **Domaine `.sn`** acheté, DNS pointé, **TLS** actif
- [ ] **CORS** correct ( `CORS_ORIGINS` + `NEXT_PUBLIC_API_URL` ) — test de login réel
- [ ] Secrets forts générés ( JWT, webhook ) — **jamais** ceux du brouillon
- [ ] **Conformité CDP** déposée avant ouverture au public
      ( [`../conformite/06`](../conformite/06-demande-autorisation-cdp.md) )
- [ ] Sauvegarde / restauration **testées**


---

## 9. Retour d'expérience — déploiement réel du 15 octobre 2026 (plateforme EN LIGNE)

État courant (vérifié de bout en bout) :

| Service | URL / ID | État |
|---------|----------|------|
| Frontend | https://samadokita-frontend.onrender.com (`srv-db82uvaj9qps73behf8g`) | **live** — build Docker, auto-deploy sur push |
| Backend | https://samadokita-backend.onrender.com (`srv-db82uuaj9qps73behbfg`) | **live** — `/health/live` = 200 |
| Postgres | `dpg-db82d19srm7s738f5890-a` (Frankfurt, PG16, free) | disponible — **expire le 2026-11-14** |
| Key Value | `red-db82d1hsrm7s738f59pg` (Redis 8, free) | disponible — via **host interne** |

Parcours validé : `register` → `login` (JWT) → `/auth/me` → dashboard `/dashboard/admin_infra`
→ module **Patients** avec données réelles (table, badges de statut, dates FR) → refresh token
(rotations) → CORS preflight 204 depuis le domaine frontend.

### 9.1 Deux remotes : CI (origin) et Render (deploy)

Render ne voit que les dépôts **détenus** par le compte GitHub lié. `origin` =
`emmanuelkairos1-bit/samadokita` (privé, GitHub Actions) ; `deploy` =
`emmanuelleajavon06-ctrl/SAMADOKITA` (lecture/écriture via **deploy key SSH**).

```powershell
# Clé de déploiement (une fois)
ssh-keygen -t ed25519 -f .\.ssh\samadokita_deploy_key -N '""'   # ou clé fournie
# Ajouter la clé publique : GitHub → SAMADOKITA → Settings → Deploy keys → Allow write access
git remote add deploy git@github.com:emmanuelleajavon06-ctrl/SAMADOKITA.git
# Windows : chemin SSH en slashs / (les backslashes sont interprétés par le shell)
git config core.sshCommand "ssh -i C:/Users/<user>/.ssh/samadokita_deploy_key -o StrictHostKeyChecking=accept-new"

# Chaque livraison : les DEUX remotes
git push origin main    # CI GitHub Actions
git push deploy main    # auto-deploy Render (webhook)
```

### 9.2 Piège n°1 — Render Postgres impose le TLS (pg_isready bloque le démarrage)

Le serveur rejette toute connexion non-SSL (`FATAL` sur startup packet sans TLS) et
**`pg_isready` ne négocie pas le TLS** : la boucle d'attente classique ne finit jamais →
Render affiche « No open ports detected… Port scan timeout » et le deploy échoue en ~6 min.

Corrigé dans `backend/docker-entrypoint.sh` : l'attente se fait sur une **vraie requête
Prisma** (`$queryRaw SELECT 1`) avec repli automatique :

1. cible externe (`DATABASE_URL` telle que configurée, `?sslmode=require`) ;
2. host interne Render (`dpg-…` sans suffixe, réseau privé) ;
3. host interne sans SSL.

Le script exporte ensuite `DATABASE_URL`/`DIRECT_DATABASE_URL` sur la cible qui a
répondu, applique `prisma migrate deploy`, puis démarre l'app. Un diagnostic réseau
(TCP externe/interne, `psql`, `openssl s_client -starttls postgres`) est journalisé au
démarrage pour toute nouvelle incident.

### 9.3 Piège n°2 — Key Value : allowlist IP sur les connexions publiques

Le backend recevait `ReplyError: Client IP address is not in the allowlist.` sur
`rediss://…frankfurt-keyvalue.render.com`. **Render n'expose pas l'allowlist du Key Value
dans l'API des plans gratuits** : la solution est d'utiliser la **connexion interne** :

```
REDIS_URL=redis://red-<id-du-kv>:6379        # host interne, réseau privé Render
```

Les refresh tokens (Redis), le cache et les files BullMQ fonctionnent via cette URL.

### 9.4 Variables d'environnement : l'API ne gère pas les env vars dans le PATCH service

- Lecture : `GET /v1/services/{id}/env-vars` (réponse enveloppée `{envVar:{key,value},cursor}`) ;
- Écriture : `PUT /v1/services/{id}/env-vars` avec la **liste complète** `[{key,value}]`
  (remplacement) ;
- Les changements ne s'appliquent qu'au **prochain deploy** : `POST /v1/services/{id}/deploys`.

Points d'attention des URLs :
- `DATABASE_URL` et `DIRECT_DATABASE_URL` doivent porter `?sslmode=require` (TLS imposé) ;
- `REDIS_URL` = host interne (cf. 9.3) ;
- `NEXT_PUBLIC_API_URL` doit être figé au **build** Docker : `ARG`/`ENV` dans
  `frontend/Dockerfile` (Render n'injecte pas les env vars aux builds Docker).

### 9.5 Piège n°3 — Next standalone écoute sur le hostname du conteneur (502)

Docker définit `HOSTNAME=<id-conteneur>` ; le serveur Next standalone s'y lie au lieu de
`0.0.0.0`, Render contacte `localhost:10000` → **502**. Corrigé dans
`frontend/Dockerfile` :

```dockerfile
CMD ["sh", "-c", "HOSTNAME=0.0.0.0 node server.js"]
```

### 9.6 Santé : les trois endpoints

- `/health/live` : **utilisé par Render** (health check du deploy) — toujours 200 ;
- `/health/ready` : vérifie la base (200 tant que Postgres répond) ;
- `/health` : base + Redis + **stockage** → restera `503` tant qu'aucun S3 (R2/B2) n'est
  branché via `MINIO_ENDPOINT`/`MINIO_ACCESS_KEY`/`MINIO_SECRET_KEY`/`MINIO_BUCKET`.
  C'est voulu : l'endpoint signale l'état dégradé réel.

### 9.7 Frontend : deux leçons de routage

1. `(dashboard)` est un **route group** (aucun segment d'URL) : les pages vives sous
   `/dashboard/…` doivent être placées physiquement dans `app/(dashboard)/dashboard/…`.
   Les pages modules (`/dashboard/[role]/[module]`) sont branchées sur les vraies API
   NestJS (pagination curseur, recherche `?q=`, badges d'enum) — `frontend/lib/modules.ts`.
2. `/auth/me` renvoie `role: "ADMIN_INFRA"` (majuscules) alors que la navigation attend
   `admin_infra` : **normaliser la casse** avant toute comparaison de rôle
   (`app/(dashboard)/layout.tsx`).

### 9.8 Limites du plan gratuit (à traiter avant ouverture publique)

- **Aucun moyen de paiement** sur le compte → HTTP 402 sur tout plan payant. Ajouter une
  carte (Dashboard → Billing) puis passer Postgres/Key Value/services en Starter :
  le Postgres free **expire le 2026-11-14** et les web services free dorment (~50 s de
  réveil, et l'extinction tue les workers en mémoire).
- Shell Render indisponible sur plan gratuit (diagnostics via les logs du deploy).
- SMTP absent : `forgot-password` répond mais **n'envoie rien** — brancher SMTP_* (ou un
  provider transactionnel) avant toute communication réelle.
- Dépôt CDP + validation conseil juridique : dossier `docs/conformite/` (champs
  `[…À COMPLÉTER…]`).

---
*Guide mis à jour après le déploiement réel du 15/10/2026.*
