# AGI：Final Fantasy

CMIT 参赛作品。电脑浏览器 2D 叙事卡牌游戏，序章 + 七幕主线，目标时长 40—60 分钟。
React + TypeScript + Vite，纯静态网页，无后端、无账号、运行时不调用大模型。

## 运行

需要 Node 18+ 与 pnpm。

```bash
pnpm install
pnpm dev        # 开发：http://localhost:5173
pnpm test       # 规则、存档、流程与数值测试
pnpm build      # 产出 dist/，可部署到任意静态托管
pnpm preview    # 本地预览打包结果
```

`dist/` 使用相对路径，可直接放到静态服务器子目录。只验收电脑浏览器（1920×1080 设计，1366×768 可用）。

离线分享版与素材展示页：

```bash
pnpm pack:share                    # release/AGI-Final-Fantasy.html
node scripts/build-asset-gallery.mjs  # release/AGI-Final-Fantasy-素材展示.html
```

素材展示页内嵌图片与音频，可直接双击打开，支持分类、搜索、原图放大、音乐播放和拖动进度。

## 结构

| 路径 | 内容 |
|---|---|
| `src/engine/` | 纯函数规则：战斗、地图回溯、终局；与界面解耦，可测试 |
| `src/state/` | 七幕流程 `flow.ts`、存档与结算 `game.ts` |
| `src/data/` | 卡牌、敌人、地图、剧本、监管/调查/审查/证据/谈判数据、科普贴士 |
| `src/components/` | 各玩法界面 |
| `src/audio.ts` | WebAudio 播放 T06 配乐与音效，读取 `public/audio/` 或分享版内嵌音频 |
| `docs/design/` | 原始策划文档 |

改剧情只需编辑 `src/data/story/*.ts`；改数值编辑 `src/data/cards.ts`、`enemies.ts`、`maps.ts`，然后跑 `pnpm test` 确认平衡测试仍通过。

## 提交前待办

- 图片素材位于 `src/assets/`；新增问源与自动片尾的来源和接入说明见 `docs/assets-sources/问源与片尾更新-2026-10-21.md`。
- 片尾 `src/components/Credits.tsx` 中的现实报道与链接须逐条人工核验。
- 真人试玩，记录实际时长与卡点。
