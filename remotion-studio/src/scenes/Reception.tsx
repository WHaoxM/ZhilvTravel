import React from "react";
import { AbsoluteFill, Easing, interpolate, useCurrentFrame } from "remotion";

/**
 * AI 智能接待 — 源级重绘的可编辑 Remotion 场景。
 * 每条消息、标签和配置项都是真正的 JSX 文本/形状；没有复用原 MP4 像素。
 * 按原片约 30 秒的工作流重建：多语种会话 → 自动翻译 → AI 回复 → 人工接管。
 */
const C = {
  ink: "#172b43",
  muted: "#66778b",
  blue: "#0875f5",
  cyan: "#12b6de",
  green: "#14aa78",
  border: "#dce5ec",
  chip: "#edf4ff",
  canvas: "#eee6df",
};

const font = '"Microsoft YaHei", "Noto Sans CJK SC", Inter, Arial, sans-serif';
const ease = Easing.bezier(0.2, 0.7, 0.2, 1);

const fade = (frame: number, start: number, duration = 15) =>
  interpolate(frame, [start, start + duration], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: ease,
  });

const Badge: React.FC<{
  children: React.ReactNode;
  color?: string;
  background?: string;
  size?: number;
}> = ({ children, color = C.blue, background = C.chip, size = 17 }) => (
  <span
    style={{
      color,
      background,
      borderRadius: 8,
      padding: "4px 9px",
      fontWeight: 750,
      fontSize: size,
      whiteSpace: "nowrap",
    }}
  >
    {children}
  </span>
);

