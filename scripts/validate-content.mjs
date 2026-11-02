import { readdir, readFile, access, stat } from 'node:fs/promises';
import { resolve, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parse } from 'yaml';
import {blockSchema,timelineSchema} from '../src/lib/content-schema.ts';
export function frontmatter(text) {
  const match = text.match(/^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/);
  if (!match) throw new Error('YAML-Kopf fehlt');
  return parse(match[1]);
}
export function validateEntry(data, kind) {
  if (!data || typeof data !== 'object') throw new Error('Inhaltsfelder fehlen');
  if (typeof data.title !== 'string' || !data.title.trim()) throw new Error('Titel fehlt');
  // Missing publication flags must never silently publish a new entry.
  if (typeof data.published !== 'boolean') throw new Error('Veröffentlichungsstatus muss ausdrücklich gesetzt sein');
  if (kind === 'posts' && (!data.date || Number.isNaN(new Date(data.date).valueOf()))) throw new Error('Ungültiges Beitragsdatum');
  if (data.image && !data.imageAlt?.trim()) throw new Error('Bildbeschreibung fehlt');
  for (const block of data.blocks ?? []) blockSchema.parse(block);
  if (kind === 'litters') timelineSchema.parse(data.timeline ?? []);
  return data.published === true;
}
export function resolveMedia(path, root) {
  if (typeof path !== 'string' || !path.startsWith('/media/')) throw new Error('Bild muss in /media/ liegen');
  const directory = resolve(root, 'public/media');
  const target = resolve(root, 'public', '.' + path);
  const fromMedia = relative(directory, target);
  if (!fromMedia || fromMedia.startsWith('..')) throw new Error('Ungültiger Bildpfad');
  return target;
}
async function main() {
  const root = fileURLToPath(new URL('../', import.meta.url));
  const config = parse(await readFile(resolve(root, '.pages.yml'), 'utf8'));
  if (!config.content?.length) throw new Error('CMS-Konfiguration fehlt');
  let count = 0;
  for (const kind of ['dogs', 'litters', 'posts', 'offspring']) {
    for (const file of await readdir(resolve(root, 'src/content', kind))) {
      if (!file.endsWith('.md')) continue;
      const data = frontmatter(await readFile(resolve(root, 'src/content', kind, file), 'utf8'));
      try {
        validateEntry(data, kind);
        if (data.image) await access(resolveMedia(data.image, root));
        const photos=[...(data.gallery ?? []),...(data.timeline ?? []).filter(event=>event.image)];
        for(const block of data.blocks ?? []){
          if(block.type==='image')photos.push(block);
          if(block.type==='gallery')photos.push(...block.images);
          if(block.type==='video'){
            const path=resolveMedia(block.file,root);const info=await stat(path);
            if(info.size>20*1024*1024)throw new Error('Video überschreitet 20 MB');
            if(block.poster)await access(resolveMedia(block.poster,root));
            if(block.captions)await access(resolveMedia(block.captions,root));
          }
        }
        for (const photo of photos) {
          if (!photo.alt?.trim()) throw new Error('Bildbeschreibung in Galerie, Baustein oder Zeitleiste fehlt');
          await access(resolveMedia(photo.image, root));
        }
      } catch (error) { throw new Error(`${kind}/${file}: ${error.message}`, { cause: error }); }
      count++;
    }
  }
  const site = JSON.parse(await readFile(resolve(root, 'src/data/site.json'), 'utf8'));
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(site.email)) throw new Error('Kontakt-E-Mail ungültig');
  if (!site.heroAlt?.trim()) throw new Error('Beschreibung des Startbilds fehlt');
  await access(resolveMedia(site.heroImage, root));
  console.log(`CMS-Konfiguration, ${count} Inhalte und Bilddateien geprüft.`);
}
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch(error => { console.error(error.message); process.exitCode = 1; });
}
