import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
const root = resolve(import.meta.dirname, '../dist');
const built = existsSync(root);
assert.ok(built, 'Vor den Tests bitte npm run build ausführen.');
test('Entwurfsbeitrag hat keine öffentliche HTML-Seite', { skip: !built }, () => {
  assert.equal(existsSync(resolve(root, 'blog/erster-beitrag/index.html')), false);
  for (const path of ['index.html', 'blog/index.html']) assert.equal(readFileSync(resolve(root, path), 'utf8').includes('Mein erster Blogbeitrag'), false);
});
test('Alle internen Links und Medien der gebauten Seiten existieren', { skip: !built }, () => {
  const files = readdirSync(root, { recursive: true }).filter(file => file.endsWith('.html'));
  for (const file of files) {
    const html = readFileSync(resolve(root, file), 'utf8');
    for (const [, raw] of html.matchAll(/(?:href|src)="([^"#]+)"/g)) {
      if (/^(https?:|mailto:|data:|tel:)/.test(raw)) continue;
      const path = decodeURIComponent(raw.split(/[?#]/)[0]);
      if (!path) continue;
      const target = path.startsWith('/') ? resolve(root, '.' + path) : resolve(dirname(resolve(root, file)), path);
      assert.ok(existsSync(target), `${file} verweist auf fehlende Datei ${path}`);
    }
  }
});
test('Produktionsseiten enthalten keine ausführbaren Inline-Skripte (CSP)',()=>{
 for(const file of readdirSync(root,{recursive:true}).filter(file=>file.endsWith('.html'))){
  const html=readFileSync(resolve(root,file),'utf8');
  for(const [,attributes,body] of html.matchAll(/<script([^>]*)>([\s\S]*?)<\/script>/g)){
   if(/type="application\/(?:ld\+)?json"/.test(attributes))continue;
   assert.ok(!body.trim()||/src=/.test(attributes),`${file} enthält ein Inline-Skript`);
  }
 }
});

test('Inhaltsbausteine werden tatsächlich als Text, Bild, Zitat und interaktive Galerie gebaut',()=>{
 const html=readFileSync(resolve(root,'vorschau/index.html'),'utf8');
 assert.ok(html.includes('<strong>Beispieltext</strong>'));
 assert.ok(html.includes('<blockquote>'));
 assert.ok(html.includes('<moyo-gallery'));
 assert.ok(html.includes('type="image/avif"'));
 assert.ok(html.includes('data-gallery-image'));
});
test('Journalbeispiele bleiben getrennt von echten veröffentlichten Beiträgen',()=>{
 const live=readFileSync(resolve(root,'blog/index.html'),'utf8');
 const overview=readFileSync(resolve(root,'vorschau/journal/index.html'),'utf8');
 const article=readFileSync(resolve(root,'vorschau/journal/draussen-beginnt-der-tag/index.html'),'utf8');
 assert.ok(!live.includes('Draussen beginnt der Tag.'));
 assert.ok(!existsSync(resolve(root,'blog/draussen-beginnt-der-tag/index.html')));
 assert.ok(overview.includes('keine veröffentlichten Blogbeiträge'));
 assert.ok(overview.includes('data-category-filter="Zucht"'));
 assert.ok(article.includes('Beispieltext'));
 assert.ok(article.includes('kein veröffentlichter Blogbeitrag'));
 assert.ok(article.includes('<blockquote>'));
});
