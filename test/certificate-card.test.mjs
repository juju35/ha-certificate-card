import assert from "node:assert/strict";
import { test } from "node:test";
import { devices, entities, NOW, states } from "../scripts/mock-states.mjs";
import { load } from "./load.mjs";

const { findCerts, findDns, certInfo, dnsInfo, sortCerts, summary, nameOf, thresholds, fmtLeft, fmtWhen, CertificateCard, CertificateMiniCard } = load(
  "certificate-card.js",
  ["findCerts", "findDns", "certInfo", "dnsInfo", "sortCerts", "summary", "nameOf", "thresholds", "fmtLeft", "fmtWhen", "CertificateCard", "CertificateMiniCard"]
);

const DAY = 864e5;
// Objects built in the card's vm context have another Object prototype: compared as plain data.
const same = (a, b, msg) => assert.deepEqual(JSON.parse(JSON.stringify(a)), b, msg);
const hass = (over = {}) => ({ states, entities, devices, language: "en", locale: { language: "en" }, config: { time_zone: "UTC" }, ...over });
const iso = (days) => new Date(NOW + days * DAY).toISOString();
const one = (state, attributes = {}) => ({
  states: { "sensor.x": { entity_id: "sensor.x", state, attributes: { friendly_name: "example.org Cert expiry", ...attributes } } },
});
const info = (state, attributes, config = {}) => certInfo(one(state, attributes), config, { entity: "sensor.x" }, NOW);

test("discovery: every Certificate Expiry sensor from the registry, whatever its entity id", () => {
  const ids = findCerts(hass()).map((i) => i.entity);
  assert.equal(ids.length, 6);
  assert.ok(ids.every((id) => entities[id].platform === "cert_expiry"));
});

test("discovery: entities, exclude and the entity id fallback without a registry", () => {
  same(
    findCerts(hass(), { entities: ["sensor.a", { entity: "sensor.b", name: "B" }, 3, null] }),
    [{ entity: "sensor.a" }, { entity: "sensor.b", name: "B" }]
  );
  const ex = Object.keys(entities).find((id) => id.startsWith("sensor.vpn"));
  assert.ok(!findCerts(hass(), { exclude: [ex] }).some((i) => i.entity === ex));
  const bare = { states: { "sensor.cert_expiry_timestamp_example_org": { state: iso(10), attributes: {} }, "sensor.other": { state: "1", attributes: {} } } };
  same(findCerts(bare).map((i) => i.entity), ["sensor.cert_expiry_timestamp_example_org"]);
});

test("discovery: DNS IP sensors by default, dns_entities by hand, none with show_dns: false", () => {
  assert.equal(findDns(hass()).length, 3);
  same(findDns(hass(), { dns_entities: ["binary_sensor.passerelle"] }), [{ entity: "binary_sensor.passerelle" }]);
  same(findDns(hass(), { show_dns: false }), []);
});

test("names: item name, then device name, then the friendly name without its suffix", () => {
  const id = Object.keys(entities).find((i) => i.startsWith("sensor.nas"));
  assert.equal(nameOf(hass(), { entity: id }), "nas.example.org");
  assert.equal(nameOf(hass(), { entity: id, name: "NAS" }), "NAS");
  assert.equal(nameOf(one(iso(1)), { entity: "sensor.x" }), "example.org");
  assert.equal(nameOf({ states: {} }, { entity: "sensor.gone" }), "sensor.gone");
});

test("status: valid, expiring (orange then red), expired, invalid, unavailable", () => {
  assert.equal(info(iso(60)).kind, "valid");
  assert.equal(info(iso(60)).cls, "ok");
  same([info(iso(20)).kind, info(iso(20)).cls], ["expiring", "warn"]);
  same([info(iso(3)).kind, info(iso(3)).cls], ["expiring", "crit"]);
  same([info(iso(-1)).kind, info(iso(-1)).cls], ["expired", "crit"]);
  const bad = info(iso(50), { is_valid: false, error: "Hostname mismatch" });
  same([bad.kind, bad.cls, bad.error], ["invalid", "crit", "Hostname mismatch"]);
  same([info("unavailable").kind, info("unavailable").cls], ["unavailable", "idle"]);
  assert.equal(info("unknown").kind, "unknown");
  assert.equal(info("garbage").cls, "idle");
});

test("status: thresholds are configurable, and a numeric sensor gives the days left", () => {
  assert.equal(info(iso(20), {}, { warning_days: 14 }).cls, "ok");
  assert.equal(info(iso(10), {}, { critical_days: 12 }).cls, "crit");
  // Red above orange: orange is raised to red.
  same(thresholds({ warning_days: 5, critical_days: 10 }), [10, 10]);
  same(thresholds({ warning_days: "" }), [30, 7]);
  const n = info("12", { unit_of_measurement: "d" });
  assert.equal(n.kind, "expiring");
  assert.equal(Math.round(n.left / DAY), 12);
});

test("sort: soonest expiry first, certificates without a date last", () => {
  const h = hass();
  const list = sortCerts(findCerts(h).map((i) => certInfo(h, {}, i, NOW)));
  same(
    list.map((c) => c.name),
    ["legacy.example.com", "vpn.example.net", "nas.example.org", "mail.example.com", "home.example.org", "cloud.example.org"]
  );
  const withGone = sortCerts([{ name: "b", expiry: null }, { name: "a", expiry: 5 }]);
  same(withGone.map((c) => c.name), ["a", "b"]);
});

