import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Card } from '../../components/ui/Card';
import { Btn } from '../../components/ui/Btn';
import { Field } from '../../components/ui/Field';
import { Input } from '../../components/ui/Input';
import { Spinner } from '../../components/ui/Spinner';
import { C } from '../../lib/theme';
import type { Tables } from '../../lib/database.types';
import { clientSchema, type ClientInput } from './clientSchema';
import { useClients, useCreateClient } from './useClients';

type Client = Tables<'clients'>;

export function ClientsPage() {
  const { data: clients, isLoading, error } = useClients();
  const createClient = useCreateClient();
  const [showForm, setShowForm] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ClientInput>({
    resolver: zodResolver(clientSchema),
    defaultValues: { nom: '', type: '', ville: '', contact: '', tel: '', email: '' },
  });

  function onSubmit(values: ClientInput) {
    createClient.mutate(values, {
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
            Clients
          </h1>
          <p className="mt-1 text-sm" style={{ color: C.textMuted }}>
            Gestion du référentiel clients
          </p>
        </div>
        <Btn
          variant={showForm ? 'secondary' : 'primary'}
          onClick={() => {
            setShowForm((v) => !v);
            reset();
          }}
        >
          {showForm ? 'Annuler' : 'Nouveau client'}
        </Btn>
      </div>

      {/* Create form */}
      {showForm && (
        <Card>
          <h2 className="mb-4 text-base font-semibold" style={{ color: C.text }}>
            Nouveau client
          </h2>
          <form onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Nom" required error={errors.nom?.message}>
              <Input {...register('nom')} placeholder="EIFFAGE ALSACE" />
            </Field>
            <Field label="Type" error={errors.type?.message}>
              <Input {...register('type')} placeholder="BTP, Industrie…" />
            </Field>
            <Field label="Ville" error={errors.ville?.message}>
              <Input {...register('ville')} placeholder="STRASBOURG" />
            </Field>
            <Field label="Contact" error={errors.contact?.message}>
              <Input {...register('contact')} placeholder="M. Dupont" />
            </Field>
            <Field label="Téléphone" error={errors.tel?.message}>
              <Input {...register('tel')} placeholder="06 00 00 00 00" />
            </Field>
            <Field label="Email" error={errors.email?.message}>
              <Input {...register('email')} type="email" placeholder="contact@exemple.fr" />
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
              <Btn type="submit" disabled={createClient.isPending}>
                {createClient.isPending ? 'Enregistrement…' : 'Créer le client'}
              </Btn>
            </div>
          </form>
          {createClient.isError && (
            <p className="mt-3 text-sm" style={{ color: C.danger }}>
              Erreur : {createClient.error?.message}
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
            Impossible de charger les clients : {(error as Error).message}
          </p>
        </Card>
      )}

      {/* Clients table */}
      {!isLoading && !error && clients && (
        <Card className="overflow-hidden p-0">
          {clients.length === 0 ? (
            <p className="p-6 text-sm" style={{ color: C.textMuted }}>
              Aucun client enregistré.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr style={{ backgroundColor: C.bgSoft, borderBottom: `1px solid ${C.border}` }}>
                    {['Nom', 'Type', 'Ville', 'Contact', 'Tél', 'Email'].map((col) => (
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
                  {clients.map((client: Client, i: number) => (
                    <tr
                      key={client.id}
                      style={{
                        backgroundColor: i % 2 === 0 ? C.bg : C.bgWarm,
                        borderBottom: `1px solid ${C.borderSoft}`,
                      }}
                    >
                      <td className="px-4 py-3 font-medium" style={{ color: C.text }}>
                        {client.nom}
                      </td>
                      <td className="px-4 py-3" style={{ color: C.textMuted }}>
                        {client.type ?? '—'}
                      </td>
                      <td className="px-4 py-3" style={{ color: C.textMuted }}>
                        {client.ville ?? '—'}
                      </td>
                      <td className="px-4 py-3" style={{ color: C.textMuted }}>
                        {client.contact ?? '—'}
                      </td>
                      <td className="px-4 py-3" style={{ color: C.textMuted }}>
                        {client.tel ?? '—'}
                      </td>
                      <td className="px-4 py-3" style={{ color: C.textMuted }}>
                        {client.email ?? '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      )}
    </div>
  );
}

export default ClientsPage;
