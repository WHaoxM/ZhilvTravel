import React from 'react';
import {AbsoluteFill, Easing, Img, interpolate, staticFile, useCurrentFrame} from 'remotion';

/**
 * Hi-fi rebuild of the 32-second plan-generation product demo.
 * Four native-resolution reference stills supply the non-animated product UI
 * chrome. The active work area, all focal copy and state changes are separate
 * editable React layers; no original video is used as a moving backdrop.
 */
const C = {navy: '#09152a', muted: '#5f6c7e', blue: '#2568ed', green: '#09b982', line: '#dfe5ec'};
const font = 'Microsoft YaHei, PingFang SC, Noto Sans CJK SC, sans-serif';
const ease = Easing.bezier(.22, .76, .22, 1);
const opacityIn = (f: number, at: number, dur = 12) => interpolate(f, [at, at + dur], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: ease});
const box: React.CSSProperties = {background: '#fff', border: `1px solid ${C.line}`, borderRadius: 18, boxShadow: '0 11px 26px rgba(33, 48, 77, .08)'};

const Pill: React.FC<{children: React.ReactNode; tone?: 'blue' | 'green' | 'orange' | 'dark'; style?: React.CSSProperties}> = ({children, tone = 'blue', style}) => {
  const tones = {blue: ['#e8f0ff', '#1d5edb'], green: ['#e8f9f1', '#07835e'], orange: ['#fff1dc', '#9f6508'], dark: ['#060e26', '#fff']} as const;
  return <span style={{display: 'inline-flex', alignItems: 'center', justifyContent: 'center', padding: '5px 11px', borderRadius: 99,
    fontSize: 15, fontWeight: 800, background: tones[tone][0], color: tones[tone][1], lineHeight: 1.2, ...style}}>{children}</span>;
};

const Top: React.FC<{frame: number}> = ({frame}) => {
  const heading = frame < 102 ? '客户需求已汇总，准备生成专属行程' : frame < 224 ? '确认需求后，一键生成客户专属方案' : frame < 535 ? '正在综合需求、资源与旅行建议' : frame < 648 ? '可编辑方案已生成，顾问可继续调整' : frame < 902 ? '拖拽资源，报价与行程同步更新' : 'AI 生成底稿，定制师精修成品';
  return <>
    <div style={{position: 'absolute', left: 490, top: 25, width: 940, textAlign: 'center', zIndex: 30}}>
      <span style={{display: 'inline-block', color: '#fff', background: '#30394f', borderRadius: 999,
        padding: '12px 28px', fontSize: 21, fontWeight: 800, boxShadow: '0 8px 24px #253c5525'}}>{heading}</span>
    </div>
    {/* Remove the internal tenant flag from the reference UI with an editable public-facing label. */}
    <div style={{position: 'absolute', left: 1705, top: 83, width: 128, height: 31, background: '#f8fcfa', borderRadius: 99, zIndex: 35,
      display: 'grid', placeItems: 'center', border: '1px solid #ccead9', color: '#0a855f', fontSize: 14, fontWeight: 800}}>● 服务已就绪</div>
  </>;
};

// The photographic product shells carry useful layout, but their small UI copy
// is baked into pixels. Cover only the three chrome regions with native text.
// The center work area, timings and motion remain untouched.
const WindowChrome: React.FC<{frame: number}> = ({frame}) => <div style={{position: 'absolute', left: 72, top: 72, width: 1776, height: 54,
  background: '#fff', borderBottom: `1px solid ${C.line}`, borderRadius: '21px 21px 0 0', zIndex: 9,
  display: 'flex', alignItems: 'center', padding: '0 21px', gap: 9, boxSizing: 'border-box'}}>
  {['#ff5e56', '#ffbd2e', '#19c96a'].map((color) => <span key={color} style={{width: 12, height: 12, borderRadius: 12, background: color}}/>)}
  <strong style={{fontSize: 16, marginLeft: 17, whiteSpace: 'nowrap'}}>文数智旅 · 定制家</strong>
  <span style={{fontSize: 14, color: C.muted, whiteSpace: 'nowrap'}}>需求输入 / AI 方案生成 / 易配操作台 / 对客输出</span>
  <div style={{marginLeft: 'auto', width: 300, height: 26, borderRadius: 20, background: '#eef1f6', overflow: 'hidden'}}>
    <div style={{height: '100%', width: `${frame < 220 ? 24 : frame < 535 ? 65 : 93}%`,
      background: 'linear-gradient(90deg,#2868f2,#08bd8b)', borderRadius: 20}}/>
  </div>
  <span style={{background: '#eaf8f0', color: '#087852', border: '1px solid #ccebd8', borderRadius: 20,
    padding: '5px 12px', fontSize: 13, fontWeight: 800, whiteSpace: 'nowrap'}}>● 服务已就绪</span>
</div>;

