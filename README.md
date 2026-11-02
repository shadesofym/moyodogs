# MOYO DOGS

Astro-Website mit Pages CMS und Cloudflare Pages. Design: filmische Startseite, Porträtstudio und Journal. Gold #977514, Anthrazit #141414; Dunkel als Standard, Hell und Automatisch bleiben wählbar.

## Lokal arbeiten

Node 24.15.0 verwenden (`.nvmrc`). Abhängigkeiten sind im Lockfile fixiert.

```sh
npm ci
npm run dev
```

Prüfungen und statische Vorschau:

```sh
npm run check
npm run lint
npm run build
npm test
python3 scripts/serve-preview.py
```

Die statische Vorschau läuft auf http://127.0.0.1:4322/ und prüft auch die vorbereiteten Cloudflare-Header und statischen 301-Weiterleitungen. Ein bereits laufender Server muss nach Änderungen an seinem Python-Skript neu gestartet werden. Für reine Inhalts-/Buildänderungen genügt Browser-Neuladen.

## Inhalte und Verwaltung

- `src/data/site.json`: Startseite und Kontaktadresse.
- `src/content/dogs`: drei aktuelle Hundeprofile.
- `src/content/litters`: aktuelle Planung und frühere Würfe.
- `src/content/offspring`: 23 Nachzuchtporträts mit Zuordnung zum Wurf.
- `src/content/posts`: Journal; nur ausdrücklich veröffentlichte Einträge werden gebaut.
- `src/content/pages`: Zucht und Rasse.
- `.pages.yml`: passende Pages-CMS-Felder, Galerien und Text-/Bild-/Zitat-/Video-Bausteine.

Entwürfe werden nicht als Seiten gebaut. Das macht Dateien in einem öffentlichen GitHub-Repository nicht privat. Keine privaten Formulareinträge oder Dokumente im Repository speichern.

Die Bilder liegen in `public/media`. Beim Build werden nur verwendete Bilder in responsive WebP-/AVIF-Versionen umgerechnet. Bereits erzeugte Varianten werden wiederverwendet. Unverwendete importierte Bilder bleiben in der CMS-Mediathek verfügbar. Videos werden ohne Autoplay mit Controls und `preload=none` eingebunden; höchstens 20 MB pro Datei.

Galerien unterstützen Tastatur, Wischen und Vollbild. Astro-Seitenübergänge, gespeicherte Farbauswahl und reduzierte Bewegung bleiben erhalten. Das Startbild ist ein Foto, kein automatisch startendes Video.

## WordPress und SEO

Die öffentlichen WordPress-Texte und Bilder sind übernommen. Archivbeiträge behalten ihre Daten und erhalten einen historischen Hinweis. Der leere Beitrag „Fotoshooting 8 weeks“ bleibt Entwurf. Drei bereits auf WordPress fehlende Bilder sind dokumentiert.

Details, Quellenzuordnung, URL-Listen und offene Punkte: [Migration und Start](docs/MIGRATION-UND-START.md).

Standard-Builds bleiben für Suchmaschinen gesperrt. Eine spätere ausdrückliche Production-Freigabe mit `SITE_INDEXING=enabled` baut HTML, robots.txt und Header gemeinsam um. Die Hauptdomain ist zentral in `src/data/seo.json` hinterlegt. Beispiele und pages.dev-Adressen bleiben ausgeschlossen. Die Sitemap `/sitemap.xml` enthält ausschliesslich die vorgesehenen Hauptdomain-Adressen veröffentlichter Inhalte.

Cloudflare-Build: `npm run build`, Ausgabe `dist`, Root leer, Branch `main`, `NODE_VERSION=24.15.0`.

Die Website ist noch nicht zur Hauptdomain umgeschaltet. Impressum/Datenschutz, Domain-/E-Mail-Erhalt und ein kompletter Hosting-Backup bleiben vor dem endgültigen Start zu erledigen. Pages CMS muss noch mit dem richtigen GitHub-Konto im echten Speicherablauf getestet werden.

Das Journal verwendet Swiss-Typografie und asymmetrische Plakatkarten mit Foto-, hellen und dunklen Flächen. Auf Mobilgeräten werden die Karten einspaltig dargestellt. Die filmische Startseite bleibt erhalten.
