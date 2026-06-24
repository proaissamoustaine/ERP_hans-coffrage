import { describe, it, expect } from 'vitest';
import { devisSchema } from './devisSchema';

describe('devisSchema', () => {
  it('accepte un devis valide', () => {
    expect(
      devisSchema.safeParse({
        mode: 'coffrage',
        client_id: '',
        chantier: 'Chantier A',
        objet: 'Coffrage béton',
        total_ht: 1500,
        frais_transport: 50,
      }).success,
    ).toBe(true);
  });
  it('accepte total_ht = 0 et frais_transport par défaut', () => {
    expect(
      devisSchema.safeParse({ mode: 'sateba', total_ht: 0 }).success,
    ).toBe(true);
  });
  it('refuse total_ht négatif', () => {
    expect(
      devisSchema.safeParse({ mode: 'coffrage', total_ht: -1 }).success,
    ).toBe(false);
  });
  it('refuse frais_transport négatif', () => {
    expect(
      devisSchema.safeParse({ mode: 'coffrage', total_ht: 0, frais_transport: -5 }).success,
    ).toBe(false);
  });
  it('refuse un mode hors enum', () => {
    expect(
      devisSchema.safeParse({ mode: 'inconnu', total_ht: 0 }).success,
    ).toBe(false);
  });
});
