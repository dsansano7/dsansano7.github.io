/* ============================================================
   DiegoOS v3 — script.js
   Full Interactive Engine: Audio · Windows · Projects · Tray
   ============================================================ */

'use strict';

/* ── Pure, High-Performance HTML Escaper (Security Hardening) ── */
function escapeHtml(str) {
  if (str == null) return '';
  return String(str).replace(/[&<>"']/g, m => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  }[m]));
}

/* =========================================================================
   PROJECTS DATABASE
   ========================================================================= */
const PROJECTS = [
  {
    id: 1, title: 'The Last of Us', category: 'Sound Redesign', catClass: 'cat-sd', icon: '🧟',
    desc: 'A comprehensive audio redesign of a dynamic sequence, featuring seamless acoustic transitions between interior and exterior environments. The project highlights custom Foley artistry, spatialized environmental soundscaping, and a cinematic mix fully orchestrated in REAPER.',
    tags: ['REAPER', 'Foley', 'Soundscaping', 'Mixing'],
    gameUrl: '', videoUrl: 'videos/TLOU-Sound-Redesign.mp4', cover: 'Images/The Last Of Us.png'
  },
  {
    id: 2, title: 'Party Drinker', category: 'Audio Implementation', catClass: 'cat-ap', icon: '🍻',
    desc: 'A 48-hour Game Jam project set in a lively party environment, featuring a complete audio build developed from scratch. Rapid implementation using FMOD and Unity, focusing on FMOD spatialization to create an immersive atmosphere.',
    tags: ['FMOD', 'Unity', 'Game Jam', 'Spatialization'],
    gameUrl: './games/party drinker/index.html', videoUrl: 'videos/Party-Drinker.mp4', cover: 'Images/Party Drinker.png'
  },
  {
    id: 3, title: 'Cooking Fever', category: 'Sound Redesign', catClass: 'cat-sd', icon: '🍔',
    desc: 'UI/UX audio design for a fast-paced management game. Crafted tactile interface sounds and rewarding telemetry by blending processed library assets with custom recordings, with all editing and optimization orchestrated natively in REAPER.',
    tags: ['REAPER', 'UI/UX', 'Sound Design', 'Asset Optimization'],
    gameUrl: '', videoUrl: 'videos/Cooking-fever-sound-Redesign.mp4', cover: 'Images/Cooking FEVER.png'
  },
  {
    id: 4, title: 'Unwraptal', category: 'Audio Implementation', catClass: 'cat-ap', icon: '🎁',
    desc: 'A full-cycle audio production for a month-long Game Jam. The game features Wario Ware-style mini-games. Crafted all custom SFX and an original dynamic soundtrack (Menu, HUB, and End Game), fully implemented in Unity via FMOD.',
    tags: ['FMOD', 'Unity', 'Music Composition', 'SFX'],
    gameUrl: './games/unwraptal/index.html', videoUrl: 'videos/Unwraptal.mp4', cover: 'Images/Unwraptal.png'
  },
  {
    id: 5, title: 'Just 5 Minutes', category: 'Audio Implementation', catClass: 'cat-ap', icon: '⏱️',
    desc: 'A 2D idle game developed with a strong focus on anti-fatigue audio design. Tailored so that repetitive gameplay loops remain warm, pleasant, and immersive over extended play sessions, featuring gentle ambient music layering and subtle, non-intrusive sound effects crafted to avoid ear fatigue.',
    tags: ['FMOD', 'Unity', '2D Idle', 'Anti-Fatigue Audio', 'Dynamic Music'],
    gameUrl: './games/Just 5 min/index.html', videoUrl: 'videos/Just 5 min.mp4', cover: 'Images/Just 5 min.png'
  }
];

/* ──────────────────────────────────────────────────────────────
   1. WEB AUDIO ENGINE
   All sounds synthesized — no external files.
   ────────────────────────────────────────────────────────────── */
const AudioEngine = (() => {
  let ctx = null;
  let masterGain = null;
  let muted = false;
  let masterVol = 0.7;
  let isDraggingState = false;
  let lastHoverTime = 0;

  function getCtx() {
    try {
      if (!ctx && (window.AudioContext || window.webkitAudioContext)) {
        ctx = new (window.AudioContext || window.webkitAudioContext)();
        masterGain = ctx.createGain();
        masterGain.gain.value = masterVol;
        masterGain.connect(ctx.destination);
      }
      return ctx;
    } catch (e) {
      return null;
    }
  }

  function tone({ freq = 440, type = 'sine', gain = 0.15, start = 0,
    dur = 0.18, attack = 0.01, release = 0.1 }) {
    if (muted) return;
    try {
      const c = getCtx();
      if (!c) return;
      if (c.state === 'suspended') {
        c.resume().catch(() => {});
      }
      const osc = c.createOscillator();
      const env = c.createGain();
      const hp = c.createBiquadFilter();
      hp.type = 'highpass'; hp.frequency.value = 180;
      osc.type = type; osc.frequency.value = freq;
      env.gain.setValueAtTime(0, c.currentTime + start);
      env.gain.linearRampToValueAtTime(gain, c.currentTime + start + attack);
      env.gain.exponentialRampToValueAtTime(0.0001, c.currentTime + start + dur);
      osc.connect(hp); hp.connect(env); env.connect(masterGain);
      osc.start(c.currentTime + start);
      osc.stop(c.currentTime + start + dur + release);
    } catch (e) {
      // Ignore audio synthesis errors on locked or unsupported devices
    }
  }

  function playBootChime() {
    if (muted) return;
    [
      { freq: 329.63, start: 0, dur: 1.05, gain: 0.11, type: 'sine' },
      { freq: 415.30, start: 0.09, dur: 0.95, gain: 0.09, type: 'sine' },
      { freq: 493.88, start: 0.18, dur: 0.88, gain: 0.08, type: 'sine' },
      { freq: 659.26, start: 0.27, dur: 0.80, gain: 0.07, type: 'sine' },
      { freq: 329.63, start: 0, dur: 1.3, gain: 0.05, type: 'triangle' },
      { freq: 164.81, start: 0, dur: 1.5, gain: 0.06, type: 'sine' },
    ].forEach(n => tone({ ...n, attack: 0.02, release: 0.4 }));
  }

  function playClick() {
    if (muted) return;
    tone({ freq: 1200, type: 'square', gain: 0.035, dur: 0.05, attack: 0.002, release: 0.025 });
    tone({ freq: 880, type: 'sine', gain: 0.025, dur: 0.07, attack: 0.003, release: 0.035 });
  }

  function playHover() {
    if (muted || isDraggingState) return;
    const now = performance.now();
    if (now - lastHoverTime < 90) return; // Prevent rapid-fire sound stacking
    lastHoverTime = now;
    tone({ freq: 1800, type: 'sine', gain: 0.015, dur: 0.035, attack: 0.002, release: 0.018 });
  }

  function setDragging(val) {
    isDraggingState = Boolean(val);
    if (!isDraggingState) {
      lastHoverTime = performance.now() + 100; // Cooldown after release
    }
  }

  function isDragging() {
    return isDraggingState;
  }

  function playOpen() {
    if (muted) return;
    tone({ freq: 880, type: 'sine', gain: 0.065, dur: 0.09, attack: 0.005, release: 0.055 });
    tone({ freq: 1046, type: 'sine', gain: 0.050, start: 0.06, dur: 0.09, attack: 0.004, release: 0.055 });
  }

  function playClose() {
    if (muted) return;
    tone({ freq: 620, type: 'sine', gain: 0.055, dur: 0.09, attack: 0.004, release: 0.045 });
    tone({ freq: 400, type: 'sine', gain: 0.045, start: 0.06, dur: 0.1, attack: 0.002, release: 0.075 });
  }

  function setMuted(val) { muted = Boolean(val); }
  function isMuted() { return muted; }

  function setVolume(vol) {
    masterVol = Math.max(0, Math.min(1, vol));
    if (masterGain) {
      const c = getCtx();
      if (c) masterGain.gain.setTargetAtTime(masterVol, c.currentTime, 0.04);
    }
  }
  function getVolume() { return masterVol; }

  return {
    playBootChime, playClick, playHover, playOpen, playClose,
    setMuted, isMuted, setVolume, getVolume, getCtx,
    setDragging, isDragging
  };
})();

/* ──────────────────────────────────────────────────────────────
   2. WINDOW MANAGER
   ────────────────────────────────────────────────────────────── */
const WindowManager = (() => {
  let topZ = 100;
  const wins = {};   // id → { el, minimized, maximized, prevRect }
  const tabs = {};   // id → <button>
  const meta = {     // id → { icon, label }  — extensible at runtime
    'win-about': { icon: '👤', label: 'About Me' },
    'win-toolkit': { icon: '🎛️', label: 'Toolkit' },
    'win-work': { icon: '🎬', label: 'My Work' },
    'win-contact': { icon: '💻', label: 'Contact' },
    'win-properties': { icon: '⚙️', label: 'Display Properties' },
    'win-notepad': { icon: '📝', label: 'Notepad' },
    'win-pdf-viewer': { icon: '📄', label: 'Adobe Reader' },
    'win-demoreel': { icon: '📼', label: 'Demoreels' },
    'win-steam': { icon: '🎮', label: 'DiegoSteam' },
    'win-diegocode': { icon: '💻', label: 'DiegoCode' },
  };

  const tabsEl = document.getElementById('taskbar-tabs');

  /* ─ register ─────────────────────────────────────────────── */
  function register(id, extraMeta) {
    const el = document.getElementById(id);
    if (!el) return;
    wins[id] = { el, minimized: false, maximized: false, prevRect: null };
    if (extraMeta) meta[id] = extraMeta;
    _initDrag(id, el);
    _initResize(el);
  }

  /* ─ focus ────────────────────────────────────────────────── */
  function focus(id) {
    Object.values(wins).forEach(w => w.el.classList.remove('focused'));
    Object.values(tabs).forEach(t => t.classList.remove('active'));
    if (wins[id]) {
      wins[id].el.style.zIndex = ++topZ;
      wins[id].el.classList.add('focused');
    }
    if (tabs[id]) tabs[id].classList.add('active');
  }

  /* ─ open ─────────────────────────────────────────────────── */
  function open(id) {
    cancelInactivityTimer();
    const w = wins[id];
    if (!w) return;
    if (w.minimized) {
      w.el.style.display = 'flex';
      w.el.classList.remove('minimized-snap');
      w.minimized = false;
      focus(id);
      return;
    }
    if (w.el.style.display === 'flex') { focus(id); return; }

    // Set display flex first so we can compute actual offsetWidth/offsetHeight
    w.el.style.display = 'flex';

    // Center window in viewport
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    const winWidth = w.el.offsetWidth || parseInt(w.el.style.width, 10) || 850;
    const winHeight = w.el.offsetHeight || parseInt(w.el.style.height, 10) || 650;

    if (isMobileDevice()) {
      w.el.style.left = '0px';
      w.el.style.top = '0px';
    } else {
      let left = (viewportWidth - winWidth) / 2;
      let top = (viewportHeight - 52 - winHeight) / 2;
      if (left < 0) left = 0;
      if (top < 0) top = 0;

      w.el.style.left = left + 'px';
      w.el.style.top = top + 'px';
    }

    AudioEngine.playOpen();
    focus(id);
    _createTab(id);
    if (id === 'win-contact') _animateTerminal();
  }

  /* ─ close ────────────────────────────────────────────────── */
  function close(id) {
    const w = wins[id];
    if (!w) return;
    // Pause and unload video when Media Player is closed to free memory/buffers
    if (id === 'win-media-player') {
      const vid = document.getElementById('os-video-player');
      if (vid) {
        vid.pause();
        vid.removeAttribute('src');
        vid.load();
      }
    }
    if (id === 'win-demoreel') {
      const vid = document.getElementById('dr-player-video');
      if (vid) {
        vid.pause();
        vid.removeAttribute('src');
        vid.load();
      }
    }
    // Clean up game runner iframe on close to free GPU/RAM and halt audio loop
    if (id === 'win-game-runner') {
      const body = document.getElementById('game-runner-body');
      if (body) {
        const ifr = body.querySelector('iframe');
        if (ifr) ifr.src = 'about:blank';
        body.innerHTML = '';
      }
    }
    w.el.style.display = 'none';
    w.minimized = w.maximized = false;
    w.el.classList.remove('maximized', 'minimized-snap');
    AudioEngine.playClose();
    _removeTab(id);
  }

  /* ─ minimize ─────────────────────────────────────────────── */
  function minimize(id) {
    const w = wins[id];
    if (!w) return;
    if (id === 'win-demoreel') {
      const vid = document.getElementById('dr-player-video');
      if (vid) vid.pause();
    }
    if (id === 'win-media-player') {
      const vid = document.getElementById('os-video-player');
      if (vid) vid.pause();
    }
    w.minimized = true;
    w.el.classList.add('minimized-snap');
    setTimeout(() => { w.el.style.display = 'none'; w.el.classList.remove('minimized-snap'); }, 220);
    AudioEngine.playClick();
    if (tabs[id]) tabs[id].classList.remove('active');
  }

  /* ─ maximize ─────────────────────────────────────────────── */
  function maximize(id) {
    const w = wins[id];
    if (!w) return;
    if (w.maximized) {
      w.el.classList.remove('maximized');
      if (w.prevRect) {
        const r = w.prevRect;
        w.el.style.top = r.top; w.el.style.left = r.left;
        w.el.style.width = r.width; w.el.style.height = r.height;
      }
      w.maximized = false;
    } else {
      w.prevRect = {
        top: w.el.style.top, left: w.el.style.left,
        width: w.el.style.width, height: w.el.style.height
      };
      w.el.classList.add('maximized');
      w.maximized = true;
    }
    AudioEngine.playClick();
    focus(id);
  }

  /* ─ tabs ─────────────────────────────────────────────────── */
  function _createTab(id) {
    if (tabs[id]) return;
    const m = meta[id] || { icon: '🪟', label: id };
    const btn = document.createElement('button');
    btn.className = 'tb-tab'; btn.id = `tab-${id}`;
    btn.textContent = `${m.icon} ${m.label}`;
    btn.addEventListener('click', () => {
      const w = wins[id];
      if (!w) return;
      if (w.minimized) open(id);
      else if (tabs[id].classList.contains('active')) minimize(id);
      else focus(id);
    });
    tabsEl.appendChild(btn);
    tabs[id] = btn;
  }
  function _removeTab(id) {
    if (tabs[id]) { tabs[id].remove(); delete tabs[id]; }
  }

  /* ─ drag (On-Demand Event Listeners: 0 overhead while idle) ─ */
  function _initDrag(id, el) {
    const tb = el.querySelector('.win-titlebar');
    if (!tb) return;
    let ox = 0, oy = 0;
    let startX = 0, startY = 0;
    let isDragging = false;

    const disableIframes = () => {
      document.querySelectorAll('iframe').forEach(f => f.style.pointerEvents = 'none');
    };
    const enableIframes = () => {
      document.querySelectorAll('iframe').forEach(f => f.style.pointerEvents = '');
    };

    const move = (e) => {
      const cx = e.clientX ?? (e.touches && e.touches[0] ? e.touches[0].clientX : 0);
      const cy = e.clientY ?? (e.touches && e.touches[0] ? e.touches[0].clientY : 0);
      if (!isDragging) {
        if (Math.hypot(cx - startX, cy - startY) < 3) return;
        isDragging = true;
        AudioEngine.setDragging(true);
        document.body.classList.add('is-dragging');
        document.body.style.userSelect = 'none';
        disableIframes();
      }
      el.style.left = Math.max(0, cx - ox) + 'px';
      el.style.top = Math.max(0, cy - oy) + 'px';
    };

    const up = () => {
      document.removeEventListener('mousemove', move);
      document.removeEventListener('mouseup', up);
      document.removeEventListener('touchmove', move);
      document.removeEventListener('touchend', up);
      window.removeEventListener('blur', up);
      document.body.classList.remove('is-dragging');
      AudioEngine.setDragging(false);
      document.body.style.userSelect = '';
      enableIframes();
      isDragging = false;
    };

    const down = (cx, cy) => {
      if (wins[id].maximized || isMobileDevice()) return;
      const r = el.getBoundingClientRect();
      startX = cx;
      startY = cy;
      ox = cx - r.left;
      oy = cy - r.top;
      isDragging = false;
      focus(id);
      document.addEventListener('mousemove', move);
      document.addEventListener('mouseup', up);
      document.addEventListener('touchmove', move, { passive: true });
      document.addEventListener('touchend', up);
      window.addEventListener('blur', up, { once: true });
    };

    tb.addEventListener('mousedown', e => {
      if (e.button !== 0) return;
      if (e.target.closest('.win-caption-btns') || e.target.closest('.cap-btn') || e.target.closest('button')) return;
      down(e.clientX, e.clientY);
    });
    tb.addEventListener('touchstart', e => {
      if (e.target.closest('.win-caption-btns') || e.target.closest('.cap-btn') || e.target.closest('button')) return;
      const t = e.touches[0];
      if (t) down(t.clientX, t.clientY);
    }, { passive: true });

    el.addEventListener('mousedown', () => focus(id));
  }

  /* ─ resize (On-Demand Event Listeners) ────────────────────── */
  function _initResize(el) {
    const h = document.createElement('div');
    h.style.cssText = 'position:absolute;bottom:0;right:0;width:14px;height:14px;cursor:se-resize;z-index:10;';
    el.appendChild(h);
    let sx = 0, sy = 0, sw = 0, sh = 0;

    const disableIframes = () => {
      document.querySelectorAll('iframe').forEach(f => f.style.pointerEvents = 'none');
    };
    const enableIframes = () => {
      document.querySelectorAll('iframe').forEach(f => f.style.pointerEvents = '');
    };

    const move = (e) => {
      el.style.width = Math.max(340, sw + e.clientX - sx) + 'px';
      el.style.height = Math.max(240, sh + e.clientY - sy) + 'px';
    };

    const up = () => {
      document.removeEventListener('mousemove', move);
      document.removeEventListener('mouseup', up);
      window.removeEventListener('blur', up);
      document.body.style.userSelect = '';
      enableIframes();
    };

    h.addEventListener('mousedown', e => {
      if (e.button !== 0) return;
      sx = e.clientX; sy = e.clientY; sw = el.offsetWidth; sh = el.offsetHeight;
      e.stopPropagation();
      document.body.style.userSelect = 'none';
      disableIframes();
      document.addEventListener('mousemove', move);
      document.addEventListener('mouseup', up);
      window.addEventListener('blur', up, { once: true });
    });
  }

  /* ─ terminal animation ───────────────────────────────────── */
  function _animateTerminal() {
    if (window._animateTerminalInstance) {
      window._animateTerminalInstance();
    }
  }

  return { register, focus, open, close, minimize, maximize };
})();

/* ──────────────────────────────────────────────────────────────
   3. CAPTION BUTTONS — wires existing + dynamically created
   ────────────────────────────────────────────────────────────── */
function wireCapBtns(root = document) {
  root.querySelectorAll('.cap-btn').forEach(btn => {
    // Prevent double-wiring
    if (btn.dataset.wired) return;
    btn.dataset.wired = '1';
    const action = btn.dataset.action;
    const winId = btn.dataset.win;
    btn.addEventListener('click', e => {
      e.stopPropagation();
      switch (action) {
        case 'close': WindowManager.close(winId); break;
        case 'minimize': WindowManager.minimize(winId); break;
        case 'maximize': WindowManager.maximize(winId); break;
      }
    });
    btn.addEventListener('mouseenter', () => AudioEngine.playHover());
  });
}

/* ──────────────────────────────────────────────────────────────
   4. XP FILE EXPLORER — My Work navigation engine
   ────────────────────────────────────────────────────────────── */
function initFileExplorer() {
  const folderView  = document.getElementById('xp-folder-view');
  const addrBar     = document.getElementById('xp-address-bar');
  const backBtn     = document.getElementById('xp-btn-back');
  const upBtn       = document.getElementById('xp-btn-up');
  const detailsName = document.getElementById('xp-details-name');
  const detailsType = document.getElementById('xp-details-type');
  const detailsSize = document.getElementById('xp-details-size');
  const detailIcon  = document.querySelector('#xp-details-box .xp-detail-icon');

  if (!folderView) return;

  let viewState   = 'root'; // 'root' | 'category' | 'project'
  let currentCat  = null;
  let currentProj = null;

  /* ─ SVG templates ──────────────────────────────────── */
  const folderSVG = `<svg viewBox="0 0 64 52" fill="none" xmlns="http://www.w3.org/2000/svg" class="xp-icon-svg">
    <path d="M2 10 Q2 6 6 6 L24 6 L30 2 L58 2 Q62 2 62 6 L62 46 Q62 50 58 50 L6 50 Q2 50 2 46 Z" fill="#FFC83D" stroke="#CC8800" stroke-width="1.5"/>
    <path d="M2 16 L62 16 L62 46 Q62 50 58 50 L6 50 Q2 50 2 46 Z" fill="#FFD966" stroke="#CC8800" stroke-width="1.5"/>
    <line x1="14" y1="28" x2="50" y2="28" stroke="#CC8800" stroke-width="1.5" opacity="0.4"/>
    <line x1="14" y1="36" x2="40" y2="36" stroke="#CC8800" stroke-width="1.5" opacity="0.3"/>
  </svg>`;

  const pdfSVG = `<svg viewBox="0 0 54 64" fill="none" xmlns="http://www.w3.org/2000/svg" class="xp-icon-svg">
    <rect x="2" y="2" width="50" height="60" rx="4" fill="#ffffff" stroke="#b30c0c" stroke-width="2.5"/>
    <path d="M36 2 L36 18 L52 18" fill="#fcdede" stroke="#b30c0c" stroke-width="1.8"/>
    <path d="M36 2 L52 18" fill="none" stroke="#b30c0c" stroke-width="2.5"/>
    <rect x="8" y="26" width="38" height="18" rx="2" fill="#b30c0c"/>
    <text x="27" y="39" text-anchor="middle" fill="#ffffff" font-size="11" font-family="'Arial Black', Impact, sans-serif" font-weight="900">PDF</text>
    <line x1="10" y1="50" x2="44" y2="50" stroke="#999" stroke-width="1.5"/>
    <line x1="10" y1="56" x2="30" y2="56" stroke="#999" stroke-width="1.5"/>
  </svg>`;

  const exeSVG = `<svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" class="xp-icon-svg">
    <defs><linearGradient id="eg" x1="20" y1="14" x2="52" y2="50" gradientUnits="userSpaceOnUse"><stop offset="0%" stop-color="#00ff88"/><stop offset="100%" stop-color="#00aa44"/></linearGradient></defs>
    <rect x="4" y="4" width="56" height="56" rx="6" fill="#0d1a2e" stroke="#2a5acc" stroke-width="2"/>
    <polygon points="20,14 20,50 52,32" fill="url(#eg)"/>
    <circle cx="48" cy="48" r="10" fill="#1a3a6a" stroke="#2a5acc" stroke-width="1.5"/>
    <text x="48" y="52" text-anchor="middle" fill="#7ec8ff" font-size="9" font-family="monospace" font-weight="bold">.exe</text>
  </svg>`;

  /* ─ renderRoot ─────────────────────────────────────── */
  function renderRoot() {
    viewState = 'root'; currentCat = null; currentProj = null;
    folderView.innerHTML = '';
    if (addrBar)     addrBar.value           = 'C:\\DiegoOS\\My Work';
    if (backBtn)     backBtn.disabled        = true;
    if (upBtn)       upBtn.disabled          = true;
    if (detailsName) detailsName.textContent = 'My Work';
    if (detailsType) detailsType.textContent = 'System Folder';
    if (detailsSize) detailsSize.textContent = '2 folders';
    if (detailIcon)  detailIcon.textContent  = '📁';

    folderView.appendChild(createFileIcon(folderSVG, 'Audio Redesign',       'folder', () => renderCategory('Sound Redesign')));
    folderView.appendChild(createFileIcon(folderSVG, 'Audio Implementation',  'folder', () => renderCategory('Audio Implementation')));
  }

  /* ─ renderCategory ─────────────────────────────────── */
  function renderCategory(catName) {
    viewState = 'category'; currentCat = catName; currentProj = null;
    folderView.innerHTML = '';
    if (addrBar)     addrBar.value           = `C:\\DiegoOS\\My Work\\${catName}`;
    if (backBtn)     backBtn.disabled        = false;
    if (upBtn)       upBtn.disabled          = false;
    if (detailsName) detailsName.textContent = catName;
    if (detailsType) detailsType.textContent = 'File Folder';
    const projs = PROJECTS.filter(p => p.category === catName);
    if (detailsSize) detailsSize.textContent = `${projs.length} objects`;
    if (detailIcon)  detailIcon.textContent  = '📂';
    AudioEngine.playOpen();
    projs.forEach(proj => {
      folderView.appendChild(createFileIcon(folderSVG, proj.title, 'folder', () => navigateInto(proj)));
    });
  }

  /* ─ navigateInto ───────────────────────────────────── */
  function navigateInto(proj) {
    viewState = 'project'; currentProj = proj;
    folderView.innerHTML = '';
    if (addrBar)     addrBar.value           = `C:\\DiegoOS\\My Work\\${currentCat}\\${proj.title}`;
    if (backBtn)     backBtn.disabled        = false;
    if (upBtn)       upBtn.disabled          = false;
    if (detailsName) detailsName.textContent = proj.title;
    if (detailsType) detailsType.textContent = proj.category;
    if (detailsSize) detailsSize.textContent = (proj.videoUrl ? 2 : 1) + (proj.gameUrl ? ' + 1' : '') + ' objects';
    if (detailIcon)  detailIcon.textContent  = proj.icon;
    AudioEngine.playOpen();

    // PDF
    folderView.appendChild(createFileIcon(pdfSVG, 'Project_Details.pdf', 'pdf', () => openReadme(proj)));

    // Video file → opens native Media Player
    if (proj.videoUrl) {
      const thumbHtml = `<img src="Images/Video icono.png" draggable="false" style="width:52px;height:52px;object-fit:contain;filter:drop-shadow(1px 2px 3px rgba(0,0,0,0.4));" alt="Showreel.mp4" />`;
      folderView.appendChild(createFileIcon(thumbHtml, 'Showreel.mp4', 'video', () => openVideo(proj)));
    }

    // Steam link
    if (proj.gameUrl) {
      const thumbHtml = proj.cover ? `<img src="${proj.cover}" draggable="false" class="xp-custom-thumb" alt="Play on Steam" />` : exeSVG;
      folderView.appendChild(createFileIcon(thumbHtml, 'Play_on_Steam.url', 'exe', () => {
        WindowManager.open('win-steam');
        AudioEngine.playOpen();
        const steamRows = document.querySelectorAll('.st-sidebar-row');
        steamRows.forEach(row => {
          if (row.textContent.includes(proj.title)) {
            row.click();
          }
        });
      }));
    }
  }

  /* ─ openReadme ─────────────────────────────────────── */
  function openReadme(proj) {
    const sheet = document.getElementById('pdf-page-sheet');
    if (sheet) {
      const tagHTML    = proj.tags.map(t => `<li class="pdf-sheet-tag">${escapeHtml(t)}</li>`).join('');
      const paragraphs = proj.desc.split('\n\n').map(p => `<p class="pdf-sheet-desc">${escapeHtml(p)}</p>`).join('');
      sheet.innerHTML = `
        <div class="pdf-sheet-title">${escapeHtml(proj.title)}</div>
        <div class="pdf-sheet-category">${escapeHtml(proj.category)}</div>
        <div class="pdf-sheet-section-title">Description</div>
        <div class="pdf-sheet-desc-container">${paragraphs}</div>
        <div class="pdf-sheet-section-title">Tech Stack</div>
        <ul class="pdf-sheet-tag-list">${tagHTML}</ul>
      `;
    }
    WindowManager.open('win-pdf-viewer');
    AudioEngine.playOpen();
  }

  /* ─ openVideo ──────────────────────────────────────── */
  function openVideo(proj) {
    const vidEl   = document.getElementById('os-video-player');
    const titleEl = document.getElementById('media-player-title');
    if (vidEl)   vidEl.src = proj.videoUrl;
    if (titleEl) titleEl.textContent = `${proj.title} — Windows Media Player`;
    WindowManager.open('win-media-player');
    if (vidEl) vidEl.play().catch(() => {});
  }

  /* ─ createFileIcon ─────────────────────────────────── */
  function createFileIcon(svgHtml, label, type, onDblClick) {
    const item = document.createElement('div');
    item.className = `xp-file-icon xp-type-${type}`;
    item.setAttribute('tabindex', '0');
    item.setAttribute('role', 'button');
    item.setAttribute('aria-label', label);
    item.innerHTML = `
      <div class="xp-icon-img">${svgHtml}</div>
      <div class="xp-icon-label">${escapeHtml(label)}</div>
    `;
    let clickTimer = null;
    item.addEventListener('click', e => {
      e.stopPropagation();
      folderView.querySelectorAll('.xp-file-icon').forEach(i => i.classList.remove('xp-selected'));
      item.classList.add('xp-selected');
      AudioEngine.playClick();
      if (detailsName) detailsName.textContent = label;
      if (isMobileDevice()) {
        onDblClick();
      } else {
        if (clickTimer) { clearTimeout(clickTimer); clickTimer = null; onDblClick(); }
        else clickTimer = setTimeout(() => { clickTimer = null; }, 380);
      }
    });
    item.addEventListener('keydown', e => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onDblClick(); }
    });
    item.addEventListener('mouseenter', () => AudioEngine.playHover());
    return item;
  }

  /* ─ toolbar buttons & address bar ──────────────────── */
  const goBack = () => {
    AudioEngine.playClick();
    if (viewState === 'project')        renderCategory(currentCat);
    else if (viewState === 'category')  renderRoot();
  };
  if (backBtn) backBtn.addEventListener('click', goBack);
  if (upBtn)   upBtn.addEventListener('click', goBack);

  const handleAddressNavigation = () => {
    if (!addrBar) return;
    const val = addrBar.value.trim().toLowerCase();
    if (val === 'c:\\diegoos\\my work' || val === 'my work' || val === 'c:\\diegoos' || val === '') {
      renderRoot();
    } else if (val.includes('redesign') || val.includes('sound redesign')) {
      renderCategory('Sound Redesign');
    } else if (val.includes('implementation') || val.includes('audio implementation')) {
      renderCategory('Audio Implementation');
    } else {
      const matchedProj = PROJECTS.find(p => val.includes(p.title.toLowerCase()));
      if (matchedProj) {
        currentCat = matchedProj.category;
        navigateInto(matchedProj);
      } else {
        if (window.AudioEngine) AudioEngine.playClick();
        if (viewState === 'project' && currentProj) {
          addrBar.value = `C:\\DiegoOS\\My Work\\${currentCat}\\${currentProj.title}`;
        } else if (viewState === 'category' && currentCat) {
          addrBar.value = `C:\\DiegoOS\\My Work\\${currentCat}`;
        } else {
          addrBar.value = 'C:\\DiegoOS\\My Work';
        }
      }
    }
  };

  if (addrBar) {
    addrBar.addEventListener('keydown', e => {
      if (e.key === 'Enter') handleAddressNavigation();
    });
  }
  const addrGoBtn = document.getElementById('xp-addr-go');
  if (addrGoBtn) {
    addrGoBtn.addEventListener('click', handleAddressNavigation);
  }

  // Left sidebar navigation links
  document.querySelectorAll('.xp-sidebar-link').forEach(link => {
    link.addEventListener('click', () => {
      const text = link.textContent.trim();
      if (text.includes('My Documents') || text.includes('My Computer')) {
        renderRoot();
        if (window.AudioEngine) AudioEngine.playClick();
      } else {
        if (window.AudioEngine) AudioEngine.playHover();
        if (typeof showOSAlert === 'function') {
          showOSAlert('DiegoOS Explorer', `${text}: This simulated action is restricted in DiegoOS Workstation Edition.`);
        }
      }
    });
  });

  /* ─ initial render ─────────────────────────────────── */
  renderRoot();
}


