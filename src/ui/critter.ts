// The part-list critter renderer: a body shape, a face, and optional parts (fuzz, tail, teeth, glow, halo, spots, sparkle).
// Ported from the mockup; the vessel, the catalog and the splicer all draw with this.
import type { Look } from '../data';
import type { Attack, Meet } from '../sim';

export const INK = '#1f3d33';
type C = CanvasRenderingContext2D;

export interface CritterState {
  seed?: number; dead?: boolean; contained?: boolean; danger?: number;
  atk?: Attack | null; frozen?: boolean; meet?: Meet | null;
  rot?: number; flip?: boolean; ready?: boolean; sil?: boolean;
}

export function lighten(hex: string) {
  const n = parseInt(hex.slice(1), 16); const r = (n >> 16) & 255, g = (n >> 8) & 255, b = n & 255;
  return `rgb(${r + (255 - r) * .55 | 0},${g + (255 - g) * .55 | 0},${b + (255 - b) * .55 | 0})`;
}
export function roundRectPath(c: C, x: number, y: number, w: number, h: number, r: number) {
  c.moveTo(x + r, y); c.lineTo(x + w - r, y); c.arcTo(x + w, y, x + w, y + r, r); c.lineTo(x + w, y + h - r); c.arcTo(x + w, y + h, x + w - r, y + h, r);
  c.lineTo(x + r, y + h); c.arcTo(x, y + h, x, y + h - r, r); c.lineTo(x, y + r); c.arcTo(x, y, x + r, y, r); c.closePath();
}
export function rrect(c: C, x: number, y: number, w: number, h: number, r: number) { c.beginPath(); roundRectPath(c, x, y, w, h, r); }
export function lobed(c: C, R: number, lobes: number, amp: number, t: number, seed: number) {
  c.beginPath();
  for (let k = 0; k <= 36; k++) { const a = k / 36 * Math.PI * 2; const rr = R * (1 + amp * Math.sin(a * lobes + seed * 40) + amp * .5 * Math.sin(a * (lobes + 3) + t * 2.5)); if (k) c.lineTo(Math.cos(a) * rr, Math.sin(a) * rr); else c.moveTo(Math.cos(a) * rr, Math.sin(a) * rr); }
  c.closePath();
}

/** draws the body at the origin; returns where the face goes for spiral shapes */
function body(c: C, look: Look, R: number, t: number, seed: number, fill: string, ink: string): [number, number] | undefined {
  c.fillStyle = fill; c.strokeStyle = ink; c.lineWidth = R * .16; c.lineJoin = 'round'; c.lineCap = 'round';
  switch (look.shape) {
    case 'rod': c.beginPath(); roundRectPath(c, -R * 1.25, -R * .6, R * 2.5, R * 1.2, R * .6); c.fill(); c.stroke(); break;
    case 'ring': c.beginPath(); c.arc(0, 0, R, 0, 7); c.moveTo(R * .45, 0); c.arc(0, 0, R * .45, 0, 7, true); c.fill('evenodd'); c.beginPath(); c.arc(0, 0, R, 0, 7); c.stroke(); c.beginPath(); c.arc(0, 0, R * .45, 0, 7); c.stroke(); break;
    case 'dots': for (const [x, y, r] of [[R * .75, R * .35, R * .5], [-R * .7, R * .25, R * .45], [0, -R * .05, R * .8]]) { c.beginPath(); c.arc(x, y, r, 0, 7); c.fill(); c.stroke(); } break;
    case 'spiral': {
      const pts: [number, number][] = [];
      for (let k = 0; k <= 40; k++) { const u = k / 40; const a = u * Math.PI * 2 * 2.2 + t * .8; const rr = R * .15 + u * R * .95; pts.push([Math.cos(a) * rr, Math.sin(a) * rr]); }
      for (const [wd, st] of [[R * .62, ink], [R * .34, fill]] as [number, string][]) { c.strokeStyle = st; c.lineWidth = wd; c.beginPath(); pts.forEach((p, k) => k ? c.lineTo(p[0], p[1]) : c.moveTo(p[0], p[1])); c.stroke(); }
      return pts[pts.length - 1];
    }
    case 'crystal':
      c.beginPath(); for (let k = 0; k < 6; k++) { const a = k / 6 * Math.PI * 2 - Math.PI / 2; const rr = R * (k % 2 ? .95 : 1.1); if (k) c.lineTo(Math.cos(a) * rr, Math.sin(a) * rr); else c.moveTo(Math.cos(a) * rr, Math.sin(a) * rr); } c.closePath(); c.fill(); c.stroke();
      c.strokeStyle = 'rgba(255,255,255,.55)'; c.lineWidth = R * .08; c.beginPath(); c.moveTo(-R * .5, -R * .2); c.lineTo(0, -R * .9); c.lineTo(R * .5, -R * .2); c.stroke(); break;
    case 'star': c.beginPath(); for (let k = 0; k < 16; k++) { const a = k / 16 * Math.PI * 2 + t * .3; const rr = R * (k % 2 ? .72 : 1.15); if (k) c.lineTo(Math.cos(a) * rr, Math.sin(a) * rr); else c.moveTo(Math.cos(a) * rr, Math.sin(a) * rr); } c.closePath(); c.fill(); c.stroke(); break;
    case 'amoeba': lobed(c, R, 5, .16, t, seed); c.fill(); c.stroke(); break;
    default: lobed(c, R, 9, .05, t, seed); c.fill(); c.stroke();
  }
  return undefined;
}

