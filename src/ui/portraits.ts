// Townsfolk drawn with the same ink-and-fill hand as the critters: a face, hair, a hat, and one or two props each.
import { INK, roundRectPath } from './critter';

type C = CanvasRenderingContext2D;
interface Face { skin: string; hair: string; style: 'short' | 'bun' | 'long' | 'bald' | 'curls'; hat?: 'top' | 'chef' | 'cap' | 'straw' | 'beanie' | 'nurse' | 'band' | 'postie'; glasses?: boolean; moustache?: boolean; beard?: boolean; freckles?: boolean; prop?: 'stetho' | 'whistle' | 'apron' | 'badge'; blush?: boolean }

const FACES: Record<string, Face> = {
  'Mayor Bramble': { skin: '#f1c9a5', hair: '#7a4a12', style: 'short', hat: 'top', moustache: true, prop: 'badge' },
  'Ida the baker': { skin: '#e8b48c', hair: '#3a2a1e', style: 'bun', hat: 'chef', prop: 'apron', blush: true },
  'Pip': { skin: '#f6d3b3', hair: '#e0a53a', style: 'curls', hat: 'cap', freckles: true },
  'Doc Ferro': { skin: '#d9a57a', hair: '#c9c9c9', style: 'short', glasses: true, prop: 'stetho' },
  'Gran Moss': { skin: '#f1c9a5', hair: '#e9e9e9', style: 'bun', glasses: true, blush: true },
  'Farmer Tuck': { skin: '#d9a57a', hair: '#5a3a1a', style: 'short', hat: 'straw', beard: true },
  'Postie Lark': { skin: '#c98a5a', hair: '#1f1a17', style: 'long', hat: 'postie' },
  'Old Bill': { skin: '#e8b48c', hair: '#d0d0d0', style: 'bald', hat: 'beanie', beard: true },
  'Nurse Ona': { skin: '#a5673f', hair: '#1f1a17', style: 'curls', hat: 'nurse' },
  'Coach Dabb': { skin: '#f1c9a5', hair: '#7a4a12', style: 'short', hat: 'band', prop: 'whistle' },
};

