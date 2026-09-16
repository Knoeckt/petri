import './ui/theme.css';
import { createGame, isPaceId, DEFAULT_PACE, type PaceId } from './sim';
import { App } from './ui/app';
import { GameSession } from './runtime/session';
import { SaveStore } from './runtime/storage';
import { SaveNotice } from './ui/save-notice';

const store = new SaveStore(() => localStorage);
const loaded = store.load();
// balance profile (ROADMAP §6): ?pace=real switches a device to playtest timings and remembers it; the dev sheet toggles it too
const PACE_KEY = 'petri-pace';
const pace: PaceId = (() => {
  const url = new URL(location.href), q = url.searchParams.get('pace');
  if (q !== null) { url.searchParams.delete('pace'); history.replaceState(null, '', url); } // applies once; a reload keeps the stored choice
  try { if (isPaceId(q)) { localStorage.setItem(PACE_KEY, q); return q; } const k = localStorage.getItem(PACE_KEY); if (isPaceId(k)) return k; } catch { /* storage blocked */ }
  return DEFAULT_PACE;
})();
const g = createGame({ save: loaded.state, pace });
const app = new App(g);
const mount = document.getElementById('app') || document.querySelector('.phone');
if (mount) mount.replaceWith(app.root); else document.body.appendChild(app.root);
if (import.meta.hot) import.meta.hot.accept(() => location.reload());

let wiped = false;
let saveFailed = false;
const notice = new SaveNotice(() => {
  const url = URL.createObjectURL(new Blob([store.recoveryExport(g.s)], { type: 'application/json' }));
  const link = document.createElement('a'); link.href = url; link.download = 'petri-progress.json'; link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
});
app.root.appendChild(notice.el);
if (loaded.message) notice.show(loaded.message, true);
const save = () => {
  if (wiped) return;
  const error = store.save(g.s);
  if (error) notice.show(error, false);
  else if (saveFailed) notice.hide();
  saveFailed = !!error;
};
(window as any).petri = { g, app, setPace: (id: PaceId) => { try { localStorage.setItem(PACE_KEY, id); } catch { /* storage blocked */ } location.reload(); }, reset: () => {
  try { store.reset(); wiped = true; location.reload(); }
  catch { notice.show('The save could not be reset. Your current game is still open.', true); }
} };

const session = new GameSession(g, save, off => app.offline(off));
if (!document.hidden) session.resume();

let uiAcc = 0;
function frame(now: number) {
  const dt = session.frame(now);
  if (session.running) {
    app.vessel.draw(now, g.paused); app.panels.frame(now);
    uiAcc += dt; if (uiAcc > 0.15) { uiAcc = 0; app.update(); }
  }
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
setInterval(() => session.save(), 3000);
document.addEventListener('visibilitychange', () => { if (document.hidden) session.suspend(); else session.resume(); });
window.addEventListener('pagehide', () => session.suspend());
window.addEventListener('pageshow', () => { if (!document.hidden) session.resume(); });
window.addEventListener('beforeunload', () => session.suspend());

// iOS home-screen apps report a viewport that is the screen minus the status bar, yet anchor it at the top of the
// screen, which leaves a strip at the bottom. When that happens, size the page to the whole screen.
function fitStandalone() {
  const standalone = (navigator as any).standalone || matchMedia('(display-mode: standalone)').matches;
  if (!standalone) return;
  const h = screen.height;
  const fix = h > innerHeight + 8 ? h + 'px' : '';
  document.documentElement.style.height = fix; document.body.style.height = fix;
}
fitStandalone(); addEventListener('resize', fitStandalone); addEventListener('orientationchange', () => setTimeout(fitStandalone, 300));
// installable on the phone: the worker is scoped to this folder and does not touch the mockup's
if (import.meta.env.PROD && 'serviceWorker' in navigator) {
  navigator.serviceWorker.register('./sw.js', { updateViaCache: 'none' }).then(reg => {
    const updateReady = () => app.toast('Update downloaded. Close all Petri windows and reopen to play the new version.');
    if (reg.waiting) updateReady();
    const watch = () => {
      const worker = reg.installing;
      worker?.addEventListener('statechange', () => {
        if (worker.state === 'installed' && reg.active) updateReady();
        if (worker.state === 'activated') app.toast('Petri is ready to play offline.');
        if (worker.state === 'redundant') app.toast('Offline download did not finish. Reopen Petri online to retry.');
      });
    };
    watch(); reg.addEventListener('updatefound', watch);
  }).catch(() => app.toast('Offline setup is unavailable. Reopen Petri online to retry.'));
}
