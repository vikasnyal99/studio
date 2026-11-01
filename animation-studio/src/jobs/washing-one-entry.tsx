import React from 'react';
import {Composition,registerRoot} from 'remotion';
import {WashingOne} from './washing-one';
const Root=()=> <Composition id="WashingOne" component={WashingOne} durationInFrames={960} fps={30} width={1920} height={1080}/>;
registerRoot(Root);
