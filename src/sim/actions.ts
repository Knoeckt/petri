// Everything the player can do. Each action checks its own preconditions and returns true when it happened.
import {
  RES_DEF, UPT, UPI, TEXT, STORY, SIDE, HYBRIDS, HYB, ARTS, ART, GEN_DEF, SHOP, PIPETTE_W, UNLOCK,
  SPLICE_COST, OB_HP, OB_TIME, ART_MAX, ART_MERGE, GEN_TIER, TIER_MULT, EQ, SITE, COUNTS,
} from '../data';
import type { Ctx } from './ctx';
import { toast, dirty, fmt, fmtDur } from './ctx';
import { newDish, type Pair } from './state';
import {
  upMult, upCanBuy, upBought, resCost, resTime, resDone, resVisible, resLv, resName, guardChance, shelfCap, item, stock, tierMult, bump, unlocked, unlockName, unlockLabel,
  studyCost, studyPerk, perkText, parseStudyKey, tripTime, studyTime, spliceTime, boostLen, adCooldown, artCount, artSpare, artDesc, genLv, genCost, genPoints, canAscend, TIER_COUNT, tierDef, warpLen, cycleTime, eqLv, eqCost, eqCanBuy, siteOpen, effLv,
} from './rules';
import { story, curStep, stepReqs, reqOk, reqTake, med, batchesAffordable, brewTime } from './requests';
import { rollDrops, collect, flashFinds } from './dish';
import { simulate } from './tick';
import type { Summary } from './dish';
import { pick } from './rng';

export const tutSeen = (g: Ctx, k: string) => { g.s.tut.seen[k] = true; };
const done = (g: Ctx) => { dirty(g); return true; };

// ---- upgrades ----
export function buy(g: Ctx, k: string): boolean {
  const s = g.s; tutSeen(g, 'buy');
  const u = UPI[k]; if (!u) return false;
  const ti = UPT.findIndex(t => t.items.includes(u)); if (!upCanBuy(g, u, ti)) return false;
  s.cur -= u.cost * upMult(g); s.ups[u.id] = true; bump(g, 'up'); toast(g, `${u.n}: ${u.d}`);
  if (ti + 1 < UPT.length && upBought(g, ti) === UPT[ti + 1].need) toast(g, `Tier ${ti + 2} unlocked: ${UPT[ti + 1].n}`);
  return done(g);
}

// ---- lab equipment: ranked with Notes from field trips ----
export function buyEquip(g: Ctx, id: string): boolean {
  const s = g.s; const e = EQ[id]; if (!e || !eqCanBuy(g, id)) return false;
  const c = eqCost(g, id); s.notes -= c.notes; s.cur -= c.bio; s.eq[id] = eqLv(g, id) + 1; bump(g, 'lv'); tutSeen(g, 'buy');
  toast(g, `${e.n} rank ${s.eq[id]}${id === 'dish' ? ` · effective level ${effLv(g)}` : ''}`); return done(g);
}

// ---- field trips: one expedition at a time, back with Notes and sometimes a sample ----
export function startTrip(g: Ctx, siteId: string): boolean {
  const s = g.s; const x = SITE[siteId]; if (!x || s.trip || !siteOpen(g, siteId)) return false;
  const t = tripTime(g, x);
  s.trip = { site: siteId, left: t, total: t }; bump(g, 'trip'); toast(g, `Off to ${x.n.toLowerCase()}. Back in ${fmtDur(t)}.`); return done(g);
}
export function finishTrip(g: Ctx) {
  const s = g.s; if (!s.trip) return; const x = SITE[s.trip.site]; s.trip = null; if (!x) return;
  const notes = x.notes[0] + Math.floor(g.rng() * (x.notes[1] - x.notes[0] + 1)); s.notes += notes;
  let sample: { r: number; i: number; isNew: boolean } | null = null;
  if (g.rng() < x.sample) {
    const r = x.sampleR, i = Math.floor(g.rng() * COUNTS[r]), c = s.cat[s.tier] = s.cat[s.tier] || {}, key = `${r}-${i}`; const isNew = !(key in c);
    c[key] = Math.min((c[key] || 0) + 1, shelfCap(g)); if (isNew) { bump(g, 'find'); s.shelf = [{ t: s.tier, r, i }, ...s.shelf].slice(0, 5); }
    sample = { r, i, isNew };
  }
  s.lastTrip = { site: x.id, notes, sample, at: Date.now() };
  g.emit({ type: 'trip', site: x.id, notes, sample });
  toast(g, `Back from ${x.n.toLowerCase()}: +${notes} notes${sample ? `, a ${sample.isNew ? 'new ' : ''}${item(s.tier, sample.r, sample.i).n}` : ''}`); dirty(g);
}

