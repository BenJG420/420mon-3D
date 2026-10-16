# District atmosphere — v29

The target is the owner's dark, rain-soaked industrial courtyard reference:
small wet paving, dark blue-green buildings, bright warm-white/amber pools of
light, cool shadows, low haze and narrow diagonal rain. The scene stays readable
around the player. The original elevated third-person camera and every source
map/collision/interaction remain in place; this package changes presentation.

## Pipeline

- Every original district has a presentation profile in `graphics-profile.ts`:
  warm key, cool fill/rim, exposure, fog, wetness, rain and color grade. Kapsel and
  Rajko's cellar stay warm/readable. Actual indoor maps never receive rainfall;
  the sewer is wet and hazy without open-sky rain.
- Local procedural PBR tiles provide albedo, roughness and normal detail in
  physical world units. Wet surfaces use a clearcoat layer. Irregular puddles
  and the actual lamp fixtures contribute soft pools/streaks of reflected light.
- A generated HDR environment, filtered by PMREM, supplies real material
  environment reflections. These are an approximate lighting environment,
  not screen-space ray tracing or exact reflections of every moving character.
- Streetlights are selected near the player, capped at four outdoors/five
  indoors; facade details are merged by material. The directional shadow volume
  follows the player. Original building occlusion fade stays intact.
- Pooled GPU streaks, world-anchored ground rings and soft haze provide weather.
  They update uniforms instead of recreating geometry every frame. Indoor dust
  replaces rainfall. Weather resources and the current reflection target have
  their own disposal lifecycle.
- One world composer performs optional HDR bloom, linear color grading,
  vignette/fine grain, ACES/sRGB output and FXAA. Output conversion runs once;
  DOM menus and the 2D minimap are not blurred or color-graded. The existing
  separate monster viewer still pauses world GPU drawing while open.

## Quality

`Grafik` offers Automatisch, Hoch and Sparsam. This preference is independent of
all gameplay save slots. Automatic mode uses the inexpensive grading path on
coarse-pointer/low-core devices, with reduced weather/shadows and a pixel budget.
High mode enables bounded bloom when floating-point targets are supported;
its brightest target is capped at 480×270. Low/unsupported-device mode retains
grading and FXAA without the bloom chain. A failed composer can fall back to the
ordinary world renderer.

The world pixel budgets are 1.2 MP for Sparsam, 1.6 MP for automatic mobile,
3.69 MP for automatic desktop, and 8.29 MP for Hoch. High can reach native 4K;
phone DPR3 does not automatically triple internal rendering resolution. Resizing
updates both the renderer and post targets. Physical Android and sustained
native-4K performance remain device checks, not guarantees from emulation.

No player/NPC replacement is included: licensed rigged characters and animation
are the next two packages. Their source and redistribution terms belong in
[ASSET_ATTRIBUTION.md](ASSET_ATTRIBUTION.md). Existing monster models, clothing,
quests, battles, growth and saves remain connected.
