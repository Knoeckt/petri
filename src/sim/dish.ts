// Life in the dish: rolling colonies, wandering, biters, harvesting.
import { COUNTS, VAL, EAT_EVERY, EAT_FIRST, EMOTES, TEXT } from '../data';
import type { Ctx } from './ctx';
import { toast, dirty } from './ctx';
import type { Dish, Drop, Find } from './state';
import { item, dropsPer, rollRarity, guardChance, cycleTime, shelfCap, seenBefore, tierMult, valMult, bump, rerollChance, tierDef } from './rules';
import { pick } from './rng';

export interface Summary { cur: number; drops: number; cycles: number; finds: Find[]; secs: number; eaten: number }
export const blankSummary = (): Summary => ({ cur: 0, drops: 0, cycles: 0, finds: [], secs: 0, eaten: 0 });

/** a colony shows up once the cycle is past its t0 */
export const spawned = (d: Drop, prog: number) => prog >= d.t0 + 0.06;
export const angDiff = (a: number, b: number) => ((a - b + Math.PI * 3) % (Math.PI * 2)) - Math.PI;

// ---- geometry in vessel-normalised coordinates ----
export function randPos(g: Ctx): [number, number] {
  const B = g.bounds;
  if (B.type === 'rect') return [B.minX + g.rng() * (B.maxX - B.minX), B.minY + g.rng() * (B.maxY - B.minY)];
  const a = g.rng() * Math.PI * 2, d = Math.sqrt(g.rng()) * B.r * 0.9;
  const x = 0.5 + Math.cos(a) * d; let y = 0.5 + Math.sin(a) * d;
  if (B.type === 'dome') y = Math.min(y, B.maxY);
  return [x, y];
}
export function clampPos(g: Ctx, d: Drop) {
  const B = g.bounds;
  if (B.type === 'rect') { d.x = Math.min(B.maxX, Math.max(B.minX, d.x)); d.y = Math.min(B.maxY, Math.max(B.minY, d.y)); return; }
  const rx = d.x - 0.5, ry = d.y - 0.5, rr = Math.hypot(rx, ry);
  if (rr > B.r) { d.x = 0.5 + rx / rr * B.r; d.y = 0.5 + ry / rr * B.r; }
  if (B.type === 'dome') d.y = Math.min(d.y, B.maxY);
}
export function nearEdge(g: Ctx, d: Drop) {
  const B = g.bounds;
  if (B.type === 'rect') return d.x < B.minX + 0.06 || d.x > B.maxX - 0.06 || d.y < B.minY + 0.06 || d.y > B.maxY - 0.06;
  const rr = Math.hypot(d.x - 0.5, d.y - 0.5);
  return rr > B.r * 0.85 || (B.type === 'dome' && d.y > B.maxY - 0.05);
}
function centre(g: Ctx): [number, number] { const B = g.bounds; return B.type === 'rect' ? [(B.minX + B.maxX) / 2, (B.minY + B.maxY) / 2] : [0.5, 0.5]; }

export function rollDrops(g: Ctx): Drop[] {
  const n = Math.floor(dropsPer(g) + 1e-9); const out: Drop[] = [];
  for (let k = 0; k < n; k++) {
    const r = rollRarity(g); const i = Math.floor(g.rng() * COUNTS[r]); const it = item(g.s.tier, r, i);
    const [x, y] = randPos(g);
    let t0 = g.rng() * 0.55; if (it.danger) t0 = Math.min(t0, 0.3);
    out.push({ r, i, x, y, t0, s: 0.75 + g.rng() * 0.5, seed: g.rng(), dead: false, contained: !!(it.danger && g.rng() < guardChance(g)), eatT: 0, ate: 0 });
  }
  return out;
}

