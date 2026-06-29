// ============================================================
// Tardigradia 2.0 — Creature Class (LOL Enhanced)
// Upgrades over Study v2:
//   • Bubble boarding: light creatures latch onto rising bubbles
//   • Burst scatter: 3+ riders cause bubble to burst
//   • glassBoundary used by default (not wrapBoundary)
//   • Streak species (photon/neutrino/graviton) still wrap
// ============================================================

let _creatureIdCounter = 0;
const STREAK_TYPES = new Set(['photon','neutrino','graviton']);

class Creature {
  constructor(speciesData, x, y) {
    this.id      = ++_creatureIdCounter;
    this.species = speciesData;
    this.key     = speciesData.key;
    this.tier    = speciesData.tier;
    this.group   = speciesData.group;

    this.x  = x;
    this.y  = y;
    this.vx = (Math.random()-0.5)*speciesData.speed*0.4;
    this.vy = (Math.random()-0.5)*speciesData.speed*0.4;

    this.energy  = speciesData.energyMax*(0.5+Math.random()*0.5);
    this.age     = 0;
    this.alive   = true;
    this.heading = Math.atan2(this.vy, this.vx);

    this.eating    = false;
    this.spawning  = false;
    this.sparkTimer = 0;

    // Bubble boarding state
    this._boardedBubble = null;  // {wx,wy,el,riders} reference
    this._boardRadius   = 15;    // world-unit snap distance

    // Physics private state
    const pt = window.SpeciesData.PHYSICS_TRAITS[speciesData.particleType] || {};
    this._behaviorFn  = pt.behaviorFn || 'stableOrbit';
    this._a           = (pt.baseA||0.15)+Math.random()*0.1;
    this._b           = (pt.baseB||0.15)+Math.random()*0.1;
    this._phase       = Math.random()*Math.PI*2;
    this._freq        = 0.3+Math.random()*2.5;
    this._berryPhase  = 0;
    this._orbitSpeed  = pt.orbitSpeed||1.5;
    this._spawnX      = x;
    this._spawnY      = y;
    this._confineCx   = x;
    this._confineCy   = y;

    this.imgEl = null;
    this._loadImage();
    this._reproduceCooldown = 0;
    this._decomposing = false;
    this._decomposeTimer = 0;
  }

  _loadImage() {
    const cache = window.BiomeEngine && window.BiomeEngine.imgCache;
    if (!cache) return;
    if (cache.has(this.key)) { this.imgEl = cache.get(this.key); return; }
    const sp = window.SpeciesData.SPECIES_CATALOG.find(s => s.key === this.key);
    if (sp && sp._iconSrc) {
      const img = new Image();
      img.src = sp._iconSrc;
      img.onload = () => { cache.set(this.key, img); if (!this.imgEl) this.imgEl = img; };
      cache.set(this.key, img);
      this.imgEl = img;
    }
  }

  // ── UPDATE ────────────────────────────────────────────────────
  update(dt, neighbors, biomeParams, resources, extras) {
    if (!this.alive) return;

    const S   = this.species;
    const spd = S.speed * biomeParams.larmorFreq;

    // ─ particle physics ─
    const { dvx, dvy } = Physics.applyParticleBehaviour(
      this, dt, { ...biomeParams, time: extras.time }, extras
    );
    this.vx += dvx;
    this.vy += dvy;

    // ─ bubble boarding: apply bubble rise velocity ─
    if (this._boardedBubble) {
      // match bubble rise speed
      this.vy -= this._boardedBubble.riseSpeed * dt * 30;
      // if bubble has burst or this creature detached, clear
      if (this._boardedBubble.burst) {
        this.vx += (Math.random()-0.5)*60;
        this.vy += (Math.random()-0.5)*60;
        this._boardedBubble = null;
      }
    } else if (extras && extras.bubbles && extras.bubbles.length > 0) {
      // Check if we can board a bubble (light fast species only)
      const isRider = ['photon','pion','kaon'].includes(S.particleType);
      if (isRider) {
        for (const b of extras.bubbles) {
          const dx = this.x - b.wx, dy = this.y - b.wy;
          if (dx*dx+dy*dy < this._boardRadius*this._boardRadius
              && (b.riders||[]).length < 4) {
            this._boardedBubble = b;
            if (!b.riders) b.riders = [];
            b.riders.push(this);
            break;
          }
        }
      }
    }

    // ─ bubble buoyancy (all creatures feel it) ─
    if (extras && extras.bubbles && extras.bubbles.length > 0) {
      const bf = Physics.bubbleBuoyancy(this.x, this.y, extras.bubbles);
      this.vx += bf.vx * dt * 0.5;
      this.vy += bf.vy * dt * 0.5;
    }

    // ─ flocking ─
    if (S.swarm && neighbors.length > 0) {
      const flock = Physics.flockingForce(
        this.x, this.y, this.vx, this.vy, neighbors,
        { cohesion: biomeParams.coherence, separation: S.size*2, alignment:0.4, perceptionR:80 }
      );
      this.vx += flock.vx * dt * 60;
      this.vy += flock.vy * dt * 60;
    }

    // ─ fluid flow field ─
    const flow = Physics.curlNoise(this.x, this.y, extras.time);
    const visc = 1 - biomeParams.fluidViscosity * 0.4;
    this.vx = this.vx*visc + flow.vx*(1-visc)*biomeParams.fluidViscosity;
    this.vy = this.vy*visc + flow.vy*(1-visc)*biomeParams.fluidViscosity;

    Physics.limitSpeed(this, spd*(1+Math.random()*0.3));

    this.x += this.vx * dt;
    this.y += this.vy * dt;

    // ─ boundary: glass for most, wrap for streak particles ─
    if (STREAK_TYPES.has(S.particleType)) {
      Physics.wrapBoundary(this);
    } else {
      Physics.glassBoundary(this);
    }

    if (Math.abs(this.vx)>0.1 || Math.abs(this.vy)>0.1) {
      this.heading = Math.atan2(this.vy, this.vx);
    }

    this.age    += dt;
    this.energy -= biomeParams.energyRate*dt*(S.energyMax/200);

    if (S.tier === SpeciesData.TIERS.PRODUCER && resources) {
      const gain = resources.harvest(this.x, this.y, biomeParams.resourceRegen)*dt;
      this.energy = Math.min(S.energyMax, this.energy+gain);
    }

    this._reproduceCooldown = Math.max(0, this._reproduceCooldown-dt);
    this.sparkTimer         = Math.max(0, this.sparkTimer-dt);
    this.eating             = this.sparkTimer > 0;

    if (this.energy <= 0 || this.age > S.lifespan) this.die();
  }

