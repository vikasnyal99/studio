import React from 'react';
import {Composition, registerRoot} from 'remotion';
import {RecordedShort, ShortSpec} from './RecordedShort';
const demo:ShortSpec={duration:10,title:'',kicker:'',accent:'#eac768',portrait:'',wide:'',voice:'',captions:[],beats:[]};
const Root=()=> <Composition id="RecordedShort" component={RecordedShort} defaultProps={{spec:demo}} width={1080} height={1920} fps={30} durationInFrames={300} calculateMetadata={({props})=>({durationInFrames:Math.ceil(props.spec.duration*30)})}/>;
registerRoot(Root);
