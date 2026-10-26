import React from 'react';
import {AbsoluteFill, Audio, Img, interpolate, staticFile, useCurrentFrame, Easing} from 'remotion';
import {DizzyStars, Dust, Flash, ImpactStar, Shake, SlamText} from '../../components/fx';

// Hotel parking fight, 1080x1920. Audio = edited 19.9 s narration (frame = seconds*30).
// Neeraj faces right, the Boxer is mirrored to face left.
const GROUND = 1500;
const NS = 1.9; // Neeraj scale
const BS = 2.5; // Boxer scale (he is the taller man)
const f = (s: number) => Math.round(s * 30);

const SIZES: Record<string, [number, number]> = {
  n_idle: [258, 435], n_windup: [268, 436], n_punch: [379, 430], n_follow: [394, 426], n_stand: [172, 466], b_guard: [153, 356], b_surprise: [159, 356], b_counter: [222, 351], b_block: [139, 349], b_broken: [232, 348], b_grabbed: [145, 307], b_jawhit: [180, 355], b_injured: [188, 235],
};

const pick = (frame: number, keys: [number, string][]) => {
  let cur = keys[0][1];
  for (const [t, p] of keys) if (frame >= t) cur = p;
  return cur;
};
const kf = (frame: number, pts: [number, number][], ease = true) =>
  interpolate(frame, pts.map((p) => p[0]), pts.map((p) => p[1]), {
    extrapolateLeft: 'clamp', extrapolateRight: 'clamp',
    easing: ease ? Easing.inOut(Easing.quad) : undefined,
  });

const Pose: React.FC<{name: string; x: number; scale: number; flip?: boolean; y?: number; rot?: number; opacity?: number}> = ({
  name, x, scale, flip, y = 0, rot = 0, opacity = 1,
}) => {
  const [w, h] = SIZES[name];
  return (
    <Img
      src={staticFile(`fight/${name}.png`)}
      style={{
        position: 'absolute', left: x - (w * scale) / 2, top: GROUND - h * scale + y, width: w * scale, height: h * scale,
        transform: `${flip ? 'scaleX(-1)' : ''} rotate(${rot}deg)`, transformOrigin: '50% 100%', opacity,
      }}
    />
  );
};

const Caption: React.FC<{from: number; to: number; text: string}> = ({from, to, text}) => {
  const frame = useCurrentFrame();
  if (frame < from || frame >= to) return null;
  const pop = interpolate(frame, [from, from + 5], [0.85, 1], {extrapolateRight: 'clamp'});
  return (
    <div style={{
      position: 'absolute', left: 60, right: 60, top: 1600, textAlign: 'center', fontFamily: 'DejaVu Sans, Arial, sans-serif',
      fontSize: 68, fontWeight: 900, lineHeight: 1.1, color: '#fff', WebkitTextStroke: '8px #000', paintOrder: 'stroke fill', textShadow: '0 6px 0 #000',
      transform: `scale(${pop})`, letterSpacing: 1,
    }}>{text}</div>
  );
};

const Hit: React.FC<{at: number; x: number; y: number; size?: number}> = ({at, x, y, size = 260}) => (
  <>
    <ImpactStar start={at} x={x} y={y} size={size} />
    <Dust start={at} x={x} y={y + 80} count={10} spread={140} />
  </>
);

