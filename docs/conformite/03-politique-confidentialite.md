# 03 — Politique de Confidentialité

*Dernière mise à jour : […À COMPLÉTER…]*

SamaDokita accorde une protection maximale aux données à caractère personnel, en
particulier aux **données de santé**, considérées comme **sensibles** par la
**Loi n° 2008-12 du 25 janvier 2008** (art. 8 et 9).

## 1. Responsable du traitement

Le responsable du traitement est […Entité, siège…]. Le **Délégué à la Protection des
Données** est joignable à : **dpo@[domaine]**. Voir [`01-dpo.md`](01-dpo.md).

## 2. Données collectées

| Catégorie | Exemples | Source |
|-----------|----------|--------|
| Identité & contact | nom, prénom, sexe, date de naissance, téléphone, email | personne concernée / représentant légal |
| Données de santé | antécédents, constantes, diagnostics, prescriptions, résultats d'analyses, vaccinations, grossesse, allergies | professionnel de santé |
| Données d'assurance | numéro de police, couverture, tiers payant | personne concernée / assureur |
| Données de connexion | journal d'accès, adresses IP, identifiants | automatique |
| Données de facturation | abonnement, moyens de paiement ( via prestataire ) | personne concernée |

La plateforme applique le principe de **minimisation** : seules les données nécessaires à
la finalité recherchée sont traitées (art. 6, loi 2008-12).

## 3. Finalités et base légale (art. 43)

Conformément à l'**article 43** de la loi, le traitement des données de santé n'est
légitime que dans les cas limitativement énumérés. SamaDokita s'appuie sur :

| Finalité | Base légale (art. 43) |
|----------|----------------------|
| Création et gestion du dossier médical | **8.** soins/administration de soins à la personne concernée, sous surveillance d'un professionnel soumis au secret |
| Télémédecine / téléconsultation | **8.** soins à la personne concernée |
| Rappels de rendez-vous, ordonnances, vaccinations | **8.** soins · **5.** promotion et protection de la santé publique |
| Facturation, tiers payant, assurance | **8.** soins · exécution du contrat |
| Sécurité, audit, prévention des fraudes | **6.** intérêt légitime · obligations légales |
| Recherche médicale ( le cas échéant ) | **1.** **consentement explicite et préalable** de la personne |

> **Le consentement n'est pas la base légale des soins** : il s'agit de l'exécution des
> soins (art. 43.8) et de la santé publique (art. 43.5). Le **consentement explicite**
> n'est requis que pour la **recherche** (art. 20.1) et pour certains traitements
> optionnels ( communications marketing, partage de données ). C'est un point de rigueur
> exigé par la CDP.

## 4. Destinataires des données

| Destinataire | Condition d'accès |
|--------------|-------------------|
| Le patient lui-même | accès à son propre dossier |
| Professionnel de santé traitant | **secret professionnel**, sur acte de soins |
| Personnel administratif ( établissement ) | rôle limité, cloisonné |
| Assureur / tiers payant | strictement la partie facturation |
| Sous-traitant ( hébergeur, SMTP, paiement ) | contrat écrit, données minimales |

Aucune donnée de santé n'est cédée à des fins commerciales.

## 5. Durées de conservation

| Donnée | Durée |
|--------|-------|
| Dossier médical | durée légale de conservation ( […À CONFORMER aux textes Ministère de la Santé…] ) |
| Données de compte | durée de la relation + durée légale |
| Journal d'audit / accès | […À DÉFINIR — ex. 5 ans…] |
| Données de facturation | durée légale comptable/fiscale |

## 6. Transferts hors Sénégal

Les données peuvent être hébergées dans l'Union européenne ( région Frankfurt ). Tout
transfert hors Sénégal est **encadré contractuellement** et fait l'objet d'une évaluation
d'adéquation. Voir `07-securite-confidentialite.md` §transferts.

## 7. Sécurité

Mesures principales ( détail dans [`07`](07-securite-confidentialite.md) ) :
- chiffrement en transit ( TLS ) ;
- chiffrement au repos des données sensibles ;
- authentification forte ( **2FA TOTP** ) et mots de passe hachés ( **bcrypt** ) ;
- **cloisonnement des accès par 7 rôles** ( RBAC ) et secret médical ;
- **journal d'audit** de tout accès à un dossier ;
- limitation des tentatives de connexion ( rate limiting ).

## 8. Vos droits

Vous disposez, selon la loi, des droits suivants ( art. 26 à 32 ). Exercez-les gratuitement
auprès du DPO : **dpo@[domaine]**

- **Droit d'accès** : obtenir une copie de vos données ;
- **Droit de rectification** : corriger des données inexactes ;
- **Droit d'opposition** et, le cas échéant, de **limitation** ;
- **Droit à la portabilité**, dans la mesure techniquement possible ;
- **Directives** relatives au sort de vos données après votre décès.

> **Limitation du droit d'accès au dossier** : l'accès à un dossier médical est encadré par
> le **secret médical** ( [`09-secret-medical.md`](09-secret-medical.md) ). Votre demande
> est satisfaite dans le respect de la loi et de la sécurité des soins.

## 9. Réclamation

En cas de désaccord, vous pouvez saisir la **Commission de Protection des Données à
Caractère Personnel ( CDP )** — cdp.sn — autorité indépendante chargée du contrôle.

---

*À publier sur : `https://[domaine]/confidentialite`*
