# Changelog

## 1.1.0 - 2026-11-14

### Features
- **Domain names (Whois)** ([#7](https://github.com/juju35/ha-certificate-card/issues/7)): the domain names watched by the Whois integration are found automatically and listed in their own *Domain names* section, with their expiry date, registrar, days left and a bar (full bar: one year), coloured against the same thresholds as the certificates. They count in the header status, the next expiry and the counters; the mini card lists them with the certificates, the soonest first, marked with a globe. New options `show_domains` and `domain_entities`, in the visual editor too; `exclude` and `only_problems` apply to them.

## 1.0.2 - 2026-11-13

### Fixes
- **Clicks lost under an update**: Home Assistant updates the card several times a second. The card is patched in place, but an element appearing in front of the one pressed (a chip, a row) shifted its siblings between the press and the release, so that the click could land on another element or nowhere (the DNS section or a certificate row that did not react). The card is no longer updated while a press is in progress; the pending update is drawn right after the click, or after the release when no click follows.

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
