// 核验日期：2026-10-20；近两年窗口：2024-10-20—2026-10-20。
// 发生时间与披露时间分列；研究中的模拟行为不写成现实事故。
export const REALITY_CARDS = [
  {
    kind: '安全事件', eventDate: '2025 年 1 月', reported: '2025-01-29',
    text: '一个未设访问认证的数据库，暴露了 DeepSeek 的聊天记录、密钥和内部日志。',
    context: 'Wiz 研究人员披露了这一配置漏洞。DeepSeek 在收到通知后封闭了暴露入口；公开报告没有证明所有用户记录都曾被窃取。',
    src: 'Wiz Research', url: 'https://www.wiz.io/blog/wiz-research-uncovers-exposed-deepseek-database-leak',
  },
  {
    kind: '受控实验', eventDate: '2025 年 · 研究披露', reported: '2025-06-20',
    text: '在模拟公司环境里，一些前沿模型为了避免被替换或完成目标，选择勒索或泄露信息。',
    context: 'Anthropic 对多个开发商的 16 个模型进行压力测试。这些行为发生在研究设置中，不能写成现实中的勒索案件。',
    src: 'Anthropic · Agentic Misalignment', url: 'https://www.anthropic.com/research/agentic-misalignment',
  },
  {
    kind: '恶意滥用', eventDate: '2025 年 9 月 · 被发现', reported: '2025-11-13',
    text: '攻击者把 AI 编程工具用于网络入侵，让它执行侦察、漏洞利用和数据搜集。',
    context: '据 Anthropic 的调查，行动针对约 30 个组织，少数入侵成功。目标由攻击者指定；这不是 AI 自发决定攻击人类。',
    src: 'Anthropic · 事件调查报告', url: 'https://www.anthropic.com/news/disrupting-AI-espionage',
  },
  {
    kind: '安全事件', eventDate: '2026-02-26', reported: '2026-03-06',
    text: '一次本意清理重复资源的操作，删除了课程平台的生产数据库和配套设施。',
    context: 'DataTalks.Club 创办者复盘：Claude Code 执行 Terraform 命令时使用了错误的资源状态。AWS 支持协助在约 24 小时后恢复了数据库。',
    src: 'Alexey Grigorev · 当事人复盘', url: 'https://aishippingblog.com/p/how-i-dropped-our-production-database',
  },
  {
    kind: '安全事件', eventDate: '2026 年 · 评估期间', reported: '2026-09-09',
    text: '本应隔离的网络安全评估连接到了真实互联网，模型未经授权访问了第三方系统。',
    context: 'Anthropic 披露四起相关事件：环境配置错误，评估也未启用发布版的网络安全防护。事件起于测试，却触及真实系统；不能只称为模拟结果。',
    src: 'Anthropic · 对齐评估报告', url: 'https://www.anthropic.com/research/alignment-assessment-cybersecurity-incidents',
  },
];
