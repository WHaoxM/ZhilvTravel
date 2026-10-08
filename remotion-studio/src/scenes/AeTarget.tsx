import React from 'react';
import {AbsoluteFill, Easing, interpolate, useCurrentFrame} from 'remotion';

// Faithful 1254x720 reconstruction of zhiyi/shot_01.mp4. Every visible glyph is native SVG text.
const W=1254,H=720, BLUE='#1688f6', PURPLE='#7657ec', INK='#172638';
const ease=Easing.bezier(.42,0,.58,1);
const mix=(f:number,a:number,b:number,from:number,to:number)=>interpolate(f,[a,b],[from,to],{easing:ease,extrapolateLeft:'clamp',extrapolateRight:'clamp'});
const txt=(x:number,y:number,s:string,size=12,fill=INK,weight=600,anchor:'start'|'middle'|'end'='start')=><text x={x} y={y} textAnchor={anchor} fontFamily="Arial, Microsoft YaHei, PingFang SC, sans-serif" fontSize={size} fontWeight={weight} fill={fill}>{s}</text>;

const SocialMark=({type}:{type:string})=>{
  const common={width:48,height:48,viewBox:'0 0 48 48'};
  if(type==='Google') return <svg {...common}><rect width="48" height="48" rx="9" fill="#fff"/><path d="M39 24.4c0-1.2-.1-2.2-.3-3.2H24v6h8.4a7.2 7.2 0 0 1-3.1 4.7v3.9h5.1c3-2.8 4.6-6.9 4.6-11.4Z" fill="#4285F4"/><path d="M24 40c4.3 0 7.9-1.4 10.5-4.2l-5.1-3.9c-1.4 1-3.1 1.7-5.4 1.7-4.1 0-7.6-2.8-8.8-6.6h-5.3v4.1A16 16 0 0 0 24 40Z" fill="#34A853"/><path d="M15.2 27a9.7 9.7 0 0 1 0-6v-4.1H9.9a16 16 0 0 0 0 14.2Z" fill="#FBBC05"/><path d="M24 14.4c2.5 0 4.7.9 6.4 2.5l4.7-4.7A15.7 15.7 0 0 0 24 8a16 16 0 0 0-14.1 8.9l5.3 4.1c1.2-3.8 4.7-6.6 8.8-6.6Z" fill="#EA4335"/></svg>;
  if(type==='TikTok') return <svg {...common}><rect width="48" height="48" rx="9" fill="#101018"/><path d="M27 8h6c.4 4.1 2.5 6.5 6 7v6c-2.6-.1-4.9-.9-6.8-2.3v11.4a10 10 0 1 1-9-9.9v6.3a3.9 3.9 0 1 0 3.8 4V8Z" fill="#fff"/><path d="M25 9h5c.4 4.1 2.4 6.4 5.9 7v4.2c-2.2-.2-4.2-.9-5.9-2.1v12a8.6 8.6 0 1 1-8.1-8.5v4.8a4 4 0 1 0 3.1 3.9V9Z" fill="#25F4EE" opacity=".85"/><path d="M28 8h4c.4 4.1 2.5 6.5 6 7v4.4c-2.4-.2-4.6-1-6.4-2.3v12a8.5 8.5 0 1 1-8.2-8.5v4.7a3.8 3.8 0 1 0 3 3.8V8Z" fill="#FE2C55" opacity=".9"/></svg>;
  if(type==='YouTube') return <svg {...common}><rect width="48" height="48" rx="9" fill="#fff"/><rect x="5" y="11" width="38" height="26" rx="8" fill="#f00"/><path d="m21 17 12 7-12 7Z" fill="#fff"/></svg>;
  if(type==='Meta') return <svg {...common}><rect width="48" height="48" rx="9" fill="#fff"/><path d="M7 29c2-8 6-16 10-16 6 0 11 22 15 22 4 0 8-9 9-14 1-5-1-8-4-8-6 0-13 22-19 22-3 0-5-5-7-9" fill="none" stroke="#087cf0" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"/></svg>;
  if(type==='WhatsApp') return <svg {...common}><rect width="48" height="48" rx="9" fill="#26c968"/><path d="M12 36l2-6a14 14 0 1 1 5 5Z" fill="none" stroke="#fff" strokeWidth="2.6"/><path d="M19 18c1-1 2 0 2 1l2 4c.3 1-1 2-2 2 1 2 3 4 5 5 1-1 2-2 3-1l3 2c1 1 0 2-1 3-2 2-6 1-10-2s-7-8-6-11c.2-1 2-3 4-3Z" fill="#fff"/></svg>;
  return <svg {...common}><defs><linearGradient id="ig" x2="0.9" y2="1"><stop stopColor="#feda75"/><stop offset=".48" stopColor="#d62976"/><stop offset="1" stopColor="#4f5bd5"/></linearGradient></defs><rect width="48" height="48" rx="9" fill="url(#ig)"/><rect x="10" y="10" width="28" height="28" rx="8" fill="none" stroke="#fff" strokeWidth="3"/><circle cx="24" cy="24" r="7" fill="none" stroke="#fff" strokeWidth="3"/><circle cx="33" cy="15" r="2" fill="#fff"/></svg>;
};

