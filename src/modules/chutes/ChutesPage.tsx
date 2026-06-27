// src/modules/chutes/ChutesPage.tsx
// Port fidèle de la maquette `PageChutes` (chutothèque) — données réelles Supabase.
import { useMemo, useState } from 'react';
import { Recycle, Plus, Boxes, CheckCircle2, Database, ArrowRight, Trash2 } from 'lucide-react';

import { PageHeader } from '../../components/ui/PageHeader';
import { Card } from '../../components/ui/Card';
import { KPI } from '../../components/ui/KPI';
import { Btn } from '../../components/ui/Btn';
import { C } from '../../lib/theme';

import { useAuth } from '../../auth/AuthProvider';
import { useRealtimeTable } from '../../lib/useRealtimeTable';
import { useChutes, useDeclarerChute, useReutiliserChute, type ChuteAvecAffaires } from './useChutes';
import {
  surfaceM2,
  valoriserChute,
  chutesDispo,
  chutesConsommees,
  catsPresentes,
  valeurTotale,
} from './chutesData';
import { useCatalogue, type CatalogueRow } from '../formulaire/useCatalogue';
import { categories, famillesFor, matieresFor } from '../formulaire/catalogue';
import { useAffaires } from '../affaires/useAffaires';

// Formatage € sans décimale (fidèle maquette).
const fmtEuro = (n: number) => `${n.toLocaleString('fr-FR', { maximumFractionDigits: 0 })} €`;

