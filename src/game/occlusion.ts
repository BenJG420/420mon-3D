import * as THREE from "three";

type Surface = { material: THREE.Material; opacity: number; transparent: boolean; depthWrite: boolean };
type Block = { meshes: THREE.Mesh[]; bounds: THREE.Box3; surfaces: Surface[]; shadows: boolean[]; fade: number; hold: number };

/** Static map bounds, grouped architecture and a body-sized visibility corridor. */
export function createPlayerOcclusion() {
  let source: THREE.Mesh[] | undefined;
  let blocks: Block[] = [];
  const ray = new THREE.Ray(), direction = new THREE.Vector3(), hit = new THREE.Vector3();
  const target = new THREE.Vector3();
  const samples = [[0, .25, 0], [0, 1, 0], [0, 1.75, 0], [-.38, 1.1, 0], [.38, 1.1, 0]];
  function restore() {
    for (const block of blocks) {
      block.surfaces.forEach(s => { s.material.opacity = s.opacity; s.material.transparent = s.transparent; s.material.depthWrite = s.depthWrite; });
      block.meshes.forEach((mesh, i) => { mesh.castShadow = block.shadows[i]; });
    }
    blocks = []; source = undefined;
  }
  function bind(meshes: THREE.Mesh[]) {
    restore(); source = meshes;
    const groups = new Map<string, THREE.Mesh[]>();
    for (const mesh of meshes) {
      const key = String(mesh.userData.occlusionGroup ?? mesh.uuid);
      const group = groups.get(key) ?? []; group.push(mesh); groups.set(key, group);
    }
    for (const group of groups.values()) {
      const bounds = new THREE.Box3();
      const materials = new Set<THREE.Material>();
      for (const mesh of group) {
        mesh.updateWorldMatrix(true, false); bounds.union(new THREE.Box3().setFromObject(mesh));
        (Array.isArray(mesh.material) ? mesh.material : [mesh.material]).forEach(m => materials.add(m));
      }
      blocks.push({ meshes: group, bounds, surfaces: [...materials].map(material => ({ material, opacity: material.opacity, transparent: material.transparent, depthWrite: material.depthWrite })), shadows: group.map(m => m.castShadow), fade: 0, hold: 0 });
    }
  }
  return {
    update(meshes: THREE.Mesh[], camera: THREE.Vector3, player: THREE.Vector3, dt: number) {
      if (source !== meshes) bind(meshes);
      const step = Number.isFinite(dt) ? Math.max(0, Math.min(dt, .1)) : 0;
      let count = 0;
      for (const block of blocks) {
        const blocked = samples.some(([x, y, z]) => {
          target.copy(player).add(new THREE.Vector3(x, y, z));
          direction.subVectors(target, camera); const distance = direction.length();
          if (distance < .01) return false;
          ray.set(camera, direction.multiplyScalar(1 / distance));
          return !!ray.intersectBox(block.bounds, hit) && (block.bounds.containsPoint(camera) || hit.distanceTo(camera) < distance - .05);
        });
        block.hold = blocked ? .12 : Math.max(0, block.hold - step);
        const hidden = blocked || block.hold > 0;
        block.fade = THREE.MathUtils.damp(block.fade, hidden ? 1 : 0, hidden ? 28 : 12, step);
        if (!hidden && block.fade < .001) block.fade = 0;
        if (block.fade > .001) count++;
        for (const s of block.surfaces) {
          s.material.opacity = s.opacity * (1 - .94 * block.fade);
          s.material.transparent = s.transparent || block.fade > 0;
          s.material.depthWrite = block.fade > 0 ? false : s.depthWrite;
        }
        block.meshes.forEach((mesh, i) => { mesh.castShadow = block.fade > .05 ? false : block.shadows[i]; });
      }
      return count;
    },
    dispose: restore,
  };
}
