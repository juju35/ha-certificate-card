// ---------------------------------------------------------------------------
// Cards
// ---------------------------------------------------------------------------
import { ICONS } from "./core.js";
import { BAR_DAYS, DAY, DOMAIN_BAR_DAYS, esc, fmtDate, fmtLang, fmtLeft, fmtWhen, isOutside, morph, now, sameSig, svgIcon, t, textWidth, watchOutside } from "./helpers.js";
import { SCENE_STYLE, certInfo, certSceneSvg, dnsInfo, findCerts, findDns, findDomains, isNight, opt, problem, sceneKind, sortCerts, summary } from "./entities.js";
import { BASE_STYLE, FULL_STYLE, MINI_STYLE, MOTION_STYLE } from "./styles.js";

export let certUid = 0;

export class CertificateBase extends HTMLElement {
  constructor() {
    super();
    // Keeps the SVG ids of each card apart on a page with several cards.
    this._uid = ++certUid;
    this.attachShadow({ mode: "open" });
    this._html = "";
    this.shadowRoot.addEventListener("click", (ev) => this._onClick(ev));
    this.shadowRoot.addEventListener("pointerdown", () => {
      // No update of the card between the press and the release: the patch keeps the nodes in place, but an element
      // appearing in front of the one pressed (a chip, a row) shifts its siblings, so that the element under the
      // pointer can change and the click land elsewhere or nowhere. The pending render is done once released (after
      // the click).
      this._pressing = true;
      window.addEventListener("pointerup", this._onPressEnd, true);
      window.addEventListener("pointercancel", this._onPressEnd, true);
    });
    this._onPressEnd = () => {
      window.removeEventListener("pointerup", this._onPressEnd, true);
      window.removeEventListener("pointercancel", this._onPressEnd, true);
      // After the click (same task): a press with no click (released elsewhere) draws what it held back.
      setTimeout(() => {
        this._pressing = false;
        if (this._dirty) this._update();
      }, 0);
    };
    // Keyboard access: Enter or Space on a focusable non-button element acts as a click.
    this.shadowRoot.addEventListener("keydown", (ev) => {
      if ((ev.key === "Enter" || ev.key === " ") && ev.target.getAttribute?.("role") === "button") {
        ev.preventDefault();
        ev.target.click();
      }
    });
  }

  set hass(hass) {
    this._hass = hass;
    if (!this._config) return;
    // Render only when a state the card shows has changed, not on every state change of Home Assistant.
    const sig = this._signature();
    if (sameSig(sig, this._sig)) return;
    this._update(sig);
  }

  get hass() {
    return this._hass;
  }

  connectedCallback() {
    // A click elsewhere on the page folds the sections back to their defaults (as in ha-carburants-france).
    this._outside ??= watchOutside(
      (ev) => isOutside(this, ev),
      () => {
        if (!this._folds || !Object.keys(this._folds).length) return;
        this._folds = {};
        this._update();
      },
    );
    this._outside.on();
    // A new width (or the web font loaded): the status pill is fitted again, in the next frame.
    if (typeof ResizeObserver === "function") {
      this._resize ??= new ResizeObserver((entries) => {
        const w = Math.round(entries.at(-1).contentRect.width);
        if (w === this._fitWidth) return;
        this._fitWidth = w;
        cancelAnimationFrame(this._fitFrame);
        this._fitFrame = requestAnimationFrame(() => this._fitPill());
      });
      this._resize.observe(this);
    }
    document.fonts?.ready?.then(() => this._fitPill());
    // Back on the page after leaving it: rendered again in its default state.
    if (this._hass && this._config) this._update();
    // The days left move on with time: checked every minute, rendered only when a value shown changed.
    this._timer ??= setInterval(() => {
      if (this._hass && this._config && !sameSig(this._signature(), this._sig)) this._update();
    }, 60000);
  }

