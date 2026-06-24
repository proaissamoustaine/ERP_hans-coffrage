import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Card } from '../../components/ui/Card';
import { Btn } from '../../components/ui/Btn';
import { Field } from '../../components/ui/Field';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { Spinner } from '../../components/ui/Spinner';
import { C } from '../../lib/theme';
import type { Tables } from '../../lib/database.types';
import { z } from 'zod';
import { devisSchema, type DevisInput } from './devisSchema';

type DevisFormValues = z.input<typeof devisSchema>;
import { useDevis, useCreateDevis, useUpdateDevisStatut, useRevisionDevis } from './useDevis';
import { useClients } from '../clients/useClients';

// Row type: base devis row + joined clients relation
type DevisRow = Tables<'devis'> & { clients: { nom: string } | null };

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

const STATUT_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  brouillon: { label: 'Brouillon', color: C.textMuted, bg: C.bgSoft },
  envoye:    { label: 'Envoyé',    color: C.info,      bg: C.infoSoft },
  accepte:   { label: 'Accepté',   color: C.success,   bg: C.successSoft },
  refuse:    { label: 'Refusé',    color: C.danger,    bg: C.dangerSoft },
};

function formatEur(n: number): string {
  return n.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' €';
}

export function DevisPage() {
  const { data: devis, isLoading, error } = useDevis();
  const createDevis = useCreateDevis();
  const updateStatut = useUpdateDevisStatut();
  const revisionDevis = useRevisionDevis();
  const { data: clients } = useClients();
  const [showForm, setShowForm] = useState(false);

  // TFieldValues = zod input type (allows optional frais_transport in form state)
  // TTransformedValues = DevisInput (zod output, after .default() coercion by zodResolver)
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
        setShowForm(false);
      },
    });
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: C.text }}>
            Devis
          </h1>
          <p className="mt-1 text-sm" style={{ color: C.textMuted }}>
            Gestion des devis et chiffrage
          </p>
        </div>
        <Btn
          variant={showForm ? 'secondary' : 'primary'}
          onClick={() => {
            setShowForm((v) => !v);
            reset();
          }}
        >
          {showForm ? 'Annuler' : 'Nouveau devis'}
        </Btn>
      </div>

      {/* Create form */}
      {showForm && (
        <Card>
          <h2 className="mb-4 text-base font-semibold" style={{ color: C.text }}>
            Nouveau devis
          </h2>
          <form onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-1 gap-4 sm:grid-cols-2">
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
            <div className="col-span-full flex justify-end gap-3 pt-2">
              <Btn
                type="button"
                variant="secondary"
                onClick={() => {
                  reset();
                  setShowForm(false);
                }}
              >
                Annuler
              </Btn>
              <Btn type="submit" disabled={createDevis.isPending}>
                {createDevis.isPending ? 'Enregistrement…' : 'Créer le devis'}
              </Btn>
            </div>
          </form>
          {createDevis.isError && (
            <p className="mt-3 text-sm" style={{ color: C.danger }}>
              Erreur : {createDevis.error?.message}
            </p>
          )}
        </Card>
      )}

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
            Impossible de charger les devis : {(error as Error).message}
          </p>
        </Card>
      )}

      {/* Devis table */}
      {!isLoading && !error && devis && (
        <Card className="overflow-hidden p-0">
          {devis.length === 0 ? (
            <p className="p-6 text-sm" style={{ color: C.textMuted }}>
              Aucun devis
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr style={{ backgroundColor: C.bgSoft, borderBottom: `1px solid ${C.border}` }}>
                    {['N° racine', 'Mode', 'Client', 'Objet', 'Total HT', 'Statut', 'Actions'].map((col) => (
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
                  {(devis as DevisRow[]).map((d, i) => {
                    const sc = STATUT_CONFIG[d.statut] ?? STATUT_CONFIG.brouillon;
                    return (
                      <tr
                        key={d.id}
                        style={{
                          backgroundColor: i % 2 === 0 ? C.bg : C.bgWarm,
                          borderBottom: `1px solid ${C.borderSoft}`,
                        }}
                      >
                        {/* N° racine — monospace */}
                        <td
                          className="px-4 py-3 font-mono font-medium"
                          style={{ color: C.text }}
                        >
                          {d.numero}
                        </td>
                        {/* Mode */}
                        <td className="px-4 py-3" style={{ color: C.textMuted }}>
                          {MODE_LABELS[d.mode] ?? d.mode}
                        </td>
                        {/* Client */}
                        <td className="px-4 py-3" style={{ color: C.textMuted }}>
                          {d.clients?.nom ?? '—'}
                        </td>
                        {/* Objet */}
                        <td className="px-4 py-3" style={{ color: C.textMuted }}>
                          {d.objet ?? '—'}
                        </td>
                        {/* Total HT */}
                        <td
                          className="px-4 py-3 text-right font-medium tabular-nums"
                          style={{ color: C.text }}
                        >
                          {formatEur(d.total_ht)}
                        </td>
                        {/* Statut pill */}
                        <td className="px-4 py-3">
                          <span
                            className="inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold"
                            style={{ color: sc.color, backgroundColor: sc.bg }}
                          >
                            {sc.label}
                          </span>
                        </td>
                        {/* Actions */}
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            {d.statut === 'brouillon' && (
                              <Btn
                                variant="secondary"
                                className="!px-3 !py-1 text-xs"
                                onClick={() => updateStatut.mutate({ id: d.id, statut: 'envoye' })}
                              >
                                Envoyer
                              </Btn>
                            )}
                            {d.statut === 'envoye' && (
                              <>
                                <Btn
                                  variant="primary"
                                  className="!px-3 !py-1 text-xs"
                                  onClick={() => updateStatut.mutate({ id: d.id, statut: 'accepte' })}
                                >
                                  Accepter
                                </Btn>
                                <Btn
                                  variant="secondary"
                                  className="!px-3 !py-1 text-xs"
                                  onClick={() => updateStatut.mutate({ id: d.id, statut: 'refuse' })}
                                >
                                  Refuser
                                </Btn>
                                <Btn
                                  variant="secondary"
                                  className="!px-3 !py-1 text-xs"
                                  onClick={() =>
                                    revisionDevis.mutate({
                                      id: d.id,
                                      numero: d.numero,
                                      mode: d.mode,
                                      client_id: d.client_id,
                                      chantier: d.chantier,
                                      objet: d.objet,
                                      total_ht: d.total_ht,
                                      frais_transport: d.frais_transport,
                                    })
                                  }
                                >
                                  Réviser
                                </Btn>
                              </>
                            )}
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
      )}
    </div>
  );
}

export default DevisPage;
