import fs from 'fs';
import path from 'path';
import {bundle} from '@remotion/bundler';
import {renderMedia,renderStill,selectComposition} from '@remotion/renderer';

const dest=path.resolve('../video-studio/videos/2026-11-01-bjp-washing-machine/output/sample.mp4');
const stillDir=path.resolve('../video-studio/videos/2026-11-01-bjp-washing-machine/output/sample-stills');
fs.mkdirSync(path.dirname(dest),{recursive:true});fs.mkdirSync(stillDir,{recursive:true});
const serveUrl=await bundle({entryPoint:path.resolve('src/jobs/washing-one-entry.tsx'),onProgress:p=>{if(p===100)console.log('bundle ready')}});
process.on('exit',()=>fs.rmSync(serveUrl,{recursive:true,force:true}));
const composition=await selectComposition({serveUrl,id:'WashingOne'});
for(const sec of [1,5,10,15,20,25,30]) await renderStill({composition,serveUrl,frame:sec*30,output:path.join(stillDir,`${sec}s.png`),scale:.5});
await renderMedia({composition,serveUrl,codec:'h264',outputLocation:dest,pixelFormat:'yuv420p',crf:19,concurrency:1,timeoutInMilliseconds:180000,onProgress:({progress})=>{const p=Math.floor(progress*100);if(p%10===0)console.log(`${p}%`)}});
console.log(`rendered ${dest}`);
