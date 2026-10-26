import React from 'react';
import {
  AbsoluteFill, CalculateMetadataFunction, OffthreadVideo, Sequence, interpolate, spring, staticFile, useCurrentFrame,
  useVideoConfig,
} from 'remotion';

// A 9:16 Short cut out of a finished 16:9 video-studio video (see .claude/skills/shorts-from-video).
// pieces: spans of the source in its own seconds, played back to back. modes: source spans where the speaker is on
// camera ("face" fills the frame around them); everything else is shown whole ("fit") over a blurred copy.
// captions: [source second, text] in Roman Hinglish, <b>..</b> gold.

export type ShortSpec = {
  video: string;
  pieces: [number, number][];
  title: string;
  captions: [number, string][];
  modes?: [number, number, 'face'][];
  facePos?: string;
  cta?: string;
  badge?: string;
};

const FPS = 30;
const GOLD = '#e8b34b';
const total = (s: ShortSpec) => s.pieces.reduce((a, [f, t]) => a + (t - f), 0);

const Fonts: React.FC = () => (
  <style>{`
    @font-face{font-family:Inter;src:url(${staticFile('fonts/Inter.ttf')});font-weight:100 900}
    @font-face{font-family:Bang;src:url(${staticFile('fonts/Bangers-Regular.ttf')})}
  `}</style>
);

const isFace = (s: ShortSpec, srcT: number) => (s.modes ?? []).some(([a, b]) => srcT >= a && srcT < b);

const Piece: React.FC<{s: ShortSpec; from: number}> = ({s, from}) => {
  const f = useCurrentFrame();
  const srcT = from + f / FPS;
  const face = isFace(s, srcT);
  const src = staticFile(s.video);
  const start = Math.round(from * FPS);
  return (
    <AbsoluteFill>
      {/* blurred fill behind "fit" shots */}
      <AbsoluteFill style={{opacity: face ? 0 : 1}}>
        <OffthreadVideo src={src} startFrom={start} muted style={{width: '100%', height: '100%', objectFit: 'cover', filter: 'blur(36px) brightness(0.8) saturate(1.3)', transform: 'scale(1.3)'}} />
      </AbsoluteFill>
      <AbsoluteFill style={face ? {} : {top: 640, height: 608, bottom: 'auto'}}>
        <OffthreadVideo src={src} startFrom={start} volume={1}
          style={{width: '100%', height: '100%', objectFit: face ? 'cover' : 'contain', objectPosition: face ? s.facePos ?? '56% 40%' : 'center'}} />
      </AbsoluteFill>
      {!face ? <AbsoluteFill style={{top: 640, height: 608, bottom: 'auto', boxShadow: 'inset 0 0 0 3px rgba(232,179,75,0.35)'}} /> : null}
    </AbsoluteFill>
  );
};

export const ShortCut: React.FC<{spec: ShortSpec}> = ({spec: s}) => {
  const f = useCurrentFrame();
  const {durationInFrames, fps} = useVideoConfig();
  const t = f / fps;
  // map captions from source time to short time
  const offs: number[] = [];
  s.pieces.reduce((a, [fr, to]) => (offs.push(a), a + (to - fr)), 0);
  const caps = s.captions
    .map(([src, text]) => {
      const i = s.pieces.findIndex(([a, b]) => src >= a - 0.05 && src < b);
      return i < 0 ? null : {at: offs[i] + Math.max(0, src - s.pieces[i][0]), text};
    })
    .filter((c): c is {at: number; text: string} => c !== null)
    .sort((a, b) => a.at - b.at);
  const cur = [...caps].reverse().find((c) => c.at <= t);
  const next = cur ? caps[caps.indexOf(cur) + 1] : undefined;
  const showCap = cur && t < (next ? next.at : cur.at + 2.5) && t < cur.at + 3.2;
  const pop = cur ? spring({frame: f - Math.round(cur.at * fps), fps, config: {damping: 14, stiffness: 260}}) : 0;
  const end = durationInFrames / fps;
  const ctaP = interpolate(t, [end - 2.4, end - 2.0], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const titleP = spring({frame: f, fps, config: {damping: 15}});
  return (
    <AbsoluteFill style={{background: '#0b0d12', fontFamily: 'Inter'}}>
      <Fonts />
      {s.pieces.map(([a, b], i) => (
        <Sequence key={i} from={Math.round(offs[i] * fps)} durationInFrames={Math.round((b - a) * fps)}>
          <Piece s={s} from={a} />
        </Sequence>
      ))}
      {/* title band */}
      <AbsoluteFill style={{height: 520, bottom: 'auto', background: 'linear-gradient(180deg, rgba(11,13,18,0.92) 55%, transparent)'}} />
      <div style={{position: 'absolute', top: 150, left: 60, right: 60, textAlign: 'center', fontFamily: 'Bang', fontSize: 104, lineHeight: 1.02,
        color: '#f3efe6', letterSpacing: 2, textShadow: '0 6px 30px rgba(0,0,0,0.8)', transform: `scale(${0.8 + titleP * 0.2})`, opacity: titleP}}
        dangerouslySetInnerHTML={{__html: s.title.replace(/<b>/g, `<span style="color:${GOLD}">`).replace(/<\/b>/g, '</span>')}} />
      {s.badge ? (
        <div style={{position: 'absolute', top: 395, left: 0, right: 0, display: 'flex', justifyContent: 'center', opacity: titleP}}>
          <div style={{background: '#d9574a', color: '#fff', fontWeight: 800, fontSize: 34, letterSpacing: 1.5, padding: '10px 26px', borderRadius: 40,
            boxShadow: '0 6px 24px rgba(0,0,0,0.5)'}}>{s.badge}</div>
        </div>
      ) : null}
      {/* captions */}
      {showCap && cur ? (
        <div style={{position: 'absolute', top: 1300, left: 50, right: 50, textAlign: 'center', fontWeight: 900, fontSize: 70, lineHeight: 1.12, color: '#fff',
          textShadow: '0 4px 0 #000, 0 0 24px rgba(0,0,0,0.9)', WebkitTextStroke: '2px #000', transform: `scale(${0.85 + pop * 0.15})`}}
          dangerouslySetInnerHTML={{__html: cur.text.replace(/<b>/g, `<span style="color:${GOLD}">`).replace(/<\/b>/g, '</span>')}} />
      ) : null}
      {/* progress bar */}
      <div style={{position: 'absolute', bottom: 0, left: 0, height: 10, width: `${(t / end) * 100}%`, background: GOLD}} />
      {/* end card */}
      {ctaP > 0 ? (
        <div style={{position: 'absolute', bottom: 190, left: 0, right: 0, display: 'flex', justifyContent: 'center', opacity: ctaP, transform: `translateY(${(1 - ctaP) * 40}px)`}}>
          <div style={{background: GOLD, color: '#111', fontWeight: 900, fontSize: 46, padding: '20px 40px', borderRadius: 60}}>{s.cta ?? 'Poora fact-check ▶ channel par'}</div>
        </div>
      ) : null}
    </AbsoluteFill>
  );
};

export const shortMetadata: CalculateMetadataFunction<{spec: ShortSpec}> = ({props}) => ({
  durationInFrames: Math.max(1, Math.round(total(props.spec) * FPS)),
});

export const SHORT_DEMO: ShortSpec = {video: 'hero.jpg', pieces: [[0, 2]], title: 'Demo', captions: []};
