import { describe, expect, it, vi } from 'vitest';
import { createGame, seeded, type Offline } from '../sim';
import { GameSession } from './session';

function setup() {
  let wall = 1_000_000, mono = 0, saved = '';
  const g = createGame({ now: wall, rng: seeded(1), today: () => 'today' });
  const offline = vi.fn<(result: Offline) => void>();
  const session = new GameSession(g, () => { saved = JSON.stringify(g.s); }, offline, {
    wall: () => wall,
    monotonic: () => mono,
  });
  return { g, session, offline, saved: () => JSON.parse(saved),
    advance: (seconds: number) => { wall += seconds * 1000; mono += seconds * 1000; return mono; } };
}

describe('session lifecycle', () => {
  it('preserves the departure time through hidden autosaves and hidden frames', () => {
    const t = setup(); t.session.resume();
    t.session.frame(t.advance(1)); t.session.suspend();
    const departed = t.g.s.last, income = t.g.s.cur;
    for (let i = 0; i < 20; i++) {
      t.session.frame(t.advance(3));
      t.session.save();
    }
    expect(t.saved().last).toBe(departed);
    expect(t.g.s.cur).toBe(income);
    t.advance(1); t.session.resume();
    expect(t.offline).toHaveBeenCalledOnce();
    expect(t.offline.mock.calls[0][0].away).toBe(61);
    expect(t.saved().cur).toBe(t.g.s.cur);
    expect(t.saved().last).toBe(departed + 61_000);
  });

  it('does not count resume time again in the next live frame or repeated lifecycle events', () => {
    const t = setup(); t.session.resume(); t.session.suspend();
    t.advance(60); t.session.suspend(); t.session.resume();
    const cur = t.g.s.cur, last = t.g.s.last;
    t.session.resume();
    expect(t.g.s.cur).toBe(cur);
    expect(t.offline).toHaveBeenCalledOnce();
    t.session.frame(t.advance(0.1));
    expect(t.g.s.cur - cur).toBeCloseTo(0.03);
    expect(t.g.s.last).toBe(last + 100);
  });

  it('catches up after an animation-frame suspension even without a visibility event', () => {
    const t = setup(); t.session.resume();
    t.session.frame(t.advance(60));
    expect(t.offline.mock.calls[0][0].away).toBe(60);
    expect(t.saved().last).toBe(1_060_000);
  });

  it('retains small foreground stalls and does not mutate the clock when saving', () => {
    const t = setup(); t.session.resume();
    t.session.frame(t.advance(2));
    expect(t.g.s.cur).toBeCloseTo(0.6);
    const last = t.g.s.last;
    t.advance(1); t.session.save();
    expect(t.saved().last).toBe(last);
  });
});
