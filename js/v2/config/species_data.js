// ============================================================
// Tardigradia 2.0 — Species Data Configuration
// Subatomic-to-macroscopic mappings, trophic roles, defaults
// ============================================================

// ── DEFAULT PARAMS (hard-code these to adjust starting values) ──────────────
const DEFAULT_PARAMS = {
  resolution:      'medium',  // 'low' | 'medium' | 'high'
  tardigrades:     30,        // range 1-200
  bacteria:        100,       // range 10-500
  amoebae:         50,        // range 5-300
  decomposers:     40,        // range 5-200
  special:         20,        // range 1-100
  parasites:       10,        // range 0-50
  larmorFreq:      1.0,       // range 0.1-4.0  → creature speed multiplier
  fluidViscosity:  0.5,       // range 0.1-2.0  → resistance to movement
  resourceRegen:   1.0,       // range 0.1-5.0  → nutrient refresh rate
  coherence:       0.6,       // range 0.0-1.0  → flocking tightness
  trailsOn:        true,
  glowOn:          true,
};

// ── RESOLUTION CAPS ──────────────────────────────────────────────────────────
const RESOLUTION_CAPS = {
  low:    { maxCreatures: 120,  trailLength: 0,   glowEffects: false, particleFields: false },
  medium: { maxCreatures: 380,  trailLength: 40,  glowEffects: true,  particleFields: true  },
  high:   { maxCreatures: 750,  trailLength: 120, glowEffects: true,  particleFields: true  },
};

// ── TROPHIC TIERS ────────────────────────────────────────────────────────────
const TIERS = {
  PRODUCER:    0,
  PRIMARY:     1,
  SECONDARY:   2,
  APEX:        3,
  DECOMPOSER:  4,
  COMMENSAL:   5,
  PARASITE:    6,
  SPECIAL:     7,
};

