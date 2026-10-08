# ZhilvTravel

文数智旅官网的可部署源码与三支首页视频的可编辑 Remotion 工程。本仓库以已发布的网站 **v41** 为起点，只保留构建与维护所需的源码、当前网站素材、视频源素材；不包含依赖目录、审片缓存、用户附件或历史工作草稿。

## 下载后构建网站

需要 Node.js（本快照使用 Node.js 22 验证）。网站构建脚本没有第三方 npm 依赖：

```bash
git clone https://github.com/WHaoxM/ZhilvTravel.git
cd ZhilvTravel
npm run build
npm run validate
```

`dist/` 是可直接上传的静态站点目录，含中文首页、英文首页、子页、图片、封面与三支正式 MP4。将 `dist/` 作为静态站点根目录部署即可。若用 Sites 更新原站点，保留 `.openai/hosting.json` 中的项目 ID，并通过有权限的 Sites 发布流程提交本仓库的同一来源版本；仅推送 GitHub **不会自动更新线上站点**。

`npm run validate` 不需要安装额外依赖。`test:home-responsive`、`test:social` 等浏览器回归脚本是可选开发测试，运行时还需可用的 Playwright 和 Chromium；相应媒体清单保存在 `assets/generated/*/manifest.json`，不会进入部署目录。

联系表单依赖外部接收接口。默认构建面向现有 `xuntingtravel.com` 接口；部署到其他业务环境前，可复制 `lead.config.example.json` 为本地 `lead.config.json` 并配置自己的接收端。不要将真实密钥或 `lead.config.json` 提交到公开仓库。

## 视频工程

`remotion-studio/` 保留 `TourismAIEngine`、`ReceptionHiFi`、`PlanHiFi` 的源码与必要静帧素材。网站正式播放的成片位于 `assets/video/`；同目录下未被网页引用的三支原片仅供复用原始音轨和对照，不会进入 `dist/`。

现版三支视频的分镜、关键帧、可选 AE 表达式对照和发布检查清单见 [`remotion-studio/docs/video-shots-and-qc.md`](remotion-studio/docs/video-shots-and-qc.md)。两支长片的主要可读区域、焦点字幕及中央演示区已由代码绘制，但接待片的部分推荐方案卡和非焦点背景仍有原片静帧；不能将其视为所有 UI 文字均已矢量化。当前交付是 Remotion 工程，不包含 `.aep` 文件。

```bash
cd remotion-studio
npm ci
npm run typecheck
npm run studio
```

视频工程生成新片后，需要重新导出 MP4、更新首页的 `data-src`、封面与放大观看链接，再执行网站构建和校验。两支长片沿用原片的日本亲子游演示数据；这不代表中国入境游专项案例。

## 来源与范围

- 网站基线：Sites v41，来源提交 `0301ad4e0febc09805a7cf4066c7e2561802d57c`。
- 公开仓库采用新的精选初始提交，**不公开旧工作仓库的提交历史**。
- 三支当前网站视频均使用版本化文件名，原视频只作为可编辑工程的素材依赖保留。
- 外部商标、截图和影像仍受各自权利人的使用条件约束；公开源码不额外授予这些素材的使用许可。
