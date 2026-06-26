import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  ChevronLeft,
  ClipboardList,
  Printer,
  Copy,
  Edit,
  ArrowRight,
  Check,
  CheckCircle2,
  Building2,
  MapPin,
  Phone,
  UserCog,
  Calendar,
  Camera,
  Calculator,
  FileText,
  FileSpreadsheet,
  PackageCheck,
  Receipt,
  Download,
} from 'lucide-react';

import { Card } from '../../components/ui/Card';
import { Btn } from '../../components/ui/Btn';
import { Badge } from '../../components/ui/Badge';
import { Spinner } from '../../components/ui/Spinner';
import { TypeBadge, MODE_CFG } from '../../components/ui/TypeBadge';
import { NumAffaireSchema } from '../../components/ui/NumAffaireSchema';
import { formatDate } from '../../lib/format';
import { C } from '../../lib/theme';
import type { Tables } from '../../lib/database.types';
import { ETAPES, avancementPondere, prochaineEtape } from '../../lib/etapes';
import { sousEtapesPonderees } from './sousEtapes';
import { useAffaires } from './useAffaires';
import { useEtapes, useToggleEtape } from './useEtapes';

// Row type: base affaires row + joined clients relation
type AffaireRow = Tables<'affaires'> & { clients: { nom: string } | null };

const TABS = [
  { id: 'synthese', label: 'Synthèse' },
  { id: 'client', label: 'Client & Commande' },
  { id: 'chantier', label: 'Chantier' },
  { id: 'heures', label: 'Heures' },
  { id: 'pr', label: 'Prix de revient' },
  { id: 'livraisons', label: 'Livraisons' },
  { id: 'photos', label: 'Photos' },
  { id: 'documents', label: 'Documents' },
] as const;

export function FicheAffairePage() {
  const { id } = useParams<{ id: string }>();
  const { data: affaires, isLoading } = useAffaires();
  const [tab, setTab] = useState<string>('synthese');

  const list = (affaires ?? []) as AffaireRow[];
  const affaire = list.find((a) => a.id === id) ?? null;

  if (isLoading) {
    return (
      <div className="flex justify-center py-16">
        <Spinner />
      </div>
    );
  }

  if (!affaire) {
    return (
      <Card>
        <p className="text-sm font-medium" style={{ color: C.text }}>
          Affaire introuvable.
        </p>
        <Link
          to="/affaires"
          className="mt-3 inline-flex items-center gap-1 text-xs font-semibold hover:underline"
          style={{ color: C.primary }}
        >
          <ChevronLeft size={14} /> Retour aux affaires
        </Link>
      </Card>
    );
  }

  return <FicheContent affaire={affaire} tab={tab} setTab={setTab} />;
}

type FicheContentProps = {
  affaire: AffaireRow;
  tab: string;
  setTab: (t: string) => void;
};

