/* ============================================================
   TrueSight — the reveal engine.
   The brand made literal: ciphertext resolves into truth.
   - headings scramble-decode (random glyphs → real text)
   - blocks resolve out of a noise/dot state (replaces the fade)
   - an optional pinned canvas showcase: a field of points that
     coalesces into a wordmark, then hands off to the live UI
   Honest by construction: degrades to plain visible content with
   no JS and under prefers-reduced-motion.
   Shared by Design 2 (Codex) and Design 3 (Palantir).
   ============================================================ */
(function () {
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const GLYPHS = '01<>/\\[]{}=+*#%&$ABCDEF0123456789ﬀﬁ▚▞░▒█·:;';
  const rndGlyph = () => GLYPHS[(Math.random() * GLYPHS.length) | 0];

  /* ── 1 · scramble-decode ───────────────────────────────────
     Resolves a string left→right: each character settles in turn
     while the unsettled tail keeps cycling random glyphs. */
  function decode(el, opts) {
    const finalText = (el.getAttribute('data-final') || el.textContent).replace(/\s+/g, ' ');
    if (reduce) { el.textContent = finalText; el.classList.add('ts-decoded'); return; }
    const chars = [...finalText];
    const speed = opts && opts.speed ? opts.speed : 1;
    // Accessibility: the element keeps its real text for assistive tech for the
    // whole animation — only the visual glyph run is swapped, and it is hidden.
    el.setAttribute('aria-label', finalText);
    el.setAttribute('role', el.getAttribute('role') || 'text');
    // frames-per-char tuned slower for that "resolving" feel
    let settled = 0;
    let frame = 0;
    const perChar = 2.4 / speed;        // how many frames before a char locks
    el.classList.add('ts-decoding');
    function tick() {
      frame++;
      settled = Math.floor(frame / perChar);
      if (settled > chars.length) settled = chars.length;
      let out = '';
      for (let i = 0; i < chars.length; i++) {
        if (chars[i] === ' ') { out += ' '; continue; }
        if (i < settled) out += chars[i];
        else out += `<span class="ts-cipher" aria-hidden="true">${rndGlyph()}</span>`;
      }
      el.innerHTML = out;
      if (settled < chars.length) requestAnimationFrame(tick);
      else { el.textContent = finalText; el.removeAttribute('aria-label'); el.classList.remove('ts-decoding'); el.classList.add('ts-decoded'); }
    }
    requestAnimationFrame(tick);
  }

  // tag + observe decode targets (no HTML edits needed)
  function armDecode(root) {
    root = root || document;
    // explicit opt-ins + every section/feature/card heading across the page —
    // TrueSight decryption is the transition for everything, not the blur.
    const explicit = [...root.querySelectorAll('[data-ts-decode], .ts-decode')];
    const headings = [...root.querySelectorAll('h2, h3')].filter((el) =>
      !el.closest('nav, footer, .term-body, .curtain') &&
      !(el.closest('.hero') && el.tagName === 'H1')
    );
    const seen = new Set();
    const targets = [...explicit, ...headings].filter((el) => {
      if (seen.has(el)) return false; seen.add(el); return true;
    });
    if (!targets.length) return;
    targets.forEach((el) => { el.setAttribute('data-final', el.textContent); el.classList.add('ts-pending'); });
    const io = new IntersectionObserver((ents) => {
      ents.forEach((e) => {
        if (!e.isIntersecting) return;
        io.unobserve(e.target);
        e.target.classList.remove('ts-pending');
        const delay = parseInt(e.target.getAttribute('data-ts-delay') || '0', 10);
        setTimeout(() => decode(e.target, { speed: e.target.getAttribute('data-ts-speed') || 1 }), delay);
      });
    }, { rootMargin: '0px 0px -12% 0px', threshold: 0.2 });
    targets.forEach((el) => io.observe(el));
  }

  /* ── 2 · resolve-from-noise blocks ────────────────────────── */
  function armReveal(root) {
    const targets = [...(root || document).querySelectorAll('.ts')].filter((el) => !el.classList.contains('ts-armed'));
    if (!targets.length) return;
    const io = new IntersectionObserver((ents) => {
      ents.forEach((e) => { if (e.isIntersecting) { e.target.classList.add('ts-in'); io.unobserve(e.target); } });
    }, { rootMargin: '0px 0px -6% 0px', threshold: 0.04 });
    targets.forEach((el) => { el.classList.add('ts-armed'); io.observe(el); });
  }

  /* ── 3 · pinned point-cloud showcase ──────────────────────── */
  function initShowcase(stage) {
    const canvas = stage.querySelector('canvas');
    const pin = stage.querySelector('.ts-pin');
    if (!canvas || !pin) return;
    const ctx = canvas.getContext('2d');
    const word = stage.getAttribute('data-word') || 'WYRD';
    let dpr = Math.min(window.devicePixelRatio || 1, 2);
    let W = 0, H = 0, targets = [], pts = [], inkColor = '#0d0d0d';

    function readInk() {
      const c = getComputedStyle(stage).getPropertyValue('--ts-ink').trim();
      if (c) inkColor = c;
    }

    function sampleTargets() {
      // render the word to an offscreen canvas, sample ink pixels as target points
      const off = document.createElement('canvas');
      const ow = 1000, oh = 360; off.width = ow; off.height = oh;
      const o = off.getContext('2d');
      o.fillStyle = '#000'; o.fillRect(0, 0, ow, oh);
      o.fillStyle = '#fff';
      o.textAlign = 'center'; o.textBaseline = 'middle';
      let fs = 300; o.font = `700 ${fs}px Geist, sans-serif`;
      while (o.measureText(word).width > ow * 0.9 && fs > 40) { fs -= 10; o.font = `700 ${fs}px Geist, sans-serif`; }
      o.fillText(word, ow / 2, oh / 2);
      const data = o.getImageData(0, 0, ow, oh).data;
      const step = 5; targets = [];
      for (let y = 0; y < oh; y += step) {
        for (let x = 0; x < ow; x += step) {
          if (data[(y * ow + x) * 4] > 128) targets.push({ x: x / ow, y: y / oh });
        }
      }
    }

    function resize() {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      W = pin.clientWidth; H = pin.clientHeight;
      canvas.width = W * dpr; canvas.height = H * dpr;
      canvas.style.width = W + 'px'; canvas.style.height = H + 'px';
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      buildPoints();
    }

    function buildPoints() {
      if (!targets.length) sampleTargets();
      const n = targets.length;
      const boxW = Math.min(W * 0.74, 920), boxH = boxW * 0.36;
      const ox = (W - boxW) / 2, oy = (H - boxH) / 2;
      if (pts.length !== n) {
        pts = new Array(n);
        for (let i = 0; i < n; i++) {
          pts[i] = {
            // start: scattered noise across the whole stage
            nx: Math.random() * W, ny: Math.random() * H,
            // target: the sampled wordmark
            tx: ox + targets[i].x * boxW, ty: oy + targets[i].y * boxH,
            r: 0.65 + Math.random() * 1.15,
            j: Math.random() * Math.PI * 2,
          };
        }
      } else {
        for (let i = 0; i < n; i++) { pts[i].tx = ox + targets[i].x * boxW; pts[i].ty = oy + targets[i].y * boxH; }
      }
    }

    // progress 0..1 across the pinned scroll
    let progress = 0;
    function onScroll() {
      const r = stage.getBoundingClientRect();
      const total = stage.offsetHeight - pin.clientHeight;
      const p = total > 0 ? (-r.top) / total : 0;
      progress = Math.max(0, Math.min(1, p));
      stage.style.setProperty('--ts-p', progress.toFixed(3));
      // caption stage switching
      const cap = Math.min(2, Math.floor(progress * 3));
      stage.querySelectorAll('.ts-cap').forEach((c, i) => c.classList.toggle('on', i === cap));
      stage.classList.toggle('ts-verified', progress > 0.82);
    }

    let raf;
    function draw() {
      ctx.clearRect(0, 0, W, H);
      // ease: noise (0) → coalesced (1)
      const e = progress < 0.85 ? (progress / 0.85) : 1;
      const ease = e < 0.5 ? 2 * e * e : 1 - Math.pow(-2 * e + 2, 2) / 2;
      const t = performance.now() / 1000;
      const scatter = 1 - ease;
      ctx.fillStyle = inkColor;
      for (let i = 0; i < pts.length; i++) {
        const p = pts[i];
        const jx = Math.cos(t * 0.6 + p.j) * scatter * 14;
        const jy = Math.sin(t * 0.7 + p.j) * scatter * 14;
        const x = p.nx + (p.tx - p.nx) * ease + jx;
        const y = p.ny + (p.ty - p.ny) * ease + jy;
        const a = 0.18 + ease * 0.72;
        ctx.globalAlpha = a;
        ctx.beginPath(); ctx.arc(x, y, p.r, 0, 6.283); ctx.fill();
      }
      ctx.globalAlpha = 1;
      raf = requestAnimationFrame(draw);
    }

    readInk();
    if (reduce) {
      // static resolved state
      stage.classList.add('ts-verified');
      stage.style.setProperty('--ts-p', '1');
      resize(); progress = 1; draw(); setTimeout(() => cancelAnimationFrame(raf), 60);
      return;
    }
    const ro = new ResizeObserver(resize); ro.observe(pin);
    window.addEventListener('scroll', onScroll, { passive: true });
    resize(); onScroll(); draw();
  }

  function boot() {
    armDecode(document);
    armReveal(document);
    document.querySelectorAll('.ts-stage').forEach(initShowcase);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();

  window.TrueSight = { decode, armDecode, armReveal };
})();
