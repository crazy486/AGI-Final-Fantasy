import { useState } from 'react';
import { sfx } from '../audio';
import { HOTSPOTS } from '../data/life';
import { portraitFor } from '../assets';
import { Backdrop } from './Backdrop';

// 第五幕：生活互动。不设胜负，三个关键互动完成后可进入下一天。
export function Life({ onDone }: { onDone: () => void }) {
  const [seen, setSeen] = useState<string[]>([]);
  const [open, setOpen] = useState<string | null>(null);
  const [line, setLine] = useState(0);
  const h = HOTSPOTS.find((x) => x.id === open);
  const keysDone = HOTSPOTS.filter((x) => x.key).every((x) => seen.includes(x.id));

  const step = () => {
    sfx('click');
    if (!h) return;
    if (line + 1 >= h.lines.length) { setSeen(seen.includes(h.id) ? seen : [...seen, h.id]); setOpen(null); setLine(0); }
    else setLine(line + 1);
  };

  return (
    <div className="battle">
      <Backdrop bg="home" />
      <img className="life-ning" src={portraitFor('宁宁', 'calm', false)!} alt="宁宁" />
      {h && h.lines[line].s === '海默' && <img className="portrait p-right" src={portraitFor('海默', 'calm', false)!} alt="" />}
      <div className="b-top"><h2 className="life-title">2076 年 · 海边的家</h2><span className="pill">已探索 {seen.length} / {HOTSPOTS.length}</span></div>
      {HOTSPOTS.map((x) => (
        <button key={x.id} className={`hotspot ${seen.includes(x.id) ? 'seen' : ''}`} style={{ left: `${x.x}%`, top: `${x.y}%` }} onClick={() => { sfx('click'); setOpen(x.id); setLine(0); }}>
          {x.id === 'ning' ? '👧' : '🔍'} {x.label}
        </button>
      ))}
      {h && (
        <div className="dialog panel" onClick={step} role="button" tabIndex={0}>
          {h.lines[line].s && <div className="who">{h.lines[line].s}</div>}
          <div className={`txt ${h.lines[line].s ? '' : 'narr'}`}>{h.lines[line].t}</div>
          <div className="hint">点击继续</div>
        </div>
      )}
      {!h && keysDone && <div className="map-foot"><span /><button className="btn primary" onClick={onDone}>天色渐晚</button></div>}
      {!h && !keysDone && <div className="map-foot"><span className="life-hint">点击场景中的人物和物品。</span></div>}
    </div>
  );
}