const ConversationRow: React.FC<{
  name: string;
  preview: string;
  initial: string;
  language: string;
  tag: string;
  selected: boolean;
  unread?: number;
}> = ({ name, preview, initial, language, tag, selected, unread }) => (
  <div
    style={{
      background: selected ? "#eaf3ff" : "#fff",
      borderLeft: selected ? `5px solid ${C.blue}` : "5px solid transparent",
      height: 99,
      display: "flex",
      gap: 15,
      alignItems: "center",
      padding: "0 17px",
      borderBottom: `1px solid ${C.border}`,
      boxSizing: "border-box",
    }}
  >
    <div
      style={{
        width: 50,
        height: 50,
        flexShrink: 0,
        borderRadius: "50%",
        background: selected ? "#d9eafe" : "#eef2f7",
        color: selected ? C.blue : C.muted,
        display: "grid",
        placeItems: "center",
        fontWeight: 800,
        fontSize: 23,
      }}
    >
      {initial}
    </div>
    <div style={{ minWidth: 0, flex: 1 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
        <strong style={{ fontSize: 18, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{name}</strong>
        <Badge color="#fff" background="#22bd6c" size={13}>WA</Badge>
        <Badge size={13}>AI</Badge>
      </div>
      <div style={{ fontSize: 16, color: C.muted, marginTop: 5, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{preview}</div>
      <div style={{ display: "flex", gap: 7, marginTop: 6 }}>
        <Badge color="#37638e" background="#eaf1f8" size={12}>{language}</Badge>
        <Badge color="#37638e" background="#eaf1f8" size={12}>{tag}</Badge>
      </div>
    </div>
    {unread ? <div style={{ width: 23, height: 23, borderRadius: "50%", background: "#f04e50", color: "white", display: "grid", placeItems: "center", fontSize: 13, fontWeight: 800 }}>{unread}</div> : null}
  </div>
);

const DataRow: React.FC<{ label: string; value: string }> = ({ label, value }) => (
  <div style={{ display: "flex", justifyContent: "space-between", borderBottom: `1px solid ${C.border}`, padding: "8px 4px", fontSize: 16 }}>
    <span style={{ color: C.muted }}>{label}</span><strong>{value}</strong>
  </div>
);

const ChatBubble: React.FC<{
  outgoing?: boolean;
  eyebrow: string;
  text: string;
  translation: string;
  time?: string;
  top: number;
  width: number;
  left?: number;
  right?: number;
  opacity?: number;
}> = ({ outgoing, eyebrow, text, translation, time = "09:41", top, width, left, right, opacity = 1 }) => (
  <div
    style={{
      position: "absolute", top, left, right, width, opacity,
      background: outgoing ? "#d7f7ce" : "#fff",
      border: `1px solid ${outgoing ? "#c6eaba" : C.border}`,
      borderRadius: outgoing ? "19px 19px 5px 19px" : "19px 19px 19px 5px",
      boxShadow: "0 12px 24px rgba(33,54,76,.08)",
      padding: "18px 20px 13px",
      boxSizing: "border-box",
    }}
  >
    <div style={{ color: outgoing ? C.blue : "#54708e", fontWeight: 700, fontSize: 16, marginBottom: 7 }}>{eyebrow}</div>
    <div style={{ fontSize: 21, lineHeight: 1.45, fontWeight: 700 }}>{text}</div>
    <div style={{ marginTop: 10, padding: "9px 11px", background: outgoing ? "#ecfae8" : "#f3f7fa", border: `1px solid ${C.border}`, borderRadius: 8, fontSize: 17, color: "#344b64" }}>
      <b style={{ color: C.blue }}>{outgoing ? "中文底稿" : "自动翻译"}</b>　{translation}
    </div>
    <div style={{ textAlign: "right", color: C.muted, fontSize: 14, marginTop: 5 }}>{time}{outgoing ? "　已发送" : ""}</div>
  </div>
);

const ReceptionWorkbench: React.FC<{ frame: number }> = ({ frame }) => {
  const selected = frame < 150 ? "Emma" : frame < 235 ? "Claire" : frame < 330 ? "Carlos" : "Emma";
  const isEmma = selected === "Emma";
  const isCarlos = selected === "Carlos";
  const modeOn = frame < 620;
  const customer = isEmma ? "Emma · Japan family" : isCarlos ? "Carlos · Barcelona" : "Claire · Paris family";
  const locale = isEmma ? "English" : isCarlos ? "Español" : "Français";
  const destination = "日本";
  const phone = isEmma ? "+44 **** 0928" : isCarlos ? "+34 **** 7346" : "+33 **** 5810";
  // The pointer is a real interaction cue: it reaches a conversation before
  // that conversation becomes selected, and later reaches the assistant switch.
  const pointerY = interpolate(frame, [115, 145, 207, 230, 305, 327], [438, 438, 535, 535, 339, 339], {
    extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: ease,
  });
  const pointerX = interpolate(frame, [585, 613, 630], [680, 1697, 1697], {
    extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: ease,
  });

  return (
    <div style={{ position: "absolute", left: 80, top: 72, width: 1760, height: 908, background: "white", borderRadius: 28, overflow: "hidden", boxShadow: "0 32px 75px rgba(28,58,105,.23)", border: "1px solid #fff" }}>
      <div style={{ height: 54, display: "flex", alignItems: "center", padding: "0 21px", gap: 10, borderBottom: `1px solid ${C.border}`, background: "#fbfcfe" }}>
        <span style={{ width: 12, height: 12, borderRadius: "50%", background: "#f85149" }} /><span style={{ width: 12, height: 12, borderRadius: "50%", background: "#ffb323" }} /><span style={{ width: 12, height: 12, borderRadius: "50%", background: "#23bf79" }} />
        <strong style={{ marginLeft: 20, fontSize: 19 }}>文数智旅 · 速答工作台</strong>
        <span style={{ fontSize: 16, color: C.muted }}>AI 智能接待 / 多语言会话 / 实时同步</span>
        <div style={{ marginLeft: "auto", fontSize: 16, color: "#078464", border: "1px solid #bcebd8", background: "#ecfbf4", borderRadius: 30, padding: "7px 14px", fontWeight: 700 }}>● 在线同步 · 双通道</div>
      </div>

      <div style={{ display: "flex", height: 854 }}>
        <div style={{ width: 375, flexShrink: 0, borderRight: `1px solid ${C.border}`, background: "#fff" }}>
          <div style={{ padding: "18px 19px 12px" }}>
            <div style={{ color: C.blue, fontSize: 16, fontWeight: 700 }}>← 返回账号列表</div>
            <div style={{ display: "flex", alignItems: "baseline", gap: 10, marginTop: 13 }}><strong style={{ fontSize: 26 }}>客户会话</strong><span style={{ fontSize: 14, color: C.muted }}>海外旅客 WA 账号</span></div>
            <div style={{ marginTop: 16, padding: "12px 13px", border: `1px solid ${C.border}`, borderRadius: 9, color: "#8997a8", fontSize: 16 }}>搜索联系人 / 消息 / 语言 / 标签</div>
            <div style={{ marginTop: 12, display: "flex", padding: 4, borderRadius: 11, background: "#f0f3f9", fontSize: 17, fontWeight: 700, textAlign: "center" }}><div style={{ flex: 1, padding: 8, background: "white", borderRadius: 8, boxShadow: "0 2px 6px #dce2e8" }}>联系人</div><div style={{ flex: 1, padding: 8, color: C.muted }}>群组</div></div>
            <div style={{ fontSize: 14, color: C.muted, marginTop: 10 }}>国际咨询 · 每位旅客独立会话窗口</div>
          </div>
          <ConversationRow name="Emma · Japan family" preview="Japan family tour during CNY?" initial="E" language="EN" tag="日本春节" selected={isEmma} />
          <ConversationRow name="Claire · Paris family" preview="Nous sommes 4, famille avec enfants" initial="C" language="FR" tag="家庭" selected={selected === "Claire"} unread={2} />
          <ConversationRow name="Carlos · Barcelona" preview="Ruta relajada para niños" initial="C" language="ES" tag="亲子" selected={isCarlos} unread={3} />
          <ConversationRow name="佐藤さん · 初海外" preview="無理のない日程がいいです" initial="佐" language="JA" tag="首次出境" selected={false} />
        </div>

        <div style={{ width: 900, flexShrink: 0, background: "#f9fafb", position: "relative", borderRight: `1px solid ${C.border}` }}>
          <div style={{ height: 98, background: "white", padding: "17px 23px", boxSizing: "border-box", borderBottom: `1px solid ${C.border}` }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}><strong style={{ fontSize: 24 }}>{customer}</strong><span style={{ color: C.muted, fontSize: 16 }}>{phone}</span><Badge>{modeOn ? "AI 自动回复中" : "人工接管中"}</Badge><span style={{ marginLeft: "auto", color: C.blue, fontWeight: 700, fontSize: 16 }}>{locale} ⇄ 简体中文</span></div>
            <div style={{ marginTop: 8, color: C.muted, fontSize: 16 }}>国外旅客用母语咨询 · 速答自动检测语言、生成中文译文，并按客户语言出站。</div>
            <div style={{ height: 3, width: "68%", background: "linear-gradient(90deg,#0875f5,#14b989)", borderRadius: 4, marginTop: 7 }} />
          </div>
          <div style={{ position: "absolute", top: 98, bottom: 96, left: 0, right: 0, background: C.canvas }}>
            <div style={{ position: "absolute", top: 15, left: "50%", translate: "-50% 0", background: "white", borderRadius: 30, padding: "9px 16px", fontSize: 15, fontWeight: 700, color: "#53667a", whiteSpace: "nowrap", boxShadow: "0 5px 15px #cfc5be66" }}>当前窗口: {customer} · {isEmma ? "United Kingdom" : isCarlos ? "Spain" : "France"}</div>
            {isEmma ? (
              <>
                <ChatBubble top={75} left={23} width={505} eyebrow="游客 · English · WhatsApp 入站" text="Hi, do you have Japan family tours during Chinese New Year?" translation="春节期间去日本的亲子游还有名额吗？" opacity={fade(frame, 75, 15)} />
                {frame >= 345 ? <ChatBubble top={265} right={23} width={548} outgoing eyebrow="AI · English 出站" text="Yes, we still have options. May I confirm your group size and budget?" translation="先确认人数与预算。" opacity={fade(frame, 345, 14)} /> : null}
                {frame >= 475 ? <ChatBubble top={455} left={23} width={610} eyebrow="游客 · English · 新消息" text="We are 4 people. Budget around 20,000 RMB. My child is 6; we prefer a relaxed schedule." translation="4 人，预算约 2 万元，孩子 6 岁，希望行程轻松。" opacity={fade(frame, 475, 14)} /> : null}
              </>
            ) : null}
            {selected === "Claire" ? <><ChatBubble top={75} left={23} width={570} eyebrow="游客 · Français · WhatsApp 入站" text="Bonjour, avez-vous un circuit famille au Japon pour le Nouvel An chinois ?" translation="您好，春节期间有日本家庭游线路吗？" /><ChatBubble top={280} right={23} width={585} outgoing eyebrow="AI · Français 出站" text="Oui. Pour mieux vous orienter, puis-je confirmer le nombre de voyageurs et votre budget ?" translation="先确认人数与预算。" /></> : null}
            {selected === "Carlos" ? <><ChatBubble top={75} left={23} width={570} eyebrow="游客 · Español · WhatsApp 入站" text="Hola, ¿pueden recomendar una ruta relajada para una familia con niños?" translation="您好，可以推荐适合亲子家庭、节奏轻松的路线吗？" /><ChatBubble top={280} right={23} width={565} outgoing eyebrow="AI · Español 出站" text="Claro. Le recomendaré opciones con menos traslados y hoteles céntricos." translation="优先推荐少换酒店、动线轻松的方案。" /></> : null}
            {frame >= 270 && frame < 430 ? <div style={{ position: "absolute", right: 20, top: 120, width: 280, padding: "12px 15px", background: "#263349", color: "white", borderRadius: 13, fontSize: 15, lineHeight: 1.5, boxShadow: "0 12px 20px #30435644", opacity: fade(frame, 270) }}><b style={{ color: "#4ce3e1" }}>● message:new</b><br />English 入站进入 session: emma<br /><b style={{ color: "#83adff" }}>● translation:updated</b><br />原文 → 简体中文译文已写入</div> : null}
          </div>
          <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 96, background: "#f8fafc", borderTop: `1px solid ${C.border}`, display: "flex", alignItems: "center", gap: 13, padding: "0 18px", boxSizing: "border-box" }}><div style={{ flex: 1, background: "white", height: 61, border: `1px solid ${C.border}`, borderRadius: 15, color: "#9bacbe", fontSize: 17, display: "flex", alignItems: "center", padding: "0 16px" }}>{modeOn ? "AI 自动接待中 · 人工发送会切换为人工处理" : "人工接管中 · 可直接回复旅客"}</div><div style={{ width: 58, height: 58, display: "grid", placeItems: "center", borderRadius: 15, background: "linear-gradient(135deg,#1c71f5,#14c7dc)", color: "white", fontSize: 27 }}>↗</div></div>
        </div>

        <div style={{ flex: 1, minWidth: 0, background: "#fff", padding: "14px 17px", boxSizing: "border-box" }}>
          <div style={{ padding: "10px 12px", background: "#effaf4", color: "#17845e", border: "1px solid #c5ebd6", borderRadius: 11, fontSize: 16, fontWeight: 700 }}>● 实时已就绪 · 消息、翻译、状态同步</div>
          <div style={{ display: "flex", background: "#eff2f7", borderRadius: 14, padding: 4, gap: 4, marginTop: 16, textAlign: "center", fontWeight: 700, fontSize: 17 }}><div style={{ flex: 1, background: "white", borderRadius: 11, padding: 9, color: C.blue }}>智能助手</div><div style={{ flex: 1, padding: 9, color: C.muted }}>订单追踪</div></div>
          <div style={{ marginTop: 17, border: `1px solid ${C.border}`, borderRadius: 16, padding: "15px 14px", display: "flex", alignItems: "center", gap: 11, background: frame >= 620 ? "#fff7ed" : "#fff" }}><div style={{ width: 39, height: 39, borderRadius: 10, display: "grid", placeItems: "center", background: "#f3eeff", color: C.blue, fontSize: 22 }}>✦</div><div><strong style={{ fontSize: 20 }}>辅助模式</strong><div style={{ fontSize: 15, color: C.muted }}>{modeOn ? "AI 自动回复" : "人工客服接管"}</div></div><div style={{ marginLeft: "auto", width: 53, height: 29, borderRadius: 20, background: modeOn ? C.blue : "#cbd3dd", padding: 3, boxSizing: "border-box" }}><div style={{ width: 23, height: 23, borderRadius: "50%", background: "white", marginLeft: modeOn ? "auto" : 0 }} /></div></div>
          <div style={{ marginTop: 12, padding: "12px 14px", border: `1px solid ${C.border}`, borderRadius: 15, background: "#f6fbfc" }}><div style={{ fontSize: 16, color: C.muted, fontWeight: 700 }}>翻译配置 <span style={{ float: "right", color: C.green }}>{modeOn ? "Auto ON" : "辅助提示 ON"}</span></div><div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 12, fontSize: 16, fontWeight: 700 }}><div style={{ flex: 1, padding: "9px 10px", background: "white", border: `1px solid ${C.border}`, borderRadius: 7 }}>{locale}</div><span>→</span><div style={{ flex: 1, padding: "9px 10px", background: "#eff4ff", border: `1px solid #cee0fa`, borderRadius: 7, color: C.blue }}>简体中文</div></div></div>
          <div style={{ marginTop: 15, fontSize: 16, fontWeight: 700, color: C.muted }}>客户标签与意图</div>
          <div style={{ display: "flex", gap: 6, marginTop: 9, flexWrap: "wrap" }}><Badge color="#ba5c18" background="#fff1e4" size={14}>海外旅客</Badge><Badge color="#0c9a75" background="#e5f8f1" size={14}>自动翻译</Badge><Badge size={14}>亲子家庭</Badge><Badge color="#9139ce" background="#f4eafa" size={14}>预算明确</Badge></div>
          <div style={{ border: `1px solid ${C.border}`, borderRadius: 15, padding: "7px 12px", marginTop: 13 }}><DataRow label="识别语言" value={locale} /><DataRow label="目的地" value={destination} /><DataRow label="出行时间" value="春节" /><DataRow label="人群" value={isEmma ? "4 人 · 6 岁儿童" : isCarlos ? "带儿童家庭" : "法国家庭"} /><DataRow label="预算" value={isEmma ? "约 2 万元" : "待确认"} /><DataRow label="偏好" value={isCarlos ? "轻松、不赶路" : isEmma ? "轻松、不赶路" : "家庭友好"} /></div>
          <div style={{ marginTop: 14, color: C.muted, fontSize: 16, fontWeight: 700 }}>推荐话术 <span style={{ float: "right", color: C.blue }}>刷新</span></div>
          <div style={{ border: `1px solid ${C.border}`, borderRadius: 15, marginTop: 9, height: 120, padding: 16, boxSizing: "border-box", background: frame >= 665 ? "#f2f7ff" : "white" }}>
            {frame >= 665 ? <><strong style={{ color: C.blue, fontSize: 18 }}>AI 已提炼关键线索</strong><div style={{ fontSize: 16, color: C.muted, lineHeight: 1.55, marginTop: 8 }}>旅客需求：亲子出行、预算明确、节奏舒适。客服可据此快速制定方案。</div></> : <div style={{ textAlign: "center", color: C.muted, fontSize: 16, paddingTop: 15 }}><div style={{ fontSize: 28, color: C.blue }}>✦</div>{modeOn ? "AI 自动回复中" : "切换人工后显示回复建议"}</div>}
          </div>
        </div>
      </div>
      {frame >= 115 && frame < 340 ? <svg width="44" height="50" viewBox="0 0 44 50" style={{ position: "absolute", left: 325, top: pointerY, filter: "drop-shadow(2px 4px 2px #31425c55)" }}><path d="M5 3v37l10-10 8 17 8-4-8-17 15-1z" fill="white" stroke="#1b293a" strokeWidth="3" strokeLinejoin="round" /></svg> : null}
      {frame >= 585 && frame < 650 ? <svg width="44" height="50" viewBox="0 0 44 50" style={{ position: "absolute", left: pointerX, top: 235, filter: "drop-shadow(2px 4px 2px #31425c55)" }}><path d="M5 3v37l10-10 8 17 8-4-8-17 15-1z" fill="white" stroke="#1b293a" strokeWidth="3" strokeLinejoin="round" /></svg> : null}
    </div>
  );
};

export const ReceptionScene: React.FC = () => {
  const frame = useCurrentFrame();
  const introOpacity = interpolate(frame, [0, 16, 66, 92], [1, 1, 1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const outroOpacity = interpolate(frame, [810, 835, 882], [0, 1, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  let step = "多语言旅客咨询，统一进入接待工作台";
  if (frame >= 150) step = "不同会话独立处理，语言和客户信息同步切换";
  if (frame >= 330) step = "收到 Emma 咨询：自动识别语言并实时翻译";
  if (frame >= 345) step = "AI 按旅客语言回复，沟通不中断";
  if (frame >= 470) step = "同步提炼人数、预算、时间与出行偏好";
  if (frame >= 615) step = "关键问题转交人工，完整线索留存";

  return (
    <AbsoluteFill style={{ fontFamily: font, color: C.ink, background: "radial-gradient(circle at 8% 3%,#cce0ff 0%,transparent 32%),radial-gradient(circle at 92% 10%,#c6f2eb 0%,transparent 30%),linear-gradient(125deg,#f8fbff,#e9effb)" }}>
      <ReceptionWorkbench frame={frame} />
      <div style={{ position: "absolute", top: 25, left: "50%", translate: "-50% 0", borderRadius: 30, background: "#253246", color: "white", padding: "11px 22px", fontSize: 20, fontWeight: 800, whiteSpace: "nowrap", boxShadow: "0 8px 20px #1d2d4450" }}>{step}</div>
      {frame < 92 ? <AbsoluteFill style={{ background: "#f8fbffec", opacity: introOpacity, display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", textAlign: "center" }}><span style={{ color: C.blue, fontSize: 24, letterSpacing: 5, fontWeight: 800 }}>文数智旅 · 速答</span><strong style={{ fontSize: 66, marginTop: 15 }}>国外旅客 AI 智能接待</strong><span style={{ color: C.muted, fontSize: 26, marginTop: 16 }}>多语言入站翻译 · AI 先接待 · 关键信息同步</span></AbsoluteFill> : null}
      {frame >= 810 ? <AbsoluteFill style={{ background: "#f8fbffed", opacity: outroOpacity, display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", textAlign: "center" }}><span style={{ color: C.blue, fontSize: 24, letterSpacing: 5, fontWeight: 800 }}>文数智旅 · 速答</span><strong style={{ fontSize: 62, marginTop: 15 }}>AI 先接待，客服抓住关键判断</strong><span style={{ color: C.muted, fontSize: 25, marginTop: 17 }}>翻译、回复、线索、接管与记录，在同一个工作台完成</span></AbsoluteFill> : null}
    </AbsoluteFill>
  );
};
