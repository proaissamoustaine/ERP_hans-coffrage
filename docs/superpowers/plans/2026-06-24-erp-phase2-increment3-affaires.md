# ERP Phase 2 — Increment 3 : Affaires + timeline 11 étapes (plan)

> Subagent-driven + vérif contrôleur (build/lint/test + relecture + preuve navigateur). TDD strict.

**Goal :** Quand un devis est **accepté**, créer l'**affaire** correspondante (MÊME n° racine, sans la lettre de version) et semer ses **11 étapes** (`etapes_affaire`). Page Affaires : liste + détail avec **timeline cochable** + barre d'avancement. Patterns Increment 1/2.

**11 étapes** (`etape_cle` enum, dans cet ordre) : devis_accepte, saisie_pieces, pr_valide, dessin_be, debit, montage, finition, colisage, livraison, facturation, paiement.

---

## Task 1 — `src/lib/etapes.ts` (pur, TDD)
- `ETAPES: { cle: EtapeCle; label: string }[]` (11, ordre ci-dessus ; labels FR : "Devis accepté", "Saisie des pièces", "PR validé", "Dessin BE", "Débit", "Montage", "Finition", "Colisage", "Livraison", "Facturation", "Paiement").
- `initialEtapes(affaireId)` → 11 objets `{ affaire_id, etape, fait: etape==='devis_accepte', date: etape==='devis_accepte' ? <ISO today> : null }` (la 1ʳᵉ étape est faite à la création).
- `calcAvancement(etapes)` → `Math.round(nbFait / 11 * 100)`.
- **Tests** : ETAPES a 11 entrées dans l'ordre ; initialEtapes marque devis_accepte fait et le reste non ; calcAvancement(0 fait)=0, (11 fait)=100, (3 fait)=27.

## Task 2 — données : `useAffaires`, `useEtapes`, `useAccepterDevis`
- `src/modules/affaires/useAffaires.ts` : `fetchAffaires(sb)` = `from('affaires').select('*, clients(nom)').order('created_at',{ascending:false})` (test fetch comme devis) ; `useAffaires()`.
- `src/modules/affaires/useEtapes.ts` : `fetchEtapes(sb, affaireId)` = `from('etapes_affaire').select('*').eq('affaire_id', id)` ; `useEtapes(affaireId)` (enabled si id) ; `useToggleEtape()` (`update({fait, date: fait?nowISO:null}).eq('id', etapeId)`, invalide `['etapes', affaireId]`).
- `src/modules/devis/useAccepterDevis.ts` : mutation sur un devis accepté :
  1. `update devis statut='accepte'`.
  2. `racine = splitNumero(devis.numero).racine`. Vérifier qu'aucune affaire n'a déjà ce `numero` (sinon ne pas recréer). Insérer l'affaire `{ numero: racine, mode, client_id, devis_id, chantier, objet, total_ht, statut:'En cours', avancement:0, date_acceptation: today }`.
  3. Insérer les 11 `etapes_affaire` via `initialEtapes(affaire.id)`.
  4. Invalider `['devis']` + `['affaires']`.
  (mutationFn reçoit le devis complet `{id, numero, mode, client_id, chantier, objet, total_ht}`.)

## Task 3 — UI : `AffairesPage` + intégration DevisPage
- `src/modules/affaires/AffairesPage.tsx` : liste (N° affaire, Client, Chantier, Statut, Avancement [barre %]). Clic sur une ligne → panneau détail : **timeline des 11 étapes** (icône check, label, date) cochables (`useToggleEtape`) + barre d'avancement (calcAvancement). loading/error/empty. Réutilise primitives + thème.
- RTL test : mock `useAffaires` → 1 affaire ; assert n° affiché.
- `src/App.tsx` : route `/affaires` → `ProtectedRoute page="affaires"` → `AffairesPage`.
- `src/modules/devis/DevisPage.tsx` : l'action **Accepter** appelle `useAccepterDevis().mutate(devisComplet)` (au lieu de `updateStatut('accepte')`).

## DoD & vérif (contrôleur)
- test/lint/build verts. Preuve navigateur : créer un devis → Envoyer → **Accepter** → l'affaire apparaît dans /affaires avec le **même n° racine** + timeline 11 étapes (devis_accepte cochée, avancement 9%) ; cocher une étape → avancement monte. Nettoyer les données de test. Push sur accord (déjà donné pour le repo).

## Self-review
- n° affaire = racine du devis (sans version), unique → pas de double création. ✓
- 11 étapes semées à l'acceptation, devis_accepte faite. ✓
- RLS affaires/etapes : admin/direction/chef_prod/bureau_etudes (pas operateur). ✓
