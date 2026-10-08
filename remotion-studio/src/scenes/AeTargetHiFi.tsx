import React from 'react';
import {AbsoluteFill, Easing, Img, interpolate, staticFile, useCurrentFrame} from 'remotion';

// Source-driven reconstruction of assets/video/zhiyi/shot_01.mp4.
// The original 1672x941 key art supplies the authentic brand tiles. The AI and
// card layers are high-resolution transparent extractions from that key art.
// All timed motion and the four prominent Chinese labels remain editable here.
const smooth = Easing.bezier(0.42, 0, 0.58, 1);
const lerp = (frame:number, a:number, b:number, from:number, to:number) =>
  interpolate(frame, [a,b], [from,to], {easing:smooth,extrapolateLeft:'clamp',extrapolateRight:'clamp'});

const W=1254, H=720;
const base='ae-target/';

const BrandTile:React.FC<{i:number; frame:number}> = ({i,frame}) => {
  const sourceX=i%2===0?93:279;
  const sourceY=[269,417,565][Math.floor(i/2)];
  const x0=i%2===0?70:208;
  const y0=[213,326,435][Math.floor(i/2)];
  const start=12+i*2, end=46+i*2;
  const x=lerp(frame,start,end,x0,606);
  const y=lerp(frame,start,end,y0,322);
  const scale=lerp(frame,start,end,1,0.46);
  const opacity=lerp(frame,end-5,end+2,1,0);
  return <div style={{position:'absolute',left:x,top:y,width:89,height:90,overflow:'hidden',borderRadius:19,
    transform:`translate(-${(1-scale)*44}px,-${(1-scale)*45}px) scale(${scale})`,transformOrigin:'center',opacity,
    filter:'drop-shadow(0 4px 8px rgba(42,65,111,.13))'}}>
    <Img src={staticFile(base+'source-initial.png')} style={{position:'absolute',width:W,height:H,maxWidth:'none',maxHeight:'none',
      left:-sourceX*W/1672,top:-sourceY*H/941}}/>
  </div>;
};

const Label:React.FC<{text:string;x:number;y:number;w:number;h:number}> = ({text,x,y,w,h}) =>
  <g><rect x={x} y={y} width={w} height={h} rx={9} fill="#222b3f"/>
    <text x={x+w/2} y={y+h*.68} textAnchor="middle" fontFamily="Microsoft YaHei, PingFang SC, Arial, sans-serif"
      fontSize={h*.53} fontWeight={700} fill="#fff" letterSpacing="1.5">{text}</text></g>;

const cardRegions=[
  [44,53,389,420],[500,53,839,416],[957,53,1300,420],
  [44,451,391,816],[499,451,842,816],[959,451,1308,815],
  [45,833,390,1183],[497,834,841,1189],[954,833,1302,1189],
] as const;
const cardTitles=['行程','旅行地图','定制','行程','定制','旅行地图','定制','行程','旅行地图'];
const cardPositions=[
  [768,127],[901,135],[1032,141],
  [752,293],[884,301],[1015,308],
  [735,457],[868,466],[1001,471],
] as const;
const CardLayer:React.FC<{i:number;frame:number}> = ({i,frame})=>{
  const [x0,y0,x1,y1]=cardRegions[i];
  const [targetX,targetY]=cardPositions[i];
  const cardW=127,cardH=160;
  const sx=cardW/(x1-x0),sy=cardH/(y1-y0);
  const begin=59+i*2,end=91+i*.55;
  const fade=lerp(frame,begin,begin+8,0,1);
  const dx=lerp(frame,begin,end,607-targetX,0);
  const dy=lerp(frame,begin,end,330-targetY,0);
  const scale=lerp(frame,begin,end,.55,1);
  const bodyText=(text:string,x:number,y:number,size=11,color='#1b2f50')=><div style={{position:'absolute',left:x,top:y,fontFamily:'Microsoft YaHei, PingFang SC, sans-serif',fontSize:size,fontWeight:700,color,whiteSpace:'nowrap',lineHeight:1}}>{text}</div>;
  return <div style={{position:'absolute',left:targetX,top:targetY,width:cardW,height:cardH,overflow:'hidden',
    opacity:fade,transform:`translate(${dx}px,${dy}px) scale(${scale})`,transformOrigin:'center center'}}>
    <Img src={staticFile(base+'itinerary-card-sprites.png')} style={{position:'absolute',width:1323*sx,height:1189*sy,
      maxWidth:'none',maxHeight:'none',left:-x0*sx,top:-y0*sy}}/>
    {bodyText(cardTitles[i],14,12,13,'#fff')}
    {i===0&&bodyText('5天4晚',17,94,11)}
    {i===2&&bodyText('个性化推荐',17,96,11)}
    {i===3&&[0,1,2,3,4].map(k=><React.Fragment key={k}>{bodyText(`DAY${k+1}`,28,48+k*18,10)}</React.Fragment>)}
    {i===4&&bodyText('偏好设置',17,99,11)}
    {i===6&&<>{bodyText('亲子',20,55,10,'#0966ec')}{bodyText('海岛',76,55,10,'#0966ec')}{bodyText('美食',48,80,10,'#0966ec')}{bodyText('主题偏好',17,100,11)}</>}
    {i===7&&bodyText('行程清单',17,100,11)}
  </div>;
};

