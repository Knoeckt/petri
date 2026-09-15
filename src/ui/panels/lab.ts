// The Lab: research (one bench), then specimen studies.
import { RES_DEF, RAR, TEXT } from '../../data';
import type { Ctx } from '../../sim';
import { resVisible, resDone, resCost, resTime, resLv, resName, startResearch, startStudy, studyCost, studyPerk, perkText, studyKey, guardChance, shelfCap, tierDef, stock, unlocked, fmt, fmtDur, STUDY_TIME } from '../../sim';
import type { PanelDef } from '../panel';
import { adLabel } from '../sheet';

export const labPanel: PanelDef = {
  id: 'lab',
  title: () => 'Lab',
  render(el, g) {
    const s = g.s;
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
      const key = studyKey(t, r, i); if (!c[`${r}-${i}`]) return; total++;
      const isDone = s.studies[key]; if (isDone) done++;
      const act = s.active && s.active.id === 'study' && s.active.key === key; const pt = perkText(studyPerk(t, r, i)); const cost = studyCost(g, t, r), sp = stock(g, r, i, t);
      if (isDone) rows.push(`<div class="r done"><div class="rn"><i class="sw" style="background:${R.col}"></i>${it.n} <span class="tag on">studied</span></div><div class="rd">${pt}</div><div class="rc">✓</div></div>`);
      else if (act) rows.push(`<div class="r active"><div class="rn"><i class="sw" style="background:${R.col}"></i>${it.n} <span class="tag">studying</span></div><div class="rd">${pt}</div><div class="rc" data-live="left">${fmtDur(s.active!.left)}</div><div class="prog"><b data-live="prog" style="width:${(1 - s.active!.left / s.active!.total) * 100}%"></b></div><div class="acts"><button class="btn ad" data-act="ad" data-live="ad">${adLabel(g, 'Finish now')}</button></div></div>`);
      else { const can = !s.active && sp >= 1 && s.cur >= cost; rows.push(`<button class="r ${can ? '' : 'poor'}" data-act="study" data-key="${key}"><div class="rn"><i class="sw" style="background:${R.col}"></i>${it.n}${it.danger ? ' ⚠️' : ''}</div><div class="rd">${pt} · ${fmtDur(STUDY_TIME[r])} · uses 1 spare (have ${sp})${s.active ? ' · bench busy' : ''}</div><div class="rc">${fmt(cost)}</div></button>`); }
    }));
    el.innerHTML = `<h4 class="gh" style="margin-top:0">Research</h4><p class="sub">One at a time. Research survives ${TEXT.ascend.toLowerCase()} and resets at Genesis. Every timer can be finished with an ad.${hidden ? ` ${hidden} more open with the Apothecary.` : ''}${nextN ? ` ${nextN} more open at the ${tierDef(nextT).n}.` : ''}</p>` + research +
      `<h4 class="gh">Specimen studies · ${done}/${total}</h4><p class="sub">Put a spare under the microscope for a permanent perk. Rarer strains teach more; biters teach quarantine.</p>` + (rows.length ? rows.join('') : `<div class="card"><p class="sub" style="margin:0">Find something in the ${TEXT.dish} first.</p></div>`);
  },
  live(el, g) {
    const a = g.s.active;
    if (a) { const l = el.querySelector('[data-live="left"]'); if (l && l.textContent !== fmtDur(a.left)) l.textContent = fmtDur(a.left); const p = el.querySelector<HTMLElement>('[data-live="prog"]'); if (p) p.style.width = ((1 - a.left / a.total) * 100) + '%'; const b = el.querySelector<HTMLButtonElement>('[data-live="ad"]'); if (b) { const t = adLabel(g, 'Finish now'); if (b.textContent !== t) b.textContent = t; } }
    el.querySelectorAll<HTMLElement>('.r[data-id]').forEach(r => { const def = RES_DEF.find(x => x.id === r.dataset.id); if (def) r.classList.toggle('poor', !!g.s.active || g.s.cur < resCost(g, def)); });
    el.querySelectorAll<HTMLElement>('.r[data-key]').forEach(r => { const [t, ri] = r.dataset.key!.split(':'); const [rr, ii] = ri.split('-').map(Number); r.classList.toggle('poor', !!g.s.active || stock(g, rr, ii, +t) < 1 || g.s.cur < studyCost(g, +t, rr)); });
  },
  act: {
    research: (b, g) => startResearch(g, b.dataset.id!),
    study: (b, g) => startStudy(g, b.dataset.key!),
    ad: (_b, g, api) => { api.ad?.('finish research'); return false; },
  },
};