const DemandCard: React.FC<{letter: string; title: string; subtitle: string; tags: string[]; active?: boolean; status?: string; top: number}> =
  ({letter,title,subtitle,tags,active,status,top}) => <div style={{position: 'absolute', left: 14, top, width: 324, height: active ? 213 : 130,
    boxSizing: 'border-box', padding: '15px 13px', background: active ? '#f5f9ff' : '#fff',
    border: `1.5px solid ${active ? '#76a4fc' : C.line}`, borderRadius: 18,
    boxShadow: active ? '0 5px 17px #2c6cea19' : '0 4px 14px #183b4b0c'}}>
    <div style={{display: 'flex', alignItems: 'flex-start', gap: 11}}>
      <span style={{flexShrink: 0, width: 43, height: 43, display: 'grid', placeItems: 'center', borderRadius: 12,
        background: active ? C.blue : '#eef2f7', color: active ? '#fff' : '#65758a', fontSize: 19, fontWeight: 800}}>{letter}</span>
      <div style={{minWidth: 0}}><strong style={{fontSize: 17, display: 'block', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis'}}>{title}</strong>
        <div style={{fontSize: 14, color: C.muted, lineHeight: 1.3, marginTop: 4}}>{subtitle}</div></div>
    </div>
    <div style={{display: 'flex', gap: 7, flexWrap: 'wrap', margin: active ? '13px 0 0 52px' : '10px 0 0 52px'}}>
      {tags.map((tag) => <span key={tag} style={{background: '#edf3fc', color: '#45617f', borderRadius: 7, padding: '3px 6px', fontSize: 12, fontWeight: 700}}>{tag}</span>)}
    </div>
    {active && <div style={{margin: '14px 0 0 52px', padding: '7px 10px', borderRadius: 8,
      color: status?.startsWith('已') ? '#087852' : '#4c54b1', background: status?.startsWith('已') ? '#e9f8f0' : '#f5f0ff',
      fontSize: 13, fontWeight: 800}}>{status}</div>}
  </div>;

const DemandSidebar: React.FC<{frame: number}> = ({frame}) => <div style={{position: 'absolute', left: 72, top: 126, width: 353, height: 852,
  background: '#fff', borderRight: `1px solid ${C.line}`, borderRadius: '0 0 0 20px', zIndex: 8, boxSizing: 'border-box'}}>
  <div style={{display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '18px 19px 0'}}>
    <strong style={{fontSize: 24}}>待处理需求</strong><span style={{fontSize: 13, fontWeight: 800, background: '#f2f5f9', padding: '4px 8px', borderRadius: 10}}>3 条</span>
  </div>
  <div style={{margin: '14px 19px 0', border: `1px solid ${C.line}`, background: '#f8fafd', borderRadius: 12,
    padding: '9px 12px', fontSize: 14, color: '#738197'}}>搜索需求 / 客户 / 目的地</div>
  <div style={{position: 'absolute', top: 127, width: '100%', borderTop: `1px solid ${C.line}`}}/>
  <DemandCard top={132} letter="E" title="Emma 家庭 · 日本春节亲子" subtitle="4 人出行，6 岁儿童；希望节奏轻松。"
    tags={['5 天', '日本', '¥20,000', '亲子家庭']} active status={frame >= 535 ? '已生成方案 · 可进入易配' : frame >= 220 ? '方案生成中' : '待生成方案'}/>
  <DemandCard top={359} letter="陈" title="陈先生 · 云南公司团建" subtitle="30 人团队，会议与活动结合。"
    tags={['4 天', '云南', '¥60,000']}/>
  <DemandCard top={502} letter="C" title="Claire · 法国家庭游" subtitle="希望体验文化与亲子活动。"
    tags={['3 天', '上海', '¥12,000']}/>
</div>;

const InsightCard: React.FC<{title: string; note: string; top: number}> = ({title,note,top}) => <div style={{position: 'absolute', left: 17, top,
  width: 369, height: 96, borderRadius: 17, background: '#fff', border: `1px solid ${C.line}`, boxSizing: 'border-box',
  padding: '13px 15px', boxShadow: '0 5px 12px #132d4910'}}>
  <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
    <span style={{background: '#eaf2ff', borderRadius: 5, color: '#2161cf', padding: '3px 6px', fontSize: 12, fontWeight: 900}}>趋势</span>
    <span style={{color: '#96a2b3', fontSize: 12}}>近期</span>
  </div>
  <strong style={{display: 'block', fontSize: 17, marginTop: 6}}>{title}</strong>
  <div style={{fontSize: 13, color: C.muted, marginTop: 3}}>{note}</div>
</div>;

const InsightsSidebar: React.FC<{frame: number}> = ({frame}) => {
  const ready = frame >= 535;
  return <div style={{position: 'absolute', left: 1444, top: 126, width: 404, height: 852, zIndex: 8,
    background: '#fff', borderLeft: `1px solid ${C.line}`, borderRadius: '0 0 20px 0', boxSizing: 'border-box'}}>
    <strong style={{display: 'block', fontSize: 23, padding: '19px 19px 0'}}>↗ 旅策推荐</strong>
    <InsightCard top={59} title="春节亲子出行热度上升" note="热门时段建议提前规划酒店与活动"/>
    <InsightCard top={167} title="富士山观景关注天气" note="第 4 天下午出发，安排更从容"/>
    <InsightCard top={275} title="亲子家庭偏好短交通" note="单日移动时间尽量控制在 2.5 小时内"/>
    <div style={{position: 'absolute', top: 536, left: 0, right: 0, borderTop: `1px solid ${C.line}`, padding: '18px 17px 0'}}>
      <strong style={{fontSize: 22}}>¥ 计划核算</strong>
      <div style={{display: 'flex', justifyContent: 'space-between', border: `1px solid ${C.line}`, borderRadius: 11,
        padding: '9px 12px', marginTop: 12, fontSize: 14}}>库存校验 <span style={{color: C.muted}}>{ready ? '待校验' : '等待方案'}</span></div>
      <div style={{display: 'flex', justifyContent: 'space-between', border: `1px solid ${C.line}`, borderRadius: 11,
        padding: '9px 12px', marginTop: 9, fontSize: 14}}>基础成本 <strong style={{color: C.blue}}>{ready ? '¥17,270' : '—'}</strong></div>
      <div style={{display: 'flex', justifyContent: 'space-between', fontSize: 14, marginTop: 11}}>参考毛利率 <strong style={{color: C.blue}}>15%</strong></div>
      <div style={{height: 7, borderRadius: 9, background: '#e9edf4', marginTop: 6}}><div style={{width: ready ? '42%' : '8%', height: 7,
        borderRadius: 9, background: 'linear-gradient(90deg,#2469e9,#0fc1c6)'}}/></div>
      <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', border: '1px solid #c7d9f4',
        background: '#eef4ff', color: '#1f5bbb', borderRadius: 12, padding: '11px 12px', marginTop: 11, fontSize: 14}}>
        <strong>预估报价</strong><strong style={{fontSize: 20}}>{ready ? '¥19,860' : '—'}</strong>
      </div>
      <div style={{textAlign: 'center', background: '#f0f3f8', borderRadius: 10, color: C.muted,
        fontWeight: 700, fontSize: 13, padding: '10px 0', marginTop: 9}}>生成后可导出宣传册</div>
    </div>
  </div>;
};

