// ============================================================
// Tardigradia 2.0 — HUD Controller (LOL Enhanced)
// Adds: Tube Environment section (pH, Temp, Bubbles, Convection)
// ============================================================

const HUD = (() => {

  let _chartCtx  = null;
  let _chartData = { action:[], benevolence:[], coherence:[] };
  const CHART_LEN = 40;
  let _allHidden  = false;
  let _params     = {};
  // Tube environment simulated values
  let _tubeEnv = { pH:7.4, temp:37.0, convDir:'↑', _t:0 };

  // ── INIT ────────────────────────────────────────────────────
  function init(startParams) {
    _params = startParams ? {...startParams} : (BiomeEngine.params ? BiomeEngine.params() : {});
    _buildPanels();
    _buildMasterToggle();
    _buildPullTabs();
    _initChart();
  }

  // ── BUILD PANELS ────────────────────────────────────────────
  function _buildPanels() {
    _buildTopPanel();
    _buildLeftPanel();
    _buildRightPanel();
  }

  function _buildTopPanel() {
    const p = document.createElement('div');
    p.id='hud-top'; p.className='hud-panel';
    p.innerHTML=`
      <div class="hud-header" style="color:#38bdf8">
        TARDIGRADIA 2.0 — Universe in a Droplet
        <button class="panel-collapse-btn" onclick="HUD.togglePanel('hud-top')">▲</button>
      </div>
      <div class="hud-body" style="display:flex;gap:22px;padding:5px 12px;flex-wrap:wrap">
        <div class="hud-row"><span class="hud-label">Organisms</span><span class="hud-value" id="hud-total-pop">—</span></div>
        <div class="hud-row"><span class="hud-label">Action S</span><span class="hud-value" id="hud-action">—</span></div>
        <div class="hud-row"><span class="hud-label">Benevolence B</span><span class="hud-value" id="hud-benevolence">—</span></div>
        <div class="hud-row"><span class="hud-label">Coherence C</span><span class="hud-value" id="hud-coherence">—</span></div>
        <div class="hud-row"><span class="hud-label">Ecosystem</span><span class="hud-value" id="hud-eco">STABLE</span></div>
      </div>`;
    document.body.appendChild(p);
  }

  function _buildLeftPanel() {
    const p = document.createElement('div');
    p.id='hud-left'; p.className='hud-panel';
    p.style.cssText='bottom:12px;left:12px;width:240px;';
    p.innerHTML=`
      <div class="hud-header" style="color:#a855f7">
        ECOSYSTEM LOG
        <button class="panel-collapse-btn" onclick="HUD.togglePanel('hud-left')">◀</button>
      </div>
      <div class="hud-body">
        <ul class="hud-log" id="event-log"></ul>
        <div style="border-top:1px solid rgba(56,189,248,0.1);margin-top:6px;padding-top:6px">
          ${_buildPopSummaryRows()}
        </div>
      </div>`;
    document.body.appendChild(p);
  }

  function _buildPopSummaryRows() {
    return Object.entries(window.SpeciesData.SPECIES_GROUPS).map(([k,g])=>
      `<div class="hud-row">
        <span class="hud-label">${g.label}</span>
        <span class="hud-value" id="hud-pop-${k}">—</span>
      </div>`).join('');
  }

  function _buildRightPanel() {
    const p = document.createElement('div');
    p.id='hud-right'; p.className='hud-panel';
    p.style.cssText='bottom:12px;right:12px;width:272px;';
    p.innerHTML=`
      <div class="hud-header" style="color:#10b981">
        SIMULATION CONTROLS
        <button class="panel-collapse-btn" onclick="HUD.togglePanel('hud-right')">▶</button>
      </div>
      <div class="hud-body">

        <!-- Physics sliders -->
        ${_ctrlSlider('larmorFreq',    'Larmor Freq',    0.1,4.0,0.1,'×')}
        ${_ctrlSlider('fluidViscosity','Viscosity',      0.1,2.0,0.05,'')}
        ${_ctrlSlider('resourceRegen', 'Resource Regen', 0.1,5.0,0.1,'×')}
        ${_ctrlSlider('coherence',     'Flock Cohesion', 0.0,1.0,0.05,'')}

        <!-- Event buttons -->
        <div style="display:flex;flex-wrap:wrap;gap:4px;margin:8px 0">
          <button class="hud-btn hud-btn-red"    onclick="BiomeEngine.perturb()">Perturb</button>
          <button class="hud-btn hud-btn-purple" onclick="BiomeEngine.toggleTrails()">Trails</button>
          <button class="hud-btn hud-btn-yellow" onclick="BiomeEngine.triggerDemon()">Pheromone!</button>
          <button class="hud-btn hud-btn-green"  onclick="BiomeEngine.triggerFusion()">Fusion</button>
        </div>

        <!-- Resolution -->
        <div class="hud-row" style="margin-bottom:4px">
          <span class="hud-label">Resolution</span>
          <select id="hud-res-select"
                  style="background:#0f172a;color:#38bdf8;border:1px solid #1e3a5f;border-radius:4px;font-size:11px;padding:2px 4px">
            <option value="low">Low ~120</option>
            <option value="medium" selected>Medium ~380</option>
            <option value="high">High ~750</option>
          </select>
        </div>

        <!-- Population adjust -->
        <div style="border-top:1px solid rgba(56,189,248,0.1);margin-top:6px;padding-top:6px">
          <div style="font-family:Orbitron,sans-serif;font-size:0.62rem;color:#38bdf8;letter-spacing:0.1em;margin-bottom:6px">POPULATION</div>
          ${_buildPopRows()}
        </div>

        <!-- Save/Load, Wake -->
        <div style="display:flex;gap:6px;margin-top:8px">
          <button class="hud-btn hud-btn-cyan" style="flex:1" onclick="SaveLoad.save()">💾 Save</button>
          <button class="hud-btn hud-btn-cyan" style="flex:1" onclick="SaveLoad.load()">📂 Load</button>
        </div>
        <div style="margin-top:6px">
          <button class="hud-btn hud-btn-green" id="btn-wake" onclick="WakeLock.toggle()" style="width:100%">
            <span id="wake-indicator"></span>☀ Screen Awake: OFF
          </button>
        </div>
        <div style="margin-top:6px">
          <button class="hud-btn hud-btn-purple" id="btn-rand-all" onclick="HUD.toggleRandomAll()" style="width:100%">
            🎲 Randomize All: OFF
          </button>
        </div>

        <!-- ── TUBE ENVIRONMENT ── -->
        <div style="border-top:1px solid rgba(16,185,129,0.2);margin-top:8px;padding-top:6px">
          <div style="font-family:Orbitron,sans-serif;font-size:0.62rem;color:#10b981;letter-spacing:0.1em;margin-bottom:5px">TUBE ENVIRONMENT</div>
          <div class="hud-row">
            <span class="hud-label">pH</span>
            <span class="hud-value" id="tube-ph">7.40</span>
          </div>
          <div class="hud-row">
            <span class="hud-label">Temp °C</span>
            <span class="hud-value" id="tube-temp">37.0</span>
          </div>
          <div class="hud-row">
            <span class="hud-label">Bubbles</span>
            <span class="hud-value" id="tube-bubbles">—</span>
          </div>
          <div class="hud-row">
            <span class="hud-label">Bubble Riders</span>
            <span class="hud-value" id="tube-riders">—</span>
          </div>
          <div class="hud-row">
            <span class="hud-label">Convection</span>
            <span class="hud-value" id="tube-conv" style="color:#10b981">↑ Ascending</span>
          </div>
        </div>

        <!-- Benevolence chart -->
        <div style="border-top:1px solid rgba(56,189,248,0.1);margin-top:8px;padding-top:6px">
          <div style="font-family:Orbitron,sans-serif;font-size:0.62rem;color:#fef08a;letter-spacing:0.1em;margin-bottom:4px">BENEVOLENCE MONITOR</div>
          <div id="benevolence-chart-wrap">
            <canvas id="benevolence-chart" width="250" height="90"></canvas>
          </div>
          <div style="font-size:0.62rem;color:#475569;text-align:center;margin-top:2px">
            Action (S) · Benevolence (B) · Coherence (C)
          </div>
        </div>
      </div>`;
    document.body.appendChild(p);

    document.getElementById('hud-res-select').addEventListener('change', e => {
      BiomeEngine.setResolution(e.target.value);
    });
  }

  function _ctrlSlider(key, label, min, max, step, unit) {
    const v  = (_params[key]!==undefined)?_params[key]:(window.SpeciesData.DEFAULT_PARAMS[key]||min);
    const dp = Number(v).toFixed(step<0.1?2:1);
    return `
      <div class="hud-row">
        <span class="hud-label" style="width:90px">${label}</span>
        <input class="pop-slider" id="ctrl-${key}" type="range"
               min="${min}" max="${max}" step="${step}" value="${v}"
               data-key="${key}" data-unit="${unit}">
        <span class="hud-value" id="ctrlv-${key}" style="width:36px">${dp}${unit}</span>
        <button class="param-rand-btn" id="rand-ctrl-${key}" data-key="${key}"
                title="Random" onclick="HUD.toggleRandom('${key}',this)">🎲</button>
      </div>`;
  }

  function _buildPopRows() {
    return Object.entries(window.SpeciesData.SPECIES_GROUPS).map(([gk,g])=>`
      <div class="pop-row">
        <span class="pop-label">${g.label}</span>
        <input class="pop-slider" type="range" min="0" max="200" step="1" value="100"
               id="pop-slider-${gk}" data-group="${gk}"
               oninput="HUD.setPopMultiplier('${gk}',this.value)">
        <span class="pop-count" id="pop-count-${gk}">—</span>
        <button class="pop-adj" onclick="HUD.adjustPop('${gk}',5)">+</button>
        <button class="pop-adj" onclick="HUD.adjustPop('${gk}',-5)">−</button>
      </div>`).join('');
  }

  // ── MASTER TOGGLE ────────────────────────────────────────────
  function _buildMasterToggle() {
    const btn=document.createElement('button');
    btn.id='hud-master-toggle';btn.textContent='☰ Hide All';
    btn.addEventListener('click',toggleAll);
    document.body.appendChild(btn);
  }
  function _buildPullTabs() {
    const tL=document.createElement('button');
    tL.id='tab-left';tL.className='panel-tab';tL.textContent='LOG';
    tL.addEventListener('click',()=>togglePanel('hud-left'));
    document.body.appendChild(tL);
    const tR=document.createElement('button');
    tR.id='tab-right';tR.className='panel-tab';tR.textContent='CTRL';
    tR.addEventListener('click',()=>togglePanel('hud-right'));
    document.body.appendChild(tR);
  }

  function togglePanel(id) {
    const p=document.getElementById(id);if(!p)return;
    const c=p.classList.toggle('collapsed');
    if(id==='hud-left')  document.getElementById('tab-left')?.classList.toggle('visible',c);
    if(id==='hud-right') document.getElementById('tab-right')?.classList.toggle('visible',c);
  }
  function toggleAll() {
    _allHidden=!_allHidden;
    ['hud-top','hud-left','hud-right','hud-pov'].forEach(id=>{
      document.getElementById(id)?.classList.toggle('collapsed',_allHidden);
    });
    document.getElementById('hud-master-toggle').textContent=_allHidden?'☰ Show All':'☰ Hide All';
    document.getElementById('tab-left')?.classList.toggle('visible',_allHidden);
    document.getElementById('tab-right')?.classList.toggle('visible',_allHidden);
  }

  // ── CHART ────────────────────────────────────────────────────
  function _initChart() {
    const canvas=document.getElementById('benevolence-chart');
    if(!canvas)return;
    _chartCtx=canvas.getContext('2d');
    for(let i=0;i<CHART_LEN;i++){
      _chartData.action.push(0);_chartData.benevolence.push(0);_chartData.coherence.push(0);
    }
    document.querySelectorAll('input[data-key]').forEach(slider=>{
      slider.addEventListener('input',()=>{
        const k=slider.dataset.key, u=slider.dataset.unit||'', val=parseFloat(slider.value);
        BiomeEngine.setParam(k,val);
        const d=document.getElementById('ctrlv-'+k);
        if(d) d.textContent=val.toFixed(val<2?2:1)+u;
        _params[k]=val;
      });
    });
  }

  function _drawChart(m) {
    if(!_chartCtx)return;
    _chartData.action.push(m.action);          _chartData.action.shift();
    _chartData.benevolence.push(m.benevolence);_chartData.benevolence.shift();
    _chartData.coherence.push(m.coherence);    _chartData.coherence.shift();
    const ctx=_chartCtx, w=250, h=90;
    ctx.clearRect(0,0,w,h);
    ctx.fillStyle='rgba(0,0,0,0.4)';ctx.fillRect(0,0,w,h);
    const colors=['#38bdf8','#10b981','#a855f7'];
    [_chartData.action,_chartData.benevolence,_chartData.coherence].forEach((ds,i)=>{
      ctx.beginPath();ctx.strokeStyle=colors[i];ctx.lineWidth=1.5;
      ds.forEach((v,x)=>{
        const px=(x/CHART_LEN)*w, py=h-(v/10)*h;
        x===0?ctx.moveTo(px,py):ctx.lineTo(px,py);
      });ctx.stroke();
    });
    ctx.setLineDash([2,4]);ctx.strokeStyle='#1e293b';ctx.lineWidth=0.8;
    [0.25,0.5,0.75].forEach(f=>{
      ctx.beginPath();ctx.moveTo(0,h*(1-f));ctx.lineTo(w,h*(1-f));ctx.stroke();
    });
    ctx.setLineDash([]);
  }

  // ── TICK ─────────────────────────────────────────────────────
  function tick({ creatures, metrics, time, params, tubeStats }) {
    const sv=(id,v)=>{const e=document.getElementById(id);if(e)e.textContent=v;};
    sv('hud-total-pop', creatures.filter(c=>c.alive).length);
    sv('hud-action',     metrics.action.toFixed(2));
    sv('hud-benevolence',metrics.benevolence.toFixed(2));
    sv('hud-coherence',  metrics.coherence.toFixed(2));

    const h=(metrics.benevolence+metrics.coherence)/2;
    const eco=document.getElementById('hud-eco');
    if(eco){
      if(h>6){eco.textContent='THRIVING';eco.style.color='#10b981';}
      else if(h>3){eco.textContent='STABLE';eco.style.color='#38bdf8';}
      else{eco.textContent='STRESSED';eco.style.color='#f43f5e';}
    }

    const gc={};
    for(const c of creatures){if(!c.alive)continue;gc[c.group]=(gc[c.group]||0)+1;}
    for(const k of Object.keys(window.SpeciesData.SPECIES_GROUPS)){
      sv('hud-pop-'+k, gc[k]||0);
      sv('pop-count-'+k, gc[k]||0);
    }

    // ─ Tube environment ─
    _tubeEnv._t += 0.016;
    const dt = _tubeEnv._t;
    const pHDrift   = params.randomToggle_resourceRegen ? Math.sin(dt*0.07)*0.18 : Math.sin(dt*0.03)*0.04;
    const tempDrift = params.randomToggle_larmorFreq   ? Math.sin(dt*0.11)*0.9  : Math.sin(dt*0.05)*0.2;
    const curPH   = (7.4 + pHDrift).toFixed(2);
    const curTemp = (37.0 + tempDrift).toFixed(1);

    // Convection direction from flow field centre-sample
    const flow=Physics.curlNoise(Physics.GLASS_CX, Physics.GLASS_CY+Physics.GLASS_RY*0.5, Date.now());
    let convLabel='↑ Ascending';
    if(Math.abs(flow.vx)>Math.abs(flow.vy)){
      convLabel = flow.vx > 0 ? '→ Clockwise ↻' : '← Anti-CW ↺';
    } else if(flow.vy > 0) {
      convLabel = '↓ Descending';
    }

    sv('tube-ph',   curPH);
    sv('tube-temp', curTemp+'°');
    if(tubeStats){
      sv('tube-bubbles', tubeStats.active||0);
      sv('tube-riders',  tubeStats.boards||0);
    }
    sv('tube-conv', convLabel);

    if(Math.random()<0.33) _drawChart(metrics);
  }

  // ── POPULATION CONTROLS ───────────────────────────────────────
  function setPopMultiplier(group, pct) {
    BiomeEngine.setParam('pop_'+group, parseFloat(pct)/100);
  }
  function adjustPop(group, delta) {
    const sp=window.SpeciesData.SPECIES_CATALOG.find(s=>s.group===group);
    if(!sp)return;
    if(delta>0) for(let i=0;i<delta;i++) BiomeEngine.spawnCreature(sp.key,1);
    else BiomeEngine.removeCreatures(sp.key,-delta);
  }

  // ── RANDOM CONTROLS ───────────────────────────────────────────
  let _randAll=false;
  function toggleRandom(key,btn) {
    const a=btn.classList.toggle('active');
    BiomeEngine.setParam('randomToggle_'+key,a);
    document.getElementById('ctrl-'+key)?.classList.toggle('randomized',a);
  }
  function toggleRandomAll() {
    _randAll=!_randAll;
    document.getElementById('btn-rand-all').textContent='🎲 Randomize All: '+(_randAll?'ON':'OFF');
    ['larmorFreq','fluidViscosity','resourceRegen','coherence'].forEach(k=>{
      BiomeEngine.setParam('randomToggle_'+k,_randAll);
      document.getElementById('ctrl-'+k)?.classList.toggle('randomized',_randAll);
      document.getElementById('rand-ctrl-'+k)?.classList.toggle('active',_randAll);
    });
  }

  // ── LOG ──────────────────────────────────────────────────────
  function appendLog(msg) {
    const log=document.getElementById('event-log');if(!log)return;
    const li=document.createElement('li');
    li.textContent=msg;
    li.style.color=['#38bdf8','#10b981','#a855f7','#fef08a','#f43f5e'][Math.floor(Math.random()*5)];
    log.prepend(li);
    while(log.children.length>20)log.lastChild.remove();
  }

  return { init,tick,togglePanel,toggleAll,toggleRandom,toggleRandomAll,setPopMultiplier,adjustPop,appendLog };

})();

window.HUD = HUD;
