// Upgrades: the one-time upgrade tiers. Completed tiers fold up; a tap on the heading unfolds one.
import { UPT, TEXT, VAL } from '../../data';
import { buy, upCanBuy, upBought, upOpen, upCost, resName, dropsPer, cycleTime, genRate, valMult, tierMult, fmt } from '../../sim';
import type { PanelDef } from '../panel';

const unfolded = new Set<number>();

export const upgradesPanel: PanelDef = {
  id: 'up',
  title: () => 'Upgrades',
  keepScroll: true,
  intro: ['Upgrades', `One-time buys, paid in ${TEXT.cur.toLowerCase()}. Each makes the ${TEXT.dish.toLowerCase()} faster, fuller or worth more, and they all stack. Buy enough in a tier and the next tier opens. They reset at ${TEXT.ascend.toLowerCase()}, so spend freely. Equipment ranks live at the Lab's bench.`],
  render(el, g) {
    const s = g.s;
    const now = `<p class="sub">Now: ${Math.floor(dropsPer(g))} ${TEXT.drops}/cycle · ${cycleTime(g).toFixed(1)}s · ${genRate(g).toFixed(1)}/s · value ×${valMult(g).toFixed(2)}. Duplicates sell for ${VAL.slice(0, 5).map(v => fmt(v * tierMult(g) * valMult(g))).join(' / ')}.</p>`;
    const tiers = UPT.map((t, ti) => {
      const open = upOpen(g, ti), got = upBought(g, ti), next = UPT[ti + 1], complete = open && got >= t.items.length, folded = complete && !unfolded.has(ti);
      const status = open ? `${got}/${t.items.length} bought${complete ? ' ✓' : next ? ` · ${Math.max(0, next.need - got)} more opens Tier ${ti + 2}` : ''}` : `buy ${Math.max(0, t.need - upBought(g, ti - 1))} more in Tier ${ti}`;
      const head = complete
        ? `<button class="uptier fold" data-act="fold" data-i="${ti}" aria-expanded="${!folded}"><h4>Tier ${ti + 1} · ${t.n}</h4><span class="lk on">${status} <i class="chev">${folded ? '▸' : '▾'}</i></span></button>`
        : `<div class="uptier"><h4>Tier ${ti + 1} · ${t.n}</h4><span class="lk ${open ? 'on' : ''}">${status}</span></div>`;
      if (!open || folded) return head;
      return head + t.items.map(u => {
        const cost = upCost(g, u), done = !!s.ups[u.id], lockedR = u.req && !s.res[u.req];
        if (done) return `<div class="r done"><div class="rn">${u.n} <span class="tag on">bought</span></div><div class="rd">${u.d}</div><div class="rc">✓</div></div>`;
        if (lockedR) return `<div class="r locked"><div class="rn">${u.n}</div><div class="rd">${u.d} · needs research: ${resName(u.req!)[0]}</div><div class="rc">🔒</div></div>`;
        return `<button class="r ${upCanBuy(g, u, ti) ? '' : 'poor'}" data-act="buy" data-k="${u.id}"><div class="rn">${u.n}</div><div class="rd">${u.d} · one time</div><div class="rc">${fmt(cost)}</div></button>`;
      }).join('');
    }).join('');
    el.innerHTML = now + tiers;
  },
  live(el, g) {
    el.querySelectorAll<HTMLElement>('.r[data-act="buy"]').forEach(r => { const ti = UPT.findIndex(t => t.items.some(u => u.id === r.dataset.k)); const u = UPT[ti]?.items.find(u => u.id === r.dataset.k); if (u) r.classList.toggle('poor', !upCanBuy(g, u, ti)); });
  },
  act: {
    buy: (b, g) => buy(g, b.dataset.k!),
    fold: b => { const i = +b.dataset.i!; if (unfolded.has(i)) unfolded.delete(i); else unfolded.add(i); return true; },
  },
};
