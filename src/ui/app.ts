// The main screen: sign, counter, vessel with its side buttons, board, tab bar, panels and the sheet.
// Structure is built once; live values are patched in place.
import { RAR, TEXT, UNLOCK } from '../data';
import type { Ctx, AdPlacement } from '../sim';
import { goal, genRate, cycleTime, collect, flashFinds, tierDef, fmt, fmtDur, clinicHas, unlocked, unlockLabel, upAvailable, eqAvailable, canAscend, questsReady, unplacedCount, mergeableCount, medsRelevant, batchesAffordable, adReady, boostOn, warpLen, boostLen, tutSeen, iapOwned, type Offline } from '../sim';
import { VesselView } from './vessel';
import { Panels } from './panel';
import { Sheet, runAd, runPurchase, showResults, adLabel } from './sheet';
import { clinicPanel } from './panels/clinic';
import { upgradesPanel } from './panels/upgrades';
import { labPanel } from './panels/lab';
import { fieldPanel } from './panels/field';
import { questsPanel, shopPanel, decorPanel } from './panels/misc';
import { catalogPanel } from './panels/catalog';
import { ladderPanel } from './panels/ladder';
import { brewPanel, splicerPanel } from './panels/stations';
import { openDev } from './dev';
import { icon } from './icons';
import { Guide } from './guide';
import { play, unlockAudio, isMuted, setMuted } from './sound';
import { spliceScene } from './panels/stations';

const setText = (el: Element | null, s: string) => { if (el && el.textContent !== s) el.textContent = s; };
const setHTML = (el: Element | null, s: string) => { if (el && el.innerHTML !== s) el.innerHTML = s; };
const setDis = (el: HTMLButtonElement | null, d: boolean) => { if (el && el.disabled !== d) el.disabled = d; };

const TABS: [string, string, string][] = [['up', 'flask', 'Upgrades'], ['lab', 'microscope', 'Lab'], ['clinic', 'pill', 'Clinic'], ['cat', 'book', 'Shelf'], ['asc', 'rocket', TEXT.ascend]];
const SIDE_L: [string, string, string][] = [['quests', 'scroll', 'Quests'], ['field', 'map', 'Field'], ['splicer', 'dna', 'Splicer']];
const SIDE_R: [string, string, string][] = [['shop', 'cart', 'Shop'], ['decor', 'vase', 'Decor'], ['brew', 'kettle', 'Brewery']];

export class App {
  root: HTMLDivElement; vessel: VesselView; panels: Panels; sheet: Sheet; guide: Guide;
  private cur: HTMLElement; private rate: HTMLElement; private goalEl: HTMLElement; private bar: HTMLElement; private barFill: HTMLElement;
  private harvest: HTMLButtonElement; private fieldBtn: HTMLButtonElement; private warpBtn: HTMLButtonElement; private boostBtn: HTMLButtonElement;
  private signSmall: HTMLElement; private toastEl: HTMLElement; private tabs: HTMLElement; private chEl: HTMLElement; private wdEl: HTMLElement;
  private toastT = 0; private signTaps = 0; private signT = 0;

