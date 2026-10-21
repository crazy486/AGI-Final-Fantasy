import { REWARD_POOLS, STARTER_DECK } from '../data/cards';
import { MAPS } from '../data/maps';
import { endTurn, MAX_HAND_SIZE, playCard, startBattle } from '../engine/battle';
import { bossDone, canRetreat, complete, enter, newMapRun, node, retreat, type MapRun } from '../engine/map';
import { nextRandom, shuffle } from '../engine/rng';
import type { BattleState, CardInst } from '../engine/types';
import { FLOW } from './flow';

// 存档：所有会影响公平性的状态（芯片、复活、战斗中途）都写入存档，刷新不能回滚。
export type Pending =
  | null
  | { kind: 'reward'; options: string[]; upgrade: boolean }
  | { kind: 'upgrade' } // 小 Boss 额外升级
  | { kind: 'rest' }
  | { kind: 'restPick'; mode: 'upgrade' | 'remove' }
  | { kind: 'dead' };

export interface Save {
  version: 1;
  step: number;
  deck: CardInst[];
  hp: number;
  maxHp: number;
  chips: number;
  revive: boolean;
  recursion: number;
  map: MapRun | null;
  battle: BattleState | null;
  pending: Pending;
  pool: string;
  seed: number;
  uidSeq: number;
  flags: Record<string, unknown>;
  stats: { battles: number; retreats: number; revived: boolean };
}

const KEY = 'agiff.save.v1';
const READ_KEY = 'agiff.read.v1';

export function newGame(seed = Date.now() % 100000): Save {
  return {
    version: 1, step: 0,
    deck: STARTER_DECK.map((id, i) => ({ uid: `d${i}`, id, up: false })),
    hp: 60, maxHp: 60, chips: 0, revive: true, recursion: 0,
    map: null, battle: null, pending: null, pool: 'act1',
    seed, uidSeq: STARTER_DECK.length, flags: {},
    stats: { battles: 0, retreats: 0, revived: false },
  };
}

export function persist(s: Save) {
  try { localStorage.setItem(KEY, JSON.stringify(s)); } catch { /* 存储不可用时忽略 */ }
}
export function loadSave(): Save | null {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    return validate(JSON.parse(raw));
  } catch { return null; }
}
export function validate(o: any): Save | null {
  if (!o || o.version !== 1 || typeof o.step !== 'number' || !Array.isArray(o.deck)) return null;
  if (o.step < 0 || o.step >= FLOW.length) return null;
  // 旧版战斗可能保存了 8—10 张手牌，按原顺序放回牌堆顶部，不丢牌、不重洗。
  if (Array.isArray(o.battle?.hand) && Array.isArray(o.battle?.drawPile) && o.battle.hand.length > MAX_HAND_SIZE) {
    const battle = o.battle as BattleState;
    return { ...o, battle: { ...battle, hand: battle.hand.slice(0, MAX_HAND_SIZE), drawPile: [...battle.hand.slice(MAX_HAND_SIZE), ...battle.drawPile] } } as Save;
  }
  return o as Save;
}
export function clearSave() { try { localStorage.removeItem(KEY); } catch { /* */ } }

export function getRead(): Set<string> {
  try { return new Set(JSON.parse(localStorage.getItem(READ_KEY) || '[]')); } catch { return new Set(); }
}
export function markRead(key: string) {
  const r = getRead();
  if (r.has(key)) return;
  r.add(key);
  try { localStorage.setItem(READ_KEY, JSON.stringify([...r])); } catch { /* */ }
}

function rand(s: Save): number {
  const [v, n] = nextRandom(s.seed);
  s.seed = n;
  return v;
}

function copy(s: Save): Save {
  return JSON.parse(JSON.stringify(s));
}

