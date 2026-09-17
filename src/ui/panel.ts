// Panels slide up over the vessel. One is open at a time; structure is rebuilt on 'dirty', live values patched in place.
import type { Ctx, AdPlacement } from '../sim';
import { unlocked, unlockName, unlockLabel, unlockHint, toast } from '../sim';

export interface PanelApi { open: (id: string) => void; close: () => void; rerender: () => void; ad?: (placement: AdPlacement, arg?: number) => void; buy?: (id: string) => void }
export interface PanelDef {
  id: string;
  title: (g: Ctx) => string;
  /** a full screen with a Back button rather than a sheet over the vessel */
  full?: boolean;
  /** keep the scroll position across closes and rerenders (long lists); it resets on Scale-up, Genesis and launch */
  keepScroll?: boolean;
  render: (el: HTMLElement, g: Ctx, api: PanelApi) => void;
  /** cheap per-150 ms patching of live values */
  live?: (el: HTMLElement, g: Ctx) => void;
  /** delegated `data-act` handlers; return true to rerender */
  act?: Record<string, (b: HTMLElement, g: Ctx, api: PanelApi) => boolean | void>;
  /** per animation frame while open, for scene canvases */
  frame?: (el: HTMLElement, g: Ctx, now: number) => void;
  /** a tap on the panel's `.scene` canvas at canvas-relative CSS pixels; return true to rerender */
  scene?: (g: Ctx, x: number, y: number) => boolean;
}

export class Panels {
  el: HTMLDivElement; current: string | null = null;
  private scrim: HTMLDivElement; private panel: HTMLDivElement; private title: HTMLElement; private body: HTMLDivElement;
  private defs: Record<string, PanelDef> = {}; private openedAt = 0; private animT = 0; private scroll: Record<string, number> = {};
  readonly api: PanelApi;

  constructor(private g: Ctx, defs: PanelDef[], private onChange: (open: string | null) => void = () => {}) {
    for (const d of defs) this.defs[d.id] = d;
    this.el = document.createElement('div'); this.el.className = 'panels';
    this.el.innerHTML = `<div class="scrim"></div><div class="panel"><header class="ph"><button class="back" aria-label="Back" hidden>‹ Back</button><h2></h2><button class="x" aria-label="Close">✕</button></header><div class="tabbody"></div></div>`;
    this.scrim = this.el.querySelector('.scrim')!; this.panel = this.el.querySelector('.panel')!; this.title = this.el.querySelector('h2')!; this.body = this.el.querySelector('.tabbody')!;
    this.api = { open: id => this.open(id), close: () => this.close(), rerender: () => this.rerender() };
    this.scrim.onclick = () => { if (performance.now() - this.openedAt > 350) this.close(); };
    this.el.querySelector('.x')!.addEventListener('click', () => this.close());
    this.el.querySelector('.back')!.addEventListener('click', () => this.close());
    this.body.addEventListener('pointerdown', e => {
      const cv = (e.target as HTMLElement).closest<HTMLCanvasElement>('canvas.scene'); if (!cv || !this.current) return;
      const d = this.defs[this.current]; if (!d.scene) return; const r = cv.getBoundingClientRect();
      if (d.scene(this.g, e.clientX - r.left, e.clientY - r.top)) this.rerender();
    });
    this.body.addEventListener('click', e => {
      const b = (e.target as HTMLElement).closest<HTMLElement>('[data-act]'); if (!b || !this.current) return;
      const act = b.dataset.act!; if (act === 'open') { this.open(b.dataset.tab!); return; }
      const fn = this.defs[this.current].act?.[act]; if (fn && fn(b, this.g, this.api) !== false) this.rerender();
    });
    g.on(e => { if (e.type === 'dirty' && this.current) this.rerender(); else if (e.type === 'ascend' || e.type === 'genesis') this.scroll = {}; });
  }

  open(id: string) {
    if (!this.defs[id]) return;
    if (!unlocked(this.g, id)) { toast(this.g, `🔒 ${unlockName(id)} opens after ${unlockLabel(id)}. ${unlockHint(id)}`); return; }
    if (this.current) this.remember();
    this.current = id; this.openedAt = performance.now(); this.g.paused = true;
    const full = !!this.defs[id].full; (this.el.querySelector('.back') as HTMLElement).hidden = !full; (this.el.querySelector('.x') as HTMLElement).hidden = full;
    // a sheet rests below the screen, a full screen rests to the right: switching kinds must jump between the two rest
    // positions without a transition, or the next open would slide in from wherever the last close left it
    if (this.panel.classList.contains('full') !== full) { this.panel.style.transition = 'none'; this.panel.classList.toggle('full', full); void this.panel.offsetWidth; this.panel.style.transition = ''; }
    this.rerender(); this.body.scrollTop = this.defs[id].keepScroll ? this.scroll[id] || 0 : 0;
    this.panel.classList.remove('anim'); void this.panel.offsetWidth; this.panel.classList.add('open', 'anim'); this.scrim.classList.add('on');
    clearTimeout(this.animT); this.animT = window.setTimeout(() => this.panel.classList.remove('anim'), 900);
    this.onChange(id);
  }
  toggle(id: string) { if (this.current === id) this.close(); else this.open(id); }
  close() { if (!this.current) return; this.remember(); this.current = null; this.g.paused = false; this.panel.classList.remove('open', 'anim'); this.scrim.classList.remove('on'); this.onChange(null); }
  private remember() { if (this.current && this.defs[this.current].keepScroll) this.scroll[this.current] = this.body.scrollTop; }

  rerender() {
    if (!this.current) return; const d = this.defs[this.current];
    this.title.textContent = d.title(this.g);
    const top = this.body.scrollTop; d.render(this.body, this.g, this.api); if (this.body.scrollTop !== top) this.body.scrollTop = top;
    // content pops in, staggered, only when the panel has just opened
    if (performance.now() - this.openedAt < 200) this.body.querySelectorAll<HTMLElement>(':scope > .card, :scope > .r, :scope > .sub').forEach((c, k) => { c.classList.add('pop'); c.style.animationDelay = `${180 + k * 40}ms`; });
  }
  live() { if (!this.current) return; this.defs[this.current].live?.(this.body, this.g); }
  frame(now: number) { if (!this.current) return; this.defs[this.current].frame?.(this.body, this.g, now); }
}
