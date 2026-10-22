import assert from "node:assert/strict";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { build } from "esbuild";

// Bundle the real TypeScript/data modules without introducing another test
// runtime or changing the production compiler configuration.
const root = fileURLToPath(new URL("../", import.meta.url));
const compiled = await build({
  stdin: {
    contents: 'export * from "./src/game/worldGeometry.ts"; export * from "./src/game/starter-state.ts"; export { MAPS, CAPSULE_SPAWN_X, CAPSULE_SPAWN_Y } from "./src/game/data/maps.ts"; export { createDistrictWorld } from "./src/game/world.ts"; export { getSave, saveProgress } from "./src/game/save.ts"; export { Scene, Group, Mesh, BoxGeometry, MeshBasicMaterial } from "three";',
    resolveDir: root,
  },
  bundle: true,
  write: false,
  platform: "node",
  format: "esm",
});
const { WORLD_SCALE, mapToWorld, worldToMap, collidesOnMap, safeSpawn, MAPS, CAPSULE_SPAWN_X, CAPSULE_SPAWN_Y,
  hasChosenStarter, isTakenStarter, createDistrictWorld, getSave, saveProgress, Scene, Group, Mesh, BoxGeometry, MeshBasicMaterial } = await import(
  `data:text/javascript;base64,${Buffer.from(compiled.outputFiles[0].text).toString("base64")}`
);

const map = (walls = [], objs = []) => ({ id: "fixture", name: "Fixture", w: 200, h: 150, bg: "", walls, objs, zones: [] });
const at = (definition, x, y, radius = 0.48) => {
  const world = mapToWorld(definition, x, y);
  return collidesOnMap(definition, world.x, world.z, radius);
};
const approximately = (actual, expected) => assert.ok(Math.abs(actual - expected) < 1e-8, `${actual} != ${expected}`);

test("the 22 original maps keep their coordinate topology after 3D conversion", () => {
  assert.equal(Object.keys(MAPS).length, 22);
  assert.equal(WORLD_SCALE, 0.06);
  for (const definition of Object.values(MAPS)) {
    assert.deepEqual(mapToWorld(definition, definition.w / 2, definition.h / 2), { x: 0, z: 0 });
    for (const source of [{ x: 0, y: 0 }, { x: 32.125, y: 54.75 }, { x: definition.w, y: definition.h }]) {
      const world = mapToWorld(definition, source.x, source.y);
      const result = worldToMap(definition, world.x, world.z);
      approximately(result.x, source.x);
      approximately(result.y, source.y);
    }
    for (const wall of definition.walls) {
      const x = wall.x + wall.w / 2;
      const y = wall.y + wall.h / 2;
      if (x >= 0 && y >= 0 && x <= definition.w && y <= definition.h) assert.equal(at(definition, x, y), true, `${definition.id}: wall centre is passable`);
    }
  }
});

test("collision uses the original wall thickness and a round player footprint", () => {
  const definition = map([{ x: 50, y: 50, w: 1, h: 20 }]);
  assert.equal(at(definition, 50.5, 60), true);
  assert.equal(at(definition, 42, 60), false, "tangent to the 8-pixel player radius");
  assert.equal(at(definition, 42.01, 60), true);
  assert.equal(at(definition, 44, 44), false, "diagonal corner clearance is not an oversized box");
  assert.equal(at(definition, 45, 45), true);
});

test("doors, manholes and signs never obstruct interaction or passage", () => {
  for (const kind of ["door", "manhole", "sign", "wild", "npc", "shop", "stall", "bin", "lamp", "mattress", "prop", "pot", "bed"]) {
    const object = { id: kind, kind, x: 50, y: 50, w: 20, h: 20, label: kind, block: true };
    assert.equal(at(map([], [object]), 60, 60), ["prop", "pot", "bed"].includes(kind), kind);
  }
  const lootCrate = { id: "loot", kind: "prop", x: 50, y: 50, w: 20, h: 20, label: "Kiste", sprite: "crate", block: true };
  assert.equal(at(map([], [lootCrate]), 60, 60), false, "ordinary searchable props follow the original pass-through rule");
  assert.equal(at(map([], [{ ...lootCrate, id: "felix_crate" }]), 60, 60), true, "Felix's original furniture remains solid");
});

