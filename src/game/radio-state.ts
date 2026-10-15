/** Radio catalogue and URL rules ported from the original 2D audio.ts. */
export const TRACK_RAJKO = "/game/audio/rajko.mp3";
export const TRACK_LOWTOWN = "/game/audio/lowtown.mp3";
export const DEFAULT_RADIO_URL = "https://ilm.stream12.radiohost.de/ilm_ilovechillhop_mp3-192?upd-meta&upd-scheme=https&_art=dD0xNzg5OTg1MTk4JmQ9YWRmZGU3ZGNhNTc3YTdmNGNhN2E";
export type RadioPlay = { kind: "file" | "youtube" | "spotify"; src: string; label: string };
export type RadioState = { musicTrack?: unknown; radioUrl?: unknown; [key: string]: unknown };
export type RadioTrack = "rajko" | "lowtown" | "url";

function ytEmbed(id: string, list?: string | null): string {
  const query = "autoplay=1&rel=0&modestbranding=1&playsinline=1&enablejsapi=1";
  if (!id && list) return `https://www.youtube-nocookie.com/embed/videoseries?list=${list}&${query}`;
  return `https://www.youtube-nocookie.com/embed/${id}?${query}${list ? `&list=${list}` : ""}`;
}

export function parseRadioInput(raw: string): RadioPlay | null {
  const text = raw.trim();
  if (!text || text.length > 500) return null;
  if (text.startsWith("spotify:")) {
    const [, type, id, extra] = text.split(":");
    if (extra || !id || !/^[a-zA-Z0-9]+$/.test(id) || !["playlist", "track", "album", "artist", "episode", "show"].includes(type)) return null;
    return { kind: "spotify", src: `https://open.spotify.com/embed/${type}/${id}`, label: "Spotify" };
  }
  let url: URL;
  try { url = new URL(text); } catch { return null; }
  if (url.protocol !== "https:" || url.username || url.password) return null;
  const host = url.hostname.replace(/^www\./, "");
  const list = url.searchParams.get("list");
  const listOk = !!list && /^[\w-]+$/.test(list);
  if (host === "youtu.be") {
    const id = url.pathname.replace(/^\//, "").split("/")[0] ?? "";
    if (!/^[\w-]{11}$/.test(id)) return null;
    return { kind: "youtube", src: ytEmbed(id, listOk ? list : null), label: "YouTube" };
  }
  if (["youtube.com", "m.youtube.com", "music.youtube.com", "youtube-nocookie.com"].includes(host)) {
    const id = url.searchParams.get("v") || url.pathname.match(/\/embed\/([\w-]{11})(?:\/|$)/)?.[1] || url.pathname.match(/\/shorts\/([\w-]{11})(?:\/|$)/)?.[1];
    if (listOk && !id) return { kind: "youtube", src: ytEmbed("", list), label: "YouTube" };
    return id && /^[\w-]{11}$/.test(id) ? { kind: "youtube", src: ytEmbed(id, listOk ? list : null), label: "YouTube" } : null;
  }
  if (host === "open.spotify.com" || host === "spotify.link") {
    const match = url.pathname.match(/\/(playlist|track|album|artist|episode|show)\/([a-zA-Z0-9]+)(?:\/|$)/);
    return match ? { kind: "spotify", src: `https://open.spotify.com/embed/${match[1]}/${match[2]}`, label: "Spotify" } : null;
  }
  const radio = /\.(mp3|ogg|opus|aac|m4a|wav|m3u8|m3u)$/i.test(url.pathname) || /radio|stream|icecast|listen/i.test(host + url.pathname);
  const chill = /chillhop|radiohost\.de/i.test(host + url.pathname);
  return { kind: "file", src: url.href, label: radio ? chill ? "Chillhop" : "Radio" : "Stream" };
}

export function ownTrack(src: string): boolean { return src === TRACK_RAJKO || src === TRACK_LOWTOWN; }
export function gemaBlockReason(play: RadioPlay, shield = true): string | null {
  return shield && play.kind === "file" && !ownTrack(play.src)
    ? "GEMA-Schutz: Fremde Radios und Dateien sind gesperrt. YouTube und Spotify laufen im Player der Plattform."
    : null;
}

export function radioTrack(state: RadioState): RadioTrack { return state.musicTrack === "lowtown" || state.musicTrack === "url" ? state.musicTrack : "rajko"; }
export function radioSelection(state: RadioState, shield = true): RadioPlay {
  const track = radioTrack(state);
  if (track === "lowtown") return { kind: "file", src: TRACK_LOWTOWN, label: "Lowtown" };
  if (track === "url" && typeof state.radioUrl === "string") {
    const play = parseRadioInput(state.radioUrl);
    if (play && !gemaBlockReason(play, shield)) return play;
  }
  return { kind: "file", src: TRACK_RAJKO, label: "Rajko" };
}

export function selectRadioTrack(state: RadioState, track: "rajko" | "lowtown"): RadioPlay {
  state.musicTrack = track;
  return radioSelection(state);
}
export function selectRadioUrl(state: RadioState, raw: string, shield = true): { ok: true; play: RadioPlay } | { ok: false; reason: string } {
  const play = parseRadioInput(raw);
  if (!play) return { ok: false, reason: "Rajko: Die URL beißt nicht." };
  const blocked = gemaBlockReason(play, shield);
  if (blocked) return { ok: false, reason: blocked };
  state.musicTrack = "url"; state.radioUrl = raw.trim();
  return { ok: true, play };
}
