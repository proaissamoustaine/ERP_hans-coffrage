// src/modules/livraisons/LivraisonsPage.tsx
import { useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import {
  Package,
  Truck,
  CheckCircle2,
  Activity,
  Plus,
  PackageCheck,
  Scale,
  FileText,
  Check,
  Tag,
} from 'lucide-react';

import { PageHeader } from '../../components/ui/PageHeader';
import { Card } from '../../components/ui/Card';
import { KPI } from '../../components/ui/KPI';
import { Btn } from '../../components/ui/Btn';
import { Badge } from '../../components/ui/Badge';
import { Modal } from '../../components/ui/Modal';
import { Field } from '../../components/ui/Field';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { C } from '../../lib/theme';

import { useLivraisons, useCreerLivraison, useMajStatutLivraison } from './useLivraisons';
import type { LivraisonAvecAffaire, CreerLivraisonInput } from './useLivraisons';
import { useAffaires } from '../affaires/useAffaires';
import { useColis } from '../colisage/useColis';
import { statutLivraisonLabel, totalPoidsKg, poidsTonnes } from './livraisonsData';
import { PrintView } from './print/PrintView';
import { BonLivraisonPrint } from './print/BonLivraisonPrint';
import { EtiquetteColisPrint } from './print/EtiquetteColisPrint';

// ─── Pastille statut livraison ─────────────────────────────────────────────
const STATUT_LIV: Record<string, { bg: string; color: string }> = {
  en_preparation: { bg: C.warningSoft, color: '#8B6914' },
  expedie:        { bg: C.primarySoft, color: C.primaryDark },
  livre:          { bg: C.successSoft, color: '#1E5C42' },
};

function StatutLivraisonBadge({ statut }: { statut: string | null }) {
  const s = STATUT_LIV[statut ?? ''] ?? { bg: '#F0F0F0', color: '#666' };
  return (
    <span
      className="inline-block rounded-full px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider"
      style={{ color: s.color, backgroundColor: s.bg }}
    >
      {statutLivraisonLabel(statut ?? '')}
    </span>
  );
}

// ─── ModalNouvelleLivraison ────────────────────────────────────────────────
type NouvelleForm = {
  affaire_id: string;
  type: string;
  date_prevue: string;
  destination: string;
  transporteur: string;
  cout_transport: string;
  remarques: string;
  colisIds: string[];
};

type ModalNouvelleProps = {
  open: boolean;
  onClose: () => void;
  preAffaireId?: string;
};

function ModalNouvelleLivraison({ open, onClose, preAffaireId }: ModalNouvelleProps) {
  const { data: affairesData } = useAffaires();
  const { data: colisData } = useColis();
  const creerLivraison = useCreerLivraison();

  const affaires = useMemo(() => affairesData ?? [], [affairesData]);
  const colis = useMemo(() => colisData ?? [], [colisData]);

  const { register, handleSubmit, watch, reset, setValue } = useForm<NouvelleForm>({
    defaultValues: {
      affaire_id: preAffaireId ?? '',
      type: 'standard',
      date_prevue: '',
      destination: '',
      transporteur: 'Transports ROUILLON',
      cout_transport: '',
      remarques: '',
      colisIds: [],
    },
  });

  const affaireId = watch('affaire_id');

  // Pré-remplissage destination depuis l'affaire choisie
  const affaireChoisie = useMemo(
    () => affaires.find((a) => a.id === affaireId) ?? null,
    [affaires, affaireId],
  );

  const destinationAuto = useMemo(() => {
    if (!affaireChoisie) return '';
    const chantier = affaireChoisie.chantier ?? '';
    const clientNom = (affaireChoisie as { clients?: { nom: string } | null }).clients?.nom ?? '';
    if (chantier && clientNom) return `${chantier} · ${clientNom}`;
    return chantier || clientNom;
  }, [affaireChoisie]);

  // Colis disponibles (sans livraison_id) de l'affaire sélectionnée
  const colisDispos = useMemo(
    () => colis.filter((c) => c.affaire_id === affaireId && !c.livraison_id),
    [colis, affaireId],
  );

  // Quand on ouvre avec pré-rempli : on décoche/coche les colis dispos par défaut
  const colisIdsWatch = watch('colisIds');

  const onSubmit = (values: NouvelleForm) => {
    const input: CreerLivraisonInput = {
      affaire_id: values.affaire_id,
      type: values.type,
      destination: values.destination || destinationAuto,
      transporteur: values.transporteur,
      cout_transport: values.cout_transport ? parseFloat(values.cout_transport) : null,
      date_prevue: values.date_prevue || null,
      remarques: values.remarques || null,
      colisIds: values.colisIds,
    };
    creerLivraison.mutate(input, {
      onSuccess: () => {
        reset();
        onClose();
      },
    });
  };

  if (!open) return null;

  return (
    <Modal
      open={open}
      onClose={onClose}
      icon={PackageCheck}
      size="md"
      title="Nouvelle livraison"
      subtitle="Création d'une expédition"
      footer={
        <>
          <Btn variant="secondary" onClick={onClose}>Annuler</Btn>
          <Btn
            icon={Check}
            onClick={handleSubmit(onSubmit)}
            disabled={creerLivraison.isPending}
          >
            Créer la livraison
          </Btn>
        </>
      }
    >
      {affaires.length === 0 ? (
        <p className="text-sm py-4 text-center" style={{ color: C.textMuted }}>
          Aucune affaire disponible. Créez d'abord une affaire avant de planifier une livraison.
        </p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <Field label="Affaire" required full>
            <Select {...register('affaire_id')}>
              <option value="">— Choisir —</option>
              {affaires.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.numero}{a.chantier ? ` · ${a.chantier}` : ''}
                </option>
              ))}
            </Select>
          </Field>

          <Field label="Type">
            <Select {...register('type')}>
              <option value="standard">Livraison standard</option>
              <option value="partielle">Livraison partielle</option>
              <option value="enlevement">Enlèvement client</option>
            </Select>
          </Field>

          <Field label="Date prévue" required>
            <Input type="date" {...register('date_prevue')} />
          </Field>

          <Field label="Adresse de livraison" full hint="Pré-rempli depuis l'affaire">
            <Input
              {...register('destination')}
              placeholder={destinationAuto || 'Adresse de livraison'}
            />
          </Field>

          <Field label="Transporteur">
            <Select {...register('transporteur')}>
              <option value="Transports ROUILLON">Transports ROUILLON</option>
              <option value="Enlèvement client">Enlèvement client</option>
              <option value="Autre">Autre</option>
            </Select>
          </Field>

          <Field label="Coût transport prévu (€)">
            <Input type="number" step="0.01" {...register('cout_transport')} />
          </Field>

          <Field label="Colis à inclure" full>
            {!affaireId ? (
              <p className="text-xs py-2" style={{ color: C.textMuted }}>
                Sélectionnez une affaire pour voir ses colis disponibles.
              </p>
            ) : colisDispos.length === 0 ? (
              <p className="text-xs py-2" style={{ color: C.textMuted }}>
                Aucun colis disponible pour cette affaire.
              </p>
            ) : (
              <div
                className="space-y-1.5 p-3 border rounded"
                style={{ borderColor: C.border, backgroundColor: 'white' }}
              >
                {colisDispos.map((c, i) => {
                  const label = `Colis ${c.numero ?? i + 1} · ${c.poids ?? 0} kg`;
                  const checked = colisIdsWatch.includes(c.id);
                  return (
                    <label
                      key={c.id}
                      className="flex items-center gap-2 text-xs cursor-pointer"
                      style={{ color: C.text }}
                    >
                      <input
                        type="checkbox"
                        value={c.id}
                        checked={checked}
                        onChange={(e) => {
                          const next = e.target.checked
                            ? [...colisIdsWatch, c.id]
                            : colisIdsWatch.filter((id) => id !== c.id);
                          setValue('colisIds', next);
                        }}
                      />
                      {label}
                    </label>
                  );
                })}
              </div>
            )}
          </Field>

          <Field label="Remarques" full>
            <textarea
              {...register('remarques')}
              rows={3}
              placeholder="ex: Livraison matin uniquement, contact obligatoire avant arrivée"
              className="w-full px-3 py-2 border rounded text-sm outline-none resize-none"
              style={{ borderColor: C.border }}
            />
          </Field>
        </div>
      )}
    </Modal>
  );
}

