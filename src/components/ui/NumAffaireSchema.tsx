import { FileText } from 'lucide-react';
import { C } from '../../lib/theme';
import { decodeNumero } from '../../lib/numero';

type Block =
  | { sep: true }
  | { sep?: false; txt: string; lbl: string; col: string; soft: string; hint: string };

type NumAffaireSchemaProps = { id: string; compact?: boolean };

export function NumAffaireSchema({ id, compact = false }: NumAffaireSchemaProps) {
  // Découpe : C / 25 / - / 1020 / - / 03 / D / - / 02 (via decodeNumero)
  const decoded = decodeNumero(id);
  if (!decoded) return <span className="font-mono">{id}</span>;
  const { lettre, annee, mmjj, nn, version, element } = decoded;

  const blocks: Block[] = [
    { txt: lettre, lbl: 'Type', col: C.danger, soft: C.dangerSoft, hint: 'C/P/M/U/V/S/A' },
    { txt: annee, lbl: 'Année', col: C.primary, soft: C.primarySoft, hint: 'AA' },
    { sep: true },
    { txt: mmjj, lbl: 'Date', col: C.primary, soft: C.primarySoft, hint: 'MMJJ' },
    { sep: true },
    { txt: nn, lbl: 'N° du jour', col: '#8B6914', soft: C.warningSoft, hint: 'NN' },
    ...(version
      ? [{ txt: version, lbl: 'Version devis', col: C.success, soft: C.successSoft, hint: 'A/B/C/D' } as Block]
      : []),
    ...(element
      ? [
          { sep: true } as Block,
          { txt: element, lbl: 'N° élément', col: C.primaryDark, soft: C.primarySoft, hint: '-NN' } as Block,
        ]
      : []),
  ];

  if (compact) {
    return (
      <div className="inline-flex items-center gap-0.5 font-mono">
        {blocks.map((b, i) =>
          b.sep ? (
            <span key={i} style={{ color: C.textMuted }}>
              -
            </span>
          ) : (
            <span
              key={i}
              className="px-1 py-0.5 rounded text-xs font-bold"
              style={{ backgroundColor: b.soft, color: b.col }}
            >
              {b.txt}
            </span>
          ),
        )}
      </div>
    );
  }

  return (
    <div className="rounded-lg border p-4" style={{ borderColor: C.border, backgroundColor: 'white' }}>
      <div
        className="text-[10px] uppercase tracking-wider font-bold mb-3 flex items-center gap-2"
        style={{ color: C.textMuted }}
      >
        <FileText size={12} /> Anatomie du n° d'affaire
      </div>
      <div className="flex items-center justify-center gap-1 flex-wrap mb-3">
        {blocks.map((b, i) =>
          b.sep ? (
            <span key={i} className="font-mono text-xl font-bold" style={{ color: C.textMuted }}>
              -
            </span>
          ) : (
            <div key={i} className="flex flex-col items-center">
              <div
                className="px-3 py-2 rounded font-mono text-lg font-bold border-2"
                style={{ backgroundColor: b.soft, color: b.col, borderColor: b.col }}
              >
                {b.txt}
              </div>
              <div
                className="mt-1.5 px-2 py-0.5 rounded text-[9px] uppercase tracking-wider font-bold text-white"
                style={{ backgroundColor: b.col }}
              >
                {b.lbl}
              </div>
              <div className="text-[9px] mt-0.5 italic" style={{ color: C.textMuted }}>
                {b.hint}
              </div>
            </div>
          ),
        )}
      </div>
      <div
        className="text-[10px] text-center pt-2 border-t"
        style={{ borderColor: C.border, color: C.textMuted }}
      >
        <strong style={{ color: C.text }}>Règle d'or :</strong> un dossier = un seul n° racine, qui s'enrichit
        d'indices au fil des versions et des éléments, et ne se perd jamais.
      </div>
    </div>
  );
}

export default NumAffaireSchema;
