import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Briefcase,
  TrendingUp,
  Clock,
  Download,
  Plus,
  Search,
  ChevronRight,
  Check,
} from 'lucide-react';

import { PageHeader } from '../../components/ui/PageHeader';
import { KPI } from '../../components/ui/KPI';
import { Card } from '../../components/ui/Card';
import { Btn } from '../../components/ui/Btn';
import { Modal } from '../../components/ui/Modal';
import { Field } from '../../components/ui/Field';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { Spinner } from '../../components/ui/Spinner';
import { ProgressBar } from '../../components/ui/ProgressBar';
import { TypeBadge } from '../../components/ui/TypeBadge';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { formatDate } from '../../lib/format';
import { C } from '../../lib/theme';
import type { Tables } from '../../lib/database.types';
import { useAffaires, useCreateAffaire } from './useAffaires';
import { useClients } from '../clients/useClients';
import { affaireSchema, type AffaireInput } from './affaireSchema';

// Row type: base affaires row + joined clients relation
type AffaireRow = Tables<'affaires'> & { clients: { nom: string } | null };

// ---------------------------------------------------------------------------
// Modal form — Nouvelle affaire
// ---------------------------------------------------------------------------

type ModalNouvelleAffaireProps = {
  open: boolean;
  onClose: () => void;
};

