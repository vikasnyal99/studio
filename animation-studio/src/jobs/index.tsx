import React from 'react';
import {Composition} from 'remotion';
import {Fight} from './2026-10-23-dev-tanwar-short/Fight';
import {ShotsA, ShotsB} from './2026-10-23-dev-tanwar-short/Shots';

// One <Composition id="Job-<shot>"> per shot handed over from video-studio (see jobs/<video>/<shot>.md).
// Put each shot's code in src/jobs/<video>/<Shot>.tsx; size and frame count come from the brief.
export const JobCompositions: React.FC = () => (
  <>
    <Composition id="Job-fight" component={Fight} durationInFrames={660} fps={30} width={1080} height={1920} />
    <Composition id="Shots-A" component={ShotsA} durationInFrames={660} fps={30} width={1080} height={1920} />
    <Composition id="Shots-B" component={ShotsB} durationInFrames={660} fps={30} width={1080} height={1920} />
  </>
);
