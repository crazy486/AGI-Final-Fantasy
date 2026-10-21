import { useEffect, useRef, useState } from 'react';
import { sfx } from '../audio';
import { CARDS } from '../data/cards';
import { ENEMIES } from '../data/enemies';
import { art } from '../assets';
import { canPlay, cardCost, currentIntent, MAX_HAND_SIZE, playCard } from '../engine/battle';
import type { BattleState, CardInst, Intent } from '../engine/types';
import { TIPS } from '../data/tips';

function intentText(it: Intent, str: number) {
  switch (it.kind) {
    case 'attack': return `⚔ ${it.label ?? '攻击'} ${it.amount + str}${it.times ? ` ×${it.times}` : ''}`;
    case 'attackBlock': return `⚔ ${it.label ?? ''} ${it.amount + str} ＋ 🛡${it.block}`;
    case 'block': return `🛡 ${it.label ?? '防御'} ${it.amount}`;
    case 'buff': return `▲ ${it.label ?? '强化'} 力量+${it.amount}`;
    case 'noise': return `☁ ${it.label ?? '噪声'} 塞入${it.count}张噪声`;
  }
}

export function CardView({ c, onClick, selected, disabled, small, upgradedFrom, battle }: { c: CardInst; onClick?: () => void; selected?: boolean; disabled?: boolean; small?: boolean; upgradedFrom?: CardInst; battle?: BattleState }) {
  const d = CARDS[c.id];
  const before = upgradedFrom ? d.desc(upgradedFrom.up).split(/(\d+)/) : null;
  const description = d.desc(c.up).split(/(\d+)/).map((part, i) => before && part !== before[i] ? <mark key={i} className="upgrade-change">{part}</mark> : part);
  const costChanged = upgradedFrom && cardCost(c) !== cardCost(upgradedFrom);
  const target = battle?.enemies.filter((e) => e.hp > 0);
  const counterReady = c.id === 'counterexample' && target?.length === 1 && ['attack', 'attackBlock'].includes(currentIntent(target[0]).kind);
  const forecast = counterReady && battle && canPlay(battle, c.uid)
    ? playCard(battle, c.uid, target![0].uid).events.find((e) => e.type === 'damageEnemy') : undefined;
  return (
    <button className={`card research-card t-${d.type} ${selected ? 'sel' : ''} ${small ? 'small' : ''}`} onClick={onClick} disabled={disabled} title={d.flavor}
      aria-label={`${d.name}${c.up ? '+' : ''}，费用${cardCost(c)}，${d.desc(c.up)}`}>
      <span className={`cost ${costChanged ? 'upgrade-change' : ''}`}>{cardCost(c)}</span>
      <span className="cname">{d.name}{c.up ? '+' : ''}</span>
      <span className="ctype">{d.type}</span>
      {art(c.id) && <img className="cart" src={art(c.id)!} alt="" draggable={false} />}
      <span className="cdesc">{description}</span>
      {!small && d.flavor && <span className="cflavor">{d.flavor}</span>}
      {forecast?.type === 'damageEnemy' && <strong className="counter-ready">本次推进 {forecast.amount + forecast.blocked}{forecast.blocked ? ` · 护盾抵消 ${forecast.blocked}` : ''}</strong>}
    </button>
  );
}

