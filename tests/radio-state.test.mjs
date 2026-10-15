import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import { after, test } from "node:test";
import { createServer } from "vite";

const server = await createServer({ root: new URL("..", import.meta.url).pathname, server: { middlewareMode: true }, appType: "custom", logLevel: "silent" });
after(() => server.close());
const radio = await server.ssrLoadModule("/src/game/radio-state.ts");

test("both bundled original songs retain their canonical Git blob hashes", async () => {
  for (const [track, expected] of [["rajko", "1cf6a36bb944c474c21c283251227533e24f0f4c"], ["lowtown", "96deda4ab7882df0ff73403c7723a20d26d0eba8"]]) {
    const bytes = await readFile(new URL(`../public/game/audio/${track}.mp3`, import.meta.url));
    const actual = createHash("sha1").update(`blob ${bytes.length}\0`).update(bytes).digest("hex");
    assert.equal(actual, expected, `${track} must be the authentic original song`);
  }
});

test("original Rajko/Lowtown selection preserves inventory, money and defeated partners", () => {
  const state = { gold: 7, inventory: { seed_ordinary: 2 }, team: [{ hp: 0, xp: 17 }], musicTrack: "rajko", radioUrl: "old" };
  const before = structuredClone(state);
  assert.equal(radio.selectRadioTrack(state, "lowtown").src, radio.TRACK_LOWTOWN);
  assert.equal(radio.selectRadioTrack(state, "rajko").src, radio.TRACK_RAJKO);
  assert.deepEqual(state, before);
});

test("GEMA defaults to blocking foreign files and permits both original tracks and platform players", () => {
  const stream = radio.parseRadioInput(radio.DEFAULT_RADIO_URL);
  assert.equal(stream.label, "Chillhop");
  assert.match(radio.gemaBlockReason(stream), /GEMA-Schutz/);
  assert.equal(radio.gemaBlockReason(stream, false), null);
  assert.equal(radio.gemaBlockReason(radio.radioSelection({})), null);
  assert.equal(radio.gemaBlockReason(radio.radioSelection({ musicTrack: "lowtown" })), null);
  assert.equal(radio.gemaBlockReason(radio.parseRadioInput("https://youtu.be/abcdefghijk")), null);
  assert.equal(radio.gemaBlockReason(radio.parseRadioInput("spotify:playlist:abc123")), null);
});

test("YouTube video, shorts and playlists use the original privacy embed with working playlist IDs", () => {
  for (const url of ["https://youtu.be/abcdefghijk?list=PL_123", "https://www.youtube.com/watch?v=abcdefghijk&list=PL_123", "https://music.youtube.com/shorts/abcdefghijk?list=PL_123", "https://www.youtube-nocookie.com/embed/abcdefghijk?list=PL_123"]) {
    const parsed = radio.parseRadioInput(url);
    assert.equal(parsed.kind, "youtube");
    assert.equal(new URL(parsed.src).origin, "https://www.youtube-nocookie.com");
    assert.equal(new URL(parsed.src).searchParams.get("list"), "PL_123");
  }
  const playlist = radio.parseRadioInput("https://www.youtube.com/playlist?list=PL_123");
  assert.equal(new URL(playlist.src).pathname, "/embed/videoseries");
});

test("Spotify links and URIs preserve all six source content types", () => {
  for (const type of ["playlist", "track", "album", "artist", "episode", "show"]) {
    assert.deepEqual(radio.parseRadioInput(`spotify:${type}:abc123`), { kind: "spotify", src: `https://open.spotify.com/embed/${type}/abc123`, label: "Spotify" });
    assert.equal(radio.parseRadioInput(`https://open.spotify.com/${type}/abc123?si=example`).src, `https://open.spotify.com/embed/${type}/abc123`);
  }
});

test("invalid protocols, malformed platform IDs and credentials cannot be loaded", () => {
  for (const url of ["", "javascript:alert(1)", "http://radio.example/stream", "data:audio/mp3;base64,AA", "https://user:secret@radio.example/stream", "https://youtu.be/too-short", "https://youtube.com/watch?v=invalid", "spotify:unknown:123", "spotify:track:abc:extra", "https://open.spotify.com/unknown/123", `https://stream.example/${"x".repeat(501)}`]) assert.equal(radio.parseRadioInput(url), null, url);
});

test("failed URL selections leave the saved station unchanged; accepted links are trimmed", () => {
  const state = { musicTrack: "lowtown", radioUrl: "saved", extension: { keep: true } };
  const before = structuredClone(state);
  assert.equal(radio.selectRadioUrl(state, radio.DEFAULT_RADIO_URL).ok, false);
  assert.deepEqual(state, before);
  assert.equal(radio.selectRadioUrl(state, "javascript:bad").ok, false);
  assert.deepEqual(state, before);
  assert.equal(radio.selectRadioUrl(state, " https://youtu.be/abcdefghijk ").ok, true);
  assert.equal(state.musicTrack, "url");
  assert.equal(state.radioUrl, "https://youtu.be/abcdefghijk");
  assert.deepEqual(state.extension, { keep: true });
});

test("legacy blocked or broken stations fall back to Rajko without erasing the saved user URL", () => {
  const state = { musicTrack: "url", radioUrl: radio.DEFAULT_RADIO_URL };
  assert.equal(radio.radioSelection(state).src, radio.TRACK_RAJKO);
  assert.equal(radio.radioSelection(state, false).label, "Chillhop");
  assert.equal(state.radioUrl, radio.DEFAULT_RADIO_URL);
  assert.equal(radio.radioSelection({ musicTrack: "url", radioUrl: 42 }).src, radio.TRACK_RAJKO);
  assert.equal(radio.radioSelection({ musicTrack: "broken" }).src, radio.TRACK_RAJKO);
});