/** draws a portrait centred at (x, y) with head radius R; `now` drives the blink */
export function drawPortrait(c: C, x: number, y: number, R: number, who: string, now: number) {
  const f = FACES[who] || { skin: '#f1c9a5', hair: '#5a3a1a', style: 'short' as const };
  const t = now / 1000, seed = who.length;
  c.save(); c.translate(x, y); c.lineJoin = 'round'; c.lineCap = 'round'; c.strokeStyle = INK; c.lineWidth = R * .14;
  // shoulders
  c.fillStyle = f.prop === 'apron' ? '#fff6dc' : f.hat === 'nurse' ? '#fff' : f.prop === 'stetho' ? '#fff' : '#22d3b0';
  c.beginPath(); c.moveTo(-R * 1.5, R * 2.2); c.quadraticCurveTo(-R * 1.4, R * 1.1, 0, R * 1.05); c.quadraticCurveTo(R * 1.4, R * 1.1, R * 1.5, R * 2.2); c.closePath(); c.fill(); c.stroke();
  if (f.prop === 'apron') { c.fillStyle = '#e0a53a'; c.beginPath(); roundRectPath(c, -R * .5, R * 1.2, R, R * 1.1, R * .1); c.fill(); c.stroke(); }
  if (f.prop === 'stetho') { c.strokeStyle = '#3a3a42'; c.lineWidth = R * .12; c.beginPath(); c.moveTo(-R * .5, R * 1.2); c.quadraticCurveTo(-R * .2, R * 1.9, R * .4, R * 1.7); c.stroke(); c.fillStyle = '#c0c0c0'; c.beginPath(); c.arc(R * .45, R * 1.7, R * .18, 0, 7); c.fill(); c.strokeStyle = INK; c.lineWidth = R * .14; }
  if (f.prop === 'whistle') { c.fillStyle = '#c0c0c0'; c.beginPath(); roundRectPath(c, -R * .2, R * 1.35, R * .5, R * .28, R * .1); c.fill(); c.stroke(); }
  if (f.prop === 'badge') { c.fillStyle = '#ffd43b'; c.beginPath(); c.arc(-R * .7, R * 1.5, R * .18, 0, 7); c.fill(); c.stroke(); }
  // long hair behind the head
  if (f.style === 'long') { c.fillStyle = f.hair; c.beginPath(); c.moveTo(-R * 1.05, -R * .2); c.quadraticCurveTo(-R * 1.2, R * 1.2, -R * .8, R * 1.4); c.lineTo(R * .8, R * 1.4); c.quadraticCurveTo(R * 1.2, R * 1.2, R * 1.05, -R * .2); c.closePath(); c.fill(); c.stroke(); }
  // head
  c.fillStyle = f.skin; c.beginPath(); c.ellipse(0, 0, R, R * 1.05, 0, 0, 7); c.fill(); c.stroke();
  // ears
  c.beginPath(); c.arc(-R * .98, R * .1, R * .18, 0, 7); c.fill(); c.stroke(); c.beginPath(); c.arc(R * .98, R * .1, R * .18, 0, 7); c.fill(); c.stroke();
  // hair
  c.fillStyle = f.hair;
  if (f.style === 'short' || f.style === 'long') { c.beginPath(); c.moveTo(-R * .98, -R * .15); c.quadraticCurveTo(-R * .9, -R * 1.15, 0, -R * 1.12); c.quadraticCurveTo(R * .9, -R * 1.15, R * .98, -R * .15); c.quadraticCurveTo(R * .5, -R * .6, R * .1, -R * .55); c.quadraticCurveTo(-R * .5, -R * .6, -R * .98, -R * .15); c.closePath(); c.fill(); c.stroke(); }
  else if (f.style === 'curls') { for (let k = 0; k < 7; k++) { const a = Math.PI + k * Math.PI / 6; c.beginPath(); c.arc(Math.cos(a) * R * .85, Math.sin(a) * R * .85 - R * .1, R * .3, 0, 7); c.fill(); c.stroke(); } }
  else if (f.style === 'bun') { c.beginPath(); c.moveTo(-R * .98, -R * .1); c.quadraticCurveTo(-R * .6, -R * 1.1, 0, -R * 1.05); c.quadraticCurveTo(R * .6, -R * 1.1, R * .98, -R * .1); c.quadraticCurveTo(0, -R * .5, -R * .98, -R * .1); c.fill(); c.stroke(); c.beginPath(); c.arc(0, -R * 1.15, R * .32, 0, 7); c.fill(); c.stroke(); }
  else if (f.style === 'bald') { c.beginPath(); c.moveTo(-R * .98, -R * .1); c.quadraticCurveTo(-R * .8, -R * .55, -R * .55, -R * .6); c.lineTo(-R * .6, -R * .1); c.closePath(); c.fill(); c.stroke(); c.beginPath(); c.moveTo(R * .98, -R * .1); c.quadraticCurveTo(R * .8, -R * .55, R * .55, -R * .6); c.lineTo(R * .6, -R * .1); c.closePath(); c.fill(); c.stroke(); }
  // hats
  if (f.hat === 'top') { c.fillStyle = '#2b2b30'; c.beginPath(); roundRectPath(c, -R * .75, -R * 2.05, R * 1.5, R * 1.1, R * .08); c.fill(); c.stroke(); c.beginPath(); roundRectPath(c, -R * 1.15, -R * 1.05, R * 2.3, R * .22, R * .1); c.fill(); c.stroke(); c.fillStyle = '#e63946'; c.fillRect(-R * .75, -R * 1.25, R * 1.5, R * .18); }
  else if (f.hat === 'chef') { c.fillStyle = '#fff'; c.beginPath(); roundRectPath(c, -R * .85, -R * 1.25, R * 1.7, R * .35, R * .08); c.fill(); c.stroke(); c.beginPath(); c.arc(-R * .5, -R * 1.5, R * .45, 0, 7); c.arc(R * .1, -R * 1.7, R * .5, 0, 7); c.arc(R * .6, -R * 1.45, R * .42, 0, 7); c.fill(); c.stroke(); }
  else if (f.hat === 'cap' || f.hat === 'postie') { c.fillStyle = f.hat === 'cap' ? '#5aa9ff' : '#e63946'; c.beginPath(); c.arc(0, -R * .55, R * .95, Math.PI, 0); c.closePath(); c.fill(); c.stroke(); c.beginPath(); roundRectPath(c, -R * .2, -R * .65, R * 1.5, R * .22, R * .1); c.fill(); c.stroke(); }
  else if (f.hat === 'straw') { c.fillStyle = '#e0c08a'; c.beginPath(); c.ellipse(0, -R * .75, R * 1.5, R * .28, 0, 0, 7); c.fill(); c.stroke(); c.beginPath(); roundRectPath(c, -R * .7, -R * 1.5, R * 1.4, R * .8, R * .2); c.fill(); c.stroke(); }
  else if (f.hat === 'beanie') { c.fillStyle = '#8a5a2b'; c.beginPath(); c.arc(0, -R * .5, R * 1, Math.PI, 0); c.closePath(); c.fill(); c.stroke(); c.fillStyle = '#c98a4a'; c.beginPath(); roundRectPath(c, -R * 1.02, -R * .75, R * 2.04, R * .3, R * .1); c.fill(); c.stroke(); }
  else if (f.hat === 'nurse') { c.fillStyle = '#fff'; c.beginPath(); roundRectPath(c, -R * .6, -R * 1.35, R * 1.2, R * .55, R * .08); c.fill(); c.stroke(); c.fillStyle = '#e63946'; c.fillRect(-R * .08, -R * 1.25, R * .16, R * .36); c.fillRect(-R * .18, -R * 1.15, R * .36, R * .16); }
  else if (f.hat === 'band') { c.fillStyle = '#e63946'; c.beginPath(); roundRectPath(c, -R * 1, -R * .78, R * 2, R * .28, R * .1); c.fill(); c.stroke(); }
  // eyes
  const blink = ((t + seed) % 4.2) < .14;
  for (const ex of [-R * .38, R * .38]) {
    if (blink) { c.beginPath(); c.moveTo(ex - R * .16, -R * .05); c.lineTo(ex + R * .16, -R * .05); c.stroke(); continue; }
    c.fillStyle = '#fff'; c.beginPath(); c.arc(ex, -R * .05, R * .2, 0, 7); c.fill(); c.stroke();
    c.fillStyle = INK; c.beginPath(); c.arc(ex + R * .04, -R * .03, R * .1, 0, 7); c.fill();
  }
  if (f.glasses) { c.strokeStyle = INK; c.lineWidth = R * .1; c.beginPath(); c.arc(-R * .38, -R * .05, R * .28, 0, 7); c.moveTo(R * .66, -R * .05); c.arc(R * .38, -R * .05, R * .28, 0, 7); c.moveTo(-R * .1, -R * .05); c.lineTo(R * .1, -R * .05); c.stroke(); c.lineWidth = R * .14; }
  if (f.freckles) { c.fillStyle = 'rgba(160,90,40,.6)'; for (const [fx, fy] of [[-.55, .3], [-.4, .42], [.45, .32], [.6, .42], [.5, .5]]) { c.beginPath(); c.arc(fx * R, fy * R, R * .05, 0, 7); c.fill(); } }
  if (f.blush) { c.fillStyle = 'rgba(255,120,140,.35)'; c.beginPath(); c.arc(-R * .6, R * .35, R * .18, 0, 7); c.arc(R * .6, R * .35, R * .18, 0, 7); c.fill(); }
  // nose and mouth
  c.beginPath(); c.moveTo(0, R * .1); c.quadraticCurveTo(R * .12, R * .35, 0, R * .4); c.stroke();
  if (f.moustache) { c.fillStyle = f.hair; c.beginPath(); c.moveTo(0, R * .5); c.quadraticCurveTo(-R * .45, R * .35, -R * .55, R * .6); c.quadraticCurveTo(-R * .25, R * .7, 0, R * .55); c.quadraticCurveTo(R * .25, R * .7, R * .55, R * .6); c.quadraticCurveTo(R * .45, R * .35, 0, R * .5); c.fill(); c.stroke(); }
  else { c.beginPath(); c.arc(0, R * .5, R * .28, Math.PI * .15, Math.PI * .85); c.stroke(); }
  if (f.beard) { c.fillStyle = f.hair; c.beginPath(); c.moveTo(-R * .9, R * .3); c.quadraticCurveTo(-R * .8, R * 1.3, 0, R * 1.35); c.quadraticCurveTo(R * .8, R * 1.3, R * .9, R * .3); c.quadraticCurveTo(R * .5, R * .9, 0, R * .8); c.quadraticCurveTo(-R * .5, R * .9, -R * .9, R * .3); c.closePath(); c.fill(); c.stroke(); }
  c.restore();
}

/** replaces every `.face[data-who]` canvas inside `el` with a drawn portrait */
export function drawPortraits(el: HTMLElement, now: number) {
  el.querySelectorAll<HTMLCanvasElement>('canvas.face').forEach(cv => { const c = cv.getContext('2d')!; c.clearRect(0, 0, cv.width, cv.height); drawPortrait(c, cv.width / 2, cv.height * .42, cv.width * .26, cv.dataset.who || '', now); });
}
export const faceCanvas = (who: string, cls = 'face') => `<canvas class="${cls}" width="96" height="96" data-who="${who.replace(/"/g, '')}"></canvas>`;