export function BattleView({ b, onPlay, onEnd, onResolve, onRetreat, canRetreat, chips, tutorial }: {
  b: BattleState; onPlay: (uid: string, t?: string) => void; onEnd: () => void; onResolve: () => void;
  onRetreat?: () => void; canRetreat: boolean; chips: number; tutorial?: boolean;
}) {
  const [sel, setSel] = useState<string | null>(null);
  const [help, setHelp] = useState<string | null>(null);
  const [floats, setFloats] = useState<{ id: number; text: string; cls: string; uid?: string }[]>([]);
  const [hitUid, setHitUid] = useState<string | null>(null);
  const seq = useRef(0);
  const resolved = useRef(false);

  // 事件 → 飘字与音效（只做演出，不参与结算）
  useEffect(() => {
    const add: typeof floats = [];
    for (const ev of b.events) {
      if (ev.type === 'damageEnemy') { add.push({ id: seq.current++, text: ev.blocked ? `推进 ${ev.amount + ev.blocked} · 护盾抵消 ${ev.blocked}` : `-${ev.amount}`, cls: ev.blocked ? 'f-mech' : 'f-dmg', uid: ev.uid }); setHitUid(ev.uid); sfx('hit'); }
      if (ev.type === 'damagePlayer') { add.push({ id: seq.current++, text: ev.amount ? `稳定度 -${ev.amount}` : '完全抵消', cls: 'f-bad' }); sfx(ev.amount ? 'hit' : 'block'); }
      if (ev.type === 'block' && ev.who === 'player') sfx('block');
      if (ev.type === 'mechanic') { add.push({ id: seq.current++, text: ev.text, cls: 'f-mech' }); sfx('mechanic'); }
    }
    if (add.length) {
      setFloats((f) => [...f, ...add].slice(-8));
      const t = setTimeout(() => { setFloats((f) => f.filter((x) => !add.includes(x))); setHitUid(null); }, 1100);
      return () => clearTimeout(t);
    }
  }, [b]);

  useEffect(() => {
    if (b.outcome !== 'ongoing' && !resolved.current) {
      sfx(b.outcome === 'won' ? 'win' : 'lose');
    }
    if (b.outcome === 'ongoing') resolved.current = false;
  }, [b.outcome]);

  useEffect(() => {
    const h = (e: MouseEvent) => { e.preventDefault(); setSel(null); };
    window.addEventListener('contextmenu', h);
    const k = (e: KeyboardEvent) => { if (e.key === 'Escape') { setSel(null); setHelp(null); } if (!help && e.key.toLowerCase() === 'e' && b.outcome === 'ongoing') onEnd(); };
    window.addEventListener('keydown', k);
    return () => { window.removeEventListener('contextmenu', h); window.removeEventListener('keydown', k); };
  }, [b.outcome, onEnd, help]);

  const clickCard = (c: CardInst) => {
    if (!canPlay(b, c.uid)) return;
    const d = CARDS[c.id];
    const alive = b.enemies.filter((e) => e.hp > 0);
    if (!d.target || alive.length === 1) { sfx('card'); onPlay(c.uid, alive[0]?.uid); setSel(null); return; }
    setSel(sel === c.uid ? null : c.uid);
  };
  const clickEnemy = (uid: string) => {
    if (!sel) return;
    sfx('card'); onPlay(sel, uid); setSel(null);
  };

  const p = b.player;
  return (
    <div className="battle bg-lab_night">
      <div className="b-top">
        <div className="row">
          <span className="pill">回合 {b.turn}</span>
          {b.recursion > 0 && <span className="pill green-text">自我改进：推进 +{b.recursion}</span>}
          <span className="pill">回溯芯片 ×{chips}</span>
        </div>
        <div className="row"><button className="btn small" onClick={() => setHelp('battle')}>玩法说明</button>{onRetreat && <button className="btn small warn" disabled={!canRetreat || b.outcome !== 'ongoing'} onClick={onRetreat}>使用芯片撤退</button>}</div>
      </div>

      <div className="enemies">
        {b.enemies.map((e) => {
          const d = ENEMIES[e.defId];
          const dead = e.hp <= 0;
          return (
            <div key={e.uid} className={`enemy panel ${dead ? 'dead' : ''} ${sel && !dead ? 'targetable' : ''} ${hitUid === e.uid ? 'shake' : ''}`}
              onClick={() => !dead && clickEnemy(e.uid)} role="button" tabIndex={0} aria-label={`${d.name}，剩余${e.hp}`}>
              {!dead && <div className="intent">{intentText(currentIntent(e), e.strength)}</div>}
              {art(e.defId) && <img className="eart" src={art(e.defId)!} alt="" draggable={false} />}
              <div className="ename">{d.name}</div>
              <div className="etitle dim">{d.title}</div>
              <div className="bar"><div className="fill bad" style={{ width: `${(e.hp / e.maxHp) * 100}%` }} /><span>{dead ? '已突破' : `${e.hp}/${e.maxHp}`}</span></div>
              <div className="row" style={{ gap: 10, fontSize: 20 }}>
                {e.block > 0 && <span className="pill">🛡 {e.block}</span>}
                {e.strength > 0 && <span className="pill">力量 +{e.strength}</span>}
              </div>
              <div className="emech">{d.mechanicText}</div>
              {d.reality && <div className="ereal">{d.reality}</div>}
              {floats.filter((f) => f.uid === e.uid).map((f) => <div key={f.id} className={`float ${f.cls}`}>{f.text}</div>)}
            </div>
          );
        })}
      </div>

      <div className="mid-floats">{floats.filter((f) => !f.uid).map((f) => <div key={f.id} className={`float ${f.cls}`}>{f.text}</div>)}</div>

      {tutorial && b.turn <= 2 && b.outcome === 'ongoing' && (
        <div className="tutorial panel">
          每回合有 <b>3 点算力</b>，首回合抽 5 张牌，之后补到 7 张。点击卡牌打出；多个敌人时先点牌、再点目标，右键取消。<br />
          <b>没出的牌留到下回合</b>，所有抽牌最多补至 7 张，多余的牌留在牌堆。敌人头上是下一步行动。《基础验证》提供护盾抵消伤害。结束回合快捷键 E。
        </div>
      )}

      <div className="player-bar">
        <div className="energy" aria-label={`算力 ${p.energy}/${p.maxEnergy}`}>{p.energy}<small>/{p.maxEnergy}</small><span>算力</span></div>
        <div style={{ flex: 1 }}>
          <div className="bar big"><div className="fill good" style={{ width: `${(p.hp / p.maxHp) * 100}%` }} /><span>研究稳定度 {p.hp}/{p.maxHp}</span></div>
          <div className="row" style={{ marginTop: 8, fontSize: 22 }}>
            <span className="pill">🛡 稳定 {p.block}</span>
            <button className="pill mechanic-help" onClick={() => setHelp('momentum')}>推理链 {p.momentum} ⓘ</button>
            <span className={`pill ${p.verified ? 'green-text' : 'dim'}`}>{p.verified ? '✓ 已验证' : '未验证'}</span>
            <span className="pill dim">手牌 {b.hand.length}/{MAX_HAND_SIZE}</span>
            <span className="pill dim">抽牌堆 {b.drawPile.length} · 弃牌堆 {b.discard.length}</span>
          </div>
        </div>
        <button className="btn primary" disabled={b.outcome !== 'ongoing'} onClick={() => { setSel(null); onEnd(); }}>结束回合</button>
      </div>

      <div className="hand">
        {b.hand.map((c) => <CardView key={c.uid} c={c} battle={b} selected={sel === c.uid} disabled={!canPlay(b, c.uid)} onClick={() => clickCard(c)} />)}
      </div>

      {help && <div className="overlay" onClick={() => setHelp(null)}><div className="modal panel" role="dialog" aria-modal="true" aria-label="玩法说明" onClick={(e) => e.stopPropagation()}>
        <h2>{TIPS[help].title}</h2><p className="help-copy">{TIPS[help].body}</p><button className="btn primary" onClick={() => setHelp(null)}>知道了</button>
      </div></div>}

      {b.outcome !== 'ongoing' && (
        <div className="overlay">
          <div className="modal panel" style={{ width: 700, textAlign: 'center' }}>
            <h2 style={{ fontSize: 56 }} className={b.outcome === 'won' ? 'green-text' : ''}>{b.outcome === 'won' ? '突破！' : '研究稳定度归零'}</h2>
            <p className="dim">{b.outcome === 'won' ? '问题障碍已清除。' : '这次尝试失败了。'}</p>
            <button className="btn primary" onClick={() => { if (resolved.current) return; resolved.current = true; onResolve(); }}>继续</button>
          </div>
        </div>
      )}
    </div>
  );
}