const ContextHeader: React.FC<{frame: number}> = ({frame}) => <div style={{position: 'absolute', left: 425, top: 126, width: 1019, height: 128,
  background: '#fff', borderBottom: `1px solid ${C.line}`, zIndex: 7}}>
  <div style={{display: 'flex', alignItems: 'center', gap: 14, padding: '18px 22px 0'}}>
    <strong style={{fontSize: 26, letterSpacing: -.4}}>Emma 家庭 · 日本春节亲子 5 天</strong>
    <Pill tone={frame >= 535 ? 'green' : frame >= 220 ? 'orange' : 'blue'}>{frame >= 535 ? '方案已生成' : frame >= 220 ? '生成中' : '待生成'}</Pill>
    <span style={{marginLeft: 'auto', color: C.muted, fontSize: 15}}>来源：速答 AI 接待提取</span>
  </div>
  <div style={{display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10, padding: '14px 22px 0'}}>
    {([['目的地', '日本'], ['人数', '4 人 · 6 岁儿童'], ['预算', '¥20,000'], ['特殊需求', '轻松、不赶路、亲子酒店']] as const).map(([a,b]) =>
      <div key={a} style={{border: `1px solid ${C.line}`, borderRadius: 12, height: 53, padding: '7px 11px', background: '#fff'}}>
        <div style={{fontSize: 13, color: C.muted}}>{a}</div><strong style={{fontSize: 16}}>{b}</strong>
      </div>)}
  </div>
</div>;

const StartStage: React.FC<{frame: number}> = ({frame}) => <div style={{position: 'absolute', inset: 0, background: '#f8fafd', opacity: opacityIn(frame, 68, 20)}}>
  <div style={{...box, position: 'absolute', width: 560, height: 322, left: 229, top: 208,
    background: 'linear-gradient(135deg,#fff,#f0f6ff)', borderColor: '#cadcf9', textAlign: 'center', paddingTop: 31,
    boxShadow: '0 25px 55px rgba(30,74,130,.15)'}}>
    <div style={{width: 70, height: 70, background: 'linear-gradient(135deg,#2166eb,#0bb9d5)', color: '#fff', borderRadius: 20,
      fontSize: 37, display: 'grid', placeItems: 'center', margin: '0 auto 19px'}}>✦</div>
    <div style={{fontSize: 30, fontWeight: 900}}>根据客户需求生成计划</div>
    <div style={{fontSize: 17, color: C.muted, lineHeight: 1.6, marginTop: 11}}>AI 读取需求、匹配资源，生成可编辑的行程底稿。<br/>定制师可在易配操作台继续完善。</div>
    <div style={{height: 51, borderRadius: 12, background: C.blue, display: 'grid', placeItems: 'center', color: '#fff',
      fontSize: 17, fontWeight: 800, width: 245, margin: '19px auto 0', boxShadow: '0 9px 19px #285fee40'}}>生成客户专属方案</div>
  </div>
  {frame >= 102 && frame < 160 && <div style={{...box, position: 'absolute', left: 30, top: 17, width: 540, padding: '15px 19px',
    borderColor: '#bacdf8', display: 'flex', gap: 15, opacity: opacityIn(frame, 102)}}>
    <span style={{background: C.blue, color: '#fff', borderRadius: 12, width: 42, height: 42, display: 'grid', placeItems: 'center', fontWeight: 800}}>速</span>
    <div><strong style={{fontSize: 17}}>客户需求已同步至定制家</strong><div style={{fontSize: 14, color: C.muted, marginTop: 3}}>日本春节亲子 5 天 · 4 人 · 约 ¥20,000</div></div>
  </div>}
