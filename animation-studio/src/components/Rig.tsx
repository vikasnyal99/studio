import React from 'react';
import {Img, staticFile} from 'remotion';

// ---------------------------------------------------------------------------
// Cutout rig built from ONE flat image (public/neeraj_side.png).
// Each limb is the same image clipped to a polygon and rotated around a pivot.
// Coordinates are percentages of the image, so it works at any render size.
// ---------------------------------------------------------------------------

const P = (pts: [number, number][]) =>
  `polygon(${pts.map(([x, y]) => `${(x / 320) * 100}% ${(y / 1300) * 100}%`).join(',')})`;

// Traced on a 320x1300 view of the side pose
const UPPER_ARM = P([
  [40, 235], [135, 228], [178, 330], [182, 470], [190, 540], [120, 545], [72, 460], [40, 370], [28, 290],
]);
const FOREARM = P([
  [120, 520], [192, 515], [215, 565], [262, 640], [268, 712], [242, 765], [178, 762], [160, 700], [146, 610],
]);
const WHOLE_ARM = P([
  [40, 235], [135, 228], [178, 330], [185, 480], [215, 560], [262, 640], [268, 712], [242, 765],
  [178, 762], [160, 700], [146, 610], [110, 540], [70, 455], [40, 370], [28, 290],
]);
const SHOULDER = {x: 100 / 320, y: 285 / 1300};
const ELBOW = {x: 158 / 320, y: 530 / 1300};

const pct = (o: {x: number; y: number}) => `${o.x * 100}% ${o.y * 100}%`;

const Layer: React.FC<{clip?: string; filter?: string}> = ({clip, filter}) => (
  <Img
    src={staticFile('neeraj_side.png')}
    style={{position: 'absolute', inset: 0, width: '100%', height: '100%', clipPath: clip, filter}}
  />
);

