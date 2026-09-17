// The balance bots' command line. Run through `npm run bot` (scripts/bot.mjs bundles this with Vite and calls main).
//   npm run bot                         every profile, 5 seeds, 7 days, playtest pace
//   npm run bot -- --profile active --seeds 3 --days 3 --verbose
//   npm run bot -- --pace proto --json out.json
import { isPaceId, type PaceId } from '../data';
import { POLICIES } from './policies';
import { run, type RunResult } from './run';
import { profileTable, compareTable, timeline } from './report';

export interface Args { profiles: string[]; seeds: number; days: number; pace: PaceId; json: string | null; verbose: boolean }

/** the host hands in file writing so this file needs no Node types */
export interface Host { write: (path: string, text: string) => void }

export function parse(argv: string[]): Args {
  const a: Args = { profiles: Object.keys(POLICIES), seeds: 5, days: 7, pace: 'real', json: null, verbose: false };
  for (let i = 0; i < argv.length; i++) {
    const k = argv[i], v = argv[i + 1];
    if (k === '--profile' || k === '-p') { a.profiles = v === 'all' ? Object.keys(POLICIES) : v.split(','); i++; }
    else if (k === '--seeds' || k === '-s') { a.seeds = Math.max(1, +v | 0); i++; }
    else if (k === '--days' || k === '-d') { a.days = Math.max(1, +v | 0); i++; }
    else if (k === '--pace') { if (!isPaceId(v)) throw new Error(`unknown pace ${v}`); a.pace = v; i++; }
    else if (k === '--json') { a.json = v; i++; }
    else if (k === '--verbose' || k === '-v') a.verbose = true;
    else if (k === '--help' || k === '-h') { a.profiles = []; console.log(HELP); return a; }
    else throw new Error(`unknown argument ${k}`);
  }
  for (const p of a.profiles) if (!POLICIES[p]) throw new Error(`unknown profile ${p}; have ${Object.keys(POLICIES).join(', ')}`);
  return a;
}

const HELP = `petri balance bots
  --profile, -p  active | casual | idle | optimizer | all, or a comma list   (all)
  --seeds, -s    how many seeds per profile                                  (5)
  --days, -d     how many days each run lasts                                (7)
  --pace         real | proto                                                (real)
  --json FILE    also write every run's milestones and end state as JSON
  --verbose, -v  print each run's timeline`;

export async function main(argv: string[], host: Host) {
  const a = parse(argv); if (!a.profiles.length) return;
  const byPolicy: Record<string, RunResult[]> = {};
  const t0 = Date.now();
  for (const id of a.profiles) {
    byPolicy[id] = [];
    for (let seed = 1; seed <= a.seeds; seed++) { const r = run({ policy: POLICIES[id], seed, days: a.days, pace: a.pace }); byPolicy[id].push(r); if (a.verbose) console.log(timeline(r) + '\n'); }
    console.log(profileTable(byPolicy[id]) + '\n');
  }
  if (a.profiles.length > 1) console.log(compareTable(byPolicy) + '\n');
  console.log(`${a.profiles.length * a.seeds} runs in ${((Date.now() - t0) / 1000).toFixed(1)} s`);
  if (a.json) { host.write(a.json, JSON.stringify({ args: a, runs: Object.values(byPolicy).flat() }, null, 1)); console.log(`wrote ${a.json}`); }
}
