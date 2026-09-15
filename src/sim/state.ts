// The whole game is one plain object: JSON in, JSON out. Everything the UI shows is derived from it.
import { STORY, SIDE, ART, TICKETS_PER_DAY } from '../data';

export const SAVE_VERSION = 4;

export interface Meet { until: number; em: string; dir: number }
export interface Attack { phase: 'wind' | 'lunge' | 'back'; t0: number; vi: number; ox: number; oy: number; sx?: number; sy?: number }
export interface Drop {
  r: number; i: number; x: number; y: number;
  t0: number; s: number; seed: number;
  dead: boolean; deadAt?: number; contained: boolean; eatT: number; ate: number;
  hd?: number; sp?: number; cd?: number; flee?: number; meet?: Meet | null; atk?: Attack | null; frozen?: boolean;
}
export interface Dish { p: number; ready: boolean; drops: Drop[] }
export interface StoryState { step: number; brewing: null; brewed: boolean; log: string[]; done: boolean }
export interface Timer { id: string; key?: string; left: number; total: number }
export interface Brew { id: string; n: number; left: number; total: number }
export type Pair = [number, number];
export interface Splice { id: string | null; a: Pair; b: Pair; left: number; total: number }
export interface Outbreak { hp: number; max: number; dur: number; t: number; spore: number; boss: [number, number, number] }
export interface Recent { r?: number; i?: number; t?: number; h?: string; isNew: boolean }
export interface Find { t: number; r: number; i: number }
export interface Placed { id: string; lv: number }
export interface Trip { site: string; left: number; total: number }
export interface TripResult { site: string; notes: number; sample: { r: number; i: number; isNew: boolean } | null; at: number }
export interface Genome { runs: number; pts: number; perks: Record<string, number>; seen: Record<number, Record<string, boolean>> }

export interface State {
  v: number;
  cur: number; tier: number;
  /** field notes, the lab's own money; equipment ranks */
  notes: number; eq: Record<string, number>; trip: Trip | null; lastTrip: TripResult | null;
  ups: Record<string, boolean>;
  res: Record<string, boolean | number>;
  active: Timer | null;
  /** catalog per tier: "r-i" -> copies held (1 keeper + spares) */
  cat: Record<number, Record<string, number>>;
  dishes: Dish[];
  boost: number; adCd: number; ads: number; adUse: Record<string, number>;
  recent: Recent[]; shelf: Find[]; cycles: number; eaten: number;
  hasSplicer: boolean; hyb: Record<string, number>; seed: string | null;
  splice: Splice | null; sp: [Pair | null, Pair | null]; spOut: { id: string; at: number } | null;
  story: Record<number, StoryState>;
  side: { k: number; base: number }[];
  ob: Outbreak | null;
  tickets: number; tDay: string; shopT: number; shopC: number;
  arts: Record<string, Record<number, number>>; placed: (Placed | null)[];
  meds: Record<number, Record<string, number>>; brew: Brew | null;
  icepack: boolean;
  st: Record<string, number>;
  studies: Record<string, boolean>;
  gen: Genome; freeRes: boolean;
  tut: { seen: Record<string, boolean>; done: boolean };
  last: number;
}

export const newDish = (): Dish => ({ p: 0, ready: false, drops: [] });
export const freshGenome = (): Genome => ({ runs: 0, pts: 0, perks: {}, seen: {} });

export function fresh(now: number): State {
  return {
    v: SAVE_VERSION, cur: 0, tier: 0, notes: 0, eq: {}, trip: null, lastTrip: null, ups: {}, res: {}, active: null, cat: {}, dishes: [newDish()],
    boost: 0, adCd: 0, ads: 0, adUse: {}, recent: [], shelf: [], cycles: 0, eaten: 0,
    hasSplicer: false, hyb: {}, seed: null, splice: null, sp: [null, null], spOut: null,
    story: {}, side: [], ob: null, tickets: TICKETS_PER_DAY, tDay: '', shopT: 0, shopC: 0,
    arts: {}, placed: [null, null, null], meds: {}, brew: null, icepack: false, st: {}, studies: {},
    gen: freshGenome(), freeRes: false, tut: { seen: {}, done: false }, last: now,
  };
}

