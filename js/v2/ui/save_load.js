// ============================================================
// Tardigradia 2.0 — Save / Load Progress (Feature E)
// Serialises full biome state to localStorage.
// ============================================================

const SaveLoad = (() => {

  const SAVE_KEY      = 'tardigradia_v2_save';
  const AUTOSAVE_KEY  = 'tardigradia_v2_autosave';
  const AUTOSAVE_INTERVAL = 300; // seconds (5 minutes)
  let   _autosaveTimer = 0;

  // ── SAVE ─────────────────────────────────────────────────────
  function save(silent) {
    try {
      const state = BiomeEngine.getState();
      localStorage.setItem(SAVE_KEY, JSON.stringify(state));
      if (!silent) {
        _flashSave();
        _toast('Game saved — ' + new Date().toLocaleTimeString());
        if (window.HUD) HUD.appendLog('[SAVE] Progress saved at ' + new Date().toLocaleTimeString());
      }
      return true;
    } catch (e) {
      _toast('Save failed: ' + e.message);
      return false;
    }
  }

  function autosave() {
    try {
      const state = BiomeEngine.getState();
      localStorage.setItem(AUTOSAVE_KEY, JSON.stringify(state));
    } catch (_) { /* silent */ }
  }

  // ── LOAD ─────────────────────────────────────────────────────
  function load() {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) {
      _toast('No saved game found.');
      return false;
    }
    try {
      const state = JSON.parse(raw);
      const ok    = BiomeEngine.loadState(state);
      if (ok) {
        _toast('Game loaded — ' + new Date(state.timestamp).toLocaleString());
        if (window.HUD) HUD.appendLog('[LOAD] Biome restored from save');
      } else {
        _toast('Save file incompatible.');
      }
      return ok;
    } catch (e) {
      _toast('Load failed: ' + e.message);
      return false;
    }
  }

  function loadState() {
    try {
      const raw = localStorage.getItem(SAVE_KEY)
                || localStorage.getItem(AUTOSAVE_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch (_) { return null; }
  }

  function hasSave() {
    return !!(localStorage.getItem(SAVE_KEY) || localStorage.getItem(AUTOSAVE_KEY));
  }

  // ── AUTOSAVE TICK ─────────────────────────────────────────────
  function tick(dt) {
    _autosaveTimer += dt;
    if (_autosaveTimer >= AUTOSAVE_INTERVAL) {
      _autosaveTimer = 0;
      autosave();
    }
  }

  // ── UI HELPERS ────────────────────────────────────────────────
  function _flashSave() {
    let flash = document.getElementById('save-flash');
    if (!flash) {
      flash = document.createElement('div');
      flash.id = 'save-flash';
      document.body.appendChild(flash);
    }
    flash.classList.remove('active');
    void flash.offsetWidth;  // trigger reflow
    flash.classList.add('active');
    setTimeout(() => flash.classList.remove('active'), 700);
  }

  function _toast(msg) {
    let container = document.getElementById('toast-container');
    if (!container) {
      container = document.createElement('div');
      container.id = 'toast-container';
      document.body.appendChild(container);
    }
    const t = document.createElement('div');
    t.className   = 'toast';
    t.textContent = msg;
    container.appendChild(t);
    setTimeout(() => t.remove(), 3200);
  }

  return { save, load, loadState, hasSave, tick, autosave };

})();

window.SaveLoad = SaveLoad;
