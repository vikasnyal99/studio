import React from 'react';
import {
  AbsoluteFill, Audio, CalculateMetadataFunction, Easing, Img, OffthreadVideo, Sequence, interpolate, random, staticFile,
  useCurrentFrame, useVideoConfig,
} from 'remotion';
import {noise2D} from '@remotion/noise';

// AniDoc-style documentary edit (see .claude/skills/doc-animation). One spec = one shot list:
// stills get slow "2.5D" camera moves + living-light effects; AI image-to-video clips (kind "clip") drop in the same way.
// Overlays: name label, TV "breaking news" frame, CCTV look. Cards: date/year on black, chrome title.
// All times are seconds from the start of this spec. Pictures are staticFile paths (public/...).

export type Fx = 'dust' | 'flicker' | 'smoke' | 'fog' | 'rain' | 'rays' | 'embers' | 'sirens';
export type DocShot = {
  t: number; // start second (ends where the next shot starts, or at spec.end)
  kind?: 'still' | 'clip' | 'card' | 'title'; // default still
  img?: string; // still: picture; clip: mp4
  from?: number; // clip: second to start from
  move?: 'push' | 'pull' | 'left' | 'right' | 'up' | 'down' | 'none'; // default push
  z?: [number, number]; // zoom start/end (default by move)
  focus?: [number, number]; // % point the camera moves toward (default 50,45)
  fg?: string; // optional cut-out layer (transparent PNG at the same size) that moves faster -> parallax
  fx?: Fx[];
  grade?: 'warm' | 'night' | 'cold' | 'none'; // default spec.grade
  in?: 'cut' | 'fade' | 'black'; // how this shot enters (black = dip to black between)
  label?: {text: string; sub?: string; at?: number; dur?: number}; // white italic name lower-left
  tv?: {head?: string; line: string; sub?: string}; // fake news-channel frame
  cctv?: boolean;
  text?: string; // card / title text
  sub?: string;
};
export type DocSpec = {
  w?: number;
  h?: number;
  end: number; // last second
  grade?: 'warm' | 'night' | 'cold' | 'none';
  audio?: string; // narration, preview only (scripts/doc.mjs renders muted unless --with-audio)
  music?: {src: string; vol?: number};
  sfx?: [number, string, number?][]; // [second, staticFile path, volume]
  mark?: string; // corner watermark text
  shots: DocShot[];
};

const FPS = 30;
const f = (s: number) => Math.round(s * FPS);
const ease = Easing.inOut(Easing.cubic);
const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;

const Fonts: React.FC = () => (
  <style>{`
    @font-face{font-family:Inter;src:url(${staticFile('fonts/Inter.ttf')});font-weight:100 900}
    @font-face{font-family:Serif;src:url(${staticFile('fonts/DMSerifDisplay-Regular.ttf')})}
  `}</style>
);

const MOVES: Record<string, {z: [number, number]; dx: number; dy: number}> = {
  push: {z: [1.04, 1.16], dx: 0, dy: 0},
  pull: {z: [1.18, 1.05], dx: 0, dy: 0},
  left: {z: [1.14, 1.14], dx: 4, dy: 0},
  right: {z: [1.14, 1.14], dx: -4, dy: 0},
  up: {z: [1.14, 1.14], dx: 0, dy: 3.5},
  down: {z: [1.14, 1.14], dx: 0, dy: -3.5},
  none: {z: [1.02, 1.02], dx: 0, dy: 0},
};

