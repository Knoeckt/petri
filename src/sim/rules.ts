// Derived numbers: everything the economy, the rarity table, research, studies, artifacts and Genome add up to.
// Pure functions of the state; nothing here mutates except bump().
import {
  RAR, COUNTS, KEYS, BONUS, CYCLE_BASE, TIER_MULT, UP_MULT, TIER_CYCLE, ASC_LV, ASC_FOUND, RAR_CAP0, RAR_CAP_STEP, SHELF,
  OFFLINE_CAP, WARP, STUDY_TIME, SPLICE_TIME, BOOST_LEN, AD_LEN, AD_CD, TIERS, MORE, SHAPES, PALETTE, RES_DEF, RES_TEXT, UPT, UPI, ART, HYB, GEN_DEF, STUDY_COST, STUDY_PERKS, STUDY_DANGER_PERK,
  UNLOCK, UNLOCK_NAME, STORY, TEXT, EQ, EQUIP, SITES,
} from '../data';
import type { Artifact, Research, GenPerk, Strain, TierDef, Upgrade } from '../data';
import type { Ctx } from './ctx';

// ---- tiers and strains ----
const genCache: Record<number, TierDef> = {};
export function tierDef(t: number): TierDef {
  if (t < TIERS.length) return TIERS[t];
  if (genCache[t]) return genCache[t];
  const n = MORE[Math.min(t - TIERS.length, MORE.length - 1)];
  const items = COUNTS.map((c, r) => Array.from({ length: c }, (_, i): Strain => {
    const h = t * 31 + r * 7 + i * 13;
    return { n: `${n} ${RAR[r].n.toLowerCase()} #${i + 1}`, d: 'Not yet described.', danger: r === 3 && i === 0 ? 2 : 0,
      look: { shape: SHAPES[h % SHAPES.length], col: PALETTE[h % PALETTE.length], col2: '#ffffff', eyes: 2, fuzz: h % 3 === 0 ? 1 : 0, tail: h % 4 === 1 ? 1 : 0 } };
  }));
  return genCache[t] = { n, items };
}
export const TIER_COUNT = TIERS.length + MORE.length;
export const item = (t: number, r: number, i: number): Strain => tierDef(t).items[r][i];
export const found = (g: Ctx, t: number) => Object.keys(g.s.cat[t] || {}).length;
/** what is on the shelf: every specimen found is usable, the entry's existence is the discovery */
export const stock = (g: Ctx, r: number, i: number, t = g.s.tier) => Math.max(0, (g.s.cat[t] || {})[`${r}-${i}`] || 0);
export function totalStock(g: Ctx) { let n = 0; const c = g.s.cat[g.s.tier] || {}; for (const k in c) n += Math.max(0, c[k] || 0); return n; }
export function rarityStock(g: Ctx, r: number) { let n = 0; const c = g.s.cat[g.s.tier] || {}; for (const k in c) if (+k[0] >= r) n += Math.max(0, c[k] || 0); return n; }
/** the tallies side quests count */
export function bump(g: Ctx, k: string, n = 1) { g.s.st[k] = (g.s.st[k] || 0) + n; }

// ---- multipliers ----
export const tierMult = (g: Ctx, t = g.s.tier) => Math.pow(TIER_MULT, t);
export const upMult = (g: Ctx) => Math.pow(UP_MULT, g.s.tier);
export function catMult(g: Ctx) { let m = 1; for (const t in g.s.cat) for (const k in g.s.cat[t]) m += BONUS[+k[0]]; return m; }
export const boostOn = (g: Ctx) => g.s.boost > 0;
export const perk = (g: Ctx, k: string) => !!(g.s.seed && HYB[g.s.seed] && HYB[g.s.seed].perk === k);

