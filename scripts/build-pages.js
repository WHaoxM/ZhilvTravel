/* ============================================================
   文数智旅 · 子页面生成器（第一批 6 页）
   从 index.html 抽取共享片段（CSS / 导航 / 页脚 / 悬浮件 / 模态窗 / 共享JS），
   套用知衣子页四段式骨架（banner → 痛点 → 核心功能 → 案例）生成 pages/*.html。
   静态站，无构建依赖：node scripts/build-pages.js
   ============================================================ */
const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const INDEX = path.join(ROOT, "index.html");
const OUT_DIR = path.join(ROOT, "pages");
const src = fs.readFileSync(INDEX, "utf8");
const lines = src.split(/\r?\n/);

/* ---------- 1. 抽取共享片段 ---------- */
function slice(startMarker, endMarker, label) {
  const s = src.indexOf(startMarker);
  if (s < 0) throw new Error("marker not found: " + label);
  const e = src.indexOf(endMarker, s);
  if (e < 0) throw new Error("end marker not found: " + label);
  return src.slice(s, e);
}

/* CSS：整段 <style>…</style>（含子页要用的全部 token/组件） */
const cssBlock = slice("<style>", "</style>", "css");

/* 导航 */
const navBlock = slice(
  '<!-- ================= 导航',
  "</header>",
  "nav"
) + "\n</header>";

/* 页脚 + 悬浮工具栏 + AI 顾问 + 留资/微信模态窗（footer 注释 到 <script> 前） */
const footerBlock = slice(
  "<!-- ================= Footer =================",
  "<script>",
  "footer"
);

/* 共享 JS：导航滚动态 / reveal / 模态窗 / 留资 / 微信 / AI 顾问 */
const jsNavReveal = slice(
  "/* ---------- 导航滚动态 + 回到顶部按钮 ----------",
  "/* ---------- 滚动墙",
  "js-nav"
);
const jsShared = slice(
  "/* ---------- 模态窗通用逻辑 ----------",
  "/* ---------- 主表单（S8） ----------",
  "js-modal"
);
const jsChat = slice(
  "/* ---------- AI 顾问气泡 ----------",
  "/* 5 秒后自动弹出欢迎",
  "js-chat"
);
const jsChatAuto = slice(
  "/* 5 秒后自动弹出欢迎",
  "})();",
  "js-chat-auto"
);

