import React from 'react';
import {
  AbsoluteFill, CalculateMetadataFunction, Easing, Img, OffthreadVideo, interpolate, spring, staticFile,
  useCurrentFrame, useVideoConfig,
} from 'remotion';
import {noise2D} from '@remotion/noise';

// Data-driven "proof" shots for video-studio fact-check videos (see .claude/skills/proof-shots).
// One composition, many looks: the JSON spec passed with --props picks the kind.
// All times are seconds from the start of the shot. Rects are [left, top, width, height] in % of the picture.

const C = {bg: '#0b0d12', ink: '#f3efe6', gold: '#e8b34b', red: '#d9574a', green: '#4caf7a', amber: '#e89a3b', marker: '#ffe14a'};
export const VERDICT_COLORS: Record<string, string> = {red: C.red, green: C.green, amber: C.amber, gold: C.gold};
const col = (c?: string) => (c ? VERDICT_COLORS[c] ?? c : C.red);
const src = (p: string) => (/^https?:/.test(p) ? p : staticFile(p));

type Mark = {k: 'hl' | 'ul' | 'circle' | 'box' | 'arrow' | 'strike'; r: [number, number, number, number]; at: number; c?: string; note?: string; side?: 'above' | 'below' | 'left' | 'right'};
type Stamp = {text: string; sub?: string; at: number; c?: string};
type Base = {dur: number};
export type DocSpec = Base & {kind: 'doc'; img: string; w: number; h: number; chip?: string; cam?: [number, number, number, number][]; marks?: Mark[]; stamp?: Stamp; credit?: string; cap?: [string, string]};
export type ClaimSpec = Base & {kind: 'claim'; clip: string; from?: number; who: string; quote: string; quoteAt?: number; verdict?: Stamp};
export type DonutSpec = Base & {kind: 'donut'; title: string; total: string; sub?: string; slices: {label: string; v: number; c: string; at: number}[]; credit?: string};
export type DatesSpec = Base & {kind: 'dates'; title: string; items: {date: string; text: string; at: number}[]; claim?: {text: string; at: number}; result?: {text: string; at: number}; credit?: string};
export type LawSpec = Base & {kind: 'law'; head: string; text: string; marks: number[]; credit?: string; stamp?: Stamp};
export type ScoreSpec = Base & {kind: 'score'; title: string; rows: {claim: string; verdict: string; c: string; at: number}[]};
export type KineticSpec = Base & {kind: 'kinetic'; bg?: string; lines: {text: string; at: number; size?: number; c?: string; hit?: boolean}[]; stamp?: Stamp};
export type SideSpec = Base & {kind: 'side'; cam: string; camFrom?: number; camPos?: string; side?: 'left' | 'right'; inner: Exclude<ProofSpec, SideSpec>};
export type ProofSpec = DocSpec | ClaimSpec | DonutSpec | DatesSpec | LawSpec | ScoreSpec | KineticSpec | SideSpec;

const Fonts: React.FC = () => (
  <style>{`
    @font-face{font-family:Inter;src:url(${staticFile('fonts/Inter.ttf')});font-weight:100 900}
    @font-face{font-family:Serif;src:url(${staticFile('fonts/DMSerifDisplay-Regular.ttf')})}
    @font-face{font-family:Hand;src:url(${staticFile('fonts/Kalam-Bold.ttf')})}
    @font-face{font-family:Bang;src:url(${staticFile('fonts/Bangers-Regular.ttf')})}
  `}</style>
);

const useT = () => {
  const f = useCurrentFrame();
  const {fps} = useVideoConfig();
  return {t: f / fps, f, fps};
};
const prog = (t: number, at: number, d = 0.5) => interpolate(t, [at, at + d], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.out(Easing.cubic)});

// Dark desk with slow drifting light, shared by every kind
const Desk: React.FC<{children: React.ReactNode}> = ({children}) => {
  const {t} = useT();
  const lx = 50 + noise2D('lx', t * 0.08, 0) * 18;
  return (
    <AbsoluteFill style={{background: C.bg, fontFamily: 'Inter', color: C.ink, overflow: 'hidden'}}>
      <Fonts />
      <AbsoluteFill style={{background: `radial-gradient(ellipse at ${lx}% 35%, rgba(232,179,75,0.13), transparent 60%)`}} />
      <AbsoluteFill style={{backgroundImage: 'linear-gradient(rgba(255,255,255,0.025) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.025) 1px, transparent 1px)', backgroundSize: '60px 60px'}} />
      {children}
      <AbsoluteFill style={{background: 'radial-gradient(ellipse at center, transparent 55%, rgba(0,0,0,0.55))', pointerEvents: 'none'}} />
    </AbsoluteFill>
  );
};

