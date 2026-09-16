import { describe, it, expect } from 'vitest';
import { createGame, seeded, tutSeen, collect, story, type Ctx } from '../sim';
import { guideTarget } from './guide';

const game = () => createGame({ rng: seeded(1), now: 1_000_000, today: () => 'day1' });
const firstHarvest = (g: Ctx) => { g.s.dishes[0].ready = true; collect(g, 0); };

describe('first-run guide', () => {
  it('starts on the dish, then the harvest', () => {
    const g = game();
    expect(guideTarget(g, null)?.[1]).toMatch(/stir/i);
    g.s.st.stir = 3; g.s.dishes[0].ready = true;
    expect(guideTarget(g, null)?.[0]).toBe('.harvest');
  });

  it('only blocks the screen for the very first harvest', () => {
    const g = game(); firstHarvest(g); g.s.dishes[0].ready = true;
    expect(guideTarget(g, null)).toEqual(['.harvest', 'Harvest again', 'soft']);
    g.s.cycles = 3;
    expect(guideTarget(g, null)?.[0]).not.toBe('.harvest');
  });

  it('still shows the next prompt while a ready dish waits', () => {
    const g = game(); firstHarvest(g); g.s.cycles = 3; g.s.dishes[0].ready = true;
    for (const k of ['clinic', 'field', 'quests', 'lab']) tutSeen(g, k);
    g.s.st.trip = 1; g.s.cat[0] = {}; story(g).step = 4; // the kettle has just opened
    expect(guideTarget(g, null)?.[0]).toBe('.sbtn[data-tab="brew"]');
  });

  it('points at the Clinic after the first harvest and lets go once it has been visited', () => {
    const g = game(); firstHarvest(g);
    g.s.cat[0] = {}; // whatever the roll gave, make sure the Mayor cannot be paid yet
    const t = guideTarget(g, null);
    expect(t?.[0]).toBe('.tabs button[data-tab="clinic"]'); expect(t?.[1]).toMatch(/Clinic needs you/);
    tutSeen(g, 'clinic'); // what Panels.open does through App
    expect(guideTarget(g, null)).toBeNull(); // nothing else to show until the Mayor is paid
  });

  it('keeps pointing at the Clinic while a delivery is possible', () => {
    const g = game(); firstHarvest(g); tutSeen(g, 'clinic');
    g.s.cat[0] = { '0-0': 3 };
    expect(guideTarget(g, null)?.[1]).toBe('Deliver to Mayor Bramble');
    expect(guideTarget(g, 'clinic')?.[0]).toBe('.tabbody [data-act="deliver"]');
  });

  it('shows nothing inside a panel that has no next step', () => {
    const g = game(); firstHarvest(g);
    expect(guideTarget(g, 'clinic')).toBeNull();
    expect(guideTarget(g, 'catalog')).toBeNull();
  });

  it('is over once the kettle has been seen and used past step five', () => {
    const g = game(); story(g).step = 5; g.s.tut.seen = { brew: true, brewed: true };
    expect(guideTarget(g, null)).toBeNull(); expect(g.s.tut.done).toBe(true);
  });
});