// artifacts
export const artVal = (a: Artifact, lv: number) => a.perk[1] * lv;
export function artDesc(a: Artifact, lv: number) {
  const v = artVal(a, lv), k = a.perk[0];
  return k === 'lv' ? `+${v} effective level${v > 1 ? 's' : ''}` : k === 'speed' ? `−${Math.round(v * 100)}% cycle time`
    : k === 'value' ? `+${Math.round(v * 100)}% duplicate value` : k === 'income' ? `+${Math.round(v * 100)}% income`
    : `+${v} ${v > 1 ? TEXT.drops : TEXT.drop} per cycle`;
}
export const artCount = (g: Ctx, id: string, lv: number) => (g.s.arts[id] || {})[lv] || 0;
export const artPlaced = (g: Ctx, id: string, lv: number) => g.s.placed.filter(p => p && p.id === id && p.lv === lv).length;
export const artSpare = (g: Ctx, id: string, lv: number) => artCount(g, id, lv) - artPlaced(g, id, lv);
export function artPerk(g: Ctx, k: string) { let v = 0; for (const p of g.s.placed) { const a = p && ART[p.id]; if (a && a.perk[0] === k) v += artVal(a, p.lv); } return v; }

// upgrades
export function upSum(g: Ctx, k: string) { let v = 0; for (const id in g.s.ups) { const u = UPI[id]; if (u && u.k === k) v += u.v; } return v; }
export function upProd(g: Ctx, k: string) { let v = 1; for (const id in g.s.ups) { const u = UPI[id]; if (u && u.k === k) v *= u.v; } return v; }
export function upSpeed(g: Ctx) { let v = 1; for (const id in g.s.ups) { const u = UPI[id]; if (u && u.k === 'speed') v *= 1 - u.v; } return v; }
export const upBought = (g: Ctx, ti: number) => UPT[ti].items.filter(u => g.s.ups[u.id]).length;
export const upOpen = (g: Ctx, ti: number) => ti === 0 || upBought(g, ti - 1) >= UPT[ti].need;
export const upCost = (g: Ctx, u: Upgrade) => u.cost * upMult(g);
export const upCanBuy = (g: Ctx, u: Upgrade, ti: number) => !g.s.ups[u.id] && upOpen(g, ti) && (!u.req || !!g.s.res[u.req]) && g.s.cur >= upCost(g, u);
export const upAvailable = (g: Ctx) => UPT.some((t, ti) => t.items.some(u => upCanBuy(g, u, ti)));

// research
export function resLv(g: Ctx, id: string) { const v = g.s.res[id]; return typeof v === 'number' ? v : v ? 1 : 0; }
export const resCost = (g: Ctx, r: Research) => Math.round(r.cost * Math.pow(1.3, r.max ? resLv(g, r.id) : 0));
export const resTime = (g: Ctx, r: Research) => (r.time + (r.max ? resLv(g, r.id) * 8 : 0)) * g.pace.timer;
// ---- the balance profile's other timers (ROADMAP §6): everything with a duration goes through one of these ----
export const tripTime = (g: Ctx, site: { time: number }) => site.time * g.pace.timer;
export const studyTime = (g: Ctx, r: number) => STUDY_TIME[r] * g.pace.timer;
export const spliceTime = (g: Ctx) => SPLICE_TIME * g.pace.timer;
export const boostLen = (g: Ctx) => BOOST_LEN * g.pace.boost;
export const adLen = (g: Ctx) => AD_LEN * g.pace.ad;
export const adCooldown = (g: Ctx) => AD_CD * g.pace.adCd;
export const resDone = (g: Ctx, r: Research) => r.max ? resLv(g, r.id) >= r.max : !!g.s.res[r.id];
export const resName = (id: string): [string, string] => RES_TEXT[id] || [id, ''];
export const resVisible = (g: Ctx, r: Research) => g.s.tier >= (r.tier || 0) && (!r.gate || unlocked(g, r.gate));
export function resSum(g: Ctx, k: string) { let v = 0; for (const r of RES_DEF) if (r.fx && r.fx[0] === k && g.s.res[r.id]) v += r.fx[1]; return v; }
export function resProd(g: Ctx, k: string) { let v = 1; for (const r of RES_DEF) if (r.fx && r.fx[0] === k && g.s.res[r.id]) v *= 1 - r.fx[1]; return v; }

