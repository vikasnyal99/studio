import fs from 'fs';
import path from 'path';
import {bundle} from '@remotion/bundler';
import {renderMedia,renderStill,selectComposition} from '@remotion/renderer';

const job='2026-11-01-bjp-washing-machine';
const dest=path.resolve('../video-studio/videos',job,'output/samples');
fs.mkdirSync(dest,{recursive:true});
const serveUrl=await bundle({entryPoint:path.resolve('src/jobs/washing-entry.tsx'),onProgress:p=>{if(p%25===0) console.log('bundle',p+'%')}});
process.on('exit',()=>fs.rmSync(serveUrl,{recursive:true,force:true}));
for(const style of (process.env.ONLY_STYLE ? [process.env.ONLY_STYLE] : ['dossier','timeline','illustrated'])){
  const composition=await selectComposition({serveUrl,id:'Washing-'+style});
  for(const sec of [2,15,29]) await renderStill({composition,serveUrl,frame:sec*30,output:path.join(dest,`${style}-${sec}s.png`),scale:0.33});
  console.log('rendering',style,flush());
  await renderMedia({composition,serveUrl,codec:'h264',outputLocation:path.join(dest,`${style}.mp4`),pixelFormat:'yuv420p',crf:20,concurrency:1,timeoutInMilliseconds:120000,onProgress:({progress})=>{if(Math.round(progress*100)%20===0) console.log(style,Math.round(progress*100)+'%')}});
  console.log('finished',style);
}
function flush(){return new Date().toISOString()}
