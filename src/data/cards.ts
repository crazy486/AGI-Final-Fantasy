import type { CardDef } from '../engine/types';

// 15 种科研卡牌 + 1 张状态牌。数值为游戏抽象，可随试玩调整。
// flavor 为科普短句：卡牌行为不等于真实 AI 的底层算法。
const v = (up: boolean, a: number, b: number) => (up ? b : a);

export const CARDS: Record<string, CardDef> = {
  advance: {
    id: 'advance', name: '基础推进', cost: 1, type: '推进', target: true,
    effects: [{ kind: 'damage', amount: 6, upAmount: 9 }],
    desc: (u) => `推进 ${v(u, 6, 9)}。`,
    flavor: '一步一步缩小问题，是科研最朴素的方式。',
  },
  verify: {
    id: 'verify', name: '基础验证', cost: 1, type: '验证', target: false,
    effects: [{ kind: 'block', amount: 5, upAmount: 8 }, { kind: 'verify' }],
    desc: (u) => `稳定 ${v(u, 5, 8)}。标记“已验证”。`,
    flavor: '检查每一步是否成立，错误才不会层层放大。',
  },
  retrieve: {
    id: 'retrieve', name: '检索文献', cost: 1, upCost: 0, type: '策略', target: false,
    effects: [{ kind: 'draw', amount: 2 }],
    desc: () => `抽 2 张牌。`,
    flavor: '检索：模型调用外部资料，而不是只依赖参数里记住的知识。',
  },
  breakthrough: {
    id: 'breakthrough', name: '高阶突破', cost: 2, type: '推进', target: true,
    effects: [{ kind: 'damage', amount: 12, upAmount: 16, verifiedBonus: 6, upVerifiedBonus: 8 }],
    desc: (u) => `推进 ${v(u, 12, 16)}。若已验证，额外 +${v(u, 6, 8)}。`,
    flavor: '先验证、再突破：大胆猜想需要扎实的检查兜底。',
  },
  decompose: {
    id: 'decompose', name: '拆解问题', cost: 1, type: '策略', target: false,
    effects: [{ kind: 'momentum', amount: 2, upAmount: 3 }, { kind: 'draw', amount: 1 }],
    desc: (u) => `推理链 +${v(u, 2, 3)}，抽 1 张牌。`,
    flavor: '把大问题拆成子问题，是“思维链”式推理的直观版本。',
  },
  chain: {
    id: 'chain', name: '连续推理', cost: 1, type: '推进', target: true,
    effects: [{ kind: 'damage', amount: 4, upAmount: 6, momentumMul: 3, upMomentumMul: 4 }],
    desc: (u) => `推进 ${v(u, 4, 6)}，每层推理链额外 +${v(u, 3, 4)}，然后清空推理链。`,
    flavor: '推理时多想几步（推理阶段计算），不等于重新训练模型。',
  },
  crossCheck: {
    id: 'crossCheck', name: '交叉验证', cost: 1, type: '验证', target: false,
    effects: [{ kind: 'draw', amount: 1, onlyIfVerified: true }, { kind: 'block', amount: 6, upAmount: 9 }, { kind: 'verify' }],
    desc: (u) => `稳定 ${v(u, 6, 9)}。若本回合已验证，抽 1 张。标记“已验证”。`,
    flavor: '用独立方法再算一遍，结果一致才更可信。',
  },
  counterexample: {
    id: 'counterexample', name: '反例构造', cost: 1, type: '推进', target: true,
    effects: [{ kind: 'damage', amount: 5, upAmount: 7 }, { kind: 'counter', amount: 5, upAmount: 7 }],
    desc: (u) => `推进 ${v(u, 5, 7)}。若目标正准备攻击，额外 +${v(u, 5, 7)}。`,
    flavor: '一个反例就能推翻一个错误猜想。',
  },
  codeRun: {
    id: 'codeRun', name: '代码执行', cost: 1, type: '推进', target: true,
    effects: [{ kind: 'damage', amount: 3, upAmount: 4, times: 2 }],
    desc: (u) => `推进 ${v(u, 3, 4)}，执行 2 次。`,
    flavor: '工具调用：让模型写代码并真正运行，用结果说话。',
  },
  testGate: {
    id: 'testGate', name: '测试拦截', cost: 1, type: '验证', target: false,
    effects: [{ kind: 'block', amount: 4, upAmount: 6 }, { kind: 'verify' }, { kind: 'draw', amount: 1 }],
    desc: (u) => `稳定 ${v(u, 4, 6)}，抽 1 张牌。标记“已验证”。`,
    flavor: '自动测试在错误方案上线前把它拦下来。',
  },
  measure: {
    id: 'measure', name: '重复测量', cost: 1, type: '验证', target: false,
    effects: [{ kind: 'block', amount: 9, upAmount: 13 }],
    desc: (u) => `稳定 ${v(u, 9, 13)}。`,
    flavor: '多次测量取平均，压低实验噪声。',
  },
  formalProof: {
    id: 'formalProof', name: '形式化证明', cost: 2, type: '推进', target: true,
    effects: [{ kind: 'damage', amount: 9, upAmount: 12, verifiedBonus: 12, upVerifiedBonus: 15 }],
    desc: (u) => `推进 ${v(u, 9, 12)}。若已验证，额外 +${v(u, 12, 15)}。`,
    flavor: '形式化证明可由程序逐步检查，每一步都无法蒙混。',
  },
  reuse: {
    id: 'reuse', name: '结果复用', cost: 0, type: '策略', target: false, exhaust: true,
    effects: [{ kind: 'energy', amount: 1, upAmount: 2 }, { kind: 'draw', amount: 1 }],
    desc: (u) => `获得 ${v(u, 1, 2)} 点算力，抽 1 张。消耗。`,
    flavor: '把已经算过的中间结果存起来，下一次不用重算。',
  },
  multiAgent: {
    id: 'multiAgent', name: '多智能体协作', cost: 2, type: '推进', target: true,
    effects: [{ kind: 'damage', amount: 4, upAmount: 5, times: 3 }],
    desc: (u) => `推进 ${v(u, 4, 5)}，执行 3 次。`,
    flavor: '多个 Agent 分工检索、编码、审查，再汇总结论。',
  },
  selfImprove: {
    id: 'selfImprove', name: '微小优化', cost: 1, upCost: 0, type: '策略', target: false, exhaust: true,
    effects: [{ kind: 'momentum', amount: 3 }, { kind: 'energy', amount: 1 }],
    desc: () => `推理链 +3，获得 1 点算力。消耗。`,
    flavor: '每次只快一点点。积累起来，就是另一回事了。',
  },
  noise: {
    id: 'noise', name: '噪声数据', cost: 0, type: '状态', target: false, unplayable: true, exhaust: true,
    effects: [],
    desc: () => `无法打出。占用手牌。`,
    flavor: '数据里的噪声会干扰判断。',
  },
};

export const STARTER_DECK = [
  'advance', 'advance', 'advance', 'advance',
  'verify', 'verify', 'verify', 'verify',
  'retrieve', 'breakthrough',
];

// 各阶段奖励池：工具成长让新牌进入奖励池
export const REWARD_POOLS: Record<string, string[]> = {
  act1: ['decompose', 'chain', 'crossCheck', 'counterexample', 'codeRun', 'testGate', 'measure'],
  act2: ['decompose', 'chain', 'crossCheck', 'counterexample', 'codeRun', 'testGate', 'measure', 'formalProof', 'reuse', 'multiAgent'],
  act2b: ['chain', 'crossCheck', 'formalProof', 'reuse', 'multiAgent', 'selfImprove', 'decompose', 'codeRun'],
};
