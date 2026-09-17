// Scripted players (ROADMAP §8). None of them imitates a human; each is a habit pattern the economy has to survive.
// A policy is a session schedule plus one routine, `act`, that does the obvious things on every look at the screen.
import { UPT, EQUIP, RES_DEF, ARTS, ART_MAX, ART_MERGE, VAL } from '../data';
import type { Ctx, Rng } from '../sim';
import {
  unlocked, collect, stir, clinicHas, deliver, curStep, stepReqs, faceBloom, medHave, med, batchesAffordable, brewMed,
  resVisible, resDone, resCost, startResearch, eqCanBuy, eqCost, buyEquip, upCanBuy, upCost, buy, sitesOpen, startTrip,
  sideDone, doSide, sideRefill, mgStart, mgFrame, mgDrop, artSpare, placeArt, mergeArt, canAscend, ascend,
  genRate, dropsPer, cycleTime, valMult, tierMult, weights, rarLv,
} from '../sim';

export interface Policy {
  id: string; n: string; d: string;
  /** sessions in a day as [start seconds after 00:00, length seconds]; the run jitters them */
  day: [number, number][];
  /** the very first session runs at least this long: people linger on day one */
  first: number;
  /** seconds between looks at the screen during a session */
  cadence: number;
  /** stirs per look; taps per second while a bloom is up */
  stirs: number; bloomTaps: number;
  /** cheapest affordable, or best payback time */
  choose: 'cheapest' | 'payback';
  /** the pipette: never, a random drop, or dead centre */
  aim: 'skip' | 'random' | 'centre';
  /** the share of biomass kept back rather than spent; a casual player does not run the counter to zero */
  reserve: number;
}

const h = 3600, m = 60;

export const POLICIES: Record<string, Policy> = {
  active: { id: 'active', n: 'Active', d: 'Eight looks a day of about twelve minutes, checks every 30 s, buys the cheapest thing.',
    day: [[7.5 * h, 12 * m], [9 * h, 8 * m], [11 * h, 10 * m], [12.5 * h, 15 * m], [15 * h, 8 * m], [17.5 * h, 12 * m], [20 * h, 20 * m], [22.5 * h, 10 * m]],
    first: 25 * m, cadence: 30, stirs: 4, bloomTaps: 3, choose: 'cheapest', aim: 'random', reserve: 0 },
  casual: { id: 'casual', n: 'Casual', d: 'Three sessions a day of about ten minutes, checks every minute, keeps a quarter of its biomass back.',
    day: [[8 * h, 10 * m], [13 * h, 8 * m], [21 * h, 14 * m]],
    first: 15 * m, cadence: 60, stirs: 1, bloomTaps: 2, choose: 'cheapest', aim: 'random', reserve: 0.25 },
  idle: { id: 'idle', n: 'Idle', d: 'One evening session of about six minutes; the dish does the rest overnight.',
    day: [[21 * h, 6 * m]],
    first: 10 * m, cadence: 60, stirs: 0, bloomTaps: 2, choose: 'cheapest', aim: 'skip', reserve: 0 },
  optimizer: { id: 'optimizer', n: 'Optimizer', d: 'The Active schedule, but every purchase is the best payback time and every pipette drop is perfect.',
    day: [[7.5 * h, 12 * m], [9 * h, 8 * m], [11 * h, 10 * m], [12.5 * h, 15 * m], [15 * h, 8 * m], [17.5 * h, 12 * m], [20 * h, 20 * m], [22.5 * h, 10 * m]],
    first: 25 * m, cadence: 30, stirs: 6, bloomTaps: 4, choose: 'payback', aim: 'centre', reserve: 0 },
};

/** research in the order a sensible player wants it; `wash` and `fridge` rank up repeatedly */
const RESEARCH_ORDER = ['auto', 'storage', 'luck', 'fast', 'batch2', 'dish2', 'fridge', 'fastbrew', 'wash', 'dish3', 'batch3'];
/** bench ranks: the dish first while it can be bought, then the rest round-robin by cheapest */
const BENCH_ORDER = ['dish', 'incub', 'pipette', 'scope', 'clean'];

/** biomass per second the dish is worth right now: passive income plus what a cycle's colonies sell for */
export function score(g: Ctx) {
  const w = weights(rarLv(g)); let ev = 0; for (let r = 0; r < w.length; r++) ev += (w[r] / 100) * (VAL[r] || 0);
  return genRate(g) + (dropsPer(g) / cycleTime(g)) * valMult(g) * tierMult(g) * ev;
}
const quiet = (g: Ctx): Ctx => ({ ...g, s: structuredClone(g.s), emit: () => {}, on: () => () => {} });

