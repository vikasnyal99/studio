import React from 'react';
import {AbsoluteFill, CalculateMetadataFunction, Easing, Img, Sequence, interpolate, random, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';

// Fast motion-graphics hook (social media -> history). A list of beats, each a few seconds, hard/flash cuts:
//   feed    phone with a fast-scrolling generic feed (no real people or posts), view counter ticking, hashtag
//   stamp   rubber stamp slammed onto a picture/texture
//   ticker  generic headline strips stacking in (no outlet names)
//   memes   wall of blank meme cards flying in with captions
//   glitch  RGB-split glitch with a word
//   rewind  year counter running backwards while real pictures fly past
//   docs    real document pages fanning out on a desk with a highlight sweep
//   pics    real pictures popping in as framed cards (2-4), each with a small label
// Every beat can carry `slam` (big kinetic word) and `flash` (white flash on entry).
// Render: node scripts/hook.mjs <spec.json> [--still] [--deliver <video> <name>]

type Beat = {
  t: number;
  kind: 'feed' | 'stamp' | 'ticker' | 'memes' | 'glitch' | 'rewind' | 'docs' | 'pics' | 'art' | 'words' | 'thumbs' | 'headlines' | 'split';
  slam?: {text: string; sub?: string; at?: number; color?: string};
  flash?: boolean;
  tag?: string; views?: [number, number]; // feed
  text?: string; sub?: string; bg?: string; // stamp / glitch
  items?: string[]; // ticker headlines / memes captions
  from?: number; to?: number; imgs?: string[]; labels?: string[]; // rewind / docs / pics
  img?: string; lines?: string[]; // art (picture + serif lines), words (serif lines), split (imgs[0..1] + labels)
};
export type HookSpec = {end: number; beats: Beat[]; cinema?: boolean}; // cinema: letterbox bars + film grade

const C = {ink: '#f3efe6', gold: '#e8b34b', red: '#e0483c', blue: '#3a8dde', bg: '#0b0d12'};
const src = (p: string) => (/^https?:/.test(p) ? p : staticFile(p));
const ease = Easing.out(Easing.cubic);
const useT = () => {
  const f = useCurrentFrame();
  const {fps} = useVideoConfig();
  return {t: f / fps, f};
};
const fmt = (n: number) => (n >= 1e6 ? (n / 1e6).toFixed(1) + 'M' : n >= 1e3 ? Math.round(n / 1e3) + 'K' : String(Math.round(n)));

const Grain: React.FC = () => {
  const {f} = useT();
  return (
    <AbsoluteFill style={{opacity: 0.08, mixBlendMode: 'overlay', backgroundImage: `repeating-radial-gradient(circle at ${(f * 37) % 100}% ${(f * 53) % 100}%, #fff 0 1px, transparent 1px 3px)`}} />
  );
};

const Slam: React.FC<{s: NonNullable<Beat['slam']>}> = ({s}) => {
  const {t} = useT();
  const a = t - (s.at ?? 0);
  if (a < 0) return null;
  const sc = interpolate(a, [0, 0.12, 0.22], [2.2, 0.94, 1], {extrapolateRight: 'clamp'});
  const op = interpolate(a, [0, 0.08], [0, 1], {extrapolateRight: 'clamp'});
  return (
    <AbsoluteFill style={{justifyContent: 'center', alignItems: 'center', pointerEvents: 'none'}}>
      <div style={{transform: `scale(${sc}) rotate(-2deg)`, opacity: op, textAlign: 'center'}}>
        <div style={{fontFamily: 'Inter, sans-serif', fontWeight: 900, fontSize: 150, color: s.color ?? C.ink, textTransform: 'uppercase', letterSpacing: -2, textShadow: '0 10px 40px rgba(0,0,0,.8), 0 0 2px #000', lineHeight: 1}}>{s.text}</div>
        {s.sub ? <div style={{marginTop: 18, display: 'inline-block', background: C.gold, color: '#111', fontFamily: 'Inter, sans-serif', fontWeight: 800, fontSize: 44, padding: '6px 22px'}}>{s.sub}</div> : null}
      </div>
    </AbsoluteFill>
  );
};

const Feed: React.FC<{b: Beat}> = ({b}) => {
  const {t} = useT();
  const scroll = t * 900;
  const posts = Array.from({length: 14}, (_, i) => i);
  const [v0, v1] = b.views ?? [12000, 2400000];
  const views = interpolate(t, [0, 2.5], [v0, v1], {extrapolateRight: 'clamp', easing: Easing.in(Easing.quad)});
  const tilt = interpolate(t, [0, 3], [-8, -3]);
  return (
    <AbsoluteFill style={{background: 'radial-gradient(circle at 50% 40%, #1b2840, #07090e)'}}>
      {/* background echo of the feed */}
      <AbsoluteFill style={{filter: 'blur(18px)', opacity: 0.35, transform: 'scale(1.3)'}}>
        {posts.map((i) => (
          <div key={i} style={{position: 'absolute', left: 200 + (i % 4) * 420, top: ((i * 260 - scroll * 0.5) % 1400) + 0, width: 360, height: 220, borderRadius: 20, background: ['#e0483c', '#3a8dde', '#e8b34b', '#8a3fa0'][i % 4]}} />
        ))}
      </AbsoluteFill>
      <div style={{position: 'absolute', left: 960 - 230, top: 60, width: 460, height: 960, borderRadius: 54, background: '#0d0f14', border: '10px solid #2a2e38', overflow: 'hidden', transform: `perspective(1600px) rotateY(${tilt}deg) rotateZ(${tilt / 3}deg)`, boxShadow: '0 40px 120px rgba(0,0,0,.8)'}}>
        {posts.map((i) => {
          const y = ((i * 300 - scroll) % (14 * 300) + 14 * 300) % (14 * 300) - 300;
          return (
            <div key={i} style={{position: 'absolute', left: 16, top: y, width: 408, height: 280, borderRadius: 18, background: '#171b24', padding: 14, boxSizing: 'border-box'}}>
              <div style={{display: 'flex', alignItems: 'center', gap: 10}}>
                <div style={{width: 40, height: 40, borderRadius: '50%', background: ['#e0483c', '#3a8dde', '#e8b34b', '#4caf7a'][i % 4]}} />
                <div style={{height: 12, width: 120 + random(`w${i}`) * 100, borderRadius: 6, background: '#3a4150'}} />
              </div>
              <div style={{marginTop: 12, height: 150, borderRadius: 12, background: `linear-gradient(135deg, ${['#2b3a55', '#4a2b2b', '#2b4a3a', '#45392a'][i % 4]}, #111)`, display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
                <div style={{width: 0, height: 0, borderLeft: '34px solid rgba(255,255,255,.85)', borderTop: '22px solid transparent', borderBottom: '22px solid transparent'}} />
              </div>
              <div style={{marginTop: 10, display: 'flex', gap: 14, color: '#9aa3b5', fontFamily: 'Inter, sans-serif', fontSize: 18, fontWeight: 700}}>
                <span>♥ {fmt(views * (0.2 + random(`l${i}`) * 0.3))}</span><span>💬 {fmt(views * 0.02 * (1 + random(`c${i}`)))}</span><span>↗ {fmt(views * 0.05)}</span>
              </div>
            </div>
          );
        })}
      </div>
      {b.tag ? (
        <div style={{position: 'absolute', left: 1250, top: 300, fontFamily: 'Inter, sans-serif', fontWeight: 900, fontSize: 64, color: '#fff', background: C.red, padding: '8px 24px', borderRadius: 10, transform: `rotate(4deg) scale(${interpolate(t, [0.1, 0.3], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.out(Easing.back(2))})})`}}>
          {b.tag}
        </div>
      ) : null}
      <div style={{position: 'absolute', left: 1250, top: 420, fontFamily: 'Inter, sans-serif', fontWeight: 900, fontSize: 96, color: C.ink, textShadow: '0 6px 24px #000'}}>
        {fmt(views)} <span style={{fontSize: 44, color: '#9aa3b5'}}>views</span>
      </div>
      {[0, 1, 2, 3, 4, 5].map((i) => {
        const a = (t * 1.3 + i / 6) % 1;
        return <div key={'h' + i} style={{position: 'absolute', left: 1180 + random(`hx${i}`) * 120, top: 900 - a * 700, fontSize: 54, opacity: 1 - a, transform: `scale(${0.6 + a})`}}>{['❤️', '🔥', '😡', '👎', '😂', '⚠️'][i]}</div>;
      })}
    </AbsoluteFill>
  );
};

const Stamp: React.FC<{b: Beat}> = ({b}) => {
  const {t} = useT();
  const a = t - 0.25;
  const sc = interpolate(a, [0, 0.1, 0.2], [3, 0.9, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const shake = a > 0 && a < 0.35 ? Math.sin(a * 120) * 14 * (1 - a / 0.35) : 0;
  return (
    <AbsoluteFill style={{background: C.bg, transform: `translate(${shake}px, ${shake * 0.6}px)`}}>
      {b.bg ? <Img src={src(b.bg)} style={{position: 'absolute', width: '100%', height: '100%', objectFit: 'cover', filter: 'grayscale(0.85) contrast(1.1) brightness(0.55)', transform: `scale(${1.05 + t * 0.03})`}} /> : null}
      <AbsoluteFill style={{justifyContent: 'center', alignItems: 'center'}}>
        <div style={{opacity: a > 0 ? 1 : 0, transform: `scale(${sc}) rotate(-8deg)`, border: `12px solid ${C.red}`, padding: '10px 50px', color: C.red, fontFamily: 'Inter, sans-serif', fontWeight: 900, fontSize: 170, letterSpacing: 6, textTransform: 'uppercase', mixBlendMode: 'screen', textShadow: '0 0 1px #000'}}>
          {b.text}
        </div>
        {b.sub ? <div style={{marginTop: 30, fontFamily: 'Inter, sans-serif', fontWeight: 800, fontSize: 48, color: C.ink, opacity: interpolate(t, [0.6, 0.9], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'})}}>{b.sub}</div> : null}
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

const Ticker: React.FC<{b: Beat}> = ({b}) => {
  const {t} = useT();
  const items = b.items ?? [];
  return (
    <AbsoluteFill style={{background: 'linear-gradient(180deg,#120d0d,#05060a)'}}>
      {items.map((txt, i) => {
        const at = 0.15 + i * 0.55;
        const x = interpolate(t, [at, at + 0.3], [-2000, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: ease});
        return (
          <div key={i} style={{position: 'absolute', left: 120 + x, top: 230 + i * 190, display: 'flex', alignItems: 'stretch', transform: `rotate(${(i % 2 ? 1 : -1) * 1.2}deg)`}}>
            <div style={{background: C.red, color: '#fff', fontFamily: 'Inter, sans-serif', fontWeight: 900, fontSize: 40, padding: '18px 24px'}}>TRENDING</div>
            <div style={{background: '#f3efe6', color: '#111', fontFamily: 'Inter, sans-serif', fontWeight: 800, fontSize: 64, padding: '10px 34px', textTransform: 'uppercase'}}>{txt}</div>
          </div>
        );
      })}
      <div style={{position: 'absolute', left: 0, right: 0, bottom: 60, height: 70, background: C.red, overflow: 'hidden'}}>
        <div style={{whiteSpace: 'nowrap', fontFamily: 'Inter, sans-serif', fontWeight: 800, fontSize: 40, color: '#fff', lineHeight: '70px', transform: `translateX(${-t * 500}px)`}}>
          {Array.from({length: 6}, () => items.join('  •  ') + '  •  ').join('')}
        </div>
      </div>
    </AbsoluteFill>
  );
};

const Memes: React.FC<{b: Beat}> = ({b}) => {
  const {t} = useT();
  const caps = b.items ?? [];
  return (
    <AbsoluteFill style={{background: '#0a0a0c'}}>
      {Array.from({length: 12}, (_, i) => {
        const at = i * 0.18;
        const p = interpolate(t, [at, at + 0.25], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.out(Easing.back(1.6))});
        const col = i % 4;
        const row = Math.floor(i / 4);
        return (
          <div key={i} style={{position: 'absolute', left: 60 + col * 460, top: 50 + row * 340, width: 420, height: 310, background: '#1c1f27', border: '6px solid #fff', transform: `scale(${p}) rotate(${(random(`r${i}`) - 0.5) * 10}deg)`, opacity: p > 0 ? 1 : 0, boxShadow: '0 20px 40px rgba(0,0,0,.7)'}}>
            <div style={{position: 'absolute', inset: 40, background: `linear-gradient(135deg, ${['#e0483c', '#3a8dde', '#e8b34b', '#8a3fa0', '#21a366', '#ff7a00'][i % 6]}, #15171c)`}} />
            <div style={{position: 'absolute', left: 0, right: 0, top: 95, textAlign: 'center', fontSize: 110, transform: `rotate(${Math.sin(t * 6 + i) * 8}deg) scale(${1 + Math.abs(Math.sin(t * 4 + i)) * 0.08})`}}>{['😂', '🤡', '🔥', '😡', '🙄', '💀'][i % 6]}</div>
            <div style={{position: 'absolute', top: 8, left: 0, right: 0, textAlign: 'center', fontFamily: 'Impact, Inter, sans-serif', fontWeight: 900, fontSize: 38, color: '#fff', WebkitTextStroke: '2px #000', textTransform: 'uppercase'}}>{caps[i % Math.max(1, caps.length)]}</div>
            <div style={{position: 'absolute', bottom: 8, left: 0, right: 0, textAlign: 'center', fontFamily: 'Impact, Inter, sans-serif', fontWeight: 900, fontSize: 32, color: '#fff', WebkitTextStroke: '2px #000'}}>#{['meme', 'viral', 'trend', 'lol'][i % 4]}</div>
          </div>
        );
      })}
    </AbsoluteFill>
  );
};

const Glitch: React.FC<{b: Beat}> = ({b}) => {
  const {t, f} = useT();
  const j = (k: string) => (random(`${k}${Math.floor(f / 2)}`) - 0.5) * 40;
  return (
    <AbsoluteFill style={{background: '#000', justifyContent: 'center', alignItems: 'center'}}>
      {b.bg ? <Img src={src(b.bg)} style={{position: 'absolute', width: '100%', height: '100%', objectFit: 'cover', opacity: 0.5, transform: `translateX(${j('bx')}px)`}} /> : null}
      {[['#ff2d55', -1], ['#00e5ff', 1], ['#fff', 0]].map(([c, d], i) => (
        <div key={i} style={{position: 'absolute', fontFamily: 'Inter, sans-serif', fontWeight: 900, fontSize: 170, color: c as string, mixBlendMode: i < 2 ? 'screen' : 'normal', transform: `translate(${(d as number) * (6 + Math.abs(j('d')) / 3)}px, ${j('y' + i) / 6}px)`, textTransform: 'uppercase'}}>
          {b.text}
        </div>
      ))}
      {Array.from({length: 7}, (_, i) => (
        <div key={'s' + i} style={{position: 'absolute', left: 0, right: 0, top: random(`gy${i}${Math.floor(f / 3)}`) * 1080, height: 6 + random(`gh${i}`) * 30, background: 'rgba(255,255,255,0.12)', transform: `translateX(${j('sx' + i) * 3}px)`}} />
      ))}
      {b.sub ? <div style={{position: 'absolute', bottom: 200, fontFamily: 'Inter, sans-serif', fontWeight: 800, fontSize: 46, color: C.gold, opacity: interpolate(t, [0.3, 0.6], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'})}}>{b.sub}</div> : null}
    </AbsoluteFill>
  );
};

const Rewind: React.FC<{b: Beat; dur: number}> = ({b, dur}) => {
  const {t} = useT();
  const year = Math.round(interpolate(t, [0, dur * 0.85], [b.from ?? 2026, b.to ?? 800], {extrapolateRight: 'clamp', easing: Easing.inOut(Easing.cubic)}));
  const imgs = b.imgs ?? [];
  return (
    <AbsoluteFill style={{background: 'radial-gradient(circle at 50% 50%, #3a2a16, #0b0805)'}}>
      {imgs.map((im, i) => {
        const at = (i / imgs.length) * dur * 0.8;
        const a = t - at;
        if (a < 0 || a > 1.6) return null;
        const side = i % 2 ? 1 : -1;
        const x = interpolate(a, [0, 1.6], [side * 900, side * -200]);
        const sc = interpolate(a, [0, 1.6], [0.5, 1.25]);
        return (
          <div key={i} style={{position: 'absolute', left: 960 - 320 + x, top: 540 - 220 + (i % 3 - 1) * 120, width: 640, height: 440, transform: `scale(${sc}) rotate(${side * 6}deg)`, opacity: interpolate(a, [0, 0.2, 1.3, 1.6], [0, 1, 1, 0]), border: '10px solid #f3efe6', boxShadow: '0 30px 80px rgba(0,0,0,.8)', background: '#222'}}>
            <Img src={src(im)} style={{width: '100%', height: '100%', objectFit: 'cover'}} />
          </div>
        );
      })}
      {/* speed streaks */}
      {Array.from({length: 18}, (_, i) => {
        const a = (t * 2.2 + random(`st${i}`)) % 1;
        return <div key={'st' + i} style={{position: 'absolute', top: random(`sy${i}`) * 1080, left: 1920 - a * 2600, width: 300, height: 3, background: 'rgba(255,220,160,0.35)'}} />;
      })}
      <AbsoluteFill style={{justifyContent: 'center', alignItems: 'center'}}>
        <div style={{fontFamily: '"DM Serif Display", serif', fontSize: 260, color: '#ffd27a', textShadow: '0 10px 40px #000', letterSpacing: 4}}>{year}</div>
        {b.text ? <div style={{fontFamily: 'Inter, sans-serif', fontWeight: 800, fontSize: 50, color: C.ink, textShadow: '0 4px 14px #000', opacity: interpolate(t, [dur * 0.6, dur * 0.8], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'})}}>{b.text}</div> : null}
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

const Docs: React.FC<{b: Beat}> = ({b}) => {
  const {t} = useT();
  const imgs = b.imgs ?? [];
  return (
    <AbsoluteFill style={{background: 'radial-gradient(circle at 50% 40%, #2b2218, #0a0806)'}}>
      {imgs.map((im, i) => {
        const at = i * 0.35;
        const p = interpolate(t, [at, at + 0.45], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: ease});
        const n = imgs.length;
        const rot = (i - (n - 1) / 2) * 9;
        const x = (i - (n - 1) / 2) * 330;
        return (
          <div key={i} style={{position: 'absolute', left: 960 - 260 + x * p, top: 120 + (1 - p) * 700, width: 520, height: 760, transform: `rotate(${rot * p}deg) scale(${1 + t * 0.02})`, background: '#fff', boxShadow: '0 30px 80px rgba(0,0,0,.8)', overflow: 'hidden'}}>
            <Img src={src(im)} style={{width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'top'}} />
            {b.labels?.[i] ? <div style={{position: 'absolute', left: 0, right: 0, bottom: 0, background: 'rgba(10,8,6,.85)', color: C.gold, fontFamily: 'Inter, sans-serif', fontWeight: 800, fontSize: 24, padding: '10px 14px'}}>{b.labels[i]}</div> : null}
          </div>
        );
      })}
    </AbsoluteFill>
  );
};

const Pics: React.FC<{b: Beat}> = ({b}) => {
  const {t} = useT();
  const imgs = b.imgs ?? [];
  const n = imgs.length;
  const w = n <= 2 ? 820 : n === 3 ? 560 : 430;
  return (
    <AbsoluteFill style={{background: 'radial-gradient(circle at 50% 45%, #1c2230, #06070a)'}}>
      {imgs.map((im, i) => {
        const at = i * 0.3;
        const p = interpolate(t, [at, at + 0.35], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.out(Easing.back(1.5))});
        const x = 960 - (n * (w + 40)) / 2 + i * (w + 40);
        return (
          <div key={i} style={{position: 'absolute', left: x, top: 230 + (i % 2) * 60, width: w, height: w * 0.72, transform: `scale(${p}) rotate(${(i % 2 ? 2 : -2) + Math.sin(t * 1.5 + i) * 0.8}deg)`, border: '8px solid #f3efe6', boxShadow: '0 30px 80px rgba(0,0,0,.8)', background: '#222'}}>
            <Img src={src(im)} style={{width: '100%', height: '100%', objectFit: 'cover', transform: `scale(${1.05 + t * 0.03})`}} />
            {b.labels?.[i] ? <div style={{position: 'absolute', left: -8, bottom: -56, background: C.gold, color: '#111', fontFamily: 'Inter, sans-serif', fontWeight: 800, fontSize: 26, padding: '6px 14px'}}>{b.labels[i]}</div> : null}
          </div>
        );
      })}
    </AbsoluteFill>
  );
};


// ---------- serious documentary beats (31 Oct: the playful feed/memes/glitch look did not match the tone) ----------
const SERIF = '"DM Serif Display", serif';
const Dark: React.FC<{children?: React.ReactNode}> = ({children}) => (
  <AbsoluteFill style={{background: 'radial-gradient(ellipse at 50% 45%, #1b1813 0%, #08070a 75%)'}}>{children}</AbsoluteFill>
);
const Lines: React.FC<{lines: string[]; at?: number; size?: number; align?: 'center' | 'left'}> = ({lines, at = 0.2, size = 92, align = 'center'}) => {
  const {t} = useT();
  return (
    <div style={{display: 'flex', flexDirection: 'column', alignItems: align === 'center' ? 'center' : 'flex-start', gap: 10}}>
      {lines.map((l, i) => {
        const p = interpolate(t, [at + i * 0.45, at + i * 0.45 + 0.6], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: ease});
        return (
          <div key={i} style={{fontFamily: i === 0 ? SERIF : 'Inter, sans-serif', fontWeight: i === 0 ? 400 : 600, fontSize: i === 0 ? size : size * 0.42, color: i === 0 ? C.ink : '#cbb88f',
            letterSpacing: i === 0 ? 1 : 4, textTransform: i === 0 ? 'none' : 'uppercase', opacity: p, transform: `translateY(${(1 - p) * 24}px)`, textShadow: '0 6px 30px rgba(0,0,0,.9)'}}
            dangerouslySetInnerHTML={{__html: l}} />
        );
      })}
      <div style={{height: 3, background: C.gold, width: interpolate(t, [at + 0.3, at + 1.1], [0, 240], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: ease}), marginTop: 8}} />
    </div>
  );
};
const Art: React.FC<{b: Beat; dur: number}> = ({b, dur}) => {
  const {t} = useT();
  const z = interpolate(t, [0, dur], [1.04, 1.14]);
  return (
    <Dark>
      {b.img ? <Img src={src(b.img)} style={{position: 'absolute', width: '100%', height: '100%', objectFit: 'cover', transform: `scale(${z})`, filter: 'brightness(0.62) saturate(0.85)'}} /> : null}
      <AbsoluteFill style={{background: 'linear-gradient(0deg, rgba(5,5,7,.9) 0%, rgba(5,5,7,0) 55%)'}} />
      <AbsoluteFill style={{justifyContent: 'flex-end', alignItems: 'flex-start', padding: '0 120px 120px'}}>
        <Lines lines={b.lines ?? []} align="left" size={84} />
      </AbsoluteFill>
    </Dark>
  );
};
const Words: React.FC<{b: Beat}> = ({b}) => (
  <Dark>
    <AbsoluteFill style={{opacity: 0.06, backgroundImage: 'repeating-linear-gradient(0deg, #fff 0 1px, transparent 1px 4px)'}} />
    <AbsoluteFill style={{justifyContent: 'center', alignItems: 'center', padding: 120}}><Lines lines={b.lines ?? []} size={110} /></AbsoluteFill>
  </Dark>
);
const Thumbs: React.FC<{b: Beat}> = ({b}) => {
  const {t} = useT();
  const [v0, v1] = b.views ?? [0, 0];
  const views = v1 ? interpolate(t, [0, 2.4], [v0, v1], {extrapolateRight: 'clamp', easing: Easing.in(Easing.quad)}) : 0;
  return (
    <Dark>
      <div style={{position: 'absolute', inset: -100, display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 22, transform: `translateY(${-t * 40}px) rotate(-4deg)`, opacity: 0.85, filter: 'blur(1px)'}}>
        {Array.from({length: 36}, (_, i) => (
          <div key={i} style={{aspectRatio: '16/9', borderRadius: 8, background: `linear-gradient(135deg, ${['#2a2e36', '#332a26', '#262f2a', '#2f2b33'][i % 4]}, #0e0e11)`, border: '1px solid rgba(255,255,255,.08)', display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
            <div style={{width: 0, height: 0, borderLeft: '22px solid rgba(255,255,255,.35)', borderTop: '14px solid transparent', borderBottom: '14px solid transparent'}} />
          </div>
        ))}
      </div>
      <AbsoluteFill style={{background: 'radial-gradient(ellipse at 50% 50%, rgba(8,7,10,.7) 0%, rgba(8,7,10,.2) 45%, rgba(8,7,10,.85) 90%)'}} />
      <AbsoluteFill style={{justifyContent: 'center', alignItems: 'center'}}>
        <Lines lines={b.lines ?? []} size={110} />
        {v1 ? <div style={{marginTop: 26, fontFamily: 'Inter, sans-serif', fontWeight: 600, fontSize: 40, color: '#9b9488', letterSpacing: 6}}>{fmt(views)} VIEWS</div> : null}
      </AbsoluteFill>
    </Dark>
  );
};
const Headlines: React.FC<{b: Beat}> = ({b}) => {
  const {t} = useT();
  const items = b.items ?? [];
  return (
    <AbsoluteFill style={{background: '#d9d1c0'}}>
      <AbsoluteFill style={{opacity: 0.35, backgroundImage: 'radial-gradient(circle at 30% 20%, #fff 0, transparent 40%), repeating-linear-gradient(0deg, rgba(0,0,0,.05) 0 1px, transparent 1px 3px)'}} />
      <div style={{position: 'absolute', inset: 0, transform: `scale(${1.04 + t * 0.012})`, transformOrigin: '50% 45%'}}>
        {Array.from({length: 4}, (_, c) => (
          <div key={c} style={{position: 'absolute', left: 90 + c * 450, top: 420, width: 400}}>
            {Array.from({length: 18}, (_, r) => <div key={r} style={{height: 10, margin: '12px 0', background: 'rgba(30,26,20,.28)', width: `${70 + random(`hl${c}${r}`) * 30}%`}} />)}
          </div>
        ))}
        {items.map((txt, i) => {
          const at = 0.2 + i * 0.7;
          const p = interpolate(t, [at, at + 0.5], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: ease});
          return (
            <div key={i} style={{position: 'absolute', left: 170 + i * 560, top: 150 + (i % 2) * 120, width: 500, opacity: p, transform: `translateY(${(1 - p) * 30}px)`}}>
              <div style={{fontFamily: SERIF, fontSize: 64, lineHeight: 1.05, color: '#1e1a14'}}>{txt}</div>
              <div style={{height: 4, width: 160, background: '#8a2b22', marginTop: 14}} />
            </div>
          );
        })}
      </div>
      <AbsoluteFill style={{background: 'radial-gradient(ellipse at 50% 50%, rgba(0,0,0,0) 50%, rgba(0,0,0,.55) 100%)'}} />
    </AbsoluteFill>
  );
};
const Split: React.FC<{b: Beat; dur: number}> = ({b, dur}) => {
  const {t} = useT();
  const imgs = b.imgs ?? [];
  const gap = interpolate(t, [0.2, 1.0], [0, 16], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: ease});
  return (
    <Dark>
      {[0, 1].map((k) => (
        <div key={k} style={{position: 'absolute', top: 0, bottom: 0, left: k === 0 ? 0 : 960 + gap, width: 960 - gap, overflow: 'hidden', opacity: interpolate(t, [k * 0.5, k * 0.5 + 0.6], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'})}}>
          {imgs[k] ? <Img src={src(imgs[k])} style={{width: '100%', height: '100%', objectFit: 'cover', transform: `scale(${interpolate(t, [0, dur], [1.05, 1.15])})`, filter: k === 0 ? 'brightness(0.55) saturate(0.6)' : 'brightness(0.75) sepia(0.25)'}} /> : null}
          <div style={{position: 'absolute', left: 60, bottom: 90, fontFamily: SERIF, fontSize: 58, color: C.ink, textShadow: '0 4px 20px #000', opacity: interpolate(t, [0.6 + k * 0.5, 1.2 + k * 0.5], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'})}}>{b.labels?.[k]}</div>
        </div>
      ))}
      <AbsoluteFill style={{justifyContent: 'flex-start', alignItems: 'center', paddingTop: 80}}>
        <div style={{fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: 30, letterSpacing: 8, color: '#cbb88f', opacity: interpolate(t, [1.4, 2.0], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'})}}>{b.text}</div>
      </AbsoluteFill>
    </Dark>
  );
};

const BeatView: React.FC<{b: Beat; dur: number}> = ({b, dur}) => {
  switch (b.kind) {
    case 'feed': return <Feed b={b} />;
    case 'stamp': return <Stamp b={b} />;
    case 'ticker': return <Ticker b={b} />;
    case 'memes': return <Memes b={b} />;
    case 'glitch': return <Glitch b={b} />;
    case 'rewind': return <Rewind b={b} dur={dur} />;
    case 'docs': return <Docs b={b} />;
    case 'pics': return <Pics b={b} />;
    case 'art': return <Art b={b} dur={dur} />;
    case 'words': return <Words b={b} />;
    case 'thumbs': return <Thumbs b={b} />;
    case 'headlines': return <Headlines b={b} />;
    case 'split': return <Split b={b} dur={dur} />;
  }
};

const FlashIn: React.FC = () => {
  const {f} = useT();
  return <AbsoluteFill style={{background: '#000', opacity: interpolate(f, [0, 8], [1, 0], {extrapolateRight: 'clamp'})}} />;
};

export const Hook: React.FC<{spec: HookSpec}> = ({spec}) => {
  const {fps} = useVideoConfig();
  return (
    <AbsoluteFill style={{background: C.bg}}>
      {spec.beats.map((b, i) => {
        const end = spec.beats[i + 1]?.t ?? spec.end;
        const from = Math.round(b.t * fps);
        const dur = Math.max(1, Math.round(end * fps) - from);
        return (
          <Sequence key={i} from={from} durationInFrames={dur}>
            <BeatView b={b} dur={dur / fps} />
            {b.slam ? <Slam s={b.slam} /> : null}
            {b.flash ? <FlashIn /> : null}
          </Sequence>
        );
      })}
      <Grain />
      {spec.cinema ? (
        <>
          <AbsoluteFill style={{background: 'rgba(40,25,10,0.18)', mixBlendMode: 'multiply', pointerEvents: 'none'}} />
          <div style={{position: 'absolute', left: 0, right: 0, top: 0, height: 120, background: '#000'}} />
          <div style={{position: 'absolute', left: 0, right: 0, bottom: 0, height: 120, background: '#000'}} />
        </>
      ) : null}
      <AbsoluteFill style={{background: 'radial-gradient(ellipse at 50% 50%, rgba(0,0,0,0) 60%, rgba(0,0,0,0.55) 100%)', pointerEvents: 'none'}} />
    </AbsoluteFill>
  );
};

export const hookMetadata: CalculateMetadataFunction<{spec: HookSpec}> = ({props}) => ({durationInFrames: Math.max(1, Math.round(props.spec.end * 30))});
export const HOOK_DEMO: HookSpec = {end: 3, beats: [{t: 0, kind: 'glitch', text: 'Hook'}]};
