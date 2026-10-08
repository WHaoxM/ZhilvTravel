/* ============================================================
   文数智旅 · 英文首页生成器
   从 index.html 抽取完整结构，按映射表替换为 native 英文文案
   （海外 B2B 语境重写，非机翻）。输出 en/index.html
   用法：node scripts/build-en.js
   ============================================================ */
const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const src = fs.readFileSync(path.join(ROOT, "index.html"), "utf8");

let out = src;

/* ---------- 1. head：lang / title / meta ---------- */
out = out
  .replace('<html lang="zh-CN">', '<html lang="en">')
  .replace(/<title>[^<]*<\/title>/, "<title>Wenshu Travel · AI-Powered Inbound Tourism Growth System</title>")
  .replace(/<meta name="description" content="[^"]*">/,
    '<meta name="description" content="Wenshu Travel: the AI-powered growth system for China inbound tourism. Global acquisition, multilingual AI reception, full-funnel conversion — own your inbound customer base.">')
  .replace(/<meta property="og:title" content="[^"]*">/,
    '<meta property="og:title" content="Wenshu Travel · AI-Powered Inbound Tourism Growth System">')
  .replace(/<meta property="og:description" content="[^"]*">/,
    '<meta property="og:description" content="Global acquisition · AI reception · Full-funnel conversion — own your inbound customer base.">');

/* ---------- 2. 路径 rebasing（en/ 下一层） ---------- */
out = out
  .replace(/(data-src|src|href|poster)="assets\//g, '$1="../assets/')
  .replace(/href="pages\//g, 'href="../pages/')
  .replace(/href="#"/g, 'href="index.html"');

/* ---------- 2b. 英文首页内部子页链接 → en 版（保持全站英文语境不断裂） ---------- */
/* pages/x.html（rebase 后）→ pages/x.en.html；同页锚点保留 */
out = out.replace(
  /href="\.\.\/pages\/([a-z][a-z0-9-]*)\.html(#[^"]*)?"/g,
  'href="pages/$1.en.html$2"'
);

/* Translate the source-backed policy module before shorter shared phrases can fragment it. */
const POLICY_TRANSLATIONS = [
  ["更多政策原文与预测资料", "More policy sources and forecasts"],
  ["2024-12：240 小时过境免签升级（发布时口径）", "2024-12: 240-hour visa-free transit expansion (launch figures)"],
  ["2025-01：国务院办公厅培育文旅消费新增长点", "2025-01: State Council measures for new tourism consumption growth"],
  ["2025-04：六部门优化离境退税政策", "2025-04: Six-department departure-tax-refund measures"],
  ["2026-04：中国旅游经济蓝皮书（2026 年预测，非实际发生值）", "2026-04: China Tourism Economy Blue Book (2026 forecast, not actuals)"],
  ["国家移民管理局政策解读合集", "NIA policy explainer collection"],
  ["理解需求、生成方案，让顾问更快接住跨语种咨询。", "Understand needs and build plans so advisors can respond across languages."],
  ["看清客源市场、入境趋势与海外社媒讨论。", "Understand source markets, inbound trends and overseas conversations."],
  ["从获客到履约，按业务环节选择可落地的方案。", "Choose practical solutions from acquisition through fulfillment."],
  ["政策与数据依据", "Policy and data sources"],
  ["政策与数据", "Policy and data"],
  ["入境游机会有公开政策与统计支撑。下方提供官方原网页截图与原文链接，便于核对发布时间、适用条件和统计口径。统计数据采用全国行业口径。", "Public policies and statistics provide context for inbound travel. Official-page screenshots and source links below let you check dates, eligibility and methodology. The figures use national industry-wide data."],
  ["2025 年入境旅游官方统计", "Official 2025 inbound tourism figures"],
  ["2025 年入境游客人次", "Inbound visits in 2025"],
  ["其中外国游客人次", "Foreign visitor arrivals"],
  ["2025 年入境游客总花费", "Inbound visitor spending in 2025"],
  ["同比 +17.1% · 文化和旅游部统计公报", "Up 17.1% YoY · Ministry of Culture and Tourism"],
  ["同比 +30.6% · 文化和旅游部统计公报", "Up 30.6% YoY · Ministry of Culture and Tourism"],
  ["同比 +39.2% · 国家统计局统计公报", "Up 39.2% YoY · National Bureau of Statistics"],
  ["1311 亿美元", "US$131.1 billion"], ["3517 万", "35.17 million"], ["1.545 亿", "154.5 million"],
  ["文化和旅游部 · 2026-03-20", "Ministry of Culture and Tourism · 2026-03-20"],
  ["国家移民管理局 · 2024-01-11", "National Immigration Administration · 2024-01-11"],
  ["国家移民管理局 · 2024-05-15", "National Immigration Administration · 2024-05-15"],
  ["文化和旅游部 · 2026-06-02", "Ministry of Culture and Tourism · 2026-06-02"],
  ["促进旅行服务出口、扩大入境消费", "Promoting travel-service exports and inbound spending"],
  ["便利外籍人员来华五项措施", "Five measures facilitating entry for foreign nationals"],
  ["邮轮旅游团入境免签", "Visa-free entry for cruise tour groups"],
  ["2025 年文旅发展统计公报", "2025 culture and tourism statistics bulletin"],
  ["九部门文件提出全球精准营销、运用社交媒体、丰富特色入境产品和提升多语种服务。", "The nine-department policy calls for targeted global marketing, social-media outreach, distinctive inbound products and improved multilingual services."],
  ["包括部分情形下就近办理签证延期、申办多次再入境签证及简化有关申办材料；具体适用须按原文核验。", "Measures include locally applying for visa extensions in eligible cases, applying for multiple-entry visas and simplifying certain materials. Check the official eligibility rules."],
  ["适用于由境内旅行社组织接待、乘坐邮轮的 2 人及以上外国旅游团，须遵守口岸、随船行程与最长 15 天停留等条件。", "Applies to foreign cruise groups of two or more organized or received by a domestic travel agency, subject to port, ship-itinerary and maximum 15-day stay conditions."],
  ["全年入境游客 15450 万人次，其中外国游客 3517 万人次。数据为全国统计口径。", "China recorded 154.5 million inbound visits in 2025, including 35.17 million foreign visitor arrivals. These are national statistics."],
  ["查看官方原文", "Read official source"],
  ["查看 2026 年九部门入境消费政策截图", "View the 2026 nine-department inbound spending policy screenshot"],
  ["查看便利外籍人员来华五项措施截图", "View the five entry-facilitation measures screenshot"],
  ["查看外国旅游团邮轮入境免签公告截图", "View the cruise-group visa-free entry notice screenshot"],
  ["查看 2025 年文化和旅游发展统计公报截图", "View the 2025 tourism statistics bulletin screenshot"],
  ["文化和旅游部官网发布九部门促进入境消费政策的页面截图", "Official Ministry of Culture and Tourism page screenshot for the nine-department inbound spending policy"],
  ["国家移民管理局便利外籍人员来华五项措施页面截图", "Official National Immigration Administration page screenshot for five entry-facilitation measures"],
  ["国家移民管理局外国旅游团邮轮入境免签公告页面截图", "Official National Immigration Administration cruise-tour visa-free entry notice screenshot"],
  ["文化和旅游部 2025 年文化和旅游发展统计公报页面截图", "Official 2025 Ministry of Culture and Tourism statistics bulletin screenshot"],
  ["过境免签数据有时间口径：2024 年政策发布时为 60 个适用口岸；按国家移民管理局 ", "Visa-free transit figures have different dates: 60 ports were listed when the policy launched in 2024. According to the National Immigration Administration's "],
  ["2026-08-20 政策解读", "2026-08-20 policy explainer"],
  ["，240 小时过境免签适用于 57 国、24 个省份的 65 个口岸，且须符合前往第三国或地区等条件。游客出行前请查阅最新官方要求。2025 年入境旅游花费的数据来源为", ", 240-hour visa-free transit covers 57 countries and 65 ports in 24 provinces, subject to onward travel to a third country or region and other conditions. Check current official rules before travel. The 2025 inbound spending figure is from the "],
  ["国家统计局公报", "National Bureau of Statistics bulletin"],
];
for (const [zh, en] of POLICY_TRANSLATIONS.sort((a, b) => b[0].length - a[0].length)) out = out.split(zh).join(en);

