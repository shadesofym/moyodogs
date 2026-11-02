"""One-off, offline migration from the public WordPress snapshot.

Requires beautifulsoup4, markdownify and PyYAML in the Python environment.
Never used by the website build. Explicit --write is required to replace content.
Raw exports and originals stay outside the source repository.
"""
import argparse
import csv
import html
import json
import re
from pathlib import Path
from urllib.parse import unquote, urlsplit

from bs4 import BeautifulSoup
from markdownify import markdownify
import yaml

parser = argparse.ArgumentParser(description=__doc__)
parser.add_argument('--source', type=Path, required=True)
parser.add_argument('--write', action='store_true')
args = parser.parse_args()
if not args.write:
    parser.error('Use --write only after backing up the current content.')
source = args.source.resolve()
root = Path(__file__).resolve().parent.parent
pages = json.loads((source / 'pages.json').read_text())
posts = json.loads((source / 'posts.json').read_text())
media = json.loads((source / 'media.json').read_text())
downloads = {x['id']: x for x in json.loads((source / 'image-downloads.json').read_text())}
by_id = {p['id']: p for p in pages + posts}
aliases = {}
assets = []
for m in media:
    if m['id'] not in downloads:
        continue
    target = f"/media/wordpress/wp-{m['id']}.webp"
    urls = {m['source_url'], m.get('guid', {}).get('rendered', '')}
    urls.update(x['source_url'] for x in m.get('media_details', {}).get('sizes', {}).values() if x.get('source_url'))
    for url in urls:
        if url:
            aliases[unquote(urlsplit(url).path)] = target
    assets.append({'id': m['id'], 'source': m['source_url'],
                   'input': str(source / downloads[m['id']]['file']), 'target': target,
                   'attachment': m['link']})

routes = {38: '/', 63: '/wuerfe/shades-of/', 165: '/zucht/', 163: '/rasse/',
          145: '/kontakt/', 267: '/blog/', 394: '/wuerfe/the-gods/',
          1458: '/wuerfe/fruehling-2027/', 1582: '/wuerfe/fruehling-2027/',
          1593: '/hunde/malu/', 1601: '/hunde/yam/', 1608: '/hunde/bumblebee/'}
for p in posts:
    routes[p['id']] = f"/blog/{p['slug']}/" if p['id'] != 1353 else '/blog/'
offspring = [p for p in pages if p['id'] not in routes and p['id'] not in (1197, 1209)]
for p in offspring:
    slug = 'shades-of-jade-pink' if p['id'] == 1364 else p['slug']
    routes[p['id']] = f'/nachzucht/{slug}/'
routes[1197] = routes[1304]
routes[1209] = routes[1203]
url_routes = {urlsplit(p['link']).path: routes[p['id']] for p in pages + posts}
referenced_media = set()
missing_images = []
video_links = set()
entries = []

def soup(value):
    return BeautifulSoup(value, 'html.parser')

def plain(value):
    return soup(value).get_text(' ', strip=True)

def frontend(p):
    return soup((source / 'html' / f"{p['id']}.html").read_text())

def content(p):
    front = frontend(p)
    modules = front.select('.sek-module-inner')
    if modules:
        seen, parts = set(), []
        for module in modules:
            text = module.get_text(' ', strip=True)
            if not text or text in seen:
                continue
            seen.add(text)
            if p['id'] == 1458 and len(text) < 500:
                continue  # Builder's unrelated About us / Lorem ipsum template.
            parts.append(str(module))
        return soup('\n'.join(parts))
    return soup(p['content']['rendered'])

def photos(p, node=None):
    node = node or content(p)
    candidates = list(node.select('img'))
    result, seen = [], set()
    for img in candidates:
        url = img.get('data-src') or img.get('src', '')
        path = unquote(urlsplit(url).path)
        image = aliases.get(path)
        if image:
            referenced_media.add(path)
            if image not in seen:
                result.append({'image': image, 'alt': img.get('alt', '').strip() or f"{plain(p['title']['rendered']) or 'MOYO DOGS'} – Aufnahme {len(result) + 1}"})
                seen.add(image)
        elif '/wp-content/uploads/' in path:
            missing_images.append({'entry': p['id'], 'url': url})
    # Featured image is not always part of the post body.
    featured = next((a for a in assets if a['id'] == p.get('featured_media')), None)
    if featured and featured['target'] not in seen:
        result.insert(0, {'image': featured['target'], 'alt': plain(p['title']['rendered']) or 'MOYO DOGS'})
    return result

