import { describe, it, expect } from 'vitest';
import {
  createGame, seeded, fresh, migrate, resolve, blankSummary, rollDrops, stock, totalStock, found, catMult, shelfCap,
  reqTake, deliver, story, SAVE_VERSION, startStudy, studyCost,
} from '../sim';
import { validState } from './validate';

const game = (seed = 1, save?: unknown) => createGame({ rng: seeded(seed), now: 1_000_000, today: () => 'day1', save });

describe('the shelf', () => {
  it('a new find is usable at once', () => {
    const g = game(); const d = g.s.dishes[0]; d.drops = rollDrops(g);
    const sum = blankSummary(); resolve(g, d.drops, sum);
    expect(sum.finds.length).toBeGreaterThan(0);
    const f = sum.finds[0];
    expect(stock(g, f.r, f.i)).toBeGreaterThanOrEqual(1);
    expect(totalStock(g)).toBe(sum.drops);
  });

  it('delivering the last specimen leaves the strain found, with its bonus, at zero on the shelf', () => {
    const g = game(); g.s.cat[0] = { '0-0': 2 }; const bonusBefore = catMult(g);
    reqTake(g, [{ t: 'strain', r: 0, i: 0, n: 2 }]);
    expect(g.s.cat[0]['0-0']).toBe(0); expect(stock(g, 0, 0)).toBe(0);
    expect(found(g, 0)).toBe(1); expect(catMult(g)).toBe(bonusBefore);
    expect(validState(g.s)).toBe(true);
    // and the Mayor's five of anything counts everything on the shelf
    g.s.cat[0] = { '0-0': 3, '0-1': 2 }; story(g);
    expect(deliver(g)).toBe(true); expect(totalStock(g)).toBe(0);
  });

  it('the shelf cap bounds the count itself', () => {
    const g = game(); g.s.cat[0] = { '0-0': shelfCap(g) }; const d = g.s.dishes[0]; d.drops = rollDrops(g);
    for (const c of d.drops) { c.r = 0; c.i = 0; c.dead = false; }
    resolve(g, d.drops, blankSummary());
    expect(g.s.cat[0]['0-0']).toBe(shelfCap(g));
  });

  it('a study can use the only specimen', () => {
    const g = game(); g.s.cat[0] = { '0-0': 1 }; g.s.cur = studyCost(g, 0, 0);
    expect(startStudy(g, '0:0-0')).toBe(true); expect(g.s.cat[0]['0-0']).toBe(0);
  });

  it('migrating a v4 save dissolves the keeper copy so usable counts do not change', () => {
    const old = { ...fresh(0), v: 4, cat: { 0: { '0-0': 3, '1-0': 1 } } };
    const s = migrate(old, 0)!;
    expect(s.v).toBe(SAVE_VERSION);
    expect(s.cat[0]).toEqual({ '0-0': 2, '1-0': 0 });
    const g = game(1, old);
    expect(stock(g, 0, 0)).toBe(2); expect(stock(g, 1, 0)).toBe(0); expect(found(g, 0)).toBe(2);
    // a v5 save is taken as is
    expect(migrate({ ...fresh(0), cat: { 0: { '0-0': 2 } } }, 0)!.cat[0]).toEqual({ '0-0': 2 });
  });
});
