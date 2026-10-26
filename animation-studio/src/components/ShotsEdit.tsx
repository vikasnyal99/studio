import React from 'react';
import {AbsoluteFill, Audio, Img, interpolate, staticFile, useCurrentFrame, Easing} from 'remotion';
import {Flash, SlamText} from './fx';

// Close-up edit from ChatGPT storyboard panels (public/shots/<prefix>_sN_pM.png, made by scripts/prep-shots.mjs).
// You write only the data (see src/jobs/2026-10-23-dev-tanwar-short/Shots.tsx); this draws it:
// cuts, slow push-ins, shake + flash on hits, slam text, Roman Hinglish captions, 9:16 by default.
export type Shot = {
  a: number; // start second
  b: number; // end second
  p: string; // panel "<sheet>_<panel>" e.g. "2_1" (panel: 1 top-left, 2 top-right, 3 bottom-left, 4 bottom-right)
  z0?: number; // zoom at start (default 1)
  z1?: number; // zoom at end (default 1.15)
  pair?: string; // companion panel, used only when split=true
};
export type Slam = {text: string; at: number; y?: number; size?: number; rotate?: number};
export type ShotsEditProps = {
  prefix: string; // file prefix used by prep-shots, e.g. "shots"
  audio: string; // staticFile path of the narration wav (the edited one)
  shots: Shot[];
  hits: number[]; // seconds: flash + shake
  big?: number[]; // subset of hits that shake/flash harder
  captions: [number, number, string][]; // [from s, to s, text]
  slams?: Slam[];
  split?: boolean; // style B: two stacked panels per beat
  width?: number;
  height?: number;
};
const f = (s: number) => Math.round(s * 30);

const Panel: React.FC<{sh: Shot; src: string; w: number; h: number; top: number; frame: number; flip?: boolean}> = ({sh, src, w, h, top, frame, flip}) => {
  const t = interpolate(frame, [f(sh.a), f(sh.b)], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.out(Easing.quad)});
  const z0 = sh.z0 ?? 1, z1 = sh.z1 ?? 1.15;
  const z = flip ? z1 - (z1 - z0) * t : z0 + (z1 - z0) * t;
  return (
    <div style={{position: 'absolute', left: 0, top, width: w, height: h, overflow: 'hidden'}}>
      <Img src={staticFile(src)} style={{width: '100%', height: '100%', objectFit: 'cover', transform: `scale(${z})`}} />
    </div>
  );
};

export const ShotsEdit: React.FC<ShotsEditProps> = ({prefix, audio, shots, hits, big = [], captions, slams = [], split, width = 1080, height = 1920}) => {
  const frame = useCurrentFrame();
  const img = (p: string) => { const [s, m] = p.split('_'); return `shots/${prefix}_s${s}_p${m}.png`; };
  const sh = shots.find((s) => frame >= f(s.a) && frame < f(s.b)) ?? shots[shots.length - 1];
  let sx = 0, sy = 0;
  for (const h of hits) {
    const d = frame - f(h);
    if (d >= 0 && d < 10) {
      const k = (1 - d / 10) * (big.includes(h) ? 38 : 16);
      sx += Math.sin(d * 7.1 + h) * k; sy += Math.cos(d * 5.3 + h) * k;
    }
  }
  const cap = captions.find(([a, b]) => frame >= f(a) && frame < f(b));
  const pop = cap ? interpolate(frame, [f(cap[0]), f(cap[0]) + 5], [0.85, 1], {extrapolateRight: 'clamp'}) : 1;
  const half = (height - 12) / 2;
  return (
    <AbsoluteFill style={{backgroundColor: '#fff'}}>
      <Audio src={staticFile(audio)} />
      <AbsoluteFill style={{transform: `translate(${sx}px, ${sy}px)`}}>
        {split ? (
          <>
            <Panel sh={sh} src={img(sh.p)} w={width} h={half} top={0} frame={frame} />
            <Panel sh={sh} src={img(sh.pair ?? sh.p)} w={width} h={half} top={half + 12} frame={frame} flip />
          </>
        ) : (
          <Panel sh={sh} src={img(sh.p)} w={width} h={height} top={0} frame={frame} />
        )}
      </AbsoluteFill>
      {hits.map((h) => <Flash key={h} start={f(h)} frames={big.includes(h) ? 5 : 2} />)}
      {slams.map((s) => <SlamText key={s.text} text={s.text} start={f(s.at)} x={width / 2} y={s.y ?? 300} size={s.size ?? 110} rotate={s.rotate ?? -5} />)}
      {cap && (
        <div style={{
          position: 'absolute', left: 60, right: 60, top: 1560, textAlign: 'center', fontFamily: 'DejaVu Sans, Arial, sans-serif', fontSize: 68, fontWeight: 900,
          lineHeight: 1.1, color: '#fff', WebkitTextStroke: '8px #000', paintOrder: 'stroke fill', transform: `scale(${pop})`,
        }}>{cap[2]}</div>
      )}
    </AbsoluteFill>
  );
};
