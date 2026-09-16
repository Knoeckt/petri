// The Apothecary and the Splice-o-matic: a scene canvas each, with the controls under it.
import { HYBRIDS, HYB, RAR, TEXT, SPLICE_COST, COUNTS } from '../../data';
import type { Ctx, Pair } from '../../sim';
import { medsRelevant, med, medHave, batchesAffordable, batchSize, brewTime, brewMed, item, stock, tierMult, spReady, spWhy, pickTube, splice, collectOut, seedHyb, fmt, fmtDur } from '../../sim';
import type { PanelDef } from '../panel';
import { adLabel } from '../sheet';
import { BrewScene, SpliceScene } from '../scenes';
import { play } from '../sound';

let brew: BrewScene | null = null, spl: SpliceScene | null = null, pickSlot: 0 | 1 | null = null;
const brewScene = (g: Ctx) => brew || (brew = new BrewScene(g));
export const spliceScene = (g: Ctx) => spl || (spl = new SpliceScene(g));

export const brewPanel: PanelDef = {
  id: 'brew',
  title: () => 'Apothecary',
  full: true,
  render(el, g) {
    const s = g.s, b = s.brew, sc = brewScene(g); const list = medsRelevant(g);
    if (!sc.sel && list.length) sc.sel = list[0].id; if (sc.sel && !list.find(m => m.id === sc.sel)) sc.sel = list[0]?.id || null;
    const m = sc.sel ? med(g, sc.sel) : undefined;
    const controls = b
      ? `<div class="card"><h3>Brewing ${b.n} × ${b.id}</h3><p class="sub" style="margin:0 0 6px">Ready in <b data-live="left">${fmtDur(b.left)}</b>. Tap the fire to hurry it a touch.</p><div class="prog"><b data-live="prog" style="width:${(1 - b.left / b.total) * 100}%"></b></div><div class="acts" style="margin-top:8px"><button class="btn ad" data-act="ad" data-live="ad">${adLabel(g, 'Finish now')}</button></div></div>`
      : m ? (() => { const n = batchesAffordable(g, m), have = medHave(g, m.id);
          const ing = m.need.map(([r, i, q]) => `<span class="chip ${stock(g, r, i) >= q ? 'ok' : ''}"><i style="background:${RAR[r].col}"></i>${q} ${item(s.tier, r, i).n} (${stock(g, r, i)})</span>`).join('');
          return `<div class="card"><h3>${m.n}${have ? ` <span class="tag on">×${have} on the shelf</span>` : ''}</h3><p class="sub" style="margin:0 0 4px">Recipe, per bottle. Batch size ${batchSize(g)}.</p><div class="needs">${ing}</div><p class="sub" style="margin:6px 0 0">${n ? `Can brew ${n} · ${fmtDur(brewTime(g, m, n))}` : 'Not enough spares on the shelf'}</p><div class="acts" style="margin-top:8px"><button class="btn primary" data-act="brew" data-id="${m.id}" ${n >= 1 ? '' : 'disabled'}>Brew ${n || ''}</button></div></div>`; })()
      : `<div class="card paper"><h3>The copper kettle</h3><p class="sub" style="margin:0">Nothing on the rack yet. The Clinic's requests put medicines here.</p></div>`;
    el.innerHTML = `<div class="scenewrap" data-scene="brew"></div>` + controls;
    el.querySelector('.scenewrap')!.appendChild(sc.canvas);
  },
  frame(_el, g, now) { brewScene(g).draw(now); },
  live(el, g) { const b = g.s.brew; if (b) { const l = el.querySelector('[data-live="left"]'); if (l && l.textContent !== fmtDur(b.left)) l.textContent = fmtDur(b.left); const p = el.querySelector<HTMLElement>('[data-live="prog"]'); if (p) p.style.width = ((1 - b.left / b.total) * 100) + '%'; const a = el.querySelector<HTMLButtonElement>('[data-live="ad"]'); if (a) { const t = adLabel(g, 'Finish now'); if (a.innerHTML !== t) a.innerHTML = t; } } },
  scene(g, x, y) {
    const sc = brewScene(g), h = sc.hit(x, y); if (!h) return false;
    if (h.kind === 'rack') { sc.sel = h.id; play('tap'); return true; }
    if (g.s.brew) { g.s.brew.left = Math.max(0, g.s.brew.left - 0.4); sc.stoke(performance.now()); play('tap'); }
    return false;
  },
  act: {
    brew: (b, g) => { const ok = brewMed(g, b.dataset.id!); if (ok) play('level'); return ok; },
    ad: (_b, _g, api) => { api.ad?.('finish brew'); return false; },
  },
};

