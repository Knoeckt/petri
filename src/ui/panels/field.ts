// Field: the town map to pick an expedition, then the pipette for artifacts. A full screen.
import { SITE, RAR, ART, TICKETS_PER_DAY, TEXT } from '../../data';
import type { Ctx } from '../../sim';
import { siteOpen, startTrip, mgStart, mgDrop, mgFrame, item, fmtDur, sitesOpen, unlocked, unlockLabel, unlockHint } from '../../sim';
import type { PanelDef } from '../panel';
import { adLabel } from '../sheet';
import { icon } from '../icons';
import { MapScene } from '../map';
import { play } from '../sound';

let map: MapScene | null = null;
const mapScene = (g: Ctx) => map || (map = new MapScene(g));

export const fieldPanel: PanelDef = {
  id: 'field',
  title: () => 'Field',
  full: true,
  render(el, g) {
    const s = g.s, tr = s.trip, sc = mapScene(g);
    if (!sc.sel || !siteOpen(g, sc.sel)) { const open = sitesOpen(g); sc.sel = open.length ? open[open.length - 1].id : null; }
    const site = sc.sel ? SITE[sc.sel] : null;
    const status = tr
      ? `<div class="card"><h3>Out at ${SITE[tr.site].n.toLowerCase()}</h3><p class="sub" style="margin:0 0 6px">Back in <b data-live="tripLeft">${fmtDur(tr.left)}</b>. They keep walking while you are away.</p><div class="prog"><b data-live="tripProg" style="width:${(1 - tr.left / tr.total) * 100}%"></b></div><div class="acts" style="margin-top:8px"><button class="btn ad" data-act="ad" data-live="ad">${adLabel(g, 'Bring them home')}</button></div></div>`
      : site
        ? `<div class="card"><h3>${site.n} <span class="tag">${fmtDur(site.time)}</span></h3><p class="sub" style="margin:0 0 6px">${site.d}</p><div class="kv"><span>Notes</span><span>${site.notes[0]}–${site.notes[1]}</span></div><div class="kv"><span>Live sample</span><span>${Math.round(site.sample * 100)}% · ${RAR[site.sampleR].n.toLowerCase()}</span></div>${s.lastTrip && !tr ? `<p class="sub" style="margin:6px 0 0">Last trip: +${s.lastTrip.notes} notes${s.lastTrip.sample ? `, a ${s.lastTrip.sample.isNew ? 'new ' : ''}${item(s.tier, s.lastTrip.sample.r, s.lastTrip.sample.i).n}` : ''}. You have ${s.notes} notes.</p>` : ''}<div class="acts" style="margin-top:8px"><button class="btn primary" data-act="trip" data-id="${site.id}">Send a trip to ${site.n.toLowerCase()}</button></div></div>`
        : `<div class="card paper"><h3>The town map</h3><p class="sub" style="margin:0">Tap a place to send an expedition. It comes back with Notes for the bench, sometimes with a live sample. The fog lifts as the story opens the town.</p></div>`;
    const mg = g.mg; const res = mg?.done && mg.result ? mg.result : null; const art = res ? ART[res.art] : null;
    const ticketsOpen = unlocked(g, 'tickets');
    const meter = `<div class="mg" aria-hidden="true"><div class="mgbar"><i class="zone"></i><b class="mark" data-live="mark" style="left:${(mg?.pos ?? 0.5) * 100}%"></b></div></div>`;
    const pip = !ticketsOpen
      ? `<div class="card paper"><h3>Pipette locked</h3><p class="sub" style="margin:0">Opens after ${unlockLabel('tickets')}. ${unlockHint('tickets')}</p></div>`
      : mg && !mg.done
      ? `<div class="card"><h3>Drop it!</h3>${meter}<div class="acts" style="margin-top:8px"><button class="btn primary" data-act="drop">Drop</button></div></div>`
      : `<div class="card"><h3>Pipette drop</h3><p class="sub" style="margin:0 0 6px">Stop the drop over the green. The closer to the centre, the rarer the artifact. Artifacts go in the ${TEXT.dish} and change your odds.</p>${res && art ? `<div class="kv"><span>${['Miss', 'Close', 'Nice', 'Perfect'][res.grade]}</span><span class="good">${icon(art.id, 18)} ${art.n} · ${RAR[art.r].n}</span></div>` : ''}<div class="kv"><span>Tickets today</span><span>${s.tickets} / ${TICKETS_PER_DAY}</span></div><div class="acts" style="margin-top:8px"><button class="btn primary" data-act="play" ${s.tickets > 0 ? '' : 'disabled'}>Play · 1 ticket</button><button class="btn ad" data-act="adTicket" data-live="adT">${adLabel(g, '+1 ticket')}</button></div></div>`;
    el.innerHTML = `<div class="scenewrap" data-scene="map"></div>` + status + `<h4 class="gh">The pipette${ticketsOpen ? ` · ${s.tickets} ticket${s.tickets === 1 ? '' : 's'}` : ''}</h4>` + pip;
    el.querySelector('.scenewrap')!.appendChild(sc.canvas);
  },
  frame(el, g, now) {
    mapScene(g).draw(now);
    const mark = el.querySelector<HTMLElement>('[data-live="mark"]');
    if (mark && unlocked(g, 'tickets') && g.mg && !g.mg.done) mark.style.left = (mgFrame(g, now) * 100) + '%';
  },
  live(el, g) {
    const tr = g.s.trip;
    if (tr) { const l = el.querySelector('[data-live="tripLeft"]'); if (l && l.textContent !== fmtDur(tr.left)) l.textContent = fmtDur(tr.left); const p = el.querySelector<HTMLElement>('[data-live="tripProg"]'); if (p) p.style.width = ((1 - tr.left / tr.total) * 100) + '%'; }
    const ad = el.querySelector<HTMLButtonElement>('[data-live="ad"]'); if (ad) { const t = adLabel(g, 'Bring them home'); if (ad.innerHTML !== t) ad.innerHTML = t; }
    const adT = el.querySelector<HTMLButtonElement>('[data-live="adT"]'); if (adT) { const t = adLabel(g, '+1 ticket'); if (adT.innerHTML !== t) adT.innerHTML = t; }
  },
  scene(g, x, y) {
    const sc = mapScene(g), id = sc.hit(x, y); if (!id) return false;
    if (!siteOpen(g, id)) { const u = SITE[id].unlock; g.emit({ type: 'toast', msg: `${SITE[id].n} is still in the fog. ${u[0] > g.s.tier ? `It opens at tier ${u[0] + 1}.` : `Help the Clinic through ${u[0] + 1}-${u[1]}.`}` }); return false; }
    sc.sel = id; play('tap'); return true;
  },
  act: {
    trip: (b, g) => { const ok = startTrip(g, b.dataset.id!); if (ok) play('level'); return ok; },
    play: (_b, g) => mgStart(g, performance.now()),
    drop: (_b, g) => { const ok = mgDrop(g); if (ok) play(g.mg?.result && g.mg.result.grade >= 2 ? 'find' : 'tap'); return ok; },
    ad: (_b, _g, api) => { api.ad?.('finish trip'); return false; },
    adTicket: (_b, g, api) => { if (unlocked(g, 'tickets')) api.ad?.('ticket'); return false; },
  },
};
