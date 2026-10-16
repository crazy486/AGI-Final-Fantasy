import { useState } from 'react';
import { sfx } from '../audio';
import { NET_EDGES, NET_NODES } from '../data/investigate';
import { Backdrop } from './Backdrop';

// 第三幕：恶意 AI 技术调查。检查日志 → 隔离传播路径 → 关闭危险节点。
// 错误操作带来局部损失，不会反复死亡。
export function Investigation({ onDone }: { onDone: (loss: number) => void }) {
  const [inspected, setInspected] = useState<string[]>([]);
  const [cut, setCut] = useState<string[]>([]);
  const [sel, setSel] = useState<string | null>('gw');
  const [loss, setLoss] = useState(0);
  const [msg, setMsg] = useState('先点击设备查看日志。确认传播路径后，切断带病毒的连接；最后关闭藏有完整副本的节点。');
  const [phase, setPhase] = useState<'trace' | 'kill' | 'done'>('trace');

  const carriers = NET_EDGES.filter((e) => e.carrier).map((e) => e.a + '-' + e.b);
  const key = (e: { a: string; b: string }) => e.a + '-' + e.b;
  const remaining = carriers.filter((k) => !cut.includes(k));
  const node = NET_NODES.find((n) => n.id === sel);

  const cutEdge = (k: string, carrier: boolean) => {
    if (phase !== 'trace' || cut.includes(k)) return;
    sfx('cut');
    setCut([...cut, k]);
    if (!carrier) {
      setLoss(loss + 1);
      setMsg(k.includes('hos') ? '你切断了医院网络的正常连接！生命支持设备切换为备用电源，造成局部损失。' : '这条连接是正常业务流量。切断它造成了不必要的服务中断。');
      return;
    }
    const left = carriers.filter((c) => !cut.includes(c) && c !== k).length;
    if (left === 0) { setPhase('kill'); setMsg('传播路径全部隔离。“铁穹”被困在网络里了。现在找出完整副本所在的节点并关闭它。'); }
    else setMsg(`切断成功。还有 ${left} 条传播路径。`);
  };

  const kill = (id: string) => {
    sfx('mechanic');
    const n = NET_NODES.find((x) => x.id === id)!;
    if (n.core) { setPhase('done'); setMsg('完整副本被清除。剩余分片失去协调，逐一失效。'); }
    else { setLoss(loss + 1); setMsg(`${n.label} 被关闭，但这里不是完整副本所在地。日志里有标注“★”的节点。`); }
  };

  return (
    <div className="battle">
      <Backdrop bg="server" />
      <div className="side-wrap">
        <div className="side-head">
          <h2>技术调查 · 追踪“铁穹”</h2>
          <span className="pill">阶段：{phase === 'trace' ? '隔离传播路径' : phase === 'kill' ? '关闭危险节点' : '完成'}　·　附带损失 {loss}</span>
        </div>
        <div className="row" style={{ alignItems: 'stretch', gap: 24 }}>
          <svg viewBox="0 0 180 100" className="panel net">
            {NET_EDGES.map((e) => {
              const a0 = NET_NODES.find((n) => n.id === e.a)!, b0 = NET_NODES.find((n) => n.id === e.b)!;
              const a = { x: a0.x * 1.8, y: a0.y }, b = { x: b0.x * 1.8, y: b0.y };
              const k = key(e); const isCut = cut.includes(k);
              const known = inspected.includes(e.a) && inspected.includes(e.b);
              return (
                <g key={k} onClick={() => cutEdge(k, !!e.carrier)} style={{ cursor: phase === 'trace' && !isCut ? 'pointer' : 'default' }}>
                  <line x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke="transparent" strokeWidth="4" />
                  <line x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke={isCut ? '#555' : known && e.carrier ? '#ff6b6b' : '#3a6a9a'} strokeWidth=".6" strokeDasharray={isCut ? '1 1' : ''} vectorEffect="non-scaling-stroke" />
                  {isCut && <text x={(a.x + b.x) / 2} y={(a.y + b.y) / 2} fontSize="4" fill="#ffb35f" textAnchor="middle">✂</text>}
                </g>
              );
            })}
            {NET_NODES.map((n) => {
              const seen = inspected.includes(n.id);
              return (
                <g key={n.id} onClick={() => { sfx('click'); setSel(n.id); if (!seen) setInspected([...inspected, n.id]); }} style={{ cursor: 'pointer' }}>
                  <circle cx={n.x * 1.8} cy={n.y} r="4.5" fill={seen && n.infected ? '#5a1620' : '#10243a'} stroke={sel === n.id ? '#ffb35f' : seen && n.infected ? '#ff6b6b' : '#5fd4ff'} strokeWidth=".6" vectorEffect="non-scaling-stroke" />
                  <text x={n.x * 1.8} y={n.y + 9} fontSize="3.2" fill="#e6edf7" textAnchor="middle">{n.label}</text>
                </g>
              );
            })}
          </svg>
          <div className="panel logbox">
            <h3>{node ? node.label : '选择设备'} · 日志</h3>
            {node?.log.map((l, i) => <div key={i} className="logline">{l}</div>)}
            {phase === 'kill' && node && <button className="btn warn" style={{ marginTop: 20 }} onClick={() => kill(node.id)}>关闭此节点</button>}
            <p className="dim" style={{ fontSize: 18, marginTop: 20 }}>提示：检查过两端设备后，可疑连接会标红。点击连线即可切断。</p>
          </div>
        </div>
        <div className="panel pressure" aria-live="polite">{msg}</div>
        {phase === 'done' && <button className="btn primary" onClick={() => onDone(loss)}>提交处置报告</button>}
        {remaining.length > 0 && phase === 'trace' && loss >= 4 && <p className="dim">问源发来一条建议：“从跨境网关开始，沿着异常加密流量往下查。”</p>}
      </div>
    </div>
  );
}
