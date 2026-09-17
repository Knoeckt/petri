// Field: the town map to pick an expedition. A full screen. (The pipette has its own sheet: panels/pipette.ts.)
import { SITE, RAR } from '../../data';
import type { Ctx } from '../../sim';
import { siteOpen, startTrip, item, fmtDur, sitesOpen, tripTime } from '../../sim';
import type { PanelDef } from '../panel';
import { adLabel } from '../sheet';
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
        ? `<div class="card"><h3>${site.n} <span class="tag">${fmtDur(tripTime(g, site))}</span></h3><p class="sub" style="margin:0 0 6px">${site.d}</p><div class="kv"><span>Notes</span><span>${site.notes[0]}–${site.notes[1]}</span></div><div class="kv"><span>Live sample</span><span>${Math.round(site.sample * 100)}% · ${RAR[site.sampleR].n.toLowerCase()}</span></div>${s.lastTrip && !tr ? `<p class="sub" style="margin:6px 0 0">Last trip: +${s.lastTrip.notes} notes${s.lastTrip.sample ? `, a ${s.lastTrip.sample.isNew ? 'new ' : ''}${item(s.tier, s.lastTrip.sample.r, s.lastTrip.sample.i).n}` : ''}. You have ${s.notes} notes.</p>` : ''}<div class="acts" style="margin-top:8px"><button class="btn primary" data-act="trip" data-id="${site.id}">Send a trip to ${site.n.toLowerCase()}</button></div></div>`
        : `<div class="card paper"><h3>The town map</h3><p class="sub" style="margin:0">Tap a place to send an expedition. It comes back with Notes for the bench, sometimes with a live sample. The fog lifts as the story opens the town.</p></div>`;
    el.innerHTML = `<div class="scenewrap" data-scene="map"></div>` + status;
    el.querySelector('.scenewrap')!.appendChild(sc.canvas);
  },
  frame(_el, g, now) { mapScene(g).draw(now); },
  live(el, g) {
    const tr = g.s.trip;
    if (tr) { const l = el.querySelector('[data-live="tripLeft"]'); if (l && l.textContent !== fmtDur(tr.left)) l.textContent = fmtDur(tr.left); const p = el.querySelector<HTMLElement>('[data-live="tripProg"]'); if (p) p.style.width = ((1 - tr.left / tr.total) * 100) + '%'; }
    const ad = el.querySelector<HTMLButtonElement>('[data-live="ad"]'); if (ad) { const t = adLabel(g, 'Bring them home'); if (ad.innerHTML !== t) ad.innerHTML = t; }
  },
  scene(g, x, y) {
    const sc = mapScene(g), id = sc.hit(x, y); if (!id) return false;
    if (!siteOpen(g, id)) { const u = SITE[id].unlock; g.emit({ type: 'toast', msg: `${SITE[id].n} is still in the fog. ${u[0] > g.s.tier ? `It opens at tier ${u[0] + 1}.` : `Help the Clinic through ${u[0] + 1}-${u[1]}.`}` }); return false; }
    sc.sel = id; play('tap'); return true;
  },
  act: {
    trip: (b, g) => { const ok = startTrip(g, b.dataset.id!); if (ok) play('level'); return ok; },
    ad: (_b, _g, api) => { api.ad?.('finish trip'); return false; },
  },
};
