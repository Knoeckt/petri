import { ART, ART_MAX, COUNTS, EQ, GEN_DEF, HYB, MORE, RES_DEF, SIDE, SITE, STORY, TIERS, UPI } from '../data';
import type { State } from './state';

const record = (value: unknown): value is Record<string, unknown> =>
  value !== null && typeof value === 'object' && !Array.isArray(value);
const number = (value: unknown): value is number => typeof value === 'number' && Number.isFinite(value);
const positive = (value: unknown): value is number => number(value) && value >= 0;
const integer = (value: unknown): value is number => positive(value) && Number.isSafeInteger(value);
const bool = (value: unknown): value is boolean => typeof value === 'boolean';
const text = (value: unknown): value is string => typeof value === 'string';
const owns = (object: object, key: string) => Object.hasOwn(object, key);
const map = (value: unknown, valid: (value: unknown, key: string) => boolean): boolean =>
  record(value) && Object.entries(value).every(([key, entry]) =>
    !['__proto__', 'constructor', 'prototype'].includes(key) && valid(entry, key));
const tier = (value: unknown): value is number => integer(value) && value < TIERS.length + MORE.length;
const tierKey = (key: string) => /^(0|[1-9]\d*)$/.test(key) && tier(+key);
const pair = (value: unknown): boolean => Array.isArray(value) && value.length === 2 &&
  integer(value[0]) && value[0] < COUNTS.length && integer(value[1]) && value[1] < COUNTS[value[0]];
const strainKey = (key: string) => /^\d+-\d+$/.test(key) && pair(key.split('-').map(Number));
const studyKey = (key: string) => {
  const parts = key.split(':');
  return parts.length === 2 && tierKey(parts[0]) && strainKey(parts[1]);
};
const timer = (value: Record<string, unknown>) => positive(value.left) && positive(value.total) &&
  value.total > 0 && value.left <= value.total;
const nullable = (value: unknown, valid: (value: Record<string, unknown>) => boolean) =>
  value === null || (record(value) && valid(value));
const medicine = (t: number, id: unknown) => text(id) && !!STORY[t]?.steps.some(step => step.tonic === id);
const find = (value: unknown): boolean => record(value) && tier(value.t) && pair([value.r, value.i]);

