import { describe, expect, it } from 'vitest';
import { canRetreat, complete, enter, newMapRun, nextChoices, retreat } from './map';

describe('map & retreat', () => {
  it('only advances along edges after completing a node', () => {
    let r = newMapRun('act1');
    expect(nextChoices(r)).toEqual(['a', 'b']);
    r = enter(r, 'a');
    expect(nextChoices(r)).toEqual([]);
    expect(enter(r, 'c')).toBe(r);
    r = complete(r);
    expect(nextChoices(r)).toEqual(['c', 'd']);
  });

  it('retreat before first fork returns to start', () => {
    let r = enter(newMapRun('act1'), 'a');
    r = retreat(r);
    expect(r.pos).toBe('start');
  });

  it('retreat returns to the previous fork, keeping done nodes', () => {
    let r = newMapRun('act2a');
    r = complete(enter(r, 'a'));
    r = enter(r, 'd'); // 小 Boss 战斗中撤退
    r = retreat(r);
    expect(r.pos).toBe('a');
    expect(r.done).toContain('a');
    expect(r.done).not.toContain('d');
    expect(nextChoices(r)).toEqual(['c', 'd']);
    // 再次回溯：上一个岔路是起点
    r = retreat(r);
    expect(r.pos).toBe('start');
    expect(nextChoices(r)).toEqual(['a', 'b']);
    expect(canRetreat(r)).toBe(false);
  });
});
