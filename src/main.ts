// Dev harness: runs the sim in the browser with a handful of buttons and a state readout. Not the game's UI.
import { createGame, tick, checkOffline, collect, stir, deliver, buy, goal, story, curStep, stepReqs, reqName, reqHave, genRate, cycleTime, effLv, lvCost, fmt, fmtDur, clinicHas, unlocked, UNLOCK, SAVE_VERSION } from './sim';

const KEY = 'petri-v' + SAVE_VERSION;
const raw = (() => { try { return JSON.parse(localStorage.getItem(KEY) || 'null'); } catch { return null; } })();
const g = createGame({ save: raw });
const log = document.getElementById('log')!, out = document.getElementById('out')!, acts = document.getElementById('acts')!;
g.on(e => { if (e.type === 'toast') { const p = document.createElement('div'); p.textContent = (e.bad ? '⚠ ' : '') + e.msg; log.prepend(p); } });

const off = checkOffline(g, Date.now());
if (off) log.prepend(Object.assign(document.createElement('div'), { textContent: `Away ${fmtDur(off.away)} at ${Math.round(off.eff * 100)}%: +${fmt(off.sum.cur)}, ${off.sum.cycles} cycles, ${off.sum.finds.length} finds` }));

const button = (label: string, fn: () => void) => { const b = document.createElement('button'); b.textContent = label; b.onclick = () => { fn(); render(); }; acts.appendChild(b); };
button('Stir', () => stir(g));
button('Harvest', () => collect(g, 0));
button('Deliver', () => deliver(g));
button('Dish level', () => buy(g, 'lv'));
button('+1000', () => { g.s.cur += 1000; });
button('Reset', () => { localStorage.removeItem(KEY); location.reload(); });

function render() {
  const s = g.s, gl = goal(g), step = curStep(g);
  const needs = step && !step.outbreak ? stepReqs(s.tier, story(g).step).map(q => `${reqName(g, q)} ${Math.min(reqHave(g, q), q.n)}/${q.n}`).join(', ') : '';
  out.textContent = [
    `biomass ${fmt(s.cur)}  +${genRate(g).toFixed(2)}/s   tier ${s.tier + 1}  lv ${s.lv} (eff ${effLv(g)})  next level ${fmt(lvCost(g))}`,
    `dish ${(s.dishes[0].p / cycleTime(g) * 100).toFixed(0)}%  ${s.dishes[0].ready ? 'READY' : 'growing'}  colonies ${s.dishes[0].drops.filter(d => !d.dead).length}`,
    `goal ${gl.no} ${gl.kind} ${gl.who || ''}  ${needs}  ${clinicHas(g) ? '← deliverable' : ''}`,
    `open: ${Object.keys(UNLOCK).filter(k => unlocked(g, k)).join(', ') || 'nothing yet'}`,
    `catalog ${JSON.stringify(s.cat[s.tier] || {})}`,
    `stats ${JSON.stringify(s.st)}`,
  ].join('\n');
}
let last = performance.now();
function frame(now: number) { const dt = Math.min(0.25, (now - last) / 1000); last = now; tick(g, dt, now); render(); requestAnimationFrame(frame); }
requestAnimationFrame(frame);
setInterval(() => { g.s.last = Date.now(); localStorage.setItem(KEY, JSON.stringify(g.s)); }, 3000);
document.addEventListener('visibilitychange', () => { if (document.hidden) { g.s.last = Date.now(); localStorage.setItem(KEY, JSON.stringify(g.s)); } else checkOffline(g, Date.now()); });
