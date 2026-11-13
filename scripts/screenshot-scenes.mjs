// The README captures rendered by scripts/screenshots.mjs: one entry per PNG (`shots`) and per GIF (`gifs`).
// Kept apart from the renderer so the tests can check them without a browser.
import { iso_in } from "./mock-states.mjs";

const withPing = { dns_entities: ["sensor.home_example_org_ipv4", "sensor.vpn_example_net_ipv4", "sensor.legacy_example_com_ipv4", "binary_sensor.passerelle"] };

// Every capture is rendered in both themes: each light shot gets a `-dark` twin with the exact same setup,
// so a light/dark pair only differs by its theme.
const lightShots = [
  { file: "card", type: "certificate-card", theme: "light", width: 460, config: {} },
  { file: "card-dns", type: "certificate-card", theme: "light", width: 460, config: { ...withPing, expand_dns: true } },
  { file: "card-problems", type: "certificate-card", theme: "light", width: 460, config: { only_problems: true, show_counts: false, show_dns: false } },
  { file: "mini-card", type: "certificate-mini-card", theme: "light", width: 380, config: {} },
  { file: "mini-card-zoom", type: "certificate-mini-card", theme: "light", width: 460, config: {}, zoom: true },
];
const withDarkTwins = (light) => [...light, ...light.map((s) => ({ ...s, file: `${s.file}-dark`, theme: "dark" }))];
export const shots = withDarkTwins(lightShots);

// One looping GIF per animation. Each scenario replays `events` (a click on a card element, or a state update) at
// fixed times; every animation is paused and stepped frame by frame from the event that started it, so the GIF is
// identical whatever the machine's speed. `measure` is clicked once beforehand to size the frame on the tallest state.
const lightGifs = [
  {
    file: "card-dns",
    type: "certificate-card",
    theme: "light",
    width: 460,
    config: { show_counts: false },
    seconds: 4,
    measure: ['[data-section="dns"]'],
    events: [
      { at: 0.5, click: '[data-section="dns"]' },
      { at: 2.9, click: '[data-section="dns"]' },
    ],
  },
  {
    file: "card-renewal",
    type: "certificate-card",
    theme: "light",
    width: 460,
    config: { show_dns: false },
    seconds: 4,
    events: [
      { at: 0.6, states: { "sensor.vpn_example_net_expiration_du_certificat": { state: iso_in(89.9) } } },
      { at: 2.6, states: { "sensor.vpn_example_net_expiration_du_certificat": { state: iso_in(4.2) } } },
    ],
  },
  {
    file: "mini-card-zoom",
    type: "certificate-mini-card",
    theme: "light",
    width: 460,
    config: {},
    seconds: 4,
    measure: [".zoom"],
    events: [
      { at: 0.6, click: ".zoom" },
      { at: 2.9, click: ".zoom" },
    ],
  },
];
export const gifs = withDarkTwins(lightGifs);
