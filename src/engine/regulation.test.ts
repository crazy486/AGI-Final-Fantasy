import { describe, expect, it } from 'vitest';
import { REG_CASES } from '../data/regulation';
import { resolveRegulation } from './regulation';

describe('regulatory decisions', () => {
  it('uses the actual verdict for next-round feedback', () => {
    const c = REG_CASES[0];
    const approved = resolveRegulation(c, 'approve', []);
    const conditional = resolveRegulation(c, 'conditional', [c.conditions[0]]);
    const deferred = resolveRegulation(c, 'defer', []);
    expect(new Set([approved.feedback, conditional.feedback, deferred.feedback]).size).toBe(3);
    expect(conditional.feedback).not.toContain('我们的病人还在排队');
  });

  it('mentions a physical switch only when it was selected', () => {
    const c = REG_CASES[2];
    const noSwitch = resolveRegulation(c, 'conditional', [c.conditions[1]]);
    expect(noSwitch.conditions).toEqual(['分区接入、逐区扩大']);
    expect(noSwitch.outcome).not.toContain('物理断路开关被保留');
    const withSwitch = resolveRegulation(c, 'conditional', [c.conditions[0]]);
    expect(withSwitch.outcome).toContain('物理断路开关被保留');
    expect(withSwitch.outcome).not.toContain('采用分区试点');
  });

  it('does not silently apply unchecked medical safeguards', () => {
    const c = REG_CASES[0];
    const d = resolveRegulation(c, 'conditional', [c.conditions[2]]);
    expect(d.outcome).toContain('三甲医院试点');
    expect(d.outcome).not.toContain('强制输出不确定性提示');
    expect(d.coveredRisks).toBe(0);
  });

  it('ignores checkboxes when the player approves without conditions or defers', () => {
    const c = REG_CASES[2];
    for (const verdict of ['approve', 'defer'] as const) {
      const d = resolveRegulation(c, verdict, c.conditions);
      expect(d.conditions).toEqual([]);
      expect(d.outcome).toBe(c.outcomes[verdict]);
    }
  });
});
