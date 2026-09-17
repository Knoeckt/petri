// The first-run guide: a bobbing hand over the next thing to tap, with a spotlight that dims and blocks everything else.
import type { Ctx } from '../sim';
import { unlocked, clinicHas, curStep, story, eqCost, eqCanBuy, sitesOpen, unplacedCount } from '../sim';
import { icon } from './icons';

type Target = [sel: string, text: string, opts?: string];

export function guideTarget(g: Ctx, tab: string | null): Target | null {
  const s = g.s, t = s.tut; if (t.done || s.gen.runs || s.tier > 0) return null;
  const st = story(g), seen = t.seen, dish = s.dishes[0];
  if (st.step >= 5 && seen.brew && seen.brewed) { t.done = true; return null; }
  if (!tab) {
    if (s.cycles === 0 && !dish.ready && (s.st.stir || 0) < 3) return ['.vwrap', 'Tap the dish to stir it along', 'in'];
    if (dish.ready && !s.res.auto) { if (s.cycles === 0) return ['.harvest', 'Harvest your first colonies']; if (s.cycles < 3) return ['.harvest', 'Harvest again', 'soft']; }
    if (clinicHas(g)) return ['.tabs button[data-tab="clinic"]', `Deliver to ${curStep(g)!.who}`];
    if (!seen.clinic && s.cycles >= 1) return ['.tabs button[data-tab="clinic"]', 'Someone at the Clinic needs you'];
    if (unlocked(g, 'field') && !seen.field) return ['.sbtn[data-tab="field"]', 'The Mayor gave you a map. Send a trip'];
    if (unlocked(g, 'field') && !s.trip && !(s.st.trip || 0) && sitesOpen(g).length) return ['.sbtn[data-tab="field"]', 'Send a trip to the pond for Notes'];
    if (!seen.buy && eqCanBuy(g, 'dish')) return ['.tabs button[data-tab="lab"]', eqCost(g, 'dish').notes ? 'You have Notes. Rank up the Petri dish' : 'The Lab bench: your first Petri dish rank is free'];
    if (unlocked(g, 'quests') && !seen.quests) return ['.sbtn[data-tab="quests"]', 'Quests pay for things you already do'];
    if (unlocked(g, 'lab') && !seen.research) return ['.tabs button[data-tab="lab"]', 'Doc Ferro opened research. Try some'];
    if (unlocked(g, 'brew') && !seen.brew) return ['.sbtn[data-tab="brew"]', 'The kettle: samples from the Shelf become medicine'];
    if (unlocked(g, 'decor') && !seen.decor && unplacedCount(g) > 0) return ['.decorbar', 'Place your artifact on the shelf'];
    if (st.step < 5 && !clinicHas(g) && s.cycles >= 3 && (s.st.stir || 0) < 12 && !dish.ready) return ['.vwrap', 'Tapping the dish speeds it up', 'in soft'];
    return null;
  }
  if (tab === 'clinic' && clinicHas(g)) return ['.tabbody [data-act="deliver"]', `Deliver to ${curStep(g)!.who}`];
  if (tab === 'field' && !s.trip && !(s.st.trip || 0)) return ['.tabbody [data-act="trip"]', 'Send them to the pond'];
  // prompts inside a panel only point at things the player can do right now
  // the Lab has two tabs: a selector that matches the tab button while the other tab is showing, else the row
  if (tab === 'lab' && !seen.buy && eqCanBuy(g, 'dish')) return ['.tabbody [data-sub="bench"]:not([aria-selected="true"]), .tabbody [data-act="eq"][data-k="dish"]', 'Rank up the Petri dish for rarer strains'];
  if (tab === 'lab' && unlocked(g, 'lab') && !seen.res && !s.active) return ['.tabbody [data-sub="research"]:not([aria-selected="true"]), .tabbody .r[data-act="research"]:not(.poor)', 'Start your first research'];
  if (tab === 'brew' && !s.brew && !seen.brewed) return ['.tabbody [data-act="brew"]:not([disabled])', 'Brew it'];
  return null;
}

