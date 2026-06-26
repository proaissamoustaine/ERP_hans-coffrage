import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  FileText,
  CheckCircle2,
  TrendingUp,
  Clock,
  Download,
  Plus,
  Send,
  Check,
  X,
  RotateCcw,
  Calculator,
} from 'lucide-react';

import { PageHeader } from '../../components/ui/PageHeader';
import { KPI } from '../../components/ui/KPI';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Btn } from '../../components/ui/Btn';
import { Modal } from '../../components/ui/Modal';
import { Field } from '../../components/ui/Field';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { Spinner } from '../../components/ui/Spinner';
import { C } from '../../lib/theme';

import { devisSchema, type DevisInput } from './devisSchema';
import { useDevis, useCreateDevis, useUpdateDevisStatut, useRevisionDevis } from './useDevis';
import { useAccepterDevis } from './useAccepterDevis';
import { useClients } from '../clients/useClients';
import type { Tables } from '../../lib/database.types';
import { z } from 'zod';

type DevisFormValues = z.input<typeof devisSchema>;
type DevisRow = Tables<'devis'> & { clients: { nom: string } | null };

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const MODE_LABELS: Record<string, string> = {
  coffrage: 'Coffrage',
  prefa: 'Préfa',
  mannequin: 'Mannequin',
  sateba: 'Sateba',
  vente: 'Vente',
  usinage: 'Usinage',
  decor: 'Décor',
  autre: 'Autre',
};

const STATUT_LABEL: Record<string, string> = {
  brouillon: 'Brouillon',
  envoye: 'Envoyé',
  accepte: 'Accepté',
  refuse: 'Refusé',
};