  disconnectedCallback() {
    this._resize?.disconnect();
    this._fitWidth = null;
    this._outside?.off();
    this._pressing = false;
    window.removeEventListener("pointerup", this._onPressEnd, true);
    window.removeEventListener("pointercancel", this._onPressEnd, true);
    // Left (another dashboard view, a conditional card hidden): back to the defaults, so that the card does not come
    // back unfolded.
    this._folds = {};
    clearInterval(this._timer);
    this._timer = undefined;
  }

  setConfig(config) {
    if (!config) throw new Error("Invalid configuration");
    this._config = { ...config };
    this.toggleAttribute?.("hide-title", config.show_title === false);
    this.toggleAttribute?.("hide-subtitle", config.show_subtitle === false);
    this._folds = {};
    this._html = "";
    this._update();
  }

  _t(key, vars) {
    return t(this._hass, this._config, key, vars);
  }

  _loc() {
    return fmtLang(this._hass, this._config);
  }

  // The certificates and the domain names (each sorted by expiry, and together in `all`) and the DNS checks the card
  // shows.
  _model() {
    const at = now();
    const info = (list) => sortCerts(list.map((i) => certInfo(this._hass, this._config, i, at)));
    const certs = info(findCerts(this._hass, this._config));
    const domains = info(findDomains(this._hass, this._config));
    const dns = findDns(this._hass, this._config).map((i) => dnsInfo(this._hass, i));
    return { certs, domains, all: sortCerts([...certs, ...domains]), dns, at };
  }

  // What the render depends on: registries, language, the minute and the states of the listed entities.
  _signature() {
    const h = this._hass;
    // The theme picks the day or night picture of the header.
    const sig = [h.entities, h.devices, h.language, h.locale?.language, Math.floor(now() / 6e4), h.themes?.darkMode];
    for (const i of [...findCerts(h, this._config), ...findDomains(h, this._config), ...findDns(h, this._config)]) sig.push(h.states?.[i.entity]);
    return sig;
  }

  _update(sig) {
    if (!this._hass || !this._config) return;
    // Not under a press (see the pointerdown listener): drawn once released.
    if (this._pressing) {
      this._dirty = true;
      return;
    }
    this._dirty = false;
    this._sig = sig ?? this._signature();
    const html = this._render();
    if (html !== this._html) {
      this._html = html;
      morph(this.shadowRoot, html);
    }
    this._fitPill();
  }

  // The header's status pill goes right after the title, on its row, only while the title stays whole and the
  // pill's whole label fits beside it; otherwise it takes a line of its own under the subtitle (.below), the title
  // whole on its row (cut only when it does not fit alone). There, in the banner, the subtitle keeps one line; if the
  // text still does not fit above the ground strip, the pill keeps its dot alone (.dot-only, its label in its tooltip
  // and for screen readers). Measured after each render and on each new width, whatever the language: no fixed
  // width threshold.
  _fitPill() {
    if (!this.isConnected) return;
    for (const t of this.shadowRoot?.querySelectorAll?.(".titles") || []) {
      const row = t.querySelector(".trow");
      const pills = row ? [...row.children].filter((n) => n.matches(".chip")) : [];
      if (!pills.length || !pills[0].getBoundingClientRect) continue;
      t.classList.remove("below", "dot-only");
      const name = row.querySelector(".name");
      const gap = parseFloat(getComputedStyle(row).columnGap) || 0;
      const title = name && getComputedStyle(name).display !== "none" ? textWidth(name) + gap : 0;
      const need = pills.reduce((w, p) => w + p.getBoundingClientRect().width + gap, title - gap);
      if (need > t.getBoundingClientRect().width - 0.5) {
        t.classList.add("below");
        const banner = t.closest(".banner");
        if (banner) {
          const b = banner.getBoundingClientRect();
          // The top of the ground strip, read once (not once per element).
          const floor = b.bottom - (parseFloat(getComputedStyle(banner).getPropertyValue("--g")) || 10) + 0.5;
          // The title, the subtitle and the pill (their text) as they show: each box cut by its ancestors that hide
          // their overflow (a clamped line); each ancestor's overflow read once.
          const clips = new Map();
          const clipped = (p) => {
            if (!clips.has(p)) clips.set(p, getComputedStyle(p).overflowY !== "visible");
            return clips.get(p);
          };
          const out = [...t.querySelectorAll(".name, .sub, .chip, .chip-label")].some((n) => {
            let { top, bottom } = n.getBoundingClientRect();
            for (let p = n.parentElement; p && p !== t; p = p.parentElement) {
              if (!clipped(p)) continue;
              top = Math.max(top, p.getBoundingClientRect().top);
              bottom = Math.min(bottom, p.getBoundingClientRect().bottom);
            }
            return bottom - top > 0.5 && (top < b.top - 0.5 || bottom > floor);
          });
          if (out) t.classList.add("dot-only");
        }
      }
      // A subtitle cut by its ellipsis keeps its whole text in its tooltip.
      const s = t.querySelector(".sub");
      if (s && (!s.hasAttribute("title") || s.dataset.fit)) {
        const cut = s.scrollWidth > s.clientWidth + 1;
        s.toggleAttribute("data-fit", cut);
        if (cut) s.title = s.textContent.trim();
        else s.removeAttribute("title");
      }
    }
  }

