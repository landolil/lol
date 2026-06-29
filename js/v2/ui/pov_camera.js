// ============================================================
// Tardigradia 2.0 — POV Camera (LOL Enhanced)
// Upgrades: microscope eyepiece vignette, chromatic aberration
//           rings, crosshair reticle, magnification display.
// ============================================================

const PovCamera = (() => {

  let _tracked    = null;
  let _active     = false;
  let _hudPanel   = null;
  const POV_ZOOM  = 3.5;
  let _normalZoom = 1;
  let _magLevel   = 1;   // increments for label

  // ── INIT ────────────────────────────────────────────────────
  function init() {
    _hudPanel = document.getElementById('hud-pov');
    if (!_hudPanel) {
      _hudPanel = document.createElement('div');
      _hudPanel.id        = 'hud-pov';
      _hudPanel.className = 'hud-panel';
      _hudPanel.innerHTML = `
        <div class="pov-name"  id="pov-species-name">—</div>
        <div class="pov-particle" id="pov-particle-name">—</div>
        <div class="pov-bar-wrap">
          <span class="pov-bar-label">Energy</span>
          <div class="pov-bar-track"><div class="pov-bar-fill energy" id="pov-energy-bar" style="width:0%"></div></div>
        </div>
        <div class="pov-bar-wrap">
          <span class="pov-bar-label">Age</span>
          <div class="pov-bar-track"><div class="pov-bar-fill age" id="pov-age-bar" style="width:0%"></div></div>
        </div>
        <div style="text-align:center;padding:4px 10px 8px;font-size:0.65rem;color:#475569">
          ESC / click creature to exit
        </div>`;
      document.body.appendChild(_hudPanel);
    }
    document.addEventListener('keydown', e => { if (e.key==='Escape') exit(); });
  }

  // ── TRACK ────────────────────────────────────────────────────
  function trackCreature(creature, camera) {
    _tracked    = creature;
    _active     = true;
    _normalZoom = camera.zoom;
    _magLevel   = Math.round(40 * POV_ZOOM);  // nominal microscope mag label

    _hudPanel.classList.add('active');
    document.getElementById('biome-canvas').classList.add('pov-active');
    _updateHUD(creature);

    if (window.BiomeEngine) BiomeEngine.logEvent('[POV] Tracking '+creature.species.name);
    if (window.HUD) HUD.appendLog('[POV] Inside: '+creature.species.name+' ('+creature.species.particleType+')');
  }

  function exit() {
    if (!_active) return;
    _active=false; _tracked=null;
    _hudPanel.classList.remove('active');
    document.getElementById('biome-canvas')?.classList.remove('pov-active');
    const cam = BiomeEngine.camera;
    if (cam) {
      cam.targetZoom     = _normalZoom;
      cam.targetRotation = 0;
      cam.targetX        = Physics.GLASS_CX;
      cam.targetY        = Physics.GLASS_CY;
    }
    if (window.HUD) HUD.appendLog('[POV] Exited — returning to overview');
  }

  // ── UPDATE (per frame) ────────────────────────────────────────
  function update(camera, creatures) {
    if (!_active) return;
    if (!_tracked || !_tracked.alive) {
      const same = creatures.find(c => c.alive && c.key === (_tracked?_tracked.key:''));
      if (same) { _tracked = same; } else { exit(); return; }
    }
    camera.targetX        = _tracked.x;
    camera.targetY        = _tracked.y;
    camera.targetZoom     = POV_ZOOM;
    camera.targetRotation = -_tracked.heading;
    _updateHUD(_tracked);
  }

  function _updateHUD(c) {
    const sv=(id,v)=>{const e=document.getElementById(id);if(e)e.textContent=v;};
    sv('pov-species-name', c.species.name);
    sv('pov-particle-name','⟨ '+c.species.particleType.replace(/_/g,' ')+' analogue ⟩');
    const ne=document.getElementById('pov-species-name');
    if(ne) ne.style.color=c.species.color;
    const ep=Math.max(0,Math.min(100,(c.energy/c.species.energyMax)*100));
    const ap=Math.max(0,Math.min(100,(c.age/c.species.lifespan)*100));
    const eb=document.getElementById('pov-energy-bar');
    const ab=document.getElementById('pov-age-bar');
    if(eb) eb.style.width=ep+'%';
    if(ab) ab.style.width=ap+'%';
  }

  // ── DRAW OVERLAY (called by biome_engine outside camera transform) ──
  function drawOverlay(ctx, canvas) {
    const w=canvas.width, h=canvas.height;
    const cx=w/2, cy=h/2;
    const r=Math.min(w,h)*0.46;

    ctx.save();
    ctx.setTransform(1,0,0,1,0,0); // screen space

    // ─ black vignette outside eyepiece circle ─
    const outerPath = new Path2D();
    outerPath.rect(0,0,w,h);
    const innerCircle = new Path2D();
    innerCircle.arc(cx,cy,r,0,Math.PI*2);

    ctx.fillStyle='rgba(0,0,0,0.92)';
    ctx.beginPath();
    ctx.rect(0,0,w,h);
    ctx.arc(cx,cy,r,0,Math.PI*2,true); // counter-clockwise = subtract
    ctx.fill('evenodd');

    // ─ chromatic aberration rings ─
    ctx.beginPath();
    ctx.arc(cx,cy,r+3,0,Math.PI*2);
    ctx.strokeStyle='rgba(248,56,56,0.25)';
    ctx.lineWidth=3; ctx.stroke();

    ctx.beginPath();
    ctx.arc(cx,cy,r-3,0,Math.PI*2);
    ctx.strokeStyle='rgba(56,248,248,0.25)';
    ctx.lineWidth=3; ctx.stroke();

    // ─ glass rim glow ─
    ctx.beginPath();
    ctx.arc(cx,cy,r,0,Math.PI*2);
    ctx.strokeStyle='rgba(56,189,248,0.4)';
    ctx.lineWidth=1.5; ctx.stroke();

    // ─ crosshair reticle ─
    const rLen=r*0.18, gap=14;
    ctx.strokeStyle='rgba(56,189,248,0.35)';
    ctx.lineWidth=0.8; ctx.setLineDash([4,4]);
    // Horizontal
    ctx.beginPath(); ctx.moveTo(cx-r*0.8, cy); ctx.lineTo(cx-gap, cy); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(cx+gap,   cy); ctx.lineTo(cx+r*0.8, cy); ctx.stroke();
    // Vertical
    ctx.beginPath(); ctx.moveTo(cx, cy-r*0.8); ctx.lineTo(cx, cy-gap); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(cx, cy+gap);   ctx.lineTo(cx, cy+r*0.8); ctx.stroke();
    ctx.setLineDash([]);

    // Centre tick
    ctx.strokeStyle='rgba(56,189,248,0.6)';
    ctx.lineWidth=1.2;
    const t=8;
    ctx.beginPath();ctx.moveTo(cx-t,cy);ctx.lineTo(cx+t,cy);ctx.stroke();
    ctx.beginPath();ctx.moveTo(cx,cy-t);ctx.lineTo(cx,cy+t);ctx.stroke();

    // ─ magnification label ─
    ctx.font='11px Orbitron,sans-serif';
    ctx.fillStyle='rgba(56,189,248,0.6)';
    ctx.textAlign='right';
    ctx.fillText(_magLevel+'×', cx+r-12, cy+r-14);

    // ─ species colour dot ─
    if (_tracked) {
      ctx.fillStyle = _tracked.species.color || '#38bdf8';
      ctx.shadowColor= _tracked.species.color || '#38bdf8';
      ctx.shadowBlur = 8;
      ctx.beginPath(); ctx.arc(cx-r+20, cy-r+20, 6, 0, Math.PI*2); ctx.fill();
      ctx.shadowBlur=0;
    }

    ctx.restore();
  }

  // ── ACCESSORS ────────────────────────────────────────────────
  function isActive()           { return _active; }
  function getTrackedCreature() { return _tracked; }

  return { init, trackCreature, exit, update, drawOverlay, isActive, getTrackedCreature };

})();

window.PovCamera = PovCamera;