  constructor(private g: Ctx) {
    this.root = document.createElement('div'); this.root.className = 'phone';
    const sbtn = ([id, ic, n]: [string, string, string]) => `<button class="sbtn" data-tab="${id}"><span>${icon(ic, 26)}</span><i>${n}</i><b class="cnt" hidden></b><b class="lk" hidden></b></button>`;
    this.root.innerHTML = `
      <header class="top">
        <div class="sign"><small></small><b>${TEXT.name}</b><i class="heart" hidden>❤️</i></div>
        <div class="lvl"><b class="ch">1-1</b><small class="wd">World 1</small></div>
        <div class="cur"><b>0</b><small>+0.0/s</small></div>
      </header>
      <button class="mute" aria-label="Sound">${icon(isMuted() ? 'mute' : 'speaker', 20)}</button>
      <div class="stage"><div class="sideL">${SIDE_L.map(sbtn).join('')}</div><div class="sideR">${SIDE_R.map(sbtn).join('')}</div></div>
      <div class="board">
        <div class="goal"></div>
        <div class="bar"><i></i></div>
        <div class="acts">
          <button class="btn primary harvest">${TEXT.collect}</button>
          <button class="btn field">Field<small></small></button>
        </div>
        <div class="acts ads">
          <button class="btn ad warp"></button>
          <button class="btn ad boost"></button>
        </div>
      </div>
      <nav class="tabs">${TABS.map(([id, ic, n]) => `<button data-tab="${id}"><span class="i">${icon(ic, 24)}</span>${n}<i class="badge"></i><b class="lk" hidden></b></button>`).join('')}</nav>
      <b class="ver">v${__APP_VERSION__}${g.pace.id === 'proto' ? '' : ' · ' + g.pace.n.toLowerCase()}</b>
      <div class="toast"></div>`;
    this.vessel = new VesselView(g, { onHarvest: () => { this.bump(); play('harvest'); }, onStir: () => play('tap') });
    const stage = this.root.querySelector('.stage')!; stage.insertBefore(this.vessel.el, stage.querySelector('.sideR'));
    this.sheet = new Sheet();
    this.panels = new Panels(g, [upgradesPanel, labPanel, clinicPanel, catalogPanel, ladderPanel, fieldPanel, questsPanel, shopPanel, decorPanel, brewPanel, splicerPanel], open => { this.root.classList.toggle('covered', !!open); if (open) tutSeen(g, open); }); // a visited panel clears its guide prompt
    this.panels.api.ad = (placement: AdPlacement, arg?: number) => this.ad(placement, arg);
    this.panels.api.buy = (id: string) => runPurchase(this.g, this.sheet, id, () => { this.bump(); this.panels.rerender(); });
    this.root.insertBefore(this.panels.el, this.root.querySelector('.tabs'));
    this.root.appendChild(this.sheet.el);
    this.guide = new Guide(g, this.root, () => this.panels.current, () => this.sheet.isOpen); this.root.appendChild(this.guide.el);
    const q = <T extends Element>(sel: string) => this.root.querySelector<T>(sel)!;
    this.cur = q('.cur b'); this.rate = q('.cur small'); this.chEl = q('.lvl .ch'); this.wdEl = q('.lvl .wd');
    this.goalEl = q('.goal'); this.bar = q('.bar'); this.barFill = q('.bar i');
    this.harvest = q('.harvest'); this.fieldBtn = q('.field'); this.warpBtn = q('.warp'); this.boostBtn = q('.boost');
    this.signSmall = q('.sign small'); this.toastEl = q('.toast'); this.tabs = q('.tabs');
    this.harvest.onclick = () => { const sum = collect(g, 0); if (sum) { flashFinds(g, sum); this.bump(); play('harvest'); } };
    this.fieldBtn.onclick = () => this.panels.open('field');
    this.warpBtn.onclick = () => this.ad('time warp');
    this.boostBtn.onclick = () => this.ad('boost');
    this.root.addEventListener('click', e => { const b = (e.target as HTMLElement).closest<HTMLElement>('.tabs button[data-tab], .sbtn[data-tab]'); if (b) this.panels.toggle(b.dataset.tab!); });
    q('.sign').addEventListener('click', () => { const now = performance.now(); if (now - this.signT > 1500) this.signTaps = 0; this.signT = now; if (++this.signTaps >= 5) { this.signTaps = 0; openDev(g, this.sheet, this); } });
    q('.ver').addEventListener('click', () => this.readout());
    const mute = q<HTMLButtonElement>('.mute'); mute.onclick = () => { setMuted(!isMuted()); mute.innerHTML = icon(isMuted() ? 'mute' : 'speaker', 20); if (!isMuted()) play('tap'); };
    this.root.addEventListener('pointerdown', unlockAudio, { once: true });
    g.on(e => {
      if (e.type === 'toast') this.toast(e.msg, e.bad);
      else if (e.type === 'chomp') play('danger');
      else if (e.type === 'find') play('find');
      else if (e.type === 'unlock' || e.type === 'chapterDone') play('deliver');
      else if (e.type === 'ascend') play('level');
      else if (e.type === 'genesis') play('genesis');
      else if (e.type === 'burst') spliceScene(g).burst(e.col);
      else if (e.type === 'smoke') spliceScene(g).smoke();
    });
    this.update();
  }

