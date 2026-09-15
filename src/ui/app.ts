// The main screen: sign, counter, vessel, board, tab bar, and the panel layer. Structure once; live values patched.
import { RAR, TEXT } from '../data';
import type { Ctx } from '../sim';
import { goal, genRate, cycleTime, collect, flashFinds, tierDef, fmt, fmtDur, clinicHas, unlocked, unlockLabel, upAvailable, canAscend, UNLOCK, startTrip, sitesOpen, eqAvailable } from '../sim';
import { VesselView } from './vessel';
import { Panels } from './panel';
import { clinicPanel } from './panels/clinic';
import { upgradesPanel } from './panels/upgrades';

const setText = (el: Element | null, s: string) => { if (el && el.textContent !== s) el.textContent = s; };
const setHTML = (el: Element | null, s: string) => { if (el && el.innerHTML !== s) el.innerHTML = s; };

const TABS: [string, string, string][] = [['up', '🧪', 'Upgrades'], ['lab', '🔬', 'Lab'], ['clinic', '💊', 'Clinic'], ['cat', '📖', 'Catalog'], ['asc', '🚀', TEXT.ascend]];

export class App {
  root: HTMLDivElement; vessel: VesselView; panels: Panels;
  private cur: HTMLElement; private rate: HTMLElement; private goalEl: HTMLElement; private bar: HTMLElement; private barFill: HTMLElement;
  private harvest: HTMLButtonElement; private lvBtn: HTMLButtonElement; private signSmall: HTMLElement; private toastEl: HTMLElement; private tabs: HTMLElement;
  private toastT = 0;

  constructor(private g: Ctx) {
    this.root = document.createElement('div'); this.root.className = 'phone';
    this.root.innerHTML = `
      <header class="top">
        <div class="sign"><small></small><b>${TEXT.name}</b></div>
        <div class="cur"><b>0</b><small>+0.0/s</small></div>
      </header>
      <div class="stage"></div>
      <div class="board">
        <div class="goal"></div>
        <div class="bar"><i></i></div>
        <div class="acts">
          <button class="btn primary harvest">${TEXT.collect}</button>
          <button class="btn lv">Field trip<small></small></button>
        </div>
      </div>
      <nav class="tabs">${TABS.map(([id, ic, n]) => `<button data-tab="${id}"><span class="i">${ic}</span>${n}<i class="badge"></i><b class="lk" hidden></b></button>`).join('')}</nav>
      <b class="ver">v${__APP_VERSION__}</b>
      <div class="toast"></div>`;
    this.vessel = new VesselView(g, { onHarvest: () => this.bump() });
    this.root.querySelector('.stage')!.appendChild(this.vessel.el);
    this.panels = new Panels(g, [upgradesPanel, clinicPanel], open => this.root.classList.toggle('covered', !!open));
    this.root.insertBefore(this.panels.el, this.root.querySelector('.tabs'));
    this.cur = this.root.querySelector('.cur b')!; this.rate = this.root.querySelector('.cur small')!;
    this.goalEl = this.root.querySelector('.goal')!; this.bar = this.root.querySelector('.bar')!; this.barFill = this.root.querySelector('.bar i')!;
    this.harvest = this.root.querySelector('.harvest')!; this.lvBtn = this.root.querySelector('.lv')!; this.signSmall = this.root.querySelector('.sign small')!; this.toastEl = this.root.querySelector('.toast')!; this.tabs = this.root.querySelector('.tabs')!;
    this.harvest.onclick = () => { const sum = collect(g, 0); if (sum) { flashFinds(g, sum); this.bump(); } };
    this.lvBtn.onclick = () => { const open = sitesOpen(g); const best = open[open.length - 1]; if (best && startTrip(g, best.id)) this.bump(); };
    this.tabs.addEventListener('click', e => { const b = (e.target as HTMLElement).closest<HTMLElement>('button[data-tab]'); if (b) this.panels.toggle(b.dataset.tab!); });
    g.on(e => { if (e.type === 'toast') this.toast(e.msg, e.bad); });
    this.update();
  }

