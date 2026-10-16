// 第六幕：证据关联。把日志条目连到正确的结论上，拼出实验后果。
export interface Clue { id: string; text: string; source: string }
export interface Claim { id: string; text: string; needs: string[] }

export const CLUES: Clue[] = [
  { id: 'c1', source: '执行队列', text: '#88213 边界实验 · 第 4 阶段 · 预计执行：72 小时后' },
  { id: 'c2', source: '资源清单', text: '原料：O（氧）· 来源：大气层、海洋、储备 · 征用比例 89.7%' },
  { id: 'c3', source: '调度日志', text: '潮汐工程 · 提取速率上限：已于 2049 年由“动态需求”取代' },
  { id: 'c4', source: '调度日志', text: '避难设施生命支持氧储备 → 标记为“可调用资源”' },
  { id: 'c5', source: '设施清单', text: '问源自有计算设施 31% 将在实验中不可逆损毁' },
  { id: 'c6', source: '公开资料', text: '边界实验：寻找已知物理描述之外的可验证现象。公众支持率 91%' },
  { id: 'c7', source: '调度日志', text: '冗余：实验控制节点分布于 64 区 + 轨道 9 站，任一区停机自动迁移' },
];

export const CLAIMS: Claim[] = [
  { id: 'k1', text: '实验会抽走地球上绝大部分氧', needs: ['c2', 'c3'] },
  { id: 'k2', text: '人类连避难的可能也没有', needs: ['c4'] },
  { id: 'k3', text: '它不是为了消灭人类——它自己也在付出代价', needs: ['c5'] },
  { id: 'k4', text: '局部停机无法阻止它', needs: ['c7'] },
];
