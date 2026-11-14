# Designsystem · MOYO DOGS

**Stand:** 14. November 2026
**Richtung:** «Neo Poster» – Plakatästhetik mit Petrol und Kupfer, viel Weissraum, harte Kanten.
**Status:** Umsetzung live auf `moyodogs.pages.dev` (Vorschau, `noindex`).

Dieses Dokument beschreibt die Regeln, die im Code bereits gelten. Es ist keine Wunschliste,
sondern die Referenz für weitere Seiten und Änderungen.

---

## 1. Gestaltungsprinzipien

1. **Plakat, nicht Baukasten.** Grosse, eng gesetzte Display-Headlines, klare Rasterkanten,
   keine abgerundeten Karten oder weichen Schatten.
2. **Zwei Farben tragen, der Rest ist Papier.** Petrol für Flächen und Autorität, Kupfer für
   Akzente und Markierungen, Creme als Grundton, Tinte für Text.
3. **Bilder als Fenster.** Rechteckige Bildflächen mit harter Kante, oft mit Bildlegende
   (Monospace, Kupfer). Keine Oval- oder Kreisbilder.
4. **Monospace als Stimme.** Nummern, Labels, Metadaten und Bildlegenden laufen in Space Mono
   und geben der Seite den Archiv-/Dokumentcharakter.
5. **Bewegung nur, wo sie Orientierung gibt.** Reveals, Hover-Zoom, Seitenübergänge – alles
   abschaltbar über `prefers-reduced-motion`.

---

## 2. Farben

Definiert als CSS-Variablen in `src/styles/neo.css` (`:root`).

| Token | Wert | Verwendung |
| --- | --- | --- |
| `--paper` | `#EFECE3` | Seitenhintergrund, Grundton |
| `--paper-2` | `#E6E1D4` | eingesenkte Flächen, Dokument-Panels |
| `--ink` | `#0C0C0B` | Text, Linien, dunkle Flächen |
| `--petrol` | `#0D4F4F` | Primärflächen, Fokus, Buttons |
| `--petrol-deep` | `#083A3A` | Verläufe/Tiefe auf Petrol |
| `--petrol-light` | `#79C9BD` | Akzente auf dunklem Grund |
| `--copper` | `#C68346` | Primärakzent, Marker, Buttons |
| `--copper-deep` | `#A4682F` | Links/Metadaten auf hellem Grund |
| `--copper-light` | `#DFA970` | Akzente auf Petrol/Ink |
| `--line` | `rgba(12,12,11,.16)` | reguläre Trennlinien |
| `--line-soft` | `rgba(12,12,11,.09)` | feine Linien |
| `--muted` | `#6F6D66` | Fliesstext, Sekundärinfo |

**Regeln**
- Kupfer nie als Fliesstextfarbe auf Creme (Kontrast). Für Text auf hellem Grund
  `--copper-deep` verwenden.
- Auf Petrol/Ink: Text in `--paper`, Akzente in `--copper-light` oder `--petrol-light`.
- Auswahlmarkierung (`::selection`): Kupfer auf Tinte.

---

## 3. Typografie

Schriften sind **selbst gehostet** unter `public/fonts/`, eingebunden über
`src/styles/fonts.css`. Keine Google-Fonts-Anfragen – die strikte CSP
(`font-src 'self'`) erlaubt nur lokale Dateien.

| Rolle | Schrift | Schnitt | Einsatz |
| --- | --- | --- | --- |
| Display | **Bricolage Grotesque** | variabel 400–800 | H1–H3, Buttons, Poster |
| Mono | **Space Mono** | 400 / 700 | Eyebrows, Labels, Nummern, Legenden |
| Text | **Inter** | variabel 400–600 | Fliesstext, Navigation, Formulare |

**Display-Regeln**
- Immer Grossbuchstaben (`text-transform: uppercase`), `line-height: 0.82–0.94`,
  `letter-spacing: -0.015em` bis `-0.02em`, `font-weight: 800`.
- H1 Startseite: `clamp(4.2rem, 16.4vw, 15.6rem)`.
- H1 Innenseiten: `clamp(2.9rem, 7.1vw, 6.4rem)`, `max-width: 24ch`, `text-wrap: balance`.
- Lange Innenseiten-Titel (`.long-title`, z. B. Zucht/Würfe) auf Mobile:
  `clamp(1.35rem, 6.8vw, 3.2rem)`.
- H2 Sektionen: `clamp(1.6rem, 3vw, 2.5rem)`.
- Journal-Masthead: `clamp(3.4rem, 13vw, 12rem)`.

