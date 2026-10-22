import { useEffect, useMemo, useRef, useState } from 'react';
import { cutMusic, music, sfx } from '../audio';
import { SCENES } from '../data/story';
import type { BgId, Choice, Expr, Line } from '../data/story/types';
import { TIPS } from '../data/tips';
import { getRead, markRead } from '../state/game';
import { IS_CG, isAI, portraitFor } from '../assets';
import { Backdrop, FinaleBackdrop, Portrait } from './Backdrop';
import { startFinaleSequence } from '../engine/finale';

type Item = Line | { choice: Choice[] };
const isChoice = (x: Item): x is { choice: Choice[] } => 'choice' in x;

/** 剧情播放器：背景、立绘、文字、选项、已读快进、对话记录、小贴士 */
export function StoryPlayer({ sceneId, onDone, young, late }: { sceneId: string; onDone: () => void; young: boolean; late: boolean }) {
  const scene = SCENES[sceneId];
  const [items, setItems] = useState<Item[]>(() => scene.lines.slice());
  const [i, setI] = useState(0);
  const [history, setHistory] = useState<Line[]>([]);
  const [showLog, setShowLog] = useState(false);
  const [tip, setTip] = useState<string | null>(null);
  const [skipping, setSkipping] = useState(false);
  const read = useMemo(() => getRead(), [sceneId]);

  useEffect(() => { setItems(scene.lines.slice()); setI(0); setHistory([]); setSkipping(false); }, [sceneId]);

  // 记录当前背景/表情（向前查找最近的设置）
  let bg: BgId = 'black'; let expr: Expr = 'calm'; let lastSpeaker: string | undefined; let pov = scene.pov;
  for (let k = 0; k <= Math.min(i, items.length - 1); k++) {
    const it = items[k];
    if (!isChoice(it)) {
      if (it.bg && it.bg !== bg) { lastSpeaker = undefined; expr = 'calm'; }
      if (it.s && it.s !== lastSpeaker) expr = 'calm';
      if (it.bg) bg = it.bg;
      if (it.e) expr = it.e;
      if (it.s && it.s !== '你的选择') lastSpeaker = it.s;
      if (it.fx === 'chapter') lastSpeaker = undefined;
      if (it.pov) pov = it.pov;
    }
  }
  const cur = items[i];
  const greenStart = scene.lines.findIndex((line) => !isChoice(line) && line.bg === 'cg_green1');
  const inFinale = sceneId === 'act7End' && greenStart >= 0 && i >= greenStart;
  const doneRef = useRef(onDone);
  doneRef.current = onDone;
  const key = `${sceneId}:${i}`;

  const next = () => {
    if (!cur || isChoice(cur) || (sceneId === 'wake' && i === 0) || inFinale) return;
    markRead(key);
    setHistory((h) => [...h, cur]);
    sfx('click');
    if (i + 1 >= items.length) onDone(); else setI(i + 1);
  };

  const pick = (c: Choice) => {
    sfx('click');
    setHistory((h) => [...h, { s: '你的选择', t: c.text }]);
    const ni = items.slice();
    ni.splice(i, 1, ...c.reply);
    setItems(ni);
  };

  // 终局演出：绿色场域响起 cue；黑屏“你醒了”前切断，留 2 秒真正静音
  useEffect(() => {
    if (sceneId === 'wake' && i === 0) {
      cutMusic();
      const timer = setTimeout(() => setI(1), 2000);
      return () => clearTimeout(timer);
    }
  }, [sceneId, i]);

  // 等音频完成解码并实际启动，再完整播放高潮；普通点击和已读快进不能截断。
  useEffect(() => {
    if (!inFinale) return;
    setSkipping(false);
    const stop = startFinaleSequence(music('cue-green-field'), (phase) => {
      if (phase > 0) {
        const previous = scene.lines[greenStart + phase - 1];
        markRead(`${sceneId}:${greenStart + phase - 1}`);
        if (!isChoice(previous)) setHistory((h) => [...h, previous]);
      }
      setI(greenStart + phase);
    }, () => doneRef.current());
    return stop;
  }, [inFinale]);

  // 已读快进：遇到未读或选项时停止
  useEffect(() => {
    if (!skipping) return;
    if (!cur || isChoice(cur) || !read.has(key)) { setSkipping(false); return; }
    const t = setTimeout(next, 60);
    return () => clearTimeout(t);
  });

  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if (showLog || tip) { if (e.key === 'Escape') { setShowLog(false); setTip(null); } return; }
      if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); next(); }
    };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  });

  if (!cur) return null;
  const line = isChoice(cur) ? null : cur;
  const tipId = line?.tip;

  return (
    <div key={line?.fx === 'shake' || line?.fx === 'flash' ? key : sceneId} className={`fade-in ${late ? 'late-era' : ''} ${inFinale ? 'finale-cinematic' : ''} ${line?.fx === 'shake' ? 'shake' : ''} ${line?.fx === 'flash' ? 'flash' : ''}`} style={{ position: 'absolute', inset: 0, zIndex: inFinale ? 45 : undefined }}>
      {inFinale ? <FinaleBackdrop phase={i - greenStart} /> : <Backdrop bg={bg} />}
      {pov && line?.fx !== 'chapter' && bg !== 'black' && <div className="pov-label pill">当前视角：{pov}</div>}
      {line?.fx === 'green' && !IS_CG(bg) && <div className="green-field" />}
      {(() => {
        // 旁白时保留上一位说话者立绘（变暗），章节卡与终端画面不显示
        if (line?.fx === 'chapter' || line?.fx === 'terminal' || line?.fx === 'green' || bg === 'black' || IS_CG(bg)) return null;
        const who = line?.s ?? lastSpeaker;
        const src = portraitFor(who, expr, young, late);
        return src ? <Portrait src={src} side={line?.s ? (isAI(who) ? 'ai' : 'center') : (isAI(who) ? 'ai-dim' : 'dim')} /> : null;
      })()}
      {!inFinale && <div className="topbar">
        <button className="btn small" onClick={() => setSkipping((s) => !s)} aria-pressed={skipping}>{skipping ? '停止快进' : '已读快进'}</button>
        <button className="btn small" onClick={() => setShowLog(true)}>对话记录</button>
      </div>}
      {tipId && TIPS[tipId] && <button className="btn small tip-chip" onClick={() => setTip(tipId)}>💡 小贴士：{TIPS[tipId].title}</button>}

      {line?.fx === 'chapter' ? (
        <div className="center chapter" onClick={next} role="button" tabIndex={0}>
          <h1>{line.t}</h1><p>{line.sub}</p><p className="dim" style={{ fontSize: 20 }}>点击继续</p>
        </div>
      ) : line?.fx === 'terminal' ? (
        <div className="center" onClick={next} role="button" tabIndex={0}><div className="terminal">{line.t}</div></div>
      ) : null}

      {line && line.fx !== 'chapter' && line.fx !== 'terminal' && line.t && (
        <div key={key} className="dialog panel fade-in" onClick={inFinale ? undefined : next} role={inFinale ? undefined : 'button'} tabIndex={inFinale ? undefined : 0} aria-live="polite">
          {line.s && <div className="who">{line.s}</div>}
          <div className={`txt ${line.s ? '' : 'narr'}`}>{line.t || '……'}</div>
          {line.note && <div className="story-note">{line.note}</div>}
          <div className="hint">{inFinale ? '演出中' : <>{read.has(key) ? '已读 · ' : ''}点击 / 空格 继续</>}</div>
        </div>
      )}
      {line && !line.t && line.fx !== 'chapter' && line.fx !== 'terminal' && !inFinale && <div className="center" onClick={next} style={{ cursor: 'pointer' }} role="button" tabIndex={0} aria-label="继续" />}

      {isChoice(cur) && (
        <div className="choices">{cur.choice.map((c, k) => <button key={k} className="btn" onClick={() => pick(c)}>{c.text}</button>)}</div>
      )}

      {showLog && (
        <div className="overlay" onClick={() => setShowLog(false)}>
          <div className="modal panel" onClick={(e) => e.stopPropagation()}>
            <h2>对话记录</h2>
            {history.length === 0 && <p className="dim">暂无</p>}
            {history.map((h, k) => <div key={k} className="history-item"><b className="dim">{h.s ?? '旁白'}：</b>{h.t}{h.note && <div className="story-note">{h.note}</div>}</div>)}
            <div style={{ marginTop: 20 }}><button className="btn" onClick={() => setShowLog(false)}>关闭</button></div>
          </div>
        </div>
      )}
      {tip && (
        <div className="overlay" onClick={() => setTip(null)}>
          <div className="modal panel" onClick={(e) => e.stopPropagation()}>
            <h2>💡 {TIPS[tip].title}</h2>
            <p style={{ lineHeight: 1.7 }}>{TIPS[tip].body}</p>
            <button className="btn" onClick={() => setTip(null)}>知道了</button>
          </div>
        </div>
      )}
    </div>
  );
}
