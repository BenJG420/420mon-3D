import * as THREE from 'three';
import type { MovementInput } from './input';

export type EquipmentSlot = 'hair' | 'headwear' | 'face' | 'shirt' | 'hoodie' | 'jacket' | 'vest' | 'gloves' | 'pants' | 'shoes' | 'backpack' | 'accessory';
export type CharacterState = 'idle' | 'walk' | 'run';

export class PlayerCharacter {
  readonly root = new THREE.Group();
  readonly equipment = new Map<EquipmentSlot, THREE.Object3D>();
  readonly visual = new THREE.Group();
  state: CharacterState = 'idle';
  walkSpeed = 3.5;
  runSpeed = 6.5;
  private body: THREE.Mesh;
  constructor() {
    this.root.name = 'Player';
    this.root.add(this.visual);
    const bodyGeometry = new THREE.CapsuleGeometry(0.36, 0.9, 6, 12);
    this.body = new THREE.Mesh(bodyGeometry, new THREE.MeshStandardMaterial({color: 0x28d7a2, roughness: 0.65}));
    this.body.position.y = 1.1;
    this.body.castShadow = true;
    this.visual.add(this.body);
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.29, 16, 12), new THREE.MeshStandardMaterial({color: 0xe6c5a8}));
    head.position.y = 1.95;
    head.castShadow = true;
    this.visual.add(head);
  }
  equip(slot: EquipmentSlot, object: THREE.Object3D) {
    this.unequip(slot);
    object.name = `equipment:${slot}`;
    this.equipment.set(slot, object);
    this.visual.add(object);
  }
  unequip(slot: EquipmentSlot) {
    const previous = this.equipment.get(slot);
    if (previous) this.visual.remove(previous);
    this.equipment.delete(slot);
  }
  update(delta: number, input: MovementInput) {
    const direction = new THREE.Vector3(input.right, 0, -input.forward);
    const moving = direction.lengthSq() > 0;
    this.state = !moving ? 'idle' : input.sprint ? 'run' : 'walk';
    if (moving) {
      direction.normalize();
      this.root.position.addScaledVector(direction, Math.min(delta, 0.05) * (input.sprint ? this.runSpeed : this.walkSpeed));
      const angle = Math.atan2(-direction.x, -direction.z);
      this.visual.rotation.y += Math.atan2(Math.sin(angle - this.visual.rotation.y), Math.cos(angle - this.visual.rotation.y)) * Math.min(1, delta * 12);
    }
    this.body.position.y = 1.1 + (moving ? Math.sin(performance.now() * (input.sprint ? 0.017 : 0.011)) * 0.035 : 0);
  }
}
