import { describe, expect, it } from 'vitest';
import { createGame, rollDrops, seeded, tick } from './index';
import { fresh, migrate } from './state';

describe('save validation', () => {
  it.each([
    { dishes: [] },
    { ...fresh(0), dishes: [null] },
    { ...fresh(0), dishes: [{}] },
    { ...fresh(0), cur: NaN },
    { ...fresh(0), cur: Infinity },
    { ...fresh(0), cur: -1 },
    { ...fresh(0), tier: 99 },
    { ...fresh(0), last: Infinity },
    { ...fresh(0), boost: '120' },
    { ...fresh(0), gen: { perks: {} } },
    { ...fresh(0), gen: { ...fresh(0).gen, perks: { offline: 99 } } },
    { ...fresh(0), cat: { 0: { '6-9': 2 } } },
    { ...fresh(0), studies: { 'no-colon': true } },
    { ...fresh(0), eq: { incub: 51 } },
    { ...fresh(0), res: { missing: true } },
    { ...fresh(0), active: { id: 'study', key: '9:0-0', left: 5, total: 10 } },
    { ...fresh(0), active: { id: 'luck', left: -5, total: 10 } },
    { ...fresh(0), trip: { site: 'missing', left: 5, total: 10 } },
    { ...fresh(0), brew: { id: 'missing', n: 1, left: 5, total: 10 } },
    { ...fresh(0), placed: [{ id: 'lamp', lv: 5 }, null, null] },
    { ...fresh(0), story: { 0: { step: 99, done: false, brewed: false, log: [] } } },
    { ...fresh(0), tut: { done: false } },
    { ...fresh(0), sp: [[0, 99], null] },
    { ...fresh(0), splice: { id: null, a: [0, 0], b: [0, 1], left: 10, total: 10 } },
    { ...fresh(0), v: 99 },
  ])('rejects malformed or unsupported state without throwing (%#)', value => {
    expect(migrate(value)).toBeNull();
  });

  it('does not mutate the caller and migrations are idempotent', () => {
    const old = { ...fresh(0), v: 3, lv: 12 }, original = structuredClone(old);
    const migrated = migrate(old)!;
    expect(old).toEqual(original);
    expect(migrated.eq.dish).toBe(11);
    expect(migrate(migrated)).toEqual(migrated);
  });

  it('round-trips live gameplay and clears animation clocks from a previous process', () => {
    const g = createGame({ now: 1_000_000, rng: seeded(9), today: () => 'today' });
    g.s.res.auto = true; g.s.ups.b_yield = true;
    for (let k = 0; k < 200; k++) tick(g, 0.25, k * 250);
    const state = migrate(JSON.parse(JSON.stringify(g.s)))!;
    expect(state.cur).toBe(g.s.cur);
    expect(state.cat).toEqual(g.s.cat);
    expect(state.dishes[0].p).toBe(g.s.dishes[0].p);
    expect(state.dishes[0].drops.every(d => !d.atk && !d.meet && !d.frozen && d.cd === 0)).toBe(true);
  });

  it('rejects invalid drop references and finite-looking broken positions', () => {
    const g = createGame({ now: 0, rng: seeded(1) }); g.s.dishes[0].drops = rollDrops(g);
    const copy = structuredClone(g.s); copy.dishes[0].drops[0].x = NaN;
    expect(migrate(copy)).toBeNull();
    g.s.dishes[0].drops[0].i = 99;
    expect(migrate(g.s)).toBeNull();
  });
});
