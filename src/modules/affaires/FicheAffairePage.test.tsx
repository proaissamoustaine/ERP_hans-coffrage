import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Routes, Route } from 'react-router-dom';

vi.mock('./useAffaires', () => ({
  useAffaires: () => ({
    data: [
      {
        id: 'a1',
        numero: 'C26-0624-01',
        mode: 'coffrage',
        clients: { nom: 'EIFFAGE ALSACE' },
        chantier: 'ARCHIPEL',
        total_ht: 38500,
        avancement: 40,
        statut: 'En cours',
        date_livraison: '2026-09-12',
        created_at: '2026-06-24',
        element: 'GC1',
        conducteur: 'Jean Testeur',
        conducteur_tel: '03 29 00 00 00',
      },
    ],
    isLoading: false,
    error: null,
  }),
}));

vi.mock('./useEtapes', () => ({
  useEtapes: () => ({
    data: [
      { id: 'e1', etape: 'devis_accepte', fait: true, date: '2026-06-24' },
      { id: 'e6', etape: 'montage', fait: false, date: null },
    ],
    isLoading: false,
  }),
  useToggleEtape: () => ({ mutate: vi.fn() }),
}));

import { FicheAffairePage } from './FicheAffairePage';

describe('FicheAffairePage', () => {
  it("affiche l'en-tête, le client, le cycle de vie et le code-barres", () => {
    render(
      <MemoryRouter initialEntries={['/affaires/a1']}>
        <Routes>
          <Route path="/affaires/:id" element={<FicheAffairePage />} />
        </Routes>
      </MemoryRouter>,
    );

    // Le numéro apparaît dans l'en-tête ET dans le tableau d'infos de la Synthèse.
    expect(screen.getAllByText('C26-0624-01').length).toBeGreaterThan(0);
    expect(screen.getByText('EIFFAGE ALSACE')).toBeInTheDocument();
    // « Montage atelier » est à la fois une étape du cycle et une sous-étape.
    expect(screen.getAllByText('Montage atelier').length).toBeGreaterThan(0);
    expect(screen.getByText('*C26-0624-01*')).toBeInTheDocument();
  });

  it("onglet Synthèse affiche l'élément GC1 et le bouton de cycle avec le nouveau libellé", () => {
    render(
      <MemoryRouter initialEntries={['/affaires/a1']}>
        <Routes>
          <Route path="/affaires/:id" element={<FicheAffairePage />} />
        </Routes>
      </MemoryRouter>,
    );

    // GC1 doit apparaître au moins une fois (tableau infos + code-barres)
    expect(screen.getAllByText(/GC1/).length).toBeGreaterThan(0);
    // Le bouton cycle utilise le nouveau libellé avec le nom de l'étape
    expect(
      screen.getByRole('button', { name: /Marquer «.*» fait/ }),
    ).toBeInTheDocument();
  });

  it("onglet Client & Commande affiche le conducteur Jean Testeur", async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter initialEntries={['/affaires/a1']}>
        <Routes>
          <Route path="/affaires/:id" element={<FicheAffairePage />} />
        </Routes>
      </MemoryRouter>,
    );

    await user.click(screen.getByRole('button', { name: 'Client & Commande' }));
    expect(screen.getByText('Jean Testeur')).toBeInTheDocument();
  });

  it("onglet Prix de revient affiche l'état vide honnête, onglet Heures affiche le badge Démo", async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter initialEntries={['/affaires/a1']}>
        <Routes>
          <Route path="/affaires/:id" element={<FicheAffairePage />} />
        </Routes>
      </MemoryRouter>,
    );

    // Cliquer sur l'onglet « Prix de revient »
    const tabPR = screen.getByRole('button', { name: /Prix de revient/i });
    await user.click(tabPR);
    expect(screen.getByText(/Aucune pièce saisie/)).toBeInTheDocument();

    // Cliquer sur l'onglet « Heures »
    const tabHeures = screen.getByRole('button', { name: /^Heures$/i });
    await user.click(tabHeures);
    expect(screen.getAllByText('Démo').length).toBeGreaterThan(0);
  });
});
