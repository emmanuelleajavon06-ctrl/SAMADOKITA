# 05 — Registre des traitements

*Document interne — obligation de bonne gouvernance, attendu par la CDP
( décret 2008-721 ). Responsable du registre : le DPO ( [`01-dpo.md`](01-dpo.md) ).*

**Responsable du traitement :** […Entité…] · **DPO :** dpo@[domaine]

Le registre recense **tous** les traitements de données mis en œuvre. Chaque traitement est
aligné sur le schéma de données réel de la plateforme ( 16 modules santé ).

---

## A. Traitements liés au compte et à l'infrastructure

| # | Traitement | Finalité | Données | Base légale (art.43) | Durée | Accès (rôles) |
|---|-----------|----------|---------|----------------------|-------|---------------|
| A1 | Inscription / authentification | Créer le compte, sécuriser l'accès | identité, email, tél., mot de passe (bcrypt), 2FA TOTP, IP | exécution du contrat · obligation de sécurité | durée relation | système |
| A2 | Gestion d'établissement ( infrastructure ) | Structurer les établissements, essai 30 j | nom établissement, type, ville, statut abonnement | exécution du contrat | durée relation | ADMIN_INFRA, SUPER_ADMIN |
| A3 | Journal d'audit & tentatives de connexion | Sécurité, traçabilité, prévention fraude | horodatage, acteur, action, IP, résultat | intérêt légitime (art.43.6) · obligation légale | […5 ans…] | SUPER_ADMIN, ADMIN_INFRA |
| A4 | Notifications ( in-app, email ) | Rappels et alertes opérationnelles | destinataire, titre, message | soins (art.43.8) | durée relation | destinataire |

## B. Traitements cliniques ( données de santé — **autorisation CDP exigée** )

| # | Traitement | Finalité | Données | Base légale | Accès (rôles) |
|---|-----------|----------|---------|-------------|---------------|
| B1 | **Dossier patient** | Enregistrement & historique médical | identité, sexe, naissance, groupe, allergies, antécédents, contact | **soins** (43.8) | PATIENT, médecin, infirmier, ADMIN_INFRA |
| B2 | **Consultations & rendez-vous** | Planification et suivi des actes | motif, praticien, créneau, statut | soins (43.8) | patient, praticien concerné |
| B3 | **Téléméconsultation** | Acte de soin à distance | consultation + flux vidéo | soins (43.8) | patient + praticien |
| B4 | **Prescriptions** | Ordonnances et suivi | molécules, posologie, délivrance | soins (43.8) | médecin, pharmacien, patient |
| B5 | **Laboratoire** | Prescriptions et résultats d'analyses | examens, valeurs, interprétation | soins (43.8) | médecin, laborantin, patient |
| B6 | **Pharmacie** | Dispensation, stock | délivrances, lot, stock | soins (43.8) | pharmacien, médecin |
| B7 | **Vaccination** | Carnet et rappels | vaccins, dates, rappels | **santé publique** (43.5) · soins (43.8) | patient, médecin, infirmier |
| B8 | **Suivi de grossesse** | Consultations prénatales | constantes, grossesse, accouchement | soins (43.8) | patient, sage-femme, médecin |
| B9 | **Urgences** | Priorisation et prise en charge | motif urgence, constantes, tri | **intérêts vitaux** (43.3) · soins (43.8) | urgentiste, infirmier |

## C. Traitements administratifs et financiers

| # | Traitement | Finalité | Données | Base légale |
|---|-----------|----------|---------|-------------|
| C1 | **Assurance / tiers payant** | Couverture et remboursement | police, couverture, sinistres | soins (43.8) · exécution contrat |
| C2 | **Abonnements** | Facturation des établissements | plan, statut, période essai, historique | exécution du contrat · obligation légale |
| C3 | **Paiements** ( Wave, Orange Money, Free Money, carte ) | Règlement | référence transaction, montant, prestataire | exécution du contrat · obligation légale |

## D. Traitements transverses

| # | Traitement | Finalité | Base légale |
|---|-----------|----------|-------------|
| D1 | **Recherche globale** | Recherche multi-entités | soins · intérêt légitime ( cloisonné par rôle ) |
| D2 | **Tableau de bord / statistiques** | Pilotage de l'établissement | intérêt légitime ( agrégé, anonymisé autant que possible ) |
| D3 | **Assistant IA ( le cas échéant )** | Appui à la décision | soins — **sous supervision du professionnel** ; sans usage à des fins autonomes |
| D4 | **Stockage objet** ( pièces jointes, PDF ) | Archivage de documents | même base que le traitement d'origine |

---

## Mesures de sécurité communes à tous les traitements

Voir [`07-securite-confidentialite.md`](07-securite-confidentialite.md). Résumé : chiffrement
en transit, chiffrement au repos, RBAC 7 rôles, 2FA, bcrypt, audit, rate limiting, cloisonnement.

## Transferts hors Sénégal

| Sous-traitant | Localisation des données | Encadrement |
|---------------|--------------------------|-------------|
| Hébergeur ( [`02-mentions-legales.md`](02-mentions-legales.md) ) | […Frankfurt, UE…] | contrat de sous-traitance + évaluation |
| Fournisseur email ( SMTP ) | […À COMPLÉTER…] | contrat |
| Prestataire de paiement | […Sénégal…] | contrat |

## Historique des versions du registre

| Date | Version | Auteur | Modification |
|------|---------|--------|--------------|
| […À COMPLÉTER…] | 1.0 | DPO | Création du registre |

> **À tenir à jour** à chaque nouveau traitement, chaque changement de finalité ou de
> sous-traitant.
