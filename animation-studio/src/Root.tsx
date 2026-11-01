import React from 'react';
import {Composition} from 'remotion';
import {BEATS, MotionComic} from './compositions/MotionComic';
import {PuppetPunch} from './compositions/PuppetPunch';
import {JobCompositions} from './jobs';
import {DOC_DEMO, Doc, docMetadata} from './doc/Doc';
import {DEMO, Proof, proofMetadata} from './proof/Proof';
import {WAR_DEMO, War, warMetadata} from './war/War';
import {HIST_DEMO, HistMap, histMetadata} from './histmap/HistMap';
import {HOOK_DEMO, Hook, hookMetadata} from './hook/Hook';
import {SHORT_DEMO, ShortCut, shortMetadata} from './shorts/ShortCut';
import {VTHUMB_DEMO, VThumb} from './vshorts/VThumb';
import {VSHORT_DEMO, VShort, vshortMetadata} from './vshorts/VShort';
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
      <Composition id="Hook" component={Hook} defaultProps={{spec: HOOK_DEMO}} calculateMetadata={hookMetadata} durationInFrames={90} fps={30} width={1920} height={1080} />
      <Composition id="HistMap" component={HistMap} defaultProps={{spec: HIST_DEMO}} calculateMetadata={histMetadata} durationInFrames={90} fps={30} width={1920} height={1080} />
      <Composition id="War" component={War} defaultProps={{spec: WAR_DEMO}} calculateMetadata={warMetadata} durationInFrames={90} fps={30} width={1920} height={1080} />
      <Composition id="Doc" component={Doc} defaultProps={{spec: DOC_DEMO}} calculateMetadata={docMetadata} durationInFrames={90} fps={30} width={1920} height={1080} />
      <Composition id="VShort" component={VShort} defaultProps={{spec: VSHORT_DEMO}} calculateMetadata={vshortMetadata} durationInFrames={60} fps={30} width={1080} height={1920} />
      <Composition id="VThumb" component={VThumb} defaultProps={{spec: VTHUMB_DEMO}} durationInFrames={1} fps={30} width={1080} height={1920} />
      <JobCompositions />
    </>
  );
};