// Rubber stamp that slams in with a small shake
export const StampView: React.FC<{s: Stamp; x?: string; y?: string; size?: number}> = ({s, x = '50%', y = '50%', size = 150}) => {
  const {f, fps, t} = useT();
  if (t < s.at) return null;
  const k = spring({frame: f - s.at * fps, fps, config: {damping: 11, stiffness: 170, mass: 0.7}});
  const scale = interpolate(k, [0, 1], [2.6, 1]);
  const sh = Math.max(0, 1 - (t - s.at) / 0.35);
  const jx = noise2D('stx', t * 30, 0) * 10 * sh;
  const c = col(s.c);
  return (
    <div style={{position: 'absolute', left: x, top: y, transform: `translate(-50%,-50%) translate(${jx}px,0) rotate(-8deg) scale(${scale})`, opacity: Math.min(1, k * 1.6), textAlign: 'center'}}>
      <div style={{border: `10px solid ${c}`, borderRadius: 18, padding: '6px 38px 0', color: c, fontFamily: 'Bang', fontSize: size, letterSpacing: 6, lineHeight: 1.05, background: 'rgba(11,13,18,0.55)', boxShadow: `0 0 60px ${c}55`}}>
        {s.text}
        {s.sub ? <div style={{fontFamily: 'Inter', fontWeight: 800, fontSize: size * 0.2, letterSpacing: 4, paddingBottom: 14}}>{s.sub}</div> : null}
      </div>
    </div>
  );
};

const Chip: React.FC<{text: string; at?: number}> = ({text, at = 0}) => {
  const {t} = useT();
  const p = prog(t, at, 0.4);
  return (
    <div style={{position: 'absolute', left: 70, top: 56, opacity: p, transform: `translateY(${(1 - p) * -20}px)`, background: 'rgba(232,179,75,0.14)', border: `2px solid ${C.gold}`, color: C.gold, padding: '10px 22px', borderRadius: 40, fontWeight: 700, fontSize: 30, letterSpacing: 1}}>
      {text}
    </div>
  );
};

