import { describe, it, expect } from 'vitest';
import {
  createGame, seeded, fresh, migrate, tick, simulate, checkOffline, collect, resolve, blankSummary, stir,
  story, curStep, stepReqs, reqOk, deliver, clinicHas, goal, unlocked, unlockLabel,
  buy, startResearch, buyEquip, eqCost, eqLv, startTrip, finishTrip, sitesOpen, siteOpen, rerollChance, startStudy, completeResearch, brewMed, finishBrew, medHave,
  shelfCap, stock, weights, rarLv, rarCap, effLv, cycleTime, genRate, offlineEff, dropsPer, guardChance,
  addArt, mergeArt, placeArt, artPerk, artSpare, sideRefill, sideProg, sideDone, doSide, bump,
  ascend, canAscend, genesis, canGenesis, buyGen, genLv, buyShop, shopCost, adClaim, mgStart, mgDrop,
  type Ctx, type Req, resVisible, RES_DEF, TIER_COUNT, STORY, SIDE, GEN_TIER,
} from './index';

const game = (seed = 1, save?: unknown) => createGame({ rng: seeded(seed), now: 1_000_000, today: () => 'day1', save });
const give = (g: Ctx, list: Req[]) => {
  const c = g.s.cat[0] = g.s.cat[0] || {};
  for (const q of list) {
    if (q.t === 'strain') { const k = `${q.r}-${q.i}`; c[k] = Math.max(c[k] || 0, 1) + q.n; }
    else if (q.t === 'any') c['0-0'] = (c['0-0'] || 1) + q.n;
    else if (q.t === 'rarity') c[`${q.r}-0`] = (c[`${q.r}-0`] || 1) + q.n;
    else { g.s.meds[0] = g.s.meds[0] || {}; g.s.meds[0][q.id] = (g.s.meds[0][q.id] || 0) + q.n; }
  }
};
const finishChapter = (g: Ctx, t: number) => { g.s.story[t] = { step: 99, brewing: null, brewed: false, log: [], done: true }; g.s.cat[t] = g.s.cat[t] || {}; for (let i = 0; i < 5; i++) g.s.cat[t][`0-${i}`] = 2; for (let i = 0; i < 3; i++) g.s.cat[t][`1-${i}`] = 2; g.s.cat[t]['2-0'] = 2; g.s.cat[t]['2-1'] = 1; };

describe('a fresh game', () => {
  it('starts on the Mayor with everything locked', () => {
    const g = game();
    expect(g.s.tier).toBe(0); expect(effLv(g)).toBe(0); expect(g.s.notes).toBe(0);
    expect(goal(g)).toMatchObject({ no: '1-1', kind: 'gather', who: 'Mayor Bramble' });
    for (const k of ['field', 'quests', 'shop', 'lab', 'brew', 'tickets', 'decor', 'splicer', 'asc']) expect(unlocked(g, k)).toBe(false);
    expect(unlockLabel('brew')).toBe('1-4');
  });
  it('is deterministic under a seeded rng', () => {
    const a = game(7), b = game(7);
    for (let i = 0; i < 200; i++) { tick(a, 0.5, i * 500); tick(b, 0.5, i * 500); }
    expect(JSON.stringify(a.s)).toBe(JSON.stringify(b.s));
  });
});

describe('chapter 1', () => {
  it('walks all eight deliveries, consuming exactly what each asks and opening areas in order', () => {
    const g = game();
    const opened: string[][] = []; g.on(e => { if (e.type === 'unlock') opened.push(e.areas); });
    for (let k = 0; k < 8; k++) {
      const rq = stepReqs(0, k); expect(clinicHas(g)).toBe(false);
      give(g, rq); expect(clinicHas(g)).toBe(true); expect(deliver(g)).toBe(true); expect(story(g).step).toBe(k + 1);
    }
    expect(g.s.cat[0]).toEqual({ '0-0': 1, '1-0': 1, '0-1': 1, '0-2': 1, '1-2': 1, '2-0': 1 });
    expect(Object.values(g.s.meds[0])).toEqual([0, 0, 0, 0]);
    expect(g.s.hasSplicer).toBe(true);
    expect(opened).toEqual([['field'], ['quests', 'shop'], ['lab'], ['brew'], ['tickets', 'decor'], ['splicer'], ['asc']]);
    expect(curStep(g)!.outbreak).toBe(true);
  });
  it('1-6 wants a live Mirror Mike and 1-8 wants three medicines', () => {
    expect(stepReqs(0, 5)).toEqual([{ t: 'strain', r: 2, i: 0, n: 1 }, { t: 'med', id: 'Fizz-Fix', n: 2 }]);
    expect(stepReqs(0, 7).map(q => q.t === 'med' && q.id)).toEqual(['Contained sample', 'Bitters', 'Mirror wash']);
  });
  it('the bloom completes the chapter and opens scale-up', () => {
    const g = game(); g.s.story[0] = { step: 8, brewing: null, brewed: false, log: [], done: false };
    expect(deliver(g)).toBe(false);
    story(g).brewed = true; expect(deliver(g)).toBe(true); expect(story(g).done).toBe(true);
    expect(goal(g).kind).toBe('done');
  });
});

