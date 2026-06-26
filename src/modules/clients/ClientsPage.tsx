import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Building2,
  TrendingUp,
  Briefcase,
  Star,
  Download,
  Plus,
  Phone,
  Mail,
  Check,
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

import { clientSchema, type ClientInput } from './clientSchema';
import { useClients, useCreateClient } from './useClients';
import { useAffaires } from '../affaires/useAffaires';
import type { Tables } from '../../lib/database.types';

type Client = Tables<'clients'>;
type Affaire = Tables<'affaires'>;

// ---------------------------------------------------------------------------
// helpers
// ---------------------------------------------------------------------------

function caForClient(affaires: Affaire[], clientId: string): number {
  return affaires
    .filter((a) => a.client_id === clientId)
    .reduce((sum, a) => sum + (a.total_ht ?? 0), 0);
}

function affairesCountForClient(affaires: Affaire[], clientId: string): number {
  return affaires.filter((a) => a.client_id === clientId).length;
}

function topClientNom(clients: Client[], affaires: Affaire[]): string {
  if (!clients.length) return '—';
  let best: Client | null = null;
  let bestCa = -1;
  for (const c of clients) {
    const ca = caForClient(affaires, c.id);
    if (ca > bestCa) {
      bestCa = ca;
      best = c;
    }
  }
  return best ? best.nom : '—';
}

// ---------------------------------------------------------------------------
// Modal form — only DB-persisted fields
// ---------------------------------------------------------------------------

type ModalNouveauClientProps = {
  open: boolean;
  onClose: () => void;
};

function ModalNouveauClient({ open, onClose }: ModalNouveauClientProps) {
  const createClient = useCreateClient();

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
      icon={Building2}
      size="md"
      title="Nouveau client"
      subtitle="Création d'une fiche client"
      footer={
        <>
          <Btn variant="secondary" onClick={handleClose}>
            Annuler
          </Btn>
          <Btn
            icon={Check}
            onClick={handleSubmit(onSubmit)}
            disabled={createClient.isPending}
          >
            {createClient.isPending ? 'Enregistrement…' : 'Créer le client'}
          </Btn>
        </>
      }
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {/* Raison sociale — full width */}
        <Field label="Raison sociale" required full error={errors.nom?.message}>
          <Input {...register('nom')} placeholder="ex: EIFFAGE GENIE CIVIL" />
        </Field>

        {/* Type */}
        <Field label="Type" error={errors.type?.message}>
          <Select {...register('type')}>
            <option value="">—</option>
            <option value="BTP">BTP</option>
            <option value="TP">TP</option>
            <option value="GC">GC</option>
            <option value="PREFA">PREFA</option>
            <option value="USINAGE">USINAGE</option>
            <option value="Autre">Autre</option>
          </Select>
        </Field>

        {/* Ville */}
        <Field label="Ville" error={errors.ville?.message}>
          <Input {...register('ville')} placeholder="BUSSANG" />
        </Field>

        {/* Contact */}
        <Field label="Contact" error={errors.contact?.message}>
          <Input {...register('contact')} placeholder="M. DUPONT Jean" />
        </Field>

        {/* Téléphone */}
        <Field label="Téléphone" error={errors.tel?.message}>
          <Input {...register('tel')} placeholder="06 12 34 56 78" />
        </Field>

        {/* Email */}
        <Field label="Email" error={errors.email?.message}>
          <Input {...register('email')} type="email" placeholder="contact@..." />
        </Field>
      </div>

      {createClient.isError && (
        <p className="mt-3 text-sm" style={{ color: C.danger }}>
          Erreur : {(createClient.error as Error)?.message}
        </p>
      )}
    </Modal>
  );
}

// ---------------------------------------------------------------------------
// Main page
// ---------------------------------------------------------------------------

