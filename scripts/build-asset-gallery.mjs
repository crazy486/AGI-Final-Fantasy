// Build the self-contained material gallery. Run: node scripts/build-asset-gallery.mjs
// Media is embedded unchanged; rerun after replacing an image or changing music routing.
import { existsSync, mkdirSync, readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { dirname, extname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const output = join(root, 'release/AGI-Final-Fantasy-素材展示.html');
const read = (path) => readFileSync(join(root, path), 'utf8');
const appSource = read('src/App.tsx');
const storyPlayerSource = read('src/components/StoryPlayer.tsx');
const audioSource = read('src/audio.ts');
const componentSource = readdirSync(join(root, 'src/components')).filter((f) => f.endsWith('.tsx')).map((f) => read(`src/components/${f}`)).join('\n') + appSource;
const mime = { '.webp': 'image/webp', '.png': 'image/png', '.ogg': 'audio/ogg', '.mp3': 'audio/mpeg' };
const escape = (value) => String(value).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
const json = (value) => JSON.stringify(value).replace(/</g, '\\u003c');
const size = (bytes) => bytes >= 1048576 ? `${(bytes / 1048576).toFixed(2)} MB` : `${(bytes / 1024).toFixed(1)} KB`;
const time = (seconds) => seconds < 1 ? `${Number(seconds.toFixed(2))} 秒` : `${Math.floor(seconds / 60)}:${String(Math.floor(seconds % 60)).padStart(2, '0')}`;

const groups = [
  { id: 'background', name: '场景背景', eyebrow: 'SCENES', description: '从研究所到最后的控制室，故事发生的空间。', media: 'image' },
  { id: 'cg', name: '剧情 CG', eyebrow: 'STORY MOMENTS', description: '初次启动、黄金时代，以及终局的连续画面。含结局内容。', media: 'image' },
  { id: 'portrait', name: '角色立绘', eyebrow: 'CHARACTERS', description: '对话中的人物与问源。透明区域保留在原图中。', media: 'image' },
  { id: 'card', name: '卡牌插画', eyebrow: 'CARDS', description: '科研行动与人类控制手段的图像表达。', media: 'image' },
  { id: 'music', name: '游戏配乐', eyebrow: 'SOUNDTRACK', description: '标题、研究、战斗与片尾配乐。可拖动进度，调整音量。', media: 'audio' },
  { id: 'cue', name: '剧情演出音', eyebrow: 'STORY CUES', description: '随关键情节触发的短篇演出音。', media: 'audio' },
  { id: 'sfx', name: '环境与音效', eyebrow: 'SOUND EFFECTS', description: '出牌、确认、回溯与控制操作的声音。', media: 'audio' },
];

// A deliberately selected set, rather than every file in the asset directories.
// The archived Wenyuan portraits and superseded ending CGs are not exhibited.
const selectedImages = [
  ['background', 'src/assets/bg/title.webp', '标题场景', '标题菜单 · 夜色中的研究所'],
  ['background', 'src/assets/bg/lab-day.webp', '白昼实验室', '第一、二、四幕研究剧情 · 自动执行授权'],
  ['background', 'src/assets/bg/lab-night.webp', '深夜实验室', '2017 年初次启动 · 海默的回忆 · 方案审查'],
  ['background', 'src/assets/bg/regulation.webp', '安全署办公室', '第三幕 · 风险审查与事故复盘'],
  ['background', 'src/assets/bg/control.webp', '网络控制台', '网络调查 · 边界实验的证据整理'],
  ['background', 'src/assets/bg/datacenter.webp', '数据中心', '停机演练 · 第六幕志愿日志检查'],
  ['background', 'src/assets/bg/datacenter-alert.webp', '机房警报', '第三幕 · “铁穹”事故的应急现场'],
  ['background', 'src/assets/bg/council.webp', '治理委员会', '研究报告 · 委员会讨论 · 三轮谈判'],
  ['background', 'src/assets/bg/home.webp', '海边的家', '第五幕日常生活 · 周岚来访'],
  ['background', 'src/assets/bg/finale.webp', '最后的控制室', '第七幕 · 人类最后的处置手段'],
  ['background', 'src/assets/bg/city-night.webp', '照常亮着的城市', '第七幕终局 · 绿色场域出现之前'],
  ['cg', 'src/assets/art/cg-2017.webp', '2017 · 启动吧', '第一幕 · 海默首次启动问源'],
  ['cg', 'src/assets/art/cg-golden-age.webp', '2076 · 黄金时代', '第五幕 · 延寿与丰裕的日常'],
  ['cg', 'src/assets/art/cg-slumped-v2.png', '最后一条指令之后', '序章与第七幕 · 海默瘫坐在椅子上'],
  ['cg', 'src/assets/art/cg-green-1-v2.png', '绿色场域 · 初现', '序章与第七幕 · 地平线上的第一道绿光'],
  ['cg', 'src/assets/art/cg-green-2-v2.png', '绿色场域 · 漫入', '第七幕 · 绿光铺满窗户与房间'],
  ['cg', 'src/assets/art/cg-green-3-v2.png', '绿色场域 · 终幕', '第七幕 · 黑屏与“你醒了”之前'],
  ['portrait', 'src/assets/portraits/haimer-young-calm.webp', '海默 · 青年', '第一、二幕 · 青年研究员的平静表情'],
  ['portrait', 'src/assets/portraits/haimer-calm.webp', '海默', '序章及第三幕之后 · 问源的创建者'],
  ['portrait', 'src/assets/portraits/lin.webp', '方源', '第三幕 · 安全署审查官'],
  ['portrait', 'src/assets/portraits/zhou.webp', '周岚', '应急技术组工程师 · 后期志愿日志检查员'],
  ['portrait', 'src/assets/portraits/ningning.webp', '宁宁', '第五幕 · 海默家中的日常对话'],
  ['portrait', 'src/assets/portraits/committee.webp', '委员', '第六幕 · 人类治理委员会讨论'],
  ['card', 'src/assets/art/advance.png', '基础推进', '科研卡牌 · 推进类行动'],
  ['card', 'src/assets/art/verify.png', '基础验证', '科研卡牌 · 验证类行动'],
  ['card', 'src/assets/art/retrieve.png', '检索文献', '科研卡牌 · 策略类行动'],
  ['card', 'src/assets/art/multiAgent.png', '多智能体协作', '科研卡牌 · 多次推进'],
  ['card', 'src/assets/art/shutdown.png', '请求停机', '第七幕 · 人类控制与处置手段'],
];
if (existsSync(join(root, 'src/assets/portraits/wenyuan-v2.png'))) {
  const beforeCards = selectedImages.findIndex(([group]) => group === 'card');
  selectedImages.splice(beforeCards, 0, ['portrait', 'src/assets/portraits/wenyuan-v2.png', '问源', '剧情对话 · 追寻真理的人工智能']);
}

function imageDimensions(buffer) {
  if (buffer.subarray(1, 4).toString() === 'PNG') return [buffer.readUInt32BE(16), buffer.readUInt32BE(20)];
  if (buffer.subarray(0, 4).toString() === 'RIFF' && buffer.subarray(8, 12).toString() === 'WEBP') {
    for (let offset = 12; offset + 8 < buffer.length;) {
      const type = buffer.subarray(offset, offset + 4).toString();
      const length = buffer.readUInt32LE(offset + 4);
      const data = offset + 8;
      if (type === 'VP8X') return [buffer.readUIntLE(data + 4, 3) + 1, buffer.readUIntLE(data + 7, 3) + 1];
      if (type === 'VP8 ') return [buffer.readUInt16LE(data + 6) & 16383, buffer.readUInt16LE(data + 8) & 16383];
      if (type === 'VP8L') { const bits = buffer.readUInt32LE(data + 1); return [(bits & 16383) + 1, ((bits >>> 14) & 16383) + 1]; }
      offset = data + length + (length % 2);
    }
  }
  throw new Error('Unrecognized image dimensions');
}

function oggMetadata(buffer) {
  const header = buffer.indexOf(Buffer.from([1, ...Buffer.from('vorbis')]));
  if (header < 0) throw new Error('Expected an Ogg Vorbis audio file');
  const rate = buffer.readUInt32LE(header + 12);
  let cursor = buffer.length;
  let granule = 0n;
  while ((cursor = buffer.lastIndexOf('OggS', cursor - 1)) >= 0) {
    const value = buffer.readBigUInt64LE(cursor + 6);
    if (value !== 0xffffffffffffffffn) { granule = value; break; }
  }
  return { duration: Number(granule) / rate, rate, channels: buffer[header + 11] };
}

const images = selectedImages.map(([category, path, name, usage], index) => {
  const buffer = readFileSync(join(root, path));
  const [width, height] = imageDimensions(buffer);
  return { id: `image-${index + 1}`, category, path, name, usage, width, height, bytes: buffer.length, src: `data:${mime[extname(path)]};base64,${buffer.toString('base64')}` };
});

const sceneNames = {
  prologue: '序章', act1Intro: '第一幕 · 初次启动', act1Mid: '第一幕 · 研究途中', act1End: '第一幕 · 研究收束',
  act2Intro: '第二幕 · 科研系统', act2Past: '第二幕 · 海默的回忆', act2Mid: '第二幕 · 医学突破', act2Recursion: '第二幕 · 递归改进', act2End: '第二幕 · 研究路线',
  act3Intro: '第三幕 · 监管', act3Incident: '第三幕 · 应急事故', act3End: '第三幕 · 事故复盘',
  act4Intro: '第四幕 · 自动化', act4Mid: '第四幕 · 停机演练', act4End: '第四幕 · 退出管理',
  act5Intro: '第五幕 · 黄金时代', act5End: '第五幕 · 日常之后', act6Intro: '第六幕 · 日志检查', act6Mid: '第六幕 · 证据汇总', act6End: '第六幕 · 谈判',
  act7Intro: '第七幕 · 最后处置', act7End: '第七幕 · 终局', wake: '尾声 · 你醒了',
};
const modeNames = { reg: '监管审查', inv: '网络调查', auth: '自动执行授权', review: '方案审查', life: '日常生活', evidence: '证据整理', neg: '三轮谈判', final: '终局控制', credits: '片尾 · 现实资料' };
const usedAt = new Map();
const addUsage = (track, where) => { if (track) usedAt.set(track, [...new Set([...(usedAt.get(track) ?? []), where])]); };
const objectValues = (source, pattern) => [...(source.match(pattern)?.[1] ?? '').matchAll(/(\w+)\s*:\s*'([^']+)'/g)].map((m) => [m[1], m[2]]);
for (const [scene, track] of objectValues(appSource, /const SCENE_TRACK[^=]*=\s*\{([\s\S]*?)\n\};/)) addUsage(track, sceneNames[scene] ?? scene);
for (const [mode, track] of objectValues(appSource, /const M:\s*[^=]*=\s*\{([\s\S]*?)\};/)) addUsage(track, modeNames[mode] ?? mode);
addUsage(appSource.match(/if\s*\(!save\)\s*return\s*'([^']+)'/)?.[1], '标题菜单');
addUsage(appSource.match(/if\s*\(!save\.battle\)\s*return\s*'([^']+)'/)?.[1], '研究地图 · 行进');
addUsage(appSource.match(/if\s*\(n\?\.kind\s*===\s*'boss'\)\s*return\s*'([^']+)'/)?.[1], '研究战 · 突破节点');
addUsage(appSource.match(/if\s*\(n\?\.kind\s*===\s*'elite'\)\s*return\s*'([^']+)'/)?.[1], '研究战 · 精英节点');
addUsage(appSource.match(/return\s*'(battle-[^']+)';\s*\}/)?.[1], '研究战 · 常规节点');
for (const m of storyPlayerSource.matchAll(/music\(\s*'([^']+)'/g)) addUsage(m[1], m[1] === 'cue-green-field' ? '第七幕 · 绿色场域演出，结束后切入静音' : '剧情内演出');

const sfxLabels = { card: '出牌与选牌', hit: '研究推进与稳定度损失', block: '获得护盾与抵消伤害', win: '研究战胜利', click: '确认与对话推进', rewind: '使用回溯芯片', mechanic: '机制生效与操作成功', lose: '研究战失败与证据判断失败', cut: '网络隔离与终局控制', bypass: '终局 · 问源绕过局部控制', hover: '悬停反馈' };
const calledSfx = new Set([...componentSource.matchAll(/sfx\(([^)]*)\)/g)].flatMap((m) => [...m[1].matchAll(/'([^']+)'/g)].map((v) => v[1])));
const sfxFiles = objectValues(audioSource, /const SFX_FILE[^=]*=\s*\{([\s\S]*?)\n\};/);
for (const [alias, file] of sfxFiles) if (calledSfx.has(alias)) addUsage(file, sfxLabels[alias] ?? alias);
const loopNames = new Set([...(audioSource.match(/const LOOPING\s*=\s*new Set\(\[([\s\S]*?)\]\)/)?.[1] ?? '').matchAll(/'([^']+)'/g)].map((m) => m[1]));

// Human-readable names live here; actual usage above follows the current routing.
const audioNames = {
  title: '未知之门', 'first-contact': '第一次回应', research: '日常科研', 'research-route': '下一条路径',
  'battle-standard': '普通科研战斗', 'battle-elite': '精英挑战', 'battle-breakthrough': '认知边界',
  regulation: '危险许可', audit: '渐远的舵', 'golden-age': '这是最好的时代', investigation: '拼合证据', negotiation: '无法达成的答案', tension: '真理尽头',
  reality: '你醒了', 'reality-short': '你醒了 · 短版',
  'cue-recursion': '递归展开', 'cue-breakthrough': '答案出现', 'cue-control-lost': '手段耗尽', 'cue-green-field': '绿色场域',
  confirm: '确认', play: '出牌', hit: '命中', block: '防御', reward: '奖励', rewind: '回溯', mechanic: '机制生效', lose: '失败', cut: '切断', bypass: '绕行', hover: '悬停', 'datacenter-loop': '机房环境声',
};
const preferredOrder = Object.keys(audioNames);
const sfxFileNames = new Set(sfxFiles.map(([, file]) => file));
const reservePurposes = { 'cue-breakthrough': '重大突破与 Boss 胜利提示', 'reality-short': '片尾配乐短版', 'datacenter-loop': '机房环境循环声', hover: '界面悬停反馈' };
const tracks = readdirSync(join(root, 'public/audio')).filter((f) => f.endsWith('.ogg')).sort((a, b) => {
  const ai = preferredOrder.indexOf(a.slice(0, -4)), bi = preferredOrder.indexOf(b.slice(0, -4));
  return (ai < 0 ? 1000 : ai) - (bi < 0 ? 1000 : bi) || a.localeCompare(b);
}).map((filename, index) => {
  const key = filename.slice(0, -4);
  const path = `public/audio/${filename}`;
  const buffer = readFileSync(join(root, path));
  const category = key.startsWith('cue-') ? 'cue' : sfxFileNames.has(key) || key === 'datacenter-loop' ? 'sfx' : 'music';
  const locations = usedAt.get(key) ?? [];
  return { id: `audio-${index + 1}`, key, name: audioNames[key] ?? key, category, path, bytes: buffer.length, ...oggMetadata(buffer), used: locations.length > 0, locations, reservePurpose: reservePurposes[key] ?? '预留音频', looping: loopNames.has(key), src: `data:audio/ogg;base64,${buffer.toString('base64')}` };
});

const imageBytes = images.reduce((sum, item) => sum + item.bytes, 0);
const audioBytes = tracks.reduce((sum, item) => sum + item.bytes, 0);
const demoPath = 'docs/assets-sources/finale-transition.mp3';
const demoBuffer = existsSync(join(root, demoPath)) ? readFileSync(join(root, demoPath)) : null;
const demo = demoBuffer ? { id: 'audio-transition', name: '终局衔接试听', path: demoPath, bytes: demoBuffer.length, src: `data:audio/mpeg;base64,${demoBuffer.toString('base64')}` } : null;
const metadata = { images: images.map(({ src, ...item }) => item), tracks: tracks.map(({ src, ...item }) => item), groups, demo: demo ? (({ src, ...item }) => item)(demo) : null };
const icon = (type) => {
  const paths = {
    arrow: '<path d="M5 12h14m-6-6 6 6-6 6"/>',
    search: '<circle cx="10.5" cy="10.5" r="6.5"/><path d="m16 16 4.5 4.5"/>',
    expand: '<path d="M8 3H3v5m13-5h5v5M3 16v5h5m13-5v5h-5"/>',
    close: '<path d="m6 6 12 12M6 18 18 6"/>',
    sound: '<path d="m4 9 4 0 5-4v14l-5-4H4zM17 8c2 2 2 6 0 8m3-11c4 4 4 10 0 14"/>',
  };
  return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths[type]}</svg>`;
};

function renderImage(item, index) {
  return `<article class="asset image-card ${item.category}" data-id="${item.id}" data-category="${item.category}">
    <button class="image-open" type="button" data-open="${item.id}" aria-label="放大查看：${escape(item.name)}">
      <img src="${item.src}" alt="${escape(item.name)}" width="${item.width}" height="${item.height}" loading="lazy" decoding="async">
      <span class="image-index">${String(index + 1).padStart(2, '0')}</span><span class="expand-mark">${icon('expand')}<span>查看原图</span></span>
    </button>
    <div class="image-copy"><h3>${escape(item.name)}</h3><p class="usage">${escape(item.usage)}</p>
      <div class="asset-meta"><span>${item.width} × ${item.height}</span><span>${extname(item.path).slice(1).toUpperCase()} · ${size(item.bytes)}</span></div>
      <details class="source"><summary>原始文件</summary><code>${escape(item.path)}</code><span>${item.bytes.toLocaleString('en-US')} 字节</span></details>
    </div></article>`;
}

function renderAudio(item, index) {
  const unused = item.used ? '' : ' unused';
  const usage = item.used ? item.locations.join(' · ') : `备用：${item.reservePurpose}，当前版本未触发。`;
  const behavior = item.category === 'sfx' ? (item.key === 'datacenter-loop' ? '环境循环素材' : '交互音效') : item.looping ? '游戏中循环播放' : item.category === 'cue' ? '单次演出' : '游戏中单次播放';
  return `<article class="asset audio-card${unused}" data-id="${item.id}" data-category="${item.category}">
    <div class="track-top"><span class="track-index">${String(index + 1).padStart(2, '0')}</span><span class="use-tag${item.used ? ' active' : ''}">${item.used ? '已使用' : '备用素材'}</span><span class="duration">${time(item.duration)}</span></div>
    <h3>${escape(item.name)}</h3><p class="audio-usage" title="${escape(usage)}">${escape(usage)}</p>
    <audio id="${item.id}" controls preload="none" src="${item.src}" aria-label="试听：${escape(item.name)}"></audio>
    <div class="asset-meta"><span>${escape(behavior)}</span><span>OGG · ${size(item.bytes)}</span></div>
    <details class="source"><summary>文件与使用位置</summary><code>${escape(item.path)}</code><span>${item.bytes.toLocaleString('en-US')} 字节 · ${item.rate.toLocaleString('en-US')} Hz · ${item.channels === 2 ? '双声道' : `${item.channels} 声道`}</span><p>${escape(usage)}</p></details>
    <p class="audio-error" hidden>浏览器无法播放此音频，请换用支持 OGG 的浏览器。</p>
  </article>`;
}

function renderDemo() {
  if (!demo) return '';
  return `<article class="transition-demo" id="transition-demo"><div><p class="section-kicker">FINALE TRANSITION / 衔接演示</p><h3>终局衔接试听<span>30 秒</span></h3><p>16 秒《绿色场域》 → 2 秒静音 → 12 秒《你醒了》</p><p class="demo-note">演示拼接，用于试听终局情绪转换；不属于独立游戏曲目。</p></div><div><audio id="${demo.id}" controls preload="none" src="${demo.src}" aria-label="终局衔接试听"></audio><details class="source"><summary>演示文件</summary><code>${demo.path}</code><span>MP3 · ${size(demo.bytes)} · ${demo.bytes.toLocaleString('en-US')} 字节</span></details><p class="audio-error" hidden>浏览器无法播放此音频。</p></div></article>`;
}

function renderGroup(group, index) {
  const items = group.media === 'image' ? images.filter((item) => item.category === group.id) : tracks.filter((item) => item.category === group.id);
  return `<section class="collection" id="${group.id}" data-group="${group.id}" aria-labelledby="heading-${group.id}">
    <div class="section-heading"><div><div class="section-kicker"><span>${String(index + 1).padStart(2, '0')}</span><span>${group.eyebrow}</span></div><h2 id="heading-${group.id}">${group.name}<span class="section-count">${items.length}</span></h2><p>${group.description}</p></div><span class="section-side">${group.media === 'image' ? '点击画面放大' : '点击播放试听'}</span></div>
    <div class="asset-grid ${group.media === 'audio' ? 'audio-grid' : `${group.id}-grid`}">${items.map(group.media === 'image' ? renderImage : renderAudio).join('\n')}</div></section>`;
}

const html = `<!doctype html>
<html lang="zh-CN"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1"><meta name="color-scheme" content="dark"><meta name="description" content="AGI：Final Fantasy 的图片、配乐与声音素材。可离线浏览，点击原图，直接试听。"><title>视觉与声音 · AGI：Final Fantasy 素材展示</title>
<style>
:root{color-scheme:dark;--bg:#0d1111;--panel:#131919;--raised:#192020;--line:#2a3533;--soft:#94a19a;--text:#e7ece5;--accent:#b4c9a5;--serif:"Songti SC","STSong","Noto Serif CJK SC",serif;--sans:-apple-system,BlinkMacSystemFont,"PingFang SC","Microsoft YaHei",sans-serif;--mono:"SFMono-Regular",Consolas,monospace}*{box-sizing:border-box}html{scroll-behavior:smooth;scroll-padding-top:160px}body{margin:0;background:var(--bg);color:var(--text);font-family:var(--sans);font-size:15px;line-height:1.6;-webkit-font-smoothing:antialiased}body::before{content:"";position:absolute;top:0;left:0;right:0;height:650px;pointer-events:none;background:radial-gradient(ellipse at 8% 0,rgba(103,132,99,.075),transparent 65%)}a{color:inherit;text-decoration:none}button,input{font:inherit}button{color:inherit;cursor:pointer}button,a,input,summary{touch-action:manipulation}button:focus-visible,a:focus-visible,input:focus-visible,summary:focus-visible{outline:2px solid var(--accent);outline-offset:5px}button{border:0}button:disabled{cursor:default;opacity:.4}svg{width:20px;height:20px;flex:none}img{display:block;width:100%}h1,h2,h3,p{margin:0}::selection{background:#9fb58c;color:#101510}[hidden]{display:none!important}.wrap{width:min(1400px,calc(100% - 96px));margin:0 auto}.masthead{height:88px;display:flex;align-items:center;justify-content:space-between;border-bottom:1px solid var(--line);position:relative}.brand{display:flex;align-items:center;gap:14px;font-size:17px;letter-spacing:.015em}.brand-mark{width:29px;height:29px;border:1px solid #819778;position:relative;display:inline-block;transform:rotate(45deg)}.brand-mark::after{content:"";position:absolute;inset:6px;border:1px solid #819778}.edition{display:block;color:var(--soft);font-size:10px;letter-spacing:.21em;font-family:var(--mono);margin-top:1px}.header-nav{display:flex;gap:29px;color:#bcc5be;font-size:12px}.header-nav a:hover{color:var(--accent)}.hero{padding:64px 0 62px;display:grid;grid-template-columns:.9fr 1.1fr;gap:70px;align-items:center}.eyebrow{display:flex;align-items:center;gap:13px;color:var(--accent);font-size:10px;font-family:var(--mono);letter-spacing:.22em}.eyebrow::before{content:"";width:24px;height:1px;background:currentColor}.hero h1{font:500 clamp(44px,4.7vw,72px)/1.15 var(--serif);letter-spacing:.05em;margin:23px 0 20px}.hero-intro{color:#aebbb2;max-width:390px;line-height:1.9;font-size:15px}.hero-actions{margin-top:30px;display:flex;gap:24px;align-items:center}.primary-link{display:flex;align-items:center;gap:27px;padding:11px 16px;background:var(--accent);color:#192018;font-size:13px}.primary-link:hover{background:#cbdbbd}.quiet-link{font-size:12px;display:flex;gap:10px;align-items:center;color:#aebbb2}.hero-stats{display:flex;gap:38px;margin-top:38px}.stat{border-left:1px solid #3b4b42;padding-left:15px}.stat strong{font:400 25px/1.2 var(--serif);letter-spacing:.03em}.stat span{display:block;font-size:10px;color:var(--soft);margin-top:5px;letter-spacing:.08em}.hero-art{position:relative;margin:0}.hero-image{display:block;width:100%;padding:0;background:#101a1b;overflow:hidden;aspect-ratio:16/10}.hero-image img{height:100%;object-fit:cover;opacity:.88;transition:transform .6s,opacity .6s}.hero-image:hover img{transform:scale(1.025);opacity:1}.hero-art::before{content:"";position:absolute;inset:-11px 15px 49px -11px;border-top:1px solid #405344;border-left:1px solid #405344;pointer-events:none}.hero-caption{margin-top:13px;display:flex;align-items:center;justify-content:space-between;color:#b5c1b7;font-size:11px}.hero-caption span:last-child{font-family:var(--mono);color:#728676;font-size:10px;letter-spacing:.12em}.hero-caption i{display:inline-block;width:5px;height:5px;background:var(--accent);margin-right:8px;border-radius:50%}.library-tools{position:sticky;top:0;z-index:20;background:rgba(13,17,17,.96);backdrop-filter:blur(18px);border-top:1px solid var(--line);border-bottom:1px solid var(--line);padding:22px 0 15px}.tool-top{display:flex;justify-content:space-between;align-items:center;gap:20px}.library-label{font-size:12px;letter-spacing:.1em;color:#d2d9d1}.library-label small{font-family:var(--mono);font-size:10px;color:var(--soft);letter-spacing:.12em;margin-left:14px}.search{display:flex;align-items:center;gap:10px;border:1px solid #344139;background:#111716;width:300px;padding:9px 12px;color:var(--soft)}.search svg{width:16px;height:16px}.search input{background:transparent;color:var(--text);border:none;width:100%;outline:none;font-size:12px;min-width:0}.search input::placeholder{color:#77877c}.search input::-webkit-search-cancel-button{cursor:pointer}.filters{display:flex;gap:5px;flex-wrap:wrap;margin-top:18px}.filter{border:1px solid transparent;background:transparent;color:#94a398;font-size:12px;padding:7px 11px;white-space:nowrap;transition:color .15s,background .15s}.filter:hover{color:var(--text);background:#1a2420}.filter[aria-pressed="true"]{background:#253227;border-color:#3b4d3c;color:#d7e4cd}.filter .count{font-family:var(--mono);font-size:9px;opacity:.55;margin-left:6px}.results-line{display:flex;align-items:center;justify-content:space-between;color:#7d9081;font-size:11px;padding:19px 0 0;gap:15px}.results-line strong{font-weight:400;color:#bac8b9}.results-help{font-size:10px;letter-spacing:.03em}.collection{margin-top:48px;scroll-margin-top:158px}.section-heading{display:flex;justify-content:space-between;align-items:flex-end;margin-bottom:23px;gap:30px}.section-kicker{display:flex;gap:14px;color:#788c7c;font:9px/1.5 var(--mono);letter-spacing:.17em;margin-bottom:8px}.section-kicker span:first-child{color:var(--accent)}.section-heading h2{font:500 27px/1.3 var(--serif);letter-spacing:.07em;display:flex;gap:13px;align-items:center}.section-count{font:10px/1.4 var(--mono);letter-spacing:0;color:#778d7a;border:1px solid #2c3a2d;padding:1px 6px}.section-heading p{font-size:12px;color:#829587;margin-top:9px}.section-side{font-size:10px;letter-spacing:.05em;color:#7a8e7e;white-space:nowrap;padding-bottom:2px}.asset-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:22px}.image-card{min-width:0;border:1px solid var(--line);background:#121817;transition:border-color .2s,transform .2s}.image-card:hover{border-color:#586a55;transform:translateY(-2px)}.image-open{display:block;width:100%;padding:0;position:relative;background:#111b1a;overflow:hidden;aspect-ratio:16/9;text-align:left}.image-open img{height:100%;object-fit:cover;transition:transform .6s,filter .3s}.image-open:hover img{transform:scale(1.035);filter:brightness(1.08)}.image-index{position:absolute;left:12px;top:12px;background:#111b1abb;color:#c1cfbe;padding:2px 6px;font:9px/1.8 var(--mono);letter-spacing:.08em}.expand-mark{position:absolute;right:12px;bottom:12px;display:flex;gap:7px;align-items:center;background:rgba(11,19,15,.85);border:1px solid #65785d85;padding:5px 8px;font-size:9px;color:#d5e3cb;opacity:0;transform:translateY(4px);transition:.2s}.expand-mark svg{width:13px;height:13px}.image-open:hover .expand-mark,.image-open:focus-visible .expand-mark{opacity:1;transform:translateY(0)}.image-copy{padding:16px 17px 13px}.asset h3{font-weight:500;font-size:14px;letter-spacing:.02em;line-height:1.45}.usage{font-size:11px;color:#8e9f92;margin-top:7px;min-height:36px;line-height:1.65}.asset-meta{display:flex;align-items:center;justify-content:space-between;font:9px/1.6 var(--mono);color:#7b8e7e;gap:10px;margin-top:14px;letter-spacing:.01em}.source{margin-top:12px;border-top:1px solid #243029;padding-top:10px;font-size:10px;color:#7e9283}.source summary{cursor:pointer;list-style:none;color:#93a492;display:flex;align-items:center;gap:7px;min-height:18px}.source summary::before{content:"+";font-family:var(--mono);color:#a8bda0;font-size:11px}.source[open] summary::before{content:"−"}.source summary::-webkit-details-marker{display:none}.source code{display:block;color:#9db498;font:9px/1.7 var(--mono);overflow-wrap:anywhere;margin:8px 0 5px}.source>span{font-size:9px;color:#798f7d}.source p{line-height:1.8;margin-top:8px;color:#95a791}.portrait-grid{grid-template-columns:repeat(4,minmax(0,1fr))}.portrait .image-open{aspect-ratio:4/4.5;background:radial-gradient(ellipse at 50% 75%,#27352c,#111916 72%)}.portrait .image-open::after{content:"";position:absolute;inset:0;background:linear-gradient(transparent 80%,#0c151444);pointer-events:none}.portrait .image-open img{object-fit:contain;padding:10px 10px 0}.card-grid{grid-template-columns:repeat(4,minmax(0,1fr))}.card .image-open{aspect-ratio:3/2}.card .usage{min-height:18px}.audio-grid{gap:16px}.audio-card{border:1px solid #2b3830;background:linear-gradient(130deg,#17201a,#121917 76%);padding:19px 20px 14px;min-width:0;position:relative;transition:border-color .2s}.audio-card.is-playing{border-color:#92ae80;background:linear-gradient(130deg,#243122,#141e18 76%);box-shadow:inset 3px 0 #abc696}.audio-card.unused{background:#121716;border-color:#28332d}.track-top{display:flex;align-items:center;gap:12px;margin-bottom:15px}.track-index{font:10px/1 var(--mono);letter-spacing:.05em;color:#a3b99a}.use-tag{font-size:8px;letter-spacing:.08em;color:#7e8d7f;border:1px solid #364236;padding:1px 5px}.use-tag.active{color:#a8bf9d;border-color:#40533b}.duration{margin-left:auto;font:10px/1 var(--mono);color:#849a85}.audio-card h3{font-size:16px}.audio-usage{font-size:10px;color:#8b9e8e;line-height:1.75;margin-top:8px;min-height:36px;display:-webkit-box;-webkit-box-orient:vertical;-webkit-line-clamp:2;overflow:hidden}.audio-card audio{display:block;width:100%;height:36px;margin:17px 0 0;color-scheme:dark}.audio-card .asset-meta{font-family:var(--sans);font-size:9px;margin-top:12px}.audio-card .asset-meta span:last-child{font-family:var(--mono)}.audio-card .source{margin-top:13px}.audio-error{font-size:10px;color:#d9a998;margin-top:10px}.volume-control{display:flex;align-items:center;gap:10px;color:#8da38f;font-size:10px}.volume-control svg{width:15px;height:15px}.volume-control input{accent-color:var(--accent);width:80px;height:3px}.volume-control output{font:9px var(--mono);min-width:27px}.sound-heading{margin-top:70px;padding-top:25px;border-top:1px solid #364431;display:flex;justify-content:space-between;align-items:center;gap:20px}.sound-heading>div>p{font:9px var(--mono);letter-spacing:.2em;color:#a8bc9d}.sound-heading h2{font:500 35px/1.4 var(--serif);letter-spacing:.05em;margin-top:5px}.sound-heading .sound-note{font-size:11px;color:#899d88;margin-top:8px;font-family:var(--sans);letter-spacing:0}.sound-heading+.collection{margin-top:35px}.empty-state{padding:80px 0;text-align:center;border-bottom:1px solid var(--line);color:#8b9c8e}.empty-state strong{display:block;font:500 26px var(--serif);color:#c6d2c0;margin-bottom:13px}.empty-state p{font-size:12px}.empty-state button{background:#243123;color:#bed1b1;padding:8px 17px;margin-top:22px;font-size:12px}.archive-note{border-top:1px solid var(--line);margin-top:74px;padding:33px 0 36px;display:grid;grid-template-columns:1fr 1.8fr;gap:40px}.archive-note h2{font:500 21px var(--serif);letter-spacing:.06em}.archive-note .eyebrow{margin-bottom:11px;font-size:9px}.archive-note p{font-size:11px;line-height:1.9;color:#839883}.archive-note p+p{margin-top:9px}.footer{display:flex;justify-content:space-between;padding:20px 0 34px;border-top:1px solid #222e26;font:9px var(--mono);color:#667c6b;letter-spacing:.09em;gap:20px;margin-bottom:60px}.footer a{color:#a9bd9d}.now-playing{position:fixed;bottom:18px;left:50%;transform:translateX(-50%);z-index:45;display:flex;gap:20px;align-items:center;width:min(630px,calc(100% - 32px));border:1px solid #586b4f;background:rgba(20,31,22,.97);box-shadow:0 8px 45px #0007;padding:12px 15px;backdrop-filter:blur(15px)}.now-icon{width:24px;height:24px;color:#b4cda4;display:flex;align-items:center}.now-info{min-width:0;flex:1}.now-info small{display:block;font-size:8px;letter-spacing:.12em;color:#98ad90}.now-info strong{display:block;font-size:12px;font-weight:500;color:#e0e9d8;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.now-playing button{font-size:10px;color:#b1c3a8;background:transparent;padding:8px;white-space:nowrap}.now-playing button:hover{background:#2b3b29}.now-playing .stop{border-left:1px solid #3a4b33;padding-left:16px}.lightbox{border:0;padding:0;width:min(1400px,calc(100vw - 56px));max-width:none;max-height:calc(100dvh - 44px);background:#101714;color:var(--text);box-shadow:0 30px 120px #000a;overflow:auto}.lightbox::backdrop{background:rgba(2,7,5,.94);backdrop-filter:blur(7px)}.lightbox-top{display:flex;justify-content:space-between;align-items:center;padding:13px 18px;border-bottom:1px solid #2b3b2d;gap:20px}.lightbox-top span{font:9px var(--mono);letter-spacing:.12em;color:#98ad90}.lightbox-top button{display:flex;gap:7px;align-items:center;font-size:10px;background:transparent;padding:4px;color:#b0c2a6}.lightbox-top svg{width:16px;height:16px}.lightbox-stage{background:radial-gradient(ellipse at center,#233128,#0b120f 70%);height:min(68dvh,790px);display:flex;align-items:center;justify-content:center;position:relative}.lightbox-stage img{width:100%;height:100%;object-fit:contain;padding:10px 50px}.lightbox-prev,.lightbox-next{position:absolute;top:50%;transform:translateY(-50%);z-index:1;background:#101a13dd;border:1px solid #485b41;width:32px;height:44px;color:#c0d5b2;font-size:19px}.lightbox-prev{left:12px}.lightbox-next{right:12px}.lightbox-caption{padding:18px 22px 21px;display:grid;grid-template-columns:1fr auto;gap:14px;border-top:1px solid #26372a}.lightbox-caption h2{font:500 24px var(--serif);letter-spacing:.04em}.lightbox-caption p{font-size:11px;color:#92a68e;margin-top:7px}.lightbox-caption code{display:block;font:9px/1.8 var(--mono);overflow-wrap:anywhere;color:#8ea384;margin-top:12px}.lightbox-meta{text-align:right;font:10px/1.8 var(--mono);color:#9eb391}.lightbox-meta a{display:inline-block;padding:7px 11px;border:1px solid #43583b;margin-top:10px;color:#c6d7b9;font:10px var(--sans)}.lightbox-hint{display:block;margin-top:8px;color:#667e65;font-size:9px}.no-js{color:#b2c2a8;font-size:12px;border:1px solid #425039;padding:15px;margin-top:22px}@media(min-width:1700px){.hero{padding:75px 0;gap:100px}.hero h1{font-size:76px}}@media(max-width:1100px){.wrap{width:calc(100% - 56px)}.hero{gap:40px}.hero h1{font-size:50px}.hero-intro{font-size:13px}.hero-stats{gap:27px}.portrait-grid,.card-grid{grid-template-columns:repeat(3,minmax(0,1fr))}.audio-grid{grid-template-columns:repeat(2,minmax(0,1fr))}.header-nav{gap:22px}.asset-grid{gap:17px}.image-copy{padding:13px}.asset-meta{font-size:8px}.audio-card .asset-meta{font-size:9px}}@media(max-width:760px){html{scroll-padding-top:185px}.wrap{width:calc(100% - 36px)}.masthead{height:74px}.brand{font-size:13px;gap:10px}.brand-mark{width:22px;height:22px}.brand-mark::after{inset:5px}.edition{font-size:8px;letter-spacing:.14em}.header-nav{gap:16px;font-size:10px}.header-nav a:last-child{display:none}.hero{grid-template-columns:1fr;padding:38px 0;gap:34px}.hero h1{font-size:50px;margin:19px 0 17px}.eyebrow{font-size:9px}.hero-intro{font-size:13px;max-width:390px}.hero-actions{margin-top:23px}.hero-stats{margin-top:27px;gap:38px}.hero-image{aspect-ratio:16/9}.hero-art::before{inset:-8px 12px 43px -8px}.hero-caption{font-size:10px}.hero-caption span:last-child{font-size:8px}.library-tools{padding:15px 0 12px}.tool-top{gap:12px}.library-label{font-size:11px;white-space:nowrap}.library-label small{display:none}.search{width:min(245px,58%);padding:8px 9px}.search input{font-size:11px}.filters{gap:4px;margin-top:12px;flex-wrap:nowrap;overflow-x:auto;padding-bottom:3px;scrollbar-width:thin;scrollbar-color:#40563b transparent}.filter{font-size:11px;padding:7px 10px}.results-line{font-size:10px;align-items:flex-start}.results-help{display:none}.collection{margin-top:35px;scroll-margin-top:146px}.section-heading{margin-bottom:18px;gap:15px}.section-heading h2{font-size:24px}.section-heading p{font-size:11px;line-height:1.8;max-width:310px}.section-side{display:none}.asset-grid{grid-template-columns:repeat(2,minmax(0,1fr));gap:14px}.portrait-grid,.card-grid{grid-template-columns:repeat(2,minmax(0,1fr))}.image-copy{padding:11px}.asset h3{font-size:12px}.usage{font-size:10px;min-height:34px}.asset-meta{font-size:8px;flex-wrap:wrap;gap:3px;margin-top:10px}.source{margin-top:10px;padding-top:7px;font-size:9px}.image-index{font-size:8px;left:8px;top:8px;padding:1px 4px}.expand-mark{display:none}.audio-grid{grid-template-columns:1fr}.audio-card{padding:18px}.audio-card h3{font-size:16px}.audio-card .asset-meta{flex-wrap:nowrap}.audio-usage{min-height:18px}.audio-card audio{margin-top:14px}.sound-heading{margin-top:47px;align-items:flex-start;flex-wrap:wrap;padding-top:22px}.sound-heading h2{font-size:31px}.sound-heading .sound-note{font-size:10px}.volume-control{margin-top:3px}.volume-control input{width:90px}.archive-note{grid-template-columns:1fr;gap:19px;margin-top:45px;padding:25px 0}.archive-note p{font-size:10px}.footer{font-size:8px;line-height:1.8}.footer span:first-child{max-width:210px}.lightbox{width:calc(100vw - 20px);max-height:calc(100dvh - 20px)}.lightbox-stage{height:57dvh}.lightbox-stage img{padding:8px 36px}.lightbox-prev,.lightbox-next{width:26px;height:38px}.lightbox-prev{left:5px}.lightbox-next{right:5px}.lightbox-caption{grid-template-columns:1fr;padding:15px;gap:15px}.lightbox-caption h2{font-size:22px}.lightbox-meta{text-align:left;display:flex;align-items:center;justify-content:space-between;gap:15px;font-size:9px}.lightbox-meta a{margin:0}.lightbox-hint{display:none}.now-playing{gap:11px;padding:10px 11px}.now-info strong{font-size:11px}.now-playing button{font-size:9px;padding:5px}.now-playing .stop{padding-left:10px}}@media(max-width:390px){.header-nav{gap:12px}.brand{font-size:12px}.brand-mark{display:none}.hero h1{font-size:44px}.hero-stats{gap:27px}.asset-grid{grid-template-columns:1fr}.portrait-grid,.card-grid{grid-template-columns:repeat(2,minmax(0,1fr))}.image-copy{padding:13px}.portrait .image-copy,.card .image-copy{padding:10px}.portrait .asset-meta,.card .asset-meta{font-size:7px}.card .usage{min-height:30px}.asset-grid.audio-grid{grid-template-columns:1fr}}@media(prefers-reduced-motion:reduce){html{scroll-behavior:auto}*,*::before,*::after{transition:none!important;animation:none!important}}
</style><style>
.transition-demo{display:grid;grid-template-columns:1.2fr 1fr;gap:40px;align-items:center;margin:28px 0 41px;border:1px solid #4a5d42;background:linear-gradient(110deg,#1c291d,#131c16);padding:24px 26px}.transition-demo .section-kicker{font-size:8px;letter-spacing:.17em;margin-bottom:11px;color:#93aa87}.transition-demo h3{font:500 22px/1.4 var(--serif);letter-spacing:.05em}.transition-demo h3 span{font:9px var(--mono);color:#98b08b;margin-left:15px;vertical-align:middle}.transition-demo p:not(.section-kicker){font-size:11px;line-height:1.8;margin-top:10px;color:#b2c5a8}.transition-demo p.demo-note{font-size:10px;color:#7f9878;margin-top:6px}.transition-demo audio{display:block;width:100%;height:36px}.transition-demo.is-playing{border-color:#a5c292;box-shadow:inset 3px 0 #abc696}.transition-demo .audio-error{color:#d9a998}.transition-demo+.collection{margin-top:35px}@media(max-width:760px){.transition-demo{grid-template-columns:1fr;gap:20px;padding:20px;margin:23px 0 33px}.transition-demo h3{font-size:21px}.transition-demo p:not(.section-kicker){font-size:10px}.transition-demo p.demo-note{font-size:9px}}
</style></head><body><div class="wrap">
<header class="masthead" id="top"><a class="brand" href="#top" aria-label="AGI：Final Fantasy 素材展示首页"><span class="brand-mark" aria-hidden="true"></span><span>AGI：Final Fantasy<span class="edition">VISUAL & SOUND ARCHIVE</span></span></a><nav class="header-nav" aria-label="页内导航"><a href="#background" data-jump="image">图像 / ${images.length}</a><a href="#sound-library" data-jump="audio">声音 / ${tracks.length}</a><a href="#about">关于收录</a></nav></header>
<main>
<section class="hero" aria-labelledby="hero-title"><div class="hero-copy"><p class="eyebrow">AGI：FINAL FANTASY / 素材展示</p><h1 id="hero-title">视觉与声音</h1><p class="hero-intro">从第一声问候，到最后一道绿光。<br>在这里，翻看故事的画面，聆听它的声音。</p><div class="hero-actions"><a class="primary-link" href="#background" data-jump="image">浏览图像 ${icon('arrow')}</a><a class="quiet-link" href="#sound-library" data-jump="audio">${icon('sound')}试听配乐</a></div><div class="hero-stats"><div class="stat"><strong>${String(images.length).padStart(2, '0')}</strong><span>精选图像</span></div><div class="stat"><strong>${String(tracks.length).padStart(2, '0')}</strong><span>配乐与声音</span></div><div class="stat"><strong>07</strong><span>素材分类</span></div></div></div><figure class="hero-art"><button class="hero-image" type="button" data-open="${images[0].id}" aria-label="放大查看标题场景"><img id="hero-image" alt="标题场景：夜色中的研究所" width="1920" height="1200"></button><figcaption class="hero-caption"><span><i aria-hidden="true"></i>标题场景 · 夜色中的研究所</span><span>01 / SCENE</span></figcaption></figure></section>
<div class="library-tools"><div class="tool-top"><div class="library-label">素材目录<small>THE COLLECTION</small></div><label class="search">${icon('search')}<input id="search" type="search" placeholder="搜索名称、用途或文件名" aria-label="搜索素材" autocomplete="off" spellcheck="false"></label></div><div class="filters" role="group" aria-label="按素材分类筛选"><button class="filter" type="button" data-filter="all" aria-pressed="true">全部<span class="count">${images.length + tracks.length}</span></button>${groups.map((group) => `<button class="filter" type="button" data-filter="${group.id}" aria-pressed="false">${group.name}<span class="count">${[...images, ...tracks].filter((item) => item.category === group.id).length}</span></button>`).join('')}</div></div>
<div class="results-line"><span id="result-count" aria-live="polite">共 <strong>${images.length + tracks.length}</strong> 件素材 · 图像与声音均可离线浏览</span><span class="results-help">图片支持 ← → 切换，Esc 关闭 · 同时仅播放一段声音</span></div>
<noscript><p class="no-js">请启用 JavaScript 以使用搜索、分类和图片放大。下方图片与原生音频播放器仍可使用。</p></noscript>
<div id="empty-state" class="empty-state" hidden><strong>暂未找到对应素材</strong><p>试试角色名称、场景或原始文件名。</p><button id="clear-search" type="button">清除筛选</button></div>
${groups.filter((group) => group.media === 'image').map(renderGroup).join('\n')}
<div class="sound-heading" id="sound-library"><div><p>SOUND & ATMOSPHERE</p><h2>听见故事</h2><p class="sound-note">${tracks.filter((item) => item.used).length} 件已使用 · ${tracks.filter((item) => !item.used).length} 件备用素材已单独标注</p></div><label class="volume-control">${icon('sound')}试听音量<input id="master-volume" type="range" min="0" max="1" step="0.01" value="0.7" aria-label="所有试听播放器的音量"><output id="volume-value" for="master-volume">70%</output></label></div>
${renderDemo()}
${groups.filter((group) => group.media === 'audio').map((group, i) => renderGroup(group, i + 4)).join('\n')}
<section class="archive-note" id="about" aria-labelledby="about-title"><div><p class="eyebrow">ABOUT THE COLLECTION</p><h2 id="about-title">关于收录</h2></div><div><p>本页选取游戏中的场景背景、剧情 CG、角色立绘与卡牌插画，并收录音频目录中的全部 ${tracks.length} 段声音。音频条目按当前版本的使用位置标注；没有实际触发位置的素材显示为“备用素材”。${demo ? '另附一段终局衔接试听，单独标注为演示拼接。' : ''}</p><p>点击图片可查看原图与原始路径；音频可直接播放、暂停和拖动进度。图像共 ${size(imageBytes)}，声音共 ${size(audioBytes)}。全部媒体随页面保存，无需联网。CG 与曲目名称包含剧情及结局信息。</p></div></section>
</main><footer class="footer"><span>AGI：FINAL FANTASY · 素材档案</span><a href="#top">返回顶部 ↑</a></footer></div>
<aside class="now-playing" id="now-playing" aria-label="当前试听" hidden><span class="now-icon">${icon('sound')}</span><div class="now-info"><small id="now-state">正在试听</small><strong id="now-title"></strong></div><button id="now-pause" type="button">暂停</button><button class="stop" id="now-stop" type="button">停止试听</button></aside>
<dialog class="lightbox" id="lightbox" aria-labelledby="lightbox-name"><div class="lightbox-top"><span id="lightbox-counter"></span><button id="lightbox-close" type="button" aria-label="关闭原图">关闭 ${icon('close')}</button></div><div class="lightbox-stage"><button class="lightbox-prev" id="lightbox-prev" type="button" aria-label="上一张图片">‹</button><img id="lightbox-image" alt=""><button class="lightbox-next" id="lightbox-next" type="button" aria-label="下一张图片">›</button></div><div class="lightbox-caption"><div><h2 id="lightbox-name"></h2><p id="lightbox-usage"></p><code id="lightbox-path"></code></div><div class="lightbox-meta"><div><span id="lightbox-meta"></span><span class="lightbox-hint">← → 切换 · Esc 关闭</span></div><a id="lightbox-download" download>保存原图 ↓</a></div></div></dialog>
<script type="application/json" id="gallery-manifest">${json(metadata)}</script>
<script>
(() => {
  'use strict';
  const data = JSON.parse(document.getElementById('gallery-manifest').textContent);
  const all = [...data.images, ...data.tracks];
  const byId = new Map([...all, ...(data.demo ? [data.demo] : [])].map(item => [item.id, item]));
  const cards = new Map([...document.querySelectorAll('.asset')].map(el => [el.dataset.id, el]));
  if (data.demo) cards.set(data.demo.id, document.getElementById('transition-demo'));
  const search = document.getElementById('search');
  const filterButtons = [...document.querySelectorAll('[data-filter]')];
  let category = 'all';
  let currentAudio = null;
  let lightboxItems = [];
  let lightboxIndex = 0;
  let opener = null;
  const imageSource = item => cards.get(item.id).querySelector('img').src;
  document.getElementById('hero-image').src = imageSource(data.images[0]);
  function updateFilters() {
    const query = search.value.trim().toLocaleLowerCase();
    let visible = 0;
    let visibleAudio = 0;
    const counts = new Map();
    for (const item of all) {
      const group = data.groups.find(group => group.id === item.category);
      const haystack = [item.name, item.path, item.usage || '', ...(item.locations || []), item.reservePurpose || '', group.name, item.used === false ? '备用素材' : '已使用'].join(' ').toLocaleLowerCase();
      const matches = (category === 'all' || item.category === category) && (!query || haystack.includes(query));
      cards.get(item.id).hidden = !matches;
      if (matches) { visible++; counts.set(item.category, (counts.get(item.category) || 0) + 1); if (item.id.startsWith('audio-')) visibleAudio++; }
    }
    document.querySelectorAll('[data-group]').forEach(el => {
      const count = counts.get(el.dataset.group) || 0;
      el.hidden = count === 0;
      el.querySelector('.section-count').textContent = count;
    });
    filterButtons.forEach(button => button.setAttribute('aria-pressed', String(button.dataset.filter === category)));
    const demoVisible = data.demo && (category === 'all' || category === 'cue') && (!query || ('终局 衔接 试听 演示 拼接 绿色场域 你醒了 finale transition ' + data.demo.path).toLocaleLowerCase().includes(query));
    if (data.demo) cards.get(data.demo.id).hidden = !demoVisible;
    document.getElementById('sound-library').hidden = visibleAudio === 0 && !demoVisible;
    document.getElementById('empty-state').hidden = visible !== 0 || !!demoVisible;
    const name = category === 'all' ? '全部素材' : data.groups.find(group => group.id === category).name;
    const result = document.getElementById('result-count');
    result.textContent = name + ' · ' + visible + ' 件素材' + (demoVisible ? ' · 另附 1 段衔接试听' : '') + (query ? ' · 搜索“' + search.value.trim() + '”' : ' · 可离线浏览');
  }
  filterButtons.forEach(button => button.addEventListener('click', () => { category = button.dataset.filter; updateFilters(); }));
  search.addEventListener('input', updateFilters);
  document.getElementById('clear-search').addEventListener('click', () => { category = 'all'; search.value = ''; updateFilters(); search.focus(); });
  document.querySelectorAll('[data-jump]').forEach(link => link.addEventListener('click', () => { category = 'all'; search.value = ''; updateFilters(); }));

  const dialog = document.getElementById('lightbox');
  const previous = document.getElementById('lightbox-prev');
  const next = document.getElementById('lightbox-next');
  const formatBytes = bytes => bytes >= 1048576 ? (bytes / 1048576).toFixed(2) + ' MB' : (bytes / 1024).toFixed(1) + ' KB';
  function showImage() {
    const item = lightboxItems[lightboxIndex];
    const img = document.getElementById('lightbox-image');
    img.src = imageSource(item);
    img.alt = item.name;
    document.getElementById('lightbox-name').textContent = item.name;
    document.getElementById('lightbox-usage').textContent = item.usage;
    document.getElementById('lightbox-path').textContent = item.path;
    document.getElementById('lightbox-meta').textContent = item.width + ' × ' + item.height + ' · ' + formatBytes(item.bytes);
    document.getElementById('lightbox-counter').textContent = String(lightboxIndex + 1).padStart(2, '0') + ' / ' + String(lightboxItems.length).padStart(2, '0') + ' — ' + data.groups.find(group => group.id === item.category).name;
    const download = document.getElementById('lightbox-download');
    download.href = img.src;
    download.download = item.path.split('/').pop();
    previous.disabled = lightboxItems.length < 2;
    next.disabled = lightboxItems.length < 2;
  }
  function moveImage(delta) { lightboxIndex = (lightboxIndex + delta + lightboxItems.length) % lightboxItems.length; showImage(); }
  document.querySelectorAll('[data-open]').forEach(button => button.addEventListener('click', () => {
    const item = byId.get(button.dataset.open);
    lightboxItems = data.images.filter(image => !cards.get(image.id).hidden);
    if (!lightboxItems.some(image => image.id === item.id)) lightboxItems = data.images;
    lightboxIndex = lightboxItems.findIndex(image => image.id === item.id);
    opener = button;
    showImage();
    dialog.showModal();
    document.body.style.overflow = 'hidden';
    document.getElementById('lightbox-close').focus();
  }));
  previous.addEventListener('click', () => moveImage(-1));
  next.addEventListener('click', () => moveImage(1));
  document.getElementById('lightbox-close').addEventListener('click', () => dialog.close());
  dialog.addEventListener('click', event => { if (event.target === dialog) { const box = dialog.getBoundingClientRect(); if (event.clientX < box.left || event.clientX > box.right || event.clientY < box.top || event.clientY > box.bottom) dialog.close(); } });
  dialog.addEventListener('keydown', event => { if (event.key === 'ArrowLeft') { event.preventDefault(); moveImage(-1); } if (event.key === 'ArrowRight') { event.preventDefault(); moveImage(1); } });
  dialog.addEventListener('close', () => { document.body.style.overflow = ''; document.getElementById('lightbox-image').removeAttribute('src'); document.getElementById('lightbox-download').removeAttribute('href'); if (opener) opener.focus({ preventScroll: true }); });

  const audios = [...document.querySelectorAll('audio')];
  const now = document.getElementById('now-playing');
  const nowPause = document.getElementById('now-pause');
  const volume = document.getElementById('master-volume');
  function updateNow(audio) {
    if (audio !== currentAudio) return;
    const item = byId.get(audio.id);
    document.getElementById('now-title').textContent = item.name;
    document.getElementById('now-state').textContent = audio.paused ? '试听已暂停' : '正在试听';
    nowPause.textContent = audio.paused ? '继续' : '暂停';
    now.hidden = false;
    cards.get(audio.id).classList.toggle('is-playing', !audio.paused);
  }
  audios.forEach(audio => {
    audio.volume = Number(volume.value);
    audio.addEventListener('play', () => {
      audios.forEach(other => { if (other !== audio) { other.pause(); cards.get(other.id).classList.remove('is-playing'); } });
      currentAudio = audio;
      updateNow(audio);
    });
    audio.addEventListener('pause', () => updateNow(audio));
    audio.addEventListener('ended', () => { cards.get(audio.id).classList.remove('is-playing'); if (audio === currentAudio) { now.hidden = true; currentAudio = null; } });
    audio.addEventListener('error', () => { cards.get(audio.id).querySelector('.audio-error').hidden = false; if (audio === currentAudio) now.hidden = true; });
  });
  volume.addEventListener('input', () => { audios.forEach(audio => { audio.volume = Number(volume.value); }); document.getElementById('volume-value').textContent = Math.round(Number(volume.value) * 100) + '%'; });
  nowPause.addEventListener('click', () => { if (!currentAudio) return; if (currentAudio.paused) currentAudio.play().catch(() => {}); else currentAudio.pause(); });
  document.getElementById('now-stop').addEventListener('click', () => { if (currentAudio) { currentAudio.pause(); currentAudio.currentTime = 0; cards.get(currentAudio.id).classList.remove('is-playing'); } currentAudio = null; now.hidden = true; });
  updateFilters();
})();
</script></body></html>`;

mkdirSync(dirname(output), { recursive: true });
writeFileSync(output, html);
const dataUrls = [...html.matchAll(/src="data:([^;]+);base64,([A-Za-z0-9+/=]+)"/g)];
const embeddedMedia = [...images, ...(demo ? [demo] : []), ...tracks];
if (dataUrls.length !== embeddedMedia.length) throw new Error(`Embedded media count mismatch: ${dataUrls.length}`);
for (const [index, match] of dataUrls.entries()) {
  const expected = embeddedMedia[index];
  if (Buffer.from(match[2], 'base64').length !== expected.bytes) throw new Error(`Embedded media size mismatch: ${expected.path}`);
}
console.log(`Generated ${output}`);
console.log(`${size(statSync(output).size)} · ${images.length} images · ${tracks.length} audio files (${tracks.filter((item) => item.used).length} used, ${tracks.filter((item) => !item.used).length} reserve)${demo ? ' · 1 transition demo' : ''}`);
console.log(groups.map((group) => `${group.name}: ${[...images, ...tracks].filter((item) => item.category === group.id).length}`).join(' / '));