</div>;

const stepCopy = [
  ['理解需求', '识别目的地、预算、人数与亲子偏好'],
  ['匹配资源', '筛选酒店、景点、活动与交通'],
  ['结合旅策', '加入节假日热度与错峰建议'],
  ['生成行程', '形成按天展开的路线与注意事项'],
  ['校验报价', '核对天数、预算与成本结构'],
  ['进入易配', '行程可拖拽、可替换、可输出'],
] as const;
const ideaCopy = [
  ['轻松亲子节奏', '每天保留 1 个核心游玩点，减少换乘。'],
  ['酒店少切换', '优先选择交通方便、适合家庭的酒店。'],
  ['预算贴合', '在约 2 万元预算内安排合适资源。'],
  ['可编辑行程', '生成后仍可由定制师精细调整。'],
] as const;

const GenerationStage: React.FC<{frame: number}> = ({frame}) => {
  const completed = Math.max(0, Math.min(6, Math.floor((frame - 240) / 47) + 1));
  return <div style={{position: 'absolute', inset: 0, background: '#f8fafd', opacity: opacityIn(frame, 208)}}>
    <div style={{...box, position: 'absolute', left: 30, top: 27, width: 958, height: 664, padding: 25, border: '2px solid #85afff',
      boxShadow: '0 15px 46px rgba(31,91,205,.12)'}}>
      <div style={{display: 'flex', alignItems: 'center'}}><strong style={{fontSize: 29}}>AI 正在生成方案</strong><Pill tone="dark" style={{marginLeft: 'auto'}}>生成中 · 预计 12 秒</Pill></div>
      <p style={{fontSize: 16, color: C.muted, margin: '9px 0 18px'}}>从客户需求到可编辑行程底稿，关键步骤清晰可见。</p>
      <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 19}}>
        <div style={{display: 'grid', gap: 10}}>{stepCopy.map(([title,desc], i) => {
          const done = completed > i; const active = completed === i+1;
          return <div key={title} style={{...box, height: 68, display: 'flex', alignItems: 'center', gap: 14, padding: '10px 14px',
            borderColor: active ? '#9bbdff' : C.line, background: active ? '#f3f7ff' : '#fff', opacity: completed < i ? .56 : 1,
            boxShadow: active ? '0 5px 14px rgba(33,100,210,.09)' : 'none'}}>
            <div style={{background: done ? C.blue : '#e8edf5', color: done ? '#fff' : '#a2acbc', width: 38, height: 38,
              borderRadius: 11, flexShrink: 0, display: 'grid', placeItems: 'center', fontSize: 19, fontWeight: 900}}>{done ? '✓' : i+1}</div>
            <div><strong style={{fontSize: 18}}>{title}</strong><div style={{fontSize: 14, color: C.muted, marginTop: 2}}>{desc}</div></div>
          </div>;
        })}</div>
        <div style={{background: '#030b21', height: 460, borderRadius: 18, padding: 20, color: '#fff', boxShadow: '0 14px 26px #101b3540'}}>
          <div style={{display: 'flex', gap: 11, alignItems: 'center'}}><div style={{width: 38, height: 38, borderRadius: 12,
            background: 'linear-gradient(135deg,#276af0,#00c2ce)', display: 'grid', placeItems: 'center', fontSize: 20, fontWeight: 900}}>AI</div>
            <div><strong style={{fontSize: 19}}>方案预览正在成形</strong><div style={{fontSize: 14, color: '#b7c5dc'}}>只展示业务结果，不打断观看节奏</div></div></div>
          <div style={{display: 'grid', gap: 11, marginTop: 20}}>{ideaCopy.map(([title,body],i) => <div key={title} style={{border: '1px solid #344264',
            borderRadius: 13, padding: '12px 15px', background: i === 0 ? '#122654' : '#172035', opacity: completed >= i+1 ? 1 : .38}}>
            <strong style={{fontSize: 17}}>{title}</strong><div style={{fontSize: 14, color: '#ced8e7', marginTop: 4}}>{body}</div>
          </div>)}</div>
        </div>
      </div>
    </div>
  </div>;
};

const PlanDay: React.FC<{n: number; title: string; detail: string; price: string; active?: boolean}> = ({n,title,detail,price,active}) => <div style={{...box,
  display: 'flex', alignItems: 'center', gap: 14, height: 72, padding: '9px 14px', background: active ? '#eef5ff' : '#fff',
  borderColor: active ? '#82adff' : C.line, boxShadow: active ? '0 8px 18px #2868d91c' : '0 4px 13px #122b4910'}}>
  <div style={{width: 44, height: 44, flexShrink: 0, borderRadius: 12, display: 'grid', placeItems: 'center', fontWeight: 900,
    fontSize: 18, background: active ? C.blue : '#f1f4f8', color: active ? '#fff' : '#34445e'}}>D{n}</div>
  <div style={{minWidth: 0, flex: 1}}><div style={{fontSize: 17, fontWeight: 800}}>{title}</div><div style={{fontSize: 13, color: C.muted, marginTop: 4}}>{detail}</div></div>
  <strong style={{fontSize: 17, color: '#31425b'}}>{price}</strong><span style={{width: 9, height: 9, borderRadius: 9, background: '#08ba83'}}/>