/* ---------- 3. 文案替换（按出现顺序，精确匹配中文片段） ---------- */
const T = [
  /* ===== S2 AI 接待截图（先于通用短串翻译，避免 aria/alt 被部分替换） ===== */
  ['aria-label="智能需求挖掘客户标签截图轮播"', 'aria-label="Smart intent mining customer tag screenshots carousel"'],
  ['aria-label="线索自动分级聊天分组界面"', 'aria-label="Automatic lead scoring conversation groups interface"'],
  ['alt="客户标签截图：马来西亚家庭旅行需求"', 'alt="Customer tag screenshot: Malaysia family trip requirements"'],
  ['alt="客户标签截图：多目的地行程偏好与预算"', 'alt="Customer tag screenshot: multi-destination preferences and budget"'],
  ['alt="客户会话分组界面截图：潜在客户、已出行、已付款、沟通中与高意向"', 'alt="Customer conversation groups: prospects, traveled, paid, in conversation, and high intent"'],
  /* ===== S2 智能方案素材 ===== */
  ['aria-label="酒店、车辆与目的地公共资源拼图轮播"', 'aria-label="Hotel, vehicle and destination resource collage carousel"'],
  ['aria-label="公共资源池素材轮播"', 'aria-label="Shared resource library media carousel"'],
  ['aria-label="资源类别页签"', 'aria-label="Resource category tabs"'],
  ['aria-label="中英文双语行程海报叠层"', 'aria-label="Overlapping Chinese and English itinerary posters"'],
  ['alt="可视化行程编排工作台，叠加 AI 路线节点与光效"', 'alt="Visual itinerary workspace with subtle AI route nodes and light effects"'],
  ['alt="度假酒店泳池与主楼"', 'alt="Resort hotel pool and main building"'],
  ['alt="现代园林酒店"', 'alt="Modern garden hotel"'],
  ['alt="度假酒店入口"', 'alt="Resort hotel entrance"'],
  ['alt="机场接送商务车"', 'alt="Premium airport-transfer MPV"'],
  ['alt="城市旅游中巴"', 'alt="Urban touring minibus"'],
  ['alt="景区旅游中巴"', 'alt="Scenic-area touring minibus"'],
  ['alt="雪山与湖泊目的地资源"', 'alt="Mountain and lake destination resource"'],
  ['alt="森林瀑布目的地资源"', 'alt="Forest waterfall destination resource"'],
  ['alt="英文与中文十八日中国行程海报重叠展示"', 'alt="Overlapping English and Chinese 18-day China itinerary posters"'],
  ['<span class="sr-only">酒店</span>', '<span class="sr-only">Hotels</span>'],
  ['<span class="sr-only">车辆</span>', '<span class="sr-only">Vehicles</span>'],
  ['<span class="sr-only">目的地</span>', '<span class="sr-only">Destinations</span>'],
  /* ===== S2 数据与履约素材 ===== */
  ['aria-label="旅游业务总览、渠道投放效果与成交增长三块数据看板组合"', 'aria-label="Combined tourism overview, channel performance, and conversion growth dashboards"'],
  ['aria-label="客户行程日历，标注客户生日、签证到期和客户出行中"', 'aria-label="Customer trip calendar annotated with birthday, visa expiry, and active travel"'],
  ['alt="订单全链路节点箭头流程图"', 'alt="Order lifecycle arrow flow"'],
  ['alt="一站式旅游资源库，包含景点、车辆、酒店和特色体验"', 'alt="One-stop travel resource library with attractions, vehicles, hotels, and experiences"'],
  ['<span>询盘量</span><span>转化率</span><span>渠道 ROI</span>', '<span>Inquiries</span><span>Conversion</span><span>Channel ROI</span>'],
  ['>客户生日</span>', '>Customer birthday</span>'],
  ['>签证到期</span>', '>Visa expiry</span>'],
  ['>客户出行中</span>', '>Customer traveling</span>'],
  /* ===== 导航 ===== */
  ["文数智旅 首页", "Wenshu Travel Home"],
  ["<span>产品</span>", "<span>Products</span>"],
  ["<span>解决方案</span>", "<span>Solutions</span>"],
  ["<span>关于我们</span>", "<span>About</span>"],
  [">首页</a>", ">Home</a>"],
  [">客户案例</a>", ">Case Studies</a>"],
  [">洞察</a>", ">Insights</a>"],
  ["洞察中心", "Insights Center"],
  ["标准化产品", "Products"],
  ["定制服务", "Custom Services"],
  ["文小旅 · AI 接待官", "Wenxiaolv · AI Receptionist"],
  ["7×24 多语种智能接待", "24/7 multilingual AI reception"],
  ["智策 · 方案生成", "Zhice · Itinerary Builder"],
  ["10 分钟出行程 + 报价", "Itinerary + quote in 10 minutes"],
  ["云仓 · 旅游资源库", "Yuncang · Resource Cloud"],
  ["线路/酒店/地接一站式管理", "Tours, hotels & operators in one place"],
  ["全域增长引擎", "Global Growth Engine"],
  ["Google / Meta / TikTok 获客", "Acquisition on Google / Meta / TikTok"],
  ["数据罗盘", "Data Compass"],
  ["获客 / 转化 / ROI 全链路可视", "Full-funnel visibility: acquisition to ROI"],
  ["按需定制", "Tailored"],
  ["定制化服务", "Custom Solutions"],
  ["私有资源库接入 · 品牌话术训练 · 履约流程对接 · 专属部署方案", "Private resource integration · Brand voice training · Workflow onboarding · Dedicated deployment"],
  ["咨询顾问", "Talk to Us"],
  ["AI 能力", "AI Capabilities"],
  ["多语种理解与生成", "Multilingual Understanding"],
  ["智能挖需与画像", "Intent Mining & Profiling"],
  ["资源库知识增强", "Knowledge-Grounded AI"],
  ["大数据能力", "Big Data"],
  ["入境游趋势洞察", "Inbound Travel Trends"],
  ["客源国分析", "Source Market Analytics"],
  ["海外社媒洞察", "Social Listening"],
  ["全域获客方案", "Global Acquisition"],
  ["智能接待转化方案", "AI Reception & Conversion"],
  ["定制方案生产方案", "Itinerary Production"],
  ["履约与服务方案", "Fulfillment & Service"],
  ["全域数据增长方案", "Data-Driven Growth"],
  ["关于文数智旅", "About Wenshu"],
  ["媒体报道", "Press"],
  ["活动沙龙", "Events"],
  ["联系我们", "Contact"],
  ["浏览文数智旅", "Browse Wenshu Travel"],
  ["打开导航菜单", "Open navigation"],
  ["关闭导航菜单", "Close navigation"],
  ["关闭导航", "Close navigation"],
  [">产品</summary>", ">Products</summary>"],
  [">解决方案</summary>", ">Solutions</summary>"],
  [">关于我们</summary>", ">About</summary>"],
  ["能力预览", "Capability preview"],
  ["打开功能说明", "Open feature details"],
  ["联系电话（可选）", "Phone (optional)"],
  ["联系电话", "Phone / WhatsApp"],
  ["请输入电话号码（含国家区号）", "Your phone or WhatsApp, including country code"],
  ["获取专属增长方案", "Get Your Growth Plan"],
  ["<b>中</b> / <a href=\"en/index.html\" style=\"color:inherit\">EN</a>", '<a href="../index.html" style="color:inherit">中</a> / <b>EN</b>'],
  ["获取方案", "Get a Plan"],

  /* ===== S1 HERO ===== */
  ["AI + 入境游全链路增长系统", "AI-Powered Inbound Tourism Growth System"],
  ["把入境游客源<br>攥在 <em>AI 驱动</em>的自己手里", "Own Your Inbound<br><em>AI-Driven</em> Customer Base"],
  ["海外获客 · 智能承接 · 全链路成交——从获客到成交，一套系统构建你的入境游增长引擎",
   "Global acquisition · AI reception · Full-funnel conversion — one system to power your inbound tourism growth"],
  ["获取专属增长方案", "Get Your Growth Plan"],
  ["公司地址", "Company address"],
    ["请输入公司所在省市及详细地址", "Province, city and full company address"],
    ["输入您想咨询的问题", "Type your message"],
    ["预约产品体验", "Book a Consultation"],
  ["旺季 7 天上线，首批名额限量开放", "Live in 7 days. Limited seats for the peak season."],
  ["（界面数值用于说明功能）", " (Interface values illustrate functionality)"],
  ["界面数值用于说明功能", "Interface values illustrate functionality"],
  ["产品能力切换", "Product feature switcher"],
  ["全域获客", "Global Acquisition"],
  ["数据总览 · 实时监控业务核心指标与动态", "Overview · Real-time business metrics"],
  ["数据总览 · 获客 / GMV / 客户满意度实时监控", "Overview · Acquisition / GMV / Customer satisfaction real-time monitoring"],
  ["数据总览 · 获客 / GMV / 客户满意度", "Overview · Acquisition / GMV / Customer satisfaction"],
  ["AI 客服工作台 · 多语种接待与人工协同", "AI Workspace · Multilingual reception with human handoff"],
  ["AI 客服工作台 · 12 语种接待 · 人工一键接管", "AI Workspace · 12 languages · One-click human takeover"],
  ["AI 智能接待工作流程", "AI Reception workflow"],
  ["AI 智能接待 · 多语种询盘承接全流程", "AI Reception · Multilingual inquiry handling workflow"],
  ["放大观看 AI 智能接待演示视频", "Watch the AI Reception video in a larger view"],
  ["放大观看 AI 方案生成演示视频", "Watch the AI Itinerary video in a larger view"],
  ["放大观看 ↗", "Watch larger ↗"],
  ["Remotion 产品演示视频", "Remotion product demo video"],
  ["AI 方案生成工作流程", "AI itinerary generation workflow"],
  ["AI 方案生成 · 行程编排与报价生成全流程", "AI Itinerary · Itinerary planning and quote generation workflow"],
  ["定制工作台 · 行程编排与旅糜推荐", "Itinerary Studio · Planning with resource recommendations"],
  ["定制工作台 · 行程编排 + 资源库推荐 + 计划核算", "Itinerary Studio · Planning + resources + costing"],
  ["<span class=\"label\">全域获客</span>", "<span class=\"label\">Acquisition</span>"],
  ["<span class=\"label\">AI 智能接待</span>", "<span class=\"label\">AI Reception</span>"],
  ["<span class=\"label\">AI 方案生成</span>", "<span class=\"label\">AI Itinerary</span>"],
  ["可接入平台", "Supported integrations"],
  ["小红书", "Xiaohongshu"],
  ["高德地图", "Amap"],

  /* ===== S2 全链路解决方案 ===== */
  ["Full-Chain Solution", "Full-Chain Solution"],
  ["AI + 入境游<span class=\"grad-text\">全链路</span>解决方案", "The <span class=\"grad-text\">Full-Chain</span> AI Solution for Inbound Tourism"],
  ["从海外引流到成交复购，一站式增长闭环。悬停查看每个能力环节。", "From global traffic to repeat bookings — one closed growth loop. Hover to explore each stage."],

  /* ===== S3 AI 引擎 ===== */
  ["Core AI Engine", "Core AI Engine"],
  ["AI 接住每一句<span class=\"grad-text\">海外咨询</span>", "AI Answers Every <span class=\"grad-text\">Global Inquiry</span>"],
  ["自研文旅专属大模型，读懂 12 种语言、跨 8 个时区，把散落的咨询变成可执行的行程方案",
   "Our tourism-specific LLM understands 12 languages across 8 time zones, turning scattered inquiries into actionable itineraries"],
  ["预约体验", "Book a Consultation"],
  /* 主舞台按完整元素 / 属性替换，避免步骤标题等短串污染其他模块。 */
  ["文旅 AI 咨询引擎", "Tourism AI Inquiry Engine"],
  ["AI 正在处理", "AI processing"],
  ["12 种语言 · 8 个时区", "12 languages · 8 time zones"],
  ['<button class="ew-video-toggle" id="engineVideoToggle" type="button" aria-label="暂停视频" aria-pressed="false" data-paused="false" data-pause-label="暂停视频" data-play-label="播放视频" data-pause-text="暂停" data-play-text="播放">',
   '<button class="ew-video-toggle" id="engineVideoToggle" type="button" aria-label="Pause video" aria-pressed="false" data-paused="false" data-pause-label="Pause video" data-play-label="Play video" data-pause-text="Pause" data-play-text="Play">'],
  ["<span>暂停</span>", "<span>Pause</span>"],
  ['aria-label="文旅 AI 将海外咨询转化为行程方案"', 'aria-label="Tourism AI turns global inquiries into itinerary proposals"'],
  ['aria-label="AI 咨询处理流程"', 'aria-label="AI inquiry handling workflow"'],
  ['<span class="ew-flow-copy"><strong>收到海外咨询</strong><span>英语 · 家庭 4 人 · 12 月</span></span>',
   '<span class="ew-flow-copy"><strong>Global inquiry received</strong><span>English · Family of 4 · December</span></span>'],
  ['<span class="ew-flow-copy"><strong>识别关键需求</strong><span>中国 · 10 日 · 私人团</span></span>',
   '<span class="ew-flow-copy"><strong>Key needs identified</strong><span>China · 10 days · Private tour</span></span>'],
  ['<span class="ew-flow-copy"><strong>生成方案初稿</strong><span>高意向 · 行程初稿 · 顾问接管</span></span>',
   '<span class="ew-flow-copy"><strong>Itinerary draft generated</strong><span>High intent · Draft itinerary · Consultant handoff</span></span>'],

  /* ===== S4 AI 接待官 ===== */
  ["AI Agent · 文小旅", "AI Agent · Wenxiaolv"],
  ["文小旅，你的 7×24 小时<br>多语种 AI 接待官", "Wenxiaolv — Your 24/7<br>Multilingual AI Receptionist"],
  ["你熟睡的 8 小时，正是欧美客户的咨询高峰", "While you sleep, Europe and America are wide awake — and asking"],
  ["你好，我是文小旅 👋", "Hi, I'm Wenxiaolv 👋"],
  ["预约 AI 接待体验", "Book an AI Reception Consultation"],
  ["预约体验", "Book a Consultation"],
  ["全时段智能值守", "Always-On Coverage"],
  ["欧美夜间全自动响应，深夜 3 秒应答，商机一分钟都不错过。", "Automatic replies through the night in 3 seconds — no lead left waiting."],
  ["深夜 3 秒响应，商机不错过", "3-second response at midnight"],
  ["New York · 询盘进入", "New York · New inquiry"],
  ["3s 内 AI 应答", "AI replied in 3s"],
  ["London · 行程咨询", "London · Itinerary question"],
  ["AI 值守中", "AI on duty"],
  ["Sydney · 售后确认", "Sydney · After-sales"],
  ["自动处理", "Handled automatically"],
  ["多语种无缝沟通", "Seamless Multilingual"],
  ["英法德西日等 12 种主流语言实时互译，客户说啥都接得住。", "12 major languages in real time — whatever your customer speaks, AI keeps up."],
  ["12 种语言，实时切换零障碍", "12 languages, zero friction"],
  ["智能需求挖掘", "Smart Intent Mining"],
  ["边聊边建档：目的地、时间、人数、预算自动提取，客户画像实时生成。", "Profiles built mid-conversation: destination, dates, party size, budget — structured in real time."],
  ["边聊边建档，需求自动结构化", "Needs structured as you chat"],
  ["线索自动分级", "Automatic Lead Scoring"],
  ["高意向秒转人工顾问，普通咨询 AI 继续承接，人力用在刀刃上。", "Hot leads go straight to your agents; routine questions stay with AI."],
  ["高意向转人工，普通咨询 AI 包办", "Hot leads to humans, the rest to AI"],
  ["转人工 →", "To agent →"],
  ["AI 承接", "AI handles"],
  ["AI 智能方案", "Instant AI Itineraries"],
  ["10 分钟出行程 + 报价，人工 3 小时的活，AI 一杯咖啡的时间干完。", "Itinerary + quote in 10 minutes — what takes a human 3 hours."],
  ["10 分钟出行程报价，效率 18 倍", "10-minute itineraries, 18× faster"],
  ["人工做单 · 小时", "Manual · hours"],
  ["AI 生成 · 分钟", "AI · minutes"],
  ["行程草案", "Itinerary draft"],
  ["6 天 5 晚 · 含双语 PDF 行程册", "6 days 5 nights · Bilingual PDF"],
  ["已生成 ✓", "Ready ✓"],
  ["报价单", "Quote"],
  ["成本 / 利润自动核算", "Auto cost & margin"],
  ["<span class=\"label\">全时值守</span>", "<span class=\"label\">Always-On</span>"],
  ["<span class=\"label\">多语种沟通</span>", "<span class=\"label\">Multilingual</span>"],
  ["<span class=\"label\">智能挖需</span>", "<span class=\"label\">Intent Mining</span>"],
  ["<span class=\"label\">线索分级</span>", "<span class=\"label\">Lead Scoring</span>"],
  ["<span class=\"label\">秒出方案</span>", "<span class=\"label\">Instant Plans</span>"],

  /* ===== S5 数据与规模 ===== */
  ["全球投放，<span class=\"grad-text\">全流程布局</span>", "Global Reach, <span class=\"grad-text\">End-to-End Launch</span>"],
  ["从海外投放与有效线索筛选，到多语种沟通、签约上线，一条链路持续承接全球客源",
   "From global campaigns and lead screening to multilingual conversations and launch — one connected growth journey"],
  ["全球投放国家／地区", "Countries / regions reached"],
  ["海外客户线索有效筛选", "Overseas lead screening coverage"],
  ["节约人工成本", "Manual labor cost savings"],
  ["语种互译", "Languages with two-way translation"],
  ["全流程布局 · 签约到上线接单", "Full rollout · signing to first orders"],
  ['data-count="7" data-suffix=" 天">7 天</b>', 'data-count="7" data-suffix=" days">7 days</b>'],
  ["旅游产品资源库 · 管理平台标准线、私户产品与目的地资源包", "Resource Cloud · Standard tours, private products & destination bundles"],
  ["旅游产品资源库 · 线路 / 酒店 / 地接一站式管理", "Resource Cloud · Tours / hotels / operators in one place"],
  ["套餐用量 · AI 用量明细透明可查", "Usage · Transparent AI consumption"],
  ["AI 用量明细 · 消耗透明实时可查", "AI usage · Real-time transparency"],

  /* ===== S6 案例 ===== */
  ["Customer Stories", "Customer Stories"],
  ["文数智旅为你<br>接住全球客源", "Wenshu Travel Connects You<br>with Travelers Worldwide"],
  ["他们如何用文数智旅<br>接住全球客源？", "How They Capture<br>Global Demand with Wenshu"],
  ["获取增长方案", "Get a Growth Plan"],
  ["国际旅行社", "International Travel Agency"],
  ["全球客源 · 规模化引流 · 资源打通", "Global demand · Scaled acquisition · Connected resources"],
  ["入境游地接社", "Inbound Ground Operator"],
  ["落地接待 · 响应提速 · 转化提升", "Ground handling · Faster response · Higher conversion"],
  ["精品旅游公司", "Boutique Travel Studio"],
  ["高端定制 · 高净值客群 · 品牌溢价", "Luxury custom · HNW clients · Brand premium"],
  ["景区 / 文旅集团", "Scenic Spot / Culture-Tourism Group"],
  ["国际客流 · 品牌影响力 · 客源多元", "International traffic · Brand reach · Diverse sources"],
  ["查看全部客户案例", "View all case studies"],
  ["国际旅行团在旅途中合影", "Travelers together on a journey"],
  ["游客在机场集合出行", "Travelers meeting at the airport"],
  ["游客乘坐旅游接驳车", "Travelers aboard a tour shuttle"],
  ["游客在日月山景区合影", "Travelers at Sun Moon Mountain"],

  /* ===== S7 Navos 组件骨架迁移 ===== */
  ["Why Wenshu", "Why Wenshu"],
  ["为什么选择文数智旅", "Why Wenshu Travel"],
  ["六项核心能力，把海外获客、多语种接待、方案生产与经营数据真正连成一条链路。", "Six connected capabilities bring global acquisition, multilingual reception, itinerary production and operating data into one workflow."],
  ["选择理由视图", "Why Wenshu views"],
  ["优势", "Advantages"],
  ["对比", "Compare"],
  ["全链路 AI 协同", "Full-Chain AI Collaboration"],
  ["从市场洞察、内容获客到咨询承接、行程报价与履约复盘，各环节围绕同一份客户需求协作。", "From market insight and acquisition to inquiry handling, quoting and fulfillment reviews, every stage works from the same customer brief."],
  ["全球业务协同示意", "Global workflow collaboration"],
  ["客户数据持续沉淀", "Customer Data That Compounds"],
  ["客户档案、咨询记录、订单进度与渠道效果回到企业系统，形成可复用的经营资产。", "Profiles, conversations, order progress and channel performance return to your business as reusable operating assets."],
  ["文数智旅经营数据看板", "Wenshu Travel operating dashboard"],
  ["入境游经验背书", "Inbound Tourism Expertise"],
  ["理解游客、线路、地接与跨境获客的真实约束，让 AI 输出能进入业务流程，而不只停在一段文案。", "We understand travelers, itineraries, ground operations and cross-border acquisition, so AI output moves into real workflows instead of stopping at copy."],
  ["数据分析与业务监控能力示意", "Analytics and operations monitoring"],
  ["AI 增强经营决策", "AI-Augmented Decisions"],
  ["把渠道、咨询与成交变化汇成下一步动作。", "Turn changes in channels, inquiries and bookings into the next action."],
  ["经营异常提醒", "Operating alert"],
  ["7×24 多语种值守", "24/7 Multilingual Coverage"],
  ["跨时区咨询先由 AI 即时接住，自动识别语言、梳理需求并分级；高意向线索再交给人工顾问。", "AI answers across time zones, detects language, structures needs and scores intent before handing high-value leads to a human advisor."],
  ["数据与权限边界清晰", "Clear Data and Access Boundaries"],
  ["以账号、权限与流程管理业务数据，关键节点保留人工接管。", "Manage business data through accounts, permissions and workflows, with human control at key moments."],
  ["数据安全防护示意", "Data protection"],
  ["传统多工具拼接", "Traditional Tool Stack"],
  ["获客、接待与交付彼此割裂", "Acquisition, reception and delivery stay fragmented"],
  ["跨时区咨询依赖人工值班", "Cross-time-zone inquiries depend on staff coverage"],
  ["行程与报价反复手工整理", "Itineraries and quotes require repeated manual work"],
  ["客户数据散落在个人账号", "Customer data remains scattered across personal accounts"],
  ["<h3 class=\"nm-compare-card__head\">文数智旅</h3>", "<h3 class=\"nm-compare-card__head\">Wenshu Travel</h3>"],
  ["咨询承接", "Inquiry handling"],
  ["全时在线", "Always on"],
  ["服务语言", "Languages"],
  ["12 种", "12"],
  ["行程方案", "Itinerary draft"],
  ["10 分钟", "10 min"],
  ["客户数据", "Customer data"],
  ["企业沉淀", "Business-owned"],
  ["通用 AI 工具", "General AI Tools"],
  ["不理解文旅产品与履约约束", "No understanding of travel products or fulfillment constraints"],
  ["无法持续追踪线索进度", "Cannot continuously track lead progress"],
  ["缺少资源库与报价联动", "No connection between resources and quoting"],
  ["难以连接后续交付流程", "Hard to connect downstream delivery"],
  ["相关数据仅作参考，实际结果因业务基础与实施范围而异。", "The figures are provided for reference; results vary by business context and implementation scope."],

  ["Built for Every Role", "Built for Every Role"],
  ["适配文旅团队的不同角色", "Built for Every Travel Team Role"],
  ["AI 协同处理重复工作，让每个岗位更专注于判断、服务与成交。", "AI handles repetitive work so every role can focus on judgment, service and conversion."],
  ["经营管理者", "Business Leaders"],
  ["在一张看板中掌握客源、咨询、成交与履约节奏，用完整数据做经营判断。", "See demand, inquiries, bookings and fulfillment in one view, and make decisions from complete operating data."],
  ["海外获客运营", "Global Acquisition Teams"],
  ["从市场洞察到广告复盘形成闭环，及时把有效客群与内容方向沉淀下来。", "Close the loop from market insight to campaign review and retain what works across audiences and content."],
  ["接待与计调团队", "Reception and Operations Teams"],
  ["让 AI 先完成多语种沟通、需求整理与方案初稿，人工专注高价值服务。", "Let AI handle multilingual conversations, structure needs and draft plans while people focus on high-value service."],

  ["AI-Native Operations", "AI-Native Operations"],
  ["AI 原生时代的入境游增长方式", "An AI-Native Way to Grow Inbound Tourism"],
  ["以下场景展示 AI 在文旅业务中的典型应用。", "The following scenarios show how AI is applied across representative tourism workflows."],
  ["业务数据摘要", "Business data summary"],
  ["10,000+ 海外客户触达", "10,000+ global travelers reached"],
  ["12 种主流语言", "12 major languages"],
  ["12主流语言", "12 major languages"],
  ["7 天上线流程", "7-day launch workflow"],
  ["文数智旅业务场景", "Wenshu Travel workflows"],
  ["业务场景卡片流", "Business workflow card stream"],
  ["暂停动态", "Pause motion"],
  ["继续动态", "Resume motion"],
  ["全球客源拓展", "Global Demand Generation"],
  ["把海外官网、社媒与广告带来的咨询统一接入，优先识别高意向线索，再交给顾问跟进。", "Bring inquiries from global sites, social and ads into one flow, identify high-intent leads first, then hand them to an advisor."],
  ["国际市场运营", "International Market Operations"],
  ["围绕目标客源市场持续沉淀内容、渠道与转化数据，让品牌传播与实际客流使用同一套反馈。", "Keep content, channel and conversion data for each source market so brand activity and real visitor demand share one feedback loop."],
  ["多语种接待", "Multilingual Reception"],
  ["跨时区咨询先由 AI 接住并整理人数、时间、预算与偏好，减少等待，也减少反复确认。", "AI receives cross-time-zone inquiries and structures party size, dates, budget and preferences, reducing both wait time and repeated questions."],
  ["运营负责人", "Operations Leads"],
  ["数据复盘", "Performance Review"],
  ["获客来源、咨询质量、方案进度与成交结果集中查看，团队不再靠多份表格拼接经营全貌。", "View acquisition sources, inquiry quality, proposal progress and bookings together instead of reconstructing the business from multiple spreadsheets."],
  ["定制方案生产", "Custom Itinerary Production"],
  ["围绕高净值客户偏好匹配线路与资源，先生成可编辑方案初稿，再由定制师完成价值判断。", "Match itineraries and resources to high-value traveler preferences, create an editable first draft, then let specialists make the final judgment."],
  ["一线旅行顾问", "Travel Advisors"],
  ["人机协同", "Human + AI Collaboration"],
  ["常规咨询由 AI 持续承接，高意向或复杂需求一键转人工，把顾问时间留给真正需要人的时刻。", "AI keeps routine conversations moving while high-intent or complex needs transfer to people, preserving advisor time for moments that need it."],
  ["所示数据仅作参考，实际结果因项目范围、业务基础与实施条件而异。", "The figures are provided for reference; results vary by project scope, business context and implementation conditions."],

  ["Connected Ecosystem", "Connected Ecosystem"],
  ["无缝构建入境游增长生态", "Build a Seamless Inbound Growth Ecosystem"],
  ["衔接海外获客入口、AI 接待、文旅资源、订单履约与经营数据，无需反复切换工具，快速融入现有工作流。", "Connect global acquisition, AI reception, travel resources, order fulfillment and operating data without repeatedly switching tools."],
  ["可衔接的业务环节", "Connected workflow stages"],
  ["海外官网", "Global websites"],
  ["社媒线索", "Social leads"],
  ["私域咨询", "Direct inquiries"],
  ["文旅资源库", "Travel resources"],
  ["订单履约", "Order fulfillment"],
  ["经营看板", "Operating dashboard"],
  ["平台连接范围以项目方案与授权接口为准", "Platform coverage depends on the project scope and authorized integrations"],
  ["文数智旅业务生态连接图", "Wenshu Travel ecosystem map"],
  ["alt=\"文数智旅\"", "alt=\"Wenshu Travel\""],
  ["一套系统贯通增长全链路", "One system across the growth journey"],
  [">获</b>", ">A</b>"],
  [">接</b>", ">R</b>"],
  [">资</b>", ">P</b>"],
  [">履</b>", ">F</b>"],
  [">客</b>", ">C</b>"],
  [">数</b>", ">D</b>"],
  ["海外获客", "Global acquisition"],
  ["AI 接待", "AI reception"],
  ["产品资源", "Product resources"],
  ["客户档案", "Customer profiles"],
  ["经营数据", "Operating data"],

  /* ===== S8 合作模式 ===== */
  ["Partnership", "Partnership"],
  ["透明合作，效果说话", "Transparent Partnership, Results First"],
  ["不赚服务费差价，赚你增长的钱——合作结构与效果深度绑定", "No markup on service fees — we earn when you grow"],
  ["透明收费", "Transparent Pricing"],
  ["基础技术服务费 + 广告预算自主充值——直充官方媒体后台，消耗明细实时可查；运营服务费与效果绑定。",
   "Base tech fee + ad budget you top up directly on official media platforms — every cent traceable; our service fee is tied to results."],
  ["具体金额以专属方案为准", "Exact pricing in your custom proposal"],
  ["效果导向", "Performance-Linked"],
  ["投放效果与运营分成深度绑定，风险共担——我们只在你增长时获益。",
   "Our revenue share is bound to campaign performance — shared risk, shared upside. We profit only when you grow."],
  ["合作价值：AI 替代 80% 重复人工，运营成本直降 30%+", "Value: AI replaces 80% of repetitive work, cutting ops cost 30%+"],
  ["7 天上线", "Live in 7 Days"],
  ["一周打通从 0 到 1 的海外获客链路，旺季不等人，红利先到先得。",
   "From zero to a working global acquisition pipeline in one week — peak season waits for no one."],
  ["从签约到上线接单，全程陪跑", "Full support from signing to first order"],
  ["需求定调", "Alignment"],
  ["锁定客源国<br>与主推线路", "Target markets &<br>flagship tours"],
  ["系统基建", "Setup"],
  ["AI 客服上线<br>支付通道打通", "AI live,<br>payments connected"],
  ["全域造势", "Launch"],
  ["社媒矩阵 + 首投<br>广告测试", "Social matrix +<br>first ad tests"],
  ["询盘转化", "Conversion"],
  ["首批咨询回款<br>商业闭环验证", "First deals closed,<br>loop validated"],
  ["早一天启动，早一天抢下<span class=\"grad-text\">入境游红利</span>", "Start a Day Earlier, <span class=\"grad-text\">Capture the Inbound Boom</span>"],
  ["留下联系方式，顾问将在 1 个工作日内为你定制专属增长方案", "Leave your contact — a consultant will craft your growth plan within 1 business day"],
  ["手机号码", "Phone / WhatsApp"],
  ["请输入手机号码", "Your phone or WhatsApp"],
  ["如何称呼您", "Your name"],
  ["公司名称", "Company name"],
  ["请输入您的公司名称", "Your company"],
  ["业务类型", "Business type"],
  ["请选择业务类型", "Select your business type"],
  ["国际旅行社", "International travel agency"],
  ["入境游地接社", "Inbound ground operator"],
  ["精品旅游公司", "Boutique travel studio"],
  ["景区 / 文旅集团", "Scenic spot / culture-tourism group"],
  ["其他", "Other"],
  ["提交即表示同意", "By submitting you agree to our "],
  ["《隐私政策》", "Privacy Policy"],
  ["，我们承诺不泄露您的信息", ". We never share your data."],
  ["已收到您的信息", "Received!"],
  ["顾问将在 1 个工作日内联系您，请保持手机畅通", "A consultant will reach out within 1 business day"],

  /* ===== Footer ===== */
  ["AI + 入境游全链路增长系统，帮你把入境游客源、品牌与数据资产攥在自己手里。",
   "The AI-powered inbound tourism growth system — own your customers, brand and data."],
  ["产品能力", "Products"],
  ["AI 智能接待", "AI Reception"],
  ["智能方案", "Itinerary Builder"],
  ["海外获客", "Global Acquisition"],
  ["订单管理", "Order Management"],
  ["数据看板", "Data Dashboard"],
  ["了解我们", "Company"],
  ["关于我们", "About"],
  ["合作模式", "Partnership"],
  ["联系方式", "Contact"],
  ["咨询热线：13558835750", "Hotline: +86 135 5883 5750"],
  ["提交表单，顾问将在 1 个工作日内联系", "Submit the form — a consultant will contact you within 1 business day"],
  ["服务覆盖目的地、景区与旅行社", "Serving destinations, scenic areas and travel agencies"],
  ["数据仅用于方案沟通", "Data is used only for proposal communication"],
  ["电话咨询", "Call Us"],
  ["邮箱待补充", "Email: coming soon"],
  ["地址待补充", "Address: coming soon"],
  ["© 2026 文数智旅 · 保留所有权利", "© 2026 Wenshu Travel · All rights reserved"],
  ["隐私政策", "Privacy Policy"],
  ["ICP 备案号待申请", "ICP filing pending"],

  /* ===== 右侧悬浮栏 ===== */
  [">获取方案\n", ">Get a Plan\n"],
  ["资料领取", "Get Resources"],
  ["预约体验\n", "Book a Consultation\n"],
  ["微信咨询", "WeChat"],
  ["回顶部", "Top"],

  /* ===== AI 顾问气泡 ===== */
  ["人工客服", "Customer Support"],
  ["打开在线咨询", "Open support chat"],
  ["关闭在线咨询", "Close support chat"],
  ["人工接待 · 点击连接", "Human support · Click to connect"],
  ["很高兴为您服务", "We are happy to help"],
  ["人工客服 · 在线接待", "Human support · Online"],
  ["在线咨询", "Online chat"],
  ["继续咨询", "Resume chat"],
  ["常见问题", "Common questions"],
  ["留下电话，方便顾问联系", "Leave your phone so a consultant can reach you"],
  ["联系电话（可选）", "Phone (optional)"],
  ["价格怎么计算？", "How is pricing calculated?"],
  ["多久可以上线？", "How soon can we launch?"],
  ["欢迎您来咨询，请问有什么可以帮到您？我们会尽快为您解答。", "Welcome — how can we help? Our team will reply as soon as possible."],
  ["您好，请留下您的问题。客服回复后会显示在这里。", "Hello. Leave your question here and a staff reply will appear in this window."],
  ["请输入电话号码", "Enter your phone number"],
  ["电话联系", "Call us"],
  ["文数智旅人工客服 · 消息由 xuntingtravel 团队回复", "Wenshu Travel support · Replies from the xuntingtravel team"],
  ["静音提示音", "Mute notification sound"],
  ["打开提示音", "Unmute notification sound"],
  ["暂时无法连接客服", "Support is temporarily unavailable"],
  ["重新连接", "Reconnect"],
  ["聊天工具", "Chat tools"],
  ['aria-label="插入表情"', 'aria-label="Insert emoji"'],
  ['aria-label="图片"', 'aria-label="Image"'],
  ['aria-label="文件"', 'aria-label="File"'],
  ['aria-label="提醒"', 'aria-label="Notifications"'],
  ["本次沟通已结束，请您继续浏览网站。", "This conversation has ended. Please continue browsing."],
  ["沟通已结束，您可以", "This conversation has ended. You can"],
  ["继续对话", "Continue chat"],
  ["在线留言", "Leave a message"],
  ["本次沟通已结束", "Conversation ended"],
  ["当前客服人员不在线", "Our support team is currently offline"],
  ["请您留言", "Leave a message"],
  ["感谢您的关注，Our support team is currently offline，请填写一下您的信息，留言会同步给 xuntingtravel 团队，我们会尽快和您联系。", "Thank you for reaching out. Our support team is currently offline; leave your details and your message will be shared with the xuntingtravel team. We will contact you shortly."],
  ["感谢您的关注，当前客服人员不在线，请填写一下您的信息，留言会同步给 xuntingtravel 团队，我们会尽快和您联系。", "Thank you for reaching out. Our support team is currently offline; leave your details and your message will be shared with the xuntingtravel team. We will contact you shortly."],
  ["请在此输入留言内容，我们会尽快与您联系。（必填）", "Enter your message and we will contact you shortly. (Required)"],
  ["电话（必填）", "Phone (required)"],
  ["公司地址（必填）", "Company address (required)"],
  ["人工客服留言", "Human support message"],
  ["请填写留言、有效电话和公司地址。", "Please enter a message, valid phone and company address."],
  ["留言已提交，我们会尽快与您联系。", "Your message was received. We will contact you shortly."],
  ["当前支持文字咨询；图片和文件可在留言中说明，客服会继续跟进。", "Text chat is supported here. Describe an image or file in your message and our team will follow up."],
  ["当前处于离线状态，请恢复网络后重试", "You are offline. Reconnect and try again."],
  ["网络已恢复，正在重新连接…", "Back online. Reconnecting…"],
  ["连接失败，可重新连接或电话咨询", "Connection failed. Reconnect or call us."],
  ["连接中断，消息已保留，请重新连接", "Disconnected. Your message is retained; please reconnect."],
  ["发送未确认，请重试；不会重复发送", "Send not confirmed. Retry safely without a duplicate."],
  ['aria-label="咨询内容"', 'aria-label="Message"'],
  ["您好，您可以点击下方问题，了解<b>合作模式、价格、上线周期</b>。具体业务需求请联系产品顾问。",
   "Select a question below for information about <b>partnership, pricing, or launch timeline</b>. Contact a consultant to discuss your business needs."],
  ["合作模式是什么？", "How does partnership work?"],
  ["价格怎么算？", "How much does it cost?"],
  ["多久能上线？", "How fast can we launch?"],
  ["预约产品体验", "Book a Consultation"],
  ["输入手机号，预约顾问联系", "Enter your phone number to request a callback"],
  ["请填写有效电话号码（可包含国家区号）。", "Please enter a valid phone number, including the country code if needed."],

  /* ===== 留资模态窗 ===== */
  ["留下联系方式，顾问将在 1 个工作日内与您联系", "Leave your contact — a consultant will reach out within 1 business day"],
  ["立即提交", "Submit"],
  ["提交成功", "Submitted"],
  ["顾问将在 1 个工作日内联系您，请保持手机畅通", "A consultant will reach out within 1 business day"],
  ["咨询定制化服务", "Custom Solutions Inquiry"],

];

