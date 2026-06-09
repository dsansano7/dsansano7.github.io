/* ============================================================
   DiegoOS v3 — script.js
   Full Interactive Engine: Audio · Windows · Projects · Tray
   ============================================================ */

'use strict';

/* =========================================================================
   PROJECTS DATABASE
   ========================================================================= */
const PROJECTS = [
  {
    id: 1, title: 'The Last of Us', category: 'Sound Redesign', catClass: 'cat-sd', icon: '🧟',
    desc: 'A comprehensive audio redesign of a dynamic sequence, featuring seamless acoustic transitions between interior and exterior environments. The project highlights custom Foley artistry, spatialized environmental soundscaping, and a cinematic mix fully orchestrated in REAPER.',
    tags: ['REAPER', 'Foley', 'Soundscaping', 'Mixing'],
    gameUrl: ''
  },
  {
    id: 2, title: 'Party Drinker', category: 'Audio Programming', catClass: 'cat-ap', icon: '🍻',
    desc: 'A 48-hour Game Jam project set in a lively party environment, featuring a complete audio build developed from scratch. Rapid implementation using FMOD and Unity, focusing on FMOD spatialization to create an immersive atmosphere.',
    tags: ['FMOD', 'Unity', 'Game Jam', 'Spatialization'],
    gameUrl: ''
  },
  {
    id: 3, title: 'Cooking Fever', category: 'UI/UX Audio', catClass: 'cat-sd', icon: '🍔',
    desc: 'UI/UX audio design for a fast-paced management game. Crafted tactile interface sounds and rewarding telemetry by blending processed library assets with custom recordings, with all editing and optimization orchestrated natively in REAPER.',
    tags: ['REAPER', 'UI/UX', 'Sound Design', 'Asset Optimization'],
    gameUrl: ''
  },
  {
    id: 4, title: 'Unwraptal', category: 'Audio Programming', catClass: 'cat-ap', icon: '🎁',
    desc: 'A full-cycle audio production for a month-long Game Jam. The game features Wario Ware-style mini-games. Crafted all custom SFX and an original dynamic soundtrack (Menu, HUB, and End Game), fully implemented in Unity via FMOD.',
    tags: ['FMOD', 'Unity', 'Music Composition', 'SFX'],
    gameUrl: './games/unwraptal/index.html' // Build local
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

  function getCtx() {
    if (!ctx) {
      ctx = new (window.AudioContext || window.webkitAudioContext)();
      masterGain = ctx.createGain();
      masterGain.gain.value = masterVol;
      masterGain.connect(ctx.destination);
    }
    if (ctx.state === 'suspended') ctx.resume();
    return ctx;
  }

  function tone({ freq = 440, type = 'sine', gain = 0.15, start = 0,
                  dur = 0.18, attack = 0.01, release = 0.1 }) {
    if (muted) return;
    const c   = getCtx();
    const osc = c.createOscillator();
    const env = c.createGain();
    const hp  = c.createBiquadFilter();
    hp.type = 'highpass'; hp.frequency.value = 180;
    osc.type = type; osc.frequency.value = freq;
    env.gain.setValueAtTime(0, c.currentTime + start);
    env.gain.linearRampToValueAtTime(gain, c.currentTime + start + attack);
    env.gain.exponentialRampToValueAtTime(0.0001, c.currentTime + start + dur);
    osc.connect(hp); hp.connect(env); env.connect(masterGain);
    osc.start(c.currentTime + start);
    osc.stop(c.currentTime + start + dur + release);
  }

  function playBootChime() {
    if (muted) return;
    [
      { freq: 329.63, start: 0,    dur: 1.05, gain: 0.11, type: 'sine'     },
      { freq: 415.30, start: 0.09, dur: 0.95, gain: 0.09, type: 'sine'     },
      { freq: 493.88, start: 0.18, dur: 0.88, gain: 0.08, type: 'sine'     },
      { freq: 659.26, start: 0.27, dur: 0.80, gain: 0.07, type: 'sine'     },
      { freq: 329.63, start: 0,    dur: 1.3,  gain: 0.05, type: 'triangle' },
      { freq: 164.81, start: 0,    dur: 1.5,  gain: 0.06, type: 'sine'     },
    ].forEach(n => tone({ ...n, attack: 0.02, release: 0.4 }));
  }

  function playClick() {
    if (muted) return;
    tone({ freq: 1200, type: 'square', gain: 0.035, dur: 0.05, attack: 0.002, release: 0.025 });
    tone({ freq: 880,  type: 'sine',   gain: 0.025, dur: 0.07, attack: 0.003, release: 0.035 });
  }

  function playHover() {
    if (muted) return;
    tone({ freq: 1800, type: 'sine', gain: 0.015, dur: 0.035, attack: 0.002, release: 0.018 });
  }

  function playOpen() {
    if (muted) return;
    tone({ freq: 880,  type: 'sine', gain: 0.065, dur: 0.09, attack: 0.005, release: 0.055 });
    tone({ freq: 1046, type: 'sine', gain: 0.050, start: 0.06, dur: 0.09, attack: 0.004, release: 0.055 });
  }

  function playClose() {
    if (muted) return;
    tone({ freq: 620, type: 'sine', gain: 0.055, dur: 0.09, attack: 0.004, release: 0.045 });
    tone({ freq: 400, type: 'sine', gain: 0.045, start: 0.06, dur: 0.1, attack: 0.002, release: 0.075 });
  }

  function setMuted(val) { muted = Boolean(val); }
  function isMuted()     { return muted; }

  function setVolume(vol) {
    masterVol = Math.max(0, Math.min(1, vol));
    if (masterGain) {
      masterGain.gain.setTargetAtTime(masterVol, getCtx().currentTime, 0.04);
    }
  }
  function getVolume() { return masterVol; }

  return { playBootChime, playClick, playHover, playOpen, playClose,
           setMuted, isMuted, setVolume, getVolume };
})();

