import { useCallback, useEffect, useLayoutEffect, useState } from 'react';
import { music, preloadSfx, setVolumes, sfx, volume } from './audio';
import { MAPS } from './data/maps';
import { BattleView } from './components/BattleView';
import { Credits } from './components/Credits';
import { Evidence } from './components/Evidence';
import { FinalBattle } from './components/FinalBattle';
import { Investigation } from './components/Investigation';
import { Life } from './components/Life';
import { MapView, PickCardView, RestView, RewardView } from './components/MapView';
import { Negotiation } from './components/Negotiation';
import { Regulation } from './components/Regulation';
import { AuthSequence, Review } from './components/Review';
import { StoryPlayer } from './components/StoryPlayer';
import { canRetreat } from './engine/map';
import { CHAPTERS, FLOW } from './state/flow';
import {
  advance, battleEnd, battlePlay, battleResolve, clearSave, exportSave, importSave, jumpTo, loadSave, mapEnter, mapFinished,
  mapRetreat, newGame, persist, removeCard, restChoose, setFlag, takeReward, upgradeCard, type Save,
} from './state/game';

/** 1920×1080 舞台按窗口等比缩放 */
function useScale() {
  const [k, setK] = useState(1);
  useLayoutEffect(() => {
    const f = () => setK(Math.min(window.innerWidth / 1920, window.innerHeight / 1080));
    f(); window.addEventListener('resize', f);
    return () => window.removeEventListener('resize', f);
  }, []);
  return k;
}

// 场景 → T06 配乐（文件名不含扩展名）
const SCENE_TRACK: Record<string, string | null> = {
  prologue: 'tension', act1Intro: 'first-contact', act1Mid: 'research', act1End: 'research',
  act2Intro: 'research', act2Past: 'first-contact', act2Mid: 'research', act2Recursion: 'cue-recursion', act2End: 'research-route',
  act3Intro: 'regulation', act3Incident: 'investigation', act3End: 'regulation',
  act4Intro: 'audit', act4Mid: 'audit', act4End: 'audit',
  act5Intro: 'golden-age', act5End: 'golden-age',
  act6Intro: 'investigation', act6Mid: 'investigation', act6End: 'negotiation',
  act7Intro: 'tension', act7End: 'cue-control-lost', wake: null,
};

function trackFor(save: Save | null): string | null {
  if (!save) return 'title';
  const st = FLOW[save.step];
  if (st.k === 'scene') return st.id in SCENE_TRACK ? SCENE_TRACK[st.id] : 'research';
  if (st.k === 'battle' || st.k === 'map') {
    if (!save.battle) return 'research-route';
    const n = save.map ? MAPS[save.map.mapId].nodes[save.map.pos] : null;
    if (n?.kind === 'boss') return 'battle-breakthrough';
    if (n?.kind === 'elite') return 'battle-elite';
    return 'battle-standard';
  }
  const M: Partial<Record<string, string | null>> = { reg: 'regulation', inv: 'investigation', auth: 'audit', review: 'audit', life: 'golden-age', evidence: 'investigation', neg: 'negotiation', final: 'tension', credits: 'reality' };
  return M[st.k] ?? null;
}

