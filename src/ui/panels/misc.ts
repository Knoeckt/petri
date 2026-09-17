// Quests, Shop and Decor: short list panels.
import { SIDE, ARTS, ART, ART_MAX, ART_MERGE, TEXT, IAP } from '../../data';
import type { Ctx } from '../../sim';
import { sideRefill, sideProg, sideDone, doSide, tierMult, shopItems, shopCost, buyShop, artSpare, artDesc, artPerk, placeArt, unplaceArt, mergeArt, fmt, fmtDur, boostLen, iapOwned, toast } from '../../sim';
import type { PanelDef } from '../panel';
import { icon, iconFor } from '../icons';
import { faceCanvas, drawPortraits } from '../portraits';
import { play } from '../sound';

export const questsPanel: PanelDef = {
  id: 'quests',
  title: () => 'Side quests',
  render(el, g) {
    sideRefill(g);
    const rows = g.s.side.map((x, idx) => { const q = SIDE[x.k], have = sideProg(g, x), ok = have >= q.n; return `<div class="card req small"><div class="who">${faceCanvas(q.who, 'face small')}<div><b>${q.who}</b><div class="sub" style="margin:0">${q.verb} ${q.n} ${q.unit} · pays ${fmt(q.reward * tierMult(g))}</div></div></div><p class="say">“${q.say}”</p><div class="qprog"><div class="bar"><i style="width:${have / q.n * 100}%"></i></div><b>${have}/${q.n}</b></div><div class="acts" style="margin-top:8px"><button class="btn primary" data-act="side" data-i="${idx}" ${ok ? '' : 'disabled'}>${ok ? 'Collect ' + fmt(q.reward * tierMult(g)) : 'In progress'}</button></div></div>`; }).join('');
    el.innerHTML = `<p class="sub">Odd jobs from around town. They count things you do anyway: harvesting, stirring, ranking the bench, boxing up biters. Collect the pay when the bar fills and a fresh one turns up.</p>` + rows;
    drawPortraits(el, performance.now());
  },
  live(el) { drawPortraits(el, performance.now()); },
  act: { side: (b, g) => { const ok = doSide(g, +b.dataset.i!); if (ok) play('coin'); return ok; } },
};

export const shopPanel: PanelDef = {
  id: 'shop',
  title: () => 'Shop',
  render(el, g) {
    el.innerHTML = `<p class="sub">Paid in ${TEXT.cur.toLowerCase()}. Nothing here you can't also earn; more appears as the town opens up.</p>` +
      shopItems(g).map(it => { const c = shopCost(g, it.id); return `<div class="r" style="cursor:default"><div class="rn">${icon(iconFor(it.id), 20)} ${it.n}</div><div class="rd">${it.d.replace('{boost}', fmtDur(boostLen(g)))}</div><div class="rc">${fmt(c)}</div><div class="acts" style="grid-column:1 / span 2; margin-top:6px"><button class="btn primary" data-act="buy" data-id="${it.id}" ${g.s.cur >= c ? '' : 'disabled'}>Buy</button></div></div>`; }).join('') +
      `<h4 class="gh">Supporter's counter</h4><p class="sub">Real money. Stand-ins for now: the store sheet is a mock until the native build. Nothing here is needed to play.</p>` +
      IAP.map(p => { const owned = iapOwned(g, p.id); return `<div class="r ${owned ? 'done' : ''}" style="cursor:default"><div class="rn">${p.e} ${p.n}</div><div class="rd">${p.d}</div><div class="rc">${owned ? '✓' : p.price}</div><div class="acts" style="grid-column:1 / span 2; margin-top:6px"><button class="btn ${owned ? '' : 'primary'}" data-act="iap" data-id="${p.id}" ${owned ? 'disabled' : ''}>${owned ? 'Owned' : `Buy · ${p.price}`}</button></div></div>`; }).join('') +
      `<div class="acts" style="margin-top:8px"><button class="btn" data-act="restore">Restore purchases</button></div>`;
  },
  live(el, g) { el.querySelectorAll<HTMLButtonElement>('[data-act="buy"]').forEach(b => { b.disabled = g.s.cur < shopCost(g, b.dataset.id!); }); },
  act: {
    buy: (b, g) => { const ok = buyShop(g, b.dataset.id!); if (ok) play('coin'); return ok; },
    iap: (b, g, api) => { if (!iapOwned(g, b.dataset.id!)) api.buy?.(b.dataset.id!); return false; },
    restore: (_b, g) => { toast(g, 'Nothing to restore in the stand-in store. The native build asks the App Store.'); return false; },
  },
};

