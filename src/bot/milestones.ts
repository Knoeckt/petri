// Progression milestones (ROADMAP §7): the moments a balance pass cares about, read off the state after every step.
// Each is a predicate; the first time it holds, the run records when. Order here is the order they are reported in.
import { STORY, UNLOCK } from '../data';
import type { Ctx } from '../sim';
import { unlockName, found } from '../sim';

export interface MilestoneDef { key: string; label: string; test: (g: Ctx) => boolean; /** when it lands, if not at the moment the test first holds */ at?: (g: Ctx, wall: number, play: number) => [wall: number, play: number] }
/** chapter 1's story state, whatever tier the run has reached since */
const ch1 = (g: Ctx) => g.s.story[0] || { step: 0, done: false };
const past = (g: Ctx, k: number) => ch1(g).step >= k || ch1(g).done;

const stepLabel = (k: number) => {
  const st = STORY[0].steps[k]; const opened = Object.keys(UNLOCK).filter(u => UNLOCK[u][0] === 0 && UNLOCK[u][1] === k + 1 && u !== 'tickets' && u !== 'pipette');
  return `1-${k + 1} ${st.who}${st.outbreak ? ' (the bloom)' : ''}${opened.length ? ` · ${opened.map(unlockName).join(', ')} open${opened.length > 1 ? '' : 's'}` : ''}`;
};

export const MILESTONES: MilestoneDef[] = [
  { key: 'harvest', label: 'First harvest', test: g => g.s.cycles >= 1 },
  { key: 'up1', label: 'First upgrade', test: g => Object.keys(g.s.ups).length >= 1 },
  { key: 'c1', label: stepLabel(0), test: g => past(g, 1) },
  { key: 'trip1', label: 'First trip sent', test: g => (g.s.st.trip || 0) >= 1 },
  { key: 'tripBack', label: 'First trip due back', test: g => (g.s.st.trip || 0) >= 1, at: (g, wall, play) => [wall + (g.s.trip ? g.s.trip.left : 0), play] },
  { key: 'eq1', label: 'First paid equipment rank', test: g => (g.s.st.lv || 0) >= 2 }, // the first dish rank is free
  { key: 'c2', label: stepLabel(1), test: g => past(g, 2) },
  { key: 'c3', label: stepLabel(2), test: g => past(g, 3) },
  { key: 'res1', label: 'First research started', test: g => !!g.s.active || (g.s.st.res || 0) >= 1 },
  { key: 'uncommon', label: 'First uncommon found', test: g => Object.keys(g.s.cat[0] || {}).some(k => k.startsWith('1-')) },
  { key: 'c4', label: stepLabel(3), test: g => past(g, 4) },
  { key: 'c5', label: stepLabel(4), test: g => past(g, 5) },
  { key: 'brew1', label: 'First brew finished', test: g => (g.s.st.brew || 0) >= 1 },
  { key: 'return', label: 'First overnight return', test: g => (g.s.st.botOvernight || 0) >= 1 },
  { key: 'capped', label: 'First offline cap hit', test: g => (g.s.st.botCapped || 0) >= 1 },
  { key: 'auto', label: 'Auto-harvest researched', test: g => !!g.s.res.auto },
  { key: 'rare', label: 'First rare found', test: g => Object.keys(g.s.cat[0] || {}).some(k => k.startsWith('2-')) },
  { key: 'c6', label: stepLabel(5), test: g => past(g, 6) },
  { key: 'c7', label: stepLabel(6), test: g => past(g, 7) },
  { key: 'c8', label: stepLabel(7), test: g => past(g, 8) },
  { key: 'c9', label: stepLabel(8) + ' · chapter done', test: g => ch1(g).done },
  { key: 'catalog', label: 'Catalog full (13 of 13)', test: g => found(g, 0) >= 13 },
  { key: 'ascend', label: 'Scaled up to the Aquarium', test: g => g.s.tier >= 1 },
];

export interface Hit { key: string; label: string; wall: number; play: number }

/** watches a run and records the first time each milestone holds */
export class Tracker {
  hits: Hit[] = []; private seen = new Set<string>();
  check(g: Ctx, wall: number, play: number) {
    for (const m of MILESTONES) { if (this.seen.has(m.key)) continue; if (m.test(g)) { this.seen.add(m.key); const [w, p] = m.at ? m.at(g, wall, play) : [wall, play]; this.hits.push({ key: m.key, label: m.label, wall: w, play: p }); } }
  }
  get(key: string) { return this.hits.find(h => h.key === key) || null; }
}