export function App() {
  const scale = useScale();
  const [save, setSaveRaw] = useState<Save | null>(null);
  const [hasSave, setHasSave] = useState(() => !!loadSave());
  const [menu, setMenu] = useState<null | 'settings' | 'chapters' | 'io'>(null);
  const [ioText, setIoText] = useState('');
  const [ioMsg, setIoMsg] = useState('');
  const [vol, setVol] = useState({ sfx: volume.sfx, music: volume.music });

  // 每次状态变化立即写入存档：刷新不能恢复已消耗芯片或复活
  const setSave = useCallback((s: Save | ((p: Save) => Save)) => {
    setSaveRaw((prev) => {
      const n = typeof s === 'function' ? (prev ? s(prev) : prev) : s;
      if (n && n !== prev) persist(n);
      return n;
    });
  }, []);

  useEffect(() => { music(trackFor(save)); }, [save?.step, !!save?.battle, !!save, save?.map?.pos]);
  useEffect(() => { preloadSfx(); }, []);

  const toTitle = () => { setSaveRaw(null); setHasSave(!!loadSave()); setMenu(null); };
  const next = () => setSave((s) => advance(s));

  let body: JSX.Element;
  if (!save) {
    body = (
      <div className="battle title-bg">
        <div className="center title-screen">
          <p className="dim" style={{ fontSize: 30 }}>你，恐惧未知吗？</p>
          <h1>AGI：Final Fantasy</h1>
          <div className="title-menu">
            <button className="btn primary" onClick={() => { clearSave(); setSave(newGame()); }}>新游戏</button>
            <button className="btn" disabled={!hasSave} onClick={() => { const s = loadSave(); if (s) setSaveRaw(s); }}>继续</button>
            <button className="btn" onClick={() => setMenu('chapters')}>章节选择</button>
            <button className="btn" onClick={() => { setMenu('io'); setIoText(''); setIoMsg(''); }}>存档导入 / 导出</button>
            <button className="btn" onClick={() => setMenu('settings')}>设置</button>
          </div>
          <p className="dim" style={{ position: 'absolute', bottom: 30, fontSize: 18 }}>电脑浏览器游玩 · 约 40—60 分钟 · 本作为虚构故事，现实依据见各处标注</p>
        </div>
      </div>
    );
  } else {
    const st = FLOW[save.step];
    // 青年海默：第一、二幕（序章为晚期倒叙，使用中年版）
    const young = save.step > 0 && save.step < FLOW.findIndex((x) => x.k === 'scene' && x.id === 'act3Intro');
    switch (st.k) {
      case 'scene': body = <StoryPlayer key={save.step} sceneId={st.id} young={young} late={save.step >= FLOW.findIndex((x) => x.k === 'scene' && x.id === 'act6Intro')} onDone={next} />; break;
      case 'recursion': body = <div />; break;
      case 'battle':
      case 'map': {
        const p = save.pending;
        if (save.battle) {
          body = <BattleView b={save.battle} chips={save.chips} tutorial={st.k === 'battle'}
            onPlay={(u, t) => setSave((s) => battlePlay(s, u, t))} onEnd={() => setSave((s) => battleEnd(s))}
            onResolve={() => setSave((s) => battleResolve(s))}
            onRetreat={st.k === 'map' ? () => { sfx('rewind'); setSave((s) => mapRetreat(s)); } : undefined}
            canRetreat={!!save.map && save.chips > 0 && canRetreat(save.map)} />;
        } else if (st.k === 'map' && save.map) {
          body = <MapView save={save} finished={mapFinished(save)} onFinish={next}
            onEnter={(id) => setSave((s) => mapEnter(setFlag(s, 'justRevived', false), id))} onRetreat={() => { sfx('rewind'); setSave((s) => mapRetreat(s)); }} />;
        } else body = <div />;
        if (p?.kind === 'reward') body = <>{body}<RewardView options={p.options} onPick={(id) => setSave((s) => takeReward(s, id))} /></>;
        if (p?.kind === 'upgrade') body = <>{body}<PickCardView save={save} mode="upgrade" onPick={(u) => setSave((s) => upgradeCard(s, u))} /></>;
        if (p?.kind === 'rest') body = <>{body}<RestView save={save} onChoose={(o) => setSave((s) => restChoose(s, o))} /></>;
        if (p?.kind === 'restPick') body = <>{body}<PickCardView save={save} mode={p.mode} onPick={(u) => setSave((s) => (p.mode === 'upgrade' ? upgradeCard(s, u) : removeCard(s, u)))} /></>;
        if (p?.kind === 'dead') body = (
          <div className="overlay"><div className="modal panel" style={{ textAlign: 'center' }}>
            <h2>研究失败</h2><p className="dim">复活保障已经用尽。需要重新开始游戏；已看过的剧情可以快进。</p>
            <button className="btn primary" onClick={() => { clearSave(); setSave(newGame()); }}>重新开始</button>
          </div></div>
        );
        break;
      }
      case 'reg': body = <Regulation onDone={(r) => setSave((s) => advance(setFlag(s, 'reg', r)))} />; break;
      case 'inv': body = <Investigation onDone={(l) => setSave((s) => advance(setFlag(s, 'invLoss', l)))} />; break;
      case 'auth': body = <AuthSequence onDone={(a) => setSave((s) => advance(setFlag(s, 'authFirst', a)))} />; break;
      case 'review': body = <Review key={st.i} i={st.i} onDone={(r) => setSave((s) => advance(setFlag(s, `review${st.i}`, r)))} />; break;
      case 'life': body = <Life onDone={next} />; break;
      case 'evidence': body = <Evidence onDone={(p) => setSave((s) => advance(setFlag(s, 'proven', p)))} />; break;
      case 'neg': body = <Negotiation proven={(save.flags.proven as string[]) ?? []} onDone={(g) => setSave((s) => advance(setFlag(s, 'negGains', g)))} />; break;
      case 'final': body = <FinalBattle onDone={next} />; break;
      case 'credits': body = <Credits onTitle={() => { clearSave(); toTitle(); }} />; break;
    }
  }

  return (
    <div className="stage-wrap">
      <div className="stage" style={{ transform: `scale(${scale})` }}>
        {body}
        {save && <button className="btn small" style={{ position: 'absolute', left: 24, bottom: 24, zIndex: 40, opacity: .7 }} onClick={toTitle} title="进度已自动保存">标题</button>}
        {menu && (
          <div className="overlay" onClick={() => setMenu(null)}>
            <div className="modal panel" onClick={(e) => e.stopPropagation()}>
              {menu === 'settings' && <>
                <h2>设置</h2>
                <label className="row">音效 <input type="range" min={0} max={1} step={0.05} value={vol.sfx} onChange={(e) => { const v = { ...vol, sfx: +e.target.value }; setVol(v); setVolumes(v.sfx, v.music); }} /></label>
                <label className="row" style={{ marginTop: 16 }}>音乐 <input type="range" min={0} max={1} step={0.05} value={vol.music} onChange={(e) => { const v = { ...vol, music: +e.target.value }; setVol(v); setVolumes(v.sfx, v.music); }} /></label>
                <p className="dim" style={{ fontSize: 20 }}>剧情：点击 / 空格 / 回车 继续。战斗：E 结束回合，右键或 Esc 取消选牌。</p>
              </>}
              {menu === 'chapters' && <>
                <h2>章节选择</h2>
                <p className="dim" style={{ fontSize: 20 }}>供评审与测试快速跳转。从中间章节开始时使用初始卡组。</p>
                {CHAPTERS.map((c) => <button key={c.name} className="btn" style={{ display: 'block', width: '100%', margin: '8px 0' }} onClick={() => { setMenu(null); setSave(jumpTo(newGame(), c.step)); }}>{c.name}</button>)}
              </>}
              {menu === 'io' && <>
                <h2>存档导入 / 导出</h2>
                <button className="btn" disabled={!hasSave} onClick={() => { const s = loadSave(); if (s) setIoText(exportSave(s)); }}>导出当前存档</button>
                <textarea value={ioText} onChange={(e) => setIoText(e.target.value)} style={{ width: '100%', height: 200, marginTop: 16, background: '#0b1220', color: '#e6edf7', fontSize: 16 }} aria-label="存档文本" />
                <button className="btn primary" style={{ marginTop: 12 }} onClick={() => { const s = importSave(ioText); if (s) { persist(s); setHasSave(true); setIoMsg('导入成功，可点击“继续”。'); } else setIoMsg('存档无效。'); }}>导入</button>
                <span className="dim" style={{ marginLeft: 16 }}>{ioMsg}</span>
              </>}
              <div style={{ marginTop: 24 }}><button className="btn" onClick={() => setMenu(null)}>关闭</button></div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

