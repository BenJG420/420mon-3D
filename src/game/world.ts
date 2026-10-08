import * as THREE from "three";
import { DISTRICTS } from "./data/zones";
import { ELEMENT_COLOR } from "./data/types";

export type DistrictTravel = { travel: (id: string) => void; current: () => string; shopNearby: () => boolean; openShop: (fn: () => void) => void; update: () => void };
export function createDistrictWorld(scene: THREE.Scene, player: THREE.Group): DistrictTravel {
  const districts = DISTRICTS;
  const positions = new Map<string, THREE.Vector3>();
  const root = new THREE.Group();
  scene.add(root);
  let district = localStorage.getItem("420mon-district") || "alley";
  let shopFn: (() => void) | undefined;
  const signs: THREE.Group[] = [];
  const shopPos = new THREE.Vector3(0, 0, -11);
  const signMat = new THREE.MeshStandardMaterial({ color: 0x051915, emissive: 0x063c2a, emissiveIntensity: 0.8 });
  const fontCanvas = (label: string, accent: string) => {
    const c = document.createElement("canvas"); c.width = 512; c.height = 128;
    const g = c.getContext("2d")!; g.fillStyle = "#061711"; g.fillRect(0, 0, 512, 128);
    g.strokeStyle = accent; g.lineWidth = 8; g.strokeRect(4, 4, 504, 120);
    g.fillStyle = "#e9fff4"; g.font = "bold 38px sans-serif"; g.textAlign = "center";
    g.fillText(label.slice(0, 22), 256, 78);
    const tex = new THREE.CanvasTexture(c); tex.colorSpace = THREE.SRGBColorSpace; return tex;
  };
  function makeSign(label: string, x: number, z: number, accent: string, scale = 1) {
    const group = new THREE.Group();
    const mesh = new THREE.Mesh(new THREE.PlaneGeometry(6 * scale, 1.5 * scale), new THREE.MeshBasicMaterial({ map: fontCanvas(label, accent), side: THREE.DoubleSide }));
    mesh.position.y = 3.8 * scale; group.add(mesh); group.position.set(x, 0, z); root.add(group); signs.push(group); return group;
  }
  districts.forEach((d, i) => {
    const col = i % 5, row = Math.floor(i / 5);
    const cx = 270 + col * 140, cz = (row - 1) * 160;
    positions.set(d.id, new THREE.Vector3(cx, 0, cz));
    const color = new THREE.Color(ELEMENT_COLOR[d.type]);
    const platform = new THREE.Mesh(new THREE.PlaneGeometry(110, 110), new THREE.MeshStandardMaterial({ color: color.clone().multiplyScalar(0.23), roughness: 0.86, metalness: 0.22 }));
    platform.rotation.x = -Math.PI / 2; platform.position.set(cx, 0.06, cz); root.add(platform);
    const grid = new THREE.GridHelper(108, 12, color.getHex(), 0x26323a); grid.position.set(cx, 0.09, cz); root.add(grid);
    const wallMat = new THREE.MeshStandardMaterial({ color: color.clone().multiplyScalar(0.45), roughness: 0.7, metalness: 0.25 });
    const glowMat = new THREE.MeshStandardMaterial({ color: color.getHex(), emissive: color.getHex(), emissiveIntensity: 1.6 });
    for (let k = 0; k < 20; k++) {
      const angle = k * Math.PI * 2 / 20;
      const radius = 36 + (k % 4) * 4;
      const h = 5 + ((i * 17 + k * 11) % 19);
      const box = new THREE.Mesh(new THREE.BoxGeometry(5 + k % 3, h, 5 + k % 4), wallMat);
      box.position.set(cx + Math.cos(angle) * radius, h / 2, cz + Math.sin(angle) * radius);
      root.add(box);
      const lamp = new THREE.Mesh(new THREE.BoxGeometry(4, 0.18, 0.2), glowMat);
      lamp.position.set(box.position.x, h - 0.5, box.position.z + 3); root.add(lamp);
    }
    makeSign(d.name.toUpperCase(), cx, cz - 23, "#" + color.getHexString());
    const exit = makeSign("⇦ STADTPLAN / MENÜ", cx + 18, cz + 23, "#66ffbb", 0.75);
    exit.rotation.y = Math.PI;
  });
  makeSign("LOWTOWN SHOP · EDDI", shopPos.x, shopPos.z, "#66ff99");
  const npc = new THREE.Group();
  const npcMat = new THREE.MeshStandardMaterial({ color: 0x19a76c, roughness: 0.7 });
  const headMat = new THREE.MeshStandardMaterial({ color: 0xc8a282, roughness: 0.9 });
  const body = new THREE.Mesh(new THREE.CapsuleGeometry(0.43, 0.7, 4, 10), npcMat);
  body.position.y = 1.1; npc.add(body);
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.31, 12, 10), headMat); head.position.y = 2.02; npc.add(head);
  npc.position.copy(shopPos).add(new THREE.Vector3(0, 0, 3)); root.add(npc);
  const prompt = document.createElement("button");
  prompt.className = "npc-shop-prompt"; prompt.textContent = "🛒 EDDI ANSPRECHEN · SHOP";
  prompt.hidden = true; document.querySelector("#app")!.append(prompt);
  prompt.onclick = () => shopFn?.();
  const travel = (id: string) => {
    if (id === "alley") { district = id; player.position.set(0, 0, 0); }
    else { const pos = positions.get(id); if (!pos) return; district = id; player.position.copy(pos); }
    localStorage.setItem("420mon-district", district);
    window.dispatchEvent(new CustomEvent("420mon-district-change", { detail: district }));
  };
  if (district !== "alley") travel(district);
  return {
    travel, current: () => district,
    shopNearby: () => district === "alley" && player.position.distanceTo(shopPos) < 8,
    openShop: fn => { shopFn = fn; },
    update: () => { prompt.hidden = !(district === "alley" && player.position.distanceTo(shopPos) < 8); }
  };
}