</div>;

const PreviewStage: React.FC<{frame: number}> = ({frame}) => <div style={{position: 'absolute', inset: 0, background: '#f8fafd', opacity: opacityIn(frame, 523)}}>
  <div style={{...box, position: 'absolute', left: 29, top: 27, width: 960, height: 565, padding: 23,
    border: '2px solid #6da0ff', boxShadow: '0 18px 38px #2764be22'}}>
    <div style={{display: 'flex', alignItems: 'center', gap: 13}}><Pill tone="green">✓ 生成完成</Pill><strong style={{fontSize: 28}}>当前可编辑方案</strong>
      <span style={{marginLeft: 'auto', color: C.muted, fontSize: 16}}>定制师可继续调整行程与报价</span></div>
    <div style={{display: 'grid', gridTemplateColumns: '1.07fr .93fr', gap: 18, marginTop: 20}}>
      <div style={{...box, padding: 19, height: 403}}>
        <div style={{display: 'flex', alignItems: 'center'}}><span style={{width: 39, height: 39, borderRadius: 12, background: C.blue,
          color: '#fff', display: 'grid', placeItems: 'center', fontWeight: 900}}>AI</span>
          <div style={{marginLeft: 12}}><strong style={{fontSize: 21}}>日本春节亲子 5 天</strong><div style={{fontSize: 14, color: C.muted}}>方案底稿 · 轻松亲子节奏</div></div>
          <strong style={{marginLeft: 'auto', fontSize: 30, color: C.blue}}>¥19,860</strong></div>
        <div style={{display: 'flex', gap: 7, marginTop: 17}}><Pill>5 天</Pill><Pill>4 人</Pill><Pill>亲子家庭</Pill><Pill tone="green">预算内</Pill></div>
        <div style={{display: 'grid', gap: 9, marginTop: 17}}>
          <PlanDay n={1} title="抵达东京 · 入住亲子酒店" detail="机场接送 / 少步行 / 海滨晚餐" price="¥3,600"/>
          <PlanDay n={2} title="迪士尼轻松日" detail="错峰入园 / 午休留白 / 亲子餐" price="¥5,280"/>
          <PlanDay n={3} title="上野公园 · 浅草文化体验" detail="动物园 / 和服体验 / 短交通" price="¥3,280"/>
        </div>
      </div>
      <div style={{...box, padding: 22, height: 403}}><strong style={{fontSize: 22}}>生成结果不是终稿</strong>
        <p style={{fontSize: 16, color: C.muted, lineHeight: 1.6}}>顾问可结合可用资源、客户反馈与预算目标继续调整。</p>
        <div style={{...box, padding: 17, background: '#eaf8f0', borderColor: '#cbeedc', marginTop: 17}}>
          <strong style={{fontSize: 18, color: '#087952'}}>定制师确认</strong><div style={{fontSize: 15, color: C.muted, marginTop: 4}}>检查节奏、酒店位置与儿童友好程度。</div>
        </div>
        <div style={{...box, padding: 17, marginTop: 13}}><strong style={{fontSize: 18}}>资源可替换</strong><div style={{fontSize: 15, color: C.muted, marginTop: 4}}>酒店、景点及交通可按库存调整。</div></div>
      </div>
    </div>
  </div>
</div>;

