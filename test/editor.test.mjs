import assert from "node:assert/strict";
import { test } from "node:test";
import { load } from "./load.mjs";

const { CertificateCardEditor, CertificateMiniCardEditor, CertificateCard, CertificateMiniCard } = load("certificate-card.js", [
  "CertificateCardEditor",
  "CertificateMiniCardEditor",
  "CertificateCard",
  "CertificateMiniCard",
]);

// Arrays built in the card's vm context: compared as plain data.
const names = (schema) => JSON.parse(JSON.stringify(schema.flatMap((s) => (s.schema ? names(s.schema) : [s.name]))));

test("editor: every option of the README is in the form of its card", () => {
  const full = new CertificateCardEditor();
  full._config = {};
  assert.deepEqual(names(full._schema()), [
    "title", "entities", "exclude", "domain_entities", "show_title", "show_subtitle", "show_counts", "show_date", "only_problems", "show_domains", "show_dns", "expand_dns",
    "warning_days", "critical_days", "dns_entities", "language",
  ]);
  const mini = new CertificateMiniCardEditor();
  mini._config = {};
  assert.deepEqual(names(mini._schema()), [
    "title", "entities", "exclude", "domain_entities", "show_title", "show_subtitle", "show_domains", "show_dns", "zoom", "warning_days", "critical_days", "max_items", "dns_entities", "language",
  ]);
});

test("editor: the entity pickers offer Certificate Expiry, Whois and DNS IP entities", () => {
  const e = new CertificateCardEditor();
  e._config = {};
  const by = Object.fromEntries(e._schema().filter((s) => s.name).map((s) => [s.name, s]));
  assert.ok(by.entities.selector.entity.filter.some((f) => f.integration === "cert_expiry"));
  assert.ok(by.dns_entities.selector.entity.filter.some((f) => f.integration === "dnsip"));
  assert.ok(by.domain_entities.selector.entity.filter.some((f) => f.integration === "whois"));
  assert.ok(by.exclude.selector.entity.filter.some((f) => f.integration === "whois"));
  assert.equal(by.entities.selector.entity.multiple, true);
});

test("cards: each card names its own editor", () => {
  assert.match(String(CertificateCard.getConfigElement), /"certificate-card-editor"/);
  assert.match(String(CertificateMiniCard.getConfigElement), /"certificate-mini-card-editor"/);
});
