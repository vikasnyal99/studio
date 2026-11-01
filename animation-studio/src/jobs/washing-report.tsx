import React from 'react';
import {AbsoluteFill, Audio, Img, Sequence, Easing, interpolate, random, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';

const root='jobs/2026-11-01-bjp-washing-machine/';
const ivory='#f2ecdf', gold='#d4ad68', red='#ad4a3d', amber='#b3945a', ink='#080a0e', clamp={extrapolateLeft:'clamp' as const,extrapolateRight:'clamp' as const};
const ease={...clamp,easing:Easing.out(Easing.cubic)};

const Texture:React.FC<{seed:string}> = ({seed})=>{
 const f=useCurrentFrame(); const {width,height}=useVideoConfig();
 return <AbsoluteFill style={{pointerEvents:'none',opacity:.38}}>{Array.from({length:42},(_,i)=>{const x=random(seed+'x'+i)*width,y=(random(seed+'y'+i)*height+f*(.12+random(seed+'s'+i)*.3))%height;return <i key={i} style={{position:'absolute',left:x,top:y,width:1+random(seed+'r'+i)*2,height:1+random(seed+'r'+i)*2,borderRadius:'50%',background:'#dbcba9',opacity:.08+random(seed+'o'+i)*.25}}/>})}</AbsoluteFill>
};

const SectionLabel:React.FC<{children:string}> = ({children})=><div style={{font:'700 19px Arial',letterSpacing:6,color:gold,textTransform:'uppercase'}}>{children}</div>;
const RulelessCard:React.FC<{children:React.ReactNode;style?:React.CSSProperties}> = ({children,style})=><div style={{background:'linear-gradient(145deg,#20252b,#111419)',border:'1px solid #c8b27e55',boxShadow:'0 28px 75px #0009',...style}}>{children}</div>;

const Intro:React.FC=()=>{
 const f=useCurrentFrame(); const p=interpolate(f,[0,20],[0,1],ease);
 const years=Array.from({length:11},(_,i)=>2014+i);
 return <AbsoluteFill style={{background:'radial-gradient(ellipse at 75% 30%,#25303b,#10141b 45%,#080a0e 82%)'}}>
   <Img src={staticFile(root+'metaphor.png')} style={{position:'absolute',inset:0,width:'100%',height:'100%',objectFit:'cover',transform:`scale(${1.04+f/900})`,filter:'brightness(.34) saturate(.58)'}}/>
   <AbsoluteFill style={{background:'linear-gradient(90deg,rgba(5,8,12,.94),rgba(5,8,12,.78) 46%,rgba(5,8,12,.36)),linear-gradient(0deg,rgba(5,8,12,.56),transparent 70%)'}}/>
   <div style={{position:'absolute',left:130,top:300,transform:`translateX(${(1-p)*-100}px)`,opacity:p}}><SectionLabel>THE INDIAN EXPRESS · APRIL 2024</SectionLabel><div style={{font:'400 82px Georgia',lineHeight:1.02,color:ivory,marginTop:29}}>An investigation<br/>into the timeline</div><div style={{font:'500 24px Arial',color:'#c4c0b8',marginTop:29,maxWidth:650}}>The report examined cases involving politicians who crossed over after 2014.</div></div>
   <div style={{position:'absolute',right:135,top:240,width:790,height:600,padding:44,boxSizing:'border-box',transform:`perspective(1200px) rotateY(${interpolate(f,[0,45],[-11,0],clamp)}deg) translateY(${(1-p)*130}px)`,opacity:p,background:'linear-gradient(145deg,#20252b,#111419)',border:'1px solid #c8b27e66',boxShadow:'0 40px 100px #000'}}>
    <div style={{font:'700 17px Arial',letterSpacing:5,color:gold}}>PERIOD UNDER REVIEW</div>
    <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:17,marginTop:44}}>{years.map((y,i)=>{const q=interpolate(f,[15+i*4,28+i*4],[0,1],ease);return <div key={y} style={{height:100,display:'flex',alignItems:'center',justifyContent:'center',font:'700 23px Arial',letterSpacing:1,color:i===10?ivory:'#bdb5a4',background:i===10?'#8f6e3b':'#34363a',border:'1px solid #c8b27e66',opacity:q,transform:`translateY(${(1-q)*35}px) scale(${i===10?1.04:1})`,boxShadow:i===10?'0 0 30px #d3a95d55':'none'}}>{y}</div>})}</div>
    <div style={{position:'absolute',right:48,bottom:39,font:'500 14px Arial',letterSpacing:3,color:'#a99d86'}}>2014 — 2024</div>
   </div>
   <Texture seed="intro"/>
 </AbsoluteFill>;
};
const Evidence:React.FC=()=>{
 const f=useCurrentFrame(); const enter=interpolate(f,[0,22],[0,1],ease); const tilt=interpolate(f,[0,45],[-7,0],clamp); const zoom=interpolate(f,[0,570],[1.02,1.1],clamp);
 const p25=interpolate(f,[92,142],[0,25],{...clamp,easing:Easing.out(Easing.quad)}); const p23=interpolate(f,[420,470],[0,23],{...clamp,easing:Easing.out(Easing.quad)});
 const show23=interpolate(f,[420,438],[0,1],clamp);
 return <AbsoluteFill style={{background:'radial-gradient(ellipse at 55% 50%,#282a2a,#0b0d11 70%)'}}>
   <div style={{position:'absolute',left:95,top:116,width:1080,height:500,transform:`perspective(1700px) rotateY(${tilt}deg) translateX(${(1-enter)*-210}px) scale(${.92+enter*.08})`,opacity:enter,overflow:'hidden',background:'#e9e4d9',boxShadow:'0 40px 110px #000'}}>
     <Img src={staticFile(root+'report-article.png')} style={{width:'100%',height:'100%',objectFit:'contain',transform:`scale(${zoom})`}}/>
     <div style={{position:'absolute',left:0,right:0,top:0,bottom:0,border:'1px solid #dec48988'}}/>
     <div style={{position:'absolute',left:0,right:0,top:interpolate(f,[0,110],[420,270],clamp),height:68,background:'linear-gradient(90deg,transparent,#efca6555,transparent)',mixBlendMode:'multiply'}}/>
   </div>
   <div style={{position:'absolute',right:115,top:166,width:520,opacity:enter,transform:`translateY(${(1-enter)*65}px)`}}>
     <SectionLabel>EXPRESS INVESTIGATION</SectionLabel>
     <div style={{position:'relative',height:260,marginTop:35,perspective:700}}>
       <div style={{position:'absolute',left:0,top:0,font:'700 215px Georgia',lineHeight:1,color:ivory,transform:`rotateY(${show23?interpolate(f,[238,252],[0,88],clamp):0}deg)`,backfaceVisibility:'hidden'}}>{Math.round(p25)}</div>
       <div style={{position:'absolute',left:0,top:0,font:'700 215px Georgia',lineHeight:1,color:ivory,opacity:show23,transform:`rotateY(${interpolate(f,[238,252],[-90,0],clamp)}deg)`}}>{Math.round(p23)}</div>
       <div style={{position:'absolute',left:8,bottom:3,font:'700 25px Arial',letterSpacing:3,color:'#c4b28b',opacity:interpolate(f,[103,122],[0,1],clamp)}}>{show23>.5?'GOT SOME FORM OF RELIEF':'CROSSED OVER · BJP / NDA'}</div>
     </div>
     <div style={{font:'500 18px Arial',lineHeight:1.5,color:'#bdb8ad',marginTop:12}}>25 opposition leaders with corruption probes, identified by the report since 2014.</div>
   </div>
   <div style={{position:'absolute',left:98,bottom:54,font:'600 15px Arial',letterSpacing:2,color:'#bab1a0'}}>SOURCE · THE INDIAN EXPRESS · 04 APR 2024</div>
   <Texture seed="evidence"/>
 </AbsoluteFill>;
};

