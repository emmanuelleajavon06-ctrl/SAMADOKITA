# 09 — Secret Médical & Accès au Dossier Patient

*Les données de santé sont protégées par le **secret professionnel**. La plateforme
traduit ce secret en **cloisonnement technique strict** des accès.*

## 1. Principe

Conformément à l'**art. 43.8** de la loi 2008-12, les données de santé sont traitées
**sous la surveillance d'un professionnel des soins de santé soumis au secret
professionnel**. Seul le **périmètre du soin** justifie l'accès.

Règle d'or appliquée par le code : **n'accède au dossier que celui qui en a besoin pour un
acte de soin, et seulement pour la durée de cet acte.**

## 2. Matrice d'accès ( RBAC — 7 rôles )

| Rôle | Dossier patient | Prescriptions | Labo | Pharmacie | Assurance | Admin / facturation |
|------|-----------------|---------------|------|-----------|-----------|---------------------|
| **Patient** | **son dossier seul** | ses ordonnances | ses résultats | — | sa police | sa facturation |
| **Médecin** | dossiers de ses patients | **prescription** | prescrit / consulte | consulte | — | — |
| **Infirmier** | dossiers pris en charge | consulte | consulte | — | — | — |
| **Pharmacien** | — | **délivre** | — | **gestion stock** | — | — |
| **Laborantin** | — | consulte ( exécution ) | **saisie résultats** | — | — | — |
| **Admin établissement** | périmètre administratif | — | — | — | **facturation** | **facturation, abonnement** |
| **Super-admin** | supervision transverse | — | — | — | — | supervision |

- Le **Patient** n'accède **qu'à ses propres données** ( filtrage systématique par
  `patientId` lié à l'utilisateur authentifié ).
- Le **cloisonnement multi-établissements** est porté par l' `infrastructureId` : un
  utilisateur d'un établissement ne voit **jamais** les données d'un autre.
- `SUPER_ADMIN` dispose d'un accès de supervision **tracé et justifié**.

## 3. Garanties techniques du code

| Garantie | Implémentation |
|----------|----------------|
| **Authentification forte** | JWT 15 min + refresh rotatif 7 j ; **2FA TOTP** disponible et recommandé |
| **Mots de passe** | **bcrypt coût 12** — jamais stockés en clair |
| **Filtrage systématique** | Chaque requête est scopée par **établissement** et **patient** |
| **Journal d'audit** | **`AuditInterceptor`** : tout accès à un dossier est enregistré ( acteur, action, cible, horodatage ) |
| **`LoginAttempt`** | Traçabilité des tentatives de connexion ( IP, succès/échec ) |
| **Anti-force brute** | Rate limiting **10 req/min** sur `/api/auth` |
| **Secrets** | JWT / webhook générés et hors du dépôt |

## 4. Obligations des utilisateurs professionnels

1. **Ne jamais partager** son compte ni ses identifiants 2FA.
2. **N'accéder** qu'aux dossiers nécessaires à son acte de soin ( aucune consultation de
   curiosité : passible de sanction disciplinaire et pénale ).
3. **Signaler** immédiatement tout accès ou suspicion d'accès frauduleux au DPO.
4. **Respecter** le cadre de la télémédecine ( […à conformer aux textes du Ministère de la
   Santé…] ).

## 5. Accès post-mortem et à la demande des ayants droit

L'accès au dossier d'un patient décédé ou par ses ayants droit est **encadré par la loi**.
Toute demande est instruite par le **DPO** et, le cas échéant, l'autorité compétente.
Aucun accès n'est accordé sans base légale.

## 6. Sanctions

Le manquement au secret médical engage la responsabilité disciplinaire et pénale de son
auteur, ainsi que la responsabilité de l'établissement. La plateforme coopère avec les
autorités dans le cadre légal.