// --- living-light effects (all deterministic per frame) ---
const Particles: React.FC<{n: number; seed: string; color: string; rise: number; size: number; glow?: boolean}> = ({n, seed, color, rise, size, glow}) => {
  const frame = useCurrentFrame();
  const {width: W, height: H} = useVideoConfig();
  return (
    <AbsoluteFill style={{mixBlendMode: 'screen'}}>
      {Array.from({length: n}, (_, i) => {
        const x0 = random(`${seed}x${i}`) * W, y0 = random(`${seed}y${i}`) * H, sp = 0.3 + random(`${seed}s${i}`);
        const x = x0 + noise2D(seed, i, frame / 140) * 60;
        const y = ((y0 - frame * rise * sp) % H + H) % H;
        const tw = 0.35 + 0.65 * Math.abs(noise2D(`${seed}t`, i, frame / 30));
        const s = size * (0.5 + random(`${seed}r${i}`));
        return <div key={i} style={{position: 'absolute', left: x, top: y, width: s, height: s, borderRadius: '50%', background: color, opacity: tw, boxShadow: glow ? `0 0 ${s * 3}px ${color}` : undefined}} />;
      })}
    </AbsoluteFill>
  );
};

const Smoke: React.FC<{opacity: number; seed: string; low?: boolean}> = ({opacity, seed, low}) => {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill style={{mixBlendMode: 'screen', opacity}}>
      {Array.from({length: 6}, (_, i) => {
        const x = 10 + i * 17 + noise2D(seed, i, frame / 200) * 12 + frame * 0.04;
        const y = (low ? 70 : 30 + random(`${seed}${i}`) * 50) + noise2D(`${seed}y`, i, frame / 220) * 8;
        return <div key={i} style={{position: 'absolute', left: `${x % 120 - 10}%`, top: `${y}%`, width: '45%', height: '35%', transform: 'translate(-50%,-50%)', background: 'radial-gradient(closest-side, rgba(220,215,205,0.55), rgba(220,215,205,0))', filter: 'blur(30px)'}} />;
      })}
    </AbsoluteFill>
  );
};

const Rain: React.FC = () => {
  const frame = useCurrentFrame();
  const {width: W, height: H} = useVideoConfig();
  return (
    <AbsoluteFill style={{opacity: 0.35}}>
      <svg width={W} height={H}>
        {Array.from({length: 140}, (_, i) => {
          const x = random(`rx${i}`) * (W + 200) - 100, sp = 40 + random(`rs${i}`) * 30;
          const y = ((random(`ry${i}`) * H + frame * sp) % (H + 100)) - 100;
          return <line key={i} x1={x} y1={y} x2={x - 8} y2={y + 46} stroke="#cfd8e6" strokeWidth={1.6} />;
        })}
      </svg>
    </AbsoluteFill>
  );
};

const Rays: React.FC<{focus: [number, number]}> = ({focus}) => {
  const frame = useCurrentFrame();
  const a = noise2D('rays', 0, frame / 90) * 3;
  const o = 0.22 + noise2D('raysO', 0, frame / 50) * 0.06;
  return (
    <AbsoluteFill style={{mixBlendMode: 'screen', opacity: o, transformOrigin: `${focus[0]}% 0%`, transform: `rotate(${a}deg)`}}>
      {[-14, -5, 4, 12].map((r, i) => (
        <div key={i} style={{position: 'absolute', left: `${focus[0]}%`, top: '-20%', width: 120 + i * 40, height: '150%', transformOrigin: 'top center', transform: `translateX(-50%) rotate(${r}deg)`, background: 'linear-gradient(rgba(255,226,160,0.9), rgba(255,226,160,0))', filter: 'blur(26px)'}} />
      ))}
    </AbsoluteFill>
  );
};

const Sirens: React.FC = () => {
  const frame = useCurrentFrame();
  const red = (Math.sin(frame / 3) + 1) / 2;
  return (
    <AbsoluteFill style={{mixBlendMode: 'screen'}}>
      <AbsoluteFill style={{background: `radial-gradient(ellipse at 10% 40%, rgba(255,40,40,${0.35 * red}), transparent 55%)`}} />
      <AbsoluteFill style={{background: `radial-gradient(ellipse at 90% 40%, rgba(40,90,255,${0.35 * (1 - red)}), transparent 55%)`}} />
    </AbsoluteFill>
  );
};