/** 进入下一步；地图步进入时发放一枚回溯芯片 */
export function advance(s0: Save): Save {
  const s = copy(s0);
  s.step = Math.min(FLOW.length - 1, s.step + 1);
  s.battle = null; s.pending = null; s.map = null;
  const st = FLOW[s.step];
  if (st.k === 'map') {
    s.map = newMapRun(st.id);
    s.pool = MAPS[st.id].pool;
    s.chips += 1;
  }
  if (st.k === 'battle') s.battle = makeBattle(s, st.enemies, st.hpScale ?? 1);
  if (st.k === 'recursion') {
    // 递归升级是即时结算的步骤，直接进入下一步
    s.recursion = Math.max(s.recursion, st.lv);
    return advance(s);
  }
  return s;
}

// 跳章时补齐合理的成长，避免卡组过弱（模拟此前各图的典型奖励）
const JUMP_GROWTH: { from: string; cards: string[]; upgrades: number; recursion: number; chips: number }[] = [
  { from: 'act2Intro', cards: ['decompose', 'chain', 'crossCheck', 'testGate'], upgrades: 1, recursion: 0, chips: 1 },
  { from: 'act3Intro', cards: ['formalProof', 'multiAgent', 'reuse', 'codeRun'], upgrades: 2, recursion: 2, chips: 0 },
];

export function jumpTo(s0: Save, step: number): Save {
  const s = copy(s0);
  for (const g of JUMP_GROWTH) {
    const at = FLOW.findIndex((x) => x.k === 'scene' && x.id === g.from);
    if (at < 0 || step < at) continue;
    for (const id of g.cards) s.deck.push({ uid: `d${s.uidSeq++}`, id, up: false });
    let n = g.upgrades;
    for (const c of s.deck) { if (n <= 0) break; if (!c.up && (c.id === 'advance' || c.id === 'breakthrough')) { c.up = true; n--; } }
    s.recursion = Math.max(s.recursion, g.recursion);
    s.chips += g.chips;
  }
  s.step = step - 1;
  return advance(s);
}

function makeBattle(s: Save, enemies: string[], hpScale: number): BattleState {
  s.stats.battles += 1;
  return startBattle({ deck: s.deck, enemyIds: enemies, hp: s.hp, maxHp: s.maxHp, seed: Math.floor(rand(s) * 1e9), recursion: s.recursion, hpScale });
}

// ---------- 地图 ----------
export function mapEnter(s0: Save, id: string): Save {
  if (!s0.map || s0.pending || s0.battle) return s0;
  const s = copy(s0);
  const m = enter(s.map!, id);
  if (m === s.map || m.pos === s.map!.pos) return s0;
  s.map = m;
  const nd = node(m);
  if (m.done.includes(nd.id)) return s; // 已完成节点直接经过
  if (nd.kind === 'rest') s.pending = { kind: 'rest' };
  else if (nd.enemies) s.battle = makeBattle(s, nd.enemies, nd.hpScale ?? 1);
  return s;
}

export function mapRetreat(s0: Save): Save {
  if (!s0.map || s0.chips <= 0 || !canRetreat(s0.map)) return s0;
  if (s0.pending && s0.pending.kind !== 'rest') return s0;
  const s = copy(s0);
  s.chips -= 1;
  s.stats.retreats += 1;
  if (s.battle) s.hp = s.battle.player.hp; // 撤退保留已损失的稳定度
  s.battle = null;
  s.pending = null;
  s.map = retreat(s.map!);
  return s;
}

export function mapFinished(s: Save) {
  return !!s.map && bossDone(s.map) && !s.pending;
}

// ---------- 战斗 ----------
export function battlePlay(s0: Save, uid: string, target?: string): Save {
  if (!s0.battle) return s0;
  const b = playCard(s0.battle, uid, target);
  if (b === s0.battle) return s0;
  return { ...s0, battle: b };
}
export function battleEnd(s0: Save): Save {
  if (!s0.battle) return s0;
  const b = endTurn(s0.battle);
  if (b === s0.battle) return s0;
  return { ...s0, battle: b };
}

