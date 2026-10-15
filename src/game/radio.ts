import { getSave, saveProgress } from "./save";
import { DEFAULT_RADIO_URL, gemaBlockReason, ownTrack, parseRadioInput, radioSelection, radioTrack, selectRadioTrack, selectRadioUrl } from "./radio-state";
import "./radio.css";

const MUTE_KEY = "420mon_mute", GEMA_KEY = "420mon_gema";
const readFlag = (key: string, fallback: boolean) => {
  try { const value = localStorage.getItem(key); return value === null ? fallback : value === "1"; } catch { return fallback; }
};
const writeFlag = (key: string, value: boolean) => { try { localStorage.setItem(key, value ? "1" : "0"); } catch { /* private storage */ } };

/** A single persistent player follows the character; only Rajko/the physical deck opens its editor. */
export function createRadioSystem() {
  const app = document.querySelector<HTMLElement>("#app")!;
  let muted = readFlag(MUTE_KEY, false), shield = readFlag(GEMA_KEY, true), unlocked = false, disposed = false;
  let current = radioSelection(getSave(), shield), lastFocus: HTMLElement | null = null;
  const host = document.createElement("section"); host.className = "radio-overlay"; host.hidden = true;
  host.setAttribute("role", "dialog"); host.setAttribute("aria-modal", "true"); host.setAttribute("aria-labelledby", "radio-title");
  host.innerHTML = `<div class="radio-panel"><header><div><span>RAJKOS KELLER · ORIGINAL-DECK</span><h2 id="radio-title">Rajkos Deck</h2></div><button class="radio-close" type="button" aria-label="Deck schließen">✕</button></header><p>Rajko ist der neue Takt. Lowtown der alte Kanal. Deine Auswahl läuft beim Erkunden weiter.</p><div class="radio-track-buttons"><button type="button" data-track="rajko">Rajko · neuer Takt</button><button type="button" data-track="lowtown">Lowtown · alter Kanal</button><button type="button" class="radio-next">Nächster Titel</button><button type="button" class="radio-mute"></button></div><button type="button" class="radio-shield"></button><p class="radio-shield-copy"></p><label for="radio-url">YouTube, Spotify oder HTTPS-Radio</label><form class="radio-url-form"><input id="radio-url" type="text" maxlength="500" autocomplete="off" autocapitalize="off" spellcheck="false" placeholder="YouTube- oder Spotify-Link"><button type="submit">Aufs Deck</button></form><div class="radio-url-actions"><button type="button" class="radio-example">Chillhop · Beispiel</button><span class="radio-url-hint"></span></div><div class="radio-player-slot"></div><p class="radio-note" role="status" aria-live="polite"></p></div>`;
  const dock = document.createElement("aside"); dock.className = "radio-dock"; dock.hidden = true;
  dock.setAttribute("aria-label", "Laufendes Radio");
  const stage = document.createElement("div"); stage.className = "radio-stage";
  const frame = document.createElement("iframe"); frame.className = "radio-frame"; frame.allow = "autoplay; encrypted-media; fullscreen; picture-in-picture"; frame.allowFullscreen = true; frame.referrerPolicy = "strict-origin-when-cross-origin";
  const fullscreen = document.createElement("button"); fullscreen.className = "radio-fullscreen"; fullscreen.type = "button"; fullscreen.textContent = "Vollbild";
  fullscreen.onclick = () => {
    if (document.fullscreenElement === stage) void document.exitFullscreen().catch(() => {});
    else void stage.requestFullscreen?.().catch(() => { note.textContent = "Vollbild ist hier nicht verfügbar. Die Player-Steuerung bleibt bedienbar."; });
  };
  stage.append(frame, fullscreen);
  const audio = document.createElement("audio"); audio.loop = true; audio.preload = "none"; audio.volume = .38;
  const muteDock = document.createElement("button"); muteDock.type = "button"; muteDock.className = "radio-mute-dock";
  app.append(host, dock, audio, muteDock);
  const input = host.querySelector<HTMLInputElement>("#radio-url")!;
  input.value = typeof getSave().radioUrl === "string" ? getSave().radioUrl as string : DEFAULT_RADIO_URL;
  const note = host.querySelector<HTMLElement>(".radio-note")!;
  function refreshDraft() {
    const parsed = parseRadioInput(input.value), blocked = parsed ? gemaBlockReason(parsed, shield) : null;
    host.querySelector<HTMLButtonElement>('[type="submit"]')!.disabled = !parsed || !!blocked;
    host.querySelector<HTMLElement>(".radio-url-hint")!.textContent = blocked ?? (parsed ? parsed.label : "Gültigen Link eingeben.");
  }
  function layoutPlayer() {
    const external = unlocked && !muted && current.kind !== "file";
    stage.hidden = !external; dock.hidden = !external || !host.hidden;
    if (external) {
      const slot = host.hidden ? dock : host.querySelector<HTMLElement>(".radio-player-slot")!;
      if (stage.parentElement !== slot) slot.append(stage);
    }
    host.querySelectorAll<HTMLButtonElement>("[data-track]").forEach(button => button.classList.toggle("selected", radioTrack(getSave()) === button.dataset.track));
    const muteText = muted ? "Ton an" : "Stumm";
    host.querySelector<HTMLElement>(".radio-mute")!.textContent = muteText;
    muteDock.textContent = muted ? "♫ TON AN" : "♫ STUMM"; muteDock.setAttribute("aria-label", muted ? "Radio einschalten" : "Radio stummschalten");
    muteDock.setAttribute("aria-pressed", String(muted));
    host.querySelector<HTMLElement>(".radio-shield")!.textContent = `GEMA-Schutz ${shield ? "an" : "aus"}`;
    host.querySelector<HTMLElement>(".radio-shield-copy")!.textContent = shield ? "Fremde Radios und Dateien sind gesperrt. YouTube und Spotify laufen im Player der Plattform." : "Fremde Streams sind freigeschaltet. Öffentliche Wiedergabe liegt in deiner Verantwortung.";
    host.querySelector<HTMLButtonElement>(".radio-example")!.disabled = shield;
    refreshDraft();
  }
  function play() {
    if (disposed) return;
    if (!unlocked || muted) {
      audio.pause(); frame.removeAttribute("src"); layoutPlayer(); return;
    }
    if (current.kind === "file") {
      frame.removeAttribute("src");
      const src = ownTrack(current.src) ? `${import.meta.env.BASE_URL}${current.src.replace(/^\//, "")}` : current.src;
      if (audio.getAttribute("src") !== src) audio.src = src;
      if (!document.hidden) void audio.play().then(() => { if (!muted) note.textContent = `${current.label} läuft.`; }).catch(error => {
        if (error instanceof DOMException && error.name === "AbortError") return;
        note.textContent = error instanceof DOMException && error.name === "NotAllowedError" ? "Ton antippen, um die Wiedergabe zu starten." : "Der Stream kann gerade nicht gespielt werden. Wähle einen anderen Kanal oder Link.";
      });
    } else {
      audio.pause(); frame.title = current.label;
      if (frame.getAttribute("src") !== current.src) frame.src = current.src;
      note.textContent = `${current.label}: Die Player-Steuerung lässt sich direkt bedienen.`;
    }
    layoutPlayer();
  }
  function unlock() { if (!unlocked) { unlocked = true; play(); } }
  function setMute(value: boolean) { muted = value; writeFlag(MUTE_KEY, muted); unlocked = true; play(); }
  function choose(track: "rajko" | "lowtown") {
    current = selectRadioTrack(getSave(), track); saveProgress(); unlocked = true; play();
  }
  function chooseUrl(raw: string) {
    const result = selectRadioUrl(getSave(), raw, shield);
    if (!result.ok) { note.textContent = result.reason; return; }
    current = result.play; input.value = raw.trim(); saveProgress(); unlocked = true; play();
  }
  function next() {
    if (current.kind === "youtube") {
      if (!new URL(current.src).searchParams.has("list")) { note.textContent = "Rajko: Ein einzelnes Video. Nächster Titel braucht eine Playlist."; return; }
      frame.contentWindow?.postMessage(JSON.stringify({ event: "command", func: "nextVideo", args: [] }), "https://www.youtube-nocookie.com");
      note.textContent = "Rajko: Nächster Titel.";
    } else if (current.kind === "spotify") note.textContent = "Rajko: Den nächsten Titel schaltet Spotify im Player.";
    else choose(radioTrack(getSave()) === "rajko" ? "lowtown" : "rajko");
  }
  function close() {
    if (host.hidden) return;
    if (host.contains(document.activeElement)) (document.activeElement as HTMLElement).blur();
    host.hidden = true; layoutPlayer(); lastFocus?.focus();
  }
  function open() {
    lastFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    host.hidden = false; unlocked = true; play(); host.querySelector<HTMLButtonElement>(".radio-close")!.focus();
  }
  host.querySelector(".radio-close")!.addEventListener("click", close);
  host.querySelectorAll<HTMLButtonElement>("[data-track]").forEach(button => button.onclick = () => choose(button.dataset.track as "rajko" | "lowtown"));
  host.querySelector(".radio-next")!.addEventListener("click", next);
  host.querySelector(".radio-mute")!.addEventListener("click", () => setMute(!muted));
  muteDock.onclick = () => setMute(!muted);
  host.querySelector(".radio-shield")!.addEventListener("click", () => {
    shield = !shield; writeFlag(GEMA_KEY, shield);
    if (gemaBlockReason(current, shield)) { current = radioSelection(getSave(), shield); play(); }
    layoutPlayer();
  });
  host.querySelector("form")!.addEventListener("submit", event => { event.preventDefault(); chooseUrl(input.value); });
  host.querySelector(".radio-example")!.addEventListener("click", () => chooseUrl(DEFAULT_RADIO_URL));
  input.addEventListener("input", refreshDraft);
  const keydown = (event: KeyboardEvent) => {
    if (host.hidden) return;
    event.stopPropagation();
    if (event.code === "Escape") { event.preventDefault(); close(); }
    else if (event.code === "Tab") {
      const controls = [...host.querySelectorAll<HTMLElement>("button:not(:disabled), input, iframe")].filter(control => !control.closest("[hidden]"));
      const index = controls.indexOf(document.activeElement as HTMLElement);
      if (event.shiftKey && index <= 0) { event.preventDefault(); controls.at(-1)?.focus(); }
      else if (!event.shiftKey && index === controls.length - 1) { event.preventDefault(); controls[0]?.focus(); }
    }
  };
  const visibility = () => { if (document.hidden) audio.pause(); else if (unlocked && !muted && current.kind === "file") play(); };
  const onSave = () => {
    const nextPlay = radioSelection(getSave(), shield);
    if (nextPlay.src !== current.src || nextPlay.kind !== current.kind) { current = nextPlay; play(); }
  };
  audio.addEventListener("error", () => { note.textContent = "Der Stream ist nicht erreichbar oder das Format wird vom Browser nicht unterstützt. Wähle einen anderen Kanal."; });
  // Touch browsers grant media activation on pointerup; keyboard-only play unlocks too.
  window.addEventListener("pointerup", unlock, { once: true });
  window.addEventListener("keydown", unlock, { once: true });
  window.addEventListener("keydown", keydown, true);
  window.addEventListener("420mon-save-changed", onSave);
  document.addEventListener("visibilitychange", visibility);
  layoutPlayer();
  return {
    open, close, isOpen: () => !host.hidden,
    dispose() {
      disposed = true; audio.pause(); audio.removeAttribute("src"); audio.load(); frame.removeAttribute("src");
      window.removeEventListener("pointerup", unlock); window.removeEventListener("keydown", unlock); window.removeEventListener("keydown", keydown, true); window.removeEventListener("420mon-save-changed", onSave); document.removeEventListener("visibilitychange", visibility);
      host.remove(); dock.remove(); stage.remove(); audio.remove(); muteDock.remove();
    },
  };
}
