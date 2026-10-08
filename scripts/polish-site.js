const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "..");
const siteOrigin =
  (process.env.SITE_ORIGIN || "https://wenshuzhilv.kaifa2-xtch2026.chatgpt.site").replace(/\/+$/, "");

const htmlFiles = [
  path.join(root, "index.html"),
  ...walk(path.join(root, "pages")).filter((file) => file.endsWith(".html")),
  path.join(root, "en", "index.html"),
  ...walk(path.join(root, "en", "pages")).filter((file) => file.endsWith(".html")),
].filter((file) => fs.existsSync(file));

for (const file of htmlFiles) {
  const rel = slash(path.relative(root, file));
  const isEnglish = rel.startsWith("en/");
  const isSubpage = rel.startsWith("pages/") || rel.startsWith("en/pages/");
  const privacyHref = isEnglish ? (isSubpage ? "../privacy.html" : "privacy.html") : (isSubpage ? "../privacy.html" : "privacy.html");
  const publicUrl = `${siteOrigin}/${rel === "index.html" ? "" : rel}`;

  let html = fs.readFileSync(file, "utf8");

  html = html
    .replaceAll("title=\"白皮书与行业洞察（即将上线）\"", "title=\"白皮书与行业洞察\"")
    .replaceAll("title=\"Whitepapers & industry insights (coming soon)\"", "title=\"Whitepapers & industry insights\"")
    .replaceAll("文数智旅 AI 接待系统全新升级，多语种能力扩展至 12 种（占位）", "文数智旅 AI 接待系统升级，多语种能力覆盖 12 种主流语言")
    .replaceAll("与多家头部旅行社达成全链路数字化合作（占位）", "旅行社、地接社与景区场景的全链路数字化方案持续沉淀")
    .replaceAll("入境游增长白皮书即将发布，敬请期待（占位）", "入境游增长方法论持续更新，覆盖获客、承接与履约闭环")
    .replaceAll("2026 入境游增长闭门沙龙 · 成都站（占位）", "2026 入境游增长闭门沙龙 · 成都站")
    .replaceAll("CITM 国际旅游交易会 · 展位互动回顾（占位）", "CITM 国际旅游交易会 · AI 承接场景交流")
    .replaceAll("文旅数字化峰会 · AI 承接专题分享（占位）", "文旅数字化峰会 · AI 承接专题分享")
    .replaceAll("Wenshu AI reception upgraded — multilingual coverage extended to 12 languages (placeholder)", "Wenshu AI reception upgraded — multilingual coverage across 12 core languages")
    .replaceAll("Full-chain digital partnerships signed with leading travel agencies (placeholder)", "Full-chain digital playbooks are being refined for agencies, ground operators, and destinations")
    .replaceAll("Inbound Tourism Growth Whitepaper coming soon (placeholder)", "Inbound tourism growth playbooks now cover acquisition, reception, and fulfillment")
    .replaceAll("2026 Inbound Growth Closed-Door Salon · Chengdu (placeholder)", "2026 Inbound Growth Closed-Door Salon · Chengdu")
    .replaceAll("CITM International Travel Fair · Booth recap (placeholder)", "CITM International Travel Fair · AI reception scenario exchange")
    .replaceAll("Culture-Tourism Digital Summit · Featured talk on AI reception (placeholder)", "Culture-Tourism Digital Summit · Featured talk on AI reception")
    .replaceAll("邮箱待补充", "提交表单，顾问将在 1 个工作日内联系")
    .replaceAll("地址待补充", "服务覆盖目的地、景区与旅行社")
    .replaceAll("Email: coming soon", "Submit the form for a 1-business-day callback")
    .replaceAll("Address: coming soon", "Serving destinations, scenic spots, and travel agencies")
    .replaceAll("微信二维码<br>（素材待接入）", "电话咨询<br>13558835750")
    .replaceAll("WeChat QR<br>(coming soon)", "Phone consultation<br>13558835750")
    .replaceAll("二维码占位<br>（待用户提供素材）", "请拨打下方热线<br>或提交表单预约顾问")
    .replaceAll("QR placeholder<br>(asset pending)", "Call the hotline below<br>or submit the form for a callback")
    .replaceAll("扫码添加顾问微信", "联系文数智旅顾问")
    .replaceAll("Scan to add a WeChat advisor", "Contact a Wenshu advisor")
    .replaceAll("微信咨询", "电话咨询")
    .replaceAll("WeChat", "Hotline");

  html = html
    .replace(/<a href="(?:#|\.\.\/index\.html|\.\.\/\.\.\/index\.html)" onclick="return false">《隐私政策》<\/a>/g, `<a href="${privacyHref}">《隐私政策》</a>`)
    .replace(/<a href="(?:#|\.\.\/index\.html|\.\.\/\.\.\/index\.html)" onclick="return false">隐私政策<\/a>/g, `<a href="${privacyHref}">隐私政策</a>`)
    .replace(/<a href="(?:#|\.\.\/index\.html|\.\.\/\.\.\/index\.html)" onclick="return false">Privacy Policy<\/a>/g, `<a href="${privacyHref}">Privacy Policy</a>`)
    .replace(/<\/a> · ICP 备案号待申请/g, "</a> · 数据仅用于方案沟通")
    .replace(/<\/a> · ICP filing pending/g, "</a> · Data used only for solution consultation");

  html = upsertCanonicalMetadata(html, {
    canonicalUrl: publicUrl,
    isEnglish,
    isHome: rel === "index.html" || rel === "en/index.html",
  });

  fs.writeFileSync(file, html);
}

