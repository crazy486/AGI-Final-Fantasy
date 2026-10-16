import { useState } from 'react';
import { sfx } from '../audio';
import { CARDS } from '../data/cards';
import { ENEMIES } from '../data/enemies';
import { MAPS, type MapNode } from '../data/maps';
import { canRetreat, nextChoices } from '../engine/map';
import type { Save } from '../state/game';
import { CardView } from './BattleView';

const KIND: Record<MapNode['kind'], { icon: string; name: string; reward: string }> = {
  start: { icon: '◎', name: '起点', reward: '' },
  battle: { icon: '⚔', name: '科研任务', reward: '奖励：新卡牌' },
  elite: { icon: '☠', name: '小 Boss（可选）', reward: '奖励：新卡牌 + 升级一次' },
  rest: { icon: '✚', name: '维护节点', reward: '恢复 / 升级 / 移除 三选一' },
  boss: { icon: '★', name: '主线 Boss', reward: '奖励：新卡牌，通往下一段剧情' },
};

export function MapView({ save, onEnter, onRetreat, onFinish, finished }: { save: Save; onEnter: (id: string) => void; onRetreat: () => void; onFinish: () => void; finished: boolean }) {
  const run = save.map!;
  const def = MAPS[run.mapId];
  const nodes = Object.values(def.nodes);
  const maxLayer = Math.max(...nodes.map((n) => n.layer));
  const pos = (n: MapNode) => ({ x: 200 + (n.layer / maxLayer) * 1520, y: 260 + n.row * 230 });
  const choices = nextChoices(run);
  const [hover, setHover] = useState<string | null>(null);
  const hn = hover ? def.nodes[hover] : null;

  return (
    <div className="battle bg-lab_night">
      <div className="b-top">
        <h2>{def.name}</h2>
        <div className="row">
          <span className="pill">研究稳定度 {save.hp}/{save.maxHp}</span>
          <span className="pill">回溯芯片 ×{save.chips}</span>
          <span className="pill">{save.revive ? '复活保障：1 次' : '复活保障：已用'}</span>
          <span className="pill">卡组 {save.deck.length} 张</span>
          <DeckButton save={save} />
        </div>
      </div>
      <svg viewBox="0 0 1920 1080" width="1920" height="1080" style={{ position: 'absolute', inset: 0 }}>
        {nodes.flatMap((n) => n.next.map((m) => {
          const a = pos(n), b = pos(def.nodes[m]);
          const walked = run.path.includes(n.id) && run.path.includes(m) && run.path.indexOf(m) === run.path.indexOf(n.id) + 1;
          return <line key={n.id + m} x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke={walked ? '#5fd4ff' : '#2a3a55'} strokeWidth={walked ? 6 : 3} strokeDasharray={walked ? '' : '10 8'} />;
        }))}
      </svg>
      {nodes.map((n) => {
        const p = pos(n);
        const can = choices.includes(n.id);
        const here = run.pos === n.id;
        const done = run.done.includes(n.id);
        return (
          <button key={n.id} className={`mnode k-${n.kind} ${can ? 'can' : ''} ${here ? 'here' : ''} ${done ? 'done' : ''}`}
            style={{ left: p.x - 50, top: p.y - 50 }} disabled={!can}
            onMouseEnter={() => setHover(n.id)} onMouseLeave={() => setHover(null)} onFocus={() => setHover(n.id)}
            onClick={() => { sfx('click'); onEnter(n.id); }} aria-label={`${KIND[n.kind].name}${done ? '（已完成）' : ''}`}>
            {KIND[n.kind].icon}
          </button>
        );
      })}
      {hn && (
        <div className="panel map-tip">
          <b>{KIND[hn.kind].name}</b>{hn.difficulty && hn.kind !== 'rest' ? `　难度 ${'●'.repeat(hn.difficulty)}` : ''}
          {hn.enemies && <div>{[...new Set(hn.enemies)].map((e) => ENEMIES[e].name).join('、')}</div>}
          <div className="dim">{run.done.includes(hn.id) ? '已完成，可直接经过' : KIND[hn.kind].reward}</div>
        </div>
      )}
      <div className="map-foot">
        <span className="dim">只能沿连线前进。消耗回溯芯片可退回上一个岔路换路（已获得的收益保留，不会重复领奖）。</span>
        <div className="row">
          <button className="btn warn" disabled={finished || save.chips <= 0 || !canRetreat(run)} onClick={onRetreat}>回溯（芯片 -1）</button>
          {finished && <button className="btn primary" onClick={onFinish}>完成本图，继续剧情</button>}
        </div>
      </div>
      {save.flags.justRevived ? <div className="toast panel">复活保障已触发：恢复 50% 稳定度，返回上一个岔路。之后再失败需要重新开始。</div> : null}
    </div>
  );
}