// ---------- doc: screenshot, camera, hand-drawn marks ----------
const wobble = (seed: string, i: number, amp: number) => noise2D(seed, i * 0.7, 0) * amp;
const MarkView: React.FC<{m: Mark; W: number; H: number; i: number}> = ({m, W, H, i}) => {
  const {t} = useT();
  if (t < m.at) return null;
  const [l, tp, w, h] = [m.r[0] * W / 100, m.r[1] * H / 100, m.r[2] * W / 100, m.r[3] * H / 100];
  const c = m.k === 'hl' ? C.marker : col(m.c);
  const sw = Math.max(5, W / 260);
  const d = m.k === 'circle' || m.k === 'arrow' ? 0.55 : 0.45;
  const p = prog(t, m.at, d);
  let el: React.ReactNode = null;
  if (m.k === 'hl') {
    el = <rect x={l - 4} y={tp} width={(w + 8) * p} height={h} fill={c} opacity={0.5} style={{mixBlendMode: 'multiply'}} rx={4} />;
  } else if (m.k === 'box') {
    const len = 2 * (w + h) + 40;
    el = <rect x={l - 8} y={tp - 8} width={w + 16} height={h + 16} fill="none" stroke={c} strokeWidth={sw} rx={10} strokeDasharray={len} strokeDashoffset={len * (1 - p)} />;
  } else if (m.k === 'circle') {
    const cx = l + w / 2, cy = tp + h / 2, rx = w / 2 + 26, ry = h / 2 + 22;
    const pts: string[] = [];
    for (let a = 0; a <= 400; a += 8) {
      const r = (a * Math.PI) / 180;
      const jit = 1 + wobble(`c${i}`, a, 0.04) + (a > 360 ? 0.06 : 0);
      pts.push(`${cx + Math.cos(r - 2.2) * rx * jit},${cy + Math.sin(r - 2.2) * ry * jit}`);
    }
    const len = Math.PI * (rx + ry) * 1.15;
    el = <path d={`M${pts.join(' L')}`} fill="none" stroke={c} strokeWidth={sw * 1.1} strokeLinecap="round" strokeDasharray={len} strokeDashoffset={len * (1 - p)} />;
  } else if (m.k === 'ul' || m.k === 'strike') {
    const y = m.k === 'ul' ? tp + h + sw : tp + h / 2;
    const pts = new Array(13).fill(0).map((_, j) => `${l + (w * j) / 12},${y + wobble(`u${i}`, j, sw * 0.6)}`);
    el = <path d={`M${pts.join(' L')}`} fill="none" stroke={c} strokeWidth={sw} strokeLinecap="round" strokeDasharray={w * 1.1} strokeDashoffset={w * 1.1 * (1 - p)} />;
  } else if (m.k === 'arrow') {
    const tx = l + w / 2, ty = tp - 14, fx = tx + W * 0.08, fy = ty - H * 0.16;
    const x = fx + (tx - fx) * p, y = fy + (ty - fy) * p;
    const ang = Math.atan2(ty - fy, tx - fx), hl = sw * 5;
    el = (
      <g>
        <path d={`M${fx},${fy} Q${fx - W * 0.02},${(fy + y) / 2} ${x},${y}`} fill="none" stroke={c} strokeWidth={sw} strokeLinecap="round" />
        {p > 0.95 ? <path d={`M${tx - hl * Math.cos(ang - 0.5)},${ty - hl * Math.sin(ang - 0.5)} L${tx},${ty} L${tx - hl * Math.cos(ang + 0.5)},${ty - hl * Math.sin(ang + 0.5)}`} fill="none" stroke={c} strokeWidth={sw} strokeLinecap="round" /> : null}
      </g>
    );
  }
  const np = prog(t, m.at + d * 0.7, 0.3);
  const side = m.side ?? 'below';
  const nx = side === 'left' ? l - 20 : side === 'right' ? l + w + 20 : l + w / 2;
  const ny = side === 'above' ? tp - 30 : side === 'below' ? tp + h + 30 : tp + h / 2;
  const anchor = side === 'left' ? 'end' : side === 'right' ? 'start' : 'middle';
  return (
    <g>
      {el}
      {m.note ? (
        <text x={nx} y={ny} textAnchor={anchor} dominantBaseline={side === 'above' ? 'auto' : side === 'below' ? 'hanging' : 'middle'} fill={m.k === 'hl' ? C.red : c} opacity={np}
          style={{fontFamily: 'Hand', fontSize: Math.max(38, W / 34), paintOrder: 'stroke', stroke: '#fff', strokeWidth: 10}}>{m.note}</text>
      ) : null}
    </g>
  );
};

const Doc: React.FC<{s: DocSpec}> = ({s}) => {
  const {t} = useT();
  const {width, height} = useVideoConfig();
  // fit the page into the frame with margin; the camera then moves inside it
  const fit = Math.min((width * 0.82) / s.w, (height * 0.8) / s.h);
  const W = s.w * fit, H = s.h * fit;
  const cams = s.cam && s.cam.length ? s.cam : [[0, 50, 50, 1] as [number, number, number, number]];
  let cx = cams[0][1], cy = cams[0][2], z = cams[0][3];
  for (let i = 1; i < cams.length; i++) {
    const p = interpolate(t, [cams[i][0], cams[i][0] + 0.9], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.inOut(Easing.cubic)});
    cx += (cams[i][1] - cx) * p; cy += (cams[i][2] - cy) * p; z += (cams[i][3] - z) * p;
  }
  const enter = prog(t, 0, 0.7);
  const drift = 1 + t * 0.006;
  const tx = width / 2 - (cx / 100) * W * z * drift, ty = height / 2 - (cy / 100) * H * z * drift;
  return (
    <Desk>
      <div style={{position: 'absolute', left: 0, top: 0, width: W, height: H, transformOrigin: '0 0',
        transform: `translate(${tx}px, ${ty + (1 - enter) * 80}px) scale(${z * drift}) rotate(${(1 - enter) * -3}deg)`, opacity: enter,
        boxShadow: '0 30px 80px rgba(0,0,0,0.7)', borderRadius: 8, overflow: 'hidden', background: '#fff'}}>
        <Img src={src(s.img)} style={{width: W, height: H, display: 'block'}} />
        <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{position: 'absolute', left: 0, top: 0, overflow: 'visible'}}>
          {(s.marks ?? []).map((m, i) => <MarkView key={i} m={m} W={W} H={H} i={i} />)}
        </svg>
      </div>
      {s.chip ? <Chip text={s.chip} at={0.2} /> : null}
      {s.stamp ? <StampView s={s.stamp} x="74%" y="72%" size={130} /> : null}
      {s.cap ? (
        <div style={{position: 'absolute', left: 70, bottom: 80, padding: '16px 24px', background: 'rgba(12,10,8,0.82)', borderLeft: `6px solid ${C.gold}`, opacity: prog(t, 0.5, 0.4), transform: `translateX(${(1 - prog(t, 0.5, 0.4)) * -40}px)`}}>
          <div style={{fontFamily: 'Inter, sans-serif', fontWeight: 800, fontSize: 24, color: C.gold, letterSpacing: 3, textTransform: 'uppercase'}}>{s.cap[0]}</div>
          <div style={{fontFamily: 'Inter, sans-serif', fontWeight: 500, fontSize: 40, color: C.ink}} dangerouslySetInnerHTML={{__html: s.cap[1]}} />
        </div>
      ) : null}
      {s.credit ? <div style={{position: 'absolute', right: 30, bottom: 22, fontFamily: 'Inter, sans-serif', fontSize: 18, color: 'rgba(255,255,255,0.6)'}}>{s.credit}</div> : null}
    </Desk>
  );
};

