# 420mon-3D

A new-generation 3D game built from the original 420mon project as a gameplay/design reference, not as a rendering upgrade.

## Vision

Build a fully explorable 3D world with:
- 4K-ready rendering and scalable quality
- third-person player controller
- modular character equipment and clothing
- animated creatures/monsters
- exploration, interaction, quests, inventory and combat
- dynamic weather and day/night
- atmospheric lighting, rain, particles and post-processing
- persistent saves
- a clean data-driven architecture

## Reference

The original `420mon` repository remains untouched and is used only to recover gameplay ideas, data structures and proven systems.

The supplied visual reference is an AI-generated third-person/isometric-style 3D RPG scene: dense environment geometry, wet surfaces, strong atmospheric lighting, readable UI, exploration markers and a dark cinematic presentation.

## Development rule

The goal is that the owner mainly has to **run, test and report what feels wrong**. Code, architecture and implementation should be maintained in GitHub in small, testable milestones.

## Current milestone

Milestone 0 establishes the 3D runtime:
1. Vite + TypeScript
2. Three.js renderer
3. scalable render resolution
4. third-person camera
5. controllable placeholder player
6. lighting, fog and ground
7. debug HUD
8. GitHub Actions build validation

Next: real character model pipeline, animation controller and modular clothing/equipment.
