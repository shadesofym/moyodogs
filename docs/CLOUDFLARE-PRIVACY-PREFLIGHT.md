# MOYO DOGS – Cloudflare- und Datenschutz-Preflight

Stand: 18. November 2026 · Nicht automatisch ausführbar über das GitHub-Repository.

## Entscheidung: kein Web-Analytics-Beacon

Die Datenschutzerklärung verspricht, dass auf der Website keine Analyse- und Trackingdienste eingesetzt werden. Beim bisherigen Browser-Audit wurde jedoch ein von Cloudflare hinzugefügtes Analytics-Skript durch die strenge Content-Security-Policy blockiert.

**Die CSP absichtlich nicht aufweichen, um das Skript funktionsfähig zu machen.** Stattdessen die automatische Einbindung im Cloudflare-Konto deaktivieren. Das respektiert die bestehende Datenschutzaussage, verhindert einen zusätzlichen Browseraufruf und hält das Sicherheitsniveau hoch.

1. Im Cloudflare-Dashboard den Bereich **Web Analytics** öffnen.
2. Für die Domain **moyodogs.com** unter **Manage site** die Einstellung **Disable** wählen (nicht „Enable with JS Snippet“).
3. Wenn Cloudflare Pages für das konkrete Projekt eine eigene Web-Analytics-Option anbietet, auch dort prüfen, ob Analytics aktiviert ist; gegebenenfalls deaktivieren.
4. Nach dem nächsten Deployment die Startseite in einem privaten Browserfenster prüfen. Es darf weder ein Script von `static.cloudflareinsights.com` eingebunden noch eine Übertragung an `cloudflareinsights.com` ausgelöst werden.
5. Den mobilen Lighthouse-Best-Practices-Test erneut durchführen und sicherstellen, dass keine CSP-Fehlermeldungen zu diesem Beacon mehr auftreten.

Offizielle Cloudflare-Anleitung: https://developers.cloudflare.com/web-analytics/get-started/

## Datenschutz und Sicherheit

- `public/_headers` enthält bewusst eine restriktive Content-Security-Policy. Sie soll nicht pauschal mit `unsafe-inline`, Wildcards oder zusätzlichen Tracking-Domains gelockert werden.
- Wenn später freiwillig Web Analytics eingeschaltet werden soll, müssen zuerst Zweck, Rechtsgrundlage und Datenschutzerklärung geprüft und die nötigen CSP-Domains gezielt freigegeben werden. Dafür ist eine separate Entscheidung nötig.
- DNS-, E-Mail- und Produktions-Domain-Einstellungen bei Cloudflare vor einer Änderung separat kontrollieren. Keine blinden DNS-Anpassungen.
- `SITE_INDEXING=enabled` nur für den Produktions-Branch `main` setzen. Vorschau-Branches sollen nicht indexiert werden.

## Verifikation

Der GitHub-Audit prüft weiterhin HTTP, SEO, responsive Darstellung und Lighthouse. Er kann aber keine Kontoeinstellungen von Cloudflare ändern. Der Schalter muss im Cloudflare-Dashboard betätigt und anschliessend durch einen erneuten Live-Test bestätigt werden.
