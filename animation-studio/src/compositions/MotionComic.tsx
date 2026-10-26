import React from 'react';
import {
  AbsoluteFill,
  Easing,
  Img,
  Sequence,
  interpolate,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion';
import {CrowdRow} from '../components/Crowd';
import {ParkingLot} from '../components/ParkingLot';
import {Dust, Flash, Grade, ImpactStar, Shake, SlamText, SpeedLines} from '../components/fx';
import {NeerajRig} from '../components/Rig';

// Story beats (frames @30fps). Change these to retime the whole video.
export const BEATS = {
  crowd: 0, // Neeraj pushes out of the crowd
  face: 105, // angry close-up
  faceOff: 165, // both fighters, wind-up
  impact: 228, // punch lands
  knockdown: 240, // opponent falls
  endCard: 345,
  end: 450,
};

const cam = (frame: number, input: number[], output: number[]) =>
  interpolate(frame, input, output, {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.inOut(Easing.cubic),
  });

// ---------- Scene 1: out of the crowd ----------
const CrowdScene: React.FC = () => {
  const frame = useCurrentFrame();
  const {width, height} = useVideoConfig();
  const walk = cam(frame, [0, 100], [0, 1]);
  const part = cam(frame, [10, 70], [0, 1]);
  const step = Math.abs(Math.sin(frame * 0.32)) * 18 * (1 - walk * 0.4);
  const scale = interpolate(walk, [0, 1], [0.42, 0.82]);
  const light = interpolate(walk, [0, 0.6, 1], [0.15, 0.7, 1]);
  const camZoom = interpolate(frame, [0, 105], [1, 1.12]);

  return (
    <AbsoluteFill style={{background: 'linear-gradient(#05081a, #1a1633 55%, #2a1c2c)'}}>
      <AbsoluteFill style={{transform: `scale(${camZoom})`}}>
        <ParkingLot width={width} baseY={height * 0.6} scale={0.55} />
        <CrowdRow seed="far" width={width} y={height * 0.62} scale={0.45} color="#1d1028" count={22} part={part * 0.5} />
        <CrowdRow seed="mid" width={width} y={height * 0.72} scale={0.7} color="#140a1c" count={12} part={part} />

        {/* Neeraj walking toward camera */}
        <Img
          src={staticFile('neeraj_front.png')}
          style={{
            position: 'absolute',
            left: width / 2,
            top: height * 0.97,
            height: height * 0.85,
            transform: `translate(-50%, -100%) translateY(${-step}px) scale(${scale}) rotate(${Math.sin(frame * 0.16) * 1.5}deg)`,
            transformOrigin: '50% 100%',
            filter: `brightness(${light}) drop-shadow(0 0 30px rgba(255,120,60,${walk * 0.6}))`,
          }}
        />

        <CrowdRow seed="near" width={width} y={height * 1.05} scale={1.25} color="#07040b" count={7} part={part * 1.3} />
      </AbsoluteFill>
      <Caption text="Bheed se nikla ek sher..." from={20} to={100} />
    </AbsoluteFill>
  );
};

// ---------- Scene 2: angry close-up ----------
const FaceScene: React.FC = () => {
  const frame = useCurrentFrame();
  const {width, height, fps} = useVideoConfig();
  const pop = spring({frame, fps, config: {damping: 12, stiffness: 180}});
  const push = interpolate(frame, [0, 60], [1, 1.15]);
  return (
    <AbsoluteFill style={{background: 'radial-gradient(circle, #ff5a1f, #8a0b0b 70%)'}}>
      <SpeedLines color="rgba(20,0,0,0.85)" inner={0.22} />
      <Img
        src={staticFile('face_angry.png')}
        style={{
          position: 'absolute',
          left: width / 2,
          top: height * 0.47,
          width: width * 1.1,
          transform: `translate(-50%, -50%) scale(${pop * push})`,
          filter: 'drop-shadow(0 0 40px rgba(0,0,0,0.6))',
        }}
      />
      <SlamText text="NEERAJ" start={8} x={width / 2} y={height * 0.15} size={200} hold={60} rotate={-5} />
      <SlamText text="PEPSU" start={14} x={width / 2} y={height * 0.82} size={170} color="#fff" hold={60} rotate={4} />
    </AbsoluteFill>
  );
};

// ---------- Scenes 3-5: face-off, punch, knockdown ----------
const FightScene: React.FC = () => {
  const frame = useCurrentFrame(); // local frame, 0 = BEATS.faceOff
  const {width, height, fps} = useVideoConfig();
  const impact = BEATS.impact - BEATS.faceOff;
  const ground = height * 0.8;
  const rigH = 900;
  const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;

  // Hit-stop: freeze time for 4 frames on contact (classic anime/fighting-game trick)
  const t = frame < impact ? frame : frame < impact + 4 ? impact : frame - 4;
  const after = Math.max(0, t - impact);

  // Neeraj (cutout rig): wind-up, then lunge + punch, then recover
  const windUp = cam(t, [10, impact - 8], [0, 1]);
  const fire = interpolate(t, [impact - 6, impact], [0, 1], {...clamp, easing: Easing.in(Easing.quad)});
  const back = spring({frame: t - impact - 40, fps, config: {damping: 16}});
  const neerajX = 140 - windUp * 30 + fire * 200;
  const lean = (-windUp * 4 + fire * 13) * (1 - back);
  const shoulder = (windUp * 28 + (-92 - windUp * 28) * fire) * (1 - back);
  const elbow = -120 * windUp * (1 - fire) * (1 - back);
  const smear = t >= impact - 4 && t <= impact + 2 ? 1 : 0;

  // Opponent: idle bounce, then flies back and rotates to the floor (spring = physical feel)
  const hit = t > impact;
  const fall = spring({frame: after, fps, config: {damping: 14, mass: 1.4, stiffness: 60}});
  const oppX = 920 + (hit ? fall * 120 : 0);
  const oppRot = hit ? Math.min(fall, 1.03) * 84 : 0;
  const bob = hit ? 0 : Math.sin(frame * 0.2) * 8;

  // Camera: push in on the fist during wind-up, punch-zoom on impact, then pull wide for the knockdown
  const fistX = neerajX + 530;
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

  return (
    <AbsoluteFill style={{background: 'linear-gradient(#05081a, #1a1633 60%, #2a1c2c)'}}>
      <Shake from={impact} duration={22} intensity={45}>
        <Shake from={landing} duration={14} intensity={25}>
          <AbsoluteFill
            style={{
              transform: `translate(${fx * (1 - zoom)}px, ${fy * (1 - zoom)}px) scale(${zoom})`,
              transformOrigin: '0 0',
              filter: invert ? 'invert(1) contrast(1.6) grayscale(1)' : undefined,
            }}
          >
            <ParkingLot width={width * 2} baseY={ground - 420} scale={0.62} />
            <CrowdRow seed="onlookers" width={width * 2} y={ground - 170} scale={0.75} color="#120c18" count={14} rim="rgba(255,190,90,0.35)" />
            {/* floor */}
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
            {frame >= impact && frame < impact + 20 ? (
              <SpeedLines color="rgba(255,255,255,0.25)" cx={fistX / width} cy={fistY / height} count={60} />
            ) : null}
            {/* contact shadows */}
            {[neerajX + 110, oppX + oppRot * 5].map((x, i) => (
              <div
                key={i}
                style={{
                  position: 'absolute',
                  left: x - 200 - (i ? oppRot * 3 : 0),
                  top: ground - 25,
                  width: 400 + (i ? oppRot * 6 : 0),
                  height: 50,
                  borderRadius: '50%',
                  background: 'rgba(0,0,0,0.55)',
                  filter: 'blur(12px)',
                }}
              />
            ))}

            {/* Opponent: placeholder backlit silhouette (swap in your own opponent art) */}
            <Img
              src={staticFile('neeraj_side.png')}
              style={{
                position: 'absolute',
                left: oppX,
                top: ground - bob,
                height: 950,
                transform: `translate(-50%, -100%) rotate(${oppRot}deg) scaleX(-0.95)`,
                transformOrigin: '50% 100%',
                filter: 'brightness(0) drop-shadow(0 0 6px #ff3b2f) drop-shadow(0 0 22px rgba(255,59,47,0.6))',
              }}
            />

            {/* Neeraj */}
            <div
              style={{
                position: 'absolute',
                left: neerajX,
                top: ground - rigH,
                transform: `rotate(${lean}deg)`,
                transformOrigin: '50% 100%',
                filter: 'drop-shadow(0 0 18px rgba(255,170,90,0.45))',
              }}
            >
              <NeerajRig height={rigH} shoulder={shoulder} elbow={elbow} smear={smear} />
            </div>

            <ImpactStar start={impact} x={fistX + 40} y={fistY} size={520} />
            <Dust start={landing} x={oppX + 600} y={ground} spread={700} count={30} />
          </AbsoluteFill>
        </Shake>
      </Shake>
      <SlamText text="DHISHUM!" start={impact} x={width * 0.5} y={height * 0.2} size={190} hold={40} />
      <SlamText text="K.O." start={landing + 6} x={width * 0.5} y={height * 0.33} size={260} color="#ff3b2f" hold={60} rotate={-3} />
      <Flash start={impact} frames={1} />
      <Caption text="Ek hi punch. Khel khatam." from={landing + 10} to={landing + 70} />
    </AbsoluteFill>
  );
};

// ---------- Scene 6: end card ----------
const EndCard: React.FC = () => {
  const frame = useCurrentFrame();
  const {width, height, fps} = useVideoConfig();
  const kb = interpolate(frame, [0, 105], [1.15, 1.32]);
  const title = spring({frame: frame - 10, fps, config: {damping: 14}});
  return (
    <AbsoluteFill style={{background: '#061208'}}>
      <Img
        src={staticFile('hero.jpg')}
        style={{
          position: 'absolute',
          left: width / 2,
          top: height * 0.42,
          height: height * 0.95,
          transform: `translate(-50%, -50%) scale(${kb})`,
        }}
      />
      <AbsoluteFill style={{background: 'linear-gradient(rgba(0,0,0,0) 50%, rgba(0,0,0,0.95) 85%)'}} />
      <div
        style={{
          position: 'absolute',
          bottom: 260,
          width: '100%',
          textAlign: 'center',
          fontFamily: 'Impact, "Arial Black", sans-serif',
          color: 'white',
          fontSize: 150,
          lineHeight: 1,
          transform: `translateY(${(1 - title) * 200}px)`,
          opacity: title,
          textShadow: '0 8px 30px rgba(0,0,0,0.8)',
        }}
      >
        NEERAJ
        <br />
        <span style={{color: '#ffcf3a'}}>PEPSU</span>
      </div>
    </AbsoluteFill>
  );
};

const Caption: React.FC<{text: string; from: number; to: number}> = ({text, from, to}) => {
  const frame = useCurrentFrame();
  const o = interpolate(frame, [from, from + 8, to - 8, to], [0, 1, 1, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const chars = Math.floor(interpolate(frame, [from, from + 30], [0, text.length], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'}));
  return (
    <div
      style={{
        position: 'absolute',
        bottom: 170,
        width: '100%',
        textAlign: 'center',
        opacity: o,
        fontFamily: '"Arial Black", sans-serif',
        fontSize: 64,
        color: 'white',
        textShadow: '0 4px 14px black',
      }}
    >
      {text.slice(0, chars)}
    </div>
  );
};

export const MotionComic: React.FC = () => {
  return (
    <AbsoluteFill style={{background: 'black'}}>
      <Sequence from={BEATS.crowd} durationInFrames={BEATS.face - BEATS.crowd}>
        <CrowdScene />
      </Sequence>
      <Sequence from={BEATS.face} durationInFrames={BEATS.faceOff - BEATS.face}>
        <FaceScene />
      </Sequence>
      <Sequence from={BEATS.faceOff} durationInFrames={BEATS.endCard - BEATS.faceOff}>
        <FightScene />
      </Sequence>
      <Sequence from={BEATS.endCard} durationInFrames={BEATS.end - BEATS.endCard}>
        <EndCard />
      </Sequence>
      <Grade />
    </AbsoluteFill>
  );
};
