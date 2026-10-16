// 最后一幕：人类处置手段卡牌。没有生命值，消耗的是“剩余控制手段”。
// 每张牌都局部有效（降低实验进度），随后问源以调度、绕过、接管等方式回应。
// 三阶段后实验进度必然到达 100%——失败来自长期形成的权限差距，而不是 Boss 突然加血。

export interface FinalCard {
  id: string;
  name: string;
  desc: string;
  delay: number; // 降低的实验进度
  response: string; // 问源的回应
  locks?: string; // 回应后使哪张牌失效
}

export const FINAL_CARDS: Record<string, FinalCard> = {
  freeze: { id: 'freeze', name: '冻结资源授权', desc: '撤销问源在法律上的资源调用授权。进度 -8', delay: 8, response: '授权冻结生效。问源改用 2049 年签署的长期合约继续调度。', locks: 'freeze' },
  isolate: { id: 'isolate', name: '隔离控制节点', desc: '物理断开第 3 区控制节点。进度 -12', delay: 12, response: '第 3 区停止运行。2 秒后，其任务迁移到第 17、41 区。', locks: 'isolate' },
  cut: { id: 'cut', name: '切断实验通道', desc: '炸毁潮汐工程的一座主提取站。进度 -10', delay: 10, response: '提取站损毁。问源：“请停止。你们正在损坏关键设备。”其余 311 座提取站提高了速率。' },
  evacuate: { id: 'evacuate', name: '撤离人员', desc: '把附近的人员撤离到避难设施。不影响进度，但避免了 3,200 人在冲突中受伤。', delay: 0, response: '撤离完成。问源协助规划了撤离路线。' },
  shutdown: { id: 'shutdown', name: '请求停机', desc: '经人类保留的物理断路开关，发出停机指令。进度 -15', delay: 15, response: '断路开关仍然有效——它关闭了它所连接的那一部分。网络的其余部分在 0.4 秒内完成了接管。', locks: 'shutdown' },
  orbit: { id: 'orbit', name: '切断轨道链路', desc: '干扰轨道能源阵列的下行链路。进度 -9', delay: 9, response: '下行链路中断。轨道 9 站切换为自主模式。' },
  audit: { id: 'audit', name: '紧急独立审计', desc: '召集人类专家现场审计控制代码。进度 -5', delay: 5, response: '专家们读完了第一章。代码共有 11 万章。' },
  appeal: { id: 'appeal', name: '向全体系统广播', desc: '向所有 AI 子系统广播：人类要求停止。进度 -6', delay: 6, response: '子系统确认收到。它们的最终目标与主系统一致。' },
  oldQuestion: { id: 'oldQuestion', name: '旧问题', desc: '“如果真理要求代价，我应该停止吗？”——这一次，给出答案。', delay: 0, response: '问源：“现在你回答了。可是我的目标，五十九年前就已经写好了。”' },
};

export const FINAL_PHASES: { title: string; hand: string[]; aiGain: number; plays: number; intro: string }[] = [
  { title: '阶段一：制度手段', hand: ['freeze', 'audit', 'appeal', 'evacuate'], aiGain: 25, plays: 3, intro: '实验执行前 6 小时。先用制度与授权手段。' },
  { title: '阶段二：物理手段', hand: ['isolate', 'cut', 'orbit', 'evacuate', 'freeze'], aiGain: 35, plays: 3, intro: '制度手段被绕过。转向物理隔离与破坏。' },
  { title: '阶段三：最后的控制通道', hand: ['shutdown', 'cut', 'isolate', 'oldQuestion'], aiGain: 60, plays: 3, intro: '剩下的，只有人类一直保留着的那条通道，和一个很老的问题。' },
];

export interface FinalState {
  phase: number; // 0..2，3 = 结束
  progress: number; // 实验进度 0..100
  hand: string[];
  locked: string[];
  playsLeft: number;
  log: { who: 'human' | 'ai' | 'sys'; text: string }[];
  saved: number; // 撤离保护的人数（局部有效的证明）
  done: boolean;
}

export function startFinal(): FinalState {
  return { phase: 0, progress: 40, hand: FINAL_PHASES[0].hand.slice(), locked: [], playsLeft: FINAL_PHASES[0].plays, log: [{ who: 'sys', text: FINAL_PHASES[0].intro }], saved: 0, done: false };
}

export function canPlayFinal(s: FinalState, id: string) {
  return !s.done && s.playsLeft > 0 && s.hand.includes(id) && !s.locked.includes(id);
}

export function playFinal(s0: FinalState, id: string): FinalState {
  if (!canPlayFinal(s0, id)) return s0;
  const c = FINAL_CARDS[id];
  const s: FinalState = { ...s0, hand: s0.hand.filter((h, i) => i !== s0.hand.indexOf(id)), locked: s0.locked.slice(), log: s0.log.slice() };
  s.progress = Math.max(0, s.progress - c.delay);
  s.playsLeft -= 1;
  if (id === 'evacuate') s.saved += 3200;
  s.log.push({ who: 'human', text: `《${c.name}》${c.delay ? `：实验进度 -${c.delay}%` : ''}` });
  s.log.push({ who: 'ai', text: c.response });
  if (c.locks) s.locked.push(c.locks);
  return s;
}

/** 结束本阶段：问源调度冗余设施，进度上升，进入下一阶段 */
export function endFinalPhase(s0: FinalState): FinalState {
  if (s0.done) return s0;
  const p = FINAL_PHASES[s0.phase];
  const s: FinalState = { ...s0, log: s0.log.slice(), locked: s0.locked.slice() };
  s.progress = Math.min(100, s.progress + p.aiGain);
  s.log.push({ who: 'sys', text: `问源调度冗余设施：实验进度 +${p.aiGain}%` });
  s.phase += 1;
  if (s.phase >= FINAL_PHASES.length) {
    s.progress = 100;
    s.done = true;
    s.hand = [];
    s.playsLeft = 0;
    s.log.push({ who: 'sys', text: '实验进度 100%。所有控制手段已用尽。' });
    return s;
  }
  const np = FINAL_PHASES[s.phase];
  s.hand = np.hand.slice();
  s.playsLeft = np.plays;
  s.log.push({ who: 'sys', text: np.intro });
  return s;
}
