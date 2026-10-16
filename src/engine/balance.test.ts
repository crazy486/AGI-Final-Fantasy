import { describe, expect, it } from 'vitest';
import { CARDS, REWARD_POOLS, STARTER_DECK } from '../data/cards';
import { MAPS } from '../data/maps';
import { canPlay, currentIntent, endTurn, playCard, startBattle } from './battle';
import type { BattleState, CardInst } from './types';

// 简单启发式玩家：用于检查数值是否可通关（不是最优策略）
function autoPlay(b: BattleState): BattleState {
  let guard = 0;
  while (b.outcome === 'ongoing' && guard++ < 400) {
    const alive = b.enemies.filter((e) => e.hp > 0);
    const incoming = alive.reduce((a, e) => { const it = currentIntent(e); return a + (it.kind === 'attack' ? (it.amount + e.strength) * (it.times ?? 1) : it.kind === 'attackBlock' ? it.amount + e.strength : 0); }, 0);
    const playable = b.hand.filter((c) => canPlay(b, c.uid));
    if (!playable.length) { b = endTurn(b); continue; }
    const score = (c: CardInst) => {
      const d = CARDS[c.id];
      if (d.type === '策略') return 100;
      if (d.type === '验证') return !b.player.verified ? 90 : b.player.block < incoming ? 60 : 5;
      return 50 + d.cost * 5;
    };
    playable.sort((x, y) => score(y) - score(x));
    const c = playable[0];
    // 目标：子问题优先，再血最少
    const tgt = alive.slice().sort((x, y) => (x.defId === 'fluidCore' ? 1 : 0) - (y.defId === 'fluidCore' ? 1 : 0) || x.hp - y.hp)[0];
    const nb = playCard(b, c.uid, tgt.uid);
    if (nb === b) { b = endTurn(b); continue; }
    b = nb;
  }
  return b;
}

function runMap(mapId: string, deck: CardInst[], hp: number, seed: number, recursion: number, path: string[]) {
  const m = MAPS[mapId];
  let pool = REWARD_POOLS[m.pool];
  for (const id of path) {
    const n = m.nodes[id];
    if (n.kind === 'rest') { hp = Math.min(60, hp + 18); continue; }
    const b = autoPlay(startBattle({ deck, enemyIds: n.enemies!, hp, maxHp: 60, seed: seed++, recursion, hpScale: n.hpScale }));
    if (b.outcome !== 'won') return { ok: false, hp: 0, deck, at: mapId + ':' + id + ':' + b.enemies.map((e) => e.hp).join('/') };
    hp = b.player.hp;
    deck = [...deck, { uid: 'r' + seed, id: pool[seed % pool.length], up: false }];
  }
  return { ok: true, hp, deck, at: '' };
}

describe('balance', () => {
  it('heuristic player can usually clear the research maps', () => {
    let wins = 0; const fails: string[] = [];
    for (let seed = 1; seed <= 30; seed++) {
      let deck = STARTER_DECK.map((id, i) => ({ uid: 'd' + i, id, up: false }));
      const t = autoPlay(startBattle({ deck, enemyIds: ['arith'], hp: 60, maxHp: 60, seed }));
      let r = runMap('act1', deck, t.player.hp, seed * 100, 0, ['b', 'c', 'boss']);
      if (r.ok) r = runMap('act2a', r.deck, r.hp, seed * 200, 0, ['a', 'c', 'f', 'boss']);
      if (r.ok) r = runMap('act2b', r.deck, Math.max(r.hp, 30), seed * 300, 1, ['a', 'c', 'boss']);
      if (r.ok) wins++; else fails.push(r.at);
    }
    console.log('wins', wins, 'fails', fails.join(','));
    expect(wins).toBeGreaterThanOrEqual(20);
  });
});
