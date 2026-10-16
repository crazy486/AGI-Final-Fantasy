import { useState } from 'react';
import { sfx } from '../audio';
import { NEG_ROUNDS } from '../data/negotiation';
import { portraitFor } from '../assets';
import { Backdrop, Portrait } from './Backdrop';

// 第六幕：三轮谈判。依据证据的选项会争取到局部让步，但目标无法兼容。
export function Negotiation({ proven, onDone }: { proven: string[]; onDone: (gains: string[]) => void }) {
  const [r, setR] = useState(0);
  const [reply, setReply] = useState<string | null>(null);
  const [gains, setGains] = useState<string[]>([]);
  const round = NEG_ROUNDS[r];

  const pick = (k: number) => {
    const o = round.options[k];
    sfx(o.good ? 'mechanic' : 'click');
    setReply(o.reply);
    if (o.gain) setGains([...gains, o.gain]);
  };
  const next = () => {
    setReply(null);
    if (r + 1 >= NEG_ROUNDS.length) onDone(gains); else setR(r + 1);
  };

  return (
    <div className="battle">
      <Backdrop bg="council" />
      <Portrait src={portraitFor('海默', r === 2 ? 'tired' : 'focus', false)!} side="left" />
      <img className="portrait p-ai neg-ai" src={portraitFor('问源', 'calm', false, true)!} alt="" />
      <div className="side-wrap" style={{ pointerEvents: 'none' }}>
        <div className="side-head" style={{ pointerEvents: 'auto' }}><h2>谈判 · 第 {r + 1} / 3 轮</h2><span className="pill">已争取：{gains.length ? gains.join('；') : '无'}</span></div>
      </div>
      <div className="dialog panel" style={{ minHeight: 320 }}>
        <div className="who">问源</div>
        <div className="txt">{reply ?? round.prompt}</div>
        <div style={{ marginTop: 20, display: 'flex', flexDirection: 'column', gap: 10 }}>
          {!reply && round.options.map((o, k) => {
            const locked = o.needs && !proven.includes(o.needs);
            return <button key={k} className="btn" disabled={!!locked} onClick={() => pick(k)} style={{ textAlign: 'left' }}>{o.needs ? '📎 ' : ''}{o.text}{locked ? '（缺少证据）' : ''}</button>;
          })}
          {reply && <button className="btn primary" onClick={next}>继续</button>}
        </div>
      </div>
    </div>
  );
}
