// Balance profiles (ROADMAP §6). The same formulas run under both; only the time scale differs.
// Costs, yields and rarity tables are untouched: a profile changes how long things take, never what they are worth.
export type PaceId = 'proto' | 'real';

export interface Pace {
  id: PaceId; n: string; d: string;
  /** dish cycle length (CYCLE_BASE and the tier/research multipliers) */
  cycle: number;
  /** every other timer: research, studies, brewing, splicing, field trips */
  timer: number;
  /** the stand-in rewarded ad's length */
  ad: number;
  /** the cooldown between ads */
  adCd: number;
  /** the 2× boost's length */
  boost: number;
  /** how long biters take between bites; the design (§11) scales this with the cycle */
  bite: number;
}

export const PACES: Record<PaceId, Pace> = {
  proto: { id: 'proto', n: 'Prototype', d: 'Mockup seconds: 20 s cycles, the pond is a minute away, ads take 3 s.', cycle: 1, timer: 1, ad: 1, adCd: 1, boost: 1, bite: 1 },
  real: { id: 'real', n: 'Playtest', d: 'Intended timings: 90 s cycles, the pond is ten minutes away, ads take 30 s.', cycle: 4.5, timer: 10, ad: 10, adCd: 3, boost: 10, bite: 4.5 },
};
/** what a build runs at unless the URL, storage or the dev sheet says otherwise */
export const DEFAULT_PACE: PaceId = 'proto';
export const isPaceId = (x: unknown): x is PaceId => x === 'proto' || x === 'real';
