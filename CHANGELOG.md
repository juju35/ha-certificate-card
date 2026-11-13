# Changelog

## 1.0.1 - 2026-11-13

### Fixes
- Folding back on a tap elsewhere now works on iOS (Safari and the companion app): a tap on something that is not clickable sent no click to the page, so the unfolded DNS section and the detailed view of the mini card stayed open. The press and the release are caught instead; a press in the card released outside of it and a scroll do not fold anything.
- Leaving the card (another dashboard view, a conditional card hidden) brings it back in its default state: sections folded as configured, mini card compact.
- Tests: the clock pinned by the tests now reaches the card, so that the days left they expect no longer depend on the time of day they run.

## 1.0.0 - 2026-11-13

### Features
- **Certificate Card** (`custom:certificate-card`): every SSL/TLS certificate monitored by the Certificate Expiry integration, sorted by expiry, with its expiry date, the days left as a badge and a bar, coloured against configurable thresholds (`warning_days`, `critical_days`); invalid certificates show their error.
- Valid / expiring / expired counters, and an "only certificates needing attention" mode (`only_problems`).
- Optional DNS checks, in a section that folds and unfolds: DNS IP sensors (resolved or not, with the address) and connectivity binary sensors such as Ping (reachable or not).
- **Certificate Mini Card** (`custom:certificate-mini-card`): the certificates expiring next, counters and DNS checks in a compact view, with a detail button switching to the full card and back.
- Certificate Expiry and DNS IP sensors found automatically through the entity registry; `entities`, `exclude` and `dns_entities` to pick them by hand.
- Visual editor for both cards; light and dark themes; 22 languages, English in the bundle and every other language loaded on demand.
