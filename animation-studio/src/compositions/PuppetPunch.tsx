import React from 'react';
import {AbsoluteFill, Easing, interpolate, spring, useCurrentFrame, useVideoConfig} from 'remotion';
import {CrowdRow} from '../components/Crowd';
import {Dust, Flash, Grade, ImpactStar, Shake, SlamText, SpeedLines} from '../components/fx';
import {FLAT, GUARD, HIT, NeerajRig, VectorFighter, mixPose} from '../components/Rig';

// Key frames of the action
const STEP = 30; // step in + wind up
const PUNCH = 62; // arm starts firing
const IMPACT = 68; // contact
const HITSTOP = 4; // frozen frames on contact
const RECOVER = 100; // Neeraj pulls arm back

const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;
const ease = (f: number, i: number[], o: number[], e = Easing.inOut(Easing.cubic)) =>
  interpolate(f, i, o, {...clamp, easing: e});

export const PuppetPunch: React.FC = () => {
  const frame = useCurrentFrame();
  const {width, height, fps} = useVideoConfig();
  const ground = height * 0.9;
  const rigH = 680;

  // Hit-stop: every animation below reads `t` instead of `frame`, so time freezes on contact
  const t = frame < IMPACT ? frame : frame < IMPACT + HITSTOP ? IMPACT : frame - HITSTOP;
  const after = Math.max(0, t - IMPACT);

  // ---- Neeraj (cutout rig) ----
  const breathe = Math.sin(frame * 0.15) * 0.008;
  const x = 380 + ease(t, [STEP, PUNCH], [0, 110]) + ease(t, [PUNCH, IMPACT], [0, 70], Easing.in(Easing.quad));
  const windShoulder = ease(t, [STEP, PUNCH - 4], [0, 28]);
  const windElbow = ease(t, [STEP, PUNCH - 4], [0, -120]);
  const fire = ease(t, [PUNCH, IMPACT], [0, 1], Easing.in(Easing.quad));
  const back = spring({frame: t - RECOVER, fps, config: {damping: 16}});
  const shoulder = (windShoulder + (-92 - windShoulder) * fire) * (1 - back);
  const elbow = windElbow * (1 - fire) * (1 - back);
  const lean = (ease(t, [STEP, PUNCH - 4], [0, -4]) + fire * 13) * (1 - back);
  const smear = t >= PUNCH + 2 && t <= IMPACT + 2 ? 1 : 0;

  // ---- Opponent (vector rig, faces left) ----
  const hitAmt = spring({frame: after, fps, config: {damping: 10, stiffness: 140}});
  const fall = spring({frame: after - 6, fps, config: {damping: 9, mass: 1.6, stiffness: 55}});
  const settle = spring({frame: after - 30, fps, config: {damping: 12}});
  const bounce = t > IMPACT ? 0 : Math.sin(frame * 0.22) * 8;
  let pose = mixPose(GUARD, HIT, t > IMPACT ? hitAmt : 0);
  pose = mixPose(pose, FLAT, t > IMPACT ? settle : 0);
  // secondary motion: arms and head keep swinging a little after the body lands
  const wobble = t > IMPACT + 30 ? Math.sin(after * 0.5) * Math.exp(-(after - 30) / 12) * 18 : 0;
  pose.head += wobble;
  pose.lShoulder += wobble * 1.5;
  const oppX = 1010 + (t > IMPACT ? fall * 60 + hitAmt * 30 : 0);
  const bodyRot = t > IMPACT ? Math.min(fall, 1.04) * 86 : 0;

  // ---- Camera ----
  const fistX = x + 400;
  const fistY = ground - 590;
  const zoom =
    1 +
    ease(t, [STEP, IMPACT], [0, 0.18]) +
    interpolate(frame, [IMPACT, IMPACT + 3, IMPACT + 40], [0, 0.3, 0], clamp) -
    ease(t, [IMPACT + 30, IMPACT + 70], [0, 0.18]);
  const landing = IMPACT + HITSTOP + 30;

  return (
    <AbsoluteFill style={{background: 'radial-gradient(ellipse at 50% 30%, #3a1a33, #0c0610 70%)'}}>
      <Shake from={IMPACT} duration={20} intensity={40}>
        <Shake from={landing} duration={14} intensity={22}>
          <AbsoluteFill style={{transform: `scale(${zoom})`, transformOrigin: `${fistX}px ${fistY}px`}}>
            <CrowdRow seed="arena" width={width} y={ground - 180} scale={0.6} color="#1b0e20" count={20} />
            {/* ring ropes */}
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                style={{
                  position: 'absolute',
                  left: 0,
                  top: ground - 520 + i * 120,
                  width,
                  height: 10,
                  background: '#c2262e',
                  boxShadow: '0 4px 8px rgba(0,0,0,0.6)',
                }}
              />
            ))}
            <div
              style={{
                position: 'absolute',
                left: 0,
                top: ground,
                width,
                height: height - ground,
                background: 'linear-gradient(#2c4a7a, #12203a)',
              }}
            />
            {frame >= IMPACT && frame < IMPACT + 18 ? (
              <SpeedLines color="rgba(255,255,255,0.3)" cx={fistX / width} cy={fistY / height} count={70} />
            ) : null}

            {/* opponent */}
            <svg width={width} height={height} style={{position: 'absolute', left: 0, top: 0, overflow: 'visible'}}>
              <ellipse cx={oppX + bodyRot * 3.5} cy={ground} rx={140 + bodyRot * 3} ry={22} fill="rgba(0,0,0,0.45)" />
              <g transform={`translate(${oppX} ${ground - (t > IMPACT ? 0 : bounce)}) rotate(${bodyRot}) scale(0.8)`}>
                <VectorFighter pose={pose} />
              </g>
            </svg>

            {/* Neeraj */}
            <div
              style={{
                position: 'absolute',
                left: x,
                top: ground - rigH,
                transform: `rotate(${lean}deg) scaleY(${1 + breathe})`,
                transformOrigin: '50% 100%',
              }}
            >
              <NeerajRig height={rigH} shoulder={shoulder} elbow={elbow} smear={smear} />
            </div>

            <ImpactStar start={IMPACT} x={fistX + 40} y={fistY} size={420} />
            <Dust start={landing} x={oppX + 380} y={ground} spread={420} />
          </AbsoluteFill>
        </Shake>
      </Shake>
      <SlamText text="DHISHUM!" start={IMPACT} x={width * 0.5} y={height * 0.16} size={150} hold={34} />
      <SlamText text="K.O." start={landing + 6} x={width * 0.5} y={height * 0.22} size={220} color="#ff3b2f" hold={70} />
      <Flash start={IMPACT} frames={1} />
      <Grade />
    </AbsoluteFill>
  );
};
