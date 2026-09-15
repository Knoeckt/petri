// The Apothecary and the Splice-o-matic as list panels. Their canvas scenes return with the art pass.
import { HYBRIDS, HYB, RAR, TEXT, SPLICE_COST, COUNTS } from '../../data';
import type { Ctx, Pair } from '../../sim';
import { medsRelevant, medHave, batchesAffordable, batchSize, brewTime, brewMed, item, stock, tierMult, spReady, spWhy, pickTube, splice, collectOut, seedHyb, fmt, fmtDur } from '../../sim';
import type { PanelDef } from '../panel';
import { adLabel } from '../sheet';

export const brewPanel: PanelDef = {
  id: 'brew',
  title: () => 'Apothecary',
  render(el, g) {
    const s = g.s, b = s.brew;
    const status = b
      ? `<div class="card"><h3>Brewing ${b.n} × ${b.id}</h3><p class="sub" style="margin:0 0 6px">Ready in <b data-live="left">${fmtDur(b.left)}</b>.</p><div class="prog"><b data-live="prog" style="width:${(1 - b.left / b.total) * 100}%"></b></div><div class="acts" style="margin-top:8px"><button class="btn ad" data-act="ad" data-live="ad">${adLabel(g, 'Finish now')}</button></div></div>`
      : `<div class="card paper"><h3>The copper kettle</h3><p class="sub" style="margin:0">Spare samples go in, medicine comes out. Batch size ${batchSize(g)}${batchSize(g) < 6 ? ' (research bigger cauldrons in the Lab)' : ''}. One brew at a time.</p></div>`;
    const list = medsRelevant(g);
    const rows = list.map(m => { const n = batchesAffordable(g, m), have = medHave(g, m.id);
      const ing = m.need.map(([r, i, q]) => `<span class="chip ${stock(g, r, i) >= q ? 'ok' : ''}"><i style="background:${RAR[r].col}"></i>${q} ${item(s.tier, r, i).n} (${stock(g, r, i)})</span>`).join('');
      return `<div class="r" style="cursor:default"><div class="rn">${m.n} ${have ? `<span class="tag on">×${have} on the shelf</span>` : ''}</div><div class="rd"><div class="needs" style="margin:4px 0">${ing}</div>${n ? `Can brew ${n} · ${fmtDur(brewTime(g, m, n))}` : 'Not enough spares'}</div><div class="rc"></div><div class="acts" style="grid-column:1 / span 2; margin-top:6px"><button class="btn primary" data-act="brew" data-id="${m.id}" ${n >= 1 && !b ? '' : 'disabled'}>Brew ${n || ''}</button></div></div>`; }).join('');
    el.innerHTML = status + `<h4 class="gh">The rack</h4>` + (rows || `<div class="card"><p class="sub" style="margin:0">Nothing on the rack yet. The Clinic's requests put medicines here.</p></div>`);
  },
  live(el, g) { const b = g.s.brew; if (b) { const l = el.querySelector('[data-live="left"]'); if (l && l.textContent !== fmtDur(b.left)) l.textContent = fmtDur(b.left); const p = el.querySelector<HTMLElement>('[data-live="prog"]'); if (p) p.style.width = ((1 - b.left / b.total) * 100) + '%'; const a = el.querySelector<HTMLButtonElement>('[data-live="ad"]'); if (a) { const t = adLabel(g, 'Finish now'); if (a.textContent !== t) a.textContent = t; } } },
  act: {
    brew: (b, g) => brewMed(g, b.dataset.id!),
    ad: (_b, _g, api) => { api.ad?.('finish brew'); return false; },
  },
};

const pairName = (g: Ctx, p: Pair | null) => p ? item(0, p[0], p[1]).n : 'empty';

