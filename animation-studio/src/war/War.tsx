import React from 'react';
import {AbsoluteFill, CalculateMetadataFunction, Easing, Img, interpolate, random, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';

// War-tactics map (Kings-and-Generals look): a painted top-down terrain plate, army blocks made of small soldier
// sprites that march / gallop / clash / rout, attack arrows, clash dust, forts that change hands, battle title and
// captions. One JSON spec = one shot. All times are seconds from the start of the shot; x/y are % of the map.
// Render: node scripts/war.mjs <spec.json> [--still] [--deliver <video> <shot>]

export type WarUnit = {
  label?: string; // banner text above the block
  color: string; // side colour (block, banner, arrows)
  sprite: string; // public path of one soldier facing right (transparent PNG, scripts/prep-sprites.mjs)
  n?: [number, number]; // soldiers: columns x rows (default 4x2)
  size?: number; // soldier height in px at zoom 1 (default 84)
  facing?: 1 | -1; // 1 = right (default), -1 = left
  path: [number, number, number][]; // [t, x, y] waypoints; holds still between equal points
  w?: number; // block width/height in % of the map (default 13 x 11)
  h?: number;
  from?: number; // appears (fades in) at
  gallop?: boolean; // bigger, faster bob (cavalry)
  fight?: [number, number]; // jostle in place between these seconds
  rout?: number; // breaks: soldiers scatter backwards and fade
};
export type WarArrow = {at: number; dur?: number; pts: [number, number][]; color: string; width?: number; keep?: boolean}; // fades ~2 s after drawn unless keep
export type WarSpec = {
  end: number;
  bg: string; // public path of the terrain plate (16:9)
  cam?: [number, number, number, number][]; // [t, zoom, x%, y%] keyframes (eased between)
  title?: {text: string; sub?: string; at?: number};
  units: WarUnit[];
  arrows?: WarArrow[];
  clash?: [number, number, number, number?][]; // [at, x, y, until?]
  forts?: {x: number; y: number; label?: string; color: string; flip?: [number, string]}[];
  labels?: [string, number, number, number, number?][]; // [text, x, y, at, until?]
  caps?: [string, string, number, number?][]; // [label, line (may hold <b>), at, until?]
  note?: string; // small corner tag; default "Sanketik chitran · illustration"
};

const W = 1920;
const H = 1080;
const src = (p: string) => (/^https?:/.test(p) ? p : staticFile(p));
const ease = Easing.inOut(Easing.cubic);

const lerpPath = (path: [number, number, number][], t: number): [number, number, number] => {
  // returns x, y, speed (% per second)
  if (t <= path[0][0]) return [path[0][1], path[0][2], 0];
  for (let i = 0; i < path.length - 1; i++) {
    const [t0, x0, y0] = path[i];
    const [t1, x1, y1] = path[i + 1];
    if (t <= t1) {
      const k = ease((t - t0) / Math.max(0.001, t1 - t0));
      const d = Math.hypot(x1 - x0, y1 - y0) / Math.max(0.001, t1 - t0);
      const mid = Math.sin(Math.PI * Math.min(1, Math.max(0, (t - t0) / Math.max(0.001, t1 - t0))));
      return [x0 + (x1 - x0) * k, y0 + (y1 - y0) * k, d * (0.3 + mid)];
    }
  }
  const l = path[path.length - 1];
  return [l[1], l[2], 0];
};

const camAt = (cam: WarSpec['cam'], t: number): [number, number, number] => {
  if (!cam || !cam.length) return [1, 50, 50];
  if (t <= cam[0][0]) return [cam[0][1], cam[0][2], cam[0][3]];
  for (let i = 0; i < cam.length - 1; i++) {
    const a = cam[i];
    const b = cam[i + 1];
    if (t <= b[0]) {
      const k = ease((t - a[0]) / Math.max(0.001, b[0] - a[0]));
      return [a[1] + (b[1] - a[1]) * k, a[2] + (b[2] - a[2]) * k, a[3] + (b[3] - a[3]) * k];
    }
  }
  const l = cam[cam.length - 1];
  return [l[1], l[2], l[3]];
};

const Unit: React.FC<{u: WarUnit; t: number; i: number}> = ({u, t, i}) => {
  const [x, y, speed] = lerpPath(u.path, t);
  const appear = u.from ?? 0;
  if (t < appear) return null;
  const fadeIn = interpolate(t, [appear, appear + 0.5], [0, 1], {extrapolateRight: 'clamp'});
  const [cols, rows] = u.n ?? [4, 2];
  const bw = ((u.w ?? 13) / 100) * W;
  const bh = ((u.h ?? 11) / 100) * H;
  const size = u.size ?? 84;
  const facing = u.facing ?? 1;
  const moving = speed > 0.4;
  const fighting = u.fight && t >= u.fight[0] && t <= u.fight[1];
  const routK = u.rout !== undefined ? interpolate(t, [u.rout, u.rout + 1.6], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'}) : 0;
  const soldiers = [];
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const k = r * cols + c;
      const seed = `${i}-${k}`;
      const ph = random(seed) * Math.PI * 2;
      let sx = (cols === 1 ? 0.5 : c / (cols - 1)) * (bw - size * 0.9) - (bw - size * 0.9) / 2 + (random(seed + 'x') - 0.5) * 10 + (r % 2) * 8;
      let sy = (rows === 1 ? 0.5 : r / (rows - 1)) * (bh - size * 0.6) - (bh - size * 0.6) / 2 + (random(seed + 'y') - 0.5) * 6;
      const tt = t * (u.gallop ? 11 : 7) + ph;
      let bob = moving ? -Math.abs(Math.sin(tt)) * (u.gallop ? 7 : 4) : 0;
      let rot = moving ? Math.sin(tt) * (u.gallop ? 4 : 2) : 0;
      if (fighting) {
        sx += Math.sin(t * 13 + ph) * 6 * facing;
        bob = -Math.abs(Math.sin(t * 9 + ph)) * 5;
        rot = Math.sin(t * 9 + ph) * 6;
      }
      let op = 1;
      if (routK > 0) {
        const ang = (random(seed + 'a') - 0.5) * 1.6;
        const dist = routK * (120 + random(seed + 'd') * 220);
        sx += -facing * Math.cos(ang) * dist;
        sy += Math.sin(ang) * dist;
        op = 1 - routK;
        rot += routK * (random(seed + 'r') - 0.5) * 40;
      }
      soldiers.push(
        <Img
          key={k}
          src={src(u.sprite)}
          style={{
            position: 'absolute', height: size, left: sx - size * 0.6, top: sy - size * 0.6 + bob,
            transform: `scaleX(${routK > 0.15 ? -facing : facing}) rotate(${rot}deg)`, opacity: op,
            filter: 'drop-shadow(2px 4px 2px rgba(0,0,0,0.45))',
          }}
        />,
      );
    }
  }
  // dust trail while moving
  const dust = moving
    ? [0, 1, 2, 3, 4].map((d) => {
        const ph = ((t * 1.6 + d / 5) % 1);
        return (
          <div
            key={'d' + d}
            style={{
              position: 'absolute', left: -facing * (bw / 2 + ph * 70) - 30, top: bh / 2 - 30 - ph * 30 + (random(`${i}dd${d}`) - 0.5) * bh,
              width: 60 + ph * 70, height: 40 + ph * 40, borderRadius: '50%',
              background: 'rgba(214,196,160,0.55)', opacity: (1 - ph) * 0.7, filter: 'blur(8px)',
            }}
          />
        );
      })
    : null;
  return (
    <div style={{position: 'absolute', left: (x / 100) * W, top: (y / 100) * H, opacity: fadeIn}}>
      {dust}
      <div
        style={{
          position: 'absolute', left: -bw / 2, top: -bh / 2, width: bw, height: bh, borderRadius: 6,
          background: u.color, opacity: 0.28 * (1 - routK), border: `3px solid ${u.color}`, boxShadow: '0 6px 18px rgba(0,0,0,0.35)',
        }}
      />
      {soldiers}
      {u.label ? (
        <div
          style={{
            position: 'absolute', left: -bw / 2, top: -bh / 2 - 46, padding: '4px 14px', background: u.color, color: '#fff',
            fontFamily: 'Inter, sans-serif', fontWeight: 800, fontSize: 24, letterSpacing: 1, borderRadius: 4, whiteSpace: 'nowrap',
            textTransform: 'uppercase', boxShadow: '0 3px 10px rgba(0,0,0,0.5)', opacity: 1 - routK,
          }}
        >
          {u.label}
        </div>
      ) : null}
    </div>
  );
};

