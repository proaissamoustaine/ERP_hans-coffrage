export type Dim = { longueur: number | null; largeur: number | null; hauteur: number | null; poids: number | null };
export type Encombrement = { long_ml: number; larg_ml: number; haut_ml: number; poids_t: number };

const round2 = (n: number) => Math.round(n * 100) / 100;
const round3 = (n: number) => Math.round(n * 1000) / 1000;

/** Prochaine référence `PREFIX-ANNEE-NNN` (compteur max de l'année + 1, padding 3). */
export function nextReference(prefix: 'LIV' | 'CT', refs: string[], annee: number): string {
  const re = new RegExp(`^${prefix}-${annee}-(\\d+)$`);
  const max = refs.reduce((m, r) => {
    const match = re.exec(r);
    return match ? Math.max(m, parseInt(match[1], 10)) : m;
  }, 0);
  return `${prefix}-${annee}-${String(max + 1).padStart(3, '0')}`;
}

export function totalPoidsKg(rows: { poids: number | null }[]): number {
  return rows.reduce((s, c) => s + (c.poids ?? 0), 0);
}

export function poidsTonnes(kg: number): number {
  return round3(kg / 1000);
}

/** Colis en cm/kg → encombrement en m linéaires / tonnes. */
export function encombrement(colis: Dim[]): Encombrement {
  if (colis.length === 0) return { long_ml: 0, larg_ml: 0, haut_ml: 0, poids_t: 0 };
  const maxCm = (k: keyof Dim) => Math.max(...colis.map((c) => (c[k] ?? 0) as number));
  return {
    long_ml: round2(maxCm('longueur') / 100),
    larg_ml: round2(maxCm('largeur') / 100),
    haut_ml: round2(maxCm('hauteur') / 100),
    poids_t: poidsTonnes(totalPoidsKg(colis)),
  };
}

const LIV_LABELS: Record<string, string> = {
  en_preparation: 'En préparation',
  expedie: 'Expédié',
  livre: 'Livré',
};
export function statutLivraisonLabel(statut: string): string {
  return LIV_LABELS[statut] ?? statut;
}

const CMD_LABELS: Record<string, string> = { brouillon: 'Brouillon', envoyee: 'Envoyée' };
export function statutCommandeLabel(statut: string): string {
  return CMD_LABELS[statut] ?? statut;
}

export type MailtoCommandeArgs = {
  reference: string;
  affaireNumero: string;
  destinataire: string;
  adresse: string;
  dateEnlevement: string | null;
  dateLivraison: string | null;
  cout: number | null;
  encombrement: Encombrement;
  colis: { numero: number | null; poids: number | null }[];
};

export function mailtoCommande(a: MailtoCommandeArgs): string {
  const e = a.encombrement;
  const lignesColis = a.colis
    .map((c) => `  - Colis n° ${c.numero ?? '?'} : ${c.poids ?? 0} kg`)
    .join('\n');
  const body = [
    `Bonjour,`,
    ``,
    `Merci de prévoir un enlèvement pour la commande ${a.reference}.`,
    ``,
    `Affaire : ${a.affaireNumero}`,
    `Destinataire : ${a.destinataire}`,
    `Adresse : ${a.adresse}`,
    `Enlèvement : ${a.dateEnlevement ?? 'à convenir'}`,
    `Livraison : ${a.dateLivraison ?? 'à convenir'}`,
    ``,
    `Encombrement : ${e.long_ml} ml x ${e.larg_ml} ml x ${e.haut_ml} ml — ${e.poids_t} t`,
    `Détail par colis :`,
    lignesColis,
    ``,
    `Coût convenu : ${a.cout != null ? `${a.cout} €` : 'à confirmer'}`,
    ``,
    `Cordialement,`,
    `HANS COFFRAGE`,
  ].join('\n');
  const subject = `Commande transport ${a.reference} — ${a.affaireNumero}`;
  return `mailto:rh@transports-rouillon.fr?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}
