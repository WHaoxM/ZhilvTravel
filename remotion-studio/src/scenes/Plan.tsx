import React from 'react';
import {AbsoluteFill, Easing, interpolate, useCurrentFrame} from 'remotion';

const ink = '#102035';
const muted = '#6a7890';
const blue = '#2169ee';
const green = '#0cbf85';
const line = '#dfe7f0';
const font = 'Microsoft YaHei, PingFang SC, Noto Sans CJK SC, sans-serif';

const fade = (frame: number, from: number, length = 12) =>
  interpolate(frame, [from, from + length], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});

const panel: React.CSSProperties = {
  background: '#fff', border: `1px solid ${line}`, borderRadius: 16,
  boxShadow: '0 12px 32px rgba(26, 54, 99, 0.08)',
};

const Tag = ({children, tone = 'blue'}: {children: React.ReactNode; tone?: 'blue' | 'green' | 'orange'}) => {
  const tones = {
    blue: ['#e9f1ff', '#2169ee'], green: ['#e5f9f1', '#078d64'], orange: ['#fff2da', '#bd7607'],
  } as const;
  return <span style={{display: 'inline-flex', alignItems: 'center', padding: '4px 10px', borderRadius: 999,
    background: tones[tone][0], color: tones[tone][1], fontSize: 13, fontWeight: 700}}>{children}</span>;
};

const RequestCard = ({name, desc, tags, active = false, delay = 0}: {
  name: string; desc: string; tags: readonly [string, string, string]; active?: boolean; delay?: number;
}) => <div style={{...panel, padding: '18px 16px', border: active ? `2px solid ${blue}` : `1px solid ${line}`,
  opacity: delay ? 0.82 : 1, boxShadow: active ? '0 10px 30px rgba(33,105,238,.12)' : panel.boxShadow}}>
  <div style={{display: 'flex', gap: 12, alignItems: 'center'}}>
    <div style={{width: 42, height: 42, borderRadius: 13, display: 'grid', placeItems: 'center', background: active ? blue : '#ecf0f6',
      color: active ? '#fff' : '#7c8aa0', fontWeight: 800, fontSize: 20}}>{name.slice(0, 1)}</div>
    <div style={{minWidth: 0}}><div style={{fontWeight: 800, fontSize: 16, color: ink, lineHeight: 1.32}}>{name}</div>
      <div style={{fontSize: 13, color: muted, marginTop: 5}}>{desc}</div></div>
  </div>
  <div style={{display: 'flex', gap: 6, marginTop: 13}}><Tag>{tags[0]}</Tag><Tag>{tags[1]}</Tag><Tag tone="orange">{tags[2]}</Tag></div>
</div>;

const Tip = ({title, body}: {title: string; body: string}) =>
  <div style={{...panel, padding: '15px 18px', boxShadow: '0 6px 18px rgba(26,54,99,.06)'}}>
    <Tag>趋势</Tag><div style={{fontSize: 17, fontWeight: 800, marginTop: 8, color: ink}}>{title}</div>
    <div style={{fontSize: 13, color: muted, marginTop: 5, lineHeight: 1.5}}>{body}</div>
  </div>;

const Step = ({number, title, body, complete, active}: {
  number: number; title: string; body: string; complete: boolean; active: boolean;
}) => <div style={{display: 'flex', alignItems: 'center', gap: 14, borderRadius: 16,
  border: `1px solid ${active ? '#9cbbff' : line}`, background: active ? '#f6f9ff' : '#fff',
  boxShadow: active ? '0 7px 18px rgba(33,105,238,.10)' : 'none', padding: '11px 14px', minHeight: 66}}>
  <div style={{width: 32, height: 32, borderRadius: 10, flexShrink: 0, display: 'grid', placeItems: 'center',
    background: complete ? blue : '#e9eef5', color: complete ? '#fff' : '#97a5b7', fontWeight: 800, fontSize: 17}}>
    {complete ? '✓' : number}
  </div>
  <div><div style={{fontSize: 17, fontWeight: 800, color: ink}}>{title}</div>
    <div style={{fontSize: 12, color: muted, marginTop: 2}}>{body}</div></div>
</div>;

