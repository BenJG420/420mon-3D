import assert from "node:assert/strict";
import test from "node:test";
import { createHash } from "node:crypto";
import { fileURLToPath } from "node:url";
import { build } from "esbuild";

const compiled = await build({
  stdin: { contents: `export * from "./src/game/graffiti-catalog.ts";
    export * from "./src/game/graffiti-symbols.ts";`, resolveDir: fileURLToPath(new URL("../", import.meta.url)) },
  bundle: true, write: false, platform: "node", format: "esm",
});
const { GRAFFITI_CATALOG, GRAFFITI_DISTRICTS, GRAFFITI_SUBJECTS, districtGraffiti, paintGraffiti, drawGraffitiSymbol } = await import(
  `data:text/javascript;base64,${Buffer.from(compiled.outputFiles[0].text).toString("base64")}`,
);
const digest = value => createHash("sha256").update(JSON.stringify(value)).digest("hex");

function canvasRecorder() {
  const commands = []; let depth = 0;
  const ctx = new Proxy({}, {
    get(target, key) {
      if (key in target) return target[key];
      return (...args) => {
        for (const arg of args) if (typeof arg === "number") assert.ok(Number.isFinite(arg), `${String(key)} receives finite coordinates`);
        commands.push([key, ...args]);
        if (key === "save") depth++;
        if (key === "restore") { depth--; assert.ok(depth >= 0, "canvas state is never restored too often"); }
      };
    },
    set(target, key, value) { commands.push(["set", key, value]); target[key] = value; return true; },
  });
  return { ctx, commands, depth: () => depth };
}

test("catalog contains 420 distinct authored subject/layout combinations in fourteen district sets", () => {
  assert.equal(GRAFFITI_CATALOG.length, 420);
  assert.equal(GRAFFITI_DISTRICTS.length, 14);
  assert.equal(GRAFFITI_SUBJECTS.length, 42);
  assert.equal(new Set(GRAFFITI_CATALOG.map(motif => motif.id)).size, 420);
  assert.equal(new Set(GRAFFITI_CATALOG.map(motif => `${motif.subject}:${motif.composition}`)).size, 420);
  assert.equal(new Set(GRAFFITI_CATALOG.map(motif => motif.title)).size, 420);
  assert.deepEqual([...new Set(GRAFFITI_CATALOG.map(motif => motif.subject))], GRAFFITI_SUBJECTS);
  assert.ok(Object.isFrozen(GRAFFITI_CATALOG));
  for (const district of GRAFFITI_DISTRICTS) {
    const motifs = districtGraffiti(district);
    assert.equal(motifs.length, 30);
    assert.strictEqual(motifs, districtGraffiti(district), "selection does not allocate new catalogs on district changes");
    assert.ok(Object.isFrozen(motifs));
    assert.ok(motifs.every(motif => motif.district === district && Object.isFrozen(motif)));
    assert.equal(new Set(motifs.map(motif => motif.subject)).size, 3);
    for (const subject of new Set(motifs.map(motif => motif.subject))) {
      assert.deepEqual(motifs.filter(motif => motif.subject === subject).map(motif => motif.composition), [0, 1, 2, 3, 4, 5, 6, 7, 8, 9]);
    }
  }
  assert.strictEqual(districtGraffiti("missing-district"), districtGraffiti("alley"));
});

test("42 illustration families have distinct vector geometry without glyph or image substitutes", () => {
  const signatures = new Set();
  for (const subject of GRAFFITI_SUBJECTS) {
    const { ctx, commands, depth } = canvasRecorder();
    drawGraffitiSymbol(ctx, subject, "#eeeeee", "#ff9955");
    assert.equal(depth(), 0, `${subject} preserves caller canvas state`);
    assert.ok(commands.some(([name]) => name === "fill"), `${subject} has solid illustrated geometry`);
    assert.ok(commands.some(([name]) => name === "stroke"), `${subject} has drawn contours`);
    assert.ok(!commands.some(([name]) => ["fillText", "strokeText", "drawImage"].includes(name)), `${subject} is illustrated rather than a font glyph`);
    assert.ok(commands.length < 1700, `${subject} has a bounded atlas-paint cost`);
    const geometry = commands.filter(([name]) => !["set", "fill", "stroke", "save", "restore"].includes(name));
    signatures.add(digest(geometry));
  }
  assert.equal(signatures.size, 42, "each district contributes three different vector illustrations");
});

test("ten layouts change geometry independently of motif labels, colors and spray seeds", () => {
  const signatures = new Set(), base = GRAFFITI_CATALOG[0];
  for (let composition = 0; composition < 10; composition++) {
    const { ctx, commands, depth } = canvasRecorder();
    paintGraffiti(ctx, { ...base, composition }, 256, 256);
    assert.equal(depth(), 0);
    const geometry = commands.filter(([name]) => !["set", "fillText", "strokeText", "fill", "stroke", "save", "restore"].includes(name));
    signatures.add(digest(geometry));
  }
  assert.equal(signatures.size, 10, "catalog variety comes from different compositions as well as its subjects");
});

test("every motif paints deterministically into a clipped atlas tile with bounded commands", () => {
  for (const motif of GRAFFITI_CATALOG) {
    const first = canvasRecorder(), second = canvasRecorder();
    paintGraffiti(first.ctx, motif, 256, 256);
    paintGraffiti(second.ctx, motif, 256, 256);
    assert.equal(digest(first.commands), digest(second.commands), `${motif.title} is stable across travel/reload`);
    assert.equal(first.depth(), 0);
    assert.ok(first.commands.length < 5000, `${motif.title} stays within its static paint budget`);
    assert.deepEqual(first.commands.slice(0, 5), [["save"], ["beginPath"], ["rect", 0, 0, 256, 256], ["clip"], ["scale", .64, 256 / 240]]);
  }
  const mobile = canvasRecorder();
  paintGraffiti(mobile.ctx, GRAFFITI_CATALOG[0], 128, 128);
  assert.deepEqual(mobile.commands[4], ["scale", .32, 128 / 240], "same logical art supports the smaller mobile atlas");
  const invalid = canvasRecorder();
  for (const [width, height] of [[0, 128], [-1, 128], [128, NaN], [Infinity, 128]]) paintGraffiti(invalid.ctx, GRAFFITI_CATALOG[0], width, height);
  assert.deepEqual(invalid.commands, []);
});
