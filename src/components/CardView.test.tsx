import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { CardView } from './BattleView';
import { startBattle } from '../engine/battle';

describe('counterexample preview', () => {
  it('shows the same modified damage as combat before verification', () => {
    const battle = startBattle({deck: [{uid: 'c0', id: 'counterexample', up: false}], enemyIds:['geometry'], hp:60, maxHp:60, seed:1});
    const html = renderToStaticMarkup(<CardView c={battle.hand[0]} battle={battle} />);
    expect(html).toContain('本次推进 5'); // 10 经“条件不足”减半
  });
});
