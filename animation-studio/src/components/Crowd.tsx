import React from 'react';
import {random, useCurrentFrame} from 'remotion';

// One row of cheering silhouettes, drawn procedurally as SVG.
// `part` (0..1) pushes people near `gapX` sideways so someone can walk through.
export const CrowdRow: React.FC<{
  seed: string;
  width: number;
  y: number;
  scale: number;
  color: string;
  count: number;
  part?: number;
  gapX?: number;
  rim?: string;
}> = ({seed, width, y, scale, color, count, part = 0, gapX = 0.5, rim}) => {
  const frame = useCurrentFrame();
  const people = new Array(count).fill(0).map((_, i) => {
    const baseX = ((i + random(`${seed}x${i}`) * 0.6) / count) * width * 1.2 - width * 0.1;
    const rel = baseX / width - gapX;
    const push = Math.sign(rel || 1) * part * 420 * scale * Math.max(0, 1 - Math.abs(rel) * 2.2);
    const h = (230 + random(`${seed}h${i}`) * 70) * scale;
    const bob = Math.sin(frame * (0.25 + random(`${seed}f${i}`) * 0.2) + i) * 10 * scale;
    const armsUp = random(`${seed}a${i}`) > 0.45;
    const armWave = Math.sin(frame * 0.35 + i * 1.7) * 12;
    return {x: baseX + push, h, bob, armsUp, armWave, i};
  });
  return (
    <svg
      width={width}
      height={1200 * scale}
      style={{position: 'absolute', left: 0, top: y - 1200 * scale, overflow: 'visible'}}
    >
      {people.map(({x, h, bob, armsUp, armWave, i}) => {
        const base = 1200 * scale;
        const top = base - h + bob;
        const sw = h * 0.42; // shoulder width
        const head = h * 0.12;
        const armLen = h * 0.38;
        const arm = (side: 1 | -1) => {
          const sx = x + (side * sw) / 2;
          const sy = top + head * 2.3;
          const ex = armsUp ? sx + side * armLen * 0.35 + armWave * scale : sx + side * armLen * 0.15;
          const ey = armsUp ? sy - armLen : sy + armLen * 0.9;
          return (
            <line
              x1={sx}
              y1={sy}
              x2={ex}
              y2={ey}
              stroke={color}
              strokeWidth={h * 0.09}
              strokeLinecap="round"
            />
          );
        };
        return (
          <g key={i}>
            {arm(1)}
            {arm(-1)}
            <rect
              x={x - sw / 2}
              y={top + head * 2}
              width={sw}
              height={h}
              rx={sw * 0.35}
              fill={color}
              stroke={rim}
              strokeWidth={rim ? 3 : 0}
            />
            <circle cx={x} cy={top + head} r={head} fill={color} stroke={rim} strokeWidth={rim ? 3 : 0} />
          </g>
        );
      })}
    </svg>
  );
};
