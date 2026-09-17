import { describe, it, expect } from 'vitest';
import { run } from './run';
import { POLICIES } from './policies';
import { parse } from './cli';
import { rows } from './report';
import { verdict } from './targets';

const at = (r: ReturnType<typeof run>, key: string) => r.hits.find(h => h.key === key) ?? null;

describe('balance bots', () => {
  it('replays identically for a seed', () => {
    const a = run({ policy: POLICIES.active, seed: 3, days: 1, pace: 'real' }), b = run({ policy: POLICIES.active, seed: 3, days: 1, pace: 'real' });
    expect(a.hits).toEqual(b.hits); expect(a.end).toEqual(b.end); expect(a.play).toBe(b.play);
  });

  it('records milestones in the order the game makes them possible', () => {
    const r = run({ policy: POLICIES.active, seed: 1, days: 2, pace: 'real' });
    const harvest = at(r, 'harvest')!, c1 = at(r, 'c1')!, trip = at(r, 'trip1')!, c2 = at(r, 'c2');
    expect(harvest.wall).toBeGreaterThan(0); expect(harvest.wall).toBeLessThanOrEqual(c1.wall);
    expect(trip.wall).toBeGreaterThanOrEqual(c1.wall); // the map comes from the Mayor
    if (c2) expect(c2.wall).toBeGreaterThanOrEqual(c1.wall);
    expect(r.play).toBeLessThan(r.wall); expect(r.sessions).toBeGreaterThan(1);
  });

  it('sends the gaps between sessions through the offline catch-up', () => {
    const r = run({ policy: POLICIES.idle, seed: 2, days: 3, pace: 'real' });
    expect(at(r, 'return')).not.toBeNull(); // one evening session a day: every return is an overnight one
    expect(at(r, 'return')!.wall).toBeGreaterThan(12 * 3600);
  });

  it('gets an active player through the first three requests inside a week at playtest pace', () => {
    const r = run({ policy: POLICIES.active, seed: 1, days: 7, pace: 'real' });
    expect(r.end.step).toBeGreaterThanOrEqual(3);
    expect(at(r, 'res1')).not.toBeNull();
  });

  it('runs the optimizer without spending what it cannot afford', () => {
    const r = run({ policy: POLICIES.optimizer, seed: 5, days: 1, pace: 'proto' });
    expect(r.end.cur).toBeGreaterThanOrEqual(0); expect(r.end.notes).toBeGreaterThanOrEqual(0);
  });

  it('summarises seeds as medians with a verdict against the targets', () => {
    const runs = [1, 2, 3].map(seed => run({ policy: POLICIES.active, seed, days: 1, pace: 'real' }));
    const table = rows(runs); const h = table.find(x => x.key === 'harvest')!;
    expect(h.reached).toBe(3); expect(h.wall).not.toBeNull(); expect(['ok', 'early', 'late']).toContain(h.verdict);
    expect(table.find(x => x.key === 'ascend')!.verdict).toBe('none');
  });

  it('judges against wall or play time as each target says', () => {
    expect(verdict({ wall: [60, 90] }, 75, 0)).toBe('ok');
    expect(verdict({ wall: [60, 90] }, 100, 0)).toBe('late');
    expect(verdict({ play: [100, 200] }, 5000, 50)).toBe('early');
    expect(verdict({ wall: [60, 90] }, null, null)).toBe('missing');
    expect(verdict(undefined, 1, 1)).toBe('none');
  });

  it('parses its arguments', () => {
    expect(parse([])).toMatchObject({ profiles: ['active', 'casual', 'idle', 'optimizer'], seeds: 5, days: 7, pace: 'real' });
    expect(parse(['-p', 'idle,casual', '-s', '2', '-d', '3', '--pace', 'proto', '-v'])).toMatchObject({ profiles: ['idle', 'casual'], seeds: 2, days: 3, pace: 'proto', verbose: true });
    expect(() => parse(['--profile', 'human'])).toThrow(/unknown profile/);
    expect(() => parse(['--pace', 'slow'])).toThrow(/unknown pace/);
  });
});