/** one look at the screen: harvest, deliver, spend, send, place */
export function act(g: Ctx, p: Policy, nowMs: number, rng: Rng) {
  const s = g.s;
  const budget = () => s.cur * (1 - p.reserve);
  // the dish
  const d = s.dishes[0];
  if (d.ready) collect(g, 0);
  for (let k = 0; k < p.stirs; k++) stir(g);
  // the clinic: face a bloom, or deliver
  const step = curStep(g);
  if (step?.outbreak && !s.ob) faceBloom(g);
  else if (clinicHas(g)) deliver(g);
  // side quests
  sideRefill(g);
  for (let i = s.side.length - 1; i >= 0; i--) if (sideDone(g, s.side[i])) doSide(g, i);
  // brewing: whatever the current request still needs
  const cur = curStep(g);
  if (cur && !cur.outbreak && !s.brew && unlocked(g, 'brew')) {
    for (const q of stepReqs(s.tier, s.story[s.tier]?.step ?? 0)) {
      if (q.t !== 'med' || medHave(g, q.id) >= q.n) continue;
      const mm = med(g, q.id); if (mm && batchesAffordable(g, mm) >= 1) { brewMed(g, q.id); break; }
    }
  }
  // research, one at a time, in priority order
  if (!s.active && unlocked(g, 'lab')) {
    for (const id of RESEARCH_ORDER) {
      const r = RES_DEF.find(x => x.id === id); if (!r || !resVisible(g, r) || resDone(g, r) || (r.req && !s.res[r.req])) continue;
      if (resCost(g, r) <= budget()) { startResearch(g, id); break; }
      break; // the next one on the list is what we are saving for
    }
  }
  // the bench: the dish while it can be ranked, then the cheapest other rank
  for (let guard = 0; guard < 6; guard++) {
    let pick: string | null = null;
    if (eqCanBuy(g, 'dish') && eqCost(g, 'dish').bio <= budget()) pick = 'dish';
    else { let best = Infinity; for (const id of BENCH_ORDER) { if (!eqCanBuy(g, id)) continue; const c = eqCost(g, id); if (c.bio <= budget() && c.notes < best) { best = c.notes; pick = id; } } }
    if (!pick || !buyEquip(g, pick)) break;
  }
  // upgrades
  for (let guard = 0; guard < 12; guard++) {
    const open = UPT.flatMap((t, ti) => t.items.filter(u => upCanBuy(g, u, ti) && upCost(g, u) <= budget()).map(u => ({ u, ti })));
    if (!open.length) break;
    let choice = open[0];
    if (p.choose === 'cheapest') { for (const o of open) if (upCost(g, o.u) < upCost(g, choice.u)) choice = o; }
    else {
      const before = score(g); let best = Infinity;
      for (const o of open) { const q = quiet(g); buy(q, o.u.id); const gain = score(q) - before; const payback = gain > 0 ? upCost(g, o.u) / gain : Infinity; if (payback < best) { best = payback; choice = o; } }
    }
    if (!buy(g, choice.u.id)) break;
  }
  // field trips: the newest open site, as the map defaults to
  if (!s.trip && unlocked(g, 'field')) { const open = sitesOpen(g); if (open.length) startTrip(g, open[open.length - 1].id); }
  // the pipette and the shelf under the dish
  if (p.aim !== 'skip' && unlocked(g, 'tickets')) {
    while (s.tickets > 0 && mgStart(g, nowMs)) { mgFrame(g, p.aim === 'centre' ? nowMs : nowMs + rng() * 2000); mgDrop(g); }
  }
  if (unlocked(g, 'decor')) {
    for (const a of ARTS) for (let lv = 1; lv < ART_MAX; lv++) while (artSpare(g, a.id, lv) >= ART_MERGE && mergeArt(g, a.id, lv));
    const byRarity = ARTS.slice().sort((x, y) => y.r - x.r);
    for (const a of byRarity) for (let lv = ART_MAX; lv >= 1; lv--) while (s.placed.includes(null) && artSpare(g, a.id, lv) > 0 && placeArt(g, a.id, lv));
  }
  // the ladder
  if (canAscend(g)) ascend(g);
}
