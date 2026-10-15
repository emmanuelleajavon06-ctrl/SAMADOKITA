# 06 — Demande d'Autorisation CDP ( données de santé )

## Pourquoi une **autorisation** et pas une simple déclaration ?

L'**article 20** de la Loi n° 2008-12 dispose que certains traitements sont mis en œuvre
**après autorisation de la CDP**, et cite notamment :
- les traitements portant sur la **recherche dans le domaine de la santé** ( art. 20.1 ) ;
- les données relatives à la **santé** ( art. 20.4 ).

SamaDokita traite des **données de santé** ( art. 9 ). Il faut donc obtenir une
**autorisation préalable** de la CDP avant l'ouverture au public. À défaut : risque de
sanction et obligation de cesser le traitement.

> Le régime exact ( autorisation vs. déclaration renforcée ) se confirme auprès de la CDP
> lors du dépôt. Le dossier ci-dessous couvre les deux hypothèses et accélère l'instruction.

## Où déposer ?

- **CDP — Commission de Protection des Données à Caractère Personnel** — [cdp.sn](https://cdp.sn)
- Formulaires : [cdp.sn/conformite/formalites](https://cdp.sn/conformite/formalites)
- Formulaire **« demande d'autorisation »** portant sur des traitements de **données
  sensibles ( santé )**.
- Existence d'un formulaire spécifique **« recherche dans le domaine médical »** si la
  plateforme est utilisée à des fins de recherche.

## Contenu de la demande ( art. 22 de la loi )

### 1. Identité du responsable et du DPO

| Élément | Valeur |
|---------|--------|
| Responsable du traitement | […Entité, RCC, NINEA, adresse…] |
| Représentant légal | […nom…] |
| DPO | dpo@[domaine] ( [`01-dpo.md`](01-dpo.md) ) |

### 2. Finalité(s) du traitement

Plateforme nationale de **dossier médical numérique** et de **gestion des établissements
de santé** : enregistrement des patients, dossiers cliniques, rendez-vous,
télémédecine, prescriptions, laboratoire, pharmacie, assurance, vaccination, suivi de
grossesse, urgences, facturation, notifications. ( Voir [`05-registre-traitements.md`](05-registre-traitements.md) )

### 3. Catégories de personnes concernées et de données

- **Personnes** : patients, praticiens et personnel soignant, personnel administratif,
  partenaires assureurs.
- **Données** : données identifiantes et **données de santé** ( antécédents, constantes,
  diagnostics, prescriptions, résultats d'analyses, vaccination, grossesse, allergies ),
  données d'assurance, journaux d'accès.

### 4. Destinataires

Patients eux-mêmes ; professionnels de santé sous **secret médical** ; personnel
administratif cloisonné ; assureurs ( partie facturation ) ; sous-traitants ( hébergeur,
SMTP, paiement ) liés par contrat.

### 5. Durées de conservation

Voir [`03-politique-confidentialite.md`](03-politique-confidentialite.md) §5. Dossier
médical : durée légale ; journaux d'audit : […5 ans…].

### 6. Mesures de sécurité et garanties ( art. 28 )

Voir [`07-securite-confidentialite.md`](07-securite-confidentialite.md). En résumé :
chiffrement en transit et au repos, **RBAC 7 rôles**, **2FA TOTP**, **bcrypt**,
**journal d'audit** de tout accès, limitation des tentatives, cloisonnement, sauvegardes.

### 7. Transferts hors Sénégal

Hébergement en **région Frankfurt ( UE )** le cas échéant ; encadrement contractuel et
évaluation d'adéquation. ( [`02-mentions-legales.md`](02-mentions-legales.md) )

### 8. Base légale de chaque traitement

Tableau détaillé dans [`05-registre-traitements.md`](05-registre-traitements.md). Point de
rigueur : la base des **soins** est l'**art. 43.8** ( exécution des soins ), **non** le
consentement. Le **consentement explicite** est requis pour la **recherche** ( art. 20.1 ).

## Pièces à joindre

- [ ] Formulaire CDP rempli et signé
- [ ] Registre des traitements ( [`05`](05-registre-traitements.md) )
- [ ] Politique de confidentialité ( [`03`](03-politique-confidentialite.md) )
- [ ] Description des mesures de sécurité ( [`07`](07-securite-confidentialite.md) )
- [ ] Attestation de nomination du DPO ( [`01`](01-dpo.md) )
- [ ] Contrats de sous-traitance ( hébergeur, SMTP, paiement )

## Suivi

La CDP délivre un **accusé de réception** puis, dans un délai d'**un mois** ( prorogeable
une fois de manière motivée ), un **récépissé** permettant la mise en œuvre du traitement
( art. 18 ). Conservez précieusement le récépissé : il constitue la preuve de conformité.

| Date de dépôt | N° de dossier | Récépissé obtenu le | Observations |
|---------------|---------------|---------------------|--------------|
| […À COMPLÉTER…] | [……] | [……] | [……] |
