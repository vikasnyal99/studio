import React from 'react';
import {Composition} from 'remotion';
import {BEATS, MotionComic} from './compositions/MotionComic';
import {PuppetPunch} from './compositions/PuppetPunch';
import {JobCompositions} from './jobs';
import {DOC_DEMO, Doc, docMetadata} from './doc/Doc';
import {DEMO, Proof, proofMetadata} from './proof/Proof';
import {SHORT_DEMO, ShortCut, shortMetadata} from './shorts/ShortCut';
import {TEASER_FRAMES, TeaserAnimated, TeaserComic, TeaserPhotos} from './teaser/Teaser';

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id="MotionComic"
        component={MotionComic}
        durationInFrames={BEATS.end}
        fps={30}
        width={1080}
        height={1920}
      />
      <Composition
        id="PuppetPunch"
        component={PuppetPunch}
        durationInFrames={180}
        fps={30}
        width={1920}
        height={1080}
      />
      {[
        {id: 'Teaser-Animated', component: TeaserAnimated},
        {id: 'Teaser-Photos', component: TeaserPhotos},
        {id: 'Teaser-Comic', component: TeaserComic},
      ].map(({id, component}) => (
        <Composition
          key={id}
          id={id}
          component={component}
          durationInFrames={TEASER_FRAMES}
          fps={30}
          width={1080}
          height={1920}
        />
      ))}
      <Composition id="Proof" component={Proof} defaultProps={{spec: DEMO}} calculateMetadata={proofMetadata} durationInFrames={90} fps={30} width={1920} height={1080} />
      <Composition id="ShortCut" component={ShortCut} defaultProps={{spec: SHORT_DEMO}} calculateMetadata={shortMetadata} durationInFrames={60} fps={30} width={1080} height={1920} />
      <Composition id="Doc" component={Doc} defaultProps={{spec: DOC_DEMO}} calculateMetadata={docMetadata} durationInFrames={90} fps={30} width={1920} height={1080} />
      <JobCompositions />
    </>
  );
};