/** wandering, fleeing and greeting; `now` is a millisecond clock for the animation timers */
export function moveTick(g: Ctx, d: Dish, dt: number, now: number) {
  const prog = d.p / cycleTime(g), drops = d.drops, t = g.s.tier;
  for (let a = 0; a < drops.length; a++) {
    const c = drops[a]; if (c.dead || !spawned(c, prog)) continue;
    const dn = item(t, c.r, c.i).danger;
    if (c.sp === undefined) { if (c.hd === undefined) c.hd = g.rng() * Math.PI * 2; c.sp = 0.6 + g.rng() * 0.7; c.cd = c.cd || 0; }
    if (c.atk || c.frozen || c.contained) continue;
    if (c.meet) { if (now > c.meet.until) { c.meet = null; c.cd = now + 3500 + g.rng() * 3000; } continue; }
    let fx = 0, fy = 0;
    if (!dn) for (const o of drops) { if (o === c || o.dead || o.contained || !item(t, o.r, o.i).danger || !spawned(o, prog)) continue; const dx = c.x - o.x, dy = c.y - o.y, dd = Math.hypot(dx, dy) || 0.001; if (dd < 0.2) { fx += dx / dd; fy += dy / dd; } }
    let speed = 0.045 * c.sp!;
    if (fx || fy) { c.hd = Math.atan2(fy, fx); speed *= 2.4; c.flee = now + 250; }
    else c.hd! += (g.rng() - 0.5) * 3.5 * dt;
    if (nearEdge(g, c)) { const [cx, cy] = centre(g); c.hd! += angDiff(Math.atan2(cy - c.y, cx - c.x), c.hd!) * 5 * dt; }
    c.x += Math.cos(c.hd!) * speed * dt; c.y += Math.sin(c.hd!) * speed * dt;
    clampPos(g, c);
    if (!dn && now > (c.cd || 0)) for (let b = a + 1; b < drops.length; b++) {
      const o = drops[b];
      if (o.dead || o.meet || o.contained || o.atk || o.frozen || now < (o.cd || 0) || !spawned(o, prog) || item(t, o.r, o.i).danger) continue;
      if (Math.hypot(c.x - o.x, c.y - o.y) < 0.1) { const em = pick(g.rng, EMOTES), until = now + 1400; c.meet = { until, em, dir: Math.atan2(o.y - c.y, o.x - c.x) }; o.meet = { until, em, dir: Math.atan2(c.y - o.y, c.x - o.x) }; c.hd = c.meet.dir + Math.PI; o.hd = o.meet.dir + Math.PI; break; }
    }
  }
}

/** biters count down to a bite, then pick the nearest neighbour and wind up */
export function eatTick(g: Ctx, d: Dish, dt: number, now: number) {
  const ct = cycleTime(g), prog = d.p / ct, t = g.s.tier;
  for (const c of d.drops) {
    const dn = item(t, c.r, c.i).danger;
    if (!dn || c.dead || c.contained || !spawned(c, prog) || c.atk) continue;
    if (dn === 1 && c.ate >= 1) continue;
    c.eatT += dt;
    const need = (c.ate === 0 ? EAT_FIRST[dn] : EAT_EVERY[dn]) * g.pace.bite;
    if (c.eatT < need) continue;
    let best = -1, bd = 1e9;
    d.drops.forEach((v, k) => { if (v === c || v.dead || v.frozen || item(t, v.r, v.i).danger || !spawned(v, prog)) return; const dd = (v.x - c.x) ** 2 + (v.y - c.y) ** 2; if (dd < bd) { bd = dd; best = k; } });
    if (best < 0) { c.eatT = need; continue; }
    const v = d.drops[best]; v.frozen = true; v.meet = null;
    c.atk = { phase: 'wind', t0: now, vi: best, ox: c.x, oy: c.y }; c.meet = null;
  }
}

/** wind-up, lunge, bite, return */
export function attackTick(g: Ctx, d: Dish, now: number, di: number) {
  const t = g.s.tier;
  for (const c of d.drops) {
    const A = c.atk; if (!A) continue;
    const v = d.drops[A.vi], e = now - A.t0;
    if (c.contained || c.dead || !v || v.dead) { if (v) v.frozen = false; c.atk = null; c.eatT = 0; continue; }
    if (A.phase === 'wind') { if (e > 600) { A.phase = 'lunge'; A.t0 = now; A.sx = c.x; A.sy = c.y; } }
    else if (A.phase === 'lunge') {
      const k = Math.min(1, e / 240), ease = k * k;
      c.x = A.sx! + (v.x - A.sx!) * ease * 0.8; c.y = A.sy! + (v.y - A.sy!) * ease * 0.8;
      if (k >= 1) {
        v.dead = true; v.deadAt = now; v.frozen = false; c.ate++; c.eatT = 0; g.s.eaten++;
        if (di === 0) { g.emit({ type: 'chomp', x: v.x, y: v.y, col: item(t, v.r, v.i).look.col }); toast(g, `${item(t, c.r, c.i).n} ate ${item(t, v.r, v.i).n}! Tap it to quarantine.`, true); }
        A.phase = 'back'; A.t0 = now; A.sx = c.x; A.sy = c.y;
      }
    } else { const k = Math.min(1, e / 500), ease = 1 - (1 - k) * (1 - k); c.x = A.sx! + (A.ox - A.sx!) * ease; c.y = A.sy! + (A.oy - A.sy!) * ease; if (k >= 1) c.atk = null; }
  }
}

/** Offline bites use growth time, retaining each biter's elapsed timer and prior kills.
 * Spawn protection was already rolled by rollDrops; catch-up never rolls it again.
 * Travel/attack animations are omitted while away, but only spawned specimens can be eaten.
 */