def markdown(p, node=None):
    node = soup(str(node or content(p)))
    for e in node.select('script,style,iframe,form,img,svg,button'):
        e.decompose()
    for e in node.select('video,audio,source'):
        if e.get('src'):
            video_links.add(e['src'])
        if e.name in ('video', 'audio'):
            for child in e.select('[src]'):
                video_links.add(child['src'])
            e.decompose()
    for heading in node.select('h1,h3,h4,h5,h6'):
        heading.name = 'h2'
    for a in node.select('a'):
        href = a.get('href', '')
        parsed = urlsplit(href)
        if parsed.scheme and parsed.scheme not in ('https', 'http', 'mailto', 'tel'):
            a.unwrap()
            continue
        if not href:
            a.unwrap()
            continue
        if parsed.hostname in ('moyodogs.com', 'www.moyodogs.com'):
            path = unquote(parsed.path)
            if path in aliases:
                referenced_media.add(path)
                a['href'] = aliases[path]
            elif parsed.path in url_routes:
                a['href'] = url_routes[parsed.path] + (f'#{parsed.fragment}' if parsed.fragment else '')
    text = markdownify(str(node), heading_style='ATX', bullets='-', strip=['div', 'span'], escape_underscores=False)
    text = re.sub(r'\n{3,}', '\n\n', text).strip()
    return text

def save(kind, slug, data, body, sources):
    path = root / 'src/content' / kind / f'{slug}.md'
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text('---\n' + yaml.safe_dump(data, allow_unicode=True, sort_keys=False, width=110) + '---\n' + body.strip() + '\n')
    entries.append({'file': str(path.relative_to(root)), 'sources': sources, 'published': data.get('published', True)})

def photo_fields(photos):
    return {'image': photos[0]['image'], 'imageAlt': photos[0]['alt'], 'gallery': photos[1:]} if photos else {'gallery': []}

for p in posts:
    title = plain(p['title']['rendered']) or 'The Gods – elf Tage alt'
    body = markdown(p)
    images = photos(p)
    readable = plain(p['content']['rendered'])
    description = re.sub(r'\s+', ' ', readable).strip()
    if len(description) > 165:
        description = description[:162].rsplit(' ', 1)[0] + '…'
    if not description:
        description = f'{title}: Bilder und Erinnerungen aus dem Alltag von MOYO DOGS.'
    empty = not body and not images
    data = {'title': title, 'description': description, 'published': not empty,
            'date': p['date'][:10], 'category': 'Aus unserem Archiv',
            'historical': True, **photo_fields(images)}
    save('posts', p['slug'], data, body, [p['id']])

dog_names = {1593: ('Malu', 'malu'), 1601: ('Yam', 'yam'), 1608: ('Bumblebee', 'bumblebee')}
dog_descriptions = {
    1593: 'Ecyoj-Malu of Black-Golden Pearls: Gesundheit, Abstammung, Prüfungen und Malus Geschichte bei MOYO DOGS.',
    1601: 'Shades of Yam: ein fröhlicher, arbeitsfreudiger Holländischer Schäferhund. Lerne sein Wesen, seine Abstammung und seine Prüfungen kennen.',
    1608: 'Shades of Bumblebee: sportlicher Holländischer Schäferhund mit offenem Wesen. Gesundheit, Abstammung und Einblicke in seine Entwicklung.',
}
for order, (pid, (name, slug)) in enumerate(dog_names.items(), 1):
    old_path = root / 'src/content/dogs' / f'{slug}.md'
    old = yaml.safe_load(old_path.read_text().split('---', 2)[1])
    body = markdown(by_id[pid]).replace('04.09.2029', '04.09.2019')
    body = re.sub(r'^## [^\n]+\n+', '', body, count=1)
    body += '\n\n[Unsere Zucht kennenlernen](/zucht/) · [Aktuelle Wurfplanung](/wuerfe/)'
    save('dogs', slug, {**old, 'description': dog_descriptions[pid],
         'seoTitle': f'{name} – Holländischer Schäferhund', 'order': order}, body, [pid])

