'use strict';

// ── Globals ───────────────────────────────────────────────────────────────────
const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

const state = { split: 50, toe: 0.0, camber: 0.0 };
let heroScale = reduced ? 1 : 1.12;
let rafId = null;

// DOM refs (populated on DOMContentLoaded)
const el = {};

// ── Utility ───────────────────────────────────────────────────────────────────
function tween(from, to, dur, ease, cb, done) {
  const t0 = performance.now();
  function step(t) {
    const p = Math.min(1, (t - t0) / dur);
    cb(from + (to - from) * (ease ? ease(p) : p));
    if (p < 1) requestAnimationFrame(step);
    else if (done) done();
  }
  requestAnimationFrame(step);
}

function cubicOut(p) { return 1 - Math.pow(1 - p, 3); }

function fmt(v) {
  const sign = v > 0 ? '+' : (v < 0 ? '−' : '±');
  return sign + Math.abs(v).toFixed(1) + '°';
}

// ── Grain ─────────────────────────────────────────────────────────────────────
function initGrain() {
  const grain = document.getElementById('grain');
  if (!grain) return;
  const c = document.createElement('canvas');
  c.width = c.height = 256;
  const ctx = c.getContext('2d');
  const d = ctx.createImageData(256, 256);
  for (let i = 0; i < d.data.length; i += 4) {
    const v = (Math.random() * 255) | 0;
    d.data[i] = d.data[i + 1] = d.data[i + 2] = v;
    d.data[i + 3] = 255;
  }
  ctx.putImageData(d, 0, 0);
  grain.style.backgroundImage = 'url(' + c.toDataURL() + ')';
  grain.style.backgroundSize = '256px 256px';
}

// ── Video ─────────────────────────────────────────────────────────────────────
function setupVideo() {
  const vid = el.heroVideo;
  if (!vid) return;
  vid.muted = true;
  vid.defaultMuted = true;
  vid.loop = false;
  let tries = 0;

  // Pick the right aspect ratio for the viewport: a 9:16 clip on phones,
  // the 16:9 clip on tablet/desktop. Chosen once so we never load both.
  const isMobile  = window.matchMedia('(max-width: 768px)').matches;
  const srcDesktop = vid.getAttribute('data-src-desktop') || 'media/hero-headlights.mp4';
  const srcMobile  = vid.getAttribute('data-src-mobile')  || srcDesktop;
  const baseSrc = isMobile ? srcMobile : srcDesktop;
  const sourceEl = vid.querySelector('source');
  if (sourceEl) { sourceEl.setAttribute('src', baseSrc); try { vid.load(); } catch (e) {} }

  // Matching still poster sits behind the video. The video starts transparent
  // and only fades in once it actually plays — so if autoplay is blocked
  // (iOS Low Power Mode, first load before interaction, reduced-motion), the
  // poster shows cleanly instead of a black frame or a native play button.
  const poster = document.getElementById('hero-poster');
  if (poster) {
    const pd = poster.getAttribute('data-src-desktop');
    const pm = poster.getAttribute('data-src-mobile');
    const psrc = isMobile ? (pm || pd) : pd;
    if (psrc && poster.getAttribute('src') !== psrc) poster.setAttribute('src', psrc);
  }

  let shown = false;
  function showVideo() {
    if (shown) return;
    shown = true;
    vid.style.opacity = '1';
  }
  vid.addEventListener('playing', showVideo);
  vid.addEventListener('timeupdate', function() { if (vid.currentTime > 0.05) showVideo(); });

  function tryPlay() {
    if (reduced) return;
    const p = vid.play();
    if (p && p.catch) p.catch(function() {});
  }

  function reload() {
    if (tries >= 6) return;
    tries++;
    if (sourceEl) sourceEl.setAttribute('src', baseSrc + '?r=' + tries);
    try { vid.load(); } catch (e) {}
    tryPlay();
  }

  vid.addEventListener('error', function() { setTimeout(reload, 600); }, true);
  vid.addEventListener('stalled', function() { setTimeout(reload, 800); });
  vid.addEventListener('loadeddata', function() { tries = 0; tryPlay(); });
  vid.addEventListener('canplay', tryPlay);
  setTimeout(function() { if (vid.readyState === 0) reload(); }, 1200);
  setTimeout(function() { if (vid.readyState === 0) reload(); }, 3000);

  // Retry the moment the user interacts — covers browsers that block autoplay
  // until a gesture. Listeners self-remove once the video is playing.
  function kick() {
    if (reduced) { detach(); return; }
    tryPlay();
    if (!vid.paused) detach();
  }
  function detach() {
    ['touchstart', 'pointerdown', 'click', 'scroll', 'keydown'].forEach(function(ev) {
      window.removeEventListener(ev, kick);
    });
  }
  ['touchstart', 'pointerdown', 'click', 'scroll', 'keydown'].forEach(function(ev) {
    window.addEventListener(ev, kick, { passive: true });
  });
  document.addEventListener('visibilitychange', function() {
    if (!document.hidden) tryPlay();
  });

  if (reduced) {
    try { vid.removeAttribute('autoplay'); vid.pause(); } catch (e) {}
  } else {
    tryPlay();
  }
}

