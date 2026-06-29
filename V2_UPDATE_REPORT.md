# Tardigradia 2.0 — V2 Update Report (landolil/lol)

**Repository:** `https://github.com/landolil/lol`  
**Date:** 2026-06-29  
**Version:** 2.0.0  
**Live URL:** `https://landolil.github.io/lol/index_v2.html`

---

## How to Use

Open `index_v2.html` alongside the original `index.html`.  
No existing files were deleted or overwritten. All v2 files are new.

---

## New Files

```
index_v2.html             Main V2 entry point
V2_UPDATE_REPORT.md       This document
css/styles_v2.css         Dark-mode extension of styles.css
css/v2/biome.css          Canvas layer styles, sparks, toast notifications
css/v2/ui.css             HUD panels, opening screen, Orbitron/Rajdhani fonts
js/v2/config/
  species_data.js         All species, trophic mappings, default params
js/v2/core/
  physics.js              Curl-noise flow field, thermal convection, glass boundary,
                          bubble buoyancy, Reynolds flocking, 15 TGPU behaviours
  creature.js             Creature class — bubble boarding, lifecycle, draw
  ecosystem.js            Resource grid, food chain, Lotka-Volterra auto-balance
  biome_engine.js         Canvas render loop, BubbleSystem, glass tube visual
js/v2/ui/
  opening_screen.js       Launch config screen (species counts, resolution, physics)
  hud.js                  Collapsible HUD — all controls + Tube Environment panel
  pov_camera.js           First-person creature tracking + microscope eyepiece
  save_load.js            localStorage save/load with 5-min autosave
  screensaver.js          Wake Lock API anti-screensaver
```

---

## Feature Matrix

| Feature | Description |
|---------|-------------|
| **Core biome** | Living 2D simulation — creatures eat, breed, die, cycle nutrients |
| **A** | HUD panels slide off-screen; pull-tabs remain; `☰ Hide All` master toggle |
| **B** | Click creature → first-person POV; canvas rotates to heading at 3.5× zoom |
| **C** | Screen Wake Lock API + pointer-move fallback; toggle in HUD |
| **D** | Per-group population sliders + `+5`/`−5` quick buttons |
| **E** | `💾 Save` / `📂 Load` to localStorage; 5-min autosave; green flash on save |
| **F** | Opening config screen: resolution, 6 population groups, physics seed |
| **G** | `🎲` toggle per control for sinusoidal parameter randomisation |
| **H** | Low/Medium/High resolution (120/380/750 creatures); mid-sim adjustable |

---

## LOL-Only Upgrades (beyond Study repo v2)

### Glass Test Tube World
The simulation world is bounded by an ellipse matching the viewport.
- Creatures **deflect** off the glass wall with velocity reflection
- The canvas draws a glowing cyan rim with 8 refraction shimmer arcs
- A radial dark gradient makes the scene feel like a real specimen in immersion fluid
- Only streak particles (photons, neutrinos, gravitons) pass through the walls

### Living Bubbles — Physics Coupled
The existing 250 SVG bubbles from `bubbles.js` are now physics actors:
- `BubbleSystem` tracks their DOM positions every 0.5s
- Bubbles generate **upward buoyancy drift** in the flow field (60-unit radius)
- Fast creatures (Bifidobacterium, Gardnerella, Nocardia) can **board bubbles** — they ride upward, tilted at 45°
- Faint dashed lines connect riders to their bubble
- When **3+ creatures** board one bubble: burst — bubble fades, riders scatter, spark fires
- Bubble recovers full opacity after 8 seconds

### Thermal Convection Flow Field
The curl-noise flow has a temperature-gradient overlay:
- Warm base → upward thrust; cool apex → return flow down the sides
- Creates natural **convection loops** — creatures circulate like real aqueous media in a heated tube

### POV Microscope Eyepiece
When tracking a creature in POV mode:
- **Black circular vignette** masks outside the eyepiece circle
- **Chromatic aberration rings**: thin red (outer) and cyan (inner) around the lens edge
- **Crosshair reticle** with centre tick marks (faint, like a real ocular reticle)
- **Magnification label** in corner: `140×` (nominal 40× × 3.5× zoom factor)
- Creature's species colour dot shown at top-left of field

### Tube Environment HUD
The right control panel now includes a live "TUBE ENVIRONMENT" section:
- **pH**: `7.40` ± small drift (larger oscillation if Random Mode active)
- **Temp °C**: `37.0` ± small drift
- **Bubbles**: count of active (non-burst) bubbles
- **Bubble Riders**: total creatures currently riding bubbles
- **Convection**: live direction label (`↑ Ascending`, `→ Clockwise ↻`, etc.)

---

## Subatomic → Macroscopic Mapping (summary)

| Particle | Microbe | Behaviour |
|----------|---------|-----------|
| Electron | Tardigrade (Apex) | Clifford attractor worldline |
| Higgs | Bacteria (Producer) | Central scalar attraction + nutrient harvest |
| Photon | Bifidobacterium (Primary) | Light-streak + bubble rider |
| Proton | Acanthamoeba (Secondary) | Hadronic orbit |
| Axion | Streptomyces (Decomposer) | BEC slow coherent clustering |
| Pines Demon | Dictyostelium (Special) | Pheromone wave aggregation |
| Neutrino | Endolimax (Commensal) | Ghost streak, wall-passing |
| Quark | Entamoeba (Parasite) | Tight confined orbit |
| Muon | Amoeba Proteus (Secondary) | Heavy Clifford attractor |
| Gluon | Actinomyces (Decomposer) | Branching self-coupling |
| Pion/Kaon | Gardnerella/Nocardia | Fast meson orbital + bubble rider |
| Neutralino | Mycobacterium (Parasite) | Slow dark drift |

---

## Configurable Defaults

Edit `js/v2/config/species_data.js` → `DEFAULT_PARAMS`:

```javascript
const DEFAULT_PARAMS = {
  resolution:      'medium',  // 'low'|'medium'|'high'
  tardigrades:     30,
  bacteria:        100,
  amoebae:         50,
  decomposers:     40,
  special:         20,
  parasites:       10,
  larmorFreq:      1.0,       // speed multiplier
  fluidViscosity:  0.5,
  resourceRegen:   1.0,
  coherence:       0.6,
};
```

And `RESOLUTION_CAPS` for creature/trail limits per resolution tier.

---

## V1 Compatibility

All original features of `index.html` still work via `index_v2.html`:
- Background random image setter
- Bubble SVG animation (now also physics-coupled)
- Slideshow / Stop Slideshow
- Release Microbes / Spinning icons (DOM variant)
- CrowdSource page
- PDF download
- Logoshow / Stencilshow / Speech

---

## Known Limitations

- Icon images (`_icon.png` variants) must exist beside their `.jpg` originals
- localStorage save clears with browser data — export JSON via `JSON.stringify(BiomeEngine.getState())` in console for backups
- Wake Lock requires HTTPS (GitHub Pages serves HTTPS — should work on live site)