// ── SPECIES CATALOG ──────────────────────────────────────────────────────────
// Each entry maps a microbe species to its subatomic analogue and ecosystem role.
// imageDir: folder under images/ containing the creature's images.
// physicsType: behaviour key used by physics.js.
// color: glow/trail tint (hex string).
// size: canvas render size in world units.
// speed: base px/s before larmorFreq multiplier.
// energyMax, eatRange, eatTiers: ecology params.
const SPECIES_CATALOG = [

  // ── APEX ─────────────────────────────────────────────────────────────────
  {
    key:           'tardigrade',
    name:          'Hypsibius Dujardini',
    phylum:        'Tardigrada',
    tier:          TIERS.APEX,
    group:         'tardigrades',
    particleType:  'electron',       // Clifford attractor worldline
    imageDir:      'images/02_Tardigrada',
    color:         '#38bdf8',
    glowColor:     'rgba(56,189,248,0.5)',
    size:          22,
    speed:         55,
    energyMax:     200,
    eatRange:      18,
    eatTiers:      [TIERS.SECONDARY, TIERS.PRIMARY, TIERS.PRODUCER],
    reproduceEnergy: 160,
    lifespan:      3600,
    swarm:         false,            // solitary apex hunter
    targetRatio:   0.08,             // fraction of total population
  },

  // ── BACTERIA / PRODUCERS ─────────────────────────────────────────────────
  {
    key:           'acidobacterium',
    name:          'Acidobacterium Capsulatum',
    phylum:        'Acidobacteria',
    tier:          TIERS.PRODUCER,
    group:         'bacteria',
    particleType:  'higgs',          // central scalar, mass-giving
    imageDir:      'images/03_Acidobacterium_Capsulatum',
    color:         '#ec4899',
    glowColor:     'rgba(236,72,153,0.4)',
    size:          10,
    speed:         20,
    energyMax:     60,
    eatRange:      0,
    eatTiers:      [],               // producers consume nutrients, not creatures
    reproduceEnergy: 45,
    lifespan:      600,
    swarm:         true,
    targetRatio:   0.12,
  },
  {
    key:           'bifidobacterium_bifidum',
    name:          'Bifidobacterium Bifidum',
    phylum:        'Acidobacteria',
    tier:          TIERS.PRODUCER,
    group:         'bacteria',
    particleType:  'higgs',
    imageDir:      'images/05_Bifidobacterium_Bifidum',
    color:         '#f472b6',
    glowColor:     'rgba(244,114,182,0.4)',
    size:          9,
    speed:         25,
    energyMax:     55,
    eatRange:      0,
    eatTiers:      [],
    reproduceEnergy: 40,
    lifespan:      500,
    swarm:         true,
    targetRatio:   0.10,
  },
  {
    key:           'micrococcus',
    name:          'Micrococcus Luteus',
    phylum:        'Acidobacteria',
    tier:          TIERS.PRODUCER,
    group:         'bacteria',
    particleType:  'neutron',        // stable, neutral bystander
    imageDir:      'images/10_Micrococcus_Luteus',
    color:         '#94a3b8',
    glowColor:     'rgba(148,163,184,0.4)',
    size:          8,
    speed:         15,
    energyMax:     50,
    eatRange:      0,
    eatTiers:      [],
    reproduceEnergy: 38,
    lifespan:      480,
    swarm:         true,
    targetRatio:   0.10,
  },

  // ── PRIMARY CONSUMERS ─────────────────────────────────────────────────────
  {
    key:           'bifidobacterium_longum',
    name:          'Bifidobacterium Longum',
    phylum:        'Acidobacteria',
    tier:          TIERS.PRIMARY,
    group:         'amoebae',
    particleType:  'photon',         // light-like streak, fast
    imageDir:      'images/06_Bifidobacterium_Longum',
    color:         '#fef08a',
    glowColor:     'rgba(254,240,138,0.5)',
    size:          12,
    speed:         70,
    energyMax:     80,
    eatRange:      12,
    eatTiers:      [TIERS.PRODUCER],
    reproduceEnergy: 60,
    lifespan:      400,
    swarm:         false,
    targetRatio:   0.08,
  },
  {
    key:           'gardnerella',
    name:          'Gardnerella Vaginalis',
    phylum:        'Acidobacteria',
    tier:          TIERS.PRIMARY,
    group:         'amoebae',
    particleType:  'pion',           // fast orbital consumer
    imageDir:      'images/08_Gardnerella_Vaginalis',
    color:         '#86efac',
    glowColor:     'rgba(134,239,172,0.4)',
    size:          13,
    speed:         58,
    energyMax:     75,
    eatRange:      12,
    eatTiers:      [TIERS.PRODUCER],
    reproduceEnergy: 58,
    lifespan:      450,
    swarm:         true,
    targetRatio:   0.06,
  },
  {
    key:           'nocardia',
    name:          'Nocardia Asteroides',
    phylum:        'Acidobacteria',
    tier:          TIERS.PRIMARY,
    group:         'amoebae',
    particleType:  'kaon',           // fast orbital
    imageDir:      'images/12_Nocardia_Asteroides',
    color:         '#fcd34d',
    glowColor:     'rgba(252,211,77,0.4)',
    size:          11,
    speed:         62,
    energyMax:     70,
    eatRange:      11,
    eatTiers:      [TIERS.PRODUCER],
    reproduceEnergy: 52,
    lifespan:      350,
    swarm:         true,
    targetRatio:   0.05,
  },

  // ── SECONDARY CONSUMERS ───────────────────────────────────────────────────
  {
    key:           'acanthamoeba',
    name:          'Acanthamoeba Castellanii',
    phylum:        'Amoebozoa',
    tier:          TIERS.SECONDARY,
    group:         'amoebae',
    particleType:  'proton',         // tight hadronic orbit, strong
    imageDir:      'images/14_Acanthamoeba_Castellanii',
    color:         '#f43f5e',
    glowColor:     'rgba(244,63,94,0.5)',
    size:          18,
    speed:         38,
    energyMax:     130,
    eatRange:      16,
    eatTiers:      [TIERS.PRIMARY, TIERS.PRODUCER],
    reproduceEnergy: 100,
    lifespan:      1200,
    swarm:         false,
    targetRatio:   0.06,
  },
  {
    key:           'amoeba_proteus',
    name:          'Amoeba Proteus',
    phylum:        'Amoebozoa',
    tier:          TIERS.SECONDARY,
    group:         'amoebae',
    particleType:  'muon',           // heavy, unstable, predatory
    imageDir:      'images/15_Amoeba_Proteus',
    color:         '#e879f9',
    glowColor:     'rgba(232,121,249,0.5)',
    size:          20,
    speed:         28,
    energyMax:     150,
    eatRange:      18,
    eatTiers:      [TIERS.PRIMARY, TIERS.PRODUCER],
    reproduceEnergy: 115,
    lifespan:      1500,
    swarm:         false,
    targetRatio:   0.05,
  },

  // ── DECOMPOSERS ───────────────────────────────────────────────────────────
  {
    key:           'actinomyces',
    name:          'Actinomyces Israelii',
    phylum:        'Acidobacteria',
    tier:          TIERS.DECOMPOSER,
    group:         'decomposers',
    particleType:  'gluon',          // branching hyphae, binding
    imageDir:      'images/04_Actinomyces_Israelii',
    color:         '#f97316',
    glowColor:     'rgba(249,115,22,0.4)',
    size:          11,
    speed:         18,
    energyMax:     70,
    eatRange:      14,
    eatTiers:      [TIERS.DECOMPOSER],  // eats corpses (energy from dead)
    reproduceEnergy: 52,
    lifespan:      800,
    swarm:         true,
    targetRatio:   0.07,
  },
  {
    key:           'streptomyces',
    name:          'Streptomyces Coelicolor',
    phylum:        'Acidobacteria',
    tier:          TIERS.DECOMPOSER,
    group:         'decomposers',
    particleType:  'axion',          // slow BEC-like clustering
    imageDir:      'images/13_Streptomyces_Coelicolor',
    color:         '#10b981',
    glowColor:     'rgba(16,185,129,0.4)',
    size:          10,
    speed:         12,
    energyMax:     65,
    eatRange:      13,
    eatTiers:      [TIERS.DECOMPOSER],
    reproduceEnergy: 48,
    lifespan:      900,
    swarm:         true,
    targetRatio:   0.06,
  },
  {
    key:           'brevibacterium',
    name:          'Brevibacterium Linens',
    phylum:        'Acidobacteria',
    tier:          TIERS.DECOMPOSER,
    group:         'decomposers',
    particleType:  'wboson',         // short-range rapid decay lifecycle
    imageDir:      'images/07_Brevibacterium_Linens',
    color:         '#fb7185',
    glowColor:     'rgba(251,113,133,0.4)',
    size:          9,
    speed:         35,
    energyMax:     50,
    eatRange:      10,
    eatTiers:      [TIERS.DECOMPOSER],
    reproduceEnergy: 38,
    lifespan:      250,
    swarm:         true,
    targetRatio:   0.05,
  },

  // ── SPECIAL / EMERGENT ────────────────────────────────────────────────────
  {
    key:           'dictyostelium_disc',
    name:          'Dictyostelium Discoideum',
    phylum:        'Amoebozoa',
    tier:          TIERS.SPECIAL,
    group:         'special',
    particleType:  'demon',          // acoustic pheromone wave propagation
    imageDir:      'images/16_Dictyostelium_Discoideum',
    color:         '#4c1d95',
    glowColor:     'rgba(76,29,149,0.6)',
    size:          14,
    speed:         45,
    energyMax:     90,
    eatRange:      12,
    eatTiers:      [TIERS.PRODUCER, TIERS.PRIMARY],
    reproduceEnergy: 70,
    lifespan:      700,
    swarm:         true,             // aggregates when triggered
    targetRatio:   0.05,
  },
  {
    key:           'dictyostelium_mucc',
    name:          'Dictyostelium Mucoroides',
    phylum:        'Amoebozoa',
    tier:          TIERS.SPECIAL,
    group:         'special',
    particleType:  'demon',
    imageDir:      'images/17_Dictyostelium_Mucoroides',
    color:         '#7c3aed',
    glowColor:     'rgba(124,58,237,0.5)',
    size:          13,
    speed:         42,
    energyMax:     85,
    eatRange:      12,
    eatTiers:      [TIERS.PRODUCER, TIERS.PRIMARY],
    reproduceEnergy: 65,
    lifespan:      650,
    swarm:         true,
    targetRatio:   0.04,
  },

  // ── COMMENSAL / GHOST ─────────────────────────────────────────────────────
  {
    key:           'endolimax',
    name:          'Endolimax Nana',
    phylum:        'Amoebozoa',
    tier:          TIERS.COMMENSAL,
    group:         'special',
    particleType:  'neutrino',       // ghostly, flavor oscillation
    imageDir:      'images/19_Endolimax_Nana',
    color:         '#67e8f9',
    glowColor:     'rgba(103,232,249,0.3)',
    size:          8,
    speed:         80,               // fast pass-through
    energyMax:     40,
    eatRange:      0,
    eatTiers:      [],               // commensals don't eat creatures
    reproduceEnergy: 30,
    lifespan:      300,
    swarm:         false,
    targetRatio:   0.04,
  },

  // ── PARASITES ─────────────────────────────────────────────────────────────
  {
    key:           'entamoeba_coli',
    name:          'Entamoeba Coli',
    phylum:        'Amoebozoa',
    tier:          TIERS.PARASITE,
    group:         'parasites',
    particleType:  'quark',          // confined, intracellular
    imageDir:      'images/20_Entamoeba_Coli',
    color:         '#fbbf24',
    glowColor:     'rgba(251,191,36,0.4)',
    size:          10,
    speed:         30,
    energyMax:     65,
    eatRange:      10,
    eatTiers:      [TIERS.PRODUCER, TIERS.PRIMARY],  // drains energy slowly
    reproduceEnergy: 50,
    lifespan:      500,
    swarm:         false,
    targetRatio:   0.04,
  },
  {
    key:           'mycobacterium',
    name:          'Mycobacterium Tuberculosis',
    phylum:        'Acidobacteria',
    tier:          TIERS.PARASITE,
    group:         'parasites',
    particleType:  'neutralino',     // slow dark matter drift, persistent
    imageDir:      'images/11_Mycobacterium_Tuberculosis',
    color:         '#a855f7',
    glowColor:     'rgba(168,85,247,0.4)',
    size:          9,
    speed:         14,
    energyMax:     80,
    eatRange:      9,
    eatTiers:      [TIERS.PRODUCER],
    reproduceEnergy: 60,
    lifespan:      2400,             // very long-lived
    swarm:         false,
    targetRatio:   0.04,
  },
];