test("north openings are walkable while outer bounds retain the player radius", () => {
  const definition = map([{ x: 0, y: 0, w: 80, h: 20 }, { x: 120, y: 0, w: 80, h: 20 }]);
  assert.equal(at(definition, 100, 9), false);
  assert.equal(at(definition, 100, 7), true);
  assert.equal(at(definition, 70, 9), true);
  assert.equal(at(definition, 199, 75), true);
  assert.equal(at(definition, -1, 75), true);
});

test("safe spawns retain valid saves and find nearby free space around overlapping walls", () => {
  const definition = map([{ x: 70, y: 20, w: 60, h: 70 }, { x: 90, y: 70, w: 60, h: 40 }]);
  assert.deepEqual(safeSpawn(definition, 40, 120), { x: 40, y: 120 });
  const nearest = safeSpawn(definition, 100, 30);
  approximately(nearest.x, 100);
  approximately(nearest.y, 11.98);
  assert.equal(at(definition, nearest.x, nearest.y), false);
  const overlap = safeSpawn(definition, 100, 80);
  assert.equal(at(definition, overlap.x, overlap.y), false);
  const repaired = safeSpawn(definition, Number.NaN, Number.POSITIVE_INFINITY);
  assert.equal(at(definition, repaired.x, repaired.y), false);
  assert.throws(() => safeSpawn(map([{ x: 0, y: 0, w: 200, h: 150 }]), 100, 75), /no passable spawn/);
});

test("every original door target arrives in a free interior position", () => {
  let targets = 0;
  const repaired = [];
  for (const definition of Object.values(MAPS)) for (const object of definition.objs) {
    if (!object.door || object.dx === undefined || object.dy === undefined) continue;
    const destination = MAPS[object.door];
    assert.ok(destination, `${definition.id}/${object.id}: destination ${object.door} is missing`);
    const spawn = safeSpawn(destination, object.dx, object.dy);
    assert.equal(at(destination, spawn.x, spawn.y), false, `${definition.id}/${object.id}: spawn collides in ${object.door}`);
    if (at(destination, object.dx, object.dy)) repaired.push(`${definition.id}/${object.id} -> ${object.door}`);
    targets++;
  }
  assert.ok(targets > 40, `only ${targets} transitions were checked`);
  console.info(`Checked ${targets} original transition targets; ${repaired.length} need collision-safe arrival: ${repaired.join(", ")}`);
});

test("original Kapsel start and legacy map-centre saves stay reachable", () => {
  const start = safeSpawn(MAPS.capsule, CAPSULE_SPAWN_X, CAPSULE_SPAWN_Y);
  assert.deepEqual(start, { x: CAPSULE_SPAWN_X, y: CAPSULE_SPAWN_Y });
  for (const definition of Object.values(MAPS)) {
    const legacy = worldToMap(definition, 0, 0);
    const spawn = safeSpawn(definition, legacy.x, legacy.y);
    assert.equal(at(definition, spawn.x, spawn.y), false, `${definition.id}: old centre save is stuck`);
    const outside = safeSpawn(definition, -1000, definition.h + 1000);
    assert.equal(at(definition, outside.x, outside.y), false, `${definition.id}: invalid old coordinates are stuck`);
  }
});

test("only the saved starter choice removes the case from collision and safe spawn", () => {
  const capsule = MAPS.capsule, starter = capsule.objs.find(object => object.id === "starter");
  const centre = { x: starter.x + starter.w / 2, y: starter.y + starter.h / 2 };
  const position = mapToWorld(capsule, centre.x, centre.y);
  for (const starterId of [undefined, null, "", "  ", false, true, 42, {}]) {
    assert.equal(hasChosenStarter({ starterId }), false);
    assert.equal(isTakenStarter(starter, starterId), false);
    assert.equal(collidesOnMap(capsule, position.x, position.z, .48, [], starterId), true);
    assert.notDeepEqual(safeSpawn(capsule, centre.x, centre.y, .48, [], starterId), centre);
  }
  for (const starterId of ["mon_budling", "mon_glitchbitch", "mon_neonpunx", "legacy-chosen-species"]) {
    assert.equal(hasChosenStarter({ starterId }), true);
    assert.equal(isTakenStarter(starter, starterId), true);
    assert.equal(collidesOnMap(capsule, position.x, position.z, .48, [], starterId), false);
    assert.deepEqual(safeSpawn(capsule, centre.x, centre.y, .48, [], starterId), centre);
    assert.equal(isTakenStarter(capsule.objs.find(object => object.id === "felix_crate"), starterId), false);
    const bed = capsule.objs.find(object => object.kind === "bed");
    const bedCentre = mapToWorld(capsule, bed.x + bed.w / 2, bed.y + bed.h / 2);
    assert.equal(collidesOnMap(capsule, bedCentre.x, bedCentre.z, .48, [], starterId), true, "other furniture remains solid");
  }
});

