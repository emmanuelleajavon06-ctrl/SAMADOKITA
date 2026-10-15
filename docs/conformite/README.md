# Dossier de Conformité — SamaDokita

Plateforme de santé numérique — République du Sénégal.

> **Avertissement** : ce dossier est un modèle opérationnel rédigé sur la base de la
> **Loi n° 2008-12 du 25 janvier 2008** relative à la protection des données à caractère
> personnel et de son **Décret n° 2008-721 du 30 juin 2008**. Il doit être relu et validé
> par un conseil juridique et, pour la partie autorisation, déposé auprès de la
> **Commission de Protection des Données à Caractère Personnel (CDP)** — cdp.sn.
> Les champs `[…À COMPLÉTER…]` sont à personnaliser avant dépôt ou mise en ligne.

## Textes de référence

| Texte | Portée |
|-------|--------|
| **Loi n° 2008-12** du 25/01/2008 | Protection des données à caractère personnel |
| **Décret n° 2008-721** du 30/06/2008 | Modalités d'application de la loi |
| **CDP** (cdp.sn) | Autorité de contrôle indépendante (art. 5) |
| Code de déontologie médicale | Secret professionnel du médecin |
| Textes Ministère de la Santé | Télémédecine, dossier médical, HGR (…À VÉRIFIER) |

## Le régime applicable aux données de santé

Les données traitées par SamaDokita sont, au sens de l'**article 8** (données sensibles)
et de l'**article 9** (données dans le domaine de la santé), des **données de santé**.
Conséquences :

1. **Autorisation préalable obligatoire** de la CDP avant tout traitement
   (**art. 20**, al. 1 et 4) — ce n'est pas une simple déclaration.
2. **Base légale** du traitement : l'**article 43** encadre strictement la légitimité
   (soins, santé publique, consentement, recherche…). Voir `03-politique-confidentialite.md`.
3. **Collecte** auprès de la personne concernée (**art. 44**).
4. **Interdiction générale** de collecter l'état de santé, sauf les exceptions légales
   (**art. 40**).

## Documents du dossier

| # | Document | Objet |
|---|----------|-------|
| 01 | [`01-dpo.md`](01-dpo.md) | Délégué à la Protection des Données — nomination & contact |
| 02 | [`02-mentions-legales.md`](02-mentions-legales.md) | Mentions légales du site / éditeur / hébergeur |
| 03 | [`03-politique-confidentialite.md`](03-politique-confidentialite.md) | Politique de confidentialité (droits des personnes, base légale) |
| 04 | [`04-conditions-generales-utilisation.md`](04-conditions-generales-utilisation.md) | CGU / CGV de la plateforme |
| 05 | [`05-registre-traitements.md`](05-registre-traitements.md) | Registre des traitements (obligation interne, décret 2008-721) |
| 06 | [`06-demande-autorisation-cdp.md`](06-demande-autorisation-cdp.md) | Pièce de dépôt CDP (demande d'autorisation) |
| 07 | [`07-securite-confidentialite.md`](07-securite-confidentialite.md) | Mesures techniques & organisationnelles (art. 28+) |
| 08 | [`08-incident-donnees.md`](08-incident-donnees.md) | Procédure de notification des violations (72 h) |
| 09 | [`09-secret-medical.md`](09-secret-medical.md) | Secret médical & accès au dossier patient |
| 10 | [`10-consentement-patient.md`](10-consentement-patient.md) | Information & consentement du patient |

## Synthèse des obligations à date de mise en production

- [ ] DPO désigné, nommé et ses coordonnées publiées (art. 24, 31) → `01`
- [ ] Mentions légales accessibles depuis le site → `02`
- [ ] Politique de confidentialité accessible + recueil du consentement à l'inscription → `03`
- [ ] CGU acceptées à l'inscription (case à cocher non pré-cochée) → `04`
- [ ] Registre des traitements tenu à jour en interne → `05`
- [ ] **Demande d'autorisation déposée à la CDP** et récépissé obtenu avant ouverture au public → `06`
- [ ] Mesures de sécurité documentées et implémentées → `07` (largement couvert par le code)
- [ ] Procédure d'incident opérationnelle (interne + notification CDP < 72 h) → `08`
- [ ] Secret médical : cloisonnement des accès par rôle (RBAC 7 rôles) → `09`
- [ ] Information & consentement patient à l'entrée en soins → `10`
