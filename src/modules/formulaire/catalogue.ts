// Fonctions pures pour la cascade de filtrage du catalogue matières.
// Aucune dépendance vers Supabase ou React — testable à l'unité sans mock.

export type MatiereLite = {
  cat: string;
  famille?: string | null;
  ref?: string | null;
  code: string;
};

/** Retourne les catégories distinctes, triées par ordre alphabétique. */
export function categories(items: MatiereLite[]): string[] {
  return [...new Set(items.map((i) => i.cat))].sort();
}

/** Retourne les familles distinctes (non nulles/vides) d'une catégorie, triées. */
export function famillesFor(items: MatiereLite[], cat: string): string[] {
  return [
    ...new Set(
      items
        .filter((i) => i.cat === cat && i.famille != null && i.famille !== '')
        .map((i) => i.famille as string),
    ),
  ].sort();
}

/**
 * Retourne les matières d'une catégorie + famille, triées par ref puis code.
 * Générique : préserve le type complet T (ex. Tables<'catalogue_matieres'>).
 */
export function matieresFor<T extends MatiereLite>(
  items: T[],
  cat: string,
  famille: string,
): T[] {
  return items
    .filter((i) => i.cat === cat && i.famille === famille)
    .sort((a, b) => {
      const refCmp = (a.ref ?? '').localeCompare(b.ref ?? '');
      return refCmp !== 0 ? refCmp : a.code.localeCompare(b.code);
    });
}

/**
 * Calcule le total d'une ligne de pièce.
 *
 * - Main_Oeuvre : prix × nb  (pas de coefficient chute)
 * - Matière     : prix × nb × coef  avec coef = 1 / (1 - pourcent_chute / 100)
 *                 Si pourcent_chute >= 100 → coef = 1 (garde-fou division par zéro)
 *
 * Valeurs nulles/undefined sont traitées comme 0.
 */
export function pieceTotal(p: {
  type: string;
  prix?: number | null;
  nb?: number | null;
  pourcent_chute?: number | null;
}): number {
  const prix = p.prix ?? 0;
  const nb = p.nb ?? 0;
  const chute = p.pourcent_chute ?? 0;

  if (p.type === 'Main_Oeuvre') {
    return prix * nb;
  }

  const coef = chute >= 100 ? 1 : 1 / (1 - chute / 100);
  return prix * nb * coef;
}