function face(c: C, look: Look, R: number, t: number, seed: number, st: CritterState, ink: string, head?: [number, number]) {
  if (look.shape === 'ring') { c.translate(0, -R * .72); c.scale(.55, .55); }
  else if (look.shape === 'dots') { c.translate(0, -R * .05); c.scale(.8, .8); }
  else if (look.shape === 'spiral' && head) { c.translate(head[0], head[1]); c.scale(.6, .6); }
  else if (look.shape === 'rod') { c.translate(R * .35, 0); c.scale(.85, .85); }
  const eyes = look.eyes === undefined ? 2 : look.eyes;
  const blink = !st.dead && ((t + seed * 7) % 4.2) < .14;
  const pos: [number, number, number][] = eyes === 1 ? [[0, -R * .1, R * .32]] : eyes === 3 ? [[-R * .32, -R * .12, R * .2], [R * .32, -R * .12, R * .2], [0, -R * .5, R * .14]] : [[-R * .3, -R * .15, R * .22], [R * .3, -R * .15, R * .22]];
  for (const [x, y, r] of pos) {
    if (st.dead) { c.strokeStyle = ink; c.lineWidth = R * .1; c.beginPath(); c.moveTo(x - r * .6, y - r * .6); c.lineTo(x + r * .6, y + r * .6); c.moveTo(x + r * .6, y - r * .6); c.lineTo(x - r * .6, y + r * .6); c.stroke(); continue; }
    if (blink) { c.strokeStyle = ink; c.lineWidth = R * .1; c.beginPath(); c.moveTo(x - r, y); c.lineTo(x + r, y); c.stroke(); continue; }
    c.fillStyle = '#fff'; c.strokeStyle = ink; c.lineWidth = R * .08; c.beginPath(); c.arc(x, y, r, 0, 7); c.fill(); c.stroke();
    const px = x + Math.sin(t * 1.3 + seed * 9) * r * .25, py = y + Math.cos(t * 1.1 + seed * 5) * r * .2;
    c.fillStyle = st.danger && !st.contained ? '#e0102a' : ink; c.beginPath(); c.arc(px, py, r * .48, 0, 7); c.fill();
    c.fillStyle = '#fff'; c.beginPath(); c.arc(px - r * .15, py - r * .18, r * .14, 0, 7); c.fill();
    if (st.danger) { c.strokeStyle = ink; c.lineWidth = R * .1; c.beginPath(); const s = x < 0 ? 1 : -1; c.moveTo(x - s * r * .9, y - r * 1.25); c.lineTo(x + s * r * .9, y - r * .85); c.stroke(); }
  }
  const my = R * .3;
  c.strokeStyle = ink; c.lineWidth = R * .1; c.fillStyle = ink;
  if (st.dead) { c.beginPath(); c.arc(0, my, R * .1, 0, 7); c.fill(); }
  else if (look.teeth) {
    const open = st.contained ? .12 : (st.atk && st.atk.phase !== 'back') ? .6 : .28 + .12 * Math.sin(t * 6 + seed * 8);
    c.beginPath(); c.ellipse(0, my, R * .42, R * open * 1.3, 0, 0, 7); c.fill();
    c.fillStyle = '#fff'; for (let k = 0; k < 5; k++) { const x = -R * .34 + k * R * .17; c.beginPath(); c.moveTo(x, my - R * open * 1.1); c.lineTo(x + R * .08, my - R * open * 1.1); c.lineTo(x + R * .04, my - R * open * .3); c.closePath(); c.fill(); }
  }
  else if (st.contained) { c.beginPath(); c.arc(0, my + R * .25, R * .25, Math.PI * 1.15, Math.PI * 1.85); c.stroke(); }
  else { c.beginPath(); c.arc(0, my - R * .05, R * .25, Math.PI * .15, Math.PI * .85); c.stroke(); }
}

