// The game context: state plus the few things the sim needs from outside (random numbers, clocks, the vessel's
// shape) and the one thing it sends back (events the UI turns into toasts, particles and sounds).
import type { State, Find } from './state';
import { fresh, migrate } from './state';
import { mathRng, type Rng } from './rng';

export type GameEvent =
  | { type: 'toast'; msg: string; bad?: boolean }
  | { type: 'dirty' }
  | { type: 'chomp'; x: number; y: number; col: string }
  | { type: 'find'; finds: Find[] }
  | { type: 'burst'; col: string }
  | { type: 'smoke' }
  | { type: 'lever' }
  | { type: 'ripple'; col: string }
  | { type: 'unlock'; areas: string[] }
  | { type: 'chapterDone' }
  | { type: 'ascend'; tier: number }
  | { type: 'genesis'; runs: number }
  | { type: 'trip'; site: string; notes: number; sample: { r: number; i: number; isNew: boolean } | null };

/** where critters may go, in vessel-normalised coordinates (0..1) */
export type Bounds =
  | { type: 'circle'; r: number }
  | { type: 'dome'; r: number; maxY: number }
  | { type: 'rect'; minX: number; maxX: number; minY: number; maxY: number };

export const CIRCLE: Bounds = { type: 'circle', r: 0.42 };

export interface Ctx {
  s: State;
  rng: Rng;
  /** critter movement bounds; the UI sets this to the current vessel's shape */
  bounds: Bounds;
  /** when true, biters neither hunt nor bite (a panel covers the vessel) */
  paused: boolean;
  /** transient pipette game, not saved */
  mg: { t0: number; done: boolean; result?: { art: string; grade: number; pos: number } } | null;
  today: () => string;
  emit: (e: GameEvent) => void;
  on: (fn: (e: GameEvent) => void) => () => void;
}

export interface CreateOpts { save?: unknown; rng?: Rng; now?: number; today?: () => string }

export function createGame(opts: CreateOpts = {}): Ctx {
  const now = opts.now ?? Date.now();
  const s = migrate(opts.save) ?? fresh(now);
  const listeners = new Set<(e: GameEvent) => void>();
  return {
    s,
    rng: opts.rng ?? mathRng,
    bounds: CIRCLE,
    paused: false,
    mg: null,
    today: opts.today ?? (() => new Date().toDateString()),
    emit: e => { for (const fn of listeners) fn(e); },
    on: fn => { listeners.add(fn); return () => listeners.delete(fn); },
  };
}

export const toast = (g: Ctx, msg: string, bad?: boolean) => g.emit({ type: 'toast', msg, bad });
export const dirty = (g: Ctx) => g.emit({ type: 'dirty' });

export function fmt(n: number): string {
  if (!(n > 0.05)) n = 0;
  if (n < 1000) return n < 10 ? n.toFixed(1) : Math.floor(n).toString();
  const u = ['k', 'M', 'B', 'T', 'q', 'Q']; let i = -1;
  while (n >= 1000 && i < u.length - 1) { n /= 1000; i++; }
  return n.toFixed(n < 10 ? 2 : 1) + u[i];
}
export function fmtDur(sec: number): string {
  const s = Math.round(sec);
  if (s < 60) return s + 's';
  if (s < 3600) return Math.floor(s / 60) + 'm ' + (s % 60) + 's';
  return Math.floor(s / 3600) + 'h ' + Math.floor((s % 3600) / 60) + 'm';
}
