// One-off conversion of the archived originals. Never fetches from WordPress at build time.
import sharp from 'sharp';
import {readFile, mkdir, stat, mkdtemp, rm} from 'node:fs/promises';
import {resolve} from 'node:path';
import {tmpdir} from 'node:os';
import {execFile} from 'node:child_process';
import {promisify} from 'node:util';
const run=promisify(execFile);
const report=JSON.parse(await readFile(resolve(process.argv[2]),'utf8'));
const root=resolve(import.meta.dirname,'..');
await mkdir(resolve(root,'public/media/wordpress'),{recursive:true});
let next=0,done=0;
await Promise.all(Array.from({length:3},async()=>{
 while(next<report.assets.length){
  const asset=report.assets[next++];const target=resolve(root,'public',asset.target.slice(1));
  let exists=false;try{exists=(await stat(target)).size>0;}catch{/* New image. */}
  if(!exists){
   let input=asset.input;let temporary;
   try{
    if(/\.heic$/i.test(input)){
     temporary=await mkdtemp(resolve(tmpdir(),'moyodogs-heic-'));
     const jpeg=resolve(temporary,'image.jpg');
     await run('/usr/bin/sips',['-s','format','jpeg',input,'--out',jpeg]);input=jpeg;
    }
    await sharp(input,{failOn:'error'}).rotate().resize({width:1800,height:1800,fit:'inside',withoutEnlargement:true}).webp({quality:88,effort:4}).toFile(target);
   }finally{if(temporary)await rm(temporary,{recursive:true,force:true});}
  }
  done++;if(done%50===0)console.log(`${done}/${report.assets.length} Bilder übernommen.`);
 }
}));
console.log(`${done} Bilder übernommen. Originale bleiben im externen Archiv erhalten.`);
