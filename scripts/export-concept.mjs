import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { resolve } from 'node:path';
import ts from 'typescript';
const root = resolve(import.meta.dirname, '..');
let html = await readFile(resolve(root,'src/pages/konzept/index.astro'),'utf8');
const site=JSON.parse(await readFile(resolve(root,'src/data/site.json'),'utf8'));
const frames=[
 {image:'/media/malu.webp',name:'Malu',tag:'01 — UNSERE HUNDE'},
 {image:'/media/yam.webp',name:'Yam',tag:'02 — UNSERE HUNDE'},
 {image:'/media/malu-portrait.webp',name:'Momente',tag:'03 — EINBLICKE'},
];
html=html.replace(/^---[\s\S]*?---\s*/, '');
html=html.replace(/\{frames.map\([\s\S]*?<\/button>\)\}/,frames.map((frame,i)=>`<button type="button" class="photo ${i===0?'front':i===1?'next':'previous'}" data-index="${i}" data-name="${frame.name}" data-href="#geschichte" aria-label="${frame.name} ansehen" aria-pressed="${i===0}"><img src="${frame.image}" alt="${frame.name} — MOYO DOGS" width="1600" height="1100" loading="eager"><span class="photo-meta"><span>${frame.tag}</span><span>MOYO DOGS ↗</span></span></button>`).join(''));
html=html.replaceAll('{site.intro}',site.intro).replaceAll('href={frames[0].href}','href="#geschichte"').replaceAll('href={`mailto:${site.email}`}','href="mailto:'+site.email+'"').replaceAll('href="/konzept/"','href="#main"').replaceAll('href="/hunde/"','href="#main"').replaceAll('href="/zucht/"','href="#geschichte"').replaceAll('href="/wuerfe/"','href="#wurf"').replaceAll('href="/wuerfe/fruehling-2027/"','href="#wurf"').replaceAll('href="/blog/"','href="https://moyodogs.com/blog/"').replaceAll('href="/kontakt/"','href="mailto:'+site.email+'"').replace('<section class="litter">','<section class="litter" id="wurf">').replace('<style is:global>','<style>');
html=html.replace(/<script>([\s\S]*?)<\/script>/,(_,code)=>'<script>'+ts.transpileModule(code,{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ESNext}}).outputText+'</script>');
const refs=[...new Set(html.match(/\/(?:fonts|media)\/[a-zA-Z0-9_.-]+/g))];
for(const path of refs){const buf=await readFile(resolve(root,'public',path.slice(1)));const mime=path.endsWith('.ttf')?'font/ttf':path.endsWith('.svg')?'image/svg+xml':'image/webp';html=html.replaceAll(path,`data:${mime};base64,${buf.toString('base64')}`);}
html=html.replace('<link rel="icon" href="/favicon.svg"/>','');
const destination=resolve(root,'../output/moyodogs-interaktiv');await mkdir(destination,{recursive:true});await writeFile(resolve(destination,'moyodogs-konzept.html'),html);console.log('Eigenständige Vorschau erstellt.');
