// Time passing: the live tick, the offline/warp fast-forward, and the daily reset.
import { TICKETS_PER_DAY, OB_TIME } from '../data';
import type { Ctx } from './ctx';
import { toast, dirty } from './ctx';
import { genRate, cycleTime, boostOn, offlineCap, offlineEff, perk, item } from './rules';
import { rollDrops, moveTick, eatTick, attackTick, dangerInstant, resolve, collect, flashFinds, blankSummary, spawned, type Summary } from './dish';
import { completeResearch, finishBrew, finishSplice, obWin } from './actions';

/** one live frame; dt in seconds, now a millisecond clock for animations */
export function tick(g: Ctx, dt: number, now: number) {
  const s = g.s;
  s.cur += genRate(g) * dt;
  const ct = cycleTime(g), mul = boostOn(g) ? 2 : 1;
  s.dishes.forEach((d, i) => {
    if (!d.drops.length) d.drops = rollDrops(g);
    moveTick(g, d, dt, now); if (!g.paused) attackTick(g, d, now, i);
    if (d.ready || (i === 0 && s.ob)) return;
    d.p += dt * mul;
    if (!g.paused) eatTick(g, d, dt * mul, now);
    if (d.p >= ct) { d.p = ct; d.ready = true; if (s.res.auto) flashFinds(g, collect(g, i)); }
  });
  if (s.active) { s.active.left -= dt; if (s.active.left <= 0) completeResearch(g); }
  if (s.brew) { s.brew.left -= dt; if (s.brew.left <= 0) finishBrew(g); }
  if (s.splice) { s.splice.left -= dt; if (s.splice.left <= 0) finishSplice(g, now); }
  if (s.ob) obTick(g, dt, now);
  dailyReset(g);
  if (s.boost > 0) { s.boost = Math.max(0, s.boost - dt); if (s.boost === 0) dirty(g); }
  if (s.adCd > 0) s.adCd = Math.max(0, s.adCd - dt);
}

export function dailyReset(g: Ctx) {
  const today = g.today();
  if (g.s.tDay !== today) { g.s.tDay = today; g.s.tickets = TICKETS_PER_DAY; g.s.shopT = 0; g.s.shopC = 0; dirty(g); }
}

function obTick(g: Ctx, dt: number, now: number) {
  const o = g.s.ob!; o.t += dt;
  if (perk(g, 'guard')) o.hp -= 1.2 * dt;
  o.spore += dt;
  if (o.spore > 3) {
    o.spore = 0; const d = g.s.dishes[0]; const alive = d.drops.filter(c => !c.dead && spawned(c, d.p / cycleTime(g)));
    if (alive.length) { const v = alive[Math.floor(g.rng() * alive.length)]; v.dead = true; v.deadAt = now; g.emit({ type: 'chomp', x: v.x, y: v.y, col: '#22222c' }); }
  }
  if (o.hp <= 0) obWin(g);
  else if (o.t >= (o.dur || OB_TIME)) { g.s.ob = null; toast(g, 'The bloom pulled back. It will return. Try again from the Clinic.', true); dirty(g); }
}

/** fast-forward `secs` at efficiency `eff` (offline runs slower than play; time warps run at 1) */
export function simulate(g: Ctx, secs: number, eff = 1): Summary {
  const s = g.s;
  const sum = blankSummary(); sum.secs = secs;
  const bsec0 = Math.min(s.boost, secs); s.boost -= bsec0; const bsec = bsec0 * eff, rest = (secs - bsec0) * eff;
  s.cur += genRate(g) * bsec; sum.cur += genRate(g) * bsec;
  s.cur += genRate(g) * rest; sum.cur += genRate(g) * rest;
  const ct = cycleTime(g);
  for (const d of s.dishes) {
    if (!d.drops.length) d.drops = rollDrops(g);
    let time = (d.ready ? ct : d.p) + bsec * 2 + rest;
    if (d.ready) { resolve(g, d.drops, sum); d.ready = false; time -= ct; d.drops = rollDrops(g); }
    const n = Math.min(Math.floor(time / ct), 20000);
    for (let k = 0; k < n; k++) { dangerInstant(g, d.drops, ct, sum); resolve(g, d.drops, sum); d.drops = rollDrops(g); }
    d.p = Math.min(time - n * ct, ct);
    if (n >= 20000) d.p = 0;
    const prog = d.p / ct;
    for (const c of d.drops) { const dn = item(s.tier, c.r, c.i).danger; if (dn && !c.contained && spawned(c, prog)) c.eatT = Math.max(0, (prog - c.t0) * ct); }
  }
  if (s.active) { s.active.left -= secs; if (s.active.left <= 0) completeResearch(g); }
  if (s.brew) { s.brew.left -= secs; if (s.brew.left <= 0) finishBrew(g); }
  if (s.splice) { s.splice.left -= secs; if (s.splice.left <= 0) finishSplice(g, 0); }
  s.adCd = Math.max(0, s.adCd - secs);
  return sum;
}

export interface Offline { away: number; secs: number; capped: boolean; eff: number; sum: Summary }
/** call when the app comes back; returns what happened while away, or null if it was only a moment */
export function checkOffline(g: Ctx, nowMs: number): Offline | null {
  const away = (nowMs - g.s.last) / 1000;
  if (away < 20) return null;
  const cap = offlineCap(g), secs = Math.min(away, cap), eff = offlineEff(g);
  const sum = simulate(g, secs, eff);
  g.s.last = nowMs;
  return { away, secs, capped: away > cap, eff, sum };
}
