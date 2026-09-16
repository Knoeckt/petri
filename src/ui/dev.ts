// Playtest cheats behind five taps on the sign. None of this ships in the store build.
import type { Ctx } from '../sim';
import { simulate, tierDef, COUNTS, item, PACES } from '../sim';
import type { Sheet } from './sheet';

export function openDev(g: Ctx, sheet: Sheet, app: { offline: (o: any) => void; toast: (m: string) => void }) {
  const items: [string, string][] = [['cur', '+1000 biomass'], ['notes', '+50 notes'], ['stock', '+4 of everything'], ['tix', '+3 tickets'], ['away', 'Simulate 1 h away'], ['step', 'Next story step'], ['pace', `Pace: ${g.pace.n} → ${PACES[g.pace.id === 'proto' ? 'real' : 'proto'].n}`], ['reset', 'Reset save']];
  sheet.open(`<div class="eyebrow">Dev tools</div><h3>Playtest cheats</h3><p class="sub">Hidden behind five taps on the sign.</p><div class="needs">${items.map(([k, n]) => `<button class="chip ok" data-dev="${k}" style="font-size:12px;padding:6px 10px">${n}</button>`).join('')}</div><div class="acts"><button class="btn primary" data-close>Close</button></div>`, box => {
    box.querySelector<HTMLButtonElement>('[data-close]')!.onclick = () => sheet.close();
    box.querySelectorAll<HTMLButtonElement>('[data-dev]').forEach(b => b.onclick = () => {
      const k = b.dataset.dev, s = g.s;
      if (k === 'cur') s.cur += 1000;
      else if (k === 'notes') s.notes += 50;
      else if (k === 'stock') { const c = s.cat[s.tier] = s.cat[s.tier] || {}; COUNTS.forEach((n, r) => { for (let i = 0; i < n; i++) { const it = item(s.tier, r, i); if (!it.danger || c[`${r}-${i}`]) c[`${r}-${i}`] = (c[`${r}-${i}`] || 0) + 4; } }); }
      else if (k === 'tix') s.tickets += 3;
      else if (k === 'away') { sheet.close(); const sum = simulate(g, 3600, 1); app.offline({ away: 3600, capped: false, eff: 1, sum }); return; }
      else if (k === 'step') { const st = s.story[s.tier]; if (st && !st.done) { st.step++; } }
      else if (k === 'pace') { (window as any).petri?.setPace?.(g.pace.id === 'proto' ? 'real' : 'proto'); return; }
      else if (k === 'reset') { (window as any).petri?.reset?.(); return; }
      g.emit({ type: 'dirty' }); app.toast(`${b.textContent} · ${tierDef(s.tier).n}`);
    });
  });
}
