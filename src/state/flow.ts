// 七幕主线流程。每一步对应一个界面；流程线性，局部结果写入 flags。
export type Step =
  | { k: 'scene'; id: string }
  | { k: 'battle'; enemies: string[]; hpScale?: number; tutorial?: boolean }
  | { k: 'map'; id: string }
  | { k: 'recursion'; lv: number }
  | { k: 'reg' }
  | { k: 'inv' }
  | { k: 'auth' }
  | { k: 'review'; i: number }
  | { k: 'life' }
  | { k: 'evidence' }
  | { k: 'neg' }
  | { k: 'final' }
  | { k: 'credits' };

export const FLOW: Step[] = [
  { k: 'scene', id: 'prologue' },
  { k: 'scene', id: 'act1Intro' },
  { k: 'battle', enemies: ['arith'], tutorial: true },
  { k: 'scene', id: 'act1Mid' },
  { k: 'map', id: 'act1' },
  { k: 'scene', id: 'act1End' },
  { k: 'scene', id: 'act2Intro' },
  { k: 'map', id: 'act2a' },
  { k: 'scene', id: 'act2Past' },
  { k: 'scene', id: 'act2Mid' },
  { k: 'scene', id: 'act2Recursion' },
  { k: 'recursion', lv: 1 },
  { k: 'map', id: 'act2b' },
  { k: 'recursion', lv: 2 },
  { k: 'scene', id: 'act2End' },
  { k: 'scene', id: 'act3Intro' },
  { k: 'reg' },
  { k: 'scene', id: 'act3Incident' },
  { k: 'inv' },
  { k: 'scene', id: 'act3End' },
  { k: 'scene', id: 'act4Intro' },
  { k: 'auth' },
  { k: 'review', i: 0 },
  { k: 'scene', id: 'act4Mid' },
  { k: 'review', i: 1 },
  { k: 'review', i: 2 },
  { k: 'scene', id: 'act4End' },
  { k: 'scene', id: 'act5Intro' },
  { k: 'life' },
  { k: 'scene', id: 'act5End' },
  { k: 'scene', id: 'act6Intro' },
  { k: 'evidence' },
  { k: 'scene', id: 'act6Mid' },
  { k: 'neg' },
  { k: 'scene', id: 'act6End' },
  { k: 'scene', id: 'act7Intro' },
  { k: 'final' },
  { k: 'scene', id: 'act7End' },
  { k: 'scene', id: 'wake' },
  { k: 'credits' },
];

// 章节入口（标题页“章节选择”用，供评委与测试快速跳转）
export const CHAPTERS: { name: string; step: number }[] = [
  ['序章', 'prologue'], ['第一幕　未知之门', 'act1Intro'], ['第二幕　答案之光', 'act2Intro'], ['第三幕　危险许可', 'act3Intro'],
  ['第四幕　渐远的舵', 'act4Intro'], ['第五幕　这是最好的时代', 'act5Intro'], ['第六幕　明日的代价', 'act6Intro'], ['第七幕　真理尽头', 'act7Intro'],
].map(([name, id]) => ({ name, step: FLOW.findIndex((s) => s.k === 'scene' && s.id === id) }));