export const AeTargetHiFiScene:React.FC=()=>{
  const f=useCurrentFrame();
  const p=lerp(f,61,90,0,1);
  const leftX=385-196*p, rightX=845-256*p;
  const yLT=209+22*p, yRT=220+18*p, yLB=456+8*p, yRB=470-13*p;
  const lw=99-14*p, lh=52-7*p;
  const aiX=lerp(f,61,90,485,292), aiY=lerp(f,61,90,190,218);
  const aiW=lerp(f,61,90,350,293), aiH=lerp(f,61,90,350,286);
  const aiLeft=537-203*p, aiRight=790-248*p;

  return <AbsoluteFill style={{width:W,height:H,overflow:'hidden',background:'#dbe9f9'}}>
    <Img src={staticFile(base+'clean-backdrop.png')} style={{position:'absolute',width:W,height:H}}/>
    {cardRegions.map((_,i)=><CardLayer key={i} i={i} frame={f}/>)}
    <svg width={W} height={H} style={{position:'absolute',inset:0}} aria-hidden>
      <g fill="none" stroke="#446ab2" strokeWidth="2.5" strokeDasharray="2 7" strokeLinecap="round">
        <path d={`M${leftX+lw} ${yLT+lh/2} C${leftX+lw+38} ${yLT+lh/2} ${aiLeft-23} 316 ${aiLeft} 326`}/>
        <path d={`M${leftX+lw} ${yLB+lh/2} C${leftX+lw+38} ${yLB+lh/2} ${aiLeft-23} 444 ${aiLeft} 435`}/>
        <path d={`M${aiRight} 326 C${aiRight+25} 316 ${rightX-24} ${yRT+lh/2} ${rightX} ${yRT+lh/2}`}/>
        <path d={`M${aiRight} 435 C${aiRight+25} 444 ${rightX-24} ${yRB+lh/2} ${rightX} ${yRB+lh/2}`}/>
      </g>
      <Label text="需求" x={leftX} y={yLT} w={lw} h={lh}/>
      <Label text="路线" x={rightX} y={yRT} w={lw} h={lh}/>
      <Label text="情绪" x={leftX} y={yLB} w={lw} h={lh}/>
      <Label text="人数" x={rightX} y={yRB} w={lw} h={lh}/>
    </svg>
    <Img src={staticFile(base+'ai-layered-blank.png')} style={{position:'absolute',left:aiX,top:aiY,width:aiW,height:aiH,
      filter:'drop-shadow(0 12px 13px rgba(60,84,148,.16))'}}/>
    <div style={{position:'absolute',left:aiX+aiW*.23,top:aiY+aiH*.42,color:'#fff',
      fontFamily:'Arial, sans-serif',fontSize:aiW*.28,fontWeight:700,letterSpacing:-3,
      lineHeight:1,transform:'rotate(10deg)',transformOrigin:'center center',textShadow:'0 1px 2px rgba(255,255,255,.15)'}}>AI</div>
    {[0,1,2,3,4,5].map(i=><BrandTile key={i} i={i} frame={f}/>)}
  </AbsoluteFill>;
};