// ---------- claim: the other side's clip in a frame, quote, verdict ----------
const Claim: React.FC<{s: ClaimSpec}> = ({s}) => {
  const {t, fps} = useT();
  const enter = prog(t, 0, 0.6);
  const v = s.verdict;
  const after = v ? prog(t, v.at, 0.4) : 0;
  const words = s.quote.split(' ');
  const qa = s.quoteAt ?? 0.4;
  const shown = Math.floor(interpolate(t, [qa, qa + Math.max(0.8, words.length * 0.12)], [0, words.length], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'}));
  return (
    <Desk>
      <div style={{position: 'absolute', left: 90, top: 150, width: 1020, height: 574, borderRadius: 22, overflow: 'hidden', border: '3px solid rgba(255,255,255,0.15)',
        boxShadow: '0 30px 90px rgba(0,0,0,0.75)', transform: `perspective(1600px) rotateY(${(1 - enter) * 18 + 6}deg) scale(${0.92 + enter * 0.08})`, opacity: enter,
        filter: `grayscale(${after}) brightness(${1 - after * 0.35})`}}>
        <OffthreadVideo src={src(s.clip)} startFrom={Math.round((s.from ?? 0) * fps)} muted style={{width: '100%', height: '100%', objectFit: 'cover'}} />
        <div style={{position: 'absolute', left: 22, top: 20, background: C.red, color: '#fff', fontWeight: 900, fontSize: 26, padding: '6px 16px', borderRadius: 8, letterSpacing: 3}}>DAAVA</div>
      </div>
      <div style={{position: 'absolute', left: 92, top: 760, color: C.gold, fontWeight: 700, fontSize: 28, letterSpacing: 1.5, opacity: prog(t, 0.3)}}>{s.who}</div>
      <div style={{position: 'absolute', left: 1170, top: 170, width: 670, fontFamily: 'Serif', fontSize: 64, lineHeight: 1.18}}>
        <span style={{color: C.gold, fontSize: 120, lineHeight: 0.5, display: 'block', marginBottom: 10}}>&ldquo;</span>
        {words.slice(0, shown).join(' ')}
      </div>
      {v ? <StampView s={v} x="66%" y="74%" size={140} /> : null}
    </Desk>
  );
};

// ---------- donut: breakdown of a total ----------
const Donut: React.FC<{s: DonutSpec}> = ({s}) => {
  const {t} = useT();
  const total = s.slices.reduce((a, b) => a + b.v, 0);
  const R = 300, cx = 560, cy = 560, sw = 120;
  let acc = 0;
  return (
    <Desk>
      <div style={{position: 'absolute', left: 120, top: 70, fontFamily: 'Serif', fontSize: 70, opacity: prog(t, 0)}} dangerouslySetInnerHTML={{__html: s.title}} />
      <svg width={1120} height={1120} style={{position: 'absolute', left: 60, top: 40, transform: 'scale(0.82)', transformOrigin: '0 0'}}>
        <circle cx={cx} cy={cy} r={R} fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth={sw} />
        {s.slices.map((sl, i) => {
          const frac = sl.v / total, start = acc;
          acc += frac;
          const p = prog(t, sl.at, 0.8);
          const len = 2 * Math.PI * R;
          return <circle key={i} cx={cx} cy={cy} r={R} fill="none" stroke={col(sl.c)} strokeWidth={sw} strokeDasharray={`${len * frac * p} ${len}`}
            transform={`rotate(${start * 360 - 90} ${cx} ${cy})`} />;
        })}
        <text x={cx} y={cy - 10} textAnchor="middle" fill={C.ink} style={{fontFamily: 'Serif', fontSize: 110}}>{s.total}</text>
        {s.sub ? <text x={cx} y={cy + 70} textAnchor="middle" fill={C.gold} style={{fontFamily: 'Inter', fontWeight: 700, fontSize: 34}}>{s.sub}</text> : null}
      </svg>
      {s.slices.map((sl, i) => {
        const p = prog(t, sl.at + 0.3, 0.4);
        return (
          <div key={i} style={{position: 'absolute', left: 1080, top: 300 + i * 190, opacity: p, transform: `translateX(${(1 - p) * 60}px)`, display: 'flex', alignItems: 'center', gap: 30}}>
            <div style={{width: 34, height: 34, borderRadius: 8, background: col(sl.c)}} />
            <div>
              <div style={{fontFamily: 'Serif', fontSize: 74}}>{sl.v} cr</div>
              <div style={{fontSize: 34, fontWeight: 600, opacity: 0.85}} dangerouslySetInnerHTML={{__html: sl.label}} />
            </div>
          </div>
        );
      })}
      {s.credit ? <div style={{position: 'absolute', left: 120, bottom: 50, fontSize: 24, opacity: 0.6}}>{s.credit}</div> : null}
    </Desk>
  );
};

// ---------- dates: a dated timeline, then the claim crossed out and the real gap ----------
const Dates: React.FC<{s: DatesSpec}> = ({s}) => {
  const {t} = useT();
  const n = s.items.length, x0 = 220, x1 = 1700, y = 520;
  const lineP = prog(t, s.items[0]?.at ?? 0, (s.items[n - 1]?.at ?? 1) - (s.items[0]?.at ?? 0) + 0.3);
  return (
    <Desk>
      <div style={{position: 'absolute', left: 120, top: 80, fontFamily: 'Serif', fontSize: 70, opacity: prog(t, 0)}} dangerouslySetInnerHTML={{__html: s.title}} />
      <div style={{position: 'absolute', left: x0, top: y, height: 6, width: (x1 - x0) * lineP, background: C.gold, borderRadius: 3}} />
      {s.items.map((it, i) => {
        const x = x0 + ((x1 - x0) * i) / Math.max(1, n - 1), p = prog(t, it.at, 0.4);
        return (
          <div key={i} style={{position: 'absolute', left: x, top: y + 3, transform: `translate(-50%,-50%) scale(${0.6 + p * 0.4})`, opacity: p, textAlign: 'center', width: 420}}>
            <div style={{fontFamily: 'Serif', fontSize: 58, color: C.gold, marginBottom: 70}}>{it.date}</div>
            <div style={{width: 34, height: 34, borderRadius: 17, background: C.gold, margin: '0 auto', boxShadow: `0 0 30px ${C.gold}`}} />
            <div style={{fontSize: 34, fontWeight: 600, marginTop: 40}} dangerouslySetInnerHTML={{__html: it.text}} />
          </div>
        );
      })}
      {s.claim ? (
        <div style={{position: 'absolute', left: 420, top: 820, fontFamily: 'Bang', fontSize: 120, color: C.ink, opacity: prog(t, s.claim.at, 0.3)}}>
          {s.claim.text}
          <div style={{position: 'absolute', left: -10, top: '52%', height: 14, background: C.red, borderRadius: 7, width: `${prog(t, s.claim.at + 0.6, 0.35) * 105}%`}} />
        </div>
      ) : null}
      {s.result ? <StampView s={{text: s.result.text, at: s.result.at, c: 'gold'}} x="70%" y="85%" size={120} /> : null}
      {s.credit ? <div style={{position: 'absolute', right: 70, bottom: 30, fontSize: 24, opacity: 0.6}}>{s.credit}</div> : null}
    </Desk>
  );
};

// ---------- law: statute text types in, key words get highlighted ----------
const Law: React.FC<{s: LawSpec}> = ({s}) => {
  const {t} = useT();
  // text uses [[...]] around phrases to highlight; marks[i] is when phrase i lights up
  const parts = s.text.split(/(\[\[.*?\]\])/);
  let k = -1;
  const typed = prog(t, 0.3, 1.2);
  return (
    <Desk>
      <div style={{position: 'absolute', left: 160, top: '50%', right: 160, background: '#f4efe2', borderRadius: 10, boxShadow: '0 30px 90px rgba(0,0,0,0.7)',
        padding: '70px 90px 90px', color: '#1d1a14', transform: `translateY(calc(-50% + ${(1 - prog(t, 0, 0.6)) * 60}px))`, opacity: prog(t, 0, 0.5)}}>
        <div style={{fontWeight: 800, letterSpacing: 3, fontSize: 30, color: '#7a5a16', marginBottom: 36}}>{s.head}</div>
        <div style={{fontFamily: 'Serif', fontSize: 54, lineHeight: 1.45, clipPath: `inset(0 0 ${(1 - typed) * 100}% 0)`}}>
          {parts.map((p, i) => {
            if (!p.startsWith('[[')) return <span key={i}>{p}</span>;
            k += 1;
            const hp = prog(t, s.marks[k] ?? 99, 0.45);
            return (
              <span key={i} style={{background: `linear-gradient(90deg, ${C.marker}cc ${hp * 100}%, transparent ${hp * 100}%)`, borderRadius: 6, padding: '0 4px', fontWeight: hp > 0 ? 400 : 400}}>
                {p.slice(2, -2)}
              </span>
            );
          })}
        </div>
        {s.credit ? <div style={{position: 'absolute', bottom: 34, left: 90, fontSize: 24, color: '#6b6457'}}>{s.credit}</div> : null}
      </div>
      {s.stamp ? <StampView s={s.stamp} x="76%" y="78%" size={120} /> : null}
    </Desk>
  );
};

// ---------- score: the scorecard of all verdicts ----------
const Score: React.FC<{s: ScoreSpec}> = ({s}) => {
  const {t} = useT();
  const half = Math.ceil(s.rows.length / 2);
  return (
    <Desk>
      <div style={{position: 'absolute', left: 120, top: 60, fontFamily: 'Serif', fontSize: 72, opacity: prog(t, 0)}} dangerouslySetInnerHTML={{__html: s.title}} />
      {s.rows.map((r, i) => {
        const p = prog(t, r.at, 0.35), colI = i < half ? 0 : 1, row = i < half ? i : i - half;
        return (
          <div key={i} style={{position: 'absolute', left: 120 + colI * 860, top: 220 + row * 150, width: 800, height: 120, display: 'flex', alignItems: 'center',
            background: 'rgba(255,255,255,0.05)', borderLeft: `8px solid ${col(r.c)}`, borderRadius: 12, padding: '0 28px', opacity: p, transform: `translateX(${(1 - p) * 50}px)`}}>
            <div style={{fontFamily: 'Serif', fontSize: 50, color: C.gold, width: 70}}>{i + 1}</div>
            <div style={{flex: 1, fontSize: 32, fontWeight: 600}} dangerouslySetInnerHTML={{__html: r.claim}} />
            <div style={{fontFamily: 'Bang', fontSize: 46, color: col(r.c), letterSpacing: 2, transform: `scale(${interpolate(p, [0.6, 1], [1.8, 1], {extrapolateLeft: 'clamp'})})`}}>{r.verdict}</div>
          </div>
        );
      })}
    </Desk>
  );
};

// ---------- kinetic: big words slamming in (hooks) ----------
const Kinetic: React.FC<{s: KineticSpec}> = ({s}) => {
  const {t, f, fps} = useT();
  const last = [...s.lines].reverse().find((l) => l.hit && t >= l.at && t < l.at + 0.3);
  const sh = last ? 1 - (t - last.at) / 0.3 : 0;
  return (
    <Desk>
      {s.bg ? <AbsoluteFill style={{opacity: 0.35}}><Img src={src(s.bg)} style={{width: '100%', height: '100%', objectFit: 'cover', filter: 'grayscale(1) blur(2px)'}} /></AbsoluteFill> : null}
      <AbsoluteFill style={{transform: `translate(${noise2D('kx', t * 40, 0) * 14 * sh}px, ${noise2D('ky', 0, t * 40) * 14 * sh}px)`, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 10}}>
        {s.lines.map((l, i) => {
          if (t < l.at) return null;
          const k = spring({frame: f - l.at * fps, fps, config: {damping: 13, stiffness: 200}});
          return (
            <div key={i} style={{fontFamily: 'Bang', fontSize: l.size ?? 150, color: col(l.c ?? '#f3efe6'), letterSpacing: 4, lineHeight: 1,
              transform: `scale(${interpolate(k, [0, 1], [1.9, 1])})`, opacity: Math.min(1, k * 1.5), textShadow: '0 8px 40px rgba(0,0,0,0.6)'}}
              dangerouslySetInnerHTML={{__html: l.text}} />
          );
        })}
      </AbsoluteFill>
      {last || s.lines.some((l) => l.hit && t >= l.at && t < l.at + 0.08) ? <AbsoluteFill style={{background: '#fff', opacity: Math.max(0, sh - 0.6)}} /> : null}
      {s.stamp ? <StampView s={s.stamp} x="50%" y="78%" size={120} /> : null}
    </Desk>
  );
};


// ---------- side: the speaker in a column beside any other kind (side-by-side narration) ----------
const Side: React.FC<{s: SideSpec}> = ({s}) => {
  const {t, fps} = useT();
  const {width, height} = useVideoConfig();
  const colW = 700, gap = 0, k = (width - colW - gap) / width;   // inner shot scaled into the rest of the frame
  const left = (s.side ?? 'left') === 'left';
  const enter = prog(t, 0, 0.5);
  return (
    <AbsoluteFill style={{background: C.bg}}>
      <Fonts />
      <div style={{position: 'absolute', top: 0, width: colW, height, [left ? 'left' : 'right']: 0, overflow: 'hidden',
        transform: `translateX(${(1 - enter) * (left ? -60 : 60)}px)`, opacity: enter}}>
        <OffthreadVideo src={src(s.cam)} startFrom={Math.round((s.camFrom ?? 0) * fps)} muted
          style={{width: '100%', height: '100%', objectFit: 'cover', objectPosition: s.camPos ?? '56% 40%'}} />
        <AbsoluteFill style={{background: left ? 'linear-gradient(90deg, transparent 75%, rgba(11,13,18,0.85))' : 'linear-gradient(270deg, transparent 75%, rgba(11,13,18,0.85))'}} />
      </div>
      <div style={{position: 'absolute', top: 0, height, width: 4, [left ? 'left' : 'right']: colW, background: C.gold, opacity: 0.7 * enter}} />
      <div style={{position: 'absolute', [left ? 'left' : 'right']: colW + gap, top: (height - height * k) / 2, width, height, transform: `scale(${k})`, transformOrigin: '0 0'}}>
        <Proof spec={s.inner} />
      </div>
    </AbsoluteFill>
  );
};

export const Proof: React.FC<{spec: ProofSpec}> = ({spec}) => {
  switch (spec.kind) {
    case 'doc': return <Doc s={spec} />;
    case 'claim': return <Claim s={spec} />;
    case 'donut': return <Donut s={spec} />;
    case 'dates': return <Dates s={spec} />;
    case 'law': return <Law s={spec} />;
    case 'score': return <Score s={spec} />;
    case 'kinetic': return <Kinetic s={spec} />;
    case 'side': return <Side s={spec} />;
    default: return <Desk><div style={{fontSize: 60, padding: 80}}>Unknown kind</div></Desk>;
  }
};

export const proofMetadata: CalculateMetadataFunction<{spec: ProofSpec}> = ({props}) => ({
  durationInFrames: Math.max(1, Math.round((props.spec?.dur ?? 3) * 30)),
});

export const DEMO: ProofSpec = {
  kind: 'kinetic', dur: 3, lines: [{text: '13 CRORE?', at: 0.2, hit: true, c: 'gold'}, {text: 'ILLEGAL?', at: 1.0, hit: true}], stamp: {text: 'FACT CHECK', at: 1.8, c: 'red'},
};