/* ──────────────────────────────────────────────────────────────
   2. WINDOW MANAGER
   ────────────────────────────────────────────────────────────── */
const WindowManager = (() => {
  let topZ   = 100;
  const wins = {};   // id → { el, minimized, maximized, prevRect }
  const tabs = {};   // id → <button>
  const meta = {     // id → { icon, label }  — extensible at runtime
    'win-about':      { icon:'👤', label:'About Me'          },
    'win-toolkit':    { icon:'🎛️', label:'Toolkit'           },
    'win-work':       { icon:'🎬', label:'My Work'           },
    'win-contact':    { icon:'💻', label:'Contact'           },
    'win-properties': { icon:'⚙️', label:'Display Properties' },
    'win-notepad':    { icon:'📝', label:'Notepad'           },
    'win-pdf-viewer': { icon:'📄', label:'Adobe Reader'      },
    'win-demoreel':   { icon:'📼', label:'Demoreels'         },
  };

  const tabsEl = document.getElementById('taskbar-tabs');

  /* ─ register ─────────────────────────────────────────────── */
  function register(id, extraMeta) {
    const el = document.getElementById(id);
    if (!el) return;
    wins[id] = { el, minimized:false, maximized:false, prevRect:null };
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
    
    let left = (viewportWidth - winWidth) / 2;
    let top = (viewportHeight - 52 - winHeight) / 2;
    if (left < 0) left = 0;
    if (top < 0) top = 0;
    
    w.el.style.left = left + 'px';
    w.el.style.top = top + 'px';

    AudioEngine.playOpen();
    focus(id);
    _createTab(id);
    if (id === 'win-contact') _animateTerminal();
  }

  /* ─ close ────────────────────────────────────────────────── */
  function close(id) {
    const w = wins[id];
    if (!w) return;
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
    w.minimized = true;
    w.el.classList.add('minimized-snap');
    setTimeout(() => { w.el.style.display='none'; w.el.classList.remove('minimized-snap'); }, 220);
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
        w.el.style.top = r.top; w.el.style.left  = r.left;
        w.el.style.width = r.width; w.el.style.height = r.height;
      }
      w.maximized = false;
    } else {
      w.prevRect = { top:w.el.style.top, left:w.el.style.left,
                     width:w.el.style.width, height:w.el.style.height };
      w.el.classList.add('maximized');
      w.maximized = true;
    }
    AudioEngine.playClick();
    focus(id);
  }

  /* ─ tabs ─────────────────────────────────────────────────── */
  function _createTab(id) {
    if (tabs[id]) return;
    const m   = meta[id] || { icon:'🪟', label: id };
    const btn = document.createElement('button');
    btn.className = 'tb-tab'; btn.id = `tab-${id}`;
    btn.textContent = `${m.icon} ${m.label}`;
    btn.addEventListener('click', () => {
      const w = wins[id];
      if (!w) return;
      if (w.minimized)                           open(id);
      else if (tabs[id].classList.contains('active')) minimize(id);
      else                                       focus(id);
    });
    tabsEl.appendChild(btn);
    tabs[id] = btn;
  }
  function _removeTab(id) {
    if (tabs[id]) { tabs[id].remove(); delete tabs[id]; }
  }

  /* ─ drag ─────────────────────────────────────────────────── */
  function _initDrag(id, el) {
    const tb = el.querySelector('.win-titlebar');
    if (!tb) return;
    let dragging = false, ox = 0, oy = 0;

    const down = (cx, cy) => {
      if (wins[id].maximized) return;
      dragging = true;
      const r = el.getBoundingClientRect();
      ox = cx - r.left; oy = cy - r.top;
      focus(id);
      document.body.style.userSelect = 'none';
    };
    const move = (cx, cy) => {
      if (!dragging) return;
      el.style.left = Math.max(0, cx - ox) + 'px';
      el.style.top  = Math.max(0, cy - oy) + 'px';
    };
    const up = () => { dragging = false; document.body.style.userSelect = ''; };

    tb.addEventListener('mousedown',  e => down(e.clientX, e.clientY));
    document.addEventListener('mousemove',  e => move(e.clientX, e.clientY));
    document.addEventListener('mouseup',    up);
    tb.addEventListener('touchstart', e => { const t=e.touches[0]; down(t.clientX,t.clientY); }, {passive:true});
    document.addEventListener('touchmove',  e => { const t=e.touches[0]; move(t.clientX,t.clientY); }, {passive:true});
    document.addEventListener('touchend',   up);
    el.addEventListener('mousedown', () => focus(id));
  }

  /* ─ resize ───────────────────────────────────────────────── */
  function _initResize(el) {
    const h = document.createElement('div');
    h.style.cssText = 'position:absolute;bottom:0;right:0;width:14px;height:14px;cursor:se-resize;z-index:10;';
    el.appendChild(h);
    let on=false, sx=0, sy=0, sw=0, sh=0;
    h.addEventListener('mousedown', e => {
      on=true; sx=e.clientX; sy=e.clientY; sw=el.offsetWidth; sh=el.offsetHeight;
      e.stopPropagation(); document.body.style.userSelect='none';
    });
    document.addEventListener('mousemove', e => {
      if (!on) return;
      el.style.width  = Math.max(340, sw + e.clientX - sx) + 'px';
      el.style.height = Math.max(240, sh + e.clientY - sy) + 'px';
    });
    document.addEventListener('mouseup', () => { on=false; document.body.style.userSelect=''; });
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
    const winId  = btn.dataset.win;
    btn.addEventListener('click', e => {
      e.stopPropagation();
      switch (action) {
        case 'close':    WindowManager.close(winId);    break;
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

  let currentProj = null; // null = root view

  /* ─ SVG templates ────────────────────────────────────── */
  const folderSVG = `<svg viewBox="0 0 64 52" fill="none" xmlns="http://www.w3.org/2000/svg" class="xp-icon-svg">
    <path d="M2 10 Q2 6 6 6 L24 6 L30 2 L58 2 Q62 2 62 6 L62 46 Q62 50 58 50 L6 50 Q2 50 2 46 Z" fill="#FFC83D" stroke="#CC8800" stroke-width="1.5"/>
    <path d="M2 16 L62 16 L62 46 Q62 50 58 50 L6 50 Q2 50 2 46 Z" fill="#FFD966" stroke="#CC8800" stroke-width="1.5"/>
    <line x1="14" y1="28" x2="50" y2="28" stroke="#CC8800" stroke-width="1.5" opacity="0.4"/>
    <line x1="14" y1="36" x2="40" y2="36" stroke="#CC8800" stroke-width="1.5" opacity="0.3"/>
  </svg>`;

  const txtSVG = `<svg viewBox="0 0 54 64" fill="none" xmlns="http://www.w3.org/2000/svg" class="xp-icon-svg">
    <rect x="2" y="2" width="42" height="60" rx="3" fill="#ffffff" stroke="#3060cc" stroke-width="2"/>
    <path d="M34 2 L34 14 L46 14" fill="#c8d8f8" stroke="#3060cc" stroke-width="1.5"/>
    <path d="M34 2 L46 14" fill="none" stroke="#3060cc" stroke-width="2"/>
    <line x1="9" y1="22" x2="37" y2="22" stroke="#3060cc" stroke-width="1.8"/>
    <line x1="9" y1="30" x2="37" y2="30" stroke="#aaa" stroke-width="1.5"/>
    <line x1="9" y1="38" x2="37" y2="38" stroke="#aaa" stroke-width="1.5"/>
    <line x1="9" y1="46" x2="28" y2="46" stroke="#aaa" stroke-width="1.5"/>
  </svg>`;

  const exeSVG = `<svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" class="xp-icon-svg">
    <defs><linearGradient id="eg" x1="20" y1="14" x2="52" y2="50" gradientUnits="userSpaceOnUse"><stop offset="0%" stop-color="#00ff88"/><stop offset="100%" stop-color="#00aa44"/></linearGradient></defs>
    <rect x="4" y="4" width="56" height="56" rx="6" fill="#0d1a2e" stroke="#2a5acc" stroke-width="2"/>
    <polygon points="20,14 20,50 52,32" fill="url(#eg)"/>
    <circle cx="48" cy="48" r="10" fill="#1a3a6a" stroke="#2a5acc" stroke-width="1.5"/>
    <text x="48" y="52" text-anchor="middle" fill="#7ec8ff" font-size="9" font-family="monospace" font-weight="bold">.exe</text>
  </svg>`;

  const noExeSVG = `<svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" class="xp-icon-svg">
    <rect x="4" y="4" width="56" height="56" rx="6" fill="#1a1a2e" stroke="#444" stroke-width="2"/>
    <polygon points="20,14 20,50 52,32" fill="#444"/>
    <line x1="14" y1="14" x2="50" y2="50" stroke="#cc2222" stroke-width="3" stroke-linecap="round"/>
    <line x1="50" y1="14" x2="14" y2="50" stroke="#cc2222" stroke-width="3" stroke-linecap="round"/>
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

  /* ─ renderRoot ──────────────────────────────────── */
  function renderRoot() {
    currentProj = null;
    folderView.innerHTML = '';
    if (addrBar)     addrBar.value        = 'C:\\DiegoOS\\My Work';
    if (backBtn)     backBtn.disabled     = true;
    if (upBtn)       upBtn.disabled       = true;
    if (detailsName) detailsName.textContent = 'My Work';
    if (detailsType) detailsType.textContent = 'File Folder';
    if (detailsSize) detailsSize.textContent = `${PROJECTS.length} objects`;
    if (detailIcon)  detailIcon.textContent  = '📁';

    PROJECTS.forEach(proj => {
      const item = createFileIcon(
        folderSVG,
        proj.title,
        'folder',
        () => navigateInto(proj)
      );
      folderView.appendChild(item);
    });
  }

  /* ─ navigateInto ───────────────────────────────── */
  function navigateInto(proj) {
    currentProj = proj;
    folderView.innerHTML = '';
    if (addrBar)     addrBar.value           = `C:\\DiegoOS\\My Work\\${proj.title}`;
    if (backBtn)     backBtn.disabled        = false;
    if (upBtn)       upBtn.disabled          = false;
    if (detailsName) detailsName.textContent = proj.title;
    if (detailsType) detailsType.textContent = proj.category;
    if (detailsSize) detailsSize.textContent = '2 objects';
    if (detailIcon)  detailIcon.textContent  = proj.icon;
    AudioEngine.playOpen();

    // PDF Details
    const readme = createFileIcon(pdfSVG, 'Project_Details.pdf', 'pdf', () => openReadme(proj));
    folderView.appendChild(readme);

    // EXE
    const hasGame = Boolean(proj.gameUrl);
    const exeLabel = hasGame ? 'Demo.exe' : 'Demo.exe (N/A)';
    const exe = createFileIcon(
      hasGame ? exeSVG : noExeSVG,
      exeLabel,
      'exe',
      () => openExe(proj)
    );
    if (!hasGame) exe.classList.add('xp-icon-disabled');
    folderView.appendChild(exe);
  }

  /* ─ openReadme ────────────────────────────────── */
  function openReadme(proj) {
    const sheet = document.getElementById('pdf-page-sheet');
    if (sheet) {
      const tagHTML = proj.tags.map(t => `<li class="pdf-sheet-tag">${t}</li>`).join('');
      const paragraphs = proj.desc.split('\n\n').map(p => `<p class="pdf-sheet-desc">${p}</p>`).join('');
      sheet.innerHTML = `
        <div class="pdf-sheet-title">${proj.title}</div>
        <div class="pdf-sheet-category">${proj.category}</div>
        
        <div class="pdf-sheet-section-title">Description</div>
        <div class="pdf-sheet-desc-container">
          ${paragraphs}
        </div>
        
        <div class="pdf-sheet-section-title">Tech Stack</div>
        <ul class="pdf-sheet-tag-list">
          ${tagHTML}
        </ul>
      `;
    }
    WindowManager.open('win-pdf-viewer');
    AudioEngine.playOpen();
  }

  /* ─ openExe ───────────────────────────────────── */
  function openExe(proj) {
    if (!proj.gameUrl) {
      AudioEngine.playClose();
      return;
    }
    const body    = document.getElementById('game-runner-body');
    const titleEl = document.getElementById('game-runner-title');
    if (body) {
      body.innerHTML = `<iframe src="${proj.gameUrl}" width="100%" height="100%"
        style="border:none;display:block;"
        title="${proj.title} Demo"
        allow="autoplay; fullscreen"></iframe>`;
    }
    if (titleEl) titleEl.textContent = `${proj.title} — DiegoOS Executable Engine`;
    WindowManager.open('win-game-runner');
    AudioEngine.playOpen();
  }

  /* ─ createFileIcon ─────────────────────────────── */
  function createFileIcon(svgHtml, label, type, onDblClick) {
    const item = document.createElement('div');
    item.className = `xp-file-icon xp-type-${type}`;
    item.setAttribute('tabindex', '0');
    item.setAttribute('role', 'button');
    item.setAttribute('aria-label', label);
    item.innerHTML = `
      <div class="xp-icon-img">${svgHtml}</div>
      <div class="xp-icon-label">${label}</div>
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
        if (clickTimer) {
          clearTimeout(clickTimer); clickTimer = null;
          onDblClick();
        } else {
          clickTimer = setTimeout(() => { clickTimer = null; }, 380);
        }
      }
    });
    item.addEventListener('keydown', e => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onDblClick(); }
    });
    item.addEventListener('mouseenter', () => AudioEngine.playHover());
    return item;
  }

  /* ─ toolbar buttons ─────────────────────────────── */
  if (backBtn) backBtn.addEventListener('click', () => { if (currentProj) { renderRoot(); AudioEngine.playClick(); } });
  if (upBtn)   upBtn.addEventListener('click',   () => { if (currentProj) { renderRoot(); AudioEngine.playClick(); } });

  /* ─ initial render ──────────────────────────────── */
  renderRoot();
}

  

