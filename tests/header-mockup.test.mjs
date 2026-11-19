import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync, existsSync} from 'node:fs';
import {resolve} from 'node:path';

const root = resolve(import.meta.dirname, '..');
const read = path => readFileSync(resolve(root,path),'utf8');

test('Der freigegebene MOYO DOGS Header ist auf allen Seiten vorhanden', () => {
  const source = read('src/layouts/Base.astro');
  assert.match(source, /href="\/" class="brand"/);
  assert.match(source, /class="desktop-nav"/);
  assert.match(source, /'\/nachzucht\/', 'Nachzucht'/);
  assert.match(source, /class="header-search" href="\/suche\/"/);
  assert.match(source, /class="menu-toggle".*data-menu-toggle/);
  assert.match(source, /class="menu-toggle-lines"/);
  assert.match(source, /href="\/nachzucht\/">Nachzucht/);
  assert.ok(!source.includes('class="nav-contact"'),'Kontakt soll als schlichter Header-Link erscheinen');
});

test('Desktop- und Mobil-Header benutzen das geprüfte Menü mit Touchflächen', () => {
  const css = read('src/styles/neo.css');
  const source = read('src/layouts/Base.astro');
  assert.match(css, /\.site-header\s*\{[\s\S]*?display:\s*grid/);
  assert.match(css, /\.menu-toggle\s*\{[\s\S]*?display:\s*inline-flex/);
  assert.match(css, /\.menu-toggle\s*\{[\s\S]*?height:\s*44px/);
  assert.match(css, /@media \(max-width: 940px\)\s*\{\s*\.site-header/);
  assert.match(source, /data-menu-close/);
  assert.match(source, /id="site-menu"/);
});

test('Die Suche ist erreichbar und zeigt nur lokal vorgerenderte Inhalte', () => {
  const path = resolve(root,'dist/suche/index.html');
  assert.ok(existsSync(path),'Suchseite fehlt im fertigen Build');
  const html = readFileSync(path,'utf8');
  for(const value of ['data-site-search-input','data-site-search-result','id="site-search-results"','Hunde','Würfe','Nachzucht']){
    assert.ok(html.includes(value),`Suche enthält nicht: ${value}`);
  }
  assert.ok(!html.includes('google.com/search'), 'Die Suche darf keine externe Suchmaschine verwenden');
});