const DayRow = ({day, title, cost, selected = false}: {day: number; title: string; cost: string; selected?: boolean}) =>
  <div style={{display: 'flex', alignItems: 'center', gap: 14, padding: '12px 15px', borderRadius: 13,
    border: `1px solid ${selected ? '#7daaff' : line}`, background: selected ? '#edf5ff' : '#fff',
    boxShadow: selected ? '0 5px 16px rgba(33,105,238,.10)' : 'none'}}>
    <span style={{width: 35, height: 35, borderRadius: 10, background: selected ? blue : '#ecf2ff',
      color: selected ? '#fff' : blue, display: 'grid', placeItems: 'center', fontWeight: 900, fontSize: 14}}>D{day}</span>
    <div style={{flex: 1, minWidth: 0}}><div style={{fontWeight: 800, fontSize: 16}}>{title}</div>
      <div style={{fontSize: 12, color: muted, marginTop: 3}}>交通 · 景点 · 酒店已匹配</div></div>
    <strong style={{color: blue, fontSize: 15}}>{cost}</strong>
  </div>;

export const PlanScene: React.FC = () => {
  const frame = useCurrentFrame();
  const opening = interpolate(frame, [0, 12, 65, 105, 132], [.34, .9, 1, 1, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const workspace = interpolate(frame, [0, 20], [.15, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const showStartCard = frame < 234;
  const showGeneration = frame >= 222 && frame < 534;
  const showPreview = frame >= 522 && frame < 654;
  const showItinerary = frame >= 642;
  const doneSteps = Math.max(0, Math.min(6, Math.floor((frame - 242) / 42) + 1));
  const pointerX = interpolate(frame, [145, 195, 232, 460, 690, 820], [940, 940, 912, 1110, 1010, 1300], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.bezier(.2,.8,.2,1)});
  const pointerY = interpolate(frame, [145, 195, 232, 460, 690, 820], [547, 593, 520, 610, 745, 680], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const cost = frame >= 550 ? '¥19,860' : '—';

  return <AbsoluteFill style={{fontFamily: font, color: ink, background:
    'radial-gradient(circle at 7% 5%, #e0eaff 0%, transparent 34%), radial-gradient(circle at 92% 2%, #dffcf2 0%, transparent 38%), #f6f9ff'}}>
    <div style={{position: 'absolute', left: 80, top: 70, width: 1760, height: 910,
      background: '#fff', borderRadius: 34, overflow: 'hidden', boxShadow: '0 28px 80px rgba(20,51,99,.19)', opacity: workspace}}>
      <div style={{height: 64, display: 'flex', alignItems: 'center', gap: 11, padding: '0 23px', borderBottom: `1px solid ${line}`, background: '#fbfdff'}}>
        <div style={{display: 'flex', gap: 8}}><i style={{width: 12, height: 12, borderRadius: 99, background: '#ff655f'}}/><i style={{width: 12, height: 12, borderRadius: 99, background: '#ffbd43'}}/><i style={{width: 12, height: 12, borderRadius: 99, background: '#15c982'}}/></div>
        <strong style={{marginLeft: 17, fontSize: 17}}>文数智旅 · 定制家</strong>
        <span style={{color: muted, fontSize: 14}}>需求输入 / AI 方案生成 / 易配操作台 / 对客输出</span>
        <div style={{marginLeft: 'auto', width: 270, height: 14, borderRadius: 99, background: '#e6edf7', overflow: 'hidden'}}>
          <div style={{height: '100%', width: `${interpolate(frame, [70, 580], [0, 100], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'})}%`, borderRadius: 99,
            background: `linear-gradient(90deg, ${blue}, ${green})`}}/>
        </div><Tag tone="green">● 系统已就绪</Tag>
      </div>
      <div style={{display: 'grid', gridTemplateColumns: '330px 1fr 330px', height: 846}}>
        <aside style={{borderRight: `1px solid ${line}`, padding: 18}}>
          <div style={{fontSize: 22, fontWeight: 900, marginBottom: 17}}>待处理需求 <span style={{fontSize: 14, color: muted}}>3 条</span></div>
          <div style={{...panel, padding: '10px 14px', color: muted, fontSize: 14, boxShadow: 'none', marginBottom: 18}}>搜索需求 / 客户 / 目的地</div>
          <RequestCard name="Emma 家庭 · 日本春节亲子 5 天" desc="4 人出行 · 6 岁儿童 · 酒店方便" tags={['亲子家庭','5 天','¥20,000']} active/>
          <div style={{height: 12}}/><RequestCard name="陈先生 · 云南公司团建" desc="30 人团队 · 会议室与接送" tags={['公司团建','4 天','¥60,000']} delay={1}/>
          <div style={{height: 12}}/><RequestCard name="Claire · 法国家庭游" desc="入境游 · 英文导游" tags={['入境游','3 天','¥12,000']} delay={1}/>
        </aside>
        <main style={{background: '#f8fbff', overflow: 'hidden'}}>
          <div style={{height: 126, background: '#fff', padding: '18px 22px', borderBottom: `1px solid ${line}`}}>
            <div style={{display: 'flex', alignItems: 'center', gap: 12}}>
              <strong style={{fontSize: 24}}>Emma 家庭 · 日本春节亲子 5 天</strong>
              <Tag tone={frame >= 540 ? 'green' : 'orange'}>{frame >= 540 ? '方案已生成' : '生成中'}</Tag>
              <span style={{marginLeft: 'auto', color: muted, fontSize: 14}}>来源：速答 AI 接待提取</span>
            </div>
            <div style={{display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 10, marginTop: 14}}>
              {[['目的地','日本'],['人数','4 人 · 6 岁儿童'],['预算','¥20,000'],['特殊需求','轻松、不赶路、亲子酒店']].map(([label,value]) =>
                <div key={label} style={{border: `1px solid ${line}`, borderRadius: 11, padding: '7px 12px', background: '#fff'}}>
                  <div style={{fontSize: 12, color: muted}}>{label}</div><div style={{fontSize: 15, fontWeight: 800, marginTop: 2}}>{value}</div>
                </div>)}
            </div>
          </div>
          <div style={{position: 'relative', height: 720, padding: 24}}>
            {showStartCard && <div style={{...panel, position: 'absolute', width: 410, left: '50%', top: '46%', translate: '-50% -50%',
              padding: 28, textAlign: 'center', opacity: fade(frame, 102, 15) * interpolate(frame, [222, 234], [1, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'})}}>
              <div style={{width: 62, height: 62, margin: '0 auto 15px', borderRadius: 18, display: 'grid', placeItems: 'center',
                fontSize: 31, color: '#fff', background: `linear-gradient(135deg, ${blue}, #07b7d3)`}}>✦</div>
              <strong style={{display: 'block', fontSize: 25}}>根据客户需求生成计划</strong>
              <p style={{fontSize: 15, color: muted, lineHeight: 1.6}}>从目的地、预算与偏好出发，自动匹配资源，生成可编辑行程。</p>
              <div style={{margin: '18px auto 0', width: 240, padding: '12px 0', borderRadius: 12, color: '#fff', background: blue, fontWeight: 800}}>创建客户专属 AI 方案</div>
            </div>}
            {showGeneration && <div style={{...panel, height: 640, padding: 22, border: `2px solid ${blue}`,
              opacity: fade(frame, 222, 12) * interpolate(frame, [522, 534], [1, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'}), boxShadow: '0 15px 40px rgba(33,105,238,.14)'}}>
              <div style={{display: 'flex', alignItems: 'center', gap: 14}}><strong style={{fontSize: 27}}>AI 正在生成方案</strong>
                <Tag>生成中 · 预计 12 秒</Tag></div>
              <p style={{fontSize: 15, color: muted, margin: '8px 0 16px'}}>从客户需求到可编辑行程底稿：理解需求、匹配资源、结合旅策。</p>
              <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18}}>
                <div style={{display: 'grid', gap: 8}}>
                  <Step number={1} title="理解需求" body="识别目的地、预算、人数与亲子偏好" complete={doneSteps >= 1} active={doneSteps === 1}/>
                  <Step number={2} title="匹配资源" body="筛选酒店、景点、活动与交通" complete={doneSteps >= 2} active={doneSteps === 2}/>
                  <Step number={3} title="结合旅策" body="纳入春节热度与错峰建议" complete={doneSteps >= 3} active={doneSteps === 3}/>
                  <Step number={4} title="生成行程" body="形成按天展开的路线与注意事项" complete={doneSteps >= 4} active={doneSteps === 4}/>
                  <Step number={5} title="校验报价" body="核对天数、预算与成本结构" complete={doneSteps >= 5} active={doneSteps === 5}/>
                  <Step number={6} title="进入易配" body="行程可拖拽、可替换、可输出" complete={doneSteps >= 6} active={doneSteps === 6}/>
                </div>
                <div style={{background: '#07132d', borderRadius: 18, padding: 22, color: '#fff', minHeight: 510}}>
                  <div style={{fontSize: 20, fontWeight: 800, marginBottom: 20}}>✦ 方案预览正在成形</div>
                  <div style={{display: 'grid', gap: 14}}>
                    {['轻松亲子节奏','酒店少切换','预算贴合','可编辑行程'].map((title,i) =>
                      <div key={title} style={{background: i === 0 ? '#153470' : '#1b243c', border: '1px solid #30456a',
                        borderRadius: 13, padding: '16px 18px', opacity: doneSteps >= i+1 ? 1 : .36}}>
                        <strong style={{fontSize: 17}}>{title}</strong><div style={{fontSize: 13, color: '#c7d3e8', marginTop: 5}}>
                          {['每天只保留 1 个核心游玩点','优先亲子设施及便利交通','控制在约 2 万元','生成后可继续拖拽调整'][i]}</div>
                      </div>)}
                  </div>
                </div>
              </div>
            </div>}
            {showPreview && <div style={{...panel, height: 638, padding: 28, opacity: fade(frame, 522, 15) * interpolate(frame, [642, 654], [1, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'}),
              background: 'linear-gradient(145deg,#f8fbff,#eff7ff)', border: '2px solid #93b9ff'}}>
              <div style={{display: 'flex', alignItems: 'center', gap: 12}}><Tag tone="green">✓ 生成完成</Tag>
                <strong style={{fontSize: 26}}>当前可编辑方案</strong><strong style={{marginLeft: 'auto', fontSize: 25, color: blue}}>¥19,860</strong></div>
              <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, marginTop: 22}}>
                <div style={{...panel, padding: 24, minHeight: 500}}><h2 style={{margin: '0 0 8px', fontSize: 26}}>日本春节亲子 5 天</h2>
                  <p style={{color: muted, fontSize: 15}}>轻松行程 · 亲子友好 · 控制预算</p>
                  <div style={{display: 'flex', gap: 12, marginTop: 25}}><Tag>5 天</Tag><Tag>4 人</Tag><Tag>东京</Tag><Tag tone="green">预算内</Tag></div>
                  <div style={{marginTop: 30, display: 'grid', gap: 14}}>
                    <DayRow day={1} title="东京抵达 · 入住亲子酒店" cost="¥3,600"/>
                    <DayRow day={2} title="城市体验 · 亲子慢游" cost="¥3,280"/>
                    <DayRow day={3} title="自然体验 · 节奏留白" cost="¥3,260"/>
                  </div></div>
                <div style={{...panel, padding: 24, minHeight: 500}}><strong style={{fontSize: 22}}>生成结果不是终稿</strong>
                  <p style={{fontSize: 15, color: muted, lineHeight: 1.6}}>顾问可以结合资源库存量、客户反馈与利润目标继续调整。</p>
                  <div style={{display: 'grid', gap: 13, marginTop: 22}}>
                    <div style={{...panel, padding: 18, background: '#effaf5'}}><strong>✓ 空间与时间校验</strong><p style={{color: muted, marginBottom: 0}}>路线顺序合理，避免跨城往返。</p></div>
                    <div style={{...panel, padding: 18}}><strong>↗ 资源仍可替换</strong><p style={{color: muted, marginBottom: 0}}>酒店、景点与车辆均可修改。</p></div>
                    <div style={{...panel, padding: 18}}><strong>¥ 利润与报价联动</strong><p style={{color: muted, marginBottom: 0}}>调整方案后自动更新核算。</p></div>
                  </div></div>
              </div>
            </div>}
            {showItinerary && <div style={{height: 638, opacity: fade(frame, 642, 16)}}>
              <div style={{display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 15}}>
                <div><strong style={{fontSize: 27}}>易配操作台 · 舒适亲子版</strong>
                  <div style={{fontSize: 14, color: muted, marginTop: 5}}>拖拽行程、替换酒店与资源，报价同步更新</div></div>
                <Tag tone="green">已保存 · 可对客输出</Tag>
              </div>
              <div style={{display: 'grid', gridTemplateColumns: '1.15fr .85fr', gap: 17}}>
                <div style={{display: 'grid', gap: 8}}>
                  <DayRow day={1} title="抵达东京 · 轻松入住" cost="¥3,600"/>
                  <DayRow day={2} title="城市探索 · 亲子互动" cost="¥3,280"/>
                  <DayRow day={3} title="自然体验 · 温泉休整" cost="¥3,260" selected={frame >= 720 && frame < 825}/>
                  <DayRow day={4} title="富士山观景 · 错峰游览" cost="¥4,120"/>
                  <DayRow day={5} title="购物与返程 · 从容收尾" cost="¥3,550"/>
                </div>
                <div style={{...panel, padding: 18, minHeight: 435}}>
                  <strong style={{fontSize: 21}}>资源库</strong><p style={{color: muted, fontSize: 14}}>根据需求推荐可替换资源</p>
                  <div style={{display: 'grid', gap: 11}}>
                    <div style={{...panel, padding: 14, background: '#eef6ff'}}><Tag>酒店</Tag><strong style={{fontSize: 17, display: 'block', marginTop: 6}}>东京亲子友好酒店</strong><span style={{fontSize: 13, color: muted}}>交通方便 · 家庭房可选</span></div>
                    <div style={{...panel, padding: 14, background: frame >= 765 ? '#e5f9f1' : '#fff',
                      border: frame >= 765 ? `2px solid ${green}` : `1px solid ${line}`}}><Tag tone="green">景点</Tag><strong style={{fontSize: 17, display: 'block', marginTop: 6}}>富士山观景路线</strong><span style={{fontSize: 13, color: muted}}>错峰安排 · 适合亲子</span></div>
                    <div style={{...panel, padding: 14}}><Tag tone="orange">车辆</Tag><strong style={{fontSize: 17, display: 'block', marginTop: 6}}>包车接送</strong><span style={{fontSize: 13, color: muted}}>节省换乘时间</span></div>
                  </div>
                </div>
              </div>
              {frame >= 825 && <div style={{...panel, marginTop: 13, background: '#e8faf3', borderColor: '#aee3ce',
                padding: '14px 18px', color: '#117254', fontWeight: 800, opacity: fade(frame, 825, 12)}}>
                ✓ 对客方案已准备好：行程、报价与资源同步更新
              </div>}
            </div>}
          </div>
        </main>
        <aside style={{borderLeft: `1px solid ${line}`, padding: 17, display: 'flex', flexDirection: 'column', gap: 13}}>
          <div style={{fontSize: 22, fontWeight: 900}}>↗ 旅策推荐</div>
          <Tip title="春节日本亲子搜索上涨 38%" body="优先选择交通便利的亲子酒店与适龄活动"/>
          <Tip title="富士山观景建议错峰" body="将观景安排在第 4 天，避免儿童疲劳"/>
          <Tip title="亲子家庭偏好短交通" body="减少频繁换酒店与长距离转场"/>
          <div style={{marginTop: 'auto', borderTop: `1px solid ${line}`, paddingTop: 16}}>
            <div style={{fontSize: 22, fontWeight: 900, marginBottom: 12}}>¥ 计划核算</div>
            <div style={{...panel, padding: 16, boxShadow: 'none', display: 'grid', gap: 12}}>
              <div style={{display: 'flex', justifyContent: 'space-between'}}><span>库存校验</span><span style={{color: green}}>已校验</span></div>
              <div style={{display: 'flex', justifyContent: 'space-between'}}><span>利润率</span><strong style={{color: blue}}>15%</strong></div>
              <div style={{height: 8, background: '#e7ecf5', borderRadius: 99}}><div style={{width: '58%', height: '100%', background: `linear-gradient(90deg,${blue},${green})`, borderRadius: 99}}/></div>
              <div style={{display: 'flex', justifyContent: 'space-between'}}><span>最终报价</span><strong style={{fontSize: 21, color: blue}}>{cost}</strong></div>
            </div>
            <div style={{background: frame >= 825 ? green : '#e9eff6', color: frame >= 825 ? '#fff' : '#6d7a8d',
              borderRadius: 11, textAlign: 'center', padding: '13px 0', marginTop: 12, fontWeight: 800}}>生成后可输出宣传册</div>
          </div>
        </aside>
      </div>
    </div>
    <div style={{position: 'absolute', left: 700, top: 25, minWidth: 520, padding: '12px 25px', borderRadius: 999,
      background: '#1d2840', color: '#fff', textAlign: 'center', fontSize: 18, fontWeight: 800, boxShadow: '0 12px 30px rgba(21,36,65,.22)'}}>
      {frame < 225 ? '从需求提取，生成客户专属行程' : frame < 525 ? 'AI 按需求、资源库与旅策趋势生成第一版行程' : frame < 645 ? '生成完成：当前可编辑方案' : '进入易配：调整路线、替换资源、核算报价'}
    </div>
    {opening > 0 && <div style={{position: 'absolute', left: 250, top: 355, width: 1420, textAlign: 'center', opacity: opening}}>
      <div style={{color: blue, fontSize: 24, fontWeight: 900}}>文数智旅 · 定制家</div>
      <div style={{fontSize: 68, fontWeight: 900, letterSpacing: 2, marginTop: 16}}>AI 方案生成完整过程</div>
      <div style={{fontSize: 26, color: muted, marginTop: 18}}>从客户需求，到方案底稿、易配校正、宣传册工作台</div>
    </div>}
    {frame >= 137 && frame < 865 && <div style={{position: 'absolute', left: pointerX, top: pointerY, width: 0, height: 0,
      borderLeft: '19px solid #172038', borderTop: '28px solid transparent', rotate: '-28deg', filter: 'drop-shadow(2px 3px 2px #fff)',
      opacity: frame >= 137 && frame < 865 ? 1 : 0}}/>}
  </AbsoluteFill>;
};