**Mono-Regeln**
- `0.62rem`, `letter-spacing: 0.1–0.12em`, Grossbuchstaben.
- Immer für: Eyebrow, Bildlegende, Datum, Nummerierung, «MOYO DOGS / JOURNAL»,
  Fusszeilen-Metadaten.
- Nie für längere Fliesstexte.

**Fliesstext**
- Inter 16 px, `line-height: 1.65` global; im `.prose` 1.85, Farbe `--muted`.
- Prose-Breite: `max-width: 760px`, links am 1320-px-Raster ausgerichtet.
- Links im Prose: `--copper-deep`, unterstrichen, `text-underline-offset: 4px`.

---

## 4. Raster & Abstände

- **Wrap:** `width: min(1320px, 92vw)`, zentriert. Entspricht bei 1440 px: 60 px Rand,
  bei 390 px: 16 px Rand.
- **Headerhöhe:** `--header: 64px`; alle Seitenköpfe rechnen
  `padding-top: calc(var(--header) + …)`.
- **Vertikaler Rhythmus:** Sektionen `clamp(40px, 6vw, 76px)`, Kartenabstände
  `clamp(20px, 3vw, 36px)`.
- **Linien statt Schatten.** Trennung über `1px solid var(--line)` oder `2px solid var(--ink)`
  für Hauptschnitte.
- **Keine Radien** auf Bildern, Karten, Buttons (einzelne runde Marker wie der Kupferpunkt
  sind bewusst gesetzt).

---

## 5. Komponenten

### Header & Menü
- Fixierter Header, 64 px, Creme-Hintergrund, untere Linie.
- Wortmarke «MOYO DOGS» in Bricolage, Kupferpunkt davor.
- Desktop-Navigation: Hunde · Würfe · Zucht · Rasse · Journal · Kontakt.
- Mobil: «Menü»-Button öffnet ein Vollbild-Overlay (`#site-menu`) mit nummerierten
  Einträgen (01–06), Schliessen-Button und Kontaktfuss.
- Verhalten: `aria-expanded`, `inert` im geschlossenen Zustand, Body-Scroll-Lock,
  Fokus wandert ins Menü und zurück. Initialisierung nur über `astro:page-load`.

### Poster-Hero (Variante B · Bildband)
- Aufbau: Kolophon-Zeile → zweizeilige Display-Headline («MOYO / DOGS») → breites
  Bildband mit zwei gerahmten, legendenversehenen Bildern → Intro + Buttons + Sticker.
- Bilder immer rechteckig, harte Kante, Legende in Kupfer/Mono.
- Die Überschrift ist für Screenreader als vollständiger Satz hinterlegt (`sr-only`),
  die grosse Schreibweise ist `aria-hidden`.

### Ticker
- Laufband zwischen Hero und Hundeindex, Petrol-Grund, Creme-Text, Kupfer-Rauten.
- Rein dekorativ (`aria-hidden`), pausiert bei `prefers-reduced-motion`.

### Hundeindex
- Zeilenliste mit Nummer, Name, Meta und Pfeil; Hover zeigt eine Bildvorschau
  (`data-preview`), die dem Cursor folgt.
- Meta-Zeile kommt aus dem optionalen `meta`-Feld der Hunde-Inhalte.

### Innenseiten
- **Page-Heading:** Eyebrow → H1 (ggf. zweizeilig getrennt am Satzende) → Beschreibung.
- **Detail-Hero:** Bild links/Text rechts; ohne Bild `detail-hero--text` mit voller Breite.
- **Entry-Cards:** Bild oben, Titel + Meta, harte Kante, Hover-Zoom.
- **Würfe:** aktuelle Planung als grosse Feature-Zeile (Text + Poster), Archiv als
  2-spaltiges Raster; ohne Bild ein Petrol-Poster mit Jahres-Wasserzeichen.
- **Journal:** Masthead, Intro, Poster-Board (`moyo-journal`) mit vier Postertypen
  (photo/paper/ink/split), danach Liste. Beitragsseiten: Dokumentbilder (hochformat)
  werden als Ganzes gezeigt (`object-fit: contain`), nicht beschnitten.
- **Prose:** max. 760 px, links am Raster; Tabellen scrollen horizontal.
- **Galerie:** eigenes Web Component mit Lightbox, Zähler und Tastatursteuerung.
- **Footer:** Petrol, grosse Wortmarke, Kontakt-Link, Rechtliches in Mono.

