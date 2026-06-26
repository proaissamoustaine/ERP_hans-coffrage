// Sélecteurs purs pour le Dashboard — Task 9

export type AffaireLite = {
  statut?: string | null;
  total_ht?: number | null;
  date_livraison?: string | null;
};

/**
 * Retourne les `limit` affaires triées par date_livraison ascendant.
 * Les valeurs nulles/vides sont placées en dernier.
 * Ne mute pas le tableau d'entrée.
 */
export function affairesPrioritaires<T extends AffaireLite>(
  affaires: T[],
  limit = 5,
): T[] {
  return [...affaires]
    .sort((a, b) => {
      const da = a.date_livraison;
      const db = b.date_livraison;
      const aEmpty = !da;
      const bEmpty = !db;
      if (aEmpty && bEmpty) return 0;
      if (aEmpty) return 1;
      if (bEmpty) return -1;
      return da < db ? -1 : da > db ? 1 : 0;
    })
    .slice(0, limit);
}

/**
 * Compte le nombre d'affaires avec statut === 'En cours'.
 */
export function countAffairesEnCours(affaires: AffaireLite[]): number {
  return affaires.filter((a) => a.statut === 'En cours').length;
}

/**
 * Somme les total_ht des affaires 'En cours' (ignore les valeurs null).
 */
export function caEnCours(affaires: AffaireLite[]): number {
  return affaires
    .filter((a) => a.statut === 'En cours')
    .reduce((acc, a) => acc + (a.total_ht ?? 0), 0);
}

/**
 * Formate un montant en « k€ » à 1 décimale.
 * Ex : 197600 → '197.6 k€'
 */
export function formatK(montant: number): string {
  return `${(montant / 1000).toFixed(1)} k€`;
}

/**
 * Calcule le numéro de semaine ISO-8601 (1–53).
 */
export function isoWeek(date: Date): number {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = (d.getUTCDay() + 6) % 7; // lundi = 0
  d.setUTCDate(d.getUTCDate() - dayNum + 3); // jeudi de la semaine
  const firstThursday = new Date(Date.UTC(d.getUTCFullYear(), 0, 4));
  const firstDayNum = (firstThursday.getUTCDay() + 6) % 7;
  firstThursday.setUTCDate(firstThursday.getUTCDate() - firstDayNum + 3);
  return 1 + Math.round((d.getTime() - firstThursday.getTime()) / (7 * 24 * 3600 * 1000));
}
