# WordPress-Übernahme und SEO-Vorbereitung

Stand: 2. November 2026. Nur lokal vorbereitet; kein Upload, kein Domainwechsel und keine Freigabe für Suchmaschinen in diesem Arbeitsschritt.

## Übernommene Inhalte

- Drei Hundeprofile aus dem sichtbaren WordPress-Seiteneditor: Malu, Yam und Bumblebee.
- Malus Geburtsdatum 04.09.2019: Geburtsjahr von Sandra am 02.11.2026 bestätigt.
- Ausführliche Zuchtbeschreibung einschliesslich Aufzucht, Ernährung und Begleitung sowie Rassebeschreibung.
- Wurfplanung UNLEASHED – Forces of Nature für Frühling 2027, mit den vorhandenen Angaben zu O’Deadshot und Malu.
- Frühere Würfe Shades of (2023) und The Gods (2025).
- 23 individuelle Nachzuchtporträts. Die doppelten Kama- und Vayu-Seiten haben jeweils ein gemeinsames Ziel.
- 23 historische Blogeinträge: 22 veröffentlicht im lokalen Inhalt, ein leerer Eintrag als Entwurf. Das zusätzliche bisherige CMS-Testbeispiel bleibt ebenfalls Entwurf.
- Sechs historische Videos als MP4-kompatible Webversionen, jeweils unter 20 MB; die Originale sind zusätzlich gesichert. Die zugehörigen Beiträge enthalten die Clips mit Wiedergabesteuerung und den ursprünglichen Texten als Beschreibung.
- 381 Bilder als lokal gespeicherte WebP-Dateien, höchstens 1800 Pixel Kantenlänge. Die archivierten Originale sind unverändert ausserhalb des Repositorys vorhanden. Der normale Build erzeugt responsive AVIF-/WebP-Versionen nur für tatsächlich verwendete Bilder. Die gesamte Bibliothek bleibt für Pages CMS verfügbar.

Historische Beiträge behalten ihre damaligen Daten und Aussagen. Ein sichtbarer Archivhinweis erklärt, dass frühere Angaben zu Wurfplanung und verfügbaren Welpen keine heutige Verfügbarkeit darstellen. Die alte Reservierungsanzeige auf der Übersicht zum abgeschlossenen T-Wurf wurde entfernt.

Der Beitrag „Fotoshooting 8 weeks“ vom 15.11.2025 enthält im gesicherten WordPress-Stand weder Text noch Bilder. Seine Metadaten bleiben als CMS-Entwurf erhalten. Die alte Adresse führt auf die Journal-Übersicht, bis eine echte Bildserie vorliegt.

Drei im T-Wurf-Beitrag verknüpfte Bilddateien liefern bei WordPress HTTP 404. Ihre genauen Adressen stehen im maschinenlesbaren Bericht. Keine Bilder wurden durch vermeintlich ähnliche Dateien ersetzt.

## Quellen und Weiterleitungen

`wordpress-migration.json` dokumentiert Quellen-IDs, Inhaltsdateien, Sonderfälle und offene Angaben.
`wordpress-url-mapping.csv` enthält die Ziele aller 37 alten Seiten und 23 Beiträge.
`public/_redirects` enthält permanente Weiterleitungen für geänderte Seitenadressen, Bildoriginale, Medien-Anhangseiten und tatsächlich verwendete Bildgrössen. Identische Seitenadressen benötigen keine Weiterleitung.
`wordpress-media-variants.csv` dokumentiert zusätzlich sämtliche 3755 bekannten WordPress-Bildadressen und ob sie bereits in `_redirects` stehen. Die direkt importierbare Datei `wordpress-media-bulk-redirects.csv` enthält alle Bildgrössen ohne Kopfzeile im Cloudflare-CSV-Format. Sie wird erst beim Domainwechsel als Bulk Redirect List samt zugehöriger Regel aktiviert. Die Quellen gelten für HTTP/HTTPS und Subdomains, einschliesslich www. Die Liste ist vorbereitet, nicht in Cloudflare aktiviert. Eine separate Liste ist nötig, weil Pages höchstens 2000 statische Regeln pro Datei erlaubt.

Cloudflare Pages kann in `_redirects` nicht nach Query-Parametern unterscheiden. Eventuelle alte Links mit `?p=ID`, `?page_id=ID` oder `?attachment_id=ID` müssen bei Bedarf separat als Cloudflare Redirect Rules eingerichtet werden. Die öffentlich exportierten Permalinks sind vollständig zugeordnet. Vor dem Start mit Search Console und den tatsächlichen Zugriffsdaten auf weitere alte Adressen prüfen.