const STATUT_COLOR: Record<string, string> = {
  brouillon: C.textMuted,
  envoye: C.accent,
  accepte: C.success,
  refuse: C.danger,
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatEur(n: number): string {
  return n.toLocaleString('fr-FR') + ' €';
}

// ---------------------------------------------------------------------------
// Modal "Nouveau devis"
// ---------------------------------------------------------------------------

type ModalNouveauDevisProps = {
  open: boolean;
  onClose: () => void;
};

function ModalNouveauDevis({ open, onClose }: ModalNouveauDevisProps) {
  const createDevis = useCreateDevis();
  const { data: clients } = useClients();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<DevisFormValues, unknown, DevisInput>({
    resolver: zodResolver(devisSchema),
    defaultValues: {
      mode: 'coffrage',
      client_id: '',
      chantier: '',
      objet: '',
      total_ht: 0,
      frais_transport: 0,
    },
  });

  function onSubmit(values: DevisInput) {
    createDevis.mutate(values, {
      onSuccess: () => {
        reset();
        onClose();
      },
    });
  }

  function handleClose() {
    reset();
    onClose();
  }

  return (
    <Modal
      open={open}
      onClose={handleClose}
      icon={FileText}
      size="md"
      title="Nouveau devis"
      subtitle="Création d'un devis de chiffrage"
      footer={
        <>
          <Btn variant="secondary" onClick={handleClose}>
            Annuler
          </Btn>
          <Btn
            icon={Check}
            onClick={handleSubmit(onSubmit)}
            disabled={createDevis.isPending}
          >
            {createDevis.isPending ? 'Enregistrement…' : 'Créer le devis'}
          </Btn>
        </>
      }
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <Field label="Mode de chiffrage" required error={errors.mode?.message}>
          <Select {...register('mode')}>
            {Object.entries(MODE_LABELS).map(([val, label]) => (
              <option key={val} value={val}>{label}</option>
            ))}
          </Select>
        </Field>

        <Field label="Client" error={errors.client_id?.message}>
          <Select {...register('client_id')}>
            <option value="">—</option>
            {(clients ?? []).map((c) => (
              <option key={c.id} value={c.id}>{c.nom}</option>
            ))}
          </Select>
        </Field>

        <Field label="Chantier" error={errors.chantier?.message}>
          <Input {...register('chantier')} placeholder="Nom du chantier" />
        </Field>

        <Field label="Objet" error={errors.objet?.message}>
          <Input {...register('objet')} placeholder="Description de l'objet" />
        </Field>

        <Field label="Total HT (€)" required error={errors.total_ht?.message}>
          <Input
            {...register('total_ht', { valueAsNumber: true })}
            type="number"
            step="0.01"
            min="0"
            placeholder="0.00"
          />
        </Field>

        <Field label="Frais de transport (€)" error={errors.frais_transport?.message}>
          <Input
            {...register('frais_transport', { valueAsNumber: true })}
            type="number"
            step="0.01"
            min="0"
            placeholder="0.00"
          />
        </Field>
      </div>

      {createDevis.isError && (
        <p className="mt-3 text-sm" style={{ color: C.danger }}>
          Erreur : {(createDevis.error as Error)?.message}
        </p>
      )}
    </Modal>
  );
}

// ---------------------------------------------------------------------------
// Revision confirm modal (inline, no separate Modal component — matches mockup)
// ---------------------------------------------------------------------------

type RevisionConfirmProps = {
  devis: DevisRow;
  onConfirm: () => void;
  onCancel: () => void;
};

function RevisionConfirmModal({ devis, onConfirm, onCancel }: RevisionConfirmProps) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
    >
      <div className="bg-white rounded-lg p-6 max-w-md mx-4 shadow-2xl">
        <div className="flex items-start gap-3 mb-4">
          <div
            className="w-10 h-10 rounded-full flex items-center justify-center shrink-0"
            style={{ backgroundColor: '#EDE9F7' }}
          >
            <RotateCcw size={20} style={{ color: '#7B6CB5' }} />
          </div>
          <div>
            <h3 className="text-base font-bold mb-1" style={{ color: C.text }}>
              Demande de révision client
            </h3>
            <p className="text-xs" style={{ color: C.textMuted }}>
              Le client a demandé des modifications sur le devis{' '}
              <strong className="font-mono">{devis.numero}</strong>. Une nouvelle version sera
              créée avec le même n° racine et la prochaine lettre (A → B → C…).
            </p>
          </div>
        </div>
        <div
          className="p-3 rounded mb-4 text-xs"
          style={{ backgroundColor: C.bgWarm, color: C.text }}
        >
          <strong>Effets :</strong>
          <ul className="mt-1 ml-4 list-disc space-y-1" style={{ color: C.textMuted }}>
            <li>
              Le devis actuel{' '}
              <span className="font-mono">{devis.numero}</span> passera en statut{' '}
              <strong>Révisé</strong> (figé, plus modifiable)
            </li>
            <li>
              Une nouvelle version sera créée en statut <strong>Brouillon</strong> avec les
              mêmes données pré-remplies
            </li>
            <li>Vous pourrez ensuite la modifier puis l'envoyer au client</li>
          </ul>
        </div>
        <div className="flex gap-2 justify-end">
          <button
            onClick={onCancel}
            className="px-4 py-2 border rounded text-sm font-bold"
            style={{ borderColor: C.border, color: C.text }}
          >
            Annuler
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 rounded text-sm font-bold text-white"
            style={{ backgroundColor: '#7B6CB5' }}
          >
            Créer la version suivante
          </button>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main page
// ---------------------------------------------------------------------------

export function DevisPage() {
  const { data: devis, isLoading, error } = useDevis();
  const updateStatut = useUpdateDevisStatut();
  const revisionDevis = useRevisionDevis();
  const accepterDevis = useAccepterDevis();
  const [showModal, setShowModal] = useState(false);
  const [confirmRevision, setConfirmRevision] = useState<DevisRow | null>(null);

  const devisList = (devis ?? []) as DevisRow[];

  // KPI values
  const nbBrouillon = devisList.filter((d) => d.statut === 'brouillon').length;
  const nbEnvoye = devisList.filter((d) => d.statut === 'envoye').length;
  const nbAccepte = devisList.filter((d) => d.statut === 'accepte').length;
  const totalHT = devisList.reduce((sum, d) => sum + (d.total_ht ?? 0), 0);

  return (
    <div className="space-y-5">
      {/* ------------------------------------------------------------------ */}
      {/* Header */}
      {/* ------------------------------------------------------------------ */}
      <PageHeader
        section="Commercial"
        title="Devis"
        subtitle={`${devisList.length} devis · ${nbAccepte} acceptés`}
        actions={
          <>
            <Btn variant="secondary" icon={Download}>
              Export
            </Btn>
            <Btn icon={Plus} onClick={() => setShowModal(true)}>
              Nouveau devis
            </Btn>
          </>
        }
      />

      {/* ------------------------------------------------------------------ */}
      {/* KPI row */}
      {/* ------------------------------------------------------------------ */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4">
        <KPI
          icon={FileText}
          label="Total devis"
          value={String(devisList.length)}
          color={C.primary}
        />
        <KPI
          icon={CheckCircle2}
          label="Acceptés"
          value={String(nbAccepte)}
          color={C.success}
        />
        <KPI
          icon={TrendingUp}
          label="Montant total"
          value={`${(totalHT / 1000).toFixed(0)} k€`}
          color={C.accent}
        />
        <KPI
          icon={Clock}
          label="En attente"
          value={String(nbEnvoye + nbBrouillon)}
          color={C.warning}
        />
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* Loading */}
      {/* ------------------------------------------------------------------ */}
      {isLoading && (
        <div className="flex justify-center py-12">
          <Spinner />
        </div>
      )}

      {/* ------------------------------------------------------------------ */}
      {/* Error */}
      {/* ------------------------------------------------------------------ */}
      {error && (
        <p className="text-sm font-medium" style={{ color: C.danger }}>
          Impossible de charger les devis : {(error as Error).message}
        </p>
      )}

      {/* ------------------------------------------------------------------ */}
      {/* Devis table — mockup style */}
      {/* ------------------------------------------------------------------ */}
      {!isLoading && !error && (
        <Card noPadding className="overflow-x-auto">
          {/* Card sub-header */}
          <div
            className="px-5 py-3 border-b flex items-center justify-between"
            style={{ borderColor: C.border, backgroundColor: C.bgWarm }}
          >
            <h3
              className="font-bold text-sm flex items-center gap-2"
              style={{ color: C.text }}
            >
              <Calculator size={14} style={{ color: C.primary }} />
              Devis chiffrage
              <Badge bg={C.primary}>{devisList.length}</Badge>
            </h3>
            <span
              className="text-[10px] uppercase tracking-wider font-bold"
              style={{ color: C.textMuted }}
            >
              N° racine = futur n° d'affaire si accepté
            </span>
          </div>

          <table className="w-full min-w-[900px]">
            <thead style={{ backgroundColor: C.bgSoft }}>
              <tr>
                {['N° racine', 'Mode', 'Client', 'Objet', 'Total HT', 'Statut', 'Actions'].map(
                  (h) => (
                    <th
                      key={h}
                      className="text-left px-4 py-3 text-[10px] uppercase tracking-wider font-bold"
                      style={{ color: C.textMuted }}
                    >
                      {h}
                    </th>
                  )
                )}
              </tr>
            </thead>
            <tbody>
              {devisList.length === 0 && (
                <tr>
                  <td
                    colSpan={7}
                    className="text-center px-4 py-10 text-xs"
                    style={{ color: C.textMuted }}
                  >
                    Aucun devis. Cliquez sur{' '}
                    <strong>Nouveau devis</strong> pour commencer.
                  </td>
                </tr>
              )}
              {devisList.map((d) => {
                // Extract version letter from numero (e.g. C25-001A → "A")
                const versionMatch = d.numero.match(/^(.+?)([A-Z])$/);
                const version = versionMatch ? versionMatch[2] : '';
                const statutColor = STATUT_COLOR[d.statut] ?? C.textMuted;
                const statutLabel = STATUT_LABEL[d.statut] ?? d.statut;

                return (
                  <tr
                    key={d.id}
                    className="border-b hover:bg-stone-50 transition-colors"
                    style={{ borderColor: C.border }}
                  >
                    {/* N° racine — monospace */}
                    <td className="px-4 py-3 font-mono text-sm font-bold" style={{ color: C.primary }}>
                      {d.numero}
                      {version && (
                        <span
                          className="ml-2 px-1.5 py-0.5 rounded text-[9px] font-bold"
                          style={{
                            backgroundColor: version === 'A' ? C.successSoft : '#EDE9F7',
                            color: version === 'A' ? C.success : '#7B6CB5',
                          }}
                        >
                          v{version}
                        </span>
                      )}
                    </td>

                    {/* Mode */}
                    <td className="px-4 py-3 text-xs">
                      <Badge bg={C.primarySoft} color={C.primary}>
                        {(MODE_LABELS[d.mode] ?? d.mode).toUpperCase().slice(0, 6)}
                      </Badge>
                    </td>

                    {/* Client */}
                    <td
                      className="px-4 py-3 text-sm font-semibold"
                      style={{ color: C.text }}
                    >
                      {d.clients?.nom ?? '—'}
                    </td>

                    {/* Objet */}
                    <td className="px-4 py-3 text-xs" style={{ color: C.textMuted }}>
                      {d.objet ?? '—'}
                    </td>

                    {/* Total HT */}
                    <td
                      className="px-4 py-3 text-sm font-bold font-mono text-right"
                      style={{ color: C.text }}
                    >
                      {formatEur(d.total_ht ?? 0)}
                    </td>

                    {/* Statut pill */}
                    <td className="px-4 py-3">
                      <span
                        className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider"
                        style={{
                          backgroundColor: statutColor + '20',
                          color: statutColor,
                        }}
                      >
                        {statutLabel}
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="px-4 py-3">
                      <div className="flex gap-1.5 flex-wrap items-center">
                        {d.statut === 'brouillon' && (
                          <button
                            onClick={() => updateStatut.mutate({ id: d.id, statut: 'envoye' })}
                            className="px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider text-white flex items-center gap-1"
                            style={{ backgroundColor: C.accent }}
                          >
                            <Send size={10} />
                            Envoyer
                          </button>
                        )}
                        {d.statut === 'envoye' && (
                          <>
                            <button
                              onClick={() =>
                                accepterDevis.mutate({
                                  id: d.id,
                                  numero: d.numero,
                                  mode: d.mode,
                                  client_id: d.client_id,
                                  chantier: d.chantier,
                                  objet: d.objet,
                                  total_ht: d.total_ht,
                                })
                              }
                              className="px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider text-white flex items-center gap-1"
                              style={{ backgroundColor: C.success }}
                            >
                              <Check size={10} />
                              Accepter
                            </button>
                            <button
                              onClick={() => setConfirmRevision(d)}
                              className="px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider text-white flex items-center gap-1"
                              style={{ backgroundColor: '#7B6CB5' }}
                            >
                              <RotateCcw size={10} />
                              Révision
                            </button>
                            <button
                              onClick={() =>
                                updateStatut.mutate({ id: d.id, statut: 'refuse' })
                              }
                              className="px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider text-white flex items-center gap-1"
                              style={{ backgroundColor: C.danger }}
                            >
                              <X size={10} />
                              Refuser
                            </button>
                          </>
                        )}
                        {d.statut === 'accepte' && (
                          <span
                            className="text-[10px] italic"
                            style={{ color: C.success }}
                          >
                            ✓ Affaire créée avec ce n°
                          </span>
                        )}
                        {d.statut === 'refuse' && (
                          <span
                            className="text-[10px] italic"
                            style={{ color: C.textMuted }}
                          >
                            Refusé
                          </span>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </Card>
      )}

      {/* ------------------------------------------------------------------ */}
      {/* Modals */}
      {/* ------------------------------------------------------------------ */}
      <ModalNouveauDevis open={showModal} onClose={() => setShowModal(false)} />

      {confirmRevision && (
        <RevisionConfirmModal
          devis={confirmRevision}
          onConfirm={() => {
            revisionDevis.mutate({
              id: confirmRevision.id,
              numero: confirmRevision.numero,
              mode: confirmRevision.mode,
              client_id: confirmRevision.client_id,
              chantier: confirmRevision.chantier,
              objet: confirmRevision.objet,
              total_ht: confirmRevision.total_ht,
              frais_transport: confirmRevision.frais_transport,
            });
            setConfirmRevision(null);
          }}
          onCancel={() => setConfirmRevision(null)}
        />
      )}
    </div>
  );
}

export default DevisPage;