describe('the dish', () => {
  it('cycles, harvests and sells duplicates while capping the shelf', () => {
    const g = game(3); const d = g.s.dishes[0];
    d.drops = Array.from({ length: 12 }, () => ({ r: 0, i: 0, x: .5, y: .5, t0: 0, s: 1, seed: 0, dead: false, contained: false, eatT: 0, ate: 0 }));
    d.ready = true; const before = g.s.cur;
    const sum = collect(g, 0)!;
    expect(g.s.cat[0]['0-0']).toBe(1 + shelfCap(g)); expect(stock(g, 0, 0)).toBe(5);
    expect(sum.finds.length).toBe(1); expect(g.s.cur - before).toBeCloseTo(11 * 3);
    expect(d.ready).toBe(false); expect(d.drops.length).toBe(1);
  });
  it('a stir nudges progress and counts', () => { const g = game(); stir(g); expect(g.s.dishes[0].p).toBeGreaterThan(0); expect(g.s.st.stir).toBe(1); });
  it('a tick makes the dish ready after a cycle', () => { const g = game(); for (let i = 0; i < 50; i++) tick(g, 0.5, i * 500); expect(g.s.dishes[0].ready).toBe(true); });
  it('biters wait while paused', () => {
    const g = game(5); const d = g.s.dishes[0]; g.paused = true;
    d.drops = [{ r: 0, i: 0, x: .5, y: .5, t0: 0, s: 1, seed: 0, dead: false, contained: false, eatT: 0, ate: 0 }, { r: 2, i: 1, x: .52, y: .5, t0: 0, s: 1, seed: 0, dead: false, contained: false, eatT: 0, ate: 0 }];
    for (let i = 0; i < 100; i++) tick(g, 0.1, i * 100);
    expect(g.s.eaten).toBe(0);
    g.paused = false; for (let i = 100; i < 300; i++) tick(g, 0.1, i * 100);
    expect(g.s.eaten).toBe(1);
  });
});

