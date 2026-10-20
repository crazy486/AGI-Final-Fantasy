import { useState } from 'react';
import { sfx } from '../audio';
import { REG_CASES, type Verdict } from '../data/regulation';
import { resolveRegulation, type RegDecision } from '../engine/regulation';
import { Backdrop } from './Backdrop';

// 第三幕：三轮监管审批。对照材料 → 选择批准 / 附条件批准 / 暂缓 → 下一轮看到后果
export function Regulation({ onDone }: { onDone: (results: RegDecision[]) => void }) {
  const [idx, setIdx] = useState(0);
  const [opened, setOpened] = useState<number[]>([]);
  const [conds, setConds] = useState<string[]>([]);
  const [result, setResult] = useState<RegDecision | null>(null);
  const [results, setResults] = useState<RegDecision[]>([]);
  const c = REG_CASES[idx];
  const allRead = opened.length >= c.docs.length;

  const decide = (v: Verdict) => {
    sfx('click');
    setResult(resolveRegulation(c, v, conds));
  };
  const nextCase = () => {
    const r = [...results, result!];
    setResults(r);
    if (idx + 1 >= REG_CASES.length) { onDone(r); return; }
    setIdx(idx + 1); setOpened([]); setConds([]); setResult(null);
  };

  return (
    <div className="battle">
      <Backdrop bg="office" />
      <div className="side-wrap">
        <div className="side-head">
          <h2>安全署审查台 · {c.title}</h2>
          <span className="pill">第 {idx + 1} / {REG_CASES.length} 轮 · 申请方：{c.applicant}</span>
        </div>
        {idx > 0 && <div className="panel pressure">上一轮反馈：{results[idx - 1].feedback}</div>}
        <div className="docs">
          {c.docs.map((d, k) => (
            <button key={k} className={`panel doc ${opened.includes(k) ? 'open' : ''}`} onClick={() => !opened.includes(k) && setOpened([...opened, k])}>
              <h3>{d.title}</h3>
              {opened.includes(k) ? <p>{d.body}{d.flag && <><br /><span className="flag">⚠ {d.flag}</span></>}</p> : <p className="dim">点击查阅</p>}
            </button>
          ))}
        </div>
        {!result ? (
          <div className="panel decide">
            <div>
              <b>附条件批准时附加的条件：</b>
              <div className="row" style={{ flexWrap: 'wrap', marginTop: 10 }}>
                {c.conditions.map((x) => (
                  <label key={x} className={`chk ${conds.includes(x) ? 'on' : ''}`}>
                    <input type="checkbox" checked={conds.includes(x)} onChange={() => setConds(conds.includes(x) ? conds.filter((y) => y !== x) : [...conds, x])} /> {x}
                  </label>
                ))}
              </div>
            </div>
            <div className="row" style={{ marginTop: 20 }}>
              <button className="btn" disabled={!allRead} onClick={() => decide('approve')}>批准</button>
              <button className="btn primary" disabled={!allRead || conds.length === 0} onClick={() => decide('conditional')}>附条件批准</button>
              <button className="btn warn" disabled={!allRead} onClick={() => decide('defer')}>暂缓</button>
              {!allRead && <span className="dim">请先查阅全部材料</span>}
            </div>
          </div>
        ) : (
          <div className="panel decide fade-in">
            <h3>审查结果</h3>
            <p>{result.outcome}</p>
            {result.assessment && <p className={result.coveredRisks === c.bestConditions.length ? 'green-text' : 'flag'}>{result.assessment}</p>}
            <button className="btn primary" onClick={nextCase}>{idx + 1 >= REG_CASES.length ? '结束审查' : '下一份申请'}</button>
          </div>
        )}
      </div>
    </div>
  );
}
