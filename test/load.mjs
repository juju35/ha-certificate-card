// Test loader: evaluates the card source (a plain script, as shipped in dist/) in an isolated context
// with minimal browser stubs, and returns the requested top-level bindings. The bundle is unchanged.
import { readFileSync } from "node:fs";
import vm from "node:vm";

export const load = (file, names) => {
  const src = readFileSync(new URL(`../src/${file}`, import.meta.url), "utf8");
  class HTMLElement {
    attachShadow() {
      this.shadowRoot = { addEventListener() {}, innerHTML: "" };
      return this.shadowRoot;
    }
    dispatchEvent() {}
    setAttribute(name, value) {
      (this.attributes ??= {})[name] = String(value);
    }
  }
  const registry = new Map();
  const context = {
    HTMLElement,
    customElements: { get: (n) => registry.get(n), define: (n, c) => registry.set(n, c) },
    window: { addEventListener() {}, removeEventListener() {} },
    document: { addEventListener() {}, removeEventListener() {} },
    console: { info() {}, error() {}, log() {} },
    CustomEvent: class {},
    Intl,
    Date,
    setInterval,
    clearInterval,
  };
  // The clock the card counts from, pinned by the tests in their own realm: read through, so that the card (in this
  // context) sees it too, and the expectations do not depend on the time of day the tests run.
  Object.defineProperty(context, "__CERT_CARD_NOW__", { get: () => globalThis.__CERT_CARD_NOW__ });
  vm.createContext(context);
  return vm.runInContext(`${src}\n;({ ${names.join(", ")} })`, context);
};
