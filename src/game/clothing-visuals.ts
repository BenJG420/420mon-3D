import * as THREE from "three";

type ClothingRig = {
  character: THREE.Group;
  torso: THREE.Mesh;
  leftArm: THREE.Group;
  rightArm: THREE.Group;
  leftLeg: THREE.Group;
  rightLeg: THREE.Group;
  leftArmMesh: THREE.Mesh;
  rightArmMesh: THREE.Mesh;
  leftLegMesh: THREE.Mesh;
  rightLegMesh: THREE.Mesh;
  skin: THREE.Material;
  shoulderTrim: THREE.Object3D;
  jacketAccent: THREE.Object3D;
  belt: THREE.Object3D;
};

type Layers = {
  id: string;
  body: THREE.Group;
  leftArm: THREE.Group;
  rightArm: THREE.Group;
  leftLeg: THREE.Group;
  rightLeg: THREE.Group;
  shirt: THREE.Material | THREE.Material[];
  pants: THREE.Material | THREE.Material[];
  bareLegs: boolean;
};

/** Source-sheet clothes fitted to the existing animated rig; owns only its layers. */
export function createClothingVisuals(rig: ClothingRig) {
  const geometries = new Set<THREE.BufferGeometry>();
  const materials = new Set<THREE.Material>();
  const originalMeshes = [rig.torso, rig.leftArmMesh, rig.rightArmMesh, rig.leftLegMesh, rig.rightLegMesh]
    .map(mesh => ({ mesh, material: mesh.material, visible: mesh.visible }));
  const originalTrim = [rig.shoulderTrim, rig.jacketAccent, rig.belt]
    .map(object => ({ object, visible: object.visible }));
  const layers = new Map<string, Layers>();
  let outfit = "nude";
  let disposed = false;

  function ownGeometry<T extends THREE.BufferGeometry>(geometry: T): T {
    geometries.add(geometry);
    return geometry;
  }
  const cube = ownGeometry(new THREE.BoxGeometry(1, 1, 1));
  const cylinder = ownGeometry(new THREE.CylinderGeometry(1, 1, 1, 10));
  const ring = ownGeometry(new THREE.TorusGeometry(.064, .015, 6, 12));
  function cloth(color: number, roughness = .88, metalness = 0) {
    const material = new THREE.MeshStandardMaterial({ color, roughness, metalness });
    materials.add(material);
    return material;
  }
  // The actual original sheets guide these colors, including the cyan Lackjacke.
  const black = cloth(0x181818);
  const charcoal = cloth(0x303030);
  const asphalt = cloth(0x303048);
  const olive = cloth(0x607848);
  const green = cloth(0x306030);
  const lime = cloth(0x60b818);
  const seam = cloth(0xc5c6bd);
  const navy = cloth(0x181830);
  const stripe = cloth(0x60c030);
  const yellow = cloth(0xf0c018, .55);
  const brown = cloth(0x603018);
  const brownLight = cloth(0x784830);
  const leather = cloth(0x202023, .59, .08);
  const cyan = cloth(0x30a8c0, .17, .46);
  const gold = cloth(0xc8a84a, .42, .55);
  const silver = cloth(0xb0b5b7, .35, .6);

  function mesh(parent: THREE.Object3D, geometry: THREE.BufferGeometry, material: THREE.Material,
    size: [number, number, number], position: [number, number, number], name: string) {
    const part = new THREE.Mesh(geometry, material);
    part.name = name;
    part.scale.set(...size);
    part.position.set(...position);
    part.castShadow = true;
    parent.add(part);
    return part;
  }
  function box(parent: THREE.Object3D, material: THREE.Material, size: [number, number, number],
    position: [number, number, number], name: string) {
    return mesh(parent, cube, material, size, position, name);
  }
  function make(id: string, shirt: THREE.Material | THREE.Material[], pants: THREE.Material | THREE.Material[], bareLegs = false) {
    const layer = { id, shirt, pants, bareLegs } as Layers;
    for (const key of ["body", "leftArm", "rightArm", "leftLeg", "rightLeg"] as const) {
      const group = new THREE.Group();
      group.name = `clothing-${id}-${key}`;
      group.userData.clothingOutfit = id;
      group.userData.clothingPart = key;
      group.visible = false;
      (key === "body" ? rig.character : rig[key]).add(group);
      layer[key] = group;
    }
    layers.set(id, layer);
    return layer;
  }
  function sleeves(layer: Layers, material: THREE.Material, width = .26, length = .69) {
    for (const side of ["leftArm", "rightArm"] as const) {
      box(layer[side], material, [width, length, .32], [0, -length / 2, 0], "sleeve");
    }
  }
  function cuffs(layer: Layers, material: THREE.Material) {
    for (const side of ["leftArm", "rightArm"] as const) {
      box(layer[side], material, [.275, .09, .335], [0, -.665, 0], "cuff");
    }
  }
  function shorts(layer: Layers) {
    for (const side of ["leftLeg", "rightLeg"] as const) {
      const material = side === "leftLeg" ? originalMeshes[3].material : originalMeshes[4].material;
      const part = new THREE.Mesh(cube, material);
      part.name = "shorts";
      part.scale.set(.315, .265, .34);
      part.position.y = -.13;
      part.castShadow = true;
      layer[side].add(part);
      box(layer[side], seam, [.319, .025, .345], [0, -.26, 0], "shorts-hem");
    }
  }
  function openJacket(layer: Layers, material: THREE.Material, width = .87, height = .88) {
    const y = 1.36;
    box(layer.body, material, [width, height, .12], [0, y, -.245], "jacket-back");
    box(layer.body, material, [.115, height, .48], [-width / 2 + .04, y, 0], "jacket-side");
    box(layer.body, material, [.115, height, .48], [width / 2 - .04, y, 0], "jacket-side");
    for (const sign of [-1, 1]) {
      box(layer.body, material, [.28, height, .085], [sign * (width / 2 - .15), y, .255], "open-front");
      const lapel = box(layer.body, seam, [.035, height * .84, .02], [sign * .14, y + .015, .31], "jacket-seam");
      lapel.rotation.z = sign * -.04;
    }
  }
  function waistBelt(layer: Layers) {
    box(layer.body, black, [.83, .085, .49], [0, .98, 0], "belt");
    box(layer.body, silver, [.14, .11, .025], [0, .98, .26], "buckle");
  }
  function bootLaces(layer: Layers, material: THREE.Material) {
    for (const side of ["leftLeg", "rightLeg"] as const) {
      for (const y of [-.69, -.74, -.79]) box(layer[side], material, [.15, .018, .025], [0, y, .31], "boot-lace");
    }
  }
  function restingHood(layer: Layers, material: THREE.Material) {
    // The original hood lies behind the neck, so the player's face/hair stay free.
    box(layer.body, material, [.69, .2, .22], [0, 1.85, -.29], "folded-hood-back");
    for (const sign of [-1, 1]) {
      const side = box(layer.body, material, [.17, .17, .37], [sign * .27, 1.84, -.12], "folded-hood-side");
      side.rotation.z = sign * -.2;
    }
  }
  function zip(layer: Layers, material: THREE.Material, y = 1.36, height = .83, z = .285) {
    box(layer.body, material, [.025, height, .025], [0, y, z], "zip");
    box(layer.body, silver, [.06, .08, .035], [0, y + height * .3, z + .02], "zip-pull");
  }
  function raggedPanel(width: number, height: number, holes: boolean) {
    const shape = new THREE.Shape();
    shape.moveTo(-width / 2, height / 2);
    shape.lineTo(width / 2, height / 2);
    shape.lineTo(width / 2, -height / 2 + .09);
    shape.lineTo(width * .2, -height / 2);
    shape.lineTo(0, -height / 2 + .18);
    shape.lineTo(-width * .2, -height / 2 + .04);
    shape.lineTo(-width / 2, -height / 2 + .16);
    shape.closePath();
    if (holes) {
      const hole = new THREE.Path();
      hole.moveTo(-width * .22, -.08);
      hole.lineTo(-width * .18, -.25);
      hole.lineTo(width * .15, -.23);
      hole.lineTo(width * .2, -.1);
      hole.closePath();
      shape.holes.push(hole);
    }
    return ownGeometry(new THREE.ExtrudeGeometry(shape, { depth: .045, bevelEnabled: false }));
  }

  const tanktop = make("nude", originalMeshes[0].material, black, true);
  shorts(tanktop);
  // Small wrist bands distinguish source Tanktop from the jacket sleeve rig.
  cuffs(tanktop, black);

  const bag = make("wear_trashbag", olive, black, true);
  shorts(bag);
  sleeves(bag, charcoal, .27, .63);
  box(bag.body, charcoal, [.85, .88, .12], [0, 1.35, -.25], "ragged-back");
  for (const sign of [-1, 1]) {
    mesh(bag.body, raggedPanel(.31, 1.27, true), charcoal, [1, 1, 1], [sign * .29, 1.16, .24], "torn-open-front");
    const strip = box(bag.body, seam, [.027, .91, .025], [sign * .155, 1.31, .3], "frayed-edge");
    strip.rotation.z = sign * -.06;
    const tail = box(bag.body, charcoal, [.2, .55, .13], [sign * .35, .69, -.2], "uneven-tail");
    tail.rotation.z = sign * -.13;
  }

  const collar = make("wear_collar", olive, black, true);
  shorts(collar);
  sleeves(collar, green);
  openJacket(collar, green, .84, .85);
  mesh(collar.body, cylinder, black, [.146, .085, .146], [0, 1.91, 0], "choker");
  mesh(collar.body, ring, silver, [1, 1, 1], [0, 1.9, .154], "collar-ring");

  const jacket = make("wear_jacket", black, black);
  openJacket(jacket, lime);
  sleeves(jacket, lime, .28);
  cuffs(jacket, charcoal);
  box(jacket.body, charcoal, [.88, .095, .49], [0, .94, 0], "bomber-hem");
  bootLaces(jacket, stripe);

  const vest = make("wear_vest", black, black);
  sleeves(vest, black, .245);
  openJacket(vest, leather, .84, .83);
  waistBelt(vest);
  for (const sign of [-1, 1]) {
    const lapel = box(vest.body, charcoal, [.14, .34, .05], [sign * .22, 1.61, .31], "leather-lapel");
    lapel.rotation.z = sign * -.25;
    for (const y of [1.38, 1.58]) box(vest.body, silver, [.04, .04, .03], [sign * .33, y, .32], "leather-stud");
  }

  const coat = make("wear_coat", black, black);
  openJacket(coat, asphalt, .89, .9);
  sleeves(coat, asphalt, .27);
  for (const sign of [-1, 1]) {
    const front = box(coat.body, asphalt, [.33, .76, .1], [sign * .285, .55, .24], "split-coat-front");
    front.rotation.z = sign * -.065;
    const back = box(coat.body, asphalt, [.39, .84, .14], [sign * .22, .51, -.24], "split-coat-tail");
    back.rotation.z = sign * -.035;
    box(coat.body, seam, [.025, 1.43, .025], [sign * .135, .99, .31], "long-coat-seam");
    box(coat.body, charcoal, [.21, .2, .1], [sign * .35, .95, .3], "coat-pouch");
  }
  waistBelt(coat);

  const hoodie = make("wear_hoodie", black, black);
  box(hoodie.body, black, [.91, .97, .51], [0, 1.33, 0], "oversized-hoodie");
  sleeves(hoodie, black, .32, .7);
  cuffs(hoodie, seam);
  restingHood(hoodie, black);
  box(hoodie.body, charcoal, [.56, .23, .045], [0, 1.14, .28], "kangaroo-pocket");
  box(hoodie.body, seam, [.92, .065, .52], [0, .89, 0], "hoodie-hem");
  for (const sign of [-1, 1]) box(hoodie.body, seam, [.026, .29, .025], [sign * .12, 1.62, .28], "hood-drawstring");

  const track = make("wear_track", navy, navy);
  box(track.body, navy, [.85, .9, .48], [0, 1.36, 0], "track-top");
  sleeves(track, navy, .27);
  zip(track, seam, 1.36, .85, .255);
  for (const sign of [-1, 1]) {
    const arm = sign < 0 ? track.leftArm : track.rightArm;
    const leg = sign < 0 ? track.leftLeg : track.rightLeg;
    box(track.body, stripe, [.28, .055, .49], [sign * .31, 1.78, 0], "track-shoulder-stripe");
    box(arm, stripe, [.035, .69, .33], [sign * .139, -.345, 0], "track-sleeve-stripe");
    box(leg, stripe, [.03, .7, .315], [sign * .15, -.35, 0], "track-leg-stripe");
    box(leg, seam, [.34, .065, .49], [0, -.855, .07], "trainer-sole");
  }

  const rain = make("wear_rain", black, black);
  openJacket(rain, yellow, .91, .9);
  sleeves(rain, yellow, .3);
  cuffs(rain, charcoal);
  restingHood(rain, yellow);
  zip(rain, black, 1.36, .86, .315);
  for (const sign of [-1, 1]) {
    const pocket = box(rain.body, charcoal, [.19, .025, .025], [sign * .3, 1.18, .31], "rain-pocket-zip");
    pocket.rotation.z = sign * .45;
    const leg = sign < 0 ? rain.leftLeg : rain.rightLeg;
    box(leg, charcoal, [.055, .22, .29], [sign * .16, -.25, 0], "cargo-pocket");
    box(rain.body, black, [.023, .25, .026], [sign * .17, 1.62, .31], "rain-drawstring");
  }

  const overalls = make("wear_overalls", charcoal, brown);
  sleeves(overalls, charcoal, .25);
  box(overalls.body, brown, [.82, .28, .47], [0, 1.01, 0], "overall-waist");
  box(overalls.body, brown, [.61, .65, .085], [0, 1.35, .25], "work-bib");
  box(overalls.body, brownLight, [.33, .21, .035], [0, 1.37, .308], "bib-pocket");
  for (const sign of [-1, 1]) {
    box(overalls.body, brownLight, [.115, .58, .055], [sign * .24, 1.59, .248], "overall-strap");
    box(overalls.body, brownLight, [.115, .82, .055], [sign * .24, 1.42, -.23], "overall-back-strap");
    box(overalls.body, gold, [.065, .065, .025], [sign * .24, 1.66, .292], "overall-clasp");
    const leg = sign < 0 ? overalls.leftLeg : overalls.rightLeg;
    box(leg, brownLight, [.29, .25, .025], [0, -.39, .163], "work-knee-patch");
    box(leg, brownLight, [.335, .205, .48], [0, -.76, .075], "work-boot");
  }

  const lack = make("wear_lack", black, black);
  openJacket(lack, cyan, .87, .88);
  sleeves(lack, cyan, .28);
  cuffs(lack, black);
  box(lack.body, black, [.88, .08, .49], [0, .94, 0], "lacquer-hem");
  for (const sign of [-1, 1]) {
    const lapel = box(lack.body, leather, [.13, .48, .05], [sign * .2, 1.57, .31], "lacquer-lapel");
    lapel.rotation.z = sign * -.18;
    box(lack.body, gold, [.018, .8, .025], [sign * .14, 1.35, .34], "gold-seam");
    box(lack.body, cyan, [.045, .9, .055], [sign * .405, 1.36, .255], "cyan-edge");
  }
  bootLaces(lack, stripe);

  function normalize(id: string) {
    if (id === "bag") return "wear_trashbag";
    return layers.has(id) ? id : "nude";
  }
  function apply(id: string, bodyWidth = 1) {
    if (disposed) return;
    outfit = normalize(id);
    const active = layers.get(outfit)!;
    const width = Number.isFinite(bodyWidth) ? THREE.MathUtils.clamp(bodyWidth, .65, 1.25) : 1;
    for (const layer of layers.values()) {
      layer.body.scale.x = width;
      for (const key of ["body", "leftArm", "rightArm", "leftLeg", "rightLeg"] as const) layer[key].visible = layer === active;
    }
    rig.torso.material = active.shirt;
    rig.leftArmMesh.material = rig.skin;
    rig.rightArmMesh.material = rig.skin;
    rig.leftLegMesh.material = active.bareLegs ? rig.skin : active.pants;
    rig.rightLegMesh.material = active.bareLegs ? rig.skin : active.pants;
    for (const trim of originalTrim) trim.object.visible = false;
  }

  apply("nude");
  return {
    apply,
    current: () => outfit,
    dispose() {
      if (disposed) return;
      disposed = true;
      for (const layer of layers.values()) {
        for (const key of ["body", "leftArm", "rightArm", "leftLeg", "rightLeg"] as const) layer[key].removeFromParent();
      }
      for (const geometry of geometries) geometry.dispose();
      for (const material of materials) material.dispose();
      for (const original of originalMeshes) {
        original.mesh.material = original.material;
        original.mesh.visible = original.visible;
      }
      for (const trim of originalTrim) trim.object.visible = trim.visible;
    },
  };
}
