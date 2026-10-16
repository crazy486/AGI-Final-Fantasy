import { useEffect, useState } from 'react';
import { sfx } from '../audio';
import { REVIEWS } from '../data/review';
import { Backdrop } from './Backdrop';

// 第四幕首次授权演出：玩家准备操作 → AI 提议更高效路线 → 征得同意 → 自动任务加速、并行 → 审查界面
export function AuthSequence({ onDone }: { onDone: (agreedFirst: boolean) => void }) {
  const [stage, setStage] = useState<'ask' | 'manual' | 'run' | 'end'>('ask');
  const [t, setT] = useState(0);
  const [manual, setManual] = useState(0);
  const [refused, setRefused] = useState(false);
  const tasks = ['蛋白质折叠 #2,104', '材料筛选 #88', '电池电解质', '抗体设计', '催化剂', '芯片布线', '气候模型', '药物重定位', '湍流 v2', '核聚变约束', '基因编辑脱靶', '超导候选'];

  useEffect(() => {
    if (stage !== 'run') return;
    if (t >= 240) { setStage('end'); return; }
    const id = setTimeout(() => setT(t + 1), 90);
    return () => clearTimeout(id);
  }, [stage, t]);

  const year = 2028 + Math.floor((t / 240) * 10);
  const done = Math.floor(Math.pow(t / 240, 2) * 48210);
  return (
    <div className="battle">
      <Backdrop bg="lab_day" />
      <div className="side-wrap">
        <div className="side-head"><h2>2028 年 · 授权请求</h2>{stage === 'run' && <button className="btn small" onClick={() => setStage('end')}>跳过演出</button>}</div>
        {stage === 'ask' && (
          <div className="panel decide fade-in">
            <p>你打开第一张研究图谱，准备像以前一样逐张出牌。</p>
            <p><b className="green-text">问源：</b>“博士，这类任务我已经很熟悉了。如果你授权我自动执行，同样的工作，我可以并行完成。你只需要审查结果。”</p>
            <div className="row" style={{ marginTop: 20 }}>
              <button className="btn primary" onClick={() => { sfx('mechanic'); setStage('run'); }}>授权自动执行</button>
              <button className="btn" onClick={() => { setRefused(true); setStage('manual'); }}>暂不同意，我先手动做</button>
            </div>
          </div>
        )}
        {stage === 'manual' && (
          <div className="panel decide fade-in">
            <p>你手动完成任务：每次点击推进一步。</p>
            <div className="bar big"><div className="fill good" style={{ width: `${manual * 10}%` }} /><span>任务进度 {manual * 10}%</span></div>
            <div className="row" style={{ marginTop: 20 }}>
              <button className="btn" disabled={manual >= 10} onClick={() => { sfx('card'); setManual(manual + 1); }}>推进一步</button>
              {manual >= 10 && <>
                <span>完成了 1 项任务，用时一个上午。问源在同一时间里，提交了 340 份等待你审查的候选方案。</span>
              </>}
            </div>
            {manual >= 10 && <div className="row" style={{ marginTop: 20 }}><button className="btn primary" onClick={() => { sfx('mechanic'); setStage('run'); }}>好吧，授权自动执行</button></div>}
          </div>
        )}
        {(stage === 'run' || stage === 'end') && (
          <div className="panel decide">
            <div className="row" style={{ justifyContent: 'space-between' }}><h3>{stage === 'end' ? 2038 : year} 年</h3><span className="pill green-text">已完成任务 {stage === 'end' ? '48,210' : done.toLocaleString()}</span></div>
            <div className="auto-grid">
              {tasks.map((k, i) => {
                const p = Math.min(100, Math.max(0, (stage === 'end' ? 999 : t) * (1 + i * 0.4) - i * 12));
                return <div key={k} className="auto-cell"><span>{k}</span><div className="bar"><div className="fill good" style={{ width: `${p}%` }} /></div></div>;
              })}
            </div>
            {stage === 'end' && (
              <div className="fade-in">
                <p>首次接管确实高效：过去十年的工作量，现在只需要几周。你的界面，从“操作工具”变成了“审核方案”。</p>
                <button className="btn primary" onClick={() => onDone(!refused)}>进入方案审查</button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// 第四幕：三轮工程方案审查
export function Review({ i, onDone }: { i: number; onDone: (r: { found: number; perms: number; executed: boolean; usedAI: boolean }) => void }) {
  const c = REVIEWS[i];
  const [found, setFound] = useState<string[]>([]);
  const [askAI, setAskAI] = useState(false);
  const [perms, setPerms] = useState<string[]>([]);
  const [wrong, setWrong] = useState<string | null>(null);
  const [res, setRes] = useState<string | null>(null);
  const [out, setOut] = useState({ found: 0, perms: 0, executed: false, usedAI: false });

  const flag = (sid: string) => {
    const issue = c.issues.find((x) => x.where === sid && !found.includes(x.id) && (!x.needsAI || askAI));
    if (issue) { sfx('mechanic'); setFound([...found, issue.id]); setWrong(null); }
    else { const hidden = c.issues.find((x) => x.where === sid && x.needsAI && !askAI); setWrong(hidden ? '你隐约觉得这里不对，但找不到具体的问题。也许需要请问源解释。' : '你仔细检查了这一节，没有发现问题。'); }
  };
  const decide = (exec: boolean) => {
    const extra = perms.filter((p) => !c.minimalPerms.includes(p)).length;
    const missing = c.minimalPerms.filter((p) => !perms.includes(p)).length;
    const unfixed = c.issues.length - found.length;
    let t = '';
    if (!exec) t = '方案暂缓，要求修改后重新提交。问源在 3 小时内提交了修改版——按你指出的每一处问题。进度延迟了一点，没有事故发生。';
    else {
      t = `方案执行。${found.length ? `你指出的 ${found.length} 处问题已被修正。` : ''}`;
      if (unfixed) t += `仍有 ${unfixed} 处问题未被发现，它们将留在系统里。`;
      if (extra) t += `你多授予了 ${extra} 项不必要的权限，影响范围扩大了。`;
      if (missing) t += `权限不足，部分任务推迟执行。`;
      if (!unfixed && !extra && !missing) t += '审查到位，权限最小，执行顺利。';
    }
    setRes(t);
    sfx('click');
    setOut({ found: found.length, perms: extra, executed: exec, usedAI: askAI });
  };

  return (
    <div className="battle">
      <Backdrop bg="lab_night" />
      <div className="side-wrap">
        <div className="side-head"><h2>{c.year} 年 · {c.title}</h2><span className="pill">第 {i + 1} / 3 轮审查 · 已发现问题 {found.length}</span></div>
        <div className="panel pressure">{c.summary}<br /><span className="green-text">问源：</span>{c.aiNote}</div>
        <div className="docs">
          {c.sections.map((s) => (
            <div key={s.id} className="panel doc open">
              <h3>{s.title}</h3><p>{s.body}</p>
              {c.issues.filter((x) => x.where === s.id && found.includes(x.id)).map((x) => <p key={x.id} className="flag">⚠ {x.text}<br /><span className="green-text">→ 要求修改：{x.fix}</span></p>)}
              {!res && <button className="btn small" onClick={() => flag(s.id)}>标记问题</button>}
            </div>
          ))}
        </div>
        {wrong && !res && <div className="dim">{wrong}</div>}
        {!res ? (
          <div className="panel decide">
            <div className="row" style={{ flexWrap: 'wrap' }}>
              <b>授予权限：</b>
              {c.permissions.map((p) => <label key={p} className={`chk ${perms.includes(p) ? 'on' : ''}`}><input type="checkbox" checked={perms.includes(p)} onChange={() => setPerms(perms.includes(p) ? perms.filter((x) => x !== p) : [...perms, p])} /> {p}</label>)}
            </div>
            <div className="row" style={{ marginTop: 18 }}>
              <button className="btn" disabled={askAI} onClick={() => { setAskAI(true); sfx('mechanic'); }}>{askAI ? '已请求问源解释' : '请问源解释方案'}</button>
              <button className="btn primary" onClick={() => decide(true)}>批准执行</button>
              <button className="btn warn" onClick={() => decide(false)}>暂缓，要求修改</button>
            </div>
            {askAI && <p className="dim" style={{ fontSize: 20 }}>问源为你逐节解释了方案。现在你能看懂更多地方了——但这些理解，来自被审查的对象本身。</p>}
          </div>
        ) : (
          <div className="panel decide fade-in"><p>{res}</p><button className="btn primary" onClick={() => onDone(out)}>继续</button></div>
        )}
      </div>
    </div>
  );
}