export class Guide {
  el: HTMLDivElement; private hand: HTMLDivElement; private spot: HTMLDivElement; private blocks: HTMLDivElement[]; private key = '';
  constructor(private g: Ctx, private root: HTMLElement, private currentTab: () => string | null, private covered: () => boolean = () => false) {
    this.el = document.createElement('div'); this.el.className = 'guide';
    this.el.innerHTML = `<div class="gb"></div><div class="gb"></div><div class="gb"></div><div class="gb"></div><div class="spot" hidden></div><div class="hand" hidden><span class="hp">${icon('hand')}</span><b class="hc"><span class="ht"></span><i class="hx">✕</i></b></div>`;
    this.hand = this.el.querySelector('.hand')!; this.spot = this.el.querySelector('.spot')!; this.blocks = Array.from(this.el.querySelectorAll<HTMLDivElement>('.gb'));
    for (const b of this.blocks) b.hidden = true;
    this.el.querySelector('.hx')!.addEventListener('click', () => { g.s.tut.done = true; this.hide(); g.emit({ type: 'toast', msg: 'Guide off. Five taps on the sign can bring it back.' }); });
  }
  private hide() { if (!this.hand.hidden) this.hand.hidden = true; if (!this.spot.hidden) this.spot.hidden = true; for (const b of this.blocks) if (!b.hidden) b.hidden = true; this.key = ''; }
  private dim(el: HTMLElement, r: DOMRect) {
    const base = this.root.getBoundingClientRect(); const W = base.width, H = base.height, pad = 4;
    // the ring hugs the tapped thing: a side button's medallion, the dish's circle, otherwise the element's own corners
    const box = el.classList.contains('sbtn') ? el.querySelector<HTMLElement>('span')! : el; if (box !== el) r = box.getBoundingClientRect();
    const rad = box.classList.contains('vwrap') ? '50%' : `${(parseFloat(getComputedStyle(box).borderTopLeftRadius) || 8) + pad}px`;
    const x0 = Math.max(0, r.left - base.left - pad), y0 = Math.max(0, r.top - base.top - pad), x1 = Math.min(W, r.right - base.left + pad), y1 = Math.min(H, r.bottom - base.top + pad);
    const set = (b: HTMLElement, l: number, t: number, w: number, h: number) => { b.style.left = l + 'px'; b.style.top = t + 'px'; b.style.width = Math.max(0, w) + 'px'; b.style.height = Math.max(0, h) + 'px'; if (b.hidden) b.hidden = false; };
    set(this.blocks[0], 0, 0, W, y0); set(this.blocks[1], 0, y1, W, H - y1); set(this.blocks[2], 0, y0, x0, y1 - y0); set(this.blocks[3], x1, y0, W - x1, y1 - y0);
    this.spot.style.left = x0 + 'px'; this.spot.style.top = y0 + 'px'; this.spot.style.width = (x1 - x0) + 'px'; this.spot.style.height = (y1 - y0) + 'px'; this.spot.style.borderRadius = rad; if (this.spot.hidden) this.spot.hidden = false;
  }
  /** cheap: runs on the live pass */
  tick() {
    if (this.covered()) { this.hide(); return; } // a sheet (results, ad, picker) is on top; never dim it out of reach
    const tab = this.currentTab(); const t = guideTarget(this.g, tab); const el = t && this.root.querySelector<HTMLElement>(t[0]);
    if (!el) { this.hide(); return; }
    const r = el.getBoundingClientRect(); if (!r.width || !r.height) { this.hide(); return; }
    if (tab) { const body = this.root.querySelector('.tabbody'); if (body && el.closest('.tabbody')) { const tb = body.getBoundingClientRect(); if (r.top < tb.top - 4 || r.bottom > tb.bottom + 4) { this.hide(); return; } } }
    const key = t[0] + '|' + t[1]; if (key !== this.key) { this.key = key; this.hand.querySelector('.ht')!.textContent = t[1]; }
    const opts = t[2] || ''; const soft = /soft/.test(opts) || (el as HTMLButtonElement).disabled || el.classList.contains('poor') || el.classList.contains('locked');
    if (soft) { for (const b of this.blocks) if (!b.hidden) b.hidden = true; if (!this.spot.hidden) this.spot.hidden = true; } else this.dim(el, r);
    const base = this.root.getBoundingClientRect(); const H = base.height;
    const above = (r.top + r.height / 2 - base.top) > H * .62 || tab === 'clinic' || tab === 'lab' || tab === 'up' || tab === 'field' || tab === 'brew';
    const inside = /in/.test(opts); this.hand.classList.toggle('up', above);
    const x = r.left + r.width / 2 - base.left; const y = inside ? r.top + r.height * .55 - base.top : above ? r.top - 4 - base.top : r.bottom + 4 - base.top;
    this.hand.style.left = x + 'px'; if (above) { this.hand.style.top = 'auto'; this.hand.style.bottom = (H - y) + 'px'; } else { this.hand.style.bottom = 'auto'; this.hand.style.top = y + 'px'; }
    if (this.hand.hidden) this.hand.hidden = false;
    // the caption is centred on the target; near a screen edge it slides sideways so it stays readable
    const cap = this.hand.querySelector<HTMLElement>('.hc')!, cw = cap.offsetWidth / 2, pad = 6;
    const shift = Math.max(pad + cw - x, Math.min(0, base.width - pad - cw - x));
    cap.style.transform = shift ? `translateX(${shift}px)` : '';
  }
}