export const splicerPanel: PanelDef = {
  id: 'splicer',
  title: () => 'Splice-o-matic',
  full: true,
  render(el, g) {
    const s = g.s, sp = s.splice, sc = spliceScene(g);
    const c = s.cat[0] || {}; const opts: Pair[] = []; COUNTS.forEach((n, r) => { for (let i = 0; i < n; i++) if (c[`${r}-${i}`]) opts.push([r, i]); });
    const status = sp
      ? `<div class="card"><h3>Splicing…</h3><p class="sub" style="margin:0 0 6px">${item(0, sp.a[0], sp.a[1]).n} + ${item(0, sp.b[0], sp.b[1]).n} · <b data-live="left">${fmtDur(sp.left)}</b></p><div class="prog"><b data-live="prog" style="width:${(1 - sp.left / sp.total) * 100}%"></b></div><div class="acts" style="margin-top:8px"><button class="btn ad" data-act="ad" data-live="ad">${adLabel(g, 'Finish now')}</button></div></div>`
      : s.spOut ? `<div class="card gen"><h3>Something formed</h3><p class="sub" style="margin:0">${HYB[s.spOut.id].n}: ${HYB[s.spOut.id].d}. Tap the chamber to collect it.</p></div>`
      : pickSlot !== null ? `<div class="card"><h3>Tube ${pickSlot ? 'B' : 'A'}</h3><p class="sub" style="margin:0 0 6px">One specimen goes in. Two that fit make a hybrid; two that do not come back out, minus a little ${TEXT.cur.toLowerCase()}.</p><div class="needs">${opts.map(([r, i]) => `<button class="chip ${s.sp[pickSlot!] && s.sp[pickSlot!]![0] === r && s.sp[pickSlot!]![1] === i ? 'ok' : ''}" data-act="pick" data-r="${r}" data-i="${i}" ${stock(g, r, i, 0) < 1 ? 'disabled' : ''}><i style="background:${RAR[r].col}"></i>${item(0, r, i).n} · ${stock(g, r, i, 0)}</button>`).join('') || '<span class="sub">Nothing found yet.</span>'}</div><div class="acts" style="margin-top:8px"><button class="btn" data-act="empty">Empty the tube</button></div></div>`
      : `<div class="card paper"><p class="sub" style="margin:0"><b>${spWhy(g)}</b> Costs ${fmt(SPLICE_COST * tierMult(g))} ${TEXT.cur.toLowerCase()} a pull. Tap a jar to seed that hybrid in the ${TEXT.dish}.</p></div>`;
    const known = HYBRIDS.map(h => `<div class="kv"><span>${h.n}${s.hyb[h.id] ? ' ×' + s.hyb[h.id] : ''}</span><span>${s.hyb[h.id] ? h.pd + (s.seed === h.id ? ' · seeded' : '') : '? + ?'}</span></div>`).join('');
    el.innerHTML = `<div class="scenewrap" data-scene="splicer"></div>` + status + `<h4 class="gh">Hybrids</h4><div class="card">${known}</div>`;
    el.querySelector('.scenewrap')!.appendChild(sc.canvas);
  },
  frame(_el, g, now) { spliceScene(g).draw(now); },
  live(el, g) { const sp = g.s.splice; if (sp) { const l = el.querySelector('[data-live="left"]'); if (l && l.textContent !== fmtDur(sp.left)) l.textContent = fmtDur(sp.left); const p = el.querySelector<HTMLElement>('[data-live="prog"]'); if (p) p.style.width = ((1 - sp.left / sp.total) * 100) + '%'; const a = el.querySelector<HTMLButtonElement>('[data-live="ad"]'); if (a) { const t = adLabel(g, 'Finish now'); if (a.innerHTML !== t) a.innerHTML = t; } } },
  scene(g, x, y) {
    const s = g.s, sc = spliceScene(g), h = sc.hit(x, y); if (!h) return false;
    if (!s.hasSplicer) { g.emit({ type: 'toast', msg: 'Doc Ferro still has the splicer. Help the Clinic.' }); return false; }
    if (h === 'tubeA' || h === 'tubeB') { if (s.splice || s.spOut) return false; pickSlot = h === 'tubeA' ? 0 : 1; play('tap'); return true; }
    if (h === 'lever') { if (spReady(g)) { sc.leverT = performance.now(); if (splice(g)) { play('level'); pickSlot = null; } } else g.emit({ type: 'toast', msg: spWhy(g) }); return true; }
    if (h === 'chamber') { if (collectOut(g)) { play('find'); return true; } return false; }
    const owned = HYBRIDS.filter(x => s.hyb[x.id]); const j = owned[h.jar]; if (j) { seedHyb(g, j.id); play('tap'); return true; }
    return false;
  },
  act: {
    pick: (b, g) => { if (pickSlot === null) return false; const cur = g.s.sp[pickSlot]; const p: Pair = [+b.dataset.r!, +b.dataset.i!]; const ok = pickTube(g, pickSlot, cur && cur[0] === p[0] && cur[1] === p[1] ? null : p); if (ok) play('tap'); return ok; },
    empty: (_b, g) => { if (pickSlot === null) return false; pickTube(g, pickSlot, null); pickSlot = null; return true; },
    ad: (_b, _g, api) => { api.ad?.('finish splice'); return false; },
  },
};