const isMobileDevice = () => {
  return window.matchMedia('(max-width: 720px)').matches || ('ontouchstart' in window) || (navigator.maxTouchPoints > 0);
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
      });
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
  const boot    = document.getElementById('boot-screen');
  const desktop = document.getElementById('desktop');
  const startTime = Date.now();
  const bootDuration = 2500;

  let booted = false;

  const bootInterval = setInterval(() => {
    const elapsed = Date.now() - startTime;

    if (!booted && elapsed >= bootDuration) {
      booted = true;
      clearInterval(bootInterval);
      
      boot.classList.add('boot-fade-out');
      desktop.style.display = 'block';

      // Wait 800ms for boot-screen fade-out to finish (now invisible)
      setTimeout(() => {
        const crtLine = document.querySelector('.crt-bright-line');
        if (crtLine) crtLine.classList.add('bloom');

        // 1 second user pause with scanline glowing
        setTimeout(() => {
          const crtOverlay = document.getElementById('crt-transition-overlay');
          if (crtOverlay) crtOverlay.classList.add('open');

          // 600ms transition time for bars to slide apart completely
          setTimeout(() => {
            try { boot.remove(); } catch (err) { console.error(err); }
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
    }
  }, 50);
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
      el.textContent = `${String(n.getHours()).padStart(2,'0')}:${String(n.getMinutes()).padStart(2,'0')}`;
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
  const btn  = document.getElementById('start-btn');
  const menu = document.getElementById('start-menu');
  let open = false;

  const toggle = () => {
    open = !open;
    menu.style.display = open ? 'block' : 'none';
    btn.setAttribute('aria-expanded', String(open));
    if (open) AudioEngine.playClick();
  };

  btn.addEventListener('click', e => { e.stopPropagation(); cancelInactivityTimer(); toggle(); });
  document.addEventListener('click', e => {
    if (open && !menu.contains(e.target) && e.target !== btn) {
      open = false; menu.style.display='none';
      btn.setAttribute('aria-expanded','false');
    }
  });

  document.querySelectorAll('#start-menu .sm-item[data-window]').forEach(item => {
    item.addEventListener('click', () => {
      WindowManager.open(item.dataset.window);
      menu.style.display='none'; open=false;
      btn.setAttribute('aria-expanded','false');
      AudioEngine.playClick();
    });
  });

  const portfolioLink = document.getElementById('sm-portfolio-link');
  if (portfolioLink) {
    portfolioLink.addEventListener('click', () => {
      window.open('https://diego-sansano-reboll-portfolio.vercel.app/', '_blank');
      AudioEngine.playClick();
    });
  }

  // Shut down easter egg
  ['sm-shutdown-btn','sm-shutdown'].forEach(id => {
    const el = document.getElementById(id);
    if (!el) return;
    el.addEventListener('click', () => {
      AudioEngine.playClose();
      const scr = document.createElement('div');
      scr.className = 'shutdown-screen';
      scr.innerHTML = `
        <div class="shutdown-left-bar"></div>
        <div class="shutdown-main">
          <div class="shutdown-logo-row">
            <div class="xp-flag" aria-hidden="true">
              <div class="fq tl"></div><div class="fq tr"></div>
              <div class="fq bl"></div><div class="fq br"></div>
            </div>
            <div class="shutdown-text-col">
              <div class="shutdown-please-wait">please wait...</div>
              <div class="shutdown-status">DiegoOS is shutting down...</div>
            </div>
          </div>
          <button class="shutdown-restart-btn" onclick="location.reload()">
            ↺ Restart DiegoOS
          </button>
        </div>`;
      document.body.appendChild(scr);
    });
  });

  const logoff = document.getElementById('sm-logoff-btn');
  if (logoff) logoff.addEventListener('click', () => { AudioEngine.playClose(); location.reload(); });
}

/* ──────────────────────────────────────────────────────────────
   8. SEARCH BAR
   ────────────────────────────────────────────────────────────── */
function initSearch() {
  const inp = document.getElementById('taskbar-search');
  if (!inp) return;

  const map = [
    { terms:['about','me','diego','bio','saxophone','berklee','uji','firescale','gdd'],  win:'win-about'   },
    { terms:['toolkit','fmod','wwise','unity','unreal','reaper','musescore','audio','middleware'], win:'win-toolkit' },
    { terms:['work','project','enchanted','neon','castle','abyss','orbital','wasteland'], win:'win-work'    },
    { terms:['contact','email','phone','mail','call','languages','terminal'],             win:'win-contact'  },
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
      if (sm) sm.style.display = 'none';
      const btn = document.getElementById('start-btn');
      if (btn) btn.setAttribute('aria-expanded', 'false');
    } else {
      inp.style.color='#ff6060';
      setTimeout(()=>inp.style.color='',800);
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
  const darkBtn   = document.getElementById('dark-mode-btn');
  const muteBtn   = document.getElementById('mute-btn');
  const muteIcon  = document.getElementById('mute-icon');
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
   10. DESKTOP ICONS — single click = select, double = open, draggable
   ────────────────────────────────────────────────────────────── */
function isCellOccupied(iconEl, left, top) {
  const icons = document.querySelectorAll('.desktop-icon');
  for (const icon of icons) {
    if (icon === iconEl) continue;
    const oLeft = parseInt(icon.style.left || '0', 10);
    const oTop = parseInt(icon.style.top || '0', 10);
    if (Math.abs(oLeft - left) < 55 && Math.abs(oTop - top) < 60) {
      return true;
    }
  }
  return false;
}

function getNearestFreeCell(iconEl, targetLeft, targetTop, maxLeft, maxTop) {
  let layer = 0;
  while (layer < 15) {
    if (layer === 0) {
      if (!isCellOccupied(iconEl, targetLeft, targetTop)) {
        return { left: targetLeft, top: targetTop };
      }
    } else {
      for (let dx = -layer; dx <= layer; dx++) {
        for (let dy = -layer; dy <= layer; dy++) {
          if (Math.max(Math.abs(dx), Math.abs(dy)) !== layer) continue;
          
          const candidateLeft = targetLeft + dx * 110;
          const candidateTop = targetTop + dy * 120;
          
          if (candidateLeft < 20 || candidateLeft > maxLeft) continue;
          if (candidateTop < 20 || candidateTop > maxTop) continue;
          
          if (!isCellOccupied(iconEl, candidateLeft, candidateTop)) {
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
  let dragging = false;
  let startX = 0, startY = 0;
  let startLeft = 0, startTop = 0;

  const onMouseDown = (e) => {
    if (e.button !== 0) return;
    
    document.querySelectorAll('.desktop-icon').forEach(i => i.classList.remove('selected'));
    el.classList.add('selected');
    
    dragging = true;
    startX = e.clientX;
    startY = e.clientY;
    startLeft = parseInt(el.style.left || '0', 10);
    startTop = parseInt(el.style.top || '0', 10);
    
    document.body.style.userSelect = 'none';
    e.stopPropagation();
  };

  const onMouseMove = (e) => {
    if (!dragging) return;
    
    const dx = e.clientX - startX;
    const dy = e.clientY - startY;
    
    let newLeft = startLeft + dx;
    let newTop = startTop + dy;
    
    const desktop = document.getElementById('desktop');
    if (desktop) {
      const db = desktop.getBoundingClientRect();
      const maxLeft = db.width - 100;
      const maxTop = db.height - 110 - 52;
      
      if (newLeft < 0) newLeft = 0;
      if (newLeft > maxLeft) newLeft = maxLeft;
      if (newTop < 0) newTop = 0;
      if (newTop > maxTop) newTop = maxTop;
    }
    
    el.style.left = newLeft + 'px';
    el.style.top = newTop + 'px';
  };

  const onMouseUp = () => {
    if (dragging) {
      dragging = false;
      document.body.style.userSelect = '';

      let currentLeft = parseInt(el.style.left || '0', 10);
      let currentTop = parseInt(el.style.top || '0', 10);

      // Snap to 110x120 grid points starting at 20, 20
      let snapLeft = Math.round((currentLeft - 20) / 110) * 110 + 20;
      let snapTop = Math.round((currentTop - 20) / 120) * 120 + 20;

      const desktop = document.getElementById('desktop');
      let maxLeft = window.innerWidth - 100;
      let maxTop = window.innerHeight - 110 - 52;
      if (desktop) {
        const db = desktop.getBoundingClientRect();
        maxLeft = db.width - 100;
        maxTop = db.height - 110 - 52;
      }

      if (snapLeft > maxLeft) snapLeft = Math.floor((maxLeft - 20) / 110) * 110 + 20;
      if (snapTop > maxTop) snapTop = Math.floor((maxTop - 20) / 120) * 120 + 20;

      if (snapLeft < 20) snapLeft = 20;
      if (snapTop < 20) snapTop = 20;

      const freeCell = getNearestFreeCell(el, snapLeft, snapTop, maxLeft, maxTop);

      el.style.left = freeCell.left + 'px';
      el.style.top = freeCell.top + 'px';
    }
  };

  el.addEventListener('mousedown', onMouseDown);
  document.addEventListener('mousemove', onMouseMove);
  document.addEventListener('mouseup', onMouseUp);

  const onTouchStart = (e) => {
    document.querySelectorAll('.desktop-icon').forEach(i => i.classList.remove('selected'));
    el.classList.add('selected');
    
    dragging = true;
    const t = e.touches[0];
    startX = t.clientX;
    startY = t.clientY;
    startLeft = parseInt(el.style.left || '0', 10);
    startTop = parseInt(el.style.top || '0', 10);
    
    e.stopPropagation();
  };

  const onTouchMove = (e) => {
    if (!dragging) return;
    const t = e.touches[0];
    const dx = t.clientX - startX;
    const dy = t.clientY - startY;
    
    let newLeft = startLeft + dx;
    let newTop = startTop + dy;
    
    const desktop = document.getElementById('desktop');
    if (desktop) {
      const db = desktop.getBoundingClientRect();
      const maxLeft = db.width - 100;
      const maxTop = db.height - 110 - 52;
      
      if (newLeft < 0) newLeft = 0;
      if (newLeft > maxLeft) newLeft = maxLeft;
      if (newTop < 0) newTop = 0;
      if (newTop > maxTop) newTop = maxTop;
    }
    
    el.style.left = newLeft + 'px';
    el.style.top = newTop + 'px';
  };

  el.addEventListener('touchstart', onTouchStart, { passive: true });
  document.addEventListener('touchmove', onTouchMove, { passive: true });
  document.addEventListener('touchend', onMouseUp);
}

function initDesktopIcons() {
  const defaultCoords = [
    { top: 20, left: 20 },
    { top: 140, left: 20 },
    { top: 260, left: 20 },
    { top: 380, left: 20 },
    { top: 500, left: 20 }
  ];

  document.querySelectorAll('.desktop-icon').forEach((icon, idx) => {
    const winId = icon.dataset.window;
    let timer = null;

    const coords = defaultCoords[idx] || { top: 20 + idx * 120, left: 20 };
    icon.style.top = coords.top + 'px';
    icon.style.left = coords.left + 'px';
    icon.classList.add('is-ready');

    makeIconDraggable(icon);

    icon.addEventListener('click', e => {
      e.stopPropagation();
      cancelInactivityTimer();
      document.querySelectorAll('.desktop-icon').forEach(i => i.classList.remove('selected'));
      icon.classList.add('selected');
      AudioEngine.playClick();

      if (isMobileDevice()) {
        if (winId) WindowManager.open(winId);
      } else {
        if (timer) {
          clearTimeout(timer); timer = null;
          if (winId) WindowManager.open(winId);
        } else {
          timer = setTimeout(() => { timer = null; }, 360);
        }
      }
    });
    icon.addEventListener('keydown', e => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); if (winId) WindowManager.open(winId); }
    });
    icon.addEventListener('mouseenter', () => AudioEngine.playHover());
    icon.addEventListener('contextmenu', e => {
      e.preventDefault();
      e.stopPropagation();
    });
  });

  document.getElementById('desktop').addEventListener('click', e => {
    const tgt = e.target;
    const isDesktopBg = tgt.id==='desktop' || tgt.classList.contains('wp-layer') || tgt.classList.contains('desktop-overlay');
    if (isDesktopBg) {
      document.querySelectorAll('.desktop-icon').forEach(i => i.classList.remove('selected'));
      const sm = document.getElementById('start-menu');
      if (sm) sm.style.display = 'none';
      document.getElementById('start-btn').setAttribute('aria-expanded','false');
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
    const newName = input.value.trim();
    if (newName && newName !== '') {
      labelEl.textContent = newName;
      iconEl.setAttribute('aria-label', `${newName} — Text file icon`);
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

function createNewTextFile(x, y) {
  const grid = document.getElementById('icon-grid');
  if (!grid) return;

  const icon = document.createElement('div');
  icon.className = 'desktop-icon text-file-icon';
  
  let left = x - 50;
  let top = y - 40;
  
  if (left < 10) left = 10;
  if (top < 10) top = 10;
  const maxLeft = window.innerWidth - 110;
  const maxTop = window.innerHeight - 150;
  if (left > maxLeft) left = maxLeft;
  if (top > maxTop) top = maxTop;
  
  icon.style.left = left + 'px';
  icon.style.top = top + 'px';
  icon.setAttribute('tabindex', '0');
  icon.setAttribute('role', 'button');
  icon.setAttribute('aria-label', 'Nuevo Documento — Text file icon');

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
    <span class="icon-label">Nuevo Documento.txt</span>
  `;

  grid.appendChild(icon);
  makeIconDraggable(icon);
  icon.classList.add('is-ready');

  let timer = null;
  const openNotepad = () => WindowManager.open('win-notepad');

  icon.addEventListener('click', e => {
    e.stopPropagation();
    cancelInactivityTimer();
    document.querySelectorAll('.desktop-icon').forEach(i => i.classList.remove('selected'));
    icon.classList.add('selected');
    AudioEngine.playClick();

    if (isMobileDevice()) {
      openNotepad();
    } else {
      if (timer) {
        clearTimeout(timer); timer = null;
        openNotepad();
      } else {
        timer = setTimeout(() => { timer = null; }, 360);
      }
    }
  });

  icon.addEventListener('keydown', e => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      openNotepad();
    }
  });

  icon.addEventListener('mouseenter', () => AudioEngine.playHover());

  // Dynamic context menu for Notepad dynamic files
  icon.addEventListener('contextmenu', e => {
    e.preventDefault();
    e.stopPropagation();

    showContextMenu(e, [
      { l: '✏️ Renombrar', fn: () => {
          startInlineRename(icon);
        }
      },
      { sep: true },
      { l: '🗑️ Eliminar', fn: () => {
          icon.remove();
        }
      }
    ]);
  });
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
    { l: '⚙️ Properties',            fn: () => WindowManager.open('win-properties') }
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

    // Print the entered command with the dynamic prompt prefix
    printLine(`<span class="tp">${getPromptText()}</span> ${val}`);

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
        printLine('  Diego Sansano Reboll - Contact Information', 'tk');
        printLine('--------------------------------------------------', 'th');
        printLine('<span class="tk">NAME:</span>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;Diego Sansano Reboll');
        printLine('<span class="tk">EMAIL:</span>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<a class="tlink" href="mailto:dsansano070403@gmail.com" target="_blank">dsansano070403@gmail.com</a>');
        printLine('<span class="tk">PHONE:</span>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;+34 673 205 292');
        printLine('<span class="tk">LOCATION:</span>&nbsp;&nbsp;Spain · Open to Remote &amp; Relocation');
        printLine('<span class="tk">LINKEDIN:</span>&nbsp;&nbsp;<a class="tlink" href="https://www.linkedin.com/in/diego-sansano-reboll/" target="_blank">linkedin.com/in/diego-sansano-reboll</a>');
        printLine('<span class="tk">ITCH.IO:</span>&nbsp;&nbsp;&nbsp;<a class="tlink" href="https://dsansano7.itch.io/" target="_blank">dsansano7.itch.io</a>');
        printLine('--------------------------------------------------', 'th');
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
        printLine(`'${trimmed}' is not recognized as an internal or external command.`);
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
      printLine(`  From:    ${mailData.email}`);
      printLine(`  Subject: ${mailData.subject}`);
      printLine(`  Message: ${mailData.body}`);
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
    const startMenuOpen = document.getElementById('start-menu').style.display !== 'none';
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
  window.matchMedia('(max-width:720px)').addEventListener('change', () => {});
}

/* ──────────────────────────────────────────────────────────────
   13. INIT
   ────────────────────────────────────────────────────────────── */
document.addEventListener('DOMContentLoaded', () => {
  // Register static windows
  ['win-about','win-toolkit','win-work','win-contact','win-properties','win-notepad','win-demoreel','win-game-runner','win-pdf-viewer'].forEach(id => {
    WindowManager.register(id);
  });

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
  initTerminalInteraction();
  initMobile();
  initAudioUnlocker();

  // Start clock immediately so it doesn't show default 12:00 placeholder
  startClock();

  // Boot
  runBoot();
});
