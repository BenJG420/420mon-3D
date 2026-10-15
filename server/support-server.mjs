/** Node 22.13+; standalone payment service. Nothing in this file enters Vite. */
import { createServer } from "node:http";
import { createHash, createHmac, randomBytes, timingSafeEqual } from "node:crypto";
import { DatabaseSync } from "node:sqlite";
import { pathToFileURL } from "node:url";

const TIERS = new Set(["klein", "runde", "keller"]);
const digest = value => createHash("sha256").update(value).digest("hex");
const equal = (left, right) => {
  const a = Buffer.from(String(left)), b = Buffer.from(String(right));
  return a.length === b.length && timingSafeEqual(a, b);
};
export const tierForAmount = amount => Number.isFinite(amount) ? amount >= 20 ? "keller" : amount >= 8 ? "runde" : amount >= 3 ? "klein" : null : null;
export function mintSupportCode(tier, secret) {
  if (!TIERS.has(tier) || typeof secret !== "string" || secret.length < 32) throw new Error("Valid tier and server-only secret of at least 32 characters required.");
  const nonce = randomBytes(8).toString("hex");
  const signature = createHmac("sha256", secret).update(`${tier}.${nonce}`).digest("hex").slice(0, 32);
  return `${tier}-${nonce}-${signature}`;
}
function readCode(raw, secret) {
  const code = typeof raw === "string" ? raw.trim().toLowerCase() : "";
  const parts = /^(klein|runde|keller)-([0-9a-f]{16})-([0-9a-f]{32})$/.exec(code);
  if (!parts) return null;
  const expected = createHmac("sha256", secret).update(`${parts[1]}.${parts[2]}`).digest("hex").slice(0, 32);
  return equal(parts[3], expected) ? { tier: parts[1], code } : null;
}

