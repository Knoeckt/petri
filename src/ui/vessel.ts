// The vessel: the canvas the dish lives in. Draws the tier's scenery, the colonies with the critter renderer,
// the growth ring, biters and their bites, particles, the bloom. Owns taps on the dish.
import { ART, HYB, OB_TIME } from '../data';
import type { Ctx, Drop, Bounds } from '../sim';
import { item, cycleTime, contain, collect, flashFinds, stir, hitBloom, spawned } from '../sim';
import { drawCritter, lobed, rrect, INK } from './critter';

type C = CanvasRenderingContext2D;
const lcg = (s: number) => () => (s = (s * 1664525 + 1013904223) % 4294967296) / 4294967296;
const easeBack = (k: number) => { const s = 1.70158; k = k - 1; return Math.max(0, k * k * ((s + 1) * k + s) + 1); };

interface Scene { n: string; shape: 'circle' | 'rect' | 'dome'; bounds: Bounds; seedY: number; slots: [number, number][]; bg(c: C, W: number, H: number): void; draw?(c: C, W: number, H: number, now: number): void; frame(c: C, W: number, H: number): void; cache?: HTMLCanvasElement; extra?: any }
const CIRC: Bounds = { type: 'circle', r: .4 };

/** one scene per named vessel; later tiers reuse the last */
export const SCENES: Scene[] = [
  { n: 'Petri dish', shape: 'circle', bounds: CIRC, seedY: .8, slots: [[.2, .7], [.5, .9], [.8, .7]],
    bg(c, W) { const R = W / 2; const g = c.createRadialGradient(R * .7, R * .6, R * .1, R, R, R); g.addColorStop(0, '#ffd9c7'); g.addColorStop(1, '#f4a988'); c.fillStyle = g; c.fillRect(0, 0, W, W); c.fillStyle = 'rgba(255,255,255,.35)'; c.beginPath(); c.ellipse(R * .62, R * .5, R * .42, R * .2, -.6, 0, 7); c.fill(); c.fillStyle = 'rgba(255,255,255,.18)'; c.beginPath(); c.arc(R * 1.35, R * 1.4, R * .12, 0, 7); c.fill(); },
    frame(c, W) { const R = W / 2; c.strokeStyle = '#7a4a12'; c.lineWidth = 11; c.beginPath(); c.arc(R, R, R - 6, 0, 7); c.stroke(); c.strokeStyle = '#e0a53a'; c.lineWidth = 6; c.beginPath(); c.arc(R, R, R - 6, 0, 7); c.stroke(); c.strokeStyle = 'rgba(255,240,200,.85)'; c.lineWidth = 3; c.lineCap = 'round'; c.beginPath(); c.arc(R, R, R - 6, Math.PI * 1.1, Math.PI * 1.45); c.stroke(); } },
  { n: 'Aquarium', shape: 'rect', bounds: { type: 'rect', minX: .12, maxX: .88, minY: .2, maxY: .78 }, seedY: .76, slots: [[.18, .82], [.5, .86], [.84, .82]],
    bg(c, W, H) { const g = c.createLinearGradient(0, 0, 0, H); g.addColorStop(0, '#c9f2ff'); g.addColorStop(.2, '#7fd3f2'); g.addColorStop(1, '#1d6fa3'); c.fillStyle = g; c.fillRect(0, 0, W, H);
      const gy = H * .85; c.fillStyle = '#d9b877'; c.beginPath(); c.moveTo(0, gy + 6); for (let x = 0; x <= W; x += 20) c.lineTo(x, gy + Math.sin(x / 17) * 4); c.lineTo(W, H); c.lineTo(0, H); c.closePath(); c.fill();
      for (let k = 0; k < 26; k++) { const r = lcg(k * 7 + 1); const p = { x: r(), y: r(), s: 4 + r() * 5, col: ['#b98c55', '#e0c08a', '#8d6b3f', '#c4a3d1', '#9fb7c9'][k % 5] }; c.fillStyle = p.col; c.strokeStyle = 'rgba(60,40,20,.5)'; c.lineWidth = 1.5; c.beginPath(); c.ellipse(p.x * W, gy + 8 + p.y * (H - gy - 10), p.s, p.s * .7, 0, 0, 7); c.fill(); c.stroke(); } },
    draw(c, W, H, now) { const t = now / 1000; const gy = H * .85;
      c.fillStyle = 'rgba(255,255,255,.1)'; for (let k = 0; k < 3; k++) { const x0 = W * (.1 + k * .28) + Math.sin(t * .5 + k) * 14; c.beginPath(); c.moveTo(x0, 0); c.lineTo(x0 + 40, 0); c.lineTo(x0 + 150, H); c.lineTo(x0 + 70, H); c.closePath(); c.fill(); }
      const sy = H * .13; c.fillStyle = '#eafbff'; c.beginPath(); c.moveTo(0, 0); c.lineTo(W, 0); c.lineTo(W, sy); for (let x = W; x >= 0; x -= 12) c.lineTo(x, sy + Math.sin(x / 28 + t * 2) * 3); c.closePath(); c.fill();
      for (const [px, h, ph] of [[.2, .42, 0], [.78, .34, 2], [.3, .25, 4]]) { const bx = W * px, by = gy + 4, sw = Math.sin(t * 1.2 + ph) * 18; c.strokeStyle = '#2e8b57'; c.lineWidth = 7; c.lineCap = 'round'; c.beginPath(); c.moveTo(bx, by); c.bezierCurveTo(bx + sw * .3, by - H * h * .4, bx + sw, by - H * h * .7, bx + sw * 1.2, by - H * h); c.stroke(); c.fillStyle = '#3fae6e'; for (let k = 1; k <= 4; k++) { const u = k / 4, lx = bx + sw * u * u, ly = by - H * h * u; c.beginPath(); c.ellipse(lx + (k % 2 ? 14 : -14), ly, 16, 7, (k % 2 ? -.5 : .5) + sw * .01, 0, 7); c.fill(); } }
      this.extra = this.extra || Array.from({ length: 10 }, (_, k) => { const r = lcg(k * 13 + 5); return { x: r(), s: 2 + r() * 3, o: r(), v: .08 + r() * .1 }; });
      for (const b of this.extra) { const u = ((t * b.v + b.o) % 1), y = gy - u * (gy - sy - 10); c.fillStyle = 'rgba(255,255,255,.5)'; c.strokeStyle = 'rgba(255,255,255,.85)'; c.lineWidth = 1; c.beginPath(); c.arc(b.x * W + Math.sin(u * 10) * 4, y, b.s, 0, 7); c.fill(); c.stroke(); } },
    frame(c, W, H) { c.strokeStyle = '#1b3f4a'; c.lineWidth = 10; rrect(c, 5, 5, W - 10, H - 10, 26); c.stroke(); c.strokeStyle = '#e0a53a'; c.lineWidth = 3; rrect(c, 9, 9, W - 18, H - 18, 22); c.stroke(); c.fillStyle = '#e0a53a'; c.strokeStyle = INK; c.lineWidth = 2; for (const [x, y] of [[18, 18], [W - 18, 18], [18, H - 18], [W - 18, H - 18]]) { rrect(c, x - 9, y - 9, 18, 18, 5); c.fill(); c.stroke(); } } },
  { n: 'Terrarium', shape: 'rect', bounds: { type: 'rect', minX: .12, maxX: .88, minY: .16, maxY: .72 }, seedY: .7, slots: [[.22, .74], [.5, .76], [.8, .74]],
    bg(c, W, H) { const g = c.createLinearGradient(0, 0, 0, H); g.addColorStop(0, '#fbf6de'); g.addColorStop(1, '#d7e8bd'); c.fillStyle = g; c.fillRect(0, 0, W, H);
      const sun = c.createRadialGradient(W * .8, H * .12, 4, W * .8, H * .12, W * .5); sun.addColorStop(0, 'rgba(255,240,170,.85)'); sun.addColorStop(1, 'rgba(255,240,170,0)'); c.fillStyle = sun; c.fillRect(0, 0, W, H);
      c.fillStyle = 'rgba(70,130,60,.45)'; for (const [x, y, r] of [[.15, .62, .16], [.4, .66, .14], [.7, .6, .18], [.9, .68, .12]]) { c.beginPath(); c.arc(W * x, H * y, W * r, 0, 7); c.fill(); }
      const sy = H * .78; c.fillStyle = '#5a3a1e'; c.beginPath(); c.moveTo(0, sy + 4); for (let x = 0; x <= W; x += 18) c.lineTo(x, sy + Math.sin(x / 23) * 4); c.lineTo(W, H); c.lineTo(0, H); c.closePath(); c.fill(); c.strokeStyle = '#8a5a2a'; c.lineWidth = 4; c.beginPath(); for (let x = 0; x <= W; x += 18) { const y = sy + Math.sin(x / 23) * 4; if (x) c.lineTo(x, y); else c.moveTo(x, y); } c.stroke();
      for (const [x, s] of [[.35, 10], [.62, 7], [.12, 8]]) { c.fillStyle = '#9c9a92'; c.strokeStyle = '#5c5a52'; c.lineWidth = 1.5; c.beginPath(); c.ellipse(W * x, sy + 2, s, s * .6, 0, 0, 7); c.fill(); c.stroke(); }
      for (const [x, w] of [[.08, .14], [.45, .12], [.72, .16], [.92, .1]]) { c.fillStyle = '#6fbf5a'; c.strokeStyle = '#3f7d2a'; c.lineWidth = 2; c.beginPath(); c.ellipse(W * x, sy + 2, W * w / 2, 10, 0, Math.PI, 0); c.fill(); c.stroke(); } },
    draw(c, W, H, now) { const t = now / 1000, sy = H * .78;
      const fx = W * .2, fy = sy, sw = Math.sin(t * 1.1) * 6; c.strokeStyle = '#3f8f3a'; c.lineWidth = 4; c.lineCap = 'round'; c.beginPath(); c.moveTo(fx, fy); c.quadraticCurveTo(fx + sw, fy - H * .2, fx + sw * 2, fy - H * .42); c.stroke(); c.fillStyle = '#55b04a'; for (let k = 1; k <= 6; k++) { const u = k / 6, lx = fx + sw * 2 * u * u, ly = fy - H * .42 * u; for (const s of [-1, 1]) { c.beginPath(); c.ellipse(lx + s * 12 * (1 - u * .5), ly, 14 * (1 - u * .4), 5, s * .6, 0, 7); c.fill(); } }
      this.extra = this.extra || Array.from({ length: 14 }, (_, k) => { const r = lcg(k * 3 + 9); return { x: r(), y: r(), v: r() * .02 + .01, ph: r() * 7 }; });
      for (const p of this.extra) { const x = ((p.x + t * p.v) % 1) * W, y = (p.y * .7 + .05) * H + Math.sin(t * .8 + p.ph) * 8; c.fillStyle = 'rgba(255,230,120,.85)'; c.beginPath(); c.arc(x, y, 2.2, 0, 7); c.fill(); } },
    frame(c, W, H) { c.strokeStyle = 'rgba(255,255,255,.7)'; c.lineWidth = 3; rrect(c, 11, 11, W - 22, H - 22, 18); c.stroke(); c.strokeStyle = '#6b4a2a'; c.lineWidth = 9; rrect(c, 5, 5, W - 10, H - 10, 22); c.stroke(); c.fillStyle = '#8a5a2a'; c.strokeStyle = INK; c.lineWidth = 2; rrect(c, W * .3, 0, W * .4, 12, 4); c.fill(); c.stroke(); } },
  { n: 'Biome dome', shape: 'dome', bounds: { type: 'dome', r: .42, maxY: .62 }, seedY: .66, slots: [[.22, .67], [.5, .69], [.78, .67]],
    bg(c, W, H) { const g = c.createLinearGradient(0, 0, 0, H * .72); g.addColorStop(0, '#cdeffc'); g.addColorStop(1, '#eaf8ff'); c.fillStyle = g; c.fillRect(0, 0, W, H);
      c.strokeStyle = 'rgba(60,90,130,.18)'; c.lineWidth = 1.5; const s = 26; for (let row = 0; row < H / (s * .87) + 1; row++) for (let col = 0; col < W / (s * 1.5) + 1; col++) { const x = col * s * 1.5 + (row % 2 ? s * .75 : 0), y = row * s * .87; c.beginPath(); for (let k = 0; k < 6; k++) { const a = k * Math.PI / 3; if (k) c.lineTo(x + Math.cos(a) * s * .5, y + Math.sin(a) * s * .5); else c.moveTo(x + Math.cos(a) * s * .5, y + Math.sin(a) * s * .5); } c.closePath(); c.stroke(); }
      const gy = H * .72; c.fillStyle = '#6fbf5a'; c.fillRect(0, gy, W, H - gy); c.fillStyle = '#4f9a40'; c.fillRect(0, gy + 22, W, H); c.fillStyle = '#8fd77a'; c.beginPath(); c.moveTo(0, gy); for (let x = 0; x <= W; x += 16) c.lineTo(x, gy - 4 + Math.sin(x / 19) * 3); c.lineTo(W, gy + 6); c.lineTo(0, gy + 6); c.closePath(); c.fill();
      for (const [x, h] of [[.18, .16], [.3, .11], [.72, .18], [.84, .12]]) { c.fillStyle = '#5a3a1e'; c.fillRect(W * x - 3, gy - H * h * .3, 6, H * h * .3 + 4); c.fillStyle = '#2f8f4a'; c.strokeStyle = '#1f5f30'; c.lineWidth = 2; for (let k = 0; k < 3; k++) { const yy = gy - H * h * .3 - k * H * h * .25, ww = W * .05 * (1 - k * .25); c.beginPath(); c.moveTo(W * x - ww, yy); c.lineTo(W * x, yy - H * h * .35); c.lineTo(W * x + ww, yy); c.closePath(); c.fill(); c.stroke(); } } },
    draw(c, W, H, now) { const t = now / 1000, gy = H * .72; for (let k = 0; k < 3; k++) { const x = ((t * .03 + k * .33) % 1) * W * 1.4 - W * .2; c.fillStyle = 'rgba(255,255,255,.35)'; c.beginPath(); c.ellipse(x, gy - 6 - k * 8, 70, 9, 0, 0, 7); c.fill(); } },
    frame(c, W, H) { const R = W / 2; c.strokeStyle = '#3a4a5a'; c.lineWidth = 9; c.beginPath(); c.arc(R, R, R - 5, Math.PI, 0); c.stroke(); c.strokeStyle = 'rgba(255,255,255,.6)'; c.lineWidth = 3; c.lineCap = 'round'; c.beginPath(); c.arc(R, R, R - 12, Math.PI * 1.15, Math.PI * 1.4); c.stroke(); c.fillStyle = '#3a4a5a'; c.strokeStyle = INK; c.lineWidth = 2; rrect(c, 0, H * .72 - 4, W, 14, 6); c.fill(); c.stroke(); c.fillStyle = '#8d9bb5'; rrect(c, 8, H * .72 + 10, W - 16, 10, 5); c.fill(); c.stroke(); } },
  { n: 'Living planet', shape: 'circle', bounds: CIRC, seedY: .8, slots: [[.2, .7], [.5, .9], [.8, .7]],
    bg(c, W, H) { const R = W / 2; const g = c.createRadialGradient(R * .7, R * .6, R * .1, R, R, R); g.addColorStop(0, '#5aa7ff'); g.addColorStop(1, '#123f8a'); c.fillStyle = g; c.fillRect(0, 0, W, H);
      for (let k = 0; k < 6; k++) { const r = lcg(k * 11 + 3); const L = { x: .15 + r() * .7, y: .15 + r() * .7, s: .09 + r() * .12, seed: r() }; c.save(); c.translate(L.x * W, L.y * H); c.fillStyle = '#e9d59a'; lobed(c, L.s * W * 1.12, 6, .22, 0, L.seed * 40); c.fill(); c.fillStyle = '#5cb85c'; lobed(c, L.s * W, 6, .22, 0, L.seed * 40); c.fill(); c.restore(); } },
    draw(c, W, H, now) { const t = now / 1000, R = W / 2;
      this.extra = this.extra || Array.from({ length: 7 }, (_, k) => { const r = lcg(k * 5 + 2); return { y: .1 + r() * .8, s: .05 + r() * .06, v: .01 + r() * .02, o: r(), seed: r() }; });
      c.fillStyle = 'rgba(255,255,255,.75)'; for (const cl of this.extra) { const x = ((cl.o + t * cl.v) % 1.3 - .15) * W; c.save(); c.translate(x, cl.y * H); lobed(c, cl.s * W, 4, .3, t, cl.seed * 30); c.fill(); c.restore(); }
      const a = c.createRadialGradient(R, R, R * .82, R, R, R); a.addColorStop(0, 'rgba(140,200,255,0)'); a.addColorStop(1, 'rgba(140,200,255,.75)'); c.fillStyle = a; c.fillRect(0, 0, W, H); },
    frame(c, W) { const R = W / 2; c.strokeStyle = 'rgba(160,210,255,.9)'; c.lineWidth = 6; c.beginPath(); c.arc(R, R, R - 4, 0, 7); c.stroke(); } },
  { n: 'Cosmos', shape: 'circle', bounds: CIRC, seedY: .8, slots: [[.2, .7], [.5, .9], [.8, .7]],
    bg(c, W, H) { const R = W / 2; const g = c.createRadialGradient(R, R, R * .1, R, R, R); g.addColorStop(0, '#3a1f6e'); g.addColorStop(1, '#0a0618'); c.fillStyle = g; c.fillRect(0, 0, W, H);
      for (const [x, y, col] of [[.3, .4, 'rgba(255,90,160,.35)'], [.7, .6, 'rgba(90,160,255,.35)'], [.5, .75, 'rgba(255,200,90,.25)']] as [number, number, string][]) { const n = c.createRadialGradient(x * W, y * H, 0, x * W, y * H, W * .35); n.addColorStop(0, col); n.addColorStop(1, 'rgba(0,0,0,0)'); c.fillStyle = n; c.fillRect(0, 0, W, H); } },
    draw(c, W, _H, now) { const t = now / 1000, R = W / 2; for (let arm = 0; arm < 2; arm++) for (let k = 0; k < 70; k++) { const u = k / 70, a = u * Math.PI * 3 + arm * Math.PI + t * .15, r = R * .1 + u * R * .85; c.fillStyle = `rgba(255,255,255,${.25 + .6 * (1 - u)})`; c.beginPath(); c.arc(R + Math.cos(a) * r, R + Math.sin(a) * r * .8, 1.2 + (1 - u) * 2, 0, 7); c.fill(); } c.fillStyle = 'rgba(255,255,255,.9)'; c.beginPath(); c.arc(R, R, 8, 0, 7); c.fill(); },
    frame(c, W) { const R = W / 2; c.strokeStyle = 'rgba(200,160,255,.7)'; c.lineWidth = 5; c.beginPath(); c.arc(R, R, R - 4, 0, 7); c.stroke(); } },
];
export const sceneFor = (tier: number) => SCENES[Math.min(tier, SCENES.length - 1)];

