// src/modules/flashage/FlashagePage.tsx
import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ScanLine, Recycle, CheckCircle2, ClipboardList } from 'lucide-react';

import { PageHeader } from '../../components/ui/PageHeader';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { ProgressBar } from '../../components/ui/ProgressBar';
import { Logo } from '../../components/layout/Logo';
import { C } from '../../lib/theme';

import { useAuth } from '../../auth/AuthProvider';
import { useRealtimeTable } from '../../lib/useRealtimeTable';
import { useAffairesFlashables } from './useAffairesFlashables';
import { useTaches } from './useTaches';
import { useHeuresFlashees, useFlasherHeures } from './useHeuresFlashees';
import { usePieces, useTogglePieceFait } from '../formulaire/usePieces';
import {
  groupTaches,
  fmtChrono,
  fmtDuree,
  totalMinutes,
  estAujourdhui,
  estCetteSemaine,
  dureeMinDepuis,
  type TacheRow,
} from './flashageData';

type Dimensions = Record<string, number | string | null | undefined>;

// Étapes de l'interface tablette : choix affaire → choix tâche → pointage actif.
type Step = 'idle' | 'tache' | 'actif';

// Couleurs de badge par catégorie d'heures (fidèle mapping maquette).
function badgeCat(cat: string | null): { bg: string; color: string } | null {
  if (!cat) return null;
  switch (cat) {
    case 'MACHINE':
      return { bg: C.warningSoft, color: '#8B6914' };
    case 'DESSIN':
      return { bg: C.primarySoft, color: C.primary };
    case 'MONTAGE':
      return { bg: C.successSoft, color: C.success };
    default:
      return { bg: C.infoSoft, color: C.info };
  }
}

// Construit la chaîne de dimensions d'une pièce (adapté snake_case, sans machine).
function dimStr(p: { geometrie: string | null; dimensions: unknown }): string {
  const dimP = (p.dimensions as Dimensions | null) ?? {};
  if (p.geometrie === 'standard') return `${dimP.long ?? '?'}×${dimP.larg ?? '?'}`;
  if (p.geometrie === 'type1') return `A${dimP.longA ?? '?'} L${dimP.larg ?? '?'}`;
  return `${dimP.long ?? '?'}×${dimP.larg ?? dimP.largG ?? '?'}`;
}

