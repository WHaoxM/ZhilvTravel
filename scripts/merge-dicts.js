/* 合并 4 组字典并仲裁冲突。
   优先级：① 显式 OVERRIDES ② 与首页 build-en.js 已用译法保持一致 ③ 取较长（通常更完整）译文 */
const fs = require("fs");
const files = ["g1", "g2", "g3", "g4"];
const merged = {};
const conflicts = {};
for (const g of files) {
  const d = JSON.parse(fs.readFileSync(`scripts/dict-${g}.json`, "utf8"));
  for (const [k, v] of Object.entries(d)) {
    if (merged[k] === undefined) { merged[k] = v; }
    else if (merged[k] !== v) {
      (conflicts[k] = conflicts[k] || new Set([merged[k]])).add(v);
    }
  }
}

/* 显式仲裁：以首页英文版已用译法 / 统一风格为准 */
const OVERRIDES = {
  /* —— 导航 / 共享 UI（与首页 en/index.html 严格一致）—— */
  "标准化产品": "Products",
  "定制服务": "Custom Services",
  "定制化服务": "Custom Solutions",
  "按需定制": "Tailored",
  "AI 智能接待": "AI Reception",
  "智能方案": "Itinerary Builder",
  "海外获客": "Global Acquisition",
  "订单管理": "Order Management",
  "数据看板": "Data Dashboard",
  "Google / Meta / TikTok 获客": "Acquisition on Google / Meta / TikTok",
  "7×24 多语种智能接待": "24/7 multilingual AI reception",
  "10 分钟出行程 + 报价": "Itinerary + quote in 10 minutes",
  "线路/酒店/地接一站式管理": "Tours, hotels & operators in one place",
  "获客 / 转化 / ROI 全链路可视": "Full-funnel visibility: acquisition to ROI",
  "多语种理解与生成": "Multilingual Understanding",
  "智能挖需与画像": "Intent Mining & Profiling",
  "资源库知识增强": "Knowledge-Grounded AI",
  "入境游趋势洞察": "Inbound Travel Trends",
  "客源国分析": "Source Market Analytics",
  "海外社媒洞察": "Social Listening",
  "全域获客方案": "Global Acquisition",
  "智能接待转化方案": "AI Reception & Conversion",
  "定制方案生产方案": "Itinerary Production",
  "履约与服务方案": "Fulfillment & Service",
  "全域数据增长方案": "Data-Driven Growth",
  "关于我们": "About",
  "媒体报道": "Press",
  "活动沙龙": "Events",
  "联系我们": "Contact",
  "合作模式": "Partnership",
  "联系方式": "Contact",
  "公司名称": "Company name",
  "业务类型": "Business type",
  "如何称呼您": "Your name",
  "提交成功": "Submitted",
  "国际旅行社": "International travel agency",
  "入境游地接社": "Inbound ground operator",
  "精品旅游公司": "Boutique travel studio",
  "景区 / 文旅集团": "Scenic spot / culture-tourism group",
  "旅行社": "Travel agency",
  "地接社": "Ground operator",
  "合作模式是什么？": "How does partnership work?",
  "价格怎么算？": "How much does it cost?",
  "多久能上线？": "How fast can we launch?",
  "文小旅 AI 顾问": "Wenxiaolv AI Assistant",
  "在线 · 随时为您解答": "Online · Ask me anything",
  "合作模式、价格、上线周期": "partnership, pricing, or launch timeline",
  "扫码添加顾问微信": "Scan to Add Our Consultant on WeChat",
  "1 对 1 解答合作与上线问题": "1-on-1 answers on partnership & launch",
  "或直接拨打咨询热线": "Or call our hotline",
  "顾问将在 1 个工作日内联系您，请保持手机畅通": "A consultant will reach out within 1 business day",
  "私有资源库接入 · 品牌话术训练 · 履约流程对接 · 专属部署方案": "Private resource integration · Brand voice training · Workflow onboarding · Dedicated deployment",
  "AI + 入境游全链路增长系统，帮你把入境游客源、品牌与数据资产攥在自己手里。": "The AI-powered inbound tourism growth system — own your customers, brand and data.",
  "免费获取方案": "Get a Plan",
  /* —— ATTR 属性值（与首页一致）—— */
  "ATTR:文数智旅 WENSHU TRAVEL": "ATTR:Wenshu Travel",
  "ATTR:文数智旅 首页": "ATTR:Wenshu Travel Home",
  "ATTR:文小旅": "ATTR:Wenxiaolv",
  "ATTR:智策": "ATTR:Zhice",
  "ATTR:云仓": "ATTR:Yuncang",
  "ATTR:数据罗盘": "ATTR:Data Compass",
  "ATTR:全域增长引擎": "ATTR:Global Growth Engine",
  "ATTR:文小旅 AI 顾问": "ATTR:Wenxiaolv AI Assistant",
  "ATTR:关闭": "ATTR:Close",
  "ATTR:回到顶部": "ATTR:Back to top",
  "ATTR:快捷入口": "ATTR:Quick actions",
  "ATTR:在线咨询": "ATTR:Online chat",
  "ATTR:预约产品演示": "ATTR:Book a Product Demo",
  "ATTR:获取专属增长方案": "ATTR:Get Your Growth Plan",
  "ATTR:咨询定制化服务": "ATTR:Custom Solutions Inquiry",
  "ATTR:领取入境游获客资料": "ATTR:Get Acquisition Resources",
  "ATTR:白皮书与行业洞察（即将上线）": "ATTR:Whitepapers & industry insights (coming soon)",
  "ATTR:请输入手机号码": "ATTR:Your phone or WhatsApp",
  "ATTR:请输入您的公司名称": "ATTR:Your company",
  "ATTR:如何称呼您": "ATTR:Your name",
  "ATTR:输入问题，或留下手机号让顾问联系您": "ATTR:Type a question, or leave your number for a callback",
  /* —— 案例标题统一句式（标题式大小写）—— */
  "云南精品茶旅：方案交付从 3 天到 10 分钟": "Yunnan Boutique Tea Tours: Itinerary Delivery from 3 Days to 10 Minutes",
  "ATTR:云南精品茶旅：方案交付从 3 天到 10 分钟": "ATTR:Yunnan Boutique Tea Tours: Itinerary Delivery from 3 Days to 10 Minutes",
  "西南地接社：深夜询盘转化率提升 4 倍": "Southwest Ground Operator: Late-Night Inquiry Conversion Up 4×",
  "ATTR:西南地接社：深夜询盘转化率提升 4 倍": "ATTR:Southwest Ground Operator: Late-Night Inquiry Conversion Up 4×",
  "桂林文旅集团：投放 ROI 提升 2.3 倍": "Guilin Culture-Tourism Group: Campaign ROI Up 2.3×",
  "ATTR:桂林文旅集团：投放 ROI 提升 2.3 倍": "ATTR:Guilin Culture-Tourism Group: Campaign ROI Up 2.3×",
  "桂林文旅集团：入境游客接待量翻倍": "Guilin Culture-Tourism Group: Inbound Visitor Volume Doubled",
  "ATTR:桂林文旅集团：入境游客接待量翻倍": "ATTR:Guilin Culture-Tourism Group: Inbound Visitor Volume Doubled",
  "某出境社：老客复购贡献 30% 营收": "A Leading Agency: Repeat Bookings Drive 30% of Revenue",
  "ATTR:某出境社：老客复购贡献 30% 营收": "ATTR:A Leading Agency: Repeat Bookings Drive 30% of Revenue",
  "某头部出境社：获客成本下降 62%": "A Leading Agency: Acquisition Cost Down 62%",
  "ATTR:某头部出境社：获客成本下降 62%": "ATTR:A Leading Agency: Acquisition Cost Down 62%",
  "ATTR:某头部出境社：入境游获客成本下降 62%": "ATTR:A Leading Agency: Inbound Acquisition Cost Down 62%",
};

