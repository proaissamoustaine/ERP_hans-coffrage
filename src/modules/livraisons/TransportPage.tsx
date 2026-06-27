// src/modules/livraisons/TransportPage.tsx
import { useMemo, useState } from 'react';
import { Truck, TrendingUp, Activity, MapPin, Send, FileText, Package } from 'lucide-react';

import { PageHeader } from '../../components/ui/PageHeader';
import { Card } from '../../components/ui/Card';
import { KPI } from '../../components/ui/KPI';
import { Btn } from '../../components/ui/Btn';
import { Field } from '../../components/ui/Field';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { C } from '../../lib/theme';

import { useCommandesTransport, useCreerCommande } from './useCommandesTransport';
import { useAffaires } from '../affaires/useAffaires';
import { useColis } from '../colisage/useColis';
import { encombrement, mailtoCommande } from './livraisonsData';
import { PrintView } from './print/PrintView';
import { CommandeTransportPrint } from './print/CommandeTransportPrint';

export default function TransportPage() {
  const { data: commandesData } = useCommandesTransport();
  const { data: affairesData } = useAffaires();
  const { data: colisData } = useColis();
  const creerCommande = useCreerCommande();

  const commandes = useMemo(() => commandesData ?? [], [commandesData]);
  const affaires = useMemo(() => affairesData ?? [], [affairesData]);
  const colis = useMemo(() => colisData ?? [], [colisData]);

  // Formulaire commande transport (state local)
  const [affaireId, setAffaireId] = useState('');
  const [cout, setCout] = useState('');
  const [dateEnlevement, setDateEnlevement] = useState('');
  const [dateLivraison, setDateLivraison] = useState('');
  const [showApercu, setShowApercu] = useState(false);

  // Affaire sélectionnée
  const affaireChoisie = useMemo(
    () => affaires.find((a) => a.id === affaireId) ?? null,
    [affaires, affaireId],
  );

  // Colis de l'affaire sélectionnée
  const colisDeLAffaire = useMemo(
    () => colis.filter((c) => c.affaire_id === affaireId),
    [colis, affaireId],
  );

  // Encombrement calculé depuis les colis
  const enc = useMemo(() => encombrement(colisDeLAffaire), [colisDeLAffaire]);

  // Coordonnées destinataire (auto depuis l'affaire)
  const destinataire = useMemo(() => {
    if (!affaireChoisie) return '';
    const clientNom = (affaireChoisie as { clients?: { nom: string } | null }).clients?.nom ?? '';
    return clientNom || affaireChoisie.numero;
  }, [affaireChoisie]);

  const adresse = useMemo(() => {
    if (!affaireChoisie) return '';
    return affaireChoisie.chantier ?? '';
  }, [affaireChoisie]);

  const conducteur = useMemo(() => (affaireChoisie as { conducteur?: string | null } | null)?.conducteur ?? '', [affaireChoisie]);
  const conducteurTel = useMemo(() => (affaireChoisie as { conducteur_tel?: string | null } | null)?.conducteur_tel ?? '', [affaireChoisie]);

  // KPI calculés
  const now = new Date();
  const commandesCeMois = useMemo(
    () =>
      commandes.filter((c) => {
        const d = new Date(c.created_at as string);
        return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [commandes],
  );

  const coutCeMois = useMemo(
    () => commandesCeMois.reduce((s, c) => s + (c.cout ?? 0), 0),
    [commandesCeMois],
  );

  const coutMoyen = useMemo(
    () =>
      commandesCeMois.length > 0 ? Math.round(coutCeMois / commandesCeMois.length) : 0,
    [coutCeMois, commandesCeMois],
  );

  const regionsLivrees = useMemo(() => {
    const chantiers = new Set(
      commandesCeMois
        .map((c) => c.affaire?.chantier ?? null)
        .filter((v): v is string => v !== null && v !== ''),
    );
    return chantiers.size;
  }, [commandesCeMois]);

  // Envoi commande
  const handleEnvoyer = async () => {
    if (!affaireChoisie) return;
    const coutNum = cout ? parseFloat(cout) : null;
    const created = await creerCommande.mutateAsync({
      affaire_id: affaireId,
      livraison_id: null,
      cout: coutNum,
      date_enlevement: dateEnlevement || null,
      date_livraison: dateLivraison || null,
      encombrement: enc,
    });
    window.location.href = mailtoCommande({
      reference: created.reference as string,
      affaireNumero: affaireChoisie.numero,
      destinataire,
      adresse,
      dateEnlevement: dateEnlevement || null,
      dateLivraison: dateLivraison || null,
      cout: coutNum,
      encombrement: enc,
      colis: colisDeLAffaire.map((c) => ({ numero: c.numero, poids: c.poids })),
    });
  };

  const canEnvoyer = !!affaireId && !creerCommande.isPending;

  return (
    <div className="space-y-5">
      <PageHeader
        section="Logistique"
        title="Transport"
        subtitle="Commandes auprès Transports Rouillon · suivi facturation 15/30"
        actions={<Btn icon={Truck}>Commande transport</Btn>}
      />

      {/* KPI */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4">
        <KPI icon={Truck} label="Commandes ce mois" value={String(commandesCeMois.length)} color={C.primary} />
        <KPI icon={TrendingUp} label="Coût ce mois" value={`${coutCeMois} €`} color={C.accent} />
        <KPI icon={Activity} label="Coût moyen / livraison" value={`${coutMoyen} €`} color={C.primaryLight} />
        <KPI icon={MapPin} label="Régions livrées" value={String(regionsLivrees)} color={C.success} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-5">
        {/* Carte formulaire commande */}
        <Card>
          <h3 className="font-bold text-base mb-1" style={{ color: C.text }}>
            Nouvelle commande transport
          </h3>
          <p className="text-xs mb-4" style={{ color: C.textMuted }}>
            Envoi auto à rh@transports-rouillon.fr
          </p>

          {affaires.length === 0 ? (
            <p className="text-sm py-4 text-center" style={{ color: C.textMuted }}>
              Aucune affaire disponible. Créez d'abord une affaire avant de planifier un transport.
            </p>
          ) : (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <Field label="Affaire" required>
                  <Select
                    value={affaireId}
                    onChange={(e) => setAffaireId(e.target.value)}
                  >
                    <option value="">— Choisir —</option>
                    {affaires.map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.numero}{a.chantier ? ` · ${a.chantier}` : ''}
                      </option>
                    ))}
                  </Select>
                </Field>
                <Field label="Coût transport (€)" required>
                  <Input
                    type="number"
                    step="0.01"
                    value={cout}
                    onChange={(e) => setCout(e.target.value)}
                    placeholder="ex: 630"
                  />
                </Field>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <Field label="Date enlèvement" required>
                  <Input
                    type="date"
                    value={dateEnlevement}
                    onChange={(e) => setDateEnlevement(e.target.value)}
                  />
                </Field>
                <Field label="Date livraison" required>
                  <Input
                    type="date"
                    value={dateLivraison}
                    onChange={(e) => setDateLivraison(e.target.value)}
                  />
                </Field>
              </div>

              {/* Encombrement (lecture seule, calculé depuis les colis) */}
              <div className="p-3 rounded" style={{ backgroundColor: C.bgSoft }}>
                <div className="text-[10px] uppercase tracking-wider font-bold mb-2" style={{ color: C.textMuted }}>
                  Encombrement
                </div>
                <div className="grid grid-cols-4 gap-2 text-xs">
                  <div>
                    <span className="text-[10px]" style={{ color: C.textMuted }}>Long.</span>
                    <div className="font-mono font-bold">{enc.long_ml.toFixed(2)} ml</div>
                  </div>
                  <div>
                    <span className="text-[10px]" style={{ color: C.textMuted }}>Larg.</span>
                    <div className="font-mono font-bold">{enc.larg_ml.toFixed(2)} ml</div>
                  </div>
                  <div>
                    <span className="text-[10px]" style={{ color: C.textMuted }}>Haut.</span>
                    <div className="font-mono font-bold">{enc.haut_ml.toFixed(2)} ml</div>
                  </div>
                  <div>
                    <span className="text-[10px]" style={{ color: C.textMuted }}>Poids</span>
                    <div className="font-mono font-bold">{enc.poids_t.toFixed(3)} t</div>
                  </div>
                </div>
              </div>

              {/* Détail par colis */}
              {affaireId && colisDeLAffaire.length > 0 && (
                <div className="rounded border" style={{ borderColor: C.border }}>
                  <div
                    className="px-3 py-2 border-b text-[10px] uppercase tracking-wider font-bold flex items-center justify-between"
                    style={{ borderColor: C.border, backgroundColor: C.bgSoft, color: C.textMuted }}
                  >
                    <span>Détail par colis (auto depuis fiches colisage)</span>
                    <span style={{ color: C.text }}>{colisDeLAffaire.length} colis</span>
                  </div>
                  <div className="divide-y" style={{ borderColor: C.border }}>
                    {colisDeLAffaire.map((c, i) => (
                      <div key={c.id} className="px-3 py-2 flex items-center gap-3 text-xs">
                        <Package size={14} style={{ color: C.primary }} />
                        <div className="flex-1 font-semibold" style={{ color: C.text }}>
                          Colis n° {c.numero ?? i + 1}
                        </div>
                        <div className="font-mono font-bold" style={{ color: C.text }}>
                          {(c.poids ?? 0).toLocaleString('fr-FR')} kg
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Coordonnées destinataire (auto) */}
              {affaireId && (
                <div className="border-t pt-3" style={{ borderColor: C.border }}>
                  <div className="text-xs uppercase tracking-wider font-bold mb-2" style={{ color: C.textMuted }}>
                    Coordonnées destinataire (auto)
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <Field label="Destinataire">
                      <Input value={destinataire} readOnly />
                    </Field>
                    <Field label="Adresse">
                      <Input value={adresse} readOnly />
                    </Field>
                    <Field label="Conducteur travaux">
                      <Input value={conducteur} readOnly />
                    </Field>
                    <Field label="Tél conducteur">
                      <Input value={conducteurTel} readOnly />
                    </Field>
                  </div>
                </div>
              )}

              <div className="flex items-center gap-2">
                <Btn
                  icon={Send}
                  onClick={handleEnvoyer}
                  disabled={!canEnvoyer}
                >
                  Envoyer la commande
                </Btn>
                <Btn
                  variant="secondary"
                  icon={FileText}
                  onClick={() => setShowApercu(true)}
                  disabled={!affaireId}
                >
                  Aperçu
                </Btn>
              </div>
            </div>
          )}
        </Card>

        {/* Carte vérification factures Rouillon */}
        <Card>
          <h3 className="font-bold text-base mb-1" style={{ color: C.text }}>
            Vérification factures Rouillon
          </h3>
          <p className="text-xs mb-4" style={{ color: C.textMuted }}>
            État mensuel · facturation 15 du mois
          </p>
          <table className="w-full text-xs">
            <thead style={{ backgroundColor: C.bgSoft }}>
              <tr>
                {['Date', 'Affaire', 'Destination', 'Coût'].map((h) => (
                  <th
                    key={h}
                    className="text-left px-2 py-2 text-[9px] uppercase tracking-wider font-bold"
                    style={{ color: C.textMuted }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {commandes.length === 0 ? (
                <tr>
                  <td
                    colSpan={4}
                    className="px-2 py-6 text-center"
                    style={{ color: C.textMuted }}
                  >
                    Aucune commande
                  </td>
                </tr>
              ) : (
                <>
                  {commandes.map((cmd) => (
                    <tr
                      key={cmd.id}
                      className="border-b"
                      style={{ borderColor: C.border }}
                    >
                      <td className="px-2 py-2 font-mono">
                        {cmd.created_at
                          ? new Date(cmd.created_at as string).toLocaleDateString('fr-FR', {
                              day: '2-digit',
                              month: '2-digit',
                            })
                          : '—'}
                      </td>
                      <td className="px-2 py-2 font-mono font-bold" style={{ color: C.primary }}>
                        {cmd.affaire?.numero ?? '—'}
                      </td>
                      <td className="px-2 py-2" style={{ color: C.textMuted }}>
                        {cmd.affaire?.chantier ?? '—'}
                      </td>
                      <td className="px-2 py-2 font-mono font-bold text-right">
                        {cmd.cout != null ? `${cmd.cout} €` : '—'}
                      </td>
                    </tr>
                  ))}
                  <tr style={{ backgroundColor: C.primarySoft }}>
                    <td colSpan={3} className="px-2 py-2 font-bold">
                      TOTAL
                    </td>
                    <td className="px-2 py-2 font-mono font-bold text-right">
                      {commandes.reduce((s, c) => s + (c.cout ?? 0), 0)} €
                    </td>
                  </tr>
                </>
              )}
            </tbody>
          </table>
        </Card>
      </div>
      {showApercu && affaireChoisie && (
        <PrintView title="Aperçu commande transport" onClose={() => setShowApercu(false)}>
          <CommandeTransportPrint
            reference="(aperçu — non envoyée)"
            affaireNumero={affaireChoisie.numero}
            destinataire={destinataire}
            adresse={adresse}
            conducteur={conducteur || null}
            conducteurTel={conducteurTel || null}
            dateEnlevement={dateEnlevement || null}
            dateLivraison={dateLivraison || null}
            cout={cout ? parseFloat(cout) : null}
            encombrement={enc}
            colis={colisDeLAffaire.map((c) => ({ numero: c.numero, poids: c.poids }))}
          />
        </PrintView>
      )}
    </div>
  );
}