function FicheContent({ affaire, tab, setTab }: FicheContentProps) {
  const { data: etapes } = useEtapes(affaire.id);
  const toggleEtape = useToggleEtape();

  const etapesList = etapes ?? [];
  const etapesForCalc = etapesList.map((e) => ({ etape: e.etape, fait: e.fait }));
  const avancementGlobal = avancementPondere(etapesForCalc);
  const next = prochaineEtape(etapesForCalc);

  const pastilleLettre = MODE_CFG[affaire.mode ?? '']?.l ?? '?';
  const modeLabel = MODE_CFG[affaire.mode ?? '']?.label ?? affaire.mode ?? '—';

  const toggle = (etapeId: string, fait: boolean) => {
    toggleEtape.mutate({
      etapeId,
      fait,
      affaireId: affaire.id,
      etapes: etapesList.map((e) => ({ id: e.id, fait: e.fait })),
    });
  };

  const sousEtapes = sousEtapesPonderees(affaire.avancement ?? 0);

  return (
    <div className="space-y-5">
      <Link
        to="/affaires"
        className="text-xs font-semibold flex items-center gap-1 hover:underline w-fit"
        style={{ color: C.primary }}
      >
        <ChevronLeft size={14} /> Retour aux affaires
      </Link>

      <Card>
        {/* En-tête */}
        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4 mb-5">
          <div className="flex items-start gap-4 lg:gap-5 min-w-0">
            <div
              className="w-14 h-14 lg:w-16 lg:h-16 rounded flex items-center justify-center flex-shrink-0"
              style={{ backgroundColor: C.primary }}
            >
              <span className="text-white text-xl lg:text-2xl font-bold">{pastilleLettre}</span>
            </div>
            <div className="min-w-0">
              <TypeBadge mode={affaire.mode} />
              <h1 className="font-mono text-xl lg:text-2xl font-bold mt-1 break-all" style={{ color: C.primary }}>
                {affaire.numero}
              </h1>
              <div className="text-base font-bold mt-0.5" style={{ color: C.text }}>
                {affaire.clients?.nom ?? '—'}
              </div>
              <div className="text-sm" style={{ color: C.textMuted }}>
                {affaire.chantier ?? '—'}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <Btn variant="secondary" icon={ClipboardList} size="sm" title="à venir">
              Saisir pièces
            </Btn>
            <Btn variant="secondary" icon={Printer} size="sm" title="à venir">
              Imprimer
            </Btn>
            <Btn variant="secondary" icon={Copy} size="sm" title="à venir">
              Dupliquer
            </Btn>
            <Btn icon={Edit} size="sm" title="à venir">
              Modifier
            </Btn>
          </div>
        </div>

        {/* 4 stats */}
        <div
          className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4 pb-5 border-b"
          style={{ borderColor: C.border }}
        >
          {(
            [
              ['Montant HT', `${(affaire.total_ht ?? 0).toLocaleString('fr-FR')} €`],
              ['Heures totales', '—'],
              ['Coût horaire', '—'],
              ['Livraison prévue', formatDate(affaire.date_livraison)],
            ] as const
          ).map(([l, v]) => (
            <div key={l}>
              <div
                className="text-[10px] uppercase tracking-wider font-bold mb-1"
                style={{ color: C.textMuted }}
              >
                {l}
              </div>
              <div className="text-xl font-bold font-mono" style={{ color: C.text }}>
                {v}
              </div>
            </div>
          ))}
        </div>

        {/* === Cycle de vie — 11 étapes === */}
        <div className="pt-5 mb-5">
          <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
            <div className="text-xs uppercase tracking-wider font-bold" style={{ color: C.textMuted }}>
              Cycle de vie affaire · {ETAPES.length} étapes
            </div>
            <div className="flex items-center gap-3">
              <Badge bg={C.primary}>{affaire.statut ?? '—'}</Badge>
              <div className="text-base font-mono font-bold" style={{ color: C.primary }}>
                {avancementGlobal}% global
              </div>
            </div>
          </div>

          {/* Bandeau action principale = prochaine étape */}
          {next && (
            <div
              className="mb-3 p-3 rounded border-l-4 flex items-center justify-between gap-3"
              style={{ borderLeftColor: C.accent, backgroundColor: C.bgWarm }}
            >
              <div className="flex items-center gap-2">
                <ArrowRight size={16} style={{ color: C.accent }} />
                <span className="text-sm" style={{ color: C.text }}>
                  Prochaine étape : <strong>{next.label}</strong>
                </span>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    const row = etapesList.find((e) => e.etape === next.cle);
                    if (row) toggle(row.id, true);
                  }}
                  className="px-3 py-1.5 rounded text-xs font-bold uppercase tracking-wider text-white"
                  style={{ backgroundColor: C.success }}
                >
                  <Check size={12} className="inline mr-1 -mt-0.5" />
                  Marquer fait
                </button>
              </div>
            </div>
          )}
          {!next && (
            <div
              className="mb-3 p-3 rounded border-l-4 flex items-center gap-3"
              style={{ borderLeftColor: C.success, backgroundColor: C.successSoft }}
            >
              <CheckCircle2 size={16} style={{ color: C.success }} />
              <span className="text-sm" style={{ color: C.text }}>
                <strong>Affaire soldée</strong> — toutes les étapes du cycle sont complétées. 🎉
              </span>
            </div>
          )}

          {/* Timeline horizontale de cartes */}
          <div className="overflow-x-auto">
            <div className="flex items-stretch gap-1.5 min-w-fit pb-1">
              {ETAPES.map((etape, idx) => {
                const row = etapesList.find((e) => e.etape === etape.cle);
                const fait = row?.fait ?? false;
                const date = row?.date ?? null;
                const isNext = next != null && etape.cle === next.cle;
                return (
                  <div
                    key={etape.cle}
                    className="flex-1 min-w-[110px] p-2 rounded border-2 transition-all"
                    style={{
                      borderColor: fait ? C.success : isNext ? C.accent : C.border,
                      backgroundColor: fait ? C.successSoft : isNext ? C.bgWarm : 'white',
                    }}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span
                        className="text-[9px] uppercase tracking-wider font-bold"
                        style={{ color: C.textMuted }}
                      >
                        {idx + 1}/{ETAPES.length}
                      </span>
                      {fait && <CheckCircle2 size={11} style={{ color: C.success }} />}
                      {isNext && (
                        <span className="text-[8px] font-bold uppercase" style={{ color: C.accent }}>
                          NEXT
                        </span>
                      )}
                    </div>
                    <div
                      className="text-[10px] font-semibold leading-tight mb-1"
                      style={{ color: fait || isNext ? C.text : C.textMuted }}
                    >
                      {etape.label}
                    </div>
                    <div className="text-[9px] font-mono" style={{ color: C.textLight }}>
                      {etape.poids > 0 && <span>{etape.poids} pts</span>}
                    </div>
                    {date && (
                      <div className="text-[9px] mt-1" style={{ color: C.success }}>
                        {formatDate(date)}
                      </div>
                    )}
                    {fait && row && (
                      <button
                        onClick={() => toggle(row.id, false)}
                        className="mt-1 text-[9px] underline"
                        style={{ color: C.textMuted }}
                        title="Annuler cette étape"
                      >
                        ↶ annuler
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Sous-étapes pondérées (vue historique) */}
        <div className="pt-3 border-t" style={{ borderColor: C.border }}>
          <div className="flex items-center justify-between mb-3">
            <div className="text-xs uppercase tracking-wider font-bold" style={{ color: C.textMuted }}>
              Détail avancement chantier · 10 sous-étapes pondérées (vue historique)
            </div>
            <div className="text-xs font-mono font-bold" style={{ color: C.primary }}>
              {affaire.avancement ?? 0}% (ancien calcul)
            </div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-5 lg:grid-cols-10 gap-1.5">
            {sousEtapes.map((s) => (
              <div
                key={s.key}
                className="p-2 rounded border"
                style={{
                  borderColor: s.val === 100 ? C.success : s.val > 0 ? C.accent : C.border,
                  backgroundColor: s.val === 100 ? C.successSoft : s.val > 0 ? '#FFFAEC' : 'white',
                }}
              >
                <div className="flex items-center justify-between mb-1">
                  <span
                    className="text-[9px] uppercase tracking-wider font-bold"
                    style={{ color: C.textMuted }}
                  >
                    {s.group}
                  </span>
                  {s.val === 100 && <CheckCircle2 size={10} style={{ color: C.success }} />}
                </div>
                <div
                  className="text-[10px] font-semibold leading-tight"
                  style={{ color: s.val > 0 ? C.text : C.textMuted }}
                >
                  {s.sub}
                </div>
                <div className="flex items-center justify-between mt-1.5">
                  <span className="text-[9px] font-mono" style={{ color: C.textLight }}>
                    {s.weight}%
                  </span>
                  <span
                    className="text-[10px] font-mono font-bold"
                    style={{ color: s.val === 100 ? C.success : s.val > 0 ? C.accent : C.textMuted }}
                  >
                    {Math.round(s.val)}%
                  </span>
                </div>
                <div className="mt-1 h-1 rounded-full overflow-hidden" style={{ backgroundColor: C.border }}>
                  <div
                    className="h-full transition-all"
                    style={{ width: `${s.val}%`, backgroundColor: s.val === 100 ? C.success : C.accent }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </Card>

      {/* Barre des 8 onglets + contenu */}
      <Card noPadding className="overflow-x-auto">
        <div className="flex border-b overflow-x-auto" style={{ borderColor: C.border }}>
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className="px-5 py-3 text-sm font-semibold border-b-2 transition-all whitespace-nowrap"
              style={{
                borderColor: tab === t.id ? C.accent : 'transparent',
                color: tab === t.id ? C.primary : C.textMuted,
              }}
            >
              {t.label}
            </button>
          ))}
        </div>
        <div className="p-6">
          {tab === 'synthese' && (
            <div className="space-y-5">
              {/* Code-barres affaire */}
              <div
                className="rounded p-4 border-2 flex flex-col md:flex-row items-start md:items-center gap-4"
                style={{ borderColor: C.primary, backgroundColor: C.primarySoft }}
              >
                <div className="flex-1">
                  <div
                    className="text-[10px] uppercase tracking-wider font-bold"
                    style={{ color: C.textMuted }}
                  >
                    Code-barres affaire (utilisé pour le flashage atelier)
                  </div>
                  <div className="font-mono text-xl font-bold mt-1" style={{ color: C.primary }}>
                    {`*${affaire.numero}*`}
                  </div>
                  <div className="text-[10px] mt-1" style={{ color: C.textMuted }}>
                    Élément : (non renseigné)
                  </div>
                </div>
                {/* Représentation visuelle code-barres */}
                <div className="flex items-center gap-[1.5px] bg-white px-3 py-3 rounded">
                  {Array.from({ length: 38 }).map((_, i) => (
                    <div
                      key={i}
                      style={{
                        width: [0, 2, 4, 7, 10, 12, 15, 18, 21, 24, 27, 30, 33, 35].includes(i) ? 2 : 1,
                        height: 38,
                        backgroundColor: '#1A1A1A',
                      }}
                    />
                  ))}
                </div>
                <Btn variant="secondary" size="sm" icon={Printer} title="à venir">
                  Imprimer étiquette
                </Btn>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5 md:gap-8">
                <div>
                  <h3
                    className="text-xs uppercase tracking-wider font-bold mb-3"
                    style={{ color: C.textMuted }}
                  >
                    Informations affaire
                  </h3>
                  <dl className="space-y-2.5">
                    {(
                      [
                        ['N° Affaire', affaire.numero, true],
                        ['Type', modeLabel, false],
                        ['Élément', '—', false],
                        ['Date création', formatDate(affaire.created_at), true],
                        ['Démarrage', '—', true],
                        ['Livraison souhaitée', formatDate(affaire.date_livraison), true],
                        ['Statut', affaire.statut ?? '—', false],
                      ] as const
                    ).map(([k, v, mono]) => (
                      <div
                        key={k}
                        className="flex justify-between border-b pb-2"
                        style={{ borderColor: C.border }}
                      >
                        <dt className="text-xs" style={{ color: C.textMuted }}>
                          {k}
                        </dt>
                        <dd
                          className={`text-sm font-bold ${mono ? 'font-mono' : ''}`}
                          style={{ color: C.text }}
                        >
                          {v}
                        </dd>
                      </div>
                    ))}
                  </dl>
                </div>
                <div>
                  <h3
                    className="text-xs uppercase tracking-wider font-bold mb-3 flex items-center gap-2"
                    style={{ color: C.textMuted }}
                  >
                    Analyse économique
                    <Badge bg={C.accentSoft} color="#8B6914">
                      Démo
                    </Badge>
                  </h3>
                  <dl className="space-y-2.5">
                    {(
                      [
                        ['Montant HT Franco', `${(affaire.total_ht ?? 0).toLocaleString('fr-FR')} €`],
                        ['Transport HT (Rouillon)', '—'],
                        ['Total facturable HT', '—'],
                        ['Heures dessin (BE)', '—'],
                        ['Heures production', '—'],
                        ['Coût horaire global', '—'],
                        ['Prix de revient (PR)', '—'],
                        ['Marge', '—'],
                      ] as const
                    ).map(([k, v]) => (
                      <div
                        key={k}
                        className="flex justify-between border-b pb-2"
                        style={{ borderColor: C.border }}
                      >
                        <dt className="text-xs" style={{ color: C.textMuted }}>
                          {k}
                        </dt>
                        <dd className="text-sm font-bold" style={{ color: C.text }}>
                          {v}
                        </dd>
                      </div>
                    ))}
                  </dl>
                </div>
              </div>

              <NumAffaireSchema id={affaire.numero} />
            </div>
          )}

          {tab === 'client' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-5">
              <div className="rounded p-5" style={{ backgroundColor: C.bgSoft }}>
                <Building2 size={20} style={{ color: C.primary }} />
                <h4 className="font-bold mt-2" style={{ color: C.text }}>
                  {affaire.clients?.nom ?? '—'}
                </h4>
                <div className="space-y-2 mt-3 text-xs" style={{ color: C.textMuted }}>
                  <div className="flex items-center gap-2">
                    <MapPin size={12} /> {affaire.chantier ?? '—'}
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone size={12} /> —
                  </div>
                </div>
              </div>
              <div className="rounded p-5" style={{ backgroundColor: C.bgSoft }}>
                <UserCog size={20} style={{ color: C.primary }} />
                <h4 className="font-bold mt-2" style={{ color: C.text }}>
                  Conducteur de travaux
                </h4>
                <div className="text-sm font-semibold mt-2" style={{ color: C.text }}>
                  —
                </div>
                <div className="space-y-2 mt-3 text-xs" style={{ color: C.textMuted }}>
                  <div className="flex items-center gap-2">
                    <Phone size={12} /> —
                  </div>
                </div>
              </div>
            </div>
          )}

          {tab === 'chantier' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="p-4 rounded" style={{ backgroundColor: C.bgSoft }}>
                  <MapPin size={18} style={{ color: C.primary }} />
                  <h4 className="font-bold text-sm mt-2" style={{ color: C.text }}>
                    Chantier
                  </h4>
                  <div className="text-sm mt-1" style={{ color: C.textMuted }}>
                    {affaire.chantier ?? '—'}
                  </div>
                </div>
                <div className="p-4 rounded" style={{ backgroundColor: C.bgSoft }}>
                  <Calendar size={18} style={{ color: C.primary }} />
                  <h4 className="font-bold text-sm mt-2" style={{ color: C.text }}>
                    Date livraison
                  </h4>
                  <div className="text-sm font-mono mt-1" style={{ color: C.text }}>
                    {affaire.date_livraison
                      ? new Date(affaire.date_livraison).toLocaleDateString('fr-FR', {
                          weekday: 'long',
                          day: '2-digit',
                          month: 'long',
                          year: 'numeric',
                        })
                      : '—'}
                  </div>
                </div>
                <div className="p-4 rounded" style={{ backgroundColor: C.bgSoft }}>
                  <UserCog size={18} style={{ color: C.primary }} />
                  <h4 className="font-bold text-sm mt-2" style={{ color: C.text }}>
                    Conducteur
                  </h4>
                  <div className="text-sm font-semibold mt-1" style={{ color: C.text }}>
                    —
                  </div>
                </div>
              </div>
            </div>
          )}

          {tab === 'heures' && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-4">
                <div className="text-xs uppercase tracking-wider font-bold" style={{ color: C.textMuted }}>
                  Répartition des heures
                </div>
                <Badge bg={C.accentSoft} color="#8B6914">Démo</Badge>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="p-3 rounded text-center" style={{ backgroundColor: '#E5EBE9' }}>
                  <div className="text-[10px] uppercase tracking-wider font-bold" style={{ color: C.primary }}>Heures DESSIN</div>
                  <div className="text-xl font-bold font-mono mt-1" style={{ color: C.primary }}>47,5h</div>
                  <div className="text-[10px] mt-0.5" style={{ color: C.textMuted }}>BEPE+BEPD+BEBA+BEAA+BECN</div>
                </div>
                <div className="p-3 rounded text-center" style={{ backgroundColor: C.warningSoft }}>
                  <div className="text-[10px] uppercase tracking-wider font-bold" style={{ color: '#8B6914' }}>Heures MACHINE</div>
                  <div className="text-xl font-bold font-mono mt-1" style={{ color: '#8B6914' }}>32,0h</div>
                  <div className="text-[10px] mt-0.5" style={{ color: C.textMuted }}>CADE + CACN</div>
                </div>
                <div className="p-3 rounded text-center" style={{ backgroundColor: C.successSoft }}>
                  <div className="text-[10px] uppercase tracking-wider font-bold" style={{ color: C.success }}>Heures MONTAGE</div>
                  <div className="text-xl font-bold font-mono mt-1" style={{ color: C.success }}>34,5h</div>
                  <div className="text-[10px] mt-0.5" style={{ color: C.textMuted }}>CAF+CATT+CAMF+CAMSP+CAPP</div>
                </div>
                <div className="p-3 rounded text-center" style={{ backgroundColor: C.infoSoft }}>
                  <div className="text-[10px] uppercase tracking-wider font-bold" style={{ color: C.info }}>AUTRES</div>
                  <div className="text-xl font-bold font-mono mt-1" style={{ color: C.info }}>6,0h</div>
                  <div className="text-[10px] mt-0.5" style={{ color: C.textMuted }}>CAC + CALI</div>
                </div>
              </div>
              <div className="p-4 rounded border" style={{ borderColor: C.border }}>
                <div className="text-xs uppercase tracking-wider font-bold mb-2" style={{ color: C.textMuted }}>Coût horaire de l'affaire</div>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  <div>
                    <div className="text-[10px]" style={{ color: C.textMuted }}>Total heures</div>
                    <div className="text-lg font-bold font-mono" style={{ color: C.text }}>120,0 h</div>
                  </div>
                  <div>
                    <div className="text-[10px]" style={{ color: C.textMuted }}>Montant HT / Total heures</div>
                    <div className="text-lg font-bold font-mono" style={{ color: C.primary }}>320,83 €/h</div>
                  </div>
                  <div>
                    <div className="text-[10px]" style={{ color: C.textMuted }}>Coût horaire prod seul</div>
                    <div className="text-lg font-bold font-mono" style={{ color: C.accent }}>534,72 €/h</div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {tab === 'pr' && (
            <div className="text-center py-8">
              <Calculator size={48} className="mx-auto mb-3" style={{ color: C.textMuted }} />
              <p className="text-sm" style={{ color: C.textMuted }}>
                Aucune pièce saisie pour cette affaire — le PR ne peut pas être calculé.
              </p>
              <Link
                to="/formulaire"
                className="mt-3 inline-flex items-center gap-1.5 px-3 py-2 rounded text-xs font-bold uppercase tracking-wider text-white"
                style={{ backgroundColor: C.accent }}
              >
                <ClipboardList size={12} />Saisir les pièces
              </Link>
            </div>
          )}

          {tab === 'livraisons' && (
            <div className="text-center py-8 text-sm" style={{ color: C.textMuted }}>
              Aucune livraison enregistrée pour cette affaire
            </div>
          )}

          {tab === 'photos' && (
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="text-xs uppercase tracking-wider font-bold" style={{ color: C.textMuted }}>
                  Galerie photos
                </div>
                <Badge bg={C.accentSoft} color="#8B6914">Démo</Badge>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                {([1,2,3,4,5,6,7,8] as const).map(i => (
                  <div key={i} className="aspect-video rounded overflow-hidden relative" style={{ backgroundColor: C.bgSoft }}>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Camera size={28} style={{ color: C.textLight }} />
                    </div>
                    <div className="absolute bottom-0 left-0 right-0 p-1.5 text-[9px] font-mono" style={{ backgroundColor: 'rgba(0,0,0,0.6)', color: 'white' }}>
                      {(['Dessin','Débit','Débit','Montage','Montage','Finition','Finition','Livraison'] as const)[i-1]} · 2025-1{i}-{10+i}
                    </div>
                  </div>
                ))}
              </div>
              <div className="text-center">
                <Btn variant="secondary" icon={Camera} title="à venir">+ Ajouter photos</Btn>
                <div className="text-xs mt-2" style={{ color: C.textMuted }}>
                  Galerie classée par étape · Galerie globale par typologie depuis le module Photos
                </div>
              </div>
            </div>
          )}

          {tab === 'documents' && (
            <div className="space-y-2">
              <div className="flex items-center gap-2 mb-4">
                <div className="text-xs uppercase tracking-wider font-bold" style={{ color: C.textMuted }}>
                  Documents affaire
                </div>
                <Badge bg={C.accentSoft} color="#8B6914">Démo</Badge>
              </div>
              {([
                { ico: FileText, label: 'Devis DEV-2026-042', date: '15/10/2025' },
                { ico: Calculator, label: 'Chiffrage CHF-2026-018', date: '10/10/2025' },
                { ico: FileSpreadsheet, label: 'PR initial Excel', date: '10/10/2025' },
                { ico: FileText, label: 'Bon de commande client', date: '20/10/2025' },
                { ico: PackageCheck, label: 'BL livraison LIV-2026-038', date: '22/12/2025' },
                { ico: Receipt, label: 'Facture FAC-2026-118', date: '25/04/2026' },
              ] as const).map((d, i) => (
                <div key={i} className="p-3 border rounded flex items-center gap-3 cursor-default" style={{ borderColor: C.border }}>
                  <d.ico size={18} style={{ color: C.primary }} />
                  <div className="flex-1 text-sm font-semibold" style={{ color: C.text }}>{d.label}</div>
                  <div className="text-xs font-mono" style={{ color: C.textMuted }}>{d.date}</div>
                  <Download size={14} style={{ color: C.textMuted }} />
                </div>
              ))}
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}

export default FicheAffairePage;