const CaseGrid:React.FC=()=>{
 const f=useCurrentFrame(); const fill=interpolate(f,[0,65],[0,25],ease); const counts=[3,20,2]; const colors=[red,amber,'#8d9298']; const labels=['CLOSED','STALLED','NO CLEAR LET-UP']; let seen=0;
 return <AbsoluteFill style={{background:'radial-gradient(ellipse at 20% 50%,#26303a,#0a0d12 68%)'}}>
   <div style={{position:'absolute',left:104,top:95}}><SectionLabel>WHAT HAPPENED NEXT?</SectionLabel><div style={{font:'400 59px Georgia',color:ivory,marginTop:19}}>25 cases · three outcomes</div></div>
   <div style={{position:'absolute',left:110,top:300,width:760,height:450,display:'grid',gridTemplateColumns:'repeat(5,1fr)',gridTemplateRows:'repeat(5,1fr)',gap:16}}>
    {Array.from({length:25},(_,i)=>{const group=i<3?0:i<23?1:2; const rank=i<3?i:i<23?i-3:i-23; const on=fill>i; const scale=on?interpolate(f,[i*2,i*2+12],[.6,1],{...clamp,easing:Easing.out(Easing.back(1.4))}):.35; seen++;return <div key={i} style={{borderRadius:7,background:on?`${colors[group]}${group===2?'99':'ee'}`:'#20252b',border:`1px solid ${on?colors[group]:'#45494e'}`,transform:`scale(${scale})`,boxShadow:on?`0 0 21px ${colors[group]}66`:'none',transition:'none'}}/>})}
   </div>
   <div style={{position:'absolute',right:108,top:270,width:860,display:'grid',gridTemplateColumns:'1fr 1fr',gap:28}}>
    {counts.map((n,i)=>{const local=interpolate(f,[i*27+10,i*27+55],[0,n],{...clamp,easing:Easing.out(Easing.quad)});const delay=i*28;const p=interpolate(f,[delay,delay+16],[0,1],ease);return <RulelessCard key={labels[i]} style={{gridColumn:i===2?'1 / span 2':undefined,minHeight:i===2?145:215,padding:'24px 30px',display:'flex',alignItems:'center',gap:28,opacity:p,transform:`translateY(${(1-p)*60}px)`}}><div style={{font:'700 104px Georgia',lineHeight:1,color:colors[i],minWidth:130}}>{Math.round(local)}</div><div><div style={{font:'700 21px Arial',letterSpacing:4,color:ivory}}>{labels[i]}</div><div style={{font:'500 16px Arial',color:'#b8b2a6',marginTop:11}}>{i===0?'Cases closed':i===1?'Investigations reported stalled':'No clear evidence of let-up'}</div></div></RulelessCard>})}
   </div>
   <div style={{position:'absolute',left:112,bottom:62,font:'500 16px Arial',color:'#aaa49a'}}>Based on the report’s case review; these outcomes do not establish why any individual case changed.</div>
   <Texture seed="cases"/>
 </AbsoluteFill>;
};