  toast(msg: string, bad?: boolean) {
    const t = this.toastEl; t.textContent = msg; t.classList.toggle('bad', !!bad); t.classList.remove('on'); void t.offsetWidth; t.classList.add('on');
    clearTimeout(this.toastT); this.toastT = window.setTimeout(() => t.classList.remove('on'), 2400);
  }
  /** the counter jellies when something lands in it */
  bump() { const c = this.cur.parentElement!; c.classList.remove('tick'); void c.offsetWidth; c.classList.add('tick'); }

  /** cheap: runs every ~150 ms */
  update() {
    const g = this.g, s = g.s, d = s.dishes[0];
    setText(this.cur, fmt(s.cur)); setText(this.rate, `+${genRate(g).toFixed(1)}/s`);
    setText(this.signSmall, `Tier ${s.tier + 1} · ${tierDef(s.tier).n}`);
    const prog = Math.min(1, d.p / cycleTime(g));
    this.barFill.style.width = (prog * 100).toFixed(1) + '%'; this.bar.classList.toggle('ready', d.ready);
    this.harvest.disabled = !d.ready; setText(this.harvest, d.ready ? `${TEXT.collect}!` : `${TEXT.cycling} · ${fmtDur(cycleTime(g) - d.p)}`);
    const open = sitesOpen(g), best = open[open.length - 1];
    setHTML(this.lvBtn, s.trip ? `Trip out<small>back in ${fmtDur(s.trip.left)} · ${s.notes} notes</small>` : best ? `Send to ${best.n.toLowerCase()}<small>${fmtDur(best.time)} · ${s.notes} notes</small>` : `Field trips<small>open after 1-1</small>`); this.lvBtn.disabled = !!s.trip || !best;
    const gl = goal(g);
    const html = gl.kind === 'gather'
      ? `<span class="no">${gl.no}</span><span>${gl.who}</span>` + gl.needs!.map(n => `<span class="need ${n.ok ? 'ok' : ''} ${n.med ? 'med' : ''}">${n.med ? '💊' : `<i style="background:${RAR[n.r].col}"></i>`}${n.have}/${n.n} ${n.name}</span>`).join('')
      : gl.kind === 'deliver' ? `<span class="no">${gl.no}</span><span>Deliver to ${gl.who}</span>`
      : gl.kind === 'brewing' ? `<span class="no">${gl.no}</span><span>Brewing ${gl.brew!.n} ${gl.brew!.id} · ${fmtDur(gl.brew!.left)}</span>`
      : gl.kind === 'face' ? `<span class="no">${gl.no}</span><span>${gl.who}: face the bloom</span>`
      : gl.kind === 'bloom' ? `<span class="no">☠</span><span>Bloom in progress · tap it!</span>`
      : gl.kind === 'done' ? `<span class="no">${gl.no}</span><span>Chapter done · ${TEXT.ascend} is open</span>`
      : `<span class="no">${gl.no}</span><span>No chapter here yet</span>`;
    setHTML(this.goalEl, html);
    // tab badges and locks
    const has: Record<string, boolean> = { up: upAvailable(g) || eqAvailable(g), clinic: clinicHas(g), asc: canAscend(g) };
    this.tabs.querySelectorAll<HTMLElement>('button[data-tab]').forEach(b => {
      const k = b.dataset.tab!; b.classList.toggle('has', !!has[k]); b.setAttribute('aria-selected', String(this.panels.current === k));
      if (UNLOCK[k]) { const ok = unlocked(g, k); b.classList.toggle('locked', !ok); const lk = b.querySelector<HTMLElement>('.lk')!; lk.hidden = ok; setText(lk, unlockLabel(k)); }
    });
    this.panels.live();
  }
}
