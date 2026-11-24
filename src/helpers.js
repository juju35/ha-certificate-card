// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
import { STRINGS } from "./i18n/strings.js";

// The width of an element's whole text in fractional pixels, even while an ellipsis cuts it.
export const textWidth = (el) => {
  const range = document.createRange();
  range.selectNodeContents(el);
  return range.getBoundingClientRect().width || el.scrollWidth;
};

export const esc = (v) =>
  String(v ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);

export const lang = (hass, config) => {
  const l = config?.language || (hass && (hass.locale?.language || hass.language)) || "en";
  return STRINGS[l] ? l : STRINGS[l.split("-")[0]] ? l.split("-")[0] : "en";
};

export const t = (hass, config, key, vars = {}) =>
  String(STRINGS[lang(hass, config)][key] ?? STRINGS.en[key] ?? key).replace(/\{(\w+)\}/g, (_, k) => vars[k] ?? "");

// Locale of the dates and numbers: Home Assistant's own language when its base matches the card's language
// (keeps the region, e.g. de-CH or fr-CA), otherwise the card's language. Home Assistant's "pt" is European
// Portuguese, which Intl would format as Brazilian, so bare "pt" becomes "pt-PT".
export const fmtLang = (hass, config) => {
  const l = lang(hass, config);
  const ha = hass && (hass.locale?.language || hass.language);
  const loc = ha && ha.split("-")[0] === l ? ha : l;
  return loc === "pt" ? "pt-PT" : loc;
};

// The time the card counts from. The screenshot harness pins it (window.__CERT_CARD_NOW__) so the captures do not
// change every day.
export const now = () => globalThis.__CERT_CARD_NOW__ ?? Date.now();

export const DAY = 864e5;
export const HOUR = 36e5;
// Days left drawn as a full bar: a Let's Encrypt certificate lives 90 days, a domain name is renewed every year.
export const BAR_DAYS = 90;
export const DOMAIN_BAR_DAYS = 365;
export const THRESHOLDS = { warning_days: 30, critical_days: 7 };
export const OFF = new Set(["unavailable", "unknown"]);

export const thresholds = (config) => {
  const n = (v, d) => (Number.isFinite(Number(v)) && v !== "" && v !== null ? Number(v) : d);
  const warn = n(config?.warning_days, THRESHOLDS.warning_days);
  const crit = n(config?.critical_days, THRESHOLDS.critical_days);
  return [Math.max(warn, crit), crit];
};

// Compact days left, in the card's language: "12d", "12 j", "5h".
export const fmtLeft = (ms, loc) => {
  const unit = ms >= DAY ? "day" : "hour";
  const v = Math.max(0, Math.floor(ms / (unit === "day" ? DAY : HOUR)));
  try {
    return new Intl.NumberFormat(loc, { style: "unit", unit, unitDisplay: "narrow" }).format(v);
  } catch (_err) {
    return `${v}${unit === "day" ? "d" : "h"}`;
  }
};

// "in 12 days", "tomorrow", "2 days ago": the language's own phrasing, under a day in hours.
export const fmtWhen = (ms, loc) => {
  const abs = Math.abs(ms);
  const [unit, size] = abs >= DAY ? ["day", DAY] : abs >= HOUR ? ["hour", HOUR] : ["minute", 6e4];
  const v = Math.trunc(ms / size);
  try {
    return new Intl.RelativeTimeFormat(loc, { numeric: "auto" }).format(v, unit);
  } catch (_err) {
    return String(v);
  }
};

export const fmtDate = (ms, loc, timeZone) => {
  try {
    return new Intl.DateTimeFormat(loc, { dateStyle: "medium", ...(timeZone ? { timeZone } : {}) }).format(new Date(ms));
  } catch (_err) {
    return new Date(ms).toISOString().slice(0, 10);
  }
};

// Same values, compared by identity: used to skip a render when nothing the card shows has changed.
export const sameSig = (a, b) => !!a && !!b && a.length === b.length && a.every((v, i) => v === b[i]);

