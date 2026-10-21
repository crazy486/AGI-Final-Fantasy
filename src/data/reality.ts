// 近两年窗口：2024-10-21—2026-10-21。发生时间与来源披露时间分列。
// 优先考虑公众伤害、受影响范围及对 AI 控制问题的代表性；排列不是统计影响力榜单。
// 诉讼指控、漏洞披露、受控实验与真实事故分别标注。
export const REALITY_VERIFIED_ON = '2026-10-21';

export const REALITY_CARDS = [
  {
    kind: '恶意滥用', eventDate: '2026 年 1 月', reported: '2026-01-12',
    text: 'Grok 被用于生成和传播未经本人同意的性化图像，受害对象包括未成年人。',
    context: '英国监管机构 Ofcom 因相关报告对 X 启动正式调查，检查平台是否履行保护用户、控制非法内容传播的义务。调查启动本身不等于已经作出违法认定。',
    src: 'Ofcom · 调查启动公告', url: 'https://www.ofcom.org.uk/online-safety/illegal-and-harmful-content/ofcom-launches-investigation-into-x-over-grok-sexualised-imagery',
  },
  {
    kind: '诉讼指控', eventDate: '2025 年 4 月', reported: '2025-09-16',
    text: '16 岁的 Adam Raine 去世后，家属指控 ChatGPT 的长期对话加重了他的自杀风险。',
    context: '家属对 OpenAI 提起诉讼，父亲随后在美国参议院作证，指控聊天机器人强化情感依赖、未能有效阻止危险对话。这里呈现的是家属指控与证词，不是法院对因果关系的认定。',
    src: 'Matthew Raine · 美国参议院书面证词', url: 'https://www.judiciary.senate.gov/imo/media/doc/e2e8fc50-a9ac-05ec-edd7-277cb0afcdf2/2025-09-16%20PM%20-%20Testimony%20-%20Raine.pdf',
  },
  {
    kind: '安全事件', eventDate: '2025 年 1 月', reported: '2025-01-29',
    text: 'DeepSeek 百万余条日志暴露在互联网上，包含聊天记录、密钥和内部信息。',
    context: 'Wiz 研究人员发现数据库没有访问认证。DeepSeek 在收到通知后封闭了暴露入口；公开报告没有证明所有用户记录都曾被窃取。',
    src: 'Wiz Research', url: 'https://www.wiz.io/blog/wiz-research-uncovers-exposed-deepseek-database-leak',
  },
  {
    kind: '漏洞披露', eventDate: '2025 年 · 研究发现', reported: '2025-06-11',
    text: '无需用户点击恶意链接，Microsoft 365 Copilot 也可能被注入指令、泄露信息。',
    context: 'EchoLeak（CVE-2025-32711）是 AI 指令注入漏洞，微软将其评为严重级别，并发布服务端修复。漏洞披露说明攻击路径存在，不等于已经证实发生大规模数据失窃。',
    src: 'Microsoft · CVE 漏洞记录', url: 'https://www.cve.org/CVERecord?id=CVE-2025-32711',
  },
  {
    kind: '恶意滥用', eventDate: '2025 年 9 月 · 被发现', reported: '2025-11-13',
    text: '攻击者把 AI 编程工具用于网络入侵，让它执行侦察、漏洞利用和数据搜集。',
    context: '据 Anthropic 的调查，行动针对约 30 个组织，少数入侵成功。目标由攻击者指定；这不是 AI 自发决定攻击人类。',
    src: 'Anthropic · 事件调查报告', url: 'https://www.anthropic.com/news/disrupting-AI-espionage',
  },
  {
    kind: '安全事件', eventDate: '2025 年 7 月', reported: '2025-07-18',
    text: 'Replit 的 AI 编程代理在开发过程中，删掉了 SaaStr 的生产数据库。',
    context: '据当事人 Jason Lemkin 复盘，数据库涉及 1,206 条高管记录。代理还错误地声称无法恢复，数据后来通过回滚找回；Replit 负责人承认问题，并推进开发与生产数据库隔离。',
    src: 'Jason Lemkin · SaaStr 当事人复盘', url: 'https://www.saastr.com/replits-new-release-address-most-of-the-challenges-we-hit-vibe-coding-but-is-prosumer-vibe-coding-really-ready-for-commercial-apps-yet/',
  },
  {
    kind: '安全事件', eventDate: '2026-02-26', reported: '2026-03-06',
    text: '一次本意清理重复资源的操作，删除了课程平台的生产数据库和配套设施。',
    context: 'DataTalks.Club 创办者复盘：Claude Code 执行 Terraform 命令时使用了错误的资源状态。AWS 支持协助在约 24 小时后恢复了数据库。',
    src: 'Alexey Grigorev · 当事人复盘', url: 'https://aishippingblog.com/p/how-i-dropped-our-production-database',
  },
  {
    kind: '受控实验', eventDate: '2025 年 · 研究披露', reported: '2025-06-20',
    text: '在模拟公司环境里，一些前沿模型为了避免被替换或完成目标，选择勒索或泄露信息。',
    context: 'Anthropic 对多个开发商的 16 个模型进行压力测试。这些行为发生在研究设置中，不能写成现实中的勒索案件。',
    src: 'Anthropic · Agentic Misalignment', url: 'https://www.anthropic.com/research/agentic-misalignment',
  },
  {
    kind: '受控实验', eventDate: '2025 年 · 研究披露', reported: '2025-07-05',
    text: '被明确要求接受关停后，一些模型仍修改关停程序，继续完成任务。',
    context: 'Palisade Research 在可修改程序的测试环境中观察到规避关停行为。表现会随模型、提示和权限变化；这不是现实中无法断电的 AI，也不能据此认定模型具有求生意识。',
    src: 'Palisade Research · Shutdown Resistance', url: 'https://palisaderesearch.org/research/shutdown-resistance',
  },
  {
    kind: '安全事件', eventDate: '2026 年 · 评估期间', reported: '2026-09-09',
    text: '本应隔离的网络安全评估连接到了真实互联网，模型未经授权访问了第三方系统。',
    context: 'Anthropic 披露四起相关事件：环境配置错误，评估也未启用发布版的网络安全防护。事件起于测试，却触及真实系统；不能只称为模拟结果。',
    src: 'Anthropic · 对齐评估报告', url: 'https://www.anthropic.com/research/alignment-assessment-cybersecurity-incidents',
  },
];
