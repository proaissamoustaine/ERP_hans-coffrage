import { describe, it, expect } from 'vitest';
import { NAV_ITEMS, visibleNav, visibleNavItems } from './nav';

describe('visibleNav (grouped)', () => {
  it('operateur: voit flashage mais PAS affaires ni factures', () => {
    const sections = visibleNav('operateur');
    const ids = sections.flatMap((s) => s.items.map((i) => i.id));
    expect(ids).toContain('flashage');
    expect(ids).not.toContain('affaires');
    expect(ids).not.toContain('factures');
  });

  it('operateur: sections vides sont supprimées', () => {
    const sections = visibleNav('operateur');
    for (const s of sections) {
      expect(s.items.length).toBeGreaterThan(0);
    }
  });

  it('admin: voit tous les items', () => {
    const sections = visibleNav('admin');
    const ids = sections.flatMap((s) => s.items.map((i) => i.id));
    const allIds = NAV_ITEMS.map((i) => i.id);
    for (const id of allIds) {
      expect(ids).toContain(id);
    }
  });
});

describe('visibleNavItems (compat)', () => {
  it('operateur ne voit pas Affaires ni Factures', () => {
    const ids = visibleNavItems('operateur').map((i) => i.id);
    expect(ids).toContain('flashage');
    expect(ids).not.toContain('affaires');
    expect(ids).not.toContain('factures');
  });
  it('admin voit tout', () => {
    expect(visibleNavItems('admin').length).toBe(NAV_ITEMS.length);
  });
});