const smooth = (pts: [number, number][]) => {
  const P = pts.map(([x, y]) => [(x / 100) * W, (y / 100) * H]);
  if (P.length === 2) return `M${P[0][0]},${P[0][1]} L${P[1][0]},${P[1][1]}`;
  let d = `M${P[0][0]},${P[0][1]}`;
  for (let i = 1; i < P.length - 1; i++) {
    const mx = (P[i][0] + P[i + 1][0]) / 2;
    const my = (P[i][1] + P[i + 1][1]) / 2;
    d += ` Q${P[i][0]},${P[i][1]} ${i === P.length - 2 ? P[i + 1][0] : mx},${i === P.length - 2 ? P[i + 1][1] : my}`;
  }
  return d;
};

const Arrow: React.FC<{a: WarArrow; t: number; i: number}> = ({a, t, i}) => {
  if (t < a.at) return null;
  const k = ease(Math.min(1, (t - a.at) / (a.dur ?? 1.2)));
  const wdt = a.width ?? 26;
  const d = smooth(a.pts);
  const n = a.pts.length;
  const [x1, y1] = a.pts[n - 1].map((v, j) => (v / 100) * (j ? H : W));
  const [x0, y0] = a.pts[n - 2].map((v, j) => (v / 100) * (j ? H : W));
  const ang = (Math.atan2(y1 - y0, x1 - x0) * 180) / Math.PI;
  const id = `ar${i}`;
  const gone = a.at + (a.dur ?? 1.2) + 1.8;
  const op = a.keep ? 1 : interpolate(t, [gone, gone + 0.6], [1, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  if (op <= 0) return null;
  return (
    <svg width={W} height={H} style={{position: 'absolute', left: 0, top: 0, overflow: 'visible', opacity: op}}>
      <defs>
        <mask id={id}>
          <path d={d} stroke="#fff" strokeWidth={wdt + 12} fill="none" pathLength={1} strokeDasharray={`${k} 1`} />
        </mask>
      </defs>
      <g mask={`url(#${id})`}>
        <path d={d} stroke="rgba(0,0,0,0.45)" strokeWidth={wdt + 10} fill="none" strokeLinecap="round" />
        <path d={d} stroke={a.color} strokeWidth={wdt} fill="none" strokeLinecap="round" opacity={0.92} />
      </g>
      {k > 0.97 ? (
        <polygon
          points={`0,${-wdt * 1.3} ${wdt * 1.9},0 0,${wdt * 1.3}`}
          fill={a.color}
          stroke="rgba(0,0,0,0.45)"
          strokeWidth={4}
          transform={`translate(${x1},${y1}) rotate(${ang})`}
        />
      ) : null}
    </svg>
  );
};

const Clash: React.FC<{c: [number, number, number, number?]; t: number; i: number}> = ({c, t, i}) => {
  const [at, x, y, until] = c;
  const end = until ?? at + 2.5;
  if (t < at || t > end + 1.2) return null;
  const puffs = [];
  for (let p = 0; p < 14; p++) {
    const born = at + (p / 14) * (end - at);
    const age = t - born;
    if (age < 0 || age > 1.2) continue;
    const ang = random(`c${i}${p}`) * Math.PI * 2;
    const r = age * (60 + random(`r${i}${p}`) * 90);
    puffs.push(
      <div
        key={p}
        style={{
          position: 'absolute', left: Math.cos(ang) * r - 30, top: Math.sin(ang) * r * 0.6 - 24, width: 60 + age * 60, height: 48 + age * 40,
          borderRadius: '50%', background: 'rgba(225,205,165,0.6)', opacity: (1 - age / 1.2) * 0.75, filter: 'blur(9px)',
        }}
      />,
    );
  }
  const sparks = [];
  for (let s = 0; s < 8; s++) {
    const ph = (t * 3 + random(`s${i}${s}`)) % 1;
    if (t > end) break;
    const ang = random(`sa${i}${s}${Math.floor(t * 3 + random(`s${i}${s}`))}`) * Math.PI * 2;
    sparks.push(
      <div
        key={'s' + s}
        style={{
          position: 'absolute', left: Math.cos(ang) * ph * 90, top: Math.sin(ang) * ph * 60, width: 26, height: 4, borderRadius: 2,
          background: '#fff3c4', opacity: 1 - ph, transform: `rotate(${(ang * 180) / Math.PI}deg)`, boxShadow: '0 0 8px #ffd27a',
        }}
      />,
    );
  }
  return <div style={{position: 'absolute', left: (x / 100) * W, top: (y / 100) * H}}>{puffs}{sparks}</div>;
};

const Fort: React.FC<{f: NonNullable<WarSpec['forts']>[number]; t: number}> = ({f, t}) => {
  const flipped = f.flip && t >= f.flip[0];
  const col = flipped ? f.flip![1] : f.color;
  const pop = f.flip ? interpolate(t, [f.flip[0], f.flip[0] + 0.25, f.flip[0] + 0.5], [1, 1.35, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'}) : 1;
  return (
    <div style={{position: 'absolute', left: (f.x / 100) * W, top: (f.y / 100) * H, transform: `translate(-50%,-50%) scale(${pop})`}}>
      <svg width={70} height={70} viewBox="0 0 70 70" style={{display: 'block', margin: '0 auto', filter: 'drop-shadow(0 4px 6px rgba(0,0,0,.5))'}}>
        <path d="M8 62 V26 h8 v-8 h8 v8 h6 v-8 h10 v8 h6 v-8 h8 v8 h8 V62 Z" fill="#e9dfc7" stroke="#2b2418" strokeWidth={3} />
        <rect x={29} y={42} width={12} height={20} fill="#2b2418" />
        <line x1={35} y1={18} x2={35} y2={2} stroke="#2b2418" strokeWidth={3} />
        <path d="M35 2 h18 l-5 5 l5 5 h-18 Z" fill={col} stroke="#2b2418" strokeWidth={2} />
      </svg>
      {f.label ? (
        <div style={{fontFamily: 'Inter, sans-serif', fontWeight: 800, fontSize: 22, color: '#fff', textAlign: 'center', textShadow: '0 2px 6px #000', whiteSpace: 'nowrap'}}>
          {f.label}
        </div>
      ) : null}
    </div>
  );
};

export const War: React.FC<{spec: WarSpec}> = ({spec}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const t = frame / fps;
  const [z, cx, cy] = camAt(spec.cam, t);
  // keep the camera inside the map
  const half = 50 / z;
  const fx = Math.min(100 - half, Math.max(half, cx));
  const fy = Math.min(100 - half, Math.max(half, cy));
  const tx = (50 - fx) * (W / 100) * z;
  const ty = (50 - fy) * (H / 100) * z;
  // a short camera shake at each clash start
  let shx = 0;
  let shy = 0;
  for (const c of spec.clash ?? []) {
    const a = t - c[0];
    if (a >= 0 && a < 0.4) {
      const k = 1 - a / 0.4;
      shx += Math.sin(a * 90) * 10 * k;
      shy += Math.cos(a * 70) * 7 * k;
    }
  }
  const fade = interpolate(frame, [0, 6], [0, 1], {extrapolateRight: 'clamp'});
  return (
    <AbsoluteFill style={{background: '#14110c', overflow: 'hidden', opacity: fade}}>
      <div style={{position: 'absolute', width: W, height: H, transformOrigin: '50% 50%', transform: `translate(${tx + shx}px,${ty + shy}px) scale(${z})`}}>
        <Img src={src(spec.bg)} style={{position: 'absolute', width: W, height: H, objectFit: 'cover'}} />
        {(spec.forts ?? []).map((f, i) => <Fort key={'f' + i} f={f} t={t} />)}
        {(spec.arrows ?? []).map((a, i) => <Arrow key={'a' + i} a={a} t={t} i={i} />)}
        {spec.units.map((u, i) => <Unit key={'u' + i} u={u} t={t} i={i} />)}
        {(spec.clash ?? []).map((c, i) => <Clash key={'c' + i} c={c} t={t} i={i} />)}
        {(spec.labels ?? []).map(([text, x, y, at, until], i) =>
          t >= at && (until === undefined || t < until) ? (
            <div
              key={'l' + i}
              style={{
                position: 'absolute', left: (x / 100) * W, top: (y / 100) * H, transform: 'translate(-50%,-50%)',
                fontFamily: 'Inter, sans-serif', fontWeight: 800, fontSize: 30, color: '#fff', letterSpacing: 2, textTransform: 'uppercase',
                textShadow: '0 2px 8px #000, 0 0 2px #000', opacity: interpolate(t, [at, at + 0.4], [0, 1], {extrapolateRight: 'clamp'}), whiteSpace: 'nowrap',
              }}
            >
              {text}
            </div>
          ) : null,
        )}
      </div>
      {/* grade: warm tint + vignette */}
      <AbsoluteFill style={{background: 'radial-gradient(ellipse at 50% 45%, rgba(0,0,0,0) 55%, rgba(0,0,0,0.55) 100%)'}} />
      <AbsoluteFill style={{background: 'rgba(120,80,30,0.08)', mixBlendMode: 'multiply'}} />
      {spec.title ? (
        <div
          style={{
            position: 'absolute', left: 70, top: 60, opacity: interpolate(t, [spec.title.at ?? 0.2, (spec.title.at ?? 0.2) + 0.5], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'}),
            transform: `translateX(${interpolate(t, [spec.title.at ?? 0.2, (spec.title.at ?? 0.2) + 0.5], [-30, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'})}px)`,
          }}
        >
          <div style={{fontFamily: '"DM Serif Display", serif', fontSize: 64, color: '#f3efe6', textShadow: '0 3px 12px #000'}}>{spec.title.text}</div>
          {spec.title.sub ? (
            <div style={{fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: 28, color: '#e8b34b', letterSpacing: 4, textShadow: '0 2px 8px #000'}}>{spec.title.sub}</div>
          ) : null}
          <div style={{height: 4, width: 220, background: '#e8b34b', marginTop: 10}} />
        </div>
      ) : null}
      {(spec.caps ?? []).map(([label, line, at, until], i) =>
        t >= at && (until === undefined || t < until) ? (
          <div
            key={'cap' + i}
            style={{
              position: 'absolute', left: 70, bottom: 80, maxWidth: 1100, padding: '18px 26px', background: 'rgba(12,10,8,0.78)', borderLeft: '6px solid #e8b34b',
              opacity: interpolate(t, [at, at + 0.35], [0, 1], {extrapolateRight: 'clamp'}),
            }}
          >
            <div style={{fontFamily: 'Inter, sans-serif', fontWeight: 800, fontSize: 24, color: '#e8b34b', letterSpacing: 3, textTransform: 'uppercase'}}>{label}</div>
            <div style={{fontFamily: 'Inter, sans-serif', fontWeight: 500, fontSize: 40, color: '#f3efe6'}} dangerouslySetInnerHTML={{__html: line}} />
          </div>
        ) : null,
      )}
      <div style={{position: 'absolute', right: 40, bottom: 30, fontFamily: 'Inter, sans-serif', fontSize: 20, color: 'rgba(255,255,255,0.7)', letterSpacing: 1}}>
        {spec.note ?? 'Sanketik chitran · illustration'}
      </div>
    </AbsoluteFill>
  );
};

export const warMetadata: CalculateMetadataFunction<{spec: WarSpec}> = ({props}) => ({
  durationInFrames: Math.max(1, Math.round(props.spec.end * 30)),
});

export const WAR_DEMO: WarSpec = {
  end: 6,
  bg: 'doc/demo-war/plain.png',
  units: [],
};
