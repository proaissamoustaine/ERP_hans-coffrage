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
  it('garde et valide les nouveaux champs entreprise', () => {
    const r = clientSchema.safeParse({
      nom: 'EIFFAGE',
      siret: '12345678901234',
      tva_intracom: 'FR12 345678901',
      pays: 'Belgique',
      adresse: '1 rue du Test',
      code_postal: '88540',
    });
    expect(r.success).toBe(true);
    if (r.success) {
      expect(r.data).toMatchObject({
        siret: '12345678901234',
        tva_intracom: 'FR12 345678901',
        pays: 'Belgique',
        adresse: '1 rue du Test',
        code_postal: '88540',
      });
    }
  });
  it('refuse un SIRET non composé de 14 chiffres', () => {
    expect(clientSchema.safeParse({ nom: 'OK', siret: '123' }).success).toBe(false);
    expect(clientSchema.safeParse({ nom: 'OK', siret: 'pas-des-chiffres' }).success).toBe(false);
  });
  it('accepte un SIRET vide (optionnel)', () => {
    expect(clientSchema.safeParse({ nom: 'OK', siret: '' }).success).toBe(true);
  });
});