/**
 * Accepts any save the mockup ever wrote (petri-orbit-mock-v2) or this build's, and returns a current State.
 * Returns null for anything that is not a save. Migrations are cumulative and idempotent.
 */
export function migrate(raw: unknown): State | null {
  if (!raw || typeof raw !== 'object') return null;
  const s = raw as any;
  if (!Array.isArray(s.dishes)) return null;
  for (const d of s.dishes) for (const g of d.drops || []) { g.atk = null; g.meet = null; g.frozen = false; }
  s.hyb = s.hyb || {}; s.story = s.story || {}; s.st = s.st || {}; s.studies = s.studies || {};
  s.gen = s.gen || freshGenome(); s.gen.perks = s.gen.perks || {}; s.gen.seen = s.gen.seen || {};
  s.freeRes = !!s.freeRes;
  // the repeatable dish level became Petri dish ranks on the bench (one for one); Notes and trips are new
  s.notes = s.notes || 0; s.eq = s.eq || {}; s.trip = s.trip && s.trip.site ? s.trip : null; s.lastTrip = s.lastTrip || null;
  if (typeof s.lv === 'number') { s.eq.dish = Math.min(30, Math.max(s.eq.dish || 0, s.lv - 1)); delete s.lv; }
  s.side = (s.side || []).filter((x: any) => x && x.base !== undefined && SIDE[x.k]);
  if (s.active && s.active.id === 'study' && !s.active.key) s.active = null;
  s.ob = null;
  if (s.seed === undefined) s.seed = null;
  if (s.splice === undefined || (s.splice && !s.splice.a)) s.splice = null;
  s.hasSplicer = !!s.hasSplicer;
  s.sp = s.sp || [null, null]; s.spOut = s.spOut || null;
  s.ups = s.ups || {}; s.res = s.res || {}; s.cat = s.cat || {}; s.meds = s.meds || {};
  if (s.tickets === undefined) s.tickets = TICKETS_PER_DAY;
  s.tDay = s.tDay || ''; s.shopT = s.shopT || 0; s.shopC = s.shopC || 0; s.icepack = !!s.icepack;
  s.recent = s.recent || []; s.shelf = s.shelf || []; s.cycles = s.cycles || 0; s.eaten = s.eaten || 0;
  s.boost = s.boost || 0; s.adCd = s.adCd || 0; s.ads = s.ads || 0; s.adUse = s.adUse || {};
  s.brew = s.brew && s.brew.id ? s.brew : null;
  if (s.res.wash === true) s.res.wash = 20;
  // artifacts: a plain count became counts per level; placed slots became {id, lv}
  s.arts = s.arts || {};
  for (const id in s.arts) if (typeof s.arts[id] === 'number') s.arts[id] = s.arts[id] > 0 ? { 1: s.arts[id] } : {};
  s.placed = (s.placed || [null, null, null]).map((p: any) => typeof p === 'string' ? (ART[p] ? { id: p, lv: 1 } : null) : (p && ART[p.id] ? { id: p.id, lv: p.lv || 1 } : null));
  while (s.placed.length < 3) s.placed.push(null);
  // mockup saves only (no `v`): chapter 1 grew from 7 steps to 9, map an old position onto the new list
  if (!s.v && !s.storyV) { const st = s.story[0]; if (st) { if (st.done) st.step = STORY[0].steps.length; else if (st.step > 0) st.step = [4, 5, 5, 6, 7, 7, 8][Math.min(st.step, 6)]; } s.storyV = 2; }
  for (const t in s.story) s.story[t].brewing = null;
  s.tut = s.tut || { seen: {}, done: !!(s.story[0] && s.story[0].step >= 5) };
  delete s.theme; delete s.storyV;
  s.v = SAVE_VERSION;
  s.last = typeof s.last === 'number' ? s.last : Date.now();
  return s as State;
}
