import assert from "node:assert/strict";
import { after, test } from "node:test";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createServer } from "vite";
import { createSupportService, mintSupportCode, tierForAmount } from "../server/support-server.mjs";

const vite = await createServer({ root: new URL("..", import.meta.url).pathname, server: { middlewareMode: true }, appType: "custom", logLevel: "silent" });
after(() => vite.close());
const { createSupportClient, supportApiUrl } = await vite.ssrLoadModule("/src/game/support-state.ts");
const { SUPPORT } = await vite.ssrLoadModule("/src/game/data/donate.ts");
const origin = "https://benjg420.github.io";
const token = "test-webhook-verification-token";
const secret = "test-only-support-code-secret-with-over-32-characters";
function fixture() {
  const directory = mkdtempSync(join(tmpdir(), "420mon-support-"));
  const config = { databasePath: join(directory, "receipts.sqlite"), kofiToken: token, codeSecret: secret, allowedOrigins: [origin] };
  let service = createSupportService(config);
  const post = (path, body, requestOrigin = origin) => service.handle(new Request(`https://support.example${path}`, { method: "POST", headers: { "content-type": "application/json", ...(requestOrigin ? { origin: requestOrigin } : {}) }, body: JSON.stringify(body) }));
  return {
    post,
    fetch: (url, init) => service.handle(new Request(url, { ...init, headers: { ...init.headers, origin } })),
    restart: () => { service.close(); service = createSupportService(config); },
    close: () => { service.close(); rmSync(directory, { recursive: true, force: true }); },
  };
}
const save = () => ({ inventory: { seed_ordinary: 1 }, support: ["klein"], team: [{ hp: 0, xp: 17 }], gold: 42 });
const payment = (word, extra = {}) => ({ verification_token: token, type: "Donation", amount: "8.00", currency: "EUR", message: `Für das Spiel ${word}`, kofi_transaction_id: "transaction-1", ...extra });

test("original support packages keep fixed prices and authentic item quantities", () => {
  assert.deepEqual(SUPPORT.map(t => [t.id, t.eur, t.items.length]), [["klein", 3, 4], ["runde", 8, 6], ["keller", 20, 7]]);
  assert.deepEqual([2.99, 3, 7.99, 8, 19.99, 20, NaN, Infinity].map(tierForAmount), [null, "klein", "klein", "runde", "runde", "keller", null, null]);
  assert.equal(SUPPORT[2].items.find(it => it.id === "wear_lack").n, 1);
});

test("an unconfigured static client cannot claim or invent a support tier", async () => {
  const state = save(), before = structuredClone(state);
  const client = createSupportClient(state, () => true, { apiUrl: "", fetch: () => { throw new Error("No request should be sent"); } });
  assert.equal(client.configured, false);
  assert.equal((await client.redeemCode("keller")).ok, false);
  assert.deepEqual(state, before);
  for (const url of ["http://payments.example", "javascript:alert(1)", "https://user:secret@payments.example", "https://payments.example?token=secret"]) assert.equal(supportApiUrl(url), "");
  assert.equal(supportApiUrl("https://payments.example/"), "https://payments.example");
  assert.throws(() => createSupportService({ databasePath: ":memory:" }), /required/);
});

test("verified Ko-fi receipt grants exactly once, survives backend restart and cannot move to another save", async () => {
  const f = fixture();
  try {
    const state = save(); let durable;
    const client = createSupportClient(state, () => { durable = structuredClone(state); return true; }, { apiUrl: "https://support.example", fetch: f.fetch });
    assert.equal((await client.armWord()).ok, true);
    const word = client.word(); assert.match(word, /^420-[a-f0-9]{8}$/);
    const other = "b".repeat(64);
    assert.equal((await (await f.post("/api/support/claim", { clientKey: other, word })).json()).ok, false);
    assert.equal((await client.claimPayment()).ok, false);
    assert.equal((await f.post("/api/kofi", payment(word), null)).status, 200);
    assert.equal((await f.post("/api/kofi", payment(word), null)).status, 200);
    const pendingWord = await (await f.post("/api/support/word", { clientKey: state.supportClientKey, word })).json();
    assert.equal(pendingWord.word, word, "paid but unclaimed word stays retryable");
    f.restart();
    assert.equal((await client.claimPayment()).ok, true);
    assert.equal(state.inventory.vial_cut, 1); assert.equal(state.inventory.chip_neon, 2);
    assert.equal(state.team[0].hp, 0); assert.equal(state.team[0].xp, 17); assert.equal(state.gold, 42);
    assert.deepEqual(state.support, ["klein", "runde"]); assert.deepEqual(state.supportReceipts, ["kofi:transaction-1"]);
    assert.equal(client.word(), "");
    const retry = await (await f.post("/api/support/claim", { clientKey: state.supportClientKey, word })).json();
    assert.equal(retry.ok, true); assert.equal(retry.receipt.id, "kofi:transaction-1");
    const freshWord = await (await f.post("/api/support/word", { clientKey: state.supportClientKey, word })).json();
    assert.equal(freshWord.ok, true); assert.notEqual(freshWord.word, word, "settled words cannot receive another purchase");
    // A response retry after reload has the durable receipt guard as well.
    durable.kofiWord = word;
    const reloaded = createSupportClient(durable, () => true, { apiUrl: "https://support.example", fetch: f.fetch });
    assert.equal((await reloaded.claimPayment()).duplicate, true);
    assert.equal(durable.inventory.vial_cut, 1);
    assert.equal(durable.kofiWord, "", "duplicate receipt closes its consumed word durably");
  } finally { f.close(); }
});

