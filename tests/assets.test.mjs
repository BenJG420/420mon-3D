import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import test from "node:test";
import { build } from "esbuild";

const root = fileURLToPath(new URL("../", import.meta.url));
const bundled = await build({
  stdin: {
    contents: 'export { DEX, DEX_ORDER } from "./src/game/data/dex.ts"; export { spriteUrl, SPRITE_FRAME } from "./src/game/sprites.ts";',
    resolveDir: root, loader: "ts",
  },
  bundle: true, platform: "node", format: "esm", write: false,
  define: { "import.meta.env.BASE_URL": '"/420mon-3D/"' },
});
const { DEX, DEX_ORDER, spriteUrl, SPRITE_FRAME } = await import(
  `data:text/javascript;base64,${Buffer.from(bundled.outputFiles[0].text).toString("base64")}`
);

function originalPng(file) {
  if (file.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))) return file;
  const embedded = file.toString("utf8").match(/data:image\/png;base64,([A-Za-z0-9+/=]+)/);
  assert.ok(embedded, "SVG wrapper must contain the original PNG");
  return Buffer.from(embedded[1], "base64");
}

test("all 420 canonical Dex species have a complete local original sheet", async () => {
  assert.equal(DEX_ORDER.length, 420);
  for (const id of DEX_ORDER) {
    const relativeUrl = spriteUrl(DEX[id].sprite, "");
    assert.ok(!relativeUrl.includes("github"), id);
    const png = originalPng(await readFile(new URL(`../public/${relativeUrl}`, import.meta.url)));
    assert.deepEqual([...png.subarray(0, 8)], [137, 80, 78, 71, 13, 10, 26, 10], id);
    assert.equal(png.toString("ascii", 12, 16), "IHDR", id);
    assert.equal(png.readUInt32BE(16), 256, `${id}: full sheet width`);
    assert.equal(png.readUInt32BE(20), 256, `${id}: full sheet height`);
  }
});

test("restored legendary PNGs match the original repository blob hashes", async () => {
  const sourceBlobs = {
  "kerboss": "62c666daef714bc5ec5bbdde1dd47dd7928f815f",
  "kronkush": "5bfadcc0ef93e11b9832f232798fe69e53f04870",
  "rootkaiser": "62604531fa473fcc31679ea185b6f97569d58aa3",
  "glutarch": "3dbd6503bf9a27563a0b588651a953756512cbaa",
  "rohrlethe": "07ffbfc5a001a0daca301e93a0e644d1c32bbce5",
  "vialith": "01fe2ec423790c88663c78627746818f4d6e563c",
  "cagekaiser": "8862f286e7797e2eb0577391792077ed90334945",
  "noxarch": "035fdcc4c68dbe2da02c58d9849f65a328c8aa23",
  "velouryx": "6fef39c3b51c234c72bb6729741244620720a6be",
  "slagodon": "d2739e01c6078a041e2189454c18fdc184e8b7c1"
};
  for (const [slug, sha] of Object.entries(sourceBlobs)) {
    assert.equal(spriteUrl(slug), `/420mon-3D/game/sprites/${slug}.png`);
    const png = await readFile(new URL(`../public/game/sprites/${slug}.png`, import.meta.url));
    const blobSha = createHash("sha1").update(`blob ${png.length}\0`).update(png).digest("hex");
    assert.equal(blobSha, sha, `${slug}: unchanged original bytes`);
  }
});

test("world UVs select exactly one top-left pose with Three.js image flip", () => {
  assert.deepEqual(SPRITE_FRAME, { repeatX: 0.5, repeatY: 0.5, offsetX: 0, offsetY: 0.5 });
  assert.equal(spriteUrl("budling"), "/420mon-3D/game/sprites/budling.png");
  assert.equal(spriteUrl("moosling"), "/420mon-3D/game/sprites/moosling.svg");
});
