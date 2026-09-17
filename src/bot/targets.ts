// Where each milestone should land at playtest pace: the target table in DEVELOPMENT.md §3, as numbers.
// `wall` is seconds since the run began (the clock on the wall); `play` is seconds actually spent in sessions.
// Change DEVELOPMENT.md first, then this file.
export interface Target { wall?: [number, number]; play?: [number, number]; note?: string }

const m = 60, h = 3600, d = 86400;

export const TARGETS: Record<string, Target> = {
  harvest: { wall: [1 * m, 1.5 * m], note: 'one cycle, stirring shortens it' },
  up1: { wall: [0, 5 * m], note: 'first spend before the first delivery' },
  c1: { wall: [3 * m, 6 * m], note: 'two or three cycles' },
  trip1: { wall: [0, 5 * m], note: 'the first reason to put the phone down' },
  tripBack: { wall: [0, 15 * m] },
  eq1: { wall: [15 * m, 20 * m], note: 'end of session 1' },
  c2: { wall: [10 * m, 15 * m], note: 'never a stall' },
  c3: { wall: [15 * m, 25 * m], note: 'still commons, no wall' },
  res1: { wall: [15 * m, 26 * m], note: 'within a minute of the Lab opening' },
  c4: { wall: [30 * m, 60 * m], note: 'the first designed wait; session 2' },
  c5: { play: [1.5 * h, 2.5 * h], note: 'day 1–2 of play' },
  return: { wall: [12 * h, 36 * h], note: 'day 1 → 2' },
  auto: { wall: [1 * d, 2 * d], note: 'the automation milestone, day 2' },
  c6: { wall: [1 * d, 3 * d], note: 'the midpoint; the second stall' },
  c9: { wall: [3 * d, 5 * d], note: '5–8 sessions' },
};

export const verdict = (t: Target | undefined, wall: number | null, play: number | null): 'ok' | 'early' | 'late' | 'missing' | 'none' => {
  if (!t) return 'none';
  const [lo, hi] = t.play ? t.play : t.wall!; const v = t.play ? play : wall;
  if (v === null) return 'missing';
  return v < lo ? 'early' : v > hi ? 'late' : 'ok';
};