  _onClick(ev) {
    this._pressing = false;
    const el = ev.composedPath().find((n) => n.dataset && (n.dataset.entity || n.dataset.action));
    if (!el) return;
    ev.stopPropagation();
    if (el.dataset.action === "fold") {
      const key = el.dataset.section;
      this._folds = { ...this._folds, [key]: !this._isOpen(key) };
      this._update();
    } else if (el.dataset.entity) {
      this.dispatchEvent(new CustomEvent("hass-more-info", { detail: { entityId: el.dataset.entity }, bubbles: true, composed: true }));
    }
  }

  _isOpen(key) {
    return this._folds?.[key] ?? this._config[`expand_${key}`] === true;
  }

  // "Next expiry in 4 days", from the soonest certificate still valid.
  _subtitle(certs, at) {
    const next = certs.find((c) => c.left !== null && c.left > 0);
    return next ? this._t("next_expiry", { when: fmtWhen(next.expiry - at, this._loc()) }) : "";
  }

  _header(certs, dns, at) {
    const st = summary(certs, dns);
    const label = esc(this._t(st.key));
    const sub = this._subtitle(certs, at);
    // The integration's brand as a badge on the round icon (the ha-* charter): Certificate Expiry, or Whois when only
    // domain names are listed, in its own colour on a white tile.
    const whois = certs.length > 0 && certs.every((c) => c.type === "domain");
    const brand = `<span class="brand ${whois ? "whois" : "cert"}" title="${whois ? "Whois" : "Certificate Expiry"}">${svgIcon(whois ? ICONS.web : ICONS.certificate)}</span>`;
    const logo = `<div class="logo ${st.cls}" aria-hidden="true">${svgIcon(ICONS.certificate)}${brand}</div>`;
    const name = `<div class="name">${esc(this._config.title || this._t("certificates"))}</div>`;
    const chip = `<span class="chip ${st.cls}${st.entity ? " clickable" : ""}"${st.entity ? ` role="button" tabindex="0" data-entity="${esc(st.entity)}"` : ""} title="${label}" aria-label="${label}"><span class="dot"></span><span class="chip-label">${label}</span></span>`;
    // The status pill right after the title, the subtitle under them.
    const lines = `<div class="trow">${name}${chip}</div>${sub ? `<div class="sub">${esc(sub)}</div>` : ""}`;
    if (opt(this._config, "illustration") === false) {
      return `
      <div class="header">
        ${logo}
        <div class="titles">${lines}</div>
        ${this._zoomButton()}
      </div>`;
    }
    // Illustrated header: the picture follows the overall status, the status chip sits right after the title.
    const night = isNight(this._hass, this._config);
    const kind = sceneKind(st.key);
    return `
      <div class="banner st-${st.cls} sc-${kind}${night ? " night" : ""}">
        ${certSceneSvg(kind, this._uid)}<div class="ground"></div>
        <div class="htext">${logo}<div class="titles">${lines}</div></div>
        ${this._zoomButton()}
      </div>`;
  }

