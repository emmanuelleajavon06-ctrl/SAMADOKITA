# 10 — Information et Consentement du Patient

*Base : **art. 44** de la Loi n° 2008-12 — au plus tard **lors de la collecte**, le
responsable informe la personne concernée de son identité, des finalités, des destinataires,
de la durée et de ses droits.*

## 1. Information à la collecte ( art. 44 )

Dès la **création du dossier patient**, la personne est informée, quel que le support :

| Information | Contenu |
|-------------|---------|
| **Responsable** | identité et coordonnées de l'entité et du **DPO** ( dpo@[domaine] ) |
| **Finalités** | gestion du dossier, soins, rendez-vous, télémédecine, facturation, rappels |
| **Base légale** | **exécution des soins** ( art. 43.8 ) et **santé publique** ( art. 43.5 ) |
| **Destinataires** | professionnel de santé ( secret médical ), personnel administratif cloisonné, assureur ( facturation ), sous-traitants |
| **Conservation** | durée légale du dossier médical |
| **Droits** | accès, rectification, opposition, directives post-mortem ( [`03`](03-politique-confidentialite.md) ) |
| **Réclamation** | saisine de la **CDP** ( cdp.sn ) |

Ce formalisme est décliné dans la [`politique de confidentialité`](03-politique-confidentialite.md)
et les [`CGU`](04-conditions-generales-utilisation.md).

## 2. Consentement — quand est-il requis ?

**Précision juridique essentielle** : pour les **soins**, la base légale est
l'**exécution des soins** ( art. 43.8 ), **pas** le consentement. Le consentement explicite
et préalable n'est exigé que dans les cas suivants :

| Situation | Consentement | Fondement |
|-----------|--------------|-----------|
| Dossier de soins courant, téléméconsultation | Information, **pas de consentement spécifique** | art. 43.8 |
| **Recherche médicale** utilisant les données | **Explicite et préalable** | art. 20.1 · 43.1 |
| Partage des données avec un tiers non soignant ( hors obligation ) | **Explicite** | art. 43.1 |
| Communications à visée **commerciale / marketing** | **Explicite** ( et **opposable** à tout moment ) | art. 43.1 |
| Utilisation à des fins **statistiques non identifiantes** | Information | intérêt légitime |

> Ne jamais pré-cocher une case de consentement. Le consentement doit être **libre,
> éclairé, spécifique et révocable**.

## 3. Recueil du consentement — implémentation

Au moment de l'inscription ou de la création du dossier, des cases **distinctes** et
**non pré-cochées** sont présentées :

| Case | Objet | Obligatoire ? |
|------|-------|---------------|
| ☐ | J'ai lu et accepte les **CGU** | **Oui** ( contractuel ) |
| ☐ | J'ai lu la **politique de confidentialité** | **Oui** ( information art. 44 ) |
| ☐ | J'accepte d'être **contacté(e)** par email / SMS pour les **rappels de soins** | Oui ( service de soin ) |
| ☐ | J'accepte une éventuelle utilisation de mes données à des fins de **recherche médicale** | **Non — optionnel, explicite** |
| ☐ | J'accepte de recevoir des **informations commerciales** | **Non — optionnel, explicite** |

L'horodatage, la version des CGU acceptée et la nature des acceptations sont **journalisés**
et rattachés au compte ( preuve de consentement ).

## 4. Rétractation

Tout consentement optionnel est **révocable à tout moment**, gratuitement, depuis les
réglages du compte ou par une simple demande au **DPO**. La rétractation n'a pas d'effet
rétroactif sur les traitements déjà réalisés.

## 5. Patients mineurs ou représentés

Pour un **mineur** ou une personne **juridiquement représentée**, l'information et le
consentement sont assurés par le **représentant légal**, dans le respect du cadre des soins
( […à conformer aux textes du Ministère de la Santé…] ). La notion de **secret** à l'égard
du mineur est appréciée selon son âge et sa maturité.

## 6. Téléméconsultation — points spécifiques

Avant la téléconsultation, le patient est informé et accepte :
- la **télémédecine** comme mode de consultation et ses limites ;
- l'**identité** du praticien et la traçabilité de l'acte ;
- le cadre du **secret** appliqué à la consultation à distance.

## 7. Preuve

La preuve de l'information et, le cas échéant, du consentement est conservée et
communicable à la **CDP** sur demande.