const Parties:React.FC=()=>{
 const f=useCurrentFrame(); const parties=['CONGRESS','NCP','SHIV SENA','TMC','TDP','SP','YSRCP']; const cols=4;
 return <AbsoluteFill style={{background:'radial-gradient(ellipse at 50% 50%,#252b30,#080a0e 74%)'}}>
  <div style={{position:'absolute',left:125,top:145}}><SectionLabel>LEADERS CAME FROM DIFFERENT PARTIES</SectionLabel><div style={{font:'400 54px Georgia',color:ivory,marginTop:20}}>A cross-party pattern in the report</div></div>
  {parties.map((name,i)=>{const delay=18+i*14;const p=interpolate(f,[delay,delay+20],[0,1],ease);const x=250+(i%cols)*410;const y=370+Math.floor(i/cols)*215;const selected=(Math.floor(f/34)%parties.length)===i;return <div key={name} style={{position:'absolute',left:x,top:y,width:355,height:132,display:'flex',alignItems:'center',justifyContent:'center',background:selected?'linear-gradient(135deg,#39352c,#181a1e)':'#171a1e',border:'1px solid #c6ae7666',boxShadow:selected?'0 18px 48px #0009':'none',color:selected?ivory:'#bdb5a3',font:'700 24px Arial',letterSpacing:3,opacity:p,transform:`translateY(${(1-p)*80}px) scale(${selected?1.05:1})`,transition:'none'}}>{name}</div>})}
  <Texture seed="parties"/>
 </AbsoluteFill>;
};

const Question:React.FC=()=>{
 const f=useCurrentFrame(); const p=interpolate(f,[0,17],[0,1],ease); const glow=interpolate(f,[25,75],[.18,.62],clamp);
 return <AbsoluteFill style={{background:`radial-gradient(ellipse at 50% 50%,rgba(151,114,55,${glow}),#080a0e 72%)`,justifyContent:'center',alignItems:'center'}}>
  <SectionLabel>THE NEXT QUESTION</SectionLabel>
  <div style={{font:'400 84px Georgia',color:ivory,textAlign:'center',lineHeight:1.12,marginTop:28,opacity:p,transform:`translateY(${(1-p)*45}px)`}}>Ab in cases mein<br/>hua kya?</div>
  <div style={{position:'absolute',bottom:68,font:'500 15px Arial',letterSpacing:2,color:'#a49b8a'}}>THE INDIAN EXPRESS · APRIL 2024</div>
  <Texture seed="question"/>
 </AbsoluteFill>;
};

export const WashingReport:React.FC=()=>{
 const duration=1344;
 return <AbsoluteFill style={{background:ink,color:ivory,fontFamily:'Arial'}}>
   <Sequence from={0} durationInFrames={132}><Intro/></Sequence>
   <Sequence from={132} durationInFrames={567}><Evidence/></Sequence>
   <Sequence from={699} durationInFrames={303}><CaseGrid/></Sequence>
   <Sequence from={1002} durationInFrames={249}><Parties/></Sequence>
   <Sequence from={1251} durationInFrames={93}><Question/></Sequence>
   <Audio src={staticFile(root+'report-voice.wav')}/><Audio src={staticFile('lib/music/Interloper.mp3')} volume={0.04}/>
 </AbsoluteFill>;
};