export function DeckButton({ save }: { save: Save }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button className="btn small" onClick={() => setOpen(true)}>查看卡组</button>
      {open && (
        <div className="overlay" onClick={() => setOpen(false)}>
          <div className="modal panel" style={{ width: 1600 }} onClick={(e) => e.stopPropagation()}>
            <h2>卡组（{save.deck.length}）</h2>
            <div className="card-grid">{save.deck.map((c) => <CardView key={c.uid} c={c} small />)}</div>
            <button className="btn" onClick={() => setOpen(false)}>关闭</button>
          </div>
        </div>
      )}
    </>
  );
}

export function RewardView({ options, onPick }: { options: string[]; onPick: (id: string | null) => void }) {
  return (
    <div className="overlay">
      <div className="modal panel" style={{ width: 1100, textAlign: 'center' }}>
        <h2>战后成长：三选一</h2>
        <p className="dim">新方法、新工具进入问源的能力库。也可以跳过，保持卡组精简。</p>
        <div className="row" style={{ justifyContent: 'center', margin: '30px 0' }}>
          {options.map((id, i) => <CardView key={id + i} c={{ uid: 'r' + i, id, up: false }} onClick={() => { sfx('card'); onPick(id); }} />)}
        </div>
        <button className="btn" onClick={() => onPick(null)}>跳过</button>
        <p className="dim" style={{ fontSize: 18 }}>{options.map((o) => CARDS[o].flavor).filter(Boolean)[0]}</p>
      </div>
    </div>
  );
}

export function PickCardView({ save, mode, onPick }: { save: Save; mode: 'upgrade' | 'remove'; onPick: (uid: string | null) => void }) {
  const list = mode === 'upgrade' ? save.deck.filter((c) => !c.up && CARDS[c.id].id !== 'noise') : save.deck;
  return (
    <div className="overlay">
      <div className="modal panel" style={{ width: 1600 }}>
        <h2>{mode === 'upgrade' ? '选择一张牌升级（每张最多一次）' : '选择一张牌移除'}</h2>
        {mode === 'remove' && save.deck.length <= 5 && <p className="dim">卡组最少保留 5 张。</p>}
        <div className="card-grid">
          {list.map((c) => <CardView key={c.uid} c={mode === 'upgrade' ? { ...c, up: true } : c} small onClick={() => onPick(c.uid)} disabled={mode === 'remove' && save.deck.length <= 5} />)}
        </div>
        <button className="btn" onClick={() => onPick(null)}>放弃</button>
      </div>
    </div>
  );
}

export function RestView({ save, onChoose }: { save: Save; onChoose: (o: 'heal' | 'upgrade' | 'remove') => void }) {
  const heal = Math.min(save.maxHp - save.hp, Math.ceil(save.maxHp * 0.3));
  return (
    <div className="overlay">
      <div className="modal panel" style={{ width: 1000, textAlign: 'center' }}>
        <h2>维护节点</h2>
        <p className="dim">只能选择一项。</p>
        <div className="row" style={{ justifyContent: 'center', marginTop: 30 }}>
          <button className="btn" onClick={() => onChoose('heal')}>系统维护<br /><small>恢复 {heal} 稳定度</small></button>
          <button className="btn" onClick={() => onChoose('upgrade')}>方法改进<br /><small>升级一张牌</small></button>
          <button className="btn" onClick={() => onChoose('remove')}>精简流程<br /><small>移除一张牌</small></button>
        </div>
      </div>
    </div>
  );
}
