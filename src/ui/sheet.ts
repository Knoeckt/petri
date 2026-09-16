// The sheet: a small modal for ads, results and pickers. One at a time, dismissed by its own buttons or the scrim.
import { RAR, TEXT } from '../data';
import type { Ctx } from '../sim';
import { adClaim, adReady, adLen, adFree, iapGrant, iapOwned, item, fmt, fmtDur, guardChance, unlocked, IAP_BY, type AdPlacement, type Summary } from '../sim';
import { icon } from './icons';

export class Sheet {
  el: HTMLDivElement; private box: HTMLDivElement; private scrim: HTMLDivElement; busy = false;
  constructor() {
    this.el = document.createElement('div'); this.el.className = 'sheetwrap';
    this.el.innerHTML = `<div class="scrim2"></div><div class="sheet"></div>`;
    this.scrim = this.el.querySelector('.scrim2')!; this.box = this.el.querySelector('.sheet')!;
    this.scrim.onclick = () => { if (!this.busy) this.close(); };
  }
  open(html: string, wire?: (box: HTMLElement) => void) { this.box.innerHTML = html; wire?.(this.box); this.scrim.classList.add('on'); this.box.classList.add('open'); }
  close() { this.busy = false; this.scrim.classList.remove('on'); this.box.classList.remove('open'); }
  get isOpen() { return this.box.classList.contains('open'); }
}

/** the ad label a button shows: the placement text, or the cooldown */
export const adLabel = (g: Ctx, text: string) => `${icon('play', 14)} ${adReady(g) ? text : `Ad in ${Math.ceil(g.s.adCd)}s`}`;

/** plays a stand-in rewarded ad (3 s at prototype pace, 30 s at playtest pace), then claims the reward through the sim */
export function runAd(g: Ctx, sheet: Sheet, placement: AdPlacement, arg?: number, then?: (sum?: Summary) => void) {
  if (sheet.busy || !adReady(g) || (placement === 'ticket' && !unlocked(g, 'tickets'))) return;
  sheet.busy = true; let left = adFree(g) ? 0 : adLen(g);
  const render = () => sheet.open(`<div class="eyebrow">Rewarded ad · ${placement}</div><h3>Advertisement</h3><p class="sub">${adFree(g) ? 'No more ads: the reward is yours straight away.' : `In the real build this is a rewarded video. Here it is ${Math.round(adLen(g))} seconds.`}</p><div class="adbox">YOUR AD HERE<div class="big">${left > 0 ? Math.ceil(left) : '✓'}</div><div class="cd">${left > 0 ? 'reward in ' + Math.ceil(left) + 's' : 'reward ready'}</div></div><div class="acts"><button class="btn primary" data-claim ${left > 0 ? 'disabled' : ''}>Claim reward</button></div>`,
    box => { box.querySelector<HTMLButtonElement>('[data-claim]')!.onclick = () => { if (left > 0) return; sheet.close(); const r = adClaim(g, placement, arg); if (r.ok) then?.(r.sum); }; });
  render();
  const iv = setInterval(() => { left -= 0.1; if (left <= 0) { left = 0; clearInterval(iv); } if (!sheet.isOpen) { clearInterval(iv); return; } render(); }, 100);
}

/** a stand-in for the App Store purchase sheet: confirm, a moment of processing, then the grant through the sim.
 * The native build replaces the middle with StoreKit and keeps the same entry and exit. */
export function runPurchase(g: Ctx, sheet: Sheet, id: string, then?: () => void) {
  const p = IAP_BY[id]; if (!p || sheet.busy || iapOwned(g, id)) return;
  sheet.busy = true; let stage: 'confirm' | 'processing' | 'done' = 'confirm';
  const render = () => sheet.open(`<div class="eyebrow">App Store · stand-in</div><h3>${p.e} ${p.n}</h3><p class="sub">${p.d}</p>
    <div class="adbox">${stage === 'confirm' ? `<div class="big">${p.price}</div><div class="cd">In the real build this is Apple's purchase sheet</div>` : stage === 'processing' ? `<div class="big">…</div><div class="cd">processing</div>` : `<div class="big">✓</div><div class="cd">purchase complete</div>`}</div>
    <div class="acts">${stage === 'confirm' ? `<button class="btn" data-cancel>Cancel</button><button class="btn primary" data-confirm>Buy · ${p.price}</button>` : stage === 'processing' ? `<button class="btn primary" disabled>Processing…</button>` : `<button class="btn primary" data-ok>Continue</button>`}</div>`,
    box => {
      box.querySelector<HTMLButtonElement>('[data-cancel]')?.addEventListener('click', () => { sheet.close(); g.emit({ type: 'toast', msg: 'Purchase cancelled. Nothing was charged.' }); });
      box.querySelector<HTMLButtonElement>('[data-confirm]')?.addEventListener('click', () => { stage = 'processing'; render(); setTimeout(() => { if (!sheet.isOpen) return; iapGrant(g, id); stage = 'done'; render(); }, 1200); });
      box.querySelector<HTMLButtonElement>('[data-ok]')?.addEventListener('click', () => { sheet.close(); then?.(); });
    });
  render();
}

/** the results sheet: what a warp or a stretch away produced */
export function showResults(g: Ctx, sheet: Sheet, title: string, subtitle: string, sum: Summary, offerDouble: boolean, onDouble?: () => void) {
  const finds = sum.finds.map(f => `<span class="chip ok"><i style="background:${RAR[f.r].col}"></i>${item(f.t, f.r, f.i).n}</span>`).join('');
  sheet.open(`<div class="eyebrow">${title}</div><h3>${fmtDur(sum.secs)}</h3><p class="sub">${subtitle}</p>
    <div class="kv"><span>${TEXT.cur} from duplicates</span><span class="good">+${fmt(sum.cur)}</span></div>
    <div class="kv"><span>Cycles</span><span>${sum.cycles}</span></div>
    <div class="kv"><span>${TEXT.drops[0].toUpperCase() + TEXT.drops.slice(1)} collected</span><span>${sum.drops}</span></div>
    ${sum.eaten ? `<div class="kv"><span>Eaten by dangerous strains</span><span class="warn">${sum.eaten}${guardChance(g) >= 1 ? '' : ' · research Antibiotic wash'}</span></div>` : ''}
    <div class="kv"><span>New finds</span><span>${sum.finds.length}</span></div>
    <div class="needs" style="margin:6px 0">${finds}</div>
    <div class="acts">${offerDouble ? `<button class="btn ad" data-double>${adLabel(g, 'Double it')}</button>` : ''}<button class="btn primary" data-ok>OK</button></div>`,
    box => { box.querySelector<HTMLButtonElement>('[data-ok]')!.onclick = () => sheet.close(); const d = box.querySelector<HTMLButtonElement>('[data-double]'); if (d) d.onclick = () => { sheet.close(); setTimeout(() => runAd(g, sheet, 'double offline', sum.cur, () => onDouble?.()), 250); }; });
}
