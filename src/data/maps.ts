// 交叉路线图（参考《杀戮尖塔》）：每张图正常只沿一条路线前进。
export type NodeKind = 'start' | 'battle' | 'elite' | 'rest' | 'boss';

export interface MapNode {
  id: string;
  kind: NodeKind;
  layer: number;
  row: number; // 同层内的位置，用于绘制
  enemies?: string[];
  hpScale?: number;
  difficulty?: 1 | 2 | 3;
  next: string[];
}

export interface MapDef {
  id: string;
  name: string;
  pool: string; // 奖励池
  recursion: number;
  nodes: Record<string, MapNode>;
}

const n = (id: string, kind: NodeKind, layer: number, row: number, next: string[], enemies?: string[], hpScale = 1, difficulty: 1 | 2 | 3 = 1): MapNode =>
  ({ id, kind, layer, row, next, enemies, hpScale, difficulty });

export const MAPS: Record<string, MapDef> = {
  act1: {
    id: 'act1', name: '第一张研究图：未知之门', pool: 'act1', recursion: 0,
    nodes: {
      start: n('start', 'start', 1, 1, ['a', 'b']),
      a: n('a', 'battle', 2, 0, ['c', 'd'], ['sortFort'], 1, 1),
      b: n('b', 'battle', 2, 2, ['c', 'd'], ['plasma'], 1, 1),
      c: n('c', 'rest', 3, 0, ['boss']),
      d: n('d', 'battle', 3, 2, ['boss'], ['arith', 'arith'], 0.8, 2),
      boss: n('boss', 'boss', 4, 1, [], ['geometry'], 1.3, 2),
    },
  },
  act2a: {
    id: 'act2a', name: '第二张研究图：答案之光（上）', pool: 'act2', recursion: 0,
    nodes: {
      start: n('start', 'start', 0, 1, ['a', 'b']),
      a: n('a', 'battle', 1, 0, ['c', 'd'], ['matrix'], 1, 2),
      b: n('b', 'battle', 1, 2, ['d', 'e'], ['protein'], 1, 2),
      c: n('c', 'rest', 2, 0, ['f']),
      d: n('d', 'elite', 2, 1, ['f', 'g'], ['capset'], 1, 3),
      e: n('e', 'battle', 2, 2, ['g'], ['sortFort', 'plasma'], 1, 2),
      f: n('f', 'battle', 3, 0, ['boss'], ['geometry'], 1.2, 2),
      g: n('g', 'rest', 3, 2, ['boss']),
      boss: n('boss', 'boss', 4, 1, [], ['boundary', 'fluidCore', 'mesh'], 1, 3),
    },
  },
  act2b: {
    id: 'act2b', name: '第三张研究图：答案之光（下）', pool: 'act2b', recursion: 1,
    nodes: {
      start: n('start', 'start', 0, 1, ['a', 'b']),
      a: n('a', 'battle', 1, 0, ['c', 'd'], ['protein', 'arith'], 1.2, 2),
      b: n('b', 'battle', 1, 2, ['d'], ['matrix'], 1.3, 2),
      c: n('c', 'rest', 2, 0, ['boss']),
      d: n('d', 'rest', 2, 2, ['boss']),
      boss: n('boss', 'boss', 3, 1, [], ['bootstrap'], 1, 3),
    },
  },
  // 专用测试路线：验证回溯与复活（开发者入口）
  test: {
    id: 'test', name: '测试路线', pool: 'act1', recursion: 0,
    nodes: {
      start: n('start', 'start', 0, 1, ['a']),
      a: n('a', 'battle', 1, 1, ['b', 'c'], ['arith'], 1, 1),
      b: n('b', 'elite', 2, 0, ['boss'], ['capset'], 2, 3),
      c: n('c', 'rest', 2, 2, ['boss']),
      boss: n('boss', 'boss', 3, 1, [], ['geometry'], 1, 2),
    },
  },
};
