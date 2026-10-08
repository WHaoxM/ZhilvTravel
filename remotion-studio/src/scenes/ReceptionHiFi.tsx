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
