import { afterEach, describe, expect, it, vi } from 'vitest';
import { startFinaleSequence } from './finale';

afterEach(() => vi.useRealTimers());

describe('ending music sequence', () => {
  it('waits for audio playback to start, then keeps the complete climax before finishing', async () => {
    vi.useFakeTimers();
    const frames: number[] = [];
    let finished = 0;
    let ready!: (seconds: number) => void;
    const loading = new Promise<number>((resolve) => { ready = resolve; });
    startFinaleSequence(loading, (phase) => frames.push(phase), () => finished++);
    vi.advanceTimersByTime(20000);
    expect(frames).toEqual([]);
    expect(finished).toBe(0);
    ready(16); await Promise.resolve();
    expect(frames).toEqual([0]);
    vi.advanceTimersByTime(5999); expect(frames).toEqual([0]);
    vi.advanceTimersByTime(1); expect(frames).toEqual([0, 1]);
    vi.advanceTimersByTime(6000); expect(frames).toEqual([0, 1, 2]);
    vi.advanceTimersByTime(3999); expect(finished).toBe(0);
    vi.advanceTimersByTime(1); expect(finished).toBe(1);
  });

  it('cancels pending frames when the scene unmounts', async () => {
    vi.useFakeTimers();
    const frames: number[] = []; let finished = 0;
    const cancel = startFinaleSequence(Promise.resolve(16), (phase) => frames.push(phase), () => finished++);
    await Promise.resolve(); vi.advanceTimersByTime(5000); cancel();
    vi.advanceTimersByTime(20000);
    expect(frames).toEqual([0]); expect(finished).toBe(0);
  });

  it('does not revive a cancelled scene when decoding finishes later', async () => {
    vi.useFakeTimers();
    const frames: number[] = []; let finished = 0; let ready!: (seconds: number) => void;
    const cancel = startFinaleSequence(new Promise<number>((resolve) => { ready = resolve; }), (phase) => frames.push(phase), () => finished++);
    cancel(); ready(16); await Promise.resolve(); vi.advanceTimersByTime(20000);
    expect(frames).toEqual([]); expect(finished).toBe(0);
  });

  it('still completes the visual sequence if audio is unavailable', async () => {
    vi.useFakeTimers();
    const frames: number[] = []; let finished = 0;
    startFinaleSequence(Promise.resolve(null), (phase) => frames.push(phase), () => finished++);
    await Promise.resolve(); vi.advanceTimersByTime(15999);
    expect(frames).toEqual([0, 1, 2]); expect(finished).toBe(0);
    vi.advanceTimersByTime(1); expect(finished).toBe(1);
  });
});
