import { CARDS } from '../data/cards';
import { ENEMIES } from '../data/enemies';
import { shuffle } from './rng';
import type { BattleEvent, BattleState, CardInst, EnemyState, Intent } from './types';

// 纯函数战斗规则：所有操作返回新状态，不修改入参。

export function cardCost(c: CardInst): number {
  const d = CARDS[c.id];
  return c.up && d.upCost !== undefined ? d.upCost : d.cost;
}

export function currentIntent(e: EnemyState): Intent {
  const d = ENEMIES[e.defId];
  return d.intents[e.intentIndex % d.intents.length];
}

export interface StartOpts {
  deck: CardInst[];
  enemyIds: string[];
  hp: number;
  maxHp: number;
  seed: number;
  recursion?: number;
  maxEnergy?: number;
  hpScale?: number;
}

export function startBattle(o: StartOpts): BattleState {
  const [pile, rng] = shuffle(o.deck, o.seed);
  const enemies: EnemyState[] = o.enemyIds.map((id, i) => {
    const hp = Math.round(ENEMIES[id].hp * (o.hpScale ?? 1));
    return { uid: `e${i}`, defId: id, hp, maxHp: hp, block: 0, strength: 0, intentIndex: 0 };
  });
  let s: BattleState = {
    enemies,
    player: { hp: o.hp, maxHp: o.maxHp, block: 0, energy: 0, maxEnergy: o.maxEnergy ?? 3, momentum: 0, verified: false },
    drawPile: pile, hand: [], discard: [], exhausted: [],
    turn: 0, rng, recursion: o.recursion ?? 0, outcome: 'ongoing', events: [], log: [], uidSeq: 0,
  };
  s = beginPlayerTurn(s);
  return s;
}

function clone(s: BattleState): BattleState {
  return {
    ...s,
    enemies: s.enemies.map((e) => ({ ...e })),
    player: { ...s.player },
    drawPile: s.drawPile.slice(), hand: s.hand.slice(), discard: s.discard.slice(), exhausted: s.exhausted.slice(),
    events: [], log: s.log.slice(-30),
  };
}

function drawCards(s: BattleState, n: number) {
  let drawn = 0;
  for (let i = 0; i < n; i++) {
    if (s.hand.length >= 10) break;
    if (s.drawPile.length === 0) {
      if (s.discard.length === 0) break;
      const [p, r] = shuffle(s.discard, s.rng);
      s.drawPile = p; s.rng = r; s.discard = [];
    }
    s.hand.push(s.drawPile.shift()!);
    drawn++;
  }
  if (drawn) s.events.push({ type: 'draw', count: drawn });
}

function beginPlayerTurn(s0: BattleState): BattleState {
  const s = clone(s0);
  s.turn += 1;
  s.player.block = 0; // 护盾在玩家下回合开始时清空
  s.player.energy = s.player.maxEnergy; // 恢复算力，不积攒
  s.player.verified = false;
  drawCards(s, 5);
  return s;
}

function living(s: BattleState) {
  return s.enemies.filter((e) => e.hp > 0);
}

function hitEnemy(s: BattleState, e: EnemyState, raw: number) {
  const d = ENEMIES[e.defId];
  let dmg = raw;
  if (d.mechanics.includes('conditionArmor') && !s.player.verified) {
    dmg = Math.floor(dmg / 2);
  }
  if (d.mechanics.includes('linkedCore') && s.enemies.some((x) => x.hp > 0 && ENEMIES[x.defId].mechanics.includes('linkedSub'))) {
    dmg = Math.floor(dmg / 2);
  }
  const blocked = Math.min(e.block, dmg);
  e.block -= blocked;
  const real = dmg - blocked;
  e.hp = Math.max(0, e.hp - real);
  s.events.push({ type: 'damageEnemy', uid: e.uid, amount: real, blocked });
  if (e.hp === 0) {
    s.events.push({ type: 'enemyDefeated', uid: e.uid });
    s.log.push(`${d.name} 已突破。`);
    if (d.mechanics.includes('linkedSub')) {
      s.enemies.forEach((x) => {
        if (ENEMIES[x.defId].mechanics.includes('linkedCore')) x.block = 0;
      });
      s.events.push({ type: 'mechanic', text: '子问题解决，核心失去护盾。' });
    }
  }
}

export function canPlay(s: BattleState, uid: string): boolean {
  if (s.outcome !== 'ongoing') return false;
  const c = s.hand.find((h) => h.uid === uid);
  if (!c) return false;
  const d = CARDS[c.id];
  if (d.unplayable) return false;
  return cardCost(c) <= s.player.energy;
}