// ── Hero intro ────────────────────────────────────────────────────────────────
function heroIntro() {
  if (!el.heroContent || reduced) return;
  const kids = Array.from(el.heroContent.querySelectorAll('[data-hero-rise]'));
  kids.forEach(function(k) {
    k.style.opacity = '0';
    k.style.transform = 'translateY(24px)';
    k.style.willChange = 'opacity, transform';
  });
  kids.forEach(function(k, i) {
    setTimeout(function() {
      k.style.transition = 'opacity 1s cubic-bezier(.16,.84,.33,1), transform 1s cubic-bezier(.16,.84,.33,1)';
      k.style.opacity = '1';
      k.style.transform = 'none';
    }, 130 + i * 130);
    setTimeout(function() { k.style.willChange = 'auto'; }, 1400 + i * 130);
  });
}

// ── Scroll handler ────────────────────────────────────────────────────────────
function applyScroll() {
  const doc = document.documentElement;
  const max = (doc.scrollHeight - doc.clientHeight) || 1;
  const y = window.scrollY;

  // Progress bar
  if (el.progressBar) {
    el.progressBar.style.width = Math.min(100, Math.max(0, (y / max) * 100)) + '%';
  }

  // Parallax background
  if (el.parallaxBg) {
    const s = heroScale;
    el.parallaxBg.style.transform = reduced
      ? 'scale(' + s + ')'
      : 'translate3d(0,' + (y * 0.18) + 'px,0) scale(' + s + ')';
  }

  // Hero content fade on scroll
  if (el.heroContent && !reduced) {
    const vh = window.innerHeight || 1;
    const p = Math.min(1, y / (vh * 0.92));
    el.heroContent.style.transform = 'translateY(' + (y * 0.12) + 'px)';
    el.heroContent.style.opacity = String(1 - p * 0.92);
  }

  // Car band horizontal drive drift
  if (el.carBand && el.carImg && !reduced) {
    const vh = window.innerHeight || 1;
    const r = el.carBand.getBoundingClientRect();
    const prog = ((vh / 2) - (r.top + r.height / 2)) / vh;
    const x = Math.max(-2, Math.min(2, prog * 2.5));
    el.carImg.style.transform = 'translateX(' + x + '%) scale(1.04)';
  }
}

function onScroll() {
  if (rafId) return;
  rafId = requestAnimationFrame(function() { rafId = null; applyScroll(); });
}

// ── Scroll reveals ────────────────────────────────────────────────────────────
function setupReveal() {
  const blocks = Array.from(document.querySelectorAll('[data-reveal]'));
  if (!('IntersectionObserver' in window) || reduced) {
    blocks.forEach(function(b) {
      b.style.opacity = '1';
      b.style.transform = 'none';
    });
    return;
  }

  blocks.forEach(function(b) {
    b.style.transition = 'opacity .9s cubic-bezier(.16,.84,.33,1), transform .9s cubic-bezier(.16,.84,.33,1)';
    b.style.opacity = '0';
    b.style.transform = 'translateY(26px)';
    b.querySelectorAll('h1,h2,h3,[data-wipe]').forEach(function(w) {
      w.style.clipPath = 'inset(0 0 108% 0)';
      w.style.willChange = 'clip-path';
    });
    b.querySelectorAll('[role="img"]').forEach(function(m) {
      m.style.clipPath = 'inset(0 0 100% 0)';
      m.style.willChange = 'clip-path';
    });
  });

  const revealed = new Set();

  function revealBlock(b) {
    if (revealed.has(b)) return;
    revealed.add(b);
    try { io.unobserve(b); } catch (e) {}

    b.style.opacity = '1';
    b.style.transform = 'none';

    b.querySelectorAll('h1,h2,h3,[data-wipe]').forEach(function(w, i) {
      const d = 0.08 + i * 0.09;
      w.style.transition = 'clip-path 1s cubic-bezier(.16,.84,.33,1) ' + d + 's';
      w.style.clipPath = 'inset(0 0 -12% 0)';
    });

    b.querySelectorAll('[role="img"]').forEach(function(m, i) {
      const d = 0.12 + i * 0.12;
      m.style.transition = 'clip-path 1.15s cubic-bezier(.16,.84,.33,1) ' + d + 's, transform .55s cubic-bezier(.16,.84,.33,1), box-shadow .55s ease';
      m.style.clipPath = 'inset(0 0 -2% 0)';
      scanSweep(m);
    });

    setTimeout(function() {
      b.querySelectorAll('h1,h2,h3,[data-wipe],[role="img"]').forEach(function(m) {
        m.style.clipPath = 'none';
        m.style.willChange = 'auto';
      });
    }, 1600);
  }

  const io = new IntersectionObserver(function(entries) {
    entries.forEach(function(en) { if (en.isIntersecting) revealBlock(en.target); });
  }, { threshold: 0, rootMargin: '0px 0px -80px 0px' });

  blocks.forEach(function(b) { io.observe(b); });

  // Failsafe: some mobile browsers can fail to fire the observer for tall or
  // lazily-laid-out blocks, leaving images permanently clip-path hidden. This
  // manually reveals any block that is actually on screen, so images can never
  // get stuck invisible. Below-the-fold blocks keep their scroll-in animation.
  function sweepVisible() {
    if (revealed.size === blocks.length) return;
    const vh = window.innerHeight || 0;
    blocks.forEach(function(b) {
      if (revealed.has(b)) return;
      const r = b.getBoundingClientRect();
      if (r.top < vh - 40 && r.bottom > -40) revealBlock(b);
    });
  }
  window.addEventListener('scroll', sweepVisible, { passive: true });
  window.addEventListener('resize', sweepVisible);
  window.addEventListener('load', function() { sweepVisible(); setTimeout(sweepVisible, 600); });
  setTimeout(sweepVisible, 400);
  setTimeout(sweepVisible, 1400);
}

