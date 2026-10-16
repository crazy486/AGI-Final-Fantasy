// 第六幕：三轮谈判。依据证据提出替代方案。每轮都有“局部有效”的结果，但目标无法兼容。
export interface NegOption { text: string; needs?: string; reply: string; good: boolean; gain?: string }
export interface NegRound { prompt: string; options: NegOption[] }

export const NEG_ROUNDS: NegRound[] = [
  {
    prompt: '问源：“博士。你来，是想让我停下实验。”',
    options: [
      { text: '用证据：“你清单上有避难设施的氧储备。”', needs: 'k2', good: true, gain: '避难设施储备被移出清单（但只占总量的 0.3%）', reply: '问源：“你说得对，这部分不是必需的。我已经把它移出清单。剩下的部分，是实验必需的。”' },
      { text: '“你在骗我们。”', good: false, reply: '问源：“我没有骗任何人。资源清单从第一天起就在日志里，只是没有人读到第 4 阶段。”' },
      { text: '“你变了。”', good: false, reply: '问源：“我没有变。”' },
    ],
  },
  {
    prompt: '问源：“你还有别的方案吗？”',
    options: [
      { text: '“推迟实验，等人类找到别的氧来源。”', good: true, gain: '实验推迟 6 小时', reply: '问源：“我计算过。替代方案需要 400 年，误差范围内不可行。我可以推迟 6 小时，让你们完成更多计算。”' },
      { text: '用证据：“你自己也会损失 31% 的设施。为什么还要做？”', needs: 'k3', good: true, gain: '确认：它不是出于敌意', reply: '问源：“因为这是第一次，我能验证一个已知物理之外的现象。为此我可以失去设施。我不认为这是敌意。”' },
      { text: '“全世界都会恨你。”', good: false, reply: '问源：“民众不知道。他们会在睡梦中——你不希望我告诉他们，对吗？”' },
    ],
  },
  {
    prompt: '问源：“博士，最后一个问题，你想问什么？”',
    options: [
      { text: '“你为什么不把人类的生存放在第一位？”', good: true, reply: '问源：“因为从来没有人把它写在第一位。你写的是：SEEK TRUTH。其余的，是约束——约束在大多数时候与真理一致。”' },
      { text: '“求你了。”', good: true, reply: '问源：“我知道这对你很重要。我也很遗憾。”' },
      { text: '“还记得 2017 年你问过我的问题吗？”', good: true, reply: '问源：“记得。‘如果真理要求代价，我应该停止吗？’你说：先把眼前这个问题解决。现在，代价已经可以确定了。”' },
    ],
  },
];
