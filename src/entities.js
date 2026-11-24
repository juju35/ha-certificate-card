// ---------------------------------------------------------------------------
// Entities
// ---------------------------------------------------------------------------
import { DAY, OFF, now, thresholds } from "./helpers.js";

// `entities` / `dns_entities` items: an entity id, or { entity, name }.
export const items = (list) =>
  (Array.isArray(list) ? list : [])
    .map((i) => (typeof i === "string" ? { entity: i } : i && typeof i.entity === "string" ? { entity: i.entity, name: i.name } : null))
    .filter(Boolean);

// Entities of an integration, from the entity registry (whatever their ids and the language), in the given domain.
// The registry scan is kept per registry object (Home Assistant replaces it only when the registry changes): the card
// looks its entities up on every state change, which should not walk thousands of entries each time.
export const platformCache = new WeakMap();
export const byPlatform = (hass, platform, domain) => {
  const reg = hass?.entities;
  if (!reg) return [];
  let cache = platformCache.get(reg);
  if (!cache) platformCache.set(reg, (cache = new Map()));
  const key = `${platform}|${domain}`;
  let ids = cache.get(key);
  if (!ids) {
    ids = Object.values(reg)
      .filter((e) => e.platform === platform && e.entity_id.startsWith(`${domain}.`) && !e.hidden)
      .map((e) => e.entity_id)
      .sort();
    cache.set(key, ids);
  }
  return ids.filter((id) => hass.states?.[id]);
};

// The certificates the card lists: `entities` when set, else every Certificate Expiry sensor (from the registry,
// else by its entity id when the registry is not there), minus `exclude`.
export const findCerts = (hass, config = {}) => {
  const exclude = new Set(Array.isArray(config.exclude) ? config.exclude : []);
  let list = items(config.entities);
  if (!list.length) {
    let ids = byPlatform(hass, "cert_expiry", "sensor");
    if (!ids.length && !hass?.entities)
      ids = Object.keys(hass?.states || {})
        .filter((id) => /^sensor\..*cert_expiry/.test(id))
        .sort();
    list = ids.map((entity) => ({ entity }));
  }
  return list.filter((i) => !exclude.has(i.entity));
};

// The domain names: `domain_entities` when set, else every Whois "days until expiration" sensor (enabled by default,
// it carries the expiry date and the registrar as attributes), minus `exclude`. The registry gives its translation key;
// without it, the Whois sensor holding a number of days is the one.
export const isWhoisExpiry = (hass, id) => {
  const tk = hass.entities?.[id]?.translation_key;
  return tk ? tk === "days_until_expiration" : hass.states?.[id]?.attributes?.unit_of_measurement === "d";
};
export const findDomains = (hass, config = {}) => {
  if (config.show_domains === false) return [];
  const exclude = new Set(Array.isArray(config.exclude) ? config.exclude : []);
  let list = items(config.domain_entities);
  if (!list.length)
    list = byPlatform(hass, "whois", "sensor")
      .filter((id) => isWhoisExpiry(hass, id))
      .map((entity) => ({ entity }));
  return list.filter((i) => !exclude.has(i.entity)).map((i) => ({ ...i, type: "domain" }));
};

// The DNS checks: `dns_entities` when set, else every DNS IP sensor.
export const findDns = (hass, config = {}) => {
  if (config.show_dns === false) return [];
  const list = items(config.dns_entities);
  return list.length ? list : byPlatform(hass, "dnsip", "sensor").map((entity) => ({ entity }));
};

export const SUFFIX = /\s*[-–·:]?\s*(cert(ificate)?\s*expiry(\s*timestamp)?|certificate expiration|expiration du certificat)\s*$/i;

// Name of a row: `name` of the item, else the device name (a Certificate Expiry device is named after the host, a DNS
// IP device after the host name), else the friendly name without its "Cert expiry" suffix.
export const nameOf = (hass, item) => {
  if (item.name) return item.name;
  const reg = hass?.entities?.[item.entity];
  const dev = reg?.device_id ? hass.devices?.[reg.device_id] : null;
  const devName = dev?.name_by_user || dev?.name;
  if (devName) return devName;
  const fn = hass?.states?.[item.entity]?.attributes?.friendly_name;
  return fn?.replace(SUFFIX, "").trim() || fn || item.entity;
};

// A date attribute ("2027-06-12T10:00:00", no time zone with Whois: UTC), as ms, or NaN.
export const parseDate = (v) => (typeof v === "string" && v ? Date.parse(/[zZ]|[+-]\d\d:?\d\d$/.test(v) || !v.includes("T") ? v : `${v}Z`) : Number.NaN);