// ─── ModalVoirLivraison ────────────────────────────────────────────────────
type ModalVoirProps = {
  open: boolean;
  onClose: () => void;
  livraison: LivraisonAvecAffaire | null;
  nbColis: number;
  poidsKg: number;
  onBL: () => void;
  onEtiquettes: () => void;
};

function ModalVoirLivraison({ open, onClose, livraison, nbColis, poidsKg, onBL, onEtiquettes }: ModalVoirProps) {
  const majStatut = useMajStatutLivraison();

  if (!livraison) return null;

  const clientNom = livraison.affaire?.client?.nom ?? '—';
  const subtitle = `${clientNom} · ${livraison.destination ?? '—'}`;

  return (
    <Modal
      open={open}
      onClose={onClose}
      icon={PackageCheck}
      size="md"
      title={`Livraison ${livraison.reference ?? livraison.id.slice(0, 8)}`}
      subtitle={subtitle}
      footer={
        <>
          <Btn variant="secondary" icon={FileText} onClick={onBL}>BL</Btn>
          <Btn variant="secondary" icon={Tag} onClick={onEtiquettes}>Étiquettes</Btn>
          <Btn
            icon={Truck}
            onClick={() => {
              majStatut.mutate({ id: livraison.id, statut: 'expedie' });
              onClose();
            }}
            disabled={majStatut.isPending}
          >
            Confirmer expédition
          </Btn>
        </>
      }
    >
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div className="p-3 rounded" style={{ backgroundColor: C.bgSoft }}>
            <div className="text-[10px] uppercase tracking-wider font-bold" style={{ color: C.textMuted }}>Affaire</div>
            <div className="font-mono font-bold mt-0.5" style={{ color: C.primary }}>
              {livraison.affaire?.numero ?? '—'}
            </div>
          </div>
          <div className="p-3 rounded" style={{ backgroundColor: C.bgSoft }}>
            <div className="text-[10px] uppercase tracking-wider font-bold" style={{ color: C.textMuted }}>Statut</div>
            <div className="mt-1">
              <StatutLivraisonBadge statut={livraison.statut} />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2">
          <div className="p-3 rounded text-center" style={{ backgroundColor: C.bgSoft }}>
            <Package size={16} style={{ color: C.primary }} className="mx-auto mb-1" />
            <div className="text-[10px] uppercase font-bold" style={{ color: C.textMuted }}>Colis</div>
            <div className="text-lg font-bold font-mono mt-0.5" style={{ color: C.text }}>{nbColis}</div>
          </div>
          <div className="p-3 rounded text-center" style={{ backgroundColor: C.bgSoft }}>
            <Scale size={16} style={{ color: C.primary }} className="mx-auto mb-1" />
            <div className="text-[10px] uppercase font-bold" style={{ color: C.textMuted }}>Poids</div>
            <div className="text-lg font-bold font-mono mt-0.5" style={{ color: C.text }}>
              {poidsTonnes(poidsKg)} t
            </div>
          </div>
          <div className="p-3 rounded text-center" style={{ backgroundColor: C.bgSoft }}>
            <Truck size={16} style={{ color: C.primary }} className="mx-auto mb-1" />
            <div className="text-[10px] uppercase font-bold" style={{ color: C.textMuted }}>Coût</div>
            <div className="text-lg font-bold font-mono mt-0.5" style={{ color: C.text }}>
              {livraison.cout_transport != null ? `${livraison.cout_transport} €` : '—'}
            </div>
          </div>
        </div>

        <div className="border-t pt-3" style={{ borderColor: C.border }}>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <div className="text-[10px] uppercase font-bold" style={{ color: C.textMuted }}>Transporteur</div>
              <div className="text-sm font-bold mt-0.5" style={{ color: C.text }}>
                {livraison.transporteur ?? '—'}
              </div>
            </div>
            <div>
              <div className="text-[10px] uppercase font-bold" style={{ color: C.textMuted }}>Date prévue</div>
              <div className="text-sm font-bold mt-0.5 font-mono" style={{ color: C.text }}>
                {livraison.date_prevue
                  ? new Date(livraison.date_prevue).toLocaleDateString('fr-FR')
                  : '—'}
              </div>
            </div>
          </div>
        </div>
      </div>
    </Modal>
  );
}