function vesselPath(c: C, shape: Scene['shape'], W: number, H: number) {
  c.beginPath();
  if (shape === 'circle') c.arc(W / 2, H / 2, W / 2 - 2, 0, 7);
  else if (shape === 'rect') { rrect(c, 6, 6, W - 12, H - 12, 26); }
  else { const R = W / 2; c.moveTo(2, H * .72 + 10); c.lineTo(2, R); c.arc(R, R, R - 2, Math.PI, 0); c.lineTo(W - 2, H * .72 + 10); c.closePath(); }
}
function sceneBg(V: Scene, W: number, H: number) {
  if (!V.cache || V.cache.width !== W) { const c = document.createElement('canvas'); c.width = W; c.height = H; V.bg(c.getContext('2d')!, W, H); V.cache = c; }
  return V.cache;
}

interface Part { x: number; y: number; vx: number; vy: number; t0: number; col: string; r: number }
interface Ripple { x: number; y: number; t: number; col: string; w: number }

export interface VesselOpts { onHarvest?: () => void; onStir?: () => void }

/** The vessel view. Mount `el`; call `draw(now)` from the frame loop (it caps its own rate). */
export class VesselView {
  el: HTMLDivElement; canvas: HTMLCanvasElement;
  private c: C; private W = 360; private parts: Part[] = []; private ripples: Ripple[] = [];
  private shakeT = -1e9; private lastDraw = 0; private hitAt = -1e9;
  private ambient = Array.from({ length: 4 }, (_, k) => { const r = lcg(k * 17 + 3); return { x: .3 + r() * .4, s: 2 + r() * 2, o: r() }; });
  private unsub: () => void;