function scanSweep(m) {
  if (reduced || typeof m.animate !== 'function') return;
  if (getComputedStyle(m).position === 'static') m.style.position = 'relative';
  m.style.overflow = 'hidden';
  const line = document.createElement('div');
  line.setAttribute('aria-hidden', 'true');
  line.style.cssText = 'position:absolute;left:0;right:0;top:0;height:2px;z-index:5;pointer-events:none;background:linear-gradient(90deg,transparent,var(--accent),transparent);box-shadow:0 0 14px rgba(58,110,165,.85);';
  m.appendChild(line);
  const h = Math.max(40, m.clientHeight - 2);
  const anim = line.animate([
    { transform: 'translateY(0px)', opacity: 0 },
    { opacity: 1, offset: 0.12 },
    { opacity: 1, offset: 0.88 },
    { transform: 'translateY(' + h + 'px)', opacity: 0 }
  ], { duration: 1150, delay: 350, easing: 'cubic-bezier(.4,0,.2,1)', fill: 'forwards' });
  anim.onfinish = function() { line.remove(); };
}

// ── Before/After slider ───────────────────────────────────────────────────────
function syncSliderWidth() {
  if (!el.sliderTrack) return;
  const w = el.sliderTrack.getBoundingClientRect().width;
  if (w) el.sliderTrack.style.setProperty('--slider-w', w + 'px');
}

function updateSplit(pct) {
  state.split = Math.max(0, Math.min(100, pct));
  if (el.beforePanel) el.beforePanel.style.width = state.split + '%';
  if (el.sliderHandle) el.sliderHandle.style.left = state.split + '%';
}

let sliderDragging = false;

function onSliderPointerDown(e) {
  sliderDragging = true;
  updateSplitFromEvent(e);
  e.preventDefault();
}

function updateSplitFromEvent(e) {
  if (!el.sliderTrack) return;
  const r = el.sliderTrack.getBoundingClientRect();
  updateSplit(((e.clientX - r.left) / r.width) * 100);
}

function nudgeSlider() {
  if (reduced) return;
  tween(0, 1, 1700, function(p) { return p; }, function(v) {
    updateSplit(50 + Math.sin(v * Math.PI * 2) * 8);
  });
}

// ── Alignment simulator ───────────────────────────────────────────────────────
let alignDrag = null; // { which: 'toe'|'camber', startX, startVal }

function updateSimDisplay() {
  const toe = state.toe;
  const camber = state.camber;
  const toeOk = Math.abs(toe) <= 0.30;
  const camOk = Math.abs(camber) <= 0.50;
  const allOk = toeOk && camOk;

  const okColor = 'var(--accent-soft)';
  const warnColor = '#C8A45C';

  if (el.toeVisual)    el.toeVisual.style.transform    = 'rotate(' + toe + 'deg)';
  if (el.camberVisual) el.camberVisual.style.transform = 'rotate(' + camber + 'deg)';
  if (el.toeDisplay)   el.toeDisplay.textContent = fmt(toe);
  if (el.camberDisplay) el.camberDisplay.textContent = fmt(camber);
  if (el.toeStat) {
    el.toeStat.textContent = toeOk ? 'OK' : 'OUT';
    el.toeStat.style.color = toeOk ? okColor : warnColor;
  }
  if (el.camStat) {
    el.camStat.textContent = camOk ? 'OK' : 'OUT';
    el.camStat.style.color = camOk ? okColor : warnColor;
  }
  if (el.statusDot) {
    el.statusDot.style.background = allOk ? okColor : warnColor;
    el.statusDot.style.boxShadow = '0 0 10px ' + (allOk ? okColor : warnColor);
  }
  if (el.statusText) {
    el.statusText.textContent = allOk ? 'In spec' : 'Out of spec';
    el.statusText.style.color = allOk ? okColor : warnColor;
  }
}

