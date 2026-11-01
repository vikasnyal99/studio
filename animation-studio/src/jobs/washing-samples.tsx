import React from 'react';
import {AbsoluteFill, Audio, Img, OffthreadVideo, Sequence, interpolate, staticFile, useCurrentFrame} from 'remotion';

const base = 'jobs/2026-11-01-bjp-washing-machine/';
const navy = '#07101b';
const cream = '#f2ecdc';
const red = '#e0504e';
const cyan = '#61c6d2';
const beat = [0, 4, 8, 13, 18, 24, 28, 32];
const words = [
  ['CORRUPTION', 'ke allegations'],
  ['ED / CBI', 'ki jaanch'],
  ['RAIDS', 'aur headlines'],
  ['PARTY SWITCH', 'BJP mein shamil'],
  ['INVESTIGATION', 'ki raftaar par sawaal'],
  ['KUCH CASES', 'headline se gaayab?'],
  ['WASHING MACHINE?', 'ek political metaphor'],
];

const image = (name:string, fit:'cover'|'contain'='cover', transform?:string) =>
  <Img src={staticFile(base+name)} style={{width:'100%', height:'100%', objectFit:fit, transform}}/>;

export const WashingSamples:React.FC<{style:'dossier'|'timeline'|'illustrated'}> = ({style}) => {
  const frame=useCurrentFrame(); const time=frame/30;
  const idx=Math.max(0,Math.min(6,beat.findIndex((v,i)=>time>=v&&time<beat[i+1])));
  const local=time-beat[idx];
  const move=interpolate(local,[0,6],[1,1.08],{extrapolateRight:'clamp'});
  const overlay={position:'absolute' as const,inset:0,background:'linear-gradient(90deg,rgba(5,10,18,.96) 0%,rgba(5,10,18,.45) 60%,rgba(5,10,18,.15) 100%)'};
  const label=(top:string,bottom:string)=><div style={{position:'absolute',left:100,bottom:95,color:cream,fontFamily:'Arial,sans-serif',textShadow:'0 3px 15px #000'}}><div style={{fontSize:23,letterSpacing:6,color:style==='timeline'?cyan:red,marginBottom:18}}>EXPLAINER · SAMPLE {style.toUpperCase()}</div><div style={{fontSize:83,fontWeight:900,lineHeight:1.02,maxWidth:1400}}>{top}</div><div style={{fontSize:37,marginTop:17}}>{bottom}</div></div>;
  return <AbsoluteFill style={{backgroundColor:navy,color:cream,fontFamily:'Arial,sans-serif'}}>
    {style==='dossier' && <>
      <AbsoluteFill style={{background:'radial-gradient(circle at 75% 40%,#203349,#07101b 70%)'}}/>
      <div style={{position:'absolute',right:80,top:100,width:900,height:740,overflow:'hidden',border:'2px solid #455364',boxShadow:'0 30px 65px #000'}}>{idx<2?image('cbi.jpg','cover',`scale(${move})`):idx<6?image('article.png','contain'):image('metaphor.png','cover',`scale(${move})`)}</div>
      <div style={{position:'absolute',left:97,top:85,borderTop:`7px solid ${red}`,paddingTop:15,fontSize:29,letterSpacing:4}}>THE FILE / 01</div>
      <div style={{position:'absolute',right:95,bottom:72,fontSize:20,background:'#101b2bcc',padding:12}}>{idx<2?'PHOTO: PULAKIT SINGH / CC BY-SA 4.0':idx<6?'SOURCE: THE INDIAN EXPRESS · 04 APR 2024':'CONCEPTUAL ILLUSTRATION'}</div>
      {label(words[idx][0],words[idx][1])}
    </>}
    {style==='timeline' && <>
      <AbsoluteFill style={{background:'linear-gradient(135deg,#0b1524,#0e2531)'}}/>
      <div style={{position:'absolute',top:65,left:100,fontSize:30,letterSpacing:5,color:cyan}}>ALLEGATION → INVESTIGATION → SWITCH → QUESTIONS</div>
      <div style={{position:'absolute',left:100,top:175,width:1050,height:600,overflow:'hidden',border:'2px solid #547581'}}>{idx<2?image('cbi.jpg','cover',`scale(${move})`):idx<4?<OffthreadVideo src={staticFile(base+'machine.webm')} muted style={{width:'100%',height:'100%',objectFit:'contain',background:'#07101b'}}/>:image('article.png','contain')}</div>
      <div style={{position:'absolute',right:96,top:205,width:510}}>{['Allegation','Agency probe','Party switch','What changed?'].map((s,i)=><div key={s} style={{borderLeft:`8px solid ${idx>=i*2?cyan:'#35515a'}`,padding:'26px 32px',fontSize:36,background:idx>=i*2?'#193745':'#11202b',marginBottom:18}}>{String(i+1).padStart(2,'0')} &nbsp; {s}</div>)}</div>
      <div style={{position:'absolute',left:100,bottom:110,fontSize:64,fontWeight:800}}>{words[idx][0]} <span style={{color:cyan}}>{words[idx][1]}</span></div>
      <div style={{position:'absolute',left:100,bottom:52,fontSize:20,opacity:.8}}>{idx<2?'CBI HQ photo: Pulakit Singh · CC BY-SA 4.0':idx<4?'Washing machine footage: Sounds of Changes · CC BY 3.0':'The Indian Express · 4 Apr 2024'}</div>
    </>}
    {style==='illustrated' && <>
      <AbsoluteFill style={{transform:`scale(${interpolate(time,[0,32],[1,1.12])})`}}>{image('metaphor.png')}</AbsoluteFill>
      <AbsoluteFill style={overlay}/>
      <div style={{position:'absolute',left:100,top:75,fontSize:27,letterSpacing:6,color:'#eabf79'}}>THE WASHING MACHINE / EXPLAINED</div>
      <div style={{position:'absolute',right:82,top:160,width:570,height:410,overflow:'hidden',border:'3px solid #eabf79',boxShadow:'0 18px 50px #000'}}>{idx<3?image('cbi.jpg'):idx<6?image('article.png','contain'):image('metaphor.png')}</div>
      {label(words[idx][0],words[idx][1])}
      <div style={{position:'absolute',right:83,bottom:70,fontSize:19,opacity:.85}}>{idx<3?'CBI HQ: Pulakit Singh · CC BY-SA 4.0':idx<6?'The Indian Express · 4 Apr 2024':'Conceptual art; no real person depicted'}</div>
    </>}
    <div style={{position:'absolute',left:0,right:0,bottom:0,height:7,background:'#34404e'}}><div style={{height:'100%',width:`${time/32*100}%`,background:style==='timeline'?cyan:red}}/></div>
    <Audio src={staticFile(base+'voice.wav')}/>
    <Audio src={staticFile('lib/music/Interloper.mp3')} volume={0.06}/>
  </AbsoluteFill>;
};