for pid, slug, title, description in [
    (165, 'zucht', 'Unsere Zucht. Unsere Verantwortung.', 'Sandra und MOYO DOGS im Kanton Bern: Zuchtziele, Aufzucht, Sozialisation und Begleitung unserer Holländischen Schäferhunde.'),
    (163, 'rasse', 'Der Holländische Schäferhund', 'Wesen, Beschäftigung und Eigenschaften des Holländischen Schäferhundes – Einblicke von MOYO DOGS im Kanton Bern.'),
]:
    body = markdown(by_id[pid])
    if pid == 165:
        body = re.sub(r'^## Zucht Moyo Dogs\n+', '', body)
        body = "Ich bin Sandra. Im Kanton Bern führe ich meine kleine, familiäre und SKG-/FCI-anerkannte Zucht für Holländische Schäferhunde.\n\n" + body
    body += '\n\n[Unsere Hunde](/hunde/) · [Würfe und Wurfplanung](/wuerfe/) · [Kontakt aufnehmen](/kontakt/)'
    save('pages', slug, {'title': title, 'description': description}, body, [pid])

# Duplicate Kama and Vayu pages are consolidated, keeping their union of photos.
for p in offspring:
    title = plain(p['title']['rendered'])
    slug = routes[p['id']].strip('/').split('/')[-1]
    litter = 'shades-of' if p['id'] >= 1359 else 'the-gods'
    images = photos(p)
    if p['id'] == 1203:
        extra = photos(by_id[1209])
        images += [i for i in extra if i['image'] not in {x['image'] for x in images}]
    body = markdown(p)
    save('offspring', slug, {'title': title, 'description': f'{title} aus unserem Wurf «{"Shades of" if litter == "shades-of" else "The Gods"}»: Porträt und Bilder von MOYO DOGS.',
         'published': True, 'litter': litter, **photo_fields(images)}, body, [p['id']] + ([1209] if p['id'] == 1203 else []))

planning = by_id[1458]
planning_images = photos(planning)
save('litters', 'fruehling-2027', {
    'title': 'UNLEASHED – Forces of Nature', 'description': 'Unsere Wurfplanung für Frühling 2027: O’Deadshot du Royaume de Géane × Ecyoj-Malu of Black-Golden Pearls.',
    'published': True, 'period': 'Frühling 2027', 'mother': 'Ecyoj-Malu of Black-Golden Pearls',
    'father': 'O’Deadshot du Royaume de Géane', 'status': 'Geplant', 'order': 1,
    **photo_fields(planning_images), 'timeline': [{'title': 'UNLEASHED – Forces of Nature', 'when': 'Frühling 2027', 'state': 'Geplant', 'description': 'Geplante Verpaarung mit O’Deadshot du Royaume de Géane und Malu.'}],
}, markdown(planning) + '\n\n[Mehr über unsere Aufzucht](/zucht/) · [Kontakt aufnehmen](/kontakt/)', [1458, 1582])

shades_photos = photos(by_id[63])
save('litters', 'shades-of', {
    'title': 'Shades of', 'description': 'Unser erster Wurf: die Geschichte von Malu und Easy van Cholinchove und den Shades-of-Hunden von MOYO DOGS.',
    'published': True, 'period': 'Januar 2023', 'mother': 'Ecyoj-Malu of Black-Golden Pearls',
    'father': 'Easy van Cholinchove', 'status': 'Abgeschlossen', 'order': 3,
    **photo_fields(shades_photos), 'timeline': [{'title': 'Die Welpen sind da', 'when': 'Nacht vom 2. auf den 3. Januar 2023', 'state': 'Abgeschlossen', 'description': 'Malu hat zwölf Welpen zur Welt gebracht.'}],
}, 'In der Nacht vom 2. auf den 3. Januar 2023 kamen zwölf Welpen zur Welt. Die Geburt verlief ohne Komplikationen und war für Malu sehr anstrengend.\n\nDie individuellen Porträts und Bilder findest du unten. Unsere Erinnerungen an die ersten Wochen und die Entwicklung unserer Hunde begleiten wir im Journal.\n\n[Geburtsbericht lesen](/blog/birthday/) · [Der erste Geburtstag](/blog/happy-first-birthday/) · [Zwei Jahre Shades of](/blog/happy-2-years/)', [63, 710, 751, 850])