// ---- research and studies (one bench) ----
export function startResearch(g: Ctx, id: string): boolean {
  const s = g.s; const def = RES_DEF.find(r => r.id === id);
  if (!def || !resVisible(g, def) || s.active || resDone(g, def) || s.cur < resCost(g, def) || (def.req && !s.res[def.req])) return false;
  tutSeen(g, 'res'); s.cur -= resCost(g, def); const t = resTime(g, def); s.active = { id, left: t, total: t };
  if (s.freeRes) { s.freeRes = false; toast(g, 'Warm bench: instant.'); completeResearch(g); }
  return done(g);
}
export function startStudy(g: Ctx, key: string): boolean {
  const s = g.s; const [t, r, i] = parseStudyKey(key);
  if (s.active || s.studies[key] || stock(g, r, i, t) < 1 || s.cur < studyCost(g, t, r)) return false;
  s.cur -= studyCost(g, t, r); s.cat[t][`${r}-${i}`] -= 1; const tm = studyTime(g, r); s.active = { id: 'study', key, left: tm, total: tm };
  return done(g);
}
export function completeResearch(g: Ctx) {
  const s = g.s; if (!s.active) return;
  const id = s.active.id;
  if (id === 'study') { const key = s.active.key!; s.active = null; s.studies[key] = true; bump(g, 'res'); const [t, r, i] = parseStudyKey(key); toast(g, `${item(t, r, i).n} studied: ${perkText(studyPerk(t, r, i))}`); dirty(g); return; }
  const def = RES_DEF.find(r => r.id === id); s.res[id] = def && def.max ? resLv(g, id) + 1 : true; s.active = null; bump(g, 'res');
  if (/^dish\d$/.test(id)) s.dishes.push(newDish());
  if (id === 'wash') for (const d of s.dishes) for (const c of d.drops) if (item(s.tier, c.r, c.i).danger && !c.contained && g.rng() < 0.05) c.contained = true;
  toast(g, def && def.max ? `${resName(id)[0]} ${resLv(g, id)}/${def.max}` + (id === 'wash' ? ` · ${Math.round(guardChance(g) * 100)}% on arrival` : id === 'fridge' ? ` · shelf ${shelfCap(g)}` : '') : `${resName(id)[0]} complete`);
  dirty(g);
}

// ---- brewing ----
export function brewMed(g: Ctx, id: string): boolean {
  const s = g.s; const m = med(g, id); if (!m || s.brew) return false;
  const n = batchesAffordable(g, m); if (n < 1) { toast(g, `Not enough spare strains for ${m.n}.`); return false; }
  for (const [r, i, q] of m.need) s.cat[s.tier][`${r}-${i}`] -= q * n;
  const t = brewTime(g, m, n); s.brew = { id, n, left: t, total: t }; tutSeen(g, 'brewed'); toast(g, `Brewing ${n} ${m.n}`);
  return done(g);
}
export function finishBrew(g: Ctx) {
  const s = g.s; if (!s.brew) return; const b = s.brew; s.brew = null; bump(g, 'brew', b.n);
  const m = s.meds[s.tier] = s.meds[s.tier] || {}; m[b.id] = (m[b.id] || 0) + b.n; toast(g, `${b.n} ${b.id} ready`); dirty(g);
}