export const decorPanel: PanelDef = {
  id: 'decor',
  title: () => 'Decor',
  render(el, g) {
    const s = g.s;
    const slots = s.placed.map((p, k) => { const a = p && ART[p.id]; return a ? `<div class="slot full"><div class="e">${icon(a.id, 30)}</div><div class="nm">${a.n} <b class="alv">Lv ${p.lv}</b></div><div class="pd">${artDesc(a, p.lv)}</div><button class="btn" data-act="unplace" data-i="${k}">Remove</button></div>` : `<div class="slot"><div class="e" style="opacity:.35">＋</div><div class="pd">Slot ${k + 1}</div><div class="pd">empty</div></div>`; }).join('');
    const rows: string[] = [];
    ARTS.forEach(a => { const c = s.arts[a.id] || {}; Object.keys(c).map(Number).sort((x, y) => y - x).forEach(lv => { if (!c[lv]) return; const spare = artSpare(g, a.id, lv), canMerge = lv < ART_MAX && spare >= ART_MERGE;
      rows.push(`<div class="r" style="cursor:default"><div class="rn">${icon(a.id, 20)} ${a.n} <b class="alv">Lv ${lv}</b></div><div class="rd">${artDesc(a, lv)} · ×${c[lv]} owned, ${spare} spare${lv < ART_MAX ? ` · ${ART_MERGE} spare merge into Lv ${lv + 1} (${artDesc(a, lv + 1)})` : ' · max level'}</div><div class="acts" style="grid-column:1 / span 2; margin-top:6px"><button class="btn primary" data-act="place" data-id="${a.id}" data-lv="${lv}" ${spare > 0 && s.placed.includes(null) ? '' : 'disabled'}>Place</button>${lv < ART_MAX ? `<button class="btn" data-act="merge" data-id="${a.id}" data-lv="${lv}" ${canMerge ? '' : 'disabled'}>Merge ${Math.min(spare, ART_MERGE)}/${ART_MERGE}</button>` : ''}</div></div>`); }); });
    const tot = { lv: artPerk(g, 'lv'), speed: artPerk(g, 'speed'), value: artPerk(g, 'value'), income: artPerk(g, 'income'), drop: artPerk(g, 'drop') };
    el.innerHTML = `<p class="sub">Three things can sit on the shelf under the ${TEXT.dish}. Only placed artifacts count. Three spare copies of the same level merge into one a level higher.</p><div class="slots">${slots}</div><div class="card" style="margin-top:10px"><div class="kv"><span>From decor</span><span>+${tot.lv} lv · −${Math.round(tot.speed * 100)}% cycle · +${Math.round(tot.value * 100)}% value · +${Math.round(tot.income * 100)}% income · +${tot.drop} ${TEXT.drops}</span></div></div><h4 class="gh">Collection</h4>` +
      (rows.length ? rows.join('') : `<div class="card"><p class="sub" style="margin:0">No artifacts yet. Win them at the pipette or buy a mystery pebble in the Shop.</p></div>`);
  },
  act: {
    place: (b, g) => { const ok = placeArt(g, b.dataset.id!, +b.dataset.lv!); if (ok) play('tap'); return ok; },
    unplace: (b, g) => unplaceArt(g, +b.dataset.i!),
    merge: (b, g) => { const ok = mergeArt(g, b.dataset.id!, +b.dataset.lv!); if (ok) play('find'); return ok; },
  },
};
