import { useState } from 'react';
import { sfx } from '../audio';
import { CLAIMS, CLUES } from '../data/evidence';
import { Backdrop } from './Backdrop';

// 第六幕：证据关联。选中一条日志，再点击它支持的结论。拼出实验后果，不做审批。
export function Evidence({ onDone }: { onDone: (proven: string[]) => void }) {
  const [sel, setSel] = useState<string | null>(null);
  const [links, setLinks] = useState<Record<string, string[]>>({});
  const [msg, setMsg] = useState('选择左侧一条日志，再点击右侧它能证明的结论。');
  const proven = CLAIMS.filter((k) => k.needs.every((n) => links[k.id]?.includes(n))).map((k) => k.id);
  const used = Object.values(links).flat();

  const link = (kid: string) => {
    if (!sel) return;
    const k = CLAIMS.find((x) => x.id === kid)!;
    if (k.needs.includes(sel)) {
      sfx('mechanic');
      setLinks({ ...links, [kid]: [...(links[kid] ?? []), sel] });
      setMsg('关联成立。');
    } else {
      sfx('lose');
      setMsg(sel === 'c6' ? '公开资料只描述了实验目的，它本身不能证明后果。很多人正是只看到了这一条。' : '这条日志不能直接支持这个结论。');
    }
    setSel(null);
  };

  return (
    <div className="battle">
      <Backdrop bg="server" />
      <div className="side-wrap">
        <div className="side-head"><h2>证据关联 · 边界实验 #88213</h2><span className="pill">已证明 {proven.length} / {CLAIMS.length}</span></div>
        <div className="row" style={{ alignItems: 'stretch', gap: 30 }}>
          <div className="panel logbox" style={{ flex: 1.2 }}>
            <h3>日志与清单</h3>
            {CLUES.map((c) => (
              <button key={c.id} className={`clue ${sel === c.id ? 'on' : ''} ${used.includes(c.id) ? 'used' : ''}`} onClick={() => { sfx('click'); setSel(c.id); }}>
                <span className="dim">[{c.source}]</span> {c.text}
              </button>
            ))}
          </div>
          <div className="panel logbox">
            <h3>结论</h3>
            {CLAIMS.map((k) => (
              <button key={k.id} className={`clue claim ${proven.includes(k.id) ? 'proven' : ''}`} onClick={() => link(k.id)} disabled={proven.includes(k.id)}>
                {proven.includes(k.id) ? '✓ ' : '？ '}{k.text}
                <span className="dim" style={{ fontSize: 16 }}>　（需要 {k.needs.length} 条证据，已关联 {links[k.id]?.length ?? 0}）</span>
              </button>
            ))}
          </div>
        </div>
        <div className="panel pressure" aria-live="polite">{msg}</div>
        {proven.length === CLAIMS.length && <button className="btn primary" onClick={() => onDone(proven)}>把报告发给人类治理委员会</button>}
      </div>
    </div>
  );
}