export function playCard(s0: BattleState, uid: string, targetUid?: string): BattleState {
  if (!canPlay(s0, uid)) return s0;
  const s = clone(s0);
  const idx = s.hand.findIndex((h) => h.uid === uid);
  const card = s.hand[idx];
  const d = CARDS[card.id];
  let target: EnemyState | undefined;
  if (d.target) {
    target = s.enemies.find((e) => e.uid === targetUid && e.hp > 0) ?? living(s)[0];
    if (!target) return s0;
  }
  s.hand.splice(idx, 1);
  s.player.energy -= cardCost(card);
  const up = card.up;
  // 先判断“已验证”加成是否成立（以打出前的状态为准，验证牌自身之后才标记）
  const wasVerified = s.player.verified;
  for (const ef of d.effects) {
    switch (ef.kind) {
      case 'damage': {
        let base = (up && ef.upAmount !== undefined ? ef.upAmount : ef.amount) + s.recursion;
        if (ef.verifiedBonus && wasVerified) base += up && ef.upVerifiedBonus !== undefined ? ef.upVerifiedBonus : ef.verifiedBonus;
        if (ef.momentumMul) {
          base += s.player.momentum * (up && ef.upMomentumMul !== undefined ? ef.upMomentumMul : ef.momentumMul);
          if (s.player.momentum) s.events.push({ type: 'mechanic', text: `推理链 ×${s.player.momentum} 释放` });
          s.player.momentum = 0;
        }
        const times = ef.times ?? 1;
        for (let i = 0; i < times && target && target.hp > 0; i++) hitEnemy(s, target, base);
        break;
      }
      case 'counter': {
        if (target && target.hp > 0) {
          const it = currentIntent(target);
          if (it.kind === 'attack' || it.kind === 'attackBlock') {
            hitEnemy(s, target, (up && ef.upAmount !== undefined ? ef.upAmount : ef.amount));
            s.events.push({ type: 'mechanic', text: '反例命中：打断了错误推导' });
          }
        }
        break;
      }
      case 'block': {
        const a = up && ef.upAmount !== undefined ? ef.upAmount : ef.amount;
        s.player.block += a;
        s.events.push({ type: 'block', who: 'player', amount: a });
        break;
      }
      case 'draw':
        if (!ef.onlyIfVerified || wasVerified) drawCards(s, up && ef.upAmount !== undefined ? ef.upAmount : ef.amount);
        break;
      case 'momentum':
        s.player.momentum += up && ef.upAmount !== undefined ? ef.upAmount : ef.amount;
        break;
      case 'energy':
        s.player.energy += up && ef.upAmount !== undefined ? ef.upAmount : ef.amount;
        break;
      case 'verify':
        if (!s.player.verified) s.events.push({ type: 'mechanic', text: '已验证' });
        s.player.verified = true;
        break;
    }
  }
  if (d.exhaust) s.exhausted.push(card); else s.discard.push(card);
  s.log.push(`打出《${d.name}》`);
  if (living(s).length === 0) s.outcome = 'won';
  return s;
}

function enemyAct(s: BattleState, e: EnemyState) {
  const d = ENEMIES[e.defId];
  const it = currentIntent(e);
  const hitPlayer = (raw: number) => {
    const blocked = Math.min(s.player.block, raw);
    s.player.block -= blocked;
    const real = raw - blocked;
    s.player.hp = Math.max(0, s.player.hp - real);
    s.events.push({ type: 'damagePlayer', amount: real, blocked });
  };
  switch (it.kind) {
    case 'attack':
      for (let i = 0; i < (it.times ?? 1) && s.player.hp > 0; i++) hitPlayer(it.amount + e.strength);
      break;
    case 'attackBlock':
      hitPlayer(it.amount + e.strength);
      e.block += it.block;
      break;
    case 'block':
      e.block += it.amount;
      s.events.push({ type: 'block', who: e.uid, amount: it.amount });
      break;
    case 'buff':
      e.strength += it.amount;
      s.events.push({ type: 'mechanic', text: `${d.name} 力量 +${it.amount}` });
      break;
    case 'noise':
      for (let i = 0; i < it.count; i++) s.discard.push({ uid: `n${s.uidSeq++}`, id: 'noise', up: false });
      s.events.push({ type: 'mechanic', text: `${d.name} 注入 ${it.count} 张噪声数据` });
      break;
  }
  if (d.mechanics.includes('adaptive')) {
    e.strength += 1;
    s.events.push({ type: 'mechanic', text: '自举：力量 +1' });
  }
  e.intentIndex += 1;
}

export function endTurn(s0: BattleState): BattleState {
  if (s0.outcome !== 'ongoing') return s0;
  const s = clone(s0);
  // 弃置手牌，噪声牌被弃置时移出
  for (const c of s.hand) {
    if (c.id === 'noise') s.exhausted.push(c); else s.discard.push(c);
  }
  s.hand = [];
  s.player.momentum = Math.max(0, s.player.momentum - 1); // 推理链跨回合衰减 1
  // 敌人护盾在其行动前清空（与玩家一致）
  for (const e of living(s)) {
    e.block = 0;
    enemyAct(s, e);
    if (s.player.hp <= 0) break;
  }
  const evs: BattleEvent[] = s.events;
  if (s.player.hp <= 0) {
    s.outcome = 'lost';
    return s;
  }
  const n = beginPlayerTurn(s);
  n.events = [...evs, ...n.events];
  return n;
}
