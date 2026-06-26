import { describe, it, expect } from 'vitest';
import { canAccess, roleLabel } from './roles';

describe('roleLabel', () => {
  it("'admin' → 'Administrateur'", () => {
    expect(roleLabel('admin')).toBe('Administrateur');
  });
  it("'bureau_etudes' → \"Bureau d'études\"", () => {
    expect(roleLabel('bureau_etudes')).toBe("Bureau d'études");
  });
  it('null → —', () => {
    expect(roleLabel(null)).toBe('—');
  });
  it("'inconnu' → 'inconnu'", () => {
    expect(roleLabel('inconnu')).toBe('inconnu');
  });
});

describe('canAccess', () => {
  it('admin et direction accèdent à tout', () => {
    expect(canAccess('admin', 'factures')).toBe(true);
    expect(canAccess('direction', 'affaires')).toBe(true);
  });
  it("operateur n'accède PAS aux affaires/devis/factures", () => {
    expect(canAccess('operateur', 'affaires')).toBe(false);
    expect(canAccess('operateur', 'devis')).toBe(false);
    expect(canAccess('operateur', 'factures')).toBe(false);
  });
  it('accès ciblés par rôle', () => {
    expect(canAccess('operateur', 'flashage')).toBe(true);
    expect(canAccess('operateur', 'clients')).toBe(false);
    expect(canAccess('compta', 'factures')).toBe(true);
    expect(canAccess('bureau_etudes', 'devis')).toBe(true);
  });
});