export function createSupportService({ databasePath, kofiToken, codeSecret, allowedOrigins }) {
  if (!databasePath || !kofiToken || kofiToken.length < 16 || !codeSecret || codeSecret.length < 32 || !allowedOrigins?.length) {
    throw new Error("SUPPORT_DB_PATH, SUPPORT_KOFI_TOKEN, SUPPORT_CODE_SECRET and SUPPORT_ALLOWED_ORIGINS are required. No insecure fallback is provided.");
  }
  const db = new DatabaseSync(databasePath);
  db.exec(`PRAGMA journal_mode=WAL; PRAGMA busy_timeout=5000;
    CREATE TABLE IF NOT EXISTS support_words (word TEXT PRIMARY KEY, owner TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS support_receipts (id TEXT PRIMARY KEY, word TEXT UNIQUE, tier TEXT NOT NULL, owner TEXT);
  `);
  const origins = new Set(allowedOrigins);
  const rate = new Map();
  function transaction(action) {
    db.exec("BEGIN IMMEDIATE");
    try { const result = action(); db.exec("COMMIT"); return result; }
    catch (error) { db.exec("ROLLBACK"); throw error; }
  }
  function settle(id, owner) {
    return transaction(() => {
      const row = db.prepare("SELECT id,tier,owner FROM support_receipts WHERE id=?").get(id);
      if (!row) return { ok: false, error: "Noch keine bestätigte Zahlung. Bitte später erneut prüfen." };
      if (row.owner && row.owner !== owner) return { ok: false, error: "Dieses Paket wurde bereits in einem anderen Spielstand abgeholt." };
      db.prepare("UPDATE support_receipts SET owner=? WHERE id=? AND (owner IS NULL OR owner=?)").run(owner, id, owner);
      return { ok: true, receipt: { id: row.id, tier: row.tier } };
    });
  }
  async function handle(request, remoteAddress = "local") {
    const url = new URL(request.url);
    const origin = request.headers.get("origin");
    const cors = origins.has(origin) ? { "access-control-allow-origin": origin, vary: "Origin", "access-control-allow-methods": "POST, OPTIONS", "access-control-allow-headers": "content-type" } : {};
    const reply = (status, body) => new Response(status === 204 ? null : JSON.stringify(body), { status, headers: { ...cors, "content-type": "application/json; charset=utf-8", "cache-control": "no-store", "x-content-type-options": "nosniff" } });
    const webhook = url.pathname === "/api/kofi";
    if (!webhook && !origins.has(origin)) return reply(403, { ok: false, error: "Diese Spieladresse ist nicht freigeschaltet." });
    if (request.method === "OPTIONS") return reply(204, null);
    if (request.method !== "POST") return reply(405, { ok: false, error: "POST required." });
    const now = Date.now(), limiter = rate.get(remoteAddress);
    if (limiter && limiter.until > now) {
      if (++limiter.count > 120) return reply(429, { ok: false, error: "Bitte kurz warten." });
    } else rate.set(remoteAddress, { count: 1, until: now + 60_000 });
    if (rate.size > 5000) for (const [ip, entry] of rate) if (entry.until <= now) rate.delete(ip);
    const text = await request.text();
    if (text.length > 16_384) return reply(413, { ok: false, error: "Anfrage zu groß." });
    let body;
    try { body = JSON.parse(webhook && !request.headers.get("content-type")?.includes("application/json") ? new URLSearchParams(text).get("data") ?? "" : text); }
    catch { return reply(400, { ok: false, error: "Ungültige Anfrage." }); }
    if (!body || typeof body !== "object" || Array.isArray(body)) return reply(400, { ok: false, error: "Ungültige Anfrage." });
    if (webhook) {
      if (typeof body.verification_token !== "string" || !equal(body.verification_token, kofiToken)) return reply(401, { ok: false });
      const word = /\b420-[a-f0-9]{8}\b/i.exec(typeof body.message === "string" ? body.message : "")?.[0].toLowerCase();
      const amountText = String(body.amount ?? "").replace(",", ".");
      const tier = /^\d+(?:\.\d{1,2})?$/.test(amountText) && body.currency === "EUR" ? tierForAmount(Number(amountText)) : null;
      const txid = typeof body.kofi_transaction_id === "string" && /^[a-zA-Z0-9_-]{1,100}$/.test(body.kofi_transaction_id) ? body.kofi_transaction_id : "";
      if (word && tier && txid && body.type !== "Subscription" && !body.is_subscription_payment && db.prepare("SELECT word FROM support_words WHERE word=?").get(word)) {
        db.prepare("INSERT INTO support_receipts (id,word,tier) VALUES (?,?,?) ON CONFLICT DO NOTHING").run(`kofi:${txid}`, word, tier);
      }
      return reply(200, { ok: true });
    }
    if (typeof body.clientKey !== "string" || !/^[a-f0-9]{64}$/.test(body.clientKey)) return reply(400, { ok: false, error: "Spielstand-Schlüssel fehlt." });
    const owner = digest(body.clientKey);
    if (url.pathname === "/api/support/word") {
      const old = typeof body.word === "string" && /^420-[a-f0-9]{8}$/.test(body.word) ? db.prepare("SELECT word,owner FROM support_words WHERE word=?").get(body.word) : null;
      if (old?.owner === owner) {
        const paid = db.prepare("SELECT owner FROM support_receipts WHERE word=?").get(old.word);
        // Keep a paid-but-unclaimed word retryable; never rearm a settled word.
        if (!paid?.owner) return reply(200, { ok: true, word: old.word });
      }
      for (let i = 0; i < 8; i++) {
        const word = `420-${randomBytes(4).toString("hex")}`;
        const result = db.prepare("INSERT INTO support_words (word,owner) VALUES (?,?) ON CONFLICT DO NOTHING").run(word, owner);
        if (result.changes) return reply(200, { ok: true, word });
      }
      return reply(503, { ok: false, error: "Bitte erneut versuchen." });
    }
    if (url.pathname === "/api/support/claim") {
      if (typeof body.word !== "string" || !/^420-[a-f0-9]{8}$/.test(body.word)) return reply(200, { ok: false, error: "Das Kassenwort stimmt nicht." });
      const word = db.prepare("SELECT owner FROM support_words WHERE word=?").get(body.word);
      if (!word || word.owner !== owner) return reply(200, { ok: false, error: "Dieses Kassenwort gehört nicht zu diesem Spielstand." });
      const row = db.prepare("SELECT id FROM support_receipts WHERE word=?").get(body.word);
      return reply(200, row ? settle(row.id, owner) : { ok: false, error: "Noch keine bestätigte Zahlung. Bitte später erneut prüfen." });
    }
    if (url.pathname === "/api/support/redeem") {
      const code = readCode(body.code, codeSecret);
      if (!code) return reply(200, { ok: false, error: "Den Code gibt es nicht." });
      const id = `code:${digest(code.code)}`;
      db.prepare("INSERT INTO support_receipts (id,tier) VALUES (?,?) ON CONFLICT DO NOTHING").run(id, code.tier);
      return reply(200, settle(id, owner));
    }
    return reply(404, { ok: false, error: "Unbekannte Kasse." });
  }
  return { handle, close: () => db.close() };
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  if (process.argv[2] === "mint") {
    process.stdout.write(`${mintSupportCode(process.argv[3], process.env.SUPPORT_CODE_SECRET)}\n`);
  } else {
    const service = createSupportService({ databasePath: process.env.SUPPORT_DB_PATH, kofiToken: process.env.SUPPORT_KOFI_TOKEN, codeSecret: process.env.SUPPORT_CODE_SECRET, allowedOrigins: (process.env.SUPPORT_ALLOWED_ORIGINS ?? "").split(",").map(s => s.trim()).filter(Boolean) });
    const server = createServer(async (incoming, outgoing) => {
      try {
        const parts = []; let size = 0;
        for await (const chunk of incoming) { size += chunk.length; if (size > 16_384) { outgoing.writeHead(413).end(); return; } parts.push(chunk); }
        const request = new Request(`http://localhost${incoming.url}`, { method: incoming.method, headers: incoming.headers, ...(incoming.method === "GET" || incoming.method === "HEAD" ? {} : { body: Buffer.concat(parts) }) });
        const response = await service.handle(request, incoming.socket.remoteAddress);
        outgoing.writeHead(response.status, Object.fromEntries(response.headers));
        outgoing.end(Buffer.from(await response.arrayBuffer()));
      } catch { outgoing.writeHead(500, { "content-type": "application/json" }).end('{"ok":false,"error":"Die Kasse ist gerade nicht erreichbar."}'); }
    });
    server.listen(Number(process.env.PORT) || 8787, process.env.SUPPORT_HOST || "127.0.0.1", () => console.log("Support service listening."));
    const close = () => server.close(() => { service.close(); process.exit(0); });
    process.on("SIGTERM", close); process.on("SIGINT", close);
  }
}
