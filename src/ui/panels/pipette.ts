// The pipette: tickets and the Pipette drop mini-game for artifacts. A sheet behind the middle-right side button.
import { RAR, ART, TICKETS_PER_DAY, TEXT } from '../../data';
import { mgStart, mgDrop, mgFrame, unlocked } from '../../sim';
import type { PanelDef } from '../panel';
import { adLabel } from '../sheet';
import { icon } from '../icons';
import { play } from '../sound';

export const pipettePanel: PanelDef = {
  id: 'pipette',
  title: () => 'Pipette',
  intro: ['The pipette', `A ticket buys one drop: stop the marker over the green and win an artifact for the shelf under the ${TEXT.dish.toLowerCase()}. The nearer the centre, the rarer. Three tickets a day, more from the Shop or an ad.`],
  render(el, g) {
    const s = g.s, mg = g.mg; const res = mg?.done && mg.result ? mg.result : null; const art = res ? ART[res.art] : null;
    const meter = `<div class="mg" aria-hidden="true"><div class="mgbar"><i class="zone"></i><b class="mark" data-live="mark" style="left:${(mg?.pos ?? 0.5) * 100}%"></b></div></div>`;
    el.innerHTML = mg && !mg.done
      ? `<div class="card"><h3>Drop it!</h3>${meter}<div class="acts" style="margin-top:8px"><button class="btn primary" data-act="drop">Drop</button></div></div>`
      : `<p class="sub">Stop the drop over the green. The closer to the centre, the rarer the artifact. Artifacts go on the shelf under the ${TEXT.dish} and change your odds.</p><div class="card"><h3>Pipette drop</h3>${res && art ? `<div class="kv"><span>${['Miss', 'Close', 'Nice', 'Perfect'][res.grade]}</span><span class="good">${icon(art.id, 18)} ${art.n} · ${RAR[art.r].n}</span></div>` : ''}<div class="kv"><span>Tickets today</span><span>${s.tickets} / ${TICKETS_PER_DAY}</span></div><div class="acts" style="margin-top:8px"><button class="btn primary" data-act="play" ${s.tickets > 0 ? '' : 'disabled'}>Play · 1 ticket</button><button class="btn ad" data-act="adTicket" data-live="adT">${adLabel(g, '+1 ticket')}</button></div></div><p class="sub">Three tickets a day. Extra ones come from ads or the Shop.</p>`;
  },
  frame(el, g, now) {
    const mark = el.querySelector<HTMLElement>('[data-live="mark"]');
    if (mark && g.mg && !g.mg.done) mark.style.left = (mgFrame(g, now) * 100) + '%';
  },
  live(el, g) {
    const adT = el.querySelector<HTMLButtonElement>('[data-live="adT"]'); if (adT) { const t = adLabel(g, '+1 ticket'); if (adT.innerHTML !== t) adT.innerHTML = t; }
  },
  act: {
    play: (_b, g) => mgStart(g, performance.now()),
    drop: (_b, g) => { const ok = mgDrop(g); if (ok) play(g.mg?.result && g.mg.result.grade >= 2 ? 'find' : 'tap'); return ok; },
    adTicket: (_b, g, api) => { if (unlocked(g, 'tickets')) api.ad?.('ticket'); return false; },
  },
};
