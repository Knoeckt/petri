// The sheet: a small modal for ads, results and pickers. One at a time, dismissed by its own buttons or the scrim.
import { RAR, TEXT } from '../data';
import type { Ctx } from '../sim';
import { adClaim, adReady, adLen, item, fmt, fmtDur, guardChance, unlocked, type AdPlacement, type Summary } from '../sim';
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
  sheet.busy = true; let left = adLen(g);
  const render = () => sheet.open(`<div class="eyebrow">Rewarded ad · ${placement}</div><h3>Advertisement</h3><p class="sub">In the real build this is a rewarded video. Here it is ${Math.round(adLen(g))} seconds.</p><div class="adbox">YOUR AD HERE<div class="big">${left > 0 ? Math.ceil(left) : '✓'}</div><div class="cd">${left > 0 ? 'reward in ' + Math.ceil(left) + 's' : 'reward ready'}</div></div><div class="acts"><button class="btn primary" data-claim ${left > 0 ? 'disabled' : ''}>Claim reward</button></div>`,
    box => { box.querySelector<HTMLButtonElement>('[data-claim]')!.onclick = () => { if (left > 0) return; sheet.close(); const r = adClaim(g, placement, arg); if (r.ok) then?.(r.sum); }; });
  render();
  const iv = setInterval(() => { left -= 0.1; if (left <= 0) { left = 0; clearInterval(iv); } if (!sheet.isOpen) { clearInterval(iv); return; } render(); }, 100);
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