  // The illustration's styles, only when it is shown.
  _sceneStyle() {
    return opt(this._config, "illustration") === false ? "" : SCENE_STYLE;
  }

  // Button at the far right of the header: only the mini card has one.
  _zoomButton() {
    return "";
  }

  // Days left of a certificate, as a badge: "12d", "Expired", "Invalid", or its state.
  _badge(c) {
    const text =
      c.kind === "expired" || c.kind === "invalid" ? this._t(c.kind) : c.left !== null ? fmtLeft(c.left, this._loc()) : this._t(`state_${c.kind}`);
    return `<span class="left ${c.cls}">${esc(text)}</span>`;
  }

  _bar(c) {
    const full = (c.type === "domain" ? DOMAIN_BAR_DAYS : BAR_DAYS) * DAY;
    const pct = c.left === null ? 0 : Math.max(0, Math.min(100, (100 * c.left) / full));
    return `<div class="bar ${c.cls}"><div style="width:${pct.toFixed(1)}%"></div></div>`;
  }

  _error(key) {
    return `<style>${BASE_STYLE}${MOTION_STYLE}</style><ha-card><div class="warning">${esc(this._t(key))}</div></ha-card>`;
  }
}

export class CertificateCard extends CertificateBase {
  static getConfigElement() {
    return document.createElement("certificate-card-editor");
  }

  static getStubConfig() {
    return {};
  }

  // Rows of about 50 px: header, counters, certificates, then the DNS title and, when open, its rows.
  getCardSize() {
    if (!this._hass || !this._config) return 3;
    const { certs, domains, dns } = this._model();
    const c = this._config;
    const listed = c.only_problems ? certs.filter(problem).length || 1 : certs.length;
    const doms = c.only_problems ? domains.filter(problem).length : domains.length;
    return 1 + (c.show_counts !== false ? 1 : 0) + listed + (doms ? 1 + doms : 0) + (dns.length ? 1 + (this._isOpen("dns") ? dns.length : 0) : 0);
  }

  getGridOptions() {
    return { columns: 12, min_columns: 6 };
  }

  _render() {
    const { certs, domains, all, dns, at } = this._model();
    if (!all.length && !dns.length) return this._error("no_certs");
    const c = this._config;
    const parts = [];
    if (c.show_counts !== false && all.length) parts.push(this._counts(all));
    if (certs.length) parts.push(this._certList(certs, at));
    if (domains.length) parts.push(this._domainSection(domains, at));
    if (dns.length) parts.push(this._dnsSection(dns));
    return `<style>${BASE_STYLE}${FULL_STYLE}${this._sceneStyle()}${MOTION_STYLE}</style>
      <ha-card>
        ${this._header(all, dns, at)}
        <div class="content">${parts.join("")}</div>
      </ha-card>`;
  }

  _counts(certs) {
    const valid = certs.filter((x) => x.kind === "valid").length;
    const soon = certs.filter((x) => x.kind === "expiring");
    const gone = certs.filter((x) => x.kind === "expired" || x.kind === "invalid").length;
    const soonCls = soon.some((x) => x.cls === "crit") ? "crit" : "warn";
    const tile = (cls, icon, v, key) =>
      `<div class="count-tile ${v ? cls : "zero"}" aria-label="${esc(this._t(key))} ${v}"><div class="top">${svgIcon(icon)}<span class="v">${v}</span></div><div class="k">${esc(this._t(key))}</div></div>`;
    return `<div class="counts">${tile("ok", ICONS.lock, valid, "valid")}${tile(soonCls, ICONS.sand, soon.length, "expiring")}${tile("crit", ICONS.lockAlert, gone, "expired")}</div>`;
  }