export const Fight: React.FC = () => {
  const frame = useCurrentFrame();

  // ---------- Neeraj ----------
  const nx = kf(frame, [[0, -320], [f(3.4), -320], [f(4.8), 300], [f(5.0), 300], [f(5.1), 400]]);
  const walkBob = frame > f(3.4) && frame < f(4.8) ? Math.abs(Math.sin(frame * 0.6)) * -22 : 0;
  const punchTimes = [f(5.1), f(10.0), f(10.6), f(11.2), f(11.9)]; // first hit + the 4 punches on the block
  const rapid: number[] = [];
  for (let t = f(13.9); t < f(17.1); t += 8) rapid.push(t);
  const jawTime = f(19.05);
  const allPunch = [...punchTimes, ...rapid, jawTime];
  const inPunch = allPunch.some((t) => frame >= t && frame < t + 5);
  const nearWind = allPunch.some((t) => frame >= t - 6 && frame < t);
  let nPose = 'n_idle';
  if (frame < f(3.4)) nPose = 'n_idle';
  else if (inPunch) nPose = 'n_punch';
  else if (nearWind) nPose = 'n_windup';
  else if (frame >= f(7.0) && frame < f(9.6)) nPose = 'n_stand';
  else if (frame >= f(19.7)) nPose = 'n_stand';
  else if (frame >= f(5.1) && frame < f(5.5)) nPose = 'n_follow';
  const nxFinal = nx + (frame >= f(5.1) ? (frame >= f(13.8) ? 60 : 0) : 0);
  const nShrug = frame >= f(7.0) && frame < f(9.6) ? Math.sin((frame - f(7.0)) * 0.35) * 8 : 0;

  // ---------- Boxer ----------
  const bPoseKeys: [number, string][] = [
    [0, 'b_guard'], [f(5.1), 'b_surprise'], [f(5.9), 'b_guard'], [f(6.9), 'b_counter'], [f(7.9), 'b_guard'],
    [f(9.9), 'b_block'], [f(13.0), 'b_broken'], [f(13.8), 'b_grabbed'], [f(19.05), 'b_jawhit'], [f(19.75), 'b_injured'],
  ];
  const bPose = pick(frame, bPoseKeys);
  const bx = kf(frame, [
    [0, 800], [f(5.1), 800], [f(5.3), 850], [f(6.0), 830], [f(10.0), 830], [f(12.4), 880], [f(13.0), 880], [f(13.9), 800],
    [f(19.05), 800], [f(19.7), 880], [f(19.9), 850],
  ]);
  const bShake = (frame >= f(10.0) && frame < f(12.8)) || (frame >= f(13.9) && frame < f(17.2))
    ? Math.sin(frame * 2.3) * 7 : 0;
  const bRot = frame >= f(19.05) && frame < f(19.7) ? kf(frame, [[f(19.05), 0], [f(19.4), 18]]) : 0;
  const bY = frame >= f(19.05) && frame < f(19.7) ? -Math.sin(((frame - f(19.05)) / f(0.65)) * Math.PI) * 120 : 0;
  const bBob = bPose === 'b_guard' ? Math.sin(frame * 0.5) * 6 : 0;

  // camera: slow push-in, shake on big hits
  const zoom = kf(frame, [[0, 1.0], [f(19.0), 1.12], [f(21.9), 1.06]], false);

  return (
    <AbsoluteFill style={{backgroundColor: '#111'}}>
      <Audio src={staticFile('jobs/2026-10-23-dev-tanwar-short/fight.wav')} />
      <Shake from={f(5.1)} duration={8} intensity={14}>
        <Shake from={jawTime} duration={14} intensity={46}>
          <AbsoluteFill style={{transform: `scale(${zoom})`, transformOrigin: '50% 70%'}}>
            <Img src={staticFile('fight/bg_parking.png')} style={{width: '100%', height: '100%', objectFit: 'cover'}} />
            <Pose name={bPose} x={bx + bShake} scale={BS} flip y={bY + bBob} rot={bRot} />
            <Pose name={nPose} x={nxFinal} scale={NS} y={walkBob + nShrug} />

            {/* impacts */}
            <Hit at={f(5.1)} x={720} y={GROUND - 650} />
            <Hit at={f(6.95)} x={420} y={GROUND - 640} size={200} />
            {[f(10.0), f(10.6), f(11.2), f(11.9)].map((t) => <Hit key={t} at={t + 3} x={760} y={GROUND - 600} size={230} />)}
            <Dust start={f(13.0)} x={800} y={GROUND - 500} count={22} spread={320} />
            {rapid.map((t, i) => <Hit key={t} at={t + 3} x={740} y={GROUND - 430 - (i % 2) * 120} size={190} />)}
            <Hit at={jawTime + 3} x={820} y={GROUND - 700} size={420} />
            <DizzyStars x={850} y={GROUND - 330} start={f(19.9)} />
          </AbsoluteFill>
        </Shake>
      </Shake>
      <Flash start={f(5.1)} frames={3} />
      <Flash start={f(13.0)} frames={4} />
      <Flash start={jawTime + 3} frames={5} />

      <SlamText text="BLOCK TOOTA!" start={f(13.0)} x={540} y={420} size={110} rotate={-6} />
      <SlamText text="PAT PAT PAT!" start={f(14.6)} x={540} y={420} size={110} rotate={5} />
      <SlamText text="JABDA TOOTA!" start={jawTime + 3} x={540} y={420} size={120} rotate={-5} />

      {/* captions (Roman Hinglish, timed to the edited audio) */}
      <Caption from={0} to={f(3.4)} text="Hotel ki parking, raat" />
      <Caption from={f(3.4)} to={f(5.0)} text="Neeraj bhai aaye. Boxer kahan hai?" />
      <Caption from={f(5.0)} to={f(7.0)} text="Neeraj bhai ne maara ghoosa!" />
      <Caption from={f(7.0)} to={f(9.8)} text="Boxer ne ulta maara. Par Neeraj bhai ke liye itna hi bahut tha" />
      <Caption from={f(9.8)} to={f(13.7)} text="Boxer ne block kiya. 4 ghoose mein saare block toot gaye" />
      <Caption from={f(13.7)} to={f(17.3)} text="Phir pakad ke pata-pat... pasli tod di" />
      <Caption from={f(17.3)} to={f(19.9)} text="Ek ghoosa aur... jabda tod diya!" />
      <Caption from={f(19.9)} to={f(22)} text="Boxer ghayal" />
    </AbsoluteFill>
  );
};
