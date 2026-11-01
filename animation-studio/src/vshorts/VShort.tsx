import React from 'react';
import {
  AbsoluteFill, Audio, CalculateMetadataFunction, Easing, Img, OffthreadVideo, Sequence, interpolate, spring, staticFile,
  useCurrentFrame,
} from 'remotion';

// A vertical Short edited from a talking-head phone recording (renderer: scripts/vshorts.mjs, spec:
// jobs/<video>/vshort.json). pieces: spans of the recording kept, back to back (pauses cut, jump-cut punch-ins).
// Every other time in the spec is in RECORDING seconds and is mapped through the pieces.
// captions: [sec, "2-4 words"], <b>..</b> yellow. inserts: illustrations and animated graphics over/around the speaker.

export type Insert = {
  t: number;                 // recording second it starts
  d: number;                 // seconds on screen (output time)
  kind: 'split' | 'full' | 'stat' | 'compare' | 'timeline' | 'quote';
  img?: string;              // public/ path
  move?: 'in' | 'out' | 'left' | 'right' | 'up' | 'down';
  label?: string;            // kicker chip
  title?: string;            // big line
  sub?: string;
  items?: {t: number; head: string; text: string; tone?: 'good' | 'bad'}[]; // timeline rows (t = recording sec)
  a?: {big: string; small: string; tone?: 'good' | 'bad'}; // compare / stat values
  b?: {big: string; small: string; tone?: 'good' | 'bad'};
  sfx?: string | false;
};

export type VShortSpec = {
  cam: string;
  voice: string;
  music: string;
  musicVol?: number;
  musicFrom?: number;
  pieces: [number, number][];
  kicker: string;
  title: string;
  captions: [number, string][];
  inserts: Insert[];
  sfx?: [number, string, number?][];
  end?: string;
  accent?: string;
  ai?: string;               // chip on illustrations
};

const FPS = 30;
const YEL = '#FFD84A';
const RED = '#FF4D4D';
const GREEN = '#3DDC84';

const outLen = (s: VShortSpec) => s.pieces.reduce((a, [f, t]) => a + (t - f), 0);
// recording second -> output second (times inside a cut gap snap to the next piece)
export const toOut = (s: VShortSpec, t: number) => {
  let acc = 0;
  for (const [a, b] of s.pieces) {
    if (t < a) return acc;
    if (t < b) return acc + (t - a);
    acc += b - a;
  }
  return acc;
};

export const vshortMetadata: CalculateMetadataFunction<{spec: VShortSpec}> = ({props}) => ({
  durationInFrames: Math.ceil(outLen(props.spec) * FPS),
});

const Fonts: React.FC = () => (
  <style>{`
    @font-face{font-family:Inter;src:url(${staticFile('fonts/Inter.ttf')});font-weight:100 900}
    @font-face{font-family:Serif;src:url(${staticFile('fonts/DMSerifDisplay-Regular.ttf')})}
    @font-face{font-family:Bang;src:url(${staticFile('fonts/Bangers-Regular.ttf')})}
    b{color:${YEL};font-weight:900}
  `}</style>
);

const html = (t: string) => ({__html: t});
const ease = Easing.bezier(0.22, 1, 0.36, 1);

// ---------- speaker ----------
// split inserts push the speaker into the lower part of the frame
const splitAt = (s: VShortSpec, sec: number) => {
  for (const i of s.inserts) {
    if (i.kind !== 'split') continue;
    const a = toOut(s, i.t);
    const k = Math.min(interpolate(sec, [a, a + 0.35], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: ease}),
      interpolate(sec, [a + i.d - 0.35, a + i.d], [1, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: ease}));
    if (k > 0) return k;
  }
  return 0;
};

const Camera: React.FC<{s: VShortSpec}> = ({s}) => {
  let acc = 0;
  return (
    <>
      {s.pieces.map(([a, b], i) => {
        const from = Math.round(acc * FPS);
        const len = Math.round((acc + b - a) * FPS) - from;
        acc += b - a;
        return (
          <Sequence key={i} from={from} durationInFrames={len} premountFor={15}>
            <CamPiece s={s} idx={i} startSec={a} len={len} outStart={from / FPS} />
          </Sequence>
        );
      })}
    </>
  );
};

