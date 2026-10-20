import type { RegCase, Verdict } from '../data/regulation';

export function resolveRegulation(c: RegCase, verdict: Verdict, selected: string[]) {
  const conditions = verdict === 'conditional' ? c.conditions.filter((x) => selected.includes(x)) : [];
  const coveredRisks = c.bestConditions.filter((x) => conditions.includes(x)).length;
  const outcome = [c.outcomes[verdict], ...conditions.map((x) => c.conditionEffects[x])].join('');
  const feedback = [c.pressure[verdict], ...conditions.map((x) => c.conditionEffects[x])].join('');
  const assessment = verdict !== 'conditional' ? '' : coveredRisks === c.bestConditions.length
    ? '所选条件覆盖了材料指出的主要风险，但仍需持续检查落实情况。'
    : coveredRisks > 0 ? '所选条件覆盖了部分风险，仍有遗漏。' : '所选条件限制了部署范围或流程，但没有直接解决材料指出的主要风险。';
  return { verdict, conditions, outcome, feedback, coveredRisks, assessment };
}

export type RegDecision = ReturnType<typeof resolveRegulation>;
