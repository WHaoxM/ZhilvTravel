import React from "react";
import {AbsoluteFill, Easing, Img, interpolate, staticFile, useCurrentFrame} from "remotion";

/**
 * AI 智能接待：真实产品 UI 静帧 + 可编辑的关键文案与镜头运动。
 * 画面没有使用旧 MP4 作为背景视频；原生 1920x1080 截帧用于保留真实界面质感。
 * 旧片中对客不宜展示的技术状态区域由不透明图层遮盖，并重新排版为用户文案。
 */
const TOTAL = 902;
const ease = Easing.bezier(0.22, 0.72, 0.18, 1);
const clamp = {extrapolateLeft: "clamp" as const, extrapolateRight: "clamp" as const};
const font = '"Microsoft YaHei", "Noto Sans CJK SC", Arial, sans-serif';

type Shot = {
  start: number;
  end: number;
  source: string;
  number: string;
  title: string;
  detail: string;
  accent: string;
  zoom?: number;
  origin?: string;
  coverDebug?: boolean;
  coverLeftDebug?: boolean;
  coverManualBadge?: boolean;
  coverRecommendationHint?: boolean;
};

const shots: Shot[] = [
  {start: 0, end: 160, source: "frame-90.png", number: "01", title: "海外咨询，统一接待", detail: "旅客用熟悉的语言发来问题，工作台统一接收。", accent: "#1476e9", zoom: 1.08, coverRecommendationHint: true},
  {start: 160, end: 245, source: "frame-180.png", number: "02", title: "多语言会话，分别跟进", detail: "英语、法语等不同会话，随时切换、互不混淆。", accent: "#3282e5", zoom: 1.12, origin: "35% 0%", coverRecommendationHint: true},
  {start: 245, end: 325, source: "frame-270.png", number: "02", title: "多语言会话，分别跟进", detail: "每位旅客的历史消息与出行意向，都留在自己的会话中。", accent: "#3282e5", zoom: 1.12, origin: "35% 0%", coverRecommendationHint: true},
  {start: 325, end: 430, source: "frame-360.png", number: "03", title: "看懂原话，也看懂需求", detail: "外语咨询同步呈现中文译文，减少跨语言沟通遗漏。", accent: "#159a8d", zoom: 1.18, origin: "48% 0%", coverDebug: true, coverRecommendationHint: true},
  {start: 430, end: 535, source: "frame-450.png", number: "04", title: "AI 先回应，沟通不断线", detail: "按旅客使用的语言回复，并继续询问人数、预算等关键信息。", accent: "#00a477", zoom: 1.18, origin: "48% 0%", coverDebug: true, coverRecommendationHint: true},
  {start: 535, end: 620, source: "frame-540.png", number: "05", title: "关键信息自动整理", detail: "人数、预算、时间和偏好，汇总为可跟进的客户线索。", accent: "#d88621", zoom: 1.14, origin: "63% 0%", coverDebug: true, coverLeftDebug: true, coverRecommendationHint: true},
  {start: 620, end: 710, source: "frame-630.png", number: "06", title: "需要判断时，交给客服", detail: "复杂问题由人工接管，前面的沟通记录继续保留。", accent: "#bd7651", zoom: 1.13, origin: "68% 0%"},
  {start: 710, end: 805, source: "frame-720.png", number: "07", title: "客服接手，不用从头问起", detail: "原话、译文和已确认的需求都在同一处。", accent: "#2878d4", zoom: 1.18, origin: "67% 0%", coverDebug: true, coverManualBadge: true},
  {start: 805, end: TOTAL, source: "frame-810.png", number: "08", title: "从咨询到跟进，衔接顺畅", detail: "AI 先接待，客服聚焦真正需要判断的部分。", accent: "#0b9ba4", zoom: 1.16, origin: "52% 0%", coverDebug: true},
];

// The source frames preserve the real conversation and pointer movements. Only the
// product chrome is rebuilt here: these fields are fixed in each captured shot,
// so masking their raster text cannot change what the traveller actually said.
const conversations = [
  {name: "Emma · Japan family", preview: "Japan family tour during CNY?", initials: "E", language: "EN", tags: ["日本春节", "亲子"], count: 1},
  {name: "Claire · Paris family", preview: "Nous sommes 4, famille avec enfants", initials: "C", language: "FR", tags: ["家庭", "预算待确认"], count: 2},
  {name: "Carlos · Barcelona", preview: "Ruta relajada para niños", initials: "C", language: "ES", tags: ["轻松行程", "亲子"], count: 3},
  {name: "佐藤さん · 初海外", preview: "無理のない日程がいいです", initials: "佐", language: "JA", tags: ["首次出境"], count: 0},
] as const;

