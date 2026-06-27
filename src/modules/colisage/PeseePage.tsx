// src/modules/colisage/PeseePage.tsx
import { useMemo, useState } from 'react';
import { Scale, Check, Plus } from 'lucide-react';

import { PageHeader } from '../../components/ui/PageHeader';
import { Card } from '../../components/ui/Card';
import { Btn } from '../../components/ui/Btn';
import { C } from '../../lib/theme';

import { useAuth } from '../../auth/AuthProvider';
import { useRealtimeTable } from '../../lib/useRealtimeTable';
import { useColis, usePeserColis } from './useColis';
import { totalPoids, colisDuJour, fmtTonnes } from './colisData';

export default function PeseePage() {
  // `profil` non utilisé ici mais branché pour cohérence auth.
  useAuth();

  const { data: colisData } = useColis();
  const colis = useMemo(() => colisData ?? [], [colisData]);
  const peserColis = usePeserColis();

  // Realtime : toute pesée enregistrée (autre tablette) rafraîchit la liste.
  useRealtimeTable('colis', [['colis']]);

  // En-tête : la modale « Nouvelle pesée » est décorative (port simple).
  const [showNew, setShowNew] = useState(false);

  // Colis sélectionné pour la pesée en cours.
  const [selId, setSelId] = useState('');
  const sel = colis.find((c) => c.id === selId);

  // Champs éditables de la pesée en cours (poids en kg, dimensions en cm).
  const [poids, setPoids] = useState('');
  const [long, setLong] = useState('');
  const [larg, setLarg] = useState('');
  const [haut, setHaut] = useState('');

  // À la sélection d'un colis : pré-remplissage depuis ses valeurs enregistrées.
  const handleSelect = (id: string) => {
    setSelId(id);
    const c = colis.find((x) => x.id === id);
    setPoids(String(c?.poids ?? 0));
    setLong(String(c?.longueur ?? 0));
    setLarg(String(c?.largeur ?? 0));
    setHaut(String(c?.hauteur ?? 0));
  };

  // Pesées du jour : colis du jour effectivement pesés (poids > 0).
  const pesesDuJour = useMemo(
    () => colisDuJour(colis).filter((c) => (c.poids ?? 0) > 0),
    [colis],
  );

  const handleValider = () => {
    if (!sel) return;
    peserColis.mutate({
      id: sel.id,
      affaireId: sel.affaire_id,
      poids: +poids,
      longueur: +long,
      largeur: +larg,
      hauteur: +haut,
    });
  };

  // Dimensions affichées dans le bloc « Pesée en cours » (saisie en cm).
  const dims: [string, string, (v: string) => void][] = [
    ['Longueur', long, setLong],
    ['Largeur', larg, setLarg],
    ['Hauteur', haut, setHaut],
  ];

  return (
    <div className="space-y-5">
      <PageHeader
        section="Logistique"
        title="Pesée des colis"
        subtitle="Mesure poids et dimensions · interface balance / mètre laser"
        actions={<Btn icon={Plus} onClick={() => setShowNew(true)}>Nouvelle pesée</Btn>}
      />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-5">
        <Card>
          <div className="text-center mb-4">
            <Scale size={32} className="mx-auto mb-2" style={{ color: C.primary }} />
            <h3 className="font-bold text-base" style={{ color: C.text }}>Pesée en cours</h3>
            <div className="mt-2">
              <select
                value={selId}
                onChange={(e) => handleSelect(e.target.value)}
                className="px-3 py-1.5 border rounded text-xs font-mono"
                style={{ borderColor: C.border, color: C.textMuted }}
              >
                <option value="">— Choisir un colis —</option>
                {colis.map((c) => (
                  <option key={c.id} value={c.id}>
                    {`${c.affaire?.numero ?? '—'} · Colis ${c.numero}`}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="rounded-lg p-8 text-center mb-4" style={{ backgroundColor: '#1A1A1A' }}>
            <div className="text-[10px] uppercase tracking-wider font-bold mb-2" style={{ color: C.accent }}>Poids mesuré</div>
            <input
              type="number"
              value={poids}
              onChange={(e) => setPoids(e.target.value)}
              className="text-6xl font-bold font-mono w-full bg-transparent text-center outline-none"
              style={{ color: 'white' }}
            />
            <div className="text-sm font-bold mt-1" style={{ color: C.accent }}>tonnes ({fmtTonnes(+poids || 0)})</div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            {dims.map(([l, v, setV]) => (
              <div key={l} className="p-3 rounded text-center" style={{ backgroundColor: C.bgSoft }}>
                <div className="text-[10px] uppercase tracking-wider font-bold" style={{ color: C.textMuted }}>{l}</div>
                <input
                  type="number"
                  value={v}
                  onChange={(e) => setV(e.target.value)}
                  className="text-xl font-bold font-mono mt-1 w-full bg-transparent text-center outline-none"
                  style={{ color: C.text }}
                />
                <div className="text-[10px]" style={{ color: C.textMuted }}>cm</div>
              </div>
            ))}
          </div>
          <Btn variant="primary" icon={Check} disabled={!sel} onClick={handleValider} className="mt-4 w-full justify-center">Valider la pesée</Btn>
        </Card>

        <Card>
          <h3 className="font-bold text-base mb-3" style={{ color: C.text }}>Pesées du jour</h3>
          <div className="space-y-2">
            {pesesDuJour.map((c) => (
              <div key={c.id} className="flex items-center gap-3 py-2 border-b last:border-0" style={{ borderColor: C.border }}>
                <div className="text-xs font-mono" style={{ color: C.textMuted }}>
                  {new Date(c.date).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                </div>
                <div className="flex-1 text-xs font-mono font-semibold" style={{ color: C.text }}>
                  {`${c.affaire?.numero ?? '—'} · Colis ${c.numero}`}
                </div>
                <div className="text-sm font-bold font-mono" style={{ color: C.primary }}>{fmtTonnes(c.poids ?? 0)} t</div>
              </div>
            ))}
          </div>
          <div className="mt-4 pt-4 border-t flex justify-between" style={{ borderColor: C.border }}>
            <span className="text-xs font-bold" style={{ color: C.textMuted }}>TOTAL JOURNÉE</span>
            <span className="text-base font-bold font-mono" style={{ color: C.primary }}>{fmtTonnes(totalPoids(pesesDuJour))} t</span>
          </div>
        </Card>
      </div>

      {/* Modale « Nouvelle pesée » : décorative (le flux réel passe par la sélection + validation). */}
      {showNew && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
          onClick={() => setShowNew(false)}
        >
          <div
            className="bg-white rounded-lg shadow-2xl w-full max-w-md overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-5 py-4 border-b flex items-start justify-between gap-3" style={{ borderColor: C.border, backgroundColor: C.primary }}>
              <div className="flex items-start gap-3 min-w-0">
                <div className="w-10 h-10 rounded flex items-center justify-center flex-shrink-0" style={{ backgroundColor: 'rgba(255,255,255,0.1)' }}>
                  <Scale size={18} className="text-white" />
                </div>
                <div className="min-w-0">
                  <h3 className="font-bold text-base text-white">Nouvelle pesée</h3>
                  <p className="text-xs mt-0.5" style={{ color: C.accent }}>Sélectionnez un colis ci-dessous puis validez sa pesée.</p>
                </div>
              </div>
              <button onClick={() => setShowNew(false)} className="p-1.5 rounded hover:bg-white/10 text-white flex-shrink-0">✕</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
