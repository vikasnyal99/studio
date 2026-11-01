import React from 'react';
import {registerRoot,Composition} from 'remotion';
import {WashingSamples} from './washing-samples';
const Root=()=> <>{(['dossier','timeline','illustrated'] as const).map(style=><Composition key={style} id={'Washing-'+style} component={WashingSamples} defaultProps={{style}} durationInFrames={960} fps={30} width={1920} height={1080}/>)}</>;
registerRoot(Root);