const ItineraryStage: React.FC<{frame: number}> = ({frame}) => <div style={{position: 'absolute', inset: 0, background: '#f8fafd', opacity: opacityIn(frame, 636)}}>
  <div style={{display: 'grid', gridTemplateColumns: '607px 412px', height: 724}}>
    <div style={{padding: '20px 21px'}}><div style={{display: 'flex', alignItems: 'center'}}><div><strong style={{fontSize: 25}}>易配操作台 · 舒适亲子版</strong>
      <div style={{fontSize: 15, color: C.muted, marginTop: 4}}>定制师校正资源、排序与报价，拖拽完成后再保存调整。</div></div><Pill style={{marginLeft: 'auto'}}>方案 v2</Pill></div>
      <div style={{display: 'grid', gap: 10, marginTop: 18}}>
        <PlanDay n={1} title="抵达东京 · 亲子酒店入住" detail="机场接机 → 酒店 → 海滨晚餐" price="¥3,600"/>
        <PlanDay n={2} title="迪士尼轻松日" detail="东京迪士尼 → 午休 → 亲子餐厅" price="¥5,280" active={frame >= 704 && frame < 780}/>
        <PlanDay n={3} title="上野公园 · 浅草文化体验" detail="动物园 → 浅草寺 → 和服体验" price="¥3,280" active={frame >= 780 && frame < 833}/>
        <PlanDay n={4} title="富士山轻观景" detail="河口湖 → 亲子摄影点 → 温泉酒店" price="¥4,120"/>
        <PlanDay n={5} title="东京自由活动 · 返程" detail="银座轻购物 → 送机" price="¥3,580"/>
      </div>
    </div>
    <div style={{borderLeft: `1px solid ${C.line}`, padding: '20px 19px', background: '#fff'}}>
      <strong style={{fontSize: 22}}>资源库</strong><div style={{fontSize: 15, color: C.muted, marginTop: 5}}>可用的酒店、旅行套餐与当地体验</div>
      <div style={{display: 'flex', justifyContent: 'space-between', background: '#eef1f6', borderRadius: 13, padding: 6, marginTop: 16,
        fontSize: 14, color: C.muted}}><Pill>目的地资源</Pill><span style={{padding: 7}}>旅行套餐</span><span style={{padding: 7}}>当地体验</span></div>
      <div style={{display: 'grid', gap: 11, marginTop: 15}}>{[
        ['东京湾亲子酒店', '酒店 · 交通便利 · 家庭房', '¥1,180/晚', '#d7ecfb'],
        ['浅草和服体验', '活动 · 2 小时 · 亲子友好', '¥360/人', '#e1d6fc'],
        ['富士山轻摄影', '活动 · 河口湖 · 错峰', '¥680/组', '#c9f4db'],
      ].map(([title,desc,price,color]) => <div key={title} style={{...box, display: 'flex', gap: 13, alignItems: 'center', padding: '13px 12px', height: 73,
        borderColor: title === '东京湾亲子酒店' && frame >= 715 && frame < 775 ? '#78a5ff' : C.line}}>
        <div style={{height: 46, width: 48, borderRadius: 11, background: color}}/>
        <div style={{flex: 1}}><strong style={{fontSize: 16}}>{title}</strong><div style={{fontSize: 13, color: C.muted, marginTop: 4}}>{desc}</div></div>
        <strong style={{color: C.blue, fontSize: 15}}>{price}</strong></div>)}</div>
      <p style={{fontSize: 14, color: C.muted, textAlign: 'center', marginTop: 20}}>将资源拖入行程，报价同步更新</p>
    </div>
  </div>
  {frame >= 835 && <div style={{...box, position: 'absolute', left: 230, top: 115, width: 550, padding: 20,
    background: '#e9f9f1', borderColor: '#b6ebd2', display: 'flex', gap: 15, opacity: opacityIn(frame, 835),
    boxShadow: '0 18px 36px #143b3540'}}>
    <span style={{width: 55, height: 55, flexShrink: 0, borderRadius: 15, background: C.green,
      color: '#fff', display: 'grid', placeItems: 'center', fontSize: 34, fontWeight: 800}}>✓</span>
    <div><strong style={{fontSize: 24}}>对客方案已准备好</strong><div style={{fontSize: 16, color: C.muted, marginTop: 5}}>方案进入客户确认，先保存为产品，再输出可编辑文件。</div></div>
  </div>}
</div>;

const Cursor: React.FC<{frame: number}> = ({frame}) => {
  if (frame < 100 || frame > 865) return null;
  const x = interpolate(frame, [100, 170, 215, 245, 360, 535, 650, 720, 825, 865], [270, 275, 940, 920, 735, 1070, 1010, 1050, 1510, 1650], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: ease});
  const y = interpolate(frame, [100, 170, 215, 245, 360, 535, 650, 720, 825, 865], [300, 300, 725, 660, 410, 500, 490, 600, 930, 940], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: ease});
  return <svg style={{position: 'absolute', left: x, top: y, width: 37, height: 51, zIndex: 40,
    filter: 'drop-shadow(2px 3px 2px #ffffffdd)'}} viewBox="0 0 37 51"><path d="M2 2V43L12 33L19 48L27 44L19 28H34Z" fill="#fff" stroke="#081326" strokeWidth="3" strokeLinejoin="round"/></svg>;
};

