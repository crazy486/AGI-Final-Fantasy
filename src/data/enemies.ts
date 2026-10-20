import type { EnemyDef } from '../engine/types';

// 敌人代表“剩余问题障碍”。血量、护盾等均为游戏抽象。
export const ENEMIES: Record<string, EnemyDef> = {
  // ---- 第一幕：教学 ----
  arith: {
    id: 'arith', name: '算术应用题', title: '最简单的推理任务', hp: 18,
    intents: [{ kind: 'attack', amount: 5, label: '干扰' }, { kind: 'block', amount: 4, label: '隐藏条件' }, { kind: 'attack', amount: 6, label: '干扰' }],
    mechanics: [], mechanicText: '无特殊机制。先熟悉出牌、算力与敌人预告。',
  },
  geometry: {
    id: 'geometry', name: '内切圆迷阵', title: '几何证明：需要先补全条件', hp: 30,
    intents: [{ kind: 'attack', amount: 6, label: '错误推导' }, { kind: 'block', amount: 6, label: '条件不足' }, { kind: 'attack', amount: 8, label: '错误推导' }],
    mechanics: ['conditionArmor'],
    mechanicText: '条件不足：本回合尚未“验证”时，受到的推进伤害减半。先验证，再推进。',
    reality: '现实参考：2024 年 AlphaGeometry 2 完成了 IMO 几何题证明（题目先由人类形式化）。',
  },
  sortFort: {
    id: 'sortFort', name: '排序指令堡垒', title: '程序优化：既要正确，又要更快', hp: 26,
    intents: [{ kind: 'attack', amount: 4, times: 2, label: '边界测试' }, { kind: 'attack', amount: 9, label: '超时' }, { kind: 'block', amount: 5, label: '回归' }],
    mechanics: [], mechanicText: '多段攻击：护盾能一次抵消多段伤害。',
    reality: '现实参考：2023 年 AlphaDev 找到更快的短序列排序例程，进入 LLVM libc++。',
  },
  plasma: {
    id: 'plasma', name: '失稳的等离子体', title: '实验任务：测量充满噪声', hp: 28,
    intents: [{ kind: 'noise', count: 2, label: '注入噪声' }, { kind: 'attack', amount: 7, label: '偏移' }, { kind: 'attack', amount: 5, label: '偏移' }],
    mechanics: ['noisy'],
    mechanicText: '噪声：会向你的弃牌堆塞入无法打出的“噪声数据”。用抽牌与检索绕开。',
    reality: '现实参考：2022 年强化学习控制器在 TCV 托卡马克中控制等离子体形状（不等于实现聚变发电）。',
  },
  capset: {
    id: 'capset', name: '禁止三点共线', title: '小 Boss：组合构造纪录', hp: 52,
    intents: [{ kind: 'block', amount: 8, label: '违规组合' }, { kind: 'attack', amount: 10, label: '纪录壁垒' }, { kind: 'attack', amount: 4, times: 3, label: '反例搜索' }, { kind: 'buff', amount: 2, label: '扩维' }],
    mechanics: ['conditionArmor'],
    mechanicText: '条件不足：本回合未验证时伤害减半。扩维：力量提升。',
    reality: '现实参考：2023 年 FunSearch 为 cap set 问题找到更大构造，问题仍未彻底解决。',
  },
  // ---- 第二幕 Boss1：限定场景流体模拟 ----
  fluidCore: {
    id: 'fluidCore', name: '湍流核心', title: 'Boss：限定场景流体数值模拟', hp: 56,
    intents: [{ kind: 'block', amount: 6, label: '耦合稳定' }, { kind: 'attack', amount: 7, label: '涡旋' }, { kind: 'attackBlock', amount: 5, block: 6, label: '能量级串' }, { kind: 'attack', amount: 9, label: '数值爆炸' }],
    mechanics: ['linkedCore'],
    mechanicText: '耦合：任一子问题未解决时，核心受到的伤害减半。先解决边界条件与网格，再攻核心。',
  },
  boundary: {
    id: 'boundary', name: '边界条件', title: '子问题', hp: 16,
    intents: [{ kind: 'attack', amount: 3, label: '扰动' }, { kind: 'block', amount: 4, label: '收敛' }],
    mechanics: ['linkedSub'], mechanicText: '子问题：被解决时，核心失去全部护盾。',
  },
  mesh: {
    id: 'mesh', name: '自适应网格', title: '子问题', hp: 16,
    intents: [{ kind: 'block', amount: 4, label: '加密' }, { kind: 'attack', amount: 4, label: '扰动' }],
    mechanics: ['linkedSub'], mechanicText: '子问题：被解决时，核心失去全部护盾。',
  },
  // ---- 第二幕中段 ----
  matrix: {
    id: 'matrix', name: '矩阵乘法壁垒', title: '算法：用更少的乘法', hp: 40,
    intents: [{ kind: 'block', amount: 10, label: '冗余运算' }, { kind: 'attack', amount: 11, label: '算力消耗' }, { kind: 'attack', amount: 5, times: 2, label: '舍入误差' }],
    mechanics: ['conditionArmor'], mechanicText: '条件不足：本回合未验证时伤害减半。',
    reality: '现实参考：2025 年 AlphaEvolve 找到 48 次标量乘法的 4×4 复数矩阵乘法算法。',
  },
  protein: {
    id: 'protein', name: '折叠的蛋白质', title: '结构预测：成千上万种可能', hp: 42,
    intents: [{ kind: 'noise', count: 2, label: '构象爆炸' }, { kind: 'attack', amount: 9, label: '误差' }, { kind: 'attackBlock', amount: 6, block: 6, label: '折叠' }],
    mechanics: ['noisy'], mechanicText: '噪声：向弃牌堆塞入噪声数据。',
    reality: '现实参考：AlphaFold 系列大幅推进蛋白质结构预测，相关研究获 2024 年诺贝尔化学奖。',
  },
  // ---- 第二幕 Boss2：未来自举科研工具链 ----
  bootstrap: {
    id: 'bootstrap', name: '自举工具链', title: 'Boss：让专家也看不懂的问题', hp: 64,
    intents: [{ kind: 'attack', amount: 7, label: '新范式' }, { kind: 'noise', count: 1, label: '未知符号' }, { kind: 'attackBlock', amount: 6, block: 8, label: '自我修正' }, { kind: 'attack', amount: 3, times: 3, label: '并行推演' }],
    mechanics: ['adaptive', 'noisy'],
    mechanicText: '自举：每回合结束时力量 +1，拖得越久越强。噪声：塞入噪声数据。尽快组合成型。',
    reality: '问源持续扩大自主改进能力的过程是本作的虚构推演。',
  },
};