  constructor(private g: Ctx, private opts: VesselOpts = {}) {
    this.el = document.createElement('div'); this.el.className = 'vwrap';
    this.canvas = document.createElement('canvas'); this.canvas.width = this.canvas.height = this.W; this.el.appendChild(this.canvas);
    this.c = this.canvas.getContext('2d')!;
    this.applyTier();
    this.canvas.addEventListener('pointerdown', e => this.tap(e));
    this.unsub = g.on(e => {
      if (e.type === 'chomp') this.chomp(e.x * this.W, e.y * this.W, e.col);
      else if (e.type === 'ripple') this.ripples.push({ x: this.W * .5, y: this.W * .45, t: performance.now(), col: e.col, w: 10 });
      else if (e.type === 'ascend' || e.type === 'genesis') this.applyTier();
    });
  }
  destroy() { this.unsub(); }

  /** the sim needs to know the vessel's shape to keep critters inside it */
  applyTier() { const V = sceneFor(this.g.s.tier); this.g.bounds = V.bounds; this.el.dataset.shape = V.shape; }
  jelly() { this.el.classList.remove('jelly'); void this.el.offsetWidth; this.el.classList.add('jelly'); }

  private chomp(x: number, y: number, col: string) {
    this.shakeT = performance.now(); this.ripples.push({ x, y, t: this.shakeT, col: '#ff2e4d', w: 7 });
    for (let k = 0; k < 12; k++) { const a = Math.random() * Math.PI * 2, sp = 60 + Math.random() * 160; this.parts.push({ x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - 60, t0: this.shakeT, col: k % 3 ? col : '#fff', r: 3 + Math.random() * 4 }); }
  }
  private burst(x: number, y: number, cols: string[], n = 8) {
    const now = performance.now();
    for (let k = 0; k < n; k++) { const a = Math.random() * Math.PI * 2, sp = 40 + Math.random() * 120; this.parts.push({ x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - 40, t0: now, col: cols[k % cols.length], r: 2 + Math.random() * 3 }); }
  }

