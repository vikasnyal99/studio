import React from 'react';
import {AbsoluteFill, CalculateMetadataFunction, Easing, Img, interpolate, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';

// Animated history map: parchment land (no modern borders), territories that spread out from where the conquest
// started, animated campaign arrows with a moving army token, pulsing city pins, region names, a running year
// counter, title and captions. One JSON spec = one shot; times are seconds from the start of the shot, places lon/lat.
// Base map: public/maps/<map>_base.jpg + <map>_land.json (projection) made from video-studio/library/maps/<map>.json.
// Render: node scripts/histmap.mjs <spec.json> [...] [--still] [--deliver <video>]

type LL = [number, number];
export type HistSpec = {
  end: number;
  map?: string; // default hist_wide (-16..102 E, 2..49 N)
  cam: [number, number, number, number][]; // [t, lon, lat, zoom]; zoom 1 = whole map width
  title?: {text: string; sub?: string; at?: number};
  year?: {from: number; to: number; at: number; dur: number; suffix?: string};
  lands?: {at: number; dur?: number; color: string; pts: LL[]; origin: LL; label?: string; labelAt?: LL; until?: number}[];
  arrows?: {at: number; dur?: number; pts: LL[]; color: string; width?: number; token?: string; keep?: boolean}[];
  pins?: {ll: LL; at: number; label: string; sub?: string; side?: 1 | -1; color?: string}[];
  tags?: {text: string; ll: LL; at: number; until?: number; size?: number}[];
  caps?: [string, string, number, number?][];
  note?: string; // default "Borders approximate"
};

const FW = 1920;
const FH = 1080;
const ease = Easing.inOut(Easing.cubic);
const PROJ: Record<string, {west: number; north: number; scale: number; width: number; height: number}> = {
  caliphate_india: {west: -12, north: 46, scale: 2203.6838, width: 4000, height: 1805},
  hist_wide: {west: -16, north: 49, scale: 1942.2298, width: 4000, height: 1843},
};
const merc = (lat: number) => Math.log(Math.tan(Math.PI / 4 + (lat * Math.PI) / 360));

const camAt = (cam: HistSpec['cam'], t: number): [number, number, number] => {
  if (t <= cam[0][0]) return [cam[0][1], cam[0][2], cam[0][3]];
  for (let i = 0; i < cam.length - 1; i++) {
    const a = cam[i];
    const b = cam[i + 1];
    if (t <= b[0]) {
      const k = ease((t - a[0]) / Math.max(0.001, b[0] - a[0]));
      return [a[1] + (b[1] - a[1]) * k, a[2] + (b[2] - a[2]) * k, a[3] * Math.pow(b[3] / a[3], k)];
    }
  }
  const l = cam[cam.length - 1];
  return [l[1], l[2], l[3]];
};

const smooth = (P: number[][]) => {
  if (P.length === 2) return `M${P[0][0]},${P[0][1]} L${P[1][0]},${P[1][1]}`;
  let d = `M${P[0][0]},${P[0][1]}`;
  for (let i = 1; i < P.length - 1; i++) {
    const last = i === P.length - 2;
    const mx = last ? P[i + 1][0] : (P[i][0] + P[i + 1][0]) / 2;
    const my = last ? P[i + 1][1] : (P[i][1] + P[i + 1][1]) / 2;
    d += ` Q${P[i][0]},${P[i][1]} ${mx},${my}`;
  }
  return d;
};

// point and direction along a polyline at fraction k (for the moving token)
const along = (P: number[][], k: number): [number, number, number] => {
  const seg: number[] = [];
  let total = 0;
  for (let i = 0; i < P.length - 1; i++) {
    const d = Math.hypot(P[i + 1][0] - P[i][0], P[i + 1][1] - P[i][1]);
    seg.push(d);
    total += d;
  }
  let want = k * total;
  for (let i = 0; i < seg.length; i++) {
    if (want <= seg[i] || i === seg.length - 1) {
      const f = Math.min(1, want / Math.max(0.001, seg[i]));
      return [P[i][0] + (P[i + 1][0] - P[i][0]) * f, P[i][1] + (P[i + 1][1] - P[i][1]) * f, Math.atan2(P[i + 1][1] - P[i][1], P[i + 1][0] - P[i][0])];
    }
    want -= seg[i];
  }
  return [P[0][0], P[0][1], 0];
};

export const HistMap: React.FC<{spec: HistSpec}> = ({spec}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const t = frame / fps;
  const mapName = spec.map ?? 'hist_wide';
  const pr = PROJ[mapName];
  const xy = ([lon, lat]: LL): [number, number] => [((lon - pr.west) * Math.PI) / 180 * pr.scale, (merc(pr.north) - merc(lat)) * pr.scale];
  const [clon, clat, z] = camAt(spec.cam, t);
  const s = (FW / pr.width) * z; // world px -> screen px
  const [cx0, cy0] = xy([clon, clat]);
  // never show past the edge of the map
  const hw = FW / 2 / s, hh = FH / 2 / s;
  const cx = Math.min(pr.width - hw, Math.max(hw, cx0));
  const cy = Math.min(pr.height - hh, Math.max(hh, cy0));
  const k = 1 / s; // multiply screen sizes by k to draw them in world units
  const fade = interpolate(frame, [0, 6], [0, 1], {extrapolateRight: 'clamp'});

  return (
    <AbsoluteFill style={{background: '#0b1720', overflow: 'hidden', opacity: fade}}>
      <div style={{position: 'absolute', left: 0, top: 0, width: pr.width, height: pr.height, transformOrigin: '0 0', transform: `translate(${FW / 2 - cx * s}px,${FH / 2 - cy * s}px) scale(${s})`}}>
        <Img src={staticFile(`maps/${mapName}_base.jpg`)} style={{position: 'absolute', width: pr.width, height: pr.height}} />
        <svg width={pr.width} height={pr.height} style={{position: 'absolute', left: 0, top: 0, overflow: 'visible'}}>
          <defs>
            {(spec.lands ?? []).map((l, i) => {
              const p = ease(Math.min(1, Math.max(0, (t - l.at) / (l.dur ?? 2.2))));
              const [ox, oy] = xy(l.origin);
              const far = Math.max(...l.pts.map((q) => Math.hypot(xy(q)[0] - ox, xy(q)[1] - oy)));
              return (
                <clipPath key={i} id={`grow${i}`}>
                  <circle cx={ox} cy={oy} r={p * far * 1.05} />
                </clipPath>
              );
            })}
            <pattern id="hatch" width={14} height={14} patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
              <line x1={0} y1={0} x2={0} y2={14} stroke="rgba(255,255,255,0.18)" strokeWidth={5} />
            </pattern>
          </defs>
          {(spec.lands ?? []).map((l, i) => {
            if (t < l.at) return null;
            const out = l.until !== undefined ? interpolate(t, [l.until, l.until + 0.6], [1, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'}) : 1;
            const d = 'M' + l.pts.map((q) => xy(q).join(',')).join(' L') + ' Z';
            const edge = interpolate(t, [l.at, l.at + (l.dur ?? 2.2)], [1, 0.55], {extrapolateRight: 'clamp'});
            return (
              <g key={i} clipPath={`url(#grow${i})`} opacity={out}>
                <path d={d} fill={l.color} fillOpacity={0.5} />
                <path d={d} fill="url(#hatch)" />
                <path d={d} fill="none" stroke={l.color} strokeWidth={9 * k * 0.6} strokeOpacity={edge} strokeLinejoin="round" style={{filter: `drop-shadow(0 0 ${6 * k}px ${l.color})`}} />
              </g>
            );
          })}
          {(spec.arrows ?? []).map((a, i) => {
            if (t < a.at) return null;
            const P = a.pts.map(xy);
            const p = ease(Math.min(1, (t - a.at) / (a.dur ?? 1.6)));
            const gone = a.at + (a.dur ?? 1.6) + 2.5;
            const op = a.keep ? 1 : interpolate(t, [gone, gone + 0.6], [1, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
            if (op <= 0) return null;
            const w = (a.width ?? 16) * k;
            const d = smooth(P);
            const [hx, hy, ang] = along(P, p);
            return (
              <g key={'a' + i} opacity={op}>
                <path d={d} fill="none" stroke="rgba(0,0,0,0.45)" strokeWidth={w + 6 * k} strokeLinecap="round" pathLength={1} strokeDasharray={`${p} 1`} />
                <path d={d} fill="none" stroke={a.color} strokeWidth={w} strokeLinecap="round" pathLength={1} strokeDasharray={`${p} 1`} />
                <polygon points={`0,${-w * 1.4} ${w * 2.2},0 0,${w * 1.4}`} fill={a.color} stroke="rgba(0,0,0,0.5)" strokeWidth={3 * k} transform={`translate(${hx},${hy}) rotate(${(ang * 180) / Math.PI})`} />
              </g>
            );
          })}
        </svg>
        {(spec.arrows ?? []).map((a, i) => {
          if (!a.token || t < a.at || t > a.at + (a.dur ?? 1.6) + 0.4) return null;
          const P = a.pts.map(xy);
          const p = ease(Math.min(1, (t - a.at) / (a.dur ?? 1.6)));
          const [hx, hy, ang] = along(P, p);
          const h = 70 * k;
          const flip = Math.cos(ang) < 0 ? -1 : 1;
          return (
            <Img key={'tk' + i} src={staticFile(a.token)} style={{position: 'absolute', height: h, left: hx - h * 0.6, top: hy - h * 1.1, transform: `scaleX(${flip}) translateY(${-Math.abs(Math.sin(t * 12)) * 6 * k}px)`, filter: 'drop-shadow(0 4px 4px rgba(0,0,0,.6))'}} />
          );
        })}
        {(spec.lands ?? []).map((l, i) =>
          l.label && t >= l.at + (l.dur ?? 2.2) * 0.6 && (l.until === undefined || t < l.until) ? (
            <div
              key={'ll' + i}
              style={{
                position: 'absolute', left: xy(l.labelAt ?? l.origin)[0], top: xy(l.labelAt ?? l.origin)[1], transform: `translate(-50%,-50%) scale(${k})`,
                fontFamily: 'Inter, sans-serif', fontWeight: 900, fontSize: 34, letterSpacing: 4, color: '#fff', textTransform: 'uppercase', whiteSpace: 'nowrap',
                textShadow: `0 2px 8px #000, 0 0 3px ${l.color}`, opacity: interpolate(t, [l.at + (l.dur ?? 2.2) * 0.6, l.at + (l.dur ?? 2.2) * 0.6 + 0.5], [0, 1], {extrapolateRight: 'clamp'}),
              }}
            >
              {l.label}
            </div>
          ) : null,
        )}
        {(spec.tags ?? []).map((g, i) =>
          t >= g.at && (g.until === undefined || t < g.until) ? (
            <div
              key={'tg' + i}
              style={{
                position: 'absolute', left: xy(g.ll)[0], top: xy(g.ll)[1], transform: `translate(-50%,-50%) scale(${k})`,
                fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: g.size ?? 26, letterSpacing: 8, color: 'rgba(60,40,20,0.75)', textTransform: 'uppercase', whiteSpace: 'nowrap',
                opacity: interpolate(t, [g.at, g.at + 0.6], [0, 1], {extrapolateRight: 'clamp'}),
              }}
            >
              {g.text}
            </div>
          ) : null,
        )}
        {(spec.pins ?? []).map((p, i) => {
          if (t < p.at) return null;
          const [px, py] = xy(p.ll);
          const a = t - p.at;
          const pop = interpolate(a, [0, 0.2, 0.4], [0, 1.4, 1], {extrapolateRight: 'clamp'});
          const ring = (a * 0.8) % 1;
          const col = p.color ?? '#ffd27a';
          const side = p.side ?? 1;
          return (
            <div key={'p' + i} style={{position: 'absolute', left: px, top: py, transform: `scale(${k})`, transformOrigin: '0 0'}}>
              <div style={{position: 'absolute', left: -40 * ring, top: -40 * ring, width: 80 * ring, height: 80 * ring, borderRadius: '50%', border: `3px solid ${col}`, opacity: 1 - ring}} />
              <div style={{position: 'absolute', left: -9, top: -9, width: 18, height: 18, borderRadius: '50%', background: col, border: '3px solid #1a120a', transform: `scale(${pop})`}} />
              <div
                style={{
                  position: 'absolute', top: -22, [side > 0 ? 'left' : 'right']: 20, whiteSpace: 'nowrap', fontFamily: 'Inter, sans-serif', color: '#fff',
                  textShadow: '0 2px 6px #000', opacity: interpolate(a, [0.2, 0.6], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'}), textAlign: side > 0 ? 'left' : 'right',
                }}
              >
                <div style={{fontWeight: 800, fontSize: 30}}>{p.label}</div>
                {p.sub ? <div style={{fontWeight: 600, fontSize: 22, color: col}}>{p.sub}</div> : null}
              </div>
            </div>
          );
        })}
      </div>
      <AbsoluteFill style={{background: 'radial-gradient(ellipse at 50% 50%, rgba(0,0,0,0) 60%, rgba(0,0,0,0.5) 100%)'}} />
      {spec.title ? (
        <div style={{position: 'absolute', left: 70, top: 60, opacity: interpolate(t, [spec.title.at ?? 0.2, (spec.title.at ?? 0.2) + 0.5], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'})}}>
          <div style={{fontFamily: '"DM Serif Display", serif', fontSize: 60, color: '#f3efe6', textShadow: '0 3px 12px #000'}}>{spec.title.text}</div>
          {spec.title.sub ? <div style={{fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: 26, color: '#e8b34b', letterSpacing: 4, textShadow: '0 2px 8px #000'}}>{spec.title.sub}</div> : null}
          <div style={{height: 4, width: 200, background: '#e8b34b', marginTop: 10}} />
        </div>
      ) : null}
      {spec.year && t >= spec.year.at ? (
        <div style={{position: 'absolute', right: 70, top: 50, fontFamily: '"DM Serif Display", serif', fontSize: 110, color: '#ffd27a', textShadow: '0 4px 16px #000'}}>
          {Math.round(interpolate(t, [spec.year.at, spec.year.at + spec.year.dur], [spec.year.from, spec.year.to], {extrapolateRight: 'clamp', easing: ease}))}
          <span style={{fontSize: 44, marginLeft: 10}}>{spec.year.suffix ?? 'CE'}</span>
        </div>
      ) : null}
      {(spec.caps ?? []).map(([label, line, at, until], i) =>
        t >= at && (until === undefined || t < until) ? (
          <div key={'c' + i} style={{position: 'absolute', left: 70, bottom: 80, maxWidth: 1100, padding: '18px 26px', background: 'rgba(12,10,8,0.8)', borderLeft: '6px solid #e8b34b', opacity: interpolate(t, [at, at + 0.35], [0, 1], {extrapolateRight: 'clamp'})}}>
            <div style={{fontFamily: 'Inter, sans-serif', fontWeight: 800, fontSize: 24, color: '#e8b34b', letterSpacing: 3, textTransform: 'uppercase'}}>{label}</div>
            <div style={{fontFamily: 'Inter, sans-serif', fontWeight: 500, fontSize: 40, color: '#f3efe6'}} dangerouslySetInnerHTML={{__html: line}} />
          </div>
        ) : null,
      )}
      <div style={{position: 'absolute', right: 40, bottom: 30, fontFamily: 'Inter, sans-serif', fontSize: 20, color: 'rgba(255,255,255,0.7)'}}>{spec.note ?? 'Borders approximate'}</div>
    </AbsoluteFill>
  );
};

export const histMetadata: CalculateMetadataFunction<{spec: HistSpec}> = ({props}) => ({durationInFrames: Math.max(1, Math.round(props.spec.end * 30))});
export const HIST_DEMO: HistSpec = {end: 4, cam: [[0, 50, 28, 1.2]]};