const GRADES = {
  warm: {tint: 'rgba(255,170,80,0.10)', shade: 'rgba(20,40,60,0.18)'},
  night: {tint: 'rgba(60,110,170,0.14)', shade: 'rgba(5,15,35,0.30)'},
  cold: {tint: 'rgba(150,180,200,0.10)', shade: 'rgba(20,30,40,0.20)'},
  none: null,
};

const Grade: React.FC<{g: keyof typeof GRADES}> = ({g}) => {
  const frame = useCurrentFrame();
  const c = GRADES[g];
  return (
    <AbsoluteFill style={{pointerEvents: 'none'}}>
      {c && <AbsoluteFill style={{background: c.tint, mixBlendMode: 'soft-light'}} />}
      {c && <AbsoluteFill style={{background: `linear-gradient(transparent 40%, ${c.shade})`, mixBlendMode: 'multiply'}} />}
      <AbsoluteFill style={{background: 'radial-gradient(ellipse at center, rgba(0,0,0,0) 55%, rgba(0,0,0,0.5) 100%)'}} />
      <AbsoluteFill style={{opacity: 0.07, mixBlendMode: 'overlay'}}>
        <svg width="100%" height="100%">
          <filter id="docgrain"><feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="2" seed={frame % 12} /></filter>
          <rect width="100%" height="100%" filter="url(#docgrain)" />
        </svg>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

// --- overlays ---
const Label: React.FC<{l: NonNullable<DocShot['label']>; len: number}> = ({l, len}) => {
  const frame = useCurrentFrame();
  const {height: H} = useVideoConfig();
  const a = f(l.at ?? 0.4), b = Math.min(len, a + f(l.dur ?? 3.5));
  const o = interpolate(frame, [a, a + 8, b - 8, b], [0, 1, 1, 0], clamp);
  const x = interpolate(frame, [a, a + 12], [-30, 0], {...clamp, easing: Easing.out(Easing.cubic)});
  return (
    <div style={{position: 'absolute', left: H * 0.06, bottom: H * 0.1, opacity: o, transform: `translateX(${x}px)`, fontFamily: 'Inter', fontStyle: 'italic', color: '#fff', textShadow: '0 4px 14px rgba(0,0,0,0.85), 0 0 2px #000'}}>
      <div style={{fontWeight: 900, fontSize: H * 0.058}}>{l.text}</div>
      {l.sub && <div style={{fontWeight: 600, fontSize: H * 0.03, opacity: 0.9}}>{l.sub}</div>}
    </div>
  );
};

const Tv: React.FC<{tv: NonNullable<DocShot['tv']>; children: React.ReactNode}> = ({tv, children}) => {
  const frame = useCurrentFrame();
  const {height: H} = useVideoConfig();
  const sec = 14 * 3600 + 55 * 60 + Math.floor(frame / FPS);
  const clock = [sec / 3600, (sec / 60) % 60, sec % 60].map((n) => String(Math.floor(n)).padStart(2, '0')).join(':');
  const u = H / 1080;
  return (
    <AbsoluteFill style={{background: '#0b0c0f'}}>
      <AbsoluteFill style={{inset: 26 * u, borderRadius: 26 * u, overflow: 'hidden', boxShadow: 'inset 0 0 80px rgba(0,0,0,0.9)'}}>
        {children}
        <AbsoluteFill style={{background: 'repeating-linear-gradient(rgba(0,0,0,0.12) 0 2px, transparent 2px 5px)'}} />
        <div style={{position: 'absolute', left: 40 * u, top: 34 * u, background: '#d61f1f', color: '#fff', fontFamily: 'Inter', fontWeight: 900, fontSize: 30 * u, padding: `${4 * u}px ${16 * u}px`, borderRadius: 6 * u, opacity: frame % 30 < 22 ? 1 : 0.55}}>● LIVE</div>
        <div style={{position: 'absolute', right: 40 * u, top: 34 * u, color: '#fff', fontFamily: 'Inter', fontWeight: 700, fontSize: 28 * u, textShadow: '0 2px 6px #000'}}>{clock} <span style={{color: '#ff3b3b'}}>● REC</span></div>
        <div style={{position: 'absolute', left: 0, right: 0, bottom: 40 * u, fontFamily: 'Inter'}}>
          <div style={{display: 'inline-block', marginLeft: 40 * u, background: '#d61f1f', color: '#fff', fontWeight: 900, fontSize: 26 * u, padding: `${4 * u}px ${14 * u}px`}}>{tv.head ?? 'BREAKING NEWS'}</div>
          <div style={{background: 'linear-gradient(90deg,#0d2a6b,#123a8f)', color: '#fff', fontWeight: 800, fontSize: 36 * u, padding: `${10 * u}px ${40 * u}px`}}>{tv.line}</div>
          {tv.sub && <div style={{background: 'rgba(0,0,0,0.75)', color: '#f1f1f1', fontWeight: 600, fontSize: 28 * u, padding: `${6 * u}px ${40 * u}px`}}>{tv.sub}</div>}
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

const Cctv: React.FC = () => {
  const frame = useCurrentFrame();
  const {height: H} = useVideoConfig();
  const u = H / 1080;
  return (
    <AbsoluteFill>
      <AbsoluteFill style={{background: 'rgba(40,70,40,0.25)', mixBlendMode: 'color'}} />
      <AbsoluteFill style={{background: 'repeating-linear-gradient(rgba(255,255,255,0.05) 0 1px, transparent 1px 4px)'}} />
      <div style={{position: 'absolute', left: 40 * u, top: 30 * u, color: '#e8ffe8', fontFamily: 'monospace', fontSize: 30 * u, textShadow: '0 0 4px #000'}}>CAM 03 &nbsp; {String(Math.floor(frame / FPS)).padStart(4, '0')}</div>
      <div style={{position: 'absolute', right: 40 * u, top: 30 * u, color: '#ff4040', fontFamily: 'monospace', fontSize: 30 * u, opacity: frame % 30 < 15 ? 1 : 0}}>● REC</div>
    </AbsoluteFill>
  );
};

// --- shot kinds ---
const Still: React.FC<{s: DocShot; len: number; grade: keyof typeof GRADES}> = ({s, len, grade}) => {
  const frame = useCurrentFrame();
  const mv = MOVES[s.move ?? 'push'];
  const [z0, z1] = s.z ?? mv.z;
  const t = interpolate(frame, [0, len], [0, 1], {...clamp, easing: ease});
  const focus = s.focus ?? [50, 45];
  const z = z0 + (z1 - z0) * t;
  const dx = mv.dx * (t - 0.5) * 2, dy = mv.dy * (t - 0.5) * 2;
  const flick = s.fx?.includes('flicker') ? 1 + noise2D('fl', 0, frame / 6) * 0.05 + noise2D('fl2', 0, frame / 40) * 0.04 : 1;
  const media = (src: string, k: number) => {
    // zoom around the centre, then slide so the focus point comes to the middle (never past the picture's edge)
    const zz = 1 + (z - 1) * k;
    const lim = (zz - 1) * 50;
    const tx = Math.max(-lim, Math.min(lim, (50 - focus[0]) * zz + dx * k * zz));
    const ty = Math.max(-lim, Math.min(lim, (50 - focus[1]) * zz + dy * k * zz));
    const style: React.CSSProperties = {position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', transform: `translate(${tx}%, ${ty}%) scale(${zz})`};
    if (s.kind === 'clip' && k === 1) return <OffthreadVideo src={staticFile(src)} startFrom={f(s.from ?? 0)} muted style={style} />;
    return <Img src={staticFile(src)} style={style} />;
  };
  const fx = new Set(s.fx ?? []);
  const scene = (
    <AbsoluteFill style={{overflow: 'hidden', background: '#000', filter: flick !== 1 ? `brightness(${flick})` : undefined}}>
      {s.img && media(s.img, 1)}
      {fx.has('fog') && <Smoke opacity={0.35} seed={`fog${s.t}`} low />}
      {s.fg && media(s.fg, 1.8)}
      {fx.has('rays') && <Rays focus={focus} />}
      {fx.has('smoke') && <Smoke opacity={0.5} seed={`sm${s.t}`} />}
      {fx.has('dust') && <Particles n={45} seed={`d${s.t}`} color="rgba(255,236,200,0.8)" rise={0.25} size={4} />}
      {fx.has('embers') && <Particles n={40} seed={`e${s.t}`} color="#ff9a3c" rise={2.2} size={5} glow />}
      {fx.has('rain') && <Rain />}
      {fx.has('sirens') && <Sirens />}
      <Grade g={s.grade ?? grade} />
      {s.cctv && <Cctv />}
    </AbsoluteFill>
  );
  return (
    <AbsoluteFill>
      {s.tv ? <Tv tv={s.tv}>{scene}</Tv> : scene}
      {s.label && <Label l={s.label} len={len} />}
    </AbsoluteFill>
  );
};

const Card: React.FC<{s: DocShot; len: number}> = ({s, len}) => {
  const frame = useCurrentFrame();
  const {height: H} = useVideoConfig();
  const o = interpolate(frame, [0, 10, len - 8, len], [0, 1, 1, 0], clamp);
  const sc = interpolate(frame, [0, len], [0.96, 1.04]);
  return (
    <AbsoluteFill style={{background: '#000', alignItems: 'center', justifyContent: 'center'}}>
      <div style={{opacity: o, transform: `scale(${sc})`, fontFamily: 'Inter', fontWeight: 900, fontStyle: 'italic', fontSize: H * 0.085, background: 'linear-gradient(180deg,#ffffff 30%,#9a9a9a 75%,#e6e6e6)', WebkitBackgroundClip: 'text', color: 'transparent', filter: 'drop-shadow(0 6px 10px rgba(0,0,0,0.8))'}}>{s.text}</div>
    </AbsoluteFill>
  );
};

const Title: React.FC<{s: DocShot; len: number}> = ({s, len}) => {
  const frame = useCurrentFrame();
  const {height: H} = useVideoConfig();
  const o = interpolate(frame, [0, 14, len - 10, len], [0, 1, 1, 0], clamp);
  const sc = interpolate(frame, [0, len], [1.1, 1.0], {easing: Easing.out(Easing.cubic)});
  const sweep = interpolate(frame, [8, 38], [-30, 130], clamp);
  return (
    <AbsoluteFill style={{background: 'radial-gradient(ellipse at center, #3a2a18 0%, #120c06 60%, #000 100%)', alignItems: 'center', justifyContent: 'center'}}>
      <Particles n={60} seed="title" color="rgba(255,210,140,0.9)" rise={0.6} size={3} glow />
      <div style={{opacity: o, transform: `scale(${sc})`, textAlign: 'center'}}>
        <div style={{fontFamily: 'Serif', fontSize: H * 0.13, letterSpacing: H * 0.008, textTransform: 'uppercase', color: 'transparent', WebkitBackgroundClip: 'text',
          backgroundImage: `linear-gradient(100deg, transparent ${sweep - 12}%, rgba(255,255,255,0.95) ${sweep}%, transparent ${sweep + 12}%), linear-gradient(180deg,#f4f4f4 0%,#bfbfbf 45%,#6b6b6b 52%,#d9d9d9 70%,#fafafa 100%)`,
          filter: 'drop-shadow(0 8px 14px rgba(0,0,0,0.9))'}}>{s.text}</div>
        {s.sub && <div style={{fontFamily: 'Inter', fontWeight: 700, fontSize: H * 0.032, letterSpacing: H * 0.01, color: '#d9c49a', marginTop: H * 0.01}}>{s.sub}</div>}
      </div>
    </AbsoluteFill>
  );
};

const XF = 12; // crossfade / dip frames

export const Doc: React.FC<{spec: DocSpec}> = ({spec}) => {
  const grade = spec.grade ?? 'warm';
  const {height: H} = useVideoConfig();
  return (
    <AbsoluteFill style={{background: '#000'}}>
      <Fonts />
      {spec.shots.map((s, i) => {
        const a = f(s.t), b = f(spec.shots[i + 1]?.t ?? spec.end);
        const next = spec.shots[i + 1];
        const pre = s.in === 'fade' && i > 0 ? XF : 0; // start early under the previous shot
        const tail = next?.in === 'fade' ? XF : 0;
        const len = b - a + tail;
        const k = s.kind ?? 'still';
        return (
          <Sequence key={i} from={a - pre} durationInFrames={len + pre} layout="none">
            <Fade pre={pre} dipIn={s.in === 'black' && i > 0} dipOut={next?.in === 'black'} len={len + pre}>
              {k === 'card' ? <Card s={s} len={len + pre} /> : k === 'title' ? <Title s={s} len={len + pre} /> : <Still s={s} len={len + pre} grade={grade} />}
            </Fade>
          </Sequence>
        );
      })}
      {spec.mark && <div style={{position: 'absolute', right: H * 0.025, bottom: H * 0.02, fontFamily: 'Inter', fontWeight: 800, fontSize: H * 0.022, color: '#fff', opacity: 0.8, textShadow: '0 1px 4px #000'}}>{spec.mark}</div>}
      {spec.audio && <Audio src={staticFile(spec.audio)} />}
      {spec.music && <Audio src={staticFile(spec.music.src)} volume={(fr) => (spec.music!.vol ?? 0.12) * interpolate(fr, [0, 30, f(spec.end) - 45, f(spec.end)], [0, 1, 1, 0], clamp)} />}
      {(spec.sfx ?? []).map(([t, src, vol], i) => (
        <Sequence key={`x${i}`} from={f(t)} layout="none"><Audio src={staticFile(src)} volume={vol ?? 0.6} /></Sequence>
      ))}
    </AbsoluteFill>
  );
};

const Fade: React.FC<{pre: number; dipIn: boolean; dipOut: boolean; len: number; children: React.ReactNode}> = ({pre, dipIn, dipOut, len, children}) => {
  const frame = useCurrentFrame();
  let o = 1;
  if (pre) o = interpolate(frame, [0, pre], [0, 1], clamp);
  if (dipIn) o = Math.min(o, interpolate(frame, [0, XF], [0, 1], clamp));
  if (dipOut) o = Math.min(o, interpolate(frame, [len - XF, len], [1, 0], clamp));
  return <AbsoluteFill style={{opacity: o}}>{children}</AbsoluteFill>;
};

export const docMetadata: CalculateMetadataFunction<{spec: DocSpec}> = ({props}) => ({
  durationInFrames: f(props.spec.end),
  width: props.spec.w ?? 1920,
  height: props.spec.h ?? 1080,
});

// Demo with the Dev Tanwar panels (studio preview only).
export const DOC_DEMO: DocSpec = {
  end: 16,
  mark: 'DEMO',
  shots: [
    {t: 0, kind: 'card', text: '23 October 2026'},
    {t: 2.2, in: 'black', img: 'shots/shots_s1_p1.png', move: 'push', fx: ['dust', 'rays'], focus: [40, 40], label: {text: 'Neeraj Pepsu', sub: 'Bodybuilder, Haryana'}},
    {t: 6, img: 'shots/shots_s1_p2.png', move: 'pull', fx: ['flicker', 'smoke'], grade: 'night'},
    {t: 9, in: 'fade', img: 'shots/shots_s1_p3.png', move: 'left', tv: {line: 'Hotel parking mein hungama', sub: 'Holi party ke baad jhagda'}},
    {t: 12, kind: 'title', text: 'Lily White', sub: 'THE REAL STORY', in: 'black'},
  ],
};