  eat(other, eatEnergy) {
    other.die();
    this.energy     = Math.min(this.species.energyMax, this.energy+eatEnergy);
    this.sparkTimer = 0.3;
    this.eating     = true;
    return eatEnergy;
  }

  reproduce() {
    if (this.energy < this.species.reproduceEnergy) return null;
    if (this._reproduceCooldown > 0) return null;
    this.energy *= 0.55;
    this._reproduceCooldown = 8+Math.random()*10;
    this.spawning   = true;
    this.sparkTimer = 0.4;
    const ox = this.x+(Math.random()-0.5)*40;
    const oy = this.y+(Math.random()-0.5)*40;
    const child = new Creature(this.species, ox, oy);
    child.energy = this.species.energyMax*0.35;
    child.imgEl  = this.imgEl;
    return child;
  }

  die() {
    this.alive         = false;
    this._decomposing  = true;
    this._decomposeTimer = 4.0;
    if (this._boardedBubble && this._boardedBubble.riders) {
      const idx = this._boardedBubble.riders.indexOf(this);
      if (idx > -1) this._boardedBubble.riders.splice(idx, 1);
    }
    this._boardedBubble = null;
  }

  // ── DRAW ──────────────────────────────────────────────────────
  draw(ctx, biomeParams, highlighted) {
    if (!this.alive && this._decomposeTimer <= 0) return;

    const CAP   = window.SpeciesData.RESOLUTION_CAPS[biomeParams.resolution] || {};
    const sz    = this.species.size*(biomeParams.scale||1);
    const half  = sz/2;
    const alpha = this.alive ? 1 : Math.max(0, this._decomposeTimer/4)*0.5;

    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.translate(this.x, this.y);

    // Lean toward bubble if boarding
    const rot = this._boardedBubble
      ? -Math.PI*0.25           // tilt toward bubble
      : this.heading;
    ctx.rotate(rot);

    if (CAP.glowEffects && this.species.glowColor) {
      ctx.shadowColor = this.species.glowColor;
      ctx.shadowBlur  = highlighted ? 20 : (this.sparkTimer>0 ? 15 : 7);
    }

    // Drop shadow for depth
    if (CAP.glowEffects) {
      ctx.save();
      ctx.globalAlpha = alpha * 0.25;
      ctx.fillStyle   = '#000';
      ctx.beginPath();
      ctx.ellipse(sz*0.12, sz*0.18, half*0.7, half*0.35, 0, 0, Math.PI*2);
      ctx.fill();
      ctx.restore();
    }

    if (highlighted || this.sparkTimer > 0) {
      const pulse = 1+Math.sin(Date.now()*0.008)*0.2;
      ctx.beginPath();
      ctx.arc(0, 0, half*1.5*pulse, 0, Math.PI*2);
      ctx.strokeStyle = highlighted ? this.species.color : '#fef08a';
      ctx.lineWidth   = 1.8;
      ctx.stroke();
    }

    if (this.imgEl && this.imgEl.complete && this.imgEl.naturalWidth > 0) {
      ctx.drawImage(this.imgEl, -half, -half, sz, sz);
    } else {
      ctx.beginPath();
      ctx.arc(0, 0, half*0.9, 0, Math.PI*2);
      ctx.fillStyle   = this.species.color;
      ctx.globalAlpha = alpha*0.85;
      ctx.fill();
    }

    ctx.restore();
  }

  toJSON() {
    return {
      key: this.key, x:this.x, y:this.y, vx:this.vx, vy:this.vy,
      energy:this.energy, age:this.age, heading:this.heading,
      _a:this._a, _b:this._b, _phase:this._phase,
      _reproduceCooldown:this._reproduceCooldown,
    };
  }

  static fromJSON(d) {
    const sp = window.SpeciesData.SPECIES_CATALOG.find(s => s.key === d.key);
    if (!sp) return null;
    const c = new Creature(sp, d.x, d.y);
    Object.assign(c, {
      vx:d.vx, vy:d.vy, energy:d.energy, age:d.age, heading:d.heading,
      _a:d._a, _b:d._b, _phase:d._phase, _reproduceCooldown:d._reproduceCooldown||0,
    });
    return c;
  }
}

window.Creature = Creature;