describe('the economy', () => {
  it('equipment is ranked with notes and a little biomass', () => {
    const g = game(); expect(eqCost(g, 'dish')).toEqual({ notes: 3, bio: 10 });
    expect(buyEquip(g, 'dish')).toBe(false); g.s.notes = 100; g.s.cur = 1000;
    expect(buyEquip(g, 'dish')).toBe(true); expect(eqLv(g, 'dish')).toBe(1); expect(effLv(g)).toBe(1); expect(g.s.notes).toBe(97); expect(g.s.cur).toBe(990); expect(g.s.st.lv).toBe(1);
    expect(eqCost(g, 'dish').notes).toBe(Math.round(3 * 1.15));
    g.s.eq.dish = 30; expect(buyEquip(g, 'dish')).toBe(false);
    g.s.eq.incub = 5; expect(cycleTime(g)).toBeCloseTo(20 * 0.9);
    g.s.eq.pipette = 5; expect(dropsPer(g)).toBe(2); g.s.eq.pipette = 6; expect(dropsPer(g)).toBe(3);
    g.s.eq.clean = 3; expect(shelfCap(g)).toBe(8); expect(guardChance(g)).toBeCloseTo(0.12);
  });
  it('the microscope turns duplicates into new finds', () => {
    const g = game(21); g.s.cat[0] = { '0-0': 3 }; g.s.eq.scope = 15; expect(rerollChance(g)).toBeCloseTo(0.3);
    const sum = blankSummary(); const drops = Array.from({ length: 40 }, () => ({ r: 0, i: 0, x: 0, y: 0, t0: 0, s: 1, seed: 0, dead: false, contained: false, eatT: 0, ate: 0 }));
    resolve(g, drops, sum); expect(sum.finds.length).toBeGreaterThan(1); expect(sum.finds.length).toBeLessThanOrEqual(4);
  });
  it('field trips come back with notes and sometimes a sample', () => {
    const g = game(4); expect(sitesOpen(g).length).toBe(0); expect(startTrip(g, 'pond')).toBe(false);
    g.s.story[0] = { step: 1, brewing: null, brewed: false, log: [], done: false }; expect(siteOpen(g, 'pond')).toBe(true); expect(siteOpen(g, 'bakery')).toBe(false);
    expect(startTrip(g, 'pond')).toBe(true); expect(startTrip(g, 'pond')).toBe(false); expect(g.s.trip).toMatchObject({ site: 'pond', left: 60 });
    for (let i = 0; i < 130; i++) tick(g, 0.5, i * 500);
    expect(g.s.trip).toBeNull(); expect(g.s.notes).toBeGreaterThanOrEqual(4); expect(g.s.notes).toBeLessThanOrEqual(6); expect(g.s.lastTrip!.site).toBe('pond'); expect(g.s.st.trip).toBe(1);
    let samples = 0; for (let k = 0; k < 40; k++) { startTrip(g, 'pond'); finishTrip(g); if (g.s.lastTrip!.sample) samples++; }
    expect(samples).toBeGreaterThan(0); expect(samples).toBeLessThan(20);
    g.s.trip = null; startTrip(g, 'pond'); const before = g.s.notes; simulate(g, 3600); expect(g.s.trip).toBeNull(); expect(g.s.notes).toBeGreaterThan(before);
    startTrip(g, 'pond'); expect(adClaim(g, 'finish trip').ok).toBe(true); expect(g.s.trip).toBeNull();
  });
  it('caps the rarity table by tier', () => {
    const g = game(); g.s.eq.dish = 30; g.s.ups = { l_lv: true, p_lv: true, i_lv: true, b_lv: true }; g.s.res = { tides: true, growlamp: true }; expect(effLv(g)).toBe(46); expect(rarLv(g)).toBe(40);
    expect(weights(rarLv(g)).map(x => +x.toFixed(2))).toEqual([74, 18, 5.75, 1.75, 0.5, 0]);
    g.s.tier = 2; expect(rarCap(g)).toBe(70);
  });
  it('research and studies change the numbers', () => {
    const g = game(); g.s.cur = 1e6; g.s.story[0] = { step: 3, brewing: null, brewed: false, log: [], done: false };
    expect(startResearch(g, 'filter')).toBe(false);
    expect(startResearch(g, 'fast')).toBe(false);
    expect(startResearch(g, 'auto')).toBe(true); g.s.active!.left = 0; tick(g, 0.1, 0); expect(g.s.res.auto).toBe(true);
    g.s.cat[0] = { '0-0': 3, '1-2': 2 }; const base = genRate(g);
    expect(startStudy(g, '0:0-0')).toBe(true); expect(stock(g, 0, 0)).toBe(1); completeResearch(g);
    expect(genRate(g)).toBeCloseTo(base * 1.03);
    expect(startStudy(g, '0:1-2')).toBe(true); completeResearch(g); expect(g.s.studies['0:1-2']).toBe(true);
    g.s.tier = 1; expect(RES_DEF.filter(r => resVisible(g, r)).map(r => r.id)).toContain('filter');
    expect(startResearch(g, 'filter')).toBe(true); completeResearch(g); expect(cycleTime(g)).toBeCloseTo(20 * 1.5 * 0.9); // the Nibbler study teaches guard, not cycle
  });
  it('brews from spares and the shelf research widens it', () => {
    const g = game(); g.s.story[0] = { step: 4, brewing: null, brewed: false, log: [], done: false }; g.s.cat[0] = { '0-0': 5 };
    expect(brewMed(g, 'Fizz-Fix')).toBe(true); expect(stock(g, 0, 0)).toBe(2); g.s.brew!.left = 0; tick(g, 0.1, 0);
    expect(medHave(g, 'Fizz-Fix')).toBe(1);
    expect(shelfCap(g)).toBe(5); g.s.res.fridge = 2; expect(shelfCap(g)).toBe(15); g.s.res.storage = true; expect(shelfCap(g)).toBe(30);
  });
});