const MiniProductPreview: React.FC = () => <div style={{width: 720, height: 405, background: '#f8fafd',
  display: 'grid', gridTemplateRows: '42px 1fr', color: C.navy, fontFamily: font}}>
  <div style={{display: 'flex', alignItems: 'center', gap: 6, background: '#fff', borderBottom: `1px solid ${C.line}`, padding: '0 13px'}}>
    {['#fa6059','#ffbd32','#1bc968'].map((color) => <span key={color} style={{width: 7, height: 7, borderRadius: 7, background: color}}/>)}
    <strong style={{fontSize: 13, marginLeft: 8}}>文数智旅 · 定制家</strong>
    <span style={{fontSize: 10, color: C.muted}}>需求输入 / 方案生成 / 易配</span>
    <span style={{marginLeft: 'auto', borderRadius: 12, background: '#eaf8f0', color: '#087852',
      fontSize: 10, fontWeight: 800, padding: '4px 7px'}}>服务已就绪</span>
  </div>
  <div style={{display: 'grid', gridTemplateColumns: '153px 390px 177px', height: 363}}>
    <div style={{background: '#fff', borderRight: `1px solid ${C.line}`, padding: '11px 9px'}}>
      <strong style={{fontSize: 15}}>待处理需求</strong>
      <div style={{fontSize: 9, color: '#8290a1', background: '#f4f7fa', borderRadius: 7, padding: 6, marginTop: 9}}>搜索客户或目的地</div>
      <div style={{border: '1px solid #7caaff', borderRadius: 9, background: '#f4f8ff', marginTop: 10, padding: 8}}>
        <strong style={{fontSize: 11}}>Emma 家庭 · 日本亲子</strong>
        <div style={{fontSize: 9, color: C.muted, lineHeight: 1.5, marginTop: 5}}>4 人 · 5 天 · 预算 ¥20,000</div>
        <div style={{fontSize: 9, color: '#265ccc', marginTop: 8}}>AI 生成方案中</div>
      </div>
      <div style={{border: `1px solid ${C.line}`, borderRadius: 9, marginTop: 8, padding: 8}}>
        <strong style={{fontSize: 10}}>陈先生 · 云南团建</strong><div style={{fontSize: 9, color: C.muted}}>30 人 · 4 天</div>
      </div>
      <div style={{border: `1px solid ${C.line}`, borderRadius: 9, marginTop: 8, padding: 8}}>
        <strong style={{fontSize: 10}}>Claire · 法国家庭游</strong><div style={{fontSize: 9, color: C.muted}}>上海 · 亲子体验</div>
      </div>
    </div>
    <div style={{padding: '10px 11px'}}>
      <strong style={{fontSize: 16}}>Emma 家庭 · 日本春节亲子 5 天</strong>
      <div style={{display: 'flex', gap: 5, marginTop: 6}}>{['日本','4 人','¥20,000','亲子节奏'].map((tag) => <span key={tag}
        style={{fontSize: 9, color: '#566b85', background: '#fff', border: `1px solid ${C.line}`, borderRadius: 5, padding: '4px 6px'}}>{tag}</span>)}</div>
      <div style={{border: '1.5px solid #77a4fc', borderRadius: 12, background: '#fff', padding: 11, height: 264, marginTop: 9, boxSizing: 'border-box'}}>
        <div style={{display: 'flex', alignItems: 'center'}}><strong style={{fontSize: 18}}>AI 正在生成方案</strong>
          <span style={{marginLeft: 'auto', background: '#09162e', color: '#fff', borderRadius: 12, padding: '4px 6px', fontSize: 9}}>生成中</span></div>
        <div style={{fontSize: 10, color: C.muted, marginTop: 4}}>理解需求、匹配资源，形成可编辑行程。</div>
        <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginTop: 10}}>
          <div style={{display: 'grid', gap: 5}}>{['✓ 理解需求','✓ 匹配资源','✓ 结合旅策','4 生成行程','5 校验报价'].map((s) =>
            <div key={s} style={{fontSize: 10, fontWeight: 700, background: '#f4f8ff', border: `1px solid ${C.line}`, borderRadius: 6, padding: '6px 7px'}}>{s}</div>)}</div>
          <div style={{background: '#07142b', color: '#fff', borderRadius: 9, padding: '10px 9px'}}>
            <strong style={{fontSize: 11}}>行程预览正在成形</strong>
            <div style={{marginTop: 9, fontSize: 10, background: '#183462', borderRadius: 6, padding: 8}}>轻松亲子节奏</div>
            <div style={{marginTop: 7, fontSize: 10, background: '#1a2741', borderRadius: 6, padding: 8}}>酒店少切换</div>
            <div style={{marginTop: 7, fontSize: 10, background: '#1a2741', borderRadius: 6, padding: 8}}>预算贴合</div>
          </div>
        </div>
      </div>
    </div>
    <div style={{borderLeft: `1px solid ${C.line}`, background: '#fff', padding: '11px 9px'}}>
      <strong style={{fontSize: 14}}>旅策推荐</strong>
      {['春节亲子出行热度上升','富士山观景关注天气','亲子家庭偏好短交通'].map((t) =>
        <div key={t} style={{fontSize: 10, fontWeight: 700, border: `1px solid ${C.line}`, borderRadius: 8, padding: '9px 6px', marginTop: 7}}>{t}</div>)}
      <div style={{borderTop: `1px solid ${C.line}`, marginTop: 36, paddingTop: 8}}>
        <strong style={{fontSize: 12}}>计划核算</strong><div style={{fontSize: 10, color: C.muted, marginTop: 6}}>参考毛利率 15%</div>
        <div style={{fontSize: 10, color: C.blue, background: '#edf4ff', padding: '5px 6px', marginTop: 6, borderRadius: 6}}>等待方案生成</div>
      </div>
    </div>
  </div>
</div>;