const Card=({x,y,i,frame}:{x:number;y:number;i:number;frame:number})=>{
  const enter=mix(frame,58+i*2,83+i*2,55,0), op=mix(frame,58+i*2,72+i*2,0,1);
  const titles=['行程','旅行主题','定制','行程','定制','旅行地图','景点','行程','旅行地图'];
  const title=titles[i];
  return <g transform={`translate(${x+enter} ${y})`} opacity={op}>
    <rect x="0" y="0" width="110" height="145" rx="7" fill="#fff" stroke="#dbe3ef" strokeWidth="1.2"/>
    <path d="M0 7Q0 0 7 0h96q7 0 7 7v17H0Z" fill="#172638"/>
    {txt(9,17,title,13,'#fff',700)}
    {i%3===0?<><rect x="10" y="33" width="90" height="30" rx="4" fill="#f3f7fc"/><rect x="16" y="40" width="35" height="4" rx="2" fill="#2787ed"/><rect x="16" y="49" width="65" height="3" rx="1.5" fill="#c1cedc"/><circle cx="86" cy="47" r="8" fill="#e4f0ff"/><path d="M83 47h6m-3-3v6" stroke="#2787ed" strokeWidth="1.5"/> <rect x="10" y="72" width="90" height="4" rx="2" fill="#dce5ef"/>{[0,1,2].map(k=><g key={k}><circle cx="16" cy={88+k*13} r="3" fill={k===0?'#2489ef':'#a9b8c9'}/><rect x="24" y={86+k*13} width={52-k*8} height="4" rx="2" fill="#aebdce"/></g>)}</>:i%3===1?<><rect x="9" y="32" width="92" height="74" rx="4" fill="#eef5fb"/><path d="M14 94 35 72l15 9 22-28 23 18" fill="none" stroke="#6ca8ef" strokeWidth="2"/><path d="M14 99h82M17 39h25" stroke="#c6d3e2" strokeWidth="2"/><circle cx="72" cy="55" r="4" fill="#1688f6"/><circle cx="34" cy="72" r="3" fill="#7459e8"/><rect x="10" y="116" width="60" height="4" rx="2" fill="#c2ccd8"/><rect x="10" y="126" width="80" height="4" rx="2" fill="#d9e0e8"/></>:<><rect x="9" y="33" width="92" height="48" rx="4" fill="#f3f7fb"/><path d="M20 69 43 44l18 18 16-13 17 20Z" fill="#d4e9ff"/><path d="M20 69 43 44l18 18 16-13 17 20" fill="none" stroke="#6c9fe2" strokeWidth="1.5"/><path d="M50 53c0-6 10-6 10 0 0 4-5 9-5 9s-5-5-5-9Z" fill="#1688f6"/><circle cx="55" cy="53" r="1.7" fill="#fff"/><rect x="10" y="91" width="45" height="4" rx="2" fill="#a8b7c8"/><rect x="10" y="101" width="75" height="4" rx="2" fill="#d0dae5"/><rect x="10" y="116" width="18" height="18" rx="4" fill="#e8f2ff"/><circle cx="19" cy="125" r="4" fill="#478fea"/><rect x="34" y="119" width="57" height="4" rx="2" fill="#b6c3d1"/><rect x="34" y="128" width="43" height="4" rx="2" fill="#d7dfe8"/></>}
  </g>;
};

