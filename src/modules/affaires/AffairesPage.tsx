import { useState } from 'react';
import {
  Briefcase,
  TrendingUp,
  CheckCircle2,
  Clock,
  Download,
  Plus,
  Search,
  ChevronRight,
  Circle,
  Check,
} from 'lucide-react';

import { PageHeader } from '../../components/ui/PageHeader';
import { KPI } from '../../components/ui/KPI';
import { Card } from '../../components/ui/Card';
import { Btn } from '../../components/ui/Btn';
import { Spinner } from '../../components/ui/Spinner';
import { ProgressBar } from '../../components/ui/ProgressBar';
import { TypeBadge } from '../../components/ui/TypeBadge';
import { StatusBadge, statutStyle } from '../../components/ui/StatusBadge';
import { formatDate } from '../../lib/format';
import { C } from '../../lib/theme';
import type { Tables } from '../../lib/database.types';
import { ETAPES, calcAvancement } from '../../lib/etapes';
import { useAffaires } from './useAffaires';
import { useEtapes, useToggleEtape } from './useEtapes';

// Row type: base affaires row + joined clients relation
type AffaireRow = Tables<'affaires'> & { clients: { nom: string } | null };

// ---------------------------------------------------------------------------
// Detail / timeline panel (existing functionality, kept intact)
// ---------------------------------------------------------------------------

type DetailPanelProps = { affaire: AffaireRow };

