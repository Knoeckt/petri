// Time passing: the live tick, the offline/warp fast-forward, and the daily reset.
import { TICKETS_PER_DAY, OB_TIME } from '../data';
import type { Ctx } from './ctx';
import { toast, dirty } from './ctx';
import { genRate, cycleTime, boostOn, offlineCap, offlineEff, perk } from './rules';
import { rollDrops, moveTick, eatTick, attackTick, advanceDanger, resolve, collect, flashFinds, blankSummary, spawned, type Summary } from './dish';
import { completeResearch, finishBrew, finishSplice, obWin, finishTrip } from './actions';

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
  if (s.trip) { s.trip.left -= dt; if (s.trip.left <= 0) finishTrip(g); }
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

/** Fast-forward chronologically through production, timer completion, and boost expiry.
 * Production can stop at a cap; research, trips, brewing and cooldowns still use all wall time.
 * Offline harvesting is automatic even before auto-harvest research, as in the original design.
 */
export function simulate(g: Ctx, secs: number, eff = 1, productionLimit = secs): Summary {
  if (!Number.isFinite(secs) || secs < 0 || !Number.isFinite(eff) || eff < 0 || eff > 1 ||
    !Number.isFinite(productionLimit) || productionLimit < 0) throw new RangeError('Invalid simulation interval');
  const s = g.s, sum = blankSummary(), EPS = 1e-8;
  sum.secs = secs;
  if (secs === 0) return sum;
  let elapsed = 0;
  const cap = Math.min(secs, productionLimit);
  // Visual attack phases use a process-local clock. Their production timers remain on the drops.
  for (const d of s.dishes) for (const c of d.drops) { c.atk = null; c.meet = null; c.frozen = false; }

  const finishDue = () => {
    if (s.boost <= EPS) s.boost = 0;
    const ct = cycleTime(g);
    if (eff > 0 && cap > 0 && elapsed <= cap + EPS) {
      for (let i = 0; i < s.dishes.length; i++) {
        const d = s.dishes[i];
        if (i === 0 && s.ob) continue; // an outbreak waits for the player
        if (!d.ready && d.p < ct - EPS) continue;
        if (!d.drops.length) d.drops = rollDrops(g);
        resolve(g, d.drops, sum);
        d.p = 0; d.ready = false; d.drops = rollDrops(g);
      }
    }
    const before = s.cur;
    if (s.active && s.active.left <= EPS) completeResearch(g);
    if (s.brew && s.brew.left <= EPS) finishBrew(g);
    if (s.splice && s.splice.left <= EPS) finishSplice(g, 0);
    if (s.trip && s.trip.left <= EPS) {
      finishTrip(g);
      const sample = s.lastTrip?.sample;
      if (sample) {
        sum.drops++;
        if (sample.isNew) sum.finds.push({ t: s.tier, r: sample.r, i: sample.i });
      }
    }
    sum.cur += s.cur - before; // includes a failed splice's refund
  };

  while (elapsed < secs - EPS) {
    finishDue();
    const producing = eff > 0 && elapsed < cap - EPS;
    const speed = producing ? eff * (boostOn(g) ? 2 : 1) : 0;
    const ct = cycleTime(g);
    let dt = secs - elapsed;
    if (producing) dt = Math.min(dt, cap - elapsed);
    if (s.boost > EPS) dt = Math.min(dt, s.boost);
    for (const timer of [s.active, s.brew, s.splice, s.trip]) if (timer) dt = Math.min(dt, timer.left);
    if (producing) {
      // Research may have shortened the cycle since finishDue inspected these dishes.
      let ready = false;
      for (let i = 0; i < s.dishes.length; i++) {
        if (i === 0 && s.ob) continue;
        const d = s.dishes[i];
        if (d.p >= ct - EPS) { d.ready = true; ready = true; }
        else dt = Math.min(dt, (ct - d.p) / speed);
      }
      if (ready) continue;
    }
    const income = producing ? genRate(g) * eff * dt : 0;
    s.cur += income; sum.cur += income;
    if (producing) for (let i = 0; i < s.dishes.length; i++) {
      if (i === 0 && s.ob) continue;
      const d = s.dishes[i];
      if (!d.drops.length) d.drops = rollDrops(g);
      const to = Math.min(ct, d.p + speed * dt);
      advanceDanger(g, d, to, ct, sum);
      d.p = to;
      if (d.p >= ct - EPS) d.ready = true;
    }
    for (const timer of [s.active, s.brew, s.splice, s.trip]) if (timer) timer.left = Math.max(0, timer.left - dt);
    s.boost = Math.max(0, s.boost - dt);
    s.adCd = Math.max(0, s.adCd - dt);
    elapsed += dt;
  }
  finishDue();
  dirty(g);
  return sum;
}

export interface Offline { away: number; secs: number; capped: boolean; eff: number; sum: Summary }
/** call when the app comes back; returns what happened while away, or null if it was only a moment */
export function checkOffline(g: Ctx, nowMs: number): Offline | null {
  if (!Number.isFinite(nowMs) || nowMs < 0) return null;
  const away = (nowMs - g.s.last) / 1000;
  // Rebase after a clock correction instead of waiting for the old future timestamp to catch up.
  if (away <= 0) { g.s.last = nowMs; dailyReset(g); return null; }
  const cap = offlineCap(g), secs = Math.min(away, cap), eff = offlineEff(g);
  const sum = simulate(g, away, eff, secs);
  g.s.last = nowMs;
  dailyReset(g);
  // The threshold suppresses the welcome sheet, not the progress earned on a short interruption.
  return away >= 20 ? { away, secs, capped: away > cap, eff, sum } : null;
}
