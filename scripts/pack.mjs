// 生成可双击打开的单文件分享版：把 dist/ 中的 JS、CSS、图片、音频全部内嵌进一个 HTML。
// 用法：pnpm pack:share  →  release/AGI-Final-Fantasy.html
import { readFileSync, writeFileSync, readdirSync, mkdirSync, existsSync } from 'node:fs';
import { join, extname, basename } from 'node:path';

const dist = 'dist';
const MIME = { '.webp': 'image/webp', '.png': 'image/png', '.svg': 'image/svg+xml', '.ogg': 'audio/ogg', '.jpg': 'image/jpeg' };
const dataUrl = (file) => `data:${MIME[extname(file)]};base64,${readFileSync(file).toString('base64')}`;

let html = readFileSync(join(dist, 'index.html'), 'utf8');
const assets = readdirSync(join(dist, 'assets'));
const media = assets.filter((f) => MIME[extname(f)]);

// 把 JS/CSS 中引用的图片文件名替换为 data URL
const inlineMedia = (code) => {
  for (const f of media) {
    const uri = dataUrl(join(dist, 'assets', f));
    code = code.split(`./assets/${f}`).join(uri).split(`./${f}`).join(uri).split(`/assets/${f}`).join(uri).split(`"${f}"`).join(`"${uri}"`).split(`(${f})`).join(`(${uri})`);
  }
  return code;
};

const css = assets.filter((f) => f.endsWith('.css')).map((f) => inlineMedia(readFileSync(join(dist, 'assets', f), 'utf8'))).join('\n');
const js = assets.filter((f) => f.endsWith('.js')).map((f) => inlineMedia(readFileSync(join(dist, 'assets', f), 'utf8'))).join('\n');

// 音频映射
const audioDir = join(dist, 'audio');
const audio = {};
if (existsSync(audioDir)) for (const f of readdirSync(audioDir)) if (f.endsWith('.ogg')) audio[basename(f, '.ogg')] = dataUrl(join(audioDir, f));

html = html
  .replace(/<link rel="stylesheet"[^>]*>/g, '')
  .replace(/<script type="module"[^>]*><\/script>/g, '')
  // 用函数作为替换值：避免 JS 代码里的 $& / $` 被当成替换模式
  .replace('</head>', () => `<style>${css}</style>\n<script>window.__AUDIO__=${JSON.stringify(audio)};</script>\n</head>`)
  .replace('</body>', () => `<script type="module">${js.replace(/<\/script/gi, '<\\/script')}</script>\n</body>`);

mkdirSync('release', { recursive: true });
const out = join('release', 'AGI-Final-Fantasy.html');
writeFileSync(out, html);
const left = media.filter((f) => html.includes(f));
console.log(`${out}  ${(Buffer.byteLength(html) / 1048576).toFixed(1)} MB, images ${media.length}, audio ${Object.keys(audio).length}${left.length ? ', UNRESOLVED: ' + left.join(',') : ''}`);
