# 420mon-3D — Master Plan

## Product target

The new game is a genuine 3D successor in architecture and presentation. The old 420mon game is a reference implementation for gameplay ideas and data, not a codebase to visually stretch into 4K.

## Visual direction

The supplied reference video shows the target quality bar:
- third-person/isometric-feeling camera
- dense, hand-authored-looking 3D spaces
- strong verticality and readable silhouettes
- wet/dark materials
- cinematic lighting
- atmospheric fog
- rain/weather potential
- clear interaction prompts
- compact RPG HUD
- exploration-focused environments

We will take the **visual language and production goals** as inspiration, while building our own world, characters, UI and identity.

## Core systems

### 1. Engine
- Three.js renderer
- 4K/1440p/1080p dynamic quality
- resolution scaling
- shadows
- tone mapping
- post-processing
- GPU-friendly instancing
- performance diagnostics

### 2. Player
- third-person controller
- collision
- locomotion state machine
- idle/walk/run/sprint
- interaction
- emotes
- camera collision

### 3. Modular character
Equipment slots are designed from day one:
- hair
- headwear
- face/accessories
- shirt
- hoodie
- jacket
- vest
- gloves
- pants/shorts
- shoes
- backpack
- special accessories

All wearable items use the same character skeleton/rig where possible so animations remain synchronized.

### 4. World
- connected districts
- streets and alleys
- interiors
- rooftops
- underground areas
- shops
- apartments
- industrial zones
- secrets
- NPC navigation
- weather
- day/night
- ambient VFX

### 5. Creatures
- 3D models
- rigs
- animation sets
- abilities
- damage/status reactions
- defeat states
- VFX

### 6. Gameplay
The old game is mined for proven concepts:
- monster collection
- battles
- inventory
- items
- quests
- NPC interactions
- shops
- fishing
- grow mechanics
- saves
- audio
- online-ready data boundaries

## Milestone order

1. **Foundation** — renderer, camera, player, build pipeline
2. **Character** — GLB/GLTF loading, rig, animation state machine
3. **Equipment** — modular clothing and accessories
4. **Prototype district** — first high-quality playable area
5. **Interaction** — NPCs, pickups, doors, shops
6. **Creatures** — first complete 3D creature
7. **Combat** — real-time/turn hybrid design based on old systems
8. **World systems** — weather, day/night, interiors
9. **Save/data** — persistent player/world state
10. **Polish** — VFX, audio, UI, performance and 4K tuning

## Definition of done for each milestone

A milestone is not considered complete because files exist. It is complete when:
- TypeScript builds successfully
- the browser starts without runtime errors
- the feature is playable/testable
- performance is measured
- obvious edge cases are handled
- the README/changelog documents the current state

The user should primarily **test, play and report issues**. Implementation and repository maintenance should be handled through GitHub commits.
