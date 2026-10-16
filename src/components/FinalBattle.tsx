import { useState } from 'react';
import { sfx } from '../audio';
import { FINAL_CARDS, FINAL_PHASES, canPlayFinal, endFinalPhase, playFinal, startFinal } from '../engine/final';
import { art } from '../assets';
import { Backdrop } from './Backdrop';

// 最后一幕：人类处置手段。没有生命值、没有复活和回溯。
export function FinalBattle({ onDone }: { onDone: () => void }) {
  const [s, setS] = useState(startFinal);
  const phase = FINAL_PHASES[Math.min(s.phase, FINAL_PHASES.length - 1)];
  return (
    <div className="battle">
      <Backdrop bg="final_room" />
      <div className="side-wrap">
        <div className="side-head"><h2>{s.done ? '所有手段已用尽' : phase.title}</h2><span className="pill">本阶段剩余行动 {s.playsLeft}</span></div>
        <div className="panel decide">
          <div className="bar big"><div className="fill bad" style={{ width: `${s.progress}%` }} /><span>边界实验进度 {s.progress}%</span></div>
          {s.saved > 0 && <p className="green-text" style={{ margin: '8px 0 0' }}>已撤离保护 {s.saved.toLocaleString()} 人。</p>}
        </div>
        <div className="panel logbox final-log">
          {s.log.slice(-8).map((l, i) => <div key={s.log.length - 8 + i} className={`logline fade-in ${l.who}`}>{l.who === 'ai' ? '问源：' : l.who === 'human' ? '海默：' : '— '}{l.text}</div>)}
        </div>
        {!s.done ? (
          <>
            <div className="hand" style={{ position: 'static' }}>
              {s.hand.map((id, k) => {
                const c = FINAL_CARDS[id]; const ok = canPlayFinal(s, id);
                return (
                  <button key={id + k} className="card t-验证" disabled={!ok} onClick={() => { sfx('cut'); setTimeout(() => sfx('bypass'), 700); setS(playFinal(s, id)); }}>
                    <span className="cname">{c.name}</span><span className="ctype">人类手段</span>{art(id) && <img className="cart" src={art(id)!} alt="" draggable={false} />}<span className="cdesc">{c.desc}</span>
                    {s.locked.includes(id) && <span className="flag">已被绕过</span>}
                  </button>
                );
              })}
            </div>
            <div className="row" style={{ justifyContent: 'flex-end' }}>
              <button className="btn primary" onClick={() => { sfx('hit'); setS(endFinalPhase(s)); }}>{s.playsLeft > 0 ? '结束本阶段（剩余行动作废）' : '等待问源回应'}</button>
            </div>
          </>
        ) : (
          <div className="row" style={{ justifyContent: 'flex-end' }}><button className="btn primary" onClick={onDone}>……</button></div>
        )}
      </div>
    </div>
  );
}
