import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';

test('Startseite verwendet das Originalfoto mit beiden Hunden als Hero',()=>{
  const site=JSON.parse(readFileSync('src/data/site.json','utf8'));
  assert.equal(site.heroImage,'/media/hero-moyodogs-2026.jpg');
  assert.ok(existsSync('public/media/hero-moyodogs-2026.jpg'),'Originalfoto fehlt im GitHub-Repository');
  const html=readFileSync('dist/index.html','utf8');
  assert.ok(html.includes('Zwei gestromte Holländische Schäferhunde'),'Alt-Text für Hero fehlt');
  assert.ok(html.includes('Unsere Holländischen Schäferhunde'),'Bildunterschrift fehlt');
});