// specimen studies
export const studyKey = (t: number, r: number, i: number) => `${t}:${r}-${i}`;
export function parseStudyKey(key: string): [number, number, number] { const [t, ri] = key.split(':'); const [r, i] = ri.split('-'); return [+t, +r, +i]; }
export const studyPerk = (t: number, r: number, i: number): [string, number][] => item(t, r, i).danger ? STUDY_DANGER_PERK : STUDY_PERKS[r];
export function perkText(list: [string, number][]) {
  return list.map(([k, v]) => ({
    income: `+${Math.round(v * 100)}% income`, cycle: `−${Math.round(v * 100)}% cycle time`, lv: `+${v} level${v > 1 ? 's' : ''}`,
    drop: `+${v} ${v > 1 ? TEXT.drops : TEXT.drop} per cycle`, guard: `+${Math.round(v * 100)}% quarantine on arrival`,
  } as Record<string, string>)[k]).join(', ');
}
export function studyFx(g: Ctx, k: string) { let v = 0; for (const key in g.s.studies) { const [t, r, i] = parseStudyKey(key); for (const [pk, pv] of studyPerk(t, r, i)) if (pk === k) v += pv; } return v; }
export const studyCost = (g: Ctx, t: number, r: number) => Math.round(STUDY_COST[r] * tierMult(g, t));

// genome
export const genLv = (g: Ctx, id: string) => g.s.gen.perks[id] || 0;
export const genCost = (g: Ctx, p: GenPerk) => genLv(g, p.id) + 1;
export function genPoints(g: Ctx) { let f = 0; for (const t in g.s.cat) f += found(g, +t); let ch = 0; for (const t in g.s.story) if (g.s.story[t].done) ch++; return g.s.tier + 1 + Math.floor(f / 10) + ch; }
export const seenBefore = (g: Ctx, t: number, key: string) => !!((g.s.gen.seen[t] || {})[key]);
export const genDef = (id: string) => GEN_DEF.find(x => x.id === id);

// lab equipment
export const eqLv = (g: Ctx, id: string) => g.s.eq[id] || 0;
export const eqDef = (id: string) => EQ[id];
export const eqMaxed = (g: Ctx, id: string) => eqLv(g, id) >= EQ[id].max;
/** a rank costs Notes first and a little biomass second */
/** the Petri dish's first rank is free: it is the guide's demo of the bench before any Notes have come back from a trip */
export const eqCost = (g: Ctx, id: string) => { const e = EQ[id], r = eqLv(g, id); if (id === 'dish' && r === 0) return { notes: 0, bio: 0 }; return { notes: Math.round(e.notes * Math.pow(e.grow, r)), bio: Math.round(e.bio * Math.pow(1.25, r) * tierMult(g)) }; };
export const eqCanBuy = (g: Ctx, id: string) => !!EQ[id] && !eqMaxed(g, id) && g.s.notes >= eqCost(g, id).notes && g.s.cur >= eqCost(g, id).bio;
export const eqAvailable = (g: Ctx) => EQUIP.some(e => eqCanBuy(g, e.id));
/** chance a duplicate rerolls into an unfound strain of its rarity */
export const rerollChance = (g: Ctx) => 0.02 * eqLv(g, 'scope');
// field trips
export function siteOpen(g: Ctx, id: string) { const x = SITES.find(x => x.id === id); if (!x) return false; const [t, k] = x.unlock; if (g.s.tier > t) return true; if (g.s.tier < t) return false; return (g.s.story[t] ? g.s.story[t].step : 0) >= k; }
export const sitesOpen = (g: Ctx) => SITES.filter(x => siteOpen(g, x.id));

