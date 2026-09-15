// The two station scenes: the Apothecary's copper kettle and Doc Ferro's Splice-o-matic. Canvas, tap targets, particles.
import { HYBRIDS, HYB } from '../data';
import type { Ctx, Medicine } from '../sim';
import { item, medsRelevant, medHave } from '../sim';
import { drawCritter, roundRectPath, INK } from './critter';

type C = CanvasRenderingContext2D;
const easeBack = (k: number) => { const s = 1.70158; k = k - 1; return Math.max(0, k * k * ((s + 1) * k + s) + 1); };
const inR = (x: number, y: number, r: { x: number; y: number; w: number; h: number }) => x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h;
export function medCol(id: string) { let h = 0; for (const ch of id) h = (h * 31 + ch.charCodeAt(0)) % 360; return `hsl(${h},72%,58%)`; }
function bottle(c: C, x: number, y: number, w: number, h: number, col: string, fill: number) {
  c.fillStyle = 'rgba(200,235,250,.55)'; c.strokeStyle = INK; c.lineWidth = 3; c.beginPath(); roundRectPath(c, x, y + h * .22, w, h * .78, 10); c.fill(); c.stroke();
  c.save(); c.beginPath(); roundRectPath(c, x + 2, y + h * .22 + 2, w - 4, h * .78 - 4, 8); c.clip(); c.fillStyle = col; c.fillRect(x, y + h - (h * .78 - 6) * fill - 4, w, h); c.restore();
  c.fillStyle = '#c96d4a'; c.beginPath(); roundRectPath(c, x + w * .3, y, w * .4, h * .26, 4); c.fill(); c.stroke(); c.fillStyle = 'rgba(255,255,255,.55)'; c.fillRect(x + 6, y + h * .3, 5, h * .5);
}
const label = (c: C, s: string, x: number, y: number, size = 12) => { c.fillStyle = '#fff'; c.strokeStyle = INK; c.lineWidth = 3; c.lineJoin = 'round'; c.font = `700 ${size}px Fredoka, sans-serif`; c.textAlign = 'center'; c.textBaseline = 'middle'; c.strokeText(s, x, y); c.fillText(s, x, y); };

