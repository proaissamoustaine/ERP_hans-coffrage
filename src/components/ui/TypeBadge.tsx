import { C } from '../../lib/theme';

export const MODE_CFG: Record<string, { l: string; label: string; c: string }> = {
  coffrage:  { l: 'C', label: 'COFFRAGE',  c: C.primary },
  prefa:     { l: 'P', label: 'PREFA',     c: '#7B6CB5' },
  mannequin: { l: 'M', label: 'MANNEQUIN', c: C.accent },
  usinage:   { l: 'U', label: 'USINAGE',   c: C.success },
  vente:     { l: 'V', label: 'VENTE',     c: C.info },
  sateba:    { l: 'S', label: 'SATEBA',    c: '#E07B5C' },
  decor:     { l: 'D', label: 'DÉCOR',     c: C.primaryLight },
  autre:     { l: 'A', label: 'AUTRE',     c: C.textMuted },
};

export function TypeBadge({ mode }: { mode: string | null }) {
  const cfg = MODE_CFG[mode ?? ''] ?? { l: '?', label: mode ?? '—', c: C.textMuted };
  return (
    <div className="flex items-center gap-2">
      <div
        className="w-7 h-7 rounded flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
        style={{ backgroundColor: cfg.c }}
      >
        {cfg.l}
      </div>
      <span className="text-[10px] font-semibold tracking-wider uppercase" style={{ color: C.textMuted }}>
        {cfg.label}
      </span>
    </div>
  );
}
