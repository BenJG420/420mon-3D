import assert from "node:assert/strict";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { build } from "esbuild";

// A small DOM fixture exercises the actual shop and quantity-picker callbacks;
// it neither launches a browser nor replaces the transaction implementation.
class Element extends EventTarget {
  constructor(tag) {
    super(); this.tagName = tag; this.children = []; this.dataset = {};
    this.attributes = new Map(); this.className = ""; this.hidden = false;
    this.disabled = false; this.value = ""; this.textContent = "";
    this.classList = {
      contains: name => this.className.split(/\s+/).includes(name),
      toggle: (name, enabled) => {
        const names = new Set(this.className.split(/\s+/).filter(Boolean));
        if (enabled ?? !names.has(name)) names.add(name); else names.delete(name);
        this.className = [...names].join(" ");
      },
    };
  }
  append(...nodes) { for (const node of nodes) { node.parentElement = this; this.children.push(node); } }
  replaceChildren(...nodes) { for (const node of this.children) node.parentElement = null; this.children = []; this.append(...nodes); }
  contains(node) { return node === this || this.children.some(child => child.contains(node)); }
  setAttribute(name, value) {
    this.attributes.set(name, String(value));
    if (name.startsWith("data-")) this.dataset[name.slice(5).replace(/-([a-z])/g, (_, letter) => letter.toUpperCase())] = String(value);
  }
  matches(selector) {
    if (selector.includes(":not([disabled])")) return !this.disabled && this.matches(selector.replace(":not([disabled])", ""));
    if (selector.startsWith(".")) return this.classList.contains(selector.slice(1));
    const attribute = selector.match(/^\[([^=\]]+)(?:="([^"]*)")?\]$/);
    if (attribute) {
      const [, name, expected] = attribute;
      const value = name.startsWith("data-")
        ? this.dataset[name.slice(5).replace(/-([a-z])/g, (_, letter) => letter.toUpperCase())]
        : this.attributes.get(name);
      return value !== undefined && (expected === undefined || value === expected);
    }
    return this.tagName === selector;
  }
  querySelectorAll(selector) {
    const result = [], selectors = selector.split(",");
    const visit = node => { for (const child of node.children) { if (selectors.some(part => child.matches(part.trim()))) result.push(child); visit(child); } };
    visit(this); return result;
  }
  querySelector(selector) { return this.querySelectorAll(selector)[0] ?? null; }
  focus() { document.activeElement = this; }
  click() {
    if (this.disabled) return;
    this.focus(); const event = new Event("click"); this.onclick?.(event); this.dispatchEvent(event);
  }
}