describe('offline', () => {
  it('runs at a tenth of play until Night shift', () => {
    const g = game(11); g.s.res.auto = true;
    const full = simulate(g, 3600); g.s.cur = 0; const tenth = simulate(g, 3600, offlineEff(g));
    expect(tenth.cycles).toBeLessThan(full.cycles / 6); expect(tenth.cur).toBeLessThan(full.cur / 6);
    g.s.gen.pts = 9; for (let i = 0; i < 3; i++) buyGen(g, 'offline'); expect(offlineEff(g)).toBeCloseTo(0.4);
    g.s.last = 1_000_000 - 2 * 3600 * 1000; const off = checkOffline(g, 1_000_000)!;
    expect(off.eff).toBeCloseTo(0.4); expect(off.capped).toBe(false); expect(off.sum.secs).toBe(7200);
  });
  it('ignores a moment away', () => { const g = game(); expect(checkOffline(g, 1_000_000 + 5000)).toBeNull(); });
});

describe('side quests', () => {
  it('count what you do from when they appeared, and only offer what exists', () => {
    const g = game(2); sideRefill(g); expect(g.s.side.length).toBe(2);
    for (const x of g.s.side) expect(['brew', 'res', 'ticket', 'splice']).not.toContain(SIDE[x.k].stat);
    g.s.side = [{ k: SIDE.findIndex(q => q.stat === 'harvest'), base: 0 }];
    for (let i = 0; i < 5; i++) bump(g, 'harvest');
    expect(sideProg(g, g.s.side[0])).toBe(5); expect(sideDone(g, g.s.side[0])).toBe(true);
    const before = g.s.cur; expect(doSide(g, 0)).toBe(true); expect(g.s.cur - before).toBe(50); expect(g.s.side.length).toBe(2);
  });
});

describe('artifacts', () => {
  it('merge three spares into the next level and scale the perk', () => {
    const g = game(); for (let i = 0; i < 7; i++) addArt(g, 'chime');
    expect(mergeArt(g, 'chime', 1)).toBe(true); expect(mergeArt(g, 'chime', 1)).toBe(true); expect(mergeArt(g, 'chime', 1)).toBe(false);
    expect(g.s.arts.chime).toEqual({ 1: 1, 2: 2 });
    expect(placeArt(g, 'chime', 2)).toBe(true); expect(placeArt(g, 'chime', 1)).toBe(true); expect(artPerk(g, 'income')).toBeCloseTo(0.3);
    expect(artSpare(g, 'chime', 2)).toBe(1);
  });
  it('the pipette pays an artifact per ticket', () => {
    const g = game(4); g.s.story[0] = { step: 5, brewing: null, brewed: false, log: [], done: false };
    expect(mgStart(g, 0)).toBe(true); expect(g.s.tickets).toBe(2);
    expect(mgDrop(g)).toBe(true); expect(g.mg!.result!.grade).toBe(3); expect(Object.keys(g.s.arts).length).toBe(1);
    expect(mgDrop(g)).toBe(false);
  });
});

describe('the shop', () => {
  it('sells for biomass and clamps the crate to the shelf', () => {
    const g = game(6); g.s.story[0] = { step: 2, brewing: null, brewed: false, log: [], done: false }; g.s.cur = 200; g.s.cat[0] = { '0-0': 3 };
    expect(shopCost(g, 'crate')).toBe(40); expect(buyShop(g, 'crate')).toBe(true); expect(buyShop(g, 'crate')).toBe(true);
    expect(stock(g, 0, 0)).toBe(5); expect(g.s.shopC).toBe(2); expect(shopCost(g, 'crate')).toBe(Math.round(40 * 1.35 * 1.35));
    expect(buyShop(g, 'ticket')).toBe(false);
  });
});