  private dropSize(d: Drop) { return .058 * this.W * d.s * (1 + d.r * .28); }

  private tap(e: PointerEvent) {
    const g = this.g, s = g.s, d = s.dishes[0], W = this.W, now = performance.now();
    const rect = this.canvas.getBoundingClientRect(); const x = (e.clientX - rect.left) / rect.width * W, y = (e.clientY - rect.top) / rect.height * W;
    if (s.ob) { if (Math.hypot(x - W * .5, y - W * .45) < W * .3) { hitBloom(g); this.hitAt = now; this.ripples.push({ x, y, t: now, col: '#ff2e4d', w: 4 }); this.burst(x, y, ['#22222c', '#ff2e4d'], 4); } return; }
    if (d.ready) { flashFinds(g, collect(g, 0)); this.burst(W * .5, W * .5, ['#ffd43b', '#fff', '#22d3b0'], 14); this.jelly(); this.opts.onHarvest?.(); return; }
    const prog = d.p / cycleTime(g);
    let hit: Drop | null = null, hd = 1e9;
    for (const dr of d.drops) { if (dr.dead || !spawned(dr, prog)) continue; const dd = Math.hypot(dr.x * W - x, dr.y * W - y); if (dd < this.dropSize(dr) * 1.7 && dd < hd) { hd = dd; hit = dr; } }
    if (hit && item(s.tier, hit.r, hit.i).danger && !hit.contained) { contain(g, hit); this.ripples.push({ x: hit.x * W, y: hit.y * W, t: now, col: '#fff', w: 5 }); return; }
    stir(g); this.jelly(); this.ripples.push({ x, y, t: now, col: 'rgba(255,255,255,.9)', w: 3 }); this.opts.onStir?.();
  }

