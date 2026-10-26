import React from 'react';
import {random, useCurrentFrame} from 'remotion';

// Night-time Indian hotel parking lot, drawn as SVG.
// `baseY` = where the hotel/cars meet the ground. Everything scales with `scale`.
// Drawn over a wide area so the camera can zoom out without running out of set.

const Car: React.FC<{x: number; y: number; color: string; flip?: boolean; s?: number}> = ({
  x,
  y,
  color,
  flip,
  s = 1,
}) => (
  <g transform={`translate(${x} ${y}) scale(${flip ? -s : s} ${s}) translate(-260 -150)`}>
    <path
      d="M0,120 L18,82 Q40,70 110,64 L170,20 Q190,8 230,8 L340,8 Q372,8 402,40 L442,64 Q500,72 516,92 L520,124 Q520,140 504,140 L16,140 Q0,140 0,120 Z"
      fill={color}
      stroke="#05040a"
      strokeWidth={4}
    />
    <path d="M182,26 Q196,16 228,16 L282,16 L282,62 L132,64 Z" fill="#1b2433" />
    <path d="M292,16 L338,16 Q362,16 386,42 L404,62 L292,62 Z" fill="#1b2433" />
    <path d="M140,60 L400,58" stroke="rgba(255,255,255,0.18)" strokeWidth={3} />
    <rect x={500} y={84} width={16} height={14} rx={4} fill="#ffe9b0" />
    <rect x={4} y={86} width={14} height={14} rx={4} fill="#c0202a" />
    {[112, 410].map((cx) => (
      <g key={cx}>
        <circle cx={cx} cy={140} r={40} fill="#0b0b0f" />
        <circle cx={cx} cy={140} r={18} fill="#6b6f78" />
      </g>
    ))}
  </g>
);

const AutoRickshaw: React.FC<{x: number; y: number; s?: number}> = ({x, y, s = 1}) => (
  <g transform={`translate(${x} ${y}) scale(${s}) translate(-160 -210)`}>
    {/* canopy */}
    <path d="M40,40 Q60,0 150,0 L270,0 Q300,0 300,30 L300,110 L40,110 Z" fill="#f2c200" stroke="#05040a" strokeWidth={4} />
    <path d="M60,46 L170,46 L170,108 L60,108 Z" fill="#141018" />
    {/* body */}
    <path d="M0,170 Q0,110 60,110 L300,110 L310,180 Q310,200 290,200 L20,200 Q0,200 0,170 Z" fill="#1f8a3a" stroke="#05040a" strokeWidth={4} />
    <rect x={190} y={60} width={100} height={50} fill="#141018" />
    <circle cx={10} cy={140} r={10} fill="#ffe9b0" />
    {[40, 260].map((cx) => (
      <g key={cx}>
        <circle cx={cx} cy={205} r={28} fill="#0b0b0f" />
        <circle cx={cx} cy={205} r={11} fill="#6b6f78" />
      </g>
    ))}
  </g>
);

const Bike: React.FC<{x: number; y: number; s?: number}> = ({x, y, s = 1}) => (
  <g transform={`translate(${x} ${y}) scale(${s}) translate(-110 -90)`} stroke="#05040a" strokeWidth={4}>
    <circle cx={30} cy={60} r={30} fill="#0b0b0f" />
    <circle cx={190} cy={60} r={30} fill="#0b0b0f" />
    <path d="M30,60 L80,20 L150,20 L190,60" fill="none" stroke="#2a2a33" strokeWidth={10} />
    <path d="M70,8 L140,8 Q160,8 150,26 L80,26 Z" fill="#8a1d22" />
    <path d="M160,0 L175,-14" stroke="#555" strokeWidth={6} />
  </g>
);

const StreetLamp: React.FC<{x: number; y: number; h: number; flip?: boolean}> = ({x, y, h, flip}) => {
  const dir = flip ? -1 : 1;
  return (
    <g>
      <rect x={x - 8} y={y - h} width={16} height={h} fill="#15141c" />
      <path d={`M${x},${y - h} q${dir * 60},-30 ${dir * 120},0`} stroke="#15141c" strokeWidth={10} fill="none" />
      <ellipse cx={x + dir * 120} cy={y - h + 6} rx={26} ry={10} fill="#ffcf7a" />
      <circle cx={x + dir * 120} cy={y - h + 6} r={90} fill="url(#lampGlow)" />
    </g>
  );
};

