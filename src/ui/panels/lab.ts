// The Lab: two tabs. The bench (equipment ranked with Notes) is open from the start; research and specimen studies open at 1-3.
import { RES_DEF, RAR, TEXT, EQUIP } from '../../data';
import type { Ctx } from '../../sim';
import { resVisible, resDone, resCost, resTime, resLv, resName, startResearch, startStudy, studyCost, studyPerk, perkText, studyKey, guardChance, shelfCap, tierDef, stock, unlocked, unlockLabel, unlockHint, fmt, fmtDur, STUDY_TIME, eqLv, eqCost, eqCanBuy, eqMaxed, buyEquip, effLv, rarLv, rarCap, weights, sitesOpen, tutSeen, toast } from '../../sim';
import type { PanelDef } from '../panel';
import { adLabel } from '../sheet';

export function rbar(w: number[]) { return `<div class="rbar">${w.map((v, r) => `<i style="width:${v}%;background:${RAR[r].col}"></i>`).join('')}</div>`; }
export function rleg(w: number[]) { return `<div class="rleg">${w.map((v, r) => v >= .5 ? `<span><i style="background:${RAR[r].col}"></i>${RAR[r].n} ${v < 10 ? v.toFixed(1) : Math.round(v)}%</span>` : '').join('')}</div>`; }

/** the bench: equipment ranked with Notes from field trips */
function benchHtml(g: Ctx) {
  const s = g.s, capped = effLv(g) >= rarCap(g);
  const rows = EQUIP.map(e => {
    const lv = eqLv(g, e.id), max = eqMaxed(g, e.id), c = eqCost(g, e.id), can = eqCanBuy(g, e.id);
    if (max) return `<div class="r done"><div class="rn">${e.n} <span class="tag on">${lv}/${e.max}</span></div><div class="rd">${e.d}</div><div class="rc">✓</div></div>`;
    return `<button class="r ${can ? '' : 'poor'}" data-act="eq" data-k="${e.id}"><div class="rn">${e.n} <span class="tag on">${lv}/${e.max}</span></div><div class="rd">${e.d}</div><div class="rc">${c.notes || c.bio ? `<b>${c.notes}</b> notes<small>+ ${fmt(c.bio)} ${TEXT.cur.toLowerCase()}</small>` : `<b>Free</b><small>the first rank</small>`}</div></button>`;
  }).join('');
  const trips = sitesOpen(g);
  const tripNote = trips.length && !s.trip && s.notes < eqCost(g, 'dish').notes ? `<p class="sub">Short on notes? Send a trip to ${trips[trips.length - 1].n.toLowerCase()} from the board.</p>` : '';
  return `<div class="uptier" style="margin-top:0"><h4>The bench</h4><span class="lk on">${s.notes} notes${s.trip ? ' · trip out' : ''}</span></div>` +
    `<p class="sub" style="margin-top:0">Ranked with Notes from field trips${unlocked(g, 'field') ? '' : ' (the Mayor has a map for you)'}. Effective level ${effLv(g)}${capped ? `, the ${TEXT.dish}'s reach here is ${rarCap(g)}; ${TEXT.ascend.toLowerCase()} to go further` : ''}. Ranks stay through ${TEXT.ascend.toLowerCase()}.</p>` +
    `<div class="card" style="padding:8px 12px 10px">${rbar(weights(rarLv(g)))}${rleg(weights(rarLv(g)))}</div>` + rows + tripNote;
}

/** which tab is showing; research is the default once it has opened and been seen */
let sub: 'bench' | 'research' = 'bench';

