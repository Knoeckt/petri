// Upgrades: the bench (equipment ranked with Notes) on top, then the one-time upgrade tiers.
import { EQUIP, UPT, RAR, TEXT, VAL } from '../../data';
import type { Ctx } from '../../sim';
import { eqLv, eqCost, eqCanBuy, eqMaxed, buyEquip, buy, upCanBuy, upBought, upOpen, upCost, resName, dropsPer, cycleTime, genRate, valMult, effLv, rarLv, rarCap, weights, tierMult, unlocked, sitesOpen, fmt } from '../../sim';
import type { PanelDef } from '../panel';

export function rbar(w: number[]) { return `<div class="rbar">${w.map((v, r) => `<i style="width:${v}%;background:${RAR[r].col}"></i>`).join('')}</div>`; }
export function rleg(w: number[]) { return `<div class="rleg">${w.map((v, r) => v >= .5 ? `<span><i style="background:${RAR[r].col}"></i>${RAR[r].n} ${v < 10 ? v.toFixed(1) : Math.round(v)}%</span>` : '').join('')}</div>`; }

export const upgradesPanel: PanelDef = {
  id: 'up',
  title: () => 'Upgrades',
  render(el, g) {
    const s = g.s;
    const now = `<p class="sub">Now: ${Math.floor(dropsPer(g))} ${TEXT.drops}/cycle · ${cycleTime(g).toFixed(1)}s · ${genRate(g).toFixed(1)}/s · value ×${valMult(g).toFixed(2)}. Duplicates sell for ${VAL.slice(0, 5).map(v => fmt(v * tierMult(g) * valMult(g))).join(' / ')}.</p>`;
    // the bench
    const capped = effLv(g) >= rarCap(g);
    const bench = `<div class="uptier"><h4>The bench</h4><span class="lk on">${s.notes} notes${s.trip ? ' · trip out' : ''}</span></div>` +
      `<p class="sub" style="margin-top:0">Ranked with Notes from field trips${unlocked(g, 'field') ? '' : ' (the Mayor has a map for you)'}. Effective level ${effLv(g)}${capped ? `, the ${TEXT.dish}'s reach here is ${rarCap(g)}; ${TEXT.ascend.toLowerCase()} to go further` : ''}.</p>` +
      `<div class="card" style="padding:8px 12px 10px">${rbar(weights(rarLv(g)))}${rleg(weights(rarLv(g)))}</div>` +
      EQUIP.map(e => {
        const lv = eqLv(g, e.id), max = eqMaxed(g, e.id), c = eqCost(g, e.id), can = eqCanBuy(g, e.id);
        if (max) return `<div class="r done"><div class="rn">${e.n} <span class="tag on">${lv}/${e.max}</span></div><div class="rd">${e.d}</div><div class="rc">✓</div></div>`;
        return `<button class="r ${can ? '' : 'poor'}" data-act="eq" data-k="${e.id}"><div class="rn">${e.n} <span class="tag on">${lv}/${e.max}</span></div><div class="rd">${e.d}</div><div class="rc">${c.notes || c.bio ? `<b>${c.notes}</b> notes<small>+ ${fmt(c.bio)} ${TEXT.cur.toLowerCase()}</small>` : `<b>Free</b><small>the first rank</small>`}</div></button>`;
      }).join('');
    // one-time upgrades
    const tiers = UPT.map((t, ti) => {
      const open = upOpen(g, ti), got = upBought(g, ti), next = UPT[ti + 1];
      const head = `<div class="uptier"><h4>Tier ${ti + 1} · ${t.n}</h4><span class="lk ${open ? 'on' : ''}">${open ? `${got}/${t.items.length} bought${next ? ` · ${Math.max(0, next.need - got)} more opens Tier ${ti + 2}` : ''}` : `buy ${Math.max(0, t.need - upBought(g, ti - 1))} more in Tier ${ti}`}</span></div>`;
      if (!open) return head;
      return head + t.items.map(u => {
        const cost = upCost(g, u), done = !!s.ups[u.id], lockedR = u.req && !s.res[u.req];
        if (done) return `<div class="r done"><div class="rn">${u.n} <span class="tag on">bought</span></div><div class="rd">${u.d}</div><div class="rc">✓</div></div>`;
        if (lockedR) return `<div class="r locked"><div class="rn">${u.n}</div><div class="rd">${u.d} · needs research: ${resName(u.req!)[0]}</div><div class="rc">🔒</div></div>`;
        return `<button class="r ${upCanBuy(g, u, ti) ? '' : 'poor'}" data-act="buy" data-k="${u.id}"><div class="rn">${u.n}</div><div class="rd">${u.d} · one time</div><div class="rc">${fmt(cost)}</div></button>`;
      }).join('');
    }).join('');
    const trips = sitesOpen(g);
    const tripNote = trips.length && !s.trip && s.notes < eqCost(g, 'dish').notes ? `<p class="sub">Short on notes? Send a trip to ${trips[trips.length - 1].n.toLowerCase()} from the board.</p>` : '';
    el.innerHTML = now + bench + tripNote + tiers;
  },
  live(el, g) {
    el.querySelectorAll<HTMLElement>('.r[data-act="eq"]').forEach(r => r.classList.toggle('poor', !eqCanBuy(g, r.dataset.k!)));
    el.querySelectorAll<HTMLElement>('.r[data-act="buy"]').forEach(r => { const ti = UPT.findIndex(t => t.items.some(u => u.id === r.dataset.k)); const u = UPT[ti]?.items.find(u => u.id === r.dataset.k); if (u) r.classList.toggle('poor', !upCanBuy(g, u, ti)); });
  },
  act: {
    eq: (b, g) => buyEquip(g, b.dataset.k!),
    buy: (b, g) => buy(g, b.dataset.k!),
  },
};
