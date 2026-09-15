// The Clinic: the chapter's current request, what it wants, the story so far.
import { STORY, RAR, TEXT } from '../../data';
import type { Req } from '../../data';
import type { Ctx } from '../../sim';
import { story, stepReqs, reqHave, reqName, reqOk, reqSummary, deliver, faceBloom, unlocked, tierDef, fmt, tierMult } from '../../sim';
import type { PanelDef } from '../panel';
import { icon } from '../icons';
import { faceCanvas, drawPortraits } from '../portraits';
import { play } from '../sound';

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;');
export function reqChips(g: Ctx, list: Req[]) {
  return `<div class="needs">${list.map(q => { const h = Math.min(reqHave(g, q), q.n); const ok = h >= q.n; const col = q.t === 'med' ? null : RAR[q.t === 'any' ? 0 : q.r].col; return `<span class="chip ${ok ? 'ok' : ''}">${col ? `<i style="background:${col}"></i>` : icon('pill', 14)}${reqName(g, q)} ${h}/${q.n}</span>`; }).join('')}</div>`;
}

export const clinicPanel: PanelDef = {
  id: 'clinic',
  title: () => 'Clinic',
  render(el, g) {
    const s = g.s, ch = STORY[s.tier];
    if (!ch) { el.innerHTML = `<div class="card"><p class="sub" style="margin:0">No chapter has been written for the ${tierDef(s.tier).n} yet. Side quests keep paying.</p></div>`; return; }
    const st = story(g);
    const dots = `<span class="dots">${ch.steps.map((_, k) => `<i class="${k < st.step || st.done ? 'done' : k === st.step ? 'now' : ''}"></i>`).join('')}</span>`;
    let main: string;
    if (st.done) {
      const next = STORY[s.tier + 1];
      main = `<div class="card"><h3>Chapter complete</h3><p class="sub" style="margin:0 0 6px">${esc(ch.steps[ch.steps.length - 1].after)}</p><p class="sub" style="margin:0">${next ? `<b>${TEXT.ascend}</b> is open. Chapter ${s.tier + 2}, <b>${esc(next.title)}</b>, waits in the ${tierDef(s.tier + 1).n}.` : `That is every chapter written so far. ${TEXT.ascend} is open.`}</p></div>`;
    } else {
      const step = ch.steps[st.step]; const list = stepReqs(s.tier, st.step); const ok = reqOk(g, list);
      const say = (s.gen.runs && s.tier === 0 && st.step === 0) ? 'Welcome back to Mossbrook! Have we met? You look smaller. Anyway. ' + step.say.replace('Welcome to Mossbrook! ', '') : step.say;
      const act = step.outbreak
        ? (s.ob ? `<button class="btn primary" disabled>Bloom in progress</button>` : `<button class="btn primary" data-act="face">Face the bloom</button>`)
        : `<button class="btn primary" data-act="deliver" ${ok ? '' : 'disabled'}>Deliver to ${esc(step.who)}</button>`;
      const hint = step.outbreak || ok ? '' : list.some(q => q.t === 'med') ? (unlocked(g, 'brew') ? `<p class="sub" style="margin:6px 0 0">Medicines are brewed at the Apothecary from spare samples.</p>` : '')
        : list.some(q => q.t === 'rarity') ? `<p class="sub" style="margin:6px 0 0">Rarer strains show up as the Petri dish ranks up on the bench. The odds bar there shows your chances.</p>`
        : `<p class="sub" style="margin:6px 0 0">Spare samples are copies beyond the one the Catalog keeps. Harvest until you have enough.</p>`;
      main = `<div class="card req"><div class="who">${faceCanvas(step.who)}<div><b>${esc(step.who)}</b><div class="sub" style="margin:0">${step.outbreak ? 'needs you at the ' + TEXT.dish : 'wants ' + esc(reqSummary(g, list))} · pays ${fmt(step.reward * tierMult(g))}</div></div></div><p class="say">“${esc(say)}”</p>${step.outbreak ? '' : reqChips(g, list)}${hint}<div class="acts" style="margin-top:8px">${act}</div></div>`;
    }
    const apo = !st.done && unlocked(g, 'brew') && stepReqs(s.tier, st.step).some(q => q.t === 'med') ? `<div class="acts" style="margin:2px 0 8px"><button class="btn" data-act="open" data-tab="brew">${icon('kettle', 18)} Brew medicines at the Apothecary${s.brew ? ' · brewing' : ''}</button></div>` : '';
    const up = st.done ? '' : (() => { const next: number[] = []; for (let k = st.step + 1; k < ch.steps.length && next.length < 2; k++) next.push(k); return next.length ? `<h4 class="gh">Coming up</h4><div class="card">${next.map(k => { const x = ch.steps[k]; return `<div class="kv"><span>${s.tier + 1}-${k + 1} · ${esc(x.who)}</span><span>${x.outbreak ? 'the bloom' : esc(reqSummary(g, stepReqs(s.tier, k)))}</span></div>`; }).join('')}</div>` : ''; })();
    const log = st.log.length ? `<h4 class="gh">So far</h4><div class="card paper">${st.log.map(l => `<p class="sub" style="margin:0 0 6px">${esc(l)}</p>`).join('')}</div>` : `<div class="card paper"><p class="sub" style="margin:0">${esc(ch.intro)}</p></div>`;
    el.innerHTML = `<p class="sub" style="margin-bottom:6px"><b>Chapter ${s.tier + 1} · ${esc(ch.title)}</b><br>${dots} ${st.done ? 'done' : (st.step + 1) + ' of ' + ch.steps.length}</p>` + main + apo + up + log;
    drawPortraits(el, performance.now());
  },
  live(el) { drawPortraits(el, performance.now()); },
  act: {
    deliver: (_b, g) => { const ok = deliver(g); if (ok) play('deliver'); return ok; },
    face: (_b, g, api) => { if (faceBloom(g)) { play('danger'); api.close(); } return false; },
  },
};
