import { describe, it, expect } from 'vitest';
import { createGame, seeded, fresh, migrate, iapGrant, iapOwned, adFree, shelfCap, genesis, IAP, SAVE_VERSION, tierMult } from '../sim';
import { validState } from './validate';

const game = (save?: unknown) => createGame({ rng: seeded(1), now: 1_000_000, today: () => 'day1', save });

describe('real-money stand-ins', () => {
  it('grants a product once and records it', () => {
    const g = game();
    expect(iapOwned(g, 'noads')).toBe(false);
    expect(iapGrant(g, 'noads')).toBe(true); expect(iapOwned(g, 'noads')).toBe(true); expect(adFree(g)).toBe(true);
    expect(iapGrant(g, 'noads')).toBe(false); // non-consumable
    expect(iapGrant(g, 'bogus')).toBe(false);
    expect(validState(g.s)).toBe(true);
  });

  it('the starter kit pays out immediately, the deep shelf widens the shelf', () => {
    const g = game(); const cap = shelfCap(g);
    expect(iapGrant(g, 'starter')).toBe(true);
    expect(g.s.cur).toBe(500 * tierMult(g)); expect(g.s.notes).toBe(20); expect(g.s.tickets).toBe(3 + 3);
    expect(iapGrant(g, 'bigshelf')).toBe(true); expect(shelfCap(g)).toBe(cap + 5);
  });

  it('purchases survive Genesis', () => {
    const g = game(); iapGrant(g, 'supporter'); iapGrant(g, 'bigshelf');
    g.s.tier = 2; g.s.story[2] = { step: 7, brewing: null, brewed: false, log: [], done: true };
    genesis(g);
    expect(g.s.gen.runs).toBe(1); expect(iapOwned(g, 'supporter')).toBe(true); expect(iapOwned(g, 'bigshelf')).toBe(true);
  });

  it('every catalogue entry has a price and copy, and unknown products fail validation', () => {
    for (const p of IAP) { expect(p.price).toMatch(/^\$\d+\.\d\d$/); expect(p.d.length).toBeGreaterThan(10); }
    const s = fresh(0); (s.iap as Record<string, unknown>).bogus = true;
    expect(validState(s)).toBe(false);
  });

  it('a v5 save gains an empty purchase record', () => {
    const old = { ...fresh(0), v: 5 } as Record<string, unknown>; delete old.iap;
    const s = migrate(old, 0)!;
    expect(s.v).toBe(SAVE_VERSION); expect(s.iap).toEqual({});
  });
});