export const NeerajRig: React.FC<{
  height: number;
  shoulder: number; // deg, 0 = arm hanging, negative = forward/up
  elbow: number; // deg, relative to upper arm
  smear?: number; // 0..1 motion-blur trail on the fist
}> = ({height, shoulder, elbow, smear = 0}) => {
  const width = height * (160 / 650);
  return (
    <div style={{position: 'relative', width, height}}>
      {/* body with the original arm darkened -> reads as the far arm */}
      <Layer />
      <Layer clip={WHOLE_ARM} filter="brightness(0.45) saturate(0.8)" />
      {/* near arm */}
      <div
        style={{position: 'absolute', inset: 0, transform: `rotate(${shoulder}deg)`, transformOrigin: pct(SHOULDER)}}
      >
        <Layer clip={UPPER_ARM} />
        <div
          style={{position: 'absolute', inset: 0, transform: `rotate(${elbow}deg)`, transformOrigin: pct(ELBOW)}}
        >
          {smear > 0 ? (
            <div
              style={{
                position: 'absolute',
                left: '40%',
                top: '42%',
                width: '50%',
                height: '18%',
                background: 'linear-gradient(rgba(255,230,190,0), rgba(255,230,190,0.8))',
                filter: 'blur(8px)',
                opacity: smear,
                borderRadius: 60,
              }}
            />
          ) : null}
          <Layer clip={FOREARM} />
        </div>
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Fully vector fighter (no image at all). Faces LEFT. Origin = between the feet.
// Every joint is a prop, so you can animate it with interpolate()/spring().
// ---------------------------------------------------------------------------

export type Pose = {
  torso: number; // lean at hips, + = backwards
  head: number;
  lShoulder: number;
  lElbow: number;
  rShoulder: number;
  rElbow: number;
  lHip: number;
  rHip: number;
};

// Backlit silhouette style: dark fill + hot rim line (placeholder rival, swap for real art later)
export const mixPose = (a: Pose, b: Pose, t: number): Pose =>
  Object.fromEntries(Object.keys(a).map((k) => [k, a[k as keyof Pose] + (b[k as keyof Pose] - a[k as keyof Pose]) * t])) as Pose;

export const GUARD: Pose = {torso: -6, head: 4, lShoulder: 38, lElbow: 125, rShoulder: 28, rElbow: 135, lHip: -14, rHip: 12};
export const HIT: Pose = {torso: 30, head: 45, lShoulder: -70, lElbow: 25, rShoulder: -100, rElbow: 40, lHip: -22, rHip: 6};
export const FLAT: Pose = {torso: 4, head: 10, lShoulder: -150, lElbow: 20, rShoulder: -170, rElbow: 15, lHip: -6, rHip: 4};

const SKIN = '#2a1a24';
const SKIN_SHADE = '#1a1018';
const LINE = '#ff6a3d';

const Limb: React.FC<{len: number; w1: number; w2: number; fill?: string}> = ({len, w1, w2, fill = SKIN}) => (
  <path
    d={`M${-w1 / 2},0 Q${-w1 / 2 - 6},${len / 2} ${-w2 / 2},${len} L${w2 / 2},${len} Q${w1 / 2 + 6},${len / 2} ${w1 / 2},0 Z`}
    fill={fill}
    stroke={LINE}
    strokeWidth={5}
    strokeLinejoin="round"
  />
);

const Arm: React.FC<{shoulder: number; elbow: number; shade?: boolean}> = ({shoulder, elbow, shade}) => (
  <g transform={`rotate(${shoulder})`}>
    <circle cy={10} r={50} fill={shade ? SKIN_SHADE : SKIN} stroke={LINE} strokeWidth={5} />
    <Limb len={150} w1={78} w2={56} fill={shade ? SKIN_SHADE : SKIN} />
    <g transform={`translate(0 140) rotate(${elbow})`}>
      <Limb len={130} w1={58} w2={46} fill={shade ? SKIN_SHADE : SKIN} />
      <circle cy={140} r={36} fill={shade ? SKIN_SHADE : SKIN} stroke={LINE} strokeWidth={5} />
    </g>
  </g>
);

export const VectorFighter: React.FC<{pose: Pose; shorts?: string}> = ({pose, shorts = '#c21f2a'}) => (
  <g>
    {/* legs */}
    <g transform="translate(-30 -400)">
      <g transform={`rotate(${pose.rHip})`}>
        <Limb len={400} w1={92} w2={50} fill={SKIN_SHADE} />
      </g>
    </g>
    <g transform="translate(25 -400)">
      <g transform={`rotate(${pose.lHip})`}>
        <Limb len={400} w1={96} w2={52} />
      </g>
    </g>
    {/* upper body pivots at hips */}
    <g transform={`translate(0 -400) rotate(${pose.torso})`}>
      <g transform="translate(30 -265)">
        <Arm shoulder={pose.rShoulder} elbow={pose.rElbow} shade />
      </g>
      {/* torso: V-taper */}
      <path
        d="M-70,0 C-80,-120 -150,-200 -130,-290 L130,-290 C150,-200 80,-120 70,0 Z"
        fill={SKIN}
        stroke={LINE}
        strokeWidth={6}
        strokeLinejoin="round"
        transform="translate(0 0)"
      />
      {/* pecs + abs */}
      <path d="M-100,-235 Q-50,-180 0,-215 Q50,-180 100,-235" fill="none" stroke={SKIN_SHADE} strokeWidth={6} />
      <path d="M0,-200 L0,-40 M-38,-150 L38,-150 M-34,-100 L34,-100" stroke={SKIN_SHADE} strokeWidth={5} />
      {/* shorts */}
      <path d="M-78,-30 L78,-30 L95,110 L-95,110 Z" fill={shorts} stroke={LINE} strokeWidth={6} />
      <g transform={`translate(0 -300) rotate(${pose.head})`}>
        <rect x={-30} y={-40} width={60} height={50} fill={SKIN} stroke={LINE} strokeWidth={5} />
        <ellipse cy={-95} rx={58} ry={66} fill={SKIN} stroke={LINE} strokeWidth={6} />
        {/* buzz cut + beard, facing left */}
        <path d="M-56,-110 Q-40,-170 20,-162 Q58,-150 58,-100 L40,-120 Q0,-140 -50,-100 Z" fill="#0d080b" stroke={LINE} strokeWidth={4} />
        <path d="M-44,-104 L-22,-100" stroke="#ffd2a0" strokeWidth={6} strokeLinecap="round" />
      </g>
      <g transform="translate(-20 -260)">
        <Arm shoulder={pose.lShoulder} elbow={pose.lElbow} />
      </g>
    </g>
  </g>
);
