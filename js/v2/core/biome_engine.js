// ============================================================
// Tardigradia 2.0 — Biome Engine (LOL Enhanced)
// Upgrades: glass tube render, BubbleSystem, convection flow,
//           tube-environment HUD data, refraction shimmer.
// ============================================================

const BiomeEngine = (() => {

  // ── STATE ────────────────────────────────────────────────────
  let biomeCanvas = null, trailCanvas = null;
  let ctx = null, trailCtx = null;
  let creatures = [];
  let params    = {};
  let _running  = false;
  let _raf      = null;
  let _lastTime = 0;
  let _time     = 0;
  let _demonOrigin = null;

  // Shimmer seed points regenerated each run
  let _shimmerPoints = [];

  const imgCache = new Map();

  // ── CAMERA ───────────────────────────────────────────────────
  const camera = {
    x: 0, y: 0, zoom: 1, rotation: 0,
    targetX: 0, targetY: 0, targetZoom: 1, targetRotation: 0,
  };

  function _lerpCamera(dt) {
    const k = 1 - Math.pow(0.01, dt);
    camera.x        += (camera.targetX        - camera.x)        * k;
    camera.y        += (camera.targetY        - camera.y)        * k;
    camera.zoom     += (camera.targetZoom     - camera.zoom)     * k;
    camera.rotation += (camera.targetRotation - camera.rotation) * k;
  }

  function _applyCam() {
    const vw = biomeCanvas.width/2, vh = biomeCanvas.height/2;
    ctx.translate(vw, vh);
    ctx.rotate(camera.rotation);
    ctx.scale(camera.zoom, camera.zoom);
    ctx.translate(-camera.x, -camera.y);
  }

  // ── IMAGE PRELOAD ─────────────────────────────────────────────
  function _preloadImages() {
    if (!window.data || !window.data.phyla) return;
    const catalog = window.SpeciesData.SPECIES_CATALOG;
    for (const phylum of window.data.phyla) {
      for (const cr of phylum.creatures) {
        const sp = catalog.find(s =>
          s.imageDir && cr.pictures && cr.pictures[0] &&
          cr.pictures[0].url.toLowerCase().includes(
            s.imageDir.split('/').pop().toLowerCase()
          )
        );
        if (sp && cr.pictures && cr.pictures.length > 0) {
          const first = cr.pictures[0].url;
          sp._iconSrc = first.replace(/\.(jpg|jpeg)$/i, '_icon.png');
          if (!imgCache.has(sp.key)) {
            const img = new Image();
            img.src = sp._iconSrc;
            img.onload = () => imgCache.set(sp.key, img);
            img.onerror = () => {
              const fb = new Image();
              fb.src = first.replace(/\.(jpg|jpeg)$/i, '.png');
              fb.onload = () => imgCache.set(sp.key, fb);
            };
            imgCache.set(sp.key, img);
          }
        }
      }
    }
  }

  // ── BUBBLE SYSTEM ─────────────────────────────────────────────
  // Reads positions of DOM .bubble elements and converts to world coords.
  // Tracks riders per bubble and triggers burst at 3+ riders.
  const BubbleSystem = {
    bubbles: [],           // [{el, wx, wy, riseSpeed, riders, burst, burstTimer}]
    _scanInterval: 0,

    update(dt) {
      this._scanInterval += dt;
      // Re-scan DOM every 0.5s (not every frame — perf)
      if (this._scanInterval > 0.5) {
        this._scanInterval = 0;
        this._scanDOM();
      }

      // Tick burst timers
      for (const b of this.bubbles) {
        if (b.burst) {
          b.burstTimer -= dt;
          if (b.burstTimer <= 0) {
            b.burst = false;
            b.riders = [];
            b.riderCount = 0;
            if (b.el) {
              b.el.style.transition = 'opacity 2s ease-in';
              b.el.style.opacity    = '0.97';
            }
          }
        } else {
          // Check rider count → burst
          const riders = (b.riders||[]).filter(c => c.alive);
          b.riders = riders;
          if (riders.length >= 3) {
            this._burst(b);
          }
        }
      }
    },

    _scanDOM() {
      const els = document.querySelectorAll('.bubble');
      const existing = new Map(this.bubbles.map(b => [b.el, b]));
      const next = [];
      let count = 0;
      for (const el of els) {
        if (count++ > 30) break; // cap at 30 for perf
        const rect = el.getBoundingClientRect();
        if (rect.width === 0) continue;

        const screenX = rect.left + rect.width/2;
        const screenY = rect.top  + rect.height/2;
        const wx = _screenToWorld(screenX, screenY).x;
        const wy = _screenToWorld(screenX, screenY).y;

        if (existing.has(el)) {
          const b = existing.get(el);
          const prevWy = b.wy;
          b.wx = wx; b.wy = wy;
          b.riseSpeed = Math.max(0, prevWy - wy) * 2 + 8; // estimate from movement
          next.push(b);
        } else {
          next.push({ el, wx, wy, riseSpeed: 15, riders: [], burst: false, burstTimer: 0 });
        }
      }
      this.bubbles = next;
    },

    _burst(b) {
      b.burst      = true;
      b.burstTimer = 8;
      if (b.el) {
        b.el.style.transition = 'opacity 0.3s ease-out';
        b.el.style.opacity    = '0';
      }
      // Detach and scatter riders
      for (const c of (b.riders||[])) {
        if (c.alive) {
          c._boardedBubble = null;
          c.vx += (Math.random()-0.5)*80;
          c.vy += (Math.random()-0.5)*80;
        }
      }
      // Visual spark at bubble world position
      _sparkAt(b.wx, b.wy, '#67e8f9');
    },

    getTubeStats() {
      const active  = this.bubbles.filter(b => !b.burst).length;
      const boards  = this.bubbles.reduce((s,b)=>s+(b.riders||[]).filter(c=>c.alive).length,0);
      return { active, boards };
    },
  };

  function _screenToWorld(sx, sy) {
    if (!biomeCanvas) return { x: 0, y: 0 };
    const cos = Math.cos(-camera.rotation), sin = Math.sin(-camera.rotation);
    const cx  = (sx - biomeCanvas.width/2)  / camera.zoom;
    const cy  = (sy - biomeCanvas.height/2) / camera.zoom;
    return {
      x: camera.x + cx*cos - cy*sin,
      y: camera.y + cx*sin + cy*cos,
    };
  }

  // ── INIT ─────────────────────────────────────────────────────
  function init(initParams) {
    params = { ...initParams };

    biomeCanvas = document.getElementById('biome-canvas');
    trailCanvas = document.getElementById('trail-canvas');
    ctx         = biomeCanvas.getContext('2d');
    trailCtx    = trailCanvas.getContext('2d');

    _resize();
    window.addEventListener('resize', _resize);

    BiomeEngine.imgCache = imgCache;
    _preloadImages();

    // Generate shimmer points (fixed for this session)
    _shimmerPoints = Array.from({length:8}, () => Math.random()*Math.PI*2);

    Ecosystem.initGrid();
    _spawnInitialPopulation();

    biomeCanvas.addEventListener('click', _handleClick);
    document.addEventListener('keydown', e => { if (e.key==='Escape') PovCamera.exit(); });

    _running  = true;
    _lastTime = performance.now();
    _raf = requestAnimationFrame(_loop);

    _logEvent('[BIOME] Tardigradia 2.0 — glass tube environment initialised');
    _logEvent('[BIOME] ' + creatures.length + ' organisms in the droplet');
    _logEvent('[TUBE] Thermal convection active — warm base, cool apex');
  }

  function _resize() {
    biomeCanvas.width  = window.innerWidth;
    biomeCanvas.height = window.innerHeight;
    trailCanvas.width  = window.innerWidth;
    trailCanvas.height = window.innerHeight;

    const w = window.innerWidth * (1 / 0.92);  // world slightly larger than viewport
    const h = window.innerHeight * (1 / 0.92);
    Physics.setWorldSize(w, h);

    camera.zoom       = camera.targetZoom       = 0.92;
    camera.x          = camera.targetX          = w / 2;
    camera.y          = camera.targetY          = h / 2;
    camera.rotation   = camera.targetRotation   = 0;
  }

  // ── SPAWN ─────────────────────────────────────────────────────
  function _spawnInitialPopulation() {
    const catalog = window.SpeciesData.SPECIES_CATALOG;
    const CAP     = window.SpeciesData.RESOLUTION_CAPS[params.resolution];
    const maxPop  = CAP ? CAP.maxCreatures : 380;

    for (const sp of catalog) {
      const gDef  = window.SpeciesData.SPECIES_GROUPS[sp.group];
      const req   = params[sp.group] || (gDef ? gDef.defaultCount : 10);
      const gSize = catalog.filter(s => s.group === sp.group).length;
      const n     = Math.min(
        Math.max(1, Math.round((req / gSize) * sp.targetRatio * 6)),
        Math.round(maxPop * sp.targetRatio * 2)
      );
      for (let i = 0; i < n; i++) {
        // Spawn inside the ellipse
        const angle = Math.random() * Math.PI * 2;
        const r     = Math.random() * 0.88;  // < 1 = inside ellipse
        const x = Physics.GLASS_CX + Math.cos(angle) * Physics.GLASS_RX * r;
        const y = Physics.GLASS_CY + Math.sin(angle) * Physics.GLASS_RY * r;
        creatures.push(new Creature(sp, x, y));
      }
    }
  }

  function spawnCreature(speciesKey, count) {
    const sp = window.SpeciesData.SPECIES_CATALOG.find(s => s.key === speciesKey);
    if (!sp) return;
    for (let i = 0; i < (count||1); i++) {
      const angle = Math.random() * Math.PI * 2;
      const r     = Math.random() * 0.85;
      const x = Physics.GLASS_CX + Math.cos(angle) * Physics.GLASS_RX * r;
      const y = Physics.GLASS_CY + Math.sin(angle) * Physics.GLASS_RY * r;
      creatures.push(new Creature(sp, x, y));
    }
  }

  function removeCreatures(speciesKey, count) {
    let n = 0;
    for (let i = creatures.length-1; i >= 0 && n < count; i--) {
      if (creatures[i].alive && creatures[i].key === speciesKey) {
        creatures[i].die(); n++;
      }
    }
  }

  // ── MAIN LOOP ─────────────────────────────────────────────────
  function _loop(ts) {
    if (!_running) return;
    _raf = requestAnimationFrame(_loop);

    let dt = Math.min((ts - _lastTime)/1000, 0.05);
    _lastTime = ts;
    _time    += dt * 1000;

    _applyRandomManipulation(dt);
    if (_demonOrigin) { _demonOrigin.timer -= dt; if (_demonOrigin.timer<=0) _demonOrigin=null; }

    // Autosave tick
    if (window.SaveLoad) SaveLoad.tick(dt);

    // Update bubbles
    BubbleSystem.update(dt);
    const bubbles = BubbleSystem.bubbles.filter(b => !b.burst);

    // Resource regeneration
    Ecosystem.regenerateGrid(dt, params.resourceRegen||1);

    // Spatial partition
    const partGrid = _buildPartition();
    const resources = { harvest: Ecosystem.harvestNutrient };
    const newBorn   = [];

    for (const c of creatures) {
      if (!c.alive && !c._decomposing) continue;
      if (!c.alive) {
        c._decomposeTimer -= dt;
        if (c._decomposeTimer<=0) c._decomposing=false;
        continue;
      }
      const neighbors = _getNeighbors(partGrid, c);
      c.update(dt, neighbors, params, resources, {
        time: _time, demonOrigin: _demonOrigin, bubbles
      });
      for (const n of neighbors) {
        if (Ecosystem.tryEat(c, n, params)) { _sparkAt(c.x, c.y, c.species.color); break; }
      }
      if (c.energy >= c.species.reproduceEnergy && c._reproduceCooldown <= 0) {
        const child = c.reproduce();
        if (child) { newBorn.push(child); _sparkAt(c.x, c.y, '#a855f7'); }
      }
    }

    creatures.push(...newBorn);
    const balanced = Ecosystem.tickBalance(dt, creatures, params);
    creatures.push(...balanced);
    creatures = creatures.filter(c => c.alive || c._decomposing);

    _render(dt, bubbles);

    if (window.HUD && HUD.tick) {
      const metrics = Ecosystem.computeMetrics(creatures, params);
      const tubeStats = BubbleSystem.getTubeStats();
      HUD.tick({ creatures, metrics, time: _time, params, tubeStats });
    }

    if (window.PovCamera && PovCamera.isActive()) PovCamera.update(camera, creatures);
  }

  // ── PARTITION ─────────────────────────────────────────────────
  const PCELL = 120;
  function _buildPartition() {
    const map = new Map();
    for (const c of creatures) {
      if (!c.alive) continue;
      const k = `${Math.floor(c.x/PCELL)},${Math.floor(c.y/PCELL)}`;
      if (!map.has(k)) map.set(k,[]);
      map.get(k).push(c);
    }
    return map;
  }
  function _getNeighbors(map, c) {
    const cx = Math.floor(c.x/PCELL), cy = Math.floor(c.y/PCELL);
    const out = [];
    for (let dx=-1;dx<=1;dx++) for (let dy=-1;dy<=1;dy++) {
      const cell = map.get(`${cx+dx},${cy+dy}`);
      if (cell) for (const n of cell) if (n!==c && n.alive) out.push(n);
    }
    return out;
  }

  // ── RENDER ─────────────────────────────────────────────────────
  function _render(dt, bubbles) {
    const CAP = window.SpeciesData.RESOLUTION_CAPS[params.resolution] || {};

    // Trail canvas: fade
    if (params.trailsOn && CAP.trailLength > 0) {
      trailCtx.fillStyle = 'rgba(0,0,3,0.07)';
      trailCtx.fillRect(0,0,trailCanvas.width,trailCanvas.height);
    } else {
      trailCtx.clearRect(0,0,trailCanvas.width,trailCanvas.height);
    }

    ctx.clearRect(0,0,biomeCanvas.width,biomeCanvas.height);

    // ─ camera lerp ─
    _lerpCamera(dt);

    ctx.save();
    _applyCam();

    // ─ glass tube background gradient ─
    _drawGlassTubeBackground();

    // ─ nutrient field ─
    _drawNutrientField();

    // ─ fluid flow hints ─
    _drawFlowHints();

    // ─ trails ─
    if (params.trailsOn && CAP.trailLength > 0) _drawTrails();

    // ─ creatures ─
    const tracked = window.PovCamera ? PovCamera.getTrackedCreature() : null;
    for (const c of creatures) c.draw(ctx, { ...params, glowEffects: CAP.glowEffects }, c===tracked);

    // ─ bubble rider lines ─
    if (CAP.glowEffects) _drawBubbleRiders(bubbles);

    // ─ glass rim ─
    _drawGlassRim();

    ctx.restore();

    // ─ POV overlay (outside camera transform) ─
    if (window.PovCamera && PovCamera.isActive()) PovCamera.drawOverlay(ctx, biomeCanvas);
  }

  // ── GLASS TUBE BACKGROUND ─────────────────────────────────────
  function _drawGlassTubeBackground() {
    const cx = Physics.GLASS_CX, cy = Physics.GLASS_CY;
    const rx = Physics.GLASS_RX, ry = Physics.GLASS_RY;

    // Radial dark-to-fluid gradient inside ellipse
    const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, Math.max(rx,ry));
    grad.addColorStop(0,   'rgba(2,8,25,0.0)');
    grad.addColorStop(0.6, 'rgba(0,18,40,0.15)');
    grad.addColorStop(0.9, 'rgba(0,8,20,0.55)');
    grad.addColorStop(1,   'rgba(0,0,8,0.9)');

    ctx.save();
    ctx.beginPath();
    ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI*2);
    ctx.fillStyle = grad;
    ctx.fill();
    ctx.restore();
  }

  // ── GLASS RIM ─────────────────────────────────────────────────
  function _drawGlassRim() {
    const cx = Physics.GLASS_CX, cy = Physics.GLASS_CY;
    const rx = Physics.GLASS_RX, ry = Physics.GLASS_RY;

    ctx.save();

    // Outer glow halo
    for (let i = 3; i > 0; i--) {
      ctx.beginPath();
      ctx.ellipse(cx, cy, rx+i*4, ry+i*4, 0, 0, Math.PI*2);
      ctx.strokeStyle = `rgba(56,189,248,${0.04 * i})`;
      ctx.lineWidth   = 8;
      ctx.stroke();
    }

    // Main glass line
    ctx.beginPath();
    ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI*2);
    ctx.strokeStyle = 'rgba(56,189,248,0.35)';
    ctx.lineWidth   = 1.8;
    ctx.stroke();

    // Refraction shimmer: bright arc segments at random fixed positions
    const t = _time * 0.0003;
    for (let i = 0; i < _shimmerPoints.length; i++) {
      const ang  = _shimmerPoints[i] + Math.sin(t+i)*0.12;
      const span = 0.06 + Math.sin(t*0.7+i*1.3)*0.03;
      ctx.beginPath();
      ctx.ellipse(cx, cy, rx, ry, 0, ang, ang+span);
      ctx.strokeStyle = `rgba(200,240,255,${0.55+Math.sin(t*1.2+i)*0.3})`;
      ctx.lineWidth   = 2.5;
      ctx.stroke();
    }

    ctx.restore();
  }

  // ── NUTRIENT FIELD ─────────────────────────────────────────────
  function _drawNutrientField() {
    const grid = Ecosystem.getGrid();
    if (!grid) return;
    const GW=50, GH=33;
    const tw=Physics.WORLD_W/GW, th=Physics.WORLD_H/GH;
    ctx.save();
    ctx.globalAlpha=0.05;
    // Clip to glass ellipse
    ctx.beginPath();
    ctx.ellipse(Physics.GLASS_CX,Physics.GLASS_CY,Physics.GLASS_RX,Physics.GLASS_RY,0,0,Math.PI*2);
    ctx.clip();
    for (let ty=0;ty<GH;ty++) for (let tx=0;tx<GW;tx++) {
      const v = grid[ty*GW+tx]/100;
      const g = Math.floor(25+v*60);
      ctx.fillStyle=`rgb(0,${g},${Math.floor(12+v*28)})`;
      ctx.fillRect(tx*tw,ty*th,tw,th);
    }
    ctx.restore();
  }

  // ── FLOW HINTS ────────────────────────────────────────────────
  function _drawFlowHints() {
    ctx.save();
    // Clip to ellipse
    ctx.beginPath();
    ctx.ellipse(Physics.GLASS_CX,Physics.GLASS_CY,Physics.GLASS_RX,Physics.GLASS_RY,0,0,Math.PI*2);
    ctx.clip();

    ctx.setLineDash([2,8]);
    ctx.strokeStyle='rgba(56,189,248,0.05)';
    ctx.lineWidth=0.8;
    const step=140, t=_time;
    for (let x=0;x<Physics.WORLD_W;x+=step) for (let y=0;y<Physics.WORLD_H;y+=step) {
      const {vx,vy}=Physics.curlNoise(x,y,t);
      const ang=Math.atan2(vy,vx), len=20;
      ctx.beginPath();
      ctx.moveTo(x,y);
      ctx.lineTo(x+Math.cos(ang)*len, y+Math.sin(ang)*len);
      ctx.stroke();
    }
    ctx.setLineDash([]);
    ctx.restore();
  }

  // ── TRAILS ────────────────────────────────────────────────────
  function _drawTrails() {
    trailCtx.save();
    trailCtx.setTransform(
      camera.zoom,0,0,camera.zoom,
      biomeCanvas.width/2 - camera.x*camera.zoom,
      biomeCanvas.height/2 - camera.y*camera.zoom
    );
    for (const c of creatures) {
      if (!c.alive) continue;
      trailCtx.beginPath();
      trailCtx.arc(c.x,c.y,c.species.size*0.3,0,Math.PI*2);
      trailCtx.fillStyle  = c.species.color;
      trailCtx.globalAlpha= 0.4;
      trailCtx.fill();
    }
    trailCtx.restore();
  }

  // ── BUBBLE RIDER LINES ────────────────────────────────────────
  function _drawBubbleRiders(bubbles) {
    ctx.save();
    ctx.setLineDash([2,5]);
    for (const b of bubbles) {
      for (const c of (b.riders||[])) {
        if (!c.alive) continue;
        ctx.beginPath();
        ctx.moveTo(c.x, c.y);
        ctx.lineTo(b.wx, b.wy);
        ctx.strokeStyle = `rgba(103,232,249,0.35)`;
        ctx.lineWidth   = 0.8;
        ctx.stroke();
      }
    }
    ctx.setLineDash([]);
    ctx.restore();
  }

  // ── CLICK ─────────────────────────────────────────────────────
  function _handleClick(e) {
    const rect = biomeCanvas.getBoundingClientRect();
    const wp   = _screenToWorld(e.clientX - rect.left + rect.left, e.clientY - rect.top + rect.top);
    // Simpler: use the helper directly with client coords
    const wc   = _screenToWorld(e.clientX, e.clientY);
    let best = null, bestDist = 40/camera.zoom;
    for (const c of creatures) {
      if (!c.alive) continue;
      const d = Math.hypot(c.x-wc.x, c.y-wc.y);
      if (d < bestDist) { bestDist=d; best=c; }
    }
    if (window.PovCamera) {
      if (best && best !== PovCamera.getTrackedCreature()) {
        PovCamera.trackCreature(best, camera);
      } else PovCamera.exit();
    }
  }

  // ── SPARK ─────────────────────────────────────────────────────
  function _sparkAt(wx, wy, color) {
    const sx = (wx-camera.x)*camera.zoom + biomeCanvas.width/2;
    const sy = (wy-camera.y)*camera.zoom + biomeCanvas.height/2;
    const el = document.createElement('div');
    el.className = 'biome-spark';
    el.style.cssText=`left:${sx-6}px;top:${sy-6}px;width:12px;height:12px;background:${color}`;
    document.body.appendChild(el);
    setTimeout(() => el.remove(), 600);
  }

  // ── EVENT LOG ─────────────────────────────────────────────────
  const _eventLog = [];
  function _logEvent(msg) {
    const t = new Date().toTimeString().slice(0,8);
    _eventLog.unshift(`[${t}] ${msg}`);
    if (_eventLog.length>30) _eventLog.pop();
    if (window.HUD && HUD.appendLog) HUD.appendLog(msg);
  }

  // ── RANDOM MANIPULATION ───────────────────────────────────────
  const _rStart = performance.now();
  const _rState = {};
  function _applyRandomManipulation(dt) {
    const t = (performance.now()-_rStart)*0.001;
    for (const key of ['larmorFreq','fluidViscosity','resourceRegen','coherence']) {
      if (!params['randomToggle_'+key]) continue;
      if (!_rState[key]) _rState[key]={freq:0.05+Math.random()*0.25,phase:Math.random()*Math.PI*2,base:params[key]};
      const rs = _rState[key];
      const raw = rs.base + Math.sin(t*rs.freq*Math.PI*2+rs.phase)*rs.base*0.5;
      if (key==='larmorFreq')    params[key]=Math.max(0.1,Math.min(4.0,raw));
      else if (key==='coherence')params[key]=Math.max(0,Math.min(1,raw));
      else                       params[key]=Math.max(0.1,Math.min(5,raw));
    }
  }

  // ── TGPU-STYLE EVENTS ────────────────────────────────────────
  function perturb() {
    Ecosystem.triggerPerturb(creatures);
    _logEvent('[PERTURB] Entropy spike — all worldlines randomized');
  }
  function triggerFusion() {
    const n = Ecosystem.triggerFusion(creatures);
    creatures.push(...n);
    _logEvent('[FUSION] Mass reproduction — '+n.length+' offspring');
  }
  function triggerDemon() {
    _demonOrigin = Ecosystem.triggerDemon(creatures);
    if (_demonOrigin) _logEvent('[DEMON] Pheromone wave — Dictyostelium aggregates 8s');
  }
  function toggleTrails() {
    params.trailsOn = !params.trailsOn;
    if (!params.trailsOn) trailCtx.clearRect(0,0,trailCanvas.width,trailCanvas.height);
    _logEvent('[TRAILS] '+(params.trailsOn?'Bioluminescent trails ON':'Trails OFF'));
  }
  function setResolution(res) {
    params.resolution=res;
    _logEvent('[RES] '+res.toUpperCase()+' — '+(window.SpeciesData.RESOLUTION_CAPS[res]||{}).maxCreatures+' max');
  }
  function setParam(k,v) { params[k]=v; }

  // ── STATE SERIALISE ───────────────────────────────────────────
  function getState() {
    return {
      version:'2.0', timestamp:Date.now(),
      params:{...params},camera:{...camera},
      creatures:creatures.filter(c=>c.alive).map(c=>c.toJSON()),
    };
  }
  function loadState(state) {
    if (!state||state.version!=='2.0') return false;
    params=({...state.params});
    Object.assign(camera,state.camera);
    creatures=[];
    for (const d of state.creatures) {
      const c=Creature.fromJSON(d);
      if (c) { const img=imgCache.get(c.key); if(img)c.imgEl=img; creatures.push(c); }
    }
    _logEvent('[LOAD] Restored — '+creatures.length+' organisms');
    return true;
  }

  // ── PUBLIC API ────────────────────────────────────────────────
  return {
    init, imgCache, camera,
    creatures: ()=>creatures,
    params:    ()=>params,
    setParam, spawnCreature, removeCreatures,
    perturb, triggerFusion, triggerDemon, toggleTrails, setResolution,
    getState, loadState,
    logEvent: _logEvent,
    getEventLog: ()=>_eventLog,
    BubbleSystem,
  };

})();

window.BiomeEngine = BiomeEngine;
