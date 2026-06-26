import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { StatusBadge } from './StatusBadge';

describe('StatusBadge', () => {
  it('affiche "En cours" pour statut="En cours"', () => {
    render(<StatusBadge statut="En cours" />);
    expect(screen.getByText('En cours')).toBeInTheDocument();
  });

  it('affiche "—" pour statut=null', () => {
    render(<StatusBadge statut={null} />);
    expect(screen.getByText('—')).toBeInTheDocument();
  });
});