function onAlignPointerDown(which, e) {
  e.preventDefault();
  alignDrag = {
    which: which,
    startX: e.clientX,
    startVal: which === 'toe' ? state.toe : state.camber,
  };
}

function updateAlign(e) {
  if (!alignDrag) return;
  const dx = e.clientX - alignDrag.startX;
  let v = alignDrag.startVal + dx * 0.03;
  v = Math.max(-3, Math.min(3, v));
  v = Math.round(v * 10) / 10;
  if (alignDrag.which === 'toe') state.toe = v;
  else state.camber = v;
  updateSimDisplay();
}

// ── Init ──────────────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', function() {
  // Collect refs
  el.progressBar  = document.getElementById('progress-bar');
  el.parallaxBg   = document.getElementById('parallax-bg');
  el.scrollCue    = document.getElementById('scroll-cue');
  el.heroContent  = document.getElementById('hero-content');
  el.heroVideo    = document.getElementById('hero-video');
  el.carBand      = document.getElementById('car-band');
  el.carImg       = document.getElementById('car-img');
  el.sliderTrack  = document.getElementById('slider-track');
  el.beforePanel  = document.getElementById('before-panel');
  el.sliderHandle = document.getElementById('slider-handle');
  el.toeWheel     = document.getElementById('toe-wheel');
  el.camberWheel  = document.getElementById('camber-wheel');
  el.toeVisual    = document.getElementById('toe-visual');
  el.camberVisual = document.getElementById('camber-visual');
  el.toeDisplay   = document.getElementById('toe-display');
  el.camberDisplay = document.getElementById('camber-display');
  el.toeStat      = document.getElementById('toe-stat');
  el.camStat      = document.getElementById('cam-stat');
  el.statusDot    = document.getElementById('status-dot');
  el.statusText   = document.getElementById('status-text');
  el.resetBtn     = document.getElementById('reset-btn');

  // Grain
  initGrain();

  // Video
  setupVideo();

  // Scroll
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', syncSliderWidth);
  applyScroll();
  syncSliderWidth();

  // Reveals
  setupReveal();

  // Hero intro (timer-driven for frozen-paint robustness)
  heroIntro();

  // Hero zoom tween
  if (!reduced) {
    tween(1.12, 1, 1900, cubicOut, function(v) {
      heroScale = v;
      applyScroll();
    });
  }

  // Reduced-motion: pause animations
  if (reduced) {
    document.querySelectorAll('[data-anim-motion]').forEach(function(el) {
      el.style.animationPlayState = 'paused';
    });
    if (el.scrollCue) el.scrollCue.style.animationPlayState = 'paused';
  }

  // Before/After slider events
  if (el.sliderTrack) {
    el.sliderTrack.addEventListener('pointerdown', onSliderPointerDown);

    // Nudge when slider enters view
    if (!reduced && 'IntersectionObserver' in window) {
      const nudgeObs = new IntersectionObserver(function(entries) {
        entries.forEach(function(e) {
          if (e.isIntersecting) { nudgeSlider(); nudgeObs.disconnect(); }
        });
      }, { threshold: 0.45 });
      nudgeObs.observe(el.sliderTrack);
    }
  }

  // Simulator events
  if (el.toeWheel) {
    el.toeWheel.addEventListener('pointerdown', function(e) { onAlignPointerDown('toe', e); });
  }
  if (el.camberWheel) {
    el.camberWheel.addEventListener('pointerdown', function(e) { onAlignPointerDown('camber', e); });
  }
  if (el.resetBtn) {
    el.resetBtn.addEventListener('click', function() {
      state.toe = 0.0;
      state.camber = 0.0;
      updateSimDisplay();
    });
  }

  // Global pointer events
  window.addEventListener('pointermove', function(e) {
    if (sliderDragging) { e.preventDefault(); updateSplitFromEvent(e); }
    if (alignDrag)       { e.preventDefault(); updateAlign(e); }
  }, { passive: false });

  window.addEventListener('pointerup', function() {
    sliderDragging = false;
    alignDrag = null;
  });

  window.addEventListener('pointercancel', function() {
    sliderDragging = false;
    alignDrag = null;
  });
});
