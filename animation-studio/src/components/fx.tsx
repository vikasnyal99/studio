import React from 'react';
import {AbsoluteFill, interpolate, random, useCurrentFrame} from 'remotion';
import {noise2D} from '@remotion/noise';

// Camera shake: wraps children and jitters them between `from` and `to` frames, decaying.
export const Shake: React.FC<{
  from: number;
  duration: number;
  intensity?: number;
  children: React.ReactNode;
}> = ({from, duration, intensity = 30, children}) => {
  const frame = useCurrentFrame();
  const t = frame - from;
  const active = t >= 0 && t < duration;
  const decay = active ? 1 - t / duration : 0;
  const x = active ? noise2D('sx', t * 0.9, 0) * intensity * decay : 0;
  const y = active ? noise2D('sy', 0, t * 0.9) * intensity * decay : 0;
  const r = active ? noise2D('sr', t * 0.7, 3) * 2 * decay : 0;
  return (
    <AbsoluteFill style={{transform: `translate(${x}px, ${y}px) rotate(${r}deg)`}}>
      {children}
    </AbsoluteFill>
  );
};

// Anime "focus lines" radiating to a center point. Re-randomizes every 2 frames for a hand-drawn boil.
export const SpeedLines: React.FC<{
  color?: string;
  count?: number;
  cx?: number;
  cy?: number;
  inner?: number;
  opacity?: number;
}> = ({color = 'white', count = 90, cx = 0.5, cy = 0.5, inner = 0.28, opacity = 1}) => {
  const frame = useCurrentFrame();
  const seed = Math.floor(frame / 2);
  const lines = new Array(count).fill(0).map((_, i) => {
    const a = (i / count) * Math.PI * 2 + random(`a${i}-${seed}`) * 0.05;
    const w = 0.004 + random(`w${i}-${seed}`) * 0.012;
    const r0 = inner + random(`r${i}-${seed}`) * 0.25;
    const R = 2;
    const p = (ang: number, r: number) =>
      `${cx * 100 + Math.cos(ang) * r * 100},${cy * 100 + Math.sin(ang) * r * 100}`;
    return `M${p(a, r0)} L${p(a - w, R)} L${p(a + w, R)} Z`;
  });
  return (
    <AbsoluteFill style={{opacity}}>
      <svg viewBox="0 0 100 100" preserveAspectRatio="none" style={{width: '100%', height: '100%'}}>
        <path d={lines.join(' ')} fill={color} />
      </svg>
    </AbsoluteFill>
  );
};

// Comic impact starburst.
export const ImpactStar: React.FC<{
  start: number;
  x: number;
  y: number;
  size: number;
  color?: string;
  stroke?: string;
}> = ({start, x, y, size, color = '#ffe14d', stroke = '#111'}) => {
  const frame = useCurrentFrame();
  const t = frame - start;
  if (t < 0 || t > 14) return null;
  const s = interpolate(t, [0, 2, 14], [0.2, 1.15, 1.4]);
  const o = interpolate(t, [0, 9, 14], [1, 1, 0]);
  const spikes = 14;
  const pts = new Array(spikes * 2).fill(0).map((_, i) => {
    const a = (i / (spikes * 2)) * Math.PI * 2;
    const r = i % 2 === 0 ? 50 : 22 + random(`st${i}`) * 10;
    return `${50 + Math.cos(a) * r},${50 + Math.sin(a) * r}`;
  });
  return (
    <svg
      viewBox="0 0 100 100"
      style={{
        position: 'absolute',
        left: x - size / 2,
        top: y - size / 2,
        width: size,
        height: size,
        transform: `scale(${s}) rotate(${t * 3}deg)`,
        opacity: o,
      }}
    >
      <polygon points={pts.join(' ')} fill={color} stroke={stroke} strokeWidth={2.5} strokeLinejoin="round" />
      <polygon points={pts.join(' ')} fill="white" transform="translate(50 50) scale(0.45) translate(-50 -50)" />
    </svg>
  );
};

// Dust puffs bursting from a ground point.
export const Dust: React.FC<{start: number; x: number; y: number; spread?: number; count?: number}> = ({
  start,
  x,
  y,
  spread = 500,
  count = 22,
}) => {
  const frame = useCurrentFrame();
  const t = frame - start;
  if (t < 0 || t > 45) return null;
  return (
    <>
      {new Array(count).fill(0).map((_, i) => {
        const dir = random(`d${i}`) > 0.5 ? 1 : -1;
        const speed = 0.4 + random(`v${i}`);
        const px = x + dir * spread * speed * (1 - Math.exp(-t / 10));
        const py = y - 140 * random(`h${i}`) * (1 - Math.exp(-t / 8));
        const r = (40 + random(`r${i}`) * 70) * interpolate(t, [0, 45], [0.4, 1.6]);
        const o = interpolate(t, [0, 4, 45], [0, 0.75, 0]);
        return (
          <div
            key={i}
            style={{
              position: 'absolute',
              left: px - r / 2,
              top: py - r / 2,
              width: r,
              height: r,
              borderRadius: '50%',
              background: 'radial-gradient(circle, rgba(200,180,150,0.9), rgba(160,140,110,0))',
              opacity: o,
            }}
          />
        );
      })}
    </>
  );
};

// White/inverted flash frames used on impact.
export const Flash: React.FC<{start: number; frames?: number; color?: string}> = ({
  start,
  frames = 3,
  color = 'white',
}) => {
  const frame = useCurrentFrame();
  const t = frame - start;
  if (t < 0 || t >= frames + 4) return null;
  const o = t < frames ? 1 : interpolate(t, [frames, frames + 4], [0.7, 0]);
  return <AbsoluteFill style={{background: color, opacity: o}} />;
};