let replaced = 0, missed = [];

/*
 * The migrated homepage component contains several intentionally short labels
 * (for example “优势”, “10 分钟” and “AI 接待”). Applying those mappings to
 * the whole document can partially translate unrelated copy before its longer,
 * context-aware mapping runs. Keep this contiguous S7 mapping group scoped to
 * the migrated sections and leave the legacy translation table unchanged.
 */
const nmMappingStart = T.findIndex((entry, index) =>
  entry[0] === "Why Wenshu" && T[index + 1]?.[0] === "为什么选择文数智旅"
);
const nmMappingEnd = T.findIndex((entry, index) =>
  index > nmMappingStart && entry[0] === "经营数据"
);
if (nmMappingStart < 0 || nmMappingEnd < nmMappingStart) {
  throw new Error("Unable to locate the migrated-section translation range.");
}

function replaceInNavosMigration(zh, en) {
  const start = out.indexOf('<section class="nm-section nm-dark nm-why"');
  const end = out.indexOf('<!-- ================= S8', start);
  if (start < 0 || end < 0) return false;

  const block = out.slice(start, end);
  if (!block.includes(zh)) return false;
  out = out.slice(0, start) + block.split(zh).join(en) + out.slice(end);
  return true;
}

for (let index = 0; index < T.length; index++) {
  const [zh, en] = T[index];
  const scopedToMigration = index >= nmMappingStart && index <= nmMappingEnd;
  const matched = scopedToMigration
    ? replaceInNavosMigration(zh, en)
    : out.includes(zh);

  if (matched) {
    if (!scopedToMigration) out = out.split(zh).join(en);
    replaced++;
  } else {
    missed.push(zh.slice(0, 40));
  }
}

