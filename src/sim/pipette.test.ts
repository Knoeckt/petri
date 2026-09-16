import { describe, expect, it } from 'vitest';
import { adClaim, buyShop, createGame, mgDrop, mgFrame, mgPos, mgStart, seeded, unlocked } from './index';

const game = (step = 5) => {
  const g = createGame({ now: 0, rng: seeded(4) });
  g.s.story[0] = { step, brewing: null, brewed: false, log: [], done: false };
  g.s.cur = 1000;
  return g;
};

describe('pipette unlock and tickets', () => {
  it.each([0, 1, 4])('blocks play, purchases, and rewarded tickets before 1-5 (step %i)', step => {
    const g = game(step), before = structuredClone(g.s);
    expect(mgStart(g, 0)).toBe(false);
    expect(buyShop(g, 'ticket')).toBe(false);
    expect(adClaim(g, 'ticket').ok).toBe(false);
    expect(g.s).toEqual(before);
    expect(g.mg).toBeNull();
    expect(unlocked(g, 'field')).toBe(step >= 1);
  });

  it('unlocks at 1-5 and stays unlocked in later tiers', () => {
    const g = game();
    expect(buyShop(g, 'ticket')).toBe(true);
    expect(adClaim(g, 'ticket').ok).toBe(true);
    expect(mgStart(g, 0)).toBe(true);
    const later = game(0); later.s.tier = 1;
    expect(mgStart(later, 0)).toBe(true);
  });

  it('cannot double-start, double-pay, or play without a ticket', () => {
    const g = game(); g.s.tickets = 1;
    expect(mgStart(g, 100)).toBe(true);
    expect(mgStart(g, 200)).toBe(false);
    expect(g.mg!.t0).toBe(100);
    expect(mgDrop(g)).toBe(true);
    const after = structuredClone(g.s);
    expect(mgDrop(g)).toBe(false);
    expect(mgStart(g, 300)).toBe(false);
    expect(g.s).toEqual(after);
  });

  it('blocks an old round if progression has been reset', () => {
    const g = game(); mgStart(g, 0); g.s.story[0].step = 0;
    expect(mgDrop(g)).toBe(false);
    expect(g.s.arts).toEqual({});
  });
});

describe('pipette presentation and scoring', () => {
  it.each([[0, 3], [0.1, 2], [0.3, 1], [0.5, 0]])('scores the displayed distance %f as grade %i', (distance, grade) => {
    const g = game(); mgStart(g, 500);
    const at = 500 + Math.asin(distance) / 3.4 * 1000;
    const shown = mgFrame(g, at);
    // Time can move on between a paint and a click; scoring must not sample it again.
    expect(mgPos(g, at + 150)).not.toBeCloseTo(shown);
    expect(mgDrop(g)).toBe(true);
    expect(g.mg!.result).toMatchObject({ grade, pos: shown });
    expect(mgFrame(g, at + 1000)).toBe(shown);
  });

  it('updates at frame cadence inside the old 150 ms refresh interval', () => {
    const g = game(); mgStart(g, 0);
    expect(mgFrame(g, 16)).not.toBe(mgFrame(g, 32));
    mgFrame(g, 48);
    expect(mgDrop(g)).toBe(true);
    expect(g.mg!.result!.grade).toBe(2);
  });

  it('rejects invalid clocks and retains a valid shown position', () => {
    const g = game(); expect(mgStart(g, NaN)).toBe(false);
    expect(g.s.tickets).toBe(3);
    mgStart(g, 0); const shown = mgFrame(g, 10);
    expect(mgFrame(g, Infinity)).toBe(shown);
    expect(mgDrop(g)).toBe(true);
  });
});
