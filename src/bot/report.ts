// Turns runs into the tables a balance pass reads: one profile across seeds against the targets, and profiles side by side.
import { fmtDur } from '../sim';
import { MILESTONES } from './milestones';
import { TARGETS, verdict } from './targets';
import type { RunResult } from './run';

const median = (xs: number[]) => { if (!xs.length) return null; const s = xs.slice().sort((a, b) => a - b); const k = Math.floor(s.length / 2); return s.length % 2 ? s[k] : (s[k - 1] + s[k]) / 2; };
const dur = (x: number | null) => x === null ? '—' : x >= 86400 ? `${(x / 86400).toFixed(1)}d` : fmtDur(x);
const pad = (s: string, n: number, right = false) => right ? s.padStart(n) : s.padEnd(n);
const MARK: Record<string, string> = { ok: '✓', early: '▼ early', late: '▲ late', missing: '✗ not reached', none: '' };

/** every milestone with the spread across a profile's seeds */
export interface Row { key: string; label: string; reached: number; of: number; wall: number | null; wallMin: number | null; wallMax: number | null; play: number | null; verdict: string }

export function rows(runs: RunResult[]): Row[] {
  return MILESTONES.map(m => {
    const hits = runs.map(r => r.hits.find(h => h.key === m.key)).filter((h): h is NonNullable<typeof h> => !!h);
    const walls = hits.map(h => h.wall), plays = hits.map(h => h.play);
    const w = median(walls), p = median(plays);
    // a milestone most seeds never reached counts as missing, whatever the ones that did say
    const v = hits.length * 2 < runs.length ? (TARGETS[m.key] ? 'missing' : 'none') : verdict(TARGETS[m.key], w, p);
    return { key: m.key, label: m.label, reached: hits.length, of: runs.length, wall: w, wallMin: walls.length ? Math.min(...walls) : null, wallMax: walls.length ? Math.max(...walls) : null, play: p, verdict: v };
  });
}

/** one profile: the timeline against its targets */
export function profileTable(runs: RunResult[]): string {
  const r0 = runs[0];
  const out = [`${r0.policy} · pace ${r0.pace} · ${r0.days} day${r0.days === 1 ? '' : 's'} · ${runs.length} seed${runs.length === 1 ? '' : 's'} · ${dur(median(runs.map(r => r.play)))} of play in ${median(runs.map(r => r.sessions))} sessions`];
  out.push(pad('Milestone', 46) + pad('wall (median)', 15) + pad('min–max', 18) + pad('play', 9) + pad('reached', 9) + pad('target', 22) + 'verdict');
  for (const row of rows(runs)) {
    const t = TARGETS[row.key]; const tg = t ? (t.play ? `${dur(t.play[0])}–${dur(t.play[1])} play` : `${dur(t.wall![0])}–${dur(t.wall![1])}`) : '';
    out.push(pad(row.label, 46) + pad(dur(row.wall), 15) + pad(row.wall === null ? '' : `${dur(row.wallMin)}–${dur(row.wallMax)}`, 18) + pad(dur(row.play), 9) + pad(`${row.reached}/${row.of}`, 9) + pad(tg, 22) + MARK[row.verdict]);
  }
  const ends = runs.map(r => r.end);
  out.push(`End: step ${median(ends.map(e => e.step))}/9${ends.every(e => e.done) ? ' (done)' : ''} · effective level ${median(ends.map(e => e.effLv))} · ${median(ends.map(e => e.found))}/13 found · ${median(ends.map(e => e.ups))} upgrades · ${median(ends.map(e => e.res))} research · notes ${median(ends.map(e => e.notes))}`);
  const worst = runs.flatMap(r => r.gaps).sort((a, b) => b.play - a.play)[0];
  if (worst) out.push(`Longest stretch of play between deliveries: ${dur(worst.play)} of play (${dur(worst.wall)} on the wall) before ${worst.label.split(' · ')[0]}`);
  return out.join('\n');
}

/** profiles side by side: median wall time to each milestone */
export function compareTable(byPolicy: Record<string, RunResult[]>): string {
  const ids = Object.keys(byPolicy); const tables = ids.map(id => rows(byPolicy[id]));
  const out = [pad('Milestone (median wall)', 46) + ids.map(id => pad(id, 14)).join('') + 'target'];
  MILESTONES.forEach((m, i) => {
    const t = TARGETS[m.key]; const tg = t ? (t.play ? `${dur(t.play[0])}–${dur(t.play[1])} play` : `${dur(t.wall![0])}–${dur(t.wall![1])}`) : '';
    out.push(pad(m.label, 46) + tables.map(rs => { const r = rs[i]; return pad(r.wall === null ? '—' : dur(r.wall) + (r.verdict === 'late' ? ' ▲' : r.verdict === 'early' ? ' ▼' : ''), 14); }).join('') + tg);
  });
  return out.join('\n');
}

/** one run, as a timeline: what the roadmap asks the instrumentation to answer */
export function timeline(r: RunResult): string {
  const out = [`${r.policy} · seed ${r.seed} · pace ${r.pace}`];
  out.push(pad('', 28) + pad('milestone', 44) + 'biomass  notes  lv  rate/s  cycle  drops  unc%  rare%  ups  res  found');
  for (const h of r.hits) { const s = h.snap; out.push(`${pad(dur(h.wall), 9, true)}  ${pad(dur(h.play), 8, true)} play  ${pad(h.label, 44)}${pad(String(s.cur), 9, true)}${pad(String(s.notes), 7, true)}${pad(String(s.lv), 4, true)}${pad(String(s.rate), 8, true)}${pad(String(s.cycle), 7, true)}${pad(String(s.drops), 7, true)}${pad(String(s.unc), 6, true)}${pad(String(s.rare), 7, true)}${pad(String(s.ups), 5, true)}${pad(String(s.res), 5, true)}${pad(String(s.found), 7, true)}`); }
  return out.join('\n');
}
