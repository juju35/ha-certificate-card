// ---------------------------------------------------------------------------
// Registration
// ---------------------------------------------------------------------------
import { pickerDefine } from "./card-picker.js";
import { VERSION } from "./core.js";
import { CertificateCard, CertificateMiniCard } from "./cards.js";
import { CertificateCardEditor, CertificateMiniCardEditor } from "./visual-editors.js";

export const define = (name, cls) => {
  if (!customElements.get(name)) pickerDefine(name, cls);
};
define("certificate-card", CertificateCard);
define("certificate-mini-card", CertificateMiniCard);
define("certificate-card-editor", CertificateCardEditor);
define("certificate-mini-card-editor", CertificateMiniCardEditor);

window.customCards = window.customCards || [];
for (const card of [
  {
    type: "certificate-card",
    name: "Certificate Card",
    description: "SSL/TLS certificates (Certificate Expiry) and domain names (Whois): days left, expiry dates and basic DNS checks.",
  },
  {
    type: "certificate-mini-card",
    name: "Certificate Mini Card",
    description: "Compact view of the certificates expiring next (Certificate Expiry), with DNS checks.",
  },
]) {
  if (!window.customCards.some((c) => c.type === card.type))
    window.customCards.push({ ...card, preview: true, documentationURL: "https://github.com/juju35/ha-certificate-card" });
}

console.info(
  `%c CERTIFICATE-CARD %c v${VERSION} `,
  "color: white; background: #2e7d32; font-weight: 700;",
  "color: #2e7d32; background: white; font-weight: 700;"
);
