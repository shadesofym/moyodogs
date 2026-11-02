import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
import {resolve} from 'node:path';
import {runInNewContext} from 'node:vm';
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
function themeEnvironment({saved=null,dark=false,blocked=false}={}){
 const listeners={};const selects=[{value:''}];let stored=saved;
 const element={dataset:{},style:{}};
 const device={matches:dark,addEventListener(type,fn){listeners['device-'+type]=fn;}};
 const document={documentElement:element,querySelectorAll(){return selects;},querySelector(){return null;},addEventListener(type,fn){listeners[type]=fn;}};
 const window={matchMedia(){return device;},addEventListener(type,fn){listeners['window-'+type]=fn;}};
 const localStorage={getItem(){if(blocked)throw new Error('Gesperrt');return stored;},setItem(_,value){if(blocked)throw new Error('Gesperrt');stored=value;}};
 runInNewContext(readFileSync(resolve(root,'public/theme-init.js'),'utf8'),{window,document,localStorage});listeners.DOMContentLoaded();
 return {element,listeners,selects,device};
}
test('Hell/Dunkel bleibt ausdrücklich gewählt, auch wenn das Gerät anders eingestellt ist',()=>{
 const env=themeEnvironment({saved:'light',dark:true});assert.equal(env.element.dataset.theme,'light');assert.equal(env.selects[0].value,'light');
 env.device.matches=false;env.listeners['device-change']();assert.equal(env.element.dataset.theme,'light');
});
test('Erster Besuch startet dunkel und folgt nicht ungefragt dem Gerät',()=>{
 const env=themeEnvironment();assert.equal(env.element.dataset.theme,'dark');assert.equal(env.selects[0].value,'dark');
 env.device.matches=true;env.listeners['device-change']();env.device.matches=false;env.listeners['device-change']();assert.equal(env.element.dataset.theme,'dark');
});
test('Ausdrücklich gewählte Automatik folgt weiterhin dem Gerät',()=>{
 const env=themeEnvironment({saved:'auto',dark:true});assert.equal(env.element.dataset.theme,'dark');
 env.device.matches=false;env.listeners['device-change']();assert.equal(env.element.dataset.theme,'light');
});
test('Gesperrter Speicher startet dunkel und verhindert die Bedienung nicht',()=>{
 const env=themeEnvironment({blocked:true});assert.equal(env.element.dataset.theme,'dark');
 env.listeners.change({target:{matches:()=>true,value:'light'}});assert.equal(env.element.dataset.theme,'light');
 env.listeners.change({target:{matches:()=>true,value:'auto'}});env.device.matches=true;env.listeners['device-change']();assert.equal(env.element.dataset.theme,'dark');
});
test('Ungültige oder entfernte Einstellungen fallen auf Dunkel zurück; Seitenwechsel behält das Profil',()=>{
 const env=themeEnvironment({saved:'unbekannt'});assert.equal(env.element.dataset.themeChoice,'dark');
 const next={dataset:{},style:{}};env.listeners['astro:before-swap']({newDocument:{documentElement:next}});assert.equal(next.dataset.theme,'dark');
 env.listeners.change({target:{matches:()=>true,value:'light'}});env.listeners['window-storage']({key:'moyodogs-theme',newValue:null});assert.equal(env.element.dataset.theme,'dark');
});
