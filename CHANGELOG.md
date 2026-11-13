# Changelog

## 1.0.0 - 2026-11-13

### Features
- **Certificate Card** (`custom:certificate-card`): every SSL/TLS certificate monitored by the Certificate Expiry integration, sorted by expiry, with its expiry date, the days left as a badge and a bar, coloured against configurable thresholds (`warning_days`, `critical_days`); invalid certificates show their error.
- Valid / expiring / expired counters, and an "only certificates needing attention" mode (`only_problems`).
- Optional DNS checks, in a section that folds and unfolds: DNS IP sensors (resolved or not, with the address) and connectivity binary sensors such as Ping (reachable or not).
- **Certificate Mini Card** (`custom:certificate-mini-card`): the certificates expiring next, counters and DNS checks in a compact view, with a detail button switching to the full card and back.
- Certificate Expiry and DNS IP sensors found automatically through the entity registry; `entities`, `exclude` and `dns_entities` to pick them by hand.
- Visual editor for both cards; light and dark themes; 22 languages, English in the bundle and every other language loaded on demand.