export const ParkingLot: React.FC<{
  width: number;
  baseY: number;
  scale?: number;
  x0?: number;
  name?: string;
  hindi?: string;
  wall?: string;
  banner?: string;
}> = ({
  width,
  baseY,
  scale = 1,
  x0 = 0,
  name = 'HOTEL SHIVAM',
  hindi = 'होटल शिवम · शुद्ध शाकाहारी',
  wall = '#3b2f33',
  banner,
}) => {
  const frame = useCurrentFrame();
  const s = scale;
  const bW = width * 0.9;
  const bX = x0 + width * 0.05;
  const floorH = 230 * s;
  const floors = 4;
  const bTop = baseY - floorH * floors - 60 * s;
  const cols = Math.max(4, Math.round(bW / (150 * s)));
  const flicker = random(`neon-${Math.floor(frame / 3)}`) > 0.9 ? 0.25 : 1;

  return (
    <svg
      width={width + 4000}
      height={6000}
      viewBox={`${x0 - 2000} ${baseY - 4000} ${width + 4000} 6000`}
      style={{position: 'absolute', left: x0 - 2000, top: baseY - 4000, overflow: 'visible'}}
    >
      <defs>
        <radialGradient id="lampGlow">
          <stop offset="0%" stopColor="rgba(255,190,90,0.55)" />
          <stop offset="100%" stopColor="rgba(255,190,90,0)" />
        </radialGradient>
        <linearGradient id="asphalt" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#2a2630" />
          <stop offset="100%" stopColor="#0c0a10" />
        </linearGradient>
        <filter id="neon">
          <feGaussianBlur stdDeviation={6 * s} result="b" />
          <feMerge>
            <feMergeNode in="b" />
            <feMergeNode in="b" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* neighbouring low buildings */}
      <rect x={x0 - 2000} y={baseY - 520 * s} width={2000 + bX - x0} height={520 * s} fill="#17131f" />
      <rect x={bX + bW} y={baseY - 640 * s} width={2600} height={640 * s} fill="#15111c" />

      {/* hotel building */}
      <rect x={bX} y={bTop} width={bW} height={baseY - bTop} fill={wall} />
      <rect x={bX} y={bTop} width={bW} height={24 * s} fill="#2a2025" />
      {new Array(floors - 1).fill(0).map((_, f) =>
        new Array(cols).fill(0).map((__, c) => {
          const lit = random(`win-${f}-${c}`) > 0.35;
          const wx = bX + (c + 0.2) * (bW / cols);
          const wy = bTop + 70 * s + f * floorH;
          return (
            <g key={`${f}-${c}`}>
              <rect
                x={wx}
                y={wy}
                width={(bW / cols) * 0.6}
                height={floorH * 0.55}
                fill={lit ? (random(`tint-${f}-${c}`) > 0.5 ? '#ffcf7a' : '#ffe6b8') : '#14101a'}
                opacity={lit ? 0.9 : 1}
              />
              <rect x={wx - 8 * s} y={wy + floorH * 0.55} width={(bW / cols) * 0.6 + 16 * s} height={10 * s} fill="#241b20" />
            </g>
          );
        }),
      )}
      {/* ground floor: glass entrance + portico */}
      <rect x={bX + bW * 0.35} y={baseY - floorH * 0.95} width={bW * 0.3} height={floorH * 0.95} fill="#ffd690" opacity={0.85} />
      <rect x={bX + bW * 0.3} y={baseY - floorH * 1.05} width={bW * 0.4} height={22 * s} fill="#2a2025" />
      {[0.32, 0.68].map((p) => (
        <rect key={p} x={bX + bW * p - 12 * s} y={baseY - floorH * 1.05} width={24 * s} height={floorH * 1.05} fill="#d9c7a8" />
      ))}

      {/* neon sign */}
      <g filter="url(#neon)" opacity={flicker}>
        <text
          x={bX + bW / 2}
          y={bTop - 40 * s}
          textAnchor="middle"
          fontFamily="Impact, 'Arial Black', sans-serif"
          fontSize={120 * s}
          fill="#ff3d5a"
          letterSpacing={6 * s}
        >
          {name}
        </text>
      </g>
      <g filter="url(#neon)">
        <text
          x={bX + bW / 2}
          y={bTop + 2 * floorH + 40 * s}
          textAnchor="middle"
          fontFamily="'Noto Serif Devanagari', serif"
          fontWeight={700}
          fontSize={70 * s}
          fill="#ffb02e"
        >
          {hindi}
        </text>
      </g>
      {banner ? (
        <g transform={`translate(${bX + bW / 2} ${bTop + floorH * 1.55})`}>
          <rect x={-bW * 0.3} y={-55 * s} width={bW * 0.6} height={110 * s} fill="#fff6e0" stroke="#e0218a" strokeWidth={6 * s} />
          {['#ff2d8a', '#ffd400', '#21c45a', '#2f7bff', '#a23bff'].map((c, i) => (
            <circle key={c} cx={-bW * 0.27 + i * bW * 0.135} cy={(i % 2 ? -30 : 34) * s} r={26 * s} fill={c} opacity={0.75} />
          ))}
          <text
            y={22 * s}
            textAnchor="middle"
            fontFamily="Impact, 'Arial Black', sans-serif"
            fontSize={64 * s}
            fill="#c2116b"
          >
            {banner}
          </text>
        </g>
      ) : null}

      {/* fairy lights strung across the front */}
      {[0, 1].map((row) => {
        const y0 = bTop + (160 + row * 220) * s;
        const n = 40;
        return new Array(n).fill(0).map((_, i) => {
          const p = i / (n - 1);
          const x = bX + p * bW;
          const sag = Math.sin(p * Math.PI * 3) ** 2 * 60 * s;
          const on = (i + Math.floor(frame / 6) + row) % 3 !== 0;
          const col = ['#ff5a5a', '#ffd23f', '#3fd2ff', '#7dff6a'][(i + row) % 4];
          return <circle key={`${row}-${i}`} cx={x} cy={y0 + sag} r={7 * s} fill={col} opacity={on ? 1 : 0.25} />;
        });
      })}

      {/* asphalt + parking lines */}
      <rect x={x0 - 2000} y={baseY} width={width + 4000} height={2000} fill="url(#asphalt)" />
      {new Array(18).fill(0).map((_, i) => {
        const x = x0 - 600 + i * 260 * s;
        return (
          <path
            key={i}
            d={`M${x},${baseY + 6} L${x - 160 * s},${baseY + 420 * s}`}
            stroke="rgba(235,235,220,0.35)"
            strokeWidth={10 * s}
          />
        );
      })}
      <rect x={x0 - 2000} y={baseY + 2} width={width + 4000} height={8 * s} fill="rgba(240,200,60,0.45)" />

      {/* parked vehicles */}
      <Car x={bX + bW * 0.08} y={baseY + 10 * s} color="#d7d9de" s={0.9 * s} />
      <AutoRickshaw x={bX + bW * 0.3} y={baseY + 10 * s} s={0.95 * s} />
      <Car x={bX + bW * 0.75} y={baseY + 10 * s} color="#7a1c22" s={0.9 * s} flip />
      <Bike x={bX + bW * 0.55} y={baseY + 4 * s} s={0.8 * s} />
      <Bike x={bX + bW * 0.6} y={baseY + 4 * s} s={0.8 * s} />
      <Car x={bX + bW + 400 * s} y={baseY + 10 * s} color="#2b4a7a" s={0.9 * s} />
      <Car x={bX - 300 * s} y={baseY + 10 * s} color="#4a4a52" s={0.9 * s} flip />

      {/* P board */}
      <g transform={`translate(${bX + bW * 0.93} ${baseY - 360 * s})`}>
        <rect x={-6 * s} y={0} width={12 * s} height={360 * s} fill="#222" />
        <rect x={-70 * s} y={-20 * s} width={140 * s} height={150 * s} rx={10 * s} fill="#1d4fb8" stroke="white" strokeWidth={6 * s} />
        <text x={0} y={95 * s} textAnchor="middle" fontFamily="Arial Black, sans-serif" fontSize={110 * s} fill="white">
          P
        </text>
        <text x={0} y={122 * s} textAnchor="middle" fontFamily="Arial, sans-serif" fontSize={22 * s} fill="white">
          PARKING
        </text>
      </g>

      <StreetLamp x={bX - 60 * s} y={baseY + 30 * s} h={760 * s} />
      <StreetLamp x={bX + bW + 60 * s} y={baseY + 30 * s} h={760 * s} flip />
      <StreetLamp x={bX + bW + 900 * s} y={baseY + 30 * s} h={760 * s} flip />
    </svg>
  );
};