/** 战斗结束结算（胜：领奖；负：复活或失败）。由界面在播放完结算动画后调用，重复调用无效。 */
export function battleResolve(s0: Save): Save {
  const b = s0.battle;
  if (!b || b.outcome === 'ongoing') return s0;
  const s = copy(s0);
  const st = FLOW[s.step];
  if (b.outcome === 'won') {
    s.hp = b.player.hp;
    s.battle = null;
    let elite = false;
    if (s.map) {
      elite = node(s.map).kind === 'elite';
      s.map = complete(s.map);
    }
    s.pending = { kind: 'reward', options: rollRewards(s), upgrade: elite };
    return s;
  }
  // 失败
  s.battle = null;
  if (st.k === 'battle') { // 教学战：直接重来
    s.hp = s.maxHp;
    s.battle = makeBattle(s, st.enemies, st.hpScale ?? 1);
    return s;
  }
  if (s.revive) {
    s.revive = false;
    s.stats.revived = true;
    s.hp = Math.ceil(s.maxHp * 0.5);
    if (s.map) s.map = retreat(s.map);
    s.flags.justRevived = true;
    return s;
  }
  s.pending = { kind: 'dead' };
  return s;
}

function rollRewards(s: Save): string[] {
  const pool = REWARD_POOLS[s.pool] ?? REWARD_POOLS.act1;
  const [sh, n] = shuffle(pool, s.seed);
  s.seed = n;
  return sh.slice(0, 3);
}

export function takeReward(s0: Save, cardId: string | null): Save {
  if (!s0.pending || s0.pending.kind !== 'reward') return s0;
  const s = copy(s0);
  const p = s0.pending;
  if (cardId && p.options.includes(cardId)) s.deck.push({ uid: `d${s.uidSeq++}`, id: cardId, up: false });
  s.pending = p.upgrade ? { kind: 'upgrade' } : null;
  return finishIfBattleStep(s);
}

function finishIfBattleStep(s: Save): Save {
  // 非地图战斗（教学战）领奖后进入下一步
  if (!s.pending && FLOW[s.step].k === 'battle') return advance(s);
  return s;
}

export function upgradeCard(s0: Save, uid: string | null): Save {
  const p = s0.pending;
  if (!p || !(p.kind === 'upgrade' || (p.kind === 'restPick' && p.mode === 'upgrade'))) return s0;
  const s = copy(s0);
  const c = s.deck.find((d) => d.uid === uid);
  if (c && !c.up) c.up = true;
  else if (uid !== null) return s0;
  s.pending = null;
  if (s.map) s.map = complete(s.map);
  return s;
}

export function removeCard(s0: Save, uid: string | null): Save {
  const p = s0.pending;
  if (!p || p.kind !== 'restPick' || p.mode !== 'remove') return s0;
  const s = copy(s0);
  if (uid !== null) {
    if (s.deck.length <= 5) return s0;
    const i = s.deck.findIndex((d) => d.uid === uid);
    if (i < 0) return s0;
    s.deck.splice(i, 1);
  }
  s.pending = null;
  if (s.map) s.map = complete(s.map);
  return s;
}

export function restChoose(s0: Save, opt: 'heal' | 'upgrade' | 'remove'): Save {
  if (!s0.pending || s0.pending.kind !== 'rest') return s0;
  const s = copy(s0);
  if (opt === 'heal') {
    s.hp = Math.min(s.maxHp, s.hp + Math.ceil(s.maxHp * 0.3));
    s.pending = null;
    if (s.map) s.map = complete(s.map);
  } else {
    s.pending = { kind: 'restPick', mode: opt };
  }
  return s;
}

export function setFlag(s0: Save, k: string, v: unknown): Save {
  return { ...s0, flags: { ...s0.flags, [k]: v } };
}

export function exportSave(s: Save): string {
  return btoa(unescape(encodeURIComponent(JSON.stringify(s))));
}
export function importSave(txt: string): Save | null {
  try { return validate(JSON.parse(decodeURIComponent(escape(atob(txt.trim()))))); } catch { return null; }
}
