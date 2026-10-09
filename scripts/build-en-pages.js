/* ============================================================
   文数智旅 · 英文子页生成器
   从 pages/*.html 生成 en/pages/*.html：
   ① 共享文案沿用 build-en.js 同款补丁（导航/页脚/聊天/模态窗/QA）
   ② 子页正文按 dict-all.json 字典替换（744 条，术语统一）
   ③ 路径再 rebase 一层（en/pages/ → 资源 ../../）
   ④ 语言切换同页对映：en 侧"中"→ ../../pages/x.html；zh 侧 EN → ../en/pages/x.html
   用法：node scripts/build-en-pages.js
   ============================================================ */
const fs = require("fs");
const path = require("path");
const ROOT = path.resolve(__dirname, "..");

const DICT = JSON.parse(fs.readFileSync(path.join(__dirname, "dict-all.json"), "utf8"));

/* ---------- 共享补丁：与 build-en.js 的 T/T2/JS_T/JS_T2/PATCH 等效 ---------- */
/* 子页与首页共享导航、页脚、悬浮栏、聊天面板、留资模态窗、微信浮层、QA。
   这里内联同样的替换序列（保持 build-en.js 为单一事实源前，先复制演进）。 */
function loadSharedPatches() {
  /* 从 build-en.js 抽取：简单方式 —— 复用其表定义太耦合，这里直接内联最小集 */
  return [
    /* 导航 */
    ["理解需求、生成方案，让顾问更快接住跨语种咨询。", "Understand needs and build plans so advisors can respond across languages."],
    ["看清客源市场、入境趋势与海外社媒讨论。", "Understand source markets, inbound trends and overseas conversations."],
    ["从获客到履约，按业务环节选择可落地的方案。", "Choose practical solutions from acquisition through fulfillment."],
    ["政策与数据", "Policy and data"],
    ["文数智旅 首页", "Wenshu Travel Home"],
    ["<span>产品</span>", "<span>Products</span>"],
    ["<span>解决方案</span>", "<span>Solutions</span>"],
    ["<span>关于我们</span>", "<span>About</span>"],
    [">首页</a>", ">Home</a>"],
    [">客户案例</a>", ">Case Studies</a>"],
    ["真实游客出行场景", "Real traveler scene"],
    ["在新标签页查看完整图片", "Open the full image in a new tab"],
    ["查看原图", "View full image"],
    ["订单管理页：优先级、预警与订单状态列表", "Order management list with priorities, alerts and statuses"],
    ["可视化行程编排演示", "Visual itinerary workspace gallery"],
    ["Meta 广告投放结构与优化教学图", "Meta campaign structure and optimization teaching visuals"],
    ["真实工作台：需求、每日安排与资源库同屏协作", "Real workspace: traveler brief, daily plan and resource library in one view"],
    ["在原工作台上标出路线节点与智能推荐位置", "Route nodes and AI suggestions overlaid on the actual workspace"],
    ["中英文行程海报叠层，展示方案交付样式", "Overlapping Chinese and English itinerary posters show the delivery format"],
    ["Campaign → Ad set → Ad：目标、受众与素材分层管理", "Campaign → Ad set → Ad: organize objectives, audiences and creative"],
    ["从账户概览到广告系列，逐步查看改进建议", "Review recommendations from account overview to campaigns"],
    ["结合建议检查设置，不把教学分数当成投放结果", "Use recommendations to review settings; a teaching score is not a result"],
    ["投放状态与建议在广告主自己的 Ads Manager 中核验", "Verify delivery and recommendations in your own Ads Manager"],
    ["以下截图用于介绍 Meta 广告管理结构与优化流程，不展示文数智旅的投放业绩。", "These screenshots explain Meta campaign structure and optimization, not Wenshu Travel's campaign results."],
    ["了解 Meta Blueprint", "Explore Meta Blueprint"],
    ["可视化行程编排工作台界面", "Visual itinerary workspace screenshot"],
    ["行程工作台叠加 AI 路线辅助效果", "Itinerary workspace with AI route assistance overlay"],
    ["中英文行程册模板案例", "Bilingual itinerary template example"],
    ["Meta 广告系列、广告组、广告三级结构教学图", "Meta campaign, ad set and ad three-level teaching diagram"],
    ["Meta Opportunity score 从账户到广告系列的教学流程图", "Meta Opportunity score teaching flow from account to campaigns"],
    ["Meta Opportunity score 建议界面教学截图", "Meta Opportunity score recommendations teaching screenshot"],
    ["Meta Ads Manager 教学界面截图", "Meta Ads Manager teaching screenshot"],
    ["拖拽编排", "Drag-and-drop planning"],
    ["AI 路线辅助", "AI route assistance"],
    ["模板案例", "Template example"],
    ["投放层级", "Campaign levels"],
    ["优化路径", "Optimization flow"],
    ["机会分数", "Opportunity score"],
    ["官方后台", "Official dashboard"],
    ["订单状态、待确认资源、预警与优先级在订单管理页集中查看；定金、车辆、导游等节点仍需进入订单详情核验。", "Review order status, pending resources, alerts and priority in one order list; confirm deposits, vehicles and guides in each order's details."],
    ["订单状态", "Order status"],
    ["资源待确认", "Pending resources"],
    ["游客挖需交流", "Traveler discovery conversations"],
    ["拆解专业交流话术与客户心理，从对话提取旅行需求，匹配相应方案，并用贴近需求的案例促成沟通。", "Understand the traveler's needs and concerns, match a suitable itinerary, and use relevant examples to move the conversation forward."],
    ["需求提取", "Needs capture"],
    ["方案匹配", "Itinerary matching"],
    ["案例促成交", "Relevant examples"],
    ["提取旅行需求", "Capture travel needs"],
    ["从对话识别目的地、日期、人数、预算与偏好，避免反复追问。", "Identify destination, dates, party size, budget and preferences without repeated questions."],
    ["理解客户心理", "Understand concerns"],
    ["辨别顾虑、决策阶段与关注点，建议顾问选择更合适的沟通方式。", "Recognize concerns and decision stage so advisors can respond appropriately."],
    ["匹配案例促成交", "Match relevant examples"],
    ["把已确认的需求与可用方案、相关案例连接，交给顾问继续跟进。", "Connect confirmed needs with available itineraries and examples for the advisor to follow up."],
    ["文数智旅为你<br>接住全球客源", "Wenshu Travel Connects You<br>with Travelers Worldwide"],
    ["从全球获客到落地接待，连接每一段真实旅程", "From global discovery to on-the-ground service, connected at every step"],
    [">洞察</a>", ">Insights</a>"],
    ["浏览文数智旅", "Browse Wenshu Travel"],
    ["打开导航菜单", "Open navigation"],
    ["解决方案当前位置", "Current solution"],
    ["关闭导航菜单", "Close navigation"],
    ["关闭导航", "Close navigation"],
    [">产品</summary>", ">Products</summary>"],
    [">解决方案</summary>", ">Solutions</summary>"],
    [">关于我们</summary>", ">About</summary>"],
    ["能力预览", "Capability preview"],
    ["打开功能说明", "Open feature details"],
    ["洞察中心", "Insights Center"],
    ["<b>中</b> / EN_PLACEHOLDER", "<a href=\"ZH_LINK\" style=\"color:inherit\">中</a> / <b>EN</b>"],
    ["免费获取方案", "Get a Free Plan"],
    ["获取方案", "Get a Plan"],
    /* 页脚 */
    ["提交表单，顾问将在 1 个工作日内联系", "Submit the form — a consultant will contact you within 1 business day"],
    ["服务覆盖目的地、景区与旅行社", "Serving destinations, scenic areas and travel agencies"],
    ["服务覆盖目的地、Scenic Spots与Travel agency", "Serving destinations, scenic areas and travel agencies"],
    ["数据仅用于方案沟通", "Data is used only for proposal communication"],
    ["电话咨询", "Call Us"],
    ["产品能力", "Products"],
    ["了解我们", "Company"],
    ["咨询热线：13558835750", "Hotline: +86 135 5883 5750"],
    ["邮箱待补充", "Email: coming soon"],
    ["地址待补充", "Address: coming soon"],
    ["© 2026 文数智旅 · 保留所有权利", "© 2026 Wenshu Travel · All rights reserved"],
    ["隐私政策", "Privacy Policy"],
    ["ICP 备案号待申请", "ICP filing pending"],
    /* 悬浮栏 */
    ["资料领取", "Get Resources"],
    ["微信咨询", "WeChat"],
    ["回顶部", "Top"],
    /* 聊天面板 */
     ["人工客服", "Customer Support"],
     ["打开在线咨询", "Open support chat"],
     ["关闭在线咨询", "Close support chat"],
     ["人工接待 · 点击连接", "Human support · Click to connect"],
     ["很高兴为您服务", "We are happy to help"],
     ["人工客服 · 在线接待", "Human support · Online"],
     ["在线咨询", "Online chat"],
     ["继续咨询", "Resume chat"],
     ["常见问题", "Common questions"],
     ["联系电话（可选）", "Phone (optional)"],
     ["留下电话，方便顾问联系", "Leave your phone so a consultant can reach you"],
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
     ["最小化", "Minimize"],
     ["聊天工具", "Chat tools"],
     ['aria-label="插入表情"', 'aria-label="Insert emoji"'],
     ['aria-label="图片"', 'aria-label="Image"'],
     ['aria-label="文件"', 'aria-label="File"'],
     ['aria-label="提醒"', 'aria-label="Notifications"'],
     ["本次沟通已结束，请您继续浏览网站。", "This conversation has ended. Please continue browsing."],
     ["沟通已结束，您可以", "This conversation has ended. You can"],
     ["继续对话", "Continue chat"],
     ["在线留言", "Leave a message"],
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
     ['placeholder="姓名"', 'placeholder="Name"'],
     ['placeholder="邮箱"', 'placeholder="Email"'],
     ['aria-label="电话号码"', 'aria-label="Phone number"'],
     ['aria-label="联系电话（可选）"', 'aria-label="Phone (optional)"'],
     ['<button type="submit">提交</button>', '<button type="submit">Submit</button>'],
     ["您好，您可以点击下方问题，了解<b>合作模式、价格、上线周期</b>。具体业务需求请联系产品顾问。",
     "Select a question below for information about <b>partnership, pricing, or launch timeline</b>. Contact a consultant to discuss your business needs."],
    ["合作模式是什么？", "How does partnership work?"],
    ["价格怎么算？", "How much does it cost?"],
    ["多久能上线？", "How fast can we launch?"],
    ["公司地址", "Company address"],
    ["请输入公司所在省市及详细地址", "Province, city and full company address"],
    ["输入您想咨询的问题", "Type your message"],
    ["预约产品体验", "Book a Consultation"],
    ["输入手机号，预约顾问联系", "Enter your phone number to request a callback"],
    ["请填写有效电话号码（可包含国家区号）。", "Please enter a valid phone number, including the country code if needed."],
    ["<button id=\"chatSend\">发送</button>", "<button id=\"chatSend\">Send</button>"],
    ["<span>发送</span>", "<span>Send</span>"],
    /* 留资模态窗 */
    ["获取专属增长方案", "Get Your Growth Plan"],
    ["留下联系方式，顾问将在 1 个工作日内与您联系", "Leave your contact — a consultant will reach out within 1 business day"],
    ["立即提交", "Submit"],
    ["提交成功", "Submitted"],
    ["顾问将在 1 个工作日内联系您，请保持手机畅通", "A consultant will reach out within 1 business day"],
    ["咨询定制化服务", "Custom Solutions Inquiry"],
    ["手机号码", "Phone / WhatsApp"],
    ["联系电话", "Phone / WhatsApp"],
    ["如何称呼您", "Your name"],
    ["公司名称", "Company name"],
    ["业务类型", "Business type"],
    ["提交即表示同意", "By submitting you agree to our "],
    ["《隐私政策》", "Privacy Policy"],
    ["，我们承诺不泄露您的信息", ". We never share your data."],
    ["已收到您的信息", "Received!"],
    /* 表单 option */
    ["<option value=\"\">请选择业务类型</option>", "<option value=\"\">Select your business type</option>"],
    ["<option>国际旅行社</option>", "<option>International travel agency</option>"],
    ["<option>入境游地接社</option>", "<option>Inbound ground operator</option>"],
    ["<option>精品旅游公司</option>", "<option>Boutique travel studio</option>"],
    ["<option>景区 / 文旅集团</option>", "<option>Scenic spot / culture-tourism group</option>"],
    ["<option>其他</option>", "<option>Other</option>"],
    /* placeholder / aria */
    ['placeholder="请输入手机号码"', 'placeholder="Your phone or WhatsApp"'],
    ['placeholder="请输入电话号码（含国家区号）"', 'placeholder="Your phone or WhatsApp, including country code"'],
    ['placeholder="如何称呼您"', 'placeholder="Your name"'],
    ['placeholder="请输入您的公司名称"', 'placeholder="Your company"'],
    ['aria-label="快捷入口"', 'aria-label="Quick actions"'],
    ['aria-label="回到顶部"', 'aria-label="Back to top"'],
    ['aria-label="在线咨询"', 'aria-label="Online chat"'],
    ['aria-label="打开在线咨询"', 'aria-label="Open support chat"'],
    ['aria-label="关闭在线咨询"', 'aria-label="Close support chat"'],
    ['aria-label="关闭"', 'aria-label="Close"'],
    ['title="白皮书与行业洞察（即将上线）"', 'title="Whitepapers & industry insights (coming soon)"'],
    ['title="入境游洞察、活动沙龙与百科"', 'title="Inbound tourism insights, events and glossary"'],
    /* QA（script 内） */
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
}
const SHARED = loadSharedPatches();
function applyPatchList(out, patches) {
  let hit = 0;
  const ordered = patches
    .filter(([zh]) => !zh.includes("EN_PLACEHOLDER") && !zh.includes("ZH_LINK"))
    .sort((a, b) => b[0].length - a[0].length);
  for (const [zh, en] of ordered) {
    if (out.includes(zh)) { out = out.split(zh).join(en); hit++; }
  }
  return { out, hit };
}


/* ---------- 洞察页英文正文：避免大量字典替换导致中英混杂 ---------- */
const EN_CATEGORIES = [
  { slug: "insights-whitepapers", icon: "doc", title: "Whitepapers & Industry Insights", nav: "Reports", eyebrow: "Insights · Reports", desc: "Practical methods for policy shifts, source markets, channels and conversion — built for quarterly growth decisions.", count: "2 deep reads" },
  { slug: "events", icon: "chat", title: "Events & Salons", nav: "Events", eyebrow: "Insights · Events", desc: "Closed-door salons, online classes and hands-on workshops for agencies, ground operators and destinations.", count: "2 events" },
  { slug: "glossary", icon: "globe", title: "Inbound Tourism Glossary", nav: "Glossary", eyebrow: "Insights · Glossary", desc: "Shared definitions for inbound growth, AI reception, resource libraries and attribution so teams speak the same language.", count: "2 entries" },
];
const EN_ICON = {
  doc: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="4" y="3" width="16" height="18" rx="2"/><path d="M8 8h8M8 12h8M8 16h5"/></svg>',
  chat: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M4 5h16v11H8l-4 4z" stroke-linejoin="round"/><path d="M8 9h8M8 12h5" stroke-linecap="round"/></svg>',
  globe: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3a14 14 0 010 18M12 3a14 14 0 000 18"/></svg>',
};
const EN_ARTICLES = [
  { slug:"insight-inbound-growth-loop", category:"insights-whitepapers", img:"generated/gen-adsdashboard.jpg", tags:["Whitepaper","Full-funnel growth"], date:"2026-09-04", read:"8 min", title:"The Inbound Tourism Growth Loop: 6 Critical Steps from Overseas Demand to Paid Orders", desc:"A field-tested growth loop across traffic, landing pages, AI reception, itinerary production, sales, fulfillment and repeat demand.", body:[
    {h:"Why the loop matters", ps:["Inbound teams often split growth into isolated problems: ads, service, product and fulfillment. Profit is decided by the whole traveler journey — from the first piece of content to inquiry, itinerary, deposit, trip completion and recommendation.","Mapping the loop shows how every handoff affects the next one: whether paid traffic is answered, whether reception captures enough intent, whether itinerary production can quote quickly, and whether fulfillment data improves the next campaign."]},
    {h:"The 6 steps", bullets:["Overseas reach: segment content and ads by source market, language, interest and travel intent.","Multilingual landing pages: explain the offer, price range and inquiry path in seconds.","AI reception: cover time zones 24/7 and structure traveler intent before handoff.","Itinerary production: turn party size, dates, budget and preferences into a quotable bilingual plan.","Sales and payment: let consultants focus on qualified leads while quote, deposit and contract status stay visible.","Repeat and referrals: turn reviews, tags and preferences into reusable customer assets."]},
    {h:"Where to start", ps:["If leads are expensive and response is slow, fix AI reception first. If inquiries are high but closing is weak, fix itinerary production and sales handoff. If orders are stable, fix attribution and repeat marketing."], callout:"Run a 7-day growth audit: write down conversion rate, response time, owner and data source for each step, then remove the one break that hurts revenue most."}
  ]},
  { slug:"insight-source-market-roi", category:"insights-whitepapers", img:"generated/gen-airport.jpg", tags:["Source markets","ROI"], date:"2026-09-04", read:"6 min", title:"How to Calculate Source-Market ROI: Look Beyond Inquiry Volume", desc:"Evaluate each country by lead cost, qualified inquiry rate, closing cycle, order value and fulfillment cost — not just lead volume.", body:[
    {h:"Inquiry volume is not the answer", ps:["Many teams shift budget toward markets with the most inquiries. In inbound tourism, low-cost leads can still underperform if budgets are small, comparison shopping is heavy, sales cycles are long or fulfillment is expensive.","Source-market analysis helps match each country to a playbook: volume, high-end customization, policy-window capture, content seeding or long-term brand building."]},
    {h:"Five baseline metrics", bullets:["CPL: lead cost and entry-channel efficiency.","Qualified inquiry rate: share of conversations with dates, party size, budget or destination intent.","Closing cycle: average days from first inquiry to deposit.","Order value and gross margin: revenue alone hides fulfillment-cost differences.","Repeat and referral potential: high-satisfaction markets deserve long-term content investment."]},
    {h:"Turning it into budget decisions", ps:["Rank markets by lead quality, order value and service readiness. For high-value but low-volume markets, improve content and language coverage. For high-volume but weak-closing markets, improve landing-page promises, AI intent mining and sales rhythm."], callout:"Wenshu Travel's Data Compass connects ad spend, inquiries, itineraries, orders and payments so budget shifts are based on evidence."}
  ]},
  { slug:"event-chengdu-inbound-salon", category:"events", img:"generated/gen-callcenter.jpg", tags:["Closed-door salon","Chengdu"], date:"2026-09-18", read:"90 min", title:"Chengdu Salon: AI Reception and Global Acquisition Before Peak Season", desc:"For Southwest China agencies, ground operators and destinations: time-zone coverage, source-market campaigns and the 7-day launch path.", event:{time:"2026-09-18 14:00", place:"Chengdu · High-Tech Zone", format:"Closed-door small group"}, body:[
    {h:"Who should attend", ps:["This salon is for teams that already have inbound products, are preparing for peak-season acquisition, or want to move overseas inquiries from manual WeChat handling into a systematic reception workflow."]},
    {h:"Topics", bullets:["How to identify the source markets worth investing in now.","How AI reception connects to websites, WhatsApp and social inboxes.","What fields every inquiry should leave for sales.","What tour, pricing and FAQ materials are needed for a 7-day launch."]},
    {h:"What you take away", ps:["Teams receive an inbound growth audit sheet and an AI reception launch checklist for reviewing traffic, reception and itinerary bottlenecks after the salon."], callout:"Seats are confirmed by organization. Leave your details on the page and a consultant will confirm fit."}
  ]},
  { slug:"event-ai-reception-workshop", category:"events", img:"generated/gen-chatdesk.jpg", tags:["Online workshop","AI reception"], date:"2026-09-24", read:"60 min", title:"Online Workshop: Turn Your Tour Library into AI-Ready Knowledge", desc:"A practical session on structuring tours, pricing, cancellation rules, transfers and dining notes so Wenxiaolv can retrieve and cite them accurately.", event:{time:"2026-09-24 19:30", place:"Online", format:"Practical workshop"}, body:[
    {h:"Why knowledge quality matters", ps:["AI reception quality starts with the facts a company provides. If tours, pricing, schedules and policies live across spreadsheets, chats and documents, AI cannot reliably cite them and humans must keep correcting answers."]},
    {h:"Minimum viable knowledge loop", bullets:["Start with the 20 most frequent questions, not the whole archive.","Structure price, validity, audience and restrictions as fields.","Define human-handoff rules for questions AI should not answer.","Feed strong human replies back into the knowledge base every week."]},
    {h:"Workshop output", ps:["Participants can create a first FAQ template and decide which answers are safe for AI automation versus human handoff."], callout:"Best for customer-service leads, product managers and resource-pricing owners."}
  ]},
  { slug:"glossary-ai-reception", category:"glossary", img:"generated/gen-phonechat.jpg", tags:["Glossary","AI reception"], date:"2026-09-04", read:"4 min", title:"What Is an AI Receptionist? How It Differs from a Basic Chatbot", desc:"An AI receptionist does more than answer FAQs: it handles multilingual replies, intent mining, lead scoring and human handoff for inbound tourism.", body:[
    {h:"Definition", ps:["An AI receptionist is an intelligent front-desk role for real business inquiries. It must understand traveler language, itinerary intent, budget signals and service boundaries, then turn the conversation into structured information a consultant can use."]},
    {h:"How it differs from a basic chatbot", bullets:["A basic bot answers fixed questions; an AI receptionist moves an inquiry to the next step.","A basic bot often lacks resource context; an AI receptionist cites real tours, prices and policies.","A basic bot handles chat only; an AI receptionist also scores leads, adds tags and hands off to humans."]},
    {h:"Value in inbound tourism", ps:["Time zones, languages and non-standard needs are normal in inbound travel. AI reception clarifies the core request first, letting human consultants spend time on high-value closing and complex customization."]}
  ]},
  { slug:"glossary-source-market", category:"glossary", img:"generated/gen-guilin.jpg", tags:["Glossary","Source markets"], date:"2026-09-04", read:"4 min", title:"What Is Source-Market Analysis? Why Inbound Teams Should Analyze Growth by Country", desc:"Source-market analysis breaks overseas traffic, inquiry quality, preferences, order value and fulfillment cost down by country.", body:[
    {h:"Definition", ps:["Source-market analysis evaluates travelers from different countries or regions across the full path from awareness to fulfillment. It asks not only where demand is high, but which market is worth investment and how it should be served."]},
    {h:"Dimensions to track", bullets:["Search and social heat: whether a market is rising.","Acquisition cost: channel efficiency for ads and content.","Inquiry quality: whether travelers provide budget, dates and party size.","Product preferences: destination, dining, lodging and pace differences.","Fulfillment cost: language, staffing, resource and service complexity."]},
    {h:"How to use it", ps:["Source-market analysis guides budget allocation, language staffing, product packaging and content topics. For destinations, it also helps decide which international market to approach first."]}
  ]},
];
function enCat(slug){ return EN_CATEGORIES.find(c => c.slug === slug); }
function enArticles(slug){ return EN_ARTICLES.filter(a => a.category === slug); }
function enHref(slug){ return `${slug}.en.html`; }
function enArticleCard(a){ return `<a class="insight-list-card reveal" href="${enHref(a.slug)}"><img src="../../assets/${a.img}" alt="${a.title}" loading="lazy"><div class="body"><div class="insight-labels">${a.tags.map(t=>`<span class="insight-label">${t}</span>`).join("")}<span class="insight-date">${a.date}</span></div><h3 class="insight-card-title">${a.title}</h3><p class="insight-card-desc">${a.desc}</p><div class="insight-card-foot"><b>${a.read}</b><span>Read on →</span></div></div></a>`; }
function enHome(){ const f=EN_ARTICLES[0], stack=EN_ARTICLES.slice(1,3).map(enArticleCard).join(""), rest=EN_ARTICLES.slice(3).map(enArticleCard).join(""); return `<!-- insight-main:start --><section class="insight-hero"><div class="insight-hero__in"><div><span class="insight-kicker">Insights Center</span><h1>Inbound Tourism Insights Center</h1><p>Practical lessons from Wenshu Travel's work in global acquisition, AI reception, itinerary production, attribution and destination internationalization.</p></div><div class="insight-hero__stats"><div class="insight-stat"><b>3</b><span>Reports, events and glossary</span></div><div class="insight-stat"><b>6</b><span>First articles and event pages</span></div><div class="insight-stat"><b>7 days</b><span>From audit to first launch</span></div><div class="insight-stat"><b>12</b><span>Major service languages</span></div></div></div></section><div class="insight-wrap"><div class="insight-navline"><h2>Browse by topic</h2><div class="insight-tabs"><a class="active" href="insights.en.html">All</a>${EN_CATEGORIES.map(c=>`<a href="${enHref(c.slug)}">${c.nav}</a>`).join("")}</div></div><div class="insight-category-grid">${EN_CATEGORIES.map(c=>`<a class="insight-category-card reveal" href="${enHref(c.slug)}"><span class="icon">${EN_ICON[c.icon]}</span><h3>${c.title}</h3><p>${c.desc}</p><div class="meta"><span>${c.count}</span><span>Open →</span></div></a>`).join("")}</div><div class="insight-navline"><h2>Editor's picks</h2></div><div class="insight-featured"><a class="insight-featured-main reveal" href="${enHref(f.slug)}"><img src="../../assets/${f.img}" alt="${f.title}" loading="lazy"><div class="body"><div class="insight-labels">${f.tags.map(t=>`<span class="insight-label">${t}</span>`).join("")}<span class="insight-date">${f.date}</span></div><h3 class="insight-card-title">${f.title}</h3><p class="insight-card-desc">${f.desc}</p><div class="insight-card-foot"><b>${f.read}</b><span>Read article →</span></div></div></a><div class="insight-stack">${stack}</div></div><div class="insight-navline"><h2>Latest</h2></div><div class="insight-list">${rest}</div></div><!-- insight-main:end -->`; }
function enCategoryPage(cat){ const arts=enArticles(cat.slug); return `<!-- insight-main:start --><section class="insight-hero"><div class="insight-hero__in"><div><span class="insight-kicker">${cat.eyebrow}</span><h1>${cat.title}</h1><p>${cat.desc}</p></div><div class="insight-hero__stats"><div class="insight-stat"><b>${arts.length}</b><span>${cat.count}</span></div><div class="insight-stat"><b>Actionable</b><span>Every piece leads to an operating decision</span></div></div></div></section><div class="insight-wrap"><div class="insight-navline"><h2>${cat.title}</h2><div class="insight-tabs"><a href="insights.en.html">All</a>${EN_CATEGORIES.map(c=>`<a ${c.slug===cat.slug?'class="active"':''} href="${enHref(c.slug)}">${c.nav}</a>`).join("")}</div></div><div class="insight-list insight-list--one">${arts.map(enArticleCard).join("")}</div></div><!-- insight-main:end -->`; }
function enArticlePage(a){ const cat=enCat(a.category), related=EN_ARTICLES.filter(x=>x.slug!==a.slug).slice(0,4); const event=a.event?`<div class="event-meta-grid"><div class="event-meta"><b>Time</b>${a.event.time}</div><div class="event-meta"><b>Location</b>${a.event.place}</div><div class="event-meta"><b>Format</b>${a.event.format}</div></div>`:""; const body=a.body.map(sec=>`<h2>${sec.h}</h2>${(sec.ps||[]).map(p=>`<p>${p}</p>`).join("")}${sec.bullets?`<ul>${sec.bullets.map(b=>`<li>${b}</li>`).join("")}</ul>`:""}${sec.callout?`<div class="article-callout">${sec.callout}</div>`:""}`).join(""); return `<!-- insight-main:start --><section class="insight-hero"><div class="insight-hero__in"><div><span class="insight-kicker">${cat.eyebrow}</span><h1>${a.title}</h1><p>${a.desc}</p></div><div class="insight-hero__stats"><div class="insight-stat"><b>${a.read.split(" ")[0]}</b><span>Read / session time</span></div><div class="insight-stat"><b>${a.date.slice(5)}</b><span>Publish / event date</span></div></div></div></section><div class="article-shell"><article class="article-main reveal"><div class="article-breadcrumb"><a href="insights.en.html">Insights Center</a><span>/</span><a href="${enHref(cat.slug)}">${cat.title}</a><span>/</span><span>${a.title}</span></div><div class="insight-labels">${a.tags.map(t=>`<span class="insight-label">${t}</span>`).join("")}<span class="insight-date">${a.date} · ${a.read}</span></div><h1>${a.title}</h1><p class="article-summary">${a.desc}</p><img class="article-cover" src="../../assets/${a.img}" alt="${a.title}" loading="lazy">${event}<div class="article-body">${body}</div></article><aside class="article-side"><div class="article-side-card"><h3>Read next</h3>${related.map(r=>`<a href="${enHref(r.slug)}">${r.title}</a>`).join("")}</div><div class="article-side-card"><h3>Want to apply this to your business?</h3><p class="insight-card-desc">Leave your business type and target markets. A consultant will suggest the right growth loop for your routes and team.</p><button class="link-btn" style="margin-top:16px" data-lead data-source="${a.slug}-article" data-title="Get Your Growth Plan"><span>Get a Plan</span><span class="arr">→</span></button></div></aside></div><!-- insight-main:end -->`; }
function replaceInsightEnglish(out, zhFile){
  const slug=zhFile.replace(/\.html$/, "");
  let body=null, title=null, desc=null;
  if(slug==="insights"){ body=enHome(); title="Insights Center · Wenshu Travel"; desc="Wenshu Travel Insights Center: inbound tourism whitepapers, methods, events and glossary for AI-powered growth."; }
  const cat=enCat(slug); if(cat){ body=enCategoryPage(cat); title=`${cat.title} · Insights Center · Wenshu Travel`; desc=cat.desc; }
  const art=EN_ARTICLES.find(a=>a.slug===slug); if(art){ body=enArticlePage(art); title=`${art.title} · Wenshu Travel Insights`; desc=art.desc; }
  if(!body) return out;
  out=out.replace(/<!-- insight-main:start -->[\s\S]*?<!-- insight-main:end -->/, body);
  out=out.replace(/<title>[^<]*<\/title>/, `<title>${title}</title>`);
  out=out.replace(/<meta name="description" content="[^"]*">/, `<meta name="description" content="${desc.replace(/"/g,'&quot;')}">`);
  return out;
}

/* ---------- 字典替换（长串优先，避免子串抢先命中） ---------- */
const DICT_ENTRIES = Object.entries(DICT).sort((a, b) => b[0].length - a[0].length);

/* Keep the China Travel evidence page's captions grounded and fully bilingual.
   Apply these exact strings before the broad glossary can split Chinese phrases. */
const SOCIAL_TRANSLATIONS = [
  ["以下为 Instagram 帖子截图，保留原始画面与互动信息。这里展示的是静态截图，非视频播放或实时热度榜；点击可查看完整原图。", "The Instagram post screenshots retain the original visuals and engagement details. These are still images, not video playback or a live ranking; open an image to inspect the full screenshot."],
  ["从真实帖子观察旅行灵感、目的地讨论和游客提问。下方是用户提供的截图快照；互动数据以截图当时页面为准，并非实时监测结果。", "Explore travel inspiration, destination discussions and traveler questions in real posts. Engagement reflects the captured page, not live monitoring."],
  ["通过公开帖文观察目的地讨论、内容形式与游客关注点。下方为页面截图，互动数据以截图时点为准，不代表实时监测结果。", "Explore destination discussions, content formats and traveler interests through public posts. The screenshots reflect engagement at the time of capture, not live monitoring."],
  ["以下为 Facebook 页面截图，保留原页面内容及可见互动信息；点击「查看原图」可放大阅读。", "These Facebook screenshots retain the page content and visible engagement details. Open the full image to read them."],
  ["此流程用于说明跟进方式，不连接社媒账号，也不自动发送邮件。", "This workflow explains the follow-up process; it does not connect social accounts or send emails automatically."],
  ["邮件模板可按合作对象调整；点击复制不会发送邮件。联系前请核实创作者意愿、平台规则及商业合作披露要求。", "Adapt the email template for each creator. Copying it does not send an email. Confirm the creator's interest, platform rules and commercial disclosure requirements before outreach."],
  ["湘西旅行短视频帖子截图", "Xiangxi travel video post screenshot"],
  ["张家界旅行创作者帖子截图", "Zhangjiajie travel creator post screenshot"],
  ["上海旅行视频帖子截图", "Shanghai travel video post screenshot"],
  ["北京与长城旅行路线图文帖截图", "Beijing and Great Wall itinerary post screenshot"],
  ["China Travel Facebook 社群搜索结果截图", "China Travel Facebook group search results screenshot"],
  ["China Travel 城市与山海短视频主页截图", "China Travel city and landscape reel grid screenshot"],
  ["望郎归海景 Instagram 短视频截图", "Instagram reel screenshot of the Wanglanggui coast"],
  ["深圳城市夜景 Instagram 短视频截图", "Instagram reel screenshot of Shenzhen at night"],
  ["深圳日落 Instagram 短视频截图", "Instagram reel screenshot of a Shenzhen sunset"],
  ["广州夜间漫步 Instagram 短视频截图", "Instagram reel screenshot of an evening walk in Guangzhou"],
  ["深圳地标 Instagram 短视频截图", "Instagram reel screenshot of a Shenzhen landmark"],
  ["深圳日落较高互动 Instagram 短视频截图", "Higher-engagement Instagram reel screenshot of a Shenzhen sunset"],
  ["China Travel 短视频截图轮播", "China Travel reel screenshot carousel"],
  ["China Travel 短视频样本", "China Travel reel examples"],
  ["用户提供的 Instagram 帖子截图，保留原始画面与互动信息。这里展示的是静态截图，非视频播放或实时热度榜；点击可查看完整原图。", "User-provided Instagram post screenshots retain their original visuals and engagement details. These are still images, not video playback or a live ranking; open an image to inspect the full screenshot."],
  ["上一组短视频截图", "Previous reel screenshots"], ["下一组短视频截图", "Next reel screenshots"],
  ["城市与山海短视频合集", "City and landscape reel collection"],
  ["账号主页截图 · 原图可查看各条播放量", "Account grid snapshot · view counts remain in the original"],
  ["望郎归海景", "Wanglanggui coast"], ["目的地风景短视频截图", "Destination landscape reel snapshot"],
  ["深圳城市夜景", "Shenzhen skyline at night"], ["夜间城市影像截图", "Night-city reel snapshot"],
  ["深圳日落天际线", "Shenzhen sunset skyline"], ["色彩与地标叙事截图", "Color and landmark storytelling snapshot"],
  ["广州夜间漫步", "Guangzhou evening walk"], ["城市体验短视频截图", "Urban experience reel snapshot"],
  ["深圳地标影像", "Shenzhen landmark reel"], ["地标视觉短视频截图", "Landmark-focused reel snapshot"],
  ["深圳日落互动样本", "Shenzhen sunset engagement example"], ["互动信息以截图采集时为准", "Engagement reflects the captured page"],
  ["用户提供的 China Travel 城市与山海短视频主页截图", "User-provided China Travel city and landscape reel grid screenshot"],
  ["用户提供的望郎归海景 Instagram 短视频截图", "User-provided Instagram reel screenshot of the Wanglanggui coast"],
  ["用户提供的深圳城市夜景 Instagram 短视频截图", "User-provided Instagram reel screenshot of Shenzhen at night"],
  ["用户提供的深圳日落 Instagram 短视频截图", "User-provided Instagram reel screenshot of a Shenzhen sunset"],
  ["用户提供的广州夜间漫步 Instagram 短视频截图", "User-provided Instagram reel screenshot of an evening walk in Guangzhou"],
  ["用户提供的深圳地标 Instagram 短视频截图", "User-provided Instagram reel screenshot of a Shenzhen landmark"],
  ["用户提供的深圳日落较高互动 Instagram 短视频截图", "User-provided higher-engagement Instagram reel screenshot of a Shenzhen sunset"],
  ["旅行合作邮件工作场景示意图", "Illustrative travel-partnership email workspace image"],
  ["外籍达人合作邮件回访", "Follow up with international travel creators"],
  ["从真实帖子发现创作者后，先人工核验受众、内容质量与联系方式，再发送有针对性的合作邀请；不把公开互动量等同于合作效果。", "After discovering creators through real posts, review their audience, content and contact details before sending a tailored invitation. Public engagement is not proof of partnership results."],
  ["查看英文邮件模板", "View English email template"], ["复制英文模板", "Copy English template"],
  ["仅为可编辑示例，不会自动发送邮件；联系前请核实创作者意愿、平台规则及商业合作披露要求。", "Editable example only; no email is sent automatically. Check creator consent, platform rules and commercial disclosure requirements before outreach."],
  ["海外社媒洞察", "Overseas Social Listening"],
  ["从真实 China Travel 社媒内容观察目的地热度、创作灵感与达人合作线索。", "Explore destination interest, content ideas and creator leads through real China Travel social posts."],
  ["看见 China Travel 讨论正在发生什么，把真实内容信号转化为选题、合作与服务动作", "See what people are discussing about China Travel and turn real content signals into topics, partnerships and service actions"],
  ["从话题、内容、创作者和反馈四个视角整理社媒信号：", "Organize social signals through four lenses: topics, content, creators and feedback:"],
  ["从真实帖子观察旅行灵感、目的地讨论和游客提问。下方是用户提供的截图快照；互动数据以截图当时页面为准，并非实时监测结果。", "Explore travel inspiration, destination discussions and traveler questions in real posts. These user-provided screenshots are snapshots; engagement shown is from the captured page, not live monitoring."],
  ["素材来自用户提供的 Facebook 页面截图。账号、内容及互动数字保留在原图；点击「查看原图」可放大阅读。", "User-provided Facebook page screenshots. Accounts, posts and engagement remain in the original image; open the full image to read them."],
  ["China Travel 真实社媒截图", "Real China Travel social screenshots"],
  ["China Travel 社媒样本", "China Travel social examples"],
  ["湘西短视频", "Xiangxi travel video"],
  ["从目的地画面与互动区观察旅行兴趣", "See travel interest through destination footage and engagement"],
  ["创作者笔记", "Creator post"],
  ["观察达人叙事、画面选择与受众回应", "Review creator storytelling, visual choices and audience response"],
  ["上海城市影像", "Shanghai city video"],
  ["比较城市夜景类内容的呈现方式", "Compare approaches to city-nightscape content"],
  ["北京线路图文", "Beijing itinerary post"],
  ["观察多景点行程怎样被组织成一篇帖子", "See how a multi-stop itinerary becomes a social post"],
  ["社群入口", "Travel communities"],
  ["从 China Travel 相关社群了解讨论场景", "Explore discussions in China Travel communities"],
  ["用户提供的湘西旅行短视频帖子完整截图", "Full screenshot of a user-provided Xiangxi travel video post"],
  ["用户提供的张家界旅行创作者帖子完整截图", "Full screenshot of a user-provided Zhangjiajie creator post"],
  ["用户提供的上海旅行视频帖子完整截图", "Full screenshot of a user-provided Shanghai travel video post"],
  ["用户提供的北京与长城旅行路线图文帖完整截图", "Full screenshot of a user-provided Beijing and Great Wall itinerary post"],
  ["用户提供的 China Travel Facebook 社群搜索结果截图", "User-provided screenshot of China Travel Facebook group search results"],
  ["按目的地、语种和话题整理公开讨论，辨别游客在问什么", "Organize public discussions by destination, language and topic to understand traveler questions"],
  ["对照真实帖子，分析画面、文案与旅行路线如何吸引关注", "Use real posts to examine how visuals, captions and routes attract attention"],
  ["记录有中国旅行内容的账号，再人工核验受众与合作适配度", "Find accounts posting about China travel, then review audience and partnership fit"],
  ["将评论与私信中的问题归类，交给负责人核实和回访", "Classify questions from comments and messages for owner review and follow-up"],
  ["讨论观察", "Conversation insights"], ["内容拆解", "Content analysis"], ["创作者发现", "Creator discovery"], ["反馈跟进", "Feedback follow-up"],
  ["从看见一条帖子，到做出下一步动作：", "From seeing a post to deciding the next action:"],
  ["观察目的地短视频与旅行帖的主题变化，先核验旅行信息，再决定要不要跟进选题。", "Track themes in destination videos and travel posts. Check travel facts before pursuing a topic."],
  ["比较城市夜景、山水景观与路线讲述的拍法，为自己的目的地内容建立素材清单。", "Compare city, nature and itinerary storytelling to plan your own destination content."],
  ["从真实创作者内容切入，人工核验内容风格、受众地区与互动质量，不只看粉丝数字。", "Start with real creator posts; review style, audience geography and engagement quality, not follower count alone."],
  ["把公开评论和私信里的疑问交给对应负责人核实，再通过适合的渠道回复和回访。", "Assign public comments and message questions to an owner, then respond and follow up through the right channel."],
  ["蹭对热点", "Follow relevant trends"], ["内容创作灵感", "Content inspiration"], ["达人合作筛选", "Creator partnership review"], ["口碑风险管理", "Reputation follow-up"],
  ["查看完整截图：", "View full screenshot: "], ["湘西旅行视频帖", "Xiangxi travel video post"], ["张家界秋季旅行图文帖", "Zhangjiajie autumn photo post"], ["上海城市夜景视频帖", "Shanghai nightscape video post"], ["江西山水旅行视频帖", "Jiangxi landscape video post"], ["张家界创作者旅行帖", "Zhangjiajie creator post"], ["北京长城旅行创作者帖", "Beijing Great Wall creator post"],
  ["评论与私信归集", "Collect comments and messages"], ["分配负责人核实", "Assign an owner to verify"], ["双语邮件回访", "Bilingual email follow-up"],
  ["示意模板，不代表已连接社媒账号或自动发送。", "Illustrative template; no social account connection or automatic sending is implied."],
  ["流程示意", "Workflow example"],
];

function translatePage(html, zhFile) {
  let out = html;
  let hit = 0;

  if (zhFile === "data-social.html") {
    for (const [zh, en] of SOCIAL_TRANSLATIONS.sort((a, b) => b[0].length - a[0].length)) out = out.split(zh).join(en);
  }

  /* 1. lang + title */
  out = out.replace('<html lang="zh-CN">', '<html lang="en">');

  /* 2. 语言切换：zh 侧子页是 `<b>中</b> / <a href="../en/pages/x.en.html">EN</a>`（同页对映）。
        en 侧要变成 `<a href="ZH_PAGE">中</a> / <b>EN</b>`，跳回中文同页。 */
  const zhLink = zhFile; /* 例如 solution-growth.html */
  out = out.replace(
    /<b>中<\/b>\s*\/\s*<a href="[^"]*\.en\.html"[^>]*>EN<\/a>/,
    `<a href="../../pages/${zhLink}" style="color:inherit">中</a> / <b>EN</b>`
  );
  /* 兜底：旧版 `<b>中</b> / <a href="../en/index.html">EN</a>` 或纯文本 */
  out = out.replace(
    /<b>中<\/b>\s*\/\s*<a href="[^"]*en\/index\.html"[^>]*>EN<\/a>/,
    `<a href="../../pages/${zhLink}" style="color:inherit">中</a> / <b>EN</b>`
  );
  out = out.replace(
    /<b>中<\/b>\s*\/\s*EN(?![\w<])/,
    `<a href="../../pages/${zhLink}" style="color:inherit">中</a> / <b>EN</b>`
  );

  /* 3. 路径 rebase：pages/ 相对 → en/pages/ 需再上一层 */
  out = out
    .replace(/(data-src|src|href|poster)="\.\.\/assets\//g, '$1="../../assets/')
    .replace(/(data-src|src|href|poster)="\.\.\/index\.html/g, '$1="../index.html') /* 同语言英文首页 */
    /* 子页互链（同目录 x.html）→ en 版子页 */
    .replace(/href="([a-z][a-z0-9-]*)\.html(#[^"]*)?"/g,
             (m, slug, hash) => `href="${slug}.en.html${hash || ""}"`);

  /* 4. 共享补丁先跑一遍：聊天/QA/浮层长句必须在短词字典污染前命中 */
  {
    const patched = applyPatchList(out, SHARED);
    out = patched.out;
    hit += patched.hit;
  }

  /* 5. 字典替换 */
  for (const [zh, en] of DICT_ENTRIES) {
    if (zh.startsWith("ATTR:")) {
      const attr = zh.slice(5);
      if (out.includes(attr)) { out = out.split(attr).join(en.slice(5)); hit++; }
    } else if (out.includes(zh)) {
      out = out.split(zh).join(en); hit++;
    }
  }

  /* 5a. 共享补丁再跑一遍：兜底仍未覆盖的导航/页脚/聊天等 */
  {
    const patched = applyPatchList(out, SHARED);
    out = patched.out;
    hit += patched.hit;
  }

  /* 5b. 碎片补丁：字典长串被短串抢先命中后的半成品，逐个归位 */
  const FRAGS = [
    ["Zhice · Itinerary Builder生成 · Wenshu Travel", "Zhice · Itinerary Builder · Wenshu Travel"],
    ["10 分钟出一份Bilingual itinerary PDF", "A bilingual itinerary PDF in 10 minutes"],
    ["把Global Acquisition成本打下来", "Drive Acquisition Costs Down"],
    ["，我都可以为您解答～也可以直接为您预约顾问。", " — or I can book a consultant for you."],
    ["您好，我是Wenxiaolv 🤖 关于", "Hi, I'm Wenxiaolv 🤖 Ask me about"],
    ["你的 7×24 多语种 AI 接待官", "Your 24/7 Multilingual AI Receptionist"],
    ["3 小时的活 10 分钟干完", "What takes 3 hours, done in 10 minutes"],
    ["落地接待的每一个深夜询盘，", "Every late-night inquiry on the ground,"],
    ["nation Heat榜", "Destination Heat Ranking"],
    ["把你的旅游资源全部数字化", "Digitize Every Tourism Resource You Own"],
    ["AI 驱动入境游全链路，", "AI Drives the Full Inbound Chain —"],
    ["把每一个订单交付到完美", "Deliver Every Order to Perfection"],
    ["把全球客源攥在自己手里", "Own Your Global Customer Base"],
    ["Products能力", "Products"],
    ["h Trends追踪", "Trend Tracking"],
    ["让每一分投入都有回响", "Make Every Investment Pay Back"],
    ["让全球游客主动找到你", "Let Global Travelers Come to You"],
    ["他们如何用文数智旅", "How They Use Wenshu Travel"],
    ["每一条询盘都被接住", "Every Inquiry, Answered"],
    ["在出发之前就看见你", "See You Before They Depart"],
    ["接住全球客源？", "to Capture Global Demand?"],
    ["高净值定制游，", "High-net-worth custom tours,"],
    ["让全球游客，", "Let Global Travelers"],
    ["都不再流失", "Never Lost Again"],
    ["咨询顾问", "Talk to Us"],
    ["预约体验", "Book a Consultation"],
    ["查看案例", "View Case"],
  ];
  for (const [a, b] of FRAGS) {
    if (out.includes(a)) { out = out.split(a).join(b); hit++; }
  }

  /* 5c. <title> 内残留碎片再兜底一次 */
  out = out.replace(/<title>([^<]*)<\/title>/, (m, t) => {
    let enT = t;
    for (const [a, b] of FRAGS) enT = enT.split(a).join(b);
    return `<title>${enT}</title>`;
  });

  /* 6. JS 残留：QA price 答案被字典短串「留下联系方式」污染后的形态 */
  out = out.replace(
    "价格按合作结构报价：基础技术服务费 + 效果绑定的运营分成，不赚服务费差价。投放预算由您直充官方媒体后台，每一分消耗都透明可查。留下Contact，顾问会为您出一份专属方案。",
    "Pricing follows the partnership structure: base tech fee + performance-linked share, no hidden markups. You top up ad budget on official platforms — every cent traceable. Leave your contact and we'll craft a custom proposal."
  );

  /* 7. <title> / <meta description>：先还原被字典污染的半成品，再整句英文化 */
  const HEAD_MAP = {
    "客户案例 · 文数智旅": "Case Studies · Wenshu Travel",
    "文数智旅客户案例：国际旅行社、地接社、精品旅游公司、景区文旅集团如何用 AI 接住全球客源。": "Wenshu Travel case studies: how international travel agencies, ground operators, boutique studios and culture-tourism groups capture global demand with AI.",
    "入境游趋势洞察 · 大数据能力 · 文数智旅": "Inbound Travel Trends · Big Data · Wenshu Travel",
    "文数智旅趋势洞察：全球客源国搜索趋势、目的地热度、产品偏好数据，帮你提前布局下一个爆款。": "Wenshu Travel trend insights: source-market search trends, destination heat and product preference data — spot the next viral hit early.",
    "多语种理解与生成 · AI 能力 · 文数智旅": "Multilingual Understanding · AI Capabilities · Wenshu Travel",
    "文数智旅多语种 AI 能力：12 语种旅游语义理解与生成，行程术语级准确，母语级应答海外游客。": "Wenshu Travel multilingual AI: tourism-grade understanding and generation in 12 languages, native-level answers for overseas travelers.",
  };
  /* title/meta 在字典替换后可能是混合态，用正则找残留中文片段逐个替换 */
  out = out.replace(/<title>[^<]*<\/title>/g, (m) => {
    let t = m;
    for (const [zh, en] of Object.entries(HEAD_MAP)) t = t.split(zh).join(en);
    /* 通用清理：title 里残留的中文词按字典再扫一次 */
    for (const [zh, en] of DICT_ENTRIES) {
      if (zh.startsWith("ATTR:")) continue;
      if (t.includes(zh)) t = t.split(zh).join(en);
    }
    return t;
  });
  out = out.replace(/<meta name="description" content="[^"]*">/g, (m) => {
    let t = m;
    for (const [zh, en] of Object.entries(HEAD_MAP)) t = t.split(zh).join(en);
    for (const [zh, en] of DICT_ENTRIES) {
      if (zh.startsWith("ATTR:")) continue;
      if (t.includes(zh)) t = t.split(zh).join(en);
    }
    return t;
  });

  /* 8. demo 标注点 data-desc 残留（被「产品」「趋势」等短串抢先命中的） */
  const DEMO_FRAGS = [
    ["海外Social Listening", "Overseas Social Listening"],
    ["Official dashboard直充", "Direct payment through the official ad platform"],
    ["海外游客的咨询高峰恰逢国内深夜，Customer Support无法 7×24 在线，高意向商机白白流走。", "Overseas inquiries often arrive at night in China, when a human service team may be unavailable."],
    ["欧美游客白天咨询时正值国内凌晨，Customer Support不在线，等到次日回复时游客已投向别家。", "Daytime inquiries from Europe and North America can arrive overnight in China, delaying a human response."],
    ["欧美游客的白天是国内深夜，Customer Support不在线，高意向商机在黎明前流失。", "Daytime inquiries from Europe and North America can arrive overnight in China, outside the human service team's hours."],
    ["Customer Support的优质回复自动沉淀入知识库，AI Capabilities随业务持续进化。", "Reviewed service-team responses can be added to the knowledge base as the business develops."],
    ["全渠道Multilingual Real-Time Reception", "Multilingual reception across channels"],
    ["「china itinerary」全球搜索量 8 周连涨，暑期Products窗口确认。", "\"china itinerary\" searches up 8 weeks running — summer product window confirmed."],
    ["「china itinerary」全球搜索量 8 周连涨，暑期产品窗口确认。", "\"china itinerary\" searches up 8 weeks running — summer product window confirmed."],
    ["张家界在韩国市场搜索量月增 140%，建议打包进韩语线路。", "Zhangjiajie searches in Korea up 140% MoM — bundle it into Korean-language tours."],
    ["「144 小时过境免签」社媒声量激增，触发Products上线提醒。", "\"144-hour visa-free transit\" buzz is surging — product launch alert triggered."],
    ["「144 小时过境免签」社媒声量激增，触发产品上线提醒。", "\"144-hour visa-free transit\" buzz is surging — product launch alert triggered."],
    ["美国游客询问家庭亲子行程，AI 识别出 2 大 2 小、暑期出行、偏好自然体验。", "A US family asks about a kid-friendly trip — AI detects 2 adults + 2 children, summer dates, nature preference."],
    ["日本游客确认温泉酒店房型，AI 用敬语回答并引用资源库真实房态。", "A Japanese guest confirms an onsen hotel room — AI replies in honorific Japanese, citing live inventory."],
    ["中东游客询问清真餐安排，AI 自动匹配清真餐厅资源并标注礼拜时间。", "A Middle-East guest asks about halal meals — AI matches halal restaurants and flags prayer times."],
    ["、精品旅游公司、景区文旅集团如何用 AI 接住全球客源。", ", boutique studios and culture-tourism groups capture global demand with AI."],
  ];
  for (const [a, b] of DEMO_FRAGS) {
    if (out.includes(a)) { out = out.split(a).join(b); hit++; }
  }

  out = replaceInsightEnglish(out, zhFile);
  out = out
    .replace(/title="入境游(?:洞察|Insights)、(?:活动沙龙|Events)与百科"/g, 'title="Inbound tourism insights, events and glossary"')
    .replace(/Insights中心/g, 'Insights Center')
    /* 英文词组后残留的中文全角逗号（如 Wenxiaolv，） */
    .replace(/([A-Za-z0-9][A-Za-z0-9 &/+·-]*?)，/g, "$1,");

  return { out, hit };
}

/* ---------- 主流程 ---------- */
const PAGES_DIR = path.join(ROOT, "pages");
const OUT_DIR = path.join(ROOT, "en", "pages");
if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR, { recursive: true });

const files = fs.readdirSync(PAGES_DIR).filter(f => f.endsWith(".html"));
let totalMiss = [];
function writeWithTransientRetry(file, content) {
  for (let attempt = 0; attempt < 6; attempt++) {
    try {
      fs.writeFileSync(file, content, "utf8");
      return;
    } catch (error) {
      if (!["UNKNOWN", "EBUSY", "EPERM"].includes(error.code) || attempt === 5) throw error;
      Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, 80 * (attempt + 1));
    }
  }
}
for (const f of files) {
  const src = fs.readFileSync(path.join(PAGES_DIR, f), "utf8");
  const { out, hit } = translatePage(src, f);
  const outName = f.replace(/\.html$/, ".en.html");
  writeWithTransientRetry(path.join(OUT_DIR, outName), out);
  /* 残留检查 */
  const cjk = out.replace(/<style>[\s\S]*?<\/style>/g, "").replace(/<script>[\s\S]*?<\/script>/g, "").replace(/<!--[\s\S]*?-->/g, "");
  const remains = (cjk.match(/[一-鿿]+[^<"']*/g) || []).filter(s => s.trim().length > 0);
  if (remains.length) totalMiss.push([outName, [...new Set(remains)].slice(0, 6)]);
  console.log(`✔ en/pages/${outName} (${Math.round(out.length / 1024)}KB, ${hit} dict hits, ${remains.length ? "CJK left: " + remains.length : "clean"})`);
}
if (totalMiss.length) {
  console.log("\n残留样例：");
  totalMiss.forEach(([f, arr]) => console.log(" ", f, "→", arr.map(s => s.slice(0, 30)).join(" | ")));
}
console.log(`\nDone: ${files.length} EN subpages -> en/pages/`);