export const AeTargetScene:React.FC=()=>{
 const f=useCurrentFrame();
 const social=[['Google',114,257],['TikTok',253,257],['YouTube',114,369],['Meta',253,369],['WhatsApp',114,480],['Instagram',253,480]] as const;
 const aiX=mix(f,54,76,660,437), aiScale=mix(f,54,76,1.65,1.4);
 const cardReveal=mix(f,58,78,0,1);
 const labelP=mix(f,54,76,0,1);
 const lx=385-196*labelP, rx=845-256*labelP;
 const topY=209+22*labelP, rightTopY=220+18*labelP, bottomY=456+8*labelP, rightBottomY=470-13*labelP;
 const labelW=99-14*labelP, labelH=52-7*labelP;
 const aiLeft=537-203*labelP, aiRight=791-249*labelP;
 return <AbsoluteFill style={{background:'linear-gradient(116deg,#eaf5ff 0%,#e4f2fd 48%,#eef2ff 100%)',overflow:'hidden'}}>
  <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{position:'absolute',inset:0}}>
   <defs><radialGradient id="halo"><stop stopColor="#80cfff" stopOpacity=".65"/><stop offset="1" stopColor="#80cfff" stopOpacity="0"/></radialGradient><linearGradient id="face" x1="0" y1="0" x2="1" y2="1"><stop stopColor="#4fc7ff"/><stop offset=".55" stopColor="#3b83ee"/><stop offset="1" stopColor="#6549e5"/></linearGradient><filter id="shadow" x="-30%" y="-30%" width="160%" height="170%"><feDropShadow dx="0" dy="10" stdDeviation="9" floodColor="#546ca0" floodOpacity=".22"/></filter></defs>
   {/* Persistent dotted links and crisp labels */}
   <g fill="none" stroke="#536894" strokeWidth="2.2" strokeDasharray="2 7" strokeLinecap="round" opacity=".9">
    <path d={`M${lx+labelW} ${topY+labelH/2} C${lx+labelW+35} ${topY+labelH/2} ${aiLeft-28} 305 ${aiLeft} 309`}/>
    <path d={`M${lx+labelW} ${bottomY+labelH/2} C${lx+labelW+35} ${bottomY+labelH/2} ${aiLeft-28} 428 ${aiLeft} 425`}/>
    <path d={`M${aiRight} 309 C${aiRight+23} 305 ${rx-28} ${rightTopY+labelH/2} ${rx} ${rightTopY+labelH/2}`}/>
    <path d={`M${aiRight} 425 C${aiRight+23} 428 ${rx-28} ${rightBottomY+labelH/2} ${rx} ${rightBottomY+labelH/2}`}/>
   </g>
   {[["需求",lx,topY],["路线",rx,rightTopY],["情绪",lx,bottomY],["人数",rx,rightBottomY]].map(([s,x,y])=><g key={String(s)}><rect x={Number(x)} y={Number(y)} width={labelW} height={labelH} rx="10" fill="#202a3d"/>{txt(Number(x)+labelW/2,Number(y)+labelH*.69,String(s),25-3*labelP,'#fff',700,'middle')}</g>)}
   <ellipse cx={aiX} cy="370" rx="215" ry="195" fill="url(#halo)" opacity={mix(f,0,10,.55,.8)}/>
   {/* Platform marks converge in original two-column topology. */}
   {social.map(([name,x,y],i)=>{const start=i*3, end=48+i*2, p=mix(f,start,end,0,1); const tx=Number(x)+mix(f,start,end,0,630-Number(x)); const ty=Number(y)+mix(f,start,end,0,365-Number(y)); const scale=1.85-1.25*p; return <g key={name} opacity={mix(f,end-3,end+3,1,0)} transform={`translate(${tx} ${ty}) scale(${scale}) translate(-24 -24)`}><SocialMark type={name}/></g>})}
   <g transform={`translate(${aiX} 370) scale(${aiScale}) translate(-382 -338)`} filter="url(#shadow)">
    {/* Smooth rounded vector slabs replace the former blurry, irregular AI raster. */}
    <path d="M365 246 Q365 236 376 240 L453 266 Q463 270 463 282 L463 399 Q463 408 453 405 L376 379 Q365 376 365 367Z" fill="#7656e9" stroke="#b8b0ff" strokeWidth="2"/>
    <path d="M346 252 Q346 242 357 246 L434 272 Q445 276 445 288 L445 405 Q445 414 435 411 L357 385 Q346 382 346 373Z" fill="#6b5bea" stroke="#c5bdff" strokeWidth="2"/>
    <path d="M327 260 Q327 250 338 254 L415 280 Q426 284 426 296 L426 413 Q426 422 416 419 L338 393 Q327 390 327 381Z" fill="#5e66ed" stroke="#ced4ff" strokeWidth="2"/>
    <path d="M307 278 Q307 265 320 269 L395 294 Q407 298 407 310 L407 413 Q407 426 395 422 L320 398 Q307 394 307 382Z" fill="url(#face)" stroke="#d0e9ff" strokeWidth="2.5"/>
    {txt(365,354,'AI',47,'#fff',700,'middle')}
   </g>
   {/* Nine editable itinerary output cards, revealed after the AI intake settles. */}
   <g opacity={cardReveal}>
    {[0,1,2,3,4,5,6,7,8].map(i=><Card key={i} i={i} frame={f} x={i%3*120+740} y={Math.floor(i/3)*158+130}/>)}
   </g>
  </svg>
 </AbsoluteFill>;
};