test("invalid token, currency, subscriptions and forged tiers never award items", async () => {
  const f = fixture();
  try {
    const state = save(), client = createSupportClient(state, () => true, { apiUrl: "https://support.example", fetch: f.fetch });
    await client.armWord(); const word = client.word();
    const badToken = await f.post("/api/kofi", payment(word, { verification_token: "wrong" }), null);
    assert.equal(badToken.status, 401);
    for (const extra of [{ currency: "USD" }, { type: "Subscription" }, { is_subscription_payment: true }, { amount: "NaN" }, { amount: "2.99" }]) await f.post("/api/kofi", payment(word, extra), null);
    assert.equal((await client.claimPayment()).ok, false);
    assert.equal((await client.redeemCode("keller")).ok, false);
    assert.deepEqual(state.inventory, { seed_ordinary: 1 });
    assert.equal((await f.post("/api/support/claim", { clientKey: state.supportClientKey, word, tier: "keller" }, "https://attacker.example")).status, 403);
    const preflight = await f.post("/api/support/word", { clientKey: state.supportClientKey });
    assert.equal(preflight.headers.get("access-control-allow-origin"), origin);
  } finally { f.close(); }
});

test("signed manual codes are replay-safe and rejected for another private save key", async () => {
  const f = fixture();
  try {
    const state = save(), client = createSupportClient(state, () => true, { apiUrl: "https://support.example", fetch: f.fetch });
    const code = mintSupportCode("keller", secret);
    assert.equal((await client.redeemCode(code)).ok, true);
    assert.equal(state.inventory.wear_lack, 1);
    assert.equal((await client.redeemCode(code.toUpperCase())).duplicate, true);
    assert.equal(state.inventory.wear_lack, 1);
    const another = createSupportClient(save(), () => true, { apiUrl: "https://support.example", fetch: f.fetch });
    assert.equal((await another.redeemCode(code)).ok, false);
    assert.equal((await client.redeemCode(mintSupportCode("klein", `${secret}-wrong`))).ok, false);
  } finally { f.close(); }
});

test("failed local save rolls items back and the same paid code remains retryable", async () => {
  const f = fixture();
  try {
    const state = save(); state.supportClientKey = "a".repeat(64);
    let saveWorks = false, saveThrows = false;
    const client = createSupportClient(state, () => { if (saveThrows) throw new Error("Storage blocked"); return saveWorks; }, { apiUrl: "https://support.example", fetch: f.fetch });
    const code = mintSupportCode("klein", secret);
    assert.equal((await client.redeemCode(code)).ok, false);
    assert.deepEqual(state.inventory, { seed_ordinary: 1 }); assert.deepEqual(state.support, ["klein"]);
    assert.equal(state.supportReceipts, undefined);
    saveThrows = true;
    assert.equal((await client.redeemCode(code)).ok, false);
    assert.deepEqual(state.inventory, { seed_ordinary: 1 }); assert.deepEqual(state.support, ["klein"]);
    assert.equal(state.supportReceipts, undefined);
    saveThrows = false;
    saveWorks = true;
    assert.equal((await client.redeemCode(code)).ok, true);
    assert.equal(state.inventory.seed_kush, 1); assert.equal(state.inventory.chip_street, 3);
  } finally { f.close(); }
});

test("a new private key must persist before any payment request and is rolled back on false or throw", async () => {
  const state = save(); let persistMode = "false", requests = 0;
  const client = createSupportClient(state, () => {
    if (persistMode === "throw") throw new Error("Storage blocked");
    return persistMode === "ok";
  }, { apiUrl: "https://support.example", fetch: async () => { requests++; return Response.json({ ok: false, error: "No receipt" }); } });
  assert.equal((await client.redeemCode("some-code")).ok, false);
  assert.equal(state.supportClientKey, undefined); assert.equal(requests, 0);
  persistMode = "throw";
  assert.equal((await client.redeemCode("some-code")).ok, false);
  assert.equal(state.supportClientKey, undefined); assert.equal(requests, 0);
  persistMode = "ok";
  assert.equal((await client.redeemCode("some-code")).ok, false);
  assert.match(state.supportClientKey, /^[a-f0-9]{64}$/); assert.equal(requests, 1);
});