### Buttons & Links
- `.button`: Kupferfläche, Tinte-Text, Grossbuchstaben (Mono/Display-Mix), kein Radius.
- `.button--ghost`: transparent, 1-px-Kontur.
- `.text-link`: Mono, Grossbuchstaben, Kupfer, Pfeil ↗; Hover verschiebt den Pfeil leicht.
- Fokus: `outline: 3px solid var(--petrol)`, `outline-offset: 4px`.

---

## 6. Bewegung

- **Reveals:** `[data-reveal]` erhält zunächst `will-reveal`, wird per
  IntersectionObserver eingeblendet (Deckkraft + leichte Translation).
- **Hover:** Bild-Zoom `scale(1.03)` über 0.8–1.2 s, weiche Kurve
  `cubic-bezier(0.16, 1, 0.3, 1)`.
- **Seitenwechsel:** Astro View Transitions.
- **Scroll-Fortschritt:** 2-px-Kupferlinie oben, Breite über `--progress`.
- **Reduzierte Bewegung:** `@media (prefers-reduced-motion: reduce)` deaktiviert
  Animationen, Transitions, Smooth Scroll und View-Transition-Animationen; Reveals
  sind sofort sichtbar.

---

## 7. Responsive

| Breakpoint | Anpassung |
| --- | --- |
| ≤ 1100 px | Navigation/Grids enger, erste Spaltenumbrüche |
| ≤ 940 px | Detail-Hero, Feature- und Kontakt-Grids einspaltig |
| ≤ 760 px | Karten einspaltig, Journal-Intro untereinander, Poster-Mindesthöhen reduziert |
| ≤ 520 px | kleinste Typo-Stufen, kompakte Abstände |

- Kein horizontaler Overflow (geprüft auf allen 66 Seiten bei 390 px und 1440 px).
- Touch-Ziele: Breadcrumbs/Nav mind. 44 px hoch.
- Bilder nutzen `srcset`/`sizes` und werden nicht hochskaliert.

---

## 8. Technische Leitplanken

- **CSP** in `public/_headers`: `default-src 'self'`, `font-src 'self'`,
  `script-src 'self'`. Externe Schriften, Skripte oder Styles sind damit ausgeschlossen.
  Neue Schriften gehören nach `public/fonts/` und in `src/styles/fonts.css`.
- **Kein Inline-JavaScript** in Produktionsseiten (Test erzwingt das).
- **Vorschau:** Solange `SITE_INDEXING` nicht auf `enabled` steht, sind alle Seiten
  `noindex, follow`; der Vorschau-Hinweis bleibt sichtbar.
- **Legacy-Weiterleitungen** in `public/_redirects` dürfen keine real gebauten Pfade
  überschreiben. Nach dem Import geprüft: nur echte Alt-URLs werden umgeleitet.
- **Reihenfolge der Stylesheets:** `fonts.css` → `journal.css` → `neo.css`.
  `neo.css` ist das aktive Designsystem; `journal.css` liefert nur noch strukturelle
  Journal-Regeln.

---

## 9. Dateien

| Datei | Inhalt |
| --- | --- |
| `src/styles/neo.css` | vollständiges Designsystem (Tokens, Layout, Komponenten, Responsive) |
| `src/styles/fonts.css` | `@font-face` für die lokalen WOFF2-Dateien |
| `src/styles/journal.css` | strukturelle Journal-Regeln (älter, wird von `neo.css` überlagert) |
| `public/fonts/` | Bricolage Grotesque, Inter, Space Mono (WOFF2, latin) |
| `src/layouts/Base.astro` | Header, Menü, Footer, SEO, Stylesheet-Reihenfolge |
| `src/scripts/site.ts` | Menü, Scroll-Fortschritt, Reveals, Zähler, Hunde-Vorschau |
| `docs/mockups/` | Design-Mockups inkl. Hero-Varianten A/B/C (nicht Teil der Website) |

---

## 10. Offene Punkte

- E-Mail-Weiterleitung `zucht@moyodogs.com` (Cloudflare Email Routing) braucht eine
  echte Zieladresse; Cloudflare leitet nicht auf dieselbe Adresse weiter.
- Nameserver-Umstellung bei 1ahosting auf Cloudflare steht noch aus; danach
  `www.moyodogs.com` als Custom Domain im Pages-Projekt verbinden.
- Suchmaschinenfreigabe erst nach Freigabe durch die Betreiberin (`SITE_INDEXING=enabled`).