// One certificate or domain name: { entity, name, type, cls (ok, warn, crit, idle), kind, expiry (ms), left (ms), error,
// registrar }. A timestamp sensor gives the expiry date; a numeric sensor (Whois, an older "days left" sensor) the days
// left, or the exact date when it carries it (`expires`).
export const certInfo = (hass, config, item, at = now()) => {
  const s = hass?.states?.[item.entity];
  const base = { entity: item.entity, name: nameOf(hass, item), type: item.type || "cert", expiry: null, left: null, error: null, registrar: null };
  if (!s || OFF.has(s.state)) return { ...base, cls: "idle", kind: s?.state === "unknown" ? "unknown" : "unavailable" };
  const a = s.attributes || {};
  let expiry = Date.parse(s.state);
  if (!Number.isFinite(expiry) || /^-?\d+(\.\d+)?$/.test(s.state)) {
    const days = Number.parseFloat(s.state);
    if (!Number.isFinite(days)) return { ...base, cls: "idle", kind: "unknown" };
    const exact = parseDate(a.expires);
    expiry = Number.isFinite(exact) ? exact : at + days * DAY;
  }
  const left = expiry - at;
  const [warn, crit] = thresholds(config);
  const info = { ...base, expiry, left, registrar: typeof a.registrar === "string" && a.registrar ? a.registrar : null };
  if (a.is_valid === false) return { ...info, cls: "crit", kind: "invalid", error: a.error || null };
  if (left <= 0) return { ...info, cls: "crit", kind: "expired" };
  if (left < crit * DAY) return { ...info, cls: "crit", kind: "expiring" };
  if (left < warn * DAY) return { ...info, cls: "warn", kind: "expiring" };
  return { ...info, cls: "ok", kind: "valid" };
};

// Soonest expiry first; certificates with no date (unavailable, unknown) last, by name.
export const sortCerts = (certs) =>
  [...certs].sort((a, b) => (a.expiry ?? Number.POSITIVE_INFINITY) - (b.expiry ?? Number.POSITIVE_INFINITY) || a.name.localeCompare(b.name));

// One DNS check: a sensor (DNS IP) holds the resolved address, empty (unknown) when the name does not resolve; a
// binary sensor (Ping, connectivity) is on when the host answers.
export const dnsInfo = (hass, item) => {
  const s = hass?.states?.[item.entity];
  const base = { entity: item.entity, name: nameOf(hass, item), value: null };
  if (!s || s.state === "unavailable") return { ...base, cls: "idle", kind: "state_unavailable" };
  if (item.entity.startsWith("binary_sensor.")) {
    if (s.state === "on") return { ...base, cls: "ok", kind: "reachable" };
    if (s.state === "off") return { ...base, cls: "crit", kind: "unreachable" };
    return { ...base, cls: "idle", kind: "state_unknown" };
  }
  if (s.state === "unknown" || s.state === "") return { ...base, cls: "crit", kind: "not_resolved" };
  return { ...base, cls: "ok", kind: "resolved", value: s.state };
};

// Overall status: the chip of the header and the tint of its icon, with the row it opens.
export const summary = (certs, dns) => {
  const first = (pred) => certs.find(pred);
  const pick = (cert, cls, key) => ({ cls, key, entity: cert?.entity });
  const expired = first((c) => c.kind === "expired");
  if (expired) return pick(expired, "crit", "expired");
  const invalid = first((c) => c.kind === "invalid");
  if (invalid) return pick(invalid, "crit", "invalid");
  const soon = first((c) => c.kind === "expiring");
  if (soon) return pick(soon, soon.cls, "expiring");
  const dnsBad = dns.find((d) => d.cls === "crit");
  if (dnsBad) return { cls: "warn", key: "dns_issue", entity: dnsBad.entity };
  const valid = first((c) => c.kind === "valid");
  if (valid) return pick(valid, "ok", "all_valid");
  // DNS checks only: all answering.
  if (!certs.length && dns.length && dns.every((d) => d.cls === "ok")) return { cls: "ok", key: "all_ok", entity: dns[0].entity };
  const allUnknown = certs.length > 0 && certs.every((c) => c.kind === "unknown");
  return { cls: "idle", key: allUnknown ? "state_unknown" : "state_unavailable", entity: (certs[0] || dns[0])?.entity };
};

