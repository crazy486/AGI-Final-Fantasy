// 素材解析层：剧情和数据只用键名，这里统一映射到 src/assets 下的图片。
import type { BgId, Expr } from './data/story/types';

const bgFiles = import.meta.glob('./assets/bg/*.webp', { eager: true, import: 'default' }) as Record<string, string>;
const artFiles = import.meta.glob('./assets/art/*.{webp,png}', { eager: true, import: 'default' }) as Record<string, string>;
const ptFiles = import.meta.glob('./assets/portraits/*.webp', { eager: true, import: 'default' }) as Record<string, string>;

const pick = (files: Record<string, string>, name: string) => {
  const k = Object.keys(files).find((p) => p.replace(/^.*\//, '').replace(/\.(webp|png)$/, '') === name);
  return k ? files[k] : null;
};
const bg = (n: string) => pick(bgFiles, n);
/** 敌人、卡牌、剧情 CG 插画（按 id 取） */
export const art = (n: string) => pick(artFiles, n);
const pt = (n: string) => pick(ptFiles, n);

// null = 程序绘制的纯色（黑屏）
export const BG_IMAGE: Record<BgId, string | null> = {
  black: null,
  lab_day: bg('lab-day'),
  lab_night: bg('lab-night'),
  office: bg('regulation'),
  server: bg('control'),
  datacenter: bg('datacenter'),
  datacenter_alert: bg('datacenter-alert'),
  council: bg('council'),
  final_room: bg('finale'),
  home: bg('home'),
  garden: bg('garden'),
  city: bg('city-night'),
  hospital: bg('hospital'),
  hospital_2003: bg('hospital-2003'),
  news: bg('news'),
  title: bg('title'),
  cg_2017: art('cg-2017'),
  cg_golden: art('cg-golden-age'),
  cg_slumped: art('cg-slumped-v2'),
  cg_green1: art('cg-green-1-v2'),
  cg_green2: art('cg-green-2-v2'),
  cg_green3: art('cg-green-3-v2'),
};

/** CG 场景已画好人物，不再叠立绘 */
export const IS_CG = (b: BgId) => b.startsWith('cg_');

/** 说话者立绘。young=true 时海默使用青年版；late=true 时问源用后期冷色版。 */
export function portraitFor(speaker: string | undefined, expr: Expr, young: boolean, late = false): string | null {
  switch (speaker) {
    case '海默': return pt(`haimer-${young ? 'young-' : ''}${expr}`) ?? pt(young ? 'haimer-young-calm' : 'haimer-calm');
    case '问源': return pt(late ? 'wenyuan-late' : 'wenyuan');
    case '方源': return pt(expr === 'tired' || expr === 'surprise' ? 'lin-worried' : 'lin');
    case '周岚': return pt(expr === 'focus' || expr === 'surprise' ? 'zhou-serious' : 'zhou');
    case '宁宁': return pt('ningning');
    case '老教授': return pt('elder-professor');
    case '委员': return pt('committee');
    default: return null;
  }
}

/** 问源立绘为方形光环，需要单独排版 */
export const isAI = (speaker?: string) => speaker === '问源';