export const PlanHiFiScene: React.FC = () => {
  const frame = useCurrentFrame();
  const still = frame < 220 ? 'shell-start.png' : frame < 535 ? 'shell-generation.png' : frame < 648 ? 'shell-preview.png' : 'shell-itinerary.png';
  const sceneEnd = interpolate(frame, [895, 928], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const readableCaption = frame < 220 ? '从客户需求出发，一键生成专属行程' : frame < 535 ?
    'AI 匹配酒店、活动与交通，形成行程底稿' : frame < 648 ?
    '方案已生成，定制师继续核对路线与预算' : '拖拽替换资源，行程和报价同步更新';
  const introContentOpacity = interpolate(frame, [0, 64, 72], [1, 1, 0], {
    extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: ease,
  });
  const introY = interpolate(frame, [0, 18, 88], [22, 0, -24], {
    extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: ease,
  });
  return <AbsoluteFill style={{fontFamily: font, color: C.navy,
    background: 'radial-gradient(circle at 15% 0%,#e2ebff 0%,transparent 37%),radial-gradient(circle at 90% 0%,#dcf7f4 0%,transparent 35%),#f8fbff', overflow: 'hidden'}}>
    {/* Native 1920px stills from the original UI are fixed visual assets, not moving MP4 frames. */}
    <Img src={staticFile(`plan-hifi/${still}`)} style={{position: 'absolute', width: 1920, height: 1080, inset: 0,
      clipPath: 'inset(70px 0 0 0)'}}/>
    <WindowChrome frame={frame}/><DemandSidebar frame={frame}/><InsightsSidebar frame={frame}/>
    <div style={{position: 'absolute', left: 705, top: 70, width: 520, height: 7, background: '#fff'}}/>
    <div style={{position: 'absolute', left: 425, top: 254, width: 1019, height: 724, zIndex: 8, overflow: 'hidden', background: '#f8fafd'}}>
      {frame < 220 ? <StartStage frame={frame}/> : frame < 535 ? <GenerationStage frame={frame}/> : frame < 648 ? <PreviewStage frame={frame}/> : <ItineraryStage frame={frame}/>}
    </div>
    <ContextHeader frame={frame}/><Top frame={frame}/><Cursor frame={frame}/>
    <div style={{position: 'absolute', left: 398, top: 997, width: 1124, height: 61, zIndex: 42,
      display: 'grid', placeItems: 'center', color: '#fff', background: 'rgba(9,21,42,.93)', borderRadius: 999,
      fontSize: 30, fontWeight: 900, letterSpacing: .4, boxShadow: '0 9px 24px #07183233'}}>{readableCaption}</div>
    {frame < 72 && <div style={{position: 'absolute', inset: 0, zIndex: 47,
      background: 'radial-gradient(circle at 13% 15%,#dce9ff 0%,transparent 37%),radial-gradient(circle at 91% 15%,#d8f5f0 0%,transparent 37%),#f7faff'}}/>}
    {frame < 72 && <div style={{position: 'absolute', inset: 0, zIndex: 48, opacity: introContentOpacity,
      display: 'grid', placeItems: 'center'}}>
      <div style={{position: 'absolute', left: 1050, top: 290, width: 720, height: 405,
        overflow: 'hidden', borderRadius: 24, border: '1px solid #d4e1f1', background: '#fff',
        boxShadow: '0 32px 65px rgba(24,60,115,.16)'}}>
        <MiniProductPreview/>
      </div>
      <div style={{width: 1390, transform: `translateY(${introY}px)`, textAlign: 'left'}}>
        <div style={{display: 'flex', alignItems: 'center', gap: 17, color: C.blue, fontSize: 28, fontWeight: 900}}>
          <span style={{width: 48, height: 48, borderRadius: 13, background: 'linear-gradient(135deg,#286ced,#08b4d4)',
            color: '#fff', display: 'grid', placeItems: 'center', fontSize: 29}}>✦</span>
          文数智旅 · 定制家
        </div>
        <div style={{height: 7, width: 128, background: 'linear-gradient(90deg,#276cf0,#10b8bb)',
          borderRadius: 99, marginTop: 42, marginBottom: 32}}/>
        <h1 style={{fontSize: 76, lineHeight: 1.27, letterSpacing: -2, fontWeight: 900,
          margin: 0, maxWidth: 820}}>从客户需求，<br/>到可编辑行程方案</h1>
        <div style={{fontSize: 32, color: '#53647a', marginTop: 31, fontWeight: 600}}>
          AI 生成初稿 · 定制师调整 · 对客输出
        </div>
        <div style={{display: 'flex', alignItems: 'center', gap: 17, marginTop: 53, fontSize: 25, fontWeight: 800}}>
          <Pill style={{fontSize: 23, padding: '11px 21px'}}>需求提取</Pill>
          <span style={{color: '#94a7c3'}}>→</span>
          <Pill style={{fontSize: 23, padding: '11px 21px'}}>方案生成</Pill>
          <span style={{color: '#94a7c3'}}>→</span>
          <Pill tone="green" style={{fontSize: 23, padding: '11px 21px'}}>易配精修</Pill>
        </div>
      </div>
    </div>}
    {sceneEnd > 0 && <div style={{position: 'absolute', inset: 0, zIndex: 50, background: '#f7faff', opacity: sceneEnd,
      display: 'grid', placeItems: 'center'}}><div style={{textAlign: 'center'}}><Pill>文数智旅 · 定制家</Pill>
      <h1 style={{fontSize: 58, margin: '19px 0 10px'}}>AI 生成底稿，定制师精修成品</h1>
      <p style={{fontSize: 22, color: C.muted}}>需求提取 · 智能匹配 · 灵活调整 · 对客输出</p></div></div>}
  </AbsoluteFill>;
};