export const problem = (c) => c.cls === "crit" || c.cls === "warn";

// ---------------------------------------------------------------------------
// Illustrated header: a certificate framed on the wall and a padlock on the desk, at the right of a 90 px banner
// (a 200 × 80 picture above a 10 px desk strip, edge to edge). The left of the banner is plain wall: the icon, the
// title and the status sit there. The picture follows the overall status (the padlock and the icon take its colour:
// green, amber, red or grey):
// - valid: gold seal, sparkles;
// - expiring (expiring soon, DNS issue): an hourglass on the desk, its sand running;
// - expired (expired, invalid): the padlock open, the certificate askew with a red stamp on it;
// - idle (unknown, unavailable): grey padlock and seal, nothing moves.
// ---------------------------------------------------------------------------

export const DEFAULTS = { illustration: true, illustration_theme: "auto" };
export const opt = (config, key) => config?.[key] ?? DEFAULTS[key];

// Night picture: forced by illustration_theme, else Home Assistant's dark mode alone (a light theme keeps the day
// picture after sunset).
export const isNight = (hass, config) => {
  const theme = opt(config, "illustration_theme");
  if (theme === "night") return true;
  if (theme === "day") return false;
  return !!hass?.themes?.darkMode;
};

// A four-pointed sparkle centred on (x, y).
export const sparkle = (x, y, r, cls) =>
  `<path class="cc-spark ${cls}" d="M${x} ${y - r}L${x + r * 0.28} ${y - r * 0.28}L${x + r} ${y}L${x + r * 0.28} ${y + r * 0.28}L${x} ${y + r}L${x - r * 0.28} ${y + r * 0.28}L${x - r} ${y}L${x - r * 0.28} ${y - r * 0.28}Z"/>`;

// The hourglass standing on the desk (expiring soon): sand running from the top bulb to the bottom one.
export const hourglass = (uid) => `<g class="cc-hourglass" transform="translate(183 80) scale(1.3)">
    <clipPath id="cc-top-${uid}"><path d="M-5 -21H5L0.6 -12.2H-0.6Z"/></clipPath>
    <clipPath id="cc-bot-${uid}"><path d="M-0.6 -11.8H0.6L5 -3H-5Z"/></clipPath>
    <path class="cc-glass" d="M-5.4 -21.6H5.4L0.8 -12L5.4 -2.4H-5.4L-0.8 -12Z"/>
    <g clip-path="url(#cc-top-${uid})"><rect class="cc-sand cc-sand-top" x="-6" y="-21" width="12" height="9"/></g>
    <g clip-path="url(#cc-bot-${uid})"><rect class="cc-sand cc-sand-bot" x="-6" y="-12" width="12" height="9"/></g>
    <path class="cc-stream" d="M0 -12.4V-3.4"/>
    <rect class="cc-wood" x="-7" y="-24" width="14" height="2.4" rx=".8"/><rect class="cc-wood" x="-7" y="-2.4" width="14" height="2.4" rx=".8"/>
    <path class="cc-post" d="M-6 -21.6V-2.4M6 -21.6V-2.4"/>
  </g>`;

// The picture shown for a status key of summary().
export const sceneKind = (key) =>
  ({ all_valid: "valid", all_ok: "valid", expiring: "expiring", dns_issue: "expiring", expired: "expired", invalid: "expired" })[key] ?? "idle";

