# 07 — Mesures de Sécurité et de Confidentialité

*Base légale : **art. 28** de la Loi n° 2008-12 — le responsable doit mettre en œuvre des
**mesures techniques et organisationnelles appropriées** garantissant un niveau de sécurité
adapté au risque. C'est la pièce maîtresse du dossier CDP.*

Ce document est **largement implémenté par le code** de la plateforme ; il en dresse le
constat formel.

## 1. Mesures techniques implémentées dans le code

| Domaine | Mesure | Implémentation |
|---------|--------|----------------|
| **Authentification** | Mots de passe hachés **bcrypt ( coût 12 )** | `auth` module |
| **Authentification forte** | **2FA TOTP** ( Google Authenticator compatible ) | `TotpService`, `enable2fa` |
| **Sessions** | **JWT 15 min** ( access ) + **7 j** ( refresh ), **rotation** des refresh tokens ( Redis ) | `JwtService`, rotation testée e2e |
| **Cloisonnement** | **7 rôles RBAC** + garde d'abonnement | `RolesGuard`, `SubscriptionGuard` |
| **Secret médical** | Accès limité au périmètre du soin, `SUPER_ADMIN` outrepasse | [`09-secret-medical.md`](09-secret-medical.md) |
| **Journal d'audit** | Enregistrement de **tout accès** à un dossier | `AuditInterceptor`, modèle `AuditLog` |
| **Traçabilité connexes** | `LoginAttempt` ( IP, succès/échec ) | modèle `LoginAttempt` |
| **Anti-force brute** | Rate limiting **100 req/min** global, **10 req/min** sur `/api/auth` | `ThrottlerModule` + `nginx` |
| **Transit** | **TLS** forcé, HSTS, en-têtes de sécurité | `nginx`, `helmet` |
| **Validation** | Validation stricte des entrées ( `whitelist`, `forbidNonWhitelisted` ) | `ValidationPipe` global |
| **Secrets** | Générés cryptographiquement, jamais commités | `.env` ( ignoré ), entrypoint |
| **Fuites d'exception** | Filtre global, messages neutralisés en prod | `AllExceptionsFilter` |

## 2. Mesures d'infrastructure

| Domaine | Mesure |
|---------|--------|
| **Base de données** | PostgreSQL 16, **pooling transactionnel ( PgBouncer )**, accès réseau restreint ( 127.0.0.1 / réseau privé ) |
| **Cache & files** | Redis 7 ( refresh tokens, cache 60 s, BullMQ ) |
| **Stockage objet** | S3 compatible ( SeaweedFS / MinIO ), bucket dédié |
| **Sauvegardes** | `pg_dump` **quotidien ( 02h )** + upload S3 + purge — [`scripts/backup.sh`](../../scripts/backup.sh) |
| **Restauration** | Procédure testée — [`scripts/restore.sh`](../../scripts/restore.sh) |
| **Monitoring** | **Sentry** ( erreurs, scrub des en-têtes/tokens ), **`/health`** ( DB, Redis, stockage ) |
| **Isolation** | Services cloisonnés, secrets par variable d'environnement |

## 3. Mesures organisationnelles

- **Désignation d'un DPO** ( [`01`](01-dpo.md) ), interlocuteur unique.
- **Registre des traitements** tenu à jour ( [`05`](05-registre-traitements.md) ).
- **Contrats de sous-traitance** écrits avec tout prestataire ( confidentialité + sécurité ).
- **Principe de minimisation** : seules les données nécessaires sont collectées.
- **Accès au poste de travail** : cloisonnement, verrouillage, gestion des habilitations.
- **Sensibilisation** au secret médical et à la protection des données ( [`09`](09-secret-medical.md) ).
- **Revue périodique** des habilitations et des journaux d'audit.

## 4. Transferts hors Sénégal ( art. 24 et suivants )

L'hébergement peut être localisé dans l'**Union européenne** ( région Frankfurt ). Le
transfert est encadré par :
- un **contrat de sous-traitance** précisant la confidentialité et les mesures de sécurité ;
- une **évaluation** de l'adéquation de la protection offerte ;
- la **minimisation** des données transférées.

> **Vigilance** : un prestataire établi hors du Sénégal peut être soumis à ses lois
> nationales ( ex. **CLOUD Act** pour un prestataire états-unien ), y compris pour des
> données stockées dans l'UE. Pour des données de santé nationales à fort enjeu de
> souveraineté, évaluer un **hébergeur de droit local ou UE** ( ex. Scaleway [ HDS ],
> OVHcloud [ HDS ], ou hébergement certifié par le Ministère de la Santé ). La certification
> **HDS** ( Hébergeur de Données de Santé ) est le référentiel à viser pour ce type de
> données.

## 5. Améliorations continues

- [ ] Hébergeur **certifié HDS** ( ou équivalent souverain ) pour la production santé
- [ ] Chiffrement **au repos** de la base ( TDE / disque chiffré ) si non déjà fourni
- [ ] Tests d'intrusion périodiques
- [ ] Exercice de restauration de sauvegarde documenté ( au moins trimestriel )
- [ ] Revue des habilitations ( semestrielle )
