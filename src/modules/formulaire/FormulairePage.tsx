import { useEffect, useState } from 'react';
import {
  Plus,
  Pencil,
  Trash2,
  Check,
  CheckCircle2,
  Eraser,
  Printer,
  ClipboardList,
  AlertTriangle,
} from 'lucide-react';

import { Badge } from '../../components/ui/Badge';
import { Spinner } from '../../components/ui/Spinner';
import { C } from '../../lib/theme';

import { useAuth } from '../../auth/AuthProvider';
import { useAffaires } from '../affaires/useAffaires';
import { useEtapes } from '../affaires/useEtapes';
import { useCatalogue } from './useCatalogue';
import { useTauxMO } from './useTauxMO';
import {
  usePieces,
  useCreatePiece,
  useDeletePiece,
  useUpdatePiece,
  useTogglePieceFait,
  useValiderFormulaire,
} from './usePieces';
import { famillesFor, matieresFor } from './catalogue';
import type { PieceInput } from './pieceSchema';
import type { Tables } from '../../lib/database.types';

type PieceRow = Tables<'pieces'>;

// ---------------------------------------------------------------------------
// Helpers recopiés de la maquette (App.jsx)
// ---------------------------------------------------------------------------

// Types de matière (catalogues) avec préfixe pour calcul auto de chute.
// `matCat` correspond au champ `cat` du catalogue pour le filtrage du dropdown Réf_1.
const TYPES_MATIERE = [
  { id: 'CP_Filme', label: 'CP_Filmé', matCat: 'CP_Filmé', prefixe: 'P' },
  { id: 'CP_Resineux_Autre', label: 'CP_Résineux_Autre', matCat: 'CP_Résineux_Autre', prefixe: 'P' },
  { id: 'Bois_Resineux_Ayous', label: 'Bois_Résineux_Ayous', matCat: 'Bois_Résineux_Ayous', prefixe: 'P' },
  { id: 'Accessoires', label: 'Accessoires', matCat: 'Accessoires', prefixe: 'A' },
  { id: 'Visserie', label: 'Visserie', matCat: 'Visserie', prefixe: 'X' },
  { id: 'Divers', label: 'Divers', matCat: 'Divers', prefixe: 'X' },
  { id: 'Hors_liste', label: 'Hors liste', matCat: 'Hors_liste', prefixe: 'A' },
  { id: 'Main_Oeuvre', label: "Main d'œuvre", matCat: 'Main_Oeuvre', prefixe: 'MO' },
] as const;

// Liste des 4 machines (onglet Liste_autres cellules E10-E13 de l'Excel).
const MACHINES_FORMULAIRE = [
  { id: 'STD', label: 'Standards' },
  { id: 'CN1000', label: 'CN 1000+' },
  { id: 'CN3', label: 'CN 3 axes' },
  { id: 'CN5', label: 'CN 5 axes' },
] as const;

// Onglets de géométrie (TYPES_DEBIT de la maquette).
const TYPES_DEBIT = [
  { id: 'standard', label: 'Standard', desc: 'Rectangle simple' },
  { id: 'type1', label: 'Type 1', desc: 'Trapèze symétrique (arrondi)' },
  { id: 'type2', label: 'Type 2', desc: 'Trapèze asymétrique' },
  { id: 'type3', label: 'Type 3', desc: 'Avec rives (chants)' },
] as const;

// Sections de transcription (colonne droite). La MO n'a pas de schéma.
const SECTIONS = [
  { geom: 'standard', label: 'Standard' },
  { geom: 'type1', label: 'Type_1' },
  { geom: 'type2', label: 'Type_2' },
  { geom: 'type3', label: 'Type_3' },
  { geom: 'mo', label: "Main d'œuvre" },
] as const;

// ---------------------------------------------------------------------------
// État du formulaire (mirror FORM_INITIAL de la maquette)
// ---------------------------------------------------------------------------

type Dimensions = Record<string, number | string | null | undefined>;

type FormState = {
  type: string;
  ref1: string;
  ref2: string;
  sectionFinie: string;
  designation: string;
  prix: number | null;
  unite: string;
  codeUnite: number | null;
  chute: number;
  nb: number;
  nbHeures: number;
  infosCompl: string;
  machines: string;
  geometrie: string;
  dimensions: Dimensions;
};

const FORM_INITIAL: FormState = {
  type: '',
  ref1: '',
  ref2: '',
  sectionFinie: '',
  designation: '',
  prix: null,
  unite: '',
  codeUnite: null,
  chute: 0,
  nb: 1,
  nbHeures: 1,
  infosCompl: '',
  machines: 'STD',
  geometrie: 'standard',
  dimensions: {},
};

// ---------------------------------------------------------------------------
// Champs de saisie réutilisables pour les dimensions (typés, top-level)
// ---------------------------------------------------------------------------

function DimNumberField({
  label,
  value,
  onChange,
  suffix = 'mm',
  readOnly = false,
}: {
  label: string;
  value: number | string | null | undefined;
  onChange?: (v: number | null) => void;
  suffix?: string;
  readOnly?: boolean;
}) {
  return (
    <div className="min-w-0">
      <label
        className="text-[10px] uppercase tracking-wider font-bold block mb-1 leading-tight whitespace-normal break-words"
        style={{ color: C.textMuted }}
      >
        {label}
      </label>
      <div className="flex items-center gap-1">
        <input
          type="number"
          value={value ?? ''}
          onChange={
            readOnly || !onChange
              ? undefined
              : (e) => onChange(e.target.value === '' ? null : parseFloat(e.target.value))
          }
          readOnly={readOnly}
          className={`flex-1 min-w-0 px-2 py-1.5 border rounded text-sm font-mono ${
            readOnly ? 'bg-gray-50' : ''
          }`}
          style={{ borderColor: C.border }}
        />
        {suffix && (
          <span className="text-xs shrink-0" style={{ color: C.textMuted }}>
            {suffix}
          </span>
        )}
      </div>
    </div>
  );
}