// ---------- the Apothecary ----------
const BL = { hearth: { x: 190, y: 372, w: 220, h: 76 }, rack: Array.from({ length: 6 }, (_, k) => ({ x: 36 + k * 106, y: 456, w: 90, h: 86 })), therm: { x: 70, y: 120, h: 230 }, bottle: { x: 552, y: 322, w: 64, h: 104 }, fire: { x: 230, y: 340, w: 140, h: 100 } };
export class BrewScene {
  canvas = document.createElement('canvas'); private c: C; sel: string | null = null; private stokes: number[] = []; private last = 0;
  constructor(private g: Ctx) { this.canvas.width = 704; this.canvas.height = 552; this.canvas.className = 'scene'; this.c = this.canvas.getContext('2d')!; }
  /** what a tap hits: a rack slot's medicine id, the fire, or nothing */
  hit(px: number, py: number): { kind: 'rack'; id: string } | { kind: 'fire' } | null {
    const r = this.canvas.getBoundingClientRect(); const x = px / r.width * 704, y = py / r.height * 552;
    const list = medsRelevant(this.g); for (let k = 0; k < BL.rack.length; k++) if (inR(x, y, BL.rack[k]) && list[k]) return { kind: 'rack', id: list[k].id };
    if (inR(x, y, BL.fire)) return { kind: 'fire' };
    return null;
  }
  stoke(now: number) { this.stokes.push(now); }
  draw(now: number) {
    if (now - this.last < 40) return; this.last = now;
    const c = this.c, W = 704, H = 552, t = now / 1000, L = BL, s = this.g.s, b = s.brew, p = b ? 1 - b.left / b.total : 0, selId = b ? b.id : this.sel, col = selId ? medCol(selId) : '#9fdcd3';
    c.clearRect(0, 0, W, H);
    c.fillStyle = '#5a3a1e'; c.strokeStyle = INK; c.lineWidth = 6; c.beginPath(); roundRectPath(c, 16, 24, W - 32, H - 48, 36); c.fill(); c.stroke();
    c.fillStyle = 'rgba(255,255,255,.06)'; for (let y = 60; y < H - 40; y += 46) c.fillRect(24, y, W - 48, 2);
    c.fillStyle = '#ffd166'; c.strokeStyle = INK; c.lineWidth = 4; c.beginPath(); roundRectPath(c, 252, 28, 200, 34, 10); c.fill(); c.stroke(); c.fillStyle = INK; c.font = '700 17px Fredoka, sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('COPPER KETTLE Mk II', 352, 46);
    // thermometer
    c.fillStyle = '#fff6dc'; c.strokeStyle = INK; c.lineWidth = 4; c.beginPath(); roundRectPath(c, L.therm.x - 10, L.therm.y, 20, L.therm.h, 10); c.fill(); c.stroke(); c.beginPath(); c.arc(L.therm.x, L.therm.y + L.therm.h + 4, 16, 0, 7); c.fill(); c.stroke();
    const lvl = b ? .15 + .8 * p : .08 + .03 * Math.sin(t * 2); c.fillStyle = '#e63946'; c.beginPath(); c.arc(L.therm.x, L.therm.y + L.therm.h + 4, 11, 0, 7); c.fill(); c.fillRect(L.therm.x - 5, L.therm.y + L.therm.h - lvl * L.therm.h, 10, lvl * L.therm.h + 4);
    c.strokeStyle = INK; c.lineWidth = 2; for (let k = 0; k < 6; k++) { const y = L.therm.y + 16 + k * (L.therm.h - 32) / 5; c.beginPath(); c.moveTo(L.therm.x + 12, y); c.lineTo(L.therm.x + 20, y); c.stroke(); }
    // hearth
    c.fillStyle = '#7a3b2a'; c.strokeStyle = INK; c.lineWidth = 4; c.beginPath(); roundRectPath(c, L.hearth.x, L.hearth.y, L.hearth.w, L.hearth.h, 12); c.fill(); c.stroke();
    c.strokeStyle = 'rgba(0,0,0,.25)'; c.lineWidth = 3; for (let r = 0; r < 4; r++) { const y = L.hearth.y + 16 + r * 18; c.beginPath(); c.moveTo(L.hearth.x + 4, y); c.lineTo(L.hearth.x + L.hearth.w - 4, y); c.stroke(); for (let k = 0; k < 6; k++) { const x = L.hearth.x + (k + (r % 2) * .5) * 36 + 10; c.beginPath(); c.moveTo(x, y - 18); c.lineTo(x, y); c.stroke(); } }
    c.fillStyle = '#2a1408'; c.beginPath(); roundRectPath(c, L.hearth.x + 30, L.hearth.y - 34, L.hearth.w - 60, 78, 30); c.fill();
    c.strokeStyle = '#4a2a12'; c.lineWidth = 12; c.lineCap = 'round'; c.beginPath(); c.moveTo(250, 428); c.lineTo(350, 418); c.moveTo(262, 418); c.lineTo(340, 430); c.stroke();
    const heat = b ? 1 : .55; const glow = c.createRadialGradient(300, 400, 10, 300, 400, 120 * heat); glow.addColorStop(0, `rgba(255,150,40,${.45 * heat})`); glow.addColorStop(1, 'rgba(255,150,40,0)'); c.fillStyle = glow; c.fillRect(150, 280, 300, 180);
    for (let k = 0; k < 5; k++) { const fx = 262 + k * 19, fl = Math.random(); const h = (34 + 26 * heat) * (.7 + .5 * Math.sin(t * 9 + k * 2) + .2 * fl); c.fillStyle = k % 2 ? '#ff9f1c' : '#ffd166'; c.beginPath(); c.moveTo(fx - 12, 424); c.quadraticCurveTo(fx - 14, 424 - h * .5, fx + (Math.random() - .5) * 6, 424 - h); c.quadraticCurveTo(fx + 14, 424 - h * .5, fx + 12, 424); c.closePath(); c.fill(); c.fillStyle = '#ff5c3a'; c.beginPath(); c.moveTo(fx - 6, 424); c.quadraticCurveTo(fx - 7, 424 - h * .3, fx, 424 - h * .5); c.quadraticCurveTo(fx + 7, 424 - h * .3, fx + 6, 424); c.closePath(); c.fill(); }
    this.stokes = this.stokes.filter(s0 => now - s0 < 500); for (const s0 of this.stokes) { const k = (now - s0) / 500; c.fillStyle = `rgba(255,220,120,${.8 * (1 - k)})`; for (let i = 0; i < 6; i++) { c.beginPath(); c.arc(300 + (i - 2.5) * 22, 400 - k * 90 - i * 7, 4 - k * 3, 0, 7); c.fill(); } }
    // cauldron
    c.fillStyle = '#2b2b30'; c.strokeStyle = INK; c.lineWidth = 5; c.beginPath(); c.moveTo(196, 262); c.quadraticCurveTo(190, 372, 300, 372); c.quadraticCurveTo(410, 372, 404, 262); c.closePath(); c.fill(); c.stroke();
    c.fillStyle = '#3a3a42'; c.beginPath(); c.ellipse(300, 262, 112, 26, 0, 0, 7); c.fill(); c.stroke();
    c.save(); c.beginPath(); c.ellipse(300, 262, 100, 20, 0, 0, 7); c.clip(); c.fillStyle = col; c.fillRect(190, 230, 220, 60); c.fillStyle = 'rgba(255,255,255,.35)'; c.beginPath(); c.ellipse(270, 256, 40, 8, 0, 0, 7); c.fill();
    if (b) for (let k = 0; k < 8; k++) { const u = ((t * .7 + k * .13) % 1); c.fillStyle = 'rgba(255,255,255,.75)'; c.beginPath(); c.arc(215 + ((k * 53) % 170), 268 - u * 10, 3 + (k % 3) - u * 2, 0, 7); c.fill(); }
    c.restore();
    c.strokeStyle = INK; c.lineWidth = 5; c.beginPath(); c.ellipse(300, 262, 112, 26, 0, 0, 7); c.stroke();
    c.lineWidth = 8; c.lineCap = 'round'; c.beginPath(); c.moveTo(184, 270); c.lineTo(168, 250); c.moveTo(416, 270); c.lineTo(432, 250); c.stroke(); c.fillStyle = '#2b2b30'; for (const lx of [236, 300, 364]) { c.beginPath(); roundRectPath(c, lx - 8, 366, 16, 24, 5); c.fill(); c.stroke(); }
    if (b) for (let k = 0; k < 6; k++) { const u = ((t * .35 + k * .17) % 1); c.fillStyle = `rgba(255,255,255,${.5 * (1 - u)})`; c.beginPath(); c.arc(240 + k * 24 + Math.sin(u * 6 + k) * 10, 240 - u * 110, 8 + u * 16, 0, 7); c.fill(); }
    // copper coil to the bottle
    const path: [number, number][] = [[400, 236], [440, 212], [470, 212], [470, 250], [560, 250], [500, 272], [560, 294], [500, 316], [560, 316]];
    const trace = (dy: number) => { c.beginPath(); path.forEach((pt, k) => k ? c.lineTo(pt[0], pt[1] - dy) : c.moveTo(pt[0], pt[1] - dy)); c.stroke(); };
    c.lineCap = 'round'; c.lineJoin = 'round'; c.strokeStyle = INK; c.lineWidth = 16; trace(0); c.strokeStyle = '#d98b45'; c.lineWidth = 9; trace(0); c.strokeStyle = 'rgba(255,230,190,.55)'; c.lineWidth = 3; trace(2);
    if (b) { const segs: [number, number][] = []; let total = 0; for (let k = 1; k < path.length; k++) { const d = Math.hypot(path[k][0] - path[k - 1][0], path[k][1] - path[k - 1][1]); segs.push([total, d]); total += d; } for (let d = 0; d < 3; d++) { const u = ((t * .45 + d * .33) % 1) * total; let k = 0; while (k < segs.length - 1 && u > segs[k][0] + segs[k][1]) k++; const f = Math.min(1, (u - segs[k][0]) / segs[k][1]); c.fillStyle = col; c.strokeStyle = INK; c.lineWidth = 2; c.beginPath(); c.arc(path[k][0] + (path[k + 1][0] - path[k][0]) * f, path[k][1] + (path[k + 1][1] - path[k][1]) * f, 6, 0, 7); c.fill(); c.stroke(); } if (((t * 2) % 1) < .5) { c.fillStyle = col; c.beginPath(); c.arc(578, 330 + ((t * 2) % .5) * 40, 4, 0, 7); c.fill(); } }
    bottle(c, L.bottle.x, L.bottle.y, L.bottle.w, L.bottle.h, col, b ? p : 0);
    label(c, b ? `${b.n} × ${b.id}` : selId ? selId : 'nothing on the fire', L.bottle.x + L.bottle.w / 2, L.bottle.y + L.bottle.h + 14);
    // the rack
    const list = medsRelevant(this.g);
    c.fillStyle = '#8a4f25'; c.strokeStyle = INK; c.lineWidth = 4; c.beginPath(); roundRectPath(c, 24, 448, W - 48, 6, 3); c.fill(); c.stroke();
    L.rack.forEach((r, k) => { const m: Medicine | undefined = list[k]; const selected = m && m.id === selId; c.fillStyle = selected ? 'rgba(255,209,102,.35)' : 'rgba(0,0,0,.18)'; c.strokeStyle = selected ? '#ffd166' : INK; c.lineWidth = selected ? 5 : 3; if (!m) c.setLineDash([8, 6]); c.beginPath(); roundRectPath(c, r.x, r.y, r.w, r.h, 12); c.fill(); c.stroke(); c.setLineDash([]);
      if (m) { const have = medHave(this.g, m.id); bottle(c, r.x + r.w / 2 - 16, r.y + 6, 32, 52, medCol(m.id), have ? 1 : .15); label(c, m.n.length > 12 ? m.n.slice(0, 11) + '…' : m.n, r.x + r.w / 2, r.y + r.h - 12, 11); if (have) { c.fillStyle = '#22d3b0'; c.strokeStyle = INK; c.lineWidth = 2; c.beginPath(); c.arc(r.x + r.w - 12, r.y + 12, 11, 0, 7); c.fill(); c.stroke(); c.fillStyle = INK; c.font = '700 11px Fredoka, sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('×' + have, r.x + r.w - 12, r.y + 12); } }
      else { c.fillStyle = 'rgba(255,255,255,.3)'; c.font = '700 24px Fredoka, sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('?', r.x + r.w / 2, r.y + r.h / 2); } });
  }
}

// ---------- the Splice-o-matic ----------
const ML = { body: { x: 16, y: 24, w: 672, h: 508 }, tubeA: { x: 56, y: 120, w: 104, h: 220 }, tubeB: { x: 544, y: 120, w: 104, h: 220 }, ch: { x: 352, y: 236, r: 104 }, lever: { x: 588, y: 352, w: 100, h: 170 }, gA: { x: 108, y: 74, r: 24 }, gB: { x: 596, y: 74, r: 24 }, lights: { x: 214, y: 76, n: 9, dx: 34 }, pipeA: { x1: 160, y1: 236, x2: 250, y2: 236 }, pipeB: { x1: 544, y1: 236, x2: 454, y2: 236 }, jars: Array.from({ length: 5 }, (_, k) => ({ x: 56 + k * 104, y: 396, w: 88, h: 116 })) };
interface MPart { x: number; y: number; vx: number; vy: number; t0: number; life: number; col: string; r: number; grow?: boolean }
export class SpliceScene {
  canvas = document.createElement('canvas'); private c: C; private parts: MPart[] = []; leverT = -1e9; private last = 0;
  constructor(private g: Ctx) { this.canvas.width = 704; this.canvas.height = 552; this.canvas.className = 'scene'; this.c = this.canvas.getContext('2d')!; }
  hit(px: number, py: number): 'tubeA' | 'tubeB' | 'lever' | 'chamber' | { jar: number } | null {
    const r = this.canvas.getBoundingClientRect(); const x = px / r.width * 704, y = py / r.height * 552, L = ML;
    if (inR(x, y, L.tubeA)) return 'tubeA'; if (inR(x, y, L.tubeB)) return 'tubeB'; if (inR(x, y, L.lever)) return 'lever';
    if (Math.hypot(x - L.ch.x, y - L.ch.y) < L.ch.r) return 'chamber';
    const k = L.jars.findIndex(j => inR(x, y, j)); if (k >= 0) return { jar: k };
    return null;
  }
  burst(col: string) { const ch = ML.ch, t0 = performance.now(); for (let k = 0; k < 26; k++) { const a = Math.random() * 7, sp = 80 + Math.random() * 240; this.parts.push({ x: ch.x, y: ch.y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, t0, life: 900, col: k % 3 ? col : '#fff', r: 4 + Math.random() * 6 }); } }
  smoke() { const ch = ML.ch, t0 = performance.now(); for (let k = 0; k < 14; k++) this.parts.push({ x: ch.x + (Math.random() - .5) * 90, y: ch.y - 50, vx: (Math.random() - .5) * 60, vy: -50 - Math.random() * 70, t0, life: 1400, col: 'rgba(90,90,100,.75)', r: 8 + Math.random() * 10, grow: true }); }
  private gauge(g: { x: number; y: number; r: number }, v: number, col: string) { const c = this.c; v = Math.max(0, Math.min(1, v)); c.fillStyle = '#fff6dc'; c.strokeStyle = INK; c.lineWidth = 4; c.beginPath(); c.arc(g.x, g.y, g.r, 0, 7); c.fill(); c.stroke(); const a0 = Math.PI * .75, a = a0 + Math.PI * 1.5 * v; c.strokeStyle = col; c.lineWidth = 5; c.beginPath(); c.arc(g.x, g.y, g.r - 8, a0, a); c.stroke(); c.strokeStyle = INK; c.lineWidth = 3; c.beginPath(); c.moveTo(g.x, g.y); c.lineTo(g.x + Math.cos(a) * (g.r - 6), g.y + Math.sin(a) * (g.r - 6)); c.stroke(); c.fillStyle = INK; c.beginPath(); c.arc(g.x, g.y, 4, 0, 7); c.fill(); }
  private tube(r: { x: number; y: number; w: number; h: number }, par: [number, number] | null, now: number, p: number, k: number) {
    const c = this.c, t = now / 1000;
    c.fillStyle = 'rgba(190,235,250,.55)'; c.strokeStyle = INK; c.lineWidth = 5; c.beginPath(); roundRectPath(c, r.x, r.y, r.w, r.h, 26); c.fill(); c.stroke();
    const col = par ? item(0, par[0], par[1]).look.col : '#9fdcd3'; const lvl = r.y + r.h * .35 + Math.sin(t * 2 + k) * 3;
    c.save(); c.beginPath(); roundRectPath(c, r.x + 3, r.y + 3, r.w - 6, r.h - 6, 24); c.clip(); c.fillStyle = col + 'aa'; c.fillRect(r.x, lvl, r.w, r.h);
    for (let b = 0; b < 5; b++) { const u = ((t * .4 + b * .23 + k * .5) % 1); c.fillStyle = 'rgba(255,255,255,.7)'; c.beginPath(); c.arc(r.x + 16 + ((b * 37 + k * 11) % (r.w - 32)), r.y + r.h - 8 - u * (r.h - (lvl - r.y) - 8), 3 + b % 3, 0, 7); c.fill(); }
    c.restore();
    c.fillStyle = 'rgba(255,255,255,.55)'; c.beginPath(); roundRectPath(c, r.x + 10, r.y + 12, 10, r.h - 24, 5); c.fill();
    c.fillStyle = '#c96d4a'; c.strokeStyle = INK; c.lineWidth = 4; c.beginPath(); roundRectPath(c, r.x - 6, r.y - 14, r.w + 12, 26, 10); c.fill(); c.stroke();
    if (par) { let sc = 1, dy = 0; if (p >= 0) { sc = Math.max(0, 1 - p / .22); dy = (1 - sc) * 40; } if (sc > .03) drawCritter(c, r.x + r.w / 2, r.y + r.h * .6 + dy, 30 * sc, item(0, par[0], par[1]).look, now, { seed: 7 + k }); }
    else { c.fillStyle = 'rgba(31,61,51,.55)'; c.font = '700 14px Fredoka, sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('TAP', r.x + r.w / 2, r.y + r.h * .58); c.font = '600 12px Fredoka, sans-serif'; c.fillText('to load', r.x + r.w / 2, r.y + r.h * .58 + 17); }
  }
  draw(now: number) {
    if (now - this.last < 40) return; this.last = now;
    const c = this.c, W = 704, H = 552, L = ML, t = now / 1000, s = this.g.s, locked = !s.hasSplicer, sp = s.splice, p = sp ? 1 - sp.left / sp.total : 0;
    c.clearRect(0, 0, W, H); c.save(); if (locked) c.globalAlpha = .4;
    c.fillStyle = '#3a8f86'; c.strokeStyle = INK; c.lineWidth = 6; c.beginPath(); roundRectPath(c, L.body.x, L.body.y, L.body.w, L.body.h, 36); c.fill(); c.stroke();
    c.fillStyle = 'rgba(255,255,255,.08)'; c.beginPath(); roundRectPath(c, L.body.x + 14, L.body.y + 14, L.body.w - 28, 110, 24); c.fill();
    c.fillStyle = 'rgba(0,0,0,.16)'; c.beginPath(); roundRectPath(c, L.body.x + 14, 378, L.body.w - 28, 146, 24); c.fill();
    c.fillStyle = INK; for (const [x, y] of [[40, 48], [W - 40, 48], [40, H - 44], [W - 40, H - 44]]) { c.beginPath(); c.arc(x, y, 5, 0, 7); c.fill(); }
    c.fillStyle = '#ffd166'; c.strokeStyle = INK; c.lineWidth = 4; c.beginPath(); roundRectPath(c, 258, 28, 188, 34, 10); c.fill(); c.stroke(); c.fillStyle = INK; c.font = '700 17px Fredoka, sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('SPLICE-O-MATIC', 352, 46);
    this.gauge(L.gA, sp ? .35 + .5 * p + .1 * Math.sin(t * 22) : .08 + .05 * Math.sin(t * 2), '#ff6b6b');
    this.gauge(L.gB, sp ? p : s.spOut ? 1 : 0, '#22d3b0');
    for (let k = 0; k < L.lights.n; k++) { const on = sp ? ((Math.floor(t * 10) + k) % 3 === 0) : s.spOut ? (Math.floor(t * 4) % 2 === k % 2) : (Math.floor(t * 2) % L.lights.n === k); c.fillStyle = on ? ['#ffd166', '#22d3b0', '#ff6b9d'][k % 3] : '#173a34'; c.strokeStyle = INK; c.lineWidth = 3; c.beginPath(); c.arc(L.lights.x + k * L.lights.dx, L.lights.y, 8, 0, 7); c.fill(); c.stroke(); }
    c.lineCap = 'round'; for (const pp of [L.pipeA, L.pipeB]) { c.strokeStyle = INK; c.lineWidth = 30; c.beginPath(); c.moveTo(pp.x1, pp.y1); c.lineTo(pp.x2, pp.y2); c.stroke(); c.strokeStyle = '#6fb3aa'; c.lineWidth = 20; c.beginPath(); c.moveTo(pp.x1, pp.y1); c.lineTo(pp.x2, pp.y2); c.stroke(); }
    if (sp && p < .3) for (const [pp, par] of [[L.pipeA, sp.a], [L.pipeB, sp.b]] as const) { const col = item(0, par[0], par[1]).look.col; for (let k = 0; k < 3; k++) { const u = ((t * 1.6 + k * .33) % 1); c.fillStyle = col; c.strokeStyle = INK; c.lineWidth = 2; c.beginPath(); c.arc(pp.x1 + (pp.x2 - pp.x1) * u, pp.y1 + Math.sin(u * 9 + k) * 4, 7, 0, 7); c.fill(); c.stroke(); } }
    this.tube(L.tubeA, s.sp[0] || (sp && sp.a) || null, now, sp ? p : -1, 0);
    this.tube(L.tubeB, s.sp[1] || (sp && sp.b) || null, now, sp ? p : -1, 1);
    // chamber
    const ch = L.ch;
    c.fillStyle = '#2a6b64'; c.strokeStyle = INK; c.lineWidth = 5; c.beginPath(); roundRectPath(c, ch.x - 84, ch.y + ch.r - 18, 168, 46, 14); c.fill(); c.stroke();
    c.fillStyle = 'rgba(200,240,255,.5)'; c.beginPath(); c.arc(ch.x, ch.y, ch.r, 0, 7); c.fill();
    c.save(); c.beginPath(); c.arc(ch.x, ch.y, ch.r - 3, 0, 7); c.clip();
    const lvl = ch.y + ch.r * .35 + Math.sin(t * 1.5) * 3; c.fillStyle = 'rgba(159,220,211,.6)'; c.fillRect(ch.x - ch.r, lvl, ch.r * 2, ch.r);
    if (sp) {
      const ca = item(0, sp.a[0], sp.a[1]).look.col, cb = item(0, sp.b[0], sp.b[1]).look.col; c.globalAlpha = .3 + .55 * Math.min(1, p * 1.5);
      for (let k = 0; k < 8; k++) { const a0 = t * (2 + p * 5) + k * Math.PI / 4; c.fillStyle = k % 2 ? ca : cb; c.beginPath(); c.moveTo(ch.x, ch.y); c.arc(ch.x, ch.y, ch.r * (.92 - .12 * Math.sin(t * 3 + k)), a0, a0 + .5); c.closePath(); c.fill(); }
      c.globalAlpha = 1;
      if (p > .08) { const n = 1 + Math.floor(p * 3); for (let k = 0; k < n; k++) { if (Math.random() < .55) continue; c.strokeStyle = k % 2 ? '#fff' : '#ffe066'; c.lineWidth = 3; c.lineJoin = 'round'; c.beginPath(); let x = ch.x + (k % 2 ? 38 : -38), y = ch.y - ch.r + 6; c.moveTo(x, y); for (let q = 0; q < 6; q++) { x += (Math.random() - .5) * 56; y += 18 + Math.random() * 12; c.lineTo(x, y); } c.stroke(); } }
      if (p > .88) { c.fillStyle = `rgba(255,255,255,${(p - .88) / .12 * .9})`; c.fillRect(ch.x - ch.r, ch.y - ch.r, ch.r * 2, ch.r * 2); }
    } else if (s.spOut) {
      const h = HYB[s.spOut.id]; const k = Math.min(1, (now - s.spOut.at) / 600); const gr = c.createRadialGradient(ch.x, ch.y, 10, ch.x, ch.y, ch.r); gr.addColorStop(0, h.look.col + '99'); gr.addColorStop(1, h.look.col + '00'); c.fillStyle = gr; c.fillRect(ch.x - ch.r, ch.y - ch.r, ch.r * 2, ch.r * 2);
      drawCritter(c, ch.x, ch.y + 8, 42 * easeBack(k), h.look, now, { seed: 5, ready: true });
      label(c, 'TAP TO COLLECT', ch.x, ch.y + ch.r - 24 + Math.sin(t * 6) * 3, 15);
    } else for (let b = 0; b < 6; b++) { const u = ((t * .3 + b * .17) % 1); c.fillStyle = 'rgba(255,255,255,.6)'; c.beginPath(); c.arc(ch.x - 60 + b * 24, ch.y + ch.r - 10 - u * (ch.r * .6), 3 + b % 3, 0, 7); c.fill(); }
    c.restore();
    c.strokeStyle = INK; c.lineWidth = 5; c.beginPath(); c.arc(ch.x, ch.y, ch.r, 0, 7); c.stroke();
    c.strokeStyle = 'rgba(255,255,255,.6)'; c.lineWidth = 8; c.lineCap = 'round'; c.beginPath(); c.arc(ch.x, ch.y, ch.r - 16, Math.PI * 1.15, Math.PI * 1.45); c.stroke();
    for (const [x, y] of [[ch.x - 38, ch.y - ch.r - 6], [ch.x + 38, ch.y - ch.r - 6]]) { c.fillStyle = '#c9d3d0'; c.strokeStyle = INK; c.lineWidth = 4; c.beginPath(); roundRectPath(c, x - 10, y - 24, 20, 30, 6); c.fill(); c.stroke(); if (sp) { c.fillStyle = '#ffe066'; c.beginPath(); c.arc(x, y + 8, 5 + Math.random() * 3, 0, 7); c.fill(); } }
    // lever
    const pulled = sp ? 1 : Math.max(0, 1 - (now - this.leverT) / 500);
    c.save(); c.translate(636, 470); c.fillStyle = '#2a6b64'; c.strokeStyle = INK; c.lineWidth = 4; c.beginPath(); c.arc(0, 0, 18, 0, 7); c.fill(); c.stroke(); c.rotate(-.35 + .9 * pulled); c.strokeStyle = INK; c.lineWidth = 16; c.lineCap = 'round'; c.beginPath(); c.moveTo(0, 0); c.lineTo(0, -96); c.stroke(); c.strokeStyle = '#c9d3d0'; c.lineWidth = 8; c.beginPath(); c.moveTo(0, -4); c.lineTo(0, -92); c.stroke(); c.fillStyle = '#ff6b6b'; c.strokeStyle = INK; c.lineWidth = 4; c.beginPath(); c.arc(0, -100, 16, 0, 7); c.fill(); c.stroke(); c.restore();
    c.fillStyle = '#fff'; c.font = '700 11px Fredoka, sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('PULL', 636, 512);
    // jars
    const owned = HYBRIDS.filter(h => s.hyb[h.id]);
    L.jars.forEach((j, k) => { const h = owned[k]; c.fillStyle = h ? 'rgba(200,240,255,.55)' : 'rgba(0,0,0,.15)'; c.strokeStyle = INK; c.lineWidth = 4; if (!h) c.setLineDash([8, 6]); c.beginPath(); roundRectPath(c, j.x, j.y, j.w, j.h, 14); c.fill(); c.stroke(); c.setLineDash([]);
      if (h) { if (s.seed === h.id) { c.strokeStyle = '#22d3b0'; c.lineWidth = 5; c.beginPath(); roundRectPath(c, j.x - 5, j.y - 5, j.w + 10, j.h + 10, 18); c.stroke(); } c.fillStyle = 'rgba(255,255,255,.5)'; c.fillRect(j.x + 8, j.y + 10, 8, 46); drawCritter(c, j.x + j.w / 2, j.y + j.h * .52, 24, h.look, now, { seed: k * 3 }); label(c, h.n, j.x + j.w / 2, j.y + j.h - 14); if (s.seed === h.id) label(c, 'seeded', j.x + j.w / 2, j.y + 12, 10); }
      else { c.fillStyle = 'rgba(255,255,255,.35)'; c.font = '700 28px Fredoka, sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('?', j.x + j.w / 2, j.y + j.h / 2); } });
    this.parts = this.parts.filter(q => now - q.t0 < q.life);
    for (const q of this.parts) { const k = (now - q.t0) / q.life; c.globalAlpha = (1 - k) * (locked ? .4 : 1); c.fillStyle = q.col; c.beginPath(); c.arc(q.x + q.vx * k, q.y + q.vy * k + (q.grow ? 0 : 140 * k * k), q.r * (q.grow ? 1 + k * 2.5 : 1 - k * .5), 0, 7); c.fill(); }
    c.restore();
    if (locked) { c.fillStyle = 'rgba(20,50,44,.55)'; c.beginPath(); roundRectPath(c, L.body.x, L.body.y, L.body.w, L.body.h, 36); c.fill(); label(c, "Doc Ferro's Splice-o-matic", 352, 280, 24); label(c, 'Help the Clinic and it is yours.', 352, 316, 15); }
  }
}