// Patch the shadow DOM in place from the new HTML: nodes whose tag is unchanged are kept, so keyboard focus, hover
// and CSS transitions survive an update, and only the changed text and attributes are written. Rows carry a data-key
// (their entity id) and are matched by it, wherever they moved; nodes without a data-key are matched by position.
export const patchAttrs = (cur, next) => {
  for (const { name } of [...cur.attributes]) if (!next.hasAttribute(name)) cur.removeAttribute(name);
  for (const { name, value } of next.attributes) if (cur.getAttribute(name) !== value) cur.setAttribute(name, value);
};
export const keyOf = (n) => (n.nodeType === 1 ? n.getAttribute("data-key") : null);
export const sameNode = (a, b) => !!a && a.nodeType === b.nodeType && a.nodeName === b.nodeName;
export const place = (parent, node, ref) => {
  if (node === ref) return;
  try {
    if (parent.moveBefore && node.parentNode === parent) return parent.moveBefore(node, ref);
  } catch (_e) {
    /* fall back to insertBefore */
  }
  parent.insertBefore(node, ref);
};
export const patchChildren = (cur, next) => {
  const old = [...cur.childNodes];
  const fresh = [...next.childNodes];
  const byKey = new Map();
  for (const o of old) {
    const k = keyOf(o);
    if (k !== null && !byKey.has(k)) byKey.set(k, o);
  }
  const used = new Set();
  fresh.forEach((n, i) => {
    const k = keyOf(n);
    let o = k !== null ? byKey.get(k) : old[i];
    if (!sameNode(o, n) || used.has(o) || (k === null && keyOf(o) !== null)) o = null;
    const ref = cur.childNodes[i] ?? null;
    if (!o) {
      cur.insertBefore(n, ref);
      return;
    }
    used.add(o);
    place(cur, o, ref);
    if (n.nodeType === 1) {
      patchAttrs(o, n);
      patchChildren(o, n);
    } else if (o.nodeValue !== n.nodeValue) o.nodeValue = n.nodeValue;
  });
  while (cur.childNodes.length > fresh.length) cur.removeChild(cur.lastChild);
};
export const morph = (root, html) => {
  const tpl = document.createElement("template");
  tpl.innerHTML = html;
  patchChildren(root, tpl.content);
};

export const svgIcon = (path, cls = "") => `<svg class="icon ${cls}" viewBox="0 0 24 24"><path d="${path}"/></svg>`;

// A click inside a dialog (more-info opened from the card, say) is not a click outside the card.
export const inDialog = (ev) => ev.composedPath().some((n) => ["ha-more-info-dialog", "ha-dialog", "dialog"].includes(n.localName));
export const isOutside = (card, ev) => !ev.composedPath().includes(card) && !inDialog(ev);

// "A click elsewhere" is caught on the pointer, not only on the click event: on iOS (Safari and the companion app)
// a tap on something that is not clickable (the background, an empty spot, a card with no action) sends no click to
// the page. It counts when the press and the release are both outside the card (a slider dragged out of the card
// does not fold it), and a scroll does not count (the browser cancels the pointer). Keyboard clicks still go through
// the click event. `tap(ev)` (press and release at the same spot) is for the tests.
export const watchOutside = (isOut, handler) => {
  let downOutside = false;
  const onDown = (ev) => {
    downOutside = isOut(ev);
  };
  const onUp = (ev) => {
    if (downOutside && isOut(ev)) handler(ev);
    downOutside = false;
  };
  const onClick = (ev) => {
    if (ev.detail === 0 && isOut(ev)) handler(ev);
  };
  return {
    on() {
      document.addEventListener("pointerdown", onDown, true);
      document.addEventListener("pointerup", onUp, true);
      document.addEventListener("click", onClick, true);
    },
    tap(ev) {
      onDown(ev);
      onUp(ev);
    },
    off() {
      document.removeEventListener("pointerdown", onDown, true);
      document.removeEventListener("pointerup", onUp, true);
      document.removeEventListener("click", onClick, true);
    },
  };
};
