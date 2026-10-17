import * as THREE from "three";

export const HUMAN_BONE_NAMES = {
  hips: "Bip01_Pelvis", head: "Bip01_Head",
  leftShoulder: "Bip01_L_UpperArm", leftElbow: "Bip01_L_Forearm", leftWrist: "Bip01_L_Hand",
  rightShoulder: "Bip01_R_UpperArm", rightElbow: "Bip01_R_Forearm", rightWrist: "Bip01_R_Hand",
  leftHip: "Bip01_L_Thigh", leftKnee: "Bip01_L_Calf", leftAnkle: "Bip01_L_Foot", leftToe: "Bip01_L_Toe0",
  rightHip: "Bip01_R_Thigh", rightKnee: "Bip01_R_Calf", rightAnkle: "Bip01_R_Foot", rightToe: "Bip01_R_Toe0",
} as const;
type Role = keyof typeof HUMAN_BONE_NAMES;
export type HumanBones = Record<Role, THREE.Bone>;
export function mapHumanBones(model: THREE.Object3D): HumanBones {
  const bones = {} as HumanBones;
  for (const [role, name] of Object.entries(HUMAN_BONE_NAMES)) {
    const bone = model.getObjectByName(name);
    if (!(bone instanceof THREE.Bone)) throw new Error(`Human rig is missing ${role}: ${name}`);
    bones[role as Role] = bone;
  }
  for (const side of ["left", "right"] as const) {
    if (bones[`${side}Knee`].parent !== bones[`${side}Hip`] || bones[`${side}Ankle`].parent !== bones[`${side}Knee`]
      || bones[`${side}Elbow`].parent !== bones[`${side}Shoulder`] || bones[`${side}Wrist`].parent !== bones[`${side}Elbow`]) {
      throw new Error(`Human rig has an invalid ${side} limb chain`);
    }
  }
  return bones;
}

type Gait = "Idle" | "Walk" | "Run";
const GAITS: Gait[] = ["Idle", "Walk", "Run"];
/** Keep target bind translations/scale; clips animate mapped bone rotations only. */
export function prepareHumanClips(model: THREE.Object3D, source: THREE.AnimationClip[]) {
  const required = mapHumanBones(model);
  return GAITS.map(name => {
    const clip = source.find(item => item.name === name);
    if (!clip || !Number.isFinite(clip.duration) || clip.duration <= 0) throw new Error(`Human clip missing: ${name}`);
    const tracks = clip.tracks.filter(track => track.name.endsWith(".quaternion")).map(track => {
      const nodeName = THREE.PropertyBinding.parseTrackName(track.name).nodeName;
      if (!(model.getObjectByName(nodeName) instanceof THREE.Bone)) throw new Error(`Unmapped human animation: ${track.name}`);
      return track.clone();
    });
    for (const bone of Object.values(required)) {
      if (!tracks.some(track => THREE.PropertyBinding.parseTrackName(track.name).nodeName === bone.name)) {
        throw new Error(`Human ${name} does not animate ${bone.name}`);
      }
    }
    return new THREE.AnimationClip(name, clip.duration, tracks);
  });
}

/** Shared by player and NPCs. A common foot phase prevents knee/stride snaps on sprint changes. */
export function createHumanAnimation(model: THREE.Object3D, source: THREE.AnimationClip[]) {
  const clips = prepareHumanClips(model, source);
  const mixer = new THREE.AnimationMixer(model);
  const actions = Object.fromEntries(clips.map(clip => [clip.name, mixer.clipAction(clip)])) as Record<Gait, THREE.AnimationAction>;
  let current: Gait = "Idle", phase = 0, elapsed = .18;
  let weights: Record<Gait, number> = { Idle: 1, Walk: 0, Run: 0 };
  let from = { ...weights };
  for (const gait of GAITS) {
    actions[gait].setEffectiveWeight(weights[gait]).play();
    if (gait !== "Idle") actions[gait].setEffectiveTimeScale(0);
  }
  mixer.update(0);
  return {
    update(dt: number, speed: number, sprint: boolean) {
      const delta = THREE.MathUtils.clamp(dt, 0, .1);
      const next: Gait = speed > .35 ? sprint ? "Run" : "Walk" : "Idle";
      if (next !== current) {
        if (current === "Idle" && next !== "Idle") phase = 0;
        from = { ...weights }; current = next; elapsed = 0;
      }
      if (current !== "Idle") {
        const rate = THREE.MathUtils.clamp(speed / (current === "Run" ? 7 : 4.2), .55, 1.5);
        phase = (phase + delta * rate / actions[current].getClip().duration) % 1;
      }
      // Both moving clips sample the same stride phase throughout a blend.
      for (const gait of ["Walk", "Run"] as const) actions[gait].time = phase * actions[gait].getClip().duration;
      elapsed = Math.min(.18, elapsed + delta);
      const t = elapsed / .18, smooth = t * t * (3 - 2 * t);
      for (const gait of GAITS) {
        weights[gait] = THREE.MathUtils.lerp(from[gait], gait === current ? 1 : 0, smooth);
        actions[gait].setEffectiveWeight(weights[gait]);
      }
      mixer.update(delta);
    },
    diagnostics: () => ({ gait: current, phase, weights: { ...weights } }),
    dispose() { mixer.stopAllAction(); mixer.uncacheRoot(model); },
  };
}