// ---- the splicer ----
export function spMatch(a: Pair | null, b: Pair | null): string | null {
  if (!a || !b) return null; const eq = (p: Pair, q: Pair) => p[0] === q[0] && p[1] === q[1];
  const h = HYBRIDS.find(h => (eq(h.par[0], a) && eq(h.par[1], b)) || (eq(h.par[0], b) && eq(h.par[1], a))); return h ? h.id : null;
}
export function spReady(g: Ctx) {
  const s = g.s; const [a, b] = s.sp;
  if (!s.hasSplicer || s.splice || s.spOut || !a || !b || s.cur < SPLICE_COST * tierMult(g)) return false;
  const same = a[0] === b[0] && a[1] === b[1];
  return same ? stock(g, a[0], a[1], 0) >= 2 : stock(g, a[0], a[1], 0) >= 1 && stock(g, b[0], b[1], 0) >= 1;
}
export function spWhy(g: Ctx) {
  const s = g.s; const [a, b] = s.sp;
  if (!s.hasSplicer) return 'Doc Ferro still has it.'; if (s.splice) return 'Splicing.'; if (s.spOut) return 'Tap the chamber to collect.';
  if (!a || !b) return 'Tap a tube to load a strain.'; if (s.cur < SPLICE_COST * tierMult(g)) return `Needs ${fmt(SPLICE_COST * tierMult(g))} ${TEXT.cur.toLowerCase()}.`;
  if (!spReady(g)) return 'Not enough spares of that strain.'; return 'Pull the lever.';
}
export function pickTube(g: Ctx, slot: 0 | 1, pair: Pair | null): boolean { if (!g.s.hasSplicer || g.s.splice || g.s.spOut) return false; g.s.sp[slot] = pair; return done(g); }
export function splice(g: Ctx): boolean {
  const s = g.s; if (!spReady(g)) { toast(g, spWhy(g)); return false; }
  const [a, b] = s.sp as [Pair, Pair]; s.cur -= SPLICE_COST * tierMult(g); s.cat[0][`${a[0]}-${a[1]}`] -= 1; s.cat[0][`${b[0]}-${b[1]}`] -= 1;
  s.splice = { id: spMatch(a, b), a, b, left: spliceTime(g), total: spliceTime(g) }; g.emit({ type: 'lever' }); toast(g, 'Splicing…');
  return done(g);
}
export function finishSplice(g: Ctx, now: number) {
  const s = g.s; if (!s.splice) return; const sp = s.splice; s.splice = null; s.sp = [null, null];
  if (sp.id) { s.spOut = { id: sp.id, at: now }; toast(g, 'Something formed in the chamber. Tap it!'); g.emit({ type: 'burst', col: '#ffffff' }); }
  else { s.cat[0][`${sp.a[0]}-${sp.a[1]}`] += 1; s.cat[0][`${sp.b[0]}-${sp.b[1]}`] += 1; s.cur += SPLICE_COST * tierMult(g) / 2; toast(g, 'No reaction. The machine spat them back out.', true); g.emit({ type: 'smoke' }); }
  dirty(g);
}
export function collectOut(g: Ctx): boolean {
  const s = g.s; if (!s.spOut) return false; const id = s.spOut.id; s.spOut = null; bump(g, 'splice');
  s.hyb[id] = (s.hyb[id] || 0) + 1; s.recent.unshift({ h: id, isNew: true }); s.recent.length = Math.min(s.recent.length, 8);
  toast(g, `New hybrid: ${HYB[id].n}!`); g.emit({ type: 'burst', col: HYB[id].look.col }); return done(g);
}
export function seedHyb(g: Ctx, id: string): boolean { if (!g.s.hyb[id]) return false; g.s.seed = g.s.seed === id ? null : id; toast(g, g.s.seed ? `${HYB[id].n} seeded in the ${TEXT.dish}` : `${TEXT.dish} unseeded`); return done(g); }

// ---- the Clinic ----
export function deliver(g: Ctx): boolean {
  const s = g.s; const step = curStep(g), st = story(g); if (!step) return false;
  const needs = step.outbreak ? null : stepReqs(s.tier, st.step);
  if (step.outbreak ? !st.brewed : !reqOk(g, needs!)) return false;
  if (needs) reqTake(g, needs);
  const pay = step.reward * tierMult(g); s.cur += pay; st.log.push(step.after); st.brewed = false;
  if (step.gives === 'splicer') s.hasSplicer = true;
  st.step++;
  const opened = Object.keys(UNLOCK).filter(k => UNLOCK[k][0] === s.tier && UNLOCK[k][1] === st.step);
  if (st.step >= STORY[s.tier].steps.length) { st.done = true; g.emit({ type: 'chapterDone' }); toast(g, `Chapter complete! ${TEXT.ascend} is open.`); }
  else if (opened.length) { g.emit({ type: 'unlock', areas: opened }); toast(g, `Unlocked: ${opened.map(unlockName).join(' and ')}!`); }
  else toast(g, `+${fmt(pay)} ${TEXT.cur}. ${STORY[s.tier].steps[st.step].who} is waiting.`);
  return done(g);
}
export function faceBloom(g: Ctx): boolean {
  const s = g.s; const step = curStep(g); if (!step || !step.outbreak || s.ob) return false;
  const hp = step.hp || OB_HP; s.ob = { hp, max: hp, dur: step.time || OB_TIME, t: 0, spore: 0, boss: step.boss || [0, 3, 0] };
  toast(g, 'The Wipe is blooming. Tap it!', true); return done(g);
}
export function hitBloom(g: Ctx, dmg = 1) { const o = g.s.ob; if (!o) return; o.hp -= dmg; if (o.hp <= 0) obWin(g); }
export function obWin(g: Ctx) { g.s.ob = null; story(g).brewed = true; g.emit({ type: 'ripple', col: '#fff' }); deliver(g); }