Das lokale Python-Vorschauskript kann die vorbereiteten statischen 301-Weiterleitungen ebenfalls ausführen. Cloudflare selbst muss nach dem späteren Upload zusätzlich stichprobenartig geprüft werden.

## SEO und bewusste Freigabe

Die kanonische Domain wird zentral in `src/data/seo.json` definiert: `https://moyodogs.com`.
Gemeinsame Metadaten liegen in `src/layouts/Base.astro`, SEO-Helfer in `src/lib/seo.ts`.

Enthalten sind eindeutige Seitentitel und Beschreibungen, kanonische Adressen, Social-Media-Metadaten, Organization/WebSite/WebPage und BlogPosting mit Sandra als Autorin, Beitragsdaten und eine einfache BreadcrumbList. Es werden keine Bewertungen, Auszeichnungen oder Gesundheitsnachweise als strukturierte Daten erfunden.

`/sitemap.xml` wird bei jedem Build aus den veröffentlichten Sammlungen erzeugt. Sie enthält die vorgesehenen Hauptdomain-Adressen. Entwürfe, Designbeispiele, 404 und die noch unfertigen Rechtstexte werden nicht aufgenommen. Keine erfundenen Änderungsdaten.

Standardmässig bleibt jeder Build Vorschau: HTML-Metadaten und HTTP-Header setzen `noindex`, robots.txt sperrt Crawling. Die Sitemap ist zur technischen Prüfung abrufbar, wird aber noch nicht zur Indexierung eingereicht.

Erst nach inhaltlicher und rechtlicher Freigabe sowie Verbindung der Hauptdomain:

1. In Cloudflare ausschliesslich in der Production-Umgebung `SITE_INDEXING=enabled` setzen und neu bauen. Nicht in Preview setzen. Bei einem gesetzten anderen `CF_PAGES_BRANCH` als `main` bleibt die Freigabe zusätzlich gesperrt.
2. Der Build aktualisiert HTML, robots.txt und Header gemeinsam. Der Vorschauhinweis entfällt im freigegebenen Build.
3. Beide Arten von pages.dev-Adressen behalten durch Host-Headerregeln `noindex`. Beispiele, Fehlerseite und unfertige Rechtstexte bleiben ebenfalls ausgeschlossen.
4. Hauptdomain und www-Variante auf genau eine Hauptadresse vereinheitlichen; das geschieht bei der Domain-Einrichtung, nicht durch die Pages-Datei.
5. In Search Console die Hauptdomain verifizieren, Sitemap einreichen und repräsentative Seiten per URL-Prüfung kontrollieren. Bestehende Verifizierungsdateien oder DNS-Einträge erhalten.
6. 301-Ziele, fehlende Seiten, Bilder, Mobilansicht und Kontakt-Mail nach dem Domainwechsel erneut testen. Weiterleitungen langfristig beibehalten.

Eine versehentliche Preview-Veröffentlichung hebt die Indexierungssperre nicht auf. Eine fertige technische Vorbereitung ist noch keine Garantie für ein bestimmtes Ranking.

Offizielle Formatreferenz: https://developers.cloudflare.com/rules/url-forwarding/bulk-redirects/reference/csv-file-format/

## Noch vor dem endgültigen Start

- Impressum und Datenschutz vervollständigen: vorhandene Platzhalter sind keine freigegebenen Rechtstexte.
- Die bestehenden Gesundheits-/Prüfungsangaben anhand der Unterlagen redaktionell freigeben. Malus Grössen-/Gewichtsangaben unterscheiden sich zwischen Profil und Wurfplanung; sie wurden aus den jeweiligen Quellen übernommen.
- Echten Pages-CMS-Speicherablauf mit dem richtigen GitHub-Konto prüfen. Die Konfiguration bietet auch Nachzuchtporträts an.
- Domain-Verlängerung sichern; laut bisheriger Angabe läuft die gekündigte Domain im Juni 2027 aus. Mailbetrieb nach Hosting-Ende am 15.03.2027 planen.
- Vollständiges Hosting-/Datenbank-Backup erstellen. Der öffentliche Export enthält keine privaten Formulareinträge, Datenbank, Plugins oder Serverkonfiguration und ersetzt dieses Backup nicht.

## Einmaliger Import

`scripts/import-wordpress.py --source <Archivordner> --write` ist ein einmaliges Offline-Werkzeug. Es benötigt BeautifulSoup, markdownify und PyYAML. Nicht nach redaktionellen Änderungen erneut ausführen: bestehende importierte Inhalte würden ersetzt. Vorher immer sichern.
`scripts/import-wordpress-images.mjs <migration-work.json>` konvertiert die Originalbilder. Für HEIC-Dateien verwendet das einmalige Werkzeug auf macOS den Systemkonverter. Die fertige Astro-Website benötigt diesen nicht.
