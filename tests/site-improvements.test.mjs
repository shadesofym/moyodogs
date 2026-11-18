import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {parse} from 'yaml';

const root=resolve(import.meta.dirname,'..');
const read=path=>readFileSync(resolve(root,path),'utf8');

test('Yams genetische Angaben bleiben klar als Free by Parentage ausgewiesen',()=>{
  const source=read('src/content/dogs/yam.md');
  const frontmatter=parse(source.split('---')[1]);
  assert.match(frontmatter.health,/über Elterntiere/);
  assert.equal(frontmatter.facts.find(fact=>fact.label==='DM')?.value,'Frei durch Abstammung');
  assert.equal(frontmatter.facts.find(fact=>fact.label==='SDCA 1 & 2')?.value,'Frei durch Abstammung');
  assert.match(source,/Free by Parentage/);
  assert.match(source,/kein(?:em|en)? eigenen Labortest/);
  assert.doesNotMatch(frontmatter.health,/DM N\/N/);
});

test('Hundeprofile haben sichtbare Fakten und eine Anfrageoption für Yam',()=>{
  const html=read('dist/hunde/yam/index.html');
  assert.match(html,/Auf einen Blick/);
  assert.match(html,/dog-profile-grid/);
  assert.match(html,/Frei durch Abstammung/);
  assert.match(html,/Deckanfrage stellen/);
});

test('Aktuelle Würfe verlinken klar auf Kontakt und den Welpenablauf',()=>{
  const html=read('dist/wuerfe/index.html');
  assert.match(html,/litter-inquiry/);
  assert.match(html,/Welpenanfrage/);
  assert.match(html,/href="\/#ablauf"/);
});

test('Welpentransfer-FAQ verweist auf offizielle Behörden statt EU-Pass-Pflicht',()=>{
  const html=read('dist/index.html');
  assert.match(html,/blv\.admin\.ch\/de\/reisen-heimtiere-hunde-katzen-frettchen/);
  assert.match(html,/Schweizer Heimtierpass/);
  assert.doesNotMatch(html,/Der Welpe braucht einen Mikrochip, eine Tollwutimpfung und einen EU-Heimtierausweis/);
});
