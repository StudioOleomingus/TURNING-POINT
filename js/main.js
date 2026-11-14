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
  const easeInOut = t => t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
  const smooth = (a, b, x) => { const t = clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };
  const esc = s => String(s == null ? "" : s).replace(/"/g, "&quot;");

  /* Pattern density: 1 = original grain; 1.2 = 20% denser */
  const DENSITY = 1.2;

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

  introEl.innerHTML = (SITE.intro || []).map(p => `<p>${p}</p>`).join("");
  (function splitWords() {
    let n = 0;
    introEl.querySelectorAll("p").forEach((p, pi) => {
      const walker = document.createTreeWalker(p, NodeFilter.SHOW_TEXT);
      const nodes = [];
      while (walker.nextNode()) nodes.push(walker.currentNode);
      nodes.forEach(node => {
        const frag = document.createDocumentFragment();
        node.textContent.split(/(\s+)/).forEach(part => {
          if (!part) return;
          if (/^\s+$/.test(part)) { frag.appendChild(document.createTextNode(part)); return; }
          const s = document.createElement("span");
          s.className = "w";
          s.style.setProperty("--d", (n++ * 9 + pi * 140) + "ms");
          s.textContent = part;
          frag.appendChild(s);
        });
        node.parentNode.replaceChild(frag, node);
      });
    });
  })();

  const roll = txt => `<span class="roll">${[...txt].map((c, i) =>
    `<span class="ch" style="--i:${i}">${c}</span>`).join("")}</span>`;
  navList.innerHTML = SITE.sections.map((s, i) =>
    `<a class="nav__item" href="#${s.id}" data-go="${s.id}" style="--i:${i}">` +
    `<span class="nav__num">${ROMAN[i]}</span>${roll(s.label)}</a>`).join("");

  /* =====================================================================
     2. Pattern engine
     ===================================================================== */
  const rd = new TurningPattern(canvas, { texture: "assets/img/texture.jpg", texturePx: 760 });
  if (!rd.ok) root.classList.add("no-webgl");
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
    const n = mobile ? N_MOBILE : N_DESKTOP;
    if (n !== S.strips.length) {
      const p = (!mobile && current) ? 1 : 0;
      S.strips = makeStrips(n, p);
    }
    rd.ok && rd.resize();
  }

  function startSim() {
    if (!rd.ok || S.started) return;
    const r = stage.getBoundingClientRect();
    const cell = clamp(r.width / 480, 1.6, 3.2) / DENSITY;
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

  function layout() {
    if (!rd.ok || !S.started) return [];
    const mobile = mqMobile.matches;
    const home = relRect(stage);
    if (home.h < 1 || home.w < 1) return [];
    const n = S.strips.length, mid = (n - 1) / 2;
    const gapPx = S.gap * clamp(home.h * .0056, 2.5, 6);
    const sh = (home.h - gapPx * (n - 1)) / n;
    const twist = S.twistIntro * 14 + S.ptr * 26;
    const rects = [];
    const sv = mobile ? null : relRect(sliver);
    const oxHome = d => -home.x + twist * d + S.turn * (1 + d * .12) + S.scroll * (.16 + d * .03);
    const oxSliver = d => -home.x + twist * d * 1.6 + S.turn * (1 - d * .12) - S.scroll * .1;

    if (mobile) {
      // the first layer grows to fill the band while the others fold away
      const q = S.single, w = i => (i === 0 ? 1 : 1 - q);
      let sumW = 0; for (let i = 0; i < n; i++) sumW += w(i);
      const g = gapPx * (1 - q), usable = home.h - g * (n - 1);
      let y = home.y;
      for (let i = 0; i < n; i++) {
        const h = usable * w(i) / sumW;
        if (h > .5) rects.push({ x: home.x, y, w: home.w, h, ox: oxHome(i - mid * (1 - q)), oy: -home.y });
        y += h + g;
      }
      return rects;
    }
    for (let i = 0; i < n; i++) {
      const d = i - mid, y = home.y + i * (sh + gapPx);
      const p = easeInOut(S.strips[i].p);
      const x0 = lerp(home.x, sv.x, p), x1 = lerp(home.x + home.w, sv.x + sv.w, p);
      rects.push({ x: x0, y, w: x1 - x0, h: sh, ox: lerp(oxHome(d), oxSliver(d), p), oy: -home.y });
    }
    for (let i = 0; i < n; i++) {
      const d = i - mid, y = home.y + i * (sh + gapPx);
      rects.push({ x: sv.x, y, w: sv.w, h: sh, ox: oxSliver(d), oy: -home.y });
    }
    return rects;
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
      // time-based pacing (~2400 steps/s), capped so slow GPUs stay responsive
      const n = S.fast ? 160 : clamp(Math.round(2400 * dt), 6, 90);
      rd.step(Math.min(n, S.simTarget - rd.steps));
      simming = true;
    }

    moving = approach("gap", 3.2, dt) || moving;
    moving = approach("fill", 0.9, dt) || moving;
    moving = approach("twistIntro", 1.6, dt) || moving;
    moving = approach("ptr", 2.4, dt) || moving;
    moving = approach("scroll", 6, dt) || moving;
    moving = approach("turn", 2.2, dt) || moving;
    moving = approach("single", 3.4, dt) || moving;

    S.strips.forEach(s => {
      if (s.p === s.to) return;
      const t = clamp((now - s.t0 - s.delay) / s.dur, 0, 1);
      s.p = t >= 1 ? s.to : lerp(s.from, s.to, t);
      moving = true;
    });

    if (simming || moving || S.dirty || now < S.busyUntil) {
      if (rd.ok && S.started) {
        if (mqMobile.matches) rd.resize();
        const fill = S.fast ? smooth(1200, 3600, rd.steps) : Math.max(smooth(4000, 6200, rd.steps), S.fill);
        rd.render(layout(), { fill });
      }
      S.dirty = false;
    }
    if (simming || moving || now < S.busyUntil) raf = requestAnimationFrame(tick);
  }

  function collapse(to) {
    const now = performance.now(), n = S.strips.length;
    S.strips.forEach((s, i) => {
      s.from = s.p; s.to = to; s.t0 = now;
      s.dur = 1300;
      s.delay = (to ? i : n - 1 - i) * 60;
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

    await until(() => !rd.ok || !S.started || rd.steps > 4200, 5200);

    // layers separate and turn
    S.fillT = 1; S.gapT = 1; S.twistIntroT = 1; kick();
    introEl.classList.add("is-in");
    await wait(900);
    navEl.classList.add("is-in");
    metaEl.classList.add("is-in");
    await wait(1200);

    root.classList.remove("is-intro");
    titleEl.classList.add("is-settled");
    navEl.classList.add("is-settled");
    setTimeout(() => root.classList.remove("is-skip"), 400);
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
        return `<figure class="box ${span}"><div class="media" ${ratio}><img src="${esc(it.src)}" alt="${esc(it.alt)}" loading="lazy" decoding="async"></div>${cap(it)}</figure>`;
      case "video": {
        figN++;
        const auto = it.autoplay ? "autoplay muted loop" : "controls";
        return `<figure class="box ${span}"><div class="media" ${ratio}><video src="${esc(it.src)}" ${it.poster ? `poster="${esc(it.poster)}"` : ""} ${auto} playsinline preload="metadata"></video></div>${cap(it)}</figure>`;
      }
      case "embed":
        figN++;
        return `<figure class="box ${span}"><div class="media" style="--ratio:${esc(it.ratio || "16/9")}"><iframe src="${esc(it.src)}" loading="lazy" allow="autoplay; fullscreen; picture-in-picture" allowfullscreen></iframe></div>${cap(it)}</figure>`;
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
  function itemsHTML(items) {
    let out = "", run = [];
    const flush = () => { if (run.length) out += railHTML(run); run = []; };
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

  let io = null;
  function renderPanel(sec, waitMs) {
    figN = 0;
    railX = 0;
    const idx = SITE.sections.indexOf(sec);
    panel.style.setProperty("--wait", waitMs + "ms");
    panel.innerHTML =
      `<header class="box phead"><h2><span class="num">${ROMAN[idx]}.</span>${sec.heading || sec.label}</h2>` +
      `<div class="phead__aside">${sec.lede ? `<p class="lede">${sec.lede}</p>` : "<span></span>"}` +
      `<button class="close" type="button" data-go="">Close <span aria-hidden="true">×</span></button></div></header>` +
      itemsHTML(sec.items);
    panel.scrollTop = 0;
    root.classList.remove("panel-scrolled");
    S.scrollT = 0;
    panel.querySelectorAll(".rail").forEach(initRail);

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
    setTimeout(() => panel.style.setProperty("--wait", "0ms"), waitMs + 600);
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
    busy(1600);

    if (!was) {
      root.classList.add("is-panel");
      const mobile = mqMobile.matches;
      if (!mobile) collapse(1);
      renderPanel(sec, mobile ? 0 : 420);
      if (mobile) { window.scrollTo({ top: 0 }); S.singleT = 1; }
    } else {
      panel.classList.add("is-leaving");
      swapTimer = setTimeout(() => {
        panel.classList.remove("is-leaving");
        renderPanel(sec, 0);
      }, 320);
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
    busy(1600);
    panel.classList.add("is-leaving");
    S.singleT = 0;
    if (!mqMobile.matches) collapse(0);
    swapTimer = setTimeout(() => {
      root.classList.remove("is-panel");
      panel.classList.remove("is-leaving");
      panel.innerHTML = "";
    }, 360);
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
  let sideT = 0;
  function showSide() {
    if (!current || mqMobile.matches) return;
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
    kick();
  }, { passive: true });

  panel.addEventListener("scroll", () => {
    S.scrollT = panel.scrollTop + railX * .5;
    root.classList.toggle("panel-scrolled", panel.scrollTop > 8);
    kick();
  }, { passive: true });
  window.addEventListener("scroll", () => {
    if (!mqMobile.matches) return;
    S.scrollT = window.scrollY + railX * .5;
    kick();
  }, { passive: true });

  let rzT = 0;
  function onResize() {
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
     Go
     ===================================================================== */
  placeCanvas();
  const startHash = location.hash.replace(/^#/, "");
  const begin = () => {
    if (startHash) skipping = true;      // deep link: skip the long intro
    intro().then(() => { if (startHash) route(); });
  };
  (document.fonts && document.fonts.ready ? Promise.race([document.fonts.ready, new Promise(r => setTimeout(r, 1200))]) : Promise.resolve())
    .then(begin);
})();