gods = by_id[394]
gods_body = markdown(gods)
# Preserve historical facts; do not present the old sales status as current.
gods_body = re.sub(r'Aktuell vergeben wir noch 2 Reservierungsplätze[\s\S]*?Anfrage an[^\n]*', '', gods_body)
save('litters', 'the-gods', {
    'title': 'The Gods', 'description': 'Unser T-Wurf vom 10. September 2025: Malu × Bazooka vom Scheinwerferberg. Erinnerungen, Porträts und Entwicklung der Welpen.',
    'published': True, 'historical': True, 'period': '10. September 2025',
    'mother': 'Ecyoj-Malu of Black-Golden Pearls', 'father': 'Bazooka vom Scheinwerferberg',
    'status': 'Abgeschlossen', 'order': 2, **photo_fields(photos(gods)),
    'timeline': [{'title': 'Geburt des T-Wurfs', 'when': '10. September 2025', 'state': 'Abgeschlossen', 'description': 'Malu hat dreizehn Welpen zur Welt gebracht.'}],
}, 'Diese Seite dokumentiert den Wurf von 2025. Die folgenden Texte zur damaligen Planung und Aufzucht sind historische Einblicke.\n\n' + gods_body + '\n\n[Geburtsbericht](/blog/birthday-2/) · [Vier Wochen alt](/blog/4-wochen-alt/) · [Aktuelle Wurfplanung](/wuerfe/fruehling-2027/)', [394, 1092])

# Page URLs and media URLs have separate, explicit destinations, never a blanket home redirect.
redirects = {}
mapping = []
for p in pages + posts:
    old = unquote(urlsplit(p['link']).path)
    target = routes[p['id']]
    mapping.append({'id': p['id'], 'old': old, 'new': target,
                    'note': 'Leere Quelle: Metadaten als Entwurf übernommen, Übersicht als Ziel.' if p['id'] == 1353 else ''})
    if old != target:
        redirects[old] = target
        if old.endswith('/') and old != '/':
            redirects[old.rstrip('/')] = target
for a in assets:
    for old in [unquote(urlsplit(a['source']).path), unquote(urlsplit(a['attachment']).path)]:
        redirects[old] = a['target']
for old in referenced_media:
    redirects[old] = aliases[old]
redirects = {k: v for k, v in redirects.items() if k != v}
if len(redirects) > 2000:
    raise ValueError('Cloudflare static redirect limit exceeded')
(root / 'public/_redirects').write_text('# Generated from the WordPress migration inventory. Do not replace with a catch-all.\n' + '\n'.join(f'{old} {new} 301' for old, new in sorted(redirects.items())) + '\n')

docs = root / 'docs'
docs.mkdir(exist_ok=True)
with (docs / 'wordpress-url-mapping.csv').open('w', newline='') as f:
    w = csv.DictWriter(f, fieldnames=['id', 'old', 'new', 'note']); w.writeheader(); w.writerows(mapping)
# All known image variants: extra variants can later use Cloudflare Bulk Redirects.
with (docs / 'wordpress-media-variants.csv').open('w', newline='') as f:
    w = csv.writer(f); w.writerow(['old_path', 'new_path', 'in_pages_redirects'])
    w.writerows((k, v, k in redirects) for k, v in sorted(aliases.items()))
report = {'snapshot': '2026-11-02', 'pages': len(pages), 'posts': len(posts), 'images': len(assets),
          'entries': entries, 'routes': mapping, 'redirects': len(redirects),
          'media_variants': len(aliases), 'missing_images': missing_images,
          'video_urls': sorted(video_links), 'assets': assets,
          'review': ['Malu: Geburtsjahr 2019 am 02.11.2026 von Sandra bestätigt.',
                     'Beitrag 1353: Quelle enthält weder Text noch Bilder. Als Entwurf erhalten.',
                     'Malu: Grössen-/Gewichtsangaben unterscheiden sich zwischen Profil und Wurfplanung; unverändert übernommen.',
                     'Historische Wurf- und Beitragsangaben sind keine aktuelle Verfügbarkeitsauskunft.',
                     'Gesundheits-, Prüfungs- und Abstammungsangaben aus den eigenen WordPress-Texten; Belege vor Freigabe prüfen.',
                     'Kein vollständiges WordPress-Backup: Datenbank, private Inhalte und Serverkonfiguration fehlen.']}
(source / 'migration-work.json').write_text(json.dumps(report, ensure_ascii=False, indent=2))
public_report = {k: v for k, v in report.items() if k != 'assets'}
(docs / 'wordpress-migration.json').write_text(json.dumps(public_report, ensure_ascii=False, indent=2) + '\n')
print(json.dumps({k: report[k] for k in ['pages', 'posts', 'images', 'redirects', 'media_variants', 'missing_images', 'video_urls']}, ensure_ascii=False))
