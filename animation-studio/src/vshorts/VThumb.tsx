import React from 'react';
import {AbsoluteFill, Img, staticFile} from 'remotion';

// Shorts thumbnail (1080x1920) for a VShort: the strongest illustration on top, the speaker's face below,
// a 2-3 line hook in the middle (<b>..</b> yellow) and a red stamp. Spec: vshort.json "thumb" (scripts/vshorts.mjs --thumb).

export type VThumbSpec = {
  img: string;
  face: string;          // still of the speaker, extracted by the renderer
  text: string;
  stamp?: string;
  kicker: string;
  accent?: string;
};

export const VThumb: React.FC<{spec: VThumbSpec}> = ({spec: s}) => (
  <AbsoluteFill style={{background: '#000'}}>
    <style>{`
      @font-face{font-family:Inter;src:url(${staticFile('fonts/Inter.ttf')});font-weight:100 900}
      @font-face{font-family:Bang;src:url(${staticFile('fonts/Bangers-Regular.ttf')})}
      b{color:#FFD84A}
    `}</style>
    <div style={{position: 'absolute', left: 0, top: 0, width: 1080, height: 1180, overflow: 'hidden'}}>
      <Img src={staticFile(s.img)} style={{width: '100%', height: '100%', objectFit: 'cover', transform: 'scale(1.08)'}} />
    </div>
    <div style={{position: 'absolute', left: 0, top: 980, width: 1080, height: 940, overflow: 'hidden'}}>
      <Img src={staticFile(s.face)} style={{width: '100%', height: '100%', objectFit: 'cover', objectPosition: '50% 55%'}} />
    </div>
    <AbsoluteFill style={{background: 'linear-gradient(180deg, rgba(0,0,0,.55) 0%, rgba(0,0,0,0) 14%, rgba(0,0,0,0) 36%, rgba(0,0,0,.85) 52%, rgba(0,0,0,.85) 58%, rgba(0,0,0,0) 70%)'}} />
    <div style={{position: 'absolute', left: 50, top: 60, padding: '12px 26px', borderRadius: 40, background: s.accent ?? '#FFD84A',
      fontFamily: 'Inter', fontWeight: 900, fontSize: 38, letterSpacing: 2, textTransform: 'uppercase', color: '#111'}}>{s.kicker}</div>
    <div style={{position: 'absolute', left: 50, right: 50, top: 760, transform: 'rotate(-2deg)', fontFamily: 'Inter', fontWeight: 900,
      fontSize: 128, lineHeight: 1.0, letterSpacing: -3, color: '#fff', textTransform: 'uppercase',
      textShadow: '0 8px 0 #000, 0 0 40px rgba(0,0,0,.9), 5px 5px 0 #000, -3px -3px 0 #000'}}
      dangerouslySetInnerHTML={{__html: s.text}} />
    {s.stamp ? <div style={{position: 'absolute', right: 50, top: 560, transform: 'rotate(10deg)', padding: '8px 30px',
      border: '12px solid #FF3B3B', borderRadius: 18, color: '#FF3B3B', background: 'rgba(0,0,0,.6)', fontFamily: 'Bang',
      fontSize: 120, lineHeight: 1, boxShadow: '0 10px 40px rgba(0,0,0,.6)'}}>{s.stamp}</div> : null}
  </AbsoluteFill>
);

export const VTHUMB_DEMO: VThumbSpec = {
  img: 'vshorts/2026-10-28-img-4873/a3.jpg', face: 'vshorts/2026-10-28-img-4873/a1.jpg', text: 'Demo <b>thumb</b>', kicker: 'Demo',
};