export function drawCritter(c: C, x: number, y: number, R: number, look: Look, now: number, st: CritterState, rnd: () => number = Math.random) {
  if (!(R > 0.01)) return;
  const t = now / 1000, seed = st.seed || 0, ink = st.sil ? '#2b4a40' : INK;
  c.save(); c.translate(x, y);
  const bobA = st.meet ? .2 : st.ready ? .14 : .06, bobF = st.meet ? 9 : 3.2;
  const bob = st.dead ? 0 : Math.sin(t * bobF + seed * 10);
  let sx = 1 + bobA * .6 * bob, sy = 1 - bobA * .6 * bob, dx = 0, dy = 0;
  const A = st.atk;
  if (A) { const e = now - A.t0; if (A.phase === 'wind') { const k = Math.min(1, e / 600); sx *= 1 + .3 * k; sy *= 1 + .3 * k; dx = (rnd() - .5) * R * .3 * k; dy = (rnd() - .5) * R * .3 * k; } else if (A.phase === 'lunge') { sx *= 1.4; sy *= .8; } else { sx *= .94; sy *= 1.06; } }
  if (st.frozen) { dx = (rnd() - .5) * R * .16; sy *= .9; sx *= 1.08; }
  c.translate(dx, st.dead ? R * .15 : dy - bob * R * bobA);
  if (st.rot !== undefined) { if (Math.cos(st.rot) < 0) { c.scale(-1, 1); c.rotate(Math.PI - st.rot); } else c.rotate(st.rot); }
  else if (st.flip) c.scale(-1, 1);
  c.scale(sx, sy);
  if (st.sil) { body(c, look, R, 0, seed, '#3b5a4e', ink); c.restore(); return; }
  const col = st.dead ? '#a3aba7' : look.col, col2 = st.dead ? '#cfd5d2' : (look.col2 || lighten(look.col));
  if (look.glow && !st.dead) { const g = c.createRadialGradient(0, 0, R * .4, 0, 0, R * 2.3); g.addColorStop(0, look.col + '77'); g.addColorStop(1, look.col + '00'); c.fillStyle = g; c.beginPath(); c.arc(0, 0, R * 2.3, 0, 7); c.fill(); }
  if (look.halo && !st.dead) { c.strokeStyle = '#fff3b0'; c.lineWidth = R * .14; c.beginPath(); c.arc(0, 0, R * 1.5, 0, 7); c.stroke(); }
  if (look.sparkle && !st.dead) { for (let k = 0; k < 5; k++) { const a = t * 1.4 + k * 1.2566, px = Math.cos(a) * R * 1.75, py = Math.sin(a) * R * 1.75 * .6 - R * .2, s = R * (.16 + .08 * Math.sin(t * 5 + k)); c.fillStyle = k % 2 ? '#fff' : '#ffd23f'; c.beginPath(); c.moveTo(px, py - s); c.quadraticCurveTo(px, py, px + s, py); c.quadraticCurveTo(px, py, px, py + s); c.quadraticCurveTo(px, py, px - s, py); c.quadraticCurveTo(px, py, px, py - s); c.fill(); } }
  if (st.danger && !st.dead && !st.contained) { const g = c.createRadialGradient(0, 0, R * .7, 0, 0, R * 2); g.addColorStop(0, 'rgba(180,0,60,.35)'); g.addColorStop(1, 'rgba(180,0,60,0)'); c.fillStyle = g; c.beginPath(); c.arc(0, 0, R * 2, 0, 7); c.fill(); }
  if (look.tail && !st.dead) { c.strokeStyle = ink; c.lineWidth = R * .16; c.lineCap = 'round'; c.beginPath(); const x0 = look.shape === 'rod' ? -R * 1.2 : -R * .9; c.moveTo(x0, 0); for (let k = 1; k <= 8; k++) { const u = k / 8; c.lineTo(x0 - u * R * 1.3, Math.sin(u * 6 + t * 9 + seed * 5) * R * .3); } c.stroke(); }
  if (look.fuzz) { c.strokeStyle = ink; c.lineWidth = R * .1; c.lineCap = 'round'; for (let k = 0; k < 18; k++) { const a = k / 18 * Math.PI * 2; const w = Math.sin(t * 7 + k * 1.7 + seed * 3) * .25; c.beginPath(); c.moveTo(Math.cos(a) * R * .95, Math.sin(a) * R * .95); c.lineTo(Math.cos(a + w) * R * 1.3, Math.sin(a + w) * R * 1.3); c.stroke(); } }
  const head = body(c, look, R, t, seed, col, ink);
  if (!['ring', 'spiral', 'dots'].includes(look.shape)) { c.fillStyle = col2; c.globalAlpha = .75; c.beginPath(); c.ellipse(look.shape === 'rod' ? -R * .3 : 0, R * .38, look.shape === 'rod' ? R * .7 : R * .5, R * .26, 0, 0, 7); c.fill(); c.globalAlpha = 1; }
  if (look.spots) { c.fillStyle = 'rgba(31,61,51,.35)'; for (const [px, py] of [[-.45, -.35], [.4, -.5], [.15, .05]]) { c.beginPath(); c.arc(px * R, py * R, R * .12, 0, 7); c.fill(); } }
  face(c, look, R, t, seed, st, ink, head);
  c.restore();
  const em = st.meet ? st.meet.em : st.frozen ? '!' : null;
  if (em && !st.dead) { c.save(); c.translate(x, y - R * 2 - Math.abs(Math.sin(t * 7)) * R * .25); c.font = `700 ${R * 1.15}px Fredoka, sans-serif`; c.textAlign = 'center'; c.textBaseline = 'middle'; c.lineWidth = R * .24; c.lineJoin = 'round'; c.strokeStyle = INK; c.strokeText(em, 0, 0); c.fillStyle = st.frozen ? '#ff2e4d' : em === '♥' ? '#ff6b9d' : '#fff'; c.fillText(em, 0, 0); c.restore(); }
  if (st.contained && !st.dead) { c.save(); c.translate(x, y); c.setLineDash([R * .25, R * .18]); c.lineDashOffset = -now / 60; c.strokeStyle = '#fff'; c.lineWidth = R * .14; c.beginPath(); c.arc(0, 0, R * 1.7, 0, 7); c.stroke(); c.strokeStyle = INK; c.lineWidth = R * .06; c.beginPath(); c.arc(0, 0, R * 1.7, 0, 7); c.stroke(); c.restore(); }
}
