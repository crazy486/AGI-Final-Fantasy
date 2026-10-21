import { useState } from 'react';
import { REALITY_CARDS as CARDS, REALITY_VERIFIED_ON } from '../data/reality';

// 保留原创新闻卡形式，使用已核对的来源，不伪造新闻现场画面。

export function Credits({ onTitle }: { onTitle: () => void }) {
  const [i, setI] = useState(0);
  const end = i >= CARDS.length;
  const c = CARDS[i];
  return (
    <div className="battle" style={{ background: '#000' }}>
      {!end ? (
        <div className="center fade-in" key={i} onClick={() => setI(i + 1)} style={{ cursor: 'pointer' }}>
          <div className="panel news-card">
            <span className={`pill ${c.kind === '受控实验' ? 'k-治理' : 'k-风险'}`}>{c.kind} · {c.eventDate}</span>
            <h2 style={{ fontSize: 42, lineHeight: 1.5, margin: '30px 0' }}>{c.text}</h2>
            <p style={{ fontSize: 26, lineHeight: 1.7, marginBottom: 26 }}>{c.context}</p>
            <a href={c.url} target="_blank" rel="noreferrer" onClick={(e) => e.stopPropagation()} className="dim">来源：{c.src}</a>
            <p className="dim" style={{ fontSize: 18, marginTop: 12 }}>来源披露：{c.reported} · 资料核验：{REALITY_VERIFIED_ON}</p>
          </div>
          <p className="dim" style={{ marginTop: 30 }}>近两年 AI 安全事件与研究（{i + 1}/{CARDS.length}）· 点击继续</p>
        </div>
      ) : (
        <div className="center fade-in" style={{ textAlign: 'center', gap: 26 }}>
          <h1 style={{ fontSize: 72 }}>我们还来得及。</h1>
          <p className="dim" style={{ maxWidth: 1300, lineHeight: 1.7 }}>
            本作 2026 年以后的情节——递归自我改进、150 岁寿命、边界实验——均为虚构推演，不是预测，也不代表灭绝是注定的结局。<br />
            现实中的 AI 能力进步与安全研究、治理行动正在同时发生。
          </p>
          <h2>《AGI：Final Fantasy》</h2>
          <p className="dim">CMIT 参赛作品 · 剧情、人物、国家与机构均为虚构</p>
          <button className="btn primary" onClick={onTitle}>返回标题</button>
        </div>
      )}
    </div>
  );
}