  /** plays a stand-in ad and applies the reward; warps show the results sheet */
  ad(placement: AdPlacement, arg?: number) {
    if (!adReady(this.g)) { this.toast(`Ad in ${Math.ceil(this.g.s.adCd)}s`); return; }
    runAd(this.g, this.sheet, placement, arg, sum => { if (placement === 'time warp' && sum) showResults(this.g, this.sheet, 'Time warp', `${fmtDur(warpLen(this.g))} passed on everything.`, sum, false); this.bump(); });
  }
  /** the welcome-back sheet */
  offline(off: Offline) {
    const eff = `The ${TEXT.dish} ran at ${Math.round(off.eff * 100)}% while you were away${off.eff < 1 ? ' (Night shift in Genome raises it)' : ''}.`;
    showResults(this.g, this.sheet, 'While you were away', (off.capped ? `Capped. Storage research raises the cap. ` : '') + eff, off.sum, true, () => this.bump());
  }
  toast(msg: string, bad?: boolean) {
    const t = this.toastEl; t.textContent = msg; t.classList.toggle('bad', !!bad); t.classList.remove('on'); void t.offsetWidth; t.classList.add('on');
    clearTimeout(this.toastT); this.toastT = window.setTimeout(() => t.classList.remove('on'), msg.length > 80 ? 9000 : 2400);
  }
  /** the counter jellies when something lands in it */
  bump() { const c = this.cur.parentElement!; c.classList.remove('tick'); void c.offsetWidth; c.classList.add('tick'); }
  readout() {
    const cs = getComputedStyle(document.documentElement), ph = this.root.getBoundingClientRect(), tb = this.tabs.getBoundingClientRect(), vv = window.visualViewport;
    this.toast(`v${__APP_VERSION__} · win ${innerWidth}×${innerHeight} · vv ${vv ? Math.round(vv.width) + '×' + Math.round(vv.height) + ' @' + Math.round(vv.offsetTop) : '-'} · frame ${Math.round(ph.top)}–${Math.round(ph.bottom)} · tabs ${Math.round(tb.top)}–${Math.round(tb.bottom)} · doc ${document.documentElement.scrollHeight}/${Math.round(scrollY)} · sa ${cs.getPropertyValue('--sat').trim() || '0'}/${cs.getPropertyValue('--sab').trim() || '0'} · standalone ${(navigator as any).standalone ?? matchMedia('(display-mode: standalone)').matches}`);
  }

