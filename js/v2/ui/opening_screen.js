// ============================================================
// Tardigradia 2.0 — Opening Configuration Screen (Feature F)
// Full-screen modal splash with population, resolution,
// physics seed controls, and restore/load options.
// ============================================================

const OpeningScreen = (() => {

  let _el     = null;  // the overlay div
  let _values = {};    // current form values

  // ── BUILD SCREEN ─────────────────────────────────────────────
  function init() {
    _el = document.getElementById('opening-screen');
    if (!_el) {
      _el = document.createElement('div');
      _el.id = 'opening-screen';
      document.body.appendChild(_el);
    }

    const defs = window.SpeciesData.DEFAULT_PARAMS;
    _values    = { ...defs };

    const hasSave = !!SaveLoad.hasSave();

    _el.innerHTML = `
      <div class="opening-card">
        <div class="opening-title">TARDIGRADIA 2.0</div>
        <div class="opening-subtitle">Universe in a Droplet — where physics becomes life</div>

        <!-- RESOLUTION -->
        <div class="opening-section">
          <div class="opening-section-title">Resolution</div>
          <div class="res-group" id="res-group">
            <div class="res-option ${defs.resolution==='low'?'selected':''}"    data-res="low">
              <div class="res-label">LOW</div>
              <div class="res-desc">~120 organisms<br>Fast &amp; simple</div>
            </div>
            <div class="res-option ${defs.resolution==='medium'?'selected':''}" data-res="medium">
              <div class="res-label">MEDIUM ✓</div>
              <div class="res-desc">~380 organisms<br>Balanced</div>
            </div>
            <div class="res-option ${defs.resolution==='high'?'selected':''}"   data-res="high">
              <div class="res-label">HIGH</div>
              <div class="res-desc">~750 organisms<br>Powerful GPU</div>
            </div>
          </div>
        </div>

        <!-- POPULATION -->
        <div class="opening-section">
          <div class="opening-section-title">Initial Population</div>
          ${_buildParamRow('tardigrades', 'Tardigrades',   defs.tardigrades,  1,  200, false)}
          ${_buildParamRow('bacteria',    'Bacteria',       defs.bacteria,    10,  500, false)}
          ${_buildParamRow('amoebae',     'Amoebae',        defs.amoebae,      5,  300, false)}
          ${_buildParamRow('decomposers', 'Decomposers',    defs.decomposers,  5,  200, false)}
          ${_buildParamRow('special',     'Special/Swarm',  defs.special,      1,  100, false)}
          ${_buildParamRow('parasites',   'Parasites',      defs.parasites,    0,   50, false)}
        </div>

        <!-- PHYSICS SEED -->
        <div class="opening-section">
          <div class="opening-section-title">Physics Seed</div>
          ${_buildParamRow('larmorFreq',     'Larmor Freq',      defs.larmorFreq,     0.1, 4.0, true, '×')}
          ${_buildParamRow('fluidViscosity', 'Fluid Viscosity',  defs.fluidViscosity, 0.1, 2.0, true, '')}
          ${_buildParamRow('resourceRegen',  'Resource Regen',   defs.resourceRegen,  0.1, 5.0, true, '×')}
          ${_buildParamRow('coherence',      'Flock Coherence',  defs.coherence,      0.0, 1.0, true, '')}
        </div>

        <!-- BUTTONS -->
        <div class="opening-buttons">
          <button class="btn-v2 btn-v2-secondary" id="btn-defaults">↩ Restore Defaults</button>
          ${hasSave ? '<button class="btn-v2 btn-v2-load" id="btn-continue">▶ Continue Saved</button>' : ''}
          <button class="btn-v2 btn-v2-primary" id="btn-begin">▶ BEGIN BIOME</button>
        </div>
      </div>
    `;

    _bindEvents();
  }

  // ── PARAM ROW HTML ────────────────────────────────────────────
  function _buildParamRow(key, label, value, min, max, isFloat, unit) {
    const step   = isFloat ? '0.05' : '1';
    const dispVal = isFloat ? Number(value).toFixed(isFloat && (max <= 2) ? 2 : 1) : value;
    return `
      <div class="param-row">
        <span class="param-label">${label}</span>
        <input  class="param-slider" id="slider-${key}"
                type="range" min="${min}" max="${max}" step="${step}" value="${value}"
                data-key="${key}" data-float="${isFloat ? 1 : 0}" data-unit="${unit || ''}">
        <span  class="param-value"  id="val-${key}">${dispVal}${unit || ''}</span>
        <button class="param-rand-btn" id="rand-${key}" data-key="${key}" title="Random Mode">🎲</button>
      </div>`;
  }

  // ── EVENT BINDINGS ────────────────────────────────────────────
  function _bindEvents() {
    // Resolution selector
    _el.querySelectorAll('.res-option').forEach(opt => {
      opt.addEventListener('click', () => {
        _el.querySelectorAll('.res-option').forEach(o => o.classList.remove('selected'));
        opt.classList.add('selected');
        _values.resolution = opt.dataset.res;
      });
    });

    // Sliders
    _el.querySelectorAll('.param-slider').forEach(slider => {
      slider.addEventListener('input', () => {
        const key   = slider.dataset.key;
        const isFloat = slider.dataset.float === '1';
        const unit  = slider.dataset.unit || '';
        const val   = isFloat ? parseFloat(slider.value) : parseInt(slider.value, 10);
        _values[key] = val;
        const disp   = isFloat ? val.toFixed(val < 2 ? 2 : 1) : val;
        const valEl  = document.getElementById('val-' + key);
        if (valEl) valEl.textContent = disp + unit;
      });
    });

    // Random toggles (opening screen — these prime the biomeParams random flags)
    _el.querySelectorAll('.param-rand-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const key = btn.dataset.key;
        btn.classList.toggle('active');
        _values['randomToggle_' + key] = btn.classList.contains('active');
        const slider = document.getElementById('slider-' + key);
        if (slider) slider.classList.toggle('randomized', btn.classList.contains('active'));
      });
    });

    // Restore defaults
    const defBtn = document.getElementById('btn-defaults');
    if (defBtn) defBtn.addEventListener('click', _restoreDefaults);

    // Continue saved game
    const contBtn = document.getElementById('btn-continue');
    if (contBtn) contBtn.addEventListener('click', _continueSaved);

    // Begin biome
    const beginBtn = document.getElementById('btn-begin');
    if (beginBtn) beginBtn.addEventListener('click', _beginBiome);
  }

  // ── ACTIONS ───────────────────────────────────────────────────
  function _restoreDefaults() {
    const defs = window.SpeciesData.DEFAULT_PARAMS;
    _values = { ...defs };
    // Reset all slider visuals
    _el.querySelectorAll('.param-slider').forEach(slider => {
      const key  = slider.dataset.key;
      const isFloat = slider.dataset.float === '1';
      const unit    = slider.dataset.unit || '';
      if (_values[key] !== undefined) {
        slider.value = _values[key];
        const val     = _values[key];
        const disp    = isFloat ? Number(val).toFixed(val < 2 ? 2 : 1) : val;
        const valEl   = document.getElementById('val-' + key);
        if (valEl) valEl.textContent = disp + unit;
      }
    });
    _el.querySelectorAll('.res-option').forEach(o => {
      o.classList.toggle('selected', o.dataset.res === defs.resolution);
    });
    _el.querySelectorAll('.param-rand-btn').forEach(b => {
      b.classList.remove('active');
    });
    _el.querySelectorAll('.param-slider').forEach(s => {
      s.classList.remove('randomized');
    });
  }

  function _continueSaved() {
    hide();
    // The HUD init will pass this flag on BiomeEngine init
    BiomeEngine.init({ ..._values, _restoreFromSave: true });
    if (window.HUD) HUD.init();
    if (window.PovCamera) PovCamera.init();
    const save = SaveLoad.loadState();
    if (save) BiomeEngine.loadState(save);
    if (window.WakeLock) WakeLock.init();
  }

  function _beginBiome() {
    hide();
    const startParams = { ..._values };
    BiomeEngine.init(startParams);
    if (window.HUD)       HUD.init(startParams);
    if (window.PovCamera) PovCamera.init();
    if (window.WakeLock)  WakeLock.init();
  }

  function hide() {
    if (_el) _el.classList.add('hidden');
  }

  function show() {
    if (_el) _el.classList.remove('hidden');
  }

  return { init, hide, show };

})();

window.OpeningScreen = OpeningScreen;
