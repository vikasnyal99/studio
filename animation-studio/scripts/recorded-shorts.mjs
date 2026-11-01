// node scripts/recorded-shorts.mjs <spec.json> [--still | --sample]
import fs from 'node:fs';
import path from 'node:path';
import {bundle} from '@remotion/bundler';
import {selectComposition,renderStill,renderMedia} from '@remotion/renderer';
import {Config} from '@remotion/cli/config';
Config.setDelayRenderTimeoutInMilliseconds(120_000);
const [file,...flags]=process.argv.slice(2);
if(!file) throw new Error('Provide a recorded Short spec JSON');
const spec=JSON.parse(fs.readFileSync(file,'utf8'));
const out=path.resolve('../video-studio/videos',spec.job,'output');fs.mkdirSync(out,{recursive:true});
for(const f of [spec.portrait,spec.voice,...spec.beats.map(b=>b.image).filter(Boolean)]) if(!fs.existsSync(path.join('public',f))) throw new Error(`Missing asset: ${f}`);
const serveUrl=await bundle({entryPoint:path.resolve('src/recorded-shorts/index.tsx')});
const inputProps={spec};const composition=await selectComposition({serveUrl,id:'RecordedShort',inputProps});
if(flags.includes('--still')) {
 const times=[1,...spec.beats.map(b=>b.a+0.8),spec.duration-2].filter(t=>t>=0 && t<spec.duration);
 for(let i=0;i<times.length;i++) await renderStill({serveUrl,composition,inputProps,frame:Math.round(times[i]*30),scale:0.4,output:path.join(out,`check-${i}.png`)});
 console.log('Stills ready',out);
} else {
 let prev=-1;
 await renderMedia({serveUrl,composition,inputProps,codec:'h264',crf:18,pixelFormat:'yuv420p',concurrency:2,timeoutInMilliseconds:120000,offthreadVideoCacheSizeInBytes:128*1024*1024,outputLocation:path.join(out,flags.includes('--sample')?'style-sample.mp4':'final.mp4'),...(flags.includes('--sample')?{frameRange:[0,Math.min(449,composition.durationInFrames-1)]}:{}),onProgress:({progress})=>{const n=Math.floor(progress*10)*10;if(n!==prev){console.log(n+'%');prev=n;}}});
 console.log('Export complete',out);
}
