// 剧本数据格式：程序绘制文字，背景与立绘为 CSS/SVG 绘制。
export type BgId = 'black' | 'lab_day' | 'lab_night' | 'hospital' | 'hospital_2003' | 'office' | 'server' | 'datacenter' | 'datacenter_alert'
  | 'city' | 'home' | 'garden' | 'council' | 'final_room' | 'news' | 'title'
  | 'cg_2017' | 'cg_golden' | 'cg_slumped' | 'cg_green1' | 'cg_green2' | 'cg_green3';
export type Expr = 'calm' | 'focus' | 'surprise' | 'tired';

export interface Line {
  s?: string; // 说话者；空为旁白
  t: string;
  bg?: BgId;
  e?: Expr; // 海默表情
  tip?: string; // 科普小贴士 id
  fx?: 'chapter' | 'terminal' | 'shake' | 'green' | 'flash';
  sub?: string; // chapter 副标题
}

export interface Choice {
  text: string;
  reply: Line[];
}

export interface Scene {
  id: string;
  lines: (Line | { choice: Choice[] })[];
}

export const L = (s: string, t: string, o: Partial<Line> = {}): Line => ({ s, t, ...o });
export const N = (t: string, o: Partial<Line> = {}): Line => ({ t, ...o });
export const CH = (t: string, sub: string, bg: BgId = 'black'): Line => ({ t, sub, fx: 'chapter', bg });