export const splicerPanel: PanelDef = {
  id: 'splicer',
  title: () => 'Splice-o-matic',
  render(el, g) {
    const s = g.s, sp = s.splice;
    const status = sp
      ? `<div class="card"><h3>Splicing…</h3><p class="sub" style="margin:0 0 6px">${item(0, sp.a[0], sp.a[1]).n} + ${item(0, sp.b[0], sp.b[1]).n} · <b data-live="left">${fmtDur(sp.left)}</b></p><div class="prog"><b data-live="prog" style="width:${(1 - sp.left / sp.total) * 100}%"></b></div><div class="acts" style="margin-top:8px"><button class="btn ad" data-act="ad" data-live="ad">${adLabel(g, 'Finish now')}</button></div></div>`
      : s.spOut ? `<div class="card gen"><h3>Something formed</h3><p class="sub" style="margin:0 0 6px">${HYB[s.spOut.id].n}: ${HYB[s.spOut.id].d}</p><div class="acts"><button class="btn primary" data-act="collect">Collect it</button></div></div>`
      : `<div class="card paper"><h3>Doc Ferro's splicer</h3><p class="sub" style="margin:0">Two spare tier-1 strains go in; five pairs react. Costs ${fmt(SPLICE_COST * tierMult(g))} ${TEXT.cur.toLowerCase()}. A miss gives the strains back and half the money.</p></div>`;
    const c = s.cat[0] || {}; const opts: Pair[] = []; COUNTS.forEach((n, r) => { for (let i = 0; i < n; i++) if (c[`${r}-${i}`]) opts.push([r, i]); });
    const tube = (slot: 0 | 1) => `<div class="card"><h3>Tube ${slot ? 'B' : 'A'} · ${pairName(g, s.sp[slot])}</h3><div class="needs">${opts.map(([r, i]) => `<button class="chip ${s.sp[slot] && s.sp[slot]![0] === r && s.sp[slot]![1] === i ? 'ok' : ''}" data-act="pick" data-slot="${slot}" data-r="${r}" data-i="${i}" ${stock(g, r, i, 0) < 1 || sp || s.spOut ? 'disabled' : ''}><i style="background:${RAR[r].col}"></i>${item(0, r, i).n} · ${stock(g, r, i, 0)}</button>`).join('') || '<span class="sub">Nothing found yet.</span>'}</div></div>`;
    const known = HYBRIDS.map(h => `<div class="kv"><span>${h.n}${s.hyb[h.id] ? ' ×' + s.hyb[h.id] : ''}</span><span>${s.hyb[h.id] ? h.pd + (s.seed === h.id ? ' · seeded' : '') : '? + ?'}</span></div>`).join('');
    el.innerHTML = status + (sp || s.spOut ? '' : tube(0) + tube(1) + `<div class="acts" style="margin:4px 0 10px"><button class="btn primary" data-act="splice" ${spReady(g) ? '' : 'disabled'}>${spReady(g) ? 'Pull the lever' : spWhy(g)}</button></div>`) +
      `<h4 class="gh">Hybrids</h4><div class="card">${known}</div>` + (Object.keys(s.hyb).length ? `<div class="acts">${HYBRIDS.filter(h => s.hyb[h.id]).map(h => `<button class="btn ${s.seed === h.id ? 'primary' : ''}" data-act="seed" data-id="${h.id}">${s.seed === h.id ? 'Unseed' : 'Seed'} ${h.n}</button>`).join('')}</div>` : '');
  },
  live(el, g) { const sp = g.s.splice; if (sp) { const l = el.querySelector('[data-live="left"]'); if (l && l.textContent !== fmtDur(sp.left)) l.textContent = fmtDur(sp.left); const p = el.querySelector<HTMLElement>('[data-live="prog"]'); if (p) p.style.width = ((1 - sp.left / sp.total) * 100) + '%'; const a = el.querySelector<HTMLButtonElement>('[data-live="ad"]'); if (a) { const t = adLabel(g, 'Finish now'); if (a.textContent !== t) a.textContent = t; } } },
  act: {
    pick: (b, g) => { const slot = +b.dataset.slot! as 0 | 1; const cur = g.s.sp[slot]; const p: Pair = [+b.dataset.r!, +b.dataset.i!]; return pickTube(g, slot, cur && cur[0] === p[0] && cur[1] === p[1] ? null : p); },
    splice: (_b, g) => splice(g),
    collect: (_b, g) => collectOut(g),
    seed: (b, g) => seedHyb(g, b.dataset.id!),
    ad: (_b, _g, api) => { api.ad?.('finish splice'); return false; },
  },
};
