// 音频：T06 交付的 OGG 配乐与音效（WebAudio 缓冲循环）；缺少素材的音效用合成音兜底。
let ctx: AudioContext | null = null;
let master: GainNode | null = null;
let musicGain: GainNode | null = null;
let sfxGain: GainNode | null = null;
export const volume = { sfx: 0.7, music: 0.5 };

const LOOPING = new Set([
  'title', 'research', 'first-contact', 'research-route', 'battle-standard', 'battle-elite', 'battle-breakthrough',
  'regulation', 'audit', 'golden-age', 'investigation', 'negotiation', 'tension',
]);
const buffers = new Map<string, Promise<AudioBuffer | null>>();

function ac() {
  if (!ctx) {
    const C = (window as any).AudioContext || (window as any).webkitAudioContext;
    if (!C) return null;
    ctx = new C() as AudioContext;
    master = ctx.createGain(); master.connect(ctx.destination);
    musicGain = ctx.createGain(); musicGain.gain.value = volume.music; musicGain.connect(master);
    sfxGain = ctx.createGain(); sfxGain.gain.value = volume.sfx; sfxGain.connect(master);
    // 浏览器要求用户交互后才能出声
    const resume = () => { if (ctx && ctx.state === 'suspended') ctx.resume(); };
    window.addEventListener('pointerdown', resume);
    window.addEventListener('keydown', resume);
  }
  return ctx;
}

function load(name: string): Promise<AudioBuffer | null> {
  if (!buffers.has(name)) {
    const c = ac();
    // 单文件分享版会把音频内嵌为 window.__AUDIO__（data URL），否则从 audio/ 目录加载
    const inline = (window as any).__AUDIO__?.[name] as string | undefined;
    buffers.set(name, !c ? Promise.resolve(null) : fetch(inline ?? `${import.meta.env.BASE_URL}audio/${name}.ogg`)
      .then((r) => (r.ok ? r.arrayBuffer() : Promise.reject(r.status)))
      .then((b) => c.decodeAudioData(b))
      .catch(() => null));
  }
  return buffers.get(name)!;
}

// ---------- 音效 ----------
export type Sfx = 'card' | 'hit' | 'block' | 'mechanic' | 'win' | 'lose' | 'click' | 'rewind' | 'cut' | 'bypass' | 'hover';
const SFX_FILE: Partial<Record<Sfx, string>> = {
  card: 'play', hit: 'hit', block: 'block', win: 'reward', click: 'confirm', rewind: 'rewind',
  mechanic: 'mechanic', lose: 'lose', cut: 'cut', bypass: 'bypass', hover: 'hover',
};

function tone(freq: number, dur: number, type: OscillatorType, gain: number, when = 0) {
  const c = ac(); if (!c || !sfxGain) return;
  const t = c.currentTime + when;
  const o = c.createOscillator(); const g = c.createGain();
  o.type = type; o.frequency.setValueAtTime(freq, t);
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(gain, t + 0.01);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(g); g.connect(sfxGain);
  o.start(t); o.stop(t + dur + 0.05);
}

export function preloadSfx() { Object.values(SFX_FILE).forEach((f) => f && load(f)); }

export function sfx(k: Sfx) {
  const c = ac(); if (!c || !sfxGain || volume.sfx <= 0) return;
  const f = SFX_FILE[k];
  if (f) {
    load(f).then((buf) => {
      if (!buf || !ctx || !sfxGain) return;
      const s = ctx.createBufferSource(); s.buffer = buf; s.connect(sfxGain); s.start();
    });
    return;
  }
  if (k === 'mechanic') { tone(660, 0.1, 'sine', 0.12); tone(990, 0.15, 'sine', 0.1, 0.08); }
  if (k === 'lose') [392, 330, 262].forEach((fq, i) => tone(fq, 0.4, 'sine', 0.14, i * 0.18));
}

// ---------- 配乐 ----------
let currentTrack: string | null = null;
let current: { src: AudioBufferSourceNode; gain: GainNode } | null = null;

/** 切换配乐：旧曲淡出、新曲淡入；cue 类不循环。delayMs 用于终局黑屏前的真正静音。 */
export function music(name: string | null, delayMs = 0) {
  if (name === currentTrack) return;
  currentTrack = name;
  const c = ac();
  if (!c || !musicGain) return;
  if (current) {
    const old = current; current = null;
    const t = c.currentTime;
    old.gain.gain.cancelScheduledValues(t);
    old.gain.gain.setValueAtTime(old.gain.gain.value, t);
    old.gain.gain.linearRampToValueAtTime(0, t + 0.8);
    old.src.stop(t + 0.85);
  }
  if (!name) return;
  load(name).then((buf) => {
    if (!buf || currentTrack !== name || !ctx || !musicGain) return;
    const src = ctx.createBufferSource(); src.buffer = buf; src.loop = LOOPING.has(name);
    const g = ctx.createGain(); g.gain.value = 0;
    src.connect(g); g.connect(musicGain);
    const t = ctx.currentTime + delayMs / 1000;
    g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(1, t + 1);
    src.start(t);
    current = { src, gain: g };
  });
}

/** 立即切断（绿色场域高潮后的突然静音） */
export function cutMusic() {
  currentTrack = null;
  if (current && ctx) { current.src.stop(); current = null; }
}

export function setVolumes(sfxV: number, musicV: number) {
  volume.sfx = sfxV; volume.music = musicV;
  if (musicGain) musicGain.gain.value = musicV;
  if (sfxGain) sfxGain.gain.value = sfxV;
}