// ── GROUP DEFINITIONS (for opening screen sliders) ───────────────────────────
const SPECIES_GROUPS = {
  tardigrades: { label: 'Tardigrades', defaultCount: DEFAULT_PARAMS.tardigrades,  min: 1,  max: 200 },
  bacteria:    { label: 'Bacteria',    defaultCount: DEFAULT_PARAMS.bacteria,     min: 10, max: 500 },
  amoebae:     { label: 'Amoebae',     defaultCount: DEFAULT_PARAMS.amoebae,      min: 5,  max: 300 },
  decomposers: { label: 'Decomposers', defaultCount: DEFAULT_PARAMS.decomposers,  min: 5,  max: 200 },
  special:     { label: 'Special',     defaultCount: DEFAULT_PARAMS.special,      min: 1,  max: 100 },
  parasites:   { label: 'Parasites',   defaultCount: DEFAULT_PARAMS.parasites,    min: 0,  max: 50  },
};

// ── PARTICLE-TYPE PHYSICS TRAITS (mirrors TGPU v2.0 behaviors) ───────────────
const PHYSICS_TRAITS = {
  electron:   { behaviorFn: 'cliffordAttractor', baseA: 0.15, baseB: 0.15, berryPhase: true },
  higgs:      { behaviorFn: 'centralAttractor',  attraction: 0.002 },
  neutron:    { behaviorFn: 'stableOrbit',       orbitR: 0 },
  photon:     { behaviorFn: 'linearStreak',      resetAtBoundary: true },
  pion:       { behaviorFn: 'mesOrbital',        orbitSpeed: 1.5 },
  kaon:       { behaviorFn: 'mesOrbital',        orbitSpeed: 1.8 },
  proton:     { behaviorFn: 'hadronicOrbit',     radius: 1.0 },
  muon:       { behaviorFn: 'cliffordAttractor', baseA: 0.20, baseB: 0.20, berryPhase: false },
  axion:      { behaviorFn: 'becCluster',        cohesionFactor: 0.6,  speed: 0.4 },
  gluon:      { behaviorFn: 'branchingAttract',  selfCoupling: 2.0 },
  demon:      { behaviorFn: 'acousticPropag',    vFactor: 0.387 },
  neutrino:   { behaviorFn: 'linearStreak',      resetAtBoundary: true, flavorOscillation: true },
  quark:      { behaviorFn: 'confinement',       radius: 1.2 },
  wboson:     { behaviorFn: 'shortRangeDecay',   boundRange: 5 },
  neutralino: { behaviorFn: 'darkDrift',         driftSpeed: 0.05 },
  graviton:   { behaviorFn: 'linearStreak',      resetAtBoundary: true, spinOrder: 2 },
};