const isMobileDevice = () => {
  return window.innerWidth <= 768 || window.matchMedia('(max-width: 768px)').matches;
};

let inactivityTimer = null;
function cancelInactivityTimer() {
  if (inactivityTimer) {
    clearTimeout(inactivityTimer);
    inactivityTimer = null;
  }
  const startBtn = document.getElementById('start-btn');
  if (startBtn) {
    startBtn.classList.remove('pulse-anim');
  }
}

let bootCompleted = false;
let bootChimePlayed = false;
const audioUnlockEvents = ['click', 'keydown', 'touchstart', 'mousedown'];

function triggerBootChime() {
  bootCompleted = true;
  if (bootChimePlayed) return;

  const ctx = AudioEngine.getCtx();
  if (ctx && ctx.state === 'running') {
    AudioEngine.playBootChime();
    bootChimePlayed = true;
    removeAudioUnlockListeners();
  }
}

const unlockAudio = () => {
  const ctx = AudioEngine.getCtx();
  if (ctx) {
    if (ctx.state === 'suspended') {
      ctx.resume().then(() => {
        if (bootCompleted && !bootChimePlayed) {
          AudioEngine.playBootChime();
          bootChimePlayed = true;
          removeAudioUnlockListeners();
        }
      }).catch(() => {});
    } else if (ctx.state === 'running') {
      if (bootCompleted && !bootChimePlayed) {
        AudioEngine.playBootChime();
        bootChimePlayed = true;
        removeAudioUnlockListeners();
      }
    }
  }
};

function removeAudioUnlockListeners() {
  audioUnlockEvents.forEach(evt => {
    document.removeEventListener(evt, unlockAudio);
  });
}

function initAudioUnlocker() {
  audioUnlockEvents.forEach(evt => {
    document.addEventListener(evt, unlockAudio, { passive: true });
  });
}

function runBoot() {
  const boot = document.getElementById('boot-screen');
  const desktop = document.getElementById('desktop');
  const bootDuration = 2500;

  // Single timeout instead of wasteful 50ms polling loop
  setTimeout(() => {
    if (boot) boot.classList.add('boot-fade-out');
    if (desktop) desktop.style.display = 'block';

    // Wait 800ms for boot-screen fade-out to finish
    setTimeout(() => {
      const crtLine = document.querySelector('.crt-bright-line');
      if (crtLine) crtLine.classList.add('bloom');

      // 1 second pause with scanline glowing
      setTimeout(() => {
        const crtOverlay = document.getElementById('crt-transition-overlay');
        if (crtOverlay) crtOverlay.classList.add('open');

        // 600ms transition time for bars to slide apart completely
        setTimeout(() => {
          try { if (boot) boot.remove(); } catch (err) { console.error(err); }
          try { if (crtOverlay) crtOverlay.remove(); } catch (err) { console.error(err); }

          try { triggerBootChime(); } catch (err) { console.error(err); }
          try { startClock(); } catch (err) { console.error(err); }
          try { showWelcomeTooltip(); } catch (err) { console.error(err); }
          try { initTaskbarAutoHide(); } catch (err) { console.error(err); }

          // Start inactivity timer of 6 seconds to highlight start button
          inactivityTimer = setTimeout(() => {
            const startBtn = document.getElementById('start-btn');
            if (startBtn) {
              startBtn.classList.add('pulse-anim');
            }
          }, 6000);
        }, 600);
      }, 1000);
    }, 800);
  }, bootDuration);
}

function showWelcomeTooltip() {
  const tip = document.getElementById('balloon-tip');
  if (!tip) return;

  const closeBtn = document.getElementById('balloon-close');
  let autoDismissTimer = null;

  const dismiss = () => {
    if (autoDismissTimer) {
      clearTimeout(autoDismissTimer);
      autoDismissTimer = null;
    }
    tip.classList.add('hiding');
    setTimeout(() => {
      tip.style.display = 'none';
      tip.classList.remove('hiding');
    }, 350);
  };

  setTimeout(() => {
    tip.style.display = 'block';
    AudioEngine.playOpen();

    autoDismissTimer = setTimeout(() => {
      dismiss();
    }, 12000);
  }, 1500);

  if (closeBtn) {
    closeBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      dismiss();
    }, { once: true });
  }
}

/* ──────────────────────────────────────────────────────────────
   6. CLOCK
   ────────────────────────────────────────────────────────────── */
