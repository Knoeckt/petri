import { describe, expect, it } from 'vitest';
import {
  advanceDanger, blankSummary, checkOffline, createGame, genRate, guardChance,
  migrate, rollDrops, seeded, simulate, tick, type Ctx, type Drop,
} from './index';

const game = () => createGame({ now: 1_000_000, rng: () => 0, today: () => 'today' });
function live(g: Ctx, seconds: number, step = 0.25) {
  for (let t = 0; t < seconds; t += step) tick(g, Math.min(step, seconds - t), (t + step) * 1000);
}
const drop = (r: number, i = 0, t0 = 0): Drop => ({
  r, i, t0, x: 0.5, y: 0.5, s: 1, seed: 0,
  dead: false, contained: false, eatT: 0, ate: 0,
});

describe('offline event timing', () => {
  it.each([5, 10, 20])('pays the same passive boost income as live play over %s seconds', seconds => {
    const a = game(), b = game();
    // Hold an already banked, empty production setup to isolate passive income.
    a.s.dishes = []; b.s.dishes = [];
    a.s.boost = b.s.boost = 10;
    live(a, seconds); const result = simulate(b, seconds);
    expect(b.s.cur).toBeCloseTo(a.s.cur);
    expect(result.cur).toBeCloseTo(0.3 * (seconds + Math.min(seconds, 10)));
    expect(b.s.boost).toBeCloseTo(a.s.boost);
  });

  it('applies offline efficiency without slowing the boost clock', () => {
    const g = game(); g.s.dishes = []; g.s.boost = 10;
    expect(simulate(g, 20, 0.1).cur).toBeCloseTo(0.9);
    expect(g.s.boost).toBe(0);
  });

  it('does not extend a boost through a floating-point remainder', () => {
    const g = game(); g.s.dishes = []; g.s.boost = 1e-10;
    expect(simulate(g, 20).cur).toBeCloseTo(6);
  });

  it('uses a second dish for the time remaining after its research finishes', () => {
    const a = game(), b = game();
    for (const g of [a, b]) {
      g.s.res.auto = true;
      g.s.active = { id: 'dish2', left: 5, total: 5 };
    }
    live(a, 60); const result = simulate(b, 60);
    expect(result.cycles).toBe(5);
    expect(b.s.dishes.map(d => d.p)).toEqual(a.s.dishes.map(d => d.p));
    expect(b.s.cat).toEqual(a.s.cat);
    expect(b.s.cur).toBeCloseTo(a.s.cur);
  });

  it('changes cycle speed and income when research or studies complete', () => {
    for (const id of ['fast', 'study']) {
      const a = game(), b = game();
      for (const g of [a, b]) {
        g.s.res.auto = true;
        g.s.cat[0] = { '0-0': 2 };
        g.s.active = { id, ...(id === 'study' ? { key: '0:0-0' } : {}), left: 5, total: 5 };
      }
      live(a, 60); simulate(b, 60);
      expect(b.s.cur).toBeCloseTo(a.s.cur);
      expect(b.s.cycles).toBe(a.s.cycles);
      expect(b.s.dishes[0].p).toBeCloseTo(a.s.dishes[0].p);
      expect(genRate(b)).toBeCloseTo(genRate(a));
    }
  });

  it('counts discoveries toward passive income for the rest of the absence', () => {
    const a = game(), b = game(); a.s.res.auto = b.s.res.auto = true;
    live(a, 60); const result = simulate(b, 60);
    expect(b.s.cur).toBeCloseTo(a.s.cur);
    expect(result.cur).toBeCloseTo(b.s.cur);
    expect(result.finds).toEqual([{ t: 0, r: 0, i: 0 }]);
  });

  it('has the same economic outcome when catch-up is split into smaller intervals', () => {
    const a = createGame({ now: 0, rng: seeded(22) }), b = createGame({ now: 0, rng: seeded(22) });
    for (const g of [a, b]) {
      g.s.eq.dish = 30; g.s.ups.b_yield = true; g.s.res.auto = true; g.s.boost = 17;
      g.s.dishes.push({ p: 3, ready: false, drops: [] });
      g.s.active = { id: 'fast', left: 23, total: 23 };
    }
    const whole = simulate(a, 123, 0.4), first = simulate(b, 31, 0.4), rest = simulate(b, 92, 0.4);
    expect(b.s.cur).toBeCloseTo(a.s.cur);
    expect(first.cur + rest.cur).toBeCloseTo(whole.cur);
    expect(b.s.cat).toEqual(a.s.cat);
    expect(b.s.eaten).toBe(a.s.eaten);
    expect(b.s.dishes.map(d => d.drops)).toEqual(a.s.dishes.map(d => d.drops));
    for (let i = 0; i < a.s.dishes.length; i++) expect(b.s.dishes[i].p).toBeCloseTo(a.s.dishes[i].p);
  });

  it('preserves production across varied interruption patterns and random seeds', () => {
    for (let seed = 1; seed <= 20; seed++) {
      const a = createGame({ now: 0, rng: seeded(seed) }), b = createGame({ now: 0, rng: seeded(seed) });
      for (const g of [a, b]) {
        g.s.eq.dish = 30; g.s.ups.b_yield = true; g.s.ups.i_yield = true;
        g.s.boost = 50; g.s.res.wash = 10;
        g.s.active = { id: 'dish2', left: 17, total: 17 };
      }
      simulate(a, 600, 0.7);
      for (const seconds of [11, 45, 8, 200, 0.5, 100, 235.5]) simulate(b, seconds, 0.7);
      expect(b.s.cur).toBeCloseTo(a.s.cur);
      expect(b.s.cat).toEqual(a.s.cat);
      expect(b.s.cycles).toBe(a.s.cycles);
      expect(b.s.eaten).toBe(a.s.eaten);
      expect(migrate(b.s)).not.toBeNull();
    }
  });

  it('finishes timers after the production cap without granting extra production', () => {
    const g = game();
    g.s.active = { id: 'luck', left: 5 * 3600, total: 5 * 3600 };
    g.s.brew = { id: 'Fizz-Fix', n: 1, left: 5 * 3600, total: 5 * 3600 };
    g.s.trip = { site: 'pond', left: 5 * 3600, total: 5 * 3600 };
    const result = checkOffline(g, g.s.last + 8 * 3600 * 1000)!;
    expect(result).toMatchObject({ away: 8 * 3600, secs: 4 * 3600, capped: true });
    expect(result.sum.cycles).toBe(72); // 4 h × 10% / 20 s
    expect(g.s.res.luck).toBe(true);
    expect(g.s.meds[0]['Fizz-Fix']).toBe(1);
    expect(g.s.trip).toBeNull();
    expect(g.s.notes).toBe(4);
    expect(migrate(g.s)).not.toBeNull();
  });

  it('accounts for short interruptions quietly and exactly once', () => {
    const g = game(); g.s.active = { id: 'luck', left: 3, total: 3 };
    expect(checkOffline(g, 1_005_000)).toBeNull();
    expect(g.s.res.luck).toBe(true);
    expect(g.s.cur).toBeCloseTo(0.15);
    expect(g.s.last).toBe(1_005_000);
    expect(checkOffline(g, 1_005_000)).toBeNull();
    expect(g.s.cur).toBeCloseTo(0.15);
  });

  it('rebases a backward clock change and resets the day on resume', () => {
    const g = game(); g.s.tickets = 0; g.s.tDay = 'yesterday';
    expect(checkOffline(g, 990_000)).toBeNull();
    expect(g.s.cur).toBe(0); expect(g.s.last).toBe(990_000); expect(g.s.tickets).toBe(3);
    checkOffline(g, 995_000);
    expect(g.s.cur).toBeCloseTo(0.15);
    expect(checkOffline(g, NaN)).toBeNull();
    expect(g.s.last).toBe(995_000);
  });

  it('does not discard cycles beyond the former 20,000-cycle limit', () => {
    const g = game(); const result = simulate(g, 20 * 20_001);
    expect(result.cycles).toBe(20_001);
    expect(g.s.dishes[0].p).toBeCloseTo(0);
  });

  it('does nothing for a zero-length interval, and rejects invalid durations', () => {
    const g = game(), before = structuredClone(g.s);
    expect(simulate(g, 0)).toEqual(blankSummary()); expect(g.s).toEqual(before);
    expect(() => simulate(g, Infinity)).toThrow(RangeError);
    expect(() => simulate(g, -1)).toThrow(RangeError);
    expect(() => simulate(g, 10, NaN)).toThrow(RangeError);
  });
});