export default function ChutesPage() {
  // L'UUID opérateur vient de la session Supabase (profil ne porte que { nom, role }).
  const { session } = useAuth();
  const operateurId = session?.user?.id ?? '';

  // Realtime : toute modification de la table `chutes` rafraîchit la liste.
  useRealtimeTable('chutes', [['chutes']]);

  const { data } = useChutes();
  const chutes = useMemo<ChuteAvecAffaires[]>(() => data ?? [], [data]);

  const { data: catalogueData } = useCatalogue();
  const catalogue = useMemo<CatalogueRow[]>(() => catalogueData ?? [], [catalogueData]);

  const { data: affairesData } = useAffaires();
  const affaires = useMemo(() => affairesData ?? [], [affairesData]);

  const declarerChute = useDeclarerChute();
  const reutiliserChute = useReutiliserChute();

  const [showDeclare, setShowDeclare] = useState(false);
  const [filtreType, setFiltreType] = useState<string>('all');
  // Modale de réutilisation : la chute concernée, ou null.
  const [reuse, setReuse] = useState<ChuteAvecAffaires | null>(null);

  // Listes dérivées des chutes réelles.
  const dispo = useMemo(() => chutesDispo(chutes), [chutes]);
  const consommees = useMemo(() => chutesConsommees(chutes), [chutes]);
  const cats = useMemo(() => catsPresentes(dispo), [dispo]);
  const filtered = filtreType === 'all' ? dispo : dispo.filter((c) => c.cat === filtreType);

  // === Formulaire de déclaration (cascade catalogue) ===
  const [declCat, setDeclCat] = useState('');
  const [declFamille, setDeclFamille] = useState('');
  const [declMatiere, setDeclMatiere] = useState<CatalogueRow | null>(null);
  const [declLong, setDeclLong] = useState('');
  const [declLarg, setDeclLarg] = useState('');
  const [declEp, setDeclEp] = useState('');
  const [declAffaireOrigine, setDeclAffaireOrigine] = useState('');

  const catOptions = useMemo(() => categories(catalogue), [catalogue]);
  const familleOptions = useMemo(
    () => (declCat ? famillesFor(catalogue, declCat) : []),
    [catalogue, declCat],
  );
  const matiereOptions = useMemo(
    () => (declCat && declFamille ? matieresFor(catalogue, declCat, declFamille) : []),
    [catalogue, declCat, declFamille],
  );

  const resetDeclare = () => {
    setDeclCat('');
    setDeclFamille('');
    setDeclMatiere(null);
    setDeclLong('');
    setDeclLarg('');
    setDeclEp('');
    setDeclAffaireOrigine('');
    setShowDeclare(false);
  };

  const handleDeclare = () => {
    if (!declMatiere || !declLong || !declLarg) return;
    const m = declMatiere;
    declarerChute.mutate({
      id: crypto.randomUUID(),
      matiere_code: m.code,
      designation: m.ref ?? m.code,
      cat: m.cat,
      longueur: +declLong,
      largeur: +declLarg,
      epaisseur: +declEp,
      prix_unit: m.prix,
      unite: m.unite,
      affaire_origine: declAffaireOrigine || null,
      operateur_id: operateurId,
    });
    resetDeclare();
  };

  // === Formulaire de réutilisation ===
  const [reuseAffaireDest, setReuseAffaireDest] = useState('');
  const [reuseMode, setReuseMode] = useState<'totale' | 'partielle'>('totale');
  const [resteLong, setResteLong] = useState('');
  const [resteLarg, setResteLarg] = useState('');
  const [resteExploitable, setResteExploitable] = useState(true);

  const openReuse = (c: ChuteAvecAffaires) => {
    setReuse(c);
    setReuseAffaireDest('');
    setReuseMode('totale');
    setResteLong('');
    setResteLarg('');
    setResteExploitable(true);
  };

  const handleReutiliser = () => {
    if (!reuse) return;
    reutiliserChute.mutate({
      id: reuse.id,
      affaireConsoId: reuseAffaireDest || null,
      mode: reuseMode,
      resteJete: reuseMode === 'partielle' && !resteExploitable,
      reste:
        reuseMode === 'partielle' && resteExploitable && resteLong && resteLarg
          ? { id: crypto.randomUUID(), longueur: +resteLong, largeur: +resteLarg }
          : undefined,
      source: {
        matiere_code: reuse.matiere_code ?? '',
        designation: reuse.designation ?? '',
        cat: reuse.cat ?? '',
        epaisseur: reuse.epaisseur ?? 0,
        prix_unit: reuse.prix_unit ?? 0,
        unite: reuse.unite,
        affaire_origine: reuse.affaire_origine,
        operateur_id: operateurId,
      },
    });
    setReuse(null);
  };

  const confirmDisabled =
    !reuseAffaireDest || (reuseMode === 'partielle' && resteExploitable && (!resteLong || !resteLarg));

  return (
    <div className="space-y-5">
      <PageHeader
        section="Production"
        title="Chutes · chutothèque"
        subtitle="Récupération et revalorisation des chutes d'atelier · réutilisation inter-affaires pour optimiser le prix de revient"
        actions={<Btn icon={Plus} onClick={() => setShowDeclare(true)}>Déclarer une chute</Btn>}
      />

      {/* Explication */}
      <div className="rounded p-4 flex items-start gap-3" style={{ backgroundColor: C.successSoft, borderLeft: `4px solid ${C.success}` }}>
        <Recycle size={18} style={{ color: C.success }} className="mt-0.5 flex-shrink-0" />
        <div className="text-xs" style={{ color: '#1F5C3A' }}>
          <strong>Principe :</strong> après un débit, l'opérateur prend ce dont il a besoin dans un panneau ; le reste devient une <strong>chute</strong>.
          Au lieu de la jeter, il la déclare ici avec ses dimensions. Une chute disponible peut être <strong>réutilisée sur une autre tâche/affaire</strong> :
          la matière étant déjà payée, son coût est revalorisé et le <strong>prix de revient de la nouvelle affaire diminue</strong>.
        </div>
      </div>

      {/* KPI */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
        <KPI icon={Recycle} label="Chutes disponibles" value={String(dispo.length)} color={C.success} />
        <KPI icon={Boxes} label="Valeur récupérable" value={fmtEuro(valeurTotale(dispo))} color={C.accent} sub="estimation" />
        <KPI icon={CheckCircle2} label="Chutes réutilisées" value={String(consommees.length)} color={C.primary} />
        <KPI icon={Database} label="Familles matière" value={String(cats.length)} color={C.primaryLight} />
      </div>

      {/* Filtre + liste */}
      <Card noPadding className="overflow-x-auto">
        <div className="px-5 py-3 border-b flex items-center gap-2 flex-wrap" style={{ borderColor: C.border }}>
          <h3 className="font-bold text-sm flex-1" style={{ color: C.text }}>Stock de chutes disponibles</h3>
          <button onClick={() => setFiltreType('all')} className="px-3 py-1.5 rounded text-xs font-semibold" style={{ backgroundColor: filtreType === 'all' ? C.primary : 'white', color: filtreType === 'all' ? 'white' : C.textMuted, border: `1px solid ${C.border}` }}>Toutes</button>
          {cats.map((cat) => (
            <button key={cat} onClick={() => setFiltreType(cat)} className="px-3 py-1.5 rounded text-xs font-semibold" style={{ backgroundColor: filtreType === cat ? C.primary : 'white', color: filtreType === cat ? 'white' : C.textMuted, border: `1px solid ${C.border}` }}>{cat}</button>
          ))}
        </div>
        <table className="w-full min-w-[900px]">
          <thead style={{ backgroundColor: C.bgSoft }}>
            <tr>
              {['Matière', 'Dimensions (mm)', 'Ép.', 'Surface', 'Valeur est.', 'Affaire origine', 'Date', 'Action'].map((h) => (
                <th key={h} className="text-left px-4 py-3 text-[10px] uppercase tracking-wider font-bold" style={{ color: C.textMuted }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && (
              <tr><td colSpan={8} className="text-center px-4 py-6 text-xs" style={{ color: C.textMuted }}>Aucune chute disponible dans cette catégorie.</td></tr>
            )}
            {filtered.map((c) => (
              <tr key={c.id} className="border-b hover:bg-stone-50" style={{ borderColor: C.border }}>
                <td className="px-4 py-3">
                  <div className="text-sm truncate max-w-[220px]" title={c.designation ?? ''} style={{ color: C.text }}>{c.designation}</div>
                  <div className="text-[10px] font-mono" style={{ color: C.textMuted }}>{c.matiere_code}</div>
                </td>
                <td className="px-4 py-3 font-mono text-sm" style={{ color: C.text }}>{c.longueur ?? 0} × {c.largeur ?? 0}</td>
                <td className="px-4 py-3 font-mono text-sm" style={{ color: C.textMuted }}>{c.epaisseur ?? 0} mm</td>
                <td className="px-4 py-3 font-mono text-sm" style={{ color: C.textMuted }}>{surfaceM2(c).toFixed(2)} m²</td>
                <td className="px-4 py-3 font-mono text-sm font-bold" style={{ color: C.success }}>{fmtEuro(valoriserChute(c))}</td>
                <td className="px-4 py-3 font-mono text-xs" style={{ color: C.primary }}>{c.origine?.numero ?? '—'}</td>
                <td className="px-4 py-3 text-xs font-mono" style={{ color: C.textMuted }}>{new Date(c.created_at).toLocaleDateString('fr-FR')}</td>
                <td className="px-4 py-3">
                  <button
                    onClick={() => openReuse(c)}
                    className="px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider text-white"
                    style={{ backgroundColor: C.success }}
                  >
                    <Recycle size={10} className="inline mr-1 -mt-0.5" />Réutiliser
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

      {/* Chutes déjà réutilisées (historique) */}
      {consommees.length > 0 && (
        <Card noPadding className="overflow-x-auto">
          <div className="px-5 py-3 border-b" style={{ borderColor: C.border, backgroundColor: C.bgSoft }}>
            <h3 className="font-bold text-sm" style={{ color: C.text }}>Chutes réutilisées · {consommees.length}</h3>
          </div>
          <div className="divide-y" style={{ borderColor: C.border }}>
            {consommees.map((c) => (
              <div key={c.id} className="px-5 py-2.5 flex items-center gap-3 text-xs flex-wrap">
                <Recycle size={14} style={{ color: C.success }} />
                <span className="flex-1 min-w-[140px]" style={{ color: C.text }}>{c.designation} ({c.longueur ?? 0}×{c.largeur ?? 0})</span>
                <span style={{ color: C.textMuted }}>origine <strong className="font-mono" style={{ color: C.primary }}>{c.origine?.numero ?? '—'}</strong></span>
                <ArrowRight size={12} style={{ color: C.textMuted }} />
                <span style={{ color: C.textMuted }}>réutilisée sur <strong className="font-mono" style={{ color: C.success }}>{c.conso?.numero ?? '—'}</strong></span>
                {c.mode_reutilisation === 'partielle' ? (
                  c.reste_jete
                    ? <span className="px-1.5 py-0.5 rounded text-[10px] font-bold inline-flex items-center gap-1" style={{ backgroundColor: C.dangerSoft, color: C.danger }}><Trash2 size={10} />partielle · reste jeté</span>
                    : <span className="px-1.5 py-0.5 rounded text-[10px] font-bold inline-flex items-center gap-1" style={{ backgroundColor: C.successSoft, color: C.success }}><Recycle size={10} />partielle · reste au stock</span>
                ) : (
                  <span className="px-1.5 py-0.5 rounded text-[10px] font-bold" style={{ backgroundColor: C.bgSoft, color: C.textMuted }}>utilisée entièrement</span>
                )}
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Modale réutilisation de chute (entière / partielle + reste exploitable ou poubelle) */}
      {reuse && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="bg-white rounded-lg p-6 max-w-lg w-full shadow-2xl">
            <h3 className="text-base font-bold mb-1 flex items-center gap-2" style={{ color: C.text }}>
              <Recycle size={18} style={{ color: C.success }} /> Réutiliser une chute
            </h3>
            <div className="p-2.5 rounded mb-3 text-xs" style={{ backgroundColor: C.bgWarm, color: C.text }}>
              <strong>{reuse.designation}</strong><br />
              <span className="font-mono">{reuse.longueur ?? 0} × {reuse.largeur ?? 0} mm · ép {reuse.epaisseur ?? 0} mm</span> · origine {reuse.origine?.numero ?? '—'}
            </div>

            {/* Affaire destination */}
            <label className="text-[10px] uppercase tracking-wider font-bold block mb-1" style={{ color: C.textMuted }}>Réutilisée sur l'affaire</label>
            <select value={reuseAffaireDest} onChange={(e) => setReuseAffaireDest(e.target.value)} className="w-full px-3 py-2 border rounded text-sm font-mono mb-3" style={{ borderColor: C.border }}>
              <option value="">— Choisir l'affaire —</option>
              {affaires.map((a) => <option key={a.id} value={a.id}>{a.numero} · {a.clients?.nom ?? ''}</option>)}
            </select>

            {/* Mode : entière ou partielle */}
            <label className="text-[10px] uppercase tracking-wider font-bold block mb-1.5" style={{ color: C.textMuted }}>Utilisation de la chute</label>
            <div className="grid grid-cols-2 gap-2 mb-3">
              {([
                { id: 'totale', label: 'Entièrement', desc: 'Toute la chute est consommée' },
                { id: 'partielle', label: 'Partiellement', desc: 'Il reste un morceau' },
              ] as const).map((opt) => (
                <button key={opt.id} onClick={() => setReuseMode(opt.id)}
                  className="p-2.5 rounded border-2 text-left transition-colors"
                  style={{ borderColor: reuseMode === opt.id ? C.success : C.border, backgroundColor: reuseMode === opt.id ? C.successSoft : 'white' }}>
                  <div className="text-sm font-bold" style={{ color: reuseMode === opt.id ? C.success : C.text }}>{opt.label}</div>
                  <div className="text-[10px]" style={{ color: C.textMuted }}>{opt.desc}</div>
                </button>
              ))}
            </div>

            {/* Si partielle : que devient le reste ? */}
            {reuseMode === 'partielle' && (
              <div className="p-3 rounded mb-3" style={{ backgroundColor: C.bgSoft }}>
                <div className="text-[10px] uppercase tracking-wider font-bold mb-2" style={{ color: C.textMuted }}>Le reste de la chute</div>
                <div className="grid grid-cols-2 gap-2 mb-2">
                  <div>
                    <label className="text-[10px] block mb-1" style={{ color: C.textMuted }}>Long. reste (mm)</label>
                    <input type="number" value={resteLong} onChange={(e) => setResteLong(e.target.value)} disabled={!resteExploitable} className="w-full px-2 py-1.5 border rounded text-sm font-mono disabled:bg-gray-100" style={{ borderColor: C.border }} />
                  </div>
                  <div>
                    <label className="text-[10px] block mb-1" style={{ color: C.textMuted }}>Larg. reste (mm)</label>
                    <input type="number" value={resteLarg} onChange={(e) => setResteLarg(e.target.value)} disabled={!resteExploitable} className="w-full px-2 py-1.5 border rounded text-sm font-mono disabled:bg-gray-100" style={{ borderColor: C.border }} />
                  </div>
                </div>
                <div className="text-[10px] mb-1.5" style={{ color: C.textMuted }}>L'opérateur juge si le reste est encore utilisable :</div>
                <div className="grid grid-cols-2 gap-2">
                  <button onClick={() => setResteExploitable(true)}
                    className="p-2 rounded border-2 text-left"
                    style={{ borderColor: resteExploitable ? C.success : C.border, backgroundColor: resteExploitable ? C.successSoft : 'white' }}>
                    <div className="text-xs font-bold flex items-center gap-1" style={{ color: resteExploitable ? C.success : C.text }}><Recycle size={12} /> Exploitable</div>
                    <div className="text-[10px]" style={{ color: C.textMuted }}>Remis au stock de chutes</div>
                  </button>
                  <button onClick={() => setResteExploitable(false)}
                    className="p-2 rounded border-2 text-left"
                    style={{ borderColor: !resteExploitable ? C.danger : C.border, backgroundColor: !resteExploitable ? C.dangerSoft : 'white' }}>
                    <div className="text-xs font-bold flex items-center gap-1" style={{ color: !resteExploitable ? C.danger : C.text }}><Trash2 size={12} /> Non exploitable</div>
                    <div className="text-[10px]" style={{ color: C.textMuted }}>Part à la poubelle</div>
                  </button>
                </div>
              </div>
            )}

            <div className="flex gap-2 justify-end">
              <button onClick={() => setReuse(null)} className="px-4 py-2 border rounded text-sm font-bold" style={{ borderColor: C.border, color: C.text }}>Annuler</button>
              <button
                onClick={handleReutiliser}
                disabled={confirmDisabled}
                className="px-4 py-2 rounded text-sm font-bold text-white disabled:opacity-40"
                style={{ backgroundColor: C.success }}
              >
                Confirmer la réutilisation
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modale déclaration de chute */}
      {showDeclare && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="bg-white rounded-lg p-6 max-w-lg w-full shadow-2xl">
            <h3 className="text-base font-bold mb-1" style={{ color: C.text }}>Déclarer une chute</h3>
            <p className="text-xs mb-4" style={{ color: C.textMuted }}>Renseignez la matière et les dimensions de la chute récupérée. Elle entrera dans le stock réutilisable.</p>
            <div className="grid grid-cols-2 gap-3 mb-3">
              <div className="col-span-2">
                <label className="text-[10px] uppercase tracking-wider font-bold block mb-1" style={{ color: C.textMuted }}>Type matière</label>
                <select value={declCat} onChange={(e) => { setDeclCat(e.target.value); setDeclFamille(''); setDeclMatiere(null); }} className="w-full px-3 py-2 border rounded text-sm" style={{ borderColor: C.border }}>
                  <option value="">— Choisir —</option>
                  {catOptions.map((t) => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div>
                <label className="text-[10px] uppercase tracking-wider font-bold block mb-1" style={{ color: C.textMuted }}>Réf_1 (famille)</label>
                <select value={declFamille} onChange={(e) => { setDeclFamille(e.target.value); setDeclMatiere(null); }} disabled={!declCat} className="w-full px-3 py-2 border rounded text-sm disabled:bg-gray-100" style={{ borderColor: C.border }}>
                  <option value="">—</option>
                  {familleOptions.map((f) => <option key={f} value={f}>{f}</option>)}
                </select>
              </div>
              <div>
                <label className="text-[10px] uppercase tracking-wider font-bold block mb-1" style={{ color: C.textMuted }}>Réf_2 (variante)</label>
                <select value={declMatiere?.code ?? ''} onChange={(e) => { const m = matiereOptions.find((x) => x.code === e.target.value) ?? null; setDeclMatiere(m); setDeclEp(m?.epaisseur != null ? String(m.epaisseur) : declEp); }} disabled={!declFamille} className="w-full px-3 py-2 border rounded text-sm disabled:bg-gray-100" style={{ borderColor: C.border }}>
                  <option value="">—</option>
                  {matiereOptions.map((m) => <option key={m.code} value={m.code}>{m.ref ?? m.code}</option>)}
                </select>
              </div>
              <div>
                <label className="text-[10px] uppercase tracking-wider font-bold block mb-1" style={{ color: C.textMuted }}>Longueur (mm)</label>
                <input type="number" value={declLong} onChange={(e) => setDeclLong(e.target.value)} className="w-full px-3 py-2 border rounded text-sm font-mono" style={{ borderColor: C.border }} />
              </div>
              <div>
                <label className="text-[10px] uppercase tracking-wider font-bold block mb-1" style={{ color: C.textMuted }}>Largeur (mm)</label>
                <input type="number" value={declLarg} onChange={(e) => setDeclLarg(e.target.value)} className="w-full px-3 py-2 border rounded text-sm font-mono" style={{ borderColor: C.border }} />
              </div>
              <div>
                <label className="text-[10px] uppercase tracking-wider font-bold block mb-1" style={{ color: C.textMuted }}>Épaisseur (mm)</label>
                <input type="number" value={declEp} onChange={(e) => setDeclEp(e.target.value)} className="w-full px-3 py-2 border rounded text-sm font-mono" style={{ borderColor: C.border }} />
              </div>
              <div>
                <label className="text-[10px] uppercase tracking-wider font-bold block mb-1" style={{ color: C.textMuted }}>Affaire d'origine</label>
                <select value={declAffaireOrigine} onChange={(e) => setDeclAffaireOrigine(e.target.value)} className="w-full px-3 py-2 border rounded text-sm font-mono" style={{ borderColor: C.border }}>
                  <option value="">—</option>
                  {affaires.map((a) => <option key={a.id} value={a.id}>{a.numero} · {a.clients?.nom ?? ''}</option>)}
                </select>
              </div>
            </div>
            <div className="flex gap-2 justify-end">
              <button onClick={resetDeclare} className="px-4 py-2 border rounded text-sm font-bold" style={{ borderColor: C.border, color: C.text }}>Annuler</button>
              <button onClick={handleDeclare} disabled={!declMatiere || !declLong || !declLarg} className="px-4 py-2 rounded text-sm font-bold text-white disabled:opacity-40" style={{ backgroundColor: C.success }}>Ajouter au stock</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