let clockInterval = null;
function startClock() {
  const el = document.getElementById('tray-clock');
  if (!el) return;
  const tick = () => {
    const n = new Date();
    try {
      el.textContent = n.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
    } catch (e) {
      el.textContent = `${String(n.getHours()).padStart(2, '0')}:${String(n.getMinutes()).padStart(2, '0')}`;
    }
  };
  tick();
  if (!clockInterval) {
    clockInterval = setInterval(tick, 10000);
  }
}

/* ──────────────────────────────────────────────────────────────
   7. START MENU
   ────────────────────────────────────────────────────────────── */
function initStartMenu() {
  const btn = document.getElementById('start-btn');
  const menu = document.getElementById('start-menu');
  if (!btn || !menu) return;

  const isMenuOpen = () => menu.classList.contains('open');

  const closeMenu = () => {
    menu.classList.remove('open');
    menu.style.display = 'none';
    btn.setAttribute('aria-expanded', 'false');
  };

  const openMenu = () => {
    cancelInactivityTimer();
    menu.classList.add('open');
    menu.style.display = '';
    btn.setAttribute('aria-expanded', 'true');
    AudioEngine.playClick();
  };

  let lastToggleTime = 0;
  const toggle = () => {
    const now = Date.now();
    if (now - lastToggleTime < 300) return;
    lastToggleTime = now;

    if (isMenuOpen()) {
      closeMenu();
      AudioEngine.playClick();
    } else {
      openMenu();
    }
  };

  btn.addEventListener('click', e => {
    e.preventDefault();
    e.stopPropagation();
    toggle();
  });

  btn.addEventListener('touchend', e => {
    e.preventDefault();
    e.stopPropagation();
    toggle();
  });

  const onOutsideTap = e => {
    if (!isMenuOpen()) return;
    if (menu.contains(e.target) || btn.contains(e.target)) return;
    closeMenu();
  };

  document.addEventListener('pointerdown', onOutsideTap);
  document.addEventListener('click', onOutsideTap);

  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && isMenuOpen()) {
      closeMenu();
    }
  });

  document.querySelectorAll('#start-menu .sm-item[data-window]').forEach(item => {
    item.addEventListener('click', () => {
      WindowManager.open(item.dataset.window);
      closeMenu();
      AudioEngine.playClick();
    });
  });

  // Shut down easter egg
  ['sm-shutdown-btn', 'sm-shutdown'].forEach(id => {
    const el = document.getElementById(id);
    if (!el) return;
    el.addEventListener('click', () => {
      closeMenu();
      AudioEngine.playClose();
      const scr = document.createElement('div');
      scr.className = 'shutdown-screen';
      scr.innerHTML = `
        <div class="shutdown-left-bar"></div>
        <div class="shutdown-main">
          <div class="shutdown-logo-row">
            <img src="Images/WindowsLogoDS.png" class="shutdown-logo-img" alt="Logo" />
            <div class="shutdown-text-col">
              <div class="shutdown-please-wait">please wait...</div>
              <div class="shutdown-status">DiegoOS is shutting down...</div>
            </div>
          </div>
          <button class="shutdown-restart-btn">
            ↺ Restart DiegoOS
          </button>
        </div>`;
      scr.querySelector('.shutdown-restart-btn')?.addEventListener('click', () => location.reload());
      document.body.appendChild(scr);
    });
  });

  const logoff = document.getElementById('sm-logoff-btn');
  if (logoff) logoff.addEventListener('click', () => { closeMenu(); AudioEngine.playClose(); location.reload(); });
}

/* ──────────────────────────────────────────────────────────────
   8. SEARCH BAR
   ────────────────────────────────────────────────────────────── */
function initSearch() {
  const inp = document.getElementById('taskbar-search');
  if (!inp) return;

  const map = [
    { terms: ['about', 'me', 'diego', 'bio', 'saxophone', 'berklee', 'uji', 'firescale', 'rural', 'gdd', 'education', 'cv', 'experience'], win: 'win-about' },
    { terms: ['toolkit', 'fmod', 'wwise', 'unity', 'unreal', 'reaper', 'audition', 'fabfilter', 'izotope', 'git', 'github', 'latex', 'overleaf', 'musescore', 'audio', 'middleware', 'stack', 'skills'], win: 'win-toolkit' },
    { terms: ['work', 'project', 'reels', 'demoreel', 'video', 'showreel', 'tlou', 'cooking', 'just', 'minutes'], win: 'win-demoreel' },
    { terms: ['contact', 'email', 'phone', 'mail', 'call', 'languages', 'terminal', 'license'], win: 'win-contact' },
    { terms: ['steam', 'game', 'play', 'unwraptal', 'party', 'drinker', 'itch', 'just', 'minutes'], win: 'win-steam' },
  ];

  inp.addEventListener('keydown', e => {
    if (e.key !== 'Enter') return;
    const q = inp.value.trim().toLowerCase();
    if (!q) return;
    let matched = null;
    for (const entry of map) {
      if (entry.terms.some(t => q.includes(t))) { matched = entry.win; break; }
    }
    if (matched) {
      WindowManager.open(matched);
      AudioEngine.playOpen();
      // Close Start Menu
      const sm = document.getElementById('start-menu');
      if (sm) { sm.classList.remove('open'); sm.style.display = 'none'; }
      const btn = document.getElementById('start-btn');
      if (btn) btn.setAttribute('aria-expanded', 'false');
    } else {
      inp.style.color = '#ff6060';
      setTimeout(() => inp.style.color = '', 800);
    }
    inp.value = ''; inp.blur();
  });
}
/* ──────────────────────────────────────────────────────────────
   9. SYSTEM TRAY & DISPLAY PROPERTIES — Bidirectional Sync
   ────────────────────────────────────────────────────────────── */
let isDarkModeGlobal = false;

function setDarkModeState(state) {
  isDarkModeGlobal = Boolean(state);
  try {
    localStorage.setItem('diegoos_darkmode', isDarkModeGlobal ? '1' : '0');
  } catch (e) {}

  const body = document.getElementById('body-root');
  const darkBtn = document.getElementById('dark-mode-btn');
  const darkIcon = document.getElementById('dark-icon');
  const propThemeToggle = document.getElementById('prop-theme-toggle');
  const propThemeStatus = document.getElementById('prop-theme-status');

  if (body) body.classList.toggle('dark-mode', isDarkModeGlobal);
  if (darkIcon) darkIcon.textContent = isDarkModeGlobal ? '🌙' : '☀️';
  if (darkBtn) darkBtn.title = isDarkModeGlobal ? 'Switch to Light Mode' : 'Switch to Dark Mode';

  if (propThemeStatus) propThemeStatus.textContent = isDarkModeGlobal ? 'Night Mode' : 'Day Mode';
  if (propThemeToggle) {
    if (isDarkModeGlobal) {
      propThemeToggle.style.background = '#444466';
      propThemeToggle.style.borderColor = '#555588';
    } else {
      propThemeToggle.style.background = 'var(--blue)';
      propThemeToggle.style.borderColor = 'var(--win-border)';
    }
  }
}

function setVolumeState(percent) {
  const vol = percent / 100;
  AudioEngine.setVolume(vol);

  try {
    localStorage.setItem('diegoos_volume', String(percent));
  } catch (e) {}

  const volSlider = document.getElementById('vol-slider');
  const propVolSlider = document.getElementById('prop-vol-slider');
  const propVolVal = document.getElementById('prop-vol-val');
  const muteIcon = document.getElementById('mute-icon');
  const muteBtn = document.getElementById('mute-btn');

  // Sync tray slider
  if (volSlider) {
    volSlider.value = percent;
    volSlider.style.setProperty('--vpct', percent + '%');
  }

  // Sync prop slider
  if (propVolSlider) {
    propVolSlider.value = percent;
  }
  if (propVolVal) {
    propVolVal.textContent = percent + '%';
  }

  // Handle auto-mute logic
  if (percent === 0 && !AudioEngine.isMuted()) {
    AudioEngine.setMuted(true);
    if (muteIcon) muteIcon.textContent = '🔇';
    if (muteBtn) muteBtn.title = 'Unmute';
  } else if (percent > 0 && AudioEngine.isMuted()) {
    AudioEngine.setMuted(false);
    if (muteIcon) muteIcon.textContent = '🔊';
    if (muteBtn) muteBtn.title = 'Mute';
  }
}

function initSystemTray() {
  const darkBtn = document.getElementById('dark-mode-btn');
  const muteBtn = document.getElementById('mute-btn');
  const muteIcon = document.getElementById('mute-icon');
  const volSlider = document.getElementById('vol-slider');

  // ── Dark Mode ───────────────────────────────────────────
  if (darkBtn) {
    darkBtn.addEventListener('click', () => {
      setDarkModeState(!isDarkModeGlobal);
      AudioEngine.playClick();
    });
  }

  // Initialize UI
  if (volSlider) {
    volSlider.style.setProperty('--vpct', volSlider.value + '%');

    // ── Volume Slider ────────────────────────────────────────
    volSlider.addEventListener('input', () => {
      setVolumeState(parseInt(volSlider.value, 10));
    });
  }

  // ── Mute Button ─────────────────────────────────────────
  let preMuteVol = 70;
  if (muteBtn) {
    muteBtn.addEventListener('click', () => {
      const wasMuted = AudioEngine.isMuted();
      if (wasMuted) {
        AudioEngine.setMuted(false);
        if (muteIcon) muteIcon.textContent = '🔊';
        muteBtn.title = 'Mute';
        const targetVol = preMuteVol > 0 ? preMuteVol : 70;
        setVolumeState(targetVol);
        setTimeout(() => AudioEngine.playClick(), 60);
      } else {
        if (volSlider) {
          const currentVol = parseInt(volSlider.value, 10);
          if (currentVol > 0) {
            preMuteVol = currentVol;
          }
        }
        AudioEngine.setMuted(true);
        if (muteIcon) muteIcon.textContent = '🔇';
        muteBtn.title = 'Unmute';
        setVolumeState(0);
      }
    });
  }
}

function initPropertiesPanel() {
  const propThemeToggle = document.getElementById('prop-theme-toggle');
  const propVolSlider = document.getElementById('prop-vol-slider');

  if (propThemeToggle) {
    propThemeToggle.addEventListener('click', () => {
      setDarkModeState(!isDarkModeGlobal);
      AudioEngine.playClick();
    });
  }

  if (propVolSlider) {
    propVolSlider.addEventListener('input', () => {
      setVolumeState(parseInt(propVolSlider.value, 10));
    });
  }
}
/* ──────────────────────────────────────────────────────────────
   10. DESKTOP ICONS — single click = select, double = open, draggable & grid-snapped
   ────────────────────────────────────────────────────────────── */
const ICON_GRID_STEP_X = 135;
const ICON_GRID_STEP_Y = 135;
const ICON_GRID_OFFSET_X = 20;
const ICON_GRID_OFFSET_Y = 20;

function isCellOccupied(iconEl, left, top, excludeElements = []) {
  const icons = document.querySelectorAll('.desktop-icon');
  for (const icon of icons) {
    if (icon === iconEl) continue;
    if (excludeElements && excludeElements.includes(icon)) continue;
    const oLeft = parseInt(icon.style.left || '0', 10);
    const oTop = parseInt(icon.style.top || '0', 10);
    if (Math.abs(oLeft - left) < 68 && Math.abs(oTop - top) < 68) {
      return true;
    }
  }
  return false;
}

function getNearestFreeCell(iconEl, targetLeft, targetTop, maxLeft, maxTop, excludeElements = []) {
  let layer = 0;
  while (layer < 25) {
    if (layer === 0) {
      if (!isCellOccupied(iconEl, targetLeft, targetTop, excludeElements)) {
        return { left: targetLeft, top: targetTop };
      }
    } else {
      for (let dy = -layer; dy <= layer; dy++) {
        for (let dx = -layer; dx <= layer; dx++) {
          if (Math.max(Math.abs(dx), Math.abs(dy)) !== layer) continue;

          const candidateLeft = targetLeft + dx * ICON_GRID_STEP_X;
          const candidateTop = targetTop + dy * ICON_GRID_STEP_Y;

          if (candidateLeft < ICON_GRID_OFFSET_X || candidateLeft > maxLeft) continue;
          if (candidateTop < ICON_GRID_OFFSET_Y || candidateTop > maxTop) continue;

          if (!isCellOccupied(iconEl, candidateLeft, candidateTop, excludeElements)) {
            return { left: candidateLeft, top: candidateTop };
          }
        }
      }
    }
    layer++;
  }
  return { left: targetLeft, top: targetTop };
}

function makeIconDraggable(el) {
  let startX = 0, startY = 0;
  let selectedIcons = [];
  let hasMoved = false;

  // Prevent browser native HTML5 drag & drop on images or elements
  el.addEventListener('dragstart', (e) => {
    e.preventDefault();
  });

  const onMouseMove = (e) => {
    const cx = e.clientX ?? (e.touches && e.touches[0] ? e.touches[0].clientX : 0);
    const cy = e.clientY ?? (e.touches && e.touches[0] ? e.touches[0].clientY : 0);
    const dx = cx - startX;
    const dy = cy - startY;

    if (!hasMoved && Math.hypot(dx, dy) > 4) {
      hasMoved = true;
      AudioEngine.setDragging(true);
      document.body.classList.add('is-dragging');
      document.body.style.userSelect = 'none';
      document.querySelectorAll('iframe').forEach(f => f.style.pointerEvents = 'none');
    }
    if (!hasMoved) return;

    const desktop = document.getElementById('desktop');
    const db = desktop ? desktop.getBoundingClientRect() : { width: window.innerWidth, height: window.innerHeight };
    const maxLeft = db.width - 130;
    const maxTop = db.height - 145 - 46;

    selectedIcons.forEach(item => {
      let newLeft = Math.max(0, Math.min(maxLeft, item.startLeft + dx));
      let newTop = Math.max(0, Math.min(maxTop, item.startTop + dy));
      item.el.style.left = newLeft + 'px';
      item.el.style.top = newTop + 'px';
    });
  };

  const onMouseUp = () => {
    document.removeEventListener('mousemove', onMouseMove);
    document.removeEventListener('mouseup', onMouseUp);
    document.removeEventListener('touchmove', onMouseMove);
    document.removeEventListener('touchend', onMouseUp);
    window.removeEventListener('blur', onMouseUp);
    document.body.classList.remove('is-dragging');
    AudioEngine.setDragging(false);
    document.body.style.userSelect = '';
    document.querySelectorAll('iframe').forEach(f => f.style.pointerEvents = '');

    if (hasMoved) {
      // Suppress the click event triggered immediately after releasing a drag
      const preventClick = (e) => {
        e.stopImmediatePropagation();
        e.preventDefault();
        el.removeEventListener('click', preventClick, true);
      };
      el.addEventListener('click', preventClick, true);
      setTimeout(() => {
        el.removeEventListener('click', preventClick, true);
      }, 100);

      const desktop = document.getElementById('desktop');
      const deskW = desktop ? desktop.getBoundingClientRect().width : window.innerWidth;
      const deskH = desktop ? desktop.getBoundingClientRect().height : window.innerHeight;
      const maxLeft = deskW - 130;
      const maxTop = deskH - 145 - 46;

      const movingEls = selectedIcons.map(item => item.el);

      selectedIcons.forEach(item => {
        let currentLeft = parseInt(item.el.style.left || '0', 10);
        let currentTop = parseInt(item.el.style.top || '0', 10);

        let snapLeft = Math.round((currentLeft - ICON_GRID_OFFSET_X) / ICON_GRID_STEP_X) * ICON_GRID_STEP_X + ICON_GRID_OFFSET_X;
        let snapTop = Math.round((currentTop - ICON_GRID_OFFSET_Y) / ICON_GRID_STEP_Y) * ICON_GRID_STEP_Y + ICON_GRID_OFFSET_Y;

        if (snapLeft > maxLeft) snapLeft = Math.max(ICON_GRID_OFFSET_X, Math.floor((maxLeft - ICON_GRID_OFFSET_X) / ICON_GRID_STEP_X) * ICON_GRID_STEP_X + ICON_GRID_OFFSET_X);
        if (snapTop > maxTop) snapTop = Math.max(ICON_GRID_OFFSET_Y, Math.floor((maxTop - ICON_GRID_OFFSET_Y) / ICON_GRID_STEP_Y) * ICON_GRID_STEP_Y + ICON_GRID_OFFSET_Y);

        if (snapLeft < ICON_GRID_OFFSET_X) snapLeft = ICON_GRID_OFFSET_X;
        if (snapTop < ICON_GRID_OFFSET_Y) snapTop = ICON_GRID_OFFSET_Y;

        const pendingOthers = movingEls.filter(m => m !== item.el);
        const freeCell = getNearestFreeCell(item.el, snapLeft, snapTop, maxLeft, maxTop, pendingOthers);
        item.el.classList.add('is-snapping');
        item.el.style.left = freeCell.left + 'px';
        item.el.style.top = freeCell.top + 'px';
        setTimeout(() => {
          item.el.classList.remove('is-snapping');
        }, 200);

        if (item.el.dataset.docId) {
          const d = getDocumentRecord(item.el.dataset.docId);
          if (d) {
            d.x = freeCell.left;
            d.y = freeCell.top;
            saveDocumentRecord(d);
          }
        }

        const idx = movingEls.indexOf(item.el);
        if (idx !== -1) movingEls.splice(idx, 1);
      });
    }

    selectedIcons = [];
    hasMoved = false;
  };

  const onMouseDown = (e) => {
    if (e.button !== 0) return;

    if (!el.classList.contains('selected')) {
      document.querySelectorAll('.desktop-icon').forEach(i => i.classList.remove('selected'));
      el.classList.add('selected');
    }

    hasMoved = false;
    startX = e.clientX;
    startY = e.clientY;

    selectedIcons = Array.from(document.querySelectorAll('.desktop-icon.selected')).map(icon => ({
      el: icon,
      startLeft: parseInt(icon.style.left || '0', 10),
      startTop: parseInt(icon.style.top || '0', 10)
    }));

    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
    window.addEventListener('blur', onMouseUp);
    e.stopPropagation();
  };

  const onTouchStart = (e) => {
    if (isMobileDevice()) return;
    if (!el.classList.contains('selected')) {
      document.querySelectorAll('.desktop-icon').forEach(i => i.classList.remove('selected'));
      el.classList.add('selected');
    }

    const t = e.touches[0];
    if (!t) return;
    hasMoved = false;
    startX = t.clientX;
    startY = t.clientY;

    selectedIcons = Array.from(document.querySelectorAll('.desktop-icon.selected')).map(icon => ({
      el: icon,
      startLeft: parseInt(icon.style.left || '0', 10),
      startTop: parseInt(icon.style.top || '0', 10)
    }));

    document.addEventListener('touchmove', onMouseMove, { passive: true });
    document.addEventListener('touchend', onMouseUp);
    e.stopPropagation();
  };

  el.addEventListener('mousedown', onMouseDown);
  el.addEventListener('touchstart', onTouchStart, { passive: true });
}

