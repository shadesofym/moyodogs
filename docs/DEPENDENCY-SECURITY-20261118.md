# Sicherheitsprüfung der Abhängigkeiten – 18.11.2026

## Ergebnis

- Astro wird von **7.4.4** auf **7.4.12** aktualisiert. Der `package-lock.json` wird mit npm 11 / Node 24.15.0 ohne Ausführung fremder Installationsskripte neu aufgelöst.
- `npm audit` meldet weiterhin `GHSA-fc5q-39xc-vjpf` / `CVE-2026-112366` für die transitive Abhängigkeit **picomatch <= 4.0.7** (ReDoS bei speziell gebauten Glob-Patterns).
- Die damit verbundenen Astro-, Vite- und weiteren Einträge sind Folgeeinträge derselben Stammursache. Sie sind **nicht** mehrere eigenständige, bestätigte Sicherheitslücken in der öffentlich ausgelieferten Website.
- Am 18.11.2026 war keine eindeutig bestätigte verfügbare gepatchte npm-Version nachweisbar. Eine automatische Rückstufung von Astro auf 5.x durch `npm audit fix --force` ist **nicht zulässig**.
- Die statische MOYO-DOGS-Seite führt den Node-basierten Build-/Glob-Parser nicht auf dem Server für Besucher aus. Das reduziert den direkten Angriffspfad, beseitigt aber die Entwicklungs- und CI-Warnung nicht.

## Freigaberegeln

1. `npm ci`, `npm run check`, `npm run lint`, `npm run build` und `npm test` müssen bestanden sein.
2. Der CI-Sicherheitscheck dokumentiert die bekannte `picomatch`-Warnung sichtbar und lässt **keine neuen, unbekannten hohen oder kritischen direkten Advisories** unbemerkt durch.
3. Sobald `picomatch` eine bestätigte gepatchte Version veröffentlicht, Upgrade durchführen, CI erneut prüfen, Ausnahme entfernen.
4. Vor einer Veröffentlichung ist die Branch-Vorschau auf Cloudflare auf Rendering und SEO zu prüfen.
5. Keine `npm audit fix --force`-Änderungen und keine automatischen Major-Downgrades.

Quelle: https://github.com/advisories/GHSA-fc5q-39xc-vjpf

**Hinweis:** Diese dokumentierte Risikoabwägung ist keine Aussage, dass alle Sicherheitswarnungen behoben wurden.
