# Changelog

## 1.3.2 - 2026-11-22

### Performance
- Card picker: the previews are back (`preview: true`), and light. Each card's preview is drawn only once it scrolls into view of Home Assistant's card picker, which otherwise builds the preview of every card at once: until then it holds Home Assistant's state (no render, no history request, no animation). On a dashboard or in the card editor the card is drawn as before.

## 1.3.1 - 2026-11-22

### Performance
- Card picker: the cards no longer ask Home Assistant for a live preview (`preview: false` in `window.customCards`). The picker drew every card at once (history requests, animations), which made the list slow to open; it now shows each card's description instead.

## 1.3.0 - 2026-11-20

### Features
- Mini card editor: `show_counts`, `show_date`, `only_problems` and `expand_dns` are now in the visual editor of the mini card too — its detailed view (the zoom button) draws the full card with them.
- Header: the round icon carries the integration's logo as a badge at its lower right corner (Certificate Expiry, or Whois when only domain names are listed), as the other ha-* cards, on both cards and both headers.

### Fixes
- README: the night picture follows Home Assistant's dark theme alone (since 1.2.1), no longer "after sunset".

### Performance
- The automatic discovery (Certificate Expiry, Whois, DNS IP) scans the entity registry once per registry change instead of on every state change of Home Assistant.
- The status pill's fit check on the illustrated header reads the ground strip's position once and only measures the title, subtitle and pill (each ancestor's overflow read once), instead of every descendant with its computed style.

### Maintenance
- The commitlint config loads as an ES module: the `commit-msg` hook failed on every commit.

## 1.2.1 - 2026-11-18

### Fixes
- Illustrated header: `auto` now follows the Home Assistant theme alone — a light theme keeps the day picture after sunset, a dark theme still shows the night one.

## 1.2.0 - 2026-11-17

### Features
- **Illustrated header** on both cards, 90 px high: a certificate framed on the wall and a padlock on the desk (a desk strip edge to edge at the bottom), with the title, the next expiry and the status on the wall at the left. The picture follows the overall status: valid (green padlock, gold seal, sparkles), expiring soon (an hourglass on the desk, its sand running), expired or invalid (padlock open, certificate askew with a red stamp) and unknown (grey, still). The round `mdi:certificate` icon takes the status colour. Night picture when the sun is below the horizon or with Home Assistant's dark theme; new options `illustration_theme` (`auto`, `day`, `night`) and `illustration` (`false` keeps the classic header), in the visual editor of both cards. Animations stop with *reduce motion*.
- **Status pill on the title line** of every header (illustrated or classic, full and mini card): right after the title, in the status colour of the icon, as long as the title stays whole and the pill keeps its whole label beside it (measured by the card in every language, no fixed width threshold); otherwise it drops under a one-line subtitle, and keeps only its dot when even that does not fit the banner, and at 200 px or less. The mini card's expand/collapse button is a 24 px frosted round button in the banner's top-right corner.
- **Night picture with the dark theme even while the sun is up**: in `auto`, the banner shows the night picture when the sun is below the horizon or Home Assistant's theme is dark.

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
