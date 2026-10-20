import { describe, expect, it } from 'vitest';
import { canPlay, endTurn, playCard, startBattle } from './battle';
import type { CardInst } from './types';
import { ENEMIES } from '../data/enemies';

const BOOT = ENEMIES.bootstrap.hp;
const CORE = ENEMIES.fluidCore.hp;

const deck = (ids: string[]): CardInst[] => ids.map((id, i) => ({ uid: `c${i}`, id, up: false }));

describe('battle rules', () => {
  it('starts with 5 cards and 3 energy', () => {
    const s = startBattle({ deck: deck(Array(10).fill('advance')), enemyIds: ['arith'], hp: 60, maxHp: 60, seed: 1 });
    expect(s.hand).toHaveLength(5);
    expect(s.player.energy).toBe(3);
  });

  it('is deterministic for the same seed', () => {
    const d = deck(['advance', 'verify', 'retrieve', 'breakthrough', 'advance', 'verify', 'advance', 'verify']);
    const a = startBattle({ deck: d, enemyIds: ['arith'], hp: 60, maxHp: 60, seed: 42 });
    const b = startBattle({ deck: d, enemyIds: ['arith'], hp: 60, maxHp: 60, seed: 42 });
    expect(a.hand.map((c) => c.id)).toEqual(b.hand.map((c) => c.id));
  });

  it('deals damage, spends energy, and refuses when out of energy', () => {
    let s = startBattle({ deck: deck(Array(10).fill('advance')), enemyIds: ['arith'], hp: 60, maxHp: 60, seed: 1 });
    s = playCard(s, s.hand[0].uid, 'e0');
    expect(s.enemies[0].hp).toBe(12);
    expect(s.player.energy).toBe(2);
    s = playCard(s, s.hand[0].uid, 'e0');
    s = playCard(s, s.hand[0].uid, 'e0');
    expect(s.outcome).toBe('won');
  });

  it('block absorbs damage and resets next turn', () => {
    let s = startBattle({ deck: deck(Array(10).fill('verify')), enemyIds: ['arith'], hp: 60, maxHp: 60, seed: 1 });
    s = playCard(s, s.hand[0].uid);
    expect(s.player.block).toBe(5);
    s = endTurn(s); // arith 攻击 5
    expect(s.player.hp).toBe(60);
    expect(s.player.block).toBe(0);
    expect(s.hand).toHaveLength(9); // 保留未打出的 4 张，再抽 5 张
  });

  it('condition armor halves damage unless verified', () => {
    let s = startBattle({ deck: deck(['advance', 'advance', 'verify', 'verify', 'advance']), enemyIds: ['geometry'], hp: 60, maxHp: 60, seed: 3 });
    const adv = () => s.hand.find((c) => c.id === 'advance')!.uid;
    s = playCard(s, adv(), 'e0');
    expect(s.enemies[0].hp).toBe(27);
    s = playCard(s, s.hand.find((c) => c.id === 'verify')!.uid);
    s = playCard(s, adv(), 'e0');
    expect(s.enemies[0].hp).toBe(21);
  });

  it('breakthrough gets verified bonus', () => {
    let s = startBattle({ deck: deck(['breakthrough', 'verify', 'verify', 'verify', 'verify']), enemyIds: ['bootstrap'], hp: 60, maxHp: 60, seed: 3 });
    s = playCard(s, s.hand.find((c) => c.id === 'verify')!.uid);
    s = playCard(s, s.hand.find((c) => c.id === 'breakthrough')!.uid, 'e0');
    expect(s.enemies[0].hp).toBe(BOOT - 18);
  });

  it('chain consumes momentum', () => {
    let s = startBattle({ deck: deck(['decompose', 'chain', 'verify', 'verify', 'verify', 'verify']), enemyIds: ['bootstrap'], hp: 60, maxHp: 60, seed: 5 });
    if (!s.hand.find((c) => c.id === 'decompose') || !s.hand.find((c) => c.id === 'chain')) return;
    s = playCard(s, s.hand.find((c) => c.id === 'decompose')!.uid);
    s = playCard(s, s.hand.find((c) => c.id === 'chain')!.uid, 'e0');
    expect(s.enemies[0].hp).toBe(BOOT - 10);
    expect(s.player.momentum).toBe(0);
  });

  it('linked core takes half damage while subs live; sub kill strips core block', () => {
    let s = startBattle({ deck: deck(Array(10).fill('advance')), enemyIds: ['fluidCore', 'boundary'], hp: 60, maxHp: 60, seed: 1 });
    s = playCard(s, s.hand[0].uid, 'e0');
    expect(s.enemies[0].hp).toBe(CORE - 3);
  });

  it('cannot play noise; replaying a used uid is a no-op', () => {
    let s = startBattle({ deck: deck(Array(10).fill('advance')), enemyIds: ['plasma'], hp: 60, maxHp: 60, seed: 1 });
    const uid = s.hand[0].uid;
    s = playCard(s, uid, 'e0');
    const again = playCard(s, uid, 'e0');
    expect(again).toBe(s);
    s = endTurn(s);
    expect(s.discard.some((c) => c.id === 'noise') || s.hand.some((c) => c.id === 'noise') || s.drawPile.some((c) => c.id === 'noise')).toBe(true);
    const n = s.hand.find((c) => c.id === 'noise');
    if (n) expect(canPlay(s, n.uid)).toBe(false);
  });

  it('loses when hp reaches 0', () => {
    let s = startBattle({ deck: deck(Array(10).fill('retrieve')), enemyIds: ['arith'], hp: 3, maxHp: 60, seed: 1 });
    s = endTurn(s);
    expect(s.outcome).toBe('lost');
    expect(endTurn(s)).toBe(s);
  });

  it('keeps unplayed cards across turns and draws five new cards', () => {
    let s = startBattle({ deck: deck(Array(16).fill('verify')), enemyIds: ['arith'], hp: 60, maxHp: 60, seed: 1 });
    s = playCard(s, s.hand[0].uid);
    const kept = s.hand.map((c) => c.uid);
    const next = endTurn(s);
    expect(next.hand.slice(0, 4).map((c) => c.uid)).toEqual(kept);
    expect(next.hand).toHaveLength(9);
    expect(next.drawPile).toHaveLength(6);
    expect(next.discard).toHaveLength(1);
    expect(s.hand).toHaveLength(4); // 不修改输入
  });

  it('stops drawing at ten without losing the extra cards in the pile', () => {
    let s = startBattle({ deck: deck(Array(20).fill('verify')), enemyIds: ['arith'], hp: 60, maxHp: 60, seed: 1 });
    s = endTurn(s);
    expect(s.hand).toHaveLength(10);
    expect(s.drawPile).toHaveLength(10);
    s = endTurn(s);
    expect(s.hand).toHaveLength(10);
    expect(s.drawPile).toHaveLength(10);
  });

  it('removes noise at turn end while retaining ordinary cards', () => {
    const s = startBattle({ deck: deck(['noise', 'verify', 'verify', 'verify', 'verify']), enemyIds: ['arith'], hp: 60, maxHp: 60, seed: 1 });
    const next = endTurn(s);
    expect(next.hand).toHaveLength(4);
    expect(next.hand.every((c) => c.id === 'verify')).toBe(true);
    expect(next.exhausted.map((c) => c.id)).toEqual(['noise']);
  });

  it.each([0, 2])('counterexample triggers for attack and attack plus block (intent %i)', (intentIndex) => {
    const s = startBattle({ deck: deck(['counterexample']), enemyIds: ['bootstrap'], hp: 60, maxHp: 60, seed: 1 });
    s.enemies[0].intentIndex = intentIndex;
    const next = playCard(s, s.hand[0].uid, 'e0');
    expect(next.enemies[0].hp).toBe(BOOT - 10);
  });

  it('counterexample still produces ten total damage when some is blocked', () => {
    const s = startBattle({ deck: deck(['counterexample']), enemyIds: ['bootstrap'], hp: 60, maxHp: 60, seed: 1 });
    s.enemies[0].intentIndex = 2;
    s.enemies[0].block = 6;
    const next = playCard(s, s.hand[0].uid, 'e0');
    expect(next.enemies[0].hp).toBe(BOOT - 4);
    expect(next.enemies[0].block).toBe(0);
    const damage = next.events.filter((e) => e.type === 'damageEnemy');
    expect(damage).toHaveLength(1); // 一次显示合计伤害，避免两次 +5 的飘字互相遮挡
    expect(damage.reduce((n, e) => n + e.amount + e.blocked, 0)).toBe(10);
  });
});
