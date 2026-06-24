import { describe, it, expect } from 'vitest';
import { clientSchema } from './clientSchema';

describe('clientSchema', () => {
  it('accepte un client valide', () => {
    expect(clientSchema.safeParse({ nom: 'EIFFAGE', type: 'BTP', ville: 'STRASBOURG', contact: 'M. X', tel: '06', email: 'a@b.fr' }).success).toBe(true);
  });
  it('refuse un nom vide et un email invalide', () => {
    expect(clientSchema.safeParse({ nom: '', email: 'x' }).success).toBe(false);
    expect(clientSchema.safeParse({ nom: 'OK', email: 'pas-un-email' }).success).toBe(false);
  });
  it('accepte un email vide (optionnel)', () => {
    expect(clientSchema.safeParse({ nom: 'OK', email: '' }).success).toBe(true);
  });
});
