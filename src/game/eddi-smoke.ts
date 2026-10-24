import * as THREE from "three";

const PUFFS = 12, CYCLE = 7.5;
const smooth = (a: number, b: number, value: number) => THREE.MathUtils.smoothstep(value, a, b);
const cycleTime = (seconds: number) => Number.isFinite(seconds) ? ((seconds % CYCLE) + CYCLE) % CYCLE : 0;
// Original pauses can be only 1.05s: the visible draw and first exhale must fit.
const drawAmount = (time: number) => smooth(.05, .2, time) * (1 - smooth(.42, .58, time));
const MARKERS = { head: "Head", top: "MUpperLip", bottom: "MBottomLip", left: "LMouthCorner", right: "RMouthCorner", brow: "MMiddleEyebrow" } as const;
type Marker = keyof typeof MARKERS;
const markerKeys = Object.keys(MARKERS) as Marker[];

/** Presentation only: no consumable, buff, NPC action or save clock is changed. */
export function eddiSmokePhase(seconds: number) {
  const time = cycleTime(seconds);
  return { time, draw: drawAmount(time) };
}

/** A mouth-held joint and one bounded billboard pool, owned by Eddi's actor. */
export function createEddiSmoke(parent: THREE.Group, actor: THREE.Group) {
  const root = new THREE.Group(); root.name = "eddi-smoking"; parent.add(root);
  const paperMaterial = new THREE.MeshStandardMaterial({ color: 0xd3c8a6, roughness: .9 });
  const emberMaterial = new THREE.MeshStandardMaterial({ color: 0x7e3926, emissive: 0xf46c26, emissiveIntensity: .4, roughness: 1 });
  const paperGeometry = new THREE.CylinderGeometry(.012, .016, .17, 8);
  paperGeometry.rotateX(Math.PI / 2); paperGeometry.translate(0, 0, .085);
  const emberGeometry = new THREE.CylinderGeometry(.0125, .0125, .018, 8);
  emberGeometry.rotateX(Math.PI / 2); emberGeometry.translate(0, 0, .175);
  const joint = new THREE.Group(); joint.name = "eddi-joint"; root.add(joint);
  joint.add(new THREE.Mesh(paperGeometry, paperMaterial), new THREE.Mesh(emberGeometry, emberMaterial));

  const pixels = new Uint8Array(32 * 32 * 4);
  for (let y = 0; y < 32; y++) for (let x = 0; x < 32; x++) {
    const distance = Math.hypot((x - 15.5) / 15.5, (y - 15.5) / 15.5);
    const p = (y * 32 + x) * 4;
    pixels[p] = pixels[p + 1] = pixels[p + 2] = 255;
    pixels[p + 3] = Math.round(255 * Math.max(0, 1 - distance) ** 2);
  }
  const texture = new THREE.DataTexture(pixels, 32, 32); texture.needsUpdate = true;
  texture.minFilter = texture.magFilter = THREE.LinearFilter;
  const smokeMaterial = new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, fog: true,
    uniforms: { ...THREE.UniformsUtils.clone(THREE.UniformsLib.fog), puffMap: { value: texture }, tint: { value: new THREE.Color(0xc1cfc9) } },
    vertexShader: `attribute float puffOpacity; varying vec2 puffUv; varying float opacity;
      #include <common>
      #include <fog_pars_vertex>
      void main() {
        puffUv = uv; opacity = puffOpacity;
        mat4 viewInstance = modelViewMatrix * instanceMatrix;
        vec4 mvPosition = viewInstance * vec4(0., 0., 0., 1.);
        mvPosition.xy += position.xy * vec2(length(viewInstance[0].xyz), length(viewInstance[1].xyz));
        gl_Position = projectionMatrix * mvPosition;
        #include <fog_vertex>
      }`,
    fragmentShader: `uniform sampler2D puffMap; uniform vec3 tint; varying vec2 puffUv; varying float opacity;
      #include <fog_pars_fragment>
      void main() {
        gl_FragColor = vec4(tint, texture2D(puffMap, puffUv).a * opacity);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
        #include <fog_fragment>
      }`,
  });
  const puffGeometry = new THREE.PlaneGeometry(1, 1);
  const opacity = new THREE.InstancedBufferAttribute(new Float32Array(PUFFS), 1);
  opacity.setUsage(THREE.DynamicDrawUsage); puffGeometry.setAttribute("puffOpacity", opacity);
  const smoke = new THREE.InstancedMesh(puffGeometry, smokeMaterial, PUFFS);
  smoke.name = "eddi-exhaled-smoke"; smoke.frustumCulled = false;
  smoke.instanceMatrix.setUsage(THREE.DynamicDrawUsage); root.add(smoke);

  const position = new THREE.Vector3(), lower = new THREE.Vector3(), left = new THREE.Vector3(), right = new THREE.Vector3();
  const up = new THREE.Vector3(), forward = new THREE.Vector3(), outward = new THREE.Vector3();
  const inverse = new THREE.Matrix4(), axis = new THREE.Vector3(0, 0, 1), particle = new THREE.Object3D();
  const bones: Partial<Record<Marker, THREE.Object3D>> = {};
  let elapsed = 0, disposed = false;
  function resolve() {
    if (actor.userData.status !== "ready") { for (const key of markerKeys) bones[key] = undefined; return false; }
    if (!bones.head) {
      for (const key of markerKeys)
        bones[key] = actor.getObjectByName(`Bip01 ${MARKERS[key]}`) ?? actor.getObjectByName(`Bip01_${MARKERS[key]}`);
    }
    return !!(bones.head && bones.top && bones.bottom && bones.left && bones.right && bones.brow);
  }
  function anchor() {
    // Facial markers in the shipped rig avoid assumptions about its centimetre bones,
    // rest rotations, head shape or the model's normalization/appearance scale.
    if (resolve()) {
      actor.updateWorldMatrix(true, true);
      bones.top!.getWorldPosition(position); bones.bottom!.getWorldPosition(lower); position.add(lower).multiplyScalar(.5);
      bones.left!.getWorldPosition(left); bones.right!.getWorldPosition(right);
      bones.brow!.getWorldPosition(up); up.sub(position);
      forward.subVectors(right, left).cross(up).normalize();
      bones.head!.getWorldPosition(outward); outward.subVectors(position, outward);
      if (forward.dot(outward) < 0) forward.negate();
      position.addScaledVector(forward, .008);
      parent.worldToLocal(position); root.position.copy(position);
      inverse.copy(parent.matrixWorld).invert(); forward.transformDirection(inverse);
    } else {
      // Only while the licensed model loads/fails: match its existing fallback head.
      root.position.set(.025, 1.84, .23); forward.set(0, 0, 1);
    }
    joint.quaternion.setFromUnitVectors(axis, forward);
  }
  function update(dt: number, walking: boolean, near: boolean) {
    if (disposed) return;
    root.visible = near;
    if (!near) { elapsed = 0; return; }
    anchor();
    elapsed = walking ? 0 : elapsed + (Number.isFinite(dt) ? Math.max(0, Math.min(dt, .1)) : 0);
    const time = cycleTime(elapsed), draw = drawAmount(time);
    emberMaterial.emissiveIntensity = .4 + draw * 2.8;
    root.userData.draw = draw;
    smoke.visible = !walking;
    for (let i = 0; i < PUFFS; i++) {
      const age = time - (.58 + i * .03), alive = !walking && age > 0 && age < 1.4;
      const fade = alive ? smooth(0, .12, age) * (1 - smooth(.5, 1.4, age)) : 0;
      opacity.setX(i, fade * .26);
      particle.position.copy(forward).multiplyScalar(.19 + Math.max(0, age) * .25);
      particle.position.x += Math.sin(i * 2.4 + age * 1.5) * Math.max(0, age) * .08;
      particle.position.y += Math.max(0, age) * .31;
      particle.scale.setScalar(alive ? .13 + age * .28 : 0); particle.updateMatrix();
      smoke.setMatrixAt(i, particle.matrix);
    }
    opacity.needsUpdate = true; smoke.instanceMatrix.needsUpdate = true;
  }
  update(0, false, false);
  return { root, update, dispose() {
    if (disposed) return; disposed = true; root.removeFromParent();
    smoke.dispose(); paperGeometry.dispose(); emberGeometry.dispose(); puffGeometry.dispose();
    paperMaterial.dispose(); emberMaterial.dispose(); smokeMaterial.dispose(); texture.dispose();
  } };
}