// ---- side quests: they count things you do anyway ----
export function sideGateOpen(g: Ctx, k: number) {
  const q = SIDE[k]; if (!q.gate) return true;
  if (q.gate.lv !== undefined && effLv(g) < q.gate.lv) return false;
  if (q.gate.undiscovered !== undefined && Object.keys(g.s.cat[g.s.tier] || {}).length > 13 - q.gate.undiscovered) return false;
  if (q.gate.area && !unlocked(g, q.gate.area)) return false;
  return true;
}
export function sideRefill(g: Ctx) {
  let guard = 0;
  while (g.s.side.length < 2 && guard++ < 40) { const used = g.s.side.map(x => x.k); const k = Math.floor(g.rng() * SIDE.length); if (!used.includes(k) && sideGateOpen(g, k)) g.s.side.push({ k, base: g.s.st[SIDE[k].stat] || 0 }); }
}
export const sideProg = (g: Ctx, x: { k: number; base: number }) => { const q = SIDE[x.k]; return Math.min(q.n, Math.max(0, (g.s.st[q.stat] || 0) - x.base)); };
export const sideDone = (g: Ctx, x: { k: number; base: number }) => !!SIDE[x.k] && sideProg(g, x) >= SIDE[x.k].n;
export const questsReady = (g: Ctx) => g.s.side.filter(x => sideDone(g, x)).length;
export function doSide(g: Ctx, idx: number): boolean {
  const x = g.s.side[idx]; if (!x || !sideDone(g, x)) return false; const q = SIDE[x.k];
  const pay = q.reward * tierMult(g); g.s.cur += pay; toast(g, `${q.who}: "Much obliged." +${fmt(pay)}`); g.s.side.splice(idx, 1); sideRefill(g); return done(g);
}

// ---- artifacts and decor ----
export function addArt(g: Ctx, id: string, lv = 1) { const c = g.s.arts[id] = g.s.arts[id] || {}; c[lv] = (c[lv] || 0) + 1; }
export function mergeArt(g: Ctx, id: string, lv: number): boolean {
  const a = ART[id]; if (!a || lv >= ART_MAX || artSpare(g, id, lv) < ART_MERGE) return false;
  g.s.arts[id][lv] -= ART_MERGE; if (!g.s.arts[id][lv]) delete g.s.arts[id][lv]; addArt(g, id, lv + 1);
  toast(g, `${a.n} is now level ${lv + 1}: ${artDesc(a, lv + 1)}`); return done(g);
}
export function placeArt(g: Ctx, id: string, lv = 1): boolean {
  const a = ART[id]; if (!a || !artCount(g, id, lv)) return false;
  if (artSpare(g, id, lv) <= 0) { toast(g, 'All your copies are already placed.'); return false; }
  const k = g.s.placed.indexOf(null); if (k < 0) { toast(g, 'No free slot. Remove something first.'); return false; }
  g.s.placed[k] = { id, lv }; toast(g, `${a.n} placed: ${artDesc(a, lv)}`); return done(g);
}
export function unplaceArt(g: Ctx, slot: number): boolean { if (g.s.placed[slot] == null) return false; g.s.placed[slot] = null; return done(g); }
export function unplacedCount(g: Ctx) { let n = 0; for (const id in g.s.arts) for (const lv in g.s.arts[id]) n += Math.max(0, artSpare(g, id, +lv)); return n; }
export function mergeableCount(g: Ctx) { let n = 0; for (const id in g.s.arts) for (const lv in g.s.arts[id]) if (+lv < ART_MAX && artSpare(g, id, +lv) >= ART_MERGE) n++; return n; }