// Film grain + vignette to glue the cutouts into one image.
export const Grade: React.FC = () => {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill style={{pointerEvents: 'none'}}>
      <AbsoluteFill
        style={{background: 'radial-gradient(ellipse at center, rgba(0,0,0,0) 45%, rgba(0,0,0,0.75) 100%)'}}
      />
      <AbsoluteFill style={{opacity: 0.08, mixBlendMode: 'overlay'}}>
        <svg width="100%" height="100%">
          <filter id="grain">
            <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" seed={frame % 10} />
          </filter>
          <rect width="100%" height="100%" filter="url(#grain)" />
        </svg>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

// Bold comic sound-effect text that slams in.
export const SlamText: React.FC<{
  text: string;
  start: number;
  x: number;
  y: number;
  size: number;
  color?: string;
  rotate?: number;
  hold?: number;
}> = ({text, start, x, y, size, color = '#ffe14d', rotate = -8, hold = 30}) => {
  const frame = useCurrentFrame();
  const t = frame - start;
  if (t < 0 || t > hold) return null;
  const s = interpolate(t, [0, 3, 6], [3, 0.9, 1], {extrapolateRight: 'clamp'});
  const o = interpolate(t, [0, 1, hold - 5, hold], [0, 1, 1, 0]);
  return (
    <div
      style={{
        position: 'absolute',
        left: x,
        top: y,
        transform: `translate(-50%, -50%) rotate(${rotate}deg) scale(${s})`,
        opacity: o,
        fontFamily: 'Impact, "Anton", "Arial Black", sans-serif',
        fontSize: size,
        color,
        WebkitTextStroke: `${size / 22}px #111`,
        textShadow: `${size / 14}px ${size / 14}px 0 #111`,
        whiteSpace: 'nowrap',
        letterSpacing: 2,
      }}
    >
      {text}
    </div>
  );
};

export const HOLI = ['#ff2d8a', '#ffd400', '#21c45a', '#2f7bff', '#a23bff', '#ff7a00'];

// Holi gulal (colour powder) burst: soft clouds that puff out, drift up and fade.
export const Gulal: React.FC<{
  start: number;
  x: number;
  y: number;
  size?: number;
  colors?: string[];
  seed?: string;
}> = ({start, x, y, size = 400, colors = HOLI, seed = 'g'}) => {
  const frame = useCurrentFrame();
  const t = frame - start;
  if (t < 0 || t > 75) return null;
  const grow = 1 - Math.exp(-t / 7);
  return (
    <div style={{position: 'absolute', left: 0, top: 0, mixBlendMode: 'screen'}}>
      {new Array(16).fill(0).map((_, i) => {
        const a = random(`${seed}a${i}`) * Math.PI * 2;
        const d = size * (0.2 + random(`${seed}d${i}`) * 0.6) * grow;
        const r = size * (0.25 + random(`${seed}r${i}`) * 0.3) * (0.4 + grow);
        const o = interpolate(t, [0, 3, 75], [0, 0.85, 0]);
        const c = colors[Math.floor(random(`${seed}c${i}`) * colors.length)];
        return (
          <div
            key={i}
            style={{
              position: 'absolute',
              left: x + Math.cos(a) * d - r / 2,
              top: y + Math.sin(a) * d * 0.7 - r / 2 - t * 1.5,
              width: r,
              height: r,
              borderRadius: '50%',
              background: `radial-gradient(circle, ${c} 0%, ${c}88 40%, ${c}00 70%)`,
              opacity: o,
            }}
          />
        );
      })}
    </div>
  );
};

// Ambient floating colour powder specks across the whole frame.
export const PowderAir: React.FC<{count?: number; opacity?: number}> = ({count = 60, opacity = 0.8}) => {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill style={{pointerEvents: 'none', opacity}}>
      {new Array(count).fill(0).map((_, i) => {
        const x = ((random(`px${i}`) * 1.2 - 0.1) * 100 + Math.sin(frame * 0.02 + i) * 3 + frame * 0.05) % 110;
        const y = ((random(`py${i}`) * 100 - frame * (0.08 + random(`pv${i}`) * 0.15)) % 100 + 100) % 100;
        const r = 4 + random(`pr${i}`) * 14;
        const c = HOLI[i % HOLI.length];
        return (
          <div
            key={i}
            style={{
              position: 'absolute',
              left: `${x}%`,
              top: `${y}%`,
              width: r,
              height: r,
              borderRadius: '50%',
              background: c,
              filter: `blur(${r / 4}px)`,
              opacity: 0.7,
            }}
          />
        );
      })}
    </AbsoluteFill>
  );
};

// Cartoon "knocked out" stars circling a point.
export const DizzyStars: React.FC<{x: number; y: number; start: number; r?: number; size?: number}> = ({
  x,
  y,
  start,
  r = 90,
  size = 56,
}) => {
  const frame = useCurrentFrame();
  const t = frame - start;
  if (t < 0) return null;
  const o = interpolate(t, [0, 8], [0, 1], {extrapolateRight: 'clamp'});
  return (
    <>
      {[0, 1, 2, 3].map((i) => {
        const a = t * 0.18 + (i / 4) * Math.PI * 2;
        const px = x + Math.cos(a) * r;
        const py = y + Math.sin(a) * r * 0.35;
        const front = Math.sin(a) > 0;
        return (
          <div
            key={i}
            style={{
              position: 'absolute',
              left: px - size / 2,
              top: py - size / 2,
              fontSize: size,
              lineHeight: 1,
              color: '#ffe14d',
              opacity: o * (front ? 1 : 0.6),
              transform: `scale(${front ? 1 : 0.75}) rotate(${t * 6}deg)`,
              textShadow: '0 0 12px rgba(255,225,77,0.8)',
            }}
          >
            ★
          </div>
        );
      })}
    </>
  );
};
