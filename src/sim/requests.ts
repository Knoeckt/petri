// The Clinic: chapter steps, what a request wants, medicines and their recipes.
import { STORY, RAR, TEXT } from '../data';
import type { Medicine, Req, StoryStep } from '../data';
import type { Ctx } from './ctx';
import type { StoryState } from './state';
import { item, stock, totalStock, rarityStock } from './rules';

export function story(g: Ctx): StoryState {
  if (!g.s.story[g.s.tier]) g.s.story[g.s.tier] = { step: 0, brewing: null, brewed: false, log: [], done: false };
  return g.s.story[g.s.tier];
}
export function curStep(g: Ctx): StoryStep | null { const c = STORY[g.s.tier]; const st = story(g); return c && !st.done ? c.steps[st.step] ?? null : null; }

// ---- medicines: every chapter step with a tonic defines that medicine's recipe ----
const medCache: Record<number, Medicine[]> = {};
export function medsFor(t: number): Medicine[] {
  if (medCache[t]) return medCache[t];
  const list: Medicine[] = [];
  const ch = STORY[t];
  if (ch) ch.steps.forEach((s, k) => { if (!s.outbreak && s.tonic && s.need && !list.find(m => m.id === s.tonic)) list.push({ id: s.tonic, n: s.tonic, need: s.need, time: 20 + k * 4 }); });
  return medCache[t] = list;
}
export const med = (g: Ctx, id: string, t = g.s.tier) => medsFor(t).find(m => m.id === id);
/** chapters without explicit `req` lists: a step wants 2,3,3,4,5,3 of its own medicine, plus the previous one or two */
export function stepMeds(t: number, k: number): [string, number][] {
  const ch = STORY[t]; if (!ch) return [];
  const s = ch.steps[k]; if (!s || s.outbreak || !s.tonic) return [];
  const seq = ch.steps.filter(x => !x.outbreak), idx = seq.indexOf(s);
  const own = [2, 3, 3, 4, 5, 3], prev = [0, 1, 2, 2, 3, 4], pp = [0, 0, 0, 0, 1, 2];
  const out: [string, number][] = [[s.tonic, own[Math.min(idx, 5)]]];
  if (idx >= 1 && prev[idx] && seq[idx - 1].tonic) out.push([seq[idx - 1].tonic!, prev[idx]]);
  if (idx >= 2 && pp[idx] && seq[idx - 2].tonic) out.push([seq[idx - 2].tonic!, pp[idx]]);
  return out;
}
export function stepReqs(t: number, k: number): Req[] {
  const ch = STORY[t]; const s = ch && ch.steps[k]; if (!s || s.outbreak) return [];
  if (s.req) return s.req;
  return stepMeds(t, k).map(([id, n]) => ({ t: 'med', id, n }));
}

// ---- requirements ----
export const medHave = (g: Ctx, id: string) => (g.s.meds[g.s.tier] || {})[id] || 0;
export function medsTake(g: Ctx, list: [string, number][]) { const m = g.s.meds[g.s.tier] = g.s.meds[g.s.tier] || {}; for (const [id, q] of list) m[id] = Math.max(0, (m[id] || 0) - q); }
export function reqHave(g: Ctx, q: Req) { return q.t === 'strain' ? stock(g, q.r, q.i) : q.t === 'med' ? medHave(g, q.id) : q.t === 'any' ? totalStock(g) : rarityStock(g, q.r); }
export function reqName(g: Ctx, q: Req) { return q.t === 'strain' ? item(g.s.tier, q.r, q.i).n : q.t === 'med' ? q.id : q.t === 'any' ? 'samples of anything' : `${RAR[q.r].n.toLowerCase()} or better`; }
export const reqOk = (g: Ctx, list: Req[]) => list.every(q => reqHave(g, q) >= q.n);
export const reqSummary = (g: Ctx, list: Req[]) => list.map(q => `${q.n} ${reqName(g, q)}`).join(', ');
/** take exactly what a request wants off the shelf; the entry stays (found forever) even at zero; 'any'/'rarity' take commons first */
export function reqTake(g: Ctx, list: Req[]) {
  const c = g.s.cat[g.s.tier] = g.s.cat[g.s.tier] || {};
  const takeFrom = (key: string, n: number) => { const have = Math.max(0, c[key] || 0), take = Math.min(have, n); c[key] = have - take; return take; };
  for (const q of list) {
    if (q.t === 'strain') takeFrom(`${q.r}-${q.i}`, q.n);
    else if (q.t === 'med') medsTake(g, [[q.id, q.n]]);
    else {
      let left = q.n;
      const keys = Object.keys(c).filter(k => q.t === 'any' || +k[0] >= q.r).sort((a, b) => (+a[0] - +b[0]) || ((c[b] || 0) - (c[a] || 0)));
      while (left > 0) { let took = 0; for (const k of keys) { if (left <= 0) break; const t = takeFrom(k, 1); left -= t; took += t; } if (!took) break; }
    }
  }
}

