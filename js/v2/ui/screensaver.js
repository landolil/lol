// ============================================================
// Tardigradia 2.0 — Anti-Screensaver / Wake Lock (Feature C)
// Uses Screen Wake Lock API with synthetic pointer-move fallback.
// ============================================================

const WakeLock = (() => {

  let _lock      = null;
  let _active    = false;
  let _fallback  = null;  // setInterval handle for fallback

  // ── INIT & AUTO-ACQUIRE ───────────────────────────────────────
  function init() {
    // Re-acquire lock when tab becomes visible again
    document.addEventListener('visibilitychange', () => {
      if (!_active) return;
      if (document.visibilityState === 'visible') _acquire();
    });
    _updateButton();
  }

  // ── TOGGLE ───────────────────────────────────────────────────
  function toggle() {
    if (_active) {
      _release();
    } else {
      _acquire();
    }
  }

  // ── ACQUIRE ──────────────────────────────────────────────────
  async function _acquire() {
    _active = true;
    try {
      if ('wakeLock' in navigator) {
        _lock = await navigator.wakeLock.request('screen');
        _lock.addEventListener('release', () => {
          // Auto-reacquire on unexpected release
          if (_active) _acquire();
        });
        _startFallback();   // belt-and-suspenders
        if (window.HUD) HUD.appendLog('[WAKE] Screen Wake Lock acquired');
      } else {
        _startFallback();
        if (window.HUD) HUD.appendLog('[WAKE] Using pointer-move fallback');
      }
    } catch (err) {
      _startFallback();
    }
    _updateButton();
  }

  // ── RELEASE ──────────────────────────────────────────────────
  function _release() {
    _active = false;
    if (_lock) {
      _lock.release();
      _lock = null;
    }
    _stopFallback();
    _updateButton();
    if (window.HUD) HUD.appendLog('[WAKE] Screen Wake Lock released');
  }

  // ── FALLBACK: synthetic pointer events ───────────────────────
  // Dispatching mouse/pointer events keeps most OS screensavers at bay.
  function _startFallback() {
    if (_fallback) return;
    _fallback = setInterval(() => {
      if (!_active) return;
      const evt = new MouseEvent('mousemove', {
        bubbles: true, cancelable: false,
        clientX: window.innerWidth  / 2 + (Math.random() - 0.5),
        clientY: window.innerHeight / 2 + (Math.random() - 0.5),
      });
      document.dispatchEvent(evt);
    }, 30000); // every 30 seconds
  }

  function _stopFallback() {
    if (_fallback) { clearInterval(_fallback); _fallback = null; }
  }

  // ── BUTTON UPDATE ────────────────────────────────────────────
  function _updateButton() {
    const btn = document.getElementById('btn-wake');
    const ind = document.getElementById('wake-indicator');
    if (btn) {
      btn.innerHTML = `<span id="wake-indicator" class="${_active ? 'active' : ''}"></span>☀ Screen Awake: ${_active ? 'ON' : 'OFF'}`;
    }
  }

  return { init, toggle };

})();

window.WakeLock = WakeLock;