const CamPiece: React.FC<{s: VShortSpec; idx: number; startSec: number; len: number; outStart: number}> = ({s, idx, startSec, len, outStart}) => {
  const f = useCurrentFrame();
  const sec = outStart + f / FPS;
  // jump cuts alternate wide / punched-in, with a slow push inside each piece
  const base = [1.0, 1.14, 1.06, 1.2][idx % 4];
  const push = interpolate(f, [0, len], [0, 0.035]);
  const sp = splitAt(s, sec);
  const vol = (fr: number) => Math.min(1, fr / 2, (len - fr) / 2);
  return (
    <AbsoluteFill style={{overflow: 'hidden', background: '#000'}}>
      <OffthreadVideo src={staticFile(s.cam)} startFrom={Math.round(startSec * FPS)} muted
        style={{width: '100%', height: '100%', objectFit: 'cover', transformOrigin: '50% 30%',
          transform: `translateY(${sp * 700}px) scale(${base + push + (1.04 - base - push) * sp})`}} />
      <Audio src={staticFile(s.voice)} startFrom={Math.round(startSec * FPS)} volume={vol} />
    </AbsoluteFill>
  );
};

// ---------- pictures ----------
const KenBurns: React.FC<{src: string; f: number; dur: number; move?: Insert['move']}> = ({src, f, dur, move = 'in'}) => {
  const p = interpolate(f, [0, dur], [0, 1], {extrapolateRight: 'clamp'});
  const m: Record<string, [number, number, number, number, number, number]> = {
    in: [1.05, 1.22, 0, 0, 0, 0], out: [1.25, 1.06, 0, 0, 0, 0], left: [1.18, 1.18, 4, -4, 0, 0],
    right: [1.18, 1.18, -4, 4, 0, 0], up: [1.2, 1.2, 0, 0, 4, -4], down: [1.2, 1.2, 0, 0, -4, 4],
  };
  const [s0, s1, x0, x1, y0, y1] = m[move];
  return <Img src={staticFile(src)} style={{width: '100%', height: '100%', objectFit: 'cover',
    transform: `scale(${s0 + (s1 - s0) * p}) translate(${x0 + (x1 - x0) * p}%, ${y0 + (y1 - y0) * p}%)`}} />;
};

const Chip: React.FC<{text: string; color?: string; style?: React.CSSProperties}> = ({text, color = YEL, style}) => (
  <div style={{display: 'inline-block', padding: '10px 22px', borderRadius: 40, background: color, color: '#111',
    fontFamily: 'Inter', fontWeight: 900, fontSize: 30, letterSpacing: 2, textTransform: 'uppercase', ...style}}>{text}</div>
);

const AiTag: React.FC<{text?: string}> = ({text}) => (
  <div style={{position: 'absolute', right: 28, top: 28, padding: '6px 14px', borderRadius: 8, background: 'rgba(0,0,0,.55)',
    color: 'rgba(255,255,255,.8)', fontFamily: 'Inter', fontWeight: 600, fontSize: 22}}>{text ?? 'AI illustration'}</div>
);