// ---- the numbers the dish runs on ----
export const genRate = (g: Ctx) => 0.3 * upProd(g, 'gen') * tierMult(g) * catMult(g) * (boostOn(g) ? 2 : 1) * (1 + artPerk(g, 'income')) * (1 + studyFx(g, 'income')) * (1 + 0.1 * genLv(g, 'income'));
export function cycleTime(g: Ctx) {
  const base = CYCLE_BASE * g.pace.cycle * Math.pow(TIER_CYCLE, g.s.tier) * (g.s.res.fast ? 0.75 : 1);
  return Math.max(base * 0.25, base * upSpeed(g)) * (perk(g, 'speed') ? 0.85 : 1) * (1 - artPerk(g, 'speed')) * resProd(g, 'cycle') * Math.max(0.4, 1 - studyFx(g, 'cycle')) * (1 - 0.02 * eqLv(g, 'incub'));
}
export const dropsPer = (g: Ctx) => 1 + upSum(g, 'yield') + (perk(g, 'drop') ? 1 : 0) + artPerk(g, 'drop') + resSum(g, 'drop') + studyFx(g, 'drop') + Math.floor(eqLv(g, 'pipette') / 3);
export const valMult = (g: Ctx) => (1 + upSum(g, 'val')) * (perk(g, 'value') ? 1.5 : 1) * (1 + artPerk(g, 'value')) * (1 + resSum(g, 'val'));
export const effLv = (g: Ctx) => eqLv(g, 'dish') + upSum(g, 'lv') + (perk(g, 'luck') ? 3 : 0) + artPerk(g, 'lv') + resSum(g, 'lv') + studyFx(g, 'lv');
/** each vessel can only reach so far up the rarity table; scaling up raises the reach */
export const rarCap = (g: Ctx) => RAR_CAP0 + RAR_CAP_STEP * g.s.tier;
export const rarLv = (g: Ctx, L = effLv(g)) => Math.min(L, rarCap(g));
export function weights(L: number): number[] {
  if (L <= KEYS[0][0]) return KEYS[0][1];
  for (let i = 1; i < KEYS.length; i++) if (L <= KEYS[i][0]) { const [a, wa] = KEYS[i - 1], [b, wb] = KEYS[i]; const t = (L - a) / (b - a); return wa.map((w, j) => w + (wb[j] - w) * t); }
  return KEYS[KEYS.length - 1][1];
}
export function rollRarity(g: Ctx) { const w = weights(rarLv(g)); let r = g.rng() * 100; for (let i = 0; i < RAR.length; i++) { r -= w[i]; if (r < 0) return i; } return 0; }
export const offlineCap = (g: Ctx) => OFFLINE_CAP * (g.s.res.storage ? 2 : 1) + (g.s.icepack ? 2 * 3600 : 0) + resSum(g, 'off');
export const offlineEff = (g: Ctx) => Math.min(1, 0.1 + 0.1 * genLv(g, 'offline'));
export const warpLen = (g: Ctx) => WARP + 1800 * genLv(g, 'warp');
export const guardChance = (g: Ctx) => Math.min(1, resLv(g, 'wash') * 0.05 + (perk(g, 'guard') ? 0.4 : 0) + studyFx(g, 'guard') + 0.05 * genLv(g, 'guard') + 0.04 * eqLv(g, 'clean'));
export const shelfCap = (g: Ctx) => (SHELF + SHELF * resLv(g, 'fridge')) * (g.s.res.storage ? 2 : 1) + eqLv(g, 'clean');

// ---- the ladder and what opens when ----
export function canAscend(g: Ctx) {
  if (g.s.tier + 1 >= TIER_COUNT) return false;
  if (STORY[g.s.tier]) return !!(g.s.story[g.s.tier] && g.s.story[g.s.tier].done) && found(g, g.s.tier) >= ASC_FOUND;
  return effLv(g) >= ASC_LV && found(g, g.s.tier) >= ASC_FOUND;
}
export function unlocked(g: Ctx, k: string) {
  const u = UNLOCK[k]; if (!u) return true;
  if (g.s.tier > u[0]) return true; if (g.s.tier < u[0]) return false;
  return (g.s.story[g.s.tier] ? g.s.story[g.s.tier].step : 0) >= u[1] && (k !== 'splicer' || g.s.hasSplicer);
}
export const unlockLabel = (k: string) => { const u = UNLOCK[k]; return u ? `${u[0] + 1}-${u[1]}` : ''; };
export const unlockName = (k: string) => UNLOCK_NAME[k] || k;
export function unlockHint(k: string) { const u = UNLOCK[k], ch = u && STORY[u[0]]; const s = ch && ch.steps[u[1] - 1]; return s ? `Help ${s.who} at the Clinic.` : ''; }
