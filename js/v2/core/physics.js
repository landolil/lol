// ============================================================
// Tardigradia 2.0 — Physics Engine (LOL Enhanced)
// Upgrades over Study v2:
//   • Glass ellipse boundary (reflection, no wrap)
//   • Bubble buoyancy coupling (upward drift near bubbles)
//   • Thermal convection overlay on curl-noise field
//   • Retained: all TGPU particle behaviours, Reynolds flocking
// ============================================================

const Physics = (() => {

  const TWO_PI = Math.PI * 2;

  // World dimensions (set by BiomeEngine on resize)
  let WORLD_W = 3000;
  let WORLD_H = 2000;
  // Glass ellipse centre and radii (set by BiomeEngine)
  let GLASS_CX = WORLD_W / 2;
  let GLASS_CY = WORLD_H / 2;
  let GLASS_RX = WORLD_W * 0.46;
  let GLASS_RY = WORLD_H * 0.46;

  function setWorldSize(w, h) {
    WORLD_W  = w;  WORLD_H  = h;
    GLASS_CX = w / 2; GLASS_CY = h / 2;
    GLASS_RX = w * 0.46;
    GLASS_RY = h * 0.46;
  }

  // ── PERLIN NOISE ─────────────────────────────────────────────
  const _p = new Uint8Array(512);
  const _perm = new Uint8Array(256);
  (function initPerm() {
    for (let i = 0; i < 256; i++) _perm[i] = i;
    for (let i = 255; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [_perm[i], _perm[j]] = [_perm[j], _perm[i]];
    }
    for (let i = 0; i < 512; i++) _p[i] = _perm[i & 255];
  })();

  function _fade(t) { return t * t * t * (t * (t * 6 - 15) + 10); }
  function _lerp(t, a, b) { return a + t * (b - a); }
  function _grad(hash, x, y) {
    const h = hash & 7, u = h < 4 ? x : y, v = h < 4 ? y : x;
    return ((h & 1) ? -u : u) + ((h & 2) ? -v : v);
  }
  function perlin2(x, y) {
    const X = Math.floor(x) & 255, Y = Math.floor(y) & 255;
    x -= Math.floor(x); y -= Math.floor(y);
    const u = _fade(x), v = _fade(y);
    const a = _p[X]+Y, aa = _p[a], ab = _p[a+1], b = _p[X+1]+Y, ba = _p[b], bb = _p[b+1];
    return _lerp(v, _lerp(u, _grad(_p[aa],x,y), _grad(_p[ba],x-1,y)),
                    _lerp(u, _grad(_p[ab],x,y-1), _grad(_p[bb],x-1,y-1)));
  }

  // ── CURL NOISE + THERMAL CONVECTION ──────────────────────────
  // Returns {vx,vy} divergence-free flow.
  // Adds a convection overlay: warm bottom → upward; cool top → sideways return.
  function curlNoise(x, y, t) {
    const eps  = 0.01;
    const s    = 0.0006;
    const ts   = t * 0.00025;
    const n1   = perlin2(x * s,       y * s + ts);
    const n2   = perlin2(x * s + eps, y * s + ts);
    const n3   = perlin2(x * s,       y * s + eps + ts);
    const dvdy = (n3 - n1) / eps;
    const dvdx = (n2 - n1) / eps;
    let vx =  dvdy * 18;
    let vy = -dvdx * 18;

    // Thermal convection: heated bottom pushes up, cooled top flows sideways
    const yFrac = (y - GLASS_CY) / GLASS_RY; // -1 (top) to +1 (bottom)
    const convUp  = (yFrac + 1) * 0.5 * 14;  // stronger at bottom
    const convRet = Math.sin((x / WORLD_W) * Math.PI * 2) * 5; // side return
    vx += convRet;
    vy -= convUp;

    return { vx, vy };
  }

  // ── GLASS ELLIPSE BOUNDARY ────────────────────────────────────
  // Reflect creature off the inner surface of the glass ellipse.
  // Species that streak (photons/neutrinos/gravitons) use wrap instead.
  function glassBoundary(c) {
    const nx = (c.x - GLASS_CX) / GLASS_RX;
    const ny = (c.y - GLASS_CY) / GLASS_RY;
    const r2 = nx * nx + ny * ny;
    if (r2 < 1) return;          // still inside — nothing to do

    // Reflect velocity across ellipse surface normal
    const len = Math.sqrt(r2);
    const nnx = nx / len, nny = ny / len;
    const dot = c.vx * nnx + c.vy * nny;
    c.vx -= 2 * dot * nnx * 0.82;  // 0.82 = slight energy loss on bounce
    c.vy -= 2 * dot * nny * 0.82;

    // Push back inside (98% of boundary)
    const push = 0.972 / len;
    c.x = GLASS_CX + nx * GLASS_RX * push;
    c.y = GLASS_CY + ny * GLASS_RY * push;
  }

  // Wrap variant for streak particles only
  function wrapBoundary(c) {
    if (c.x < 0)       c.x += WORLD_W;
    if (c.x > WORLD_W) c.x -= WORLD_W;
    if (c.y < 0)       c.y += WORLD_H;
    if (c.y > WORLD_H) c.y -= WORLD_H;
  }

  // ── BUBBLE BUOYANCY FORCE ─────────────────────────────────────
  // bubbles: array of {wx, wy, riseSpeed} (world coords, built by BubbleSystem)
  // Returns a cumulative {vx,vy} nudge.
  function bubbleBuoyancy(cx, cy, bubbles) {
    let bvx = 0, bvy = 0;
    for (const b of bubbles) {
      const dx = cx - b.wx, dy = cy - b.wy;
      const d2 = dx * dx + dy * dy;
      const reach = 60 * 60;
      if (d2 > reach) continue;
      const strength = (1 - d2 / reach) * (b.riseSpeed || 20);
      bvy -= strength;  // upward
    }
    return { vx: bvx, vy: bvy };
  }

  // ── REYNOLDS FLOCKING ─────────────────────────────────────────
  function flockingForce(cx, cy, cvx, cvy, neighbors, params) {
    const { cohesion = 0.6, separation = 28, alignment = 0.4, perceptionR = 90 } = params;
    let sepX = 0, sepY = 0, aliX = 0, aliY = 0, cohX = 0, cohY = 0;
    let count = 0;
    for (const n of neighbors) {
      const dx = cx - n.x, dy = cy - n.y;
      const d  = Math.sqrt(dx*dx + dy*dy) || 0.001;
      if (d > perceptionR) continue;
      if (d < separation) { sepX += dx / d; sepY += dy / d; }
      aliX += n.vx; aliY += n.vy;
      cohX += n.x;  cohY += n.y;
      count++;
    }
    if (count === 0) return { vx: 0, vy: 0 };
    aliX /= count; aliY /= count;
    cohX  = (cohX / count) - cx;
    cohY  = (cohY / count) - cy;
    return {
      vx: sepX * 1.5 + (aliX - cvx) * alignment + cohX * cohesion * 0.01,
      vy: sepY * 1.5 + (aliY - cvy) * alignment + cohY * cohesion * 0.01,
    };
  }

  // ── PARTICLE-PHYSICS BEHAVIOURS (all 15 from Study v2) ─────
  function cliffordAttractor(c, dt, params) {
    const t  = params.time * 0.0004 * params.speed;
    const a  = c._a, b = c._b;
    const dx = Math.sin(a * c.y + t)    + Math.cos(b * c.x + t * 0.7);
    const dy = Math.sin(b * c.x - t*0.8)+ Math.cos(a * c.y - t);
    c._berryPhase += 0.01 * dx;
    return { dvx: dx * 2.0 * dt, dvy: dy * 2.0 * dt };
  }
  function centralAttractor(c, dt, params) {
    const t = params.time * 0.001 * params.speed;
    return {
      dvx: (-c.x * 0.001 + Math.sin(t*0.3+c._phase)*0.5) * dt*60,
      dvy: (-c.y * 0.001 + Math.cos(t*0.3+c._phase)*0.5) * dt*60,
    };
  }
  function linearStreak(c, dt, params) {
    c.x += Math.cos(c._phase) * params.speed * 120 * dt;
    c.y += Math.sin(c._phase) * params.speed * 120 * dt;
    wrapBoundary(c);
    return { dvx: 0, dvy: 0 };
  }
  function becCluster(c, dt, params) {
    const t = params.time * 0.0002 * params.speed;
    return {
      dvx: Math.sin(t*0.2+c._phase)*0.4*60*dt,
      dvy: Math.cos(t*0.15+c._phase)*0.4*60*dt,
    };
  }
  function hadronicOrbit(c, dt, params) {
    const t = params.time * 0.001 * params.speed;
    return {
      dvx: Math.sin(t+c._phase)*0.6*60*dt,
      dvy: Math.cos(t+c._phase)*0.6*60*dt,
    };
  }
  function mesOrbital(c, dt, params) {
    const t = params.time * 0.001 * params.speed;
    const s = c._orbitSpeed || 1.5;
    return { dvx: Math.sin(t*s+c._phase)*s*60*dt, dvy: Math.cos(t*s+c._phase)*s*60*dt };
  }
  function branchingAttract(c, dt, params) {
    const t = params.time * 0.0004 * params.speed;
    return {
      dvx: Math.sin(c._a*c.y*2+t*2)*2.5*dt,
      dvy: Math.cos(c._b*c.x*2+t*2)*2.5*dt,
    };
  }
  function acousticPropag(c, dt, params, demonOrigin) {
    const t = params.time * 0.001 * params.speed;
    let dvx = Math.sin(c._phase+t*0.387)*0.387*60*dt;
    let dvy = Math.cos(c._phase+t*0.387)*0.387*60*dt;
    if (demonOrigin) {
      const dx = demonOrigin.x - c.x, dy = demonOrigin.y - c.y;
      const d  = Math.sqrt(dx*dx+dy*dy) || 1;
      const pull = Math.min(1, 200/d);
      dvx += dx * pull * dt * 0.8;
      dvy += dy * pull * dt * 0.8;
    }
    return { dvx, dvy };
  }
  function confinement(c, dt, params) {
    const t = params.time * 0.001 * params.speed;
    const r = 80;
    c.x = c._confineCx + Math.sin(t*3+c._phase)*r;
    c.y = c._confineCy + Math.cos(t*3+c._a*c._phase)*r;
    return { dvx:0, dvy:0 };
  }
  function shortRangeDecay(c, dt, params) {
    const r = 200;
    const dvx = (Math.random()-0.5)*params.speed*120*dt;
    const dvy = (Math.random()-0.5)*params.speed*120*dt;
    if (Math.abs(c.x-c._spawnX)>r) c.x = c._spawnX+(Math.random()-0.5)*r;
    if (Math.abs(c.y-c._spawnY)>r) c.y = c._spawnY+(Math.random()-0.5)*r;
    return { dvx, dvy };
  }
  function darkDrift(c, dt, params) {
    const t = params.time * 0.001;
    return {
      dvx: Math.sin(t*0.05+c._phase)*0.8*60*dt,
      dvy: Math.cos(t*0.05)*0.5*60*dt,
    };
  }
  function stableOrbit(c, dt, params) {
    const t = params.time * 0.0005 * params.speed;
    return {
      dvx: Math.sin(t+c._phase)*0.3*60*dt,
      dvy: Math.cos(t*0.7+c._phase)*0.3*60*dt,
    };
  }

  const BEHAVIOUR_MAP = {
    cliffordAttractor, centralAttractor, linearStreak,
    becCluster, hadronicOrbit, mesOrbital, branchingAttract,
    acousticPropag, confinement, shortRangeDecay, darkDrift, stableOrbit,
  };

  function applyParticleBehaviour(c, dt, params, extras) {
    const fn = BEHAVIOUR_MAP[c._behaviorFn];
    if (!fn) return { dvx:0, dvy:0 };
    return fn(c, dt, params, extras ? extras.demonOrigin : null);
  }

  function limitSpeed(c, maxSpd) {
    const len = Math.sqrt(c.vx*c.vx + c.vy*c.vy);
    if (len > maxSpd) { c.vx = c.vx/len*maxSpd; c.vy = c.vy/len*maxSpd; }
  }

  // ── PUBLIC API ────────────────────────────────────────────────
  return {
    setWorldSize,
    curlNoise,
    glassBoundary,
    wrapBoundary,
    bubbleBuoyancy,
    flockingForce,
    applyParticleBehaviour,
    limitSpeed,
    perlin2,
    get WORLD_W() { return WORLD_W; },
    get WORLD_H() { return WORLD_H; },
    get GLASS_CX() { return GLASS_CX; },
    get GLASS_CY() { return GLASS_CY; },
    get GLASS_RX() { return GLASS_RX; },
    get GLASS_RY() { return GLASS_RY; },
  };

})();

window.Physics = Physics;
