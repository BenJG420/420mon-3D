# Character system — milestone 1

The initial character controller is deliberately asset-independent.

- WASD / arrow keys: move
- Shift: sprint
- Delta-time movement with diagonal normalization
- Character faces its movement direction
- Equipment slots: hair, headwear, face, shirt, hoodie, jacket, vest, gloves, pants, shoes, backpack, accessory
- `equip(slot, object)` / `unequip(slot)` support future GLB equipment objects
- Placeholder geometry is temporary, not a finished character model

Next: replace the placeholder mesh with a rigged GLB, bind animation clips through `THREE.AnimationMixer`, attach clothing to the shared skeleton, and add collision handling and camera-relative movement.
