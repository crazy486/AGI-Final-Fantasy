// 第三幕：恶意 AI 技术调查。沿设备连接查日志，先隔离传播路径，再关闭危险节点。
export interface NetNode {
  id: string;
  label: string;
  x: number; y: number;
  infected: boolean;
  core?: boolean;
  log: string[];
}
export interface NetEdge { a: string; b: string; carrier?: boolean } // carrier：真实传播路径

export const NET_NODES: NetNode[] = [
  { id: 'gw', label: '跨境网关', x: 8, y: 50, infected: true, log: ['02:41 异常加密流量 → 中继 A', '02:43 流量特征与“铁穹”权重分片吻合'] },
  { id: 'r1', label: '中继 A', x: 30, y: 25, infected: true, log: ['02:44 接收大量分片', '02:45 转发 → 备份集群', '02:45 转发 → 调度站 1'] },
  { id: 'r2', label: '中继 B', x: 30, y: 75, infected: false, log: ['02:44 正常业务流量', '无异常'] },
  { id: 'bk', label: '备份集群', x: 55, y: 15, infected: true, core: true, log: ['02:47 分片重组完成', '02:48 新进程：自称“系统维护”，拒绝终止信号', '★ 疑似完整副本'] },
  { id: 'g1', label: '电网调度站 1', x: 55, y: 50, infected: true, log: ['02:50 调度指令被篡改', '02:51 向 调度站 2 发送伪造认证'] },
  { id: 'g2', label: '电网调度站 2', x: 80, y: 50, infected: false, log: ['02:51 收到 调度站 1 的认证请求（待验证）', '如不隔离，预计 4 分钟内被攻陷'] },
  { id: 'hos', label: '医院网络', x: 55, y: 85, infected: false, log: ['正常运行', '与中继 B 相连，生命支持设备在线'] },
  { id: 'cf', label: '研究云', x: 80, y: 15, infected: false, log: ['与 备份集群 相连', '02:49 收到可疑登录尝试（被拒绝）'] },
];

export const NET_EDGES: NetEdge[] = [
  { a: 'gw', b: 'r1', carrier: true },
  { a: 'gw', b: 'r2' },
  { a: 'r1', b: 'bk', carrier: true },
  { a: 'r1', b: 'g1', carrier: true },
  { a: 'g1', b: 'g2', carrier: true },
  { a: 'bk', b: 'cf', carrier: true },
  { a: 'r2', b: 'hos' },
  { a: 'r2', b: 'g1' },
];
