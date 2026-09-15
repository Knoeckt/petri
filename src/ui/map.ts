// The town map for field trips: Mossbrook drawn in the game's hand, marked places, fog over what the story has not opened.
import { SITES, SITE, RAR } from '../data';
import type { Ctx } from '../sim';
import { siteOpen } from '../sim';
import { roundRectPath, lobed, INK } from './critter';

type C = CanvasRenderingContext2D;
const W = 704, H = 600;
/** where each place sits on the map, and the lab */
const POS: Record<string, [number, number]> = { lab: [352, 520], pond: [170, 400], bakery: [540, 330], woods: [190, 150], quarry: [560, 120] };
const lcg = (s: number) => () => (s = (s * 1664525 + 1013904223) % 4294967296) / 4294967296;

export class MapScene {
  canvas = document.createElement('canvas'); private c: C; private last = 0; private bg: HTMLCanvasElement | null = null;
  sel: string | null = null;
  constructor(private g: Ctx) { this.canvas.width = W; this.canvas.height = H; this.canvas.className = 'scene map'; this.c = this.canvas.getContext('2d')!; }
  /** the place a tap lands on */
  hit(px: number, py: number): string | null {
    const r = this.canvas.getBoundingClientRect(); const x = px / r.width * W, y = py / r.height * H;
    for (const s of SITES) { const [sx, sy] = POS[s.id]; if (Math.hypot(x - sx, y - sy) < 58) return s.id; }
    return null;
  }
  private paper() {
    if (this.bg) return this.bg;
    const cv = document.createElement('canvas'); cv.width = W; cv.height = H; const c = cv.getContext('2d')!;
    c.fillStyle = '#f4ead0'; c.fillRect(0, 0, W, H);
    const r = lcg(7); c.fillStyle = 'rgba(120,90,40,.06)'; for (let k = 0; k < 400; k++) { c.beginPath(); c.arc(r() * W, r() * H, 1 + r() * 3, 0, 7); c.fill(); }
    c.strokeStyle = 'rgba(31,61,51,.08)'; c.lineWidth = 1; for (let x = 0; x < W; x += 44) { c.beginPath(); c.moveTo(x, 0); c.lineTo(x, H); c.stroke(); } for (let y = 0; y < H; y += 44) { c.beginPath(); c.moveTo(0, y); c.lineTo(W, y); c.stroke(); }
    // fields and a river
    c.fillStyle = 'rgba(126,217,87,.22)'; for (const [x, y, s, sd] of [[120, 260, 90, 1], [420, 460, 110, 2], [620, 250, 80, 3], [330, 220, 70, 4]] as number[][]) { c.save(); c.translate(x, y); lobed(c, s, 6, .25, 0, sd * 40); c.fill(); c.restore(); }
    c.strokeStyle = 'rgba(90,169,255,.5)'; c.lineWidth = 16; c.lineCap = 'round'; c.beginPath(); c.moveTo(-10, 470); c.bezierCurveTo(120, 440, 150, 380, 240, 360); c.bezierCurveTo(330, 340, 420, 380, 560, 420); c.bezierCurveTo(640, 440, 690, 470, 720, 480); c.stroke();
    c.strokeStyle = 'rgba(255,255,255,.55)'; c.lineWidth = 4; c.beginPath(); c.moveTo(-10, 468); c.bezierCurveTo(120, 438, 150, 378, 240, 358); c.bezierCurveTo(330, 338, 420, 378, 560, 418); c.stroke();
    // roads from the lab
    c.setLineDash([10, 9]); c.strokeStyle = 'rgba(138,90,43,.55)'; c.lineWidth = 5; c.lineCap = 'round';
    for (const s of SITES) { const [x0, y0] = POS.lab, [x1, y1] = POS[s.id]; c.beginPath(); c.moveTo(x0, y0); c.quadraticCurveTo((x0 + x1) / 2 + (x1 < x0 ? -60 : 60), (y0 + y1) / 2, x1, y1); c.stroke(); }
    c.setLineDash([]);
    // title
    c.fillStyle = '#ffd166'; c.strokeStyle = INK; c.lineWidth = 4; c.beginPath(); roundRectPath(c, 252, 18, 200, 34, 10); c.fill(); c.stroke(); c.fillStyle = INK; c.font = '700 17px Fredoka, sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('MOSSBROOK', 352, 36);
    return this.bg = cv;
  }
  private place(c: C, id: string, x: number, y: number, t: number) {
    c.save(); c.translate(x, y); c.strokeStyle = INK; c.lineJoin = 'round'; c.lineCap = 'round';
    if (id === 'lab') { c.fillStyle = '#8a5a2b'; c.fillRect(-8, -10, 16, 44); c.fillStyle = '#c98a4a'; c.lineWidth = 4; c.beginPath(); roundRectPath(c, -34, -40, 68, 40, 8); c.fill(); c.stroke(); c.fillStyle = '#e63946'; c.beginPath(); c.moveTo(-40, -40); c.lineTo(0, -68); c.lineTo(40, -40); c.closePath(); c.fill(); c.stroke(); c.fillStyle = '#22d3b0'; c.beginPath(); c.arc(0, -22, 8, 0, 7); c.fill(); c.stroke(); c.fillStyle = '#5cb85c'; for (const [lx, ly, r] of [[-40, -10, 22], [42, -6, 20]]) { c.beginPath(); c.arc(lx, ly, r, 0, 7); c.fill(); c.stroke(); } }
    else if (id === 'pond') { c.fillStyle = '#5aa9ff'; c.lineWidth = 4; c.beginPath(); c.ellipse(0, 0, 52, 30, 0, 0, 7); c.fill(); c.stroke(); c.fillStyle = 'rgba(255,255,255,.5)'; c.beginPath(); c.ellipse(-14, -8, 18, 7, -.3, 0, 7); c.fill(); c.strokeStyle = '#2e8b57'; c.lineWidth = 3; for (const rx of [-42, -34, 40, 48]) { c.beginPath(); c.moveTo(rx, 4); c.quadraticCurveTo(rx + 3, -18, rx + 1 + Math.sin(t + rx) * 2, -30); c.stroke(); } c.fillStyle = '#fff'; c.strokeStyle = INK; c.lineWidth = 2; c.beginPath(); c.ellipse(16 + Math.sin(t * .7) * 6, 2, 8, 5, 0, 0, 7); c.fill(); c.stroke(); }
    else if (id === 'bakery') { c.fillStyle = '#f4a988'; c.lineWidth = 4; c.beginPath(); roundRectPath(c, -32, -22, 64, 44, 6); c.fill(); c.stroke(); c.fillStyle = '#8a5a2b'; c.beginPath(); c.moveTo(-38, -22); c.lineTo(0, -50); c.lineTo(38, -22); c.closePath(); c.fill(); c.stroke(); c.fillStyle = '#5a3a1a'; c.fillRect(-8, -2, 16, 24); c.fillStyle = '#ffd166'; c.beginPath(); roundRectPath(c, 12, -12, 14, 14, 3); c.fill(); c.stroke(); c.fillStyle = '#5a3a1a'; c.fillRect(16, -46, 10, 16); for (let k = 0; k < 3; k++) { const u = ((t * .3 + k * .33) % 1); c.fillStyle = `rgba(255,255,255,${.6 * (1 - u)})`; c.beginPath(); c.arc(21 + Math.sin(u * 5 + k) * 6, -50 - u * 34, 5 + u * 6, 0, 7); c.fill(); } }
    else if (id === 'woods') { c.lineWidth = 4; for (const [tx, ty, s] of [[-40, 10, 1], [0, -10, 1.3], [38, 12, 1.1], [-18, 26, .9], [22, 30, .95]]) { c.fillStyle = '#5a3a1a'; c.fillRect(tx - 4, ty, 8, 16 * s); c.fillStyle = '#3f8f3a'; for (let k = 0; k < 3; k++) { const w = (30 - k * 7) * s, yy = ty - k * 12 * s; c.beginPath(); c.moveTo(tx - w, yy); c.lineTo(tx, yy - 22 * s); c.lineTo(tx + w, yy); c.closePath(); c.fill(); c.stroke(); } } }
    else if (id === 'quarry') { c.fillStyle = '#9c9a92'; c.lineWidth = 4; c.beginPath(); c.moveTo(-50, 20); c.lineTo(-38, -14); c.lineTo(-10, -30); c.lineTo(26, -26); c.lineTo(50, -2); c.lineTo(46, 22); c.closePath(); c.fill(); c.stroke(); c.fillStyle = '#2a6b64'; c.beginPath(); c.ellipse(4, 6, 28, 12, 0, 0, 7); c.fill(); c.stroke(); c.fillStyle = 'rgba(255,255,255,.35)'; c.beginPath(); c.ellipse(-6, 2, 10, 4, 0, 0, 7); c.fill(); }
    c.restore();
  }
  private fog(c: C, x: number, y: number, seed: number, t: number) {
    const r = lcg(seed);
    for (let k = 0; k < 9; k++) { const dx = (r() - .5) * 150, dy = (r() - .5) * 110, rad = 40 + r() * 40, ph = r() * 7; const gx = x + dx + Math.sin(t * .4 + ph) * 6, gy = y + dy + Math.cos(t * .3 + ph) * 4; const gr = c.createRadialGradient(gx, gy, rad * .2, gx, gy, rad); gr.addColorStop(0, 'rgba(70,90,84,.92)'); gr.addColorStop(1, 'rgba(70,90,84,0)'); c.fillStyle = gr; c.beginPath(); c.arc(gx, gy, rad, 0, 7); c.fill(); }
  }
  draw(now: number) {
    if (now - this.last < 40) return; this.last = now;
    const c = this.c, t = now / 1000, s = this.g.s;
    c.drawImage(this.paper(), 0, 0);
    // the trip in progress: a walker along the road
    if (s.trip) { const [x0, y0] = POS.lab, [x1, y1] = POS[s.trip.site]; const cx = (x0 + x1) / 2 + (x1 < x0 ? -60 : 60), cy = (y0 + y1) / 2; const p = 1 - s.trip.left / s.trip.total; const u = p < .5 ? p * 2 : 2 - p * 2; const px = (1 - u) * (1 - u) * x0 + 2 * (1 - u) * u * cx + u * u * x1, py = (1 - u) * (1 - u) * y0 + 2 * (1 - u) * u * cy + u * u * y1; c.fillStyle = '#ffd166'; c.strokeStyle = INK; c.lineWidth = 3; c.beginPath(); c.arc(px, py - 6 + Math.abs(Math.sin(t * 8)) * -4, 9, 0, 7); c.fill(); c.stroke(); c.fillStyle = INK; c.beginPath(); c.arc(px - 3, py - 7, 1.5, 0, 7); c.arc(px + 3, py - 7, 1.5, 0, 7); c.fill(); }
    this.place(c, 'lab', POS.lab[0], POS.lab[1], t);
    for (const site of SITES) { const [x, y] = POS[site.id]; const open = siteOpen(this.g, site.id);
      this.place(c, site.id, x, y, t);
      if (this.sel === site.id && open) { c.strokeStyle = '#ffd43b'; c.lineWidth = 5; c.setLineDash([8, 6]); c.lineDashOffset = -now / 40; c.beginPath(); c.arc(x, y, 62, 0, 7); c.stroke(); c.setLineDash([]); }
      if (!open) { this.fog(c, x, y, site.id.length * 13, t); c.fillStyle = '#fff6dc'; c.strokeStyle = INK; c.lineWidth = 3; c.beginPath(); roundRectPath(c, x - 10, y - 8, 20, 16, 4); c.fill(); c.stroke(); c.beginPath(); c.arc(x, y - 9, 6, Math.PI, 0); c.stroke(); }
      // label
      const lbl = open ? site.n : `opens ${site.unlock[0] > s.tier ? 'at tier ' + (site.unlock[0] + 1) : 'after ' + (site.unlock[0] + 1) + '-' + site.unlock[1]}`;
      c.font = '700 14px Fredoka, sans-serif'; const w = c.measureText(lbl).width + 16; c.fillStyle = open ? '#fff6dc' : '#3a4a45'; c.strokeStyle = INK; c.lineWidth = 3; c.beginPath(); roundRectPath(c, x - w / 2, y + 40, w, 24, 8); c.fill(); c.stroke(); c.fillStyle = open ? INK : '#fff6dc'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(lbl, x, y + 52);
      if (open) { const tag = `${Math.round(site.time / 60)}m · ${RAR[site.sampleR].n.toLowerCase()}`; c.font = '700 11px Fredoka, sans-serif'; const w2 = c.measureText(tag).width + 12; c.fillStyle = '#22d3b0'; c.beginPath(); roundRectPath(c, x - w2 / 2, y + 66, w2, 18, 7); c.fill(); c.stroke(); c.fillStyle = INK; c.fillText(tag, x, y + 75); }
    }
  }
}
export const sitePos = (id: string) => POS[id];
export const siteById = (id: string) => SITE[id];
