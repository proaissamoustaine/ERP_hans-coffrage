import { C } from '../../../lib/theme';
import { formatDate } from '../../../lib/format';
import type { Encombrement } from '../livraisonsData';

export type CommandeTransportPrintProps = {
  reference: string;
  affaireNumero: string;
  destinataire: string;
  adresse: string;
  conducteur: string | null;
  conducteurTel: string | null;
  dateEnlevement: string | null;
  dateLivraison: string | null;
  cout: number | null;
  encombrement: Encombrement;
  colis: { numero: number | null; poids: number | null }[];
};

export function CommandeTransportPrint(p: CommandeTransportPrintProps) {
  const e = p.encombrement;
  return (
    <div className="print-doc commande" style={{ fontFamily: 'Georgia, serif', color: C.text, padding: 24 }}>
      <header style={{ borderBottom: `2px solid ${C.primary}`, paddingBottom: 8, marginBottom: 16 }}>
        <h1 style={{ fontSize: 18, fontWeight: 700 }}>Commande transport — Transports ROUILLON</h1>
        <div style={{ fontFamily: 'monospace' }}>{p.reference} · Affaire {p.affaireNumero}</div>
      </header>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, fontSize: 12, marginBottom: 16 }}>
        <div><strong>Destinataire :</strong> {p.destinataire}</div>
        <div><strong>Adresse :</strong> {p.adresse}</div>
        <div><strong>Conducteur :</strong> {p.conducteur ?? '—'} {p.conducteurTel ?? ''}</div>
        <div><strong>Enlevement :</strong> {p.dateEnlevement ? formatDate(p.dateEnlevement) : '—'}</div>
        <div><strong>Livraison :</strong> {p.dateLivraison ? formatDate(p.dateLivraison) : '—'}</div>
        <div><strong>Cout convenu :</strong> {p.cout != null ? `${p.cout} €` : '—'}</div>
      </div>
      <div style={{ fontSize: 12, marginBottom: 12 }}>
        <strong>Encombrement :</strong> {e.long_ml} ml × {e.larg_ml} ml × {e.haut_ml} ml — {e.poids_t} t
      </div>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
        <thead><tr style={{ backgroundColor: C.bgSoft }}>
          <th style={{ textAlign: 'left', padding: '6px 8px' }}>Colis</th>
          <th style={{ textAlign: 'left', padding: '6px 8px' }}>Poids (kg)</th>
        </tr></thead>
        <tbody>
          {p.colis.map((c) => (
            <tr key={c.numero}>
              <td style={{ padding: '6px 8px' }}>n° {c.numero}</td>
              <td style={{ padding: '6px 8px', fontFamily: 'monospace' }}>{c.poids ?? 0}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
