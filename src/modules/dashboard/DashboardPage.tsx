import { Link, useNavigate } from 'react-router-dom';
import {
  Briefcase,
  TrendingUp,
  Clock,
  Package,
  ArrowRight,
  AlertTriangle,
  Truck,
} from 'lucide-react';

import { useAffaires } from '../affaires/useAffaires';
import { useAuth } from '../../auth/AuthProvider';
import {
  affairesPrioritaires,
  countAffairesEnCours,
  caEnCours,
  formatK,
  isoWeek,
} from '../dashboard/dashboardData';
import { KPI } from '../../components/ui/KPI';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Spinner } from '../../components/ui/Spinner';
import { TypeBadge } from '../../components/ui/TypeBadge';
import { ProgressBar } from '../../components/ui/ProgressBar';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { C } from '../../lib/theme';
import type { Tables } from '../../lib/database.types';

// Row type: base affaires row + joined clients relation
type AffaireRow = Tables<'affaires'> & { clients: { nom: string } | null };

// Capitalise la première lettre (ex : "dimanche …" → "Dimanche …")
function cap(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

export default function DashboardPage() {
  const { data: affaires, isLoading } = useAffaires();
  const { profil } = useAuth();
  const navigate = useNavigate();

  const list = (affaires ?? []) as AffaireRow[];

  const now = new Date();
  const prenom = profil?.nom?.split(' ')[0] ?? '';
  const semaine = isoWeek(now);
  const annee = now.getFullYear();
  const dateLongue = cap(
    now.toLocaleDateString('fr-FR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    }),
  );

  const prioritaires = affairesPrioritaires(list, 5);

  return (
    <div className="space-y-5 lg:space-y-6">
      {/* En-tête */}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-2">
        <div>
          <div
            className="text-[10px] uppercase tracking-[0.25em] mb-1.5 font-semibold"
            style={{ color: C.accent }}
          >
            Vue d'ensemble
          </div>
          <h1
            className="text-2xl lg:text-3xl font-bold"
            style={{ color: C.primary, fontFamily: 'Georgia, serif', letterSpacing: '-0.02em' }}
          >
            Bonjour {prenom}
          </h1>
          <p className="text-xs lg:text-sm mt-1" style={{ color: C.textMuted }}>
            Aperçu de l'activité Hans Coffrage · Semaine {semaine} · {annee}
          </p>
        </div>
        <div className="text-left sm:text-right">
          <div
            className="text-[10px] uppercase tracking-wider font-semibold"
            style={{ color: C.textMuted }}
          >
            Aujourd'hui
          </div>
          <div className="text-sm font-medium" style={{ color: C.text }}>
            {dateLongue}
          </div>
        </div>
      </div>

      {/* KPI */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4">
        <KPI
          icon={Briefcase}
          label="Affaires actives"
          value={String(countAffairesEnCours(list))}
          color={C.primary}
          sub="en cours"
        />
        <KPI
          icon={TrendingUp}
          label="CA en cours (HT)"
          value={formatK(caEnCours(list))}
          color={C.accent}
          sub="affaires en cours"
        />
        <KPI
          icon={Clock}
          label="Heures semaine"
          value="438h"
          color={C.primaryLight}
          sub="démo · à venir"
        />
        <KPI
          icon={Package}
          label="Livraisons à venir"
          value="3"
          color={C.success}
          sub="démo · à venir"
        />
      </div>

      {/* Grille principale */}
      <div className="grid grid-cols-1 lg:grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4 lg:gap-5">
        {/* Affaires prioritaires — RÉEL */}
        <Card className="lg:col-span-2" noPadding>
          <div
            className="px-5 py-4 border-b flex items-center justify-between"
            style={{ borderColor: C.border }}
          >
            <div>
              <h3 className="font-bold text-sm" style={{ color: C.text }}>
                Affaires prioritaires
              </h3>
              <p className="text-xs mt-0.5" style={{ color: C.textMuted }}>
                Échéances proches · trier par livraison
              </p>
            </div>
            <Link
              to="/affaires"
              className="text-xs font-semibold flex items-center gap-1"
              style={{ color: C.primary }}
            >
              Tout voir <ArrowRight size={12} />
            </Link>
          </div>
          <div>
            {isLoading ? (
              <div className="flex justify-center py-12">
                <Spinner />
              </div>
            ) : prioritaires.length === 0 ? (
              <div className="px-5 py-12 text-center text-sm" style={{ color: C.textMuted }}>
                Aucune affaire
              </div>
            ) : (
              prioritaires.map((a) => (
                <div
                  key={a.id}
                  onClick={() => navigate('/affaires/' + a.id)}
                  className="px-5 py-3 flex items-center gap-4 border-b last:border-0 hover:bg-stone-50 cursor-pointer transition-colors"
                  style={{ borderColor: C.border }}
                >
                  <TypeBadge mode={a.mode} />
                  <div className="flex-1 min-w-0">
                    <div className="font-mono text-xs font-bold" style={{ color: C.primary }}>
                      {a.numero}
                    </div>
                    <div className="text-sm font-semibold truncate" style={{ color: C.text }}>
                      {a.clients?.nom ?? '—'}
                    </div>
                    <div className="text-xs truncate" style={{ color: C.textMuted }}>
                      {a.chantier ?? '—'}
                    </div>
                  </div>
                  <div className="w-24">
                    <div
                      className="text-[10px] mb-1 font-mono font-semibold"
                      style={{ color: C.textMuted }}
                    >
                      {a.avancement ?? 0}%
                    </div>
                    <ProgressBar value={a.avancement ?? 0} color={C.accent} height={4} />
                  </div>
                  <StatusBadge statut={a.statut} />
                  <div className="text-right">
                    <div
                      className="text-[10px] uppercase tracking-wider font-semibold"
                      style={{ color: C.textMuted }}
                    >
                      Livraison
                    </div>
                    <div className="text-sm font-bold font-mono" style={{ color: C.text }}>
                      {a.date_livraison
                        ? new Date(a.date_livraison).toLocaleDateString('fr-FR', {
                            day: '2-digit',
                            month: 'short',
                          })
                        : '—'}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>

        {/* Colonne droite : Alertes + Atelier — STUB */}
        <div className="space-y-5">
          {/* Alertes critiques (ruptures stock) — STUB */}
          <div
            className="rounded-lg p-5 border-l-4"
            style={{ backgroundColor: C.dangerSoft, borderColor: C.danger }}
          >
            <div className="flex items-start gap-3">
              <AlertTriangle
                size={18}
                style={{ color: C.danger }}
                className="mt-0.5 flex-shrink-0"
              />
              <div className="flex-1">
                <div className="flex items-center justify-between gap-2">
                  <div className="font-bold text-sm" style={{ color: '#8B2418' }}>
                    Alertes critiques
                  </div>
                  <Badge bg={C.accentSoft} color="#8B6914">
                    Démo
                  </Badge>
                </div>
                <div className="text-xs mt-0.5" style={{ color: '#8B2418' }}>
                  3 ruptures de stock
                </div>
              </div>
            </div>
            <div className="mt-3 space-y-1.5 ml-7">
              <div className="text-xs font-medium" style={{ color: '#8B2418' }}>
                • Bastaing épicéa 63x175 (18 ml)
              </div>
              <div className="text-xs font-medium" style={{ color: '#8B2418' }}>
                • Boulon HM 20x125 (95 u)
              </div>
              <div className="text-xs font-medium" style={{ color: '#8B2418' }}>
                • Film étirable 500mm (12 u)
              </div>
            </div>
            <Link
              to="/stock"
              className="ml-7 mt-3 text-xs font-bold flex items-center gap-1"
              style={{ color: '#8B2418' }}
            >
              Réapprovisionner <ArrowRight size={11} />
            </Link>
          </div>

          {/* Activité atelier · live — STUB */}
          <Card>
            <div className="flex items-center justify-between mb-4">
              <h4 className="font-bold text-sm" style={{ color: C.text }}>
                Activité atelier · live
              </h4>
              <Badge bg={C.accentSoft} color="#8B6914">
                Démo
              </Badge>
            </div>
            <div className="space-y-3">
              {[
                { qui: 'AL · Alexandre Lutenbacher', tache: 'Finition · C25-0226-03F5', duree: '2h 45' },
                { qui: 'DV · Davy Vannson', tache: 'Dessin BE · C25-1028-04', duree: '1h 30' },
                { qui: 'BGu · Benoît Gury', tache: 'Débit · C25-1020-03', duree: '4h 10' },
                { qui: 'MM · Mickaël Mathie', tache: 'Montage · C25-0910-01', duree: '6h 20' },
              ].map((act, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div
                    className="w-2 h-2 rounded-full animate-pulse"
                    style={{ backgroundColor: C.success }}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-semibold" style={{ color: C.text }}>
                      {act.qui}
                    </div>
                    <div className="text-[11px] truncate" style={{ color: C.textMuted }}>
                      {act.tache}
                    </div>
                  </div>
                  <div className="text-xs font-mono font-bold" style={{ color: C.primary }}>
                    {act.duree}
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>

      {/* Grille basse — STUB */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-5">
        {/* Répartition heures — STUB */}
        <Card>
          <div className="flex items-start justify-between mb-1">
            <h3 className="font-bold text-sm" style={{ color: C.text }}>
              Répartition heures · Semaine {semaine}
            </h3>
            <Badge bg={C.accentSoft} color="#8B6914">
              Démo
            </Badge>
          </div>
          <p className="text-xs mb-5" style={{ color: C.textMuted }}>
            438h totales · 326h facturables (74%)
          </p>
          <div className="space-y-3">
            {[
              { label: 'Heures facturables', value: 326, total: 438, color: C.primary },
              { label: 'Non facturable', value: 87, total: 438, color: C.accent },
              { label: 'Investissement', value: 15, total: 438, color: C.primaryLight },
              { label: 'Absences', value: 10, total: 438, color: C.textMuted },
            ].map((row, i) => (
              <div key={i}>
                <div className="flex justify-between text-xs mb-1.5">
                  <span className="font-medium" style={{ color: C.text }}>
                    {row.label}
                  </span>
                  <span className="font-mono font-bold" style={{ color: C.text }}>
                    {row.value}h · {Math.round((row.value / row.total) * 100)}%
                  </span>
                </div>
                <ProgressBar value={(row.value / row.total) * 100} color={row.color} height={6} />
              </div>
            ))}
          </div>
        </Card>

        {/* Prochaines livraisons — STUB */}
        <Card>
          <div className="flex items-start justify-between mb-1">
            <h3 className="font-bold text-sm" style={{ color: C.text }}>
              Prochaines livraisons
            </h3>
            <Badge bg={C.accentSoft} color="#8B6914">
              Démo
            </Badge>
          </div>
          <p className="text-xs mb-5" style={{ color: C.textMuted }}>
            3 expéditions cette semaine
          </p>
          <div className="space-y-2.5">
            {[
              {
                id: 'L1',
                client: 'EIFFAGE ALSACE',
                destination: 'Strasbourg',
                colis: 8,
                poids: 2.4,
                date: '2026-06-29',
                statut: 'Montage',
              },
              {
                id: 'L2',
                client: 'BOUYGUES TP RF',
                destination: 'Mulhouse',
                colis: 5,
                poids: 1.1,
                date: '2026-06-30',
                statut: 'Finition',
              },
              {
                id: 'L3',
                client: 'LEON GROSSE',
                destination: 'Colmar',
                colis: 12,
                poids: 3.8,
                date: '2026-07-02',
                statut: 'Dessin',
              },
            ].map((l) => (
              <div
                key={l.id}
                className="flex items-center gap-3 p-3 rounded transition-colors hover:bg-stone-50"
                style={{ backgroundColor: C.bgSoft }}
              >
                <div
                  className="w-9 h-9 rounded flex items-center justify-center flex-shrink-0"
                  style={{ backgroundColor: 'white' }}
                >
                  <Truck size={16} style={{ color: C.primary }} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-bold" style={{ color: C.text }}>
                    {l.client}
                  </div>
                  <div className="text-xs" style={{ color: C.textMuted }}>
                    {l.destination} · {l.colis} colis · {l.poids}t
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-xs font-mono font-semibold mb-1" style={{ color: C.text }}>
                    {new Date(l.date).toLocaleDateString('fr-FR', {
                      day: '2-digit',
                      month: 'short',
                    })}
                  </div>
                  <StatusBadge statut={l.statut} />
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
