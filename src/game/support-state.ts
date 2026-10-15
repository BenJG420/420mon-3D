import { SUPPORT } from "./data/donate";

export const KOFI_URL = "https://ko-fi.com/420mon";
export type SupportState = {
  inventory: Record<string, number>;
  support?: unknown;
  kofiWord?: unknown;
  supportClientKey?: unknown;
  supportReceipts?: unknown;
  supportPreviousWords?: unknown;
};
export type SupportResult = { ok: boolean; message: string; duplicate?: boolean };
type Receipt = { id: string; tier: string };

/** Only an explicit public HTTPS backend enables purchases on the static site. */
export function supportApiUrl(raw = import.meta.env?.VITE_SUPPORT_API_URL): string {
  if (typeof raw !== "string" || !raw.trim()) return "";
  try {
    const url = new URL(raw.trim());
    const local = ["localhost", "127.0.0.1", "[::1]"].includes(url.hostname);
    if (url.username || url.password || url.search || url.hash || (url.protocol !== "https:" && !(local && url.protocol === "http:"))) return "";
    return url.href.replace(/\/$/, "");
  } catch { return ""; }
}

function receipt(raw: unknown): Receipt | null {
  if (!raw || typeof raw !== "object") return null;
  const value = raw as Record<string, unknown>;
  return typeof value.id === "string" && /^[a-zA-Z0-9:_-]{1,160}$/.test(value.id)
    && SUPPORT.some(tier => tier.id === value.tier) ? { id: value.id, tier: String(value.tier) } : null;
}