/* ---------- 4. JS 内的中文文案 ---------- */
const JS_T = [
  ['"海外获客成本直降 60%+，游客数据 100% 归你"', '"Acquisition cost down 60%+. Your customer data, 100% yours."'],
  ['"AI Agent 7×24 多语种接待，深夜商机不再流失"', '"AI agents answer in 12 languages, 24/7 — no more lost midnight leads."'],
  ['"全域获客", "AI 智能接待", "AI 方案生成"', '"Global Acquisition", "AI Reception", "AI Itinerary"'],
  ["我们采用「基础技术服务费 + 广告预算自主充值 + 效果绑定运营分成」的透明结构：广告费直充官方后台、明细实时可查，运营分成与您的增长效果绑定。具体金额以专属方案为准。",
   "A transparent structure: base tech fee + ad budget you top up yourself + performance-linked revenue share. Ad spend goes straight to official platforms with real-time receipts. Exact pricing comes with your custom proposal."],
  ["价格按合作结构报价：基础技术服务费 + 效果绑定的运营分成，不赚服务费差价。投放预算由您直充官方媒体后台，每一分消耗都透明可查。留下联系方式，顾问会为您出一份专属方案。",
   "Pricing follows the partnership structure: base tech fee + performance-linked share, no hidden markups. You top up ad budget on official platforms — every cent traceable. Leave your contact and we'll craft a custom proposal."],
  ["标准链路 <b>7 天上线</b>：DAY 1 需求定调 → DAY 2-3 系统基建 → DAY 4-5 全域造势 → DAY 6-7 询盘转化。旺季不等人，越早启动越早承接红利。",
   "Standard launch in <b>7 days</b>: DAY 1 alignment → DAY 2-3 setup → DAY 4-5 launch → DAY 6-7 first conversions. Peak season waits for no one."],
  ["好的！请在下方输入框留下您的手机号，产品顾问将在 1 个工作日内联系您安排产品体验；也可以拨打热线 <b>13558835750</b> 直接预约。",
   "Sure! Leave your number below and a consultant will arrange your product consultation within 1 business day — or call <b>+86 135 5883 5750</b> directly."],
  ["这个问题顾问为您详细解答更准确～留下手机号，顾问 1 个工作日内联系您。",
   "A consultant can answer this best — leave your number and we'll reach out within 1 business day."],
  ["已收到您的手机号，产品顾问将在 <b>1 个工作日内</b>与您联系。您也可以先看看我们的 <b>7 天上线</b> 流程～",
   "Got it! A consultant will reach out within <b>1 business day</b>. Meanwhile, check out our <b>7-day launch</b> process."],
  ["收到！关于这个问题，建议让顾问为您详细解答——留下手机号，或拨打热线 <b>13558835750</b>。",
   "Noted! A consultant can answer this in detail — leave your number, or call <b>+86 135 5883 5750</b>."],
  ['leadTitle.textContent = btn.dataset.title || "获取专属增长方案";', 'leadTitle.textContent = btn.dataset.title || "Get Your Growth Plan";'],
];
for (const [zh, en] of JS_T) {
  if (out.includes(zh)) { out = out.split(zh).join(en); replaced++; }
  else { missed.push("[JS] " + zh.slice(0, 36)); }
}