// ── FOOD CHAIN INTERACTION TABLE ──────────────────────────────────────────────
// Returns energy granted when TIER_A eats TIER_B
function getEatEnergy(aTier, bTier) {
  const table = {
    [TIERS.APEX]:       { [TIERS.SECONDARY]: 80, [TIERS.PRIMARY]: 50, [TIERS.PRODUCER]: 25 },
    [TIERS.SECONDARY]:  { [TIERS.PRIMARY]: 45,   [TIERS.PRODUCER]: 20 },
    [TIERS.PRIMARY]:    { [TIERS.PRODUCER]: 30 },
    [TIERS.DECOMPOSER]: { [TIERS.DECOMPOSER]: 20 },  // eat corpses
    [TIERS.PARASITE]:   { [TIERS.PRODUCER]: 15,   [TIERS.PRIMARY]: 10 },
    [TIERS.SPECIAL]:    { [TIERS.PRODUCER]: 25,   [TIERS.PRIMARY]: 15 },
  };
  return (table[aTier] && table[aTier][bTier]) ? table[aTier][bTier] : 0;
}

// ── EXPORTS (global — no ES module bundler assumed) ───────────────────────────
window.SpeciesData = {
  DEFAULT_PARAMS,
  RESOLUTION_CAPS,
  TIERS,
  SPECIES_CATALOG,
  SPECIES_GROUPS,
  PHYSICS_TRAITS,
  getEatEnergy,
};