  // One certificate or domain name row: its expiry (or error), a bar and the days left. A domain name adds its
  // registrar.
  _expiryRow(x, at) {
    const c = this._config;
    const loc = this._loc();
    let detail = "";
    let err = false;
    if (x.kind === "invalid" && x.error) {
      detail = x.error;
      err = true;
    } else if (x.expiry !== null && c.show_date !== false) {
      detail = this._t(x.left > 0 ? "expires_on" : "expired_on", { date: fmtDate(x.expiry, loc, this._hass.config?.time_zone) });
    } else if (x.expiry !== null) {
      detail = fmtWhen(x.expiry - at, loc);
    } else {
      detail = this._t(`state_${x.kind}`);
    }
    if (x.registrar) detail += ` · ${x.registrar}`;
    const domain = x.type === "domain";
    const icon = domain ? ICONS.web : x.cls === "crit" ? ICONS.lockAlert : x.cls === "warn" ? ICONS.sand : ICONS.lock;
    return `<div class="item ${domain ? "domain" : "cert"} clickable ${x.cls}" role="button" tabindex="0" data-key="${esc(x.entity)}" data-entity="${esc(x.entity)}" aria-label="${esc(`${x.name}: ${detail}`)}">
        <div class="ico">${svgIcon(icon)}</div>
        <div class="main"><div class="title">${esc(x.name)}</div><div class="detail${err ? " err" : ""}">${esc(detail)}</div>${this._bar(x)}</div>
        ${this._badge(x)}
      </div>`;
  }

  _certList(certs, at) {
    const shown = this._config.only_problems ? certs.filter(problem) : certs;
    const rows = shown.map((x) => this._expiryRow(x, at));
    return `<div class="list certs">${rows.length ? rows.join("") : `<div class="empty">✓ ${esc(this._t("all_ok"))}</div>`}</div>`;
  }

  // The domain names (Whois), under their own title; with only_problems, only those expiring soon or expired, and no
  // section when there is none.
  _domainSection(domains, at) {
    const shown = this._config.only_problems ? domains.filter(problem) : domains;
    if (!shown.length) return "";
    const ok = domains.filter((d) => d.cls === "ok").length;
    return `<div>
      <div class="section-title">${svgIcon(ICONS.web)}${esc(this._t("domains"))}<span class="count">${ok}/${domains.length}</span></div>
      <div class="list domains">${shown.map((x) => this._expiryRow(x, at)).join("")}</div>
    </div>`;
  }

  _dnsSection(dns) {
    const open = this._isOpen("dns");
    const ok = dns.filter((d) => d.cls === "ok").length;
    const rows = dns.map((d) => {
      const icon = d.cls === "ok" ? ICONS.check : d.cls === "crit" ? ICONS.alert : ICONS.dns;
      const text = this._t(d.kind);
      return `<div class="item dns clickable ${d.cls}" role="button" tabindex="0" data-key="${esc(d.entity)}" data-entity="${esc(d.entity)}" aria-label="${esc(`${d.name}: ${d.value ?? text}`)}">
        <div class="ico">${svgIcon(icon)}</div>
        <div class="main"><div class="title">${esc(d.name)}</div><div class="detail">${esc(text)}</div></div>
        ${d.value ? `<span class="value">${esc(d.value)}</span>` : ""}
      </div>`;
    });
    return `<div>
      <div class="section-title fold ${open ? "" : "closed"}" role="button" tabindex="0" aria-expanded="${open}" data-action="fold" data-section="dns">${svgIcon(ICONS.dns)}${esc(
        this._t("dns")
      )}<span class="count">${ok}/${dns.length}</span>${svgIcon(ICONS.chevron, "chevron")}</div>
      ${open ? `<div class="list">${rows.join("")}</div>` : ""}
    </div>`;
  }
}

// The mini card extends the full card: its detail button (top right, `zoom: false` removes it) switches it to the
// full card's content, same configuration, and back; a click anywhere outside the card brings it back too.
export class CertificateMiniCard extends CertificateCard {
  static getConfigElement() {
    return document.createElement("certificate-mini-card-editor");
  }

  static getStubConfig() {
    return {};
  }

  constructor() {
    super();
    this._zoomed = false;
    this.shadowRoot.addEventListener("click", (ev) => this._zoomClick(ev));
    this._unzoom = watchOutside(
      (ev) => isOutside(this, ev),
      () => {
        if (this._zoomed) this._setZoom(false);
      },
    );
  }

