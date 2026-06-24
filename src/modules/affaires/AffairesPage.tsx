import { useState } from 'react';
import { CheckCircle2, Circle } from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Spinner } from '../../components/ui/Spinner';
import { C } from '../../lib/theme';
import type { Tables } from '../../lib/database.types';
import { ETAPES, calcAvancement } from '../../lib/etapes';
import { useAffaires } from './useAffaires';
import { useEtapes, useToggleEtape } from './useEtapes';

// Row type: base affaires row + joined clients relation
type AffaireRow = Tables<'affaires'> & { clients: { nom: string } | null };

const STATUT_CONFIG: Record<string, { color: string; bg: string }> = {
  'En cours':   { color: C.info,    bg: C.infoSoft },
  'Terminé':    { color: C.success, bg: C.successSoft },
  'En attente': { color: C.warning, bg: C.warningSoft },
};

function formatDate(iso: string | null): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('fr-FR');
}

// ─── Detail panel ────────────────────────────────────────────────────────────

type DetailPanelProps = { affaire: AffaireRow };

function DetailPanel({ affaire }: DetailPanelProps) {
  const { data: etapes, isLoading } = useEtapes(affaire.id);
  const toggleEtape = useToggleEtape();

  const etapesList = etapes ?? [];
  const avancement = calcAvancement(etapesList);

  return (
    <Card>
      {/* Panel header */}
      <div className="mb-4 flex items-start justify-between gap-4">
        <div>
          <h2 className="font-mono text-base font-bold" style={{ color: C.text }}>
            {affaire.numero}
          </h2>
          <p className="mt-0.5 text-sm" style={{ color: C.textMuted }}>
            {affaire.chantier ?? '—'}
          </p>
        </div>
        <span
          className="mt-0.5 inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold"
          style={{
            color: STATUT_CONFIG[affaire.statut ?? '']?.color ?? C.textMuted,
            backgroundColor: STATUT_CONFIG[affaire.statut ?? '']?.bg ?? C.bgSoft,
          }}
        >
          {affaire.statut ?? '—'}
        </span>
      </div>

      {/* Avancement bar */}
      <div className="mb-4">
        <div className="mb-1 flex items-center justify-between text-xs" style={{ color: C.textMuted }}>
          <span>Avancement</span>
          <span className="font-semibold" style={{ color: C.text }}>{avancement} %</span>
        </div>
        <div
          className="h-2 w-full overflow-hidden rounded-full"
          style={{ backgroundColor: C.bgSoft }}
        >
          <div
            className="h-full rounded-full transition-all"
            style={{ width: `${avancement}%`, backgroundColor: C.primary }}
          />
        </div>
      </div>

      {/* Timeline */}
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
                  className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm transition hover:bg-opacity-60"
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
                    className="flex-1 font-medium"
                    style={{ color: fait ? C.success : C.text }}
                  >
                    {label}
                  </span>
                  <span className="text-xs tabular-nums" style={{ color: C.textMuted }}>
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

// ─── Main page ────────────────────────────────────────────────────────────────

export function AffairesPage() {
  const { data: affaires, isLoading, error } = useAffaires();
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const selectedAffaire =
    selectedId && affaires
      ? (affaires as AffaireRow[]).find((a) => a.id === selectedId) ?? null
      : null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold" style={{ color: C.text }}>
          Affaires
        </h1>
        <p className="mt-1 text-sm" style={{ color: C.textMuted }}>
          Suivi de la production et avancement des chantiers
        </p>
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
      {!isLoading && !error && affaires && (
        <div className="flex flex-col gap-6 xl:flex-row">
          {/* Table */}
          <div className="min-w-0 flex-1">
            <Card className="overflow-hidden p-0">
              {affaires.length === 0 ? (
                <p className="p-6 text-sm" style={{ color: C.textMuted }}>
                  Aucune affaire
                </p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr style={{ backgroundColor: C.bgSoft, borderBottom: `1px solid ${C.border}` }}>
                        {['N° affaire', 'Client', 'Chantier', 'Statut', 'Avancement'].map((col) => (
                          <th
                            key={col}
                            className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide"
                            style={{ color: C.textMuted }}
                          >
                            {col}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {(affaires as AffaireRow[]).map((a, i) => {
                        const isSelected = a.id === selectedId;
                        return (
                          <tr
                            key={a.id}
                            className="cursor-pointer transition"
                            style={{
                              backgroundColor: isSelected
                                ? C.primarySoft
                                : i % 2 === 0
                                  ? C.bg
                                  : C.bgWarm,
                              borderBottom: `1px solid ${C.borderSoft}`,
                            }}
                            onClick={() =>
                              setSelectedId(isSelected ? null : a.id)
                            }
                          >
                            {/* N° affaire — monospace */}
                            <td
                              className="px-4 py-3 font-mono font-medium"
                              style={{ color: C.text }}
                            >
                              {a.numero}
                            </td>
                            {/* Client */}
                            <td className="px-4 py-3" style={{ color: C.textMuted }}>
                              {a.clients?.nom ?? '—'}
                            </td>
                            {/* Chantier */}
                            <td className="px-4 py-3" style={{ color: C.textMuted }}>
                              {a.chantier ?? '—'}
                            </td>
                            {/* Statut */}
                            <td className="px-4 py-3">
                              <span
                                className="inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold"
                                style={{
                                  color: STATUT_CONFIG[a.statut ?? '']?.color ?? C.textMuted,
                                  backgroundColor: STATUT_CONFIG[a.statut ?? '']?.bg ?? C.bgSoft,
                                }}
                              >
                                {a.statut ?? '—'}
                              </span>
                            </td>
                            {/* Avancement bar */}
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-2">
                                <div
                                  className="h-1.5 w-24 overflow-hidden rounded-full"
                                  style={{ backgroundColor: C.bgSoft }}
                                >
                                  <div
                                    className="h-full rounded-full"
                                    style={{
                                      width: `${a.avancement}%`,
                                      backgroundColor: C.primary,
                                    }}
                                  />
                                </div>
                                <span
                                  className="text-xs tabular-nums"
                                  style={{ color: C.textMuted }}
                                >
                                  {a.avancement} %
                                </span>
                              </div>
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

          {/* Detail panel */}
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