// ---- brewing numbers ----
export const batchSize = (g: Ctx) => g.s.res.batch3 ? 6 : g.s.res.batch2 ? 3 : 1;
export const brewTime = (g: Ctx, m: Medicine, n: number) => m.time * g.pace.timer * (g.s.res.fastbrew ? 0.5 : 1) * Math.sqrt(n);
export function batchesAffordable(g: Ctx, m: Medicine) { let n = Infinity; for (const [r, i, q] of m.need) n = Math.min(n, Math.floor(stock(g, r, i) / q)); return Math.min(batchSize(g), n === Infinity ? 0 : n); }
/** the medicines worth showing on the rack: needed now or next, or already on the shelf */
export function medsRelevant(g: Ctx): Medicine[] {
  const ids = new Set<string>(); const st = story(g);
  for (const k of [st.step, st.step + 1]) for (const q of stepReqs(g.s.tier, k)) if (q.t === 'med') ids.add(q.id);
  for (const id in g.s.meds[g.s.tier] || {}) if (g.s.meds[g.s.tier][id] > 0) ids.add(id);
  return medsFor(g.s.tier).filter(m => ids.has(m.id));
}

export function clinicHas(g: Ctx) { const s = curStep(g); if (!s) return false; if (s.outbreak) return !g.s.ob; return reqOk(g, stepReqs(g.s.tier, story(g).step)); }

/** the objective line under the vessel, as data: the UI decides how to draw it */
export interface Goal { no: string; kind: 'bloom' | 'none' | 'done' | 'face' | 'deliver' | 'brewing' | 'gather'; who?: string; brew?: { id: string; n: number; left: number }; needs?: { have: number; n: number; name: string; ok: boolean; med: boolean; r: number }[] }
export function goal(g: Ctx): Goal {
  const tierNo = g.s.tier + 1;
  if (g.s.ob) return { no: '☠', kind: 'bloom' };
  const ch = STORY[g.s.tier]; if (!ch) return { no: `${tierNo}`, kind: 'none' };
  const st = story(g); if (st.done) return { no: `${tierNo} ✓`, kind: 'done' };
  const s = ch.steps[st.step], no = `${tierNo}-${st.step + 1}`;
  if (s.outbreak) return { no, kind: 'face', who: s.who };
  const list = stepReqs(g.s.tier, st.step);
  if (reqOk(g, list)) return { no, kind: 'deliver', who: s.who };
  if (g.s.brew) return { no, kind: 'brewing', who: s.who, brew: { id: g.s.brew.id, n: g.s.brew.n, left: g.s.brew.left } };
  return { no, kind: 'gather', who: s.who, needs: list.map(q => { const h = Math.min(reqHave(g, q), q.n); return { have: h, n: q.n, name: reqName(g, q), ok: h >= q.n, med: q.t === 'med', r: q.t === 'strain' || q.t === 'rarity' ? q.r : 0 }; }) };
}
export const currency = () => TEXT.cur;