const InsertLayer: React.FC<{s: VShortSpec; i: Insert}> = ({s, i}) => {
  const f = useCurrentFrame();
  const dur = Math.round(i.d * FPS);
  const inK = spring({frame: f, fps: FPS, config: {damping: 16, stiffness: 140}});
  const outK = interpolate(f, [dur - 8, dur], [1, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const flash = interpolate(f, [0, 2, 7], [0, 0.55, 0], {extrapolateRight: 'clamp'});

  if (i.kind === 'split') {
    const y = interpolate(inK, [0, 1], [-1100, 0]) + interpolate(outK, [0, 1], [-1100, 0]) * 0 ;
    const hide = interpolate(f, [dur - 10, dur], [0, -1100], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: ease});
    return (
      <AbsoluteFill>
        <div style={{position: 'absolute', left: 0, top: 0, width: 1080, height: 1060, overflow: 'hidden',
          transform: `translateY(${y + hide}px)`, boxShadow: '0 18px 50px rgba(0,0,0,.6)', borderBottom: `8px solid ${s.accent ?? YEL}`}}>
          <KenBurns src={i.img!} f={f} dur={dur} move={i.move} />
          <AiTag text={s.ai} />
          {i.label ? <div style={{position: 'absolute', left: 40, bottom: 40}}>
            <Chip text={i.label} color={s.accent ?? YEL} style={{transform: `translateX(${interpolate(spring({frame: f - 8, fps: FPS}), [0, 1], [-500, 0])}px)`}} />
          </div> : null}
        </div>
      </AbsoluteFill>
    );
  }

  if (i.kind === 'full') {
    const sc = interpolate(inK, [0, 1], [1.15, 1]);
    return (
      <AbsoluteFill style={{opacity: outK}}>
        <AbsoluteFill style={{transform: `scale(${sc})`, opacity: Math.min(1, inK * 1.4)}}>
          <KenBurns src={i.img!} f={f} dur={dur} move={i.move} />
        </AbsoluteFill>
        <AbsoluteFill style={{background: 'linear-gradient(180deg, rgba(0,0,0,.35) 0%, rgba(0,0,0,0) 25%, rgba(0,0,0,0) 55%, rgba(0,0,0,.7) 100%)'}} />
        <AiTag text={s.ai} />
        {i.label || i.title ? <div style={{position: 'absolute', left: 60, right: 60, top: 230}}>
          {i.label ? <Chip text={i.label} color={s.accent ?? YEL} style={{transform: `translateX(${interpolate(spring({frame: f - 6, fps: FPS}), [0, 1], [-700, 0])}px)`}} /> : null}
          {i.title ? <div style={{marginTop: 22, fontFamily: 'Inter', fontWeight: 900, fontSize: 92, lineHeight: 1.02, color: '#fff',
            textShadow: '0 6px 30px rgba(0,0,0,.9)', opacity: interpolate(f, [8, 16], [0, 1], {extrapolateRight: 'clamp'}),
            transform: `translateY(${interpolate(spring({frame: f - 8, fps: FPS}), [0, 1], [40, 0])}px)`}} dangerouslySetInnerHTML={html(i.title)} /> : null}
        </div> : null}
        <AbsoluteFill style={{background: '#fff', opacity: flash}} />
      </AbsoluteFill>
    );
  }

  // graphic panels: dark glass over a blurred copy of the picture (or of the speaker)
  const panelIn = interpolate(inK, [0, 1], [0, 1]);
  const Back = i.img ? (
    <AbsoluteFill style={{filter: 'blur(26px) brightness(.38)', transform: 'scale(1.15)'}}><KenBurns src={i.img} f={f} dur={dur} move="in" /></AbsoluteFill>
  ) : <AbsoluteFill style={{background: 'linear-gradient(180deg, rgba(10,12,20,.93), rgba(4,5,10,.97))'}} />;
  return (
    <AbsoluteFill style={{opacity: Math.min(panelIn, outK)}}>
      {Back}
      <AbsoluteFill style={{background: `radial-gradient(circle at 50% 40%, ${(s.accent ?? YEL)}22 0%, rgba(0,0,0,0) 60%)`}} />
      <div style={{position: 'absolute', left: 70, right: 70, top: 300}}>
        {i.label ? <Chip text={i.label} color={s.accent ?? YEL} style={{transform: `scale(${spring({frame: f - 3, fps: FPS})})`}} /> : null}
        {i.title ? <div style={{marginTop: 26, fontFamily: 'Inter', fontWeight: 900, fontSize: 76, lineHeight: 1.05, color: '#fff'}}
          dangerouslySetInnerHTML={html(i.title)} /> : null}
        {i.kind === 'stat' || i.kind === 'compare' ? <Compare s={s} i={i} f={f} /> : null}
        {i.kind === 'timeline' ? <Timeline s={s} i={i} f={f} /> : null}
        {i.kind === 'quote' ? <Quote i={i} f={f} /> : null}
        {i.sub ? <div style={{marginTop: 34, fontFamily: 'Inter', fontWeight: 600, fontSize: 34, color: 'rgba(255,255,255,.75)',
          opacity: interpolate(f, [20, 30], [0, 1], {extrapolateRight: 'clamp'})}}>{i.sub}</div> : null}
      </div>
    </AbsoluteFill>
  );
};

const tone = (t?: string) => (t === 'bad' ? RED : t === 'good' ? GREEN : YEL);

const Compare: React.FC<{s: VShortSpec; i: Insert; f: number}> = ({i, f}) => {
  const box = (v: NonNullable<Insert['a']>, delay: number) => {
    const k = spring({frame: f - delay, fps: FPS, config: {damping: 11, stiffness: 160}});
    return (
      <div style={{flex: 1, padding: '34px 20px', borderRadius: 28, background: 'rgba(255,255,255,.07)', border: `4px solid ${tone(v.tone)}`,
        textAlign: 'center', transform: `scale(${k})`, opacity: Math.min(1, k * 2)}}>
        <div style={{fontFamily: 'Bang', fontSize: 150, lineHeight: 1, color: tone(v.tone), letterSpacing: 2}}>{v.big}</div>
        <div style={{fontFamily: 'Inter', fontWeight: 800, fontSize: 36, color: '#fff', marginTop: 10}}>{v.small}</div>
      </div>
    );
  };
  if (!i.b) return <div style={{display: 'flex', marginTop: 50}}>{box(i.a!, 6)}</div>;
  const arrow = spring({frame: f - 14, fps: FPS});
  return (
    <div style={{display: 'flex', flexDirection: 'column', gap: 26, marginTop: 50}}>
      {box(i.a!, 6)}
      <div style={{textAlign: 'center', fontFamily: 'Inter', fontWeight: 900, fontSize: 80, color: '#fff', transform: `translateY(${(1 - arrow) * -30}px)`, opacity: arrow}}>↓</div>
      {box(i.b, 22)}
    </div>
  );
};

const Timeline: React.FC<{s: VShortSpec; i: Insert; f: number}> = ({s, i, f}) => {
  const start = toOut(s, i.t);
  const rows = i.items ?? [];
  return (
    <div style={{position: 'relative', marginTop: 46, paddingLeft: 70}}>
      <div style={{position: 'absolute', left: 22, top: 10, width: 6, borderRadius: 3, background: 'rgba(255,255,255,.25)',
        height: `${Math.min(100, interpolate(f, [0, Math.round(i.d * FPS)], [10, 100]))}%`}} />
      {rows.map((r, k) => {
        const at = Math.round((toOut(s, r.t) - start) * FPS);
        const p = spring({frame: f - at, fps: FPS, config: {damping: 14}});
        const live = f >= at;
        return (
          <div key={k} style={{position: 'relative', marginBottom: 34, opacity: live ? 0.35 + 0.65 * p : 0.12,
            transform: `translateX(${(1 - p) * 60}px)`}}>
            <div style={{position: 'absolute', left: -62, top: 14, width: 30, height: 30, borderRadius: 15, background: live ? tone(r.tone) : '#555',
              boxShadow: live ? `0 0 24px ${tone(r.tone)}` : 'none'}} />
            <div style={{fontFamily: 'Bang', fontSize: 78, lineHeight: 1, color: tone(r.tone)}}>{r.head}</div>
            <div style={{fontFamily: 'Inter', fontWeight: 700, fontSize: 38, color: '#fff', marginTop: 6}} dangerouslySetInnerHTML={html(r.text)} />
          </div>
        );
      })}
    </div>
  );
};

const Quote: React.FC<{i: Insert; f: number}> = ({i, f}) => (
  <div style={{marginTop: 40, padding: 40, borderRadius: 26, background: 'rgba(255,255,255,.08)', borderLeft: `10px solid ${RED}`,
    transform: `scale(${spring({frame: f - 6, fps: FPS})})`}}>
    <div style={{fontFamily: 'Serif', fontSize: 64, color: '#fff', lineHeight: 1.15}} dangerouslySetInnerHTML={html(i.a?.big ?? '')} />
    <div style={{fontFamily: 'Inter', fontWeight: 700, fontSize: 32, color: 'rgba(255,255,255,.7)', marginTop: 18}}>{i.a?.small}</div>
    {f > 30 ? <div style={{position: 'absolute', right: 40, bottom: -40, transform: `rotate(-12deg) scale(${spring({frame: f - 30, fps: FPS, config: {damping: 9}})})`,
      padding: '10px 28px', border: `8px solid ${RED}`, color: RED, fontFamily: 'Bang', fontSize: 84, borderRadius: 14, background: 'rgba(0,0,0,.5)'}}>{i.b?.big ?? 'FAKE'}</div> : null}
  </div>
);

// ---------- text ----------
const Captions: React.FC<{s: VShortSpec}> = ({s}) => {
  const f = useCurrentFrame();
  const sec = f / FPS;
  const cs = s.captions.map(([t, text]) => [toOut(s, t), text] as [number, string]);
  let k = -1;
  for (let j = 0; j < cs.length; j++) if (cs[j][0] <= sec + 0.02) k = j;
  if (k < 0) return null;
  const [t0, text] = cs[k];
  const next = k + 1 < cs.length ? cs[k + 1][0] : outLen(s);
  if (sec > Math.min(next, t0 + 2.6)) return null;
  const lf = Math.round((sec - t0) * FPS);
  const pop = spring({frame: lf, fps: FPS, config: {damping: 12, stiffness: 220}});
  const sp = splitAt(s, sec);
  // under the picture during a split, otherwise below the speaker's chin
  const top = interpolate(sp, [0, 1], [1530, 1095]);
  return (
    <div style={{position: 'absolute', left: 50, right: 50, top, textAlign: 'center'}}>
      <span style={{display: 'inline-block', padding: '10px 26px 14px', borderRadius: 18, background: 'rgba(0,0,0,.55)',
        fontFamily: 'Inter', fontWeight: 900, fontSize: 70, lineHeight: 1.12, color: '#fff', letterSpacing: -0.5,
        textShadow: '0 4px 0 rgba(0,0,0,.6)', transform: `scale(${0.8 + 0.2 * pop}) translateY(${(1 - pop) * 16}px)`}}
        dangerouslySetInnerHTML={html(text)} />
    </div>
  );
};

const Hook: React.FC<{s: VShortSpec}> = ({s}) => {
  const f = useCurrentFrame();
  const inK = spring({frame: f, fps: FPS, config: {damping: 14, stiffness: 150}});
  const out = interpolate(f, [Math.round(3.4 * FPS), Math.round(3.9 * FPS)], [1, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  return (
    <AbsoluteFill style={{opacity: out}}>
      <AbsoluteFill style={{background: 'linear-gradient(180deg, rgba(0,0,0,.8) 0%, rgba(0,0,0,.35) 30%, rgba(0,0,0,0) 45%)'}} />
      <div style={{position: 'absolute', left: 60, right: 60, top: 140}}>
        <Chip text={s.kicker} color={s.accent ?? YEL} style={{transform: `translateX(${(1 - inK) * -600}px)`}} />
        <div style={{marginTop: 22, fontFamily: 'Inter', fontWeight: 900, fontSize: 104, lineHeight: 1.0, color: '#fff', letterSpacing: -2,
          textShadow: '0 8px 30px rgba(0,0,0,.8)', transform: `scale(${0.85 + 0.15 * inK})`, transformOrigin: 'left top', opacity: inK}}
          dangerouslySetInnerHTML={html(s.title)} />
      </div>
    </AbsoluteFill>
  );
};

const TopTag: React.FC<{s: VShortSpec}> = ({s}) => {
  const f = useCurrentFrame();
  const k = interpolate(f, [0, 10], [0, 1], {extrapolateRight: 'clamp'});
  return (
    <div style={{position: 'absolute', left: 40, top: 60, opacity: k * 0.95, padding: '8px 18px', borderRadius: 10,
      background: 'rgba(0,0,0,.55)', borderLeft: `6px solid ${s.accent ?? YEL}`, fontFamily: 'Inter', fontWeight: 800, fontSize: 28,
      color: '#fff', letterSpacing: 1.5, textTransform: 'uppercase'}}>{s.kicker}</div>
  );
};

const Progress: React.FC<{s: VShortSpec}> = ({s}) => {
  const f = useCurrentFrame();
  const p = f / (outLen(s) * FPS);
  return <div style={{position: 'absolute', left: 0, bottom: 0, height: 10, width: `${p * 100}%`, background: s.accent ?? YEL}} />;
};

const EndCard: React.FC<{text: string; accent: string}> = ({text, accent}) => {
  const f = useCurrentFrame();
  const k = spring({frame: f, fps: FPS, config: {damping: 10}});
  return (
    <div style={{position: 'absolute', left: 0, right: 0, top: 1730, textAlign: 'center'}}>
      <span style={{display: 'inline-block', padding: '20px 40px', borderRadius: 60, background: accent, color: '#111',
        fontFamily: 'Inter', fontWeight: 900, fontSize: 46, transform: `scale(${k})`, boxShadow: '0 10px 40px rgba(0,0,0,.5)'}}>{text}</span>
    </div>
  );
};

// ---------- whole Short ----------
export const VShort: React.FC<{spec: VShortSpec}> = ({spec: s}) => {
  const total = Math.ceil(outLen(s) * FPS);
  const autoSfx: [number, string, number][] = s.inserts.filter((i) => i.sfx !== false).map((i) => [
    toOut(s, i.t), i.sfx || (i.kind === 'full' ? 'whoosh' : i.kind === 'split' ? 'swell' : 'pop'), 0.35]);
  const manual = (s.sfx ?? []).map(([t, n, v]) => [toOut(s, t), n, v ?? 0.4] as [number, string, number]);
  const mv = s.musicVol ?? 0.1;
  return (
    <AbsoluteFill style={{background: '#000'}}>
      <Fonts />
      <Camera s={s} />
      {s.inserts.map((i, k) => (
        <Sequence key={k} from={Math.round(toOut(s, i.t) * FPS)} durationInFrames={Math.round(i.d * FPS)}>
          <InsertLayer s={s} i={i} />
        </Sequence>
      ))}
      <Sequence from={Math.round(3.6 * FPS)}><TopTag s={s} /></Sequence>
      <Sequence durationInFrames={Math.round(4 * FPS)}><Hook s={s} /></Sequence>
      <Captions s={s} />
      {s.end ? <Sequence from={total - Math.round(3 * FPS)}><EndCard text={s.end} accent={s.accent ?? YEL} /></Sequence> : null}
      <Progress s={s} />
      <Audio src={staticFile(s.music)} startFrom={Math.round((s.musicFrom ?? 0) * FPS)}
        volume={(fr) => mv * interpolate(fr, [0, 6, total - 45, total], [2.2, 1, 1, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'})} />
      {[...autoSfx, ...manual].map(([t, n, v], k) => (
        <Sequence key={`s${k}`} from={Math.max(0, Math.round(t * FPS) - (n === 'whoosh' || n === 'riser' ? 4 : 0))} durationInFrames={90}>
          <Audio src={staticFile(`vshorts/sfx/${n}.wav`)} volume={v} />
        </Sequence>
      ))}
    </AbsoluteFill>
  );
};

export const VSHORT_DEMO: VShortSpec = {
  cam: 'vshorts/2026-10-28-img-4873/cam.mp4', voice: 'vshorts/2026-10-28-img-4873/voice.wav', music: 'vshorts/music/Crypto.mp3',
  pieces: [[0, 6]], kicker: 'Demo', title: 'Demo', captions: [[0.2, 'Demo <b>caption</b>']], inserts: [],
};
