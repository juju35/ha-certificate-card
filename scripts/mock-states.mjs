// Mock Home Assistant registries and states shaped like the Certificate Expiry and DNS IP integrations, used to render
// the screenshots. Host names are neutral examples; entity ids are in French on purpose: the cards never rely on them.
// The screenshots are taken at a fixed time (NOW), so the days left do not change from one run to the next.
export const NOW = Date.parse("2026-11-13T09:00:00Z");
const DAY = 864e5;

export const states = {};
export const entities = {};
export const devices = {};

const entity = (entity_id, platform, device, state, attributes = {}) => {
  devices[device] ??= { id: device, name: device, name_by_user: null };
  entities[entity_id] = { entity_id, platform, device_id: device, translation_key: null };
  states[entity_id] = { entity_id, state: String(state), attributes };
};

const iso = (days) => new Date(NOW + days * DAY).toISOString().replace(".000Z", "+00:00");
const cert = (host, days, extra = {}) =>
  entity(`sensor.${host.replace(/\W/g, "_")}_expiration_du_certificat`, "cert_expiry", host, iso(days), {
    device_class: "timestamp",
    friendly_name: `${host} Cert expiry`,
    is_valid: true,
    error: "None",
    ...extra,
  });

cert("home.example.org", 62.3);
cert("cloud.example.org", 78.6);
cert("nas.example.org", 18.4);
cert("vpn.example.net", 4.2);
cert("legacy.example.com", -2.5);
cert("mail.example.com", 40.1, { is_valid: false, error: "Hostname mismatch" });

const dns = (host, ip) =>
  entity(`sensor.${host.replace(/\W/g, "_")}_ipv4`, "dnsip", `dns:${host}`, ip ?? "unknown", { friendly_name: `${host} IPv4` });
dns("home.example.org", "203.0.113.10");
dns("vpn.example.net", "203.0.113.24");
dns("legacy.example.com", null);
for (const h of ["home.example.org", "vpn.example.net", "legacy.example.com"]) devices[`dns:${h}`].name = h;

// A Ping binary sensor (connectivity), listed with dns_entities.
entity("binary_sensor.passerelle", "ping", "gateway", "on", { device_class: "connectivity", friendly_name: "Gateway" });
devices.gateway.name = "Gateway";

export const iso_in = iso;