function DimTextField({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: number | string | null | undefined;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <div className="min-w-0">
      <label
        className="text-[10px] uppercase tracking-wider font-bold block mb-1 leading-tight whitespace-normal break-words"
        style={{ color: C.textMuted }}
      >
        {label}
      </label>
      <input
        type="text"
        value={value ?? ''}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full px-2 py-1.5 border rounded text-sm"
        style={{ borderColor: C.border }}
      />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Helpers d'affichage
// ---------------------------------------------------------------------------

const fmtDate = (iso: string | null | undefined) =>
  iso ? new Date(iso).toLocaleDateString('fr-FR') : '—';

const dimStr = (d: Dimensions, key: string): string | number => {
  const v = d[key];
  return v == null || v === '' ? '–' : (v as string | number);
};

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function FormulairePage() {
  const { profil } = useAuth();
  const { data: affaires } = useAffaires();
  const { data: catalogue } = useCatalogue();
  const { data: tauxMO } = useTauxMO();

  const affairesList = affaires ?? [];
  const items = catalogue ?? [];
  const tauxList = tauxMO ?? [];

  const [affaireId, setAffaireId] = useState('');
  const effectiveId = affaireId || (affairesList[0]?.id ?? '');
  const affaire = affairesList.find((a) => a.id === effectiveId);

  const { data: piecesData, isLoading: piecesLoading } = usePieces(effectiveId || null);
  const pieces = (piecesData ?? []) as PieceRow[];

  // Étapes de l'affaire → état de validation de la fiche atelier (étape `saisie_pieces`)
  const { data: etapes } = useEtapes(effectiveId || null);
  const saisiePiecesEtape = (etapes ?? []).find((e) => e.etape === 'saisie_pieces');
  const ficheValidee = !!saisiePiecesEtape?.fait;

  const createPiece = useCreatePiece();
  const updatePiece = useUpdatePiece();
  const deletePiece = useDeletePiece();
  const togglePieceFait = useTogglePieceFait();
  const valider = useValiderFormulaire();

  const [form, setForm] = useState<FormState>(FORM_INITIAL);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [confirmClearAll, setConfirmClearAll] = useState(false);
  const [confirmValidation, setConfirmValidation] = useState(false);

  const updateForm = (patch: Partial<FormState>) => setForm((prev) => ({ ...prev, ...patch }));

  // Reset du formulaire au changement d'affaire
  useEffect(() => {
    setForm(FORM_INITIAL);
    setEditingId(null);
    setConfirmDelete(null);
  }, [effectiveId]);

  const typeMatiere = TYPES_MATIERE.find((t) => t.id === form.type);
  const isMO = form.type === 'Main_Oeuvre';

  // Cascade : Réf_1 = familles de la catégorie, Réf_2 = matières de (cat, famille)
  const ref1Options = typeMatiere ? famillesFor(items, typeMatiere.matCat) : [];
  const ref2Options = typeMatiere && form.ref1 ? matieresFor(items, typeMatiere.matCat, form.ref1) : [];
  const selectedRef2 = ref2Options.find((m) => m.code === form.ref2);

  const dim = form.dimensions;
  const setDim = (patch: Dimensions) => updateForm({ dimensions: { ...dim, ...patch } });

  // ---------------------------------------------------------------------------
  // Champs de géométrie (fidèle à renderGeometrieFields)
  // ---------------------------------------------------------------------------
  const renderGeometrieFields = () => {
    if (form.geometrie === 'standard') {
      return (
        <div className="grid grid-cols-2 gap-3">
          <DimNumberField label="Longueur" value={dim.long} onChange={(v) => setDim({ long: v })} />
          <DimNumberField label="Largeur" value={dim.larg} onChange={(v) => setDim({ larg: v })} />
          <DimNumberField label="Épaisseur" value={dim.epai} onChange={(v) => setDim({ epai: v })} />
        </div>
      );
    }
    if (form.geometrie === 'type1') {
      return (
        <div className="grid grid-cols-3 gap-3">
          <DimNumberField label="Longueur A" value={dim.longA} onChange={(v) => setDim({ longA: v })} />
          <DimNumberField label="Longueur B" value={dim.longB} onChange={(v) => setDim({ longB: v })} />
          <DimNumberField label="Largeur" value={dim.larg} onChange={(v) => setDim({ larg: v })} />
          <DimNumberField label="Épaisseur (auto)" value={dim.epai} onChange={(v) => setDim({ epai: v })} />
          <DimNumberField label="Angle G (larg)" value={dim.angleGLarg} onChange={(v) => setDim({ angleGLarg: v })} />
          <DimNumberField label="Angle G (ep)" value={dim.angleGEp} onChange={(v) => setDim({ angleGEp: v })} />
          <div />
          <DimNumberField label="Angle D (larg)" value={dim.angleDLarg} onChange={(v) => setDim({ angleDLarg: v })} />
          <DimNumberField label="Angle D (ep)" value={dim.angleDEp} onChange={(v) => setDim({ angleDEp: v })} />
        </div>
      );
    }
    if (form.geometrie === 'type2') {
      return (
        <div className="grid grid-cols-3 gap-3">
          <DimNumberField label="Longueur" value={dim.long} onChange={(v) => setDim({ long: v })} />
          <DimNumberField label="Largeur G" value={dim.largG} onChange={(v) => setDim({ largG: v })} />
          <DimNumberField label="Largeur D" value={dim.largD} onChange={(v) => setDim({ largD: v })} />
          <DimNumberField label="Épaisseur (auto)" value={dim.epai} onChange={(v) => setDim({ epai: v })} />
          <DimNumberField label="Angle G (larg)" value={dim.angleGLarg} onChange={(v) => setDim({ angleGLarg: v })} />
          <DimNumberField label="Angle G (ep)" value={dim.angleGEp} onChange={(v) => setDim({ angleGEp: v })} />
          <DimNumberField label="Angle D (larg)" value={dim.angleDLarg} onChange={(v) => setDim({ angleDLarg: v })} />
          <DimNumberField label="Angle D (ep)" value={dim.angleDEp} onChange={(v) => setDim({ angleDEp: v })} />
        </div>
      );
    }
    if (form.geometrie === 'type3') {
      return (
        <div className="grid grid-cols-3 gap-3">
          <DimNumberField label="Longueur" value={dim.long} onChange={(v) => setDim({ long: v })} />
          <DimNumberField label="Largeur" value={dim.larg} onChange={(v) => setDim({ larg: v })} />
          <DimNumberField label="Épaisseur (auto)" value={dim.epai} onChange={(v) => setDim({ epai: v })} />
          <DimNumberField label="Angle G (larg)" value={dim.angleGLarg} onChange={(v) => setDim({ angleGLarg: v })} />
          <DimNumberField label="Angle G (ep)" value={dim.angleGEp} onChange={(v) => setDim({ angleGEp: v })} />
          <div />
          <DimNumberField label="Angle D (larg)" value={dim.angleDLarg} onChange={(v) => setDim({ angleDLarg: v })} />
          <DimNumberField label="Angle D (ep)" value={dim.angleDEp} onChange={(v) => setDim({ angleDEp: v })} />
          <div />
          <DimTextField label="Rive 1" value={dim.rive1} onChange={(v) => setDim({ rive1: v })} placeholder="R15" />
          <DimTextField label="Rive 2" value={dim.rive2} onChange={(v) => setDim({ rive2: v })} placeholder="R20" />
        </div>
      );
    }
    return null;
  };

  // ---------------------------------------------------------------------------
  // Édition : recharge une pièce existante dans le formulaire
  // ---------------------------------------------------------------------------
  const loadPiece = (p: PieceRow) => {
    const isMoPiece = p.type === 'Main_Oeuvre';
    setForm({
      type: p.type,
      ref1: p.ref1 ?? '',
      ref2: p.ref2 ?? '',
      sectionFinie: p.section_finie ?? '',
      designation: p.designation ?? '',
      prix: p.prix,
      unite: p.unite ?? '',
      codeUnite: null,
      chute: p.pourcent_chute ?? 0,
      nb: isMoPiece ? 1 : p.nb,
      nbHeures: isMoPiece ? p.nb : 1,
      infosCompl: '',
      machines: 'STD',
      geometrie: p.geometrie ?? 'standard',
      dimensions: (p.dimensions as Dimensions) ?? {},
    });
    setEditingId(p.id);
  };

  // ---------------------------------------------------------------------------
  // Tableau de pièces par géométrie (fidèle à renderPiecesTable)
  // ---------------------------------------------------------------------------
  const renderPiecesTable = (piecesSection: PieceRow[], geom: string) => {
    // === Main d'œuvre : heures × taux ===
    if (geom === 'mo') {
      return (
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b" style={{ borderColor: C.border, color: C.textMuted }}>
              <th className="text-left py-1 pr-2">Code MO</th>
              <th className="text-left py-1 pr-2">Désignation</th>
              <th className="text-right py-1 px-1">Nb h</th>
              <th className="text-right py-1 px-1">Taux €/h</th>
              <th className="text-right py-1 px-1">Total €</th>
              <th className="w-14"></th>
            </tr>
          </thead>
          <tbody>
            {piecesSection.map((p) => {
              const total = (p.prix ?? 0) * (p.nb ?? 0);
              return (
                <tr key={p.id} className="border-b hover:bg-gray-50" style={{ borderColor: C.border }}>
                  <td className="py-1 pr-2 font-mono font-bold" style={{ color: C.accent }}>
                    {p.ref1}
                  </td>
                  <td className="py-1 pr-2 truncate max-w-[180px]" title={p.designation ?? ''}>
                    {p.designation}
                  </td>
                  <td className="text-right py-1 px-1 font-mono">{p.nb}</td>
                  <td className="text-right py-1 px-1 font-mono">{p.prix?.toFixed(2)}</td>
                  <td className="text-right py-1 px-1 font-mono font-bold" style={{ color: C.primary }}>
                    {total.toFixed(2)}
                  </td>
                  <td className="text-right py-1 px-1 whitespace-nowrap">{renderRowActions(p)}</td>
                </tr>
              );
            })}
            <tr style={{ backgroundColor: C.bgWarm }}>
              <td
                colSpan={4}
                className="text-right py-1 pr-2 text-[10px] uppercase tracking-wider font-bold"
                style={{ color: C.textMuted }}
              >
                Total main d'œuvre
              </td>
              <td className="text-right py-1 px-1 font-mono font-bold text-sm" style={{ color: C.primary }}>
                {piecesSection.reduce((s, p) => s + (p.prix ?? 0) * (p.nb ?? 0), 0).toFixed(2)} €
              </td>
              <td></td>
            </tr>
          </tbody>
        </table>
      );
    }

    // === Pièces matière ===
    return (
      <table className="w-full text-xs">
        <thead>
          <tr className="border-b" style={{ borderColor: C.border, color: C.textMuted }}>
            <th className="text-left py-1 pr-2">Matière</th>
            <th className="text-left py-1 pr-2">Section</th>
            <th className="text-right py-1 px-1">Nb</th>
            {geom === 'standard' && (
              <>
                <th className="text-right py-1 px-1">Long</th>
                <th className="text-right py-1 px-1">Larg</th>
              </>
            )}
            {geom === 'type1' && (
              <>
                <th className="text-right py-1 px-1">A</th>
                <th className="text-right py-1 px-1">B</th>
                <th className="text-right py-1 px-1">Larg</th>
                <th className="text-right py-1 px-1">Ang_G</th>
                <th className="text-right py-1 px-1">Ang_D</th>
              </>
            )}
            {geom === 'type2' && (
              <>
                <th className="text-right py-1 px-1">Long</th>
                <th className="text-right py-1 px-1">G</th>
                <th className="text-right py-1 px-1">D</th>
                <th className="text-right py-1 px-1">Ang_G</th>
                <th className="text-right py-1 px-1">Ang_D</th>
              </>
            )}
            {geom === 'type3' && (
              <>
                <th className="text-right py-1 px-1">Long</th>
                <th className="text-right py-1 px-1">Larg</th>
                <th className="text-right py-1 px-1">R1</th>
                <th className="text-right py-1 px-1">R2</th>
              </>
            )}
            <th className="text-left py-1 px-1">Machine</th>
            {ficheValidee && <th className="text-center py-1 px-1">Fait</th>}
            <th className="w-14"></th>
          </tr>
        </thead>
        <tbody>
          {piecesSection.map((p) => {
            const dimP = (p.dimensions as Dimensions) ?? {};
            return (
              <tr
                key={p.id}
                className="border-b hover:bg-gray-50"
                style={{ borderColor: C.border, backgroundColor: p.fait ? C.successSoft : undefined }}
              >
                <td className="py-1 pr-2 truncate max-w-[200px]" title={p.designation ?? ''}>
                  {p.designation ||
                    TYPES_MATIERE.find((t) => t.id === p.type)?.label ||
                    p.type}
                </td>
                <td className="py-1 pr-2 font-mono">{p.section_finie}</td>
                <td className="text-right py-1 px-1 font-bold">{p.nb}</td>
                {geom === 'standard' && (
                  <>
                    <td className="text-right py-1 px-1 font-mono">{dimStr(dimP, 'long')}</td>
                    <td className="text-right py-1 px-1 font-mono">{dimStr(dimP, 'larg')}</td>
                  </>
                )}
                {geom === 'type1' && (
                  <>
                    <td className="text-right py-1 px-1 font-mono">{dimStr(dimP, 'longA')}</td>
                    <td className="text-right py-1 px-1 font-mono">{dimStr(dimP, 'longB')}</td>
                    <td className="text-right py-1 px-1 font-mono">{dimStr(dimP, 'larg')}</td>
                    <td className="text-right py-1 px-1 font-mono text-[10px]">
                      {dimStr(dimP, 'angleGLarg')}/{dimStr(dimP, 'angleGEp')}
                    </td>
                    <td className="text-right py-1 px-1 font-mono text-[10px]">
                      {dimStr(dimP, 'angleDLarg')}/{dimStr(dimP, 'angleDEp')}
                    </td>
                  </>
                )}
                {geom === 'type2' && (
                  <>
                    <td className="text-right py-1 px-1 font-mono">{dimStr(dimP, 'long')}</td>
                    <td className="text-right py-1 px-1 font-mono">{dimStr(dimP, 'largG')}</td>
                    <td className="text-right py-1 px-1 font-mono">{dimStr(dimP, 'largD')}</td>
                    <td className="text-right py-1 px-1 font-mono text-[10px]">
                      {dimStr(dimP, 'angleGLarg')}/{dimStr(dimP, 'angleGEp')}
                    </td>
                    <td className="text-right py-1 px-1 font-mono text-[10px]">
                      {dimStr(dimP, 'angleDLarg')}/{dimStr(dimP, 'angleDEp')}
                    </td>
                  </>
                )}
                {geom === 'type3' && (
                  <>
                    <td className="text-right py-1 px-1 font-mono">{dimStr(dimP, 'long')}</td>
                    <td className="text-right py-1 px-1 font-mono">{dimStr(dimP, 'larg')}</td>
                    <td className="text-right py-1 px-1 font-mono">{dimStr(dimP, 'rive1')}</td>
                    <td className="text-right py-1 px-1 font-mono">{dimStr(dimP, 'rive2')}</td>
                  </>
                )}
                {/* Machine non persistée (pas de colonne DB) — cellule vide, en-tête conservé pour fidélité */}
                <td className="py-1 px-1 text-[10px]" />
                {ficheValidee && (
                  <td className="text-center py-1 px-1">
                    <label
                      className="inline-flex flex-col items-center cursor-pointer"
                      title={
                        p.fait
                          ? `Fait par ${p.fait_par ?? '—'}${
                              p.fait_date ? ` le ${fmtDate(p.fait_date)}` : ''
                            }`
                          : 'Cocher quand fait'
                      }
                    >
                      <input
                        type="checkbox"
                        checked={!!p.fait}
                        onChange={() =>
                          togglePieceFait.mutate({
                            id: p.id,
                            fait: !p.fait,
                            faitPar: profil?.nom ?? 'Opérateur',
                            affaireId: effectiveId,
                          })
                        }
                        className="w-4 h-4 cursor-pointer"
                        style={{ accentColor: C.success }}
                      />
                      {p.fait && p.fait_par && (
                        <span className="text-[8px] mt-0.5 leading-none" style={{ color: C.success }}>
                          {p.fait_par.split(' ')[0]}
                        </span>
                      )}
                    </label>
                  </td>
                )}
                <td className="text-right py-1 px-1 whitespace-nowrap">{renderRowActions(p)}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    );
  };

  // Actions de ligne (éditer + supprimer avec mini-confirm) — partagées MO/matière
  const renderRowActions = (p: PieceRow) => (
    <>
      <button
        onClick={() => loadPiece(p)}
        className="p-1 hover:bg-blue-100 rounded"
        title="Modifier"
      >
        <Pencil size={12} style={{ color: C.primary }} />
      </button>
      {confirmDelete === p.id ? (
        <span className="ml-1 inline-flex items-center">
          <button
            onClick={() =>
              deletePiece.mutate(
                { id: p.id, affaireId: effectiveId },
                { onSuccess: () => setConfirmDelete(null) },
              )
            }
            className="px-1.5 py-0.5 rounded text-[10px] font-bold uppercase"
            style={{ backgroundColor: C.danger, color: 'white' }}
          >
            OK
          </button>
          <button
            onClick={() => setConfirmDelete(null)}
            className="ml-0.5 text-[10px] underline"
            style={{ color: C.textMuted }}
          >
            non
          </button>
        </span>
      ) : (
        <button
          onClick={() => setConfirmDelete(p.id)}
          className="p-1 hover:bg-red-100 rounded ml-0.5"
          title="Supprimer"
        >
          <Trash2 size={12} style={{ color: C.danger }} />
        </button>
      )}
    </>
  );

  // ---------------------------------------------------------------------------
  // Validation + soumission (ajout / mise à jour)
  // ---------------------------------------------------------------------------
  const errors: string[] = [];
  if (!effectiveId)
    errors.push(
      affairesList.length === 0
        ? "créez d'abord une affaire (menu Affaires → Nouvelle affaire)"
        : 'sélectionnez une affaire en haut',
    );
  if (!form.type) errors.push('Type');
  if (!form.ref1) errors.push(isMO ? 'Catégorie MO' : 'Réf_1');
  if (!isMO && form.ref1 && !form.ref2) errors.push('Réf_2');
  if (isMO) {
    if (!form.nbHeures || form.nbHeures <= 0) errors.push('Nb heures');
  } else {
    if (!form.nb || form.nb < 1) errors.push('Nb pièces');
    if (form.geometrie === 'standard' && !dim.long) errors.push('Longueur');
    if (form.geometrie === 'type1' && !dim.longA) errors.push('Longueur A');
    if ((form.geometrie === 'type2' || form.geometrie === 'type3') && !dim.long) errors.push('Longueur');
  }
  const canSubmit = errors.length === 0 && !!effectiveId;
  const isSubmitting = createPiece.isPending || updatePiece.isPending;

  const resetForm = () => {
    setForm(FORM_INITIAL);
    setEditingId(null);
  };

  const handleAdd = () => {
    if (!canSubmit) return;
    const payload: PieceInput = {
      affaire_id: effectiveId,
      type: form.type,
      ref1: form.ref1,
      ref2: form.ref2 || undefined,
      designation: form.designation || undefined,
      matiere_code: form.ref2 || undefined,
      section_finie: form.sectionFinie || undefined,
      nb: isMO ? Number(form.nbHeures) : Number(form.nb),
      geometrie: isMO ? 'mo' : form.geometrie,
      dimensions: form.dimensions,
      prix: form.prix ?? undefined,
      unite: form.unite || undefined,
      pourcent_chute: isMO ? 0 : selectedRef2?.chute ?? 0,
    };
    if (editingId) {
      updatePiece.mutate(
        { id: editingId, affaireId: effectiveId, patch: payload },
        { onSuccess: resetForm },
      );
    } else {
      createPiece.mutate(payload, { onSuccess: resetForm });
    }
  };

  const handleClearAll = () => {
    Promise.all(
      pieces.map(
        (p) =>
          new Promise<void>((resolve, reject) =>
            deletePiece.mutate({ id: p.id, affaireId: effectiveId }, { onSuccess: () => resolve(), onError: reject }),
          ),
      ),
    ).finally(() => {
      setConfirmClearAll(false);
      resetForm();
    });
  };

  // ---------------------------------------------------------------------------
  // Rendu
  // ---------------------------------------------------------------------------
  return (
    <div className="flex flex-col h-full -m-4 sm:-m-6 lg:-m-8">
      {/* === Top bar === */}
      <div
        className="border-b px-5 py-3 flex items-center gap-4 flex-wrap"
        style={{ borderColor: C.border, backgroundColor: 'white' }}
      >
        {/* Sélecteur d'affaire */}
        <div>
          <label
            className="text-[10px] uppercase tracking-wider font-bold block mb-0.5"
            style={{ color: C.textMuted }}
          >
            Affaire
          </label>
          <select
            value={effectiveId}
            onChange={(e) => setAffaireId(e.target.value)}
            className="px-3 py-1.5 border rounded font-mono font-bold text-sm"
            style={{ borderColor: C.border, color: C.primary }}
          >
            {affairesList.map((a) => (
              <option key={a.id} value={a.id}>
                {a.numero}
              </option>
            ))}
          </select>
        </div>

        {/* Bandeau infos affaire */}
        {affaire && (
          <div
            className="flex items-center gap-5 px-4 py-2 rounded text-xs flex-1 flex-wrap"
            style={{ backgroundColor: C.bgWarm, color: C.text }}
          >
            <div>
              <span style={{ opacity: 0.6 }}>Client :</span>{' '}
              <strong>{affaire.clients?.nom ?? '—'}</strong>
            </div>
            <div>
              <span style={{ opacity: 0.6 }}>Chantier :</span>{' '}
              <strong>{affaire.chantier ?? '—'}</strong>
            </div>
            <div>
              <span style={{ opacity: 0.6 }}>Livraison :</span>{' '}
              <strong>{fmtDate(affaire.date_livraison)}</strong>
            </div>
            <div>
              <span style={{ opacity: 0.6 }}>Chef de prod :</span> <strong>—</strong>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center gap-2 flex-wrap">
          {ficheValidee ? (
            <div
              className="px-3 py-2 rounded flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider"
              style={{ backgroundColor: C.successSoft, color: C.success }}
            >
              <CheckCircle2 size={14} /> Formulaire validé
              <span className="ml-1 font-normal normal-case" style={{ color: C.textMuted }}>
                · {fmtDate(saisiePiecesEtape?.date)}
              </span>
            </div>
          ) : (
            <button
              onClick={() => setConfirmValidation(true)}
              disabled={pieces.length === 0}
              className="px-3 py-2 rounded flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-white disabled:opacity-40 disabled:cursor-not-allowed"
              style={{ backgroundColor: C.success }}
              title={
                pieces.length === 0
                  ? 'Ajoutez au moins une pièce avant de valider'
                  : 'Publier la fiche atelier pour les ouvriers'
              }
            >
              <Check size={14} /> Valider le formulaire
            </button>
          )}
          <button
            onClick={() => window.print()}
            disabled={pieces.length === 0}
            className="px-3 py-2 border rounded flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
            style={{ borderColor: C.border, color: C.text }}
          >
            <Printer size={14} /> Imprimer fiche atelier
          </button>
          <button
            onClick={resetForm}
            className="px-3 py-2 border rounded flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider hover:bg-gray-50"
            style={{ borderColor: C.border, color: C.text }}
          >
            <Eraser size={14} /> Effacer formulaire
          </button>
          <button
            onClick={() => setConfirmClearAll(true)}
            disabled={pieces.length === 0}
            className="px-3 py-2 border rounded flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider hover:bg-red-50 disabled:opacity-40 disabled:cursor-not-allowed"
            style={{ borderColor: C.danger, color: C.danger }}
          >
            <Trash2 size={14} /> Vider tout
          </button>
        </div>
      </div>

      {/* === Zone principale split-screen === */}
      <div className="flex-1 grid grid-cols-1 xl:grid-cols-[55%_45%] overflow-auto">
        {/* === COLONNE GAUCHE — SAISIE === */}
        <div className="border-r p-5 overflow-auto" style={{ borderColor: C.border }}>
          {/* --- Bloc 1 — Identification pièce --- */}
          <div className="bg-white border rounded-lg p-4 mb-4" style={{ borderColor: C.border }}>
            <h3
              className="text-xs uppercase tracking-wider font-bold mb-3 flex items-center gap-2"
              style={{ color: C.textMuted }}
            >
              1. Identification {isMO ? "main d'œuvre" : 'pièce'}
              {isMO && <Badge bg={C.accent}>MO</Badge>}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label
                  className="text-[10px] uppercase tracking-wider font-bold block mb-1"
                  style={{ color: C.textMuted }}
                >
                  Type
                </label>
                <select
                  value={form.type}
                  onChange={(e) =>
                    updateForm({
                      type: e.target.value,
                      ref1: '',
                      ref2: '',
                      designation: '',
                      prix: null,
                      unite: '',
                      codeUnite: null,
                    })
                  }
                  className="w-full px-3 py-2 border rounded text-sm"
                  style={{ borderColor: C.border }}
                >
                  <option value="">— Choisir —</option>
                  {TYPES_MATIERE.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label
                  className="text-[10px] uppercase tracking-wider font-bold block mb-1"
                  style={{ color: C.textMuted }}
                >
                  {isMO ? 'Catégorie MO' : 'Réf_1 (famille)'}
                </label>
                <select
                  value={form.ref1}
                  onChange={(e) => {
                    if (isMO) {
                      // En mode MO : Réf_1 = code MO direct → récupère taux/désignation
                      const t = tauxList.find((x) => x.code === e.target.value);
                      updateForm({
                        ref1: e.target.value,
                        ref2: e.target.value,
                        designation: t?.des ?? '',
                        prix: t ? Number(t.taux) : null,
                        unite: '€/h',
                        codeUnite: null,
                      });
                    } else {
                      // En mode matière : Réf_1 = famille → reset Réf_2 + données
                      updateForm({
                        ref1: e.target.value,
                        ref2: '',
                        designation: '',
                        prix: null,
                        unite: '',
                        codeUnite: null,
                      });
                    }
                  }}
                  disabled={!form.type}
                  className="w-full px-3 py-2 border rounded text-sm disabled:bg-gray-100 disabled:cursor-not-allowed"
                  style={{ borderColor: C.border }}
                >
                  <option value="">—</option>
                  {isMO
                    ? tauxList.map((t) => (
                        <option key={t.code} value={t.code}>
                          {t.code}
                        </option>
                      ))
                    : ref1Options.map((r) => (
                        <option key={r} value={r}>
                          {r}
                        </option>
                      ))}
                </select>
              </div>
              {!isMO && (
                <>
                  <div>
                    <label
                      className="text-[10px] uppercase tracking-wider font-bold block mb-1"
                      style={{ color: C.textMuted }}
                    >
                      Réf_2 (variante)
                    </label>
                    <select
                      value={form.ref2}
                      onChange={(e) => {
                        const m = ref2Options.find((x) => x.code === e.target.value);
                        updateForm({
                          ref2: e.target.value,
                          designation: m?.ref ?? '',
                          prix: m ? Number(m.prix) : null,
                          unite: m?.unite ?? '',
                          codeUnite: m?.code_unite ?? null,
                          chute: m?.chute ?? 0,
                          dimensions:
                            m?.epaisseur != null
                              ? { ...form.dimensions, epai: m.epaisseur }
                              : form.dimensions,
                        });
                      }}
                      disabled={!form.ref1}
                      className="w-full px-3 py-2 border rounded text-sm disabled:bg-gray-100 disabled:cursor-not-allowed"
                      style={{ borderColor: C.border }}
                    >
                      <option value="">—</option>
                      {ref2Options.map((m) => (
                        <option key={m.code} value={m.code}>
                          {m.code}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label
                      className="text-[10px] uppercase tracking-wider font-bold block mb-1"
                      style={{ color: C.textMuted }}
                    >
                      Section finie (mm)
                    </label>
                    <input
                      type="text"
                      placeholder="15×250"
                      value={form.sectionFinie}
                      onChange={(e) => updateForm({ sectionFinie: e.target.value })}
                      className="w-full px-3 py-2 border rounded text-sm"
                      style={{ borderColor: C.border }}
                    />
                  </div>
                </>
              )}
              <div className="md:col-span-2">
                <label
                  className="text-[10px] uppercase tracking-wider font-bold block mb-1"
                  style={{ color: C.textMuted }}
                >
                  Désignation (catalogue)
                </label>
                <input
                  value={form.designation}
                  readOnly
                  className="w-full px-3 py-2 border rounded text-sm bg-gray-50"
                  style={{ borderColor: C.border, color: C.textMuted }}
                />
              </div>

              {/* Données du référentiel (Prix, Unité, Code unité) */}
              {(isMO ? form.ref1 : form.ref2) && (
                <>
                  <div>
                    <label
                      className="text-[10px] uppercase tracking-wider font-bold block mb-1"
                      style={{ color: C.textMuted }}
                    >
                      Prix unitaire (réf.)
                    </label>
                    <input
                      value={form.prix !== null ? form.prix.toFixed(4).replace(/\.?0+$/, '') : ''}
                      readOnly
                      className="w-full px-3 py-2 border rounded text-sm bg-gray-50 font-mono font-bold"
                      style={{ borderColor: C.border, color: C.primary }}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label
                        className="text-[10px] uppercase tracking-wider font-bold block mb-1"
                        style={{ color: C.textMuted }}
                      >
                        Unité
                      </label>
                      <input
                        value={form.unite || ''}
                        readOnly
                        className="w-full px-3 py-2 border rounded text-sm bg-gray-50 font-mono"
                        style={{ borderColor: C.border }}
                      />
                    </div>
                    <div>
                      <label
                        className="text-[10px] uppercase tracking-wider font-bold block mb-1"
                        style={{ color: C.textMuted }}
                      >
                        Code unité
                      </label>
                      <input
                        value={form.codeUnite ?? ''}
                        readOnly
                        className="w-full px-3 py-2 border rounded text-sm bg-gray-50 font-mono text-center"
                        style={{ borderColor: C.border }}
                      />
                    </div>
                  </div>
                </>
              )}

              {/* Mode Main d'œuvre : Nb d'heures */}
              {isMO && (
                <div className="md:col-span-2 mt-1 pt-3 border-t" style={{ borderColor: C.border }}>
                  <label
                    className="text-[10px] uppercase tracking-wider font-bold block mb-1"
                    style={{ color: C.textMuted }}
                  >
                    Nb d'heures
                  </label>
                  <div className="flex items-center gap-3">
                    <input
                      type="number"
                      min="0.25"
                      step="0.25"
                      value={form.nbHeures}
                      onChange={(e) => updateForm({ nbHeures: parseFloat(e.target.value) || 0 })}
                      className="w-32 px-3 py-2 border rounded text-base font-bold font-mono"
                      style={{ borderColor: C.border }}
                    />
                    <span className="text-xs" style={{ color: C.textMuted }}>
                      heures
                    </span>
                    {form.prix !== null && form.nbHeures > 0 && (
                      <span className="ml-auto text-sm" style={{ color: C.textMuted }}>
                        Total :{' '}
                        <strong className="font-mono" style={{ color: C.primary }}>
                          {(form.prix * form.nbHeures).toFixed(2)} €
                        </strong>
                      </span>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* --- Bloc 2 — Quantité & options (masqué en MO) --- */}
          {!isMO && (
            <div className="bg-white border rounded-lg p-4 mb-4" style={{ borderColor: C.border }}>
              <h3
                className="text-xs uppercase tracking-wider font-bold mb-3"
                style={{ color: C.textMuted }}
              >
                2. Quantité & options
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <label
                    className="text-[10px] uppercase tracking-wider font-bold block mb-1"
                    style={{ color: C.textMuted }}
                  >
                    Nb pièces
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={form.nb}
                    onChange={(e) => updateForm({ nb: parseInt(e.target.value) || 1 })}
                    className="w-full px-3 py-2 border rounded text-sm font-bold font-mono"
                    style={{ borderColor: C.border }}
                  />
                </div>
                <div className="md:col-span-2">
                  <label
                    className="text-[10px] uppercase tracking-wider font-bold block mb-1"
                    style={{ color: C.textMuted }}
                  >
                    Infos complémentaires
                  </label>
                  <input
                    type="text"
                    value={form.infosCompl}
                    onChange={(e) => updateForm({ infosCompl: e.target.value })}
                    className="w-full px-3 py-2 border rounded text-sm"
                    style={{ borderColor: C.border }}
                  />
                </div>
              </div>
            </div>
          )}

          {/* --- Bloc 3 — Géométrie (masqué en MO) --- */}
          {!isMO && (
            <div className="bg-white border rounded-lg p-4 mb-4" style={{ borderColor: C.border }}>
              <h3
                className="text-xs uppercase tracking-wider font-bold mb-3"
                style={{ color: C.textMuted }}
              >
                3. Géométrie
              </h3>

              {/* Onglets */}
              <div className="flex border-b mb-4" style={{ borderColor: C.border }}>
                {TYPES_DEBIT.map((t) => (
                  <button
                    key={t.id}
                    onClick={() =>
                      updateForm({
                        geometrie: t.id,
                        dimensions: dim.epai != null ? { epai: dim.epai } : {},
                      })
                    }
                    className={`px-4 py-2 text-sm border-b-2 transition-colors ${
                      form.geometrie === t.id ? 'font-bold' : ''
                    }`}
                    style={{
                      borderBottomColor: form.geometrie === t.id ? C.primary : 'transparent',
                      color: form.geometrie === t.id ? C.primary : C.textMuted,
                    }}
                  >
                    {t.label}
                  </button>
                ))}
              </div>

              {/* Contenu onglet actif */}
              <div className="flex gap-4 items-start">
                <div className="flex-1 min-w-0">
                  {renderGeometrieFields()}
                  <div className="mt-2 text-[10px]" style={{ color: C.textMuted }}>
                    {TYPES_DEBIT.find((t) => t.id === form.geometrie)?.desc}
                  </div>
                </div>
              </div>

              {/* Machines (1 par géométrie) */}
              <div className="mt-4 pt-3 border-t" style={{ borderColor: C.border }}>
                <label
                  className="text-[10px] uppercase tracking-wider font-bold block mb-1.5"
                  style={{ color: C.textMuted }}
                >
                  Machines (pour {TYPES_DEBIT.find((t) => t.id === form.geometrie)?.label ?? form.geometrie})
                </label>
                <div className="flex flex-wrap gap-2">
                  {MACHINES_FORMULAIRE.map((m) => (
                    <label
                      key={m.id}
                      className={`flex items-center gap-1.5 px-3 py-1.5 border rounded text-xs cursor-pointer transition-colors ${
                        form.machines === m.id ? 'font-bold' : ''
                      }`}
                      style={{
                        borderColor: form.machines === m.id ? C.primary : C.border,
                        backgroundColor: form.machines === m.id ? C.primaryLight + '20' : 'white',
                        color: form.machines === m.id ? C.primary : C.text,
                      }}
                    >
                      <input
                        type="radio"
                        name="machines"
                        checked={form.machines === m.id}
                        onChange={() => updateForm({ machines: m.id })}
                        className="sr-only"
                      />
                      {m.label}
                    </label>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* --- Validation + bouton principal Ajouter / Mettre à jour --- */}
          <div className="mb-4">
            <button
              onClick={handleAdd}
              disabled={!canSubmit || isSubmitting}
              className="w-full px-4 py-3 rounded font-bold uppercase tracking-wider text-sm transition-colors flex items-center justify-center gap-2"
              style={{
                backgroundColor: canSubmit ? (editingId ? C.accent : C.success) : C.border,
                color: canSubmit ? 'white' : C.textMuted,
                cursor: canSubmit ? 'pointer' : 'not-allowed',
              }}
              title={!canSubmit ? `Champs manquants : ${errors.join(', ')}` : ''}
            >
              {editingId ? (
                <>
                  <Pencil size={16} /> Mettre à jour la pièce
                </>
              ) : (
                <>
                  <Plus size={16} /> Ajouter à la liste
                </>
              )}
            </button>
            {!canSubmit && errors.length > 0 && (
              <div
                className="mt-2 p-2.5 rounded border-l-4 flex items-start gap-2 text-xs"
                style={{ borderLeftColor: C.warning, backgroundColor: C.warningSoft, color: '#8B6914' }}
              >
                <AlertTriangle size={14} className="shrink-0 mt-0.5" style={{ color: C.warning }} />
                <span>
                  Pour ajouter la pièce, renseignez encore : <strong>{errors.join(', ')}</strong>
                </span>
              </div>
            )}
            {(createPiece.isError || updatePiece.isError) && (
              <div
                className="mt-2 p-2.5 rounded border-l-4 flex items-start gap-2 text-xs"
                style={{ borderLeftColor: C.danger, backgroundColor: C.dangerSoft, color: '#8B2418' }}
              >
                <AlertTriangle size={14} className="shrink-0 mt-0.5" style={{ color: C.danger }} />
                <span>
                  Échec de l'enregistrement :{' '}
                  <strong>
                    {((createPiece.error ?? updatePiece.error) as Error | null)?.message ??
                      'erreur inconnue'}
                  </strong>
                  . Vérifiez vos droits (rôle) puis réessayez.
                </span>
              </div>
            )}
            {editingId && (
              <button
                onClick={resetForm}
                className="w-full mt-2 px-3 py-1.5 text-xs underline"
                style={{ color: C.textMuted }}
              >
                Annuler la modification
              </button>
            )}
          </div>
        </div>

        {/* === Modale confirmation Vider tout === */}
        {confirmClearAll && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center"
            style={{ backgroundColor: 'rgba(0,0,0,0.4)' }}
          >
            <div className="bg-white rounded-lg p-6 max-w-md mx-4 shadow-xl">
              <h3 className="text-lg font-bold mb-2" style={{ color: C.danger }}>
                Vider toute la liste ?
              </h3>
              <p className="text-sm mb-5" style={{ color: C.textMuted }}>
                Vous êtes sur le point de supprimer <strong>{pieces.length}</strong> pièce
                {pieces.length > 1 ? 's' : ''} de l'affaire {affaire?.numero}. Cette action est
                irréversible.
              </p>
              <div className="flex gap-2 justify-end">
                <button
                  onClick={() => setConfirmClearAll(false)}
                  className="px-4 py-2 border rounded text-sm font-bold"
                  style={{ borderColor: C.border, color: C.text }}
                >
                  Annuler
                </button>
                <button
                  onClick={handleClearAll}
                  disabled={deletePiece.isPending}
                  className="px-4 py-2 rounded text-sm font-bold text-white disabled:opacity-50"
                  style={{ backgroundColor: C.danger }}
                >
                  Confirmer la suppression
                </button>
              </div>
            </div>
          </div>
        )}

        {/* === Modale confirmation Valider le formulaire === */}
        {confirmValidation && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center"
            style={{ backgroundColor: 'rgba(0,0,0,0.4)' }}
          >
            <div className="bg-white rounded-lg p-6 max-w-md mx-4 shadow-xl">
              <h3 className="text-lg font-bold mb-2 flex items-center gap-2" style={{ color: C.success }}>
                <CheckCircle2 size={20} /> Valider la fiche atelier ?
              </h3>
              <p className="text-sm mb-5" style={{ color: C.textMuted }}>
                Vous allez publier la fiche atelier de l'affaire <strong>{affaire?.numero}</strong> (
                {pieces.length} pièce{pieces.length > 1 ? 's' : ''}). Les ouvriers pourront alors
                cocher les pièces faites.
              </p>
              {valider.isError && (
                <div
                  className="mb-4 p-2.5 rounded border-l-4 flex items-start gap-2 text-xs"
                  style={{ borderLeftColor: C.danger, backgroundColor: C.dangerSoft, color: '#8B2418' }}
                >
                  <AlertTriangle size={14} className="shrink-0 mt-0.5" style={{ color: C.danger }} />
                  <span>
                    Échec de la validation :{' '}
                    <strong>{(valider.error as Error | null)?.message ?? 'erreur inconnue'}</strong>.
                  </span>
                </div>
              )}
              <div className="flex gap-2 justify-end">
                <button
                  onClick={() => setConfirmValidation(false)}
                  className="px-4 py-2 border rounded text-sm font-bold"
                  style={{ borderColor: C.border, color: C.text }}
                >
                  Annuler
                </button>
                <button
                  onClick={() =>
                    valider.mutate(
                      { affaireId: effectiveId, etapeId: saisiePiecesEtape?.id ?? null },
                      { onSuccess: () => setConfirmValidation(false) },
                    )
                  }
                  disabled={valider.isPending}
                  className="px-4 py-2 rounded text-sm font-bold text-white disabled:opacity-50"
                  style={{ backgroundColor: C.success }}
                >
                  Confirmer la validation
                </button>
              </div>
            </div>
          </div>
        )}

        {/* === COLONNE DROITE — TRANSCRIPTION LIVE === */}
        <div className="p-5 overflow-auto" style={{ backgroundColor: C.bgWarm }}>
          <div className="flex items-center justify-between mb-3">
            <h2
              className="text-sm uppercase tracking-wider font-bold"
              style={{ color: C.textMuted }}
            >
              Transcription · fiche atelier
            </h2>
            <Badge bg={C.primary}>
              {pieces.length} pièce{pieces.length > 1 ? 's' : ''}
            </Badge>
          </div>

          {piecesLoading ? (
            <div className="flex justify-center py-12">
              <Spinner />
            </div>
          ) : pieces.length === 0 ? (
            <div
              className="bg-white border-2 border-dashed rounded-lg p-8 text-center"
              style={{ borderColor: C.border }}
            >
              <ClipboardList size={48} className="mx-auto mb-3" style={{ color: C.textMuted }} />
              <p className="text-sm mb-4" style={{ color: C.textMuted }}>
                Aucune pièce saisie pour cette affaire.
                <br />
                Sélectionnez un type de géométrie à gauche pour commencer.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {SECTIONS.map((section) => {
                const piecesSection = pieces.filter(
                  (p) => (p.geometrie ?? 'standard') === section.geom,
                );
                if (piecesSection.length === 0) return null;
                return (
                  <div
                    key={section.geom}
                    className="bg-white rounded-lg border p-4"
                    style={{ borderColor: C.border }}
                  >
                    <div className="flex items-start gap-4">
                      <div className="flex-1 min-w-0">
                        <h3
                          className="text-base font-bold mb-2 flex items-center gap-2"
                          style={{ color: C.primary }}
                        >
                          {section.label}
                          <Badge>{piecesSection.length}</Badge>
                        </h3>
                        <div className="overflow-x-auto">
                          {renderPiecesTable(piecesSection, section.geom)}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
