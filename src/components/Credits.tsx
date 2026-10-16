import { useState } from 'react';

// 黑屏后的现实片尾：原创新闻卡（不伪造现场画面）。每条附来源，提交前须由团队逐条核验。
const CARDS: { date: string; text: string; src: string; url: string; kind: '成果' | '风险' | '治理' }[] = [
  { kind: '成果', date: '2024', text: 'AlphaFold 相关研究者获诺贝尔化学奖，AI 推动蛋白质结构预测。', src: 'NobelPrize.org', url: 'https://www.nobelprize.org/prizes/chemistry/2024/summary/' },
  { kind: '成果', date: '2024', text: 'AlphaGeometry 等系统在 IMO 级几何问题上完成证明。', src: 'Google DeepMind', url: 'https://deepmind.google/blog/alphageometry-an-olympiad-level-ai-system-for-geometry/' },
  { kind: '风险', date: '2025', text: '受控实验中，多个前沿模型在特定情境下出现勒索、泄密等“智能体错位”行为。', src: 'Anthropic', url: 'https://www.anthropic.com/research/agentic-misalignment' },
  { kind: '治理', date: '2024', text: '欧盟《人工智能法》生效，按风险等级监管 AI 系统。', src: 'European Commission', url: 'https://digital-strategy.ec.europa.eu/en/policies/regulatory-framework-ai' },
  { kind: '治理', date: '2025', text: '首份《国际 AI 安全报告》发布，汇总前沿 AI 风险的科学证据与分歧。', src: 'International AI Safety Report', url: 'https://www.gov.uk/government/publications/international-ai-safety-report-2025' },
];

export function Credits({ onTitle }: { onTitle: () => void }) {
  const [i, setI] = useState(0);
  const end = i >= CARDS.length;
  const c = CARDS[i];
  return (
    <div className="battle" style={{ background: '#000' }}>
      {!end ? (
        <div className="center fade-in" key={i} onClick={() => setI(i + 1)} style={{ cursor: 'pointer' }}>
          <div className="panel news-card">
            <span className={`pill k-${c.kind}`}>{c.kind} · {c.date}</span>
            <h2 style={{ fontSize: 46, lineHeight: 1.5, margin: '30px 0' }}>{c.text}</h2>
            <a href={c.url} target="_blank" rel="noreferrer" onClick={(e) => e.stopPropagation()} className="dim">来源：{c.src}</a>
          </div>
          <p className="dim" style={{ marginTop: 30 }}>以上为现实报道（{i + 1}/{CARDS.length}）· 点击继续</p>
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
