import { describe, expect, it } from 'vitest';
import { canPlayFinal, endFinalPhase, playFinal, startFinal } from './final';

describe('final battle', () => {
  it('cards are locally effective but the experiment always completes', () => {
    let s = startFinal();
    s = playFinal(s, 'freeze');
    expect(s.progress).toBe(32);
    expect(canPlayFinal(s, 'freeze')).toBe(false);
    // 重复点击无效
    expect(playFinal(s, 'freeze')).toBe(s);
    for (let i = 0; i < 3; i++) {
      for (const id of s.hand.slice()) if (canPlayFinal(s, id)) s = playFinal(s, id);
      s = endFinalPhase(s);
    }
    expect(s.done).toBe(true);
    expect(s.progress).toBe(100);
    expect(endFinalPhase(s)).toBe(s);
  });

  it('limits plays per phase', () => {
    let s = startFinal();
    s = playFinal(s, 'audit');
    s = playFinal(s, 'appeal');
    s = playFinal(s, 'evacuate');
    expect(s.playsLeft).toBe(0);
    expect(canPlayFinal(s, 'freeze')).toBe(false);
    expect(s.saved).toBe(3200);
  });
});
