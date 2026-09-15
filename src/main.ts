import './ui/theme.css';
import { createGame, tick, checkOffline, fmt, fmtDur, SAVE_VERSION } from './sim';
import { App } from './ui/app';

const KEY = 'petri-v' + SAVE_VERSION;
// read the newest save this build or any earlier one wrote; migrate() brings it up to date
const raw = (() => { for (let v = SAVE_VERSION; v >= 3; v--) { try { const s = JSON.parse(localStorage.getItem('petri-v' + v) || 'null'); if (s) return s; } catch { /* unreadable */ } } return null; })();
const g = createGame({ save: raw });
const app = new App(g);
const mount = document.getElementById('app') || document.querySelector('.phone');
if (mount) mount.replaceWith(app.root); else document.body.appendChild(app.root);
if (import.meta.hot) import.meta.hot.accept(() => location.reload());

let wiped = false;
const save = () => { if (wiped) return; g.s.last = Date.now(); try { localStorage.setItem(KEY, JSON.stringify(g.s)); } catch { /* storage full or blocked */ } };
(window as any).petri = { g, reset: () => { wiped = true; localStorage.removeItem(KEY); location.reload(); } };

const off = checkOffline(g, Date.now());
if (off) app.toast(`Away ${fmtDur(off.away)} at ${Math.round(off.eff * 100)}%: +${fmt(off.sum.cur)} ${off.sum.cycles} cycles, ${off.sum.finds.length} new`);

let last = performance.now(), uiAcc = 0;
function frame(now: number) {
  const dt = Math.min(0.25, (now - last) / 1000); last = now;
  tick(g, dt, now);
  app.vessel.draw(now, g.paused);
  uiAcc += dt; if (uiAcc > 0.15) { uiAcc = 0; app.update(); }
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
setInterval(save, 3000);
document.addEventListener('visibilitychange', () => { if (document.hidden) save(); else { last = performance.now(); const o = checkOffline(g, Date.now()); if (o) app.toast(`Away ${fmtDur(o.away)}: +${fmt(o.sum.cur)}`); } });
window.addEventListener('beforeunload', save);
