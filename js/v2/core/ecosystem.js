// ============================================================
// Tardigradia 2.0 — Ecosystem Engine
// Lotka-Volterra food chains, resource grid, auto-balance,
// and corpse-nutrient cycling.
// ============================================================

const Ecosystem = (() => {

  // ── RESOURCE GRID ─────────────────────────────────────────────
  // A 50 × 33 grid of nutrient tiles covering the 3000×2000 world.
  const GRID_W = 50, GRID_H = 33;
  const TILE_W = Physics.WORLD_W / GRID_W;
  const TILE_H = Physics.WORLD_H / GRID_H;
  const MAX_NUTRIENT = 100;
  let grid = null;

  function initGrid() {
    grid = new Float32Array(GRID_W * GRID_H);
    for (let i = 0; i < grid.length; i++) {
      grid[i] = MAX_NUTRIENT * (0.4 + Math.random() * 0.6);
    }
  }

  function _tileIdx(worldX, worldY) {
    const tx = Math.floor(worldX / TILE_W) % GRID_W;
    const ty = Math.floor(worldY / TILE_H) % GRID_H;
    return Math.max(0, ty * GRID_W + tx);
  }

  // Producers harvest nutrients from their tile.
  function harvestNutrient(worldX, worldY, regenRate) {
    const idx = _tileIdx(worldX, worldY);
    const available = grid[idx];
    const take = Math.min(available, 6 * regenRate);
    grid[idx] -= take;
    return take;
  }

  // Regenerate all tiles each frame.
  function regenerateGrid(dt, regenRate) {
    const rate = regenRate * 2 * dt;
    for (let i = 0; i < grid.length; i++) {
      grid[i] = Math.min(MAX_NUTRIENT, grid[i] + rate);
    }
  }

  // Corpse decomposition adds nutrients back to grid.
  function addCorpseNutrients(worldX, worldY, amount) {
    const idx = _tileIdx(worldX, worldY);
    grid[idx] = Math.min(MAX_NUTRIENT, grid[idx] + amount);
  }

  // Returns normalised fertility 0-1 at a world position (for rendering).
  function getFertility(worldX, worldY) {
    return grid[_tileIdx(worldX, worldY)] / MAX_NUTRIENT;
  }

  // ── FOOD CHAIN INTERACTION ─────────────────────────────────────
  // Check if creatureA can eat creatureB; if so, perform eat.
  function tryEat(a, b, params) {
    if (!a.alive || !b.alive) return false;
    if (a.tier === undefined || b.tier === undefined) return false;

    const { eatRange, eatTiers, tier } = a.species;
    if (!eatTiers.includes(b.species.tier)) return false;

    const dx = a.x - b.x, dy = a.y - b.y;
    if (dx * dx + dy * dy > eatRange * eatRange) return false;

    const eatEnergy = window.SpeciesData.getEatEnergy(tier, b.species.tier);
    if (eatEnergy <= 0) return false;

    a.eat(b, eatEnergy);
    // Drop nutrients from corpse
    addCorpseNutrients(b.x, b.y, b.species.energyMax * 0.3);
    return true;
  }

  // ── CORPSE DECAY ──────────────────────────────────────────────
  function tickCorpses(creatures, dt) {
    for (const c of creatures) {
      if (!c.alive && c._decomposing) {
        c._decomposeTimer -= dt;
        if (c._decomposeTimer <= 0) {
          c._decomposing = false;
          addCorpseNutrients(c.x, c.y, c.species.energyMax * 0.5);
        }
      }
    }
  }

  // ── AUTO-BALANCE (Lotka-Volterra inspired) ─────────────────────
  // Every BALANCE_INTERVAL seconds, check population vs targets.
  // Spawn emergency creatures if a tier is collapsing.
  // Returns an array of new Creature objects to add.

  let _balanceTimer = 0;
  const BALANCE_INTERVAL = 5; // seconds

  function autoBalance(creatures, biomeParams) {
    // Count live creatures per group
    const counts = {};
    for (const c of creatures) {
      if (!c.alive) continue;
      counts[c.group] = (counts[c.group] || 0) + 1;
    }

    const liveTotal = Object.values(counts).reduce((s, v) => s + v, 0) || 1;
    const newCreatures = [];
    const CATALOG = window.SpeciesData.SPECIES_CATALOG;
    const CAP     = window.SpeciesData.RESOLUTION_CAPS[biomeParams.resolution];
    const maxPop  = CAP ? CAP.maxCreatures : 380;

    if (creatures.filter(c => c.alive).length >= maxPop) return newCreatures;

    for (const sp of CATALOG) {
      const target  = sp.targetRatio * maxPop
        * (biomeParams['pop_' + sp.group] !== undefined
           ? biomeParams['pop_' + sp.group] : 1.0);
      const current = counts[sp.group] || 0;

      if (current / Math.max(target, 1) < 0.30) {
        // Critical collapse: emergency spawn 2-4 of this species
        const n = 2 + Math.floor(Math.random() * 3);
        for (let i = 0; i < n; i++) {
          const x = Math.random() * Physics.WORLD_W;
          const y = Math.random() * Physics.WORLD_H;
          newCreatures.push(new Creature(sp, x, y));
        }
      }
    }

    return newCreatures;
  }

  function tickBalance(dt, creatures, biomeParams) {
    _balanceTimer += dt;
    if (_balanceTimer < BALANCE_INTERVAL) return [];
    _balanceTimer = 0;
    return autoBalance(creatures, biomeParams);
  }

  // ── BENEVOLENCE METRICS (mirrors TGPU Benevolence Monitor) ────
  // Returns {action, benevolence, coherence} for the chart.
  function computeMetrics(creatures, biomeParams) {
    let action = 0, benevolence = 0, coherence = 0;
    let n = 0;
    const TIERS = window.SpeciesData.TIERS;

    for (const c of creatures) {
      if (!c.alive) continue;
      n++;
      action      += (c.vx * c.vx + c.vy * c.vy) * 0.001;
      if (c.tier === TIERS.PRODUCER)   benevolence += 1.2;
      if (c.tier === TIERS.DECOMPOSER) benevolence += 0.8;
      if (c.tier === TIERS.APEX)       benevolence += 1.5;
      if (c.tier === TIERS.SPECIAL)    coherence   += 1.5;
      if (c.tier === TIERS.COMMENSAL)  coherence   += 0.5;
    }

    if (n === 0) return { action: 0, benevolence: 0, coherence: 0 };
    const gridFertility = grid
      ? Array.from(grid).reduce((s, v) => s + v, 0) / (grid.length * MAX_NUTRIENT)
      : 0.5;

    benevolence *= gridFertility * biomeParams.resourceRegen;

    return {
      action:      Math.min(10, action / n * 10),
      benevolence: Math.min(10, benevolence / n * 15),
      coherence:   Math.min(10, coherence / n * 20),
    };
  }

  // ── EVENT TRIGGERS (TGPU-mapped) ──────────────────────────────
  function triggerPerturb(creatures) {
    for (const c of creatures) {
      if (!c.alive) continue;
      c.vx += (Math.random() - 0.5) * 80;
      c.vy += (Math.random() - 0.5) * 80;
      c._a   = Math.random() * 0.4 + 0.05;
      c._b   = Math.random() * 0.4 + 0.05;
      c._phase += Math.random() * Math.PI;
    }
  }

  function triggerFusion(creatures) {
    // Mass reproduction: every creature with >60% energy reproduces
    const newOnes = [];
    for (const c of creatures) {
      if (!c.alive) continue;
      if (c.energy / c.species.energyMax > 0.6) {
        c._reproduceCooldown = 0;
        const child = c.reproduce();
        if (child) newOnes.push(child);
      }
    }
    return newOnes;
  }

  function triggerDemon(creatures) {
    // Trigger pheromone aggregation for Dictyostelium species
    const specials = creatures.filter(c => c.alive && c.species.particleType === 'demon');
    if (specials.length === 0) return null;
    const origin = specials[Math.floor(Math.random() * specials.length)];
    return { x: origin.x, y: origin.y, timer: 8.0 };
  }

  // ── PUBLIC API ────────────────────────────────────────────────
  return {
    initGrid,
    regenerateGrid,
    harvestNutrient,
    addCorpseNutrients,
    getFertility,
    tryEat,
    tickCorpses,
    tickBalance,
    triggerPerturb,
    triggerFusion,
    triggerDemon,
    computeMetrics,
    getGrid: () => grid,
  };

})();

window.Ecosystem = Ecosystem;