/* ---------- 2. 路径前缀处理（子页在 pages/ 下，资源需 ../ ） ---------- */
function rebase(html) {
  return html
    .replace(/(data-src|src|href|poster)="assets\//g, '$1="../assets/')
    .replace(/href="en\/index\.html"/g, 'href="../en/index.html"')  /* 语言切换 → 英文首页（兜底） */
    .replace(/href="privacy\.html"/g, 'href="../privacy.html"')       /* 子页隐私政策链接 → 根目录 */
    .replace(/href="#"/g, 'href="../index.html"')           /* 品牌 logo 回首页 */
    .replace(/href="#(solution|cases|metrics|agent|trust|coop|engine|policy-evidence)"/g, 'href="../index.html#$1"');
}

/* 语言切换同页对映：中文子页 x.html 的 EN → ../en/pages/x.en.html */
function langSwitchForSubpage(html, zhFile) {
  const enName = zhFile.replace(/\.html$/, ".en.html");
  return html.replace(
    /<b>中<\/b>\s*\/\s*<a href="\.\.\/en\/index\.html"[^>]*>EN<\/a>/,
    `<b>中</b> / <a href="../en/pages/${enName}" style="color:inherit">EN</a>`
  );
}

/* 子页导航链接：index.html 中的 pages/x.html 链接在子页语境下去掉 pages/ 前缀 */
function navForSubpage(html) {
  return html
    .replace(/ onclick="window\.scrollTo\(\{top:0,behavior:'smooth'\}\);return false"/g, '') /* 子页首页必须真实导航，不能拦截点击 */
    .split('href="pages/').join('href="')                       /* 已是真实子页链接 → 同目录相对 */
    .split('href="../index.html#cases"').join('href="cases.html"') /* 页脚/兜底锚点 → 案例列表页 */
    .replace(/<a class="prod-item" href="#engine">/,
             '<a class="prod-item" href="product-wenxiaolv.html">');
}

/* ---------- 3. 知衣四段式骨架 CSS（子页新增，1:1 复用知衣 solution-pinpai 尺寸） ---------- */
const SUBPAGE_CSS = `
/* ============================================================
   子页 · 知衣四段式骨架（banner → 痛点 → 核心功能 → 案例）
   尺寸 1:1 对齐 solution-pinpai.html：banner 480px 高 / part1 三卡 394×220 /
   solution-item 1216×r32 / case-box 1216 宽
   ============================================================ */
body.subpage{padding-top:0}
/* 子页面导航明确显示当前板块，首页链接仍保持可点击。 */
.nav-links .is-current{color:var(--primary)!important;border-bottom:3px solid var(--primary);padding-bottom:8px;font-weight:700}
.sp-banner{
  position:relative;margin-top:80px;min-height:480px;
  display:flex;flex-direction:column;justify-content:center;align-items:center;
  text-align:center;color:#fff;overflow:hidden;
  background:linear-gradient(135deg,#16224d 0%,#0b1029 60%,#123a7a 100%);
  background-size:cover;background-position:center;
}
/* banner 背景图模式（知衣原版为真实摄影头图 background-image cover）：
   有图时以图打底 + 深蓝遮罩保证文字可读；无图时退回渐变 + 光晕 */
.sp-banner.has-bg{background-color:#0b1029}
.sp-banner.has-bg::before{
  content:"";position:absolute;inset:0;
  background:linear-gradient(180deg,rgba(11,16,41,.55) 0%,rgba(11,16,41,.42) 45%,rgba(11,16,41,.68) 100%);
}
.sp-banner:not(.has-bg)::before{
  content:"";position:absolute;inset:0;
  background:radial-gradient(60% 90% at 20% 15%,rgba(0,97,255,.35),transparent 60%),
             radial-gradient(50% 80% at 85% 80%,rgba(0,180,255,.22),transparent 60%);
}
.sp-banner>.sp-banner-in{position:relative;z-index:1;padding:64px 24px;max-width:960px}
.sp-banner .eyebrow-w{
  display:inline-block;font-size:14px;font-weight:600;letter-spacing:.14em;
  color:#9ec5ff;text-transform:uppercase;margin-bottom:20px;
}
.sp-banner h1.title{
  margin:0;font-weight:600;font-size:44px;line-height:60px;color:#fff;
}
.sp-banner .tip{
  margin-top:16px;font-weight:400;font-size:20px;line-height:32px;color:#c9d6f2;
}
.sp-banner .link-btn{
  margin-top:36px;display:inline-flex;align-items:center;gap:10px;
  height:56px;padding:0 36px;border-radius:28px;cursor:pointer;border:none;
  background:linear-gradient(135deg,#0005ff 0%,#00ccff 100%);
  color:#fff;font-size:18px;font-weight:600;font-family:inherit;
  box-shadow:0 12px 32px -6px rgba(0,97,255,.55);
  transition:transform var(--t-fast) var(--ease-out-quart),box-shadow var(--t-fast);
}
.sp-banner .link-btn:hover{transform:translateY(-2px);box-shadow:0 18px 40px -6px rgba(0,97,255,.65)}
.sp-banner .link-btn .arr{transition:transform var(--t-fast)}
.sp-banner .link-btn:hover .arr{transform:translateX(4px)}

.sp-content{width:min(1216px,100% - 48px);margin:0 auto}
.sp-content-title{
  margin:104px 0 0;font-weight:600;font-size:36px;line-height:60px;
  color:var(--ink);text-align:center;
}
.sp-content-title-tip{
  margin-top:16px;font-weight:400;font-size:20px;color:var(--ink-2);
  text-align:center;line-height:32px;max-width:880px;margin-left:auto;margin-right:auto;
}

/* ② 痛点三卡（知衣 part1 info-item：394×220 圆角24 + 24px 标题） */
.sp-part1{margin:64px auto 0;display:flex;justify-content:center;align-items:stretch;gap:16px}
.sp-part1 .info-item{
  flex:1 1 0;background:var(--surface);border-radius:24px;overflow:hidden;
  box-shadow:var(--shadow-md);display:flex;flex-direction:column;
  transition:transform var(--t-med) var(--ease-out-quart),box-shadow var(--t-med);
}
.sp-part1 .info-item:hover{transform:translateY(-6px);box-shadow:var(--shadow-lg)}
.sp-part1 .info-item .ii-img{
  width:100%;height:220px;display:flex;align-items:center;justify-content:center;
  background:linear-gradient(135deg,var(--c1,#5E75CF) 0%,var(--c2,#274c59) 100%);
  color:#fff;
}
.sp-part1 .info-item .ii-img svg{width:56px;height:56px;opacity:.95}
.sp-part1 .info-item .ii-img img{width:100%;height:100%;object-fit:cover}
.sp-part1 .info-item .tip{
  font-weight:600;font-size:20px;color:var(--ink);line-height:32px;
  margin:24px 24px 8px;
}
.sp-part1 .info-item .desc{
  font-weight:400;font-size:15px;color:var(--muted);line-height:26px;
  margin:0 24px 24px;
}

/* ③ 核心功能（知衣 solution-item：1216 宽 r32 卡片，头图 1120×606） */
.sp-solution-box{
  margin-top:64px;display:flex;flex-direction:column;gap:48px;
}
.sp-solution-item{
  background:var(--surface);border-radius:32px;padding:48px 56px;
  box-shadow:var(--shadow-md);
}
.sp-solution-item .sp-solution-head{display:flex;justify-content:space-between;align-items:flex-start;gap:32px}
.sp-solution-item .left .title{margin:0;font-weight:600;font-size:28px;color:var(--ink);line-height:44px}
.sp-solution-item .left .tip{margin-top:12px;font-weight:400;font-size:18px;color:var(--ink-2);line-height:32px;max-width:760px}
.sp-solution-item .right{flex-shrink:0;width:72px;height:72px;border-radius:20px;
  display:flex;align-items:center;justify-content:center;color:#fff;
  background:linear-gradient(135deg,#0061ff,#00b4ff)}
.sp-solution-item .right svg{width:36px;height:36px}
.sp-solution-item .info-box{margin-top:28px;display:flex;gap:16px;flex-wrap:wrap}
.sp-solution-item .info-box .info-item{
  flex:1 1 180px;display:flex;align-items:center;justify-content:center;text-align:center;
  background:var(--bg);border:2px solid var(--primary);border-radius:16px;
  font-weight:400;font-size:16px;color:var(--ink);line-height:26px;padding:16px 20px;
}
.sp-solution-item>img.sp-feat-img{
  width:100%;height:auto;aspect-ratio:1120/540;object-fit:cover;
  border-radius:20px;margin-top:36px;background:var(--bg-soft);
}
.sp-solution-item .sp-feat-mock{
  margin-top:36px;border-radius:20px;overflow:hidden;background:var(--bg-soft);
  border:1px solid var(--line-2);
}
.sp-solution-item .sp-feat-mock img{width:100%;height:auto;display:block}
.sp-feat-mock--order img{max-width:900px;margin:0 auto}
/* 核心功能演示：实际工作台图保持可读尺寸，右侧可切换流程与模板。 */
.sp-feature-gallery{margin-top:36px;display:grid;grid-template-columns:minmax(0,1.65fr) minmax(240px,.75fr);gap:22px;padding:18px;border:1px solid var(--line-2);border-radius:24px;background:#f4f7ff}
.sp-gallery-stage{min-width:0;aspect-ratio:16/9;overflow:hidden;border:1px solid var(--line-2);border-radius:17px;background:#fff;display:grid;place-items:center}
.sp-gallery-pane{position:relative;width:100%;height:100%;margin:0;display:grid;place-items:center}
.sp-gallery-pane[hidden]{display:none}
.sp-gallery-pane img{display:block;max-width:100%;max-height:100%;width:100%;height:100%;object-fit:contain}
.sp-gallery-open{position:absolute;right:12px;bottom:12px;display:inline-flex;align-items:center;min-height:32px;padding:4px 10px;border:1px solid #d8e2f4;border-radius:999px;background:rgba(255,255,255,.95);font-size:12px;font-weight:700;color:var(--primary);box-shadow:0 4px 12px rgba(11,16,41,.1)}
.sp-gallery-open:focus-visible{outline:3px solid rgba(0,97,255,.3);outline-offset:2px}
.sp-gallery-options{display:flex;flex-direction:column;gap:10px;min-width:0}
.sp-gallery-option{width:100%;min-height:78px;text-align:left;border:1px solid #d8e2f4;border-radius:15px;background:#fff;padding:13px 16px;cursor:pointer;font:inherit;color:var(--ink);transition:border-color .2s,background .2s,transform .2s}
.sp-gallery-option:hover{transform:translateX(2px);border-color:var(--primary)}
.sp-gallery-option[aria-selected="true"]{border-color:var(--primary);background:#e9f1ff;box-shadow:inset 3px 0 0 var(--primary)}
.sp-gallery-option b{display:block;font-size:15px;line-height:21px}
.sp-gallery-option span{display:block;margin-top:5px;font-size:12px;line-height:18px;color:var(--muted)}
.sp-gallery-option:focus-visible{outline:3px solid rgba(0,97,255,.3);outline-offset:2px}
.sp-gallery-source{margin:4px 0 0;font-size:11px;line-height:17px;color:var(--muted)}
.sp-gallery-source a{color:var(--primary);text-decoration:underline}
.sp-feature-gallery.social-evidence{background:#eaf0fb;border-color:#cad8ec}
.social-evidence .sp-gallery-stage{aspect-ratio:auto;min-height:620px;background:radial-gradient(circle at 50% 22%,#f8fbff 0,#e7f0fc 58%,#dbe8f8 100%)}
.social-evidence .sp-gallery-pane{padding:20px}
.social-evidence .sp-gallery-pane img{width:auto;height:auto;max-width:100%;max-height:580px;filter:drop-shadow(0 14px 20px rgba(13,39,79,.14))}
.social-evidence .sp-gallery-option{min-height:92px}
.social-evidence .sp-gallery-open{right:26px;bottom:26px}
.social-proof-intro{max-width:800px;margin:12px auto 0;text-align:center;color:var(--ink-2);line-height:1.8}
.social-use-list{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:24px;margin:56px auto 104px}
.social-use-card{min-width:0;overflow:hidden;border:1px solid #dce5f2;border-radius:22px;background:#fff;box-shadow:var(--shadow-md)}
.social-use-media{height:340px;display:flex;justify-content:center;gap:12px;padding:18px;background:radial-gradient(circle at 50% 30%,#f9fcff,#e7effb 70%);overflow:hidden}
.social-use-media a{min-width:0;flex:1;display:grid;place-items:center;border-radius:12px;outline-offset:3px}
.social-use-media a:focus-visible{outline:3px solid var(--primary)}
.social-use-media img{display:block;max-width:100%;max-height:100%;width:auto;height:auto;object-fit:contain;box-shadow:0 8px 18px rgba(18,43,88,.12)}
.social-use-copy{padding:22px 26px 26px}
.social-use-copy h3{margin:0 0 8px;color:var(--ink);font-size:23px;line-height:1.35}
.social-use-copy p{margin:0;color:var(--ink-2);font-size:15px;line-height:1.75}
.social-use-label{display:block;margin-bottom:9px;color:var(--primary);font-size:11px;font-weight:700;letter-spacing:.12em;text-transform:uppercase}
.social-flow{height:340px;padding:22px;background:linear-gradient(140deg,#0e1c3a,#152e59);color:#eaf3ff;display:flex;flex-direction:column;justify-content:center;gap:12px}
.social-flow-head{display:flex;justify-content:space-between;gap:10px;font-size:12px;color:#9dc5ff}
.social-flow-steps{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px}
.social-flow-step{border:1px solid rgba(130,185,255,.3);border-radius:12px;background:rgba(255,255,255,.07);padding:14px 10px;font-size:13px;line-height:1.5}
.social-flow-step b{display:block;margin-bottom:7px;color:#69c6ff;font-size:18px}
.social-email-preview{border:1px solid rgba(130,185,255,.28);border-radius:10px;background:rgba(255,255,255,.94);padding:10px 13px;color:#183053;font-size:11px;line-height:1.4}
.social-email-preview span{display:block;color:#1972d4;font-size:9px;font-weight:800;letter-spacing:.08em;text-transform:uppercase}
.social-email-preview strong{display:block;margin:3px 0;font-size:12px}
.social-email-preview p{margin:0}
.social-flow-note{font-size:11px;color:#b6cae7}
.social-reel{margin:74px auto 24px}
.social-reel-head{display:flex;align-items:flex-end;justify-content:space-between;gap:24px;margin-bottom:20px}
.social-reel-head h2{margin:0;color:var(--ink);font-size:30px;line-height:1.3}
.social-reel-head p{max-width:730px;margin:9px 0 0;color:var(--ink-2);font-size:14px;line-height:1.7}
.social-reel-controls{display:flex;gap:8px;flex:none}
.social-reel-controls button{width:42px;height:42px;border:1px solid #b7c9e5;border-radius:50%;background:#fff;color:#075ccf;font:inherit;font-size:21px;cursor:pointer}
.social-reel-controls button:hover,.social-reel-controls button:focus-visible{background:#e6f0ff;outline:2px solid #79a9ef;outline-offset:2px}
.social-reel-track{display:flex;gap:16px;overflow-x:auto;scroll-snap-type:x mandatory;scrollbar-width:thin;scroll-padding:0 6px;padding:8px 4px 18px}
.social-reel-card{flex:0 0 clamp(240px,27%,316px);min-width:0;scroll-snap-align:start;overflow:hidden;border:1px solid #dbe6f3;border-radius:20px;background:#fff;box-shadow:0 12px 30px rgba(22,53,99,.08)}
.social-reel-card>a{display:block;position:relative;height:390px;overflow:hidden;background:linear-gradient(145deg,#eaf2fd,#dfeafa)}
.social-reel-card>a:focus-visible{outline:3px solid var(--primary);outline-offset:-4px}
.social-reel-card img{display:block;position:absolute;inset:10px;width:calc(100% - 20px);height:calc(100% - 20px);object-fit:contain}
.social-reel-card figcaption{padding:14px 17px 17px;font-size:14px;font-weight:700;color:var(--ink);line-height:1.4}
.social-reel-card figcaption span{display:block;margin-top:4px;font-size:11px;font-weight:400;color:var(--muted)}
.creator-outreach{display:grid;grid-template-columns:minmax(0,.95fr) minmax(0,1.05fr);gap:28px;align-items:stretch;margin:32px auto 0;overflow:hidden;border:1px solid #dbe6f3;border-radius:24px;background:#fff;box-shadow:var(--shadow-md)}
.creator-outreach>img{width:100%;height:100%;min-height:340px;object-fit:cover}
.creator-outreach-copy{padding:34px 38px}
.creator-outreach-copy .eyebrow{font-size:11px;font-weight:800;letter-spacing:.12em;color:var(--primary)}
.creator-outreach-copy h2{margin:10px 0 12px;font-size:28px;color:var(--ink)}
.creator-outreach-copy p{margin:0 0 15px;color:var(--ink-2);font-size:15px;line-height:1.7}
.creator-outreach-copy details{border-top:1px solid #dbe6f3;padding-top:14px}
.creator-outreach-copy summary{cursor:pointer;color:var(--primary);font-weight:700}
.creator-outreach-copy pre{white-space:pre-wrap;overflow-wrap:anywhere;margin:14px 0 0;padding:18px;border-radius:12px;background:#f3f7ff;color:#243858;font:13px/1.65 Arial,sans-serif}
.creator-outreach-copy button{margin-top:12px;padding:9px 14px;border:1px solid #8eb8f4;border-radius:9px;background:#eef6ff;color:#075ccf;font:inherit;font-size:13px;font-weight:700;cursor:pointer}
.creator-outreach-copy button:focus-visible{outline:3px solid #8eb8f4;outline-offset:2px}
.creator-outreach-copy small{display:block;margin-top:10px;color:var(--muted);line-height:1.5}
@media (max-width:900px){.sp-feature-gallery{grid-template-columns:1fr}.sp-gallery-options{display:grid;grid-template-columns:repeat(2,minmax(0,1fr))}.sp-gallery-source{grid-column:1/-1}}
@media (max-width:560px){.sp-gallery-options{grid-template-columns:1fr}.sp-gallery-stage{aspect-ratio:16/10}}
@media (max-width:900px){.social-use-list{grid-template-columns:1fr}.social-evidence .sp-gallery-stage{min-height:550px}}
@media (max-width:560px){.social-evidence .sp-gallery-stage{aspect-ratio:auto;min-height:480px}.social-evidence .sp-gallery-pane{padding:10px}.social-evidence .sp-gallery-pane img{max-height:450px}.social-use-media{height:320px;justify-content:flex-start;overflow-x:auto;scroll-snap-type:x mandatory}.social-use-media a{flex:0 0 76%;scroll-snap-align:center}.social-flow{height:auto;min-height:300px}.social-flow-steps{gap:6px}.social-flow-step{padding:10px 6px;font-size:11px}.social-use-copy{padding:20px}}
@media (max-width:900px){.creator-outreach{grid-template-columns:1fr}.creator-outreach>img{max-height:330px;min-height:0}.social-reel-card{flex-basis:clamp(240px,42%,316px)}}
@media (max-width:560px){.social-reel-head{align-items:flex-start}.social-reel-head h2{font-size:24px}.social-reel-card{flex-basis:min(78vw,310px)}.social-reel-card>a{height:410px}.creator-outreach-copy{padding:24px}.creator-outreach-copy h2{font-size:24px}}

/* ============================================================
   technology 版式（1:1 对齐知衣 technology-img/search）：
   ① banner 596px 高、浅色底、左对齐标题（title margin-left 349px 构图，我们 1216 容器内左对齐）
   ② demo 演示区（知衣 demo-content：1080px 高演示图 + 可点击标注 → 弹出结果卡）
   ③ 技术优势 advantage（#f5f5f7 底、90px 图标居中横排卡）
   ④ 应用场景 application（588×331 背景图卡、标题浮于图上居中、白字）
   ============================================================ */
.tech-banner{
  position:relative;margin-top:80px;height:596px;
  display:flex;align-items:center;overflow:hidden;
  background:linear-gradient(115deg,#eef3ff 0%,#f7faff 50%,#e3eeff 100%);
  background-size:cover;background-position:center right;
}
.tech-banner::before{
  content:"";position:absolute;inset:0;
  background:linear-gradient(90deg,rgba(245,248,255,.92) 0%,rgba(245,248,255,.55) 45%,rgba(245,248,255,.05) 75%);
}
.tech-banner>.tech-banner-in{
  position:relative;z-index:1;width:min(1216px,100% - 48px);margin:0 auto;
}
.tech-banner .tech-eyebrow{
  display:inline-block;font-size:14px;font-weight:600;letter-spacing:.14em;
  color:var(--primary);text-transform:uppercase;margin-bottom:16px;
}
.tech-banner h1.tech-title{
  margin:0;font-weight:600;font-size:44px;line-height:60px;color:var(--ink);max-width:560px;
}
.tech-banner .tech-sub{
  margin-top:24px;max-width:580px;font-size:16px;line-height:28px;color:#333d52;
}
.tech-banner .tech-cta{
  margin-top:36px;display:inline-flex;align-items:center;gap:10px;
  width:240px;height:60px;justify-content:center;border-radius:30px;cursor:pointer;border:none;
  background:linear-gradient(135deg,#0005ff 0%,#00ccff 100%);
  color:#fff;font-size:18px;font-weight:600;font-family:inherit;
  box-shadow:0 12px 32px -6px rgba(0,97,255,.45);
  transition:transform var(--t-fast) var(--ease-out-quart);
}
.tech-banner .tech-cta:hover{transform:translateY(-2px)}

/* demo 演示区：知衣 demo-content（1200 宽 1080 高演示画布 + 标注点点击弹出结果卡）
   我们做轻量版：左演示图 + 右说明卡（点击标注点切换说明） */
.tech-demo{
  margin:96px auto 0;width:min(1200px,100%);
  background:var(--surface);border-radius:24px;box-shadow:var(--shadow-lg);
  padding:24px;display:flex;gap:24px;align-items:stretch;
}
.tech-demo-stage{
  position:relative;flex:1 1 0;border-radius:16px;overflow:hidden;min-height:420px;
  background:var(--bg-soft);
}
.tech-demo-stage>img{width:100%;height:100%;object-fit:cover;position:absolute;inset:0}
.demo-mark{
  position:absolute;width:36px;height:36px;border-radius:50%;cursor:pointer;
  background:rgba(0,97,255,.28);border:2px solid #70ffe9;
  display:flex;align-items:center;justify-content:center;
  transition:transform var(--t-fast);
}
.demo-mark::after{
  content:"";width:12px;height:12px;border-radius:50%;background:#70ffe9;
}
.demo-mark:hover,.demo-mark:focus-visible{transform:scale(1.12);outline:3px solid rgba(0,97,255,.28);outline-offset:3px}
.demo-mark.active{border-color:#e48fef}
.demo-mark.active::after{background:#e48fef}
.demo-tip{
  position:absolute;transform:translate(-50%,calc(-100% - 14px));
  min-width:112px;padding:0 16px;height:44px;line-height:44px;text-align:center;
  background:rgba(112,255,233,.85);color:#2a2b2e;font-size:16px;font-weight:600;
  border-radius:8px;white-space:nowrap;pointer-events:none;
  opacity:0;transition:opacity var(--t-fast);
}
.demo-mark.active .demo-tip{opacity:1}
.tech-demo-side{
  flex:none;width:340px;display:flex;flex-direction:column;justify-content:center;padding:8px 8px 8px 0;
}
.tech-demo-side .tds-title{font-size:22px;font-weight:600;line-height:32px;color:var(--ink)}
.tech-demo-side .tds-desc{margin-top:12px;font-size:15px;line-height:26px;color:var(--muted)}
.tech-demo-side .tds-tags{margin-top:16px;display:flex;gap:8px;flex-wrap:wrap}
.tech-demo-side .tds-tags span{
  font-size:12px;font-weight:600;color:var(--primary);background:var(--primary-100);
  padding:3px 10px;border-radius:999px;
}

/* 技术优势：知衣 advantage（860px 高 #f5f5f7 底、90px 图标居中横排、均分 1200 宽） */
.tech-advantage{
  margin-top:104px;background:#f5f5f7;padding:96px 0 90px;
}
.tech-advantage .tech-section-title{margin-top:0}
.tech-adv-list{
  margin:64px auto 0;width:min(1200px,100%);
  display:flex;align-items:flex-start;justify-content:space-between;gap:24px;
}
.tech-adv-item{
  flex:1 1 0;max-width:260px;text-align:center;
  display:flex;flex-direction:column;align-items:center;
}
.tech-adv-icon{
  width:90px;height:90px;border-radius:24px;display:flex;align-items:center;justify-content:center;
  background:#fff;color:var(--primary);
  box-shadow:0 0 40px 0 #dce2fa;
}
.tech-adv-icon svg{width:44px;height:44px}
.tech-adv-title{margin-top:24px;margin-bottom:8px;font-size:18px;font-weight:600;line-height:26px;color:#262626}
.tech-adv-sub{font-size:14px;line-height:22px;color:#5f6064;min-height:50px}

/* 应用场景：知衣 application（588×331 背景图卡、标题浮图上居中、白字、flex wrap 双列） */
.tech-scene-list{
  margin:56px auto 104px;display:flex;flex-wrap:wrap;justify-content:space-between;gap:0;
}
.tech-scene-item{
  position:relative;width:calc(50% - 12px);height:331px;margin-bottom:24px;
  border-radius:16px;overflow:hidden;text-align:center;cursor:pointer;
  box-shadow:var(--shadow-md);transition:transform var(--t-med) var(--ease-out-quart),box-shadow var(--t-med);
}
.tech-scene-item:hover{transform:translateY(-4px);box-shadow:var(--shadow-lg)}
.tech-scene-item .ts-bg{
  position:absolute;inset:0;background-size:cover;background-position:center;
  transition:transform var(--t-slow) var(--ease-out-quart);
}
.tech-scene-item:hover .ts-bg{transform:scale(1.05)}
.tech-scene-item::after{
  content:"";position:absolute;inset:0;
  background:linear-gradient(180deg,rgba(11,16,41,.18) 0%,rgba(11,16,41,.52) 100%);
}
.tech-scene-item .ts-body{
  position:absolute;inset:0;z-index:1;display:flex;flex-direction:column;
  align-items:center;justify-content:center;padding:24px;color:#fff;
}
.tech-scene-item .ts-title{margin:0;font-size:24px;font-weight:500;line-height:36px;color:#fff}
.tech-scene-item .ts-desc{
  margin-top:10px;font-size:14px;line-height:24px;color:rgba(255,255,255,.88);
  max-width:420px;opacity:0;transform:translateY(8px);
  transition:opacity var(--t-med),transform var(--t-med);
}
.tech-scene-item:hover .ts-desc{opacity:1;transform:translateY(0)}
@media (max-width:900px){
  .tech-banner{height:auto;padding:64px 0}
  .tech-banner h1.tech-title{font-size:28px;line-height:40px}
  .tech-demo{flex-direction:column}
  .tech-demo-side{width:auto;padding:8px}
  .tech-adv-list{flex-wrap:wrap;justify-content:center;gap:32px}
  .tech-adv-item{max-width:200px}
  .tech-scene-item{width:100%;height:260px}
}

/* ④ 客户案例（知衣 case-box：1216 宽，横向 case-item） */
.sp-case-box{margin:64px auto 104px;display:flex;flex-direction:column;gap:48px}
.sp-case-item{
  display:flex;background:var(--surface);border-radius:24px;overflow:hidden;
  box-shadow:var(--shadow-md);transition:transform var(--t-med) var(--ease-out-quart),box-shadow var(--t-med);
}
.sp-case-item:hover{transform:translateY(-4px);box-shadow:var(--shadow-lg)}
.sp-case-item .ci-cover{width:470px;height:280px;flex-shrink:0;object-fit:cover}
.sp-case-item .ci-body{padding:32px 40px;display:flex;flex-direction:column;justify-content:center}
.sp-case-item .ci-tagrow{display:flex;gap:8px;margin-bottom:12px;flex-wrap:wrap}
.sp-case-item .ci-tag{
  font-size:12px;font-weight:600;color:var(--primary);background:var(--primary-100);
  padding:3px 10px;border-radius:999px;
}
.sp-case-item .ci-title{font-weight:600;font-size:24px;color:var(--ink);line-height:36px}
.sp-case-item .ci-desc{margin-top:10px;font-weight:400;font-size:15px;color:var(--muted);line-height:26px}
.sp-case-item .ci-cta{margin-top:16px;font-weight:600;font-size:15px;color:var(--primary);display:inline-flex;align-items:center;gap:6px}

/* 案例列表页（brandcase-all 映射：#brand .list li） */
.cl-list{margin:48px auto 104px;display:flex;flex-direction:column;gap:32px}
.cl-item{
  display:flex;background:var(--surface);border-radius:24px;overflow:hidden;
  box-shadow:var(--shadow-md);cursor:pointer;
  transition:transform var(--t-med) var(--ease-out-quart),box-shadow var(--t-med);
}
.cl-item:hover{transform:translateY(-4px);box-shadow:var(--shadow-lg)}
.cl-item img{width:470px;height:240px;object-fit:cover;flex-shrink:0}
.cl-item .cl-body{padding:28px 36px;display:flex;flex-direction:column;justify-content:center}
.cl-item .cl-title{font-weight:600;font-size:22px;color:var(--ink);line-height:34px;
  display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}
.cl-item .cl-sum{margin-top:10px;font-size:15px;color:var(--muted);line-height:26px;
  display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}
.cl-item .cl-meta{margin-top:14px;display:flex;align-items:center;gap:12px;font-size:13px;color:var(--muted)}
.cl-item .cl-meta .ci-tag{margin:0}


/* 洞察内容中心（参考 knowledge 目录/文章、industry 卡片列表、market 活动列表的组合形态） */
.insight-hero{
  position:relative;margin-top:80px;overflow:hidden;color:#fff;
  background:linear-gradient(132deg,#0b1029 0%,#132d63 54%,#0061ff 100%);
}
.insight-hero::before{
  content:"";position:absolute;inset:0;
  background:radial-gradient(620px 360px at 18% 18%,rgba(94,183,212,.38),transparent 64%),
             radial-gradient(520px 340px at 86% 24%,rgba(136,111,217,.34),transparent 62%),
             linear-gradient(180deg,rgba(11,16,41,.1),rgba(11,16,41,.38));
}
.insight-hero__in{position:relative;z-index:1;width:calc(100% - 48px);max-width:1216px;margin:0 auto;padding:88px 0 78px;display:grid;grid-template-columns:minmax(0,1fr) 360px;gap:48px;align-items:end}
.insight-kicker{display:inline-flex;align-items:center;gap:10px;padding:8px 14px;border:1px solid rgba(255,255,255,.28);border-radius:999px;background:rgba(255,255,255,.12);font-size:13px;font-weight:700;letter-spacing:.08em;text-transform:uppercase}
.insight-hero h1{margin:22px 0 0;font-family:var(--serif);font-size:48px;line-height:1.16;font-weight:900;letter-spacing:-.04em}
.insight-hero p{margin:20px 0 0;max-width:700px;font-size:17px;line-height:30px;color:rgba(255,255,255,.82)}
.insight-hero__stats{display:grid;grid-template-columns:repeat(2,1fr);gap:14px}
.insight-stat{min-height:118px;border:1px solid rgba(255,255,255,.18);border-radius:24px;padding:20px;background:rgba(255,255,255,.11);backdrop-filter:blur(18px)}
.insight-stat b{display:block;font-family:var(--serif);font-size:34px;line-height:1;color:#fff}
.insight-stat span{display:block;margin-top:10px;font-size:13px;line-height:20px;color:rgba(255,255,255,.78)}
.insight-wrap{width:calc(100% - 48px);max-width:1216px;margin:0 auto;padding:64px 0 104px}
.insight-navline{display:flex;align-items:center;justify-content:space-between;gap:16px;margin-bottom:28px;flex-wrap:wrap}
.insight-navline h2{margin:0;font-family:var(--serif);font-size:32px;line-height:42px;color:var(--ink)}
.insight-tabs{display:flex;gap:10px;flex-wrap:wrap}
.insight-tabs a{display:inline-flex;align-items:center;height:40px;padding:0 16px;border:1px solid var(--line);border-radius:999px;background:var(--surface);font-size:14px;font-weight:600;color:var(--muted)}
.insight-tabs a.active,.insight-tabs a:hover{border-color:rgba(0,97,255,.3);background:var(--primary-100);color:var(--primary)}
.insight-category-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:22px;margin-bottom:56px}
.insight-category-card{position:relative;overflow:hidden;min-height:260px;border:1px solid var(--line);border-radius:28px;background:var(--surface);box-shadow:var(--shadow-sm);padding:28px;transition:transform var(--t-med) var(--ease-out-quart),box-shadow var(--t-med)}
.insight-category-card:hover{transform:translateY(-5px);box-shadow:var(--shadow-lg)}
.insight-category-card::after{content:"";position:absolute;right:-58px;bottom:-68px;width:190px;height:190px;border-radius:50%;background:var(--cat-bg,rgba(0,97,255,.11))}
.insight-category-card .icon{position:relative;z-index:1;width:54px;height:54px;border-radius:18px;background:var(--primary-100);color:var(--primary);display:flex;align-items:center;justify-content:center;margin-bottom:22px}
.insight-category-card .icon svg{width:27px;height:27px}
.insight-category-card h3{position:relative;z-index:1;margin:0;font-size:24px;line-height:34px;color:var(--ink)}
.insight-category-card p{position:relative;z-index:1;margin:12px 0 0;font-size:15px;line-height:26px;color:var(--muted)}
.insight-category-card .meta{position:relative;z-index:1;margin-top:22px;display:flex;align-items:center;justify-content:space-between;font-size:13px;font-weight:700;color:var(--primary)}
.insight-featured{display:grid;grid-template-columns:1.05fr .95fr;gap:28px;margin-bottom:52px}
.insight-featured-main,.insight-list-card{display:block;overflow:hidden;border:1px solid var(--line);border-radius:28px;background:var(--surface);box-shadow:var(--shadow-sm);transition:transform var(--t-med) var(--ease-out-quart),box-shadow var(--t-med)}
.insight-featured-main:hover,.insight-list-card:hover{transform:translateY(-4px);box-shadow:var(--shadow-lg)}
.insight-featured-main img{width:100%;height:330px;object-fit:cover;display:block}
.insight-featured-main .body{padding:30px 34px 34px}
.insight-stack{display:grid;gap:18px}
.insight-list-card{display:grid;grid-template-columns:190px minmax(0,1fr);min-height:170px}
.insight-list-card img{width:190px;height:100%;object-fit:cover}
.insight-list-card .body{padding:22px 24px;display:flex;flex-direction:column;justify-content:center}
.insight-labels{display:flex;gap:8px;flex-wrap:wrap;margin-bottom:12px}
.insight-label{display:inline-flex;align-items:center;height:24px;padding:0 10px;border-radius:999px;background:var(--primary-100);color:var(--primary);font-size:12px;font-weight:700}
.insight-date{font-size:13px;color:var(--muted)}
.insight-card-title{margin:0;font-size:22px;line-height:32px;color:var(--ink);font-weight:700}
.insight-featured-main .insight-card-title{font-size:28px;line-height:40px}
.insight-card-desc{margin:10px 0 0;font-size:15px;line-height:26px;color:var(--muted)}
.insight-card-foot{display:flex;align-items:center;gap:12px;margin-top:16px;font-size:13px;color:var(--muted)}
.insight-card-foot b{color:var(--primary)}
.insight-list{display:grid;grid-template-columns:repeat(2,1fr);gap:22px}
.insight-list--one{grid-template-columns:1fr}
.insight-list--one .insight-list-card{grid-template-columns:280px minmax(0,1fr)}
.insight-list--one .insight-list-card img{width:280px}
.article-shell{width:calc(100% - 48px);max-width:1120px;margin:0 auto;padding:56px 0 104px;display:grid;grid-template-columns:minmax(0,760px) 280px;gap:56px;align-items:start}
.article-main{background:var(--surface);border:1px solid var(--line);border-radius:30px;padding:42px 48px;box-shadow:var(--shadow-sm)}
.article-breadcrumb{display:flex;gap:8px;align-items:center;flex-wrap:wrap;margin-bottom:20px;font-size:13px;color:var(--muted)}
.article-breadcrumb a{color:var(--primary);font-weight:700}
.article-main h1{margin:0;font-family:var(--serif);font-size:40px;line-height:54px;color:var(--ink);letter-spacing:-.03em}
.article-summary{margin:18px 0 0;font-size:17px;line-height:30px;color:var(--muted)}
.article-cover{width:100%;height:360px;object-fit:cover;border-radius:24px;margin:30px 0}
.article-body h2{margin:36px 0 14px;font-size:24px;line-height:34px;color:var(--ink)}
.article-body p{margin:0 0 16px;font-size:16px;line-height:30px;color:#333d52}
.article-body ul{margin:0 0 20px;padding-left:20px;color:#333d52}
.article-body li{margin:8px 0;font-size:16px;line-height:28px}
.article-callout{margin:28px 0;padding:22px 24px;border-radius:22px;background:linear-gradient(135deg,var(--primary-100),#fff);border:1px solid rgba(0,97,255,.14);font-size:15px;line-height:27px;color:#25406f}
.article-side{position:sticky;top:104px;display:grid;gap:18px}
.article-side-card{border:1px solid var(--line);border-radius:24px;background:var(--surface);padding:22px;box-shadow:var(--shadow-sm)}
.article-side-card h3{margin:0 0 14px;font-size:17px;color:var(--ink)}
.article-side-card a{display:block;padding:12px 0;border-top:1px solid var(--line);font-size:14px;line-height:22px;color:var(--muted)}
.article-side-card a:hover{color:var(--primary)}
.event-meta-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:14px;margin:28px 0}
.event-meta{padding:16px;border-radius:18px;background:var(--primary-100);color:#24415f;font-size:14px;line-height:22px}
.event-meta b{display:block;color:var(--primary);font-size:13px;margin-bottom:4px}
@media (max-width:1000px){
  .insight-hero__in,.insight-featured,.article-shell{grid-template-columns:1fr}
  .insight-category-grid{grid-template-columns:1fr}
  .article-side{position:static}
}
@media (max-width:720px){
  .insight-hero h1{font-size:34px;line-height:44px}
  .insight-hero__stats,.insight-list{grid-template-columns:1fr}
  .insight-list-card,.insight-list--one .insight-list-card{grid-template-columns:1fr}
  .insight-list-card img,.insight-list--one .insight-list-card img{width:100%;height:190px}
  .article-main{padding:28px 22px;border-radius:24px}
  .article-main h1{font-size:30px;line-height:42px}
  .article-cover{height:230px}
  .event-meta-grid{grid-template-columns:1fr}
}

@media (max-width:1240px){
  .sp-case-item .ci-cover,.cl-item img{width:380px}
}
@media (max-width:900px){
  .sp-banner h1.title{font-size:30px;line-height:42px}
  .sp-banner .tip{font-size:16px;line-height:26px}
  .sp-part1{flex-direction:column;gap:20px}
  .sp-solution-item{padding:28px 24px}
  .sp-solution-item .sp-solution-head{flex-direction:column}
  .sp-solution-item .left .title{font-size:22px;line-height:32px}
  .sp-case-item,.cl-item{flex-direction:column}
  .sp-case-item .ci-cover,.cl-item img{width:100%;height:200px}
  .sp-content-title{font-size:26px;line-height:38px;margin-top:72px}
}
`;

/* ---------- 4. 页面模板 ---------- */
function renderPage(cfg) {
  const bodyMid = cfg.body;
  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${cfg.title}</title>
<meta name="description" content="${cfg.desc}">
<link rel="icon" href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'%3E%3Crect width='32' height='32' rx='8' fill='%230061ff'/%3E%3Cpath d='M8 20c4-8 12-8 16 0' stroke='%23ffffff' stroke-width='2.5' fill='none' stroke-linecap='round'/%3E%3Ccircle cx='16' cy='11' r='3' fill='%23ffffff'/%3E%3C/svg%3E">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Noto+Sans+SC:wght@400;500;700&family=Noto+Serif+SC:wght@600;700;900&display=swap" rel="stylesheet">
${cssBlock}
${SUBPAGE_CSS}
</style>
</head>
<body class="subpage">

${navBlock}

${bodyMid}

${footerBlock}<script>
(function(){
  "use strict";
  var $ = function(s, c){ return (c||document).querySelector(s); };
  var $$ = function(s, c){ return Array.prototype.slice.call((c||document).querySelectorAll(s)); };

  ${jsNavReveal}

  ${jsShared}

  /* 子页当前板块标记；首页入口保留原生导航。 */
  (function(){
    var slug = location.pathname.split('/').pop().replace(/(?:\\.en)?\\.html$/, '');
    var section = slug === 'cases' ? 'cases' : /^(insight|event|glossary)/.test(slug) || slug === 'insights' ? 'insights' : /^(solution-)/.test(slug) ? 'solutions' : 'products';
    var nav = document.querySelector('.nav-links');
    if(!nav) return;
    var target = section === 'cases' ? nav.querySelector('a[href*="cases.html"],a[href*="cases.en.html"]')
      : section === 'insights' ? nav.querySelector('a[href*="insights.html"],a[href*="insights.en.html"]')
      : nav.querySelectorAll('.nav-menu-trigger')[section === 'solutions' ? 1 : 0];
    if(target){target.classList.add('is-current');if(target.tagName === 'A') target.setAttribute('aria-current','page');}
  })();

  /* 功能截图与模板示例切换：仅操作本地 gallery，不下载远端图片。 */
  $$("[data-feature-gallery]").forEach(function(gallery){
    var tabs = $$("[role=tab]", gallery), panes = $$("[role=tabpanel]", gallery);
    function activate(i){
      tabs.forEach(function(tab,j){tab.setAttribute('aria-selected',j===i?'true':'false');tab.tabIndex=j===i?0:-1;});
      panes.forEach(function(pane,j){pane.hidden=j!==i;});
    }
    tabs.forEach(function(tab,i){
      tab.addEventListener('click',function(){activate(i);});
      tab.addEventListener('keydown',function(e){
        var step = e.key === 'ArrowDown' || e.key === 'ArrowRight' ? 1 : e.key === 'ArrowUp' || e.key === 'ArrowLeft' ? -1 : 0;
        if(step){e.preventDefault();var next=(i+step+tabs.length)%tabs.length;activate(next);tabs[next].focus();}
      });
    });
  });

  /* 用户提供的短视频截图横向轮播；离屏、失焦与减少动效时暂停。 */
  $$('[data-social-reel]').forEach(function(root){
    var track = $('.social-reel-track', root), cards = $$('.social-reel-card', root);
    if(!track || !cards.length) return;
    var timer = null, visible = false, reduced = matchMedia('(prefers-reduced-motion: reduce)');
    function move(direction){
      var step = cards[0].getBoundingClientRect().width + 16;
      var max = Math.max(0, track.scrollWidth - track.clientWidth);
      var next = track.scrollLeft + direction * step;
      if(next > max - 5) next = 0;
      if(next < -5) next = max;
      track.scrollTo({left: next, behavior: reduced.matches ? 'instant' : 'smooth'});
    }
    function stop(){ if(timer){clearInterval(timer);timer=null;} }
    function start(){stop();if(visible && !reduced.matches && !document.hidden && !root.matches(':hover') && !root.matches(':focus-within'))timer=setInterval(function(){move(1);},4200);}
    $$('[data-social-step]',root).forEach(function(button){button.addEventListener('click',function(){move(Number(button.dataset.socialStep));stop();});});
    root.addEventListener('mouseenter',stop);root.addEventListener('mouseleave',start);
    root.addEventListener('focusin',stop);root.addEventListener('focusout',function(){setTimeout(start,0);});
    document.addEventListener('visibilitychange',start);
    reduced.addEventListener && reduced.addEventListener('change',start);
    if('IntersectionObserver' in window){new IntersectionObserver(function(entries){visible=entries[0].isIntersecting;start();},{threshold:.2}).observe(root);}else{visible=true;start();}
  });
  $$('[data-copy-creator-email]').forEach(function(button){
    button.addEventListener('click',function(){
      var template = document.getElementById('creator-email-template');
      if(!template || !navigator.clipboard) return;
      navigator.clipboard.writeText(template.textContent).then(function(){
        button.textContent = document.documentElement.lang === 'en' ? 'Copied' : '已复制';
      });
    });
  });

  ${jsChat}

  /* 能力预览标注点点击/键盘联动（technology 页） */
  $$(".tech-demo-stage").forEach(function(stage){
    var side = stage.parentElement.querySelector(".tech-demo-side");
    if(!side) return;
    var title = side.querySelector(".tds-title");
    var desc = side.querySelector(".tds-desc");
    function activateMark(m){
      $$(".demo-mark", stage).forEach(function(d){ d.classList.remove("active"); });
      m.classList.add("active");
      title.textContent = m.dataset.title;
      desc.textContent = m.dataset.desc;
    }
    stage.addEventListener("click", function(e){
      var m = e.target.closest(".demo-mark");
      if(!m) return;
      activateMark(m);
    });
    stage.addEventListener("keydown", function(e){
      var m = e.target.closest(".demo-mark");
      if(m && (e.key === "Enter" || e.key === " ")){ e.preventDefault(); activateMark(m); }
    });
  });

  ${jsChatAuto}})();
</script>
</body>
</html>
`;
}

/* ---------- 5. 四段式骨架构造器 ---------- */
function skeleton(cfg) {
  const pains = cfg.pains.map(p => `
      <div class="info-item reveal">
        <div class="ii-img" style="--c1:${p.c1};--c2:${p.c2}">${p.img ? `<img src="../assets/${p.img}" alt="${p.title}" loading="lazy">` : p.svg}</div>
        <div class="tip">${p.title}</div>
        <div class="desc">${p.desc}</div>
      </div>`).join("");

  const feats = cfg.features.map((f, i) => {
    const chips = f.chips ? `<div class="info-box">${f.chips.map(c => `<div class="info-item">${c}</div>`).join("")}</div>` : "";
    const media = f.gallery ? renderFeatureGallery(f.gallery, cfg.slug + '-feature-' + i) : f.img
      ? `<img class="sp-feat-img" src="../assets/${f.img}" alt="${f.title}" loading="lazy">`
      : (f.mock ? `<div class="sp-feat-mock${f.mock.includes('order-management') ? ' sp-feat-mock--order' : ''}"><img src="../assets/${f.mock}" alt="${f.alt || f.title}" loading="lazy"></div>` : "");
    return `
    <div class="sp-solution-item reveal">
      <div class="sp-solution-head">
        <div class="left">
          <h3 class="title">${f.title}</h3>
          <div class="tip">${f.tip}</div>
        </div>
        <div class="right">${f.svg}</div>
      </div>
      ${chips}
      ${media}
    </div>`;
  }).join("");

  const cases = cfg.cases.map(c => `
    <a class="sp-case-item reveal" href="cases.html">
      <img class="ci-cover" src="../assets/${caseScenePhoto(c)}" alt="真实游客出行场景" loading="lazy">
      <div class="ci-body">
        <div class="ci-tagrow">${c.tags.map(t => `<span class="ci-tag">${t}</span>`).join("")}</div>
        <div class="ci-title">${c.title}</div>
        <div class="ci-desc">${c.desc}</div>
        <span class="ci-cta">查看案例 <span>→</span></span>
      </div>
    </a>`).join("");

  return `
<!-- ================= ① banner（有 bannerBg 时用真实头图 + 深蓝遮罩，对齐知衣 background-image cover） ================= -->
<section class="sp-banner${cfg.bannerBg ? " has-bg" : ""}"${cfg.bannerBg ? ` style="background-image:url('../assets/${cfg.bannerBg}')"` : ""}>
  <div class="sp-banner-in">
    <span class="eyebrow-w">${cfg.eyebrow}</span>
    <h1 class="title">${cfg.h1}</h1>
    <div class="tip">${cfg.bannerTip}</div>
    <button class="link-btn" data-lead data-source="${cfg.slug}-banner" data-title="获取专属增长方案"><span>免费获取方案</span><span class="arr">→</span></button>
  </div>
</section>

<div class="sp-content">
  <!-- ================= ② 行业背景与痛点 ================= -->
  <h2 class="sp-content-title reveal">行业背景与痛点</h2>
  <div class="sp-content-title-tip reveal">${cfg.painIntro}</div>
  <div class="sp-part1">${pains}
  </div>

  <!-- ================= ③ 核心功能 ================= -->
  <h2 class="sp-content-title reveal" style="margin-top:104px">核心功能</h2>
  <div class="sp-solution-box">${feats}
  </div>

  <!-- ================= ④ 客户案例 ================= -->
  <h2 class="sp-content-title reveal" style="margin-top:104px">客户案例</h2>
  <div class="sp-case-box">${cases}
  </div>
</div>
`;
}

function caseScenePhoto(c) {
  const text = [c.title, ...(c.tags || [])].join(' ');
  if (/地接/.test(text)) return 'generated/home-cases/airport-checkin-group.png';
  if (/景区|文旅/.test(text)) return 'generated/home-cases/sun-moon-mountain.png';
  if (/精品|定制|茶旅/.test(text)) return 'generated/home-cases/tour-shuttle.png';
  return 'generated/home-cases/airport-departure-group.png';
}

function renderFeatureGallery(gallery, id) {
  const panes = gallery.slides.map((slide, i) => `<figure class="sp-gallery-pane" id="${id}-pane-${i}" role="tabpanel" aria-labelledby="${id}-tab-${i}"${i ? ' hidden' : ''}><img src="../assets/${slide.img}" alt="${slide.alt || slide.title}" loading="lazy"><a class="sp-gallery-open" href="../assets/${slide.img}" target="_blank" rel="noopener noreferrer" aria-label="在新标签页查看完整图片">查看原图 ↗</a></figure>`).join('');
  const tabs = gallery.slides.map((slide, i) => `<button class="sp-gallery-option" type="button" id="${id}-tab-${i}" role="tab" aria-controls="${id}-pane-${i}" aria-selected="${i === 0}" tabindex="${i === 0 ? 0 : -1}"><b>${slide.title}</b><span>${slide.desc}</span></button>`).join('');
  return `<div class="sp-feature-gallery${gallery.social ? ' social-evidence' : ''}" data-feature-gallery><div class="sp-gallery-stage">${panes}</div><div class="sp-gallery-options" role="tablist" aria-label="${gallery.label}">${tabs}${gallery.source ? `<p class="sp-gallery-source">${gallery.source}</p>` : ''}</div></div>`;
}

function renderSocialScenes(scenes) {
  return `<div class="social-use-list">${scenes.map(s => `<article class="social-use-card reveal">${s.flow ? `<div class="social-flow" role="img" aria-label="${s.title}流程示意"><div class="social-flow-head"><strong>COMMENT → FOLLOW-UP</strong><span>流程示意</span></div><div class="social-flow-steps"><div class="social-flow-step"><b>01</b>评论与私信归集</div><div class="social-flow-step"><b>02</b>分配负责人核实</div><div class="social-flow-step"><b>03</b>双语邮件回访</div></div><div class="social-email-preview"><span>Follow-up email · Template</span><strong>Subject: Your China travel feedback</strong><p>Thank you for sharing your experience. A team member will review the details and follow up.</p></div><div class="social-flow-note">此流程用于说明跟进方式，不连接社媒账号，也不自动发送邮件。</div></div>` : `<div class="social-use-media">${s.images.map(img => `<a href="../assets/${img.src}" target="_blank" rel="noopener noreferrer" aria-label="查看完整截图：${img.alt}"><img src="../assets/${img.src}" alt="${img.alt}" loading="lazy"></a>`).join('')}</div>`}<div class="social-use-copy"><span class="social-use-label">China Travel / Social</span><h3>${s.title}</h3><p>${s.desc}</p></div></article>`).join('')}</div>`;
}

function renderSocialReel(slides) {
  return `<section class="social-reel reveal" data-social-reel aria-label="China Travel 短视频截图轮播"><div class="social-reel-head"><div><h2>China Travel 短视频样本</h2><p>以下为 Instagram 帖子截图，保留原始画面与互动信息。这里展示的是静态截图，非视频播放或实时热度榜；点击可查看完整原图。</p></div><div class="social-reel-controls"><button type="button" data-social-step="-1" aria-label="上一组短视频截图">←</button><button type="button" data-social-step="1" aria-label="下一组短视频截图">→</button></div></div><div class="social-reel-track">${slides.map(s => `<figure class="social-reel-card"><a href="../assets/${s.img}" target="_blank" rel="noopener noreferrer" aria-label="查看完整截图：${s.title}"><img src="../assets/${s.img}" alt="${s.alt}" loading="lazy"></a><figcaption>${s.title}<span>${s.caption}</span></figcaption></figure>`).join('')}</div></section>`;
}

function renderCreatorOutreach() {
  return `<section class="creator-outreach reveal" aria-labelledby="creator-outreach-title"><img src="../assets/generated/social-china-travel/creator-email-workspace.png" alt="旅行合作邮件工作场景示意图" loading="lazy"><div class="creator-outreach-copy"><span class="eyebrow">CREATOR PARTNERSHIPS</span><h2 id="creator-outreach-title">外籍达人合作邮件回访</h2><p>从真实帖子发现创作者后，先人工核验受众、内容质量与联系方式，再发送有针对性的合作邀请；不把公开互动量等同于合作效果。</p><details><summary>查看英文邮件模板</summary><pre id="creator-email-template">Subject: Exploring a China travel collaboration\n\nHi [Creator Name],\n\nI enjoyed your recent China travel post about [destination or story]. We work with inbound travel partners and would love to explore a collaboration that fits your audience and creative style.\n\nIf you are interested, could you share your media kit, audience locations, preferred content format, and availability? We can then send a clear brief, itinerary details, compensation terms, and disclosure requirements for your review.\n\nBest,\n[Your Name]\n[Company] · [Contact]</pre><button type="button" data-copy-creator-email>复制英文模板</button><small>邮件模板可按合作对象调整；点击复制不会发送邮件。联系前请核实创作者意愿、平台规则及商业合作披露要求。</small></details></div></section>`;
}

/* ---------- 5b. technology 版式构造器（AI能力 / 大数据能力 页，1:1 对齐知衣 technology-img） ---------- */
function techSkeleton(cfg) {
  const advs = cfg.advantages.map(a => `
        <div class="tech-adv-item reveal">
          <div class="tech-adv-icon">${a.svg}</div>
          <h3 class="tech-adv-title">${a.title}</h3>
          <div class="tech-adv-sub">${a.sub}</div>
        </div>`).join("");

  const scenes = cfg.socialScenes ? renderSocialScenes(cfg.socialScenes) : cfg.scenes.map(s => `
      <div class="tech-scene-item reveal">
        <div class="ts-bg" style="background-image:url('../assets/${s.img}')"></div>
        <div class="ts-body">
          <h3 class="ts-title">${s.title}</h3>
          <div class="ts-desc">${s.desc}</div>
        </div>
      </div>`).join("");

  /* 能力预览区（对齐知衣 demo-content：示意图 + 可点击标注点 → 联动右侧说明） */
  const demo = cfg.socialGallery ? `
  <h2 class="tech-section-title reveal" style="margin-top:104px">China Travel 社媒样本</h2>
  <p class="social-proof-intro reveal">通过公开帖文观察目的地讨论、内容形式与游客关注点。下方为页面截图，互动数据以截图时点为准，不代表实时监测结果。</p>
  ${renderFeatureGallery(cfg.socialGallery, cfg.slug + '-social-proof')}
  ${cfg.socialReel ? renderSocialReel(cfg.socialReel) : ''}
  ${cfg.creatorOutreach ? renderCreatorOutreach() : ''}` : cfg.demo ? `
  <!-- ================= 能力预览区（知衣 demo-content 结构） ================= -->
  <h2 class="tech-section-title reveal" style="margin-top:104px">能力预览</h2>
  <div class="tech-demo reveal">
    <div class="tech-demo-stage">
      <img src="../assets/${cfg.demo.img}" alt="${cfg.demo.title}" loading="lazy">
      ${cfg.demo.marks.map(m => `<div class="demo-mark" style="left:${m.x}%;top:${m.y}%" data-title="${m.title}" data-desc="${m.desc}" role="button" tabindex="0" aria-label="打开功能说明"><span class="demo-tip">${m.title}</span></div>`).join("")}
    </div>
    <div class="tech-demo-side">
      <div class="tds-title" id="demoTitle-${cfg.slug}">${cfg.demo.title}</div>
      <div class="tds-desc" id="demoDesc-${cfg.slug}">${cfg.demo.desc}</div>
      <div class="tds-tags">${cfg.demo.tags.map(t => `<span>${t}</span>`).join("")}</div>
    </div>
  </div>` : "";

  return `
<!-- ================= ① banner（technology 版式：浅色底 + 左对齐，对齐知衣 596px） ================= -->
<section class="tech-banner"${cfg.bannerBg ? ` style="background-image:url('../assets/${cfg.bannerBg}')"` : ""}>
  <div class="tech-banner-in">
    <span class="tech-eyebrow">${cfg.eyebrow}</span>
    <h1 class="tech-title">${cfg.h1}</h1>
    <div class="tech-sub">${cfg.bannerTip}</div>
    <button class="tech-cta" data-lead data-source="${cfg.slug}-banner" data-title="获取专属增长方案"><span>预约体验</span><span>→</span></button>
  </div>
</section>

<div class="sp-content">
  ${demo}
</div>

<!-- ================= ② 技术优势（advantage：#f5f5f7 灰底、90px 图标横排） ================= -->
<section class="tech-advantage">
  <div class="sp-content">
    <h2 class="tech-section-title reveal">技术优势</h2>
    <div class="tech-section-sub reveal">${cfg.advIntro}</div>
    <div class="tech-adv-list">${advs}
    </div>
  </div>
</section>

<div class="sp-content">
  <!-- ================= ③ 应用场景（application：588×331 背景图卡，标题浮于图上） ================= -->
  <h2 class="tech-section-title reveal" style="margin-top:104px">应用场景</h2>
  <div class="tech-section-sub reveal">${cfg.sceneIntro}</div>
  ${cfg.socialScenes ? scenes : `<div class="tech-scene-list">${scenes}</div>`}
</div>
`;
}

/* SVG 图标库 */
const I = {
  trend: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M3 17l5-5 4 3 6-7 3 3" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  chat: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M4 5h16v11H8l-4 4z" stroke-linejoin="round"/><path d="M8 9h8M8 12h5" stroke-linecap="round"/></svg>',
  clock: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 3" stroke-linecap="round"/></svg>',
  globe: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3a14 14 0 010 18M12 3a14 14 0 000 18"/></svg>',
  pin: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M12 21s-7-4.5-7-10a7 7 0 0114 0c0 5.5-7 10-7 10z" stroke-linecap="round"/><circle cx="12" cy="11" r="2.5"/></svg>',
  star: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M12 3l2.4 5.2L20 9l-4 4 1 6-5-2.8L7 19l1-6-4-4 5.6-.8z" stroke-linejoin="round"/></svg>',
  doc: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="4" y="3" width="16" height="18" rx="2"/><path d="M8 8h8M8 12h8M8 16h5"/></svg>',
  chart: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M3 17l5-5 4 3 6-7 3 3" stroke-linecap="round" stroke-linejoin="round"/><path d="M4 21h16" stroke-linecap="round"/></svg>',
  user: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="12" cy="8" r="4"/><path d="M4 20c1.5-4 4.5-6 8-6s6.5 2 8 6" stroke-linecap="round"/></svg>',
  shield: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M12 3l7 4v5c0 5-3.5 8-7 9-3.5-1-7-4-7-9V7z" stroke-linejoin="round"/></svg>',
  bolt: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M13 2L4 14h6l-1 8 9-12h-6z" stroke-linejoin="round"/></svg>',
  building: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M3 21h18M5 21V8l7-5 7 5v13" stroke-linecap="round" stroke-linejoin="round"/></svg>',
};

const ITINERARY_GALLERY = {
  label: '可视化行程编排演示',
  slides: [
    { img: 'product/web-itinerary-workbench.png', title: '拖拽编排', desc: '真实工作台：需求、每日安排与资源库同屏协作', alt: '可视化行程编排工作台界面' },
    { img: 'generated/home-solution/itinerary-workbench-ai-overlay.png', title: 'AI 路线辅助', desc: '在原工作台上标出路线节点与智能推荐位置', alt: '行程工作台叠加 AI 路线辅助效果' },
    { img: 'generated/home-solution/bilingual-itinerary-poster.png', title: '模板案例', desc: '中英文行程海报叠层，展示方案交付样式', alt: '中英文行程册模板案例' },
  ],
};
const META_GALLERY = {
  label: 'Meta 广告投放结构与优化教学图',
  slides: [
    { img: 'generated/subpage-reference/meta-campaign-hierarchy.png', title: '投放层级', desc: 'Campaign → Ad set → Ad：目标、受众与素材分层管理', alt: 'Meta 广告系列、广告组、广告三级结构教学图' },
    { img: 'generated/subpage-reference/meta-opportunity-flow.png', title: '优化路径', desc: '从账户概览到广告系列，逐步查看改进建议', alt: 'Meta Opportunity score 从账户到广告系列的教学流程图' },
    { img: 'generated/subpage-reference/meta-opportunity-score.png', title: '机会分数', desc: '结合建议检查设置，不把教学分数当成投放结果', alt: 'Meta Opportunity score 建议界面教学截图' },
    { img: 'generated/subpage-reference/meta-ads-manager-overview.png', title: '官方后台', desc: '投放状态与建议在广告主自己的 Ads Manager 中核验', alt: 'Meta Ads Manager 教学界面截图' },
  ],
  source: '以下截图用于介绍 Meta 广告管理结构与优化流程，不展示文数智旅的投放业绩。<a href="https://www.facebookblueprint.com/student/path/253172-opportunity-score-course" target="_blank" rel="noopener noreferrer">了解 Meta Blueprint</a>',
};

/* ---------- 6. 六页内容配置 ---------- */
const PAGES = [
  {
    slug: "solution-travel-agency",
    bannerBg: "generated/gen-callcenter.jpg",
    title: "国际旅行社解决方案 · 文数智旅",
    desc: "面向国际旅行社的 AI+入境游全链路增长系统：全域获客、AI 接待、智能方案、订单履约，把入境游客源攥在自己手里。",
    eyebrow: "For International Travel Agencies",
    h1: "AI 驱动入境游全链路，<br>把全球客源攥在自己手里",
    bannerTip: "海外获客 · 智能承接 · 全链路成交——一套系统构建旅行社的入境游增长引擎",
    painIntro: "2026 年入境游全面回暖，但国际旅行社在承接全球客源时普遍面临三大挑战：",
    pains: [
      { c1: "#5E75CF", c2: "#273156", svg: I.globe, img: "generated/gen-adsdashboard.jpg", title: "海外获客难、贵、不可控", desc: "依赖 OTA 与展会，获客成本高企，投放黑盒、数据不归己，客源命脉握在平台手里。" },
      { c1: "#5EB7D4", c2: "#274c59", svg: I.clock, img: "generated/gen-chatdesk.jpg", title: "跨时区询盘大量流失", desc: "海外游客的咨询高峰恰逢国内深夜，人工客服无法 7×24 在线，高意向商机白白流走。" },
      { c1: "#886FD9", c2: "#392e5b", svg: I.doc, img: "generated/gen-phonechat.jpg", title: "定制方案效率低", desc: "一份多语种行程 + 报价动辄 3 小时以上，旺季咨询量翻倍时销售根本接不过来。" },
    ],
    features: [
      { svg: I.trend, title: "全域获客：海外流量精准引流", tip: "Google / Meta / TikTok / Instagram 广告与内容种草双轮驱动，多语种落地页结构化留资，3 秒内进入 WhatsApp 私域承接。", chips: ["SEO/SEM 截流", "兴趣定向", "社媒种草", "表单留资", "WhatsApp 承接", "私域沉淀"], img: "generated/gen-adsdashboard.jpg" },
      { svg: I.chat, title: "AI 智能接待：7×24 多语种询盘不漏接", tip: "官网 / 社媒 / 邮件 / WhatsApp 咨询统一归集，文小旅 12 语种秒级响应，智能挖需、自动分级，高意向线索直达销售。", chips: ["7×24 值守", "12 语种", "秒级响应", "智能挖需", "线索分级", "夜间拦截"], img: "generated/gen-chatdesk.jpg" },
      { svg: I.doc, title: "智能方案生成：3 小时变 10 分钟", tip: "可视化行程编排 + 资源底价实时同步，一键生成双语 PDF 行程册与报价，利润率自由调节。", chips: ["拖拽式编排", "公共资源池", "自动成本核算", "双语行程册", "一键报价"], mock: "product/web-itinerary-workbench.png" },
      { svg: I.chart, title: "数据看板：获客 / 转化 / ROI 全链路可视", tip: "从广告消耗到成交回款全链路数据打通，每一分投放消耗透明可查，效果绑定运营分成。", mock: "product/web-dashboard-overview.png" },
    ],
    cases: [
      { img: "generated/gen-callcenter.jpg", tags: ["国际旅行社", "规模化引流"], title: "某头部出境社：入境游获客成本下降 62%", desc: "通过全域广告投放 + AI 接待链路，3 个月内海外询盘量翻 3 倍，单条线索成本从 ¥180 降至 ¥68。" },
      { img: "generated/gen-airport.jpg", tags: ["地接社", "响应提速"], title: "西南地接社：深夜询盘转化率提升 4 倍", desc: "文小旅 7×24 接管夜间咨询，次日销售跟进高意向线索，深夜商机不再流失。" },
    ],
  },
  {
    slug: "solution-ground-ops",
    bannerBg: "generated/gen-airport.jpg",
    title: "入境游地接社解决方案 · 文数智旅",
    desc: "面向入境游地接社的 AI 接待与履约方案：7×24 多语种承接、订单履约全节点追踪，落地接待响应提速。",
    eyebrow: "For Ground Operators",
    h1: "落地接待的每一个深夜询盘，<br>都不再流失",
    bannerTip: "AI 接待官 7×24 多语种值守 · 订单履约全节点追踪 · 资源调度一屏掌控",
    painIntro: "地接社处于入境游履约第一线，服务质量直接决定口碑与复购，但普遍存在三大痛点：",
    pains: [
      { c1: "#5EB7D4", c2: "#274c59", svg: I.clock, img: "generated/gen-chatdesk.jpg", title: "夜间询盘无人承接", desc: "欧美游客白天咨询时正值国内凌晨，人工客服不在线，等到次日回复时游客已投向别家。" },
      { c1: "#5E75CF", c2: "#273156", svg: I.chat, img: "generated/gen-phonechat.jpg", title: "多语种沟通成本高", desc: "小语种游客咨询需要翻译反复转述，需求理解偏差大，报价来回确认耗时数天。" },
      { c1: "#886FD9", c2: "#392e5b", svg: I.doc, img: "generated/gen-airport.jpg", title: "履约节点靠人盯", desc: "定金、资源确认、接送机、导游安排全靠 Excel + 微信人工跟进，旺季极易出错漏单。" },
    ],
    features: [
      { svg: I.chat, title: "AI 接待官：12 语种秒级承接", tip: "文小旅基于你的线路与资源库实时应答，自动提取人数 / 日期 / 预算 / 偏好，高意向线索即刻推送销售微信。", chips: ["12 语种", "秒级响应", "智能挖需", "一键转人工", "夜间拦截"], img: "generated/gen-chatdesk.jpg" },
      { svg: I.shield, title: "订单履约管控：全节点追踪", tip: "定金到账、资源确认、车辆调度、导游排班、出行回访——每一个节点状态实时可视，异常自动预警。", chips: ["定金追踪", "资源确认", "导游排班", "异常预警", "出行回访"], mock: "product/web-resource-library.png" },
      { svg: I.user, title: "客户资产沉淀：复购与转介绍", tip: "服务过的游客自动打上标签化档案，行前提醒、行后回访、节假日复购触达全自动执行。", chips: ["标签化档案", "行前提醒", "行后回访", "复购触达"] },
    ],
    cases: [
      { img: "generated/gen-airport.jpg", tags: ["地接社", "响应提速"], title: "西南地接社：深夜询盘转化率提升 4 倍", desc: "文小旅接管凌晨 0-8 点全部咨询，自动完成需求挖掘与初轮报价，销售次日只跟进高意向线索。" },
      { img: "generated/gen-guilin.jpg", tags: ["景区", "国际客流"], title: "桂林文旅集团：入境游客接待量翻倍", desc: "多语种 AI 接待 + 履约管控打通，旺季人力不变的情况下接待规模翻倍。" },
    ],
  },
  {
    slug: "solution-boutique",
    bannerBg: "generated/gen-tea.jpg",
    title: "精品旅游公司解决方案 · 文数智旅",
    desc: "面向精品/高端定制旅游公司的智能方案生成系统：10 分钟出双语行程册与报价，服务高净值客群。",
    eyebrow: "For Boutique Travel Studios",
    h1: "高净值定制游，<br>10 分钟出一份双语行程册",
    bannerTip: "智能方案生成 · 公共资源池 · 自动成本核算——让定制顾问把时间花在服务上，而不是做 PPT 上",
    painIntro: "精品旅游公司服务高净值客群，方案品质就是生命线，但定制化生产模式面临三大瓶颈：",
    pains: [
      { c1: "#886FD9", c2: "#392e5b", svg: I.doc, img: "generated/gen-tea.jpg", title: "方案生产效率低", desc: "一份高品质双语行程册要查资源、算成本、排版式设计，动辄 3-5 小时，旺季根本接不过来。" },
      { c1: "#5E75CF", c2: "#273156", svg: I.user, img: "generated/gen-chatdesk.jpg", title: "顾问经验难复制", desc: "最好的定制顾问脑子里装着资源与玩法，但经验无法沉淀，新人培养周期长达半年。" },
      { c1: "#5EB7D4", c2: "#274c59", svg: I.chart, img: "generated/gen-adsdashboard.jpg", title: "报价利润算不清", desc: "资源底价散落在各个供应商微信里，成本核算靠人工逐项加总，利润率难以精准控制。" },
    ],
    features: [
      { svg: I.doc, title: "智能方案生成：10 分钟出行程 + 报价", tip: "输入客群需求，AI 自动匹配线路 / 酒店 / 体验资源，生成可直接发送客户的双语 PDF 行程册。", chips: ["拖拽式编排", "双语行程册", "一键报价", "品牌模板"], mock: "product/web-itinerary-workbench.png" },
      { svg: I.globe, title: "公共资源池：底价实时同步", tip: "线路、酒店、车辆、体验资源一站式管理，底价实时同步，利润率自由调节，方案即改即得。", chips: ["资源一站式", "底价同步", "利润率调节", "方案即改即得"], mock: "product/web-resource-library.png" },
      { svg: I.chat, title: "AI 顾问前置：先筛需求再人工", tip: "文小旅先完成需求挖掘与预算确认，把结构化需求递交给定制顾问，人均产能提升 3 倍。", chips: ["需求结构化", "预算预确认", "高意向直达顾问"], img: "generated/gen-phonechat.jpg" },
    ],
    cases: [
      { img: "generated/gen-tea.jpg", tags: ["精品定制", "高净值客群"], title: "云南精品茶旅：方案交付从 3 天到 10 分钟", desc: "高端茶文化定制游，AI 方案生成 + 资源池打通后，顾问人均日处理方案量从 2 份提升到 12 份。" },
      { img: "generated/gen-callcenter.jpg", tags: ["国际旅行社", "规模化引流"], title: "某头部出境社：入境游获客成本下降 62%", desc: "全域广告投放 + AI 接待链路，海外询盘量翻 3 倍。" },
    ],
  },
  {
    slug: "solution-scenic",
    bannerBg: "generated/gen-guilin.jpg",
    title: "景区 / 文旅集团解决方案 · 文数智旅",
    desc: "面向景区与文旅集团的入境游增长方案：国际品牌获客、多语种接待、客源结构多元化。",
    eyebrow: "For Scenic Spots & Culture-Tourism Groups",
    h1: "让全球游客，<br>在出发之前就看见你",
    bannerTip: "国际品牌获客 · 多语种智能接待 · 客源结构多元化——从门票经济走向国际目的地品牌",
    painIntro: "入境游红利下，景区与文旅集团是目的地承接的终点站，但国际化能力普遍面临三大短板：",
    pains: [
      { c1: "#5E75CF", c2: "#273156", svg: I.globe, img: "generated/gen-guilin.jpg", title: "国际市场没有声量", desc: "海外游客规划中国行程时，搜索到的都是头部景区，中小目的地在国际渠道完全隐身。" },
      { c1: "#5EB7D4", c2: "#274c59", svg: I.chat, img: "generated/gen-phonechat.jpg", title: "多语种服务能力缺失", desc: "官网只有中文，海外社媒无人运营，国际游客的咨询无人能用母语应答。" },
      { c1: "#886FD9", c2: "#392e5b", svg: I.chart, img: "generated/gen-adsdashboard.jpg", title: "客源结构单一", desc: "过度依赖国内团队客，抗风险能力弱，入境散客渠道完全没有建立。" },
    ],
    features: [
      { svg: I.trend, title: "国际品牌获客：目的地营销出海", tip: "Google / TripAdvisor / Instagram 目的地内容营销 + 广告投放，让海外游客在行程规划阶段就把你加入清单。", chips: ["目的地内容营销", "海外社媒运营", "多语种官网", "广告投放"], img: "generated/gen-adsdashboard.jpg" },
      { svg: I.chat, title: "多语种智能接待：门票 / 导览 / 交通一站答", tip: "文小旅 12 语种回答门票预约、开放时间、交通接驳、导览服务等高频问题，预约直达官方渠道。", chips: ["12 语种", "门票预约引导", "交通接驳答疑", "7×24 值守"], img: "generated/gen-phonechat.jpg" },
      { svg: I.chart, title: "客源数据看板：入境客群结构可视", tip: "海外客群来源国、渠道、预约转化全链路可视，为目的地国际化运营提供决策依据。", chips: ["来源国分析", "渠道归因", "预约转化", "决策看板"], mock: "product/web-dashboard-overview.png" },
    ],
    cases: [
      { img: "generated/gen-guilin.jpg", tags: ["景区", "国际客流"], title: "桂林文旅集团：入境游客接待量翻倍", desc: "目的地内容营销 + 多语种 AI 接待，6 个月内入境散客占比从 8% 提升至 23%。" },
      { img: "generated/gen-tea.jpg", tags: ["精品定制", "品牌溢价"], title: "云南精品茶旅：国际品牌溢价 40%", desc: "小众目的地通过内容种草打入欧美高净值客群，客单价提升 40%。" },
    ],
  },
  {
    slug: "solution-growth",
    bannerBg: "generated/gen-adsdashboard.jpg",
    title: "全域获客方案 · 解决方案 · 文数智旅",
    desc: "全域获客方案：Google/Meta/TikTok 广告投放 + 内容种草 + 多语种落地页 + 私域承接，入境游获客成本降 60%。",
    eyebrow: "Solution · Global Acquisition",
    h1: "全域获客方案，<br>让全球游客主动找到你",
    bannerTip: "海外广告投放 · 内容种草 · 多语种落地页 · 私域承接——从 OTA 手里把客源夺回来",
    painIntro: "入境游获客的主战场在海外，但大多数机构的获客方式还停留在十年前：",
    pains: [
      { c1: "#5E75CF", c2: "#273156", svg: I.trend, img: "generated/gen-adsdashboard.jpg", title: "OTA 佣金吃掉利润", desc: "平台订单抽佣 15-25%，忙活一季利润大头归平台，客户数据还全部留在平台手里。" },
      { c1: "#5EB7D4", c2: "#274c59", svg: I.globe, img: "generated/gen-callcenter.jpg", title: "自投广告不会玩", desc: "Google/Meta 投放规则复杂，没有海外投放经验的团队钱花了询盘没来几个。" },
      { c1: "#886FD9", c2: "#392e5b", svg: I.chat, img: "generated/gen-phonechat.jpg", title: "流量来了接不住", desc: "广告引来的游客落地页留不住——没有多语种内容、没有即时响应，跳出率 90%+。" },
    ],
    features: [
      { svg: I.trend, title: "全域广告投放：精准覆盖目标客源国", tip: "Google 搜索截流高意向词、Meta/TikTok 兴趣定向种草、Instagram 视觉营销，按客源国、语言、出行意向分层投放。", chips: ["Google 截流", "Meta 定向", "TikTok 种草", "分国别投放", "预算透明"], gallery: META_GALLERY },
      { svg: I.doc, title: "多语种落地页：3 秒留资进私域", tip: "高转化落地页模板库 + 结构化留资表单，游客提交后 3 秒内自动进入 WhatsApp 私域，文小旅即刻接管对话。", chips: ["落地页模板", "结构化留资", "WhatsApp 承接", "3 秒响应"], img: "generated/gen-phonechat.jpg" },
      { svg: I.chart, title: "数据回流归因：每一分消耗都可查", tip: "广告费直充你的官方媒体后台，消耗明细、询盘成本、成交归因全链路实时可查，我们只赚效果分成。", chips: ["官方后台", "明细可查", "成交归因", "效果分成"], mock: "product/web-dashboard-overview.png" },
    ],
    cases: [
      { img: "generated/gen-callcenter.jpg", tags: ["国际旅行社", "降本 62%"], title: "某头部出境社：获客成本下降 62%", desc: "全域广告 + AI 承接链路，3 个月询盘量翻 3 倍，线索成本从 ¥180 降至 ¥68。" },
      { img: "generated/gen-tea.jpg", tags: ["精品旅游", "客单价 +40%"], title: "云南精品茶旅：内容种草打入欧美高净值客群", desc: "Instagram 内容营销 + 高定落地页，客单价提升 40%。" },
    ],
  },
  {
    slug: "solution-convert",
    bannerBg: "generated/gen-chatdesk.jpg",
    title: "智能接待转化方案 · 解决方案 · 文数智旅",
    desc: "智能接待转化方案：全渠道询盘归集 + AI 7×24 多语种接待 + 智能挖需分级，询盘转化率提升 4 倍。",
    eyebrow: "Solution · AI Conversion",
    h1: "智能接待转化方案，<br>每一条询盘都被接住",
    bannerTip: "全渠道询盘归集 · AI 7×24 多语种接待 · 智能挖需分级——从询盘到成交，转化率翻倍",
    painIntro: "询盘是入境游最值钱的资产，但行业平均有 60% 的询盘死于响应不及时：",
    pains: [
      { c1: "#5EB7D4", c2: "#274c59", svg: I.clock, img: "generated/gen-chatdesk.jpg", title: "60% 询盘死于深夜", desc: "欧美游客的咨询高峰是国内凌晨，人工不在线，等到次日回复游客已经订了别家。" },
      { c1: "#5E75CF", c2: "#273156", svg: I.chat, img: "generated/gen-phonechat.jpg", title: "多渠道消息漏接", desc: "官网表单、WhatsApp、社媒私信、邮件分散各处，客服来回切换，漏单是常态。" },
      { c1: "#886FD9", c2: "#392e5b", svg: I.user, img: "generated/gen-callcenter.jpg", title: "销售时间被浪费", desc: "70% 的咨询是低意向比价客，销售大量时间耗在无效沟通上，高意向反而没跟紧。" },
    ],
    features: [
      { svg: I.chat, title: "全渠道询盘归集：一个后台全管理", tip: "官网、社媒、邮件、WhatsApp 咨询统一汇聚，每条询盘有归属、有状态、有跟进记录，永不漏单。", chips: ["官网表单", "社媒私信", "邮件", "WhatsApp", "状态追踪"], img: "generated/gen-chatdesk.jpg" },
      { svg: I.bolt, title: "文小旅 AI 接待：12 语种秒级应答", tip: "基于你的资源库实时应答，自动挖需、自动分级，高意向线索即刻推送销售，低意向进入培育池。", chips: ["12 语种", "秒级响应", "智能挖需", "线索分级"], img: "generated/gen-phonechat.jpg" },
      { svg: I.shield, title: "人机协同：AI 搞不定的无缝转人工", tip: "复杂需求一键转人工，对话上下文完整交接；人工优质回复沉淀知识库，AI 越用越聪明。", chips: ["一键转人工", "上下文交接", "知识沉淀"], mock: "product/web-ai-chat-workbench.png" },
    ],
    cases: [
      { img: "generated/gen-airport.jpg", tags: ["地接社", "转化 ×4"], title: "西南地接社：深夜询盘转化率提升 4 倍", desc: "AI 接管凌晨全部咨询，次日销售只跟进高意向线索，成交率翻倍。" },
      { img: "generated/gen-callcenter.jpg", tags: ["旅行社", "降本 60%"], title: "某出境社：接待人力成本下降 60%", desc: "3 人团队承接原需 8 人的咨询量，响应时长从 40 分钟缩至 10 秒。" },
    ],
  },
  {
    slug: "solution-plan",
    bannerBg: "generated/gen-guilin.jpg",
    title: "定制方案生产方案 · 解决方案 · 文数智旅",
    desc: "定制方案生产方案：可视化行程编排 + 资源底价实时同步 + 自动成本核算，10 分钟生成双语行程册与报价。",
    eyebrow: "Solution · Itinerary Production",
    h1: "定制方案生产方案，<br>3 小时的活 10 分钟干完",
    bannerTip: "可视化行程编排 · 资源底价同步 · 自动成本核算 · 双语行程册一键生成",
    painIntro: "方案是定制游的成交武器，但传统生产方式正在成为增长的瓶颈：",
    pains: [
      { c1: "#886FD9", c2: "#392e5b", svg: I.doc, img: "generated/gen-chatdesk.jpg", title: "方案生产全靠手工", desc: "查资源、算成本、排版式、做翻译，一份双语方案 3-5 小时，旺季根本接不过来。" },
      { c1: "#5E75CF", c2: "#273156", svg: I.chart, img: "generated/gen-adsdashboard.jpg", title: "成本报价算不准", desc: "底价散落在供应商微信里，人工加总算错价、漏项、利润率失控时有发生。" },
      { c1: "#5EB7D4", c2: "#274c59", svg: I.user, img: "generated/gen-tea.jpg", title: "质量依赖个人经验", desc: "好方案藏在老顾问脑子里，新人上手半年起步，方案水准参差不齐。" },
    ],
    features: [
      { svg: I.doc, title: "可视化行程编排：像搭积木一样做方案", tip: "拖拽组合景点 / 酒店 / 车辆 / 体验，地图动线实时预览，方案即改即得。", chips: ["拖拽编排", "地图动线", "模板复用", "实时预览"], gallery: ITINERARY_GALLERY },
      { svg: I.globe, title: "资源底价实时同步：报价永远用最新价", tip: "云仓资源库底价实时同步，成本自动汇总，利润率自由调节，一键生成双语 PDF 行程册。", chips: ["底价同步", "自动核算", "利润率调节", "双语 PDF"], mock: "product/web-resource-library.png" },
      { svg: I.star, title: "品牌模板：方案本身就是成交武器", tip: "自定义品牌色、Logo、版式，每一份方案都是统一高水准的品牌输出。", chips: ["品牌模板", "统一视觉", "多版本管理"] },
    ],
    cases: [
      { img: "generated/gen-tea.jpg", tags: ["精品定制", "效率 ×6"], title: "云南精品茶旅：方案交付从 3 天到 10 分钟", desc: "顾问人均日处理方案量从 2 份提升到 12 份，响应速度成为核心竞争力。" },
      { img: "generated/gen-callcenter.jpg", tags: ["旅行社", "零出错"], title: "某出境社：方案报价出错率下降 90%", desc: "自动成本核算取代人工加总，报价错误基本归零。" },
    ],
  },
  {
    slug: "solution-fulfill",
    bannerBg: "generated/gen-airport.jpg",
    title: "履约与服务方案 · 解决方案 · 文数智旅",
    desc: "履约与服务方案：订单全节点追踪 + 资源调度 + 行中服务 + 回访复购，履约差错率降至零。",
    eyebrow: "Solution · Fulfillment & Service",
    h1: "履约与服务方案，<br>把每一个订单交付到完美",
    bannerTip: "订单全节点追踪 · 资源调度 · 行中多语种服务 · 回访复购——口碑就是复购",
    painIntro: "履约是入境游口碑的生命线，一个环节的失误就是一次国际客诉：",
    pains: [
      { c1: "#5E75CF", c2: "#273156", svg: I.doc, img: "generated/gen-airport.jpg", title: "履约靠 Excel + 微信", desc: "定金、资源确认、接送机、导游安排全靠人工跟进，旺季漏单错单频发。" },
      { c1: "#5EB7D4", c2: "#274c59", svg: I.chat, img: "generated/gen-phonechat.jpg", title: "行中服务跟不上", desc: "游客在行程中遇到问题找不到人，多语种服务更是奢望，体验差评直接断送复购。" },
      { c1: "#886FD9", c2: "#392e5b", svg: I.user, img: "generated/gen-callcenter.jpg", title: "服务完就断了联系", desc: "游客回国后没有任何触达，复购和转介绍全靠运气，客户资产白白流失。" },
    ],
    features: [
      { svg: I.shield, title: "订单全节点追踪：异常自动预警", tip: "订单状态、待确认资源、预警与优先级在订单管理页集中查看；定金、车辆、导游等节点仍需进入订单详情核验。", chips: ["订单状态", "资源待确认", "异常预警", "节点可视"], mock: "generated/subpage-reference/order-management.png", alt: "订单管理页：优先级、预警与订单状态列表" },
      { svg: I.chat, title: "行中多语种服务：游客的随身助手", tip: "游客行中任何问题（餐厅推荐、交通指引、紧急求助），文小旅 12 语种 7×24 即时响应。", chips: ["12 语种", "7×24 响应", "紧急升级", "行程提醒"], img: "generated/gen-phonechat.jpg" },
      { svg: I.user, title: "回访与复购：服务结束才是关系开始", tip: "行后自动回访收集评价，游客档案标签化沉淀，节假日营销、新品推荐自动触达，复购率持续提升。", chips: ["自动回访", "标签档案", "复购触达", "转介绍"] },
    ],
    cases: [
      { img: "generated/gen-airport.jpg", tags: ["地接社", "零客诉"], title: "西南地接社：连续 6 个月零客诉", desc: "全部订单节点化管控，旺季人力不变接待量翻倍，履约差错率降至零。" },
      { img: "generated/gen-guilin.jpg", tags: ["景区", "复购 +30%"], title: "桂林文旅集团：老客复购贡献 30% 营收", desc: "客户资产库 + 自动触达，沉睡客户唤醒率达 18%。" },
    ],
  },
  {
    slug: "solution-data",
    bannerBg: "generated/gen-ogbg.jpg",
    title: "全域数据增长方案 · 解决方案 · 文数智旅",
    desc: "全域数据增长方案：获客/接待/转化/履约/复购全链路数据打通，客源国分析 + ROI 可视，数据驱动增长。",
    eyebrow: "Solution · Data-Driven Growth",
    h1: "全域数据增长方案，<br>让每一分投入都有回响",
    bannerTip: "全链路数据打通 · 客源国分析 · ROI 实时可视——从拍脑袋到数据驱动",
    painIntro: "入境游链条长、环节多，没有数据打通的经营就像蒙眼开车：",
    pains: [
      { c1: "#5E75CF", c2: "#273156", svg: I.chart, img: "generated/gen-adsdashboard.jpg", title: "数据断成几截", desc: "广告数据在媒体后台、询盘在客服微信、成交在 Excel——谁也说不清哪个渠道真正赚钱。" },
      { c1: "#886FD9", c2: "#392e5b", svg: I.clock, img: "generated/gen-callcenter.jpg", title: "决策全凭感觉", desc: "哪个客源国 ROI 最高？哪条产品线转化最好？没有数据支撑，预算分配靠拍脑袋。" },
      { c1: "#5EB7D4", c2: "#274c59", svg: I.user, img: "generated/gen-phonechat.jpg", title: "客户资产流失", desc: "服务过的游客没有沉淀，复购转介绍全靠销售个人记忆，人走客户就丢。" },
    ],
    features: [
      { svg: I.chart, title: "全链路数据看板：曝光到回款一屏看清", tip: "广告消耗 → 落地页访问 → 留资 → 询盘 → 成交 → 回款，每个环节的转化率与成本实时可视。", chips: ["渠道归因", "漏斗分析", "ROI 实时", "成本可视"], mock: "product/web-dashboard-overview.png" },
      { svg: I.globe, title: "客源国分析：找到你的高价值市场", tip: "按客源国拆解获客成本、询盘质量、成交客单价，指导预算向高价值市场倾斜。", chips: ["分国别 ROI", "质量评分", "增长监测", "预算建议"] },
      { svg: I.user, title: "客户资产库：复购与转介绍引擎", tip: "游客标签化档案自动沉淀，节假日营销、新品推荐、复购提醒全自动执行。", chips: ["标签档案", "复购触达", "转介绍裂变", "沉睡唤醒"] },
    ],
    cases: [
      { img: "generated/gen-guilin.jpg", tags: ["景区", "ROI ×2.3"], title: "桂林文旅集团：投放 ROI 提升 2.3 倍", desc: "按客源国数据重分配预算，砍掉低效渠道，整体 ROI 翻倍。" },
      { img: "generated/gen-callcenter.jpg", tags: ["旅行社", "复购 30%"], title: "某出境社：老客复购贡献 30% 营收", desc: "客户资产库 + 自动触达体系，沉睡客户唤醒率 18%。" },
    ],
  },
  {
    slug: "product-wenxiaolv",
    bannerBg: "generated/gen-agent-main.jpg",
    title: "文小旅 · AI 接待官 · 文数智旅",
    desc: "文小旅：7×24 多语种 AI 接待官，询盘归集、智能挖需、线索分级、一键转人工，深夜商机不再流失。",
    eyebrow: "Product · AI Reception Agent",
    h1: "文小旅，<br>你的 7×24 多语种 AI 接待官",
    bannerTip: "官网 / 社媒 / 邮件 / WhatsApp 全渠道询盘归集，12 语种秒级应答，深夜商机不再流失",
    painIntro: "入境游的咨询发生在全球每一个时区，而人工客服的在线时长注定无法覆盖——这正是文小旅要解决的问题：",
    pains: [
      { c1: "#5EB7D4", c2: "#274c59", svg: I.clock, img: "generated/gen-chatdesk.jpg", title: "60% 询盘发生在非工作时间", desc: "欧美游客的白天是国内深夜，人工客服不在线，高意向商机在黎明前流失。" },
      { c1: "#5E75CF", c2: "#273156", svg: I.globe, img: "generated/gen-phonechat.jpg", title: "小语种咨询接不住", desc: "法语、西语、阿语游客的咨询，靠翻译软件来回转述，需求理解偏差导致报价失误。" },
      { c1: "#886FD9", c2: "#392e5b", svg: I.user, img: "generated/gen-callcenter.jpg", title: "客服质量参差不齐", desc: "优秀客服的话术与资源知识无法复制，旺季临时扩招的客服答非所问，拉低整体转化。" },
    ],
    features: [
      { svg: I.chat, title: "全渠道询盘归集：一个后台全管理", tip: "官网表单、社媒私信、邮件、WhatsApp 咨询统一汇聚到文小旅工作台，每一条询盘都有归属、有状态、有跟进记录。", chips: ["官网表单", "社媒私信", "邮件", "WhatsApp", "状态追踪"], img: "generated/gen-chatdesk.jpg" },
      { svg: I.bolt, title: "12 语种秒级应答：基于你的真实资源", tip: "文小旅接入你的线路库、价格表、FAQ，用游客的母语秒级应答——不是通用客服，是懂你家生意的接待官。", chips: ["12 语种", "资源库驱动", "秒级响应", "品牌话术"], img: "generated/gen-phonechat.jpg" },
      { svg: I.user, title: "智能挖需与线索分级", tip: "从对话中自动提取人数 / 日期 / 预算 / 偏好，按意向度自动分级：高意向直达销售微信，低意向进入培育池。", chips: ["需求结构化", "意向分级", "高意向直达", "培育池"] },
      { svg: I.shield, title: "人机协同：AI 搞不定的，无缝转人工", tip: "复杂定制需求一键转人工，对话上下文完整交接，客户无感知；人工回复沉淀为知识库，AI 越用越聪明。", chips: ["一键转人工", "上下文交接", "知识沉淀", "持续学习"], mock: "product/web-ai-chat-workbench.png" },
    ],
    cases: [
      { img: "generated/gen-airport.jpg", tags: ["地接社", "夜间拦截"], title: "西南地接社：深夜询盘转化率提升 4 倍", desc: "文小旅接管凌晨全部咨询，自动完成需求挖掘与初轮报价。" },
      { img: "generated/gen-callcenter.jpg", tags: ["国际旅行社", "降本增效"], title: "某头部出境社：接待人力成本下降 60%", desc: "3 人客服团队承接原需 8 人的咨询量，响应时长从 40 分钟缩至 10 秒。" },
    ],
  },
  {
    slug: "product-itinerary",
    bannerBg: "generated/gen-guilin.jpg",
    title: "智策 · 智能方案生成 · 文数智旅",
    desc: "智策：AI 智能方案生成系统，拖拽式行程编排 + 资源底价实时同步，10 分钟生成双语行程册与报价。",
    eyebrow: "Product · AI Itinerary Builder",
    h1: "智策，<br>10 分钟出一份双语行程册",
    bannerTip: "可视化行程编排 · 资源底价实时同步 · 一键双语报价——3 小时的活，10 分钟干完",
    painIntro: "定制方案是入境游成交的关键一环，但传统生产方式正在拖垮你的响应速度：",
    pains: [
      { c1: "#886FD9", c2: "#392e5b", svg: I.doc, img: "generated/gen-chatdesk.jpg", title: "方案生产全靠手工", desc: "查资源、算成本、排版式、做翻译，一份双语行程册动辄 3-5 小时，旺季咨询量翻倍时直接瘫痪。" },
      { c1: "#5E75CF", c2: "#273156", svg: I.chart, img: "generated/gen-adsdashboard.jpg", title: "成本核算不准确", desc: "资源底价散落在供应商微信里，人工逐项加总，报错价、漏项、利润率失控时有发生。" },
      { c1: "#5EB7D4", c2: "#274c59", svg: I.user, img: "generated/gen-tea.jpg", title: "方案质量看个人", desc: "好方案藏在老顾问的脑子里，新人上手慢，方案水准忽高忽低，品牌形象不统一。" },
    ],
    features: [
      { svg: I.doc, title: "可视化行程编排：像搭积木一样做方案", tip: "拖拽组合景点 / 酒店 / 车辆 / 体验，地图动线实时预览，方案即改即得，无需任何设计基础。", chips: ["拖拽编排", "地图动线", "模板复用", "实时预览"], gallery: ITINERARY_GALLERY },
      { svg: I.chart, title: "自动成本核算：利润率自由调节", tip: "接入云仓资源底价，成本自动汇总，按客户类型调节利润率，一键生成中英双语 PDF 行程册与报价单。", chips: ["底价实时同步", "自动汇总", "利润率调节", "双语 PDF"] },
      { svg: I.star, title: "品牌模板：每一份方案都是品牌广告", tip: "自定义品牌色、Logo、版式模板，输出统一高水准的方案视觉，让报价单本身成为成交武器。", chips: ["品牌模板", "统一视觉", "多版本管理"] },
    ],
    cases: [
      { img: "generated/gen-tea.jpg", tags: ["精品定制", "效率提升"], title: "云南精品茶旅：方案交付从 3 天到 10 分钟", desc: "顾问人均日处理方案量从 2 份提升到 12 份，方案响应速度成为核心竞争力。" },
      { img: "generated/gen-callcenter.jpg", tags: ["国际旅行社", "规模化"], title: "某头部出境社：方案出错率下降 90%", desc: "成本自动核算取代人工加总，报价错误基本归零。" },
    ],
  },
  {
    slug: "product-resource",
    bannerBg: "generated/gen-airport.jpg",
    title: "云仓 · 旅游资源库 · 文数智旅",
    desc: "云仓：入境游资源一站式管理平台，线路/酒店/车辆/地接资源数字化，底价实时同步，履约节点全程可视。",
    eyebrow: "Product · Resource Cloud",
    h1: "云仓，<br>把你的旅游资源全部数字化",
    bannerTip: "线路 / 酒店 / 车辆 / 地接一站式管理 · 底价实时同步 · 履约节点全程可视",
    painIntro: "资源是入境游生意的底盘，但大多数机构的资源管理还停留在 Excel + 微信时代：",
    pains: [
      { c1: "#5E75CF", c2: "#273156", svg: I.doc, img: "generated/gen-adsdashboard.jpg", title: "资源散落在各处", desc: "酒店协议价在微信里、车队报价在 Excel 里、地接联系方式在名片夹里，每次做方案都要翻半天。" },
      { c1: "#886FD9", c2: "#392e5b", svg: I.clock, img: "generated/gen-chatdesk.jpg", title: "价格更新滞后", desc: "供应商调价靠口头通知，旧价格做出的方案要么亏本要么丢单，旺季尤其致命。" },
      { c1: "#5EB7D4", c2: "#274c59", svg: I.shield, img: "generated/gen-airport.jpg", title: "履约靠人盯", desc: "定金、资源确认、接送安排全靠人工跟进，一个环节漏掉就是一次客诉。" },
    ],
    features: [
      { svg: I.globe, title: "资源一站式管理：一个库装下全部家底", tip: "线路、酒店、车辆、导游、体验项目统一入库，结构化字段 + 多语言描述，随取随用。", chips: ["线路库", "酒店库", "车辆库", "体验项目", "多语言描述"], mock: "product/web-resource-library.png" },
      { svg: I.bolt, title: "底价实时同步：方案报价永远用最新价", tip: "供应商价格更新即时同步到资源库，智策方案生成自动取用最新底价，杜绝亏本报价。", chips: ["价格实时同步", "变更记录", "有效期管理"] },
      { svg: I.shield, title: "履约节点管控：从定金到回访全程可视", tip: "每个订单的定金到账、资源确认、车辆调度、导游排班、行后回访全部节点化追踪，异常自动预警。", chips: ["节点追踪", "异常预警", "导游排班", "行后回访"] },
    ],
    cases: [
      { img: "generated/gen-airport.jpg", tags: ["地接社", "履约管控"], title: "西南地接社：履约差错率降至 0", desc: "全部订单节点化管控后，连续 6 个月零客诉，旺季人力不变接待量翻倍。" },
      { img: "generated/gen-guilin.jpg", tags: ["景区", "资源打通"], title: "桂林文旅集团：200+ 资源一库管理", desc: "分散在 8 个部门的资源统一入库，方案生成效率提升 5 倍。" },
    ],
  },
  {
    slug: "product-growth",
    bannerBg: "generated/gen-adsdashboard.jpg",
    title: "全域增长引擎 · 文数智旅",
    desc: "全域增长引擎：入境游海外获客系统，Google/Meta/TikTok 广告投放 + 内容种草 + 私域承接，获客成本降 60%。",
    eyebrow: "Product · Growth Engine",
    h1: "全域增长引擎，<br>把海外获客成本打下来",
    bannerTip: "Google / Meta / TikTok 全域投放 · 内容种草 · 私域承接——获客成本直降 60%+",
    painIntro: "入境游回暖，但海外流量的游戏规则和国内完全不同，传统打法正在失效：",
    pains: [
      { c1: "#5E75CF", c2: "#273156", svg: I.trend, img: "generated/gen-callcenter.jpg", title: "OTA 抽成吃掉利润", desc: "依赖 OTA 平台的订单，15-25% 的佣金让利润所剩无几，客户数据还全部归平台。" },
      { c1: "#5EB7D4", c2: "#274c59", svg: I.globe, img: "generated/gen-adsdashboard.jpg", title: "海外投放是黑盒", desc: "Google/Meta 广告规则复杂，不懂海外投放逻辑的钱花出去了，询盘没几个。" },
      { c1: "#886FD9", c2: "#392e5b", svg: I.chat, img: "generated/gen-phonechat.jpg", title: "流量来了接不住", desc: "好不容易引来的流量，落地页没有多语种留资能力，游客看完就走，转化率不到 1%。" },
    ],
    features: [
      { svg: I.trend, title: "全域广告投放：精准触达高意向游客", tip: "Google 搜索截流 + Meta/TikTok 兴趣定向 + Instagram 视觉种草，按客源国、兴趣、出行意向精准投放。", chips: ["Google 截流", "Meta 定向", "TikTok 种草", "按客源国投放"], gallery: META_GALLERY },
      { svg: I.doc, title: "多语种落地页：3 秒进入私域", tip: "高转化落地页模板 + 结构化留资表单，游客提交后 3 秒内自动进入 WhatsApp 私域承接，不错过任何商机。", chips: ["落地页模板", "结构化留资", "WhatsApp 承接", "3 秒响应"], img: "generated/gen-phonechat.jpg" },
      { svg: I.chart, title: "投放透明可查：每一分钱都知道花在哪", tip: "广告费直充你的官方媒体后台，消耗明细实时可查，我们只赚与效果绑定的服务费。", chips: ["官方后台直充", "明细实时可查", "效果绑定分成"] },
    ],
    cases: [
      { img: "generated/gen-callcenter.jpg", tags: ["国际旅行社", "降本"], title: "某头部出境社：获客成本下降 62%", desc: "3 个月海外询盘量翻 3 倍，单条线索成本从 ¥180 降至 ¥68。" },
      { img: "generated/gen-tea.jpg", tags: ["精品旅游", "品牌溢价"], title: "云南精品茶旅：内容种草打入欧美市场", desc: "小众目的地通过 Instagram 内容营销触达高净值客群，客单价提升 40%。" },
    ],
  },
  {
    slug: "product-insight",
    bannerBg: "generated/gen-ogbg.jpg",
    title: "数据罗盘 · 文数智旅",
    desc: "数据罗盘：入境游全链路数据看板，获客/接待/转化/履约/复购数据打通，ROI 全链路可视。",
    eyebrow: "Product · Data Compass",
    h1: "数据罗盘，<br>让每一分投入都有回响",
    bannerTip: "获客 / 接待 / 转化 / 履约 / 复购全链路打通——从广告消耗到成交回款，一屏看清",
    painIntro: "入境游生意的链条长、环节多，没有数据打通的经营就像蒙眼开车：",
    pains: [
      { c1: "#5E75CF", c2: "#273156", svg: I.chart, img: "generated/gen-adsdashboard.jpg", title: "数据断成几截", desc: "广告数据在媒体后台、询盘数据在客服微信、成交数据在 Excel，谁也说不清哪个渠道真正赚钱。" },
      { c1: "#886FD9", c2: "#392e5b", svg: I.clock, img: "generated/gen-chatdesk.jpg", title: "复盘靠拍脑袋", desc: "哪个客源国 ROI 最高？哪个产品线转化最好？没有数据支撑，决策全凭感觉。" },
      { c1: "#5EB7D4", c2: "#274c59", svg: I.user, img: "generated/gen-callcenter.jpg", title: "客户资产流失", desc: "服务过的游客没有沉淀，复购和转介绍全靠销售个人记忆，人走客户就丢。" },
    ],
    features: [
      { svg: I.chart, title: "全链路看板：从曝光到回款一屏看清", tip: "广告消耗 → 落地页访问 → 留资 → 询盘 → 成交 → 回款，每个环节的转化率与成本实时可视。", chips: ["渠道归因", "漏斗分析", "ROI 实时", "成本可视"], mock: "product/web-dashboard-overview.png" },
      { svg: I.globe, title: "客源国分析：找到你的高价值市场", tip: "按客源国拆解获客成本、询盘质量、成交客单价，指导下一轮投放预算分配。", chips: ["客源国拆解", "客单价分析", "预算建议"] },
      { svg: I.user, title: "客户资产库：复购与转介绍自动触达", tip: "服务过的游客自动沉淀为标签化档案，节假日营销、新品推荐、复购提醒全自动执行。", chips: ["标签档案", "复购触达", "转介绍裂变"] },
    ],
    cases: [
      { img: "generated/gen-guilin.jpg", tags: ["景区", "数据决策"], title: "桂林文旅集团：投放 ROI 提升 2.3 倍", desc: "按客源国数据重分配预算后，砍掉低效渠道，整体 ROI 翻倍。" },
      { img: "generated/gen-callcenter.jpg", tags: ["旅行社", "复购增长"], title: "某出境社：老客复购贡献 30% 营收", desc: "客户资产库 + 自动触达，沉睡客户唤醒率达 18%。" },
    ],
  },
];

/* ---------- 7. cases.html（案例列表页，brandcase-all 版式） ---------- */
const CASES_LIST = [
  { img: "generated/home-cases/airport-departure-group.png", tags: ["国际旅行社", "规模化引流"], title: "某头部出境社：入境游获客成本下降 62%", sum: "通过全域广告投放 + AI 接待链路，3 个月内海外询盘量翻 3 倍，单条线索成本从 ¥180 降至 ¥68。", date: "2026-06" },
  { img: "generated/home-cases/airport-checkin-group.png", tags: ["地接社", "响应提速"], title: "西南地接社：深夜询盘转化率提升 4 倍", sum: "文小旅 7×24 接管夜间咨询，自动完成需求挖掘与初轮报价，销售次日只跟进高意向线索。", date: "2026-05" },
  { img: "generated/home-cases/tour-shuttle.png", tags: ["精品定制", "高净值客群"], title: "云南精品茶旅：方案交付从 3 天到 10 分钟", sum: "AI 方案生成 + 资源池打通后，顾问人均日处理方案量从 2 份提升到 12 份，客单价提升 40%。", date: "2026-04" },
  { img: "generated/home-cases/sun-moon-mountain.png", tags: ["景区", "国际客流"], title: "桂林文旅集团：入境游客接待量翻倍", sum: "目的地内容营销 + 多语种 AI 接待，6 个月内入境散客占比从 8% 提升至 23%。", date: "2026-03" },
];

function casesPage() {
  const items = CASES_LIST.map(c => `
    <a class="cl-item reveal" data-lead data-source="cases-list" data-title="获取增长方案">
      <img src="../assets/${c.img}" alt="${c.title}" loading="lazy">
      <div class="cl-body">
        <div class="cl-title">${c.title}</div>
        <div class="cl-sum">${c.sum}</div>
        <div class="cl-meta">${c.tags.map(t => `<span class="ci-tag">${t}</span>`).join("")}<span>${c.date}</span></div>
      </div>
    </a>`).join("");
  return `
<section class="sp-banner">
  <div class="sp-banner-in">
    <span class="eyebrow-w">Customer Stories</span>
    <h1 class="title">文数智旅为你<br>接住全球客源</h1>
    <div class="tip">从全球获客到落地接待，连接每一段真实旅程</div>
    <button class="link-btn" data-lead data-source="cases-banner" data-title="获取专属增长方案"><span>获取专属增长方案</span><span class="arr">→</span></button>
  </div>
</section>
<div class="sp-content">
  <div class="cl-list">${items}
  </div>
</div>`;
}

/* ---------- 7b. AI能力 / 大数据能力 页（technology 版式） ---------- */
const TECH_PAGES = [
  /* ===== AI能力组 ===== */
  {
    slug: "tech-multilingual",
    demo: {
      img: "generated/gen-chatdesk.jpg", title: "多语种接待",
      desc: "点击对话中的标注点，看文小旅如何用游客的母语实时应答——术语准确、语气自然、意图完整识别。",
      tags: ["12 语种", "术语级翻译", "意图识别"],
      marks: [
        { x: 22, y: 30, title: "英语咨询", desc: "美国游客询问家庭亲子行程，AI 识别出 2 大 2 小、暑期出行、偏好自然体验。" },
        { x: 55, y: 48, title: "日语咨询", desc: "日本游客确认温泉酒店房型，AI 用敬语回答并引用资源库真实房态。" },
        { x: 78, y: 68, title: "阿语咨询", desc: "中东游客询问清真餐安排，AI 自动匹配清真餐厅资源并标注礼拜时间。" },
      ],
    },
    bannerBg: "generated/gen-phonechat.jpg",
    title: "多语种理解与生成 · AI 能力 · 文数智旅",
    desc: "文数智旅多语种 AI 能力：12 语种旅游语义理解与生成，行程术语级准确，母语级应答海外游客。",
    eyebrow: "AI Capability · Multilingual",
    h1: "多语种旅游语义理解与生成",
    bannerTip: "12 语种母语级应答 · 旅游术语级准确 · 品牌话术风格统一——让每一次跨语言沟通都像本地人在服务",
    advIntro: "通用翻译工具能翻字，翻不了旅游生意。我们的多语种能力为入境游场景深度训练：",
    advantages: [
      { svg: I.globe, title: "12 语种覆盖", sub: "英/日/韩/法/德/西/俄/阿/泰/越/印尼/葡，覆盖 90% 入境客源国" },
      { svg: I.bolt, title: "旅游术语级准确", sub: "行程、房型、接送、签证等专业表达经旅游语料训练，不产生歧义" },
      { svg: I.user, title: "品牌话术统一", sub: "按你的品牌语气生成回复，每位游客收到的都是统一水准的服务" },
      { svg: I.shield, title: "合规安全", sub: "敏感词过滤 + 事实校验双重护栏，价格政策类回答以你的资源库为准" },
    ],
    sceneIntro: "从首次咨询到行中服务，多语种能力贯穿游客全旅程：",
    scenes: [
      { img: "generated/gen-chatdesk.jpg", title: "全渠道多语种接待", desc: "官网、WhatsApp、社媒私信的各语种咨询统一应答，游客用母语提问，AI 用母语回答。" },
      { img: "generated/gen-phonechat.jpg", title: "行中实时助手", desc: "游客行中提问（餐厅推荐、交通指引、紧急求助），文小旅 7×24 即时响应。" },
      { img: "generated/gen-tea.jpg", title: "双语方案与合同", desc: "行程册、报价单、合同条款自动生成双语版本，术语前后一致。" },
      { img: "generated/gen-callcenter.jpg", title: "营销内容本地化", desc: "落地页、广告文案、社媒内容一键生成目标客源国语言版本，不止是翻译，是本地化改写。" },
    ],
  },
  {
    slug: "tech-mining",
    demo: {
      img: "generated/gen-callcenter.jpg", title: "游客挖需交流",
      desc: "拆解专业交流话术与客户心理，从对话提取旅行需求，匹配相应方案，并用贴近需求的案例促成沟通。",
      tags: ["需求提取", "方案匹配", "案例促成交"],
      marks: [
        { x: 25, y: 35, title: "提取旅行需求", desc: "从对话识别目的地、日期、人数、预算与偏好，避免反复追问。" },
        { x: 52, y: 50, title: "理解客户心理", desc: "辨别顾虑、决策阶段与关注点，建议顾问选择更合适的沟通方式。" },
        { x: 76, y: 62, title: "匹配案例促成交", desc: "把已确认的需求与可用方案、相关案例连接，交给顾问继续跟进。" },
      ],
    },
    bannerBg: "generated/gen-chatdesk.jpg",
    title: "智能挖需与画像 · AI 能力 · 文数智旅",
    desc: "文数智旅智能挖需能力：从对话自动提取人数/日期/预算/偏好，构建游客画像，线索意向度自动分级。",
    eyebrow: "AI Capability · Intent Mining",
    h1: "智能挖需与游客画像",
    bannerTip: "对话中自动提取结构化需求 · 意向度智能分级 · 高意向线索直达销售",
    advIntro: "销售的黄金时间应该花在最有价值的线索上。智能挖需让 AI 先完成筛选：",
    advantages: [
      { svg: I.user, title: "结构化挖需", sub: "从自然对话中自动提取人数 / 日期 / 预算 / 偏好 / 特殊需求 5 大维度" },
      { svg: I.trend, title: "意向度分级", sub: "按对话深度、预算明确度、时间紧迫度三维度自动打分分级" },
      { svg: I.bolt, title: "秒级画像生成", sub: "对话结束即生成完整游客画像卡，销售接手零信息损耗" },
      { svg: I.chat, title: "上下文记忆", sub: "跨会话记忆游客历史咨询，二次咨询无需重复描述需求" },
    ],
    sceneIntro: "让每一条线索都被正确的人、在正确的时间跟进：",
    scenes: [
      { img: "generated/gen-callcenter.jpg", title: "高意向直达销售", desc: "识别出明确出行日期 + 预算的游客，立即推送销售微信并附完整画像。" },
      { img: "generated/gen-phonechat.jpg", title: "低意向自动培育", desc: "观望期游客进入培育池，按兴趣标签自动推送目的地内容与促销信息。" },
      { img: "generated/gen-airport.jpg", title: "团队需求拆解", desc: "20 人团的复杂需求自动拆解为房间数、房型、餐标、特殊人员等结构化字段。" },
      { img: "generated/gen-tea.jpg", title: "偏好沉淀复用", desc: "游客的饮食禁忌、出行风格、体验偏好沉淀为档案，复购时自动加载。" },
    ],
  },
  {
    slug: "tech-knowledge",
    demo: {
      img: "generated/gen-guilin.jpg", title: "知识增强应答",
      desc: "点击标注点，看 AI 回答如何逐条引用你资源库中的真实线路与政策，杜绝编造。",
      tags: ["资源库引用", "零幻觉", "可溯源"],
      marks: [
        { x: 28, y: 32, title: "线路引用", desc: "游客问「桂林 5 日游」，AI 直接引用资源库 GL-05 线路的行程与当季价格。" },
        { x: 55, y: 52, title: "政策引用", desc: "退改规则逐字引用你的官方政策文本，一个字都不生成。" },
        { x: 74, y: 70, title: "诚实拒答", desc: "库里没有的线路，AI 明确说「这条线路顾问稍后为您确认」，不编造。" },
      ],
    },
    bannerBg: "generated/gen-guilin.jpg",
    title: "资源库知识增强 · AI 能力 · 文数智旅",
    desc: "文数智旅知识增强能力：AI 回答基于你的真实线路/价格/政策资源库，不编造、不幻觉，答案可溯源。",
    eyebrow: "AI Capability · Knowledge Grounding",
    h1: "基于你真实资源库的 AI 应答",
    bannerTip: "回答以你的线路 / 价格 / 政策为准 · 不编造 · 可溯源——AI 说的是你家的生意",
    advIntro: "通用 AI 客服最大的风险是「一本正经地胡说八道」。知识增强从源头解决这个问题：",
    advantages: [
      { svg: I.doc, title: "资源库驱动", sub: "回答严格基于你接入的线路库、价格表、FAQ，库里没有的明确说不知道" },
      { svg: I.shield, title: "零幻觉护栏", sub: "价格、政策、档期类关键信息只做检索不做生成，杜绝编造" },
      { svg: I.bolt, title: "实时更新", sub: "资源库调价、线路上下架即时生效，AI 回答永远用最新信息" },
      { svg: I.chart, title: "答案可溯源", sub: "每条 AI 回答可查看引用的资源条目，质检与培训有据可查" },
    ],
    sceneIntro: "把企业知识变成 AI 的确定性回答：",
    scenes: [
      { img: "generated/gen-guilin.jpg", title: "线路咨询应答", desc: "游客问「桂林 5 日游多少钱」，AI 直接引用你资源库里的真实线路与当季价格回答。" },
      { img: "generated/gen-chatdesk.jpg", title: "政策类精准回答", desc: "签证政策、退改规则、儿童收费等关键问题，逐字引用你的官方政策文本。" },
      { img: "generated/gen-callcenter.jpg", title: "新员工知识外挂", desc: "新客服借助 AI 推荐话术，回答水准即刻对齐老员工。" },
      { img: "generated/gen-phonechat.jpg", title: "越用越聪明", desc: "人工客服的优质回复自动沉淀入知识库，AI 能力随业务持续进化。" },
    ],
  },
  /* ===== 大数据能力组 ===== */
  {
    slug: "data-trends",
    demo: {
      img: "generated/gen-adsdashboard.jpg", title: "趋势看板",
      desc: "点击标注点，看趋势数据如何指导产品决策——从搜索量变化到爆款信号预警。",
      tags: ["周级更新", "热度榜", "信号预警"],
      marks: [
        { x: 24, y: 30, title: "搜索趋势", desc: "「China itinerary」全球搜索量 8 周连涨，暑期产品窗口确认。" },
        { x: 50, y: 48, title: "目的地热度", desc: "张家界在韩国市场搜索量月增 140%，建议打包进韩语线路。" },
        { x: 76, y: 66, title: "爆款预警", desc: "「144 小时过境免签」社媒声量激增，触发产品上线提醒。" },
      ],
    },
    bannerBg: "generated/gen-adsdashboard.jpg",
    title: "入境游趋势洞察 · 大数据能力 · 文数智旅",
    desc: "文数智旅趋势洞察：全球客源国搜索趋势、目的地热度、产品偏好数据，帮你提前布局下一个爆款。",
    eyebrow: "Big Data · Travel Trends",
    h1: "入境游趋势洞察",
    bannerTip: "全球客源国搜索趋势 · 目的地热度追踪 · 产品偏好变化——比同行早 3 个月看见机会",
    advIntro: "入境游的产品决策不该靠赌。趋势数据让每一次产品开发都有依据：",
    advantages: [
      { svg: I.trend, title: "搜索趋势追踪", sub: "全球主要客源国对中国目的地的搜索量、关键词变化周级更新" },
      { svg: I.globe, title: "目的地热度榜", sub: "城市 / 景区 / 体验项目三级热度榜，发现正在起量的新兴目的地" },
      { svg: I.user, title: "客群偏好画像", sub: "不同客源国游客的行程天数、预算区间、体验偏好交叉分析" },
      { svg: I.bolt, title: "爆款信号预警", sub: "社媒声量异常增长的目的地 / 玩法自动预警，抢占产品先机" },
    ],
    sceneIntro: "从产品规划到营销投放，数据先行：",
    scenes: [
      { img: "generated/gen-adsdashboard.jpg", title: "新产品立项决策", desc: "开发中亚产品线前，先看中亚客源国的搜索趋势与竞争密度数据。" },
      { img: "generated/gen-guilin.jpg", title: "目的地打包组合", desc: "按热度趋势把上升期目的地打包进经典线路，提升产品吸引力。" },
      { img: "generated/gen-callcenter.jpg", title: "投放市场选择", desc: "按各客源国的搜索量增速与 CPC 成本选择下一季度主攻市场。" },
      { img: "generated/gen-tea.jpg", title: "内容选题指导", desc: "按海外社媒的热门话题趋势规划内容选题，蹭对流量风口。" },
    ],
  },
  {
    slug: "data-source",
    demo: {
      img: "generated/gen-airport.jpg", title: "客源国对比",
      desc: "点击标注点，看不同客源国的获客成本、转化率与客单价差异。",
      tags: ["分国别 ROI", "质量评分", "增长监测"],
      marks: [
        { x: 25, y: 35, title: "北美市场", desc: "获客成本 ¥210/线索，客单价 ¥28,000，ROI 1:8.5——高价值深耕市场。" },
        { x: 52, y: 52, title: "东南亚市场", desc: "获客成本 ¥45/线索，客单价 ¥6,800，ROI 1:4.2——走量市场。" },
        { x: 75, y: 65, title: "中东市场", desc: "免签新政后询盘量月增 220%，客单价 ¥35,000——建议立即加大投放。" },
      ],
    },
    bannerBg: "generated/gen-airport.jpg",
    title: "客源国分析 · 大数据能力 · 文数智旅",
    desc: "文数智旅客源国分析：按国家拆解获客成本、询盘质量、成交客单价，找到你的高价值市场。",
    eyebrow: "Big Data · Source Markets",
    h1: "客源国分析",
    bannerTip: "按客源国拆解获客成本 / 询盘质量 / 成交客单价——把预算花在最值钱的市场",
    advIntro: "同样是海外投放，美国客和东南亚客的价值天差地别。客源国分析帮你算清这笔账：",
    advantages: [
      { svg: I.globe, title: "分国别 ROI", sub: "每个客源国的获客成本、转化率、客单价、利润率全链路拆解" },
      { svg: I.chart, title: "质量评分", sub: "按询盘意向度、成交周期、复购率给每个市场打质量分" },
      { svg: I.trend, title: "增长监测", sub: "客源国月度增速监测，新崛起市场（如免签新政国）自动提醒" },
      { svg: I.user, title: "客群对比", sub: "不同市场游客的偏好差异对比，指导产品差异化设计" },
    ],
    sceneIntro: "让每一分投放预算都有国别归属：",
    scenes: [
      { img: "generated/gen-adsdashboard.jpg", title: "预算再分配", desc: "发现中东客客单价是东南亚客的 3 倍？下季度预算立刻向高价值市场倾斜。" },
      { img: "generated/gen-airport.jpg", title: "免签政策红利", desc: "某国免签新政出台后，该市场搜索量激增——第一时间加大投放抢红利。" },
      { img: "generated/gen-callcenter.jpg", title: "语种人力规划", desc: "按各语种询盘量配置接待资源，小语种市场用 AI 全覆盖。" },
      { img: "generated/gen-guilin.jpg", title: "产品本地化", desc: "穆斯林客源国自动匹配清真餐、礼拜时间安排等产品要素。" },
    ],
  },
  {
    slug: "data-social",
    socialGallery: {
      social: true,
      label: "China Travel 真实社媒截图",
      source: "以下为 Facebook 页面截图，保留原页面内容及可见互动信息；点击「查看原图」可放大阅读。",
      slides: [
        { img: "generated/social-china-travel/xiangxi-video-post.png", title: "湘西短视频", desc: "从目的地画面与互动区观察旅行兴趣", alt: "湘西旅行短视频帖子截图" },
        { img: "generated/social-china-travel/zhangjiajie-creator-post.png", title: "创作者笔记", desc: "观察达人叙事、画面选择与受众回应", alt: "张家界旅行创作者帖子截图" },
        { img: "generated/social-china-travel/shanghai-video-post.png", title: "上海城市影像", desc: "比较城市夜景类内容的呈现方式", alt: "上海旅行视频帖子截图" },
        { img: "generated/social-china-travel/beijing-itinerary-post.png", title: "北京线路图文", desc: "观察多景点行程怎样被组织成一篇帖子", alt: "北京与长城旅行路线图文帖截图" },
        { img: "generated/social-china-travel/facebook-groups.png", title: "社群入口", desc: "从 China Travel 相关社群了解讨论场景", alt: "China Travel Facebook 社群搜索结果截图" },
      ],
    },
    socialReel: [
      { img: "generated/social-china-travel/instagram-reels-grid.png", title: "城市与山海短视频合集", caption: "账号主页截图 · 原图可查看各条播放量", alt: "China Travel 城市与山海短视频主页截图" },
      { img: "generated/social-china-travel/instagram-wanglanggui.png", title: "望郎归海景", caption: "目的地风景短视频截图", alt: "望郎归海景 Instagram 短视频截图" },
      { img: "generated/social-china-travel/instagram-shenzhen-night.png", title: "深圳城市夜景", caption: "夜间城市影像截图", alt: "深圳城市夜景 Instagram 短视频截图" },
      { img: "generated/social-china-travel/instagram-shenzhen-sunset.png", title: "深圳日落天际线", caption: "色彩与地标叙事截图", alt: "深圳日落 Instagram 短视频截图" },
      { img: "generated/social-china-travel/instagram-guangzhou.png", title: "广州夜间漫步", caption: "城市体验短视频截图", alt: "广州夜间漫步 Instagram 短视频截图" },
      { img: "generated/social-china-travel/instagram-shenzhen-landmark.png", title: "深圳地标影像", caption: "地标视觉短视频截图", alt: "深圳地标 Instagram 短视频截图" },
      { img: "generated/social-china-travel/instagram-shenzhen-high-engagement.png", title: "深圳日落互动样本", caption: "互动信息以截图采集时为准", alt: "深圳日落较高互动 Instagram 短视频截图" },
    ],
    creatorOutreach: true,
    title: "海外社媒洞察 · 大数据能力 · 文数智旅",
    desc: "从真实 China Travel 社媒内容观察目的地热度、创作灵感与达人合作线索。",
    eyebrow: "Big Data · Social Listening",
    h1: "海外社媒洞察",
    bannerTip: "看见 China Travel 讨论正在发生什么，把真实内容信号转化为选题、合作与服务动作",
    advIntro: "从话题、内容、创作者和反馈四个视角整理社媒信号：",
    advantages: [
      { svg: I.chat, title: "讨论观察", sub: "按目的地、语种和话题整理公开讨论，辨别游客在问什么" },
      { svg: I.star, title: "内容拆解", sub: "对照真实帖子，分析画面、文案与旅行路线如何吸引关注" },
      { svg: I.user, title: "创作者发现", sub: "记录有中国旅行内容的账号，再人工核验受众与合作适配度" },
      { svg: I.bolt, title: "反馈跟进", sub: "将评论与私信中的问题归类，交给负责人核实和回访" },
    ],
    sceneIntro: "从看见一条帖子，到做出下一步动作：",
    socialScenes: [
      { title: "蹭对热点", desc: "观察目的地短视频与旅行帖的主题变化，先核验旅行信息，再决定要不要跟进选题。", images: [
        { src: "generated/social-china-travel/xiangxi-video-post.png", alt: "湘西旅行视频帖" },
        { src: "generated/social-china-travel/zhangjiajie-autumn-post.png", alt: "张家界秋季旅行图文帖" },
      ] },
      { title: "内容创作灵感", desc: "比较城市夜景、山水景观与路线讲述的拍法，为自己的目的地内容建立素材清单。", images: [
        { src: "generated/social-china-travel/shanghai-video-post.png", alt: "上海城市夜景视频帖" },
        { src: "generated/social-china-travel/jiangxi-video-post.png", alt: "江西山水旅行视频帖" },
      ] },
      { title: "达人合作筛选", desc: "从真实创作者内容切入，人工核验内容风格、受众地区与互动质量，不只看粉丝数字。", images: [
        { src: "generated/social-china-travel/zhangjiajie-creator-post.png", alt: "张家界创作者旅行帖" },
        { src: "generated/social-china-travel/great-wall-post.png", alt: "北京长城旅行创作者帖" },
      ] },
      { title: "口碑风险管理", desc: "把公开评论和私信里的疑问交给对应负责人核实，再通过适合的渠道回复和回访。", flow: true },
    ],
  },
];


/* ---------- 7c. 洞察内容中心 / 分类 / 文章（knowledge + industry + market 映射） ---------- */
const INSIGHT_CATEGORIES = [
  {
    slug: "insights-whitepapers",
    icon: I.doc,
    color: "rgba(0,97,255,.12)",
    title: "白皮书与行业洞察",
    nav: "白皮书",
    eyebrow: "Insights · Reports",
    desc: "把政策、客源国、渠道与转化链路拆成可执行的方法论，给经营层做季度增长决策。",
    count: "2 篇深读",
  },
  {
    slug: "events",
    icon: I.chat,
    color: "rgba(94,183,212,.16)",
    title: "活动沙龙",
    nav: "活动",
    eyebrow: "Insights · Events",
    desc: "面向旅行社、地接社与目的地运营者的闭门会、线上课与实操工作坊。",
    count: "2 场活动",
  },
  {
    slug: "glossary",
    icon: I.globe,
    color: "rgba(136,111,217,.16)",
    title: "入境游百科",
    nav: "百科",
    eyebrow: "Insights · Glossary",
    desc: "解释入境游增长、AI 接待、资源库、投放归因等高频概念，方便团队统一语言。",
    count: "2 个词条",
  },
];

const INSIGHT_ARTICLES = [
  {
    slug: "insight-inbound-growth-loop",
    category: "insights-whitepapers",
    img: "generated/gen-adsdashboard.jpg",
    tags: ["白皮书", "全链路增长"],
    date: "2026-09-04",
    read: "8 分钟",
    title: "入境游增长闭环：从海外种草到成交回款的 6 个关键节点",
    desc: "拆解文数智旅在真实项目中反复验证的增长链路：流量、落地页、AI 接待、方案、成交、复购，帮助团队先抓住最短板。",
    body: [
      { h: "为什么要先画闭环", ps: ["入境游团队常把增长问题拆成投放、客服、产品、履约几个孤岛。真正决定利润的不是某个工具，而是游客从第一次看到内容，到留下联系方式、收到方案、支付定金、完成出行、再次推荐的整条链路。", "闭环的价值，是让每个部门看到自己动作对下一环的影响：投放带来的人是否被接住，接待提取的信息是否足够生成方案，方案能否直接进入成交，履约数据能否反哺下一轮内容。"] },
      { h: "6 个关键节点", bullets: ["海外触达：按客源国、语言、兴趣与出行意图拆分内容和广告。", "多语种落地页：让游客在 3 秒内明白产品、价格区间与咨询方式。", "AI 接待：7×24 承接跨时区询盘，先完成需求结构化。", "方案生产：把人数、日期、预算、偏好转为可报价的双语行程。", "成交与回款：销售只接手高意向线索，报价、定金、合同状态可追踪。", "复购与转介绍：行后评价、标签、偏好沉淀为下一次触达资产。"] },
      { h: "第一步先修哪里", ps: ["如果线索成本高但响应慢，先修 AI 接待；如果咨询很多但成交少，先修方案生产和销售接手机制；如果订单已经稳定，先修数据归因和复购。文数智旅的实施通常从最短板入口切入，再逐步把数据串成闭环。"], callout: "建议用 7 天做一次增长体检：列出每个节点的转化率、响应时长、责任人和数据来源，优先处理掉一个最影响收入的断点。" }
    ]
  },
  {
    slug: "insight-source-market-roi",
    category: "insights-whitepapers",
    img: "generated/gen-airport.jpg",
    tags: ["客源国", "ROI"],
    date: "2026-09-04",
    read: "6 分钟",
    title: "客源国 ROI 怎么算：别只看询盘量，要看线索质量与客单价",
    desc: "用获客成本、有效咨询率、成单周期、客单价和履约成本重新评估客源国优先级。",
    body: [
      { h: "询盘量不是唯一答案", ps: ["很多团队会把预算投向询盘最多的市场，但入境游的利润结构更复杂。低成本市场如果预算低、比价重、成单周期长，最终 ROI 可能不如线索少但客单价高的市场。", "客源国分析的目的不是选一个国家，而是为每个市场匹配不同打法：走量、深耕、高端定制、政策红利或内容种草。"] },
      { h: "5 个基础指标", bullets: ["CPL：每条线索成本，反映投放入口效率。", "有效咨询率：有明确人数、日期、预算或目的地的咨询占比。", "成单周期：从首次咨询到支付定金的平均天数。", "客单价与毛利率：只看成交额会掩盖履约成本差异。", "复购/转介绍潜力：高满意度市场值得长期内容运营。"] },
      { h: "如何落到预算分配", ps: ["先把所有市场按“线索质量 × 客单价 × 可服务能力”排序，再决定预算。对于高价值但咨询量少的市场，优先补内容和语言能力；对于咨询量大但成交弱的市场，优化落地页承诺、AI 挖需和销售跟进节奏。"], callout: "文数智旅数据罗盘会把广告消耗、咨询、方案、成交与回款串起来，让预算调整不再只靠感觉。" }
    ]
  },
  {
    slug: "event-chengdu-inbound-salon",
    category: "events",
    img: "generated/gen-callcenter.jpg",
    tags: ["闭门沙龙", "成都"],
    date: "2026-09-18",
    read: "90 分钟",
    title: "成都闭门沙龙：入境游旺季前的 AI 接待与全域获客实操",
    desc: "面向西南旅行社、地接社、景区文旅集团，复盘跨时区询盘承接、客源国投放与 7 天上线流程。",
    event: { time: "2026-09-18 14:00", place: "成都 · 高新区", format: "闭门小班" },
    body: [
      { h: "适合谁参加", ps: ["本场沙龙面向已经有入境游产品、正在准备旺季获客，或希望把海外咨询从人工微信迁移到系统化承接的团队。每家机构建议由负责人、销售主管和运营负责人共同参与。"] },
      { h: "现场讨论议题", bullets: ["如何判断当前最值得投入的客源国。", "AI 接待如何接入官网、WhatsApp 与社媒私信。", "一条询盘从进入到销售接手应该留下哪些字段。", "7 天上线流程中，企业需要准备的线路、价格与 FAQ 素材。"] },
      { h: "可带走的材料", ps: ["参会团队将获得一份入境游增长体检表和 AI 接待上线清单，可用于会后盘点自己的流量、接待和方案生产短板。"], callout: "席位以机构为单位确认。可通过页面右侧“获取方案”留下联系方式，由顾问确认议题匹配度。" }
    ]
  },
  {
    slug: "event-ai-reception-workshop",
    category: "events",
    img: "generated/gen-chatdesk.jpg",
    tags: ["线上工作坊", "AI 接待"],
    date: "2026-09-24",
    read: "60 分钟",
    title: "线上工作坊：把你的线路库变成文小旅可回答的知识库",
    desc: "围绕线路、价格、退改、接送、清真餐等高频问题，演示如何整理成 AI 可检索、可引用的企业知识。",
    event: { time: "2026-09-24 19:30", place: "线上直播", format: "实操演示" },
    body: [
      { h: "为什么知识库决定 AI 质量", ps: ["AI 接待的准确度首先取决于企业提供的事实材料。线路、价格、档期、退改规则如果散落在 Excel、微信和文档里，AI 很难稳定引用，也容易让人工反复校对。"] },
      { h: "整理素材的最小闭环", bullets: ["先整理 20 个最高频问题，而不是一次性整理全部资料。", "把价格、有效期、适用人群和限制条件写成结构化字段。", "把“不能确定”的问题列为人工接手规则。", "每周把人工客服的优质回复回填到知识库。"] },
      { h: "工作坊产出", ps: ["参与者可以按示例模板整理出第一版线路 FAQ，并评估哪些回答适合 AI 自动处理、哪些必须交给人工。"], callout: "适合客服负责人、产品经理和负责资源报价的同事共同参加。" }
    ]
  },
  {
    slug: "glossary-ai-reception",
    category: "glossary",
    img: "generated/gen-phonechat.jpg",
    tags: ["百科", "AI 接待"],
    date: "2026-09-04",
    read: "4 分钟",
    title: "什么是 AI 接待官？它和普通客服机器人有什么不同",
    desc: "AI 接待官不是只回答 FAQ，而是在入境游场景中完成多语种应答、需求挖掘、线索分级和人工交接。",
    body: [
      { h: "定义", ps: ["AI 接待官是面向真实业务线索的智能接待角色。它需要理解游客的语言、行程意图、预算信号和服务边界，并把对话沉淀成销售可以直接接手的结构化信息。"] },
      { h: "和普通客服机器人的区别", bullets: ["普通机器人侧重回答固定问题，AI 接待官要推动咨询进入下一步。", "普通机器人通常不理解旅游资源，AI 接待官必须引用企业线路、价格和政策。", "普通机器人只负责对话，AI 接待官还要完成线索分级、标签和转人工。"] },
      { h: "在入境游里的典型价值", ps: ["跨时区、多语种、需求不标准，是入境游咨询的常态。AI 接待官可以先把游客的核心需求整理清楚，让人工顾问把时间花在高价值成交和复杂定制上。"] }
    ]
  },
  {
    slug: "glossary-source-market",
    category: "glossary",
    img: "generated/gen-guilin.jpg",
    tags: ["百科", "客源国"],
    date: "2026-09-04",
    read: "4 分钟",
    title: "什么是客源国分析？入境游团队为什么要按国家看增长",
    desc: "客源国分析把海外流量、咨询质量、产品偏好、成交金额和履约成本按国家拆开看。",
    body: [
      { h: "定义", ps: ["客源国分析是把不同国家或地区的游客，从流量触达到成交履约的表现拆开评估。它回答的问题不是“哪里人多”，而是“哪个市场更值得投入、该用什么产品和语言承接”。"] },
      { h: "应该看哪些维度", bullets: ["搜索与社媒热度：判断市场是否正在起量。", "获客成本：比较广告与内容入口效率。", "咨询质量：看游客是否给出明确预算、时间和人数。", "产品偏好：理解不同市场对目的地、餐饮、住宿和节奏的偏好。", "履约成本：评估语言、人力、资源和服务难度。"] },
      { h: "经营决策怎么用", ps: ["客源国分析可以指导预算分配、语种客服配置、产品打包和内容选题。对文旅集团而言，它还能帮助判断目的地国际化应该先打哪个市场。"] }
    ]
  },
];

function insightCategory(slug) { return INSIGHT_CATEGORIES.find(c => c.slug === slug); }
function insightArticles(slug) { return INSIGHT_ARTICLES.filter(a => a.category === slug); }
function insightHref(slug) { return `${slug}.html`; }
function categoryHref(slug) { return `${slug}.html`; }
function articleCard(a, opts = {}) {
  return `<a class="insight-list-card reveal" href="${insightHref(a.slug)}">
    <img src="../assets/${a.img}" alt="${a.title}" loading="lazy">
    <div class="body">
      <div class="insight-labels">${a.tags.map(t => `<span class="insight-label">${t}</span>`).join("")}<span class="insight-date">${a.date}</span></div>
      <h3 class="insight-card-title">${a.title}</h3>
      <p class="insight-card-desc">${a.desc}</p>
      <div class="insight-card-foot"><b>${a.read}</b><span>继续阅读 →</span></div>
    </div>
  </a>`;
}
function insightHome() {
  const featured = INSIGHT_ARTICLES[0];
  const stack = INSIGHT_ARTICLES.slice(1, 3).map(articleCard).join("");
  const rest = INSIGHT_ARTICLES.slice(3).map(articleCard).join("");
  return `
<!-- insight-main:start -->
<section class="insight-hero">
  <div class="insight-hero__in">
    <div>
      <span class="insight-kicker">Insights Center</span>
      <h1>入境游洞察中心</h1>
      <p>沉淀文数智旅在海外获客、AI 接待、方案生产、数据归因和目的地国际化中的实操经验，让团队用同一套方法判断机会、配置资源、推进增长。</p>
    </div>
    <div class="insight-hero__stats">
      <div class="insight-stat"><b>3</b><span>内容分类：洞察、活动、百科</span></div>
      <div class="insight-stat"><b>6</b><span>首批文章与活动详情</span></div>
      <div class="insight-stat"><b>7 天</b><span>从诊断到首条链路上线</span></div>
      <div class="insight-stat"><b>12</b><span>覆盖主要入境游服务语种</span></div>
    </div>
  </div>
</section>
<div class="insight-wrap">
  <div class="insight-navline">
    <h2>按主题进入</h2>
    <div class="insight-tabs"><a class="active" href="insights.html">全部</a>${INSIGHT_CATEGORIES.map(c => `<a href="${categoryHref(c.slug)}">${c.nav}</a>`).join("")}</div>
  </div>
  <div class="insight-category-grid">${INSIGHT_CATEGORIES.map(c => `
    <a class="insight-category-card reveal" style="--cat-bg:${c.color}" href="${categoryHref(c.slug)}">
      <span class="icon">${c.icon}</span><h3>${c.title}</h3><p>${c.desc}</p><div class="meta"><span>${c.count}</span><span>进入 →</span></div>
    </a>`).join("")}
  </div>
  <div class="insight-navline"><h2>编辑精选</h2></div>
  <div class="insight-featured">
    <a class="insight-featured-main reveal" href="${insightHref(featured.slug)}"><img src="../assets/${featured.img}" alt="${featured.title}" loading="lazy"><div class="body"><div class="insight-labels">${featured.tags.map(t => `<span class="insight-label">${t}</span>`).join("")}<span class="insight-date">${featured.date}</span></div><h3 class="insight-card-title">${featured.title}</h3><p class="insight-card-desc">${featured.desc}</p><div class="insight-card-foot"><b>${featured.read}</b><span>阅读全文 →</span></div></div></a>
    <div class="insight-stack">${stack}</div>
  </div>
  <div class="insight-navline"><h2>最新内容</h2></div>
  <div class="insight-list">${rest}</div>
</div>
<!-- insight-main:end -->`;
}
function insightCategoryPage(cat) {
  const articles = insightArticles(cat.slug);
  return `
<!-- insight-main:start -->
<section class="insight-hero">
  <div class="insight-hero__in">
    <div><span class="insight-kicker">${cat.eyebrow}</span><h1>${cat.title}</h1><p>${cat.desc}</p></div>
    <div class="insight-hero__stats"><div class="insight-stat"><b>${articles.length}</b><span>${cat.count}</span></div><div class="insight-stat"><b>实操</b><span>所有内容都指向可执行动作</span></div></div>
  </div>
</section>
<div class="insight-wrap">
  <div class="insight-navline">
    <h2>${cat.title}</h2>
    <div class="insight-tabs"><a href="insights.html">全部</a>${INSIGHT_CATEGORIES.map(c => `<a ${c.slug === cat.slug ? 'class="active"' : ''} href="${categoryHref(c.slug)}">${c.nav}</a>`).join("")}</div>
  </div>
  <div class="insight-list insight-list--one">${articles.map(articleCard).join("")}</div>
</div>
<!-- insight-main:end -->`;
}
function insightArticlePage(a) {
  const cat = insightCategory(a.category);
  const related = INSIGHT_ARTICLES.filter(x => x.slug !== a.slug).slice(0, 4);
  const eventMeta = a.event ? `<div class="event-meta-grid"><div class="event-meta"><b>时间</b>${a.event.time}</div><div class="event-meta"><b>地点</b>${a.event.place}</div><div class="event-meta"><b>形式</b>${a.event.format}</div></div>` : "";
  const body = a.body.map(sec => `
    <h2>${sec.h}</h2>
    ${(sec.ps || []).map(p => `<p>${p}</p>`).join("")}
    ${sec.bullets ? `<ul>${sec.bullets.map(b => `<li>${b}</li>`).join("")}</ul>` : ""}
    ${sec.callout ? `<div class="article-callout">${sec.callout}</div>` : ""}`
  ).join("");
  return `
<!-- insight-main:start -->
<section class="insight-hero">
  <div class="insight-hero__in">
    <div><span class="insight-kicker">${cat.eyebrow}</span><h1>${a.title}</h1><p>${a.desc}</p></div>
    <div class="insight-hero__stats"><div class="insight-stat"><b>${a.read.replace(/ .*/, "")}</b><span>${a.read.includes("分钟") ? "阅读/活动时长" : "阅读时长"}</span></div><div class="insight-stat"><b>${a.date.slice(5)}</b><span>发布日期 / 活动日期</span></div></div>
  </div>
</section>
<div class="article-shell">
  <article class="article-main reveal">
    <div class="article-breadcrumb"><a href="insights.html">洞察中心</a><span>/</span><a href="${categoryHref(cat.slug)}">${cat.title}</a><span>/</span><span>${a.title}</span></div>
    <div class="insight-labels">${a.tags.map(t => `<span class="insight-label">${t}</span>`).join("")}<span class="insight-date">${a.date} · ${a.read}</span></div>
    <h1>${a.title}</h1>
    <p class="article-summary">${a.desc}</p>
    <img class="article-cover" src="../assets/${a.img}" alt="${a.title}" loading="lazy">
    ${eventMeta}
    <div class="article-body">${body}</div>
  </article>
  <aside class="article-side">
    <div class="article-side-card"><h3>继续阅读</h3>${related.map(r => `<a href="${insightHref(r.slug)}">${r.title}</a>`).join("")}</div>
    <div class="article-side-card"><h3>需要落地到你的业务？</h3><p class="insight-card-desc">留下业务类型与目标客源国，顾问会按你的线路与团队现状给出增长链路建议。</p><button class="link-btn" style="margin-top:16px" data-lead data-source="${a.slug}-article" data-title="获取专属增长方案"><span>获取方案</span><span class="arr">→</span></button></div>
  </aside>
</div>
<!-- insight-main:end -->`;
}

/* ---------- 8. 执行生成 ---------- */
if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR, { recursive: true });

let ok = 0;
for (const p of PAGES) {
  const zhFile = p.slug + ".html";
  const html = langSwitchForSubpage(navForSubpage(rebase(renderPage({ ...p, body: skeleton(p) }))), zhFile);
  fs.writeFileSync(path.join(OUT_DIR, zhFile), html, "utf8");
  console.log("✔ pages/" + zhFile + " (" + Math.round(html.length / 1024) + "KB)");
  ok++;
}
for (const p of TECH_PAGES) {
  const zhFile = p.slug + ".html";
  const html = langSwitchForSubpage(navForSubpage(rebase(renderPage({ ...p, body: techSkeleton(p) }))), zhFile);
  fs.writeFileSync(path.join(OUT_DIR, zhFile), html, "utf8");
  console.log("✔ pages/" + zhFile + " (" + Math.round(html.length / 1024) + "KB)");
  ok++;
}
{
  const html = langSwitchForSubpage(navForSubpage(rebase(renderPage({
    title: "客户案例 · 文数智旅",
    desc: "文数智旅客户案例：国际旅行社、地接社、精品旅游公司、景区文旅集团如何用 AI 接住全球客源。",
    body: casesPage(),
  }))), "cases.html");
  fs.writeFileSync(path.join(OUT_DIR, "cases.html"), html, "utf8");
  console.log("✔ pages/cases.html (" + Math.round(html.length / 1024) + "KB)");
  ok++;
}
{
  const file = "insights.html";
  const html = langSwitchForSubpage(navForSubpage(rebase(renderPage({
    slug: "insights",
    title: "洞察中心 · 文数智旅",
    desc: "文数智旅洞察中心：入境游白皮书、行业方法论、活动沙龙与入境游百科，帮助旅行社和文旅目的地落地 AI 增长。",
    body: insightHome(),
  }))), file);
  fs.writeFileSync(path.join(OUT_DIR, file), html, "utf8");
  console.log("✔ pages/" + file + " (" + Math.round(html.length / 1024) + "KB)");
  ok++;
}
for (const cat of INSIGHT_CATEGORIES) {
  const file = cat.slug + ".html";
  const html = langSwitchForSubpage(navForSubpage(rebase(renderPage({
    slug: cat.slug,
    title: cat.title + " · 洞察中心 · 文数智旅",
    desc: cat.desc,
    body: insightCategoryPage(cat),
  }))), file);
  fs.writeFileSync(path.join(OUT_DIR, file), html, "utf8");
  console.log("✔ pages/" + file + " (" + Math.round(html.length / 1024) + "KB)");
  ok++;
}
for (const article of INSIGHT_ARTICLES) {
  const file = article.slug + ".html";
  const html = langSwitchForSubpage(navForSubpage(rebase(renderPage({
    slug: article.slug,
    title: article.title + " · 文数智旅洞察",
    desc: article.desc,
    body: insightArticlePage(article),
  }))), file);
  fs.writeFileSync(path.join(OUT_DIR, file), html, "utf8");
  console.log("✔ pages/" + file + " (" + Math.round(html.length / 1024) + "KB)");
  ok++;
}
console.log("\nDone: " + ok + " pages generated -> pages/");
