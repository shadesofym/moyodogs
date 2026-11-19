import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

test('Startseite zeigt allein das Originalfoto mit beiden Hunden im Hero-Bildband', () => {
  const source = readFileSync('src/pages/index.astro','utf8');
  const css = readFileSync('src/styles/home.css','utf8');
  assert.ok(source.includes('<figure class="band-big">'));
  assert.ok(source.includes('src={site.heroImage}'));
  assert.ok(!source.includes('class="band-small"'), 'Zweites Welpenbild ist noch eingebunden');
  assert.ok(!source.includes('Shades of · Welpen'), 'Beschriftung des zweiten Bilds ist noch vorhanden');
  assert.ok(css.includes('grid-template-columns: minmax(0, 1fr);'));
  assert.ok(css.includes('.hero-band .band-big img'));
  assert.ok(css.includes('object-fit: contain;'), 'Originalfoto darf nicht zugeschnitten werden');
});

test('Gebauter Startseiten-Bildband hat nur ein Foto', () => {
  const html = readFileSync('dist/index.html','utf8');
  const hero = html.match(/<div class="hero-band">([\s\S]*?)<\/div>/);
  assert.ok(hero, 'Hero-Bildband nicht gefunden');
  assert.equal((hero[1].match(/<figure\b/g) ?? []).length,1);
  assert.ok(hero[1].includes('hero-moyodogs-2026.jpg') || hero[1].includes('/generated/'), 'Originalfoto fehlt');
  assert.ok(!hero[1].includes('Shades of · Welpen'));
});
