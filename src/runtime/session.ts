import { checkOffline, tick, type Ctx, type Offline } from '../sim';

export interface SessionClock {
  wall: () => number;
  monotonic: () => number;
}

/** Coordinates live play and catch-up. Writing a save never advances the game clock. */
export class GameSession {
  running = false;
  private lastFrame = 0;

  constructor(
    private g: Ctx,
    private persist: () => void,
    private onOffline: (offline: Offline) => void,
    private clock: SessionClock = { wall: () => Date.now(), monotonic: () => performance.now() },
  ) {}

  resume() {
    if (this.running) return;
    const offline = checkOffline(this.g, this.clock.wall());
    this.lastFrame = this.clock.monotonic();
    this.running = true;
    // Persist catch-up immediately: terminating the app must not replay its rewards.
    this.save();
    if (offline) this.onOffline(offline);
  }

  frame(now: number): number {
    if (!this.running) return 0;
    const elapsed = Math.max(0, (now - this.lastFrame) / 1000);
    this.lastFrame = now;
    // A long gap without a visibility event means the browser suspended this page.
    if (elapsed > 5) {
      const offline = checkOffline(this.g, this.clock.wall());
      this.save();
      if (offline) this.onOffline(offline);
      return 0;
    }
    // Small stalls retain their elapsed time without giving movement a huge timestep.
    let remaining = elapsed;
    while (remaining > 0) {
      const dt = Math.min(0.25, remaining);
      tick(this.g, dt, now - (remaining - dt) * 1000);
      remaining -= dt;
    }
    this.g.s.last = this.clock.wall();
    return elapsed;
  }

  suspend() {
    if (this.running) {
      this.frame(this.clock.monotonic());
      this.running = false;
    }
    this.save();
  }

  save() {
    this.persist();
  }
}