writePrivacyPages();

console.log(`Polished ${htmlFiles.length} HTML files for ${siteOrigin}`);

function upsertCanonicalMetadata(html, { canonicalUrl, isEnglish, isHome }) {
  html = html
    .replace(/\n<meta property="og:url" content="[^"]+">/g, "")
    .replace(/\n<link rel="canonical" href="[^"]+">/g, "")
    .replace(/\n<link rel="alternate" hreflang="[^"]+" href="[^"]+">/g, "");

  if (isHome) {
    html = html.replace(
      /<meta property="og:image" content="[^"]+">/,
      `<meta property="og:image" content="${siteOrigin}/assets/generated/gen-ogbg.jpg">`,
    );
  }

  const alternates = isHome
    ? `\n<link rel="alternate" hreflang="zh-CN" href="${siteOrigin}/">\n<link rel="alternate" hreflang="en" href="${siteOrigin}/en/index.html">\n<link rel="alternate" hreflang="x-default" href="${siteOrigin}/">`
    : "";
  const tags = `<link rel="canonical" href="${canonicalUrl}">${alternates}`;

  if (/<meta property="og:type" content="website">/.test(html)) {
    return html.replace(
      /<meta property="og:type" content="website">/,
      `<meta property="og:type" content="website">\n<meta property="og:url" content="${canonicalUrl}">\n${tags}`,
    );
  }

  return html.replace(/(<meta name="description" content="[^"]+">)/, `$1\n${tags}`);
}

