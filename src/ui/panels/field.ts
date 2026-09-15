// Field: expeditions for Notes, and the pipette for artifacts.
import { SITES, SITE, RAR, ART, TICKETS_PER_DAY } from '../../data';
import type { Ctx } from '../../sim';
import { siteOpen, startTrip, mgStart, mgDrop, mgPos, item, fmtDur, eqLv } from '../../sim';
import type { PanelDef } from '../panel';
import { adLabel } from '../sheet';
import { icon } from '../icons';

const label = (u: [number, number]) => `${u[0] + 1}-${u[1]}`;

export const fieldPanel: PanelDef = {
  id: 'field',
  title: () => 'Field',
  render(el, g) {
    const s = g.s, tr = s.trip;
    const status = tr
      ? `<div class="card"><h3>Out at ${SITE[tr.site].n.toLowerCase()}</h3><p class="sub" style="margin:0 0 6px">Back in <b data-live="tripLeft">${fmtDur(tr.left)}</b>. It keeps walking while you are away.</p><div class="prog"><b data-live="tripProg" style="width:${(1 - tr.left / tr.total) * 100}%"></b></div><div class="acts" style="margin-top:8px"><button class="btn ad" data-act="ad" data-live="ad">${adLabel(g, 'Bring it home')}</button></div></div>`
      : s.lastTrip
        ? `<div class="card paper"><h3>Back from ${SITE[s.lastTrip.site]?.n.toLowerCase() || 'the field'}</h3><p class="sub" style="margin:0">+${s.lastTrip.notes} notes${s.lastTrip.sample ? `, and a ${s.lastTrip.sample.isNew ? 'new ' : ''}<b>${item(s.tier, s.lastTrip.sample.r, s.lastTrip.sample.i).n}</b> in a jar` : ''}. You have <b>${s.notes}</b> notes for the bench.</p></div>`
        : `<div class="card paper"><h3>The town map</h3><p class="sub" style="margin:0">Send an expedition and it comes back with Notes for the bench, sometimes with a live sample. One trip at a time; it keeps going while you are away.</p></div>`;
    const sites = SITES.map(x => {
      const open = siteOpen(g, x.id);
      if (!open) return `<div class="r locked"><div class="rn">${x.n}</div><div class="rd">${x.d}</div><div class="rc">${x.unlock[0] > s.tier ? `tier ${x.unlock[0] + 1}` : label(x.unlock)} 🔒</div></div>`;
      const busy = !!tr;
      return `<button class="r ${busy ? 'poor' : ''}" data-act="trip" data-id="${x.id}"><div class="rn">${x.n} <span class="tag">${fmtDur(x.time)}</span></div><div class="rd">${x.d} · ${x.notes[0]}–${x.notes[1]} notes · ${Math.round(x.sample * 100)}% a ${RAR[x.sampleR].n.toLowerCase()} sample</div><div class="rc">${busy ? 'out' : 'Send'}</div></button>`;
    }).join('');
    // the pipette
    const mg = g.mg; const res = mg?.done && mg.result ? mg.result : null; const art = res ? ART[res.art] : null;
    const play = mg && !mg.done
      ? `<div class="card"><h3>Drop it!</h3><div class="mg"><div class="mgbar"><i class="zone"></i><b class="mark" data-live="mark"></b></div></div><div class="acts" style="margin-top:8px"><button class="btn primary" data-act="drop">Drop</button></div></div>`
      : `<div class="card"><h3>Pipette drop</h3><p class="sub" style="margin:0 0 6px">Stop the drop over the green. The closer to the centre, the rarer the artifact. Artifacts go in the ${'dish'} and change your odds.</p>${res && art ? `<div class="kv"><span>${['Miss', 'Close', 'Nice', 'Perfect'][res.grade]}</span><span class="good">${icon(art.id, 18)} ${art.n} · ${RAR[art.r].n}</span></div>` : ''}<div class="kv"><span>Tickets today</span><span>${s.tickets} / ${TICKETS_PER_DAY}</span></div><div class="acts" style="margin-top:8px"><button class="btn primary" data-act="play" ${s.tickets > 0 ? '' : 'disabled'}>Play · 1 ticket</button><button class="btn ad" data-act="adTicket" data-live="adT">${adLabel(g, '+1 ticket')}</button></div></div>`;
    el.innerHTML = status + `<h4 class="gh">Expeditions</h4>` + sites + `<h4 class="gh">The pipette · ${s.tickets} ticket${s.tickets === 1 ? '' : 's'}</h4>` + play + `<p class="sub">Microscope rank ${eqLv(g, 'scope')}: samples from trips count as found the moment they come home.</p>`;
  },
  live(el, g) {
    const tr = g.s.trip;
    if (tr) { const l = el.querySelector('[data-live="tripLeft"]'); if (l && l.textContent !== fmtDur(tr.left)) l.textContent = fmtDur(tr.left); const p = el.querySelector<HTMLElement>('[data-live="tripProg"]'); if (p) p.style.width = ((1 - tr.left / tr.total) * 100) + '%'; }
    const ad = el.querySelector<HTMLButtonElement>('[data-live="ad"]'); if (ad) { const t = adLabel(g, 'Bring it home'); if (ad.textContent !== t) ad.textContent = t; }
    const adT = el.querySelector<HTMLButtonElement>('[data-live="adT"]'); if (adT) { const t = adLabel(g, '+1 ticket'); if (adT.textContent !== t) adT.textContent = t; }
    const mark = el.querySelector<HTMLElement>('[data-live="mark"]'); if (mark && g.mg && !g.mg.done) mark.style.left = (mgPos(g, performance.now()) * 100) + '%';
  },
  act: {
    trip: (b, g) => startTrip(g, b.dataset.id!),
    play: (_b, g) => mgStart(g, performance.now()),
    drop: (_b, g) => mgDrop(g, mgPos(g, performance.now())),
    ad: (_b, _g, api) => { api.ad?.('finish trip'); return false; },
    adTicket: (_b, _g, api) => { api.ad?.('ticket'); return false; },
  },
};
