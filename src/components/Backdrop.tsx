import { BG_IMAGE } from '../assets';
import type { BgId, Expr } from '../data/story/types';

// 程序绘制的场景装饰（无内嵌文字），替代位图背景，便于后续替换为美术素材
export function Backdrop({ bg }: { bg: BgId }) {
  const img = BG_IMAGE[bg];
  if (img) return <div key={bg} className="bg bg-img fade-in" aria-hidden style={{ backgroundImage: `url(${img})` }} />;
  return (
    <div className={`bg bg-${bg}`} aria-hidden>
      <svg className="bg-deco" viewBox="0 0 1920 1080" preserveAspectRatio="none">
        {(bg === 'lab_day' || bg === 'lab_night') && (
          <g opacity={bg === 'lab_day' ? 0.5 : 0.8}>
            <rect x="1250" y="160" width="520" height="340" fill={bg === 'lab_day' ? '#9fd0ff' : '#0b2a4a'} stroke="#5a7aa0" strokeWidth="8" />
            <line x1="1510" y1="160" x2="1510" y2="500" stroke="#5a7aa0" strokeWidth="6" />
            {[0, 1, 2].map((i) => (
              <g key={i}>
                <rect x={180 + i * 170} y="300" width="130" height="300" fill="#122033" stroke="#2c4c70" />
                {[0, 1, 2, 3, 4, 5].map((j) => <circle key={j} cx={210 + i * 170} cy={330 + j * 45} r="6" fill={j % 2 ? '#5fd4ff' : '#6bffb0'} />)}
              </g>
            ))}
            <rect x="700" y="520" width="520" height="60" fill="#22324a" />
            <rect x="820" y="400" width="280" height="120" fill="#0b1626" stroke="#5fd4ff" strokeWidth="3" />
          </g>
        )}
        {bg === 'hospital' && <g opacity=".5"><rect x="200" y="200" width="300" height="380" fill="#fff" /><rect x="1300" y="380" width="460" height="200" fill="#e8f2f7" /><path d="M330 300h40v40h40v40h-40v40h-40v-40h-40v-40h40z" fill="#e05a5a" /></g>}
        {bg === 'office' && <g opacity=".6"><rect x="150" y="180" width="600" height="380" fill="#1a1712" stroke="#5a4c36" strokeWidth="6" />{[0, 1, 2, 3].map((i) => <rect key={i} x={1200 + i * 120} y={300 - i * 20} width="90" height={280 + i * 20} fill="#2c2619" />)}</g>}
        {bg === 'server' && <g>{Array.from({ length: 40 }).map((_, i) => <circle key={i} cx={60 + (i % 14) * 128} cy={150 + Math.floor(i / 14) * 260} r="5" fill={i % 5 ? '#2fa8ff' : '#ffb35f'} opacity=".8" />)}</g>}
        {(bg === 'city' || bg === 'final_room') && (
          <g opacity={bg === 'city' ? 0.9 : 0.6} transform={bg === 'final_room' ? 'translate(1100 120) scale(.42)' : ''}>
            {bg === 'final_room' && <rect x="-40" y="-40" width="1960" height="1240" fill="#13213a" stroke="#38507a" strokeWidth="30" />}
            {Array.from({ length: 22 }).map((_, i) => { const h = 200 + ((i * 137) % 380); return <rect key={i} x={i * 88} y={1080 - h - 180} width="70" height={h} fill="#1c2244" />; })}
            {Array.from({ length: 60 }).map((_, i) => <rect key={'w' + i} x={20 + (i * 97) % 1900} y={560 + (i * 53) % 300} width="10" height="14" fill="#ffd98a" opacity=".8" />)}
          </g>
        )}
        {bg === 'final_room' && <g><rect x="300" y="620" width="700" height="40" fill="#1e2a3e" /><rect x="420" y="470" width="260" height="150" fill="#0b1626" stroke="#5fd4ff" strokeWidth="3" /></g>}
        {bg === 'home' && <g><rect x="1250" y="120" width="560" height="360" fill="#bfe6fa" stroke="#fff" strokeWidth="14" /><rect x="1380" y="380" width="120" height="30" rx="8" fill="#fff" /><rect x="1600" y="400" width="160" height="26" rx="8" fill="#eee" /><rect x="200" y="560" width="500" height="40" fill="#6b4e33" /></g>}
        {bg === 'council' && <g opacity=".7"><ellipse cx="960" cy="760" rx="700" ry="140" fill="#1a2440" stroke="#3a5080" strokeWidth="4" /><circle cx="960" cy="330" r="110" fill="none" stroke="#5fd4ff" strokeWidth="4" /></g>}
        {bg === 'news' && <g opacity=".3"><rect x="0" y="880" width="1920" height="80" fill="#c0392b" /><circle cx="1600" cy="300" r="200" fill="none" stroke="#fff" strokeWidth="2" /></g>}
      </svg>
    </div>
  );
}

/** 终局三张 CG 始终叠在同一镜头内，只改变上层透明度，避免换图时缩放重置。 */
export function FinaleBackdrop({ phase }: { phase: number }) {
  const frames: BgId[] = ['cg_green1', 'cg_green2', 'cg_green3'];
  return <div className="finale-backdrop" aria-hidden>
    {frames.map((bg, index) => <div key={bg} className={`finale-frame${phase >= index ? ' is-active' : ''}`}>
      <Backdrop bg={bg} />
    </div>)}
  </div>;
}

/** 立绘（T05 透明 PNG） */
export function Portrait({ src, side = 'center' }: { src: string; side?: 'center' | 'left' | 'right' | 'dim' | 'ai' | 'ai-dim' }) {
  return <img className={`portrait p-${side}`} src={src} alt="" draggable={false} />;
}
