import assert from "node:assert/strict";
import { after, test } from "node:test";
import * as THREE from "three";
import { createServer } from "vite";

const server = await createServer({
  root: new URL("..", import.meta.url).pathname,
  server: { middlewareMode: true }, appType: "custom", logLevel: "silent",
});
after(() => server.close());
const { MAPS } = await server.ssrLoadModule("/src/game/data/maps.ts");
const { getDistrictGraphics, graphicsPixelRatio, graphicsShadowSize } = await server.ssrLoadModule("/src/game/graphics-profile.ts");
const { createDistrictWeather } = await server.ssrLoadModule("/src/game/weather.ts");

test("every original map retains its identity and receives finite, appropriately sheltered district lighting", () => {
  const originalMaps = JSON.stringify(MAPS);
  assert.equal(Object.keys(MAPS).length, 22);
  for (const [id, map] of Object.entries(MAPS)) {
    const profile = getDistrictGraphics(id);
    assert.equal(profile.id, id);
    const explicit = getDistrictGraphics(id, !!map.indoor);
    assert.equal(profile.rain, explicit.rain, `${id}: default shelter matches the original map`);
    for (const color of [profile.background, profile.fog.color, profile.keyColor, profile.fillColor, profile.accent]) {
      assert.match(color, /^#[0-9a-f]{6}$/i, `${id}: usable RGB palette`);
      assert.ok(new THREE.Color(color).toArray().every(Number.isFinite));
    }
    const numbers = [profile.fog.density, profile.keyIntensity, profile.fillIntensity,
      profile.environmentIntensity, profile.rain, profile.wetness, profile.exposure,
      ...Object.values(profile.bloom), profile.contrast, profile.saturation, profile.vignette, profile.grain];
    assert.ok(numbers.every(value => Number.isFinite(value) && value >= 0), id);
    assert.ok(profile.exposure > 0 && profile.keyIntensity > 0, `${id}: readable light`);
    assert.ok(profile.rain <= 1 && profile.wetness <= 1);
    if (map.indoor) {
      assert.equal(profile.rain, 0, `${id}: no rain inside`);
      assert.ok(profile.wetness < .4, `${id}: sheltered materials`);
    } else if (id === "sewer") {
      assert.equal(profile.rain, 0, "the covered sewer stays wet without rainfall");
      assert.ok(profile.wetness > .8);
    } else {
      assert.ok(profile.rain > 0 && profile.wetness > .5, `${id}: wet outdoor district`);
    }
  }
  assert.equal(JSON.stringify(MAPS), originalMaps, "presentation does not edit source geography or interactions");
});

test("district profile callers cannot contaminate later visits or other districts", () => {
  const expected = structuredClone(getDistrictGraphics("alley"));
  const exposed = getDistrictGraphics("alley");
  exposed.fog.density = 999;
  exposed.fog.color = "#ffffff";
  exposed.bloom.strength = 999;
  exposed.rain = 0;
  assert.deepEqual(getDistrictGraphics("alley"), expected);
  assert.notEqual(getDistrictGraphics("yard").fog.density, 999);
  assert.notEqual(getDistrictGraphics("capsule").bloom.strength, 999);
  const unknown = getDistrictGraphics("future-district");
  assert.equal(unknown.id, "future-district");
  assert.ok(Number.isFinite(unknown.exposure) && unknown.exposure > 0);
});

test("phone DPR3 and desktop 4K obey their pixel budgets while high quality can reach native 4K", () => {
  for (const viewport of [
    { width: 390, height: 844, native: 3, mobile: true },
    { width: 1920, height: 1080, native: 2, mobile: false },
    { width: 3840, height: 2160, native: 2, mobile: false },
  ]) {
    const ratios = {};
    for (const quality of ["low", "auto", "high"]) {
      const ratio = graphicsPixelRatio(viewport.width, viewport.height, viewport.native, quality, viewport.mobile);
      const budget = quality === "low" ? 1_200_000 : quality === "high" ? 8_294_400 : viewport.mobile ? 1_600_000 : 3_686_400;
      assert.ok(Number.isFinite(ratio) && ratio > 0 && ratio <= viewport.native);
      assert.ok(viewport.width * viewport.height * ratio ** 2 <= budget + .01, `${quality}: pixel budget`);
      ratios[quality] = ratio;
    }
    assert.ok(ratios.low <= ratios.auto && ratios.auto <= ratios.high);
  }
  assert.equal(graphicsPixelRatio(1920, 1080, 2, "high", false), 2);
  assert.equal(graphicsPixelRatio(3840, 2160, 2, "high", false), 1);
  assert.ok(graphicsPixelRatio(390, 844, 3, "auto", true) < 2, "phone DPR does not force native supersampling");
  assert.ok(Number.isFinite(graphicsPixelRatio(0, 0, 0, "auto", true)), "pre-layout viewport is safe");
});

test("shadow budgets reduce Auto/Low work while High and A/B baseline retain v51 detail", () => {
  for (const mobile of [false, true]) {
    const original = mobile ? 1024 : 2048;
    for (const quality of ["low", "auto", "high"]) {
      assert.equal(graphicsShadowSize(quality, mobile, false), original);
      const size = graphicsShadowSize(quality, mobile);
      assert.ok(size <= original && Number.isInteger(Math.log2(size)));
    }
    assert.equal(graphicsShadowSize("high", mobile), original);
    assert.equal(graphicsShadowSize("auto", mobile), 1024);
    assert.equal(graphicsShadowSize("low", mobile), 512);
  }
  assert.equal(graphicsShadowSize("auto", false) ** 2 / 2048 ** 2, .25);
});

function weatherFixture(mobile) {
  const parent = new THREE.Group();
  const weather = createDistrictWeather(parent, mobile);
  const root = parent.children[0];
  const meshes = root.children;
  const resources = meshes.flatMap(mesh => [mesh.geometry, mesh.material]);
  return { parent, root, meshes, resources, weather };
}

test("weather is bounded instanced geometry reused across outdoor, indoor and wet-sewer visits", () => {
  const phone = weatherFixture(true), desktop = weatherFixture(false);
  const player = new THREE.Object3D();
  player.position.set(37, 2, -13); player.rotation.set(.2, .4, .1);
  player.userData = { hp: 0, xp: 137, inventory: { seed_ordinary: 3 } };
  const originalPlayer = player.toJSON();
  try {
    for (const fixture of [phone, desktop]) {
      const initialResources = [...fixture.resources];
      for (const mesh of fixture.meshes) {
        assert.equal(mesh.geometry.isInstancedBufferGeometry, true);
        const seeds = mesh.geometry.getAttribute("aSeed");
        assert.ok(seeds.array.every(value => Number.isFinite(value) && value >= 0 && value <= 1));
      }
      for (let i = 0; i < 6; i++) {
        fixture.weather.setStyle({ rain: 1, fill: "#56778a", accent: "#ffb46a", indoor: false });
        const outdoor = fixture.weather.getDiagnostics();
        assert.ok(outdoor.rainDrops > 0 && outdoor.rainDrops <= 1100);
        assert.ok(outdoor.rippleCount > 0 && outdoor.rippleCount <= 96);
        for (const dt of [0, .016, -.5, 1000]) fixture.weather.update(player, dt);
        fixture.weather.setStyle({ rain: 1, fill: "#56778a", accent: "#ffb46a", indoor: true });
        assert.deepEqual(fixture.weather.getDiagnostics(), { rainDrops: 0, rippleCount: 0, mistPatches: 0 });
        assert.equal(fixture.root.visible, false);
        fixture.weather.setStyle({ rain: 0, fill: "#56778a", accent: "#6ed6b3", indoor: false });
        const sewer = fixture.weather.getDiagnostics();
        assert.equal(sewer.rainDrops, 0); assert.equal(sewer.rippleCount, 0);
        assert.ok(sewer.mistPatches > 0, "damp covered routes retain their low haze");
        assert.deepEqual(fixture.meshes.flatMap(mesh => [mesh.geometry, mesh.material]), initialResources);
      }
      fixture.weather.setStyle({ rain: 1, fill: "#56778a", accent: "#ffb46a", indoor: false });
    }
    assert.ok(phone.weather.getDiagnostics().rainDrops < desktop.weather.getDiagnostics().rainDrops);
    assert.ok(phone.weather.getDiagnostics().rippleCount < desktop.weather.getDiagnostics().rippleCount);
    assert.deepEqual(player.toJSON(), originalPlayer, "weather only reads position; player and gameplay metadata survive");
  } finally { phone.weather.dispose(); desktop.weather.dispose(); }
});

test("weather disposal releases each owned GPU resource and leaves the surrounding scene untouched", () => {
  const fixture = weatherFixture(true);
  const external = new THREE.Mesh(new THREE.BoxGeometry(), new THREE.MeshBasicMaterial());
  fixture.parent.add(external);
  let externalDisposals = 0;
  for (const resource of [external.geometry, external.material]) resource.addEventListener("dispose", () => externalDisposals++);
  const disposed = new Map(fixture.resources.map(resource => [resource, 0]));
  for (const resource of fixture.resources) resource.addEventListener("dispose", () => disposed.set(resource, disposed.get(resource) + 1));
  fixture.weather.dispose();
  assert.equal(fixture.root.parent, null);
  assert.deepEqual(fixture.parent.children, [external]);
  assert.equal(externalDisposals, 0);
  assert.equal(disposed.size, 6);
  assert.ok([...disposed.values()].every(count => count === 1));
  external.geometry.dispose(); external.material.dispose();
});