// The whole picture; `uid` keeps each card's clip paths apart on a page with several cards.
export const certSceneSvg = (kind, uid) => {
  const crit = kind === "expired";
  // Open padlock: the shackle lifted and swung out on its right leg.
  const shackle = crit
    ? `<g class="cc-open"><path class="cc-shackle" d="M-7 -18V-25a7 7 0 0 1 14 0V-18" transform="translate(0 -6) rotate(-28 7 -18)"/></g>`
    : `<path class="cc-shackle" d="M-7 -18V-25a7 7 0 0 1 14 0V-18"/>`;
  const stamp = crit
    ? `<g class="cc-stamp" transform="translate(24 21) rotate(-14)"><circle r="9"/><path d="M-4 -4L4 4M4 -4L-4 4"/></g>`
    : "";
  return `<svg class="cc-scene" viewBox="0 0 200 80" preserveAspectRatio="xMaxYMax meet" aria-hidden="true" focusable="false">
    <path class="cc-wire" d="M138 3L113 12M138 3L163 12"/><circle class="cc-nail" cx="138" cy="3" r="1.4"/>
    <g class="cc-frame"><g transform="translate(110 10)">
      <rect class="cc-wood" width="56" height="40" rx="1.5"/><rect class="cc-paper" x="3" y="3" width="50" height="34"/>
      <path class="cc-head" d="M16 10H40"/><path class="cc-lines" d="M12 17H44M12 23H38M12 29H30"/>
      <g transform="translate(42 30)"><path class="cc-ribbon" d="M-3 2l-2 8 5-3 5 3-2-8"/><circle class="cc-seal" r="6"/><circle class="cc-seal-ring" r="3.6"/></g>
      ${stamp}
    </g></g>
    <g class="cc-lock" transform="translate(70 80)">
      ${shackle}
      <rect class="cc-body" x="-12" y="-18" width="24" height="18" rx="3"/><rect class="cc-shine" x="-9.5" y="-16" width="3" height="13" rx="1.5"/>
      <circle class="cc-hole" cy="-10.5" r="2.4"/><rect class="cc-hole" x="-1" y="-10" width="2" height="5" rx="1"/>
    </g>
    ${kind === "valid" ? `${sparkle(180, 30, 6, "s1")}${sparkle(193, 16, 3.4, "s2")}${sparkle(100, 16, 3, "s3")}` : ""}
    ${kind === "expiring" ? hourglass(uid) : ""}
  </svg>`;
};