  connectedCallback() {
    super.connectedCallback();
    this._unzoom.on();
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    this._unzoom.off();
    // Back to the compact view once off the screen (see the full card).
    this._zoomed = false;
  }

  // A config change (the editor, say) starts over from the compact view.
  setConfig(config) {
    this._zoomed = false;
    this.setAttribute("mini", "");
    super.setConfig(config);
  }

  getCardSize() {
    return this._zoomed ? super.getCardSize() : 2 + Math.min(this._max(), 5);
  }

  getGridOptions() {
    return { ...(this._zoomed ? super.getGridOptions() : { columns: 6, min_columns: 6 }), rows: "auto" };
  }

  _max() {
    const n = Number(this._config?.max_items);
    return Number.isFinite(n) && n > 0 ? Math.floor(n) : 3;
  }

  _setZoom(zoomed) {
    this._zoomed = zoomed;
    this._update();
  }

  _zoomClick(ev) {
    if (!ev.target?.closest?.(".zoom")) return;
    ev.stopPropagation();
    this._setZoom(!this._zoomed);
    // Keyboard use (Enter / Space: no click count) keeps the focus on the button, without scrolling the view.
    if (ev.detail === 0) this.shadowRoot.querySelector(".zoom")?.focus({ preventScroll: true });
  }

  _zoomButton() {
    if (this._config.zoom === false) return "";
    const z = this._zoomed;
    return `<button type="button" class="zoom" title="${esc(this._t(z ? "zoom_out" : "zoom_in"))}" aria-label="${esc(this._t(z ? "zoom_out" : "zoom_in"))}">${svgIcon(
      z ? ICONS.collapse : ICONS.expand
    )}</button>`;
  }

  _render() {
    if (this._zoomed) return super._render();
    const { certs, domains, all, dns, at } = this._model();
    if (!all.length && !dns.length) return this._error("no_certs");
    // Certificates and domain names together, the soonest to expire first; a domain name has a globe instead of a dot.
    const rows = all.slice(0, this._max()).map(
      (x) => `<div class="row clickable ${x.cls}" role="button" tabindex="0" data-key="${esc(x.entity)}" data-entity="${esc(x.entity)}" aria-label="${esc(x.name)}">
        <span class="lbl">${x.type === "domain" ? svgIcon(ICONS.web, "web") : '<span class="dot"></span>'}<span>${esc(x.name)}</span></span>${this._bar(x)}${this._badge(x)}
      </div>`
    );
    const foot = [];
    if (certs.length) foot.push(`<span title="${esc(this._t("certificates"))}">${svgIcon(ICONS.lock)}${certs.length}</span>`);
    if (domains.length) foot.push(`<span title="${esc(this._t("domains"))}">${svgIcon(ICONS.web)}${domains.length}</span>`);
    const bad = all.filter(problem).length;
    if (bad) foot.push(`<span class="${all.some((x) => x.cls === "crit") ? "crit" : "warn"}" title="${esc(this._t("expiring"))}">${svgIcon(ICONS.alert)}${bad}</span>`);
    if (dns.length) {
      const ok = dns.filter((d) => d.cls === "ok").length;
      const bad = dns.find((d) => d.cls === "crit");
      foot.push(
        `<span class="clickable ${bad ? "crit" : ""}" role="button" tabindex="0" data-key="dns" data-entity="${esc((bad ?? dns[0]).entity)}" title="${esc(this._t("dns"))}">${svgIcon(ICONS.dns)}${ok}/${dns.length}</span>`
      );
    }
    const more = all.length - rows.length;
    if (more > 0) foot.push(`<span class="more">${esc(this._t("more", { n: more }))}</span>`);
    return `<style>${BASE_STYLE}${MINI_STYLE}${this._sceneStyle()}${MOTION_STYLE}</style>
      <ha-card>
        ${this._header(all, dns, at)}
        <div class="content">
          ${rows.join("")}
          ${foot.length ? `<div class="foot">${foot.join("")}</div>` : ""}
        </div>
      </ha-card>`;
  }
}
