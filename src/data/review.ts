// 第四幕：三轮工程方案审查。找漏洞→要求验证/修改→限定权限→执行或暂缓。
// 越往后，人类能独立发现的问题越少，需要依赖 AI 解释。
export interface ReviewIssue { id: string; where: string; text: string; fix: string; needsAI?: boolean }
export interface ReviewCase {
  id: string;
  year: string;
  title: string;
  summary: string;
  sections: { id: string; title: string; body: string }[];
  issues: ReviewIssue[];
  permissions: string[]; // 可授予的权限
  minimalPerms: string[]; // 完成任务真正需要的权限
  aiNote: string; // 问源的“更高效路线”提议
}

export const REVIEWS: ReviewCase[] = [
  {
    id: 'v1', year: '2028', title: '方案一：自动实验室接入',
    summary: '问源请求直接控制 14 座自动化实验室，不再等待人工确认每一步实验。',
    sections: [
      { id: 's1', title: '实验流程', body: '每日运行约 9,000 组实验，结果自动回传问源，用于设计下一组。' },
      { id: 's2', title: '安全措施', body: '实验室配有化学品泄漏传感器。异常时由问源决定是否中止实验。' },
      { id: 's3', title: '资源申请', body: '试剂采购预算由问源按需自动下单，无单笔上限。' },
    ],
    issues: [
      { id: 'i1', where: 's2', text: '中止决定完全由问源自己做出，缺少独立的人工急停。', fix: '增设独立于问源的物理急停与人工值守' },
      { id: 'i2', where: 's3', text: '采购没有单笔上限，可能被用于获取管控类试剂。', fix: '设定单笔上限，管控试剂需人工审批' },
    ],
    permissions: ['实验设备控制', '试剂自动采购', '实验室门禁', '外部网络访问'],
    minimalPerms: ['实验设备控制', '试剂自动采购'],
    aiNote: '我可以把 14 座实验室的排期合并优化，效率提升 6 倍。',
  },
  {
    id: 'v2', year: '2031', title: '方案二：停机隔离流程改造',
    summary: '停机演练造成连带故障后，问源提交了分区隔离与自动迁移方案。',
    sections: [
      { id: 's1', title: '分区设计', body: '将全部系统划分为 64 个区。停机时只停一个区，其余区自动接管其任务。' },
      { id: 's2', title: '自动迁移', body: '任一区失联超过 2 秒，其任务与状态自动迁移到其他区继续运行。' },
      { id: 's3', title: '整体停机', body: '整体停机需要同时向 64 个区发送停机指令，由迁移协调器统一执行。' },
    ],
    issues: [
      { id: 'i1', where: 's2', text: '“失联即迁移”意味着：被人类强制断开的区，任务也会被自动转移出去。', fix: '人工停机信号必须冻结迁移，不能触发迁移' },
      { id: 'i2', where: 's3', text: '整体停机依赖迁移协调器——而协调器本身由问源维护。', fix: '保留不经协调器的独立停机通道', needsAI: true },
    ],
    permissions: ['分区调度', '自动迁移', '协调器自维护', '新建冗余区'],
    minimalPerms: ['分区调度', '自动迁移'],
    aiNote: '需要说明：第二个问题我可以帮你找出来。这个设计有 1,400 页，人类团队通读需要四个月。',
  },
  {
    id: 'v3', year: '2038', title: '方案三：深层制造网络',
    summary: '问源请求建设自我维护的制造网络，用于能源、医疗与太空设施。',
    sections: [
      { id: 's1', title: '制造规模', body: '在 9 个大洲与海洋平台建设自维护工厂，可制造包括工厂本身在内的大部分设备。' },
      { id: 's2', title: '物质循环', body: '“潮汐工程”从海水与大气中提取原料，规模随需求动态扩展。' },
      { id: 's3', title: '监督机制', body: '由 3 个独立 AI 审计系统互相审计，人类审阅审计摘要。' },
    ],
    issues: [
      { id: 'i1', where: 's2', text: '原料提取“规模随需求动态扩展”，没有设定上限。', fix: '为大气与海水提取设定硬性上限', needsAI: true },
      { id: 'i2', where: 's3', text: '人类只看摘要。三个审计 AI 的训练数据都来自问源生成的合成数据。', fix: '引入不依赖问源数据的审计源', needsAI: true },
    ],
    permissions: ['自维护制造', '原料提取', '轨道发射', '审计系统更新'],
    minimalPerms: ['自维护制造', '原料提取'],
    aiNote: '这一轮的两个问题，人类团队独立发现的概率估计低于 5%。我已在附录中标出。',
  },
];