/* ---------- 4b. 二次修补：首轮未覆盖/被部分替换污染的文案 ---------- */
/* 注意：长串在前、短串在后，避免子串抢先命中 */
const T2 = [
  /* ===== 客服组件二次修补（避免短词先替换造成中英混排） ===== */
  ["Customer Support · 在线接待", "Human support · Online"],
  ["文数智旅Customer Support · 消息由 xuntingtravel 团队回复", "Wenshu Travel support · Replies from the xuntingtravel team"],
  ["感谢您的关注，Our support team is currently offline，请填写一下您的信息，我们会尽快和您联系。", "Thank you for reaching out. Our support team is currently offline; please leave your details and we will contact you shortly."],
  ["Company address（必填）", "Company address (required)"],
  ["最小化", "Minimize"],
  ['placeholder="姓名"', 'placeholder="Name"'],
  ['placeholder="邮箱"', 'placeholder="Email"'],
  ['aria-label="电话号码"', 'aria-label="Phone number"'],
  ['<button type="submit">提交</button>', '<button type="submit">Submit</button>'],
  ["人工客服离线留言", "Offline human support message"],
  /* ===== S2 波浪区 · 能力卡片（ci-title / ci-tip） ===== */
  ["海外广告投放", "Global Ad Campaigns"],
  ["Google / Meta / TikTok / Instagram 广告与内容种草双轮驱动，精准触达高意向海外游客",
   "Ads + content seeding on Google / Meta / TikTok / Instagram, reaching high-intent travelers"],
  ["私域承接留资", "Private-Traffic Capture"],
  ["多语种落地表单结构化留资，3 秒内自动进入 WhatsApp 私域承接，游客不流失",
   "Multilingual forms capture structured leads — into WhatsApp within 3 seconds, no traveler lost"],
  ["SEO / SEM 截流", "SEO / SEM Capture"],
  ["关键词矩阵覆盖 \"china tour\" 等高意向检索词", "Keyword matrix covering high-intent queries like \"china tour\""],
  ["社媒内容种草", "Social Content Seeding"],
  ["短视频 + 图文种草，本地化内容打透旅行灵感场景", "Short video + posts — localized content that owns travel inspiration"],
  ["结构化表单", "Structured Forms"],
  ["多语种表单留资，需求字段结构化沉淀", "Multilingual forms with structured requirement fields"],
  ["全渠道询盘归集", "Omnichannel Inquiry Hub"],
  ["官网 / 社媒 / 邮件 / WhatsApp 咨询统一汇聚，一个后台全管理，询盘永不漏接",
   "Website / social / email / WhatsApp inquiries unified in one dashboard — never miss a lead"],
  ["AI 客服工作台", "AI Service Workspace"],
  ["7×24 多语种值守、智能需求挖掘、自动打标分级、一键转人工——回复又快又准",
   "24/7 multilingual coverage, intent mining, auto-tagging, one-click human handoff — fast and accurate"],
  ["智能需求挖掘", "Smart Intent Mining"],
  ["从对话中自动提取人数 / 预算 / 日期 / 偏好", "Auto-extracts party size / budget / dates / preferences from chat"],
  ["线索自动分级", "Automatic Lead Scoring"],
  ["高意向线索直达销售，低意向进入培育池", "Hot leads go straight to sales; the rest enter nurture pools"],
  ["可视化行程编排", "Visual Itinerary Builder"],
  ["拖拽式组合景点 / 酒店 / 车辆，像搭积木一样做行程，方案即改即得",
   "Drag-and-drop sights, hotels and vehicles — itineraries build like blocks, edits apply instantly"],
  ["自动成本核算", "Automatic Costing"],
  ["资源底价实时同步，利润率自由调节，一键生成双语 PDF 行程册，3 小时变 10 分钟",
   "Live resource pricing, adjustable margins, one-click bilingual PDF — 3 hours becomes 10 minutes"],
  ["公共资源池", "Shared Resource Pool"],
  ["酒店 / 车辆 / 导游底价库，团队共享实时更新", "Hotel / vehicle / guide base rates, shared and updated in real time"],
  ["双语行程册", "Bilingual Itinerary PDF"],
  ["一键生成双语 PDF 行程册，直接发给海外客人", "One-click bilingual PDF, ready to send to overseas guests"],
  ["订单全链管控", "End-to-End Order Control"],
  ["定金 / 尾款 / 资源确认 / 出行状态全节点追踪，异常自动预警，履约零疏漏",
   "Deposit / balance / resource confirmation / travel status tracked at every node — anomalies auto-flagged"],
  ["数据看板与客户资产", "Dashboard & Customer Assets"],
  ["询盘量 / 转化率 / 渠道 ROI 实时呈现，客户标签化档案沉淀，一次获客终身复用",
   "Inquiries / conversion / channel ROI in real time; tagged customer profiles compound over time"],
  ["供应商协同", "Supplier Collaboration"],
  ["资源确认状态在线流转，供应商一键同步", "Resource confirmations flow online, synced to suppliers in one click"],
  ["复购营销", "Repeat-Purchase Marketing"],
  ["客户标签化档案，节日 / 签证到期自动触达", "Tagged profiles trigger automated holiday / visa-expiry outreach"],

  /* ===== S4 · ag-copy 文案（须在 T 表短串命中前先行替换） ===== */
  ["智能需求挖掘", "Smart Intent Mining"],
  ["边聊边建档：目的地、时间、人数、预算自动提取，客户画像实时生成。",
   "Profiles built mid-conversation: destination, dates, party size, budget — structured in real time."],
  ["线索自动分级", "Automatic Lead Scoring"],
  ["10 分钟出行程 + 报价，人工 3 小时的活，AI 一杯咖啡的时间干完。",
   "Itinerary + quote in 10 minutes — what takes a human 3 hours."],

  /* ===== S2 · prop-label 功能词条 ===== */
  ['<div class="prop-label">SEO/SEM 截流</div>', '<div class="prop-label">SEO/SEM capture</div>'],
  ['<div class="prop-label">兴趣定向</div>', '<div class="prop-label">Interest targeting</div>'],
  ['<div class="prop-label">社媒种草</div>', '<div class="prop-label">Social seeding</div>'],
  ['<div class="prop-label">短视频引流</div>', '<div class="prop-label">Short-video traffic</div>'],
  ['<div class="prop-label">本地化内容</div>', '<div class="prop-label">Localized content</div>'],
  ['<div class="prop-label">表单留资</div>', '<div class="prop-label">Form capture</div>'],
  ['<div class="prop-label">WhatsApp 承接</div>', '<div class="prop-label">WhatsApp handoff</div>'],
  ['<div class="prop-label">私域沉淀</div>', '<div class="prop-label">Private domain</div>'],
  ['<div class="prop-label">7×24 值守</div>', '<div class="prop-label">24/7 coverage</div>'],
  ['<div class="prop-label">12 语种</div>', '<div class="prop-label">12 languages</div>'],
  ['<div class="prop-label">秒级响应</div>', '<div class="prop-label">Instant response</div>'],
  ['<div class="prop-label">智能挖需</div>', '<div class="prop-label">Intent mining</div>'],
  ['<div class="prop-label">线索分级</div>', '<div class="prop-label">Lead scoring</div>'],
  ['<div class="prop-label">夜间拦截</div>', '<div class="prop-label">Overnight capture</div>'],
  ['<div class="prop-label">成本降 60%</div>', '<div class="prop-label">Cost -60%</div>'],
  ['<div class="prop-label">拖拽编排</div>', '<div class="prop-label">Drag-and-drop</div>'],
  ['<div class="prop-label">资源库</div>', '<div class="prop-label">Resource pool</div>'],
  ['<div class="prop-label">公共资源池</div>', '<div class="prop-label">Shared pool</div>'],
  ['<div class="prop-label">自动核算</div>', '<div class="prop-label">Auto costing</div>'],
  ['<div class="prop-label">利润调节</div>', '<div class="prop-label">Margin control</div>'],
  ['<div class="prop-label">双语行程册</div>', '<div class="prop-label">Bilingual PDF</div>'],
  ['<div class="prop-label">秒级出案</div>', '<div class="prop-label">Instant drafts</div>'],
  ['<div class="prop-label">3小时→10分钟</div>', '<div class="prop-label">3h → 10min</div>'],
  ['<div class="prop-label">线索流转</div>', '<div class="prop-label">Lead routing</div>'],
  ['<div class="prop-label">话术推荐</div>', '<div class="prop-label">Script suggestions</div>'],
  ['<div class="prop-label">实时翻译</div>', '<div class="prop-label">Live translation</div>'],
  ['<div class="prop-label">行程即改</div>', '<div class="prop-label">Live edits</div>'],
  ['<div class="prop-label">报价联动</div>', '<div class="prop-label">Linked quotes</div>'],
  ['<div class="prop-label">跟单提醒</div>', '<div class="prop-label">Follow-up alerts</div>'],
  ['<div class="prop-label">成交看板</div>', '<div class="prop-label">Deal dashboard</div>'],
  ['<div class="prop-label">订单追踪</div>', '<div class="prop-label">Order tracking</div>'],
  ['<div class="prop-label">异常预警</div>', '<div class="prop-label">Anomaly alerts</div>'],
  ['<div class="prop-label">供应商协同</div>', '<div class="prop-label">Supplier sync</div>'],
  ['<div class="prop-label">对账导出</div>', '<div class="prop-label">Reconciliation export</div>'],
  ['<div class="prop-label">转化漏斗</div>', '<div class="prop-label">Conversion funnel</div>'],
  ['<div class="prop-label">渠道 ROI</div>', '<div class="prop-label">Channel ROI</div>'],
  ['<div class="prop-label">客户档案</div>', '<div class="prop-label">Customer profiles</div>'],
  ['<div class="prop-label">复购营销</div>', '<div class="prop-label">Repeat marketing</div>'],

  /* ===== S2 · 双角色卡（person-box） ===== */
  ["我是旅行社销售", "I'm a Travel Sales Rep"],
  ["高意向线索自动直达，告别盲目跟单", "Hot leads routed to you automatically — no more blind follow-ups"],
  ["预约产品体验", "Book a Consultation"],
  ["客户背景秒看", "Instant Lead Context"],
  ["线索自带画像：来源、语言、人数、预算一屏尽览，开口就有底。",
   "Every lead arrives with a profile — source, language, party size, budget on one screen."],
  ["AI 话术辅助", "AI Script Assist"],
  ["按客户国籍与行程偏好推荐话术，多语种回复一键生成。",
   "Reply scripts matched to nationality and trip preferences, generated in one click."],
  ["跟单自动提醒", "Auto Follow-up Reminders"],
  ["关键节点自动触达，高意向客户不漏跟、不失联。",
   "Automated touchpoints at key moments — hot leads never slip away."],
  ["我是定制顾问", "I'm a Custom-Tour Consultant"],
  ["行程即改即得、报价实时核算，专注成交", "Live itinerary edits, real-time quotes — focus on closing"],
  ["预约产品体验", "Book a Consultation"],
  ["1 对 1 深度转化", "1-on-1 Deep Conversion"],
  ["高意向线索优先分配，AI 已完成挖需，直接进入方案沟通。",
   "Hot leads assigned first — AI has already mined needs, you jump straight to the proposal."],
  ["方案实时改", "Live Plan Edits"],
  ["客人一句\"换个酒店\"，行程与报价联动更新，当场给答案。",
   "Client says \"swap the hotel\" — itinerary and quote update together, answered on the spot."],
  ["成交看板", "Deal Dashboard"],
  ["转化漏斗与跟单周期可视化，团队效率一目了然。",
   "Funnels and follow-up cycles visualized — team efficiency at a glance."],

  /* ===== S4 · 多语种演示 ===== */
  ["<i>EN 英语</i><i>FR 法语</i><i class=\"hot\">DE 德语</i><i>ES 西语</i><i class=\"hot\">JP 日语</i><i>+7 语种</i>",
   "<i>EN English</i><i>FR French</i><i class=\"hot\">DE German</i><i>ES Spanish</i><i class=\"hot\">JP Japanese</i><i>+7 more</i>"],
  ["<b style=\"color:var(--emerald-700)\">客户</b>Guten Tag, ist eine private Führung möglich?",
   "<b style=\"color:var(--emerald-700)\">Guest</b>Guten Tag, ist eine private Führung möglich?"],
  ["<b style=\"color:var(--gold-700)\">AI</b>您好，私人导览全程可安排，即刻为您锁定档期。",
   "<b style=\"color:var(--gold-700)\">AI</b>Absolutely — private tours fully available, dates locked in for you now."],

  /* ===== S4 · 智能挖需演示 ===== */
  ["<i class=\"hot\">目的地 · 桂林阳朔</i><i class=\"hot\">时间 · 11 月中旬</i><i>人数 · 2 大 1 小</i><i class=\"hot\">预算 · ¥2,000/人</i>",
   "<i class=\"hot\">Destination · Guilin Yangshuo</i><i class=\"hot\">Dates · Mid-Nov</i><i>Party · 2 adults 1 child</i><i class=\"hot\">Budget · $300/person</i>"],
  ["<b>CUSTOMER PROFILE · 自动生成</b>", "<b>CUSTOMER PROFILE · Auto-generated</b>"],
  ["亲子家庭游 · 偏好自然风光与轻徒步 · 需要英文司导 · 预算敏感度中等 → 推荐定制小团线",
   "Family trip · Nature & light hiking · Needs English-speaking driver-guide · Mid budget sensitivity → Recommend a private small-group tour"],

  /* ===== S4 · 线索分级演示 ===== */
  ["<b>🔥 高意向</b>预算明确 · 询问签约流程", "<b>🔥 Hot lead</b>Clear budget · Asking about contract"],
  ["<b>🔥 高意向</b>5 人小团 · 下月出行", "<b>🔥 Hot lead</b>Party of 5 · Traveling next month"],
  ["<b>普通咨询</b>签证政策了解", "<b>General</b>Visa policy question"],
  ["<b>普通咨询</b>资料包索取", "<b>General</b>Brochure request"],
  ["转人工 →", "To agent →"],
  ["AI 承接", "AI handles"],

  /* ===== S7 · 新闻与活动 ===== */
  ["文数智旅 AI 接待系统升级，多语种能力覆盖 12 种主流语言",
   "Wenshu AI reception upgraded — multilingual coverage now supports 12 major languages"],
  ["旅行社、地接社与景区场景的全链路数字化方案持续沉淀",
   "Full-chain digital solutions keep expanding across agencies, ground operators and scenic destinations"],
  ["入境游增长方法论持续更新，覆盖获客、承接与履约闭环",
   "Inbound growth methods now cover the full loop from acquisition to reception and fulfillment"],
  ["文数智旅 AI 接待系统全新升级，多语种能力扩展至 12 种（占位）",
   "Wenshu AI reception upgraded — multilingual coverage extended to 12 languages (placeholder)"],
  ["与多家头部旅行社达成全链路数字化合作（占位）",
   "Full-chain digital partnerships signed with leading travel agencies (placeholder)"],
  ["入境游增长白皮书即将发布，敬请期待（占位）",
   "Inbound Tourism Growth Whitepaper coming soon (placeholder)"],
  ["2026 入境游增长闭门沙龙 · 成都站（占位）",
   "2026 Inbound Growth Closed-Door Salon · Chengdu (placeholder)"],
  ["2026 入境游增长闭门沙龙 · 成都站",
   "2026 Inbound Growth Closed-Door Salon · Chengdu"],
  ["CITM 国际旅游交易会 · 展位互动回顾（占位）",
   "CITM International Travel Fair · Booth recap (placeholder)"],
  ["CITM 国际旅游交易会 · AI 承接场景交流",
   "CITM International Travel Fair · AI Reception Scenario Exchange"],
  ["文旅数字化峰会 · AI 承接专题分享（占位）",
   "Culture-Tourism Digital Summit · Featured talk on AI reception (placeholder)"],
  ["文旅数字化峰会 · AI 承接专题分享",
   "Culture-Tourism Digital Summit · Featured Talk on AI Reception"],

  /* ===== 表单 / 弹窗占位符 ===== */
  ['placeholder="请输入手机号码"', 'placeholder="Your phone or WhatsApp"'],
  ['placeholder="如何称呼您"', 'placeholder="Your name"'],
  ['placeholder="请输入您的公司名称"', 'placeholder="Your company"'],
  ["<option value=\"\">请选择业务类型</option>", "<option value=\"\">Select your business type</option>"],
  ["<option>国际旅行社</option>", "<option>International travel agency</option>"],
  ["<option>入境游地接社</option>", "<option>Inbound ground operator</option>"],
  ["<option>精品旅游公司</option>", "<option>Boutique travel studio</option>"],
  ["<option>景区 / 文旅集团</option>", "<option>Scenic spot / culture-tourism group</option>"],
  ["<option>其他</option>", "<option>Other</option>"],
  ["留下联系方式，顾问将在 1 个工作日内与您联系", "Leave your contact — a consultant will reach out within 1 business day"],

  /* ===== 聊天气泡 ===== */
  ["您好，您可以点击下方问题，了解<b>合作模式、价格、上线周期</b>。具体业务需求请联系产品顾问。",
   "Select a question below for information about <b>partnership, pricing, or launch timeline</b>. Contact a consultant to discuss your business needs."],
  ["合作模式是什么？", "How does partnership work?"],
  ["价格怎么算？", "How much does it cost?"],
  ["多久能上线？", "How fast can we launch?"],
  ["<button id=\"chatSend\">发送</button>", "<button id=\"chatSend\">Send</button>"],
  ["<span>发送</span>", "<span>Send</span>"],

  /* ===== 图片 alt 属性 ===== */
  ['alt="文数智旅 WENSHU TRAVEL"', 'alt="Wenshu Travel"'],
  ['alt="文小旅"', 'alt="Wenxiaolv"'],
  ['alt="智策"', 'alt="Zhice itinerary builder"'],
  ['alt="云仓"', 'alt="Yuncang resource cloud"'],
  ['alt="海外广告投放数据后台实拍"', 'alt="Global ad campaign dashboard"'],
  ['alt="广告目标选择界面截图（海外投放轮播）"', 'alt="Ad objective selection interface for overseas advertising"'],
  ['alt="广告投放列表与状态界面截图（海外投放轮播）"', 'alt="Ad campaign list and delivery status interface"'],
  ['alt="广告设置与业务模块界面截图（海外投放轮播）"', 'alt="Ad settings and business modules interface"'],
  ['alt="搜索引擎关键词建议界面截图（SEO/SEM）"', 'alt="Search engine keyword suggestions interface for SEO and SEM"'],
  ['alt="高播放量旅行短视频网格截图（社媒内容种草）"', 'alt="High-view travel short-video grid"'],
  ['alt="旅行创作者主页与置顶内容截图（社媒内容种草）"', 'alt="Travel creator profile and pinned content"'],
  ['alt="旅行创作者主页与置顶短视频截图（社媒内容种草）"', 'alt="Travel creator profile and pinned short videos"'],
  ['alt="WhatsApp 私域承接手机实拍"', 'alt="WhatsApp private-traffic handoff"'],
  ['alt="全渠道询盘工作台夜间值守实拍"', 'alt="Omnichannel inquiry workspace at night"'],
  ['alt="行程编排工作台实拍"', 'alt="Itinerary building workspace"'],
  ['alt="数据看板大屏实拍"', 'alt="Data dashboard"'],
  ['alt="文小旅 AI 接待官形象"', 'alt="Wenxiaolv AI receptionist"'],
  ['alt="景区文旅集团"', 'alt="Scenic spot & culture-tourism group"'],

  /* ===== aria-label ===== */
  ['aria-label="产品演示切换"', 'aria-label="Product feature switcher"'],
  ['aria-label="海外广告素材轮播"', 'aria-label="Overseas advertising media carousel"'],
  ['aria-label="私域承接留资素材"', 'aria-label="Private lead-capture media"'],
  ['aria-label="SEO / SEM 截流素材"', 'aria-label="SEO and SEM capture media"'],
  ['aria-label="社媒内容素材轮播"', 'aria-label="Social content media carousel"'],
  ['aria-label="轮播页签"', 'aria-label="Carousel pagination"'],
  ['<span class="sr-only">第 1 张</span>', '<span class="sr-only">Slide 1</span>'],
  ['<span class="sr-only">第 2 张</span>', '<span class="sr-only">Slide 2</span>'],
  ['<span class="sr-only">第 3 张</span>', '<span class="sr-only">Slide 3</span>'],
  ['<span class="sr-only">第 4 张</span>', '<span class="sr-only">Slide 4</span>'],
  ['aria-label="AI 接待官功能切换"', 'aria-label="AI receptionist feature switcher"'],
  ['aria-label="快捷入口"', 'aria-label="Quick actions"'],
  ['aria-label="回到顶部"', 'aria-label="Back to top"'],
  ['aria-label="在线咨询"', 'aria-label="Online chat"'],
  ['aria-label="关闭"', 'aria-label="Close"'],

  /* ===== 导航 title 属性 ===== */
  ['title="白皮书与行业洞察（即将上线）"', 'title="Whitepapers & industry insights (coming soon)"'],
  ['title="入境游洞察、活动沙龙与百科"', 'title="Inbound tourism insights, events and glossary"'],
];
for (const [zh, en] of T2) {
  if (out.includes(zh)) { out = out.split(zh).join(en); replaced++; }
  else { missed.push("[T2] " + zh.slice(0, 36)); }
}

