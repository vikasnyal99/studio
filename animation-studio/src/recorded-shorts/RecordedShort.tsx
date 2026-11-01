import React from 'react';
import {AbsoluteFill, Audio, Img, OffthreadVideo, Sequence, interpolate, staticFile, useCurrentFrame} from 'remotion';

export type ShortSpec = {
  duration: number; title: string; kicker: string; accent: string;
  portrait: string; wide: string; voice: string;
  music: string; source: string;
  captions: {a:number;b:number;text:string}[];
  beats: {a:number;b:number;label:string;sub?:string;image?:string;mode:'split'|'card';tag?:string}[];
  sfx: {at:number;file:string;volume:number}[];
};
export const RecordedShort:React.FC<{spec:ShortSpec}> = ({spec}) => {
  const frame=useCurrentFrame(), t=frame/30;
  const beat=spec.beats.find(b=>t>=b.a && t<b.b);
  const cap=spec.captions.find(c=>t>=c.a && t<c.b);
  const split=!!beat;
  const age=beat ? (t-beat.a)*30 : 0;
  const enter=interpolate(age,[0,9],[50,0],{extrapolateRight:'clamp'});
  const pulse=1+0.035*Math.sin(Math.PI*Math.min(1,(t%6)/6));
  return <AbsoluteFill style={{background:'#10151d',color:'white',fontFamily:'Inter, sans-serif'}}>
    <style>{`@font-face{font-family:Inter;src:url('${staticFile('fonts/Inter.ttf')}')} @font-face{font-family:Serif;src:url('${staticFile('fonts/DMSerifDisplay-Regular.ttf')}')}`}</style>
    <AbsoluteFill style={{overflow:'hidden',height:split?920:1920,top:0}}>
      <OffthreadVideo src={staticFile(spec.portrait)} muted style={{width:'100%',height:'100%',objectFit:'cover',objectPosition:split?'50% 35%':'center',transform:`scale(${split?1:pulse})`}}/>
    </AbsoluteFill>
    <AbsoluteFill style={{background:split?'linear-gradient(180deg,rgba(0,0,0,.55),transparent 20%,transparent 37%,#10151d 49%)':'linear-gradient(180deg,rgba(0,0,0,.65),transparent 27%,transparent 55%,rgba(0,0,0,.7))'}}/>
    <div style={{position:'absolute',top:115,left:64,right:95}}>
      <div style={{opacity:interpolate(t,[0,2.6,3.5],[1,1,0],{extrapolateRight:'clamp'}),transform:`translateY(${interpolate(t,[0,2.8,3.5],[0,0,-25],{extrapolateRight:'clamp'})}px)`}}>
        <div style={{fontSize:26,fontWeight:800,letterSpacing:5,color:spec.accent,marginBottom:16}}>{spec.kicker.toUpperCase()}</div>
        <div style={{fontSize:65,lineHeight:1.07,fontWeight:900,textShadow:'0 3px 18px #000',maxWidth:850}}>{spec.title}</div>
        <div style={{height:7,width:110,background:spec.accent,marginTop:24,borderRadius:9}}/>
      </div>
    </div>
    {beat && <div style={{position:'absolute',left:48,right:48,top:865,height:715,borderRadius:32,overflow:'hidden',border:'2px solid #ffffff20',background:'#202b38',transform:`translateY(${enter}px)`}}>
      {beat.image && <Img src={staticFile(beat.image)} style={{width:'100%',height:'100%',objectFit:'cover',transform:`scale(${1+age/12000})`}}/>}
      {!beat.image && <AbsoluteFill style={{background:`radial-gradient(ellipse at 70% 20%, ${spec.accent}55, #172331 70%)`}}>
        {[0,1,2].map(i=><div key={i} style={{position:'absolute',width:340+i*180,height:340+i*180,border:`2px solid ${spec.accent}44`,borderRadius:'50%',right:-180,top:40-i*50,transform:`rotate(${frame/4}deg)`}}/>)}
      </AbsoluteFill>}
      <AbsoluteFill style={{background:'linear-gradient(transparent 25%,rgba(3,9,15,.95))'}}/>
      <div style={{position:'absolute',left:42,right:42,bottom:48}}>
        <div style={{fontSize:22,letterSpacing:4,color:spec.accent,fontWeight:800,marginBottom:16}}>{beat.tag??(beat.image?'ILLUSTRATION':'THE BIG IDEA')}</div>
        <div style={{fontFamily:'Serif',fontSize:68,lineHeight:1.05}}>{beat.label}</div>
        {beat.sub && <div style={{fontSize:32,lineHeight:1.3,color:'#d5dee7',marginTop:18}}>{beat.sub}</div>}
      </div>
    </div>}
    {cap && <div style={{position:'absolute',left:52,right:52,bottom:190,display:'flex',justifyContent:'center'}}>
      <div style={{fontSize:42,lineHeight:1.18,fontWeight:850,textAlign:'center',background:'#090e17e8',padding:'16px 24px',borderRadius:20,borderBottom:`5px solid ${spec.accent}`,boxShadow:'0 8px 25px #0005'}}>{cap.text}</div>
    </div>}
    <div style={{position:'absolute',left:64,right:100,bottom:165,height:5,background:'#ffffff22',borderRadius:6}}><div style={{width:`${t/spec.duration*100}%`,height:5,background:spec.accent}}/></div>
    <Audio src={staticFile(spec.voice)}/>
    <Audio src={staticFile(spec.music)} volume={0.075}/>
    {spec.sfx.map((s,i)=><Sequence key={i} from={Math.round(s.at*30)} durationInFrames={Math.max(1,Math.ceil((spec.duration-s.at)*30))}><Audio src={staticFile(s.file)} volume={s.volume}/></Sequence>)}
  </AbsoluteFill>;
};