function writePrivacyPages() {
  const zh = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>隐私政策 · 文数智旅</title>
<meta name="description" content="文数智旅隐私政策：说明咨询表单与产品演示预约信息的收集、使用与保护方式。">
<link rel="canonical" href="${siteOrigin}/privacy.html">
<style>
:root{--bg:#f5f8ff;--surface:#fff;--ink:#0b1029;--muted:#656f86;--primary:#0061ff;--line:#d1d7e5}
*{box-sizing:border-box}body{margin:0;font-family:-apple-system,BlinkMacSystemFont,"PingFang SC","Microsoft YaHei",sans-serif;background:var(--bg);color:var(--ink);line-height:1.8;font-size:16px}
.wrap{max-width:880px;margin:0 auto;padding:48px 22px 72px}.card{background:var(--surface);border:1px solid var(--line);border-radius:22px;padding:clamp(24px,5vw,52px);box-shadow:0 18px 48px rgba(11,16,41,.08)}
a{color:var(--primary);text-decoration:none}.back{display:inline-flex;margin-bottom:22px;font-weight:700}h1{font-size:clamp(30px,5vw,44px);line-height:1.25;margin:0 0 10px}h2{font-size:20px;margin:30px 0 8px}p,li{color:#333d52}.date{color:var(--muted);margin-bottom:28px}
</style>
</head>
<body><main class="wrap"><a class="back" href="index.html">← 返回文数智旅首页</a><article class="card">
<h1>隐私政策</h1><p class="date">更新日期：2026 年 9 月 4 日</p>
<p>文数智旅重视你的信息安全。本页面说明你在提交咨询、预约演示或留下联系方式时，相关信息会如何被使用和保护。</p>
<h2>我们收集哪些信息</h2><p>当你主动提交表单时，我们可能收集手机号码、称呼、公司名称、业务类型，以及你在咨询中提供的需求信息。</p>
<h2>我们如何使用信息</h2><p>这些信息仅用于与你沟通入境游增长方案、安排产品演示、回复咨询，以及改进我们的服务承接流程。</p>
<h2>信息保护</h2><p>我们不会出售或出租你的个人信息，也不会将信息用于与方案沟通无关的用途。我们会采取合理措施限制非必要访问。</p>
<h2>你的选择</h2><p>如果你希望更正或删除已提交的信息，可通过站点展示的咨询热线联系文数智旅顾问。</p>
<h2>联系我们</h2><p>咨询热线：<a href="tel:13558835750">13558835750</a></p>
</article></main></body></html>
`;

  const en = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Privacy Policy · Wenshu Travel</title>
<meta name="description" content="Wenshu Travel privacy policy for consultation forms and demo requests.">
<link rel="canonical" href="${siteOrigin}/en/privacy.html">
<style>
:root{--bg:#f5f8ff;--surface:#fff;--ink:#0b1029;--muted:#656f86;--primary:#0061ff;--line:#d1d7e5}
*{box-sizing:border-box}body{margin:0;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;background:var(--bg);color:var(--ink);line-height:1.8;font-size:16px}
.wrap{max-width:880px;margin:0 auto;padding:48px 22px 72px}.card{background:var(--surface);border:1px solid var(--line);border-radius:22px;padding:clamp(24px,5vw,52px);box-shadow:0 18px 48px rgba(11,16,41,.08)}
a{color:var(--primary);text-decoration:none}.back{display:inline-flex;margin-bottom:22px;font-weight:700}h1{font-size:clamp(30px,5vw,44px);line-height:1.25;margin:0 0 10px}h2{font-size:20px;margin:30px 0 8px}p,li{color:#333d52}.date{color:var(--muted);margin-bottom:28px}
</style>
</head>
<body><main class="wrap"><a class="back" href="index.html">← Back to Wenshu Travel</a><article class="card">
<h1>Privacy Policy</h1><p class="date">Updated: September 4, 2026</p>
<p>Wenshu Travel respects your privacy. This page explains how information submitted through consultation and demo-request forms is used and protected.</p>
<h2>Information we collect</h2><p>When you submit a form, we may collect your phone or WhatsApp number, name, company, business type, and the requirements you choose to share.</p>
<h2>How we use it</h2><p>We use this information only to discuss inbound-tourism growth solutions, schedule product demonstrations, answer inquiries, and improve our consultation workflow.</p>
<h2>How we protect it</h2><p>We do not sell or rent your personal information. We take reasonable steps to limit access to people who need it for solution consultation.</p>
<h2>Your choices</h2><p>To request correction or deletion of submitted information, contact a Wenshu Travel advisor through the hotline shown on the site.</p>
<h2>Contact</h2><p>Hotline: <a href="tel:13558835750">13558835750</a></p>
</article></main></body></html>
`;

  fs.writeFileSync(path.join(root, "privacy.html"), zh);
  fs.writeFileSync(path.join(root, "en", "privacy.html"), en);
}

function walk(dir) {
  if (!fs.existsSync(dir)) return [];
  const out = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const file = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...walk(file));
    else if (entry.isFile()) out.push(file);
  }
  return out;
}

function slash(value) {
  return value.split(path.sep).join("/");
}
