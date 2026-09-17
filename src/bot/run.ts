// One bot run: a fresh save played day by day. Sessions use the live tick, the gaps between them go through the
// game's own offline catch-up (cap, night-shift efficiency), so what the bot measures is what a phone would show.
import type { PaceId } from '../data';
import { createGame, seeded, tick, checkOffline, hitBloom, bump, effLv, found, type Ctx } from '../sim';
import { Tracker, type Hit } from './milestones';
import { act, type Policy } from './policies';

export interface RunOpts { policy: Policy; seed: number; days: number; pace: PaceId }
export interface RunEnd { step: number; done: boolean; tier: number; effLv: number; notes: number; cur: number; ups: number; res: number; found: number }
export interface RunResult {
  policy: string; seed: number; days: number; pace: PaceId;
  hits: Hit[]; play: number; wall: number; sessions: number; end: RunEnd;
  /** from one Clinic delivery to the next, in wall seconds and in play seconds: where the stalls are */
  gaps: { key: string; label: string; wall: number; play: number }[];
}

const STEP = 1; // seconds per live tick; biters and stirs are coarse at this size, timers are exact
const DAY = 86400;
const START = Date.UTC(2026, 0, 5, 0, 0, 0); // a Monday; sessions are offsets into each day

/** the day's sessions with a little jitter, never overlapping */
function sessions(p: Policy, rng: () => number): [number, number][] {
  const out: [number, number][] = [];
  let prevEnd = -Infinity;
  for (const [at, len] of p.day) {
    let start = at + (rng() - 0.5) * 40 * 60; const n = Math.max(60, Math.round(len * (0.7 + 0.6 * rng())));
    if (start < prevEnd + 60) start = prevEnd + 60;
    if (start + n > DAY) break;
    out.push([Math.round(start), n]); prevEnd = start + n;
  }
  return out;
}

export function run(o: RunOpts): RunResult {
  const rng = seeded(o.seed * 7919 + 17);
  const clock = { ms: START + 7 * 3600 * 1000 };
  const g: Ctx = createGame({ rng: seeded(o.seed), now: clock.ms, today: () => new Date(clock.ms).toISOString().slice(0, 10), pace: o.pace });
  const tr = new Tracker(); let play = 0, count = 0, t0 = 0;
  const wall = () => (clock.ms - t0) / 1000; // from the first time the player opens the app
  let firstSession = true;
  for (let day = 0; day < o.days; day++) {
    for (let [at, len] of sessions(o.policy, rng)) {
      const startMs = START + (day * DAY + at) * 1000;
      if (startMs < clock.ms) continue; // the run began at 07:00 on day 0
      clock.ms = startMs; count++;
      const off = firstSession ? null : checkOffline(g, clock.ms);
      if (firstSession) { t0 = clock.ms; g.s.last = clock.ms; len = Math.max(len, o.policy.first); firstSession = false; }
      if (off) { if (off.away >= 6 * 3600) bump(g, 'botOvernight'); if (off.capped) bump(g, 'botCapped'); }
      act(g, o.policy, clock.ms, rng); tr.check(g, wall(), play);
      for (let t = 0; t < len; t += o.policy.cadence) {
        const chunk = Math.min(o.policy.cadence, len - t);
        for (let k = 0; k < chunk; k += STEP) {
          tick(g, STEP, clock.ms); clock.ms += STEP * 1000; play += STEP;
          if (g.s.ob) hitBloom(g, o.policy.bloomTaps * STEP);
        }
        act(g, o.policy, clock.ms, rng); tr.check(g, wall(), play);
      }
      g.s.last = clock.ms;
    }
  }
  const s = g.s, st = s.story[0];
  const clinic = tr.hits.filter(x => /^c\d$/.test(x.key)); let prevW = 0, prevP = 0;
  const gaps = clinic.map(x => { const gp = { key: x.key, label: x.label, wall: x.wall - prevW, play: x.play - prevP }; prevW = x.wall; prevP = x.play; return gp; });
  return {
    policy: o.policy.id, seed: o.seed, days: o.days, pace: o.pace, hits: tr.hits, play, wall: wall(), sessions: count, gaps,
    end: { step: st ? st.step : 0, done: !!st?.done, tier: s.tier, effLv: effLv(g), notes: s.notes, cur: s.cur, ups: Object.keys(s.ups).length, res: Object.keys(s.res).length, found: found(g, 0) },
  };
}