/** Validate persisted game data before any rule or renderer can dereference it. */
export function validState(value: unknown): value is State {
  if (!record(value)) return false;
  const s = value;
  if (!tier(s.tier) || !positive(s.cur) || !positive(s.last) || !integer(s.v)) return false;
  for (const key of ['notes', 'ads', 'cycles', 'eaten', 'tickets', 'shopT', 'shopC']) {
    if (!integer(s[key])) return false;
  }
  for (const key of ['boost', 'adCd']) if (!positive(s[key])) return false;
  for (const key of ['hasSplicer', 'icepack', 'freeRes']) if (!bool(s[key])) return false;
  if (!text(s.tDay) || !map(s.st, integer) || !map(s.adUse, integer)) return false;
  if (!map(s.eq, (v, k) => owns(EQ, k) && integer(v) && v <= EQ[k].max)) return false;
  if (!map(s.ups, (v, k) => owns(UPI, k) && v === true)) return false;
  if (!map(s.res, (v, k) => {
    const def = RES_DEF.find(r => r.id === k);
    return !!def && (def.max ? integer(v) && v <= def.max : bool(v));
  })) return false;
  if (!map(s.studies, (v, k) => studyKey(k) && v === true)) return false;
  if (!map(s.cat, (v, k) => tierKey(k) && map(v, (n, key) => strainKey(key) && integer(n)))) return false; // 0 = found, none on the shelf
  if (!map(s.meds, (v, k) => tierKey(k) && map(v, (n, id) => medicine(+k, id) && integer(n)))) return false;
  if (!map(s.hyb, (v, k) => owns(HYB, k) && integer(v))) return false;
  if (s.seed !== null) {
    if (!text(s.seed) || !owns(HYB, s.seed) || !record(s.hyb)) return false;
    const copies = s.hyb[s.seed];
    if (!positive(copies) || copies === 0) return false;
  }

  if (!Array.isArray(s.dishes) || s.dishes.length < 1 || s.dishes.length > 4) return false;
  for (const dish of s.dishes) {
    if (!record(dish) || !positive(dish.p) || !bool(dish.ready) || !Array.isArray(dish.drops) || dish.drops.length > 512) return false;
    for (const drop of dish.drops) {
      if (!record(drop) || !pair([drop.r, drop.i])) return false;
      for (const key of ['x', 'y', 't0', 'seed']) if (!positive(drop[key]) || drop[key] > 1) return false;
      if (!positive(drop.s) || drop.s === 0 || !positive(drop.eatT) || !integer(drop.ate)) return false;
      if (!bool(drop.dead) || !bool(drop.contained)) return false;
      for (const key of ['hd', 'sp', 'cd', 'flee', 'deadAt']) if (drop[key] !== undefined && !number(drop[key])) return false;
    }
  }
  if (!nullable(s.active, a => timer(a) && (a.id === 'study'
    ? text(a.key) && studyKey(a.key)
    : RES_DEF.some(r => r.id === a.id)))) return false;
  if (!nullable(s.brew, b => timer(b) && medicine(s.tier as number, b.id) && integer(b.n) && b.n > 0)) return false;
  if (!nullable(s.trip, t => timer(t) && text(t.site) && owns(SITE, t.site))) return false;
  if (!nullable(s.lastTrip, t => text(t.site) && owns(SITE, t.site) && integer(t.notes) && positive(t.at) &&
    nullable(t.sample, sample => pair([sample.r, sample.i]) && bool(sample.isNew)))) return false;
  if (!nullable(s.splice, sp => timer(sp) && pair(sp.a) && pair(sp.b) &&
    (sp.id === null || (text(sp.id) && owns(HYB, sp.id))))) return false;
  if (record(s.splice)) {
    // A failed splice returns both parents to their keeper entries.
    if (!record(s.cat) || !record(s.cat[0])) return false;
    const catalog = s.cat[0];
    for (const parent of [s.splice.a, s.splice.b] as number[][]) {
      if (!integer(catalog[`${parent[0]}-${parent[1]}`])) return false;
    }
  }
  if (!Array.isArray(s.sp) || s.sp.length !== 2 || !s.sp.every(p => p === null || pair(p))) return false;
  if (!nullable(s.spOut, out => text(out.id) && owns(HYB, out.id) && positive(out.at))) return false;

  if (!map(s.story, (value, key) => {
    if (!tierKey(key) || !record(value) || !integer(value.step) || !bool(value.done) || !bool(value.brewed)) return false;
    if (!Array.isArray(value.log) || !value.log.every(text)) return false;
    const chapter = STORY[+key];
    return chapter ? (value.done ? value.step === chapter.steps.length : value.step < chapter.steps.length)
      : value.step === 0 && !value.done;
  })) return false;
  if (!Array.isArray(s.side) || s.side.length > 2 || !s.side.every(q =>
    record(q) && integer(q.k) && !!SIDE[q.k] && integer(q.base))) return false;
  if (!Array.isArray(s.shelf) || !s.shelf.every(find)) return false;
  if (!Array.isArray(s.recent) || !s.recent.every(entry => record(entry) && bool(entry.isNew) &&
    (entry.h !== undefined ? text(entry.h) && owns(HYB, entry.h) : find(entry)))) return false;
  if (!map(s.arts, (levels, id) => owns(ART, id) && map(levels, (count, level) =>
    /^[1-5]$/.test(level) && +level <= ART_MAX && integer(count)))) return false;
  if (!Array.isArray(s.placed) || s.placed.length !== 3 || !s.placed.every(p =>
    p === null || (record(p) && text(p.id) && owns(ART, p.id) && integer(p.lv) && p.lv >= 1 && p.lv <= ART_MAX))) return false;
  const occupied = new Map<string, number>();
  for (const p of s.placed) {
    if (!p) continue;
    const key = `${p.id}:${p.lv}`, count = (occupied.get(key) || 0) + 1;
    occupied.set(key, count);
    if (!record(s.arts)) return false;
    const levels = s.arts[p.id];
    if (!record(levels)) return false;
    const owned = levels[p.lv];
    if (!integer(owned) || owned < count) return false;
  }
  if (!record(s.gen) || !integer(s.gen.runs) || !integer(s.gen.pts)) return false;
  if (!map(s.gen.perks, (v, id) => { const def = GEN_DEF.find(p => p.id === id); return !!def && integer(v) && v <= def.max; })) return false;
  if (!map(s.gen.seen, (v, key) => tierKey(key) && map(v, (seen, strain) => strainKey(strain) && bool(seen)))) return false;
  return record(s.tut) && bool(s.tut.done) && map(s.tut.seen, bool);
}