/** A receipt is only applied inside a successful request to the configured server. */
export function createSupportClient(state: SupportState, persist: () => boolean, options: { apiUrl?: string; fetch?: typeof fetch } = {}) {
  const base = supportApiUrl(options.apiUrl ?? supportApiUrl());
  const request = options.fetch ?? globalThis.fetch.bind(globalThis);
  let pending = false, ready = false;
  const persistSafely = () => { try { return persist(); } catch { return false; } };
  function key(): string {
    if (typeof state.supportClientKey === "string" && /^[a-f0-9]{64}$/.test(state.supportClientKey)) return state.supportClientKey;
    const bytes = crypto.getRandomValues(new Uint8Array(32));
    const previous = state.supportClientKey;
    state.supportClientKey = Array.from(bytes, b => b.toString(16).padStart(2, "0")).join("");
    if (!persistSafely()) { state.supportClientKey = previous; throw new Error("Das Kassenwort konnte nicht sicher gespeichert werden."); }
    return state.supportClientKey as string;
  }
  async function post(path: string, body: Record<string, string>): Promise<Record<string, unknown>> {
    if (!base) throw new Error("Bens Kasse ist noch nicht mit dem Zahlungsserver verbunden. Es ist keine Zahlung möglich.");
    const response = await request(`${base}/api/support/${path}`, {
      method: "POST", headers: { "content-type": "application/json" },
      body: JSON.stringify({ ...body, clientKey: key() }), signal: AbortSignal.timeout(12_000),
      credentials: "omit", cache: "no-store", redirect: "error",
    });
    if (!response.ok) throw new Error(response.status === 429 ? "Die Kasse braucht kurz Pause. Bitte später erneut prüfen." : "Bens Zahlungsserver ist gerade nicht erreichbar.");
    const data = await response.json() as Record<string, unknown>;
    if (!data.ok) throw new Error(typeof data.error === "string" ? data.error : "Noch keine bestätigte Zahlung.");
    return data;
  }
  async function exclusive(action: () => Promise<SupportResult>): Promise<SupportResult> {
    if (pending) return { ok: false, message: "Die Kasse prüft bereits." };
    pending = true;
    try { return await action(); }
    catch (error) { return { ok: false, message: error instanceof Error ? error.message : "Die Kasse ist gerade nicht erreichbar." }; }
    finally { pending = false; }
  }
  function apply(raw: unknown): SupportResult {
    const valid = receipt(raw);
    if (!valid) throw new Error("Die Zahlungsbestätigung ist ungültig. Es wurden keine Items ausgegeben.");
    const tier = SUPPORT.find(t => t.id === valid.tier)!;
    const previous = Array.isArray(state.supportReceipts) ? state.supportReceipts.filter((id): id is string => typeof id === "string") : [];
    if (previous.includes(valid.id)) {
      if (valid.id.startsWith("kofi:") && state.kofiWord) {
        const word = state.kofiWord; state.kofiWord = "";
        if (!persistSafely()) { state.kofiWord = word; throw new Error("Das alte Kassenwort konnte nicht geschlossen werden. Bitte vor einer weiteren Zahlung erneut prüfen."); }
        ready = false;
      }
      return { ok: true, duplicate: true, message: "Dieses Paket ist bereits in deinem Inventar." };
    }
    const before = { inventory: { ...state.inventory }, support: state.support, receipts: state.supportReceipts, word: state.kofiWord };
    for (const item of tier.items) state.inventory[item.id] = (state.inventory[item.id] ?? 0) + item.n;
    state.support = [...(Array.isArray(state.support) ? state.support : []), tier.id];
    state.supportReceipts = [...previous, valid.id];
    if (valid.id.startsWith("kofi:")) state.kofiWord = "";
    if (!persistSafely()) {
      for (const id of Object.keys(state.inventory)) delete state.inventory[id];
      Object.assign(state.inventory, before.inventory);
      state.support = before.support; state.supportReceipts = before.receipts; state.kofiWord = before.word;
      throw new Error("Der Spielstand konnte nicht gespeichert werden. Das bestätigte Paket bleibt zur erneuten Abholung verfügbar.");
    }
    if (valid.id.startsWith("kofi:")) ready = false;
    return { ok: true, message: `${tier.name} bestätigt. Deine festen Items liegen im Inventar.` };
  }
  return {
    configured: !!base,
    ready: () => ready,
    busy: () => pending,
    word: () => typeof state.kofiWord === "string" && /^420-[a-f0-9]{8}$/.test(state.kofiWord) ? state.kofiWord : "",
    armWord: () => exclusive(async () => {
      const data = await post("word", typeof state.kofiWord === "string" ? { word: state.kofiWord } : {});
      if (typeof data.word !== "string" || !/^420-[a-f0-9]{8}$/.test(data.word)) throw new Error("Der Server hat kein gültiges Kassenwort ausgegeben.");
      const previous = state.kofiWord, previousWords = state.supportPreviousWords;
      if (typeof previous === "string" && /^420-[a-f0-9]{8}$/.test(previous) && previous !== data.word) {
        state.supportPreviousWords = [...new Set([...(Array.isArray(previousWords) ? previousWords.filter((word): word is string => typeof word === "string" && /^420-[a-f0-9]{8}$/.test(word)) : []), previous])];
      }
      state.kofiWord = data.word;
      if (!persistSafely()) { state.kofiWord = previous; state.supportPreviousWords = previousWords; ready = false; throw new Error("Das Kassenwort konnte nicht gespeichert werden. Bitte vor einer Zahlung erneut holen."); }
      ready = true;
      return { ok: true, message: "Schreibe dieses Wort in die private Ko-fi-Nachricht. Der Betrag bestimmt dein Paket." };
    }),
    claimPayment: () => exclusive(async () => {
      if (typeof state.kofiWord !== "string" || !/^420-[a-f0-9]{8}$/.test(state.kofiWord)) throw new Error("Hole zuerst dein Kassenwort.");
      return apply((await post("claim", { word: state.kofiWord })).receipt);
    }),
    redeemCode: (code: string) => exclusive(async () => {
      if (!code.trim()) throw new Error("Trage zuerst deinen Support-Code ein.");
      return apply((await post("redeem", { code: code.trim().slice(0, 100) })).receipt);
    }),
  };
}
