import { describe, expect, it } from 'vitest';
import { researchProgress } from './research';

describe('automatic research animation', () => {
  it('does not show every bar full while the total is still increasing', () => {
    for (const tick of [0, 60, 120, 180, 239]) {
      const p = researchProgress(tick);
      expect(p.tasks.some((t) => t.completed < t.target)).toBe(true);
      expect(p.tasks.some((t) => t.percent < 100)).toBe(true);
      expect(p.done).toBe(p.tasks.reduce((n, t) => n + t.completed, 0));
      expect(p.done).toBeLessThan(48210);
    }
  });
  it('finishes all tasks and the total together, including skip', () => {
    const p = researchProgress(240);
    expect(p.done).toBe(48210);
    expect(p.tasks.every((t) => t.completed === t.target && t.percent === 100)).toBe(true);
  });
});