  draw(now: number, slow = false) {
    if (now - this.lastDraw < (slow ? 83 : 33)) return; this.lastDraw = now;
    const g = this.g, s = g.s, c = this.c, W = this.W, H = W, d = s.dishes[0], ct = cycleTime(g), prog = d.p / ct, V = sceneFor(s.tier);
    this.el.classList.toggle('ready', d.ready);
    c.clearRect(0, 0, W, H);
    c.save();
    if (now - this.shakeT < 240) { const k = 1 - (now - this.shakeT) / 240; c.translate((Math.random() - .5) * 12 * k, (Math.random() - .5) * 12 * k); }
    c.save(); vesselPath(c, V.shape, W, H); c.clip();
    c.drawImage(sceneBg(V, W, H), 0, 0); if (V.draw) V.draw(c, W, H, now);
    // ambient bubbles, a 6 s loop
    if (V.shape === 'circle') for (const b of this.ambient) { const u = ((now / 6000) + b.o) % 1; c.fillStyle = 'rgba(255,255,255,.35)'; c.strokeStyle = 'rgba(255,255,255,.6)'; c.lineWidth = 1; c.beginPath(); c.arc(b.x * W + Math.sin(u * 9) * 5, H * (.85 - u * .7), b.s * (1 + u * .5), 0, 7); c.fill(); c.stroke(); }
    // placed artifacts (drawn as glyphs until the icon set lands)
    s.placed.forEach((p, k) => { const a = p && ART[p.id]; if (!a) return; const [px, py] = V.slots[k]; c.fillStyle = 'rgba(0,0,0,.18)'; c.beginPath(); c.ellipse(px * W, py * H + 12, 16, 6, 0, 0, 7); c.fill(); c.font = '28px sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(a.e, px * W, py * H + Math.sin(now / 600 + k) * 2); if (p.lv > 1) { c.fillStyle = '#ffd43b'; for (let i = 0; i < p.lv; i++) { c.beginPath(); c.arc(px * W + (i - (p.lv - 1) / 2) * 7, py * H + 22, 2.5, 0, 7); c.fill(); } } });
    // the seeded hybrid sits at the bottom
    if (s.seed && HYB[s.seed]) { const sy = H * V.seedY; c.strokeStyle = 'rgba(255,255,255,.55)'; c.lineWidth = 3; c.setLineDash([6, 5]); c.lineDashOffset = -now / 80; c.beginPath(); c.arc(W * .5, sy, W * .08, 0, 7); c.stroke(); c.setLineDash([]); drawCritter(c, W * .5, sy, W * .05, HYB[s.seed].look, now, { seed: 42, ready: d.ready }); }
    // colonies: pop in, grow over the cycle, wander, bite, fade when eaten
    const order = d.drops.slice().sort((a, b) => a.y - b.y);
    for (const dr of order) {
      const life = Math.max(0, Math.min(1, (prog - dr.t0) / .12)); if (life <= 0) continue;
      const it = item(s.tier, dr.r, dr.i), px = dr.x * W, py = dr.y * H;
      const grow = .6 + .4 * Math.max(0, Math.min(1, (prog - dr.t0) / Math.max(.2, 1 - dr.t0)));
      let size = this.dropSize(dr) * easeBack(life) * grow; let alpha = 1;
      if (dr.dead) { const k = Math.min(1, (now - (dr.deadAt || 0)) / 1500); alpha = 1 - .65 * k; size *= 1 - .3 * k; }
      c.globalAlpha = alpha;
      let rot: number | undefined, flip = false; const turns = it.look.shape === 'rod' || it.look.shape === 'spiral';
      if (dr.meet) { if (turns) rot = dr.meet.dir; else flip = Math.cos(dr.meet.dir) < 0; }
      else if (dr.hd !== undefined && !dr.contained && !dr.dead) { if (turns) rot = dr.hd; else flip = Math.cos(dr.hd) < 0; }
      drawCritter(c, px, py, size, it.look, now, { seed: dr.seed, dead: dr.dead, contained: dr.contained, danger: it.danger, atk: dr.atk, frozen: dr.frozen, meet: dr.meet, rot, flip, ready: d.ready });
      c.globalAlpha = 1;
    }
    // the bloom
    if (s.ob) {
      const o = s.ob, pulse = 1 + .06 * Math.sin(now / 120), hit = now - this.hitAt < 120, bx = W * .5, by = H * .45, bs = W * .16 * pulse * (hit ? .88 : 1);
      const g2 = c.createRadialGradient(bx, by, bs * .5, bx, by, bs * 2.6); g2.addColorStop(0, 'rgba(60,0,40,.55)'); g2.addColorStop(1, 'rgba(60,0,40,0)'); c.fillStyle = g2; c.beginPath(); c.arc(bx, by, bs * 2.6, 0, 7); c.fill();
      const bl = o.boss; drawCritter(c, bx, by, bs, item(bl[0], bl[1], bl[2]).look, now, { seed: 9, danger: 3, atk: { phase: 'wind', t0: now - 600, vi: 0, ox: 0, oy: 0 } });
      const bw = W * .5, bh = 16, x0 = bx - bw / 2, y0 = by + bs * 2.1;
      c.fillStyle = '#fff'; c.strokeStyle = INK; c.lineWidth = 3; rrect(c, x0, y0, bw, bh, 8); c.fill(); c.stroke();
      c.fillStyle = '#ff2e4d'; rrect(c, x0 + 2, y0 + 2, Math.max(0, (bw - 4) * o.hp / o.max), bh - 4, 6); c.fill();
      c.font = '700 24px Fredoka, sans-serif'; c.textAlign = 'center'; c.lineWidth = 6; c.lineJoin = 'round'; c.strokeStyle = INK; c.fillStyle = '#fff'; const tl = `${Math.max(0, (o.dur || OB_TIME) - o.t).toFixed(0)}s · TAP IT`; c.strokeText(tl, bx, y0 + 44); c.fillText(tl, bx, y0 + 44);
    }
    // particles and ripples
    this.parts = this.parts.filter(p => now - p.t0 < 700);
    for (const p of this.parts) { const k = (now - p.t0) / 1000; const x = p.x + p.vx * k, y = p.y + p.vy * k + 220 * k * k; c.globalAlpha = Math.max(0, 1 - k / .7); c.fillStyle = p.col; c.strokeStyle = INK; c.lineWidth = 1.5; c.beginPath(); c.arc(x, y, p.r, 0, 7); c.fill(); c.stroke(); }
    c.globalAlpha = 1;
    this.ripples = this.ripples.filter(r => now - r.t < 500);
    for (const r of this.ripples) { const k = (now - r.t) / 500; c.globalAlpha = .75 * (1 - k); c.strokeStyle = r.col; c.lineWidth = r.w; c.beginPath(); c.arc(r.x, r.y, 10 + k * (r.w > 5 ? 90 : 60), 0, 7); c.stroke(); }
    c.globalAlpha = 1;
    c.restore();
    // frame, then the growth ring just inside it
    V.frame(c, W, H); vesselPath(c, V.shape, W, H); c.strokeStyle = INK; c.lineWidth = 3; c.lineJoin = 'round'; c.stroke();
    if (V.shape === 'circle') {
      const R = W / 2, rr = R - 18, a0 = -Math.PI / 2;
      c.lineCap = 'round'; c.lineWidth = 6; c.strokeStyle = 'rgba(31,61,51,.28)'; c.beginPath(); c.arc(R, R, rr, 0, 7); c.stroke();
      c.strokeStyle = d.ready ? '#ffd43b' : '#22d3b0'; c.beginPath(); c.arc(R, R, rr, a0, a0 + Math.PI * 2 * Math.min(1, prog)); c.stroke();
    }
    c.restore();
  }
}