export const labPanel: PanelDef = {
  id: 'lab',
  title: () => 'Lab',
  gate: null,
  keepScroll: true,
  intro: ['The Lab', `Two benches. <b>The bench</b> ranks your equipment with Notes from field trips; the ${TEXT.dish} rank decides which strains can show up at all, and the first rank is free. <b>Research</b> opens when Doc Ferro lends you his: it costs ${TEXT.cur.toLowerCase()} and time, one at a time, and brings things like auto-harvest. Studies put a specimen under the microscope for a permanent perk.`],
  render(el, g) {
    const s = g.s, resOpen = unlocked(g, 'lab');
    if (!resOpen) sub = 'bench';
    if (sub === 'research') tutSeen(g, 'research');
    const subtabs = `<div class="subtabs"><button data-act="sub" data-sub="bench" aria-selected="${sub === 'bench'}">Bench</button><button data-act="sub" data-sub="research" aria-selected="${sub === 'research'}" class="${resOpen ? '' : 'locked'}">Research${resOpen ? '' : ' 🔒 ' + unlockLabel('lab')}</button></div>`;
    const hidden = RES_DEF.filter(r => r.gate && !unlocked(g, r.gate) && s.tier >= (r.tier || 0)).length;
    const nextT = s.tier + 1, nextN = RES_DEF.filter(r => r.tier === nextT).length;
    const research = RES_DEF.filter(r => resVisible(g, r)).map(r => {
      const [n, d] = resName(r.id); const done = resDone(g, r); const act = s.active && s.active.id === r.id; const locked = r.req && !s.res[r.req];
      const lv = r.max ? ` <span class="tag on">${resLv(g, r.id)}/${r.max}${r.id === 'wash' ? ' · ' + Math.round(guardChance(g) * 100) + '%' : r.id === 'fridge' ? ' · shelf ' + shelfCap(g) : ''}</span>` : '';
      if (done) return `<div class="r done"><div class="rn">${n}${lv} <span class="tag on">done</span></div><div class="rd">${d}</div><div class="rc">✓</div></div>`;
      if (act) return `<div class="r active"><div class="rn">${n} <span class="tag">researching</span></div><div class="rd">${d}</div><div class="rc" data-live="left">${fmtDur(s.active!.left)}</div><div class="prog"><b data-live="prog" style="width:${(1 - s.active!.left / s.active!.total) * 100}%"></b></div><div class="acts"><button class="btn ad" data-act="ad" data-live="ad">${adLabel(g, 'Finish now')}</button></div></div>`;
      if (locked) return `<div class="r locked"><div class="rn">${n}</div><div class="rd">Needs ${resName(r.req!)[0]}</div><div class="rc">🔒</div></div>`;
      const can = !s.active && s.cur >= resCost(g, r);
      return `<button class="r ${can ? '' : 'poor'}" data-act="research" data-id="${r.id}"><div class="rn">${n}${lv}</div><div class="rd">${d} · ${fmtDur(resTime(g, r))}${s.active ? ' · bench busy' : ''}</div><div class="rc">${fmt(resCost(g, r))}</div></button>`;
    }).join('');
    // studies
    const t = s.tier, c = s.cat[t] || {}, def = tierDef(t); const rows: string[] = []; let done = 0, total = 0;
    RAR.forEach((R, r) => def.items[r].forEach((it, i) => {
      const key = studyKey(t, r, i); if (!(`${r}-${i}` in c)) return; total++; // found strains stay listed at zero on the shelf
      const isDone = s.studies[key]; if (isDone) done++;
      const act = s.active && s.active.id === 'study' && s.active.key === key; const pt = perkText(studyPerk(t, r, i)); const cost = studyCost(g, t, r), sp = stock(g, r, i, t);
      if (isDone) rows.push(`<div class="r done"><div class="rn"><i class="sw" style="background:${R.col}"></i>${it.n} <span class="tag on">studied</span></div><div class="rd">${pt}</div><div class="rc">✓</div></div>`);
      else if (act) rows.push(`<div class="r active"><div class="rn"><i class="sw" style="background:${R.col}"></i>${it.n} <span class="tag">studying</span></div><div class="rd">${pt}</div><div class="rc" data-live="left">${fmtDur(s.active!.left)}</div><div class="prog"><b data-live="prog" style="width:${(1 - s.active!.left / s.active!.total) * 100}%"></b></div><div class="acts"><button class="btn ad" data-act="ad" data-live="ad">${adLabel(g, 'Finish now')}</button></div></div>`);
      else { const can = !s.active && sp >= 1 && s.cur >= cost; rows.push(`<button class="r ${can ? '' : 'poor'}" data-act="study" data-key="${key}"><div class="rn"><i class="sw" style="background:${R.col}"></i>${it.n}${it.danger ? ' ⚠️' : ''}</div><div class="rd">${pt} · ${fmtDur(STUDY_TIME[r])} · uses 1 spare (have ${sp})${s.active ? ' · bench busy' : ''}</div><div class="rc">${fmt(cost)}</div></button>`); }
    }));
    const researchHtml = `<h4 class="gh" style="margin-top:0">Research</h4><p class="sub">One at a time. Research survives ${TEXT.ascend.toLowerCase()} and resets at Genesis. Every timer can be finished with an ad.${hidden ? ` ${hidden} more open with the Apothecary.` : ''}${nextN ? ` ${nextN} more open at the ${tierDef(nextT).n}.` : ''}</p>` + research +
      `<h4 class="gh">Specimen studies · ${done}/${total}</h4><p class="sub">Put a specimen from the Shelf under the microscope for a permanent perk. Rarer strains teach more; biters teach quarantine.</p>` + (rows.length ? rows.join('') : `<div class="card"><p class="sub" style="margin:0">Find something in the ${TEXT.dish} first.</p></div>`);
    el.innerHTML = subtabs + (sub === 'bench' ? benchHtml(g) : researchHtml);
  },
  live(el, g) {
    el.querySelectorAll<HTMLElement>('.r[data-act="eq"]').forEach(r => r.classList.toggle('poor', !eqCanBuy(g, r.dataset.k!)));
    const a = g.s.active;
    if (a) { const l = el.querySelector('[data-live="left"]'); if (l && l.textContent !== fmtDur(a.left)) l.textContent = fmtDur(a.left); const p = el.querySelector<HTMLElement>('[data-live="prog"]'); if (p) p.style.width = ((1 - a.left / a.total) * 100) + '%'; const b = el.querySelector<HTMLButtonElement>('[data-live="ad"]'); if (b) { const t = adLabel(g, 'Finish now'); if (b.innerHTML !== t) b.innerHTML = t; } }
    el.querySelectorAll<HTMLElement>('.r[data-id]').forEach(r => { const def = RES_DEF.find(x => x.id === r.dataset.id); if (def) r.classList.toggle('poor', !!g.s.active || g.s.cur < resCost(g, def)); });
    el.querySelectorAll<HTMLElement>('.r[data-key]').forEach(r => { const [t, ri] = r.dataset.key!.split(':'); const [rr, ii] = ri.split('-').map(Number); r.classList.toggle('poor', !!g.s.active || stock(g, rr, ii, +t) < 1 || g.s.cur < studyCost(g, +t, rr)); });
  },
  act: {
    sub: (b, g) => { const k = b.dataset.sub as typeof sub; if (k === 'research' && !unlocked(g, 'lab')) { toast(g, `🔒 Research opens after ${unlockLabel('lab')}. ${unlockHint('lab')}`); return false; } sub = k; return true; },
    eq: (b, g) => buyEquip(g, b.dataset.k!),
    research: (b, g) => startResearch(g, b.dataset.id!),
    study: (b, g) => startStudy(g, b.dataset.key!),
    ad: (_b, g, api) => { api.ad?.('finish research'); return false; },
  },
};
