/* =====================================================================
   TURNING POINT — page behaviour
   1. builds the text, menu and panels from js/content.js
   2. runs the opening sequence (pattern grows, title fades in in place,
      then text and menu)
   3. lays the pattern out as stacked "layers" (strips) on the grid
   4. opens sections in place (hash routing: #explore, #structure …)
   ===================================================================== */
(function () {
  "use strict";

  // ?draft — preview unsaved edits from the editor (admin/), kept in this browser only
  let SITE = window.SITE;
  const isDraft = /[?&]draft\b/.test(location.search);
  if (isDraft) {
    try { const d = localStorage.getItem("tp-draft"); if (d) SITE = JSON.parse(d); } catch (e) { /* fall back to published content */ }
  }
  const root = document.documentElement;
  // Motion speeds, from --speed and --pattern-speed at the top of css/style.css
  // (1 = as built, 0.5 = half as fast). T(ms): a duration at the current speed.
  const cssNum = (name, d) => { const v = parseFloat(getComputedStyle(root).getPropertyValue(name)); return v > 0 ? v : d; };
  const SPEED = cssNum("--speed", 1), PSPEED = cssNum("--pattern-speed", 1);
  const T = ms => ms / SPEED;
  const $ = (s, el = document) => el.querySelector(s);
  const frame = $("#frame"), canvas = $("#pattern"), stage = $("#stage"),
        sliver = $("#sliver"), side = $("#side"), sideHot = $("#sideHot"),
        titleEl = $("#title"), introEl = $("#intro"),
        navEl = $("#nav"), navList = $("#navList"), panel = $("#panel"), metaEl = $("#meta");

  const mqMobile = matchMedia("(max-width: 820px)");
  const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const ROMAN = ["i", "ii", "iii", "iv", "v", "vi", "vii", "viii", "ix", "x"];
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  const lerp = (a, b, t) => a + (b - a) * t;
  // fast out of the blocks, a slight overshoot, then settled (the strips' slide)
  const snapOut = t => { const c = 1.25; return 1 + (c + 1) * Math.pow(t - 1, 3) + c * Math.pow(t - 1, 2); };
  const easeInOut = t => t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
  const smooth = (a, b, x) => { const t = clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };
  const esc = s => String(s == null ? "" : s).replace(/"/g, "&quot;");

  /* Pattern density: 1 = original grain; 1.2 = 20% denser */
  let DENSITY = 1.3;
  // try another value without editing: …/index.html?density=1.4
  { const q = parseFloat(new URLSearchParams(location.search).get("density")); if (q > 0.3 && q < 4) DENSITY = q; }
  // phones: past ~1.5 the cuts get too thin to read on a small screen, and the grid gets heavy
  const DENSITY_PHONE_MAX = 1.5;

  /* =====================================================================
     1. Build static text
     ===================================================================== */
  if (isDraft) {
    const b = document.createElement("a");
    b.href = "admin/index.html"; b.className = "draft-badge"; b.textContent = "Draft preview — not published";
    document.body.appendChild(b);
  }
  document.title = `${SITE.title} — ${SITE.meta}`;

  const titleLink = $("#homeLink");
  titleLink.innerHTML = [...SITE.title].map((c, i) =>
    `<span class="ch" style="--i:${i}">${c === " " ? "&nbsp;" : c}</span>`).join("");

  metaEl.innerHTML = `<span class="meta__place">${SITE.meta || ""}</span>` +
    (SITE.socials || []).map(s => `<span class="sep">·</span><a href="${esc(s.url)}" target="_blank" rel="noopener">${s.label}</a>`).join("");

  introEl.innerHTML = (SITE.intro || []).map((p, i) => `<p style="--p:${i}">${p}</p>`).join("");

  const roll = txt => `<span class="roll">${[...txt].map((c, i) =>
    `<span class="ch" style="--i:${i}">${c}</span>`).join("")}</span>`;
  navList.innerHTML = SITE.sections.map((s, i) =>
    `<a class="nav__item" href="#${s.id}" data-go="${s.id}" style="--n:${i}">` +
    `<span class="nav__num">${ROMAN[i]}</span>${roll(s.label)}</a>`).join("");

  /* =====================================================================
     2. Pattern engine
     ===================================================================== */
  const rd = new TurningPattern(canvas, { texture: "assets/img/texture.jpg", texturePx: 760 });
  if (!rd.ok) root.classList.add("no-webgl");
  // theme: <html data-theme="mono"> (black and white on paper) or "color".
  // Try the other one without editing: …/index.html?theme=color
  const MONO = root.dataset.theme !== "color";

  // The layer behind is a pre-rendered, seamless tile (assets/img/pattern-tile.png)
  // shown by CSS (#bgpat) — it costs nothing at runtime. JS only places it.
  const bgEl = $("#bgpat");
  rd.onTexture = () => requestRender();

  const S = {
    started: false,
    simTarget: 6600,
    fast: false,
    single: 0, singleT: 0,   // phones: layers merge into one band when a section is open
    gap: 0, gapT: 0,
    fill: 0, fillT: 0,
    twistIntro: 0, twistIntroT: 0,
    ptr: 0, ptrT: 0,
    ptrY: 0, ptrYT: 0,
    scroll: 0, scrollT: 0,
    turn: 0, turnT: 0,
    strips: [],
    busyUntil: 0,
    dirty: true
  };
  const N_DESKTOP = 6, N_MOBILE = 5;
  const makeStrips = (n, p = 0) => Array.from({ length: n }, () => ({ p, from: p, to: p, t0: 0, dur: 1, delay: 0 }));
  S.strips = makeStrips(N_DESKTOP);

  function placeCanvas() {
    const mobile = mqMobile.matches;
    const host = mobile ? stage : frame;
    if (canvas.parentNode !== host) host.prepend(canvas);
    if (bgEl && bgEl.nextElementSibling !== canvas) host.insertBefore(bgEl, canvas);   // the layer behind sits under the canvas
    const n = mobile ? N_MOBILE : N_DESKTOP;
    if (n !== S.strips.length) {
      const p = (!mobile && current) ? 1 : 0;
      S.strips = makeStrips(n, p);
    }
    rd.ok && rd.resize();
    placeBg();
    placeWraps();
  }

  function startSim() {
    if (!rd.ok || S.started) return;
    const r = stage.getBoundingClientRect();
    const cell = clamp(r.width / 480, 1.6, 3.2) / (mqMobile.matches ? Math.min(DENSITY, DENSITY_PHONE_MAX) : DENSITY);
    const W = Math.min(800, Math.round(r.width / cell)), H = Math.min(800, Math.round(r.height / cell));
    if (!rd.start(Math.max(64, W), Math.max(64, H), cell)) { root.classList.add("no-webgl"); return; }
    S.started = true;
    S.seedPhase = 0;
    kick();
  }

  // spiral seeding: three arms that turn outwards from the centre
  function seedSpiral() {
    const s = rd.steps, W = rd.W, H = rd.H;
    const ARM_STEPS = 900;
    if (s < ARM_STEPS) {
      const t = s / ARM_STEPS;
      const R = t * Math.hypot(W, H) * .62;
      const a0 = t * Math.PI * 2.6;
      for (let k = 0; k < 3; k++) {
        const a = a0 + k * Math.PI * 2 / 3;
        rd.seed(W / 2 + Math.cos(a) * R, H / 2 + Math.sin(a) * R, 2.6 + t * 1.4, 1);
      }
    } else if (s < 2400) {
      for (let k = 0; k < 3; k++) {
        const i = ++S.seedPhase, ang = i * 2.39996, r = Math.sqrt(i / 120) * .5 * Math.hypot(W, H);
        rd.seed(((W / 2 + Math.cos(ang) * r) % W + W) % W, ((H / 2 + Math.sin(ang) * r) % H + H) % H, 2.5, 1);
      }
    }
  }

  /* --------------------------------------------------------------------
     Strip layout
     desktop: stage (cols 1–2) ⇄ right-edge sliver, per-strip progress p
     phones : stage; with a section open the layers merge into one top band
     -------------------------------------------------------------------- */
  function relRect(el) {
    const c = canvas.getBoundingClientRect(), r = el.getBoundingClientRect();
    return { x: r.left - c.left, y: r.top - c.top, w: r.width, h: r.height };
  }

  /* The rows are cut into blocks on a grid of squares: squares, rectangles
     (two squares across or down) and L shapes (three squares, over two rows),
     with no gaps between them. Every square is subdivided into TILE_SUB ×
     TILE_SUB smaller squares, and TILE_EMPTY of those are left out: bitten out
     of the area's edges, bar a few in the middle (shapeMask). Blocks are the steel texture at different zooms (above 1 =
     the pattern drawn smaller, so denser), except two drawn as ink outlines.
     Each block travels its own distance with the mouse (k). On wide screens
     two more blocks step out of the column to the right: an outline block
     beside the top row and a steel block beside the second-last row (the
     intro text wraps round them). The right-hand strip is cut the same way.
     The plan is drawn anew on each visit and then stays put. */
  const TILE_ZOOMS = [1, 1, 1, 1.5, 2, 2.4];
  const TILE_GAP = 0;                                     // gaps between blocks, × the original row gap
  const TILE_SUB = 2;                                     // each square → TILE_SUB × TILE_SUB smaller squares
  const TILE_EMPTY = .3;                                  // share of the smaller squares left empty
  const TILE_INNER = [2, 3];                              // how many of those sit in the middle (min, max); the rest bite into the edges
  const PLAN_SEED = (Math.random() * 4294967296) >>> 0;   // a new arrangement on each visit
  const planRng = key => {
    let s = PLAN_SEED;
    for (const ch of key) s = (Math.imul(s ^ ch.charCodeAt(0), 2654435761) + 1013904223) >>> 0;
    return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296);
  };
  // which of a block part's smaller squares are kept: exactly TILE_EMPTY of them go
  function holes(R, cols, rows) {
    const n = cols * rows, keep = new Array(n).fill(true), idx = [...Array(n).keys()];
    for (let i = n - 1; i > 0; i--) { const j = Math.floor(R() * (i + 1)); [idx[i], idx[j]] = [idx[j], idx[i]]; }
    for (let i = 0; i < Math.round(n * TILE_EMPTY); i++) keep[idx[i]] = false;
    return keep;
  }
  /* The pattern area's outline: the empty squares are bitten out of its edges,
     each bite likelier beside an earlier one and unlikelier the deeper it goes,
     so the area takes a different ragged shape each visit; TILE_INNER more are
     scattered singly in the middle. Returns rows of booleans: true = kept. */
  function shapeMask(R, cols, rows) {
    const keep = Array.from({ length: rows }, () => new Array(cols).fill(true));
    const depth = (i, j) => Math.min(i, j, cols - 1 - i, rows - 1 - j);
    const gone = (i, j) => i < 0 || j < 0 || i >= cols || j >= rows || !keep[j][i];
    const total = Math.round(cols * rows * TILE_EMPTY);
    const inner = Math.min(total, TILE_INNER[0] + Math.floor(R() * (TILE_INNER[1] - TILE_INNER[0] + 1)));
    for (let k = 0; k < total - inner; k++) {
      let sum = 0; const cand = [];
      for (let j = 0; j < rows; j++) for (let i = 0; i < cols; i++) {
        if (!keep[j][i]) continue;
        const open = gone(i - 1, j) + gone(i + 1, j) + gone(i, j - 1) + gone(i, j + 1);
        if (!open) continue;                              // only squares on the current outline
        const w = (1 + open) / Math.pow(1 + depth(i, j), 2.2);
        cand.push([i, j, w]); sum += w;
      }
      let x = R() * sum, pick = cand[cand.length - 1];
      for (const c of cand) { x -= c[2]; if (x <= 0) { pick = c; break; } }
      keep[pick[1]][pick[0]] = false;
    }
    // a few single holes in the middle, apart from each other and from the bites
    const deep = Math.max(2, Math.floor(Math.min(cols, rows) / 4));
    for (let k = 0, tries = 0; k < inner && tries < 400; tries++) {
      const i = Math.floor(R() * cols), j = Math.floor(R() * rows);
      if (depth(i, j) < deep || !keep[j][i]) continue;
      let clear = true;
      for (let b = -1; b <= 1; b++) for (let a = -1; a <= 1; a++) if (gone(i + a, j + b)) clear = false;
      if (!clear) continue;
      keep[j][i] = false; k++;
    }
    return keep;
  }
  const withHoles = (R, q) => Object.assign(q, { keep: holes(R, q.cw * TILE_SUB, q.rh * TILE_SUB) });
  const gridPlans = {};
  function gridPlan(rows, units, extras) {
    const key = rows + ":" + units + ":" + extras;
    if (gridPlans[key]) return gridPlans[key];
    const R = planRng("grid" + key);
    const used = Array.from({ length: rows }, () => new Array(units).fill(false));
    const free = (r, c) => r >= 0 && r < rows && c >= 0 && c < units && !used[r][c];
    const H = (c, r) => ({ c, r, cw: 2, rh: 1 }), V = (c, r) => ({ c, r, cw: 1, rh: 2 }), Q = (c, r) => ({ c, r, cw: 1, rh: 1 });
    const blocks = [];
    for (let r = 0; r < rows; r++) for (let c = 0; c < units; c++) {
      if (!free(r, c)) continue;
      const right = free(r, c + 1), down = free(r + 1, c), x = R();
      let parts = null;
      if (x < .22) {                                      // L shapes, whichever way fits
        const fits = [];
        if (right && down) fits.push([H(c, r), V(c, r)]);
        if (right && free(r + 1, c + 1)) fits.push([H(c, r), V(c + 1, r)]);
        if (down && free(r + 1, c + 1)) fits.push([V(c, r), H(c, r + 1)]);
        if (down && free(r + 1, c - 1)) fits.push([V(c, r), H(c - 1, r + 1)]);
        if (fits.length) parts = fits[Math.floor(R() * fits.length)];
      }
      if (!parts && x < .46 && right) parts = [H(c, r)];
      if (!parts && x < .58 && down) parts = [V(c, r)];
      if (!parts) parts = [Q(c, r)];
      for (const q of parts) for (let i = 0; i < q.cw; i++) for (let j = 0; j < q.rh; j++) used[q.r + j][q.c + i] = true;
      const zoom = TILE_ZOOMS[Math.floor(R() * TILE_ZOOMS.length)];
      blocks.push({ row: r, parts, style: 0, zoom, k: (.55 + R() * 1.1) / Math.sqrt(zoom) });
    }
    // which smaller squares are empty: decided over the whole area, not block by block
    const mask = shapeMask(R, units * TILE_SUB, rows * TILE_SUB);
    for (const b of blocks) for (const q of b.parts) {
      const cols = q.cw * TILE_SUB, rws = q.rh * TILE_SUB;
      q.keep = Array.from({ length: cols * rws }, (_, t) => mask[q.r * TILE_SUB + Math.floor(t / cols)][q.c * TILE_SUB + t % cols]);
    }
    // two outline blocks in all: one in the column plus the one beside it on wide screens
    const outlines = extras ? 1 : 2, pick = [...blocks.keys()];
    for (let i = 0; i < outlines && pick.length; i++) {
      const b = blocks[pick.splice(Math.floor(R() * pick.length), 1)[0]];
      b.style = 1; b.zoom = Math.min(b.zoom, 1.5);       // fine outlines turn to noise when very small
    }
    if (extras) {
      // dx: these sit past the simulated area's edge, where the pattern is sparse, so
      // they borrow the pattern from inside the column (dx, dy: fractions of its size)
      blocks.push({ row: 0, parts: [withHoles(R, Q(units, 0))], style: 1, zoom: 1.5, k: .8, dx: -.55, dy: .5 });
      blocks.push({ row: rows - 2, parts: [withHoles(R, Q(units, rows - 2))], style: 0, zoom: 1.5, k: 1.25, dx: -.4 });
    }
    return (gridPlans[key] = blocks);
  }
  const gridUnits = (w, h, gap) => clamp(Math.round((w + gap) / (h + gap)), 2, 8);
  // the right-hand strip: each row is a run of squares, subdivided and thinned the same way
  const sliverPlans = {};
  function sliverPlan(rows, units) {
    const key = rows + ":" + units;
    if (sliverPlans[key]) return sliverPlans[key];
    const R = planRng("sliver" + key);
    return (sliverPlans[key] = Array.from({ length: rows }, () => holes(R, units * TILE_SUB, TILE_SUB)));
  }
  // push one part as its kept smaller squares
  // clip: [left, right] edges beyond which nothing is drawn (the active area)
  function pushSub(rects, x, y, w, h, keep, cols, rows, base, clip) {
    const cw = w / cols, ch = h / rows;
    for (let j = 0; j < rows; j++) for (let i = 0; i < cols; i++) {
      if (!keep[j * cols + i]) continue;
      // round the edges to whole pixels so neighbouring squares meet without seams
      let x0 = Math.round(x + i * cw), x1 = Math.round(x + (i + 1) * cw);
      const y0 = Math.round(y + j * ch), y1 = Math.round(y + (j + 1) * ch);
      if (clip) { x0 = Math.max(x0, clip[0]); x1 = Math.min(x1, clip[1]); if (x1 <= x0) continue; }
      rects.push(Object.assign({ x: x0, y: y0, w: x1 - x0, h: y1 - y0 }, base));
    }
  }

  function layout() {
    if (!rd.ok || !S.started) return [];
    const mobile = mqMobile.matches;
    const home = relRect(stage);
    if (home.h < 1 || home.w < 1) return [];
    const n = S.strips.length, mid = (n - 1) / 2;
    const gapPx = S.gap * clamp(home.h * .0056, 2.5, 6) * TILE_GAP;
    const sh = (home.h - gapPx * (n - 1)) / n;
    const twist = S.twistIntro * 14 + S.ptr * 26;
    const px = S.ptr * 34, py = S.ptrY * 20;     // the steel layer follows the mouse
    const rects = [], sliverRects = [];
    const oxHome = d => -home.x + px + twist * d + S.turn * (1 + d * .12) + S.scroll * (.16 + d * .03);
    const oxSliver = d => -home.x + twist * d * 1.6 + S.turn * (1 - d * .12) - S.scroll * .1;

    // each row: where it is, how far it has slid away, and its pattern offset
    const rows = [];
    let g = gapPx, clip = null;
    if (mobile) {
      // the first layer grows to fill the band while the others fold away
      const q = S.single, w = i => (i === 0 ? 1 : 1 - q);
      let sumW = 0; for (let i = 0; i < n; i++) sumW += w(i);
      g = gapPx * (1 - q);
      const usable = home.h - g * (n - 1);
      let y = home.y;
      for (let i = 0; i < n; i++) {
        const h = usable * w(i) / sumW;
        rows.push({ y, h, shift: 0, ox: oxHome(i - mid * (1 - q)), oy: -home.y + py, m: 1, on: h > .5 });
        y += h + g;
      }
    } else {
      const sv = relRect(sliver);
      const su = Math.max(1, Math.round(sv.w / sh)), plan = sliverPlan(n, su);
      clip = [Math.round(home.x), Math.round(sv.x + sv.w)];   // rows sliding away are cut at the active area's edges
      for (let i = 0; i < n; i++) {
        const d = i - mid, y = home.y + i * (sh + gapPx);
        pushSub(sliverRects, sv.x, y, sv.w, sh, plan[i], su * TILE_SUB, TILE_SUB, { ox: oxSliver(d), oy: -home.y });
        const p = easeInOut(S.strips[i].p);
        // the plate slides out to the left, carrying its pattern with it
        const shift = p * (home.w + sh + 60);
        rows.push({ y, h: sh, shift, ox: oxHome(d) + shift, oy: -home.y + py * (1 - p), m: 1 - p, on: p <= .999 });
      }
    }
    const units = gridUnits(home.w, sh, gapPx);
    const uw = (home.w - gapPx * (units - 1)) / units;
    for (const b of gridPlan(n, units, !mobile)) {
      const row = rows[b.row];                   // a block moves with the row it starts in
      if (!row.on) continue;
      for (const q of b.parts) {
        const a = rows[q.r], z = rows[q.r + q.rh - 1];
        if (!a.on) continue;
        pushSub(rects, home.x + q.c * (uw + gapPx) - row.shift, a.y, q.cw * (uw + gapPx) - gapPx, z.y + z.h - a.y,
          q.keep, q.cw * TILE_SUB, q.rh * TILE_SUB,
          { ox: row.ox + px * row.m * (b.k - 1) + (b.dx || 0) * home.w, oy: row.oy + py * row.m * (b.k - 1) + (b.dy || 0) * home.h, style: b.style, zoom: b.zoom }, clip);
      }
    }
    return rects.concat(sliverRects);            // the strip last, so it draws in a batch of its own
  }

  // the intro text makes room for the two blocks that step out of the column
  function placeWraps() {
    let w = introEl.querySelectorAll("i.wrap");
    if (!w.length) {
      introEl.insertAdjacentHTML("afterbegin", '<i class="wrap"></i><i class="wrap"></i><i class="wrap"></i>');
      w = introEl.querySelectorAll("i.wrap");
    }
    const set = (el, wd, ht) => { el.style.width = Math.max(0, wd) + "px"; el.style.height = Math.max(0, ht) + "px"; };
    const s = stage.getBoundingClientRect(), t = introEl.getBoundingClientRect();
    if (mqMobile.matches || s.height < 1) { w.forEach(el => set(el, 0, 0)); introEl.style.setProperty("--lead-in", "0px"); return; }
    const n = S.strips.length, g = clamp(s.height * .0056, 2.5, 6) * TILE_GAP, sh = (s.height - g * (n - 1)) / n;
    const units = gridUnits(s.width, sh, g), uw = (s.width - g * (units - 1)) / units;
    const top = t.top + parseFloat(getComputedStyle(introEl).paddingTop) - introEl.scrollTop;
    const wd = s.right + g + uw - t.left + 16, pad = 10;
    const hA = Math.max(0, s.top + sh + pad - top);
    const yB = s.top + (n - 2) * (sh + g) - pad;
    introEl.style.setProperty("--lead-in", Math.max(0, wd) + "px");   // the lead paragraph starts right of the top block
    set(w[0], wd, hA);
    set(w[1], 0, yB - top - hA);
    set(w[2], wd, sh + 2 * pad);
  }

  // the layer behind fills the content area — from the left edge to the right
  // strip, between the top and bottom of the strips. It never moves; the
  // opacity falls off across the gutter so it is fainter behind the text.
  function placeBg() {
    if (!bgEl) return;
    if (mqMobile.matches) { bgEl.style.cssText = ""; return; }
    const r = relRect(stage), sv = relRect(sliver), t = relRect(introEl);
    bgEl.style.left = r.x + "px";
    bgEl.style.top = r.y + "px";
    bgEl.style.width = Math.max(0, sv.x - 4 - r.x) + "px";
    bgEl.style.height = r.h + "px";
    bgEl.style.setProperty("--ramp-a", r.w + "px");
    bgEl.style.setProperty("--ramp-b", Math.max(r.w + 1, t.x - r.x + 8) + "px");
  }

  /* --------------------------------------------------------------------
     Animation loop (runs only while something moves)
     -------------------------------------------------------------------- */
  let raf = 0, last = 0;
  function kick() { if (!raf) { last = performance.now(); raf = requestAnimationFrame(tick); } }
  function requestRender() { S.dirty = true; kick(); }
  function busy(ms) { S.busyUntil = Math.max(S.busyUntil, performance.now() + ms); kick(); }

  function approach(key, rate, dt) {
    const t = S[key + "T"], v = S[key];
    const nv = v + (t - v) * (1 - Math.exp(-rate * dt));
    S[key] = Math.abs(t - nv) < 1e-3 ? t : nv;
    return S[key] !== v;
  }

  function tick(now) {
    raf = 0;
    const dt = Math.min(.05, (now - last) / 1000); last = now;
    let moving = false, simming = false;

    if (S.started && rd.steps < S.simTarget) {
      seedSpiral();
      // time-based pacing (~4200 steps/s), capped so slow GPUs stay responsive
      const n = S.fast ? 160 : clamp(Math.round(4200 * PSPEED * dt), 8, 140);
      rd.step(Math.min(n, S.simTarget - rd.steps));
      simming = true;
    }

    moving = approach("gap", 8 * SPEED, dt) || moving;
    moving = approach("fill", 2.4 * SPEED, dt) || moving;
    moving = approach("twistIntro", 4.5 * SPEED, dt) || moving;
    moving = approach("ptr", 4.5 * PSPEED, dt) || moving;
    moving = approach("ptrY", 4.5 * PSPEED, dt) || moving;
    moving = approach("scroll", 10 * PSPEED, dt) || moving;
    moving = approach("turn", 5.5 * PSPEED, dt) || moving;
    moving = approach("single", 8 * SPEED, dt) || moving;

    S.strips.forEach(s => {
      if (s.p === s.to) return;
      const t = clamp((now - s.t0 - s.delay) / s.dur, 0, 1);
      s.p = t >= 1 ? s.to : lerp(s.from, s.to, snapOut(t));
      moving = true;
    });

    if (simming || moving || S.dirty || now < S.busyUntil) {
      if (rd.ok && S.started) {
        if (mqMobile.matches) rd.resize();
        const fill = S.fast ? smooth(1200, 3600, rd.steps) : Math.max(smooth(4000, 6200, rd.steps), S.fill);
        rd.render(layout(), { fill, mono: MONO });
      }
      S.dirty = false;
    }
    if (simming || moving || now < S.busyUntil) raf = requestAnimationFrame(tick);
  }

  function collapse(to) {
    const now = performance.now(), n = S.strips.length;
    S.strips.forEach((s, i) => {
      s.from = s.p; s.to = to; s.t0 = now;
      s.dur = T(420);
      s.delay = (to ? i : n - 1 - i) * T(18);
    });
    kick();
  }

  /* =====================================================================
     3. Opening sequence
     ===================================================================== */
  const waits = new Set();
  let skipping = false;
  const wait = ms => new Promise(res => {
    if (skipping) return res();
    const w = { res, id: setTimeout(() => { waits.delete(w); res(); }, ms) };
    waits.add(w);
  });
  const until = (fn, max) => new Promise(res => {
    const t0 = performance.now();
    (function poll() {
      if (skipping || fn() || performance.now() - t0 > max) return res();
      setTimeout(poll, 80);
    })();
  });
  const nextFrame = () => new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));

  function skip() {
    if (skipping || !root.classList.contains("is-intro")) return;
    skipping = true;
    root.classList.add("is-skip");
    S.fast = true;
    S.gapT = S.gap = 1; S.twistIntroT = S.twistIntro = 1;
    root.classList.add("bg-in");
    startSim();
    waits.forEach(w => { clearTimeout(w.id); w.res(); });
    waits.clear();
    requestRender();
  }

  async function intro() {
    root.classList.add("is-intro");
    if (reduced) skipping = true;
    if (skipping) S.fast = true;

    // the pattern starts growing and the title fades in where it will stay
    await nextFrame();
    startSim();
    titleEl.classList.add("is-in");

    await until(() => !rd.ok || !S.started || rd.steps > 4200, 3200 / PSPEED);

    // layers separate and turn
    S.fillT = 1; S.gapT = 1; S.twistIntroT = 1; kick();
    root.classList.add("bg-in");
    introEl.classList.add("is-in");
    await wait(T(320));
    navEl.classList.add("is-in");
    metaEl.classList.add("is-in");
    await wait(T(500));

    root.classList.remove("is-intro");
    titleEl.classList.add("is-settled");
    navEl.classList.add("is-settled");
    setTimeout(() => root.classList.remove("is-skip"), T(200));
  }

  /* =====================================================================
     4. Panels
     ===================================================================== */
  const fmtDate = (d, t) => {
    const dt = new Date(`${d}T${t || "00:00"}`);
    if (isNaN(dt)) return { day: "—", mon: d || "", wk: "", past: false };
    return {
      day: String(dt.getDate()).padStart(2, "0"),
      mon: dt.toLocaleString("en-GB", { month: "short" }) + " " + dt.getFullYear(),
      wk: dt.toLocaleString("en-GB", { weekday: "long" }),
      past: new Date(`${d}T23:59`) < new Date()
    };
  };

  let figN = 0;
  const cap = it => it.caption ? `<figcaption><span class="fig">fig. ${figN}</span>${it.caption}</figcaption>` : "";

  function cardHTML(it, k) {
    const live = !!it.href;
    const tag = live ? "a" : "div";
    const attrs = live ? `href="${esc(it.href)}"${it.newTab ? ` target="_blank" rel="noopener"` : ""}` : "";
    const go = live ? `${it.status ? it.status + " — " : ""}Enter <span class="arrow">→</span>` : (it.status || "Forthcoming");
    return `<${tag} class="card ${live ? "" : "is-disabled"}" ${attrs} style="--k:${k}">` +
      `<div class="media">${it.thumb ? `<img src="${esc(it.thumb)}" alt="" loading="lazy" draggable="false">` : ""}</div>` +
      `<span class="num">${it.index || String(k + 1).padStart(2, "0")}</span><h3>${it.title || ""}</h3><p>${it.text || ""}</p><span class="go">${go}</span></${tag}>`;
  }

  function railHTML(items) {
    const n = items.length;
    return `<div class="box rail span-4"><div class="rail__track">${items.map(cardHTML).join("")}</div>` +
      `<div class="rail__foot"><span class="rail__count">01 / ${String(n).padStart(2, "0")}</span>` +
      `<div class="rail__bar"><i></i></div>` +
      `<button class="rail__btn" type="button" data-dir="-1" aria-label="Previous">←</button>` +
      `<button class="rail__btn" type="button" data-dir="1" aria-label="Next">→</button></div></div>`;
  }

  function boxHTML(it) {
    const span = `span-${clamp(it.span || 1, 1, 4)}`;
    const ratio = it.ratio ? `style="--ratio:${esc(it.ratio)}"` : "";
    switch (it.type) {
      case "text":
        return `<article class="box box-text ${span}">${it.title ? `<h3>${it.title}</h3>` : ""}<div>${it.body || ""}</div></article>`;
      case "image":
        figN++;
        return `<figure class="box ${span}" ${ratio}><div class="media${/\.png$/i.test(it.src || "") ? " is-cutout" : ""}"><img src="${esc(it.src)}" alt="${esc(it.alt)}" loading="lazy" decoding="async"></div>${cap(it)}</figure>`;
      case "carousel": {
        const slides = (it.slides || []).filter(sl => sl.src);
        if (!slides.length) return "";
        const first = ++figN;
        figN += slides.length - 1;
        return `<figure class="box cz ${span}" data-fig="${first}" style="--ratio:${esc(it.ratio || "1800/1273")}">` +
          `<div class="media" tabindex="0" aria-roledescription="carousel" aria-label="${slides.length} images">` +
          `<div class="cz__track">${slides.map((sl, k) => `<div class="cz__slide" aria-label="${k + 1} of ${slides.length}"><img src="${esc(sl.src)}" alt="${esc(sl.alt)}" ${k ? 'loading="lazy"' : ""} decoding="async" draggable="false"></div>`).join("")}</div>` +
          `<div class="cz__dots">${slides.map((_, k) => `<i class="${k ? "" : "on"}"></i>`).join("")}</div></div>` +
          `<figcaption class="cz__foot"><div class="cz__cap"></div><span class="cz__count"></span>` +
          `<button class="cz__btn" type="button" data-dir="-1" aria-label="Previous image">←</button>` +
          `<button class="cz__btn" type="button" data-dir="1" aria-label="Next image">→</button></figcaption>` +
          `<script type="application/json">${JSON.stringify(slides.map(sl => sl.caption || "")).replace(/</g, "\\u003c")}</script></figure>`;
      }
      case "video": {
        figN++;
        const auto = it.autoplay ? "autoplay muted loop" : "controls";
        return `<figure class="box ${span}" ${ratio}><div class="media"><video src="${esc(it.src)}" ${it.poster ? `poster="${esc(it.poster)}"` : ""} ${auto} playsinline preload="metadata"></video></div>${cap(it)}</figure>`;
      }
      case "embed":
        figN++;
        return `<figure class="box ${span}" style="--ratio:${esc(it.ratio || "16/9")}"><div class="media"><iframe src="${esc(it.src)}" loading="lazy" allow="autoplay; fullscreen; picture-in-picture" allowfullscreen></iframe></div>${cap(it)}</figure>`;
      case "event": {
        const d = fmtDate(it.date, it.time);
        return `<article class="box event ${span} ${d.past ? "is-past" : ""}">` +
          `<div class="when"><span class="day">${d.day}</span><span class="mon">${d.mon}<br>${d.past ? "Past" : d.wk}${it.time ? ` · ${it.time}` : ""}</span></div>` +
          `<div class="what"><h3>${it.title || ""}</h3>${it.place ? `<p class="place">${it.place}</p>` : ""}<p>${it.text || ""}</p></div>` +
          `${it.link ? `<a class="act" href="${esc(it.link)}" target="_blank" rel="noopener">${it.linkLabel || "Details"} <span class="arrow">↗</span></a>` : "<span></span>"}</article>`;
      }
      case "credits":
        return `<dl class="box credits ${span}">${(it.groups || []).map(g =>
          `<div class="grp"><dt>${g.role || ""}</dt>${(g.names || []).map(n => `<dd>${n}</dd>`).join("")}</div>`).join("")}</dl>`;
      case "links":
        return `<div class="box box-links ${span}">${it.title ? `<h3>${it.title}</h3>` : ""}<ul>${(it.links || []).map(l =>
          `<li><a href="${esc(l.url)}" target="_blank" rel="noopener"><span>${l.label}</span><span class="arrow">↗</span></a></li>`).join("")}</ul></div>`;
      default:
        return "";
    }
  }

  /* consecutive project boxes become one horizontally scrolling rail */
  function itemsHTML(items, horiz) {
    let out = "", run = [];
    const flush = () => {
      if (!run.length) return;
      // a horizontal section is already a sideways strip: cards go straight in, full height
      out += horiz ? run.map((it, k) => cardHTML(it, k).replace('class="card', 'class="box card')).join("") : railHTML(run);
      run = [];
    };
    (items || []).forEach(it => {
      if (it.type === "project") run.push(it);
      else { flush(); out += boxHTML(it); }
    });
    flush();
    return out;
  }

  let railX = 0;
  function initRail(rail) {
    const track = $(".rail__track", rail), bar = $(".rail__bar", rail), count = $(".rail__count", rail);
    const btns = rail.querySelectorAll(".rail__btn");
    const n = track.children.length;
    const step = () => (track.children[0]?.getBoundingClientRect().width || 300) + parseFloat(getComputedStyle(track).columnGap || 20);
    const update = () => {
      const max = Math.max(1, track.scrollWidth - track.clientWidth);
      const p = clamp(track.scrollLeft / max, 0, 1);
      bar.style.setProperty("--p", (p * 100).toFixed(2) + "%");
      const idx = clamp(Math.round(track.scrollLeft / step()) + 1, 1, n);
      count.textContent = `${String(idx).padStart(2, "0")} / ${String(n).padStart(2, "0")}`;
      btns[0].disabled = track.scrollLeft < 2;
      btns[1].disabled = idx >= n;
      railX = track.scrollLeft;
      track.classList.toggle("is-scrolled", track.scrollLeft > 4);
      S.scrollT = (mqMobile.matches ? window.scrollY : panel.scrollTop) + railX * .5;
      kick();
    };
    track.addEventListener("scroll", update, { passive: true });
    btns.forEach(b => b.addEventListener("click", () => track.scrollBy({ left: step() * +b.dataset.dir, behavior: "smooth" })));

    // vertical wheel scrolls the rail sideways until it reaches an end
    let wheelT = 0;
    track.addEventListener("wheel", e => {
      const dx = Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY;
      const max = track.scrollWidth - track.clientWidth;
      if ((dx > 0 && track.scrollLeft < max - 1) || (dx < 0 && track.scrollLeft > 1)) {
        e.preventDefault();
        track.classList.add("is-drag");
        track.scrollLeft += dx;
        clearTimeout(wheelT);
        wheelT = setTimeout(() => track.classList.remove("is-drag"), 160);
      }
    }, { passive: false });

    // drag to scroll with a mouse (touch scrolls natively)
    let down = null, dragged = false;
    track.addEventListener("pointerdown", e => {
      if (e.pointerType !== "mouse" || e.button !== 0) return;
      down = { x: e.clientX, s: track.scrollLeft }; dragged = false;
    });
    window.addEventListener("pointermove", e => {
      if (!down) return;
      const dx = e.clientX - down.x;
      if (!dragged && Math.abs(dx) > 6) { dragged = true; track.classList.add("is-drag"); }
      if (dragged) track.scrollLeft = down.s - dx;
    });
    window.addEventListener("pointerup", () => {
      if (!down) return;
      down = null;
      if (dragged) setTimeout(() => track.classList.remove("is-drag"), 0);
    });
    track.addEventListener("click", e => { if (dragged) { e.preventDefault(); e.stopPropagation(); dragged = false; } }, true);
    update();
  }

  function initCarousel(cz) {
    const view = $(".media", cz), track = $(".cz__track", cz), capEl = $(".cz__cap", cz),
          count = $(".cz__count", cz), dots = cz.querySelectorAll(".cz__dots i"), btns = cz.querySelectorAll(".cz__btn");
    let caps = [];
    try { caps = JSON.parse($("script", cz).textContent); } catch (e) { /* no captions */ }
    const n = track.children.length, fig0 = +cz.dataset.fig || 1;
    let at = 0;
    const show = (i, instant) => {
      at = clamp(i, 0, n - 1);
      if (instant) track.style.transition = "none";
      track.style.transform = `translateX(${-at * 100}%)`;
      if (instant) { void track.offsetWidth; track.style.transition = ""; }
      capEl.innerHTML = `<span><span class="fig">fig. ${fig0 + at}</span>${caps[at] || ""}</span>`;
      count.textContent = `${String(at + 1).padStart(2, "0")} / ${String(n).padStart(2, "0")}`;
      dots.forEach((d, k) => d.classList.toggle("on", k === at));
      btns[0].disabled = at === 0; btns[1].disabled = at === n - 1;
      // load the neighbour before it is needed
      const next = track.children[at + 1] && $("img", track.children[at + 1]);
      if (next) next.loading = "eager";
      S.turnT += 14; kick();      // a small turn of the strips with each slide
    };
    btns.forEach(b => b.addEventListener("click", () => show(at + +b.dataset.dir)));
    view.addEventListener("keydown", e => {
      if (e.key === "ArrowRight") { e.preventDefault(); show(at + 1); }
      if (e.key === "ArrowLeft") { e.preventDefault(); show(at - 1); }
    });
    // drag / swipe
    let x0 = null, y0 = 0, dx = 0, horiz = null;
    view.addEventListener("pointerdown", e => {
      if (e.button) return;
      x0 = e.clientX; y0 = e.clientY; dx = 0; horiz = null;
    });
    view.addEventListener("pointermove", e => {
      if (x0 == null) return;
      dx = e.clientX - x0;
      if (horiz == null && (Math.abs(dx) > 8 || Math.abs(e.clientY - y0) > 8)) {
        horiz = Math.abs(dx) > Math.abs(e.clientY - y0);
        if (horiz) { try { view.setPointerCapture(e.pointerId); } catch (err) { /* synthetic events */ } view.classList.add("is-drag"); }
      }
      if (horiz) track.style.transform = `translateX(calc(${-at * 100}% + ${dx}px))`;
    });
    const end = () => {
      if (x0 == null) return;
      view.classList.remove("is-drag");
      if (horiz) {
        const w = view.clientWidth;
        show(Math.abs(dx) > w * .15 ? at + (dx < 0 ? 1 : -1) : at);
      }
      x0 = null;
    };
    view.addEventListener("pointerup", end);
    view.addEventListener("pointercancel", end);
    show(0, true);
  }

  /* --------------------------------------------------------------------
     Horizontal sections (layout: "horizontal" in content.js, desktop only):
     the header stays put, everything else runs sideways at full height.
     -------------------------------------------------------------------- */
  // long text flows into columns; widen each text box to hold all of them
  function sizeHText() {
    panel.querySelectorAll(".htrack > .box-text").forEach(el => {
      el.style.width = ""; el.style.columnCount = "";
      if (mqMobile.matches) return;
      const colW = el.clientWidth;
      const gap = parseFloat(getComputedStyle(el).columnGap) || 0;
      const n = Math.max(1, Math.round((el.scrollWidth + gap) / (colW + gap)));
      el.style.columnCount = n;
      el.style.width = (n * colW + (n - 1) * gap) + "px";
    });
  }

  function initHTrack() {
    const track = $(".htrack", panel), bar = $(".hfoot .rail__bar", panel);
    const btns = panel.querySelectorAll(".hfoot .rail__btn");
    if (!track) return;
    // lazy loading is unreliable inside a sideways scroller; there are few images, load them now
    track.querySelectorAll("figure > .media img, .cz__slide:first-child img").forEach(img => { img.loading = "eager"; });
    const update = () => {
      const max = Math.max(1, track.scrollWidth - track.clientWidth);
      bar.style.setProperty("--p", (clamp(track.scrollLeft / max, 0, 1) * 100).toFixed(2) + "%");
      btns[0].disabled = track.scrollLeft < 2;
      btns[1].disabled = track.scrollLeft > max - 2;
      S.scrollT = track.scrollLeft * .5;
      kick();
    };
    sizeHText();
    requestAnimationFrame(() => { sizeHText(); update(); });
    if (document.fonts) document.fonts.ready.then(() => { sizeHText(); update(); });
    track.addEventListener("scroll", update, { passive: true });
    btns.forEach(b => b.addEventListener("click", () =>
      track.scrollBy({ left: track.clientWidth * .7 * +b.dataset.dir, behavior: "smooth" })));
    // a vertical wheel scrolls sideways
    track.addEventListener("wheel", e => {
      if (mqMobile.matches) return;
      const d = Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY;
      if (!d) return;
      e.preventDefault();
      track.scrollLeft += d;
    }, { passive: false });
    track.addEventListener("keydown", e => {
      if (e.target.closest(".cz")) return;          // carousels use the arrows themselves
      if (e.key === "ArrowRight" || e.key === "ArrowLeft") {
        e.preventDefault();
        track.scrollBy({ left: track.clientWidth * .4 * (e.key === "ArrowRight" ? 1 : -1), behavior: "smooth" });
      }
    });
    // drag with a mouse (not on carousels, links or video)
    track.addEventListener("pointerdown", e => {
      if (e.pointerType !== "mouse" || e.button || e.target.closest(".cz .media, a, button, video, iframe")) return;
      hDrag = { track, x: e.clientX, s: track.scrollLeft, moved: false };
    });
    update();
  }
  let hDrag = null;
  window.addEventListener("pointermove", e => {
    if (!hDrag) return;
    const dx = e.clientX - hDrag.x;
    if (!hDrag.moved && Math.abs(dx) > 6) { hDrag.moved = true; hDrag.track.classList.add("is-drag"); }
    if (hDrag.moved) hDrag.track.scrollLeft = hDrag.s - dx;
  });
  window.addEventListener("pointerup", () => { if (hDrag) hDrag.track.classList.remove("is-drag"); hDrag = null; });

  let io = null;
  function renderPanel(sec, waitMs) {
    figN = 0;
    railX = 0;
    const idx = SITE.sections.indexOf(sec);
    panel.style.setProperty("--wait", waitMs + "ms");
    const horiz = sec.layout === "horizontal";
    panel.classList.toggle("is-h", horiz);
    panel.innerHTML =
      `<header class="box phead"><h2><span class="num">${ROMAN[idx]}.</span>${sec.heading || sec.label}</h2>` +
      `<div class="phead__aside">${sec.lede ? `<p class="lede">${sec.lede}</p>` : "<span></span>"}` +
      `<button class="back" type="button" data-go=""><span class="arrow" aria-hidden="true">←</span>Back</button></div></header>` +
      (horiz
        ? `<div class="htrack" tabindex="0">${itemsHTML(sec.items, true)}</div>` +
          `<div class="hfoot"><span class="hfoot__hint">Scroll</span><div class="rail__bar"><i></i></div>` +
          `<button class="rail__btn" type="button" data-dir="-1" aria-label="Back">←</button>` +
          `<button class="rail__btn" type="button" data-dir="1" aria-label="Forward">→</button></div>`
        : itemsHTML(sec.items));
    panel.scrollTop = 0;
    S.scrollT = 0;
    panel.querySelectorAll(".rail").forEach(initRail);
    panel.querySelectorAll(".cz").forEach(initCarousel);
    if (horiz) initHTrack();

    if (io) io.disconnect();
    io = new IntersectionObserver(entries => {
      let k = 0;
      entries.forEach(e => {
        if (!e.isIntersecting) return;
        e.target.style.setProperty("--i", k++);
        e.target.classList.add("is-in");
        io.unobserve(e.target);
      });
    }, { rootMargin: "0px 0px -6% 0px" });
    panel.querySelectorAll(".box").forEach(b => io.observe(b));
    // once the first boxes are in, later ones should not wait for the strips
    setTimeout(() => panel.style.setProperty("--wait", "0ms"), T(waitMs + 300));
  }

  let current = "";
  let swapTimer = 0;

  function setActive(id) {
    navList.querySelectorAll(".nav__item").forEach(a => {
      const on = a.dataset.go === id;
      a.classList.toggle("is-active", on);
      if (on) a.setAttribute("aria-current", "page"); else a.removeAttribute("aria-current");
    });
  }

  function open(id) {
    const sec = SITE.sections.find(s => s.id === id);
    if (!sec) return close();
    const was = current;
    current = id;
    setActive(id);
    clearTimeout(swapTimer);
    S.turnT += 90;              // every move turns the layers a little further
    busy(T(900));

    if (!was) {
      root.classList.add("is-panel");
      const mobile = mqMobile.matches;
      if (!mobile) collapse(1);
      renderPanel(sec, mobile ? 0 : 260);   // let the strips get going first (CSS scales it by --speed)
      if (mobile) { window.scrollTo({ top: 0 }); S.singleT = 1; }
    } else {
      panel.classList.add("is-leaving");
      swapTimer = setTimeout(() => {
        panel.classList.remove("is-leaving");
        renderPanel(sec, 0);
      }, T(150));
    }
    if (mqMobile.matches || !root.classList.contains("side-open")) panel.focus({ preventScroll: true });
    document.title = `${sec.label} — ${SITE.title}`;
  }

  function close() {
    if (!current) return;
    current = "";
    setActive("");
    hideSide(true);
    S.turnT -= 90;
    busy(T(900));
    panel.classList.add("is-leaving");
    S.singleT = 0;
    if (!mqMobile.matches) collapse(0);
    swapTimer = setTimeout(() => {
      root.classList.remove("is-panel");
      panel.classList.remove("is-leaving");
      panel.innerHTML = "";
    }, T(170));
    document.title = `${SITE.title} — ${SITE.meta}`;
  }

  function route() {
    const id = decodeURIComponent(location.hash.replace(/^#/, ""));
    if (id && id !== current) open(id);
    else if (!id) close();
  }

  function go(id) {
    if (id === current) id = "";
    if (id) location.hash = id;
    else {
      try { history.pushState("", document.title, location.pathname + location.search); }
      catch (e) { location.hash = ""; }
      route();
    }
  }

  /* --------------------------------------------------------------------
     Right-edge menu (desktop, section open)
     -------------------------------------------------------------------- */
  // true: in a section, hovering the right edge slides the menu back in. false: it stays away.
  const SIDE_MENU = false;
  root.classList.toggle("side-menu", SIDE_MENU);
  let sideT = 0;
  function showSide() {
    if (!SIDE_MENU || !current || mqMobile.matches) return;
    clearTimeout(sideT);
    if (!root.classList.contains("side-open")) { root.classList.add("side-open"); S.turnT += 24; kick(); }
  }
  function hideSide(now) {
    clearTimeout(sideT);
    const doHide = () => { if (root.classList.contains("side-open")) { root.classList.remove("side-open"); S.turnT -= 24; kick(); } };
    if (now) doHide(); else sideT = setTimeout(doHide, 280);
  }
  sideHot.addEventListener("mouseenter", showSide);
  sideHot.addEventListener("click", () => root.classList.contains("side-open") ? hideSide(true) : showSide());
  side.addEventListener("mouseenter", () => clearTimeout(sideT));
  [side, sideHot].forEach(el => el.addEventListener("mouseleave", e => {
    if (!current) return;
    const to = e.relatedTarget;
    if (to && (side.contains(to) || sideHot.contains(to))) return;
    hideSide(false);
  }));
  side.addEventListener("focusin", showSide);

  /* =====================================================================
     5. Events
     ===================================================================== */
  document.addEventListener("click", e => {
    if (root.classList.contains("is-intro")) { e.preventDefault(); skip(); return; }
    const a = e.target.closest("[data-go]");
    if (a) {
      e.preventDefault();
      go(a.dataset.go);
      // touch screens have no hover: tuck the menu away after a choice
      if (matchMedia("(hover: none)").matches) hideSide(true);
      return;
    }
    if (e.target.closest("#homeLink")) { e.preventDefault(); go(""); return; }
    if (root.classList.contains("side-open") && !e.target.closest("#side, #sideHot")) hideSide(true);
  });
  document.addEventListener("keydown", e => {
    if (root.classList.contains("is-intro")) { skip(); return; }
    if (e.key === "Escape") {
      if (root.classList.contains("side-open")) hideSide(true);
      else if (current) go("");
    }
  });
  window.addEventListener("hashchange", route);
  window.addEventListener("popstate", route);

  window.addEventListener("pointermove", e => {
    if (mqMobile.matches || e.pointerType === "touch") return;
    S.ptrT = (e.clientX / innerWidth - .5) * 2;
    S.ptrYT = (e.clientY / innerHeight - .5) * 2;
    kick();
  }, { passive: true });

  panel.addEventListener("scroll", () => {
    S.scrollT = panel.scrollTop + railX * .5;
    kick();
  }, { passive: true });
  window.addEventListener("scroll", () => {
    if (!mqMobile.matches) return;
    S.scrollT = window.scrollY + railX * .5;
    kick();
  }, { passive: true });

  let rzT = 0;
  function onResize() {
    if (panel.classList.contains("is-h")) requestAnimationFrame(sizeHText);
    if (!mqMobile.matches) { if (current) S.strips.forEach(s => { s.p = s.from = s.to = 1; }); }
    else root.classList.remove("side-open");
    S.single = S.singleT = current ? 1 : 0;
    placeCanvas();
    requestRender();
    clearTimeout(rzT);
    rzT = setTimeout(() => { placeCanvas(); requestRender(); }, 150);
  }
  window.addEventListener("resize", onResize);
  mqMobile.addEventListener("change", onResize);
  if (window.ResizeObserver) {
    const ro = new ResizeObserver(() => { rd.ok && rd.resize(); requestRender(); });
    ro.observe(stage);
  }

  /* =====================================================================
     6. A faint pattern grows under a resting cursor (or a tap on phones)
     ===================================================================== */
  (function idlePattern() {
    const ENABLED = false;           // switched off — set to true to bring it back
    const cv = document.getElementById("idle");
    if (!ENABLED || !cv || reduced) return;
    const SIZE = 380, CELL = 2, REST_MS = 2600, MAX_A = .6;
    const TINT = [0.79, 0.76, 0.72];
    let eng = null, state = "off", alpha = 0, target = 0, raf2 = 0, last2 = 0;
    let timer = 0, px = -1, py = -1, ox = 0, oy = 0;

    function engine() {
      if (eng) return eng.ok ? eng : null;
      eng = new TurningPattern(cv, { seed: 41, dotBias: .15, anisotropy: .45, threshold: .21 });
      if (!eng.ok || !eng.start(SIZE / CELL, SIZE / CELL, CELL)) { eng.ok = false; return null; }
      return eng;
    }
    function loop(now) {
      raf2 = 0;
      const dt = Math.min(.05, (now - last2) / 1000); last2 = now;
      alpha += (target - alpha) * (1 - Math.exp(-(target > alpha ? 1.6 : 3.5) * dt));
      if (state === "grow" && eng.steps < 2800 && !document.hidden) eng.step(7);
      eng.resize();
      eng.render([{ x: 0, y: 0, w: SIZE, h: SIZE, a: alpha }],
        { tint: TINT, invert: true, vignette: [SIZE / 2, SIZE / 2, SIZE / 2] });
      if (state === "fade" && alpha < .01) { state = "off"; cv.classList.remove("is-on"); return; }
      if (state !== "off") raf2 = requestAnimationFrame(loop);
    }
    function start(x, y) {
      if (root.classList.contains("is-intro") || !engine()) return;
      eng.clear();
      ox = x; oy = y;
      cv.style.transform = `translate(${Math.round(x - SIZE / 2)}px, ${Math.round(y - SIZE / 2)}px)`;
      const c = SIZE / CELL / 2;
      eng.seed(c, c, 3);
      for (let k = 0; k < 5; k++) eng.seed(c + Math.cos(k * 1.257) * 7, c + Math.sin(k * 1.257) * 7, 2);
      alpha = 0; target = MAX_A; state = "grow";
      cv.classList.add("is-on");
      if (!raf2) { last2 = performance.now(); raf2 = requestAnimationFrame(loop); }
    }
    function stop() {
      if (state === "off" || state === "fade") return;
      state = "fade"; target = 0;
      if (!raf2) { last2 = performance.now(); raf2 = requestAnimationFrame(loop); }
    }

    // mouse: rest for a moment and it begins; move away and it fades
    window.addEventListener("pointermove", e => {
      if (e.pointerType !== "mouse") return;
      px = e.clientX; py = e.clientY;
      if (state === "grow" && Math.hypot(px - ox, py - oy) > 8) stop();
      clearTimeout(timer);
      timer = setTimeout(() => start(px, py), REST_MS);
    }, { passive: true });
    document.addEventListener("mouseleave", () => { clearTimeout(timer); stop(); });
    // scrolling with the wheel is not resting
    window.addEventListener("wheel", () => {
      stop(); clearTimeout(timer);
      if (px >= 0) timer = setTimeout(() => start(px, py), REST_MS);
    }, { passive: true });
    window.addEventListener("blur", () => { clearTimeout(timer); stop(); });

    // touch: a tap on an empty spot starts it there
    let down = null;
    window.addEventListener("pointerdown", e => { if (e.pointerType !== "mouse") down = { x: e.clientX, y: e.clientY }; }, { passive: true });
    window.addEventListener("pointerup", e => {
      if (e.pointerType === "mouse" || !down) return;
      const tap = Math.hypot(e.clientX - down.x, e.clientY - down.y) < 10;
      down = null;
      if (!tap || e.target.closest("a, button, input, textarea, select, video, iframe, .media, .rail__track, .nav")) return;
      start(e.clientX, e.clientY);
    }, { passive: true });
    window.addEventListener("scroll", () => { if (down === null) stop(); }, { passive: true });
  })();

  /* =====================================================================
     Go
     ===================================================================== */
  placeCanvas();
  const startHash = location.hash.replace(/^#/, "");
  const begin = () => {
    if (startHash) skipping = true;      // deep link: skip the long intro
    placeBg();
    intro().then(() => { if (startHash) route(); });
  };
  const fontsReady = document.fonts && document.fonts.ready
    ? Promise.race([document.fonts.ready, new Promise(r => setTimeout(r, 1200))]) : Promise.resolve();

  // The opening text comes before everything: no pattern, no title, until Enter.
  // It is skipped on deep links (#explore …) and once seen in this browser tab.
  const pre = SITE.preface;
  let seen = false;
  try { seen = sessionStorage.getItem("tp-preface") === "1"; } catch (e) {}
  if (pre && (pre.lead || (pre.paragraphs || []).length) && !startHash && !seen) {
    const el = document.createElement("div");
    el.className = "preface"; el.id = "preface";
    el.setAttribute("role", "dialog"); el.setAttribute("aria-label", "Introduction");
    const paras = (pre.paragraphs || []).filter(Boolean);
    el.innerHTML = `<div class="preface__body">` + (pre.lead ? `<p class="preface__lead">${pre.lead}</p>` : "") +
      paras.map((p, i) => `<p style="--p:${i + 1}">${p}</p>`).join("") +
      `<button class="preface__go" type="button" style="--p:${paras.length + 1}">${pre.button || "Enter"} <span class="arrow">→</span></button></div>` +
      // the exit: the text is eaten away along a reaction-diffusion pattern (assets/img/dissolve.png:
      // an alpha map; the text survives where it is above a threshold that climbs from 0 to 1)
      `<svg width="0" height="0" style="position:absolute" aria-hidden="true"><filter id="dissolve" x="0" y="0" width="100%" height="100%" color-interpolation-filters="sRGB">` +
      `<feImage href="assets/img/dissolve.png" x="0" y="0" width="460" height="460" preserveAspectRatio="none" result="t"/><feTile in="t" result="tt"/>` +
      `<feComponentTransfer in="tt" result="m"><feFuncA type="linear" slope="30" intercept="1"/></feComponentTransfer>` +
      `<feComposite in="SourceGraphic" in2="m" operator="in"/></filter></svg>`;
    document.body.appendChild(el);
    const go = el.querySelector(".preface__go");
    fontsReady.then(() => requestAnimationFrame(() => { el.classList.add("is-in"); go.focus({ preventScroll: true }); }));
    go.addEventListener("click", () => {
      try { sessionStorage.setItem("tp-preface", "1"); } catch (e) {}
      // the pattern starts growing underneath at once, and the text dissolves into it
      el.classList.add("is-leaving");
      begin();
      const body = el.querySelector(".preface__body"), fn = el.querySelector("feFuncA");
      if (reduced || !fn) { el.remove(); return; }
      body.style.filter = "url(#dissolve)";
      const t0 = performance.now(), DUR = T(1500);
      (function step(now) {
        const k = Math.min(1, (now - t0) / DUR), th = k * k * (3 - 2 * k) * 1.04 - .02;
        fn.setAttribute("intercept", (.5 - 30 * th).toFixed(3));
        if (k < 1) requestAnimationFrame(step); else el.remove();
      })(t0);
    }, { once: true });
  } else fontsReady.then(begin);
})();
