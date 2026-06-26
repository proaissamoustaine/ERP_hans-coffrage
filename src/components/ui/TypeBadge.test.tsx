import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { TypeBadge } from './TypeBadge';

describe('TypeBadge', () => {
  it('affiche "C" et "COFFRAGE" pour mode="coffrage"', () => {
    render(<TypeBadge mode="coffrage" />);
    expect(screen.getByText('C')).toBeInTheDocument();
    expect(screen.getByText('COFFRAGE')).toBeInTheDocument();
  });

  it('affiche "?" et le mode brut pour un mode inconnu "xyz"', () => {
    render(<TypeBadge mode="xyz" />);
    expect(screen.getByText('?')).toBeInTheDocument();
    expect(screen.getByText('xyz')).toBeInTheDocument();
  });
});
