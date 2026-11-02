import test from 'node:test';
import assert from 'node:assert/strict';
import { validateEntry, frontmatter, resolveMedia } from '../scripts/validate-content.mjs';
const entry = { title: 'Beispiel', published: false, date: '2026-11-01' };
test('Ein Entwurf ist ausdrücklich nicht veröffentlicht', () => assert.equal(validateEntry(entry, 'posts'), false));
test('Fehlender Veröffentlichungsstatus führt zum Abbruch', () => assert.throws(() => validateEntry({ title: 'Neu' }, 'dogs'), /Veröffentlichungsstatus/));
test('Datum und Bildbeschreibung werden geprüft', () => {
  assert.throws(() => validateEntry({ ...entry, date: 'kein Datum' }, 'posts'), /Beitragsdatum/);
  assert.throws(() => validateEntry({ ...entry, image: '/media/foto.jpg' }, 'dogs'), /Bildbeschreibung/);
});
test('Bilder dürfen nicht aus dem Medienordner ausbrechen', () => {
  assert.throws(() => resolveMedia('/media/../../secret.txt', '/project'), /Bildpfad/);
  assert.throws(() => resolveMedia('https://example.com/a.jpg', '/project'), /media/);
});
test('CMS speichert boolesche Werte und Texte korrekt', () => {
  assert.deepEqual(frontmatter('---\ntitle: Malu\npublished: false\n---\nText'), { title: 'Malu', published: false });
});