// ---- the pipette ----
export function mgStart(g: Ctx, now: number): boolean {
  if (!unlocked(g, 'tickets')) { toast(g, `The pipette opens after ${unlockLabel('tickets')}.`); return false; }
  if (!Number.isFinite(now) || (g.mg && !g.mg.done)) return false;
  if (g.s.tickets <= 0) { toast(g, 'No tickets left today. Watch an ad for one, or buy one in the Shop.'); return false; }
  g.s.tickets--; bump(g, 'ticket'); g.mg = { t0: now, pos: 0.5, done: false }; return done(g);
}
export const mgPos = (g: Ctx, now: number) => g.mg ? 0.5 + 0.5 * Math.sin((now - g.mg.t0) / 1000 * 3.4) : 0.5;
/** Present one animation frame. Input scores this position, including between frames. */
export function mgFrame(g: Ctx, now: number): number {
  if (g.mg && !g.mg.done && Number.isFinite(now)) g.mg.pos = mgPos(g, now);
  return g.mg?.pos ?? 0.5;
}
/** Freeze the last presented position and pay exactly one artifact per round. */
export function mgDrop(g: Ctx): boolean {
  if (!unlocked(g, 'tickets') || !g.mg || g.mg.done) return false;
  const pos = g.mg.pos;
  if (!Number.isFinite(pos) || pos < 0 || pos > 1) return false;
  const d = Math.abs(pos - 0.5) / 0.5; const grade = d <= 0.08 ? 3 : d <= 0.2 ? 2 : d <= 0.36 ? 1 : 0;
  const W = PIPETTE_W[grade]; let r = g.rng() * 100, ri = 0; for (let k = 0; k < 4; k++) { r -= W[k]; if (r < 0) { ri = k; break; } }
  const art = pick(g.rng, ARTS.filter(a => a.r === ri)); addArt(g, art.id);
  g.mg.done = true; g.mg.result = { art: art.id, grade, pos }; toast(g, `${['Miss.', 'Close.', 'Nice!', 'Perfect!'][grade]} You found ${art.n}.`); return done(g);
}

// ---- the shop ----
export function shopCost(g: Ctx, id: string) {
  const s = g.s, m = tierMult(g);
  return id === 'crate' ? Math.round(40 * m * Math.pow(1.35, s.shopC)) : id === 'boost' ? 400 * m : id === 'icepack' ? 800 * m : id === 'ticket' ? Math.round(150 * m * Math.pow(1.6, s.shopT)) : id === 'pebble' ? 300 * m : Infinity;
}
export function shopShow(g: Ctx, id: string) { return id === 'icepack' ? !g.s.icepack : id === 'ticket' ? unlocked(g, 'tickets') : id === 'pebble' ? unlocked(g, 'decor') : true; }
export const shopItems = (g: Ctx) => SHOP.filter(it => shopShow(g, it.id));
export function buyShop(g: Ctx, id: string): boolean {
  const s = g.s; if (!SHOP.find(x => x.id === id) || !shopShow(g, id)) return false;
  const c = shopCost(g, id); if (s.cur < c) { toast(g, `Needs ${fmt(c)} ${TEXT.cur.toLowerCase()}.`); return false; }
  if (id === 'crate') {
    const cat = s.cat[s.tier] = s.cat[s.tier] || {}; const found0 = Object.keys(cat).filter(k => k[0] === '0');
    if (!found0.length) { toast(g, 'The fridge is empty until you have found a common strain.'); return false; }
    s.cur -= c; const got: string[] = [];
    for (let k = 0; k < 3; k++) { const key = pick(g.rng, found0); cat[key] = Math.min((cat[key] || 0) + 1, shelfCap(g)); got.push(item(s.tier, +key[0], +key.slice(2)).n); }
    s.shopC++; toast(g, `Crate: ${got.join(', ')}`); return done(g);
  }
  s.cur -= c;
  if (id === 'ticket') { s.tickets++; s.shopT++; toast(g, '+1 ticket'); }
  else if (id === 'icepack') { s.icepack = true; toast(g, 'Ice pack fitted: +2 h offline'); }
  else if (id === 'pebble') { const a = pick(g.rng, ARTS.filter(a => a.r === 0)); addArt(g, a.id); toast(g, `Inside the pebble: ${a.n}`); }
  else if (id === 'boost') { s.boost = boostLen(g); toast(g, `2× for ${fmtDur(boostLen(g))}`); }
  return done(g);
}

