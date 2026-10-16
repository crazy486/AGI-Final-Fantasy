// 可复现的伪随机数（mulberry32），状态可序列化进存档，保证“同输入同结果”
export function nextRandom(state: number): [number, number] {
  let t = (state + 0x6d2b79f5) >>> 0;
  let r = Math.imul(t ^ (t >>> 15), 1 | t);
  r ^= r + Math.imul(r ^ (r >>> 7), 61 | r);
  const value = ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  return [value, t];
}

export function shuffle<T>(arr: T[], state: number): [T[], number] {
  const out = arr.slice();
  let s = state;
  for (let i = out.length - 1; i > 0; i--) {
    const [v, ns] = nextRandom(s);
    s = ns;
    const j = Math.floor(v * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return [out, s];
}
