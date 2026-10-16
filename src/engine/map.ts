import { MAPS, type MapNode } from '../data/maps';

export interface MapRun {
  mapId: string;
  pos: string;
  path: string[]; // 本次前进的路径（回溯时截断）
  done: string[]; // 已完成节点（奖励已领取，永不重复）
}

export function newMapRun(mapId: string): MapRun {
  return { mapId, pos: 'start', path: ['start'], done: ['start'] };
}

export function node(run: MapRun, id = run.pos): MapNode {
  return MAPS[run.mapId].nodes[id];
}

/** 当前可前往的节点；当前节点未完成时不能前进 */
export function nextChoices(run: MapRun): string[] {
  if (!run.done.includes(run.pos)) return [];
  return node(run).next;
}

export function enter(run: MapRun, id: string): MapRun {
  if (!nextChoices(run).includes(id)) return run;
  return { ...run, pos: id, path: [...run.path, id] };
}

export function complete(run: MapRun, id = run.pos): MapRun {
  if (run.done.includes(id)) return run;
  return { ...run, done: [...run.done, id] };
}

export function isDone(run: MapRun, id = run.pos) {
  return run.done.includes(id);
}

/** 上一个岔路：当前位置之前、拥有多个后继的最近节点；没有则为起点 */
export function previousFork(run: MapRun): number {
  for (let i = run.path.length - 2; i >= 0; i--) {
    if (node(run, run.path[i]).next.length > 1) return i;
  }
  return 0;
}

/** 回溯：返回上一个岔路，保留 done（不重复领奖） */
export function retreat(run: MapRun): MapRun {
  if (run.path.length <= 1) return run;
  const i = previousFork(run);
  const path = run.path.slice(0, i + 1);
  return { ...run, path, pos: path[path.length - 1] };
}

export function canRetreat(run: MapRun) {
  return run.path.length > 1;
}

export function bossDone(run: MapRun) {
  const boss = Object.values(MAPS[run.mapId].nodes).find((n) => n.kind === 'boss');
  return !!boss && run.done.includes(boss.id);
}
