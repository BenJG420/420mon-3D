import * as THREE from "three";
import { normalizeWardrobe, legacyWardrobe, wardrobeKey, type Wardrobe } from "./wardrobe";

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
  leftBoot?: THREE.Object3D;
  rightBoot?: THREE.Object3D;
  /** Hair or old hats only: the head/face must remain visible under open hats. */
  headParts?: THREE.Object3D[];
};
type Part = "body" | "leftArm" | "rightArm" | "leftLeg" | "rightLeg";
type Layer = Record<Part, THREE.Group> & { id: string; slot: keyof Wardrobe };
const parts: Part[] = ["body", "leftArm", "rightArm", "leftLeg", "rightLeg"];
const legacyIds = ["nude", "wear_trashbag", "wear_collar", "wear_jacket", "wear_vest", "wear_coat", "wear_hoodie", "wear_track", "wear_rain", "wear_overalls", "wear_lack"];

/** Six cached, independently fitted slots for the loading/error fallback rig. */
export function createClothingVisuals(rig: ClothingRig) {
  const geometries = new Set<THREE.BufferGeometry>();
  const materials = new Set<THREE.Material>();
  const originalMeshes = [rig.torso, rig.leftArmMesh, rig.rightArmMesh, rig.leftLegMesh, rig.rightLegMesh]
    .map(mesh => ({ mesh, material: mesh.material, visible: mesh.visible }));
  const originalTrim = [rig.shoulderTrim, rig.jacketAccent, rig.belt, rig.leftBoot, rig.rightBoot]
    .filter((object): object is THREE.Object3D => !!object).map(object => ({ object, visible: object.visible }));
  const originalHead = (rig.headParts ?? []).map(object => ({ object, visible: object.visible }));
  const layers = new Map<string, Layer>();
  const topMaterials = new Map<string, THREE.Material | THREE.Material[]>();
  const pantsMaterials = new Map<string, THREE.Material>();
  const topDetails: THREE.Object3D[] = [];
  const foldedHoods: THREE.Object3D[] = [];
  const outerLegStripes: THREE.Object3D[] = [];
  let wardrobe = normalizeWardrobe(null);
  let disposed = false;

  function ownGeometry<T extends THREE.BufferGeometry>(geometry: T): T { geometries.add(geometry); return geometry; }
  const cube = ownGeometry(new THREE.BoxGeometry(1, 1, 1));
  const cylinder = ownGeometry(new THREE.CylinderGeometry(1, 1, 1, 12));
  const sphere = ownGeometry(new THREE.SphereGeometry(1, 16, 10));
  const ring = ownGeometry(new THREE.TorusGeometry(.064, .015, 6, 12));
  function cloth(color: number, roughness = .88, metalness = 0) {
    const material = new THREE.MeshStandardMaterial({ color, roughness, metalness });
    materials.add(material); return material;
  }
  function mesh(parent: THREE.Object3D, geometry: THREE.BufferGeometry, material: THREE.Material,
    size: [number, number, number], position: [number, number, number], name: string) {
    const part = new THREE.Mesh(geometry, material);
    part.name = name; part.scale.set(...size); part.position.set(...position); part.castShadow = true;
    parent.add(part); return part;
  }
  function box(parent: THREE.Object3D, material: THREE.Material, size: [number, number, number],
    position: [number, number, number], name: string) { return mesh(parent, cube, material, size, position, name); }
  function make(slot: keyof Wardrobe, id: string) {
    const layer = { id, slot } as Layer;
    for (const key of parts) {
      const group = new THREE.Group();
      group.name = `clothing-${id}-${key}`;
      group.userData.clothingSlot = slot; group.userData.clothingGarment = id; group.userData.clothingPart = key;
      group.visible = false; (key === "body" ? rig.character : rig[key]).add(group); layer[key] = group;
    }
    layers.set(id, layer); return layer;
  }
  function sleeves(layer: Layer, material: THREE.Material, width = .25, length = .66, depth = .3) {
    for (const side of ["leftArm", "rightArm"] as const)
      box(layer[side], material, [width, length, depth], [0, -length / 2, 0], "sleeve");
  }
  function cuffs(layer: Layer, material: THREE.Material) {
    for (const side of ["leftArm", "rightArm"] as const)
      box(layer[side], material, [.305, .085, .36], [0, -.655, 0], "cuff");
  }
  function openJacket(layer: Layer, material: THREE.Material, seam: THREE.Material, height = .89) {
    // Top -> bib -> jacket are separate depth bands. The broad opening leaves the bib visible.
    box(layer.body, material, [.92, height, .075], [0, 1.36, -.295], "jacket-back");
    for (const sign of [-1, 1]) {
      box(layer.body, material, [.075, height, .6], [sign * .43, 1.36, 0], "jacket-side");
      box(layer.body, material, [.23, height, .065], [sign * .345, 1.36, .325], "open-front");
      box(layer.body, seam, [.018, height * .85, .018], [sign * .232, 1.38, .366], "jacket-seam");
    }
  }
  function raggedPanel() {
    const shape = new THREE.Shape();
    shape.moveTo(-.115, .44); shape.lineTo(.115, .44); shape.lineTo(.115, -.52);
    shape.lineTo(.04, -.65); shape.lineTo(-.03, -.46); shape.lineTo(-.115, -.6); shape.closePath();
    const hole = new THREE.Path();
    hole.moveTo(-.06, -.08); hole.lineTo(-.04, -.25); hole.lineTo(.04, -.23); hole.lineTo(.06, -.1); hole.closePath();
    shape.holes.push(hole);
    return ownGeometry(new THREE.ExtrudeGeometry(shape, { depth: .04, bevelEnabled: false }));
  }

  // Each slot owns its palette. Applying another slot never recolors its neighbors.
  const topBlack = cloth(0x181818), topOlive = cloth(0x607848), topNavy = cloth(0x181830);
  const topSeam = cloth(0xc5c6bd), topStripe = cloth(0x60c030), pocket = cloth(0x303030);
  topMaterials.set("top_tanktop", originalMeshes[0].material);
  topMaterials.set("top_shirt", topOlive); topMaterials.set("top_hoodie", topBlack); topMaterials.set("top_track", topNavy);
  make("top", "top_tanktop");
  const shirt = make("top", "top_shirt"); sleeves(shirt, topOlive, .25, .32);
  const hoodie = make("top", "top_hoodie"); sleeves(hoodie, topBlack);
  topDetails.push(box(hoodie.body, pocket, [.56, .22, .035], [0, 1.14, .226], "kangaroo-pocket"));
  for (const sign of [-1, 1]) topDetails.push(box(hoodie.body, topSeam, [.02, .27, .018], [sign * .12, 1.65, .215], "hood-drawstring"));
  foldedHoods.push(box(hoodie.body, topBlack, [.68, .17, .2], [0, 1.85, -.25], "folded-hood-back"));
  for (const sign of [-1, 1]) foldedHoods.push(box(hoodie.body, topBlack, [.15, .15, .28], [sign * .27, 1.84, -.1], "folded-hood-side"));
  const track = make("top", "top_track"); sleeves(track, topNavy);
  topDetails.push(box(track.body, topSeam, [.02, .8, .018], [0, 1.36, .214], "track-zip"));
  for (const sign of [-1, 1]) {
    const arm = sign < 0 ? track.leftArm : track.rightArm;
    box(arm, topStripe, [.02, .65, .307], [sign * .13, -.325, 0], "track-sleeve-stripe");
  }

  const pantsBlack = cloth(0x181818), pantsNavy = cloth(0x181830), brown = cloth(0x603018);
  const brownLight = cloth(0x784830), pantsSeam = cloth(0xc5c6bd), pantsStripe = cloth(0x60c030), gold = cloth(0xc8a84a, .42, .55);
  pantsMaterials.set("pants_shorts", pantsBlack); pantsMaterials.set("pants_plain", pantsBlack);
  pantsMaterials.set("pants_track", pantsNavy); pantsMaterials.set("pants_overalls", brown);
  for (const id of ["pants_shorts", "pants_plain", "pants_track", "pants_overalls"]) {
    const layer = make("pants", id);
    const material = pantsMaterials.get(id)!;
    box(layer.body, material, [.8, .12, .43], [0, .97, 0], "trouser-waist");
    if (id === "pants_shorts") for (const side of ["leftLeg", "rightLeg"] as const) {
      box(layer[side], material, [.315, .265, .34], [0, -.13, 0], "shorts");
      box(layer[side], pantsSeam, [.319, .025, .345], [0, -.26, 0], "shorts-hem");
    }
    if (id === "pants_track") for (const sign of [-1, 1]) {
      const leg = sign < 0 ? layer.leftLeg : layer.rightLeg;
      outerLegStripes.push(box(leg, pantsStripe, [.02, .66, .309], [sign * .148, -.35, 0], "track-leg-stripe"));
    }
    if (id === "pants_overalls") {
      box(layer.body, brown, [.8, .24, .47], [0, 1.03, 0], "overall-waist");
      box(layer.body, brown, [.61, .57, .045], [0, 1.36, .259], "work-bib");
      box(layer.body, brownLight, [.32, .19, .025], [0, 1.36, .295], "bib-pocket");
      for (const sign of [-1, 1]) {
        box(layer.body, brownLight, [.1, .57, .035], [sign * .24, 1.59, .247], "overall-strap");
        box(layer.body, brownLight, [.1, .79, .035], [sign * .24, 1.43, -.235], "overall-back-strap");
        box(layer.body, gold, [.06, .06, .018], [sign * .24, 1.66, .276], "overall-clasp");
        box(sign < 0 ? layer.leftLeg : layer.rightLeg, brownLight, [.281, .24, .025], [0, -.39, .167], "work-knee-patch");
      }
    }
  }

  const jacketBlack = cloth(0x181818), jacketCharcoal = cloth(0x303030), asphalt = cloth(0x303048);
  const lime = cloth(0x60b818), leather = cloth(0x202023, .59, .08), yellow = cloth(0xf0c018, .55);
  const cyan = cloth(0x30a8c0, .17, .46), jacketSeam = cloth(0xc5c6bd), silver = cloth(0xb0b5b7, .35, .6);
  make("jacket", "jacket_none");
  const jacketColors = { jacket_trashbag: jacketCharcoal, jacket_bomber: lime, jacket_vest: leather,
    jacket_leather: leather, jacket_coat: asphalt, jacket_rain: yellow, jacket_lack: cyan };
  for (const [id, color] of Object.entries(jacketColors)) {
    const layer = make("jacket", id);
    openJacket(layer, color, jacketSeam);
    if (id !== "jacket_vest") { sleeves(layer, color, .3, .69, .35); cuffs(layer, jacketBlack); }
    if (id === "jacket_trashbag") {
      for (const child of layer.body.children) if (child.name === "open-front") child.visible = false;
      for (const sign of [-1, 1]) mesh(layer.body, raggedPanel(), color, [1, 1, 1], [sign * .345, 1.36, .32], "torn-open-front");
    }
    if (id === "jacket_vest" || id === "jacket_leather" || id === "jacket_lack") for (const sign of [-1, 1]) {
      const lapel = box(layer.body, id === "jacket_lack" ? leather : jacketCharcoal, [.09, .32, .025], [sign * .29, 1.62, .375], "jacket-lapel");
      lapel.rotation.z = sign * -.18;
      for (const y of [1.39, 1.59]) box(layer.body, silver, [.033, .033, .018], [sign * .4, y, .37], "jacket-stud");
    }
    if (id === "jacket_coat") for (const sign of [-1, 1]) {
      // Split tails follow each leg, so walking cannot push a knee through a static coat.
      const leg = sign < 0 ? layer.leftLeg : layer.rightLeg;
      box(leg, color, [.37, .72, .06], [0, -.34, -.24], "split-coat-tail");
      box(leg, color, [.07, .72, .48], [sign * .18, -.34, 0], "split-coat-side");
      box(leg, color, [.12, .68, .06], [sign * .135, -.32, .245], "split-coat-front");
    }
    if (id === "jacket_rain") for (const sign of [-1, 1])
      box(layer.body, jacketBlack, [.14, .023, .02], [sign * .35, 1.18, .373], "rain-pocket-zip");
  }

  const shoeBlack = cloth(0x181818), shoeBrown = cloth(0x784830), shoeSeam = cloth(0xc5c6bd), shoeStripe = cloth(0x60c030);
  for (const id of ["shoes_basic", "shoes_trainers", "shoes_work"]) {
    const layer = make("shoes", id), color = id === "shoes_work" ? shoeBrown : shoeBlack;
    for (const side of ["leftLeg", "rightLeg"] as const) {
      box(layer[side], color, [.34, .22, .49], [0, -.765, .075], id === "shoes_work" ? "work-boot" : "shoe");
      box(layer[side], id === "shoes_trainers" ? shoeSeam : shoeBlack, [.345, .045, .5], [0, -.87, .075], "shoe-sole");
      if (id !== "shoes_basic") for (const y of [-.72, -.77, -.82])
        box(layer[side], id === "shoes_trainers" ? shoeStripe : shoeSeam, [.16, .018, .018], [0, y, .329], "shoe-lace");
    }
  }

  const headBlack = cloth(0x202023), headYellow = cloth(0xf0c018, .55);
  make("head", "head_none");
  const beanie = make("head", "head_beanie");
  mesh(beanie.body, sphere, headBlack, [.34, .21, .29], [0, 2.42, -.015], "beanie-crown");
  box(beanie.body, headBlack, [.67, .12, .56], [0, 2.36, -.015], "beanie-band");
  const hood = make("head", "head_rainhood");
  box(hood.body, headYellow, [.72, .66, .09], [0, 2.2, -.335], "rainhood-back");
  box(hood.body, headYellow, [.72, .095, .59], [0, 2.51, -.045], "rainhood-top");
  for (const sign of [-1, 1]) box(hood.body, headYellow, [.09, .6, .61], [sign * .33, 2.2, -.045], "rainhood-side");
  const accessoryBlack = cloth(0x181818), accessorySilver = cloth(0xb0b5b7, .35, .6);
  make("accessory", "accessory_none");
  const collar = make("accessory", "accessory_collar");
  mesh(collar.body, cylinder, accessoryBlack, [.15, .08, .15], [0, 1.93, 0], "choker");
  mesh(collar.body, ring, accessorySilver, [1, 1, 1], [0, 1.925, .158], "collar-ring");

  function apply(value: string | Wardrobe, bodyWidth = 1) {
    if (disposed) return;
    wardrobe = typeof value === "string" ? legacyWardrobe(value) : normalizeWardrobe(value);
    const width = Number.isFinite(bodyWidth) ? THREE.MathUtils.clamp(bodyWidth, .65, 1.25) : 1;
    const jacketSleeves = wardrobe.jacket !== "jacket_none" && wardrobe.jacket !== "jacket_vest";
    for (const layer of layers.values()) {
      layer.body.scale.x = layer.slot === "head" || layer.slot === "accessory" ? 1 : width;
      for (const key of parts) layer[key].visible = wardrobe[layer.slot] === layer.id
        && !(layer.slot === "top" && (key === "leftArm" || key === "rightArm") && jacketSleeves);
    }
    for (const part of topDetails) part.visible = wardrobe.pants !== "pants_overalls";
    for (const part of foldedHoods) part.visible = wardrobe.head !== "head_rainhood";
    for (const part of outerLegStripes) part.visible = wardrobe.jacket !== "jacket_coat";
    rig.torso.material = topMaterials.get(wardrobe.top)!;
    rig.leftArmMesh.material = rig.skin; rig.rightArmMesh.material = rig.skin;
    rig.leftLegMesh.material = wardrobe.pants === "pants_shorts" ? rig.skin : pantsMaterials.get(wardrobe.pants)!;
    rig.rightLegMesh.material = rig.leftLegMesh.material;
    for (const trim of originalTrim) trim.object.visible = false;
    // The host reapplies the current hairstyle before clothing; preserve new style choices.
    if (wardrobe.head !== "head_none") for (const part of originalHead) part.object.visible = false;
  }
  apply("nude");
  return {
    apply,
    current: () => legacyIds.find(id => wardrobeKey(legacyWardrobe(id)) === wardrobeKey(wardrobe)) ?? "custom",
    currentWardrobe: () => ({ ...wardrobe }),
    dispose() {
      if (disposed) return; disposed = true;
      for (const layer of layers.values()) for (const key of parts) layer[key].removeFromParent();
      for (const geometry of geometries) geometry.dispose();
      for (const material of materials) material.dispose();
      for (const original of originalMeshes) { original.mesh.material = original.material; original.mesh.visible = original.visible; }
      for (const trim of [...originalTrim, ...originalHead]) trim.object.visible = trim.visible;
    },
  };
}
