import { useState } from 'react';
import { Plus, Trash2, ClipboardList, Calculator } from 'lucide-react';

import { PageHeader } from '../../components/ui/PageHeader';
import { Card } from '../../components/ui/Card';
import { Field } from '../../components/ui/Field';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { Btn } from '../../components/ui/Btn';
import { Badge } from '../../components/ui/Badge';
import { Spinner } from '../../components/ui/Spinner';
import { C } from '../../lib/theme';

import { useAffaires } from '../affaires/useAffaires';
import { useCatalogue } from './useCatalogue';
import { useTauxMO } from './useTauxMO';
import { usePieces, useCreatePiece, useDeletePiece } from './usePieces';
import { categories, famillesFor, matieresFor, pieceTotal } from './catalogue';
import type { Tables } from '../../lib/database.types';

type PieceRow = Tables<'pieces'>;

const eur = (n: number) => `${Math.round(n).toLocaleString('fr-FR')} €`;

// ---------------------------------------------------------------------------
// Formulaire Matière
// ---------------------------------------------------------------------------

function FormMatiere({ affaireId }: { affaireId: string }) {
  const { data: catalogue } = useCatalogue();
  const createPiece = useCreatePiece();

  const items = catalogue ?? [];
  const [cat, setCat] = useState('');
  const [famille, setFamille] = useState('');
  const [code, setCode] = useState('');
  const [nb, setNb] = useState('1');
  const [long, setLong] = useState('');
  const [larg, setLarg] = useState('');
  const [epai, setEpai] = useState('');

  const cats = categories(items);
  const familles = cat ? famillesFor(items, cat) : [];
  const matieres = cat && famille ? matieresFor(items, cat, famille) : [];
  const matiere = matieres.find((m) => m.code === code);

  function reset() {
    setCode('');
    setNb('1');
    setLong('');
    setLarg('');
    setEpai('');
  }

  function add() {
    if (!matiere) return;
    createPiece.mutate(
      {
        affaire_id: affaireId,
        type: cat || 'Matiere',
        ref1: matiere.code,
        designation: matiere.ref ?? matiere.code,
        matiere_code: matiere.code,
        nb: Number(nb) || 0,
        geometrie: 'standard',
        dimensions: {
          long: Number(long) || 0,
          larg: Number(larg) || 0,
          epai: Number(epai) || 0,
        },
        prix: Number(matiere.prix),
        unite: matiere.unite ?? undefined,
        pourcent_chute: matiere.chute,
      },
      { onSuccess: reset },
    );
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <Field label="Catégorie">
          <Select
            value={cat}
            onChange={(e) => {
              setCat(e.target.value);
              setFamille('');
              setCode('');
            }}
          >
            <option value="">—</option>
            {cats.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </Select>
        </Field>

        <Field label="Famille">
          <Select
            value={famille}
            disabled={!cat}
            onChange={(e) => {
              setFamille(e.target.value);
              setCode('');
            }}
          >
            <option value="">—</option>
            {familles.map((f) => (
              <option key={f} value={f}>
                {f}
              </option>
            ))}
          </Select>
        </Field>

        <Field label="Matière">
          <Select value={code} disabled={!famille} onChange={(e) => setCode(e.target.value)}>
            <option value="">—</option>
            {matieres.map((m) => (
              <option key={m.code} value={m.code}>
                {(m.ref ?? m.code) + ' — ' + m.prix + ' ' + (m.unite ?? '')}
              </option>
            ))}
          </Select>
        </Field>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Field label="Nb">
          <Input type="number" min="0" value={nb} onChange={(e) => setNb(e.target.value)} />
        </Field>
        <Field label="Longueur" hint="optionnel">
          <Input type="number" min="0" value={long} onChange={(e) => setLong(e.target.value)} />
        </Field>
        <Field label="Largeur" hint="optionnel">
          <Input type="number" min="0" value={larg} onChange={(e) => setLarg(e.target.value)} />
        </Field>
        <Field label="Épaisseur" hint="optionnel">
          <Input type="number" min="0" value={epai} onChange={(e) => setEpai(e.target.value)} />
        </Field>
      </div>

      <div className="flex items-center gap-3">
        <Btn icon={Plus} onClick={add} disabled={!matiere || createPiece.isPending}>
          Ajouter la pièce
        </Btn>
        {matiere && (
          <span className="text-xs" style={{ color: C.textMuted }}>
            Chute {matiere.chute}% · {matiere.prix} {matiere.unite ?? ''}
          </span>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Formulaire Main d'œuvre
// ---------------------------------------------------------------------------

function FormMO({ affaireId }: { affaireId: string }) {
  const { data: taux } = useTauxMO();
  const createPiece = useCreatePiece();

  const list = taux ?? [];
  const [code, setCode] = useState('');
  const [heures, setHeures] = useState('1');

  const t = list.find((x) => x.code === code);

  function add() {
    if (!t) return;
    createPiece.mutate(
      {
        affaire_id: affaireId,
        type: 'Main_Oeuvre',
        ref1: t.code,
        designation: t.des,
        nb: Number(heures) || 0,
        prix: Number(t.taux),
        pourcent_chute: 0,
      },
      { onSuccess: () => setHeures('1') },
    );
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <Field label="Code MO">
          <Select value={code} onChange={(e) => setCode(e.target.value)}>
            <option value="">—</option>
            {list.map((x) => (
              <option key={x.code} value={x.code}>
                {x.code + ' — ' + x.des + ' (' + x.taux + ' €/h)'}
              </option>
            ))}
          </Select>
        </Field>

        <Field label="Nb heures">
          <Input
            type="number"
            min="0"
            step="0.25"
            value={heures}
            onChange={(e) => setHeures(e.target.value)}
          />
        </Field>

        <Field label="Taux horaire">
          <Input value={t ? `${t.taux} €/h` : '—'} readOnly disabled />
        </Field>
      </div>

      <Btn icon={Plus} onClick={add} disabled={!t || createPiece.isPending}>
        Ajouter la MO
      </Btn>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Ligne de pièce (avec mini-confirm suppression inline)
// ---------------------------------------------------------------------------

function PieceLigne({ piece, affaireId }: { piece: PieceRow; affaireId: string }) {
  const deletePiece = useDeletePiece();
  const [confirm, setConfirm] = useState(false);
  const isMO = piece.type === 'Main_Oeuvre';

  return (
    <tr style={{ borderBottom: `1px solid ${C.borderSoft}` }}>
      <td className="px-4 py-3">
        <div className="font-semibold text-sm" style={{ color: C.text }}>
          {piece.designation ?? piece.ref1 ?? '—'}
        </div>
        <div className="text-[10px] uppercase tracking-wider mt-0.5" style={{ color: C.textMuted }}>
          {isMO ? 'Main d’œuvre' : piece.type}
        </div>
      </td>
      <td className="px-4 py-3 font-mono text-xs" style={{ color: C.textMuted }}>
        {piece.ref1 ?? '—'}
      </td>
      <td className="px-4 py-3 text-sm font-mono" style={{ color: C.text }}>
        {piece.nb}
        {isMO ? ' h' : ''}
      </td>
      <td className="px-4 py-3 text-sm font-mono" style={{ color: C.text }}>
        {piece.prix != null ? `${piece.prix} ${piece.unite ?? (isMO ? '€/h' : '')}` : '—'}
      </td>
      <td className="px-4 py-3 text-sm font-mono" style={{ color: C.textMuted }}>
        {isMO ? '—' : `${piece.pourcent_chute}%`}
      </td>
      <td className="px-4 py-3 text-sm font-bold font-mono text-right" style={{ color: C.text }}>
        {eur(pieceTotal(piece))}
      </td>
      <td className="px-4 py-3 text-right">
        {confirm ? (
          <span className="inline-flex items-center gap-2">
            <Btn
              size="sm"
              variant="danger"
              onClick={() =>
                deletePiece.mutate(
                  { id: piece.id, affaireId },
                  { onSuccess: () => setConfirm(false) },
                )
              }
            >
              Oui
            </Btn>
            <Btn size="sm" variant="secondary" onClick={() => setConfirm(false)}>
              Non
            </Btn>
          </span>
        ) : (
          <Btn size="sm" variant="ghost" icon={Trash2} onClick={() => setConfirm(true)}>
            Supprimer
          </Btn>
        )}
      </td>
    </tr>
  );
}

// ---------------------------------------------------------------------------
// Liste des pièces + totaux
// ---------------------------------------------------------------------------

function ListePieces({ affaireId }: { affaireId: string }) {
  const { data: pieces, isLoading } = usePieces(affaireId);
  const list = (pieces ?? []) as PieceRow[];

  const totalMatieres = list
    .filter((p) => p.type !== 'Main_Oeuvre')
    .reduce((s, p) => s + pieceTotal(p), 0);
  const totalMO = list
    .filter((p) => p.type === 'Main_Oeuvre')
    .reduce((s, p) => s + pieceTotal(p), 0);
  const totalGeneral = totalMatieres + totalMO;

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Spinner />
      </div>
    );
  }

  return (
    <Card noPadding className="overflow-hidden">
      {list.length === 0 ? (
        <p className="p-6 text-sm" style={{ color: C.textMuted }}>
          Aucune pièce saisie pour cette affaire
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-sm">
            <thead style={{ backgroundColor: C.bgSoft }}>
              <tr>
                {['Type / Désignation', 'Réf', 'Nb', 'Prix unit.', 'Chute %', 'Total', ''].map(
                  (h, i) => (
                    <th
                      key={h || i}
                      className={`px-4 py-3 text-[10px] uppercase tracking-wider font-bold ${
                        h === 'Total' ? 'text-right' : 'text-left'
                      }`}
                      style={{ color: C.textMuted, borderBottom: `1px solid ${C.border}` }}
                    >
                      {h}
                    </th>
                  ),
                )}
              </tr>
            </thead>
            <tbody>
              {list.map((p) => (
                <PieceLigne key={p.id} piece={p} affaireId={affaireId} />
              ))}
            </tbody>
            <tfoot>
              <tr style={{ backgroundColor: C.bgSoft }}>
                <td colSpan={5} className="px-4 py-2.5 text-xs font-semibold text-right" style={{ color: C.textMuted }}>
                  Total matières
                </td>
                <td className="px-4 py-2.5 text-sm font-bold font-mono text-right" style={{ color: C.text }}>
                  {eur(totalMatieres)}
                </td>
                <td />
              </tr>
              <tr style={{ backgroundColor: C.bgSoft }}>
                <td colSpan={5} className="px-4 py-2.5 text-xs font-semibold text-right" style={{ color: C.textMuted }}>
                  Total MO
                </td>
                <td className="px-4 py-2.5 text-sm font-bold font-mono text-right" style={{ color: C.text }}>
                  {eur(totalMO)}
                </td>
                <td />
              </tr>
              <tr style={{ backgroundColor: C.primarySoft }}>
                <td colSpan={5} className="px-4 py-3 text-xs uppercase tracking-wider font-bold text-right" style={{ color: C.primary }}>
                  Total général
                </td>
                <td className="px-4 py-3 text-base font-bold font-mono text-right" style={{ color: C.primary }}>
                  {eur(totalGeneral)}
                </td>
                <td />
              </tr>
            </tfoot>
          </table>
        </div>
      )}
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function FormulairePage() {
  const { data: affaires } = useAffaires();
  const list = affaires ?? [];

  const [affaireId, setAffaireId] = useState('');
  const [mode, setMode] = useState<'matiere' | 'mo'>('matiere');

  // Défaut : 1ʳᵉ affaire dès que la liste est chargée
  const effectiveId = affaireId || (list[0]?.id ?? '');

  const { data: pieces } = usePieces(effectiveId || null);
  const pieceList = pieces ?? [];
  const totalGeneral = pieceList.reduce((s, p) => s + pieceTotal(p as PieceRow), 0);

  const subtitle =
    pieceList.length > 0
      ? `${pieceList.length} pièce${pieceList.length !== 1 ? 's' : ''} · Total ${eur(totalGeneral)}`
      : 'Saisie des pièces d’une affaire à partir du catalogue';

  if (list.length === 0) {
    return (
      <div className="space-y-5">
        <PageHeader section="Production" title="Formulaire" />
        <Card>
          <p className="text-sm" style={{ color: C.textMuted }}>
            Créez d&apos;abord une affaire pour saisir des pièces.
          </p>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <PageHeader section="Production" title="Formulaire" subtitle={subtitle} />

      <Card>
        <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto] gap-4 items-end">
          <Field label="Affaire">
            <Select value={effectiveId} onChange={(e) => setAffaireId(e.target.value)}>
              {list.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.numero} · {a.clients?.nom ?? '—'}
                </option>
              ))}
            </Select>
          </Field>

          {/* Toggle Matière / Main d'œuvre */}
          <div
            className="inline-flex rounded border overflow-hidden self-end"
            style={{ borderColor: C.border }}
          >
            <button
              type="button"
              onClick={() => setMode('matiere')}
              className="px-4 py-2 text-sm font-semibold flex items-center gap-1.5 transition-colors"
              style={{
                backgroundColor: mode === 'matiere' ? C.primary : 'white',
                color: mode === 'matiere' ? 'white' : C.text,
              }}
            >
              <ClipboardList size={14} />
              Matière
            </button>
            <button
              type="button"
              onClick={() => setMode('mo')}
              className="px-4 py-2 text-sm font-semibold flex items-center gap-1.5 transition-colors border-l"
              style={{
                backgroundColor: mode === 'mo' ? C.primary : 'white',
                color: mode === 'mo' ? 'white' : C.text,
                borderColor: C.border,
              }}
            >
              <Calculator size={14} />
              Main d&apos;œuvre
            </button>
          </div>
        </div>
      </Card>

      <Card>
        <div className="flex items-center gap-2 mb-4">
          <Badge bg={C.accentSoft} color={C.primary}>
            {mode === 'matiere' ? 'Nouvelle matière' : 'Nouvelle main d’œuvre'}
          </Badge>
        </div>
        {mode === 'matiere' ? (
          <FormMatiere affaireId={effectiveId} />
        ) : (
          <FormMO affaireId={effectiveId} />
        )}
      </Card>

      <ListePieces affaireId={effectiveId} />
    </div>
  );
}