function ModalNouvelleAffaire({ open, onClose }: ModalNouvelleAffaireProps) {
  const createAffaire = useCreateAffaire();
  const { data: clients } = useClients();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<AffaireInput>({
    resolver: zodResolver(affaireSchema),
    defaultValues: {
      mode: 'coffrage',
      client_id: '',
      chantier: '',
      objet: '',
      total_ht: 0,
      date_livraison: '',
    },
  });

  function onSubmit(values: AffaireInput) {
    createAffaire.mutate(values, {
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
      icon={Briefcase}
      size="md"
      title="Nouvelle affaire"
      subtitle="N° d'affaire généré automatiquement"
      footer={
        <>
          <Btn variant="secondary" onClick={handleClose}>
            Annuler
          </Btn>
          <Btn
            icon={Check}
            onClick={handleSubmit(onSubmit)}
            disabled={createAffaire.isPending}
          >
            {createAffaire.isPending ? 'Enregistrement…' : 'Créer l\'affaire'}
          </Btn>
        </>
      }
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {/* Mode */}
        <Field label="Mode" error={errors.mode?.message}>
          <Select {...register('mode')}>
            <option value="coffrage">Coffrage</option>
            <option value="prefa">Préfa</option>
            <option value="mannequin">Mannequin</option>
            <option value="sateba">Sateba</option>
            <option value="vente">Vente</option>
            <option value="usinage">Usinage</option>
            <option value="decor">Décor</option>
            <option value="autre">Autre</option>
          </Select>
        </Field>

        {/* Client */}
        <Field label="Client" required error={errors.client_id?.message}>
          <Select {...register('client_id')}>
            <option value="">—</option>
            {(clients ?? []).map((c) => (
              <option key={c.id} value={c.id}>
                {c.nom}
              </option>
            ))}
          </Select>
        </Field>

        {/* Chantier */}
        <Field label="Chantier" error={errors.chantier?.message}>
          <Input {...register('chantier')} placeholder="ex: ARCHIPEL STRASBOURG" />
        </Field>

        {/* Objet / Désignation */}
        <Field label="Désignation" error={errors.objet?.message}>
          <Input {...register('objet')} placeholder="ex: Coffrages poutres B1" />
        </Field>

        {/* Montant HT */}
        <Field label="Montant HT (€)" error={errors.total_ht?.message}>
          <Input
            {...register('total_ht', { valueAsNumber: true })}
            type="number"
            step="0.01"
            placeholder="0.00"
          />
        </Field>

        {/* Date de livraison */}
        <Field label="Date de livraison" error={errors.date_livraison?.message}>
          <Input {...register('date_livraison')} type="date" />
        </Field>
      </div>

      {createAffaire.isError && (
        <p className="mt-3 text-sm" style={{ color: C.danger }}>
          Erreur : {(createAffaire.error as Error)?.message}
        </p>
      )}
    </Modal>
  );
}

// ---------------------------------------------------------------------------
// Main page
// ---------------------------------------------------------------------------

export function AffairesPage() {
  const { data: affaires, isLoading, error } = useAffaires();
  const [search, setSearch] = useState('');
  const [showNew, setShowNew] = useState(false);
  const navigate = useNavigate();

  const list = (affaires ?? []) as AffaireRow[];

  const filtered = search.trim()
    ? list.filter((a) => {
        const q = search.toLowerCase();
        return (
          (a.numero ?? '').toLowerCase().includes(q) ||
          (a.clients?.nom ?? '').toLowerCase().includes(q) ||
          (a.chantier ?? '').toLowerCase().includes(q)
        );
      })
    : list;

  // KPI values
  const totalHT = list.reduce((s, a) => s + (a.total_ht ?? 0), 0);
  const nbEnCours = list.filter((a) => a.statut === 'En cours').length;
  const nbTermines = list.filter((a) => a.statut === 'Terminé' || a.statut === 'Soldé').length;

  return (
    <div className="space-y-5">
      {/* Page header — section "Commercial" matches the mockup PageAffaires */}
      <PageHeader
        section="Commercial"
        title="Affaires"
        subtitle={`${list.length} affaire${list.length !== 1 ? 's' : ''} actives · CA cumulé ${(totalHT / 1000).toFixed(1)} k€`}
        actions={
          <>
            <Btn variant="secondary" icon={Download}>
              Export
            </Btn>
            <Btn icon={Plus} onClick={() => setShowNew(true)}>
              Nouvelle affaire
            </Btn>
          </>
        }
      />

      {/* KPI row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
        <KPI
          icon={Briefcase}
          label="Affaires"
          value={String(list.length)}
          color={C.primary}
        />
        <KPI
          icon={TrendingUp}
          label="CA 2025"
          value={`${(totalHT / 1000).toFixed(0)} k€`}
          color={C.accent}
        />
        <KPI
          icon={Clock}
          label="En cours"
          value={String(nbEnCours)}
          color={C.warning}
        />
        <KPI
          icon={Check}
          label="Terminées"
          value={String(nbTermines)}
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
        <Card>
          <p className="text-sm font-medium" style={{ color: C.danger }}>
            Impossible de charger les affaires : {(error as Error).message}
          </p>
        </Card>
      )}

      {/* Content */}
      {!isLoading && !error && (
        <div className="min-w-0">
          <Card noPadding className="overflow-hidden">
            {/* Search bar */}
            <div
              className="px-5 py-3 border-b flex items-center gap-3"
              style={{ borderColor: C.border }}
            >
              <div
                className="flex-1 flex items-center gap-2 px-3 py-2 rounded border"
                style={{ borderColor: C.border }}
              >
                <Search size={14} style={{ color: C.textMuted }} />
                <input
                  className="flex-1 outline-none text-sm bg-transparent"
                  placeholder="Rechercher (n°, client, chantier)…"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  style={{ color: C.text }}
                />
              </div>
            </div>

            {/* Empty state */}
            {filtered.length === 0 && (
              <p className="p-6 text-sm" style={{ color: C.textMuted }}>
                {list.length === 0 ? 'Aucune affaire' : 'Aucun résultat'}
              </p>
            )}

            {/* Table — matches mockup columns: N°, Type, Client/Chantier, Avancement, Statut, Montant HT, Livraison */}
            {filtered.length > 0 && (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[700px] text-sm">
                  <thead style={{ backgroundColor: C.bgSoft }}>
                    <tr>
                      {[
                        'N° Affaire',
                        'Type',
                        'Client / Chantier',
                        'Avancement',
                        'Statut',
                        'Montant HT',
                        'Livraison',
                        '',
                      ].map((h) => (
                        <th
                          key={h}
                          className="text-left px-4 py-3 text-[10px] uppercase tracking-wider font-bold"
                          style={{ color: C.textMuted, borderBottom: `1px solid ${C.border}` }}
                        >
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((a) => (
                      <tr
                        key={a.id}
                        className="cursor-pointer transition-colors hover:bg-stone-50"
                        style={{ borderBottom: `1px solid ${C.borderSoft}` }}
                        onClick={() => navigate('/affaires/' + a.id)}
                      >
                        {/* N° affaire */}
                        <td className="px-4 py-3 font-mono text-sm font-bold" style={{ color: C.primary }}>
                          {a.numero}
                        </td>
                        {/* Type badge */}
                        <td className="px-4 py-3">
                          <TypeBadge mode={a.mode} />
                        </td>
                        {/* Client / Chantier */}
                        <td className="px-4 py-3">
                          <div className="font-semibold text-sm" style={{ color: C.text }}>
                            {a.clients?.nom ?? '—'}
                          </div>
                          <div className="text-xs" style={{ color: C.textMuted }}>
                            {a.chantier ?? '—'}
                          </div>
                        </td>
                        {/* Avancement */}
                        <td className="px-4 py-3 w-32">
                          <div
                            className="text-[10px] mb-1 font-mono font-semibold"
                            style={{ color: C.textMuted }}
                          >
                            {a.avancement ?? 0}%
                          </div>
                          <ProgressBar value={a.avancement ?? 0} height={4} />
                        </td>
                        {/* Statut */}
                        <td className="px-4 py-3">
                          <StatusBadge statut={a.statut} />
                        </td>
                        {/* Montant HT */}
                        <td className="px-4 py-3 text-sm font-bold font-mono" style={{ color: C.text }}>
                          {(a.total_ht ?? 0).toLocaleString('fr-FR')} €
                        </td>
                        {/* Livraison */}
                        <td className="px-4 py-3 text-xs font-mono" style={{ color: C.textMuted }}>
                          {formatDate(a.date_livraison)}
                        </td>
                        {/* Chevron */}
                        <td className="px-4 py-3">
                          <ChevronRight size={14} style={{ color: C.textMuted }} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        </div>
      )}

      <ModalNouvelleAffaire open={showNew} onClose={() => setShowNew(false)} />
    </div>
  );
}

export default AffairesPage;
