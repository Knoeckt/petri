// The main screen: sign, counter, vessel, board. Structure is built once; live values are patched in place.
import { RAR, TEXT } from '../data';
import type { Ctx } from '../sim';
import { goal, genRate, cycleTime, lvCost, buy, collect, flashFinds, tierDef, fmt, fmtDur, clinicHas } from '../sim';
import { VesselView } from './vessel';

const setText = (el: Element | null, s: string) => { if (el && el.textContent !== s) el.textContent = s; };
const setHTML = (el: Element | null, s: string) => { if (el && el.innerHTML !== s) el.innerHTML = s; };

export class App {
  root: HTMLDivElement; vessel: VesselView;
  private cur: HTMLElement; private rate: HTMLElement; private goalEl: HTMLElement; private bar: HTMLElement; private barFill: HTMLElement;
  private harvest: HTMLButtonElement; private lvBtn: HTMLButtonElement; private signSmall: HTMLElement; private toastEl: HTMLElement;
  private toastT = 0; private lastCur = -1;

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
          <button class="btn lv">Dish level<small></small></button>
        </div>
      </div>
      <div class="toast"></div>`;
    this.vessel = new VesselView(g, { onHarvest: () => this.bump() });
    this.root.querySelector('.stage')!.appendChild(this.vessel.el);
    this.cur = this.root.querySelector('.cur b')!; this.rate = this.root.querySelector('.cur small')!;
    this.goalEl = this.root.querySelector('.goal')!; this.bar = this.root.querySelector('.bar')!; this.barFill = this.root.querySelector('.bar i')!;
    this.harvest = this.root.querySelector('.harvest')!; this.lvBtn = this.root.querySelector('.lv')!; this.signSmall = this.root.querySelector('.sign small')!; this.toastEl = this.root.querySelector('.toast')!;
    this.harvest.onclick = () => { const sum = collect(g, 0); if (sum) { flashFinds(g, sum); this.vessel.jelly(); this.bump(); } };
    this.lvBtn.onclick = () => { if (buy(g, 'lv')) this.bump(); };
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
    this.harvest.disabled = !d.ready; this.harvest.textContent = d.ready ? `${TEXT.collect}!` : `${TEXT.cycling} · ${fmtDur(cycleTime(g) - d.p)}`;
    setHTML(this.lvBtn, `Dish level ${s.lv}<small>${fmt(lvCost(g))} ${TEXT.cur.toLowerCase()}</small>`); this.lvBtn.disabled = s.cur < lvCost(g);
    const gl = goal(g);
    const html = gl.kind === 'gather'
      ? `<span class="no">${gl.no}</span><span>${gl.who}</span>` + gl.needs!.map(n => `<span class="need ${n.ok ? 'ok' : ''} ${n.med ? 'med' : ''}">${n.med ? '💊' : `<i style="background:${RAR[n.r].col}"></i>`}${n.have}/${n.n} ${n.name}</span>`).join('')
      : gl.kind === 'deliver' ? `<span class="no">${gl.no}</span><span>Deliver to ${gl.who}${clinicHas(g) ? ' ✓' : ''}</span>`
      : gl.kind === 'brewing' ? `<span class="no">${gl.no}</span><span>Brewing ${gl.brew!.n} ${gl.brew!.id} · ${fmtDur(gl.brew!.left)}</span>`
      : gl.kind === 'face' ? `<span class="no">${gl.no}</span><span>${gl.who}: face the bloom</span>`
      : gl.kind === 'bloom' ? `<span class="no">☠</span><span>Bloom in progress · tap it!</span>`
      : gl.kind === 'done' ? `<span class="no">${gl.no}</span><span>Chapter done · ${TEXT.ascend} is open</span>`
      : `<span class="no">${gl.no}</span><span>No chapter here yet</span>`;
    setHTML(this.goalEl, html);
    if (this.lastCur >= 0 && s.cur > this.lastCur + 1) { /* income ticks quietly; harvests and sales bump via actions */ }
    this.lastCur = s.cur;
  }
}