export function ClientsPage() {
  const { data: clients, isLoading, error } = useClients();
  const { data: affaires = [] } = useAffaires();
  const [showModal, setShowModal] = useState(false);

  // ---- KPI values ----------------------------------------------------------
  const clientsList = clients ?? [];
  const totalCA = affaires.reduce((sum, a) => sum + (a.total_ht ?? 0), 0);
  const topNom = topClientNom(clientsList, affaires as Affaire[]);

  // ---- render --------------------------------------------------------------
  return (
    <div className="space-y-5">
      <PageHeader
        section="Commercial"
        title="Clients"
        subtitle={`${clientsList.length} clients actifs`}
        actions={
          <>
            <Btn variant="secondary" icon={Download}>
              Export
            </Btn>
            <Btn icon={Plus} onClick={() => setShowModal(true)}>
              Nouveau client
            </Btn>
          </>
        }
      />

      {/* KPI row */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4">
        <KPI
          icon={Building2}
          label="Clients"
          value={String(clientsList.length)}
          color={C.primary}
        />
        <KPI
          icon={TrendingUp}
          label="CA 2025"
          value={`${(totalCA / 1000).toFixed(0)} k€`}
          color={C.accent}
        />
        <KPI
          icon={Briefcase}
          label="Affaires actives"
          value={String(affaires.length)}
          color={C.primaryLight}
        />
        <KPI
          icon={Star}
          label="Top client"
          value={topNom}
          color={C.success}
        />
      </div>

      {/* Loading */}
      {isLoading && (
        <div className="flex justify-center py-12">
          <Spinner />
        </div>
      )}

      {/* Error */}
      {error && (
        <p className="text-sm font-medium" style={{ color: C.danger }}>
          Impossible de charger les clients : {(error as Error).message}
        </p>
      )}

      {/* Empty */}
      {!isLoading && !error && clientsList.length === 0 && (
        <p className="text-sm" style={{ color: C.textMuted }}>
          Aucun client
        </p>
      )}

      {/* Card grid — exactly like the mockup */}
      {!isLoading && !error && clientsList.length > 0 && (
        <Card noPadding className="overflow-hidden">
          <div
            className="grid grid-cols-1 md:grid-cols-2 gap-px"
            style={{ backgroundColor: C.border }}
          >
            {(clientsList as Client[]).map((c) => {
              const nbAffaires = affairesCountForClient(affaires as Affaire[], c.id);
              const ca = caForClient(affaires as Affaire[], c.id);
              return (
                <div
                  key={c.id}
                  className="bg-white p-5 hover:bg-stone-50 cursor-pointer transition-colors"
                >
                  {/* Avatar + name + badge */}
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-12 h-12 rounded flex items-center justify-center"
                        style={{ backgroundColor: C.primarySoft }}
                      >
                        <Building2 size={20} style={{ color: C.primary }} />
                      </div>
                      <div>
                        <div className="font-bold text-sm" style={{ color: C.text }}>
                          {c.nom}
                        </div>
                        <div className="text-xs" style={{ color: C.textMuted }}>
                          {c.ville ?? ''}
                        </div>
                      </div>
                    </div>
                    {c.type && (
                      <Badge bg={C.bgSoft} color={C.textMuted}>
                        {c.type}
                      </Badge>
                    )}
                  </div>

                  {/* Stats */}
                  <div className="grid grid-cols-2 gap-3 mb-3">
                    <div>
                      <div
                        className="text-[10px] uppercase tracking-wider font-semibold"
                        style={{ color: C.textMuted }}
                      >
                        Affaires
                      </div>
                      <div
                        className="text-base font-bold font-mono"
                        style={{ color: C.text }}
                      >
                        {nbAffaires}
                      </div>
                    </div>
                    <div>
                      <div
                        className="text-[10px] uppercase tracking-wider font-semibold"
                        style={{ color: C.textMuted }}
                      >
                        CA 2025
                      </div>
                      <div
                        className="text-base font-bold font-mono"
                        style={{ color: C.primary }}
                      >
                        {(ca / 1000).toFixed(0)}k €
                      </div>
                    </div>
                  </div>

                  {/* Contact block */}
                  <div
                    className="pt-3 border-t space-y-1"
                    style={{ borderColor: C.border }}
                  >
                    {c.contact && (
                      <div className="text-xs font-medium" style={{ color: C.text }}>
                        {c.contact}
                      </div>
                    )}
                    {c.tel && (
                      <div
                        className="flex items-center gap-3 text-xs"
                        style={{ color: C.textMuted }}
                      >
                        <span className="flex items-center gap-1">
                          <Phone size={11} />
                          {c.tel}
                        </span>
                      </div>
                    )}
                    {c.email && (
                      <div
                        className="flex items-center gap-1 text-xs"
                        style={{ color: C.textMuted }}
                      >
                        <Mail size={11} />
                        {c.email}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      )}

      <ModalNouveauClient open={showModal} onClose={() => setShowModal(false)} />
    </div>
  );
}

export default ClientsPage;
