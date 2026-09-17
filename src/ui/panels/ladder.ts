// Scale up and Genesis: the ladder, the reset, and the Genome perks.
import { STORY, GEN_DEF, GEN_TIER, TIER_MULT, TIER_CYCLE, ASC_LV, ASC_FOUND, PER, TEXT, HYB, ART } from '../../data';
import type { Ctx } from '../../sim';
import { tierDef, TIER_COUNT, found, effLv, canAscend, ascend, canGenesis, genesis, genPoints, genLv, genCost, buyGen, story } from '../../sim';
import type { PanelDef } from '../panel';

let armed = false, armT = 0;

export const ladderPanel: PanelDef = {
  id: 'asc',
  title: () => TEXT.ascend,
  intro: ['Scaling up', `When the chapter is done, the ${TEXT.dish.toLowerCase()} is replaced by something bigger: everything pays more and a new catalog opens. Upgrades and ${TEXT.cur.toLowerCase()} reset; the bench, research and studies stay.`],
  render(el, g) {
    const s = g.s, last = s.tier >= TIER_COUNT - 1, next = last ? null : tierDef(s.tier + 1), ok = !last && canAscend(g);
    const ladder = Array.from({ length: TIER_COUNT }, (_, i) => `<div class="${i === s.tier ? 'cur' : i < s.tier ? 'done' : ''}">${i + 1}. ${tierDef(i).n}${i < s.tier ? ' · ' + found(g, i) + '/' + PER : ''}</div>`).join('');
    const st = story(g);
    const up = next ? `<div class="card"><h3>${TEXT.ascend}: ${next.n}</h3><p class="sub" style="margin:0 0 6px">Everything ×${TIER_MULT}. Cycle ×${TIER_CYCLE}. A new catalog of ${PER}. Upgrades and ${TEXT.cur.toLowerCase()} reset; catalog, bench, research and studies stay.</p>
      ${STORY[s.tier] ? `<div class="kv"><span>Chapter ${s.tier + 1} complete</span><span class="${st.done ? 'good' : 'warn'}">${st.done ? 'yes' : st.step + ' / ' + STORY[s.tier].steps.length + ' requests'}</span></div>` : `<div class="kv"><span>Effective level ${ASC_LV}</span><span class="${effLv(g) >= ASC_LV ? 'good' : 'warn'}">${effLv(g)} / ${ASC_LV}</span></div>`}
      <div class="kv"><span>Catalog ${ASC_FOUND} of ${PER}</span><span class="${found(g, s.tier) >= ASC_FOUND ? 'good' : 'warn'}">${found(g, s.tier)} / ${ASC_FOUND}</span></div>
      <div class="acts" style="margin-top:10px"><button class="btn primary" data-act="ascend" ${ok ? '' : 'disabled'}>${TEXT.ascend} to ${next.n}</button></div></div>`
      : `<div class="card"><h3>The top of the ladder</h3><p class="sub" style="margin:0">${tierDef(s.tier).n} is as big as it gets. The only way up is back to the start.</p></div>`;
    const gen = s.gen; const canG = canGenesis(g);
    const gate = !canG ? `Finish the ${tierDef(GEN_TIER).n} chapter first.` : '';
    const genCard = (s.tier >= GEN_TIER || gen.runs) ? `<div class="card gen"><h3>🌱 Genesis${gen.runs ? ` · run ${gen.runs + 1}` : ''}</h3><p class="sub" style="margin:0 0 6px">The ${tierDef(TIER_COUNT - 1).n.toLowerCase()} collapses to a single cell and Mossbrook starts again. Everything resets: tier, bench, ${TEXT.cur.toLowerCase()}, upgrades, research, studies, catalog, stock, medicines, story.</p>
      <div class="kv"><span>You keep</span><span>the seeded hybrid${s.seed ? ' (' + HYB[s.seed].n + ')' : ''}, the artifact in Decor slot 1${s.placed[0] && ART[s.placed[0].id] ? ' (' + ART[s.placed[0].id].n + ' Lv ' + s.placed[0].lv + ')' : ''}, your tickets, and the catalog as memory</span></div>
      <div class="kv"><span>Genome this run</span><span class="good">+${genPoints(g)}</span></div>
      ${gate ? `<p class="sub" style="margin:6px 0 0">${gate}</p>` : ''}
      <div class="acts" style="margin-top:10px"><button class="btn ${armed ? 'primary' : ''}" data-act="genesis" ${canG ? '' : 'disabled'}>${armed ? 'Tap again to begin Genesis' : 'Begin Genesis'}</button></div></div>` : '';
    const perks = (gen.runs || gen.pts) ? `<h4 class="gh">Genome · ${gen.pts} to spend</h4><p class="sub">Permanent. Survives every Genesis.</p>` + GEN_DEF.map(d => { const lv = genLv(g, d.id), maxed = lv >= d.max, cost = genCost(g, d), can = !maxed && gen.pts >= cost; return `<button class="r ${maxed ? 'done' : can ? '' : 'poor'}" data-act="gen" data-id="${d.id}" ${maxed ? 'disabled' : ''}><div class="rn">${d.n} <span class="tag on">${lv}/${d.max}</span></div><div class="rd">${d.d}</div><div class="rc">${maxed ? '✓' : cost + ' 🧬'}</div></button>`; }).join('') : '';
    el.innerHTML = up + genCard + perks + `<div class="card"><h3>The ladder</h3><div class="ladder">${ladder}</div></div>`;
  },
  act: {
    ascend: (_b, g, api) => { if (ascend(g)) api.close(); return false; },
    genesis: (_b, g, api) => { if (!canGenesis(g)) return false; if (!armed) { armed = true; clearTimeout(armT); armT = window.setTimeout(() => { armed = false; api.rerender(); }, 4000); return true; } armed = false; if (genesis(g)) api.close(); return false; },
    gen: (b, g) => buyGen(g, b.dataset.id!),
  },
};