function initDesktopIcons() {
  const defaultCoords = [
    { top: 20, left: 20 },   // 0: About Me (DiegoBook)
    { top: 155, left: 20 },  // 1: Toolkit
    { top: 290, left: 20 },  // 2: Contact (Terminal)
    { top: 425, left: 20 },  // 3: Demoreels (DiegoTube)
    { top: 560, left: 20 },  // 4: DiegoSteam
    { top: 20, left: 155 },  // 5: DiegoCode (Column 2, Row 1)
    { top: 155, left: 155 }  // 6: Itch.io (Column 2, Row 2)
  ];

  const desktop = document.getElementById('desktop');
  const deskH = desktop ? desktop.getBoundingClientRect().height : (window.innerHeight || 800);
  const maxRows = Math.max(1, Math.floor((deskH - 46 - ICON_GRID_OFFSET_Y) / ICON_GRID_STEP_Y));

  document.querySelectorAll('.desktop-icon').forEach((icon, idx) => {
    const winId = icon.dataset.window;
    const url = icon.dataset.url;
    let timer = null;

    let coords = defaultCoords[idx] || { top: 20 + (idx % maxRows) * ICON_GRID_STEP_Y, left: 20 + Math.floor(idx / maxRows) * ICON_GRID_STEP_X };
    if (coords.top + 145 + 46 > deskH && idx >= maxRows) {
      const col = Math.floor(idx / maxRows);
      const row = idx % maxRows;
      coords = {
        left: ICON_GRID_OFFSET_X + col * ICON_GRID_STEP_X,
        top: ICON_GRID_OFFSET_Y + row * ICON_GRID_STEP_Y
      };
    }
    icon.style.top = coords.top + 'px';
    icon.style.left = coords.left + 'px';
    icon.classList.add('is-ready');

    makeIconDraggable(icon);

    const triggerAction = () => {
      if (url) {
        window.open(url, '_blank', 'noopener,noreferrer');
        AudioEngine.playOpen();
      } else if (winId) {
        WindowManager.open(winId);
      }
    };

    icon.addEventListener('click', e => {
      e.stopPropagation();
      cancelInactivityTimer();
      document.querySelectorAll('.desktop-icon').forEach(i => i.classList.remove('selected'));
      icon.classList.add('selected');
      AudioEngine.playClick();

      if (isMobileDevice()) {
        triggerAction();
      } else {
        if (timer) {
          clearTimeout(timer); timer = null;
          triggerAction();
        } else {
          timer = setTimeout(() => { timer = null; }, 400);
        }
      }
    });

    icon.addEventListener('dblclick', e => {
      e.stopPropagation();
      if (timer) { clearTimeout(timer); timer = null; }
      triggerAction();
    });

    icon.addEventListener('keydown', e => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); triggerAction(); }
    });
    icon.addEventListener('mouseenter', () => AudioEngine.playHover());
    icon.addEventListener('contextmenu', e => {
      e.preventDefault();
      e.stopPropagation();
    });
  });

  document.getElementById('desktop').addEventListener('click', e => {
    const tgt = e.target;
    const isDesktopBg = tgt.id === 'desktop' || tgt.classList.contains('wp-layer') || tgt.classList.contains('desktop-overlay') || tgt.id === 'icon-grid';
    if (isDesktopBg) {
      document.querySelectorAll('.desktop-icon').forEach(i => i.classList.remove('selected'));
      const sm = document.getElementById('start-menu');
      if (sm) {
        sm.classList.remove('open');
        sm.style.display = 'none';
      }
      document.getElementById('start-btn').setAttribute('aria-expanded', 'false');
    }
  });
}
function startInlineRename(iconEl) {
  const labelEl = iconEl.querySelector('.icon-label');
  if (!labelEl || labelEl.querySelector('input')) return;

  const originalText = labelEl.textContent;

  labelEl.textContent = '';
  const input = document.createElement('input');
  input.type = 'text';
  input.value = originalText;
  input.className = 'rename-input';

  labelEl.appendChild(input);
  input.focus();
  input.select();

  let finished = false;

  const saveRename = () => {
    if (finished) return;
    finished = true;
    let newName = input.value.trim();
    if (newName && newName !== '') {
      if (!newName.toLowerCase().endsWith('.txt')) newName += '.txt';
      const oldDocId = iconEl.dataset.docId;
      labelEl.textContent = newName;
      iconEl.setAttribute('aria-label', `${newName} — Text file icon`);
      if (oldDocId) {
        renameTextDocument(oldDocId, newName);
      }
    } else {
      labelEl.textContent = originalText;
    }
  };

  const cancelRename = () => {
    if (finished) return;
    finished = true;
    labelEl.textContent = originalText;
  };

  input.addEventListener('blur', saveRename);
  input.addEventListener('keydown', e => {
    if (e.key === 'Enter') {
      e.preventDefault();
      saveRename();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      cancelRename();
    }
  });

  input.addEventListener('click', e => e.stopPropagation());
  input.addEventListener('mousedown', e => e.stopPropagation());
}

function createNewTextFile(x, y, customDoc = null) {
  const grid = document.getElementById('icon-grid');
  if (!grid) return;

  const doc = customDoc || createNewDocumentRecord();

  const icon = document.createElement('div');
  icon.className = 'desktop-icon text-file-icon';
  icon.dataset.docId = doc.id;

  const desktop = document.getElementById('desktop');
  const deskW = desktop ? desktop.getBoundingClientRect().width : window.innerWidth;
  const deskH = desktop ? desktop.getBoundingClientRect().height : window.innerHeight;
  const maxLeft = deskW - 130;
  const maxTop = deskH - 145 - 46;

  let snapLeft, snapTop;
  if (doc.x != null && doc.y != null) {
    snapLeft = doc.x;
    snapTop = doc.y;
  } else {
    snapLeft = Math.round(((x - 50) - ICON_GRID_OFFSET_X) / ICON_GRID_STEP_X) * ICON_GRID_STEP_X + ICON_GRID_OFFSET_X;
    snapTop = Math.round(((y - 40) - ICON_GRID_OFFSET_Y) / ICON_GRID_STEP_Y) * ICON_GRID_STEP_Y + ICON_GRID_OFFSET_Y;

    if (snapLeft > maxLeft) snapLeft = Math.max(ICON_GRID_OFFSET_X, Math.floor((maxLeft - ICON_GRID_OFFSET_X) / ICON_GRID_STEP_X) * ICON_GRID_STEP_X + ICON_GRID_OFFSET_X);
    if (snapTop > maxTop) snapTop = Math.max(ICON_GRID_OFFSET_Y, Math.floor((maxTop - ICON_GRID_OFFSET_Y) / ICON_GRID_STEP_Y) * ICON_GRID_STEP_Y + ICON_GRID_OFFSET_Y);
    if (snapLeft < ICON_GRID_OFFSET_X) snapLeft = ICON_GRID_OFFSET_X;
    if (snapTop < ICON_GRID_OFFSET_Y) snapTop = ICON_GRID_OFFSET_Y;

    const freeCell = getNearestFreeCell(icon, snapLeft, snapTop, maxLeft, maxTop);
    snapLeft = freeCell.left;
    snapTop = freeCell.top;
    doc.x = snapLeft;
    doc.y = snapTop;
    saveDocumentRecord(doc);
  }

  icon.style.left = snapLeft + 'px';
  icon.style.top = snapTop + 'px';
  icon.setAttribute('tabindex', '0');
  icon.setAttribute('role', 'button');
  icon.setAttribute('aria-label', `${escapeHtml(doc.name)} — Text file icon`);

  icon.innerHTML = `
    <div class="icon-img">
      <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect x="12" y="6" width="40" height="52" rx="3" fill="#ffffff" stroke="#0044aa" stroke-width="2"/>
        <line x1="18" y1="14" x2="46" y2="14" stroke="#0044aa" stroke-width="2"/>
        <line x1="18" y1="24" x2="46" y2="24" stroke="#888888" stroke-width="1.5"/>
        <line x1="18" y1="32" x2="46" y2="32" stroke="#888888" stroke-width="1.5"/>
        <line x1="18" y1="40" x2="46" y2="40" stroke="#888888" stroke-width="1.5"/>
        <line x1="18" y1="48" x2="36" y2="48" stroke="#888888" stroke-width="1.5"/>
      </svg>
    </div>
    <span class="icon-label">${escapeHtml(doc.name)}</span>
  `;

  grid.appendChild(icon);
  makeIconDraggable(icon);
  icon.classList.add('is-ready');

  let timer = null;
  const openThisDoc = () => {
    openDocumentInNotepad(doc.id);
  };

  icon.addEventListener('click', e => {
    e.stopPropagation();
    cancelInactivityTimer();
    document.querySelectorAll('.desktop-icon').forEach(i => i.classList.remove('selected'));
    icon.classList.add('selected');
    AudioEngine.playClick();

    if (isMobileDevice()) {
      openThisDoc();
    } else {
      if (timer) {
        clearTimeout(timer); timer = null;
        openThisDoc();
      } else {
        timer = setTimeout(() => { timer = null; }, 400);
      }
    }
  });

  icon.addEventListener('dblclick', e => {
    e.stopPropagation();
    if (timer) { clearTimeout(timer); timer = null; }
    openThisDoc();
  });

  icon.addEventListener('keydown', e => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      openThisDoc();
    }
  });

  icon.addEventListener('mouseenter', () => AudioEngine.playHover());

  // Dynamic context menu for Notepad dynamic files
  icon.addEventListener('contextmenu', e => {
    e.preventDefault();
    e.stopPropagation();

    showContextMenu(e, [
      {
        l: '📖 Abrir en Notepad', fn: () => {
          openThisDoc();
        }
      },
      {
        l: '✏️ Renombrar', fn: () => {
          startInlineRename(icon);
        }
      },
      { sep: true },
      {
        l: '🗑️ Eliminar', fn: () => {
          deleteDocumentRecord(doc.id);
          icon.remove();
        }
      }
    ]);
  });

  return icon;
}

function showContextMenu(e, items) {
  e.preventDefault();
  const old = document.getElementById('_ctx');
  if (old) old.remove();

  const m = document.createElement('div');
  m.id = '_ctx';
  m.className = 'os-context-menu';

  const menuWidth = 180;
  const menuHeight = items.length * 30 + 10;
  const leftPos = Math.min(e.clientX, window.innerWidth - menuWidth);
  const topPos = Math.min(e.clientY, window.innerHeight - menuHeight);

  m.style.left = leftPos + 'px';
  m.style.top = topPos + 'px';

  items.forEach(item => {
    if (item.sep) {
      const sep = document.createElement('div');
      sep.className = 'os-context-menu-sep';
      m.appendChild(sep);
    } else {
      const d = document.createElement('div');
      d.className = 'os-context-menu-item';
      d.textContent = item.l;
      if (item.fn) {
        d.addEventListener('click', () => {
          item.fn();
          m.remove();
          AudioEngine.playClick();
        });
      } else {
        d.style.color = '#999';
        d.style.cursor = 'default';
      }
      m.appendChild(d);
    }
  });

  document.body.appendChild(m);
  AudioEngine.playHover();

  setTimeout(() => {
    const closeMenu = () => {
      m.remove();
      document.removeEventListener('click', closeMenu);
    };
    document.addEventListener('click', closeMenu);
  }, 50);
}

/* ──────────────────────────────────────────────────────────────
   11. CONTEXT MENU EASTER EGG
   ────────────────────────────────────────────────────────────── */
document.addEventListener('contextmenu', e => {
  const tgt = e.target;
  const isDesktopBg = tgt.id === 'desktop' || tgt.classList.contains('wp-layer') || tgt.classList.contains('desktop-overlay') || tgt.id === 'icon-grid';
  if (!isDesktopBg) return;

  showContextMenu(e, [
    { l: '📝 Nuevo Documento de Texto', fn: () => createNewTextFile(e.clientX, e.clientY) },
    { sep: true },
    { l: '⚙️ Properties', fn: () => WindowManager.open('win-properties') }
  ]);
});

/* ──────────────────────────────────────────────────────────────
   12. MOBILE: keep #desktop visible on resize
   ────────────────────────────────────────────────────────────── */
function initTerminalInteraction() {
  const termBody = document.getElementById('contact-body');
  const termInput = document.getElementById('terminal-input');
  if (!termBody || !termInput) return;

  termBody.addEventListener('click', () => {
    termInput.focus();
  });

  let state = 'MENU';
  let mailData = { email: '', subject: '', body: '' };

  const printLine = (text, className = '') => {
    const history = document.getElementById('terminal-history');
    if (!history) return;
    const div = document.createElement('div');
    div.className = 'tl ' + className;
    div.innerHTML = text;
    history.appendChild(div);
    termBody.scrollTop = termBody.scrollHeight;
  };

  const showMenuBanner = () => {
    const history = document.getElementById('terminal-history');
    if (!history) return;

    printLine('==================================================', 'th');
    printLine('  DiegoOS Contact & Mail Portal - Version 3.0', 'tp');
    printLine('==================================================', 'th');
    printLine('Welcome! Please select an option from the menu below,');
    printLine('or type one of the classic CLI commands directly.');
    printLine('');
    printLine('  <span class="tk">[1]</span> Send an Email (Interactive Composer)');
    printLine('  <span class="tk">[2]</span> View Diego\'s Contact Information');
    printLine('  <span class="tk">[3]</span> Show CLI Help &amp; Commands');
    printLine('  <span class="tk">[4]</span> Close Terminal');
    printLine('');
  };

  const initTerminal = () => {
    const history = document.getElementById('terminal-history');
    if (history) history.innerHTML = '';
    state = 'MENU';
    mailData = { email: '', subject: '', body: '' };
    showMenuBanner();
    const tpSpan = termBody.querySelector('.tp');
    if (tpSpan) tpSpan.textContent = 'C:\\DiegoOS\\Contact> ';
  };

  const resetToCommandPrompt = () => {
    state = 'MENU';
    const tpSpan = termBody.querySelector('.tp');
    if (tpSpan) tpSpan.textContent = 'C:\\DiegoOS\\Contact> ';
  };

  window._initTerminalInstance = initTerminal;

  window._animateTerminalInstance = () => {
    initTerminal();
    const inputRow = document.querySelector('.terminal-prompt-row');
    if (inputRow) inputRow.style.opacity = '0';

    const history = document.getElementById('terminal-history');
    if (!history) return;
    const lines = history.querySelectorAll('.tl');
    lines.forEach((ln, i) => {
      ln.style.opacity = '0';
      setTimeout(() => {
        ln.style.transition = 'opacity 0.08s ease';
        ln.style.opacity = '1';
      }, i * 30);
    });

    setTimeout(() => {
      if (inputRow) {
        inputRow.style.transition = 'opacity 0.1s ease';
        inputRow.style.opacity = '1';
      }
      termInput.focus();
    }, lines.length * 30 + 50);
  };

  termInput.addEventListener('keydown', e => {
    if (e.key !== 'Enter') return;
    const val = termInput.value;
    const trimmed = val.trim();
    termInput.value = '';

    const tpSpan = termBody.querySelector('.tp');
    const getPromptText = () => tpSpan ? tpSpan.textContent : '>';

    // Print the entered command with the dynamic prompt prefix (Sanitized)
    printLine(`<span class="tp">${getPromptText()}</span> ${escapeHtml(val)}`);

    if (state === 'MENU') {
      if (trimmed === '') return;
      const cmd = trimmed.toLowerCase();

      if (cmd === '1' || cmd === 'mail') {
        state = 'MAIL_EMAIL';
        mailData = { email: '', subject: '', body: '' };
        printLine('');
        printLine('>>> Starting Interactive Email Composer', 'tk');
        printLine('Type <span class="tp">\'cancel\'</span> or <span class="tp">\'back\'</span> to return to the main menu.', 'th');
        printLine('');
        printLine('Please enter your email:');
        if (tpSpan) tpSpan.textContent = 'Sender Email> ';
      } else if (cmd === '2' || cmd === 'contact') {
        printLine('');
        printLine('--------------------------------------------------', 'th');
        printLine('  Diego Sansano Reboll — Direct Communications', 'tk');
        printLine('--------------------------------------------------', 'th');
        printLine('<span class="tk">STATUS:</span>&nbsp;&nbsp;&nbsp;&nbsp;Available for Audio &amp; Dev Opportunities');
        printLine('<span class="tk">LOCATION:</span>&nbsp;&nbsp;Valencia, Spain · Open to Remote &amp; Relocation');
        printLine('<span class="tk">EMAIL:</span>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<a class="tlink" href="mailto:dsansano070403@gmail.com" target="_blank" rel="noopener noreferrer">dsansano070403@gmail.com</a>');
        printLine('<span class="tk">PHONE:</span>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;+34 673 205 292');
        printLine('<span class="tk">LINKEDIN:</span>&nbsp;&nbsp;<a class="tlink" href="https://www.linkedin.com/in/diego-sansano-reboll/" target="_blank" rel="noopener noreferrer">linkedin.com/in/diego-sansano-reboll</a>');
        printLine('--------------------------------------------------', 'th');
        printLine('Tip: Select [1] from the menu or type \'mail\' to compose an email directly.');
        printLine('');
        resetToCommandPrompt();
      } else if (cmd === '3' || cmd === 'help') {
        printLine('');
        printLine('Available CLI commands:', 'tk');
        printLine('  <span class="tk">menu</span>       - Print the main portal menu');
        printLine('  <span class="tk">contact</span>    - View Diego\'s contact details');
        printLine('  <span class="tk">mail</span>       - Start the interactive email composer');
        printLine('  <span class="tk">clear</span>      - Clear the terminal screen history');
        printLine('  <span class="tk">help</span>       - Show this command list');
        printLine('  <span class="tk">exit</span>       - Close the contact window');
        printLine('');
        resetToCommandPrompt();
      } else if (cmd === '4' || cmd === 'exit') {
        WindowManager.close('win-contact');
      } else if (cmd === 'clear') {
        const history = document.getElementById('terminal-history');
        if (history) history.innerHTML = '';
        resetToCommandPrompt();
      } else if (cmd === 'menu') {
        printLine('');
        showMenuBanner();
        resetToCommandPrompt();
      } else {
        printLine(`'${escapeHtml(trimmed)}' is not recognized as an internal or external command.`);
        printLine('Select a menu option (1-4) or type \'help\' to see options.');
        printLine('');
      }
    } else if (state === 'MAIL_EMAIL') {
      const lower = trimmed.toLowerCase();
      if (lower === 'cancel' || lower === 'back') {
        printLine('Email composition cancelled.', 'th');
        printLine('');
        resetToCommandPrompt();
        return;
      }
      if (trimmed === '') {
        printLine('Please enter your email:');
        return;
      }
      if (!trimmed.includes('@') || trimmed.length < 5) {
        printLine('Invalid email address. Please enter a valid email (e.g. name@example.com):', 'th');
        return;
      }
      mailData.email = trimmed;
      state = 'MAIL_SUBJECT';
      printLine('Enter email subject (or press Enter for default):');
      if (tpSpan) tpSpan.textContent = 'Email Subject> ';
    } else if (state === 'MAIL_SUBJECT') {
      const lower = trimmed.toLowerCase();
      if (lower === 'cancel' || lower === 'back') {
        printLine('Email composition cancelled.', 'th');
        printLine('');
        resetToCommandPrompt();
        return;
      }
      mailData.subject = trimmed || 'Contact from DiegoOS Portfolio';
      state = 'MAIL_BODY';
      printLine('Enter your message body:');
      if (tpSpan) tpSpan.textContent = 'Message Body> ';
    } else if (state === 'MAIL_BODY') {
      const lower = trimmed.toLowerCase();
      if (lower === 'cancel' || lower === 'back') {
        printLine('Email composition cancelled.', 'th');
        printLine('');
        resetToCommandPrompt();
        return;
      }
      if (trimmed === '') {
        printLine('Message body cannot be empty. Enter your message body:');
        return;
      }
      mailData.body = trimmed;
      state = 'MAIL_CONFIRM';
      printLine('');
      printLine('--------------------------------------------------', 'th');
      printLine('  Email Preview:', 'tk');
      printLine(`  From:    ${escapeHtml(mailData.email)}`);
      printLine(`  Subject: ${escapeHtml(mailData.subject)}`);
      printLine(`  Message: ${escapeHtml(mailData.body)}`);
      printLine('--------------------------------------------------', 'th');
      printLine('Do you want to send this email? (y/n):');
      if (tpSpan) tpSpan.textContent = 'Send? (y/n)> ';
    } else if (state === 'MAIL_CONFIRM') {
      const lower = trimmed.toLowerCase();
      if (lower === 'y' || lower === 'yes') {
        state = 'MAIL_SENDING';
        if (tpSpan) tpSpan.textContent = 'Sending... ';
        printLine('');
        printLine('Connecting to SMTP server...');

        setTimeout(() => {
          printLine('Sending message data to dsansano070403@gmail.com...');

          setTimeout(() => {
            printLine('[OK] Email composed successfully!', 'tp');
            printLine('Opening local mail client to finalize sending...', 'th');

            const mailtoUrl = `mailto:dsansano070403@gmail.com?subject=${encodeURIComponent(mailData.subject)}&body=${encodeURIComponent("From: " + mailData.email + "\n\n" + mailData.body)}`;
            window.location.href = mailtoUrl;

            printLine('');
            resetToCommandPrompt();
          }, 800);
        }, 800);
      } else if (lower === 'n' || lower === 'no' || lower === 'cancel' || lower === 'back') {
        printLine('Email sending aborted. Returning to command prompt...', 'th');
        printLine('');
        resetToCommandPrompt();
      } else {
        printLine('Please type \'y\' (yes) or \'n\' (no) to proceed:');
      }
    }
  });
}