// ─── LivraisonsPage ───────────────────────────────────────────────────────
export default function LivraisonsPage() {
  const [showNew, setShowNew] = useState(false);
  const [showView, setShowView] = useState(false);
  const [selLiv, setSelLiv] = useState<LivraisonAvecAffaire | null>(null);
  const [preAffaireId, setPreAffaireId] = useState<string | undefined>(undefined);
  const [printKind, setPrintKind] = useState<'bl' | 'etiquettes' | null>(null);

  const { data: livraisonsData } = useLivraisons();
  const { data: affairesData } = useAffaires();
  const { data: colisData } = useColis();

  const livraisons = useMemo(() => livraisonsData ?? [], [livraisonsData]);
  const affaires = useMemo(() => affairesData ?? [], [affairesData]);
  const colis = useMemo(() => colisData ?? [], [colisData]);

  // Colis par livraison_id (pour calcul nb / poids)
  const colisByLivraison = useMemo(() => {
    const map = new Map<string, typeof colis>();
    for (const c of colis) {
      if (!c.livraison_id) continue;
      const arr = map.get(c.livraison_id) ?? [];
      arr.push(c);
      map.set(c.livraison_id, arr);
    }
    return map;
  }, [colis]);

  // Colis de la livraison sélectionnée
  const colisSel = selLiv ? (colisByLivraison.get(selLiv.id) ?? []) : [];

  // KPI calculés
  const nbEnPreparation = useMemo(
    () => livraisons.filter((l) => l.statut === 'en_preparation').length,
    [livraisons],
  );
  const nbExpedies = useMemo(
    () => livraisons.filter((l) => l.statut === 'expedie').length,
    [livraisons],
  );
  const nbLivresMois = useMemo(() => {
    const now = new Date();
    return livraisons.filter((l) => {
      if (l.statut !== 'livre') return false;
      const d = new Date(l.created_at as string);
      return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
    }).length;
  }, [livraisons]);
  const tonnageTotal = useMemo(() => {
    const colisLivres = colis.filter((c) => c.livraison_id != null);
    return poidsTonnes(totalPoidsKg(colisLivres));
  }, [colis]);

  // Affaires prêtes à expédier : au moins 1 colis sans livraison_id
  const affairesAExpedier = useMemo(() => {
    const affaireIdsAvecColis = new Set(
      colis.filter((c) => !c.livraison_id).map((c) => c.affaire_id),
    );
    return affaires.filter((a) => affaireIdsAvecColis.has(a.id));
  }, [affaires, colis]);

  // Colis libres (sans livraison) par affaire
  const colisLibresByAffaire = useMemo(() => {
    const map = new Map<string, typeof colis>();
    for (const c of colis) {
      if (c.livraison_id) continue;
      const arr = map.get(c.affaire_id) ?? [];
      arr.push(c);
      map.set(c.affaire_id, arr);
    }
    return map;
  }, [colis]);

  const ouvrirNouvelleAvecAffaire = (affaireId: string) => {
    setPreAffaireId(affaireId);
    setShowNew(true);
  };

  const ouvrirVoir = (l: LivraisonAvecAffaire) => {
    setSelLiv(l);
    setShowView(true);
  };

  return (
    <div className="space-y-5">
      <PageHeader
        section="Logistique"
        title="Livraisons"
        subtitle={`${livraisons.length} livraisons · génération BL et étiquettes auto`}
        actions={
          <Btn icon={Plus} onClick={() => { setPreAffaireId(undefined); setShowNew(true); }}>
            Nouvelle livraison
          </Btn>
        }
      />

      {/* === Affaires prêtes à expédier === */}
      {affairesAExpedier.length > 0 && (
        <Card>
          <h3 className="font-bold text-sm mb-1 flex items-center gap-2" style={{ color: C.text }}>
            <Truck size={16} style={{ color: C.primary }} />
            Affaires prêtes à expédier <Badge bg={C.primary}>{affairesAExpedier.length}</Badge>
          </h3>
          <p className="text-xs mb-3" style={{ color: C.textMuted }}>
            Ces affaires ont des colis enregistrés. Cliquez « Marquer livré » pour planifier la livraison.
          </p>
          <div className="space-y-2">
            {affairesAExpedier.map((a) => {
              const colisAffaire = colisLibresByAffaire.get(a.id) ?? [];
              const clientNom = (a as { clients?: { nom: string } | null }).clients?.nom ?? null;
              return (
                <div
                  key={a.id}
                  className="p-3 rounded border flex items-center justify-between gap-3"
                  style={{ borderColor: C.border, backgroundColor: C.bgWarm }}
                >
                  <div className="flex items-center gap-3 flex-wrap">
                    <span className="font-mono font-bold text-sm" style={{ color: C.primary }}>
                      {a.numero}
                    </span>
                    <span className="text-sm" style={{ color: C.text }}>
                      {clientNom && a.chantier
                        ? `${clientNom} · ${a.chantier}`
                        : clientNom || a.chantier || '—'}
                    </span>
                    <Badge bg={C.success}>{colisAffaire.length} colis</Badge>
                  </div>
                  <button
                    onClick={() => ouvrirNouvelleAvecAffaire(a.id)}
                    className="px-3 py-1.5 rounded text-xs font-bold uppercase tracking-wider text-white"
                    style={{ backgroundColor: C.success }}
                  >
                    <Check size={12} className="inline mr-1 -mt-0.5" />
                    Marquer livré
                  </button>
                </div>
              );
            })}
          </div>
        </Card>
      )}

      {/* === KPI === */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4">
        <KPI icon={Package} label="En préparation" value={String(nbEnPreparation)} color={C.warning} />
        <KPI icon={Truck} label="Expédiés" value={String(nbExpedies)} color={C.primary} />
        <KPI icon={CheckCircle2} label="Livrés ce mois" value={String(nbLivresMois)} color={C.success} />
        <KPI icon={Activity} label="Tonnage total" value={`${tonnageTotal} t`} color={C.accent} />
      </div>

      {/* === Tableau des livraisons === */}
      <Card noPadding className="overflow-x-auto">
        <table className="w-full min-w-[800px]">
          <thead style={{ backgroundColor: C.bgSoft }}>
            <tr>
              {['Référence', 'Affaire', 'Client', 'Destination', 'Colis', 'Poids', 'Coût', 'Date', 'Statut'].map((h) => (
                <th
                  key={h}
                  className="text-left px-4 py-3 text-[10px] uppercase tracking-wider font-bold"
                  style={{ color: C.textMuted }}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {livraisons.length === 0 ? (
              <tr>
                <td colSpan={9} className="px-4 py-8 text-center text-xs" style={{ color: C.textMuted }}>
                  Aucune livraison enregistrée.
                </td>
              </tr>
            ) : (
              livraisons.map((l) => {
                const colisLiv = colisByLivraison.get(l.id) ?? [];
                const nbCol = colisLiv.length;
                const poidsKg = totalPoidsKg(colisLiv);
                return (
                  <tr
                    key={l.id}
                    className="border-b hover:bg-stone-50 cursor-pointer"
                    style={{ borderColor: C.border }}
                    onClick={() => ouvrirVoir(l)}
                  >
                    <td className="px-4 py-3 font-mono text-xs font-bold" style={{ color: C.primary }}>
                      {l.reference ?? l.id.slice(0, 8)}
                    </td>
                    <td className="px-4 py-3 font-mono text-xs" style={{ color: C.text }}>
                      {l.affaire?.numero ?? '—'}
                    </td>
                    <td className="px-4 py-3 text-sm font-semibold" style={{ color: C.text }}>
                      {l.affaire?.client?.nom ?? '—'}
                    </td>
                    <td className="px-4 py-3 text-xs" style={{ color: C.textMuted }}>
                      {l.destination ?? '—'}
                    </td>
                    <td className="px-4 py-3 text-sm font-mono font-bold" style={{ color: C.text }}>
                      {nbCol}
                    </td>
                    <td className="px-4 py-3 text-sm font-mono" style={{ color: C.textMuted }}>
                      {poidsTonnes(poidsKg)} t
                    </td>
                    <td className="px-4 py-3 text-sm font-bold font-mono" style={{ color: C.text }}>
                      {l.cout_transport != null ? `${l.cout_transport} €` : '—'}
                    </td>
                    <td className="px-4 py-3 text-xs font-mono" style={{ color: C.textMuted }}>
                      {l.date_prevue
                        ? new Date(l.date_prevue).toLocaleDateString('fr-FR')
                        : '—'}
                    </td>
                    <td className="px-4 py-3">
                      <StatutLivraisonBadge statut={l.statut} />
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </Card>

      <ModalNouvelleLivraison
        open={showNew}
        onClose={() => setShowNew(false)}
        preAffaireId={preAffaireId}
      />
      <ModalVoirLivraison
        open={showView}
        onClose={() => setShowView(false)}
        livraison={selLiv}
        nbColis={selLiv ? (colisByLivraison.get(selLiv.id) ?? []).length : 0}
        poidsKg={selLiv ? totalPoidsKg(colisByLivraison.get(selLiv.id) ?? []) : 0}
        onBL={() => setPrintKind('bl')}
        onEtiquettes={() => setPrintKind('etiquettes')}
      />
      {printKind && selLiv && (
        <PrintView
          title={printKind === 'bl' ? 'Bon de livraison' : 'Étiquettes colis'}
          onClose={() => setPrintKind(null)}
        >
          {printKind === 'bl' ? (
            <BonLivraisonPrint
              reference={selLiv.reference}
              affaireNumero={selLiv.affaire?.numero ?? ''}
              client={selLiv.affaire?.client?.nom ?? ''}
              chantier={selLiv.affaire?.chantier ?? ''}
              destination={selLiv.destination ?? ''}
              date={selLiv.date_prevue ?? (selLiv.created_at as string)}
              colis={colisSel.map((c) => ({
                numero: c.numero, longueur: c.longueur, largeur: c.largeur, hauteur: c.hauteur, poids: c.poids,
              }))}
            />
          ) : (
            colisSel.map((c) => (
              <EtiquetteColisPrint
                key={c.id}
                affaireNumero={selLiv.affaire?.numero ?? ''}
                client={selLiv.affaire?.client?.nom ?? ''}
                chantier={selLiv.affaire?.chantier ?? ''}
                colis={{ numero: c.numero, longueur: c.longueur, largeur: c.largeur, hauteur: c.hauteur, poids: c.poids }}
                total={colisSel.length}
              />
            ))
          )}
        </PrintView>
      )}
    </div>
  );
}
