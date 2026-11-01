import React from 'react';
import {Composition,registerRoot} from 'remotion';
import {WashingReport} from './washing-report';
const Root=()=> <Composition id="WashingReport" component={WashingReport} durationInFrames={1344} fps={30} width={1920} height={1080}/>;
registerRoot(Root);
