import React from 'react';
import {
  AbsoluteFill,
  Easing,
  Img,
  interpolate,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion';
import {CrowdRow} from '../components/Crowd';
import {ParkingLot} from '../components/ParkingLot';
import {FLAT, GUARD, HIT, NeerajRig, VectorFighter, mixPose} from '../components/Rig';
import {
  DizzyStars,
  Dust,
  Flash,
  Gulal,
  HOLI,
  ImpactStar,
  PowderAir,
  Shake,
  SlamText,
  SpeedLines,
} from '../components/fx';

// ---------------------------------------------------------------------------
// Shared look for the Lily White Hotel teaser
// ---------------------------------------------------------------------------

const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;
const cam = (f: number, i: number[], o: number[]) =>
  interpolate(f, i, o, {...clamp, easing: Easing.inOut(Easing.cubic)});

const SKY = 'linear-gradient(#060a22, #1d1640 55%, #3a1d3c)';
const NAKUL_LOOK =
  'brightness(0.1) drop-shadow(0 0 5px #3fd2ff) drop-shadow(0 0 20px rgba(63,210,255,0.65))';
const NEERAJ_LOOK = 'drop-shadow(0 0 18px rgba(255,170,90,0.45))';
const RIG_H = 900;

const Hotel: React.FC<{width: number; baseY: number; scale: number}> = (p) => (
  <ParkingLot
    {...p}
    name="LILY WHITE HOTEL"
    hindi="लिली व्हाइट होटल"
    wall="#ddd6c8"
    banner="HAPPY HOLI"
  />
);

const Moon: React.FC<{x: number; y: number}> = ({x, y}) => (
  <div
    style={{
      position: 'absolute',
      left: x - 70,
      top: y - 70,
      width: 140,
      height: 140,
      borderRadius: '50%',
      background: '#fff3d6',
      boxShadow: '0 0 80px 30px rgba(255,240,200,0.25)',
    }}
  />
);

// A punch performed by a NeerajRig: wind-up -> fire -> recover.
const punch = (t: number, impact: number, fps: number) => {
  const windUp = cam(t, [impact - 26, impact - 8], [0, 1]);
  const fire = interpolate(t, [impact - 6, impact], [0, 1], {...clamp, easing: Easing.in(Easing.quad)});
  const back = spring({frame: t - impact - 14, fps, config: {damping: 16}});
  return {
    shoulder: (windUp * 28 + (-92 - windUp * 28) * fire) * (1 - back),
    elbow: -120 * windUp * (1 - fire) * (1 - back),
    lean: (-windUp * 4 + fire * 13) * (1 - back),
    dx: (-windUp * 30 + fire * 200) * (1 - back),
    smear: t >= impact - 4 && t <= impact + 2 ? 1 : 0,
  };
};

// Hit-stop: freezes time for `stop` frames after every impact.
const hitStop = (frame: number, impacts: number[], stop = 3) => {
  let t = frame;
  for (const i of impacts) {
    if (frame >= i + stop) t -= stop;
    else if (frame >= i) t -= frame - i;
  }
  return t;
};

const Floor: React.FC<{ground: number}> = ({ground}) => (
  <div
    style={{
      position: 'absolute',
      left: -1000,
      top: ground,
      width: 4000,
      height: 2000,
      background: 'linear-gradient(rgba(12,10,16,0), #0c0a10 30%)',
    }}
  />
);

const ContactShadow: React.FC<{x: number; ground: number; w?: number}> = ({x, ground, w = 400}) => (
  <div
    style={{
      position: 'absolute',
      left: x - w / 2,
      top: ground - 25,
      width: w,
      height: 50,
      borderRadius: '50%',
      background: 'rgba(0,0,0,0.55)',
      filter: 'blur(12px)',
    }}
  />
);

// ---------------------------------------------------------------------------
// SHOT 1 (0.0s) — "Arey, Lily White Hotel hai... Holi party ho rahi thi"
// ---------------------------------------------------------------------------
export const HotelScene: React.FC = () => {
  const frame = useCurrentFrame();
  const {width, height} = useVideoConfig();
  const zoom = cam(frame, [0, 75], [1.55, 1]) + frame * 0.0008;
  return (
    <AbsoluteFill style={{background: SKY}}>
      <AbsoluteFill style={{transform: `scale(${zoom})`, transformOrigin: '50% 34%'}}>
        <Moon x={width * 0.8} y={240} />
        <Hotel width={width} baseY={1300} scale={0.62} />
        <CrowdRow seed="holi1" width={width} y={1430} scale={0.55} color="#1c1230" count={16} rim="rgba(255,45,138,0.5)" />
        {[
          [40, 300, 1210],
          [58, 820, 1180],
          [76, 520, 1330],
          [96, 180, 1280],
          [112, 880, 1320],
          [126, 560, 1240],
        ].map(([s, x, y], i) => (
          <Gulal key={i} start={s} x={x} y={y} size={360} seed={`h${i}`} />
        ))}
        <CrowdRow seed="holi2" width={width} y={1900} scale={1.05} color="#0a0710" count={7} />
      </AbsoluteFill>
      <PowderAir count={50} opacity={interpolate(frame, [30, 70], [0, 0.8], clamp)} />
      <SlamText text="LILY WHITE" start={6} x={width / 2} y={260} size={150} color="#ffffff" hold={88} rotate={-4} />
      <SlamText text="HOTEL" start={12} x={width / 2} y={420} size={130} color="#ffd400" hold={82} rotate={3} />
      <SlamText text="HOLI PARTY!" start={100} x={width / 2} y={330} size={170} color="#ff2d8a" hold={41} rotate={-6} />
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------------------
// SHOT 2 (4.7s) — Nakul, "tagda ladka", beating up guys in the parking
// ---------------------------------------------------------------------------
const NAKUL_FREEZE = 112;
export const NakulScene: React.FC = () => {
  const real = useCurrentFrame();
  const {width, height, fps} = useVideoConfig();
  const frame = Math.min(real, NAKUL_FREEZE);
  const ground = height * 0.8;
  const I1 = 36;
  const I2 = 96;
  const t = hitStop(frame, [I1, I2]);

  const p = t < 66 ? punch(t, I1 - 0, fps) : punch(t, I2 - 3, fps);
  const nakulX = 150 + p.dx + Math.sin(t * 0.25) * 4;

  // Goon 1: already squared up, gets launched out of frame
  const g1 = spring({frame: t - I1, fps, config: {damping: 13, stiffness: 70}});
  const g1x = 900 + (t > I1 ? g1 * 900 : Math.sin(t * 0.2) * 10);
  const g1rot = t > I1 ? g1 * 70 : 0;
  const g1pose = mixPose(GUARD, HIT, t > I1 ? Math.min(1, g1 * 2) : 0);
  // Goon 2: rushes in from the right, same fate
  const g2 = spring({frame: t - (I2 - 3), fps, config: {damping: 13, stiffness: 70}});
  const run = interpolate(t, [48, I2 - 8], [1400, 900], clamp);
  const g2x = run + (t > I2 - 3 ? g2 * 900 : 0);
  const g2rot = t > I2 - 3 ? g2 * 70 : -8;
  const g2pose = mixPose(GUARD, HIT, t > I2 - 3 ? Math.min(1, g2 * 2) : 0);

  const zoom =
    1.05 +
    interpolate(frame, [I1, I1 + 3, I1 + 22], [0, 0.18, 0], clamp) +
    interpolate(frame, [I2 - 3, I2, I2 + 16], [0, 0.18, 0], clamp);
  const frozen = real >= NAKUL_FREEZE;
  const card = spring({frame: real - NAKUL_FREEZE, fps, config: {damping: 14}});

  return (
    <AbsoluteFill style={{background: SKY}}>
      <Shake from={I1} duration={14} intensity={30}>
        <Shake from={I2} duration={14} intensity={30}>
          <AbsoluteFill
            style={{
              transform: `scale(${zoom + (frozen ? (real - NAKUL_FREEZE) * 0.002 : 0)})`,
              transformOrigin: '50% 45%',
              filter: frozen ? 'saturate(0.3) contrast(1.2) brightness(0.8)' : undefined,
            }}
          >
            <Hotel width={width * 2} baseY={ground - 420} scale={0.62} />
            <CrowdRow seed="watch" width={width * 2} y={ground - 170} scale={0.75} color="#120c18" count={14} rim="rgba(255,190,90,0.35)" />
            <Floor ground={ground} />
            <ContactShadow x={nakulX + 110} ground={ground} />
            <ContactShadow x={g1x} ground={ground} w={300} />
            <ContactShadow x={g2x} ground={ground} w={300} />
            <svg width={width} height={height} style={{position: 'absolute', overflow: 'visible'}}>
              <g transform={`translate(${g2x} ${ground}) rotate(${g2rot}) scale(1)`}>
                <VectorFighter pose={g2pose} shorts="#6b6f78" />
              </g>
              <g transform={`translate(${g1x} ${ground}) rotate(${g1rot}) scale(1)`}>
                <VectorFighter pose={g1pose} shorts="#2f7bff" />
              </g>
            </svg>
            <div
              style={{
                position: 'absolute',
                left: nakulX,
                top: ground - RIG_H,
                transform: `rotate(${p.lean}deg)`,
                transformOrigin: '50% 100%',
                filter: NAKUL_LOOK,
              }}
            >
              <NeerajRig height={RIG_H} shoulder={p.shoulder} elbow={p.elbow} smear={p.smear} />
            </div>
            <ImpactStar start={I1} x={860} y={ground - 780} size={380} color="#3fd2ff" />
            <ImpactStar start={I2} x={860} y={ground - 780} size={380} color="#3fd2ff" />
            <Gulal start={I1} x={880} y={ground - 760} size={300} seed="n1" />
            <Gulal start={I2} x={880} y={ground - 760} size={300} seed="n2" />
          </AbsoluteFill>
        </Shake>
      </Shake>
      <PowderAir count={30} opacity={0.6} />
      {/* South-Indian-movie style freeze-frame name card */}
      {frozen ? (
        <AbsoluteFill>
          <div
            style={{
              position: 'absolute',
              left: 0,
              top: 1180,
              width: '100%',
              height: 330,
              background: 'linear-gradient(90deg, #3fd2ffdd, #2f7bffdd)',
              transform: `translateX(${(1 - card) * -1100}px) skewY(-4deg)`,
            }}
          />
          <div
            style={{
              position: 'absolute',
              left: 70,
              top: 1190,
              fontFamily: 'Impact, "Arial Black", sans-serif',
              color: 'white',
              transform: `translateX(${(1 - card) * 1100}px) rotate(-4deg)`,
              textShadow: '6px 6px 0 #0b1a3a',
            }}
          >
            <div style={{fontSize: 210, lineHeight: 1}}>NAKUL</div>
            <div style={{fontSize: 46, letterSpacing: 4, color: '#0b1a3a', textShadow: 'none'}}>
              TAGDA BOXER • AAJ TAK NAHI PITA
            </div>
          </div>
        </AbsoluteFill>
      ) : null}
      <Flash start={I1} frames={1} />
      <Flash start={I2} frames={1} />
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------------------
// SHOT 3 (9.7s) — Neeraj comes out of the crowd
// ---------------------------------------------------------------------------
export const EntryScene: React.FC = () => {
  const frame = useCurrentFrame();
  const {width, height} = useVideoConfig();
  const walk = cam(frame, [0, 108], [0, 1]);
  const part = cam(frame, [8, 60], [0, 1]);
  const step = Math.abs(Math.sin(frame * 0.3)) * 16 * (1 - walk * 0.4);
  const scale = interpolate(walk, [0, 1], [0.42, 0.84]);
  const light = interpolate(walk, [0, 0.6, 1], [0.15, 0.75, 1]);
  return (
    <AbsoluteFill style={{background: SKY}}>
      <AbsoluteFill style={{transform: `scale(${interpolate(frame, [0, 115], [1, 1.1])})`}}>
        <Hotel width={width} baseY={height * 0.6} scale={0.55} />
        <CrowdRow seed="far" width={width} y={height * 0.62} scale={0.45} color="#1d1028" count={22} part={part * 0.5} />
        <CrowdRow seed="mid" width={width} y={height * 0.72} scale={0.7} color="#140a1c" count={12} part={part} rim="rgba(255,45,138,0.4)" />
        <Gulal start={14} x={width * 0.3} y={height * 0.66} size={420} seed="e1" />
        <Gulal start={22} x={width * 0.7} y={height * 0.64} size={420} seed="e2" />
        <Img
          src={staticFile('neeraj_front.png')}
          style={{
            position: 'absolute',
            left: width / 2,
            top: height * 0.97,
            height: height * 0.85,
            transform: `translate(-50%, -100%) translateY(${-step}px) scale(${scale}) rotate(${Math.sin(frame * 0.15) * 1.5}deg)`,
            transformOrigin: '50% 100%',
            filter: `brightness(${light}) drop-shadow(0 0 30px rgba(255,120,60,${walk * 0.6}))`,
          }}
        />
        <CrowdRow seed="near" width={width} y={height * 1.05} scale={1.25} color="#07040b" count={7} part={part * 1.3} />
      </AbsoluteFill>
      <PowderAir count={40} />
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------------------
// SHOT 4 (13.55s) — the angry look (snap-zoom at ~14.0s)
// ---------------------------------------------------------------------------
const SNAP = 14;
export const AngryScene: React.FC = () => {
  const frame = useCurrentFrame();
  const {width, height, fps} = useVideoConfig();
  if (frame < SNAP) {
    // slow-mo medium shot, colours drifting past
    return (
      <AbsoluteFill style={{background: SKY}}>
        <Hotel width={width} baseY={height * 0.55} scale={0.5} />
        <Img
          src={staticFile('neeraj_front.png')}
          style={{
            position: 'absolute',
            left: width / 2,
            top: height * 1.25,
            height: height * 1.2,
            transform: `translate(-50%, -100%) scale(${1 + frame * 0.01})`,
            transformOrigin: '50% 20%',
            filter: NEERAJ_LOOK,
          }}
        />
        <Gulal start={0} x={width * 0.2} y={height * 0.35} size={500} seed="a1" />
        <PowderAir count={60} />
      </AbsoluteFill>
    );
  }
  const f = frame - SNAP;
  const pop = spring({frame: f, fps, config: {damping: 12, stiffness: 180}});
  const push = interpolate(f, [0, 90], [1, 1.12]);
  return (
    <AbsoluteFill
      style={{
        background: `radial-gradient(circle, ${HOLI[0]}, #5a0b6b 70%)`,
      }}
    >
      <SpeedLines color="rgba(15,0,20,0.85)" inner={0.22} />
      <Gulal start={0} x={width * 0.15} y={height * 0.4} size={520} seed="b1" />
      <Gulal start={2} x={width * 0.85} y={height * 0.55} size={520} seed="b2" />
      <Img
        src={staticFile('face_angry.png')}
        style={{
          position: 'absolute',
          left: width / 2,
          top: height * 0.47,
          width: width * 1.1,
          transform: `translate(-50%, -50%) scale(${pop * push})`,
          filter: 'drop-shadow(0 0 40px rgba(0,0,0,0.6))',
          WebkitMaskImage: 'linear-gradient(#000 80%, transparent 100%)',
        }}
      />
      <SlamText text="NEERAJ" start={SNAP + 4} x={width / 2} y={height * 0.15} size={200} hold={90} rotate={-5} />
      <SlamText text="PEPSU" start={SNAP + 10} x={width / 2} y={height * 0.82} size={170} color="#fff" hold={90} rotate={4} />
      <Flash start={SNAP} frames={1} />
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------------------
// SHOT 5 (16.95s) — face-off, ONE punch at 19.8s (the boom), Nakul out cold
// ---------------------------------------------------------------------------
export const FIGHT_IMPACT = 86; // 508 + 86 = frame 594 = 19.8s
export const FightScene: React.FC = () => {
  const frame = useCurrentFrame();
  const {width, height, fps} = useVideoConfig();
  const impact = FIGHT_IMPACT;
  const ground = height * 0.8;
  const t = hitStop(frame, [impact], 4);
  const after = Math.max(0, t - impact);

  const p = punch(t, impact, fps);
  const back = spring({frame: t - impact - 40, fps, config: {damping: 16}});
  const neerajX = 140 + (t < impact ? p.dx : 170);
  const lean = t < impact ? p.lean : 13 * (1 - back);
  const shoulder = t < impact ? p.shoulder : -92 * (1 - back);
  const elbow = t < impact ? p.elbow : 0;

  // Nakul charges in from the right, then gets knocked out
  const hit = t > impact;
  const fall = spring({frame: after, fps, config: {damping: 14, mass: 1.4, stiffness: 60}});
  const charge = interpolate(t, [10, impact], [1070, 920], {...clamp, easing: Easing.in(Easing.quad)});
  const nakulX = charge + (hit ? fall * 120 : 0);
  const nakulRot = hit ? Math.min(fall, 1.03) * 84 : -6;
  const bob = hit ? 0 : Math.abs(Math.sin(t * 0.45)) * 18;
  const nakulArm = hit ? -40 * Math.min(1, fall * 2) : 20 * Math.sin(t * 0.45);

  const fistX = 140 + 170 + 530;
  const fistY = ground - 780;
  const pull = cam(frame, [impact + 12, impact + 45], [0, 1]);
  const zoom =
    interpolate(frame, [0, impact - 1], [1, 1.12], clamp) * (1 - pull) +
    0.5 * pull +
    interpolate(frame, [impact, impact + 3, impact + 30], [0, 0.3, 0], clamp);
  const fx = fistX * (1 - pull);
  const fy = fistY + (ground - fistY) * pull;
  const invert = frame >= impact && frame < impact + 2;
  const landing = impact + 4 + 32;
  const headX = nakulX + 0.86 * 950;
  const end = interpolate(frame, [150, 162], [0, 1], clamp);

  return (
    <AbsoluteFill style={{background: SKY}}>
      <Shake from={impact} duration={22} intensity={45}>
        <Shake from={landing} duration={14} intensity={25}>
          <AbsoluteFill
            style={{
              transform: `translate(${fx * (1 - zoom)}px, ${fy * (1 - zoom)}px) scale(${zoom})`,
              transformOrigin: '0 0',
              filter: invert ? 'invert(1) contrast(1.6) grayscale(1)' : undefined,
            }}
          >
            <Hotel width={width * 2} baseY={ground - 420} scale={0.62} />
            <CrowdRow seed="onlookers" width={width * 2} y={ground - 170} scale={0.75} color="#120c18" count={14} rim="rgba(255,45,138,0.35)" />
            <Floor ground={ground} />
            {frame >= impact && frame < impact + 20 ? (
              <SpeedLines color="rgba(255,255,255,0.25)" cx={fistX / width} cy={fistY / height} count={60} />
            ) : null}
            <ContactShadow x={neerajX + 110} ground={ground} />
            <ContactShadow x={nakulX + nakulRot * 5} ground={ground} w={400 + nakulRot * 6} />

            {/* Nakul: mirrored rig so he faces left */}
            <div
              style={{
                position: 'absolute',
                left: nakulX - 117,
                top: ground - 950 - bob,
                transform: `rotate(${nakulRot}deg)`,
                transformOrigin: '50% 100%',
                filter: NAKUL_LOOK,
              }}
            >
              <div style={{transform: 'scaleX(-1)'}}>
                <NeerajRig height={950} shoulder={nakulArm} elbow={hit ? 0 : -60} />
              </div>
            </div>

            {/* Neeraj */}
            <div
              style={{
                position: 'absolute',
                left: neerajX,
                top: ground - RIG_H,
                transform: `rotate(${lean}deg)`,
                transformOrigin: '50% 100%',
                filter: NEERAJ_LOOK,
              }}
            >
              <NeerajRig height={RIG_H} shoulder={shoulder} elbow={elbow} smear={p.smear} />
            </div>

            <ImpactStar start={impact} x={fistX + 40} y={fistY} size={520} />
            <Gulal start={impact} x={fistX + 60} y={fistY} size={520} seed="ko" />
            <Dust start={landing} x={nakulX + 600} y={ground} spread={700} count={30} />
            <Gulal start={landing} x={headX} y={ground - 80} size={600} seed="land" />
            <DizzyStars x={headX} y={ground - 170} start={landing + 4} r={150} size={90} />
          </AbsoluteFill>
        </Shake>
      </Shake>
      <SlamText text="DHISHUM!" start={impact} x={width * 0.5} y={height * 0.2} size={190} hold={36} />
      <SlamText text="K.O." start={landing + 2} x={width * 0.5} y={height * 0.3} size={260} color="#ff2d8a" hold={60} rotate={-3} />
      <Flash start={impact} frames={1} />
      <AbsoluteFill style={{background: 'black', opacity: end}} />
    </AbsoluteFill>
  );
};
