import sharp from 'sharp';
import { readdir, readFile, mkdir, writeFile } from 'node:fs/promises';
import { resolve, relative } from 'node:path';
import { createHash } from 'node:crypto';
const root=resolve(import.meta.dirname,'..');
const publicRoot=resolve(root,'public');
const directory=resolve(publicRoot,'media');
await mkdir(resolve(publicRoot,'generated'),{recursive:true});
const manifest={};
// Keep the whole imported library in CMS, but encode only pictures actually used
// in content or components. This bounds work on the free hosting build service.
const needed=new Set();
for(const file of await readdir(resolve(root,'src'),{recursive:true})){
 if(!/\.(?:md|astro|ts|json)$/.test(file)||file==='data/media.generated.json')continue;
 const text=await readFile(resolve(root,'src',file),'utf8');
 for(const [path] of text.matchAll(/\/media\/[a-zA-Z0-9_./-]+\.(?:jpe?g|png|webp|avif)/gi))needed.add(path);
}
const files=(await readdir(directory,{recursive:true})).filter(file=>needed.has('/media/'+file.replaceAll('\\','/')));
let next=0;
await Promise.all(Array.from({length:3},async()=>{
while(next<files.length){
 const file=files[next++];
 if(!/\.(jpe?g|png|webp|avif)$/i.test(file)||file.includes('-original.'))continue;
 const source=resolve(directory,file);
 const buffer=await readFile(source);
 const hash=createHash('sha256').update(buffer).digest('hex').slice(0,16);
 const metadata=await sharp(buffer).rotate().metadata();
 const rotated=metadata.orientation && metadata.orientation>=5;
 const width=rotated?metadata.height:metadata.width;
 const height=rotated?metadata.width:metadata.height;
 if(!width||!height)throw new Error(`Bildmasse fehlen: ${file}`);
 const widths=[...new Set([480,800,1200,1800].filter(w=>w<width).concat(Math.min(width,1800)))];
 const variants={webp:[],avif:[]};
 for(const w of widths){
  for(const format of ['webp','avif']){
   const name=`${hash}-${w}.${format}`;const destination=resolve(publicRoot,'generated',name);
   try{const existing=await readFile(destination);if(!existing.length)throw new Error('Unvollständige Bilddatei');}catch{await sharp(buffer).rotate().resize({width:w,withoutEnlargement:true})[format]({quality:format==='webp'?82:52,effort:format==='avif'?0:3}).toFile(destination);}
   variants[format].push({src:'/generated/'+name,width:w});
  }
 }
 manifest['/media/'+relative(directory,source).replaceAll('\\','/')]={width,height,variants,src:variants.webp.at(-1).src};
}
}));
await writeFile(resolve(root,'src/data/media.generated.json'),JSON.stringify(manifest,null,2)+'\n');
console.log(`Responsive WebP-/AVIF-Varianten für ${Object.keys(manifest).length} Bilder vorbereitet.`);
