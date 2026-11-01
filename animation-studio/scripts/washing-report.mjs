import fs from 'fs';
import path from 'path';
import {bundle} from '@remotion/bundler';
import {renderMedia,renderStill,selectComposition} from '@remotion/renderer';

const outDir=path.resolve('../video-studio/videos/2026-11-01-bjp-washing-machine/output');
const dest=path.join(outDir,'sample-reference-style.mp4');
const stillDir=path.join(outDir,'reference-style-stills');
fs.mkdirSync(stillDir,{recursive:true});
const serveUrl=await bundle({entryPoint:path.resolve('src/jobs/washing-report-entry.tsx'),onProgress:p=>{if(p===100)console.log('bundle ready')}});
process.on('exit',()=>fs.rmSync(serveUrl,{recursive:true,force:true}));
const composition=await selectComposition({serveUrl,id:'WashingReport'});
for(const sec of [2,8,12,17,25,30,36,43]) await renderStill({composition,serveUrl,frame:sec*30,output:path.join(stillDir,`${sec}s.png`),scale:.5});
await renderMedia({composition,serveUrl,codec:'h264',outputLocation:dest,pixelFormat:'yuv420p',crf:19,concurrency:2,timeoutInMilliseconds:180000,onProgress:({progress})=>{const p=Math.floor(progress*100);if(p%10===0)console.log(`${p}%`)}});
console.log(`rendered ${dest}`);