// ---- the ladder ----
export function ascend(g: Ctx): boolean {
  const s = g.s; if (!canAscend(g) || s.tier + 1 >= TIER_COUNT) return false;
  s.tier++; s.cur = 0; s.ups = {}; s.brew = null; s.dishes = s.dishes.map(() => newDish()); s.recent = [];
  if (genLv(g, 'bench')) s.freeRes = true;
  g.emit({ type: 'ascend', tier: s.tier }); toast(g, `${TEXT.ascend}: ${tierDef(s.tier).n}. Everything ×${TIER_MULT}.`); return done(g);
}
export const canGenesis = (g: Ctx) => g.s.tier >= GEN_TIER && !!(g.s.story[GEN_TIER] && g.s.story[GEN_TIER].done);
export function genesis(g: Ctx): boolean {
  const s = g.s; if (!canGenesis(g)) return false;
  const gen = s.gen; const pts = genPoints(g); gen.pts += pts; gen.runs++;
  for (const t in s.cat) { gen.seen[+t] = gen.seen[+t] || {}; for (const k in s.cat[+t]) gen.seen[+t][k] = true; }
  const keepHyb = s.seed, keepArt = s.placed[0] && ART[s.placed[0].id] ? s.placed[0] : null;
  Object.assign(s, {
    tier: 0, cur: 0, notes: 0, eq: genLv(g, 'head') ? { dish: 2 * genLv(g, 'head') } : {}, trip: null, lastTrip: null, ups: {}, res: {}, active: null, cat: {}, dishes: [newDish()], boost: 0, recent: [], shelf: [], cycles: 0, eaten: 0,
    hasSplicer: false, hyb: keepHyb ? { [keepHyb]: 1 } : {}, seed: keepHyb || null, splice: null, sp: [null, null], spOut: null, story: {}, side: [], ob: null,
    arts: keepArt ? { [keepArt.id]: { [keepArt.lv]: 1 } } : {}, placed: [keepArt ? { id: keepArt.id, lv: keepArt.lv } : null, null, null],
    meds: {}, brew: null, icepack: false, st: {}, studies: {}, freeRes: genLv(g, 'bench') > 0,
  });
  if (genLv(g, 'starter') && gen.seen[0]) { s.cat[0] = {}; for (const k in gen.seen[0]) if (k[0] === '0') s.cat[0][k] = 2; }
  for (const d of s.dishes) d.drops = rollDrops(g);
  g.emit({ type: 'genesis', runs: gen.runs }); toast(g, `Genesis ${gen.runs}: +${pts} Genome. The dish is small again.`); return done(g);
}
export function buyGen(g: Ctx, id: string): boolean {
  const p = GEN_DEF.find(x => x.id === id); if (!p || genLv(g, id) >= p.max || g.s.gen.pts < genCost(g, p)) return false;
  g.s.gen.pts -= genCost(g, p); g.s.gen.perks[id] = genLv(g, id) + 1; toast(g, `${p.n} ${genLv(g, id)}/${p.max}`); return done(g);
}

// ---- rewarded ads: the UI plays the ad, then claims the reward here ----
export type AdPlacement = 'finish dish' | 'finish research' | 'time warp' | 'boost' | 'finish brew' | 'finish splice' | 'finish trip' | 'ticket' | 'double offline';
export const adReady = (g: Ctx) => g.s.adCd <= 0;
export interface AdResult { ok: boolean; sum?: Summary }
export function adClaim(g: Ctx, placement: AdPlacement, arg?: number): AdResult {
  const s = g.s; if (!adReady(g)) return { ok: false };
  let sum: Summary | undefined;
  switch (placement) {
    case 'finish dish': { const d = s.dishes[arg ?? 0]; if (!d) return { ok: false }; d.p = cycleTime(g); d.ready = true; if (s.res.auto) flashFinds(g, collect(g, arg ?? 0)); break; }
    case 'finish research': if (!s.active) return { ok: false }; completeResearch(g); break;
    case 'time warp': bump(g, 'warp'); sum = simulate(g, warpLen(g)); break;
    case 'boost': if (s.boost > 0) return { ok: false }; s.boost = boostLen(g); toast(g, `2× for ${fmtDur(boostLen(g))}`); break;
    case 'finish brew': if (!s.brew) return { ok: false }; finishBrew(g); break;
    case 'finish splice': if (!s.splice) return { ok: false }; finishSplice(g, 0); break;
    case 'finish trip': if (!s.trip) return { ok: false }; finishTrip(g); break;
    case 'ticket': if (!unlocked(g, 'tickets')) return { ok: false }; s.tickets++; toast(g, '+1 ticket'); break;
    case 'double offline': s.cur += arg ?? 0; toast(g, `+${fmt(arg ?? 0)} ${TEXT.cur} doubled`); break;
  }
  s.ads++; s.adUse[placement] = (s.adUse[placement] || 0) + 1; s.adCd = adCooldown(g); dirty(g);
  return { ok: true, sum };
}