test("DNS: resolved with its address, not resolved, Ping reachable or not", () => {
  const h = hass();
  const [home, legacy] = findDns(h).map((i) => dnsInfo(h, i));
  same([home.kind, home.value, home.name], ["resolved", "203.0.113.10", "home.example.org"]);
  same([legacy.kind, legacy.cls], ["not_resolved", "crit"]);
  assert.equal(dnsInfo(h, { entity: "binary_sensor.passerelle" }).kind, "reachable");
  const off = { states: { "binary_sensor.p": { state: "off", attributes: {} } } };
  assert.equal(dnsInfo(off, { entity: "binary_sensor.p" }).kind, "unreachable");
  assert.equal(dnsInfo({ states: {} }, { entity: "sensor.gone" }).cls, "idle");
});

test("summary: expired first, then invalid, expiring, DNS issue, all valid", () => {
  const c = (kind, cls, entity = kind) => ({ kind, cls, entity });
  assert.equal(summary([c("valid", "ok"), c("expired", "crit")], []).key, "expired");
  assert.equal(summary([c("invalid", "crit"), c("expiring", "warn")], []).key, "invalid");
  same(summary([c("expiring", "warn", "sensor.e")], []), { cls: "warn", key: "expiring", entity: "sensor.e" });
  assert.equal(summary([c("valid", "ok")], [{ cls: "crit", entity: "sensor.d" }]).key, "dns_issue");
  assert.equal(summary([c("valid", "ok")], []).key, "all_valid");
  assert.equal(summary([c("unavailable", "idle")], []).cls, "idle");
});

test("formats: compact days left and relative times", () => {
  assert.equal(fmtLeft(12.7 * DAY, "en"), "12d");
  assert.equal(fmtLeft(5.5 * 36e5, "en"), "5h");
  assert.equal(fmtWhen(4.2 * DAY, "en"), "in 4 days");
  assert.equal(fmtWhen(-2.5 * DAY, "en"), "2 days ago");
  assert.equal(fmtWhen(3 * 36e5, "en"), "in 3 hours");
  assert.match(fmtLeft(12 * DAY, "fr"), /^12\s?j$/);
});

const render = (Cls, config = {}, h = hass()) => {
  globalThis.__CERT_CARD_NOW__ = NOW;
  const card = new Cls();
  card._config = config;
  card._hass = h;
  return { card, html: card._render() };
};

test("full card: header, counters, rows sorted by expiry, DNS section folded", () => {
  const { html } = render(CertificateCard);
  assert.match(html, /class="logo crit"/);
  assert.match(html, />Expired<\/span>/);
  assert.match(html, /Next expiry in 4 days/);
  const order = [...html.matchAll(/class="item cert[^"]*"[^>]*data-entity="([^"]+)"/g)].map((m) => m[1]);
  assert.equal(order.length, 6);
  assert.match(order[0], /legacy/);
  assert.match(html, /Expires on Nov 17, 2026/);
  assert.match(html, /Hostname mismatch/);
  assert.match(html, /class="count-tile ok"[\s\S]*?<span class="v">2<\/span>/);
  assert.match(html, /data-section="dns"[^>]*>[\s\S]*?2\/3/);
  assert.doesNotMatch(html, /item dns/, "DNS rows only once unfolded");
  assert.match(render(CertificateCard, { expand_dns: true }).html, /203\.0\.113\.10/);
});

test("full card: only_problems, show_counts, show_date, title and the empty states", () => {
  const p = render(CertificateCard, { only_problems: true, show_counts: false, show_dns: false }).html;
  assert.equal([...p.matchAll(/class="item cert/g)].length, 4);
  assert.doesNotMatch(p, /class="count-tile/);
  assert.doesNotMatch(p, /data-section="dns"/);
  assert.match(render(CertificateCard, { show_date: false }).html, /in 18 days/);
  assert.match(render(CertificateCard, { title: "TLS" }).html, /class="name">TLS</);
  const ok = render(CertificateCard, { only_problems: true, entities: ["sensor.home_example_org_expiration_du_certificat"], show_dns: false }).html;
  assert.match(ok, /Nothing to report/);
  assert.match(render(CertificateCard, {}, { states: {}, entities: {}, devices: {} }).html, /No certificate found/);
});

test("full card: translated, and dates in the language", () => {
  const { html } = render(CertificateCard, { language: "fr" });
  assert.match(html, /Prochaine expiration dans 4 jours/);
  assert.match(html, /Expire le 17 nov\. 2026/);
});

test("mini card: the most urgent certificates, counters and a detail button", () => {
  const { card, html } = render(CertificateMiniCard);
  assert.equal([...html.matchAll(/class="row clickable/g)].length, 3);
  assert.match(html, /\+3 more/);
  assert.match(html, /class="zoom"/);
  assert.match(html, /2\/3/);
  assert.doesNotMatch(render(CertificateMiniCard, { zoom: false }).html, /class="zoom"/);
  assert.equal([...render(CertificateMiniCard, { max_items: 6 }).html.matchAll(/class="row clickable/g)].length, 6);
  card._zoomed = true;
  assert.match(card._render(), /class="item cert/);
  same(card.getGridOptions(), { columns: 12, min_columns: 6, rows: "auto" });
});
