// ---------------------------------------------------------------------------
// Visual editors (ha-form)
// ---------------------------------------------------------------------------
import { LANGUAGES } from "./core.js";
import { THRESHOLDS, lang, t } from "./helpers.js";
import { DEFAULTS, items } from "./entities.js";
import { STRINGS } from "./i18n/strings.js";

export const CERT_FILTER = [{ integration: "cert_expiry" }, { domain: "sensor", device_class: "timestamp" }];
export const DNS_FILTER = [{ integration: "dnsip" }, { domain: "binary_sensor" }];
export const DOMAIN_FILTER = [{ integration: "whois" }];

export class CertificateEditorBase extends HTMLElement {
  // [name, default]
  static get toggles() {
    return [];
  }

  static get numbers() {
    return { ...THRESHOLDS };
  }

  setConfig(config) {
    this._config = { ...config };
    this._render();
  }

  set hass(hass) {
    this._hass = hass;
    this._render();
  }

  _schema() {
    const tr = (k) => t(this._hass, this._config, k);
    const numbers = this.constructor.numbers;
    return [
      { name: "title", selector: { text: {} } },
      { name: "entities", selector: { entity: { multiple: true, filter: CERT_FILTER } } },
      { name: "exclude", selector: { entity: { multiple: true, filter: [...CERT_FILTER, ...DOMAIN_FILTER] } } },
      { name: "domain_entities", selector: { entity: { multiple: true, filter: DOMAIN_FILTER } } },
      { type: "grid", name: "", schema: this.constructor.toggles.map(([name]) => ({ name, selector: { boolean: {} } })) },
      {
        type: "grid",
        name: "",
        schema: Object.keys(numbers).map((name) => ({
          name,
          selector: { number: { min: name === "max_items" ? 1 : 0, max: name === "max_items" ? 20 : 365, step: 1, mode: "box" } },
        })),
      },
      { name: "dns_entities", selector: { entity: { multiple: true, filter: DNS_FILTER } } },
      {
        name: "illustration_theme",
        selector: { select: { mode: "dropdown", options: ["auto", "day", "night"].map((value) => ({ value, label: tr(`theme_${value}`) })) } },
      },
      {
        name: "language",
        selector: { select: { mode: "dropdown", options: [{ value: "", label: tr("lang_auto") }, ...LANGUAGES.map(([value, label]) => ({ value, label }))] } },
      },
    ];
  }

  _render() {
    if (!this._hass || !this._config) return;
    const defaults = { ...Object.fromEntries(this.constructor.toggles), ...this.constructor.numbers, illustration_theme: DEFAULTS.illustration_theme };
    if (!this._form) {
      this._form = document.createElement("ha-form");
      this._form.computeLabel = (s) => t(this._hass, this._config, s.name);
      this._form.computeHelper = (s) => STRINGS[lang(this._hass, this._config)][`${s.name}_helper`];
      this._form.addEventListener("value-changed", (ev) => {
        ev.stopPropagation();
        const config = { ...ev.detail.value };
        // A row renamed in YAML ({ entity, name }) keeps its name while it stays selected.
        for (const key of ["entities", "domain_entities", "dns_entities"]) {
          if (!Array.isArray(config[key])) continue;
          const named = new Map(items(this._config[key]).filter((i) => i.name).map((i) => [i.entity, i]));
          config[key] = config[key].map((id) => named.get(id) ?? id);
        }
        for (const [k, v] of Object.entries(config)) {
          // Keep the YAML minimal: drop empty values and options left at their default.
          if (v === "" || v === undefined || v === null || (Array.isArray(v) && !v.length) || (k in defaults && v === defaults[k])) delete config[k];
        }
        this._config = config;
        this.dispatchEvent(new CustomEvent("config-changed", { detail: { config }, bubbles: true, composed: true }));
      });
      this.appendChild(this._form);
    }
    const data = { ...defaults, ...this._config };
    for (const key of ["entities", "domain_entities", "dns_entities"]) if (Array.isArray(data[key])) data[key] = items(data[key]).map((i) => i.entity);
    this._form.hass = this._hass;
    // hass is pushed on every state change while the editor is open: reassign data and schema only when they changed.
    const dataKey = JSON.stringify(data);
    if (dataKey !== this._dataKey) {
      this._dataKey = dataKey;
      this._form.data = data;
    }
    const schemaKey = lang(this._hass, this._config);
    if (schemaKey !== this._schemaKey) {
      this._schemaKey = schemaKey;
      this._form.schema = this._schema();
    }
  }
}

export class CertificateCardEditor extends CertificateEditorBase {
  static get toggles() {
    return [
      ["illustration", true],
      ["show_title", true],
      ["show_subtitle", true],
      ["show_counts", true],
      ["show_date", true],
      ["only_problems", false],
      ["show_domains", true],
      ["show_dns", true],
      ["expand_dns", false],
    ];
  }
}

export class CertificateMiniCardEditor extends CertificateEditorBase {
  static get toggles() {
    // The full card's options, used by the detailed view the zoom button opens, and the button itself.
    return [...CertificateCardEditor.toggles, ["zoom", true]];
  }

  static get numbers() {
    return { ...THRESHOLDS, max_items: 3 };
  }
}