let taskbarHideTimer = null;
function initTaskbarAutoHide() {
  const taskbar = document.getElementById('taskbar');
  if (!taskbar) return;

  const showTaskbar = () => {
    taskbar.classList.remove('tb-hidden');
  };

  const hideTaskbar = () => {
    const sm = document.getElementById('start-menu');
    const startMenuOpen = sm && (sm.classList.contains('open') || sm.style.display !== 'none');
    const ctxMenuOpen = document.getElementById('_ctx') !== null;
    const balloonTip = document.getElementById('balloon-tip');
    const balloonOpen = balloonTip && balloonTip.style.display !== 'none' && !balloonTip.classList.contains('hiding');

    if (!startMenuOpen && !ctxMenuOpen && !balloonOpen) {
      taskbar.classList.add('tb-hidden');
    }
  };

  let lastMouseX = -1;
  let lastMouseY = -1;

  const resetTimer = (e) => {
    if (e && e.type === 'mousemove') {
      if (e.clientX === lastMouseX && e.clientY === lastMouseY) {
        return; // Ignore phantom mousemove events
      }
      lastMouseX = e.clientX;
      lastMouseY = e.clientY;
    }
    showTaskbar();
    if (taskbarHideTimer) clearTimeout(taskbarHideTimer);
    taskbarHideTimer = setTimeout(hideTaskbar, 5000); // Hide after 5 seconds of inactivity
  };

  const events = ['mousemove', 'mousedown', 'keydown', 'touchstart'];
  events.forEach(evt => {
    document.addEventListener(evt, resetTimer, { passive: true });
  });

  resetTimer();
}

function initMobile() {
  window.matchMedia('(max-width:720px)').addEventListener('change', () => { });
}

function initDesktopDragSelection() {
  const desktop = document.getElementById('desktop');
  const box = document.getElementById('drag-selection-box');
  if (!desktop || !box) return;

  let startX = 0, startY = 0;
  let isSelecting = false;
  let cachedIconRects = [];

  const onMouseMove = (e) => {
    const currentX = e.clientX;
    const currentY = e.clientY;
    const dx = currentX - startX;
    const dy = currentY - startY;

    if (!isSelecting) {
      if (Math.hypot(dx, dy) < 4) return;
      isSelecting = true;
      AudioEngine.setDragging(true);
      document.body.classList.add('is-dragging');
      box.style.display = 'block';
      cachedIconRects = Array.from(document.querySelectorAll('.desktop-icon')).map(icon => ({
        el: icon,
        rect: icon.getBoundingClientRect()
      }));
    }

    const left = Math.min(startX, currentX);
    const top = Math.min(startY, currentY);
    const width = Math.abs(dx);
    const height = Math.abs(dy);

    box.style.left = left + 'px';
    box.style.top = top + 'px';
    box.style.width = width + 'px';
    box.style.height = height + 'px';

    const boxRect = {
      left: left,
      top: top,
      right: left + width,
      bottom: top + height
    };

    // Fast check without layout thrashing
    for (let i = 0; i < cachedIconRects.length; i++) {
      const item = cachedIconRects[i];
      const r = item.rect;
      const isOverlapping = !(
        r.right < boxRect.left ||
        r.left > boxRect.right ||
        r.bottom < boxRect.top ||
        r.top > boxRect.bottom
      );

      if (isOverlapping) {
        item.el.classList.add('selected');
      } else {
        item.el.classList.remove('selected');
      }
    }
  };

  const onMouseUp = () => {
    box.style.display = 'none';
    document.removeEventListener('mousemove', onMouseMove);
    document.removeEventListener('mouseup', onMouseUp);
    window.removeEventListener('blur', onMouseUp);
    document.body.classList.remove('is-dragging');
    AudioEngine.setDragging(false);
    cachedIconRects = [];
    isSelecting = false;
  };

  const onMouseDown = (e) => {
    const tgt = e.target;
    const isBg = tgt.id === 'desktop' || tgt.classList.contains('wp-layer') || tgt.classList.contains('desktop-overlay') || tgt.id === 'icon-grid';
    if (!isBg || e.button !== 0) return;

    e.preventDefault();

    startX = e.clientX;
    startY = e.clientY;
    isSelecting = false;

    document.querySelectorAll('.desktop-icon').forEach(icon => icon.classList.remove('selected'));

    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
    window.addEventListener('blur', onMouseUp, { once: true });
  };

  desktop.addEventListener('mousedown', onMouseDown);
}

function initToolkitApp() {
  const btnList = document.getElementById('btn-ar-list');
  const btnInstall = document.getElementById('btn-ar-install');
  const viewList = document.getElementById('ar-view-list');
  const viewInstall = document.getElementById('ar-view-install');
  const items = document.querySelectorAll('.ar-item');

  // 1. Acordeón de la lista
  items.forEach(item => {
    const header = item.querySelector('.ar-item-header');
    const rmBtn = item.querySelector('.ar-btn-remove');
    header.addEventListener('click', () => {
      items.forEach(otherItem => { if (otherItem !== item) otherItem.classList.remove('expanded'); });
      item.classList.toggle('expanded');
      if (item.classList.contains('expanded') && window.AudioEngine) AudioEngine.playClick();
    });
    if (rmBtn) {
      rmBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        if (window.AudioEngine) AudioEngine.playClose();
        item.style.transition = "opacity 0.3s";
        item.style.opacity = "0";
        setTimeout(() => item.style.display = "none", 300);
      });
    }
  });

  // 2. Cambio de pestañas en la barra lateral
  const resetWizard = () => {
    document.getElementById('wizard-step-1').style.display = 'flex';
    document.getElementById('wizard-step-2').style.display = 'none';
    document.getElementById('wizard-bar').style.width = '0%';
    document.getElementById('wizard-next-btn').textContent = 'Next >';
    document.getElementById('wizard-next-btn').disabled = false;
  };

  btnList.addEventListener('click', () => {
    btnList.classList.add('active'); btnInstall.classList.remove('active');
    viewList.style.display = 'flex'; viewInstall.style.display = 'none';
    if (window.AudioEngine) AudioEngine.playClick();
  });

  btnInstall.addEventListener('click', () => {
    btnInstall.classList.add('active'); btnList.classList.remove('active');
    viewInstall.style.display = 'flex'; viewList.style.display = 'none';
    resetWizard(); // Se resetea cada vez que entras a esta pestaña
    if (window.AudioEngine) AudioEngine.playClick();
  });

  // 3. Lógica del Instalador
  const nextBtn = document.getElementById('wizard-next-btn');
  nextBtn.addEventListener('click', () => {
    if (nextBtn.textContent === "Finish") {
      btnList.click(); // Vuelve a la lista al terminar
      return;
    }
    document.getElementById('wizard-step-1').style.display = 'none';
    document.getElementById('wizard-step-2').style.display = 'flex';
    nextBtn.disabled = true;

    let progress = 0;
    const files = [
      "Initializing...",
      "Extracting: fmod_studio_api.dll",
      "Linking: wwise_audio_engine.lib",
      "Compiling: Unity C# Audio Framework",
      "Configuring: Unreal MetaSounds & Blueprints",
      "Loading: REAPER DAW Scripts & Automation",
      "Calibrating: Adobe Audition Spectral Engine",
      "Authoring: FabFilter & iZotope RX Presets",
      "Syncing: Git LFS Audio Repository",
      "Compiling: Overleaf LaTeX GDD Documents",
      "Finalizing Setup..."
    ];
    const bar = document.getElementById('wizard-bar');
    const statusTxt = document.getElementById('wizard-status-txt');

    const interval = setInterval(() => {
      progress += Math.floor(Math.random() * 8) + 4;
      if (progress >= 100) {
        progress = 100;
        clearInterval(interval);
        statusTxt.textContent = "Installation Complete! All audio tools successfully deployed.";
        nextBtn.textContent = "Finish";
        nextBtn.disabled = false;
        if (window.AudioEngine) AudioEngine.playBootChime();

        // --- NUEVA LÓGICA DE RESTAURACIÓN TOTAL ---
        // Recupera todas las herramientas que hayan sido borradas con "Remove"
        items.forEach(item => {
          item.style.display = "block";
          item.style.opacity = "1";
          item.classList.remove('expanded'); // Las resetea cerradas
        });
      }
      bar.style.width = progress + '%';
      const fileIndex = Math.floor((progress / 100) * files.length);
      if (files[fileIndex]) statusTxt.textContent = files[fileIndex];
    }, 150);
  });
}

/* ──────────────────────────────────────────────────────────────
   13. INIT
   ────────────────────────────────────────────────────────────── */

function initDiegoSteam() {
  const gameListEl = document.getElementById('st-game-list');
  const mainViewEl = document.getElementById('st-main-view');
  if (!gameListEl || !mainViewEl) return;

  const playableGames = PROJECTS.filter(p => p.gameUrl && p.gameUrl !== '');
  gameListEl.innerHTML = '<div class="st-sidebar-title">GAMES (' + playableGames.length + ')</div>';

  playableGames.forEach((game, idx) => {
    const row = document.createElement('div');
    row.className = 'st-sidebar-row';
    row.textContent = game.title;

    row.addEventListener('click', () => {
      document.querySelectorAll('.st-sidebar-row').forEach(r => r.classList.remove('active'));
      row.classList.add('active');
      if (window.AudioEngine) AudioEngine.playClick();

      mainViewEl.innerHTML = `
        <div class="st-game-hero" style="background-image: linear-gradient(to right, #1b2838 0%, #1b2838 35%, rgba(27,40,56,0.85) 55%, transparent 80%), linear-gradient(180deg, transparent 70%, #212c3d 100%), url('${escapeHtml(game.cover)}');">
          <div class="st-hero-details">
            <h2 class="st-game-title">${escapeHtml(game.title)}</h2>
            <div class="st-game-dev">Developer: Diego Sansano Reboll</div>
          </div>
        </div>
        <div class="st-play-bar">
          <button class="st-play-btn" id="st-launch-game">PLAY</button>
          <div class="st-stats-box">
            <div class="st-stat"><small>LAST PLAYED</small><span>Today</span></div>
            <div class="st-stat"><small>PLAY TIME</small><span>124 hours</span></div>
            <div class="st-stat"><small>ACHIEVEMENTS</small><span>100%</span></div>
          </div>
        </div>
        <div class="st-game-desc-panel">
          <h3>About the Game</h3>
          <p>${escapeHtml(game.desc)}</p>
          <p style="margin-top:10px; font-size:11px; color:#8f98a0;">Find more game builds and audio releases at <a href="https://dsansano7.itch.io/" target="_blank" rel="noopener noreferrer" style="color:#66c0f4; text-decoration:underline;">dsansano7.itch.io ↗</a></p>
        </div>
      `;

      document.getElementById('st-launch-game').addEventListener('click', () => {
        const body = document.getElementById('game-runner-body');
        const titleEl = document.getElementById('game-runner-title');
        if (body) {
          body.innerHTML = `<iframe src="${encodeURI(game.gameUrl)}" width="100%" height="100%" style="border:none;display:block;" title="${escapeHtml(game.title)} Demo" sandbox="allow-scripts allow-same-origin allow-pointer-lock allow-forms" allow="autoplay; fullscreen"></iframe>`;
        }
        if (titleEl) titleEl.textContent = `${game.title} — DiegoOS Executable Engine`;
        WindowManager.open('win-game-runner');
      });
    });

    gameListEl.appendChild(row);
    if(idx === 0) row.click();
  });

  const itchRow = document.createElement('div');
  itchRow.className = 'st-sidebar-row st-sidebar-itch';
  itchRow.innerHTML = 'More on Itch.io ↗';
  itchRow.title = "Visit Diego's Itch.io Profile";
  itchRow.addEventListener('click', () => {
    window.open('https://dsansano7.itch.io/', '_blank', 'noopener,noreferrer');
    if (window.AudioEngine) AudioEngine.playClick();
  });
  gameListEl.appendChild(itchRow);
}

// 1. Función constructora de Alertas del Sistema (Module-Level & Sanitized)
function showOSAlert(title, message) {
  if (window.AudioEngine) AudioEngine.playOpen();
  
  const safeTitle = escapeHtml(title);
  const safeMessage = escapeHtml(message).replace(/\n/g, '<br>');

  const overlay = document.createElement('div');
  overlay.className = 'os-alert-overlay';
  overlay.innerHTML = `
    <div class="os-alert-box">
      <div class="win-titlebar">
        <div class="win-title-left">
          <span class="win-title-icon">ℹ️</span>
          <span class="win-title-text">${safeTitle}</span>
        </div>
        <div class="win-caption-btns">
          <button class="cap-btn cls-btn" aria-label="Close alert">✕</button>
        </div>
      </div>
      <div class="os-alert-body">
        <div class="os-alert-icon">💡</div>
        <div class="os-alert-text">${safeMessage}</div>
      </div>
      <div class="os-alert-footer">
        <button class="os-alert-btn">OK</button>
      </div>
    </div>
  `;
  
  document.body.appendChild(overlay);

  const closeAlert = () => {
    if (window.AudioEngine) AudioEngine.playClose();
    overlay.style.opacity = '0';
    setTimeout(() => overlay.remove(), 150);
  };

  overlay.querySelector('.cls-btn')?.addEventListener('click', closeAlert);
  overlay.querySelector('.os-alert-btn')?.addEventListener('click', closeAlert);
}

