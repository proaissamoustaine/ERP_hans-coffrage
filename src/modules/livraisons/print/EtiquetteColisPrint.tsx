import { C } from '../../../lib/theme';

export type EtiquetteColis = { numero: number | null; longueur: number | null; largeur: number | null; hauteur: number | null; poids: number | null };
export type EtiquetteColisPrintProps = {
  affaireNumero: string;
  client: string;
  chantier: string;
  colis: EtiquetteColis;
  total: number;
};

// Etiquette A5 paysage (210 x 148 mm).
export function EtiquetteColisPrint(p: EtiquetteColisPrintProps) {
  return (
    <div
      className="print-doc etiquette"
      style={{ width: '210mm', height: '148mm', boxSizing: 'border-box', padding: 24, fontFamily: 'Georgia, serif', color: C.text, border: `2px solid ${C.text}` }}
    >
      <div style={{ fontSize: 22, fontWeight: 700 }}>HANS COFFRAGE</div>
      <div style={{ fontSize: 48, fontWeight: 700, fontFamily: 'monospace', margin: '16px 0' }}>{p.colis.numero} / {p.total}</div>
      <div style={{ fontSize: 20, fontFamily: 'monospace' }}>{p.affaireNumero}</div>
      <div style={{ fontSize: 18, marginTop: 8 }}>{p.client} · {p.chantier}</div>
      <div style={{ display: 'flex', gap: 24, marginTop: 24, fontSize: 18 }}>
        <div><strong>Dim.</strong> {p.colis.longueur}×{p.colis.largeur}×{p.colis.hauteur} cm</div>
        <div><strong>Poids</strong> {p.colis.poids} kg</div>
      </div>
    </div>
  );
}
