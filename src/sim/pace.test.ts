import { describe, it, expect } from 'vitest';
import {
  createGame, seeded, cycleTime, resTime, tripTime, studyTime, spliceTime, boostLen, adLen, adCooldown, brewTime, medsFor,
  startTrip, adClaim, simulate, PACES, RES_DEF, SITE, CYCLE_BASE, AD_CD, AD_LEN, BOOST_LEN, SPLICE_TIME, STUDY_TIME, EAT_FIRST,
  rollDrops, advanceDanger, blankSummary, item, type PaceId, type Ctx,
} from '../sim';

const game = (pace?: PaceId) => createGame({ rng: seeded(1), now: 1_000_000, today: () => 'day1', pace });

describe('balance profiles', () => {
  it('defaults to the prototype pace, which is the raw constants', () => {
    const g = game();
    expect(g.pace.id).toBe('proto');
    expect(cycleTime(g)).toBe(CYCLE_BASE);
    expect(resTime(g, RES_DEF[0])).toBe(RES_DEF[0].time);
    expect(tripTime(g, SITE.pond)).toBe(SITE.pond.time);
    expect([studyTime(g, 0), spliceTime(g), boostLen(g), adLen(g), adCooldown(g)]).toEqual([STUDY_TIME[0], SPLICE_TIME, BOOST_LEN, AD_LEN, AD_CD]);
  });

  it('playtest pace stretches cycles and timers without touching costs or yields', () => {
    const p = game('proto'), r = game('real');
    expect(cycleTime(r)).toBe(CYCLE_BASE * PACES.real.cycle);
    expect(tripTime(r, SITE.pond)).toBe(600); // "ten minutes along the towpath"
    expect(resTime(r, RES_DEF[0])).toBe(RES_DEF[0].time * PACES.real.timer);
    const med = medsFor(0)[0];
    expect(brewTime(r, med, 1)).toBe(brewTime(p, med, 1) * PACES.real.timer);
    expect(adLen(r)).toBe(30);
    expect(r.s.cur).toBe(p.s.cur); // state and data are shared and untouched
  });

  it('timers started under a pace carry its length into the save', () => {
    const r = game('real'); r.s.story[0] = { step: 1, brewing: null, brewed: false, log: [], done: false };
    expect(startTrip(r, 'pond')).toBe(true);
    expect(r.s.trip).toMatchObject({ left: 600, total: 600 });
    simulate(r, 600, 1);
    expect(r.s.trip).toBeNull(); expect(r.s.notes).toBeGreaterThan(0);
  });

  it('the ad cooldown and boost follow the profile', () => {
    const r = game('real');
    expect(adClaim(r, 'boost').ok).toBe(true);
    expect(r.s.boost).toBe(BOOST_LEN * PACES.real.boost);
    expect(r.s.adCd).toBe(AD_CD * PACES.real.adCd);
  });

  it('biters take proportionally longer between bites at playtest pace', () => {
    // a biter and a common, both present from the start of the cycle; drops spawn 6% into the cycle
    const plant = (g: Ctx) => {
      const d = g.s.dishes[0]; const base = rollDrops(g)[0];
      d.drops = [{ ...base, r: 1, i: 2, t0: 0, x: .5, y: .5, dead: false, contained: false, ate: 0, eatT: 0 },
        { ...base, r: 0, i: 0, t0: 0, x: .52, y: .5, dead: false, contained: false, ate: 0, eatT: 0 }];
      return d;
    };
    const dn = item(0, 1, 2).danger; expect(dn).toBeTruthy(); // the Nibbler
    const eatenBy = (pace: PaceId, need: number) => {
      const g = game(pace), d = plant(g), ct = cycleTime(g), sum = blankSummary();
      advanceDanger(g, d, Math.min(ct, 0.06 * ct + need), ct, sum);
      return sum.eaten;
    };
    expect(eatenBy('proto', EAT_FIRST[dn!] * 1.05)).toBe(1);
    expect(eatenBy('real', EAT_FIRST[dn!] * 1.05)).toBe(0); // the prototype interval is not enough at playtest pace
    expect(eatenBy('real', EAT_FIRST[dn!] * PACES.real.bite * 1.05)).toBe(1);
  });
});