test("Eddi buying survives his movement, books once and retains physical conversation guards", async () => {
  const keys = ["window", "document", "localStorage"];
  const previous = Object.fromEntries(keys.map(key => [key, Object.getOwnPropertyDescriptor(globalThis, key)]));
  const app = new Element("main"), storage = new Map();
  let writes = 0;
  globalThis.document = { activeElement: app, createElement: tag => new Element(tag), querySelector: selector => selector === "#app" ? app : app.querySelector(selector) };
  globalThis.window = new EventTarget();
  globalThis.localStorage = {
    getItem: key => storage.get(key) ?? null,
    setItem: (key, value) => { storage.set(key, value); if (key === "420mon-progress-v1") writes++; },
  };
  try {
    const compiled = await build({
      stdin: { contents: `export { createStoryEconomy } from "./src/game/story-economy.ts";
        export { getSave } from "./src/game/save.ts";
        export { eddiBody, eddiBuyPrice } from "./src/game/eddi-state.ts";
        export { salePrice } from "./src/game/merchant-state.ts";`, resolveDir: fileURLToPath(new URL("../", import.meta.url)) },
      bundle: true, write: false, platform: "node", format: "esm", loader: { ".css": "empty" }, logLevel: "silent",
    });
    const { createStoryEconomy, getSave, eddiBody, eddiBuyPrice, salePrice } = await import(
      `data:text/javascript;base64,${Buffer.from(compiled.outputFiles[0].text).toString("base64")}`,
    );
    const s = getSave();
    Object.assign(s, { eddiIn: true, eddiX: 248, eddiY: 140, eddiAct: "wander", eddiFacing: 2,
      lastGrowAt: Date.now() + 60000, gold: 100000, inventory: { seed_ordinary: 2, bud_kush: 4 }, schnittTitle: false });
    let map = "capsule";
    const player = { x: 248, y: 160 };
    const shop = createStoryEconomy({ current: () => map, getMapInfo: () => ({ player }), setStoryNpcs() {} });
    const overlay = app.querySelector(".story-overlay");
    const find = selector => { const element = overlay.querySelector(selector); assert.ok(element, `missing ${selector}`); return element; };
    const click = selector => { const element = find(selector); assert.equal(element.disabled, false, selector); element.click(); return element; };
    const draft = quantity => { const field = find("[data-trade-quantity]"); field.value = String(quantity); field.dispatchEvent(new Event("input")); };
    const totals = () => ({ gold: s.gold, inventory: structuredClone(s.inventory), writes });
    const originalBody = eddiBody(s);
    shop.openEddi(originalBody); assert.equal(overlay.hidden, false);
    const before = totals(), price = eddiBuyPrice(s, "seed_ordinary");
    s.eddiX = 70; s.eddiY = 58; // He keeps wandering while the player reads the catalogue.
    click('[data-eddi-trade="seed_ordinary"]');
    assert.equal(overlay.hidden, false, "choosing an item must not silently close the shop");
    draft(3); assert.deepEqual(totals(), before, "quantity changes are only a draft");
    assert.match(find("[data-trade-total]").textContent, new RegExp(String(price * 3)));
    s.eddiX = 160; // Moving again between quote and confirmation must remain harmless.
    const confirm = click("[data-trade-confirm]"); confirm.click();
    assert.equal(overlay.hidden, false);
    assert.equal(s.gold, before.gold - price * 3); assert.equal(s.inventory.seed_ordinary, 5);
    assert.equal(writes, before.writes + 1, "one confirmation persists one transaction");
    assert.equal(s.eddiX, 160, "the conversation does not freeze or teleport Eddi");
    const stored = JSON.parse(storage.get("420mon-progress-v1"));
    assert.equal(stored.gold, s.gold); assert.equal(stored.inventory.seed_ordinary, 5);

    const afterBuy = totals();
    click('[data-eddi-trade="seed_ordinary"]'); draft(2); click("[data-trade-cancel]");
    assert.deepEqual(totals(), afterBuy, "cancelling never books a purchase");
    click('[data-eddi-tab="sell"]'); click('[data-eddi-trade="bud_kush"]'); draft(2);
    const sellPrice = salePrice(s, "bud_kush", 2);
    click("[data-trade-confirm]");
    assert.equal(s.inventory.bud_kush, 2); assert.equal(s.gold, afterBuy.gold + sellPrice * 2);
    assert.equal(writes, afterBuy.writes + 1, "existing bulk selling still works");

    click('[data-eddi-tab="buy"]'); click('[data-eddi-trade="seed_ordinary"]');
    const beforeDeparture = totals(); player.x = 20;
    click("[data-trade-confirm]");
    assert.deepEqual(totals(), beforeDeparture, "leaving the conversation location cannot book remotely");
    assert.equal(overlay.hidden, false, "failed confirmation leaves a visible explanation");
    assert.match(find("[data-trade-status]").textContent, /Eddi|Nähe|Gespräch/);
    shop.close(); player.x = 248;
    shop.openEddi(originalBody);
    assert.equal(overlay.hidden, true, "a stale NPC body cannot reopen a conversation with distant Eddi");

    s.eddiX = 248; s.eddiY = 140; shop.openEddi(eddiBody(s));
    click('[data-eddi-trade="seed_ordinary"]');
    map = "market";
    click("[data-trade-confirm]");
    assert.deepEqual(totals(), beforeDeparture, "a changed map also rejects the purchase");
    window.dispatchEvent(new Event("420mon-map-change")); assert.equal(overlay.hidden, true);
  } finally {
    for (const key of keys) if (previous[key]) Object.defineProperty(globalThis, key, previous[key]); else delete globalThis[key];
  }
});
