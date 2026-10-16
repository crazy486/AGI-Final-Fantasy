import { beforeEach, describe, expect, it } from 'vitest';
import { FLOW } from './flow';
import { advance, battleResolve, mapEnter, mapRetreat, newGame, restChoose, takeReward, upgradeCard, type Save } from './game';

const stepOf = (k: string, id?: string) => FLOW.findIndex((s: any) => s.k === k && (!id || s.id === id));
function atMap(id: string): Save {
  const s = newGame(7);
  s.step = stepOf('map', id) - 1;
  return advance(s);
}

describe('game flow', () => {
  beforeEach(() => {});
  it('map step grants a chip', () => {
    const s = atMap('act1');
    expect(s.chips).toBe(1);
    expect(s.map?.pos).toBe('start');
  });

  it('retreat during battle keeps hp loss and spends chip; cannot double-claim reward', () => {
    let s = atMap('act2a');
    s = mapEnter(s, 'a');
    expect(s.battle).not.toBeNull();
    s.battle!.player.hp = 40;
    s = mapRetreat(s);
    expect(s.chips).toBe(0);
    expect(s.hp).toBe(40);
    expect(s.battle).toBeNull();
    expect(s.map?.pos).toBe('start');
    expect(mapRetreat(s)).toBe(s);
  });

  it('win gives one reward, second resolve is no-op', () => {
    let s = atMap('act1');
    s = mapEnter(s, 'a');
    s.battle!.outcome = 'won';
    s = battleResolve(s);
    expect(s.pending?.kind).toBe('reward');
    expect(battleResolve(s)).toBe(s);
    const n = s.deck.length;
    const opt = (s.pending as any).options[0];
    s = takeReward(s, opt);
    expect(s.deck.length).toBe(n + 1);
    expect(takeReward(s, opt)).toBe(s);
  });

  it('death uses revive once, then game over', () => {
    let s = atMap('act1');
    s = mapEnter(s, 'a');
    s.battle!.outcome = 'lost';
    s = battleResolve(s);
    expect(s.revive).toBe(false);
    expect(s.hp).toBe(30);
    expect(s.map?.pos).toBe('start');
    s = mapEnter(s, 'a');
    s.battle!.outcome = 'lost';
    s = battleResolve(s);
    expect(s.pending?.kind).toBe('dead');
  });

  it('rest node: one choice only', () => {
    let s = atMap('act1');
    s.map!.done.push('a');
    s.map!.pos = 'a'; s.map!.path.push('a');
    s.hp = 20;
    s = mapEnter(s, 'c');
    expect(s.pending?.kind).toBe('rest');
    s = restChoose(s, 'heal');
    expect(s.hp).toBe(38);
    expect(restChoose(s, 'heal')).toBe(s);
    expect(upgradeCard(s, s.deck[0].uid)).toBe(s);
  });
});

describe('flow integrity', () => {
  it('recursion steps are consumed automatically and raise recursion', () => {
    const s = newGame(1);
    s.step = FLOW.findIndex((x: any) => x.k === 'recursion') - 1;
    const n = advance(s);
    expect(FLOW[n.step].k).not.toBe('recursion');
    expect(n.recursion).toBe(1);
  });
  it('walks the entire flow to credits', () => {
    let s = newGame(1);
    let guard = 0;
    while (FLOW[s.step].k !== 'credits' && guard++ < 200) s = advance(s);
    expect(FLOW[s.step].k).toBe('credits');
    expect(s.recursion).toBe(2);
  });
});

describe('chapter jump', () => {
  it('jumping to act 2 grants growth', async () => {
    const { jumpTo } = await import('./game');
    const { CHAPTERS } = await import('./flow');
    const s = jumpTo(newGame(1), CHAPTERS[2].step);
    expect(s.deck.length).toBe(14);
    expect(s.deck.some((c) => c.up)).toBe(true);
    const s1 = jumpTo(newGame(1), CHAPTERS[1].step);
    expect(s1.deck.length).toBe(10);
  });
});
