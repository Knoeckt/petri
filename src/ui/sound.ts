// Six synth voices on WebAudio, no assets: tap, harvest, deliver, level, danger, genesis. Mute is remembered.
type Voice = 'tap' | 'harvest' | 'deliver' | 'level' | 'danger' | 'genesis' | 'find' | 'coin';

const KEY = 'petri-mute';
let ctx: AudioContext | null = null, master: GainNode | null = null;
let muted = (() => { try { return localStorage.getItem(KEY) === '1'; } catch { return false; } })();

function ensure() {
  if (ctx) return ctx;
  const AC = (window as any).AudioContext || (window as any).webkitAudioContext; if (!AC) return null;
  ctx = new AC(); master = ctx!.createGain(); master.gain.value = muted ? 0 : 0.35; master.connect(ctx!.destination);
  return ctx;
}
/** call from the first user gesture so iOS lets audio start */
export function unlockAudio() { const c = ensure(); if (c && c.state === 'suspended') c.resume().catch(() => {}); }
export const isMuted = () => muted;
export function setMuted(m: boolean) { muted = m; try { localStorage.setItem(KEY, m ? '1' : '0'); } catch { /* fine */ } if (master) master.gain.value = m ? 0 : 0.35; }

function tone(c: AudioContext, type: OscillatorType, f0: number, f1: number, t0: number, dur: number, gain = 1, attack = 0.005) {
  const o = c.createOscillator(), g = c.createGain();
  o.type = type; o.frequency.setValueAtTime(f0, t0); if (f1 !== f0) o.frequency.exponentialRampToValueAtTime(f1, t0 + dur);
  g.gain.setValueAtTime(0, t0); g.gain.linearRampToValueAtTime(gain, t0 + attack); g.gain.exponentialRampToValueAtTime(0.001, t0 + dur);
  o.connect(g); g.connect(master!); o.start(t0); o.stop(t0 + dur + 0.02);
}
function noise(c: AudioContext, t0: number, dur: number, gain: number, cutoff: number) {
  const n = c.sampleRate * dur, buf = c.createBuffer(1, n, c.sampleRate), d = buf.getChannelData(0);
  for (let i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / n);
  const src = c.createBufferSource(); src.buffer = buf; const f = c.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = cutoff;
  const g = c.createGain(); g.gain.value = gain; src.connect(f); f.connect(g); g.connect(master!); src.start(t0);
}

export function play(v: Voice) {
  if (muted) return; const c = ensure(); if (!c || c.state !== 'running') return;
  const t = c.currentTime;
  switch (v) {
    case 'tap': tone(c, 'sine', 520, 660, t, 0.07, 0.5); break;
    case 'harvest': tone(c, 'triangle', 660, 660, t, 0.12, 0.6); tone(c, 'triangle', 990, 990, t + 0.09, 0.16, 0.6); break;
    case 'find': tone(c, 'sine', 880, 880, t, 0.1, 0.5); tone(c, 'sine', 1320, 1320, t + 0.08, 0.1, 0.5); tone(c, 'sine', 1760, 1760, t + 0.16, 0.2, 0.5); break;
    case 'coin': tone(c, 'square', 1200, 1200, t, 0.05, 0.25); tone(c, 'square', 1600, 1600, t + 0.05, 0.08, 0.25); break;
    case 'deliver': [523, 659, 784].forEach((f, k) => tone(c, 'triangle', f, f, t + k * 0.1, 0.22, 0.6)); tone(c, 'triangle', 1046, 1046, t + 0.3, 0.4, 0.6); break;
    case 'level': tone(c, 'sawtooth', 300, 900, t, 0.25, 0.35); break;
    case 'danger': tone(c, 'sawtooth', 110, 70, t, 0.35, 0.6); noise(c, t, 0.25, 0.4, 600); break;
    case 'genesis': tone(c, 'sine', 220, 55, t, 1.8, 0.7, 0.4); tone(c, 'sine', 330, 82, t + 0.2, 1.6, 0.5, 0.4); tone(c, 'triangle', 880, 1760, t + 1.4, 0.6, 0.4, 0.2); break;
  }
}
