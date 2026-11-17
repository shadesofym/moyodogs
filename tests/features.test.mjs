import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
import {resolve} from 'node:path';
import {parse} from 'yaml';
import MarkdownIt from 'markdown-it';
import {blockSchema,timelineSchema} from '../src/lib/content-schema.ts';
const root=resolve(import.meta.dirname,'..');
const config=parse(readFileSync(resolve(root,'.pages.yml'),'utf8'));
test('CMS bietet alle fünf renderbaren Inhaltsbausteine an',()=>{
 assert.deepEqual(config.components.blocks.blocks.map(b=>b.name).sort(),['gallery','image','quote','text','video']);
 for(const name of ['dogs','litters','posts'])assert.ok(config.content.find(e=>e.name===name).fields.some(f=>f.component==='blocks'));
});
test('CMS-Bausteine prüfen Typen, Bildbeschreibungen und Video-Transkripte',()=>{
 for(const value of [
  {type:'text',body:'## Text'},
  {type:'image',image:'/media/malu.webp',alt:'Malu'},
  {type:'gallery',images:[{image:'/media/malu.webp',alt:'Malu'}]},
  {type:'quote',text:'Ein Beispiel'},
  {type:'video',file:'/media/kurz.mp4',title:'Video',transcript:'Beschreibung'},
 ])assert.ok(blockSchema.safeParse(value).success);
 for(const value of [
  {type:'image',image:'/media/malu.webp',alt:''},
  {type:'gallery',images:[]},
  {type:'video',file:'/media/kurz.mp4',title:'Video'},
  {type:'video',file:'javascript:alert(1)',title:'Video',transcript:'Text'},
  {type:'image',image:'/media/../../secret.txt',alt:'Nein'},
  {type:'unknown'},
 ])assert.equal(blockSchema.safeParse(value).success,false);
});
test('Textbausteine rendern Formatierungen ohne aktives HTML oder JavaScript-Links',()=>{
 const md=new MarkdownIt({html:false});
 const html=md.render('## Hallo\n**Fett**\n<script>alert(1)</script>\n[Gefahr](javascript:alert(1))');
 assert.ok(html.includes('<h2>Hallo</h2>'));assert.ok(html.includes('<strong>Fett</strong>'));
 assert.ok(!html.includes('<script>'));assert.ok(!html.includes('href="javascript:'));
});
test('Zeitleiste behält redaktionelle Reihenfolge und verlangt ein Ereignis',()=>{
 const entries=[{title:'Planung',when:'Frühling 2027',state:'Geplant'},{title:'Persönliches Update',when:'Datum folgt',state:'Aktuell'}];
 assert.deepEqual(timelineSchema.parse(entries),entries);assert.equal(timelineSchema.safeParse([{title:'',when:''}]).success,false);
});
test('Responsive Bilder sind vorhanden und werden nicht hochskaliert',()=>{
 const manifest=JSON.parse(readFileSync(resolve(root,'src/data/media.generated.json'),'utf8'));
 for(const entry of Object.values(manifest))for(const format of ['avif','webp']){
  assert.ok(entry.variants[format].length>0);
  for(const variant of entry.variants[format]){assert.ok(variant.width<=entry.width);assert.ok(existsSync(resolve(root,'public',variant.src.slice(1))));}
 }
});
test('Es gibt keinen Theme-Umschalter mehr und die Seite bleibt hell',()=>{
 assert.ok(!existsSync(resolve(root,'public/theme-init.js')),'theme-init.js existiert noch');
 const base=readFileSync(resolve(root,'src/layouts/Base.astro'),'utf8');
 assert.ok(!base.includes('theme-init'),'Base lädt noch ein Theme-Skript');
 const css=readFileSync(resolve(root,'src/styles/neo.css'),'utf8');
 assert.ok(/color-scheme: light/.test(css),'Die Seite deklariert nicht mehr ausdrücklich hell');
});
