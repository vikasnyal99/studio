import React from 'react';
import {AbsoluteFill, Audio, Img, OffthreadVideo, Sequence, Easing, interpolate, random, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';

const root='jobs/2026-11-01-bjp-washing-machine/';
const cream='#eee7d8', gold='#d9ad65', red='#b8463a', ink='#080c12';
const clamp={extrapolateLeft:'clamp' as const,extrapolateRight:'clamp' as const};

const Dust:React.FC<{count?:number}> = ({count=48})=>{
  const f=useCurrentFrame(); const {width:w,height:h}=useVideoConfig();
  return <AbsoluteFill style={{pointerEvents:'none',mixBlendMode:'screen'}}>{Array.from({length:count},(_,i)=>{
    const x=random(`x${i}`)*w+Math.sin(f/53+i)*16, y=(random(`y${i}`)*h-f*(.22+random(`s${i}`)*.42)+h*2)%h, size=1+random(`r${i}`)*3;
    return <i key={i} style={{position:'absolute',left:x,top:y,width:size,height:size,borderRadius:'50%',background:'#e7c98d',opacity:.12+random(`o${i}`)*.34,boxShadow:'0 0 9px #e7c98d'}}/>;
  })}</AbsoluteFill>;
};

const Topline:React.FC<{text:string;source?:string}> = ({text,source})=><>
  <div style={{position:'absolute',left:95,top:66,font:'700 21px Arial',letterSpacing:7,color:gold}}>{text}</div>
  {source&&<div style={{position:'absolute',right:82,bottom:48,font:'500 17px Arial',letterSpacing:1.5,color:'#d7d0c2',opacity:.85}}>{source}</div>}
</>;

const Headline:React.FC<{title:string;sub?:string;frame:number;size?:number}> = ({title,sub,frame,size=82})=>{
  const p=interpolate(frame,[0,14],[0,1],{...clamp,easing:Easing.out(Easing.cubic)});
  return <div style={{position:'absolute',left:102,bottom:122,maxWidth:1460,transform:`translate3d(${(1-p)*-110}px,0,0)`,opacity:p,color:cream,fontFamily:'Arial',fontWeight:800,fontSize:size,lineHeight:1.02,letterSpacing:-1.5,textShadow:'0 8px 35px #000'}}>{title}{sub&&<div style={{marginTop:20,fontSize:30,fontWeight:500,letterSpacing:1,color:'#dbd3c4'}}>{sub}</div>}</div>;
};

const Files:React.FC<{frame:number}> = ({frame})=> <>
  {[0,1,2].map((i)=>{
    const x=interpolate(frame,[0,30],[2050+i*180,1040+i*220],clamp);
    const y=210+i*92+Math.sin(frame/19+i)*10;
    const a=interpolate(frame,[0,10,20],[0,1,.72],clamp);
    return <div key={i} style={{position:'absolute',left:x,top:y,width:420,height:250,background:`linear-gradient(135deg,rgba(221,205,171,${a*.16}),rgba(93,77,57,${a*.28}))`,border:'1px solid rgba(231,201,145,.38)',boxShadow:'0 25px 70px #0008',transform:`rotate(${(i-1)*5}deg)`,opacity:a}}><div style={{margin:26,width:160,height:7,background:gold,opacity:.8}}/><div style={{margin:'13px 26px',width:310,height:5,background:'#c3b79f66'}}/><div style={{margin:'13px 26px',width:255,height:5,background:'#c3b79f55'}}/><div style={{position:'absolute',right:22,bottom:20,font:'600 14px Arial',letterSpacing:3,color:'#d2c3a5'}}>CASE FILE / {String(i+1).padStart(2,'0')}</div></div>;
  })}
</>;

const Opening:React.FC = ()=>{
  const f=useCurrentFrame(); const sweep=interpolate(f,[0,112],[0,100],clamp);
  return <AbsoluteFill style={{background:'radial-gradient(ellipse at 72% 40%,#253040 0%,#101822 44%,#06080d 100%)'}}>
    <div style={{position:'absolute',inset:0,background:'linear-gradient(115deg,transparent 38%,rgba(213,172,100,.1) 47%,transparent 55%)',transform:`translateX(${(f%110)-55}px)`}}/>
    <Files frame={f}/>
    <div style={{position:'absolute',left:105,top:245,font:'700 22px Arial',letterSpacing:8,color:gold,opacity:interpolate(f,[0,18],[0,1],clamp)}}>A POLITICAL EXPLAINER</div>
    <Headline title="JAB ILZAAM LAGTA HAI…" sub="aur phir political alignment badal jaata hai" frame={f} size={75}/>
    <div style={{position:'absolute',inset:0,background:`linear-gradient(90deg,transparent ${sweep-9}%,rgba(222,186,123,.06) ${sweep}%,transparent ${sweep+9}%)`}}/>
    <Topline text="CASE FILES · QUESTIONS OF ACCOUNTABILITY"/>
    <Dust/>
  </AbsoluteFill>;
};

const Cbi:React.FC=()=>{
  const f=useCurrentFrame(); const z=interpolate(f,[0,124],[1.05,1.17],clamp); const scan=(f*3)%1250;
  return <AbsoluteFill style={{background:'#080b10'}}>
    <div style={{position:'absolute',inset:'0 0 0 43%',overflow:'hidden',clipPath:'polygon(10% 0,100% 0,100% 100%,0 100%)'}}><Img src={staticFile(root+'cbi.jpg')} style={{width:'100%',height:'100%',objectFit:'cover',transform:`scale(${z})`,filter:'brightness(.7) saturate(.68)'}}/><div style={{position:'absolute',inset:0,background:'linear-gradient(90deg,#080b10 0%,transparent 38%),linear-gradient(0deg,#080b10aa,transparent 40%)'}}/></div>
    <div style={{position:'absolute',left:90,top:190,width:700,height:570,transform:`translateY(${interpolate(f,[0,20],[75,0],clamp)}px) rotate(-2deg)`,opacity:interpolate(f,[0,18],[0,1],clamp),background:'linear-gradient(135deg,#1b222b,#10151d)',border:'1px solid #75664d',boxShadow:'0 40px 110px #000'}}>
      <div style={{position:'absolute',inset:20,border:'1px solid #b39b6c55'}}/><div style={{position:'absolute',left:54,top:54,font:'700 18px Arial',letterSpacing:6,color:gold}}>AGENCY ACTION</div>
      <div style={{position:'absolute',left:54,top:147,font:'800 66px Arial',lineHeight:1,color:cream}}>ED / CBI</div>
      <div style={{position:'absolute',left:56,top:245,font:'500 30px Arial',color:'#d9d1c2'}}>raids · questioning · investigation</div>
      <div style={{position:'absolute',left:56,top:380,font:'500 18px Arial',letterSpacing:2,color:'#a9a194'}}>ILLUSTRATIVE LOCATION PHOTO</div>
    </div>
    <div style={{position:'absolute',left:`${Math.max(45,scan)}px`,top:0,width:2,height:'100%',background:'linear-gradient(transparent,#d6ad70aa,transparent)',boxShadow:'0 0 20px #d6ad70'}}/>
    <Topline text="THE INVESTIGATION" source="CBI headquarters · Pulakit Singh · CC BY-SA 4.0"/><Dust count={30}/>
  </AbsoluteFill>;
};

const Press:React.FC=()=>{
  const f=useCurrentFrame(); const p=interpolate(f,[0,18],[0,1],{...clamp,easing:Easing.out(Easing.back(1.08))});
  const scroll=interpolate(f,[0,150],[0,105],clamp);
  return <AbsoluteFill style={{background:'radial-gradient(ellipse at 50% 50%,#34302a,#0b0d12 70%)'}}>
    <div style={{position:'absolute',left:108,top:177,width:1050,height:590,background:'#e9e4d9',boxShadow:'0 45px 110px #000',transform:`perspective(1500px) rotateY(${interpolate(f,[0,40],[-12,0],clamp)}deg) translateX(${(1-p)*-240}px) scale(${.9+p*.1})`,opacity:p,overflow:'hidden'}}>
      <Img src={staticFile(root+'article.png')} style={{width:'100%',height:'100%',objectFit:'contain',transform:`scale(${1.08+scroll/900}) translateY(-${scroll}px)`}}/>
      <div style={{position:'absolute',left:0,right:0,top:interpolate(f,[35,82],[90,355],clamp),height:62,background:'linear-gradient(90deg,transparent,#d8ad5b55,transparent)',mixBlendMode:'multiply'}}/>
      <div style={{position:'absolute',inset:0,border:'1px solid #e7c78188',pointerEvents:'none'}}/>
    </div>
    <div style={{position:'absolute',right:110,top:270,width:520,opacity:interpolate(f,[30,50],[0,1],clamp),transform:`translateX(${interpolate(f,[30,50],[80,0],clamp)}px)`}}>
      <div style={{font:'700 20px Arial',letterSpacing:6,color:gold}}>EXPRESS INVESTIGATION · 2024</div>
      <div style={{font:'800 62px Arial',lineHeight:1.02,color:cream,marginTop:22}}>25 crossed over.<br/>23 got reprieve.</div>
      <div style={{font:'500 24px Arial',lineHeight:1.4,color:'#c9c2b5',marginTop:25}}>Reported pattern across BJP and NDA cases. The reporting does not by itself prove why any case changed.</div>
      <div style={{marginTop:32,padding:'13px 17px',borderLeft:`3px solid ${gold}`,background:'#d7c49718',font:'600 17px Arial',color:'#e4dccb'}}>THE INDIAN EXPRESS · 04 APR 2024</div>
    </div>
    <Topline text="WHAT THE RECORD SHOWS"/>
    <Dust count={20}/>
  </AbsoluteFill>;
};

const PartySwitch:React.FC=()=>{
  const f=useCurrentFrame(); const x=interpolate(f,[0,82],[270,1570],{...clamp,easing:Easing.inOut(Easing.cubic)});
  const r=interpolate(f,[0,82],[-10,5],clamp); const glow=interpolate(f,[58,82,110],[0,1,.18],clamp);
  return <AbsoluteFill style={{background:'radial-gradient(ellipse at 50% 40%,#263039,#080b10 74%)'}}>
    <div style={{position:'absolute',left:115,top:320,right:115,height:5,background:'linear-gradient(90deg,#756853,#d8b46c,#756853)',boxShadow:'0 0 30px #dbb66f66'}}/>
    {[0,1,2,3,4].map(i=><div key={i} style={{position:'absolute',left:270+i*325,top:297,width:46,height:46,borderRadius:'50%',background:'#d2c2a0',border:'4px solid #2d3034',boxShadow:'0 0 0 8px #e0cb9a22'}}/>)}
    <div style={{position:'absolute',left:x,top:222,width:235,height:195,border:'1px solid #d9b775',background:'linear-gradient(135deg,#27272a,#101216)',boxShadow:`0 0 ${28+glow*55}px #d0a552${glow>.5?'bb':'66'}`,transform:`rotate(${r}deg)`,display:'flex',alignItems:'center',justifyContent:'center',color:cream,font:'800 27px Arial',letterSpacing:3,textAlign:'center'}}><span>PARTY<br/>SWITCH</span></div>
    <div style={{position:'absolute',left:180,top:435,font:'600 22px Arial',letterSpacing:5,color:'#c6b99d'}}>ALLEGATION</div>
    <div style={{position:'absolute',right:175,top:435,font:'600 22px Arial',letterSpacing:5,color:'#c6b99d'}}>NEW ALIGNMENT</div>
    <div style={{position:'absolute',left:0,right:0,bottom:145,textAlign:'center',font:'700 49px Arial',color:cream,opacity:interpolate(f,[12,28],[0,1],clamp)}}>Timeline badli. Sawaal baaki rahe.</div>
    <Topline text="PARTY SWITCH · THE TIMELINE"/>
    <Dust count={32}/>
  </AbsoluteFill>;
};

const Metaphor:React.FC=()=>{
  const f=useCurrentFrame(); const z=interpolate(f,[0,110],[1.03,1.18],clamp); const rotate=interpolate(f,[0,110],[-.5,.5],clamp);
  return <AbsoluteFill style={{background:'#080b10'}}>
    <Img src={staticFile(root+'metaphor.png')} style={{position:'absolute',inset:0,width:'100%',height:'100%',objectFit:'cover',transform:`scale(${z}) rotate(${rotate}deg)`,filter:'brightness(.58) saturate(.75)'}}/>
    <AbsoluteFill style={{background:'linear-gradient(90deg,#070a0ee8 0%,#070a0e77 55%,#070a0e22 100%),linear-gradient(0deg,#070a0e99,transparent 55%)'}}/>
    {Array.from({length:8},(_,i)=>{const y=interpolate(f,[0,115],[1040+i*70,-170],clamp),x=90+i*252+(f%65)*1.5;return <div key={i} style={{position:'absolute',left:x,top:y,width:192,height:118,background:'linear-gradient(140deg,#cbbd9c,#6d624e)',border:'2px solid #e1d1ad88',boxShadow:'0 18px 35px #0009',transform:`rotate(${(i%2?1:-1)*7}deg)`,opacity:.45}}><div style={{margin:'27px 19px',height:4,width:98,background:'#352e25aa'}}/><div style={{margin:'-13px 19px',height:4,width:147,background:'#352e2566'}}/></div>})}
    <div style={{position:'absolute',left:100,bottom:145,font:'800 67px Arial',letterSpacing:1,color:cream,opacity:interpolate(f,[0,20],[0,1],clamp),transform:`translateY(${interpolate(f,[0,20],[28,0],clamp)}px)`,textShadow:'0 5px 30px #000'}}>“WASHING MACHINE”</div>
    <div style={{position:'absolute',left:104,bottom:96,font:'500 24px Arial',letterSpacing:3,color:gold}}>EK SIYASI METAPHOR</div>
    <div style={{position:'absolute',right:85,top:64,font:'600 16px Arial',letterSpacing:3,color:'#e0d4be'}}>CONCEPTUAL ART · NOT A REAL CASE SCENE</div>
    <Dust count={55}/>
  </AbsoluteFill>;
};

const Machine:React.FC=()=>{
  const f=useCurrentFrame(); const p=interpolate(f,[0,16],[0,1],{...clamp,easing:Easing.out(Easing.cubic)}); const scale=interpolate(f,[0,110],[.93,1.08],clamp);
  return <AbsoluteFill style={{background:'radial-gradient(ellipse at 73% 50%,#1d2b35,#080a0e 70%)'}}>
    <div style={{position:'absolute',right:150,top:85,width:540,height:850,border:'2px solid #c9b178',background:'#111820',boxShadow:'0 25px 100px #000',transform:`translateX(${(1-p)*300}px) scale(${scale})`,overflow:'hidden',opacity:p}}>
      <OffthreadVideo src={staticFile(root+'machine.webm')} muted style={{width:'100%',height:'100%',objectFit:'cover',filter:'saturate(.62) brightness(.84)'}}/>
      <div style={{position:'absolute',inset:0,border:'16px solid #111820',boxShadow:'inset 0 0 40px #000'}}/>
      <div style={{position:'absolute',left:0,right:0,bottom:0,padding:'15px 16px',background:'#07090dcc',font:'600 15px Arial',letterSpacing:1,color:'#d8cfbd'}}>METAPHOR FOOTAGE · CC BY 3.0</div>
    </div>
    <div style={{position:'absolute',left:110,top:255,width:990}}>
      <div style={{font:'700 21px Arial',letterSpacing:6,color:gold}}>THE PUBLIC DEBATE</div>
      <div style={{font:'800 78px Arial',lineHeight:1.03,color:cream,marginTop:30}}>Jaanch dheemi?<br/>Case close?</div>
      <div style={{font:'500 27px Arial',lineHeight:1.45,color:'#c6c2b9',marginTop:33,maxWidth:850}}>Har case ki timeline alag hai. Court ka faisla, investigation ka status, aur political sawaal — inhe alag rakhna zaroori hai.</div>
    </div>
    <Topline text="THE METAPHOR" source="Washing machine footage · Sounds of Changes · CC BY 3.0"/><Dust count={22}/>
  </AbsoluteFill>;
};

export const WashingOne:React.FC=()=>{
  const f=useCurrentFrame();
  return <AbsoluteFill style={{background:ink,color:cream,fontFamily:'Arial'}}>
    <Sequence from={0} durationInFrames={114}><Opening/></Sequence>
    <Sequence from={114} durationInFrames={141}><Cbi/></Sequence>
    <Sequence from={255} durationInFrames={141}><Press/></Sequence>
    <Sequence from={396} durationInFrames={132}><PartySwitch/></Sequence>
    <Sequence from={528} durationInFrames={255}><Machine/></Sequence>
    <Sequence from={783} durationInFrames={177}><Metaphor/></Sequence>
    <Audio src={staticFile(root+'voice.wav')}/><Audio src={staticFile('lib/music/Interloper.mp3')} volume={0.045}/>
  </AbsoluteFill>;
};