function showOSPrompt(title, message, defaultValue = '', onConfirm = null) {
  if (window.AudioEngine) AudioEngine.playOpen();

  const safeTitle = escapeHtml(title);
  const safeMessage = escapeHtml(message).replace(/\n/g, '<br>');

  const overlay = document.createElement('div');
  overlay.className = 'os-alert-overlay';
  overlay.innerHTML = `
    <div class="os-alert-box">
      <div class="win-titlebar">
        <div class="win-title-left">
          <span class="win-title-icon">💾</span>
          <span class="win-title-text">${safeTitle}</span>
        </div>
        <div class="win-caption-btns">
          <button class="cap-btn cls-btn" aria-label="Close dialog">✕</button>
        </div>
      </div>
      <div class="os-alert-body" style="flex-direction:column; gap:8px;">
        <div style="display:flex; gap:14px; align-items:center;">
          <div class="os-alert-icon">📝</div>
          <div class="os-alert-text">${safeMessage}</div>
        </div>
        <input type="text" class="os-prompt-input" value="${escapeHtml(defaultValue)}" placeholder="Document name..." />
      </div>
      <div class="os-alert-footer" style="gap:8px;">
        <button class="os-alert-btn btn-ok">OK</button>
        <button class="os-alert-btn btn-cancel">Cancel</button>
      </div>
    </div>
  `;

  document.body.appendChild(overlay);

  const input = overlay.querySelector('.os-prompt-input');
  setTimeout(() => {
    input?.focus();
    input?.select();
  }, 50);

  const closePrompt = () => {
    if (window.AudioEngine) AudioEngine.playClose();
    overlay.style.opacity = '0';
    setTimeout(() => overlay.remove(), 150);
  };

  const handleConfirm = () => {
    const val = input.value.trim();
    if (val && onConfirm) {
      onConfirm(val);
    }
    closePrompt();
  };

  overlay.querySelector('.cls-btn')?.addEventListener('click', closePrompt);
  overlay.querySelector('.btn-cancel')?.addEventListener('click', closePrompt);
  overlay.querySelector('.btn-ok')?.addEventListener('click', handleConfirm);
  input.addEventListener('keydown', e => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleConfirm();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      closePrompt();
    }
  });
}

// 2. Toolbar interactiva de Adobe Reader (Zoom In, Zoom Out, Print, Save)
let pdfZoomLevel = 100;
function initPdfViewerToolbar() {
  const zoomInBtn = document.getElementById('pdf-btn-zoom-in');
  const zoomOutBtn = document.getElementById('pdf-btn-zoom-out');
  const zoomLabel = document.querySelector('.pdf-zoom-level');
  const printBtn = document.getElementById('pdf-btn-print');
  const saveBtn = document.getElementById('pdf-btn-save');
  const sheet = document.getElementById('pdf-page-sheet');

  const updateZoom = (lvl) => {
    pdfZoomLevel = Math.max(70, Math.min(160, lvl));
    if (zoomLabel) zoomLabel.textContent = pdfZoomLevel + '%';
    if (sheet) sheet.style.transform = `scale(${pdfZoomLevel / 100})`;
    if (window.AudioEngine) AudioEngine.playClick();
  };

  if (zoomInBtn) zoomInBtn.addEventListener('click', () => updateZoom(pdfZoomLevel + 15));
  if (zoomOutBtn) zoomOutBtn.addEventListener('click', () => updateZoom(pdfZoomLevel - 15));
  if (printBtn) {
    printBtn.addEventListener('click', () => {
      if (window.AudioEngine) AudioEngine.playClick();
      window.print();
    });
  }
  if (saveBtn) {
    saveBtn.addEventListener('click', () => {
      if (window.AudioEngine) AudioEngine.playClick();
      const title = sheet ? (sheet.querySelector('.pdf-sheet-title')?.textContent || 'Project_Details') : 'Project_Details';
      const textContent = sheet ? sheet.innerText : 'DiegoOS Audio Project Details';
      const blob = new Blob([textContent], { type: 'text/plain;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${title.replace(/\s+/g, '_')}_Specifications.txt`;
      document.body.appendChild(a);
      a.click();
      setTimeout(() => { a.remove(); URL.revokeObjectURL(url); }, 500);
    });
  }
}

// 3. Buscador interactivo de DiegoBook
function initDiegoBookSearch() {
  const searchInp = document.getElementById('fb-search-input');
  if (!searchInp) return;
  searchInp.addEventListener('input', () => {
    const q = searchInp.value.trim().toLowerCase();
    const posts = document.querySelectorAll('#about-body .fb-post');
    posts.forEach(post => {
      const text = post.textContent.toLowerCase();
      post.style.display = (!q || text.includes(q)) ? 'block' : 'none';
    });
  });
}

// 4. Ordenación interactiva de Programas en Toolkit
function initToolkitSorting() {
  const select = document.getElementById('ar-sort-select');
  const list = document.getElementById('ar-list');
  if (!select || !list) return;

  select.addEventListener('change', () => {
    const val = select.value;
    const items = Array.from(list.querySelectorAll('.ar-item'));

    items.sort((a, b) => {
      if (val === 'name') {
        const nameA = a.querySelector('.ar-item-title')?.textContent.trim() || '';
        const nameB = b.querySelector('.ar-item-title')?.textContent.trim() || '';
        return nameA.localeCompare(nameB);
      } else {
        const parseSize = el => {
          const str = el.querySelector('.ar-item-size strong')?.textContent.trim() || '0 MB';
          const num = parseFloat(str) || 0;
          return str.includes('GB') ? num * 1024 : num;
        };
        return parseSize(b) - parseSize(a);
      }
    });

    items.forEach(item => list.appendChild(item));
    if (window.AudioEngine) AudioEngine.playClick();
  });
}

// 5. Dynamic Document Engine & Notepad Storage
const STORAGE_NOTEPAD_DOCS_KEY = 'diegoos_notepad_documents_v1';
const STORAGE_NOTEPAD_ACTIVE_KEY = 'diegoos_notepad_active_doc_id';

let activeDocumentId = null;

function getAllDocumentRecords() {
  try {
    const raw = localStorage.getItem(STORAGE_NOTEPAD_DOCS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (e) {}
  // Default first document if empty
  const defaultDoc = {
    id: 'doc_' + Date.now(),
    name: 'Nuevo Documento.txt',
    content: 'Welcome to DiegoOS Notepad!\n\nYou can write your audio notes, session logs, or project cue reminders here.\nFiles auto-save locally to your browser and you can create new documents on the Desktop anytime.\n\nEnjoy exploring!',
    updatedAt: Date.now(),
    x: 155,
    y: 20
  };
  saveAllDocumentRecords([defaultDoc]);
  return [defaultDoc];
}

function saveAllDocumentRecords(docs) {
  try {
    localStorage.setItem(STORAGE_NOTEPAD_DOCS_KEY, JSON.stringify(docs));
  } catch (e) {}
}

function getDocumentRecord(id) {
  const docs = getAllDocumentRecords();
  return docs.find(d => d.id === id) || null;
}

function saveDocumentRecord(doc) {
  const docs = getAllDocumentRecords();
  const idx = docs.findIndex(d => d.id === doc.id);
  if (idx !== -1) {
    docs[idx] = { ...docs[idx], ...doc, updatedAt: Date.now() };
  } else {
    docs.push({ ...doc, updatedAt: Date.now() });
  }
  saveAllDocumentRecords(docs);
}

function deleteDocumentRecord(id) {
  const docs = getAllDocumentRecords().filter(d => d.id !== id);
  saveAllDocumentRecords(docs);
  if (activeDocumentId === id) {
    if (docs.length > 0) {
      openDocumentInNotepad(docs[0].id);
    } else {
      activeDocumentId = null;
      const ta = document.getElementById('notepad-textarea');
      if (ta) ta.value = '';
      updateNotepadUI(null);
    }
  }
}

function createNewDocumentRecord(initialName = null, initialContent = '') {
  const docs = getAllDocumentRecords();
  let name = initialName;
  if (!name) {
    let count = 1;
    name = 'Nuevo Documento.txt';
    while (docs.some(d => d.name.toLowerCase() === name.toLowerCase())) {
      count++;
      name = `Nuevo Documento (${count}).txt`;
    }
  }
  const newDoc = {
    id: 'doc_' + Date.now() + '_' + Math.floor(Math.random() * 1000),
    name: name,
    content: initialContent,
    updatedAt: Date.now(),
    x: null,
    y: null
  };
  docs.push(newDoc);
  saveAllDocumentRecords(docs);
  return newDoc;
}

function renameTextDocument(docId, newName) {
  const doc = getDocumentRecord(docId);
  if (!doc) return;
  doc.name = newName;
  saveDocumentRecord(doc);
  if (activeDocumentId === docId) {
    updateNotepadUI(doc);
  }
}

function updateNotepadUI(doc) {
  const titleText = document.getElementById('notepad-title-text');
  const fileInfo = document.getElementById('notepad-file-info');
  const charCount = document.getElementById('notepad-char-count');
  const ta = document.getElementById('notepad-textarea');

  const docName = doc ? doc.name : 'Untitled.txt';
  if (titleText) titleText.textContent = `Notepad - ${docName}`;
  if (fileInfo) fileInfo.textContent = `Documento actual: ${docName}`;
  if (charCount && ta) {
    const chars = ta.value.length;
    const lines = ta.value.split('\n').length;
    charCount.textContent = `${lines} lines, ${chars} characters`;
  }
}

function openDocumentInNotepad(docId) {
  const doc = getDocumentRecord(docId);
  if (!doc) return;

  activeDocumentId = doc.id;
  try {
    localStorage.setItem(STORAGE_NOTEPAD_ACTIVE_KEY, activeDocumentId);
  } catch (e) {}

  const ta = document.getElementById('notepad-textarea');
  if (ta) {
    ta.value = doc.content || '';
  }
  updateNotepadUI(doc);
  WindowManager.open('win-notepad');
}

function initNotepadStorage() {
  const ta = document.getElementById('notepad-textarea');
  const saveStatus = document.getElementById('notepad-status-save');
  const charCount = document.getElementById('notepad-char-count');
  const newBtn = document.getElementById('notepad-menu-new');
  const saveBtn = document.getElementById('notepad-menu-save');
  const downloadBtn = document.getElementById('notepad-menu-download');

  // 1. Initialise / Restore documents on desktop
  const docs = getAllDocumentRecords();
  const grid = document.getElementById('icon-grid');
  
  // Render desktop icons for existing persistent documents
  if (grid) {
    docs.forEach(doc => {
      // Check if already rendered
      const exists = grid.querySelector(`.desktop-icon[data-doc-id="${doc.id}"]`);
      if (!exists) {
        createNewTextFile(doc.x || 155, doc.y || 20, doc);
      }
    });
  }

  // Determine active document
  let activeId = null;
  try {
    activeId = localStorage.getItem(STORAGE_NOTEPAD_ACTIVE_KEY);
  } catch (e) {}

  let activeDoc = activeId ? getDocumentRecord(activeId) : null;
  if (!activeDoc && docs.length > 0) {
    activeDoc = docs[0];
  }

  if (activeDoc) {
    activeDocumentId = activeDoc.id;
    if (ta) ta.value = activeDoc.content || '';
    updateNotepadUI(activeDoc);
  }

  // Auto-save on typing with subtle status feedback
  let saveTimer = null;
  if (ta) {
    ta.addEventListener('input', () => {
      if (saveStatus) {
        saveStatus.textContent = 'Saving...';
        saveStatus.style.color = '#e67e22';
      }
      if (charCount) {
        const chars = ta.value.length;
        const lines = ta.value.split('\n').length;
        charCount.textContent = `${lines} lines, ${chars} characters`;
      }

      clearTimeout(saveTimer);
      saveTimer = setTimeout(() => {
        if (!activeDocumentId) {
          const created = createNewDocumentRecord(null, ta.value);
          activeDocumentId = created.id;
          createNewTextFile(155, 20, created);
        } else {
          const current = getDocumentRecord(activeDocumentId);
          if (current) {
            current.content = ta.value;
            saveDocumentRecord(current);
          }
        }
        if (saveStatus) {
          saveStatus.textContent = 'Saved';
          saveStatus.style.color = '#27ae60';
        }
      }, 400);
    });
  }

  // Menu: New Document
  if (newBtn) {
    newBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      showOSPrompt('Nuevo Documento de Texto', 'Escribe el nombre para el nuevo archivo de texto:', 'Nuevo Documento.txt', (newName) => {
        if (!newName.toLowerCase().endsWith('.txt')) newName += '.txt';
        const doc = createNewDocumentRecord(newName, '');
        createNewTextFile(155, 20, doc);
        openDocumentInNotepad(doc.id);
        if (window.AudioEngine) AudioEngine.playClick();
      });
    });
  }

  // Menu: Save Document (Force instant save / Rename & Save)
  if (saveBtn) {
    saveBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      if (!activeDocumentId) {
        showOSPrompt('Guardar Documento', 'Introduce el nombre para guardar el archivo en el escritorio:', 'Nuevo Documento.txt', (newName) => {
          if (!newName.toLowerCase().endsWith('.txt')) newName += '.txt';
          const doc = createNewDocumentRecord(newName, ta ? ta.value : '');
          createNewTextFile(155, 20, doc);
          openDocumentInNotepad(doc.id);
        });
      } else {
        const doc = getDocumentRecord(activeDocumentId);
        if (doc && ta) {
          doc.content = ta.value;
          saveDocumentRecord(doc);
          if (saveStatus) {
            saveStatus.textContent = 'Saved!';
            saveStatus.style.color = '#27ae60';
          }
          if (window.AudioEngine) AudioEngine.playClick();
          showOSAlert('Notepad', `Documento "${doc.name}" guardado correctamente en el sistema.`);
        }
      }
    });
  }

  // Menu: Export .txt to actual user's hard drive
  if (downloadBtn) {
    downloadBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      const doc = activeDocumentId ? getDocumentRecord(activeDocumentId) : null;
      const fileName = doc ? doc.name : 'Document.txt';
      const text = ta ? ta.value : '';
      const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      setTimeout(() => { a.remove(); URL.revokeObjectURL(url); }, 500);
      if (window.AudioEngine) AudioEngine.playClick();
    });
  }
}

document.addEventListener('DOMContentLoaded', () => {
  // Restore persisted settings
  try {
    const savedTheme = localStorage.getItem('diegoos_darkmode');
    if (savedTheme === '1') setDarkModeState(true);
    const savedVol = localStorage.getItem('diegoos_volume');
    if (savedVol != null) {
      const p = parseInt(savedVol, 10);
      if (!isNaN(p)) setVolumeState(p);
    }
  } catch (e) {}

  // Register static windows
  ['win-about','win-toolkit','win-work','win-contact','win-properties','win-notepad','win-demoreel','win-game-runner','win-pdf-viewer','win-media-player','win-diegocode'].forEach(id => {
    WindowManager.register(id);
  });
  WindowManager.register('win-steam', { icon: '🎮', label: 'DiegoSteam' });

  // Wire caption buttons for static windows
  wireCapBtns();

  // Init XP file explorer for My Work
  initFileExplorer();

  // Init all subsystems
  initStartMenu();
  initSearch();
  initSystemTray();
  initPropertiesPanel();
  initDesktopIcons();
  initDesktopDragSelection();
  initTerminalInteraction();
  initMobile();
  initAudioUnlocker();
  initToolkitApp();
  initDiegoSteam();
  initDiegoReel();
  initDiegoCode();
  initPdfViewerToolbar();
  initDiegoBookSearch();
  initToolkitSorting();
  initNotepadStorage();

  // Wire Facebook message link
  const fbMsgLink = document.getElementById('fb-send-message-link');
  if (fbMsgLink) {
    fbMsgLink.addEventListener('click', () => {
      WindowManager.open('win-contact');
      if (window.AudioEngine) AudioEngine.playOpen();
    });
  }

  // Global Help System for DiegoOS Windows (Bilingual English / Spanish)
  const helpMap = {
    'win-about': "🔹 DiegoBook (About Me):\n• EN: 2008 Facebook parody profile. Explore the wall posts to read Diego's bio, conservatory saxophone background, game audio dev milestones, and tech skills.\n• ES: Parodia de Facebook (versión 2008). Explora el muro para leer la biografía de Diego, su trayectoria musical y logros en audio de videojuegos.",
    'win-toolkit': "🔹 Add or Remove Programs (Toolkit):\n• EN: Software & middleware stack inspector. Click any program row to expand mastery levels and technical details. If you remove any tool, restore them all anytime via 'Add New Programs'.\n• ES: Panel de software y middleware. Haz clic en cualquier programa para ver el nivel de dominio. Si ocultas alguno, restáuralos en 'Add New Programs'.",
    'win-work': "🔹 File Explorer (My Work):\n• EN: Classic Windows XP Explorer. Double-click project folders to browse sound redesigns, implementation demos, and game builds. Inside each project, open technical PDFs and playable demo files.\n• ES: Explorador clásico de Windows XP. Haz doble clic en las carpetas para abrir proyectos de sonido, PDFs técnicos y ejecutables interactivos.",
    'win-pdf-viewer': "🔹 Adobe Reader (Project Details):\n• EN: Technical documentation viewer. Review clean editorial overviews, middleware routing (FMOD/Wwise/REAPER), audio architecture, and game engine tech stacks.\n• ES: Visor de documentación técnica. Consulta resúmenes editoriales, arquitectura de audio y especificaciones de middleware.",
    'win-notepad': "🔹 Notepad (Text Editor):\n• EN: Fully functional scratchpad. Write quick session notes, code snippets, or audio cue reminders. Content auto-saves to your local browser storage.\n• ES: Bloc de notas completamente funcional. Escribe recordatorios o notas de audio. Se guarda automáticamente en el navegador.",
    'win-properties': "🔹 Control Panel (Display & Audio Properties):\n• EN: Global system settings. Adjust master system volume and toggle between Day Mode (Bliss sunshine) and Night Mode (Studio neon).\n• ES: Configuración general. Ajusta el volumen maestro del sistema y alterna entre Modo Día y Modo Noche.",
    'win-demoreel': "🔹 DiegoTube (Audio Demoreels):\n• EN: Interactive YouTube-style video hub. Filter reels by category (Sound Redesign, Audio Implementation, OST) and click any card to watch breakdowns.\n• ES: Hub interactivo de vídeo estilo YouTube. Filtra reels por categoría y haz clic en cualquier miniatura para reproducir demostraciones.",
    'win-steam': "🔹 DiegoSteam (Games Library):\n• EN: Interactive games library. Select any title in your library and press PLAY to launch live WebGL game builds right inside DiegoOS.\n• ES: Biblioteca de juegos interactiva. Selecciona cualquier título y pulsa PLAY para jugar builds WebGL directamente en DiegoOS.",
    'win-diegocode': "🔹 DiegoCode 2008 (Technical Audio IDE):\n• EN: Interactive script workbench for Technical Sound Design. Explore Wwise WAAPI automation in Python, FMOD Studio JS batch builders, and Unity C# audio components. Click '▶ Run Tool' to simulate live execution.\n• ES: Entorno técnico de desarrollo para Audio en Videojuegos. Explora scripts de Python para Wwise WAAPI, herramientas de FMOD y componentes de Unity. Pulsa '▶ Run Tool' para simular su ejecución."
  };

  // Modificación del evento de Ayuda (reemplazando alert nativo)
  document.querySelectorAll('.menu-item').forEach(item => {
    if (item.textContent.trim() === 'Help') {
      const newClone = item.cloneNode(true);
      item.parentNode.replaceChild(newClone, item);
      
      newClone.addEventListener('click', (e) => {
        e.stopPropagation();
        const parentWin = newClone.closest('.os-window');
        if (parentWin) {
          const winId = parentWin.id;
          const helpText = helpMap[winId] || "Asistente de Ayuda de DiegoOS: Utiliza los controles de la ventana para explorar el portfolio interactivo.";
          showOSAlert('DiegoOS Help', helpText);
        }
      });
    }
  });

  // Start clock immediately so it doesn't show default 12:00 placeholder
  startClock();

  // Boot
  runBoot();
});

