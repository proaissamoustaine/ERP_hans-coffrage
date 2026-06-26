import { C } from '../../lib/theme';

export const STATUT_BG: Record<string, { bg: string; color: string }> = {
  'En cours':   { bg: C.warningSoft,   color: '#8B6914' },
  'Terminé':    { bg: C.successSoft,   color: '#1E5C42' },
  'Soldé':      { bg: C.successSoft,   color: '#1E5C42' },
  'En attente': { bg: '#F0F0F0',       color: '#888' },
  'Livré':      { bg: C.bgSoft,        color: '#6B5B2C' },
  'Montage':    { bg: C.primarySoft,   color: C.primary },
  'Finition':   { bg: C.successSoft,   color: '#1E5C42' },
  'Dessin':     { bg: C.warningSoft,   color: '#8B6914' },
};

export function statutStyle(statut: string | null) {
  return STATUT_BG[statut ?? ''] ?? { bg: '#F0F0F0', color: '#666' };
}

export function StatusBadge({ statut }: { statut: string | null }) {
  const { bg, color } = statutStyle(statut);
  return (
    <span
      className="inline-block rounded-full px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider"
      style={{ color, backgroundColor: bg }}
    >
      {statut ?? '—'}
    </span>
  );
}