test("world interaction, original door gates and resource ownership work together", () => {
  const savedGlobals = Object.fromEntries(["window", "document", "localStorage", "CustomEvent"].map(key => [key, Object.getOwnPropertyDescriptor(globalThis, key)]));
  const data = new Map([["420mon-progress-v1", JSON.stringify({ gold: 150, map: "retired-map", x: 210, y: 15 })]]);
  const events = new Map();
  let modalOpen = false, prompt;
  const context = new Proxy({}, { get: (_, name) => name === "createRadialGradient" ? () => ({ addColorStop() {} }) : name === "createImageData" ? (width, height) => ({ data: new Uint8ClampedArray(width * height * 4), width, height }) : () => {} });
  const app = { append(element) { if (element.className?.includes("world-interaction")) prompt = element; } };
  globalThis.localStorage = { getItem: key => data.get(key) ?? null, setItem: (key, value) => data.set(key, value) };
  globalThis.document = {
    body: { classList: { contains: () => false } },
    createElement: tag => tag === "canvas" ? { width: 0, height: 0, getContext: () => context } : { dataset: {}, setAttribute() {} },
    querySelector: query => query === "#app" ? app : modalOpen ? {} : null,
  };
  globalThis.window = {
    addEventListener(name, fn) { const list = events.get(name) ?? []; list.push(fn); events.set(name, list); },
    dispatchEvent(event) { for (const fn of events.get(event.type) ?? []) fn(event); return !event.defaultPrevented; },
  };
  globalThis.CustomEvent = class extends Event { constructor(type, opts) { super(type); this.detail = opts?.detail; } };
  const pressE = () => {
    const event = new Event("keydown", { cancelable: true });
    Object.defineProperties(event, { key: { value: "e" }, repeat: { value: false }, target: { value: { closest: () => null } } });
    window.dispatchEvent(event); return event;
  };
  try {
    const scene = new Scene(), player = new Group();
    const world = createDistrictWorld(scene, player);
    assert.equal(world.current(), "capsule");
    assert.deepEqual(world.getMapInfo().player, { x: CAPSULE_SPAWN_X, y: CAPSULE_SPAWN_Y }, "invalid saved map uses the original Kapsel spawn");
    let interactionCount = 0, interacted;
    world.setInteractionHandler(object => { interactionCount++; interacted = object; });
    player.position.copy(world.toWorld(77, 53)); world.update();
    assert.equal(prompt.hidden, false, "closed Grow backdrop must not suppress every world prompt");
    assert.equal(pressE().defaultPrevented, true, "a world action consumes E before encounters");
    assert.equal(interacted.kind, "pot");
    modalOpen = true;
    world.update(); assert.equal(prompt.hidden, true);
    pressE(); prompt.onclick();
    assert.equal(interactionCount, 1, "keyboard and stale touch prompt are inert behind a dialog");
    modalOpen = false;

    // Use the actual save event and world object graph, without rebuilding the room.
    player.position.copy(world.toWorld(162, 110)); world.update();
    const caseGroup = world.getRoot().getObjectByName("map-object:starter");
    assert.ok(caseGroup, "fresh saves retain the visible case and label");
    assert.equal(prompt.dataset.object, "starter");
    assert.equal(pressE().defaultPrevented, true);
    assert.equal(interacted.kind, "starter");
    const caseCentre = world.toWorld(162, 84);
    assert.equal(world.collides(caseCentre.x, caseCentre.z), true);
    const growMesh = new Mesh(new BoxGeometry(), new MeshBasicMaterial());
    world.getRoot().add(growMesh);
    let caseDisposed = false, growDisposed = false;
    caseGroup.traverse(object => { if (object.isMesh) object.geometry.addEventListener("dispose", () => { caseDisposed = true; }); });
    growMesh.geometry.addEventListener("dispose", () => { growDisposed = true; });
    const otherFurniture = world.getRoot().getObjectByName("map-object:bed");
    assert.equal(saveProgress({ starterId: "mon_budling" }), true);
    assert.equal(world.getRoot().getObjectByName("map-object:starter"), undefined);
    assert.equal(caseDisposed, true);
    assert.equal(prompt.hidden, true, "save event also clears the stale touch prompt");
    assert.equal(growMesh.parent, world.getRoot());
    assert.equal(growDisposed, false, "removing the case preserves independently owned Grow meshes");
    assert.strictEqual(world.getRoot().getObjectByName("map-object:bed"), otherFurniture);
    assert.equal(world.collides(caseCentre.x, caseCentre.z), false);
    const afterChoiceCount = interactionCount;
    pressE(); prompt.onclick();
    assert.equal(interactionCount, afterChoiceCount, "neither keyboard nor stale touch action can reopen the removed case");
    world.travel("studio"); world.travel("capsule", 162, 84);
    assert.equal(world.getRoot().getObjectByName("map-object:starter"), undefined, "returning to the room retains the choice");
    assert.deepEqual(world.getMapInfo().player, { x: 162, y: 84 }, "spawn no longer pushes the player away from the empty footprint");

    // Original main street exit needs both Bolt's quest and the level band.
    world.travel("alley", 2530, 716);
    pressE(); assert.equal(world.current(), "alley");
    getSave().quests.q1_bolt = "done";
    pressE(); assert.equal(world.current(), "alley", "quest alone does not bypass original market level gate");
    assert.match(prompt.textContent, /ab Lv\. 6/);
    getSave().trainerLv = 6;
    pressE(); assert.equal(world.current(), "market");

    const hatch = MAPS.sewer.objs.find(object => object.kind === "manhole" && object.door === "scrap");
    assert.ok(hatch);
    getSave().trainerLv = 1; getSave().quests.q1_bolt = "active";
    world.travel("sewer", hatch.x + hatch.w / 2, hatch.y + hatch.h / 2);
    pressE(); assert.equal(world.current(), "scrap", "original underground route bypasses Bolt and district level requirements");

    const merchant = MAPS.market.objs.find(object => object.kind === "stall");
    assert.ok(merchant);
    let shopObject;
    world.openShop(object => { shopObject = object; });
    world.travel("market", merchant.x + merchant.w / 2, merchant.y + merchant.h / 2);
    pressE();
    assert.equal(shopObject?.id, merchant.id, "merchant callback has priority over the home handler and receives its source object");

    const root = world.getRoot();
    const oldOccluders = world.getOccluders();
    assert.ok(oldOccluders.length > 1);
    assert.equal(new Set(oldOccluders.map(mesh => mesh.material)).size, oldOccluders.length, "camera fading has an independent material per occluder");
    let sharedTextureDisposed = false;
    oldOccluders[0].material.map.addEventListener("dispose", () => { sharedTextureDisposed = true; });
    const foreignGeometry = new BoxGeometry(), foreign = new Mesh(foreignGeometry, new MeshBasicMaterial());
    let foreignDisposed = false, worldDisposed = false;
    foreignGeometry.addEventListener("dispose", () => { foreignDisposed = true; });
    root.add(foreign);
    root.traverse(object => { if (object.isMesh && object.userData.worldOwned) object.geometry.addEventListener("dispose", () => { worldDisposed = true; }); });
    world.travel("studio");
    assert.equal(worldDisposed, true, "old map geometry is released");
    assert.equal(foreignDisposed, false, "map cleanup never disposes shared Grow or encounter resources");
    assert.equal(sharedTextureDisposed, false, "camera material cleanup retains shared map textures");
    const arrival = world.getMapInfo().player;
    assert.equal(at(MAPS.studio, arrival.x, arrival.y), false);
    const studioChildren = root.children.length;
    world.travel("capsule"); world.travel("studio");
    assert.equal(root.children.length, studioChildren, "only one active map's objects remain after revisiting rooms");
    world.travel("capsule", 162, 84);
    const loadedWorld = createDistrictWorld(new Scene(), new Group());
    assert.equal(loadedWorld.getRoot().getObjectByName("map-object:starter"), undefined, "initial world construction with an old saved choice creates no case");
    assert.equal(loadedWorld.collides(caseCentre.x, caseCentre.z), false);
  } finally {
    for (const [key, descriptor] of Object.entries(savedGlobals)) {
      if (descriptor) Object.defineProperty(globalThis, key, descriptor); else delete globalThis[key];
    }
  }
});