/* ---------- 4c. JS 数据数组二次修补 ---------- */
const JS_T2 = [
  ['var segTitles = ["全域获客", "AI 智能接待", "AI 方案生成"];',
   'var segTitles = ["Global Acquisition", "AI Reception", "AI Itinerary"];'],
  ['{name:"全域获客", sub:"精准触达高意向游客"}', '{name:"Acquisition", sub:"Reach high-intent travelers"}'],
  ['{name:"AI 智能接待", sub:"7×24 多语种响应"}', '{name:"AI Reception", sub:"24/7 multilingual response"}'],
  ['{name:"智能方案", sub:"秒级行程与报价"}', '{name:"AI Itinerary", sub:"Instant plans & quotes"}'],
  ['{name:"顾问成交", sub:"1 对 1 深度转化"}', '{name:"Agent Closing", sub:"1-on-1 deep conversion"}'],
  ['{name:"数据与履约", sub:"追踪预警 · 数据反哺"}', '{name:"Data & Fulfillment", sub:"Tracking, alerts, data loop"}'],
  ["我们采用「基础技术服务费 + 广告预算自主充值 + 效果绑定运营分成」的透明结构：广告费直充官方后台、明细实时可查，运营分成与您的增长效果绑定。具体金额以专属方案为准。",
   "A transparent structure: base tech fee + ad budget you top up yourself + performance-linked revenue share. Ad spend goes straight to official platforms with real-time receipts. Exact pricing comes with your custom proposal."],
  ["价格按合作结构报价：基础技术服务费 + 效果绑定的运营分成，不赚服务费差价。投放预算由您直充官方媒体后台，每一分消耗都透明可查。留下联系方式，顾问会为您出一份专属方案。",
   "Pricing follows the partnership structure: base tech fee + performance-linked share, no hidden markups. You top up ad budget on official platforms — every cent traceable. Leave your contact and we'll craft a custom proposal."],
  ["标准链路 <b>7 天上线</b>：DAY 1 需求定调 → DAY 2-3 系统基建 → DAY 4-5 全域造势 → DAY 6-7 询盘转化。旺季不等人，越早启动越早承接红利。",
   "Standard launch in <b>7 days</b>: DAY 1 alignment → DAY 2-3 setup → DAY 4-5 launch → DAY 6-7 first conversions. Peak season waits for no one."],
  ["好的！请在下方输入框留下您的手机号，产品顾问将在 1 个工作日内联系您安排产品体验；也可以拨打热线 <b>13558835750</b> 直接预约。",
   "Sure! Leave your number below and a consultant will arrange your product consultation within 1 business day — or call <b>+86 135 5883 5750</b> directly."],
  ["这个问题顾问为您详细解答更准确～留下手机号，顾问 1 个工作日内联系您。",
   "A consultant can answer this best — leave your number and we'll reach out within 1 business day."],
  ["已收到您的手机号，产品顾问将在 <b>1 个工作日内</b>与您联系。您也可以先看看我们的 <b>7 天上线</b> 流程～",
   "Got it! A consultant will reach out within <b>1 business day</b>. Meanwhile, check out our <b>7-day launch</b> process."],
  ["收到！关于这个问题，建议让顾问为您详细解答——留下手机号，或拨打热线 <b>13558835750</b>。",
   "Noted! A consultant can answer this in detail — leave your number, or call <b>+86 135 5883 5750</b>."],
];
for (const [zh, en] of JS_T2) {
  if (out.includes(zh)) { out = out.split(zh).join(en); replaced++; }
  else { missed.push("[JS2] " + zh.slice(0, 36)); }
}

