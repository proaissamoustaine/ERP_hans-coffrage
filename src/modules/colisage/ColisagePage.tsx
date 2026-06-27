// src/modules/colisage/ColisagePage.tsx
import { useMemo, useState } from 'react';
import { Package, Plus, Camera, Printer, FileText } from 'lucide-react';

import { PageHeader } from '../../components/ui/PageHeader';
import { Card } from '../../components/ui/Card';
import { Btn } from '../../components/ui/Btn';
import { Badge } from '../../components/ui/Badge';
import { C } from '../../lib/theme';

import { useAuth } from '../../auth/AuthProvider';
import { useRealtimeTable } from '../../lib/useRealtimeTable';
import { useColis, useCreerColis, type ColisAvecAffaire } from './useColis';
import { useAffaires } from '../affaires/useAffaires';
import { nextNumeroColis, colisDuJour, groupByAffaire, fmtTonnes } from './colisData';

// Champs de dimensions/poids du formulaire d'ajout rapide (saisie en cm / kg).
type QuickDims = { long: string; larg: string; haut: string; poids: string };
const DIMS_VIDES: QuickDims = { long: '', larg: '', haut: '', poids: '' };

export default function ColisagePage() {
  // `profil` ne porte que { nom, role } ; non utilisé ici mais branché pour cohérence auth.
  useAuth();

  const { data: colisData } = useColis();
  const { data: affairesData } = useAffaires();
  const creerColis = useCreerColis();

  const colis = useMemo(() => colisData ?? [], [colisData]);
  const affaires = useMemo(() => affairesData ?? [], [affairesData]);

  // Realtime : toute insertion de colis (autre tablette) rafraîchit la liste.
  useRealtimeTable('colis', [['colis']]);

  // En-tête : la modale « Nouveau colis » réutilise simplement le même formulaire d'ajout.
  const [showNew, setShowNew] = useState(false);
  const [quickAffaireId, setQuickAffaireId] = useState('');
  const [quickDims, setQuickDims] = useState<QuickDims>(DIMS_VIDES);

  // Colis regroupés par affaire (« Colis enregistrés »).
  const groupes = useMemo(() => groupByAffaire<ColisAvecAffaire>(colis), [colis]);
  // Colis du jour (colonne de droite).
  const duJour = useMemo(() => colisDuJour(colis), [colis]);

  // Ajout d'un colis : numéro auto par affaire, puis insertion offline-safe.
  const handleQuickAddColis = () => {
    if (!quickAffaireId) return;
    const numero = nextNumeroColis(colis.filter((c) => c.affaire_id === quickAffaireId));
    creerColis.mutate({
      id: crypto.randomUUID(),
      affaire_id: quickAffaireId,
      numero,
      longueur: +quickDims.long,
      largeur: +quickDims.larg,
      hauteur: +quickDims.haut,
      poids: +quickDims.poids,
    });
    setQuickDims(DIMS_VIDES);
    setShowNew(false);
  };

  // Champs dimensions/poids de l'ajout rapide (libellés fidèles maquette : cm / kg).
  const champsDims: { k: keyof QuickDims; label: string }[] = [
    { k: 'long', label: 'Long (cm)' },
    { k: 'larg', label: 'Larg (cm)' },
    { k: 'haut', label: 'Haut (cm)' },
    { k: 'poids', label: 'Poids (kg)' },
  ];

  // Bloc réutilisé par la carte et par la modale « Nouveau colis ».
  const formulaireAjout = (
    <>
      <div className="grid grid-cols-1 md:grid-cols-5 gap-3 items-end">
        <div className="md:col-span-1">
          <label className="text-[10px] uppercase tracking-wider font-bold block mb-1" style={{ color: C.textMuted }}>N° Affaire</label>
          <select
            value={quickAffaireId}
            onChange={(e) => setQuickAffaireId(e.target.value)}
            className="w-full px-3 py-2 border rounded text-sm font-mono"
            style={{ borderColor: C.border }}
          >
            <option value="">— Choisir —</option>
            {affaires.map((a) => <option key={a.id} value={a.id}>{a.numero}</option>)}
          </select>
        </div>
        {champsDims.map((f) => (
          <div key={f.k}>
            <label className="text-[10px] uppercase tracking-wider font-bold block mb-1" style={{ color: C.textMuted }}>{f.label}</label>
            <input
              type="number"
              value={quickDims[f.k]}
              onChange={(e) => setQuickDims((prev) => ({ ...prev, [f.k]: e.target.value }))}
              className="w-full px-3 py-2 border rounded text-sm font-mono"
              style={{ borderColor: C.border }}
            />
          </div>
        ))}
      </div>
      <button
        onClick={handleQuickAddColis}
        disabled={!quickAffaireId}
        className="mt-3 px-4 py-2 rounded font-bold text-sm uppercase tracking-wider text-white disabled:opacity-40 disabled:cursor-not-allowed"
        style={{ backgroundColor: C.success }}
      >
        <Plus size={14} className="inline mr-1.5 -mt-0.5" /> Ajouter le colis
      </button>
    </>
  );

  return (
    <div className="space-y-5">
      <PageHeader
        section="Logistique"
        title="Colisage"
        subtitle="Préparation des colis · saisie atelier (tablette)"
        actions={<Btn icon={Plus} onClick={() => setShowNew(true)}>Nouveau colis</Btn>}
      />

      {/* === Ajout rapide de colis lié à une affaire === */}
      <Card>
        <h3 className="font-bold text-sm mb-1 flex items-center gap-2" style={{ color: C.text }}>
          <Package size={16} style={{ color: C.primary }} />
          Ajouter un colis pour une affaire
        </h3>
        <p className="text-xs mb-3" style={{ color: C.textMuted }}>Sélectionnez l'affaire concernée puis renseignez les dimensions. Le colis sera enregistré sur la fiche affaire et déclenchera l'étape <strong>de colisage</strong>.</p>
        {formulaireAjout}

        {/* Liste des colis enregistrés par affaire */}
        {groupes.length > 0 && (
          <div className="mt-5 pt-4 border-t" style={{ borderColor: C.border }}>
            <h4 className="text-xs uppercase tracking-wider font-bold mb-2" style={{ color: C.textMuted }}>
              Colis enregistrés
            </h4>
            <div className="space-y-2">
              {groupes.map((g) => (
                <div key={g.affaireId} className="p-3 rounded border flex items-center gap-3" style={{ borderColor: C.border, backgroundColor: C.bgWarm }}>
                  <span className="font-mono font-bold text-sm" style={{ color: C.primary }}>{g.colis[0].affaire?.numero ?? '—'}</span>
                  <Badge bg={C.success}>{g.colis.length} colis</Badge>
                  <span className="text-xs" style={{ color: C.textMuted }}>
                    {g.colis.map((c) => `${c.longueur ?? '?'}×${c.largeur ?? '?'}×${c.hauteur ?? '?'} cm · ${c.poids ?? 0} kg`).join(' | ')}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-5">
        <Card>
          <div className="flex items-center justify-between gap-2 mb-1">
            <h3 className="font-bold text-base" style={{ color: C.text }}>Fiche colisage en cours</h3>
            <Badge bg={C.accentSoft} color="#8B6914">Démo</Badge>
          </div>
          <p className="text-xs mb-5" style={{ color: C.textMuted }}>Affaire C25-0226-03F5 · Colis 3/5 · Alexandre Lutenbacher</p>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] uppercase tracking-wider font-bold" style={{ color: C.textMuted }}>N° Affaire</label>
                <div className="mt-1 px-3 py-2.5 border rounded font-mono text-sm font-bold" style={{ borderColor: C.border, backgroundColor: C.bgSoft, color: C.primary }}>C25-0226-03F5</div>
              </div>
              <div>
                <label className="text-[10px] uppercase tracking-wider font-bold" style={{ color: C.textMuted }}>Colis n°</label>
                <div className="mt-1 px-3 py-2.5 border rounded text-sm font-bold" style={{ borderColor: C.border }}>3 / 5</div>
              </div>
            </div>
            <div className="grid grid-cols-4 gap-3">
              {([['Long.', '1.82 m'], ['Larg.', '1.65 m'], ['Haut.', '2.40 m'], ['Poids', '0.86 t']] as const).map(([l, v]) => (
                <div key={l}>
                  <label className="text-[10px] uppercase tracking-wider font-bold" style={{ color: C.textMuted }}>{l}</label>
                  <div className="mt-1 px-2 py-2.5 border rounded text-xs font-mono font-bold text-center" style={{ borderColor: C.border }}>{v}</div>
                </div>
              ))}
            </div>
            <div className="grid grid-cols-3 gap-3">
              {([['Cerclage', '3'], ['Film étirable', 'Oui'], ['Élingues', '2T · 4m']] as const).map(([l, v]) => (
                <div key={l}>
                  <label className="text-[10px] uppercase tracking-wider font-bold" style={{ color: C.textMuted }}>{l}</label>
                  <div className="mt-1 px-3 py-2.5 border rounded text-sm font-medium" style={{ borderColor: C.border }}>{v}</div>
                </div>
              ))}
            </div>
            <div>
              <label className="text-[10px] uppercase tracking-wider font-bold" style={{ color: C.textMuted }}>Contenu détaillé</label>
              <div className="mt-1 px-3 py-2.5 border rounded text-xs space-y-1" style={{ borderColor: C.border }}>
                <div>• 2 réhausses de demi-coquilles 1.61ml</div>
                <div>• 2 passerelles de sécurité</div>
                <div>• 4 boulons HM 20×100</div>
              </div>
            </div>
          </div>

          <div className="flex gap-2 mt-5 pt-5 border-t" style={{ borderColor: C.border }}>
            <Btn variant="secondary" icon={Camera}>Photo</Btn>
            <Btn variant="secondary" icon={Printer}>Aperçu étiquette A5</Btn>
            <Btn variant="accent" icon={FileText}>Étiquette + BL</Btn>
          </div>
        </Card>

        <Card noPadding className="overflow-x-auto">
          <div className="px-5 py-4 border-b" style={{ borderColor: C.border }}>
            <h3 className="font-bold text-base" style={{ color: C.text }}>Colis du jour</h3>
          </div>
          <div>
            {duJour.length === 0 ? (
              <div className="px-5 py-8 text-center text-xs" style={{ color: C.textMuted }}>Aucun colis enregistré aujourd'hui.</div>
            ) : (
              duJour.map((c) => (
                <div key={c.id} className="px-5 py-3 flex items-center gap-3 border-b last:border-0 hover:bg-stone-50" style={{ borderColor: C.border }}>
                  <div className="w-9 h-9 rounded flex items-center justify-center" style={{ backgroundColor: C.bgSoft }}>
                    <Package size={16} style={{ color: C.primary }} />
                  </div>
                  <div className="flex-1">
                    <div className="font-mono text-xs font-bold" style={{ color: C.primary }}>{c.affaire?.numero ?? '—'} · Colis {c.numero ?? '?'}</div>
                    <div className="text-xs font-mono" style={{ color: C.textMuted }}>{fmtTonnes(c.poids ?? 0)} t</div>
                  </div>
                  <Badge bg={C.successSoft} color="#1E5C42">OK</Badge>
                </div>
              ))
            )}
          </div>
        </Card>
      </div>

      {/* Modale « Nouveau colis » : réutilise le formulaire d'ajout rapide (port simple). */}
      {showNew && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
          onClick={() => setShowNew(false)}
        >
          <div
            className="bg-white rounded-lg shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-5 py-4 border-b flex items-start justify-between gap-3" style={{ borderColor: C.border, backgroundColor: C.primary }}>
              <div className="flex items-start gap-3 min-w-0">
                <div className="w-10 h-10 rounded flex items-center justify-center flex-shrink-0" style={{ backgroundColor: 'rgba(255,255,255,0.1)' }}>
                  <Package size={18} className="text-white" />
                </div>
                <div className="min-w-0">
                  <h3 className="font-bold text-base text-white">Nouveau colis</h3>
                  <p className="text-xs mt-0.5" style={{ color: C.accent }}>Fiche colisage atelier</p>
                </div>
              </div>
              <button onClick={() => setShowNew(false)} className="p-1.5 rounded hover:bg-white/10 text-white flex-shrink-0">✕</button>
            </div>
            <div className="flex-1 overflow-y-auto p-5">
              <p className="text-xs mb-3" style={{ color: C.textMuted }}>Sélectionnez l'affaire concernée puis renseignez les dimensions (cm) et le poids (kg).</p>
              {formulaireAjout}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