describe('offline danger', () => {
  it('does not reroll protection for a biter whose spawn roll failed', () => {
    const g = game(); g.s.res.wash = 10;
    const d = g.s.dishes[0]; d.drops = [drop(1, 2), drop(0)];
    expect(guardChance(g)).toBe(0.5);
    const result = simulate(g, 20);
    expect(result.eaten).toBe(1); // rng() = 0 would succeed if protection were rerolled
    expect(g.s.cat[0]['0-0']).toBeUndefined();
  });

  it('does not give a Nibbler a second bite when live play becomes offline play', () => {
    const g = game(), d = g.s.dishes[0];
    d.p = 10; d.drops = [drop(1, 2), drop(0), drop(0, 1)];
    d.drops[0].ate = 1; d.drops[1].dead = true;
    expect(simulate(g, 10).eaten).toBe(0);
    expect(g.s.cat[0]['0-1']).toBe(1);
  });

  it('retains bite timers across intervals and waits for victims to spawn', () => {
    const a = game(), b = game();
    for (const g of [a, b]) g.s.dishes[0].drops = [drop(2, 1), drop(0, 0, 0.4), drop(0, 1, 0.5)];
    const sumA = blankSummary(), sumB = blankSummary();
    advanceDanger(a, a.s.dishes[0], 20, 20, sumA);
    advanceDanger(b, b.s.dishes[0], 7, 20, sumB);
    expect(sumB.eaten).toBe(0);
    b.s.dishes[0].p = 7;
    advanceDanger(b, b.s.dishes[0], 20, 20, sumB);
    expect(sumB.eaten).toBe(2);
    expect(b.s.dishes[0].drops).toEqual(a.s.dishes[0].drops);
  });

  it('honors protection selected at spawn', () => {
    const g = game(); g.s.eq.dish = 30; g.s.res.wash = 20;
    g.rng = () => 0.9; // uncommon Nibbler, protected at spawn
    const hunter = rollDrops(g)[0];
    expect(hunter).toMatchObject({ r: 1, i: 2, contained: true });
    g.s.dishes[0].drops = [hunter, drop(0)];
    const sum = blankSummary(); advanceDanger(g, g.s.dishes[0], 20, 20, sum);
    expect(sum.eaten).toBe(0);
  });
});
