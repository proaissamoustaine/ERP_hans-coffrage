import { C } from '../../../lib/theme';
import { formatDate } from '../../../lib/format';

export type BLColis = { numero: number | null; longueur: number | null; largeur: number | null; hauteur: number | null; poids: number | null };
export type BonLivraisonPrintProps = {
  reference: string;
  affaireNumero: string;
  client: string;
  chantier: string;
  destination: string;
  date: string;
  colis: BLColis[];
};

export function BonLivraisonPrint(p: BonLivraisonPrintProps) {
  return (
    <div className="print-doc bl" style={{ fontFamily: 'Georgia, serif', color: C.text, padding: 24 }}>
      <header style={{ borderBottom: `2px solid ${C.primary}`, paddingBottom: 8, marginBottom: 16 }}>
        <h1 style={{ fontSize: 20, fontWeight: 700 }}>HANS COFFRAGE</h1>
        <div style={{ fontSize: 11 }}>20 rue de la Haitroye · 88540 BUSSANG · SIRET 447 801 978 00019</div>
        <h2 style={{ fontSize: 16, marginTop: 8 }}>Bon de livraison <span style={{ fontFamily: 'monospace' }}>{p.reference}</span></h2>
      </header>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16, fontSize: 12 }}>
        <div><strong>Affaire :</strong> {p.affaireNumero}</div>
        <div><strong>Date :</strong> {formatDate(p.date)}</div>
        <div><strong>Client :</strong> {p.client}</div>
        <div><strong>Chantier :</strong> {p.chantier}</div>
        <div style={{ gridColumn: '1 / 3' }}><strong>Destination :</strong> {p.destination}</div>
      </div>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
        <thead>
          <tr style={{ backgroundColor: C.bgSoft }}>
            {['Colis', 'L (cm)', 'l (cm)', 'h (cm)', 'Poids (kg)'].map((h) => (
              <th key={h} style={{ textAlign: 'left', padding: '6px 8px', borderBottom: `1px solid ${C.border}` }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {p.colis.map((c) => (
            <tr key={c.numero}>
              <td style={{ padding: '6px 8px' }}>n° {c.numero}</td>
              <td style={{ padding: '6px 8px' }}>{c.longueur}</td>
              <td style={{ padding: '6px 8px' }}>{c.largeur}</td>
              <td style={{ padding: '6px 8px' }}>{c.hauteur}</td>
              <td style={{ padding: '6px 8px', fontFamily: 'monospace' }}>{c.poids}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <div style={{ marginTop: 40, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, fontSize: 12 }}>
        <div>Signature expéditeur :</div>
        <div>Signature destinataire :</div>
      </div>
    </div>
  );
}