const shotContact = (shot: Shot) => shot.source === "frame-180.png" ? 1 : shot.source === "frame-270.png" ? 2 : 0;

const NativeProductChrome: React.FC<{shot: Shot; frame: number}> = ({shot, frame}) => {
  const selected = shotContact(shot);
  const person = conversations[selected];
  const manual = shot.start >= 620;
  const sourceLanguage = selected === 1 ? "Français" : selected === 2 ? "Español" : "English";
  const phone = selected === 1 ? "+33 **** 5810" : selected === 2 ? "+34 **** 7346" : "+44 **** 0928";
  const step = selected === 1 ? "France" : selected === 2 ? "Spain" : "United Kingdom";
  const progress = Math.min(96, Math.max(8, (frame / TOTAL) * 100));
  const tip = selected === 1 ? "每位旅客都在独立会话中跟进" : selected === 2 ? "不同语言的咨询统一进入工作台" : manual ? "客服接手，继续查看完整上下文" : "旅客发来咨询，自动识别语言并翻译";
  return <>
    {/* The original top ribbon and the green technical transport badge are masked. */}
    <div style={{position: "absolute", left: 742, top: 25, minWidth: 436, height: 47, padding: "0 22px", boxSizing: "border-box", borderRadius: 27, background: "#28374f", color: "#fff", display: "grid", placeItems: "center", fontSize: 17, fontWeight: 760, boxShadow: "0 4px 12px #24344c22"}}>{tip}</div>
    <div style={{position: "absolute", left: 81, top: 74, width: 1757, height: 52, background: "#fff", borderBottom: "1px solid #e5ebf0", borderRadius: "26px 26px 0 0", boxSizing: "border-box", display: "flex", alignItems: "center", padding: "0 20px", gap: 10}}>
      {["#fa5b57", "#ffbc36", "#2dca78"].map((color) => <span key={color} style={{width: 12, height: 12, borderRadius: "50%", background: color}} />)}
      <b style={{marginLeft: 17, fontSize: 17, color: "#17283e"}}>文数智旅 · 速答工作台</b>
      <span style={{fontSize: 15, color: "#738397"}}>AI 智能接待 / 多语言会话 / 实时同步</span>
      <div style={{marginLeft: "auto", borderRadius: 18, background: "#edf9f3", border: "1px solid #ccebd9", padding: "7px 14px", fontSize: 14, fontWeight: 720, color: "#20744f"}}>● 工作台运行正常</div>
    </div>
    {/* Rebuild the left navigation as vector text; keep contact wording from the source frames. */}
    <div style={{position: "absolute", left: 81, top: 126, width: 379, height: 844, background: "#fff", borderRight: "1px solid #e3eaf1", boxSizing: "border-box", overflow: "hidden"}}>
      <div style={{padding: "20px 18px 0"}}>
        <div style={{color: "#1d6fca", fontSize: 15, fontWeight: 700}}>← 返回账号列表</div>
        <div style={{display: "flex", alignItems: "baseline", gap: 9, marginTop: 14}}><b style={{fontSize: 24, color: "#152a43"}}>客户会话</b><span style={{fontSize: 14, color: "#687c91"}}>海外旅客 WA 账号</span></div>
        <div style={{height: 40, borderRadius: 13, border: "1px solid #e0e6ec", background: "#f8fafc", display: "flex", alignItems: "center", paddingLeft: 13, marginTop: 16, color: "#8190a2", fontSize: 14}}>搜索联系人 / 消息 / 语言 / 标签</div>
        <div style={{height: 39, borderRadius: 13, background: "#f0f3f8", display: "flex", alignItems: "center", padding: 3, marginTop: 12, fontSize: 15}}>
          <b style={{width: "50%", height: 32, borderRadius: 11, background: "#fff", display: "grid", placeItems: "center", boxShadow: "0 2px 5px #31476118"}}>联系人</b><span style={{width: "50%", textAlign: "center", color: "#687a91"}}>群组</span>
        </div>
        <div style={{fontSize: 14, color: "#697a8f", marginTop: 10}}>国际咨询 · 每位旅客独立会话窗口</div>
      </div>
      <div style={{marginTop: 7}}>
        {conversations.map((contact, index) => <div key={contact.name} style={{height: 97, borderBottom: "1px solid #eef1f5", background: index === selected ? "#f1f7ff" : "#fff", borderLeft: index === selected ? "3px solid #62a5f9" : "3px solid transparent", display: "flex", boxSizing: "border-box", padding: "13px 13px", gap: 12}}>
          <div style={{width: 47, height: 47, borderRadius: "50%", display: "grid", placeItems: "center", flexShrink: 0, background: index === selected ? "#dceaff" : "#f0f3f7", color: index === selected ? "#2079dc" : "#53647b", fontSize: 21, fontWeight: 780}}>{contact.initials}</div>
          <div style={{minWidth: 0, flex: 1}}>
            <div style={{display: "flex", alignItems: "center", height: 22, gap: 5, whiteSpace: "nowrap"}}><b style={{fontSize: 15, color: "#162b44", overflow: "hidden", textOverflow: "ellipsis"}}>{contact.name}</b><span style={{background: "#25c46c", color: "#fff", borderRadius: 4, fontSize: 11, fontWeight: 900, padding: "1px 3px"}}>WA</span><span style={{background: manual && index === 0 ? "#fff2d9" : "#e6f0ff", color: manual && index === 0 ? "#9a6921" : "#2772c8", borderRadius: 4, fontSize: 11, fontWeight: 800, padding: "1px 3px"}}>{manual && index === 0 ? "人工" : "AI"}</span></div>
            <div style={{fontSize: 13, color: "#6d7d91", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", marginTop: 4}}>{contact.preview}</div>
            <div style={{display: "flex", gap: 5, marginTop: 5}}>{[contact.language, ...contact.tags].map((tag) => <span key={tag} style={{fontSize: 11, color: "#3377b3", background: "#e9f3fb", borderRadius: 5, padding: "2px 5px", whiteSpace: "nowrap"}}>{tag}</span>)}</div>
          </div>
          {contact.count > 0 && !(index === selected && shot.source === "frame-90.png") && <span style={{alignSelf: "center", width: 20, height: 20, borderRadius: "50%", display: "grid", placeItems: "center", background: manual && index === 0 ? "#f2ab21" : "#f3454c", color: "#fff", fontSize: 12, fontWeight: 800}}>{contact.count}</span>}
        </div>)}
      </div>
    </div>
    {/* Header-only reconstruction: the captured middle chat and translated messages remain untouched. */}
    <div style={{position: "absolute", left: 461, top: 126, width: 899, height: 99, boxSizing: "border-box", background: "#fff", padding: "19px 22px 0", borderBottom: "1px solid #e1e8f0"}}>
      <div style={{display: "flex", alignItems: "center", gap: 10}}><b style={{fontSize: 22, color: "#182a40"}}>{person.name}</b><span style={{color: "#758398", fontSize: 14}}>{phone}</span><span style={{color: manual ? "#9b7129" : "#2b75d0", background: manual ? "#fff2d5" : "#e7f0ff", borderRadius: 6, padding: "4px 7px", fontSize: 13, fontWeight: 760}}>{manual ? "人工处理中" : "AI 自动回复中"}</span><span style={{marginLeft: "auto", color: "#148ca4", fontSize: 14, fontWeight: 750, background: "#ebfaff", padding: "6px 10px", borderRadius: 7}}>{sourceLanguage} ↔ 简体中文</span></div>
      <div style={{fontSize: 14, color: "#718196", marginTop: 7}}>国外旅客用母语咨询 · 速答自动检测语言、生成中文译文，并按客户语言回复。</div>
      <div style={{height: 3, background: "#f1f4f8", marginTop: 10, borderRadius: 3}}><div style={{height: "100%", width: `${progress}%`, background: "linear-gradient(90deg,#3082ed,#18c18e)", borderRadius: 3}} /></div>
    </div>
    {! (shot.start >= 805) && <div style={{position: "absolute", left: 748, top: 240, minWidth: 326, height: 30, borderRadius: 16, background: "#fff", display: "flex", alignItems: "center", justifyContent: "center", whiteSpace: "nowrap", padding: "0 15px", boxSizing: "border-box", fontSize: 13, color: "#4a6179", boxShadow: "0 4px 15px #64738619"}}>当前窗口：<b style={{marginLeft: 4}}>{person.name} · {step}</b></div>}
    <NativeAssistantPanel shot={shot} manual={manual} sourceLanguage={sourceLanguage} />
  </>;
};

const NativeAssistantPanel: React.FC<{shot: Shot; manual: boolean; sourceLanguage: string}> = ({shot, manual, sourceLanguage}) => {
  const isClaire = shotContact(shot) === 1;
  const isCarlos = shotContact(shot) === 2;
  const facts = [
    ["识别语言", sourceLanguage],
    ["目的地", "日本"],
    ["出行时间", "春节"],
    ["人群", isClaire ? "法国家庭" : isCarlos ? "带儿童家庭" : "4 人 · 6 岁儿童"],
    ["预算", isClaire || isCarlos ? "待确认" : "约 2 万人民币"],
    ["偏好", isClaire ? "家庭友好" : "轻松、不赶路"],
  ];
  const tags = isClaire ? ["法国旅客", "自动翻译", "家庭游", "需求待补充"] : isCarlos ? ["西班牙旅客", "自动翻译", "亲子游", "轻松行程"] : ["海外旅客", "自动翻译", "亲子家庭", "预算明确", "待推荐产品"];
  return <div style={{position: "absolute", left: 1361, top: 126, width: 477, height: 619, boxSizing: "border-box", background: "#fff", borderLeft: "1px solid #e6edf2", color: "#283b50"}}>
    <div style={{height: 63, padding: "12px 18px", boxSizing: "border-box", borderBottom: "1px solid #eef1f5"}}><div style={{height: 36, borderRadius: 14, border: "1px solid #ccebdd", background: "#f0fcf5", color: "#1f8a60", fontWeight: 700, display: "flex", alignItems: "center", paddingLeft: 13, fontSize: 14}}>● 实时已就绪 · 消息、翻译、状态同步</div></div>
    <div style={{height: 82, padding: "18px 18px", boxSizing: "border-box", borderBottom: "1px solid #edf1f5"}}><div style={{height: 43, background: "#f2f4f8", borderRadius: 14, display: "flex", alignItems: "center", fontSize: 15, color: "#6f8094"}}><b style={{width: "50%", height: 38, marginLeft: 3, borderRadius: 11, background: "#fff", color: "#2374d5", boxShadow: "0 2px 7px #5364761a", display: "grid", placeItems: "center"}}>智能助手</b><span style={{width: "50%", textAlign: "center"}}>订单追踪</span></div></div>
    <div style={{margin: "18px 18px 12px", height: 70, border: `1px solid ${manual ? "#f1dfab" : "#e2e9ef"}`, borderRadius: 14, display: "flex", alignItems: "center", padding: "0 15px", boxSizing: "border-box"}}>
      <div style={{width: 40, height: 40, borderRadius: 12, background: "#eff3ff", display: "grid", placeItems: "center", fontSize: 23, marginRight: 12}}>🤖</div><div><b style={{fontSize: 16}}>辅助模式</b><div style={{fontSize: 13, color: "#8190a2", marginTop: 4}}>{manual ? "AI 仅提供推荐话术" : "AI 自动回复"}</div></div>
      <div style={{marginLeft: "auto", width: 52, height: 28, borderRadius: 15, background: manual ? "#ccd5df" : "#286be9", padding: 3, boxSizing: "border-box", display: "flex", justifyContent: manual ? "flex-start" : "flex-end"}}><span style={{width: 22, height: 22, borderRadius: "50%", background: "#fff", boxShadow: "0 1px 4px #2b426b42"}} /></div>
    </div>
    <div style={{margin: "0 18px", height: 124, border: "1px solid #dce8ed", borderRadius: 16, boxSizing: "border-box", padding: "15px 13px", background: "linear-gradient(105deg,#f7fbfd,#e9fbfb)"}}>
      <div style={{display: "flex", justifyContent: "space-between", color: "#6d8295", fontSize: 13, fontWeight: 700}}><span>翻译配置</span><span style={{color: "#159665", background: "#e2f9ea", padding: "2px 6px", borderRadius: 5}}>自动开启</span></div>
      <div style={{display: "flex", alignItems: "center", gap: 8, marginTop: 10, fontSize: 14, fontWeight: 720}}><div style={{background: "#fff", borderRadius: 9, border: "1px solid #e3e9ef", width: 186, padding: "8px 10px"}}>{sourceLanguage}</div><span style={{color: "#97a6b5"}}>→</span><div style={{background: "#f0f5ff", color: "#2a6dc8", borderRadius: 9, border: "1px solid #cbdaf4", flex: 1, padding: "8px 10px"}}>简体中文</div></div>
      <div style={{display: "flex", gap: 6, marginTop: 9}}>{["English", "Français", "Español", "日本語"].map((lang) => <span key={lang} style={{fontSize: 11, borderRadius: 6, padding: "3px 7px", color: lang === sourceLanguage ? "#2670c4" : "#8494a7", background: lang === sourceLanguage ? "#dcecff" : "#f0f3f6", fontWeight: 700}}>{lang}</span>)}</div>
    </div>
    <div style={{fontSize: 13, color: "#6c7f91", margin: "13px 18px 6px", fontWeight: 750}}>客户标签与意图</div>
    <div style={{display: "flex", gap: 6, margin: "0 18px 11px", height: 26, alignItems: "center"}}>{tags.map((tag, index) => <span key={tag} style={{fontSize: 11, borderRadius: 10, padding: "4px 7px", whiteSpace: "nowrap", background: ["#fff0df", "#e6f8ef", "#e9f0ff", "#f5eaff", "#ffedf0"][index], color: ["#a7641f", "#178653", "#315cb0", "#8154a3", "#a53f63"][index], fontWeight: 750}}>{tag}</span>)}</div>
    <div style={{margin: "0 18px", height: 161, border: "1px solid #e0e7ee", borderRadius: 16, background: "#fbfcfe", padding: "9px 12px", boxSizing: "border-box"}}>{facts.map(([label, value]) => <div key={label} style={{display: "flex", justifyContent: "space-between", borderBottom: "1px solid #e8edf2", height: 23, alignItems: "center", fontSize: 12}}><span style={{color: "#8493a3"}}>{label}</span><b style={{color: "#29394c", fontSize: 12}}>{value}</b></div>)}</div>
  </div>;
};

type ChatLine = {left: number; top: number; width: number; height: number; role: string; language: string; original: string; translation: string; time: string; outgoing?: boolean};

const ChatBubble: React.FC<{line: ChatLine}> = ({line}) => <div style={{position: "absolute", left: line.left, top: line.top, width: line.width, height: line.height, boxSizing: "border-box", padding: "11px 15px 10px", borderRadius: 16, borderBottomLeftRadius: line.outgoing ? 16 : 4, borderBottomRightRadius: line.outgoing ? 4 : 16, background: line.outgoing ? "#d8f4c8" : "#fff", boxShadow: "0 8px 16px #755e5b17", color: "#152a3f", display: "flex", flexDirection: "column", gap: 5}}>
  <div style={{fontSize: 12, fontWeight: 750, color: line.outgoing ? "#298d6a" : "#60758b"}}>{line.role} · {line.language} · {line.outgoing ? "出站" : "入站"}</div>
  <div style={{fontSize: line.original.length > 120 ? 16 : 16.5, lineHeight: 1.27, fontWeight: 760, whiteSpace: "pre-wrap"}}>{line.original}</div>
  <div style={{background: line.outgoing ? "#eef9e9" : "#f6f8fa", border: "1px solid #e0e8eb", borderRadius: 10, padding: "6px 9px", fontSize: 14, lineHeight: 1.25, color: "#647589"}}><b style={{color: "#246ed2"}}>中文底稿</b> {line.translation}</div>
  <div style={{position: "absolute", bottom: 7, right: 15, fontSize: 12, color: "#708092", textAlign: "right"}}>{line.time} {line.outgoing ? "已发送" : ""}</div>
</div>;

const NativeChat: React.FC<{shot: Shot}> = ({shot}) => {
  const contact = shotContact(shot);
  const late = shot.start >= 805;
  const needsFollowup = shot.start >= 535;
  const first: ChatLine = contact === 1 ? {left: 24, top: 69, width: 550, height: 137, role: "旅客", language: "Français · WhatsApp", original: "Bonjour, avez-vous un circuit famille au Japon pour le Nouvel An chinois ?", translation: "您好，春节期间有日本家庭游线路吗？", time: "09:42"} : contact === 2 ? {left: 24, top: 69, width: 542, height: 137, role: "旅客", language: "Español · WhatsApp", original: "Hola, ¿pueden recomendar una ruta relajada para una familia con niños?", translation: "您好，可以推荐适合亲子家庭、节奏轻松的路线吗？", time: "09:43"} : {left: 24, top: late ? -10 : 69, width: 492, height: 138, role: "旅客", language: "English · WhatsApp", original: "Hi, do you have Japan family tours during Chinese New Year?", translation: "春节期间去日本的亲子游还有名额吗？", time: "09:41"};
  const response: ChatLine = contact === 1 ? {left: 286, top: 214, width: 588, height: 157, role: "AI", language: "Français", original: "Oui. Pour mieux vous orienter, puis-je confirmer le nombre de voyageurs et votre budget ?", translation: "AI 自动回复：先确认人数与预算。", time: "09:42", outgoing: true} : contact === 2 ? {left: 329, top: 211, width: 545, height: 136, role: "AI", language: "Español", original: "Claro. Le recomendaré opciones con menos traslados y hoteles céntricos.", translation: "AI 自动回复：优先推荐少换酒店、动线轻松的方案。", time: "09:43", outgoing: true} : {left: 322, top: late ? 121 : 205, width: 553, height: 139, role: "AI", language: "English", original: "Yes, we still have options. May I confirm your group size and budget?", translation: "AI 自动回复：先确认人数与预算。", time: "09:41", outgoing: true};
  const followup: ChatLine = {left: 24, top: late ? 258 : 344, width: 590, height: 160, role: "旅客", language: "English · 自动翻译更新", original: "We are 4 people, budget around 20,000 RMB. My child is 6, so we prefer a relaxed schedule.", translation: "我们 4 人，预算约 2 万人民币。孩子 6 岁，希望行程轻松、不赶路。", time: "09:42"};
  const finalReply: ChatLine = {left: 255, top: 396, width: 620, height: 206, role: "客服", language: "客服确认 · 自动翻译为 English", original: "Hi Emma, yes — we still have a few Japan family tour seats for Chinese New Year. I’ll shortlist relaxed routes for your 6-year-old within a 20,000 RMB budget.", translation: "您好，我们春节日本亲子线路目前还有少量名额。我会优先选择不赶路、酒店位置方便、适合 6 岁孩子的方案，并按 2 万左右预算做对比。", time: "09:43", outgoing: true};
  const showResponse = shot.start >= 160;
  return <>
    <div style={{position: "absolute", left: 461, top: 225, width: 899, height: 653, background: "#e9e0dc", overflow: "hidden"}}>
      <ChatBubble line={first} />
      {showResponse && <ChatBubble line={response} />}
      {needsFollowup && <ChatBubble line={followup} />}
      {late && <ChatBubble line={finalReply} />}
      {shot.source === "frame-540.png" && <><div style={{position: "absolute", left: 24, top: 58, width: 850, height: 55, background: "#fffdf8", border: "1px solid #f1dcac", borderRadius: 15, boxShadow: "0 5px 15px #816e5e20", display: "flex", alignItems: "center", padding: "0 16px", boxSizing: "border-box", fontSize: 15, color: "#60584b"}}><span style={{color: "#e59a1f", marginRight: 10}}>●</span><b style={{color: "#25374c", marginRight: 10}}>建议人工介入</b>春节余位 / 报价确认 / 儿童适配，需要客服做关键判断</div><div style={{position: "absolute", left: 24, top: 482, width: 520, height: 41, background: "#f9fdff", border: "1px solid #cde5f1", borderRadius: 12, display: "flex", alignItems: "center", padding: "0 15px", boxSizing: "border-box", fontSize: 14, color: "#5e7188"}}><b style={{color: "#23425e", marginRight: 12}}>● 正在评估是否需要人工介入</b>高峰余位 + 报价组合 + 儿童适配</div></>}
    </div>
    <div style={{position: "absolute", left: 461, top: 878, width: 899, height: 92, background: "#f8fafc", borderTop: "1px solid #e0e7ed", boxSizing: "border-box", padding: "15px 18px"}}><div style={{height: 65, border: "1px solid #dfe8f1", background: "#fff", borderRadius: 17, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 15px", boxSizing: "border-box", color: "#8797a9", fontSize: 14}}><span>{late ? "消息已发送，输入框已清空" : shot.start >= 620 ? "客服可参考推荐话术，编辑后发送" : "AI 自动接待中；人工发送会切换为人工处理"}</span><span style={{display: "grid", placeItems: "center", width: 54, height: 54, borderRadius: 13, background: late ? "#0bb28c" : "#158be2", color: "#fff", fontSize: 22, fontWeight: 800}}>{late ? "✓" : "↗"}</span></div></div>
  </>;
};

const StatusReplacement: React.FC = () => (
  <div style={{position: "absolute", left: 1532, top: 78, width: 302, height: 49, boxSizing: "border-box", background: "#fbfdfc", borderRadius: 24, display: "flex", alignItems: "center", justifyContent: "center", border: "1px solid #ccebdd", boxShadow: "0 1px 5px #b5d3c733", fontSize: 17, fontWeight: 700, color: "#19865a"}}>
    <span style={{width: 9, height: 9, borderRadius: "50%", background: "#18bb74", marginRight: 9}} />
    消息与翻译已同步
  </div>
);

const RecommendationHintReplacement: React.FC = () => (
  <div style={{position: "absolute", left: 1380, top: 766, width: 440, height: 192, boxSizing: "border-box", background: "#fff", border: "1px solid #e7edf2", borderRadius: 16, boxShadow: "0 2px 12px #40546b13", display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", textAlign: "center", color: "#263d58"}}>
    <div style={{width: 42, height: 42, borderRadius: 13, background: "#eff5ff", color: "#2574e5", fontSize: 19, fontWeight: 850, display: "grid", placeItems: "center", marginBottom: 12}}>AI</div>
    <div style={{fontSize: 19, fontWeight: 800, lineHeight: 1.2}}>智能回复辅助</div>
    <div style={{fontSize: 15, lineHeight: 1.4, color: "#6a7f95", marginTop: 8}}>客服可根据旅客需求查看并编辑回复建议</div>
  </div>
);

const DebugReplacement: React.FC<{left?: boolean; height?: number}> = ({left, height = 135}) => (
  <div style={{position: "absolute", left: left ? 470 : 1048, top: left ? 318 : 326, width: left ? 335 : 306, height: left ? 121 : height, boxSizing: "border-box", border: "1px solid #d4e6e7", background: "#fffefc", borderRadius: 15, boxShadow: "0 10px 22px #435a6840", padding: "17px 19px", color: "#243d55"}}>
    <div style={{display: "flex", alignItems: "center", gap: 9, fontWeight: 800, fontSize: 19}}>
      <span style={{width: 10, height: 10, borderRadius: "50%", background: left ? "#edac43" : "#12b4a6"}} />
      {left ? "旅客需求已整理" : "新消息已处理"}
    </div>
    {height > 100 && <div style={{fontSize: 16, lineHeight: 1.45, color: "#587187", marginTop: 10}}>
      {left ? "出行人数、预算与行程偏好\n同步汇总至客户资料。" : "原文与中文译文同步呈现，\n客服可继续查看上下文。"}
    </div>}
    {!left && height > 160 && <div style={{borderTop: "1px solid #e4ecef", marginTop: 16, paddingTop: 13, fontSize: 16, color: "#1b9b8b", fontWeight: 700}}>✓ 客户信息已更新</div>}
  </div>
);

const UIStill: React.FC<{shot: Shot; frame: number}> = ({shot, frame}) => {
  const local = Math.max(0, frame - shot.start);
  const duration = shot.end - shot.start;
  const zoom = interpolate(local, [0, duration], [1.015, shot.zoom ?? 1.1], {...clamp, easing: ease});
  const shift = interpolate(local, [0, duration], [-8, 8], {...clamp, easing: ease});
  const inOpacity = shot.start === 0 ? 1 : interpolate(frame, [shot.start, shot.start + 13], [0, 1], {...clamp, easing: ease});
  const outOpacity = shot.end === TOTAL ? 1 : interpolate(frame, [shot.end - 13, shot.end], [1, 0], {...clamp, easing: ease});
  return (
    <AbsoluteFill style={{opacity: inOpacity * outOpacity, overflow: "hidden"}}>
      <div style={{position: "absolute", inset: 0, transform: `translate(${shift}px, 0) scale(${zoom})`, transformOrigin: shot.origin ?? "50% 0%"}}>
        <Img src={staticFile(`reception-hifi/${shot.source}`)} style={{position: "absolute", inset: 0, width: 1920, height: 1080}} />
        <NativeChat shot={shot} />
        <NativeProductChrome shot={shot} frame={frame} />
        <StatusReplacement />
        {shot.coverRecommendationHint && <RecommendationHintReplacement />}
        {shot.coverDebug && <DebugReplacement height={shot.source === "frame-450.png" ? 204 : shot.source === "frame-720.png" ? 76 : 135} />}
        {shot.coverLeftDebug && <DebugReplacement left />}
        {shot.coverManualBadge && <div style={{position: "absolute", left: 1394, top: 563, width: 255, height: 34, boxSizing: "border-box", display: "flex", alignItems: "center", justifyContent: "center", borderRadius: 16, border: "1px solid #c9e5db", background: "#f3fff9", color: "#178361", fontSize: 16, fontWeight: 750}}>客服可参考推荐话术</div>}
      </div>
    </AbsoluteFill>
  );
};

const TextBanner: React.FC<{shot: Shot; frame: number}> = ({shot, frame}) => {
  const entrance = interpolate(frame, [shot.start + 4, shot.start + 24], [0, 1], {...clamp, easing: ease});
  const exit = interpolate(frame, [shot.end - 17, shot.end - 4], [1, 0], clamp);
  const opacity = entrance * exit;
  return (
    <div style={{position: "absolute", left: 118, bottom: 65, width: 985, minHeight: 121, borderRadius: 22, padding: "21px 28px", boxSizing: "border-box", background: "rgba(13, 30, 53, .92)", boxShadow: "0 18px 50px #152d5260", border: "1px solid rgba(255,255,255,.19)", opacity, transform: `translateY(${(1 - entrance) * 20}px)`, color: "white", display: "flex", alignItems: "center", gap: 22}}>
      <div style={{width: 66, height: 66, borderRadius: 17, flexShrink: 0, background: shot.accent, display: "grid", placeItems: "center", fontWeight: 900, fontSize: 27}}>{shot.number}</div>
      <div style={{minWidth: 0}}>
        <div style={{fontSize: 30, lineHeight: 1.2, fontWeight: 850, letterSpacing: ".015em"}}>{shot.title}</div>
        <div style={{fontSize: 20, lineHeight: 1.35, marginTop: 7, color: "#d7e7f6"}}>{shot.detail}</div>
      </div>
    </div>
  );
};

const Intro: React.FC<{frame: number}> = ({frame}) => {
  const opacity = interpolate(frame, [0, 8, 58, 80], [1, 1, 1, 0], clamp);
  const rise = interpolate(frame, [0, 58], [15, 0], {...clamp, easing: ease});
  return <AbsoluteFill style={{opacity, background: "linear-gradient(115deg,rgba(247,251,255,.98),rgba(234,244,255,.93))", alignItems: "center", justifyContent: "center", flexDirection: "column", color: "#182e4a"}}>
    <div style={{fontSize: 24, fontWeight: 850, color: "#0e73db", letterSpacing: 7, transform: `translateY(${rise}px)`}}>文数智旅 · 速答</div>
    <div style={{fontSize: 72, fontWeight: 900, marginTop: 18, transform: `translateY(${rise}px)`}}>海外旅客 AI 智能接待</div>
    <div style={{fontSize: 30, color: "#526e89", marginTop: 22, transform: `translateY(${rise}px)`}}>多语言咨询 · 即时翻译 · 人工无缝接管</div>
    <div style={{width: 126, height: 5, borderRadius: 6, background: "linear-gradient(90deg,#1476e9,#19c0ae)", marginTop: 33}} />
  </AbsoluteFill>;
};

const Outro: React.FC<{frame: number}> = ({frame}) => {
  const opacity = interpolate(frame, [846, 873], [0, 1], {...clamp, easing: ease});
  return <AbsoluteFill style={{opacity, background: "rgba(248,251,255,.97)", alignItems: "center", justifyContent: "center", flexDirection: "column", color: "#172f4d"}}>
    <div style={{fontSize: 24, fontWeight: 800, color: "#0979e6", letterSpacing: 6}}>文数智旅 · 速答</div>
    <div style={{fontSize: 65, fontWeight: 900, marginTop: 20}}>AI 先接待，客服专注关键判断</div>
    <div style={{fontSize: 28, color: "#5c7289", marginTop: 22}}>咨询、翻译、线索与接管，在同一个工作台衔接</div>
  </AbsoluteFill>;
};

export const ReceptionHiFiScene: React.FC = () => {
  const frame = useCurrentFrame();
  const active = shots.filter((s) => frame >= s.start - 13 && frame <= s.end);
  const shot = shots.find((s) => frame >= s.start && frame < s.end) ?? shots[shots.length - 1];
  return <AbsoluteFill style={{fontFamily: font, background: "#eaf1fa", color: "#172f4d"}}>
    {active.map((s) => <UIStill key={s.source} shot={s} frame={frame} />)}
    <div style={{position: "absolute", inset: 0, pointerEvents: "none", background: "linear-gradient(180deg,transparent 59%,rgba(16,34,57,.07) 100%)"}} />
    {frame >= 72 && frame < 844 && <TextBanner shot={shot} frame={frame} />}
    {frame < 81 && <Intro frame={frame} />}
    {frame >= 846 && <Outro frame={frame} />}
  </AbsoluteFill>;
};
