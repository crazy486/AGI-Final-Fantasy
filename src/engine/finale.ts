/** Run the three green-field frames from actual cue start to its abrupt ending. */
export function startFinaleSequence(ready: Promise<number | null>, frame: (phase: number) => void, done: () => void): () => void {
  let cancelled = false;
  const timers: ReturnType<typeof setTimeout>[] = [];
  const start = (duration: number | null) => {
    if (cancelled) return;
    const ms = duration && Number.isFinite(duration) && duration > 0 ? duration * 1000 : 16000;
    frame(0);
    timers.push(setTimeout(() => frame(1), ms * 3 / 8));
    timers.push(setTimeout(() => frame(2), ms * 3 / 4));
    timers.push(setTimeout(done, ms));
  };
  void ready.then(start, () => start(null));
  return () => { cancelled = true; timers.forEach(clearTimeout); };
}