export default function FlashagePage() {
  const navigate = useNavigate();
  // `profil` ne porte que { nom, role } ; l'UUID opérateur vient de la session Supabase.
  const { profil, session } = useAuth();
  const operateurFlash = profil?.nom ?? '';
  const operateurId = session?.user?.id ?? '';

  const { data: affairesData } = useAffairesFlashables();
  const { data: tachesData } = useTaches();
  const { data: heuresData } = useHeuresFlashees();
  const flasher = useFlasherHeures();
  const togglePiece = useTogglePieceFait();

  const affairesFlashables = useMemo(() => affairesData ?? [], [affairesData]);
  const taches = useMemo(() => tachesData ?? [], [tachesData]);
  const heuresFlashees = useMemo(() => heuresData ?? [], [heuresData]);
  const groupes = useMemo(() => groupTaches(taches), [taches]);

  const [step, setStep] = useState<Step>('idle');
  const [selAffaire, setSelAffaire] = useState<(typeof affairesFlashables)[number] | null>(null);
  const [selTache, setSelTache] = useState<TacheRow | null>(null);
  // Affaire dont la fiche atelier (pièces cochables) est affichée dans la colonne de droite (uuid).
  const [ficheAffaireId, setFicheAffaireId] = useState<string | null>(null);
  const [startTime, setStartTime] = useState<number | null>(null); // timestamp de début du pointage
  const [now, setNow] = useState<number>(Date.now()); // horloge live (tick chaque seconde)

  // Fiche atelier affichée : sélection tablette, sinon première flashable.
  const ficheAff = ficheAffaireId ?? affairesFlashables[0]?.id ?? null;

  // Realtime : pointages globaux + pièces de la fiche atelier courante.
  useRealtimeTable('heures_flashees', [['heures_flashees']]);
  useRealtimeTable('pieces', [['pieces', ficheAff ?? '']]);

  const { data: piecesData } = usePieces(ficheAff);

  // Chrono live : tant qu'un pointage est actif, rafraîchit l'affichage chaque seconde.
  useEffect(() => {
    if (step !== 'actif') return;
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, [step]);

  // KPIs tablette : mes flashs (cet opérateur) cumulés aujourd'hui / cette semaine.
  const mesFlashs = useMemo(
    () => heuresFlashees.filter((f) => f.operateur_id === operateurId),
    [heuresFlashees, operateurId],
  );
  const aujourdhuiMin = totalMinutes(mesFlashs, (f) => estAujourdhui(f.date));
  const semaineMin = totalMinutes(mesFlashs, (f) => estCetteSemaine(f.date));
  const semainePct = Math.min(100, (semaineMin / (36.5 * 60)) * 100);

  // Index code → tâche et affaire_id → numéro pour résoudre les pointages enregistrés.
  const tacheParCode = useMemo(() => {
    const m = new Map<string, TacheRow>();
    for (const t of taches) m.set(t.code, t);
    return m;
  }, [taches]);
  const numeroParAffaire = useMemo(() => {
    const m = new Map<string, string>();
    for (const a of affairesFlashables) m.set(a.id, a.numero);
    return m;
  }, [affairesFlashables]);

  // Démarre le pointage : enregistre l'heure de début et lance le chrono.
  const demarrerPointage = (tache: TacheRow) => {
    setSelTache(tache);
    setStartTime(Date.now());
    setNow(Date.now());
    setStep('actif');
  };

  // Arrête le pointage : calcule la durée écoulée (min 1 minute) et l'enregistre.
  const arreterPointage = () => {
    if (selAffaire && selTache && startTime && operateurId) {
      flasher.mutate({
        id: crypto.randomUUID(),
        affaire_id: selAffaire.id,
        code_tache: selTache.code,
        operateur_id: operateurId,
        operateur_nom: operateurFlash,
        duree_min: dureeMinDepuis(startTime, Date.now()),
        date: new Date(startTime).toISOString(),
      });
    }
    setStep('idle');
    setSelAffaire(null);
    setSelTache(null);
    setStartTime(null);
  };

  // Annule sans enregistrer.
  const annulerPointage = () => {
    setStep('tache');
    setSelTache(null);
    setStartTime(null);
  };

  // Pièces de la fiche atelier (hors main d'œuvre) + avancement.
  const piecesFiche = (piecesData ?? []).filter((p) => p.type !== 'Main_Oeuvre');
  const nbFaites = piecesFiche.filter((p) => p.fait).length;
  const pct = piecesFiche.length ? Math.round((nbFaites / piecesFiche.length) * 100) : 0;

  return (
    <div className="space-y-5">
      <PageHeader
        section="Production"
        title="Flashage atelier"
        subtitle={`Interface tablette · scan code-barres affaire + tâche · ${taches.length} codes officiels`}
        actions={
          <button
            onClick={() => navigate('/chutes')}
            className="px-4 py-2 text-sm rounded font-semibold flex items-center gap-1.5 border transition-all hover:opacity-90"
            style={{ backgroundColor: 'white', color: C.text, borderColor: C.border }}
          >
            <Recycle size={14} /> Déclarer une chute
          </button>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
        <div className="rounded-3xl p-6 shadow-2xl mx-auto" style={{ width: 400, backgroundColor: '#1A1A1A' }}>
          <div className="rounded-2xl overflow-hidden" style={{ backgroundColor: C.bgWarm, height: 600 }}>
            <div className="px-5 py-4 flex items-center justify-between" style={{ backgroundColor: C.primary }}>
              <Logo size={36} showText />
              <div className="text-right">
                <div className="text-[9px] uppercase tracking-wider font-semibold" style={{ color: C.accent }}>Salarié</div>
                <div className="text-white text-sm font-bold">
                  {operateurFlash
                    ? `${operateurFlash.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase()} · ${operateurFlash}`
                    : '—'}
                </div>
              </div>
            </div>

            <div className="p-5">
              <div className="rounded p-3 mb-4 grid grid-cols-2 gap-3" style={{ backgroundColor: 'white', border: `1px solid ${C.border}` }}>
                <div>
                  <div className="text-[9px] uppercase tracking-wider font-semibold" style={{ color: C.textMuted }}>Aujourd'hui</div>
                  <div className="text-lg font-bold font-mono" style={{ color: C.primary }}>{fmtDuree(aujourdhuiMin)}</div>
                </div>
                <div>
                  <div className="text-[9px] uppercase tracking-wider font-semibold" style={{ color: C.textMuted }}>Semaine</div>
                  <div className="text-lg font-bold font-mono" style={{ color: C.primary }}>{fmtDuree(semaineMin)}</div>
                </div>
                <div className="col-span-2">
                  <ProgressBar value={semainePct} color={C.accent} height={4} />
                  <div className="text-[10px] mt-1" style={{ color: C.textMuted }}>{fmtDuree(semaineMin)} / 36h 30</div>
                </div>
              </div>

              {step === 'idle' && (
                <>
                  <div className="text-center py-5">
                    <div className="inline-flex p-6 rounded-full mb-3" style={{ backgroundColor: C.bgSoft }}>
                      <ScanLine size={48} style={{ color: C.primary }} strokeWidth={1.5} />
                    </div>
                    <div className="text-base font-bold" style={{ color: C.text }}>Choisir une affaire</div>
                    <div className="text-xs mt-1" style={{ color: C.textMuted }}>Seules les affaires dont le formulaire est validé</div>
                  </div>
                  <div className="space-y-1.5 max-h-60 overflow-y-auto pr-1">
                    {affairesFlashables.length === 0 && (
                      <div className="text-center text-xs py-4" style={{ color: C.textMuted }}>
                        Aucune affaire prête. Le chef de prod doit d'abord <strong>valider un formulaire</strong>.
                      </div>
                    )}
                    {affairesFlashables.map((a) => (
                      <button
                        key={a.id}
                        onClick={() => { setSelAffaire(a); setFicheAffaireId(a.id); setStep('tache'); }}
                        className="w-full p-3 rounded border text-left hover:bg-stone-50 transition-colors"
                        style={{ borderColor: C.border }}
                      >
                        <div className="font-mono text-sm font-bold" style={{ color: C.primary }}>{a.numero}</div>
                        <div className="text-[11px]" style={{ color: C.textMuted }}>{a.clients?.nom} · {a.chantier}</div>
                      </button>
                    ))}
                  </div>
                </>
              )}

              {step === 'tache' && selAffaire && (
                <>
                  <div className="rounded p-3 mb-3" style={{ backgroundColor: C.successSoft }}>
                    <div className="flex items-center gap-2">
                      <CheckCircle2 size={16} style={{ color: C.success }} />
                      <div>
                        <div className="text-[9px] uppercase tracking-wider font-semibold" style={{ color: C.success }}>Affaire sélectionnée</div>
                        <div className="font-mono text-sm font-bold" style={{ color: C.text }}>{selAffaire.numero}</div>
                      </div>
                    </div>
                    <div className="text-xs mt-2 ml-6" style={{ color: C.text }}>{selAffaire.clients?.nom} · {selAffaire.chantier}</div>
                  </div>
                  <div className="text-[10px] uppercase tracking-wider font-bold mb-2 flex items-center justify-between" style={{ color: C.textMuted }}>
                    <span>Sélectionner la tâche · scan ou tap</span>
                    <button onClick={() => { setStep('idle'); setSelAffaire(null); }} className="text-[9px] underline" style={{ color: C.textMuted }}>← changer</button>
                  </div>
                  <div className="space-y-1 max-h-64 overflow-y-auto pr-1">
                    {groupes.slice(0, 3).map(({ groupe, codes }) => (
                      <div key={groupe}>
                        <div className="text-[9px] uppercase tracking-wider font-bold py-1.5" style={{ color: C.primary }}>{groupe}</div>
                        <div className="grid grid-cols-2 gap-1.5">
                          {codes.map((t) => (
                            <button key={t.code} onClick={() => demarrerPointage(t)} className="p-2 rounded text-[10px] font-bold border hover:bg-stone-50 text-left transition-colors" style={{ borderColor: C.border, color: C.text }}>
                              <div className="font-mono" style={{ color: C.primary }}>{t.code}</div>
                              <div className="text-[9px] font-semibold" style={{ color: C.textMuted }}>{t.label}</div>
                              {t.categorie_heures && <div className="text-[8px] font-bold mt-0.5" style={{ color: C.accent }}>{t.categorie_heures}</div>}
                            </button>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}

              {step === 'actif' && selAffaire && selTache && (
                <>
                  {/* Chrono temps réel */}
                  <div className="text-center py-3">
                    <div className="text-[10px] uppercase tracking-wider font-bold mb-1 flex items-center justify-center gap-1.5" style={{ color: C.success }}>
                      <span className="inline-block w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: C.success }} />
                      Pointage en cours
                    </div>
                    <div className="text-4xl font-bold font-mono tracking-wider" style={{ color: C.primary }}>
                      {fmtChrono(now - (startTime ?? now))}
                    </div>
                  </div>
                  <div className="rounded p-3 mb-3" style={{ backgroundColor: C.bgSoft }}>
                    <div className="text-[10px] uppercase tracking-wider font-bold" style={{ color: C.textMuted }}>Affaire</div>
                    <div className="font-mono text-sm font-bold" style={{ color: C.text }}>{selAffaire.numero}</div>
                    <div className="text-[10px] uppercase tracking-wider font-bold mt-2" style={{ color: C.textMuted }}>Tâche</div>
                    <div className="text-sm font-bold" style={{ color: C.text }}>{selTache.code} · {selTache.label}</div>
                    {selTache.categorie_heures && <Badge bg={C.accent}>{selTache.categorie_heures} · valorisé PR</Badge>}
                  </div>
                  <button
                    onClick={arreterPointage}
                    className="w-full py-4 rounded text-white text-base font-bold mb-2"
                    style={{ backgroundColor: C.danger }}
                  >
                    ARRÊTER LE POINTAGE
                  </button>
                  <button onClick={annulerPointage} className="w-full py-2 rounded text-xs font-bold border" style={{ borderColor: C.border, color: C.textMuted }}>
                    Annuler (sans enregistrer)
                  </button>
                </>
              )}
            </div>
          </div>
        </div>

        <div className="space-y-4">
          {/* === FICHE ATELIER cochable (symbiose flashage ↔ fiche) === */}
          {ficheAff && (
            <Card>
              <div className="flex items-center justify-between mb-2 gap-2 flex-wrap">
                <h3 className="font-bold text-sm flex items-center gap-2" style={{ color: C.text }}>
                  <ClipboardList size={15} style={{ color: C.primary }} /> Fiche atelier · à faire
                </h3>
                <select value={ficheAff} onChange={(e) => setFicheAffaireId(e.target.value)} className="px-2 py-1 border rounded text-xs font-mono" style={{ borderColor: C.border }}>
                  {affairesFlashables.map((a) => <option key={a.id} value={a.id}>{a.numero}</option>)}
                </select>
              </div>
              {piecesFiche.length === 0 ? (
                <div className="text-center text-xs py-4" style={{ color: C.textMuted }}>Aucune pièce sur cette affaire.</div>
              ) : (
                <>
                  {/* Avancement */}
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[11px] font-bold" style={{ color: C.text }}>{nbFaites}/{piecesFiche.length} pièces faites</span>
                    <span className="text-sm font-mono font-bold" style={{ color: pct === 100 ? C.success : C.accent }}>{pct}%</span>
                  </div>
                  <div className="h-2 rounded-full overflow-hidden mb-2" style={{ backgroundColor: C.border }}>
                    <div className="h-full transition-all" style={{ width: `${pct}%`, backgroundColor: pct === 100 ? C.success : C.accent }} />
                  </div>
                  <div className="text-[10px] mb-2" style={{ color: C.textMuted }}>Coché par : <strong style={{ color: C.primary }}>{operateurFlash}</strong></div>
                  {/* Liste des pièces cochables */}
                  <div className="space-y-1 max-h-72 overflow-y-auto pr-1">
                    {piecesFiche.map((p) => (
                      <label key={p.id} className="flex items-center gap-2 p-2 rounded border cursor-pointer hover:bg-stone-50" style={{ borderColor: C.border, backgroundColor: p.fait ? C.successSoft : 'white' }}>
                        <input
                          type="checkbox"
                          checked={!!p.fait}
                          onChange={() => togglePiece.mutate({ id: p.id, fait: !p.fait, faitPar: operateurFlash, affaireId: ficheAff! })}
                          className="w-4 h-4 shrink-0"
                          style={{ accentColor: C.success }}
                        />
                        <div className="flex-1 min-w-0">
                          <div className="text-[11px] font-semibold truncate" style={{ color: C.text }} title={p.designation ?? ''}>{p.nb}× {p.designation}</div>
                          <div className="text-[9px] font-mono" style={{ color: C.textMuted }}>{p.section_finie} · {dimStr(p)} mm</div>
                        </div>
                        {p.fait && p.fait_par && (
                          <span className="text-[9px] font-bold shrink-0" style={{ color: C.success }}>✓ {p.fait_par.split(' ')[0]}</span>
                        )}
                      </label>
                    ))}
                  </div>
                </>
              )}
            </Card>
          )}

          <Card>
            <h3 className="font-bold text-sm mb-3 flex items-center justify-between" style={{ color: C.text }}>
              <span>Pointages enregistrés (tous opérateurs)</span>
              <Badge bg={C.primary}>{heuresFlashees.length}</Badge>
            </h3>
            {heuresFlashees.length === 0 ? (
              <div className="text-center text-xs py-6" style={{ color: C.textMuted }}>Aucun pointage encore enregistré.</div>
            ) : (
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {heuresFlashees.map((p) => {
                  const t = p.code_tache ? tacheParCode.get(p.code_tache) : undefined;
                  const cat = t?.categorie_heures ?? null;
                  const numero = numeroParAffaire.get(p.affaire_id) ?? p.affaire_id.slice(0, 8);
                  return (
                    <div key={p.id} className="flex items-center gap-3 py-2 border-b last:border-0" style={{ borderColor: C.border }}>
                      <div className="w-2 h-2 rounded-full" style={{ backgroundColor: cat ? C.success : C.border }} />
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-semibold" style={{ color: C.text }}>{p.code_tache} · {t?.label ?? ''}{cat ? ` (${cat})` : ''}</div>
                        <div className="text-[10px] font-mono" style={{ color: C.textMuted }}>{numero} · {p.operateur_nom}</div>
                      </div>
                      <div className="text-xs font-mono font-bold" style={{ color: C.primary }}>{fmtDuree(p.duree_min)}</div>
                    </div>
                  );
                })}
              </div>
            )}
          </Card>

          <Card noPadding>
            <div className="px-4 py-3 border-b flex items-center justify-between" style={{ borderColor: C.border }}>
              <h3 className="font-bold text-sm" style={{ color: C.text }}>Référentiel codes-barres tâches</h3>
              <Badge bg={C.bgSoft} color={C.text}>{taches.length} codes</Badge>
            </div>
            <div className="max-h-[420px] overflow-y-auto p-3 space-y-3">
              {groupes.map(({ groupe, codes }) => (
                <div key={groupe}>
                  <div className="text-[10px] uppercase tracking-wider font-bold mb-1.5" style={{ color: C.primary }}>{groupe}</div>
                  <div className="grid grid-cols-2 gap-1">
                    {codes.map((t) => {
                      const cb = badgeCat(t.categorie_heures);
                      return (
                        <div key={t.code} className="flex items-center gap-1.5 py-1 px-1.5 rounded text-[10px]" style={{ backgroundColor: C.bgSoft }}>
                          <span className="font-mono font-bold" style={{ color: C.primary }}>{t.code}</span>
                          <span className="flex-1 truncate" style={{ color: C.textMuted }}>{t.label}</span>
                          {cb && <span className="text-[8px] px-1 rounded font-bold" style={{ backgroundColor: cb.bg, color: cb.color }}>{t.categorie_heures}</span>}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
            <div className="px-4 py-2 border-t text-[10px]" style={{ borderColor: C.border, color: C.textMuted }}>
              Catégories <span className="font-bold" style={{ color: C.primary }}>DESSIN</span> / <span className="font-bold" style={{ color: '#8B6914' }}>MACHINE</span> / <span className="font-bold" style={{ color: C.success }}>MONTAGE</span> / <span className="font-bold" style={{ color: C.info }}>AUTRES</span> = valorisation MO du Prix de revient.
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
