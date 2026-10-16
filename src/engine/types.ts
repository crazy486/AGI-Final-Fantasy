// 战斗与成长的核心数据类型。规则模块不依赖 React，便于测试与复现。

export type CardType = '推进' | '验证' | '策略' | '状态';

export type Effect =
  | { kind: 'damage'; amount: number; upAmount?: number; times?: number; verifiedBonus?: number; upVerifiedBonus?: number; momentumMul?: number; upMomentumMul?: number }
  | { kind: 'block'; amount: number; upAmount?: number }
  | { kind: 'draw'; amount: number; upAmount?: number; onlyIfVerified?: boolean }
  | { kind: 'momentum'; amount: number; upAmount?: number }
  | { kind: 'energy'; amount: number; upAmount?: number }
  | { kind: 'verify' }
  | { kind: 'counter'; amount: number; upAmount?: number }; // 若目标本回合意图为攻击，则额外造成伤害

export interface CardDef {
  id: string;
  name: string;
  cost: number;
  upCost?: number;
  type: CardType;
  target: boolean; // 是否需要选择敌人
  effects: Effect[];
  exhaust?: boolean;
  unplayable?: boolean;
  desc: (up: boolean) => string;
  flavor?: string; // 科普短句（游戏抽象，非真实算法）
}

export interface CardInst {
  uid: string;
  id: string;
  up: boolean;
}

export type Intent =
  | { kind: 'attack'; amount: number; times?: number; label?: string }
  | { kind: 'block'; amount: number; label?: string }
  | { kind: 'buff'; amount: number; label?: string }
  | { kind: 'noise'; count: number; label?: string }
  | { kind: 'attackBlock'; amount: number; block: number; label?: string };

export type Mechanic =
  | 'conditionArmor' // 条件不足：本回合未做验证时，受到伤害减半
  | 'linkedCore' // 核心：子问题存活时受到伤害减半，全部解决后失去护甲
  | 'linkedSub' // 子问题：被解决时核心立即失去护盾
  | 'adaptive' // 自举：每回合结束力量 +1
  | 'noisy'; // 噪声：意图可向弃牌堆塞入噪声牌

export interface EnemyDef {
  id: string;
  name: string;
  title: string; // 一句话说明这代表的科研问题
  hp: number;
  intents: Intent[];
  mechanics: Mechanic[];
  mechanicText: string;
  reality?: string; // 现实依据说明（区分现实与虚构）
}

export interface EnemyState {
  uid: string;
  defId: string;
  hp: number;
  maxHp: number;
  block: number;
  strength: number;
  intentIndex: number;
}

export interface PlayerBattle {
  hp: number;
  maxHp: number;
  block: number;
  energy: number;
  maxEnergy: number;
  momentum: number; // 推理链
  verified: boolean; // 本回合是否做过验证
}

export type BattleEvent =
  | { type: 'damageEnemy'; uid: string; amount: number; blocked: number }
  | { type: 'damagePlayer'; amount: number; blocked: number }
  | { type: 'block'; who: 'player' | string; amount: number }
  | { type: 'enemyDefeated'; uid: string }
  | { type: 'mechanic'; text: string }
  | { type: 'draw'; count: number }
  | { type: 'info'; text: string };

export interface BattleState {
  enemies: EnemyState[];
  player: PlayerBattle;
  drawPile: CardInst[];
  hand: CardInst[];
  discard: CardInst[];
  exhausted: CardInst[];
  turn: number;
  rng: number;
  recursion: number; // 递归等级：所有推进伤害 +N
  outcome: 'ongoing' | 'won' | 'lost';
  events: BattleEvent[]; // 最近一次操作产生的事件，用于演出
  log: string[];
  uidSeq: number;
}
