# 08 — Procédure de Notification des Violations de Données

*Base : notification à l'autorité de contrôle et, le cas échéant, aux personnes concernées.
Le délai usuel en droit moderne est de **72 heures**. À confirmer auprès de la **CDP**
( cdp.sn ) pour la procédure exacte applicable au Sénégal — la loi 2008-12 encadre le
devoir de sécurité ( art. 28 ) et le rôle de sanction de la CDP.*

## 1. Définition d'une « violation »

Tout incident entraînant, par erreur ou de manière illicite :
- une **destruction**, une **perte**, une **altération** ou une **divulgation non autorisée**
  de données à caractère personnel ;
- un **accès non autorisé** aux données ( ex. fuite de base, accès compromis, vol de
  poste de travail, ransomware ).

Les données de santé étant **sensibles**, toute violation est **majeure** par nature.

## 2. Chaîne de traitement de l'incident

```
Détection ──► Qualification ──► Confinement ──► Notification ──► Remédiation
   │              │                  │               │               │
   │         Niveau de risque    Stopper la      CDP + (         Lessons
   │         pour les personnes  fuite            personnes )     learned
```

### Étape 1 — Détection & déclaration interne
Tout collaborateur constatant un incident le signale **immédiatement** au DPO
( dpo@[domaine] ) et à la direction technique. Signalement via :
- alertes **Sentry** ( erreurs, anomalies ) ;
- **`/health`** ( dégradation DB / Redis / stockage ) ;
- journal d'audit & `LoginAttempt` ( accès anormaux ) ;
- rapport humain.

### Étape 2 — Qualification ( DPO + technique )
Le DPO qualifie : **données concernées** ( identifiantes ? de santé ? ), **nombre de
personnes**, **risque résultant** ( matériel, moral, pour la santé ).

### Étape 3 — Confinement technique
- révocation des accès compromis ( **rotation des secrets JWT**, réinitialisation 2FA ) ;
- blocage de l'origine ( rate limiting, IP ) ;
- sauvegarde des preuves ( journaux ) ;
- si ransomware / corruption : bascule sur la **dernière sauvegarde saine**
  ( [`scripts/restore.sh`](../../scripts/restore.sh) ).

### Étape 4 — Notification
| Destinataire | Délai | Quand |
|--------------|-------|-------|
| **CDP** | **≤ 72 h** après constat | toute violation susceptible d'engendrer un **risque** pour les personnes |
| **Personnes concernées** | **sans délai injustifié** | si risque **élevé** pour leurs droits et libertés |
| Direction / établissements | immédiat | toujours |

**Contenu de la notification à la CDP** :
1. nature de la violation ( catégories et nombre approximatif de personnes et d'enregistrements ) ;
2. nom et coordonnées du **DPO** ( point de contact ) ;
3. description des **conséquences probables** ;
4. description des **mesures prises ou proposées** ( confinement, remédiation, mitigation ).

### Étape 5 — Remédiation & leçons
Analyse racine, corrections, mise à jour du registre ( [`05`](05-registre-traitements.md) ),
revue des mesures ( [`07`](07-securite-confidentialite.md) ).

## 3. Fiche de notification ( modèle )

| Champ | Valeur |
|-------|--------|
| Date / heure de constat | [……] |
| Déclarant | [……] |
| Description de l'incident | [……] |
| Données concernées ( type, volume ) | [……] |
| Nombre approximatif de personnes | [……] |
| Risque pour les personnes | […matériel / moral / santé…] |
| Mesures de confinement | [……] |
| Décision de notification CDP | [oui / non — motif] |
| Date de notification CDP | [……] |
| Date d'information des personnes | [……] |
| Suivi / remédiation | [……] |

## 4. Contacts d'urgence

| Rôle | Contact |
|------|---------|
| DPO | dpo@[domaine] · […tél…] |
| Direction technique | [……] |
| Hébergeur ( support / urgence ) | [……] |
| CDP | [cdp.sn](https://cdp.sn) |