export function advanceDanger(g: Ctx, d: Dish, to: number, ct: number, sum: Summary) {
  const EPS = 1e-8, drops = d.drops;
  let cursor = d.p;
  const spawnAt = (c: Drop) => (c.t0 + 0.06) * ct;
  const danger = (c: Drop) => item(g.s.tier, c.r, c.i).danger;
  const hunters = drops.filter(c => !c.dead && !c.contained && danger(c));
  if (!hunters.length) return;
  const hunting = (c: Drop) => spawnAt(c) <= cursor + EPS && !(danger(c) === 1 && c.ate >= 1);
  const need = (c: Drop) => (c.ate ? EAT_EVERY[danger(c)] : EAT_FIRST[danger(c)]) * g.pace.bite;
  const victim = (c: Drop) => drops.filter(v => v !== c && !v.dead && !danger(v) && spawnAt(v) <= cursor + EPS)
    .sort((a, b) => Math.hypot(a.x - c.x, a.y - c.y) - Math.hypot(b.x - c.x, b.y - c.y))[0];

  while (cursor < to - EPS) {
    let next = to;
    for (const c of drops) {
      const at = spawnAt(c);
      if (!c.dead && at > cursor + EPS) next = Math.min(next, at);
    }
    for (const c of hunters) if (hunting(c) && victim(c)) next = Math.min(next, cursor + Math.max(0, need(c) - c.eatT));
    const dt = Math.max(0, next - cursor);
    for (const c of hunters) if (hunting(c)) c.eatT += dt;
    cursor = next;
    for (const c of hunters) {
      if (!hunting(c) || c.eatT + EPS < need(c)) continue;
      const v = victim(c);
      if (!v) { c.eatT = need(c); continue; }
      v.dead = true; v.deadAt = 0; v.frozen = false;
      c.ate++; c.eatT = 0; sum.eaten++; g.s.eaten++;
    }
  }
}

/** Convenience for a complete untouched cycle. */
export function dangerInstant(g: Ctx, drops: Drop[], ct: number, sum: Summary) {
  advanceDanger(g, { p: 0, ready: false, drops }, ct, ct, sum);
}

/** bank a dish's colonies: new finds go in the catalog, duplicates sell and stock the shelf up to its cap */
export function resolve(g: Ctx, drops: Drop[], sum: Summary) {
  const t = g.s.tier; const c = g.s.cat[t] = g.s.cat[t] || {};
  let gained = 0;
  for (const d of drops) {
    if (d.dead) continue;
    let key = `${d.r}-${d.i}`;
    // the microscope: a duplicate may turn out to be a strain of that rarity you had not found
    if (c[key] && rerollChance(g) > 0 && g.rng() < rerollChance(g)) { const unfound = tierDef(t).items[d.r].map((_, i) => i).filter(i => !c[`${d.r}-${i}`]); if (unfound.length) { d.i = unfound[Math.floor(g.rng() * unfound.length)]; key = `${d.r}-${d.i}`; } }
    const isNew = !c[key];
    c[key] = Math.min((c[key] || 0) + 1, 1 + shelfCap(g));
    if (isNew) {
      bump(g, 'find');
      if (seenBefore(g, t, key)) { const bonus = VAL[d.r] * tierMult(g) * 10; gained += bonus; toast(g, `Seen before: ${item(t, d.r, d.i).n}. +${Math.round(bonus)}`); }
      sum.finds.push({ t, r: d.r, i: d.i }); g.s.shelf = [{ t, r: d.r, i: d.i }, ...g.s.shelf].slice(0, 5);
    } else gained += VAL[d.r] * tierMult(g) * valMult(g);
    g.s.recent.unshift({ r: d.r, i: d.i, t, isNew }); sum.drops++;
  }
  g.s.recent.length = Math.min(g.s.recent.length, 8);
  g.s.cur += gained; sum.cur += gained; sum.cycles++; g.s.cycles++; bump(g, 'harvest');
}

export function collect(g: Ctx, i: number, sum?: Summary): Summary | null {
  const d = g.s.dishes[i]; if (!d || !d.ready) return null;
  sum = sum || blankSummary();
  resolve(g, d.drops, sum);
  d.p = 0; d.ready = false; d.drops = rollDrops(g);
  dirty(g);
  return sum;
}
export function flashFinds(g: Ctx, s: Summary | null) { if (s && s.finds.length) { g.emit({ type: 'find', finds: s.finds }); toast(g, `New: ${s.finds.map(f => item(f.t, f.r, f.i).n).join(', ')}`); } }

export function contain(g: Ctx, d: Drop) { if (d.contained || d.dead) return; d.contained = true; bump(g, 'contain'); toast(g, `${item(g.s.tier, d.r, d.i).n} ${TEXT.contain.toLowerCase()}.`); }
/** a tap on the dish: nudges the first dish forward by STIR_SECS and counts toward quests */
export const STIR_SECS = 0.35;
export function stir(g: Ctx) { bump(g, 'stir'); const d = g.s.dishes[0]; if (d && !d.ready && !g.s.ob) d.p = Math.min(cycleTime(g), d.p + STIR_SECS); }