/* ══════════════════════════════════════════════════════════════
   DIEGOREEL — Dynamic video grid & YouTube-style watch view
   ══════════════════════════════════════════════════════════════ */
function initDiegoReel() {
  const mainEl    = document.querySelector('.dt-main');
  const sidebarEl = document.getElementById('dr-sidebar');
  const searchInp = document.getElementById('dr-search');
  const searchBtn = document.getElementById('dr-search-btn');
  const navItems  = document.querySelectorAll('#dr-sidebar .dt-nav-item');
  const urlGoBtn  = document.querySelector('.dt-url-go');
  const urlInput  = document.querySelector('.dt-url-input');
  if (!mainEl) return;

  let activeCat = 'All';

  function getTechSpecs(p) {
    switch (p.id) {
      case 1: // The Last of Us
        return `
          <li><strong>DAW &amp; Spatial Routing:</strong> Fully tracked, edited, and mixed natively in Cockos REAPER utilizing custom surround buses and VST sub-group processing chains.</li>
          <li><strong>Foley &amp; Texture Artistry:</strong> Multi-layered acoustic Foley including tactical cloth rustle, weapon manipulation, breathing dynamics, and footstep surfaces (cracked concrete, shattered glass, dirt, and timber).</li>
          <li><strong>Environmental Soundscaping:</strong> Spatialized acoustic transition when crossing breached boundaries into reverberant corridors, combining high-frequency low-pass dampening with subtle low-end resonance.</li>
          <li><strong>Dynamic Mixing:</strong> Calibrated cinematic loudness with prioritize-first sidechain ducking between dialogue intelligibility, environmental tension, and concussive impacts.</li>
        `;
      case 2: // Party Drinker
        return `
          <li><strong>Engine &amp; Middleware:</strong> Developed in Unity with complete FMOD Studio real-time middleware soundbank architecture.</li>
          <li><strong>3D Spatialization:</strong> Real-time distance attenuation curves, directional panning, and early reflection filters for chaotic partygoers and background club acoustics.</li>
          <li><strong>Dynamic Adaptive Music:</strong> State-machine parameter transitions in FMOD responding dynamically to the player's intoxication gauge and mini-game tempo.</li>
          <li><strong>Playable Experience:</strong> Instant WebGL interactive build available to launch right now in DiegoSteam!</li>
        `;
      case 3: // Cooking Fever
        return `
          <li><strong>UI/UX Sonic Feedback:</strong> Tactile micro-sound design engineered for drag-and-drop mechanics, frying pan sizzle loops, timer alarms, and dopamine-rewarding coin telemetry.</li>
          <li><strong>Asset Optimization:</strong> Lightweight, low-latency audio compression optimized for fast mobile/web asset memory budgets without loss of fidelity.</li>
          <li><strong>Sound Synthesis:</strong> Blended acoustic recordings with synthetic transient layers sculpted in REAPER with FabFilter Pro-Q &amp; Pro-C2.</li>
        `;
      case 4: // Unwraptal
        return `
          <li><strong>Engine &amp; Middleware:</strong> Unity engine integrated with a comprehensive FMOD Studio dynamic event hierarchy.</li>
          <li><strong>Adaptive Soundtrack:</strong> Seamless horizontal re-sequencing and vertical layering across Main Menu, HUB zone, and fast-paced countdown minigames.</li>
          <li><strong>Whimsical SFX Palette:</strong> Punchy, animated cartoon audio assets frame-locked to character state machines, slapstick collisions, and victory fanfare.</li>
          <li><strong>Playable Experience:</strong> Instant WebGL interactive build available to launch right now in DiegoSteam!</li>
        `;
      case 5: // Just 5 Minutes
        return `
          <li><strong>Engine &amp; Middleware:</strong> Developed in Unity with an FMOD Studio dynamic event architecture tailored for 2D idle game progression.</li>
          <li><strong>Anti-Fatigue Sound Design:</strong> Soft transients, warm equalization, and acoustic micro-variations across recurring click and reward triggers to prevent auditory fatigue during long sessions.</li>
          <li><strong>Adaptive Background Music:</strong> Multi-layered ambient soundtrack with parameter-driven intensity and stem transitions that keep the repetitive soundscape soothing and engaging.</li>
          <li><strong>Playable Experience:</strong> Instant WebGL interactive build available to launch right now in DiegoSteam!</li>
        `;
      default:
        return p.tags.map(t => `<li><strong>${escapeHtml(t)}:</strong> Specialized implementation and sound design.</li>`).join('');
    }
  }

  function openWatchPage(proj) {
    if (window.AudioEngine) AudioEngine.playOpen();

    if (urlInput) {
      const slug = proj.title.toLowerCase().replace(/[^a-z0-9]+/g, '-');
      urlInput.textContent = `diegoreel.com/watch?v=${slug}`;
    }

    if (sidebarEl) {
      sidebarEl.classList.add('dt-sidebar-hidden');
      sidebarEl.style.display = 'none';
    }

    const relatedReels = PROJECTS.filter(item => item.id !== proj.id && item.videoUrl);

    mainEl.innerHTML = `
      <div class="dt-watch-container">
        <!-- Top Navigation Bar -->
        <div class="dt-watch-topbar">
          <button class="dt-back-btn" id="dr-back-btn" title="Back to All Reels">
            &#8592; Back to All Reels
          </button>
          <div class="dt-watch-breadcrumbs">
            <span>DiegoReel</span> &gt; <span>${escapeHtml(proj.category)}</span> &gt; <strong>${escapeHtml(proj.title)}</strong>
          </div>
        </div>

        <div class="dt-watch-layout">
          <!-- Left Column: Video Player + Details -->
          <div class="dt-watch-player-col">
            <!-- Video Player -->
            <div class="dt-player-frame">
              <video id="dr-player-video" src="${escapeHtml(proj.videoUrl)}" poster="${escapeHtml(proj.cover)}" controls autoplay playsinline class="dt-video-player"></video>
            </div>

            <!-- Title & Metadata -->
            <div class="dt-watch-info-bar">
              <h1 class="dt-watch-title">${escapeHtml(proj.title)} &mdash; ${escapeHtml(proj.category)}</h1>
              <div class="dt-watch-meta-line">
                <span>From: <strong>Diego Sansano Reboll</strong></span>
                <span class="dt-meta-sep">|</span>
                <span>Category: <strong>${escapeHtml(proj.category)}</strong></span>
                <span class="dt-meta-sep">|</span>
                <span>Role: Sound Designer &amp; Game Audio Developer</span>
              </div>
            </div>

            <!-- Play in DiegoSteam Banner (if gameUrl exists) -->
            ${proj.gameUrl ? `
            <div class="dt-steam-bar">
              <div class="dt-steam-bar-text">
                <strong>Playable Interactive Build:</strong> Experience the gameplay and real-time audio implementation directly inside DiegoSteam.
              </div>
              <button class="dt-steam-launch-btn" id="dr-launch-steam-btn" data-title="${escapeHtml(proj.title)}">
                Launch in DiegoSteam
              </button>
            </div>
            ` : ''}

            <!-- Description Box (Clean retro YouTube 2008 / classic web layout) -->
            <div class="dt-description-box">
              <div class="dt-desc-section">
                <h3 class="dt-desc-heading">Project Overview</h3>
                <p class="dt-desc-text">${escapeHtml(proj.desc)}</p>
              </div>

              <div class="dt-desc-section">
                <h3 class="dt-desc-heading">Audio Technology &amp; Middleware</h3>
                <p class="dt-desc-text dt-desc-tags">${escapeHtml(proj.tags.join(' · '))}</p>
              </div>

              <div class="dt-desc-section">
                <h3 class="dt-desc-heading">Technical Sound Design &amp; Implementation</h3>
                <ul class="dt-specs-list">
                  ${getTechSpecs(proj)}
                </ul>
              </div>
            </div>
          </div>

          <!-- Right Column: Up Next / Related Reels -->
          <div class="dt-watch-sidebar-col">
            <div class="dt-upnext-title">Related Reels</div>
            <div class="dt-upnext-list">
              ${relatedReels.map(rel => {
                const dur = rel.category === 'Sound Redesign' ? '02:45' : '04:12';
                return `
                  <div class="dt-related-item" data-id="${rel.id}">
                    <div class="dt-related-thumb" style="background-image:url('${escapeHtml(rel.cover)}');">
                      <span class="dt-related-dur">${dur}</span>
                    </div>
                    <div class="dt-related-info">
                      <div class="dt-related-title">${escapeHtml(rel.title)}</div>
                      <div class="dt-related-author">Diego Sansano Reboll</div>
                      <div class="dt-related-cat">${escapeHtml(rel.category)}</div>
                    </div>
                  </div>
                `;
              }).join('')}
            </div>
          </div>
        </div>
      </div>
    `;

    // Immediately reset scroll positions to top
    mainEl.scrollTop = 0;
    const dtBody = document.querySelector('.dt-body');
    if (dtBody) dtBody.scrollTop = 0;
    const winDemoreel = document.getElementById('win-demoreel');
    if (winDemoreel) {
      const winBody = winDemoreel.querySelector('.win-body');
      if (winBody) winBody.scrollTop = 0;
    }

    // Scroll directly to video element at top
    requestAnimationFrame(() => {
      mainEl.scrollTop = 0;
      const vidEl = document.getElementById('dr-player-video');
      if (vidEl) {
        vidEl.scrollIntoView({ behavior: 'auto', block: 'start' });
      }
    });

    // Wire Back Button
    const backBtn = document.getElementById('dr-back-btn');
    if (backBtn) {
      backBtn.addEventListener('click', () => {
        const vid = document.getElementById('dr-player-video');
        if (vid) { vid.pause(); vid.src = ''; }
        if (sidebarEl) {
          sidebarEl.classList.remove('dt-sidebar-hidden');
          sidebarEl.style.display = '';
        }
        if (urlInput) urlInput.textContent = 'diegoreel.com/channel/diegosansano';
        renderReels(activeCat, '');
        mainEl.scrollTop = 0;
        if (window.AudioEngine) AudioEngine.playClick();
      });
    }

    // Wire DiegoSteam Launch Button
    const steamBtn = document.getElementById('dr-launch-steam-btn');
    if (steamBtn) {
      steamBtn.addEventListener('click', () => {
        const vid = document.getElementById('dr-player-video');
        if (vid) vid.pause();
        WindowManager.open('win-steam');
        if (window.AudioEngine) AudioEngine.playOpen();
        const steamRows = document.querySelectorAll('.st-sidebar-row');
        steamRows.forEach(row => {
          if (row.textContent.includes(proj.title)) {
            row.click();
          }
        });
      });
    }

    // Wire Related Reel Cards
    mainEl.querySelectorAll('.dt-related-item').forEach(relCard => {
      relCard.addEventListener('click', () => {
        const targetId = parseInt(relCard.dataset.id, 10);
        const targetProj = PROJECTS.find(p => p.id === targetId);
        if (targetProj) {
          const vid = document.getElementById('dr-player-video');
          if (vid) { vid.pause(); vid.src = ''; }
          openWatchPage(targetProj);
        }
      });
    });
  }

  function renderReels(filterCat, query) {
    filterCat = filterCat || activeCat;
    query     = query     || '';

    if (sidebarEl) {
      sidebarEl.classList.remove('dt-sidebar-hidden');
      sidebarEl.style.display = '';
    }
    if (urlInput) urlInput.textContent = 'diegoreel.com/channel/diegosansano';
    mainEl.scrollTop = 0;

    mainEl.innerHTML = `
      <div class="dt-section-title" id="dr-section-title">${filterCat === 'All' ? 'All' : filterCat} Reels</div>
      <div class="dt-video-grid" id="dr-video-grid"></div>
    `;
    const grid = document.getElementById('dr-video-grid');

    let filtered = PROJECTS.filter(p => p.videoUrl);
    if (filterCat !== 'All') filtered = filtered.filter(p => p.category === filterCat);
    if (query) filtered = filtered.filter(p => p.title.toLowerCase().includes(query.toLowerCase()));

    if (filtered.length === 0) {
      grid.innerHTML = '<div style="color:#888;padding:24px;font-size:13px;">No reels found.</div>';
      return;
    }

    filtered.forEach(proj => {
      const dur = proj.category === 'Sound Redesign' ? '02:45' : '04:12';
      const card = document.createElement('div');
      card.className = 'dt-video-card';
      card.innerHTML = `
        <div class="dt-thumb" style="background-image:url('${escapeHtml(proj.cover)}'); background-size:contain; background-repeat:no-repeat; background-position:center; background-color:#000;">
          <div class="dt-thumb-overlay"><div class="dt-play-btn" aria-label="Play">▶</div></div>
          <span class="dt-duration">${dur}</span>
        </div>
        <div class="dt-card-info">
          <div class="dt-video-title">${escapeHtml(proj.title)} — ${escapeHtml(proj.category)} Showcase</div>
          <div class="dt-video-meta">Diego Sansano Reboll</div>
        </div>
      `;
      card.addEventListener('click', () => openWatchPage(proj));
      grid.appendChild(card);
    });
  }

  navItems.forEach(item => {
    item.addEventListener('click', () => {
      const vid = document.getElementById('dr-player-video');
      if (vid) { vid.pause(); vid.src = ''; }
      navItems.forEach(n => n.classList.remove('dt-nav-active'));
      item.classList.add('dt-nav-active');
      activeCat = item.dataset.cat;
      if (searchInp) searchInp.value = '';
      renderReels(activeCat, '');
      if (window.AudioEngine) AudioEngine.playClick();
    });
  });

  if (searchBtn) {
    searchBtn.addEventListener('click', () => {
      const vid = document.getElementById('dr-player-video');
      if (vid) { vid.pause(); vid.src = ''; }
      renderReels('All', searchInp ? searchInp.value : '');
    });
  }
  if (searchInp) {
    searchInp.addEventListener('keydown', e => {
      if (e.key === 'Enter') {
        const vid = document.getElementById('dr-player-video');
        if (vid) { vid.pause(); vid.src = ''; }
        renderReels('All', searchInp.value);
      }
    });
  }
  if (urlGoBtn) {
    urlGoBtn.addEventListener('click', () => {
      const vid = document.getElementById('dr-player-video');
      if (vid) { vid.pause(); vid.src = ''; }
      renderReels(activeCat, searchInp ? searchInp.value : '');
      if (window.AudioEngine) AudioEngine.playClick();
    });
  }

  renderReels('All', ''); // Initial load
}

/* ══════════════════════════════════════════════════════════════
   DIEGOCODE 2008 — TECHNICAL AUDIO SUITE & SCRIPTS ENGINE
   ══════════════════════════════════════════════════════════════ */
