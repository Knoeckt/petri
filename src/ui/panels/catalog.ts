// The Shelf: every strain of this tier, found or not, with how many sit on the shelf; portraits by the critter renderer; then hybrids.
import { RAR, COUNTS, BONUS, VAL, HYBRIDS, PER, TEXT } from '../../data';
import type { Ctx } from '../../sim';
import { tierDef, found, stock, shelfCap, seenBefore, weights, rarLv, valMult, tierMult, catMult, seedHyb, fmt } from '../../sim';
import type { PanelDef } from '../panel';
import { drawCritter } from '../critter';

export const catalogPanel: PanelDef = {
  id: 'cat',
  title: () => 'Shelf',
  render(el, g) {
    const s = g.s, t = s.tier, def = tierDef(t), c = s.cat[t] || {};
    const groups = RAR.map((R, r) => `<div class="rgroup"><h4>${R.n} · ${def.items[r].filter((_, i) => `${r}-${i}` in c).length}/${COUNTS[r]} · +${BONUS[r] * 100}% each</h4><div class="items">${def.items[r].map((it, i) => `${r}-${i}` in c // found, even with none on the shelf
      ? `<div class="it" data-r="${r}"><span class="band" style="background:${R.col}"></span>${it.danger ? `<span class="dg" title="Dangerous">⚠️</span>` : ''}<canvas class="pc" width="144" height="144" data-r="${r}" data-i="${i}"></canvas><div class="nm">${it.n}</div><div class="ds">${it.d}</div><small class="cnt${stock(g, r, i) ? '' : ' empty'}">${stock(g, r, i) ? `×${stock(g, r, i)} on the shelf` : 'none on the shelf'} · holds ${shelfCap(g)}</small></div>`
      : `<div class="it unk"><span class="band" style="background:${R.col}"></span><canvas class="pc" width="144" height="144" data-r="${r}" data-i="${i}" data-sil="1"></canvas><div class="nm">${seenBefore(g, t, `${r}-${i}`) ? it.n : '???'}</div><div class="ds">${seenBefore(g, t, `${r}-${i}`) ? 'Seen in an earlier life. Finding it again pays.' : it.danger ? 'Something with teeth.' : 'Not found yet.'}</div><small>${(weights(rarLv(g))[r] / COUNTS[r]).toFixed(1)}% per ${TEXT.drop}</small></div>`).join('')}</div></div>`).join('');
    const earlier = Object.keys(s.cat).filter(k => +k < t).map(k => `${tierDef(+k).n} ${found(g, +k)}/${PER}`).join(' · ');
    const hyb = `<div class="rgroup"><h4>Hybrids · ${HYBRIDS.filter(h => s.hyb[h.id]).length}/${HYBRIDS.length} · spliced, never rolled</h4><div class="items">${HYBRIDS.map(h => s.hyb[h.id]
      ? `<button class="it" data-act="seed" data-id="${h.id}"><span class="band" style="background:#37d3a8"></span>${s.seed === h.id ? '<span class="dg" title="Seeded">🌱</span>' : ''}<canvas class="pc" width="144" height="144" data-h="${h.id}"></canvas><div class="nm">${h.n}</div><div class="ds">${h.d}</div><small>×${s.hyb[h.id]} · ${h.pd} · tap to ${s.seed === h.id ? 'unseed' : 'seed'}</small></button>`
      : `<div class="it unk"><span class="band" style="background:#37d3a8"></span><canvas class="pc" width="144" height="144" data-h="${h.id}" data-sil="1"></canvas><div class="nm">???</div><div class="ds">${h.par.map(([r, i]) => def.items[r]?.[i]?.n ?? '?').join(' + ')}</div></div>`).join('')}</div></div>`;
    el.innerHTML = `<p class="sub">${def.n} · ${found(g, t)}/${PER} found · catalog bonus +${Math.round((catMult(g) - 1) * 100)}% income, kept forever. Everything you find goes on the shelf and can be used at once; it holds ${shelfCap(g)} of each strain and the rest sells.${earlier ? ' Earlier: ' + earlier : ''}</p>` + groups + hyb;
    drawPortraits(el, g, performance.now());
  },
  live(el, g) { drawPortraits(el, g, performance.now()); },
  act: { seed: (b, g) => seedHyb(g, b.dataset.id!) },
};

let lastPortraits = 0;
function drawPortraits(el: HTMLElement, g: Ctx, now: number) {
  if (now - lastPortraits < 125) return; lastPortraits = now;
  const def = tierDef(g.s.tier);
  el.querySelectorAll<HTMLCanvasElement>('canvas.pc').forEach(cv => {
    const c = cv.getContext('2d')!; c.clearRect(0, 0, 144, 144);
    const sil = !!cv.dataset.sil;
    if (cv.dataset.h) { const h = HYBRIDS.find(x => x.id === cv.dataset.h)!; drawCritter(c, 72, 78, 30, h.look, now, { seed: 3, sil }); return; }
    const r = +cv.dataset.r!, i = +cv.dataset.i!; const it = def.items[r][i];
    drawCritter(c, 72, 78, 30, it.look, now, { seed: r * 7 + i, sil, danger: sil ? 0 : it.danger });
  });
}