function DetailPanel({ affaire }: DetailPanelProps) {
  const { data: etapes, isLoading } = useEtapes(affaire.id);
  const toggleEtape = useToggleEtape();

  const etapesList = etapes ?? [];
  const avancement = calcAvancement(etapesList);
  const { bg: sBg, color: sColor } = statutStyle(affaire.statut);

  return (
    <Card>
      {/* Panel header */}
      <div className="mb-4 flex items-start justify-between gap-4">
        <div>
          <h2 className="font-mono text-base font-bold" style={{ color: C.text }}>
            {affaire.numero}
          </h2>
          <p className="mt-0.5 text-xs" style={{ color: C.textMuted }}>
            {affaire.clients?.nom ?? '—'} · {affaire.chantier ?? '—'}
          </p>
        </div>
        <span
          className="mt-0.5 inline-block rounded-full px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider"
          style={{ color: sColor, backgroundColor: sBg }}
        >
          {affaire.statut ?? '—'}
        </span>
      </div>

      {/* Avancement bar */}
      <div className="mb-5">
        <div className="mb-1 flex items-center justify-between text-xs" style={{ color: C.textMuted }}>
          <span className="uppercase tracking-wider text-[10px] font-semibold">Avancement</span>
          <span className="font-bold font-mono" style={{ color: C.text }}>{avancement} %</span>
        </div>
        <ProgressBar value={avancement} height={6} />
      </div>

      {/* Timeline — 11 étapes */}
      {isLoading ? (
        <div className="flex justify-center py-6">
          <Spinner />
        </div>
      ) : (
        <ul className="space-y-1">
          {ETAPES.map(({ cle, label }) => {
            const row = etapesList.find((e) => e.etape === cle);
            const fait = row?.fait ?? false;

            return (
              <li key={cle}>
                <button
                  className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm transition hover:opacity-80"
                  style={{ backgroundColor: fait ? C.successSoft : 'transparent' }}
                  onClick={() => {
                    if (row) {
                      toggleEtape.mutate({
                        etapeId: row.id,
                        fait: !row.fait,
                        affaireId: affaire.id,
                        etapes: etapesList.map((e) => ({ id: e.id, fait: e.fait })),
                      });
                    }
                  }}
                  disabled={!row}
                >
                  {fait ? (
                    <CheckCircle2 size={16} style={{ color: C.success, flexShrink: 0 }} />
                  ) : (
                    <Circle size={16} style={{ color: C.textLight, flexShrink: 0 }} />
                  )}
                  <span
                    className="flex-1 font-medium text-xs"
                    style={{ color: fait ? C.success : C.text }}
                  >
                    {label}
                  </span>
                  <span className="text-[10px] tabular-nums" style={{ color: C.textMuted }}>
                    {formatDate(row?.date ?? null)}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Main page
// ---------------------------------------------------------------------------

export function AffairesPage() {
  const { data: affaires, isLoading, error } = useAffaires();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  const list = (affaires ?? []) as AffaireRow[];

  const filtered = search.trim()
    ? list.filter((a) => {
        const q = search.toLowerCase();
        return (
          (a.numero ?? '').toLowerCase().includes(q) ||
          (a.clients?.nom ?? '').toLowerCase().includes(q) ||
          (a.chantier ?? '').toLowerCase().includes(q)
        );
      })
    : list;

  const selectedAffaire = selectedId
    ? list.find((a) => a.id === selectedId) ?? null
    : null;

  // KPI values
  const totalHT = list.reduce((s, a) => s + (a.total_ht ?? 0), 0);
  const nbEnCours = list.filter((a) => a.statut === 'En cours').length;
  const nbTermines = list.filter((a) => a.statut === 'Terminé' || a.statut === 'Soldé').length;

  return (
    <div className="space-y-5">
      {/* Page header — section "Commercial" matches the mockup PageAffaires */}
      <PageHeader
        section="Commercial"
        title="Affaires"
        subtitle={`${list.length} affaire${list.length !== 1 ? 's' : ''} actives · CA cumulé ${(totalHT / 1000).toFixed(1)} k€`}
        actions={
          <>
            <Btn variant="secondary" icon={Download}>
              Export
            </Btn>
            <Btn icon={Plus}>
              Nouvelle affaire
            </Btn>
          </>
        }
      />

      {/* KPI row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
        <KPI
          icon={Briefcase}
          label="Affaires"
          value={String(list.length)}
          color={C.primary}
        />
        <KPI
          icon={TrendingUp}
          label="CA 2025"
          value={`${(totalHT / 1000).toFixed(0)} k€`}
          color={C.accent}
        />
        <KPI
          icon={Clock}
          label="En cours"
          value={String(nbEnCours)}
          color={C.warning}
        />
        <KPI
          icon={Check}
          label="Terminées"
          value={String(nbTermines)}
          color={C.success}
        />
      </div>

      {/* Loading */}
      {isLoading && (
        <div className="flex justify-center py-12">
          <Spinner />
        </div>
      )}

      {/* Error */}
      {error && (
        <Card>
          <p className="text-sm font-medium" style={{ color: C.danger }}>
            Impossible de charger les affaires : {(error as Error).message}
          </p>
        </Card>
      )}

      {/* Content */}
      {!isLoading && !error && (
        <div className="flex flex-col gap-6 xl:flex-row">
          {/* Left: table card */}
          <div className="min-w-0 flex-1">
            <Card noPadding className="overflow-hidden">
              {/* Search bar */}
              <div
                className="px-5 py-3 border-b flex items-center gap-3"
                style={{ borderColor: C.border }}
              >
                <div
                  className="flex-1 flex items-center gap-2 px-3 py-2 rounded border"
                  style={{ borderColor: C.border }}
                >
                  <Search size={14} style={{ color: C.textMuted }} />
                  <input
                    className="flex-1 outline-none text-sm bg-transparent"
                    placeholder="Rechercher (n°, client, chantier)…"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    style={{ color: C.text }}
                  />
                </div>
              </div>

              {/* Empty state */}
              {filtered.length === 0 && (
                <p className="p-6 text-sm" style={{ color: C.textMuted }}>
                  {list.length === 0 ? 'Aucune affaire' : 'Aucun résultat'}
                </p>
              )}

              {/* Table — matches mockup columns: N°, Type, Client/Chantier, Avancement, Statut, Montant HT, Livraison */}
              {filtered.length > 0 && (
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[700px] text-sm">
                    <thead style={{ backgroundColor: C.bgSoft }}>
                      <tr>
                        {[
                          'N° Affaire',
                          'Type',
                          'Client / Chantier',
                          'Avancement',
                          'Statut',
                          'Montant HT',
                          'Livraison',
                          '',
                        ].map((h) => (
                          <th
                            key={h}
                            className="text-left px-4 py-3 text-[10px] uppercase tracking-wider font-bold"
                            style={{ color: C.textMuted, borderBottom: `1px solid ${C.border}` }}
                          >
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {filtered.map((a) => {
                        const isSelected = a.id === selectedId;
                        return (
                          <tr
                            key={a.id}
                            className="cursor-pointer transition-colors hover:bg-stone-50"
                            style={{
                              backgroundColor: isSelected ? C.primarySoft : 'transparent',
                              borderBottom: `1px solid ${C.borderSoft}`,
                            }}
                            onClick={() => setSelectedId(isSelected ? null : a.id)}
                          >
                            {/* N° affaire */}
                            <td className="px-4 py-3 font-mono text-sm font-bold" style={{ color: C.primary }}>
                              {a.numero}
                            </td>
                            {/* Type badge */}
                            <td className="px-4 py-3">
                              <TypeBadge mode={a.mode} />
                            </td>
                            {/* Client / Chantier */}
                            <td className="px-4 py-3">
                              <div className="font-semibold text-sm" style={{ color: C.text }}>
                                {a.clients?.nom ?? '—'}
                              </div>
                              <div className="text-xs" style={{ color: C.textMuted }}>
                                {a.chantier ?? '—'}
                              </div>
                            </td>
                            {/* Avancement */}
                            <td className="px-4 py-3 w-32">
                              <div
                                className="text-[10px] mb-1 font-mono font-semibold"
                                style={{ color: C.textMuted }}
                              >
                                {a.avancement ?? 0}%
                              </div>
                              <ProgressBar value={a.avancement ?? 0} height={4} />
                            </td>
                            {/* Statut */}
                            <td className="px-4 py-3">
                              <StatusBadge statut={a.statut} />
                            </td>
                            {/* Montant HT */}
                            <td className="px-4 py-3 text-sm font-bold font-mono" style={{ color: C.text }}>
                              {(a.total_ht ?? 0).toLocaleString('fr-FR')} €
                            </td>
                            {/* Livraison */}
                            <td className="px-4 py-3 text-xs font-mono" style={{ color: C.textMuted }}>
                              {formatDate(a.date_livraison)}
                            </td>
                            {/* Chevron */}
                            <td className="px-4 py-3">
                              <ChevronRight size={14} style={{ color: C.textMuted }} />
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </Card>
          </div>

          {/* Right: detail / timeline panel */}
          {selectedAffaire && (
            <div className="w-full xl:w-80 xl:flex-shrink-0">
              <DetailPanel affaire={selectedAffaire} />
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default AffairesPage;
