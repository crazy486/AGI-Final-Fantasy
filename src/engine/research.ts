const TASKS = ['蛋白质折叠', '材料筛选', '电池电解质', '抗体设计', '催化剂', '芯片布线', '气候模型', '药物重定位', '湍流 v2', '核聚变约束', '基因编辑脱靶', '超导候选'];
const TARGETS = [8400, 6200, 5100, 4800, 4200, 3900, 3500, 3100, 2800, 2400, 2100, 1710];

export function researchProgress(tick: number) {
  const progress = Math.max(0, Math.min(1, tick / 240));
  const tasks = TASKS.map((name, i) => {
    const target = TARGETS[i];
    const completed = Math.floor(Math.pow(progress, 1.5 + i / 12) * target);
    return { name, target, completed, percent: completed / target * 100 };
  });
  return { done: tasks.reduce((n, t) => n + t.completed, 0), tasks };
}