let overridden = 0, autoResolved = 0;
const final = { ...merged };
for (const [k, variants] of Object.entries(conflicts)) {
  if (OVERRIDES[k] !== undefined) { final[k] = OVERRIDES[k]; overridden++; }
  else {
    /* 自动仲裁：取字符数较长的变体（通常信息更完整），并列时取字典序首个 */
    const arr = [...variants].sort((a, b) => b.length - a.length || a.localeCompare(b));
    final[k] = arr[0]; autoResolved++;
  }
}
for (const [k, v] of Object.entries(OVERRIDES)) {
  if (final[k] === undefined) console.log("WARN override key not in dict:", k);
  else final[k] = v;
}

fs.writeFileSync("scripts/dict-all.json", JSON.stringify(final, null, 0), "utf8");
console.log(`keys: ${Object.keys(final).length} | conflicts: ${Object.keys(conflicts).length} (overridden ${overridden}, auto ${autoResolved})`);
/* 未被仲裁覆盖的冲突打印出来人工抽查 */
let n = 0;
for (const [k, variants] of Object.entries(conflicts)) {
  if (OVERRIDES[k] !== undefined) continue;
  if (n++ < 25) console.log("AUTO:", JSON.stringify(k.slice(0, 44)), "=>", JSON.stringify(final[k].slice(0, 60)));
}
