/** A source of numbers in [0, 1). The sim never touches Math.random directly, so tests can be deterministic. */
export type Rng = () => number;

export const mathRng: Rng = () => Math.random();

/** mulberry32: small, fast, good enough for a game */
export function seeded(seed: number): Rng {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export const pick = <T>(rng: Rng, list: T[]): T => list[Math.floor(rng() * list.length)];