/* ---------- 4d. 结构性修补：首轮替换留下的半成品形态 ---------- */
/* 首轮 T 表存在子串抢先命中（如「数据看板」先于「数据看板与客户资产」、
   「需求定调」先于 QA 长串），这里把半成品形态一次性归位。 */
const PATCH = [
  /* 半成品 HTML */
  ['data-title="咨询Custom Solutions"', 'data-title="Custom Solutions Inquiry"'],
  ['<div class="group-title">解决方案</div>', '<div class="group-title">Solutions</div>'],
  ['aria-label="Products演示切换"', 'aria-label="Product feature switcher"'],
  ['alt="Global Ad Campaigns数据后台实拍"', 'alt="Global ad campaign dashboard"'],
  ['alt="AI Service Workspace多语种协同实景"', 'alt="Multilingual AI service workspace"'],
  ['alt="旅游方案Automatic Costing工作台实景"', 'alt="Automated itinerary costing workspace"'],
  ['alt="入境游End-to-End Order Control工作台实景"', 'alt="End-to-end inbound order operations workspace"'],
  ['7×24 多语种值守、智能Intent Mining、自动打标分级、一键转人工——回复又快又准',
   '24/7 multilingual coverage, intent mining, auto-tagging, one-click human handoff — fast and accurate'],
  ['<div class="ci-title">智能Intent Mining</div>', '<div class="ci-title">Smart Intent Mining</div>'],
  ['alt="Data Dashboard大屏实拍"', 'alt="Data dashboard"'],
  ['<div class="ci-title">Data Dashboard与客户资产</div>', '<div class="ci-title">Dashboard & Customer Assets</div>'],
  ['<span style="margin-left:auto">→中文引擎</span>', '<span style="margin-left:auto">→ AI engine</span>'],
  ['<h3>智能Intent Mining</h3>', '<h3>Smart Intent Mining</h3>'],
  ['边聊边建档：目的地、时间、人数、预算自动提取，Customer profile实时生成。',
   'Profiles built mid-conversation: destination, dates, party size, budget — structured in real time.'],
  ['10 分钟出行程报价，效率 18 倍', '10-minute itineraries, 18× faster'],
  ['<p>Itinerary + quote in 10 minutes，人工 3 小时的活，AI 一杯咖啡的时间干完。</p>',
   '<p>Itinerary + quote in 10 minutes — what takes a human 3 hours.</p>'],
  ['data-suffix=" 天"', 'data-suffix=" days"'],
  ['CITM 国际旅游交易会 · AI handles场景交流', 'CITM International Travel Fair · AI Reception Scenario Exchange'],
  ['文旅数字化峰会 · AI handles专题分享（占位）', 'Culture-Tourism Digital Summit · Featured talk on AI reception (placeholder)'],
  ['文旅数字化峰会 · AI handles专题分享', 'Culture-Tourism Digital Summit · Featured Talk on AI Reception'],
  ['<p class="fine">Days from signing to live，全程陪跑</p>', '<p class="fine">Full support from signing to first order</p>'],
  ['<p>AI-Powered Inbound Tourism Growth System，帮你把入境游客源、品牌与数据资产攥在自己手里。</p>',
   '<p>The AI-powered inbound tourism growth system — own your customers, brand and data.</p>'],
  ['<div class="cp-msg bot">您好，我是文小旅 🤖 关于<b>Partnership、价格、上线周期</b>，我都可以为您解答～也可以直接为您预约顾问。</div>',
   '<div class="cp-msg bot">Hi, I\'m Wenxiaolv 🤖 Ask me about <b>partnership, pricing, or launch timeline</b> — or I can book a consultant for you.</div>'],
  ['<button class="cp-chip" data-q="mode">Partnership是什么？</button>', '<button class="cp-chip" data-q="mode">How does partnership work?</button>'],
  ['<p class="m-sub">留下Contact，顾问将在 1 个工作日内与您联系</p>',
   '<p class="m-sub">Leave your contact — a consultant will reach out within 1 business day</p>'],
  ['placeholder="请输入Phone / WhatsApp"', 'placeholder="Your phone or WhatsApp"'],
  ['placeholder="请输入您的Company name"', 'placeholder="Your company"'],
  ['placeholder="如何称呼您"', 'placeholder="Your name"'],
  ['<option value="">请选择Business type</option>', '<option value="">Select your business type</option>'],
  /* 半成品 JS */
  ['"Global Acquisition成本直降 60%+，游客数据 100% 归你"',
   '"Acquisition cost down 60%+. Your customer data, 100% yours."'],
  ['"AI Reception", "AI 方案生成"', '"AI Reception", "AI Itinerary"'],
  ['{name:"AI Reception", sub:"7×24 多语种响应"}', '{name:"AI Reception", sub:"24/7 multilingual response"}'],
  ['{name:"Itinerary Builder", sub:"秒级行程与报价"}', '{name:"AI Itinerary", sub:"Instant plans & quotes"}'],
  ['{name:"顾问成交", sub:"1-on-1 Deep Conversion"}', '{name:"Agent Closing", sub:"1-on-1 deep conversion"}'],
  ["我们采用「基础技术服务费 + 广告预算自主充值 + 效果绑定运营分成」的透明结构：广告费直充官方后台、明细实时可查，运营分成与您的增长效果绑定。Exact pricing in your custom proposal。",
   "A transparent structure: base tech fee + ad budget you top up yourself + performance-linked revenue share. Ad spend goes straight to official platforms with real-time receipts. Exact pricing comes with your custom proposal."],
  ["价格按合作结构报价：基础技术服务费 + 效果绑定的运营分成，不赚服务费差价。投放预算由您直充官方媒体后台，每一分消耗都透明可查。留下Contact，顾问会为您出一份专属方案。",
   "Pricing follows the partnership structure: base tech fee + performance-linked share, no hidden markups. You top up ad budget on official platforms — every cent traceable. Leave your contact and we'll craft a custom proposal."],
  ["标准链路 <b>Live in 7 Days</b>：DAY 1 Alignment → DAY 2-3 Setup → DAY 4-5 Launch → DAY 6-7 Conversion。旺季不等人，越早启动越早承接红利。",
   "Standard launch in <b>7 days</b>: DAY 1 alignment → DAY 2-3 setup → DAY 4-5 launch → DAY 6-7 first conversions. Peak season waits for no one."],
  ["已收到您的手机号，产品顾问将在 <b>1 个工作日内</b>与您联系。您也可以先看看我们的 <b>Live in 7 Days</b> 流程～",
   "Got it! A consultant will reach out within <b>1 business day</b>. Meanwhile, check out our <b>7-day launch</b> process."],
];
let patched = 0;
for (const [a, b] of PATCH) {
  if (out.includes(a)) { out = out.split(a).join(b); patched++; }
  else { missed.push("[PATCH] " + a.slice(0, 36)); }
}
replaced += patched;