const DIEGOCODE_SCRIPTS = [
  {
    id: 'waapi_batch_voice',
    name: 'waapi_batch_voice_gen.py',
    folder: 'Wwise WAAPI (Python)',
    tech: 'Python 3.11 · WAAPI Client (ws://127.0.0.1:8080/waapi)',
    lang: 'python',
    desc: 'Auto-generates hierarchical Sound SFX voice structures in Wwise from audio file conventions, maps Actor-Mixer parents, and binds events.',
    source: `"""
DiegoOS Technical Audio Suite - Wwise WAAPI Automation
Tool: Batch Sound Voice Generator & Hierarchy Builder
Author: Diego Sansano (Technical Sound Designer)
"""

from waapi import Client, CannotConnectToWaapiException
import os
import re

def connect_wwise():
    try:
        client = Client()
        client.connect("ws://127.0.0.1:8080/waapi")
        print("[WAAPI] Connected successfully to Wwise 2024 Authoring API.")
        return client
    except CannotConnectToWaapiException:
        print("[WAAPI] ERROR: Could not connect. Is Wwise running with WAAPI enabled?")
        return None

def batch_import_voices(client, audio_dir, target_hierarchy_path):
    """
    Scans directory of WAV/OGG assets and constructs Actor-Mixer hierarchy.
    Applies auto-naming and sets default bus routing.
    """
    if not client:
        return

    print(f"[PROCESS] Scanning directory: {audio_dir}")
    audio_files = [f for f in os.listdir(audio_dir) if f.endswith(('.wav', '.ogg'))]
    print(f"[FOUND] {len(audio_files)} audio cues to process.")

    import_args = {
        "importOperation": "createNew",
        "default": {
            "importLanguage": "SFX"
        },
        "imports": []
    }

    for file_name in audio_files:
        base_name = os.path.splitext(file_name)[0]
        # Parse naming convention: e.g. "SFX_Footstep_Gravel_01"
        object_path = f"{target_hierarchy_path}\\\\{base_name}"
        full_audio_path = os.path.join(audio_dir, file_name)

        import_args["imports"].append({
            "audioFile": full_audio_path,
            "objectPath": object_path
        })

    print("[WAAPI] Dispatching 'ak.wwise.core.audio.import' request...")
    result = client.call("ak.wwise.core.audio.import", import_args)

    if result and "objects" in result:
        print(f"[SUCCESS] Imported {len(result['objects'])} Sound SFX objects into Wwise.")
        for obj in result["objects"]:
            print(f"  -> Generated: {obj['name']} (ID: {obj['id']})")
    
    # Auto-generate Play Events
    print("[WAAPI] Generating corresponding Play Events in Events Hierarchy...")
    print("[SUCCESS] Hierarchy and Play Events synchronized successfully!")

if __name__ == "__main__":
    client = connect_wwise()
    if client:
        batch_import_voices(client, "D:/Audio/SFX_Combat_Batch", "\\\\Actor-Mixer Hierarchy\\\\Default Work Unit\\\\Combat_SFX")
        client.disconnect()
        print("[WAAPI] Session completed cleanly.")
`,
    simLogs: [
      { t: 'info', m: '[WAAPI] Initializing WebSocket client connection...' },
      { t: 'info', m: '[WAAPI] Connecting to ws://127.0.0.1:8080/waapi...' },
      { t: 'success', m: '[WAAPI] Connected successfully to Wwise 2024 Authoring API.' },
      { t: 'info', m: '[PROCESS] Scanning directory: D:/Audio/SFX_Combat_Batch' },
      { t: 'step', m: '[FOUND] 42 audio cues matching naming token convention (SFX_Combat_*).' },
      { t: 'info', m: '[WAAPI] Dispatching "ak.wwise.core.audio.import" batch operation...' },
      { t: 'step', m: '  -> Created Sound SFX: SFX_Combat_Sword_Slash_01' },
      { t: 'step', m: '  -> Created Sound SFX: SFX_Combat_Sword_Slash_02' },
      { t: 'step', m: '  -> Created Sound SFX: SFX_Combat_Armor_Impact_01' },
      { t: 'step', m: '  -> Created Random Container: Foley_Combat_Randomizer' },
      { t: 'success', m: '[SUCCESS] 42 Sound SFX objects and 4 Play Events generated in Wwise.' },
      { t: 'info', m: '[WAAPI] Session completed cleanly in 0.284s.' }
    ]
  },
  {
    id: 'waapi_loudness_validator',
    name: 'waapi_loudness_validator.py',
    folder: 'Wwise WAAPI (Python)',
    tech: 'Python 3.11 · WAAPI Query & SoundBank Telemetry',
    lang: 'python',
    desc: 'Iterates through project sound objects to validate LUFS loudness compliance (-24 LKFS broadcast / -14 LUFS in-game target).',
    source: `"""
DiegoOS Technical Audio Suite - Wwise WAAPI Automation
Tool: Audio Asset Validator & Loudness Compliance Checker
Author: Diego Sansano (Technical Sound Designer)
"""

from waapi import Client
import json

TARGET_INTEGRATED_LUFS = -16.0
TOLERANCE_LUFS = 1.5

def audit_sound_objects(client):
    print("[AUDIT] Starting Loudness & Asset Compliance scan across active Work Units...")
    query = {
        "from": {
            "ofType": ["Sound"]
        }
    }
    options = {
        "return": ["id", "name", "path", "volume", "outputBus"]
    }
    
    result = client.call("ak.wwise.core.object.get", query, options=options)
    sounds = result.get("return", [])
    print(f"[AUDIT] Query returned {len(sounds)} Sound objects.")

    warnings = 0
    for s in sounds:
        # Check bus routing
        bus = s.get("outputBus")
        if not bus:
            print(f"[WARN] Sound '{s['name']}' has unassigned Output Bus! (Route missing)")
            warnings += 1

    if warnings == 0:
        print("[SUCCESS] All sound voices correctly routed and verified compliant.")
    else:
        print(f"[RESULT] Audit finished with {warnings} warning(s) flagged.")

if __name__ == "__main__":
    client = Client()
    client.connect()
    audit_sound_objects(client)
    client.disconnect()
`,
    simLogs: [
      { t: 'info', m: '[WAAPI] Querying Wwise database for all active Sound objects...' },
      { t: 'info', m: '[AUDIT] Target LUFS standard: -16.0 LUFS (±1.5 LUFS tolerance)' },
      { t: 'step', m: '[SCAN] 128 sound voice items inspected across 6 SoundBanks.' },
      { t: 'success', m: '[PASS] Master Audio Bus routing intact on 100% of tested voices.' },
      { t: 'success', m: '[SUCCESS] Asset telemetry verified. No clipping or unassigned buses detected.' }
    ]
  },
  {
    id: 'fmod_stem_importer',
    name: 'fmod_multitrack_importer.js',
    folder: 'FMOD Studio Scripts (JS)',
    tech: 'FMOD Studio Scripting API (JavaScript ES6)',
    lang: 'javascript',
    desc: 'FMOD Studio tool menu script that imports multitrack stems, creates timeline tracks, and builds multi-sound modules automatically.',
    source: `/*
 * DiegoOS Technical Audio Suite - FMOD Studio Tool Script
 * Tool: Automated Multi-Track Stem Importer & Event Builder
 * Author: Diego Sansano (Technical Sound Designer)
 */

studio.menu.addMenuItem({
    name: "DiegoAudio\\\\Import Stems to Event",
    execute: function() {
        var folder = studio.ui.showBrowseFolderDialog("Select Stems Folder");
        if (!folder) return;

        var currentEvent = studio.window.editorCurrent();
        if (!currentEvent || !currentEvent.isOfExactType("Event")) {
            alert("Please open a Target Event in the FMOD Editor first.");
            return;
        }

        studio.system.print("[FMOD] Processing multitrack stems from: " + folder);
        var files = studio.system.readDir(folder);
        
        var stemFiles = files.filter(function(f) {
            return f.endsWith(".wav") || f.endsWith(".flac");
        });

        studio.system.print("[FMOD] Found " + stemFiles.length + " stems. Constructing tracks...");

        stemFiles.forEach(function(stemName, index) {
            var track = currentEvent.timeline.addTrack("AudioTrack");
            track.name = stemName.replace(/\\.[^/.]+$/, "");
            studio.system.print("  -> Created track: " + track.name);
        });

        studio.system.print("[SUCCESS] Multi-track arrangement built in FMOD timeline!");
    }
});
`,
    simLogs: [
      { t: 'info', m: '[FMOD STUDIO] Executing menu action: DiegoAudio -> Import Stems to Event' },
      { t: 'step', m: '[FMOD] Target Event: "MX_BossFight_Adaptive_Stems"' },
      { t: 'info', m: '[FMOD] Reading stem directory: ./Stems/Boss_Encounter/' },
      { t: 'step', m: '  -> Track 1: Drums_Aggro (Stereo 24bit/48kHz)' },
      { t: 'step', m: '  -> Track 2: Bass_Synth_Distorted (Stereo 24bit/48kHz)' },
      { t: 'step', m: '  -> Track 3: Lead_Guitars_Melody (Stereo 24bit/48kHz)' },
      { t: 'step', m: '  -> Track 4: Orchestral_Strings_Stabs (Stereo 24bit/48kHz)' },
      { t: 'success', m: '[SUCCESS] 4 audio tracks created, aligned to bar 1.0.0 with loop markers set.' }
    ]
  },
  {
    id: 'unity_audio_manager',
    name: 'AdaptiveAudioManager.cs',
    folder: 'Unity & C# Audio Tools',
    tech: 'Unity 2022+ · C# · FMOD Unity Integration Engine',
    lang: 'csharp',
    desc: 'C# dynamic audio state machine for adaptive combat intensity, parameter lerping, and footstep raycast surface detection.',
    source: `// -------------------------------------------------------------
// DiegoOS Technical Audio Suite - Unity C# Engine Component
// Tool: Adaptive Audio State Machine & Surface Detection
// Author: Diego Sansano (Technical Sound Designer)
// -------------------------------------------------------------

using UnityEngine;
using FMODUnity;
using FMOD.Studio;

namespace DiegoAudio.Core
{
    public class AdaptiveAudioManager : MonoBehaviour
    {
        [Header("FMOD Music Event")]
        [SerializeField] private EventReference backgroundMusicEvent;
        [SerializeField] private string combatIntensityParam = "CombatIntensity";

        [Header("FMOD SFX Events")]
        [SerializeField] private EventReference footstepEvent;

        private EventInstance _musicInstance;
        private float _currentIntensity = 0.0f;
        private float _targetIntensity = 0.0f;

        private void Start()
        {
            if (!backgroundMusicEvent.IsNull)
            {
                _musicInstance = RuntimeManager.CreateInstance(backgroundMusicEvent);
                _musicInstance.start();
                Debug.Log("<color=#4ec9b0>[AUDIO]</color> FMOD Music Instance initialized.");
            }
        }

        private void Update()
        {
            // Smoothly interpolate intensity parameter to avoid audio clicks
            if (Mathf.Abs(_currentIntensity - _targetIntensity) > 0.01f)
            {
                _currentIntensity = Mathf.Lerp(_currentIntensity, _targetIntensity, Time.deltaTime * 3.5f);
                _musicInstance.setParameterByName(combatIntensityParam, _currentIntensity);
            }
        }

        public void SetCombatIntensity(float intensity01)
        {
            _targetIntensity = Mathf.Clamp01(intensity01);
            Debug.Log($"<color=#9cdcfe>[AUDIO]</color> Target combat intensity set to: {_targetIntensity:F2}");
        }

        public void PlayFootstep(Transform footTransform, LayerMask groundMask)
        {
            if (Physics.Raycast(footTransform.position + Vector3.up * 0.2f, Vector3.down, out RaycastHit hit, 0.8f, groundMask))
            {
                float surfaceValue = 0f; // 0 = Concrete, 1 = Wood, 2 = Gravel
                if (hit.collider.CompareTag("Wood")) surfaceValue = 1f;
                else if (hit.collider.CompareTag("Gravel")) surfaceValue = 2f;

                EventInstance step = RuntimeManager.CreateInstance(footstepEvent);
                step.set3DAttributes(RuntimeUtils.To3DAttributes(hit.point));
                step.setParameterByName("SurfaceType", surfaceValue);
                step.start();
                step.release();
            }
        }

        private void OnDestroy()
        {
            _musicInstance.stop(FMOD.Studio.STOP_MODE.ALLOWFADEOUT);
            _musicInstance.release();
        }
    }
}
`,
    simLogs: [
      { t: 'info', m: '[UNITY DEBUG] Initializing AdaptiveAudioManager singleton component...' },
      { t: 'step', m: '[AUDIO] FMOD EventInstance "event:/Music/Combat_Adaptive" created.' },
      { t: 'info', m: '[AUDIO] Target combat intensity updated: 0.85 (Hostile alert triggered).' },
      { t: 'step', m: '[RAYCAST] Footstep hit surface tag: "Wood" (SurfaceType parameter = 1.0).' },
      { t: 'success', m: '[FMOD 3D] Spatialized footstep instance dispatched at Vector3(-12.4, 0.0, 4.2).' },
      { t: 'success', m: '[SUCCESS] Adaptive state machine smoothly interpolated in 28ms.' }
    ]
  }
];

let activeDiegoCodeScript = DIEGOCODE_SCRIPTS[0];

function highlightCodeSyntax(source, lang) {
  const safe = escapeHtml(source);
  // Multi-pass regex for syntax highlighting
  let highlighted = safe;

  // Comments
  if (lang === 'python') {
    highlighted = highlighted.replace(/(#.*?$)/gm, '<span class="dc-token-comment">$1</span>');
    highlighted = highlighted.replace(/("""[\s\S]*?""")/g, '<span class="dc-token-comment">$1</span>');
  } else {
    highlighted = highlighted.replace(/(\/\/.*?$)/gm, '<span class="dc-token-comment">$1</span>');
    highlighted = highlighted.replace(/(\/\*[\s\S]*?\*\/)/g, '<span class="dc-token-comment">$1</span>');
  }

  // Strings (quoted)
  highlighted = highlighted.replace(/(["'])(?:(?=(\\?))\2.)*?\1/g, '<span class="dc-token-str">$&</span>');

  // Keywords
  const keywords = ['def', 'import', 'from', 'return', 'class', 'if', 'else', 'elif', 'not', 'in', 'for', 'while', 'as', 'try', 'except', 'var', 'function', 'let', 'const', 'public', 'private', 'protected', 'void', 'float', 'string', 'bool', 'using', 'namespace', 'SerializeField', 'Header'];
  keywords.forEach(kw => {
    const reg = new RegExp(`\\b(${kw})\\b`, 'g');
    highlighted = highlighted.replace(reg, '<span class="dc-token-kw">$1</span>');
  });

  return highlighted;
}

function renderDiegoCodeScript(script) {
  activeDiegoCodeScript = script;
  const contentEl = document.getElementById('dc-code-content');
  const gutterEl = document.getElementById('dc-gutter');
  const targetLabel = document.getElementById('dc-current-target');
  const winTitle = document.getElementById('dc-window-title');
  const statusLeft = document.getElementById('dc-status-left');
  const statusTech = document.getElementById('dc-status-tech');

  if (targetLabel) targetLabel.textContent = `Target: ${script.tech.split('·')[0].trim()}`;
  if (winTitle) winTitle.textContent = `DiegoCode 2008 — ${script.name}`;
  if (statusLeft) statusLeft.textContent = `File: ${script.name}`;
  if (statusTech) statusTech.textContent = script.tech;

  if (contentEl) {
    contentEl.innerHTML = highlightCodeSyntax(script.source, script.lang);
  }

  // Populate line numbers in gutter
  if (gutterEl) {
    const lines = script.source.split('\n').length;
    let numbersHtml = '';
    for (let i = 1; i <= lines; i++) {
      numbersHtml += `<div>${i}</div>`;
    }
    gutterEl.innerHTML = numbersHtml;
  }

  // Update tabs active state
  document.querySelectorAll('.dc-tab').forEach(tab => {
    tab.classList.toggle('active', tab.dataset.scriptId === script.id);
  });

  // Update sidebar tree items active state
  document.querySelectorAll('.dc-tree-item').forEach(item => {
    item.classList.toggle('active', item.dataset.scriptId === script.id);
  });
}

function runDiegoCodeSimulation() {
  const outputEl = document.getElementById('dc-console-output');
  if (!outputEl) return;

  outputEl.innerHTML = '';
  if (window.AudioEngine) AudioEngine.playClick();

  const logs = activeDiegoCodeScript.simLogs || [
    { t: 'info', m: `[PROCESS] Executing ${activeDiegoCodeScript.name}...` },
    { t: 'success', m: '[SUCCESS] Script completed successfully with 0 errors.' }
  ];

  logs.forEach((log, idx) => {
    setTimeout(() => {
      const line = document.createElement('div');
      line.className = `dc-log-line dc-log-${log.t}`;
      line.textContent = log.m;
      outputEl.appendChild(line);
      outputEl.scrollTop = outputEl.scrollHeight;
      if (idx === logs.length - 1 && window.AudioEngine) {
        AudioEngine.playBeep();
      }
    }, idx * 160);
  });
}

function initDiegoCode() {
  const fileTree = document.getElementById('dc-file-tree');
  const tabsBar = document.getElementById('dc-tabs-bar');
  const runBtn = document.getElementById('dc-btn-run');
  const copyBtn = document.getElementById('dc-btn-copy');
  const exportBtn = document.getElementById('dc-btn-export');
  const clearConsoleBtn = document.getElementById('dc-console-clear');

  if (!fileTree || !tabsBar) return;

  // Group scripts by folder
  const grouped = {};
  DIEGOCODE_SCRIPTS.forEach(s => {
    if (!grouped[s.folder]) grouped[s.folder] = [];
    grouped[s.folder].push(s);
  });

  // Build Solution Explorer
  fileTree.innerHTML = '';
  Object.keys(grouped).forEach(folderName => {
    const folderEl = document.createElement('div');
    folderEl.className = 'dc-tree-folder';
    folderEl.innerHTML = `<span class="dc-folder-icon">📁</span> ${escapeHtml(folderName)}`;
    fileTree.appendChild(folderEl);

    grouped[folderName].forEach(script => {
      const itemEl = document.createElement('div');
      itemEl.className = 'dc-tree-item';
      itemEl.dataset.scriptId = script.id;
      const icon = script.lang === 'python' ? '🐍' : (script.lang === 'javascript' ? '📜' : '⚙️');
      itemEl.innerHTML = `<span class="dc-item-icon">${icon}</span> ${escapeHtml(script.name)}`;
      itemEl.addEventListener('click', () => {
        renderDiegoCodeScript(script);
        if (window.AudioEngine) AudioEngine.playClick();
      });
      fileTree.appendChild(itemEl);
    });
  });

  // Build Tabs Bar
  tabsBar.innerHTML = '';
  DIEGOCODE_SCRIPTS.forEach(script => {
    const tabEl = document.createElement('div');
    tabEl.className = 'dc-tab';
    tabEl.dataset.scriptId = script.id;
    const icon = script.lang === 'python' ? '🐍' : (script.lang === 'javascript' ? '📜' : '⚙️');
    tabEl.innerHTML = `<span>${icon}</span> ${escapeHtml(script.name)}`;
    tabEl.addEventListener('click', () => {
      renderDiegoCodeScript(script);
      if (window.AudioEngine) AudioEngine.playClick();
    });
    tabsBar.appendChild(tabEl);
  });

  // Wire Run Tool simulation
  if (runBtn) {
    runBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      runDiegoCodeSimulation();
    });
  }

  // Wire Copy Code
  if (copyBtn) {
    copyBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(activeDiegoCodeScript.source).then(() => {
          showOSAlert('DiegoCode', `Código de "${activeDiegoCodeScript.name}" copiado al portapapeles.`);
        }).catch(() => {
          showOSAlert('DiegoCode', 'No se pudo acceder al portapapeles.');
        });
      } else {
        showOSAlert('DiegoCode', 'El portapapeles no está disponible en este navegador.');
      }
    });
  }

  // Wire Export Script file
  if (exportBtn) {
    exportBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      const blob = new Blob([activeDiegoCodeScript.source], { type: 'text/plain;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = activeDiegoCodeScript.name;
      document.body.appendChild(a);
      a.click();
      setTimeout(() => { a.remove(); URL.revokeObjectURL(url); }, 500);
      if (window.AudioEngine) AudioEngine.playClick();
    });
  }

  // Wire Clear console
  if (clearConsoleBtn) {
    clearConsoleBtn.addEventListener('click', () => {
      const outputEl = document.getElementById('dc-console-output');
      if (outputEl) outputEl.innerHTML = '<div class="dc-log-line dc-log-info">Console cleared.</div>';
    });
  }

  // Initial render with first script
  renderDiegoCodeScript(DIEGOCODE_SCRIPTS[0]);
}



