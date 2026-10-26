import React from 'react';
import {
  AbsoluteFill,
  Audio,
  Freeze,
  Sequence,
  interpolate,
  random,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion';
import {noise2D} from '@remotion/noise';
import {Grade} from '../components/fx';
import {AngryScene, EntryScene, FIGHT_IMPACT, FightScene, HotelScene, NakulScene} from './scenes';

// ---------------------------------------------------------------------------
// Edit decision list. Cuts sit on the woosh peaks found in final_with_hook.mp3
// ---------------------------------------------------------------------------
type Photo = {at: number; frame: number; focus?: number};
type Shot = {id: string; from: number; dur: number; C: React.FC; caption: string; photos: Photo[]};

export const TEASER_FRAMES = 670; // 22.32s @ 30fps

export const SHOTS: Shot[] = [
  {
    id: 'hotel',
    from: 0, // 0.00s  "Lily White Hotel hai... Holi party"
    dur: 141,
    C: HotelScene,
    caption: 'Lily White Hotel... Holi party chal rahi thi',
    photos: [
      {at: 0, frame: 50, focus: 0.45},
      {at: 100, frame: 118, focus: 0.5},
    ],
  },
  {
    id: 'nakul',
    from: 141, // 4.70s  "tagda boxer, ab tak na pita"
    dur: 150,
    C: NakulScene,
    caption: 'Nakul — tagda boxer, aaj tak nahi pita',
    photos: [
      {at: 0, frame: 43, focus: 0.5},
      {at: 60, frame: 103, focus: 0.5},
      {at: 112, frame: 135, focus: 0.68},
    ],
  },
  {
    id: 'entry',
    from: 291, // 9.70s  "South Indian movie jaisi entry"
    dur: 115,
    C: EntryScene,
    caption: 'South Indian movie jaisi entry...',
    photos: [
      {at: 0, frame: 35, focus: 0.62},
      {at: 58, frame: 105, focus: 0.55},
    ],
  },
  {
    id: 'angry',
    from: 406, // 13.55s "Neeraj aa li!"
    dur: 102,
    C: AngryScene,
    caption: 'NEERAJ PEPSU aa gaya — gusse mein!',
    photos: [
      {at: 0, frame: 8, focus: 0.35},
      {at: 14, frame: 60, focus: 0.47},
    ],
  },
  {
    id: 'fight',
    from: 508, // 16.95s face-off -> 19.80s punch (boom)
    dur: 162,
    C: FightScene,
    caption: 'Ek ghusa... aur Nakul behosh!',
    photos: [
      {at: 0, frame: 50, focus: 0.5},
      {at: FIGHT_IMPACT, frame: FIGHT_IMPACT + 6, focus: 0.4},
      {at: FIGHT_IMPACT + 34, frame: 142, focus: 0.62},
    ],
  },
];

const SoundTrack: React.FC = () => <Audio src={staticFile('final_with_hook.mp3')} />;

// ---------------------------------------------------------------------------
// Variant A — fully animated
// ---------------------------------------------------------------------------
export const TeaserAnimated: React.FC = () => (
  <AbsoluteFill style={{background: 'black'}}>
    {SHOTS.map(({id, from, dur, C}) => (
      <Sequence key={id} from={from} durationInFrames={dur}>
        <C />
        <CutFlash />
      </Sequence>
    ))}
    <Grade />
    <SoundTrack />
  </AbsoluteFill>
);

// Short white whip on every cut (sells the woosh)
const CutFlash: React.FC = () => {
  const frame = useCurrentFrame();
  if (frame > 4) return null;
  return <AbsoluteFill style={{background: 'white', opacity: interpolate(frame, [0, 4], [0.7, 0])}} />;
};

// ---------------------------------------------------------------------------
// Variant B — photo after photo (frozen key frames, Ken Burns, hard cuts)
// ---------------------------------------------------------------------------
const PhotoFrame: React.FC<{C: React.FC; photo: Photo; dur: number; seed: string}> = ({C, photo, dur, seed}) => {
  const frame = useCurrentFrame();
  const z = interpolate(frame, [0, dur], [1.04, 1.13]);
  const px = (random(`${seed}x`) - 0.5) * 60 * (frame / dur);
  const py = (random(`${seed}y`) - 0.5) * 60 * (frame / dur);
  const kick = frame < 6 ? noise2D(seed, frame, 0) * 18 * (1 - frame / 6) : 0;
  return (
    <AbsoluteFill style={{transform: `translate(${px + kick}px, ${py}px) scale(${z})`}}>
      <Freeze frame={photo.frame}>
        <C />
      </Freeze>
    </AbsoluteFill>
  );
};

const Caption: React.FC<{text: string}> = ({text}) => {
  const frame = useCurrentFrame();
  const chars = Math.floor(interpolate(frame, [4, 30], [0, text.length], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'}));
  return (
    <div
      style={{
        position: 'absolute',
        bottom: 150,
        left: 60,
        right: 60,
        textAlign: 'center',
        fontFamily: '"Arial Black", sans-serif',
        fontSize: 60,
        color: 'white',
        textShadow: '0 4px 16px black, 0 0 4px black',
      }}
    >
      {text.slice(0, chars)}
    </div>
  );
};

export const TeaserPhotos: React.FC = () => (
  <AbsoluteFill style={{background: 'black'}}>
    {SHOTS.map(({id, from, dur, C, photos, caption}) => (
      <Sequence key={id} from={from} durationInFrames={dur}>
        {photos.map((p, i) => {
          const len = (photos[i + 1]?.at ?? dur) - p.at;
          return (
            <Sequence key={i} from={p.at} durationInFrames={len}>
              <PhotoFrame C={C} photo={p} dur={len} seed={`${id}${i}`} />
              <CutFlash />
            </Sequence>
          );
        })}
        <Caption text={caption} />
      </Sequence>
    ))}
    <Grade />
    <SoundTrack />
  </AbsoluteFill>
);

// ---------------------------------------------------------------------------
// Variant C — comic book pages (panels pop in one by one)
// ---------------------------------------------------------------------------
const HALFTONE = 'radial-gradient(rgba(0,0,0,0.22) 30%, transparent 32%)';

const Panel: React.FC<{
  C: React.FC;
  photo: Photo;
  x: number;
  y: number;
  w: number;
  h: number;
  tilt: number;
}> = ({C, photo, x, y, w, h, tilt}) => {
  const frame = useCurrentFrame();
  const {fps, width, height} = useVideoConfig();
  const pop = spring({frame, fps, config: {damping: 13, stiffness: 160}});
  const s = w / width;
  const sceneH = height * s;
  const top = Math.min(0, Math.max(h - sceneH, h / 2 - (photo.focus ?? 0.5) * sceneH));
  return (
    <div
      style={{
        position: 'absolute',
        left: x,
        top: y,
        width: w,
        height: h,
        overflow: 'hidden',
        border: '10px solid #111',
        background: '#111',
        boxShadow: '12px 12px 0 rgba(0,0,0,0.85)',
        transform: `rotate(${tilt}deg) scale(${0.6 + pop * 0.4})`,
        opacity: Math.min(1, pop * 1.5),
      }}
    >
      <div
        style={{
          position: 'absolute',
          left: 0,
          top,
          width,
          height,
          transform: `scale(${s})`,
          transformOrigin: '0 0',
          filter: 'saturate(1.35) contrast(1.15)',
        }}
      >
        <Freeze frame={photo.frame}>
          <C />
        </Freeze>
      </div>
      <AbsoluteFill style={{backgroundImage: HALFTONE, backgroundSize: '9px 9px', mixBlendMode: 'multiply'}} />
    </div>
  );
};

const ComicPage: React.FC<{shot: Shot; index: number}> = ({shot, index}) => {
  const {width, height} = useVideoConfig();
  const m = 50;
  const gap = 34;
  const capH = 150;
  const n = shot.photos.length;
  const ph = (height - m * 2 - capH - gap * n) / n;
  return (
    <AbsoluteFill style={{background: '#f6efe0'}}>
      <AbsoluteFill style={{backgroundImage: 'radial-gradient(rgba(194,17,107,0.18) 30%, transparent 32%)', backgroundSize: '22px 22px'}} />
      <div
        style={{
          position: 'absolute',
          left: m,
          top: m,
          right: m,
          height: capH - 20,
          background: '#ffe14d',
          border: '8px solid #111',
          display: 'flex',
          alignItems: 'center',
          padding: '0 30px',
          fontFamily: '"Comic Sans MS", "Arial Black", sans-serif',
          fontWeight: 900,
          fontSize: 50,
          color: '#111',
          boxShadow: '10px 10px 0 #111',
        }}
      >
        {shot.caption}
      </div>
      <div
        style={{
          position: 'absolute',
          right: m + 10,
          bottom: 14,
          fontFamily: 'Impact, sans-serif',
          fontSize: 30,
          color: '#111',
        }}
      >
        PAGE {index + 1}
      </div>
      {shot.photos.map((p, i) => (
        <Sequence key={i} from={p.at} layout="none">
          <Panel
            C={shot.C}
            photo={p}
            x={m}
            y={m + capH + i * (ph + gap)}
            w={width - m * 2}
            h={ph}
            tilt={i % 2 ? 0.8 : -0.8}
          />
        </Sequence>
      ))}
    </AbsoluteFill>
  );
};

export const TeaserComic: React.FC = () => (
  <AbsoluteFill style={{background: 'black'}}>
    {SHOTS.map((shot, i) => (
      <Sequence key={shot.id} from={shot.from} durationInFrames={shot.dur}>
        <ComicPage shot={shot} index={i} />
        <CutFlash />
      </Sequence>
    ))}
    <SoundTrack />
  </AbsoluteFill>
);