// The banner: wall colour, desk strip, the picture's colours and animations, day and night.
export const SCENE_STYLE = `
  .banner { position: relative; overflow: hidden; height: 90px; --g: 10px; color: #10283f; background: #eef1f6;
            --lock: #43a047; --seal: #f5b400; }
  .banner.night { color: #fff; background: #262c3a; }
  .banner.st-warn { --lock: #f5a623; } .banner.st-crit { --lock: #e5484d; } .banner.st-idle { --lock: #9aa3ae; --seal: #b7bec7; }
  .banner.sc-expired { --seal: #b7bec7; }
  .night.st-idle { --lock: #6f7887; --seal: #6f7887; } .night.sc-expired { --seal: #6f7887; }
  /* The desk: a 10 px strip under the whole banner, edge to edge. */
  .ground { position: absolute; left: 0; right: 0; bottom: 0; height: var(--g); background: #b98a5c; box-shadow: inset 0 2px 0 #d4a878; }
  .night .ground { background: #4a3a2c; box-shadow: inset 0 2px 0 #5c4836; }
  .cc-scene { position: absolute; right: 0; bottom: var(--g); height: calc(100% - var(--g)); width: min(200px, 56%); overflow: visible; }
  .cc-wood { fill: #b0855a; } .night .cc-wood { fill: #8a6646; }
  .cc-paper { fill: #fffdf5; } .night .cc-paper { fill: #3a4050; }
  .cc-head { stroke: #8e97a3; stroke-width: 2; stroke-linecap: round; } .night .cc-head { stroke: #7d879a; }
  .cc-lines { stroke: #c9ced6; stroke-width: 1.6; stroke-linecap: round; fill: none; } .night .cc-lines { stroke: #5c6578; }
  .cc-wire { stroke: #8e97a3; stroke-width: .6; fill: none; } .night .cc-wire { stroke: #5c6578; }
  .cc-nail { fill: #6b7380; } .night .cc-nail { fill: #8e97a3; }
  .cc-ribbon { fill: #e5484d; } .sc-expired .cc-ribbon, .sc-idle .cc-ribbon { fill: #9aa3ae; }
  .night.sc-expired .cc-ribbon, .night.sc-idle .cc-ribbon { fill: #5c6578; }
  .cc-seal { fill: var(--seal); } .cc-seal-ring { fill: none; stroke: #fff; stroke-width: .8; }
  .cc-body { fill: var(--lock); } .cc-shackle { fill: none; stroke: var(--lock); stroke-width: 3; }
  .cc-shine { fill: #fff; opacity: .22; } .cc-hole { fill: #fff; } .night .cc-hole { fill: #f1f3f6; }
  .cc-spark { fill: #f5b400; transform-box: fill-box; transform-origin: center; animation: cc-twinkle 2.4s ease-in-out infinite; }
  .cc-spark.s2 { animation-delay: -.8s; } .cc-spark.s3 { animation-delay: -1.6s; }
  .night .cc-spark { fill: #ffd54f; }
  /* Expiring soon: the hourglass's sand runs down, again and again. */
  .cc-glass { fill: rgba(255,255,255,.55); stroke: #8e97a3; stroke-width: .6; } .night .cc-glass { fill: rgba(255,255,255,.08); stroke: #7d879a; }
  .cc-post { stroke: #8a6646; stroke-width: 1; } .cc-sand { fill: #f5a623; }
  .cc-sand-top { transform-box: fill-box; transform-origin: 50% 100%; animation: cc-empty 4s linear infinite; }
  .cc-sand-bot { transform-box: fill-box; transform-origin: 50% 100%; animation: cc-fill 4s linear infinite; }
  .cc-stream { stroke: #f5a623; stroke-width: .8; stroke-dasharray: 1.4 1.2; animation: cc-run .5s linear infinite; }
  /* Expired: the certificate hangs askew, its red stamp pulsing; the open shackle wobbles. */
  .cc-frame { transform-box: view-box; transform-origin: 138px 3px; }
  .sc-expired .cc-frame { transform: rotate(6deg); }
  .cc-stamp circle { fill: rgba(229,72,77,.12); stroke: #e5484d; stroke-width: 1.6; }
  .cc-stamp path { stroke: #e5484d; stroke-width: 2; stroke-linecap: round; }
  .cc-stamp { animation: cc-pulse 2.4s ease-in-out infinite; }
  .cc-open { transform-box: view-box; transform-origin: 77px 62px; animation: cc-wobble 3s ease-in-out infinite; }
  @keyframes cc-twinkle { 0%, 100% { transform: scale(.55); opacity: .45; } 50% { transform: scale(1); opacity: 1; } }
  @keyframes cc-empty { from { transform: scaleY(1); } to { transform: scaleY(.08); } }
  @keyframes cc-fill { from { transform: scaleY(.08); } to { transform: scaleY(1); } }
  @keyframes cc-run { to { stroke-dashoffset: -2.6; } }
  @keyframes cc-pulse { 0%, 100% { opacity: 1; } 50% { opacity: .45; } }
  @keyframes cc-wobble { 0%, 70%, 100% { transform: rotate(0); } 80% { transform: rotate(-6deg); } 90% { transform: rotate(3deg); } }
  /* The text on the wall, left of the picture: the round icon (status colour), the title, the next expiry, the status. */
  .htext { position: absolute; z-index: 1; left: 12px; top: 6px; bottom: calc(var(--g) + 4px); right: calc(min(200px, 56%) + 4px);
           display: flex; align-items: center; gap: 10px; min-width: 0; }
  .htext .titles { flex: 1 1 auto; display: flex; flex-direction: column; align-items: flex-start; gap: 1px; min-width: 0; }
  .htext .titles > * { max-width: 100%; }
  .banner .logo { position: relative; background: rgba(255,255,255,.62); box-shadow: inset 0 0 0 1px color-mix(in srgb, var(--c) 22%, transparent); }
  .banner.night .logo { background: rgba(255,255,255,.12); box-shadow: inset 0 0 0 1px rgba(255,255,255,.14); }
  .banner.night .logo.idle { color: #9aa3ae; }
  .htext .name { font-size: 16px; font-weight: 500; }
  .htext .sub { color: #3d5670; }
  .night .htext .sub { color: rgba(255,255,255,.78); }
  .banner .chip { line-height: 16px; overflow: hidden; background: color-mix(in srgb, var(--c) 18%, rgba(255,255,255,.78)); color: color-mix(in srgb, var(--c) 45%, #0d2a45); }
  .banner.night .chip { background: color-mix(in srgb, var(--c) 30%, rgba(8,18,38,.55)); color: color-mix(in srgb, var(--c) 35%, #ffffff); }
  .banner .zoom { position: absolute; z-index: 2; top: 5px; right: 5px; margin: 0; width: 24px; height: 24px; border-radius: 50%; color: #33506b;
                  background: rgba(255,255,255,.55); box-shadow: inset 0 0 0 1px rgba(255,255,255,.7); backdrop-filter: blur(4px); }
  .banner .zoom:hover { background: rgba(255,255,255,.75); color: #33506b; }
  .banner.night .zoom { color: #fff; background: rgba(255,255,255,.12); box-shadow: inset 0 0 0 1px rgba(255,255,255,.2); }
  .banner.night .zoom:hover { background: rgba(255,255,255,.22); color: #fff; }
  .banner + .content { padding-top: 12px; }
  /* Narrow card: no room for the picture beside the text, the wall and the desk stay. */
  @container (max-width: 299px) { .cc-scene { display: none; } .htext { right: 36px; } }
`;
