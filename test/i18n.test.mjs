import assert from "node:assert/strict";
import { test } from "node:test";
import { load } from "./load.mjs";

const { STRINGS, LANGUAGES, lang, fmtLang } = load("certificate-card.js", ["STRINGS", "LANGUAGES", "lang", "fmtLang"]);
const CODES = ["en", "fr", "de", "es", "sr", "sr-Latn", "it", "nl", "pt", "pl", "ro", "da", "sv", "bg", "ru", "uk", "hu", "sk", "cs", "sl", "lv", "el"];
const placeholders = (s) => [...String(s).matchAll(/\{(\w+)\}/g)].map((m) => m[1]).sort();

test("I18N parity: every language has exactly the keys of en, with the same placeholders", () => {
  const ref = Object.keys(STRINGS.en).sort();
  assert.deepEqual(Object.keys(STRINGS).sort(), [...CODES].sort());
  for (const code of CODES) {
    assert.deepEqual(Object.keys(STRINGS[code]).sort(), ref, `key mismatch in ${code}`);
    for (const key of ref) {
      assert.ok(String(STRINGS[code][key]).trim() !== "", `${code}.${key} is empty`);
      assert.deepEqual(placeholders(STRINGS[code][key]), placeholders(STRINGS.en[key]), `placeholders of ${code}.${key}`);
    }
  }
});

test("I18N editor: the language list has every language, in the same order", () => {
  assert.deepEqual(JSON.parse(JSON.stringify(LANGUAGES.map(([c]) => c))), CODES);
});

test("I18N script: sr is Cyrillic and sr-Latn is Latin (integration names and DNS aside)", () => {
  const keep = /Certificate Expiry|DNS IP|DNS|\{\w+\}/g;
  for (const [key, value] of Object.entries(STRINGS.sr)) assert.doesNotMatch(String(value).replace(keep, ""), /[A-Za-z]/, `Latin letter in sr.${key}`);
  for (const [key, value] of Object.entries(STRINGS["sr-Latn"])) assert.doesNotMatch(String(value), /[Ѐ-ӿ]/, `Cyrillic letter in sr-Latn.${key}`);
});

test("I18N resolution: config, then the full code, then its base, then en", () => {
  const hass = (language) => ({ locale: { language } });
  assert.equal(lang(hass("fr-CA")), "fr");
  assert.equal(lang(hass("sr-Latn")), "sr-Latn");
  assert.equal(lang(hass("pt-BR")), "pt");
  assert.equal(lang(hass("ja")), "en");
  assert.equal(lang(hass("fr"), { language: "de" }), "de");
  for (const code of CODES) assert.equal(lang(hass(code)), code);
});

test("I18N locale: Home Assistant's region kept, European Portuguese", () => {
  assert.equal(fmtLang({ locale: { language: "fr-CA" } }), "fr-CA");
  assert.equal(fmtLang({ locale: { language: "pt" } }), "pt-PT");
  assert.equal(fmtLang({ locale: { language: "en-GB" } }, { language: "de" }), "de");
});
