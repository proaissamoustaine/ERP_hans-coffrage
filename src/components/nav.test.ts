import { describe, it, expect } from 'vitest';
import { NAV_ITEMS, visibleNavItems } from './nav';

describe('visibleNavItems', () => {
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