  /** cheap: runs every ~150 ms */
  update() {
    const g = this.g, s = g.s, d = s.dishes[0];
    setText(this.cur, fmt(s.cur)); setText(this.rate, `+${genRate(g).toFixed(1)}/s`);
    setText(this.signSmall, `Tier ${s.tier + 1} · ${tierDef(s.tier).n}`);
    const prog = Math.min(1, d.p / cycleTime(g));
    this.barFill.style.width = (prog * 100).toFixed(1) + '%'; this.bar.classList.toggle('ready', d.ready);
    setDis(this.harvest, !d.ready); setText(this.harvest, d.ready ? `${TEXT.collect}!` : `${TEXT.cycling} · ${fmtDur(Math.max(0, cycleTime(g) - d.p))}`);
    const fieldOpen = unlocked(g, 'field');
    setHTML(this.fieldBtn, s.trip ? `Trip out<small>back in ${fmtDur(s.trip.left)} · ${s.notes} notes</small>` : fieldOpen ? `Field<small>${s.notes} notes · send a trip</small>` : `Field trips<small>open after ${unlockLabel('field')}</small>`); setDis(this.fieldBtn, !fieldOpen);
    setHTML(this.warpBtn, adLabel(g, `Time warp +${fmtDur(warpLen(g))}`)); setDis(this.warpBtn, !adReady(g) || this.sheet.busy);
    setHTML(this.boostBtn, boostOn(g) ? `✦ 2× for ${fmtDur(s.boost)}` : adLabel(g, `2× for ${fmtDur(boostLen(g))}`)); setDis(this.boostBtn, boostOn(g) || !adReady(g) || this.sheet.busy);
    const gl = goal(g);
    setText(this.chEl, gl.kind === 'done' ? `${s.tier + 1} ✓` : gl.kind === 'bloom' ? '!!' : gl.no); setText(this.wdEl, `World ${s.tier + 1}`);
    const html = gl.kind === 'gather'
      ? `<span class="no">${gl.no}</span><span>${gl.who}</span>` + gl.needs!.map(n => `<span class="need ${n.ok ? 'ok' : ''} ${n.med ? 'med' : ''}">${n.med ? icon('pill', 14) : `<i style="background:${RAR[n.r].col}"></i>`}${n.have}/${n.n} ${n.name}</span>`).join('')
      : gl.kind === 'deliver' ? `<span class="no">${gl.no}</span><span>Deliver to ${gl.who}</span>`
      : gl.kind === 'brewing' ? `<span class="no">${gl.no}</span><span>Brewing ${gl.brew!.n} ${gl.brew!.id} · ${fmtDur(gl.brew!.left)}</span>`
      : gl.kind === 'face' ? `<span class="no">${gl.no}</span><span>${gl.who}: face the bloom</span>`
      : gl.kind === 'bloom' ? `<span class="no">!!</span><span>Bloom in progress · tap it!</span>`
      : gl.kind === 'done' ? `<span class="no">${gl.no}</span><span>Chapter done · ${TEXT.ascend} is open</span>`
      : `<span class="no">${gl.no}</span><span>No chapter here yet</span>`;
    setHTML(this.goalEl, html);
    // badges, counts and locks
    const has: Record<string, boolean> = { up: upAvailable(g) || eqAvailable(g), clinic: clinicHas(g), asc: canAscend(g) };
    const cnt: Record<string, [number, boolean]> = { quests: [questsReady(g), true], field: [s.tickets, s.tickets > 0], splicer: [s.spOut ? 1 : 0, true], decor: [unplacedCount(g) + mergeableCount(g), true], brew: [!s.brew && medsRelevant(g).some(m => batchesAffordable(g, m) >= 1) ? 1 : 0, true] };
    this.root.querySelectorAll<HTMLElement>('.tabs button[data-tab], .sbtn[data-tab]').forEach(b => {
      const k = b.dataset.tab!; b.classList.toggle('has', !!has[k]); b.setAttribute('aria-selected', String(this.panels.current === k));
      const c = b.querySelector<HTMLElement>('.cnt'); if (c && cnt[k]) { const [n, ok] = cnt[k]; c.hidden = n <= 0 || (k === 'field' && !unlocked(g, 'tickets')); setText(c, k === 'splicer' || k === 'brew' ? '!' : String(n)); c.classList.toggle('ok', ok); }
      if (UNLOCK[k]) { const ok = unlocked(g, k); b.classList.toggle('locked', !ok); const lk = b.querySelector<HTMLElement>('.lk')!; lk.hidden = ok; setText(lk, unlockLabel(k)); }
    });
    const heart = this.root.querySelector<HTMLElement>('.sign .heart'); if (heart && heart.hidden === iapOwned(g, 'supporter')) heart.hidden = !iapOwned(g, 'supporter');
    this.panels.live();
    this.guide.tick();
  }
}
