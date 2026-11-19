import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
import {resolve} from 'node:path';

const root = resolve(import.meta.dirname,'..');
const read = path => readFileSync(resolve(root,path),'utf8');

test('Nachzucht behält die ursprüngliche Namensliste und Wurfüberschriften',()=>{
  const source = read('src/pages/nachzucht/index.astro');
  for (const original of [
    'class="section wrap litter-group"',
    'class="sec-label"',
    'class="dog-list"',
    'class="dog-row"',
    'class="no"',
    'class="meta meta--angekoert"',
    'class="go"',
    'data-dog-preview',
  ]) assert.ok(source.includes(original), `Originalelement fehlt: ${original}`);
  assert.ok(!source.includes('cards-grid'));
  assert.ok(!source.includes('gallery-grid'));
});

test('Wurffilter kommen aus vorhandenen Daten und haben keine erfundenen Merkmale',()=>{
  const source = read('src/pages/nachzucht/index.astro');
  const script = read('src/scripts/nachzucht-filter.ts');
  assert.ok(source.includes('data-nachzucht-filter-button'));
  assert.ok(source.includes('data-nachzucht-group'));
  assert.ok(source.includes('group.id'));
  assert.ok(source.includes('group.entries.length'));
  assert.ok(script.includes('aria-pressed'));
  assert.ok(script.includes('group.hidden = !visible'));
  assert.ok(!source.includes('data-sex='));
});

test('Nachzucht-Filter sind im gebauten HTML und nur lokal aktiv',()=>{
  const path = resolve(root,'dist/nachzucht/index.html');
  assert.ok(existsSync(path),'Nachzucht-Seite nicht gebaut');
  const html=readFileSync(path,'utf8');
  for(const marker of ['data-nachzucht-filter','data-nachzucht-filter-button','data-nachzucht-group','Shades of','The Gods']){
    assert.ok(html.includes(marker),`Filter-Marker fehlt: ${marker}`);
  }
});