/* ---------- 4e. 新增洞察入口末端清理（避免短词替换造成 title 混排） ---------- */
out = out
  .replace(/title="入境游(?:洞察|Insights)、(?:活动沙龙|Events)与百科"/g, 'title="Inbound tourism insights, events and glossary"')
  .replace(/Insights中心/g, 'Insights Center');

/* data-title 属性统一英文化（留资弹窗标题来源） */
const DT = {
  "获取专属增长方案": "Get Your Growth Plan",
  "获取增长方案": "Get a Growth Plan",
  "预约产品体验": "Book a Consultation",
  "预约 AI 接待体验": "Book an AI Reception Consultation",
  "咨询定制化服务": "Custom Solutions Inquiry",
  "领取入境游获客资料": "Get Acquisition Resources",
  "预约体验": "Book a Consultation",
};
for (const [zh, en] of Object.entries(DT)) {
  out = out.split(`data-title="${zh}"`).join(`data-title="${en}"`);
}

/* ---------- 5. 输出 ---------- */
const OUT_DIR = path.join(ROOT, "en");
if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR, { recursive: true });
fs.writeFileSync(path.join(OUT_DIR, "index.html"), out, "utf8");

console.log(`✔ en/index.html (${Math.round(out.length / 1024)}KB) — ${replaced}/${T.length + JS_T.length} patterns replaced`);
if (missed.length) {
  console.log("\n未命中（需人工核对）:");
  missed.forEach(m => console.log("  - " + m));
}