describe('the ladder', () => {
  it('scales up after the chapter and ten finds, and stops at the last vessel', () => {
    const g = game(); expect(canAscend(g)).toBe(false); finishChapter(g, 0); expect(canAscend(g)).toBe(true);
    expect(ascend(g)).toBe(true); expect(g.s.tier).toBe(1); expect(g.s.cur).toBe(0);
    g.s.tier = TIER_COUNT - 1; expect(canAscend(g)).toBe(false);
  });
  it('genesis resets the run, keeps the right things and pays Genome', () => {
    const g = game(9); for (const t of [0, 1, 2]) finishChapter(g, t); g.s.tier = GEN_TIER;
    g.s.hyb = { glowfuzz: 1 }; g.s.seed = 'glowfuzz'; addArt(g, 'chime', 3); g.s.placed = [{ id: 'chime', lv: 3 }, null, null]; g.s.studies = { '0:0-0': true }; g.s.res = { auto: true };
    expect(canGenesis(g)).toBe(true); expect(genesis(g)).toBe(true);
    expect(g.s).toMatchObject({ tier: 0, cur: 0, notes: 0, eq: {}, res: {}, studies: {}, cat: {}, seed: 'glowfuzz', hasSplicer: false, tickets: 3 });
    expect(g.s.arts).toEqual({ chime: { 3: 1 } }); expect(g.s.placed[0]).toEqual({ id: 'chime', lv: 3 });
    expect(g.s.gen).toMatchObject({ runs: 1, pts: 9 }); expect(Object.keys(g.s.gen.seen[0]).length).toBe(10);
    expect(buyGen(g, 'head')).toBe(true); expect(buyGen(g, 'income')).toBe(true); expect(buyGen(g, 'bench')).toBe(true); expect(g.s.gen.pts).toBe(6);
    expect(genRate(g)).toBeCloseTo(0.3 * 1.1 * 1.3); // Old growth, plus the kept level-3 chime
    // a seen strain pays on rediscovery
    const sum = blankSummary(); resolve(g, [{ r: 0, i: 3, x: 0, y: 0, t0: 0, s: 1, seed: 0, dead: false, contained: false, eatT: 0, ate: 0 }], sum);
    expect(sum.cur).toBe(30);
    // the next scale-up gets the warm bench and head start
    finishChapter(g, 0); expect(ascend(g)).toBe(true); expect(g.s.freeRes).toBe(true);
    // head start seeds the dish on the next Genesis, not on scale-up
    for (const t of [0, 1, 2]) finishChapter(g, t); g.s.tier = GEN_TIER; expect(genesis(g)).toBe(true); expect(g.s.eq.dish).toBe(2);
    g.s.cur = 1e6; expect(startResearch(g, 'luck')).toBe(true); expect(g.s.res.luck).toBe(true); expect(g.s.active).toBeNull();
  });
});

describe('ads', () => {
  it('claims rewards and cools down', () => {
    const g = game(); expect(adClaim(g, 'boost').ok).toBe(true); expect(g.s.boost).toBe(120);
    expect(adClaim(g, 'ticket').ok).toBe(false); g.s.adCd = 0;
    const r = adClaim(g, 'time warp'); expect(r.ok).toBe(true); expect(r.sum!.secs).toBe(3600); expect(g.s.st.warp).toBe(1);
  });
});

describe('saves', () => {
  it('round-trips through JSON', () => {
    const g = game(8); for (let i = 0; i < 80; i++) tick(g, 0.5, i * 500);
    const back = migrate(JSON.parse(JSON.stringify(g.s)))!;
    expect(back.cycles).toBe(g.s.cycles); expect(back.v).toBe(4);
  });
  it('imports a mockup save with every legacy shape', () => {
    const old = { ...fresh(0), theme: 'bio', v: undefined, lv: 12, notes: undefined, eq: undefined, arts: { chime: 7, pebble: 2 }, placed: ['chime', null, 'bogus'], story: { 0: { step: 3, brewing: null, brewed: false, log: ['a'], done: false } }, res: { wash: true }, side: [{ k: 1 }], gen: undefined, tut: undefined };
    delete (old as any).storyV;
    const g = game(1, old);
    expect(g.s.arts).toEqual({ chime: { 1: 7 }, pebble: { 1: 2 } }); expect(g.s.placed).toEqual([{ id: 'chime', lv: 1 }, null, null]);
    expect(g.s.story[0].step).toBe(6); expect(g.s.res.wash).toBe(20); expect(g.s.side).toEqual([]); expect(g.s.gen.runs).toBe(0); expect(g.s.tut.done).toBe(true);
    expect(g.s.v).toBe(4); expect((g.s as any).theme).toBeUndefined(); expect((g.s as any).lv).toBeUndefined(); expect(g.s.eq.dish).toBe(11); expect(g.s.notes).toBe(0);
  });
  it('a current save mid-chapter is left alone', () => {
    const g = game(1); g.s.story[0] = { step: 3, brewing: null, brewed: false, log: [], done: false };
    const back = migrate(JSON.parse(JSON.stringify(g.s)))!; expect(back.story[0].step).toBe(3);
  });
  it('a finished old chapter stays finished', () => {
    const old = { ...fresh(0), v: undefined, story: { 0: { step: 7, brewing: null, brewed: false, log: [], done: true } } };
    const g = game(1, old); expect(g.s.story[0].step).toBe(STORY[0].steps.length); expect(g.s.story[0].done).toBe(true);
  });
  it('rejects things that are not saves', () => { expect(migrate(null)).toBeNull(); expect(migrate({ a: 1 })).toBeNull(); expect(migrate('x')).toBeNull(); });
});
