/* La Cue — scroll storytelling. Vanilla JS, nessuna libreria. */
(() => {
  "use strict";
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
  const lerp = (a, b, t) => a + (b - a) * t;
  const map = (v, a, b) => clamp((v - a) / (b - a));
  const easeOut = t => 1 - Math.pow(1 - t, 3);
  const easeInOut = t => (t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
  const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
  let seed = 7;
  const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
  const pad = (n, l = 2) => String(Math.floor(n)).padStart(l, "0");
  const mmss = s => `${pad(s / 60)}:${pad(s % 60)}`;

  /* ── avvio: quando i font sono pronti parte l'animazione del logo ── */
  let started = false;
  const start = () => { if (!started) { started = true; document.body.classList.add("ready"); } };
  if (reduced) start();
  (document.fonts ? document.fonts.ready : Promise.resolve()).then(() => setTimeout(start, 150));
  setTimeout(start, 1800);

  /* ── titoli che si rivelano parola per parola ── */
  $$(".split").forEach(el => {
    el.innerHTML = el.textContent.trim().split(/\s+/)
      .map((w, i) => `<span class="w"><span style="transition-delay:${i * 0.12}s">${w}</span></span>`).join(" ");
  });
  const io = new IntersectionObserver(es => es.forEach(e => {
    if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); }
  }), { threshold: 0.25 });
  $$(".reveal, .split, .signature").forEach(el => io.observe(el));

  /* ── polvere di scena: particelle in parallasse su tutta la pagina ── */
  const dust = $("#dust"), dctx = dust.getContext("2d");
  let DW = 0, DH = 0, DPR = 1, parts = [];
  function sizeDust() {
    DPR = Math.min(2, devicePixelRatio || 1);
    DW = innerWidth; DH = innerHeight;
    dust.width = DW * DPR; dust.height = DH * DPR;
    dctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    const n = Math.round(Math.min(140, DW * DH / 11000));
    parts = Array.from({ length: n }, () => ({
      x: Math.random() * DW, y: Math.random() * DH * 3, z: .15 + Math.random() * .85,
      r: .4 + Math.random() * 1.4, vx: (Math.random() - .5) * .08, vy: -.03 - Math.random() * .08,
      tw: Math.random() * 6.28, c: Math.random() < .35 ? "95,231,255" : "244,246,250"
    }));
  }
  function drawDust(t) {
    dctx.clearRect(0, 0, DW, DH);
    const sy = scrollY, span = DH * 3;
    for (const p of parts) {
      p.x += p.vx; p.y += p.vy;
      if (p.x < -5) p.x = DW + 5; if (p.x > DW + 5) p.x = -5;
      let y = ((p.y - sy * p.z * .35) % span + span) % span - DH * .5;
      if (y < -10 || y > DH + 10) continue;
      const a = (.15 + .35 * p.z) * (.6 + .4 * Math.sin(t * .0012 + p.tw));
      dctx.beginPath();
      dctx.fillStyle = `rgba(${p.c},${a})`;
      dctx.arc(p.x, y, p.r * (0.6 + p.z), 0, 6.283);
      dctx.fill();
    }
  }

  /* ── LA 440 Hz che si disegna scorrendo ── */
  const sine = $("#sine"), tuning = $(".tuning");
  function drawSine(t) {
    const r = tuning.getBoundingClientRect();
    const prog = clamp((innerHeight - r.top) / (innerHeight * .9));
    let d = "";
    const N = 360, max = Math.max(1, Math.round(N * prog));
    for (let i = 0; i <= max; i++) {
      const x = i / N * 1200;
      const env = Math.sin(Math.PI * i / N);
      const y = 80 + Math.sin(i / N * 44 * Math.PI + t * .004) * 62 * env * (0.4 + .6 * prog);
      d += (i ? "L" : "M") + x.toFixed(1) + " " + y.toFixed(1);
    }
    sine.setAttribute("d", d);
  }

  /* ═════════ SCENA · SPETTACOLO ═════════ */
  const cues = [
    { n: 1, name: "Overture", sub: "Overture.wav", dur: 198, go: .16, end: .46 },
    { n: 2, name: "Rain", sub: "Fade Prev 4.0 s · constant power", dur: 65, go: .42, end: .74 },
    { n: 3, name: "Thunder", sub: "Pre-wait 2.0 s", dur: 8, go: .60, start: .645, end: .735 },
    { n: 4, name: "Curtain call", sub: "∞ Loop · fade on F", dur: 24, go: .82, end: .975 }
  ];
  cues.forEach(c => { c.start = c.start ?? c.go; c.bars = Array.from({ length: 26 }, () => 6 + rnd() * 22); });
  const caps = [
    [0, "House lights down.", "The audience settles. Cue 1 is on standby."],
    [.09, "Standby.", "One breath. Finger over the key."],
    [.16, "GO.", "Overture. The curtain rises."],
    [.26, "Live.", "The waveform rolls. The clock is yours."],
    [.42, "Fade Prev.", "Rain comes in as the overture fades away — four seconds, constant power."],
    [.60, "Pre-wait.", "GO on Thunder: it fires exactly two seconds later."],
    [.75, "Silence.", "The audience holds its breath."],
    [.82, "Curtain call.", "The last cue loops until you press F."],
    [.975, "Curtain.", "Ready to Cue. See you tomorrow night."]
  ];
  const rowsEl = $("#rows");
  rowsEl.innerHTML = cues.map(c => `
    <div class="row" data-n="${c.n}">
      <span class="n">${c.n}</span>
      <span class="nm">${c.name}<small>${c.sub}</small></span>
      <span class="mini">${c.bars.map(h => `<i style="height:${h.toFixed(0)}px"></i>`).join("")}</span>
      <span class="tm">00:00 / ${mmss(c.dur)}</span>
      <span class="st"></span>
    </div>`).join("");
  const rowEls = $$(".row", rowsEl);
  const TLW = 3600, SHOW_SECONDS = 900;
  const tl = $("#tlTrack");
  let tlHTML = "";
  for (let x = 0; x <= TLW; x += 30) {
    const major = x % 150 === 0;
    tlHTML += `<span class="tl-tick${major ? " major" : ""}" style="left:${x}px"></span>`;
    if (major) tlHTML += `<span class="tl-lab" style="left:${x}px">${mmss(x / TLW * SHOW_SECONDS)}</span>`;
  }
  tlHTML += cues.map(c => `<span class="tl-cue" data-n="${c.n}" style="left:${c.start * TLW}px;width:${(c.end - c.start) * TLW}px">${c.n} · ${c.name}</span>`).join("");
  tl.innerHTML = tlHTML;
  const tlCues = $$(".tl-cue", tl);
  const cap = $("#showCaption"), sub = $("#showSub"), goBtn = $("#goBtn"), nextEl = $("#nextCue");
  const house = $(".house");
  let capIdx = 0, lastShowP = 0, hitT = 0;

  function setCaption(i) {
    if (i === capIdx) return;
    capIdx = i;
    cap.classList.add("swap"); sub.classList.add("swap");
    setTimeout(() => {
      cap.textContent = caps[i][1]; sub.textContent = caps[i][2];
      cap.classList.remove("swap"); sub.classList.remove("swap");
    }, 300);
  }

  function updShow(p) {
    let ci = 0; caps.forEach((c, i) => { if (p >= c[0]) ci = i; });
    setCaption(ci);
    house.style.opacity = (1 - map(p, 0, .1)) + map(p, .975, 1);

    const next = cues.find(c => c.go > p);
    cues.forEach((c, i) => {
      const row = rowEls[i], tc = tlCues[i];
      let st = "", label = "";
      const fadingOut = cues.some(o => o !== c && o.start > c.start && p >= o.start && p < c.end);
      if (p >= c.end) { st = "done"; label = ""; }
      else if (p >= c.start) { st = fadingOut ? "fading" : "playing"; label = fadingOut ? "FADING" : "LIVE"; }
      else if (p >= c.go) { st = "standby"; label = "PRE-WAIT"; }
      else if (c === next && p > .03) { st = "standby"; label = "STANDBY"; }
      row.className = "row" + (st ? " " + st : "");
      row.querySelector(".st").textContent = label;
      tc.className = "tl-cue" + (st === "playing" || st === "fading" ? " playing" : st === "standby" ? " standby" : "");
      const frac = st === "done" ? 1 : p >= c.start ? map(p, c.start, c.end) : 0;
      const on = Math.round(frac * 26);
      row.querySelectorAll(".mini i").forEach((b, k) => b.classList.toggle("on", k < on));
      row.querySelector(".tm").textContent = `${mmss(frac * c.dur)} / ${mmss(c.dur)}`;
    });
    nextEl.textContent = next ? `${next.n} · ${next.name}` : "—";
    goBtn.classList.toggle("pulse", !!next && p > next.go - .06 && p < next.go);
    // GO premuto: quando si attraversa una cue in avanti
    if (cues.some(c => lastShowP < c.go && p >= c.go)) { goBtn.classList.add("hit"); hitT = performance.now(); }
    if (performance.now() - hitT > 220) goBtn.classList.remove("hit");
    lastShowP = p;

    const live = cues.some(c => p >= c.start && p < c.end);
    const t = performance.now() / 1000;
    [["#mvL", 0], ["#mvR", 1.7]].forEach(([id, ph]) => {
      const v = live ? clamp(.55 + .25 * Math.sin(t * 9 + ph) * Math.sin(t * 2.3 + ph) + .15 * Math.random()) : 0;
      $(id).style.clipPath = `inset(${(1 - v) * 100}% 0 0 0 round 3px)`;
    });
    tl.style.transform = `translate3d(${-p * TLW}px,0,0)`;
    const sec = p * SHOW_SECONDS;
    $("#tlTime").textContent = `00:${mmss(sec)}`;
  }

  /* ═════════ SCENA · FORMA D'ONDA ═════════ */
  const svg = $("#waveSvg"), NS = "http://www.w3.org/2000/svg";
  const N = 150, BW = 1000 / N, CY = 190, PEAK = 168;
  const trimL = .085, trimR = .915, fadeInE = .2, fadeOutS = .78;
  seed = 42;
  const amps = Array.from({ length: N }, (_, i) => {
    const x = i / N;
    let a = .25 + .55 * Math.abs(Math.sin(x * 9.3)) * (.6 + .4 * Math.sin(x * 2.1 + 1)) + rnd() * .25;
    if (x < trimL || x > trimR) a = .02 + rnd() * .03;
    return clamp(a, 0, 1);
  });
  const maxA = Math.max(...amps);
  const el = (tag, attrs, parent = svg) => { const e = document.createElementNS(NS, tag); for (const k in attrs) e.setAttribute(k, attrs[k]); parent.appendChild(e); return e; };
  // griglia
  const gridG = el("g", {});
  const beats = [];
  for (let i = 0; i <= 24; i++) {
    const x = lerp(trimL, trimR, i / 24) * 1000;
    beats.push(el("line", { x1: x, x2: x, y1: 14, y2: 366, stroke: i % 4 ? "rgba(255,255,255,.07)" : "rgba(255,255,255,.18)", "stroke-width": 1, opacity: 0 }, gridG));
  }
  // linee di picco −0.1 dBFS
  const pkTop = el("line", { x1: 0, x2: 1000, y1: CY - PEAK, y2: CY - PEAK, stroke: "#5FE7FF", "stroke-dasharray": "6 6", "stroke-width": 1.2, opacity: 0 });
  const pkBot = el("line", { x1: 0, x2: 1000, y1: CY + PEAK, y2: CY + PEAK, stroke: "#5FE7FF", "stroke-dasharray": "6 6", "stroke-width": 1.2, opacity: 0 });
  const pkLab = el("text", { x: 994, y: CY - PEAK - 6, "text-anchor": "end", fill: "#5FE7FF", "font-family": "JetBrains Mono", "font-size": 12, opacity: 0 });
  pkLab.textContent = "−0.1 dBFS";
  // barre
  const bars = amps.map((a, i) => el("rect", { x: i * BW + BW * .18, width: BW * .64, y: CY, height: 0, rx: 1.5, fill: "#5FE7FF" }));
  // zone tagliate
  const dimL = el("rect", { x: 0, y: 0, width: 0, height: 380, fill: "rgba(8,9,11,.72)" });
  const dimR = el("rect", { x: 1000, y: 0, width: 0, height: 380, fill: "rgba(8,9,11,.72)" });
  const hL = el("g", { opacity: 0 }); el("rect", { x: -2, y: 10, width: 4, height: 360, rx: 2, fill: "#FFB547" }, hL); el("rect", { x: -2, y: 10, width: 14, height: 22, rx: 4, fill: "#FFB547" }, hL);
  const hR = el("g", { opacity: 0 }); el("rect", { x: -2, y: 10, width: 4, height: 360, rx: 2, fill: "#FFB547" }, hR); el("rect", { x: -12, y: 10, width: 14, height: 22, rx: 4, fill: "#FFB547" }, hR);
  // curve di fade
  const fadePath = el("path", { fill: "none", stroke: "#F4F6FA", "stroke-width": 2.5, "stroke-linecap": "round", opacity: .9 });
  const fhIn = el("circle", { r: 7, fill: "#0B0C10", stroke: "#F4F6FA", "stroke-width": 2.5, opacity: 0 });
  const fhOut = el("circle", { r: 7, fill: "#0B0C10", stroke: "#F4F6FA", "stroke-width": 2.5, opacity: 0 });
  // marker
  const mk = [[.38, "Entrance", "#B9A6FF"], [.64, "Blackout", "#FFB547"]].map(([x, t, c]) => {
    const g = el("g", { opacity: 0, transform: `translate(${x * 1000},0)` });
    el("line", { x1: 0, x2: 0, y1: 8, y2: 372, stroke: c, "stroke-width": 1.6 }, g);
    el("path", { d: "M0 8h70l-8 10 8 10H0z", fill: c }, g);
    const tx = el("text", { x: 8, y: 23, fill: "#0B0C10", "font-family": "Space Grotesk", "font-weight": 700, "font-size": 11 }, g); tx.textContent = t;
    return g;
  });
  // loop
  const loopG = el("g", { opacity: 0 });
  el("rect", { x: trimL * 1000, y: 0, width: (trimR - trimL) * 1000, height: 380, fill: "rgba(95,231,255,.06)" }, loopG);
  el("rect", { x: trimL * 1000, y: 0, width: (trimR - trimL) * 1000, height: 5, fill: "#2CE07F" }, loopG);
  el("path", { d: `M${trimR * 1000 - 40} 30 a 14 14 0 1 0 14 -14 l -6 -6 m 6 6 l -6 6`, fill: "none", stroke: "#2CE07F", "stroke-width": 2.5, "stroke-linecap": "round" }, loopG);
  const loopTxt = el("text", { x: trimL * 1000 + 10, y: 26, fill: "#2CE07F", "font-family": "Space Grotesk", "font-weight": 700, "font-size": 13, "letter-spacing": 1.5 }, loopG);
  // testina
  const head = el("g", {});
  el("line", { x1: 0, x2: 0, y1: 0, y2: 380, stroke: "#5FE7FF", "stroke-width": 2 }, head);
  el("circle", { cx: 0, cy: 6, r: 6, fill: "#fff", stroke: "#5FE7FF", "stroke-width": 3 }, head);

  const fadeGain = (x, s4) => {
    let g = 1;
    if (x < fadeInE) g = map(x, trimL, fadeInE);
    else if (x > fadeOutS) g = 1 - map(x, fadeOutS, trimR);
    g = Math.sin(g * Math.PI / 2); // curva morbida
    return lerp(1, g, s4);
  };
  const stepsEl = $$("#waveSteps li"), wRead = $("#waveRead"), wClock = $("#waveClock"), wBpm = $("#waveBpm");
  const stepAt = [0, .17, .32, .48, .64, .80];

  function updWave(p) {
    const s1 = map(p, .02, .15), s2 = easeInOut(map(p, .18, .29)), s3 = easeInOut(map(p, .33, .45)),
          s4 = easeInOut(map(p, .49, .61)), s5 = map(p, .65, .77), s6 = map(p, .81, .97);
    let si = 0; stepAt.forEach((v, i) => { if (p >= v) si = i; });
    stepsEl.forEach((li, i) => li.classList.toggle("on", i === si));

    const norm = lerp(.55, 1, s2) / maxA;
    let px = map(p, 0, .8) * 1000, pass = 1;
    if (p > .8) {
      const lp = map(p, .8, 1) * 4;
      pass = Math.min(4, Math.floor(lp) + 1);
      px = lerp(trimL, trimR, lp - Math.floor(lp === 4 ? 3.999 : lp)) * 1000;
    }
    amps.forEach((a, i) => {
      const x = i / N, grow = easeOut(map(s1, x * .6, x * .6 + .4));
      const h = Math.max(1.5, a * norm * PEAK * grow * fadeGain(x, s4));
      const b = bars[i];
      b.setAttribute("y", (CY - h).toFixed(1)); b.setAttribute("height", (h * 2).toFixed(1));
      b.setAttribute("fill", i * BW < px ? "#C9FAFF" : "#5FE7FF");
      b.setAttribute("opacity", i * BW < px ? 1 : .72);
    });
    pkTop.setAttribute("opacity", s2 * .9); pkBot.setAttribute("opacity", s2 * .9); pkLab.setAttribute("opacity", s2);

    const L = lerp(0, trimL, s3) * 1000, R = lerp(1, trimR, s3) * 1000;
    dimL.setAttribute("width", L); dimR.setAttribute("x", R); dimR.setAttribute("width", 1000 - R);
    hL.setAttribute("opacity", map(s3, 0, .15)); hL.setAttribute("transform", `translate(${L},0)`);
    hR.setAttribute("opacity", map(s3, 0, .15)); hR.setAttribute("transform", `translate(${R},0)`);

    // curva del volume
    let d = ""; const top = CY - PEAK;
    for (let i = 0; i <= 200; i++) {
      const x = lerp(trimL, trimR, i / 200);
      const y = lerp(top, CY + PEAK, 1 - fadeGain(x, 1));
      if (i / 200 > s4 && s4 < 1) break;
      d += (i ? "L" : "M") + (x * 1000).toFixed(1) + " " + y.toFixed(1);
    }
    fadePath.setAttribute("d", s4 > 0 ? d : "");
    fhIn.setAttribute("cx", fadeInE * 1000); fhIn.setAttribute("cy", top); fhIn.setAttribute("opacity", map(s4, .2, .4));
    fhOut.setAttribute("cx", fadeOutS * 1000); fhOut.setAttribute("cy", top); fhOut.setAttribute("opacity", map(s4, .8, 1));

    beats.forEach((b, i) => b.setAttribute("opacity", map(s5, i / 24 * .6, i / 24 * .6 + .2)));
    mk.forEach((g, i) => g.setAttribute("opacity", map(s5, .5 + i * .2, .65 + i * .2)));

    loopG.setAttribute("opacity", s6 > 0 ? map(s6, 0, .15) : 0);
    loopTxt.textContent = `LOOP ×4 · LIVE ${pass}/4`;
    head.setAttribute("transform", `translate(${px},0)`);
    const secs = px / 1000 * 198;
    wClock.textContent = `${mmss(secs)}.${pad((secs * 100) % 100)}`;
    wRead.textContent = si === 0 ? (s1 < 1 ? "Analyzing…" : "Ready") : si === 1 ? `Normalization gain  +${(5.2 * s2).toFixed(1)} dB` :
      si === 2 ? "Auto-Trim Silence" : si === 3 ? `Fade in 2.4 s · Fade out 4.0 s · Constant power` :
      si === 4 ? "Snap to BPM · Grid 1/4" : "Seamless loop · micro-crossfade";
    wBpm.textContent = s5 > 0 ? `Detected tempo 120 BPM` : "";
  }

  /* ═════════ SCENA · RULLO ORIZZONTALE ═════════ */
  const reel = $(".reel"), track = $("#reelTrack"), ghost = $(".reel-ghost");
  const glyphs = $$(".glyph", track);
  // glifi generati
  seed = 11;
  const gb = $(".g-bars", track);
  if (gb) for (let i = 0; i < 18; i++) { const h = 18 + rnd() * 76; const r = document.createElementNS(NS, "rect"); Object.entries({ x: 14 + i * 10, y: 60 - h / 2 + 20 - 20, width: 6, height: h, rx: 3, fill: i < 11 ? "#5FE7FF" : "rgba(255,255,255,.25)" }).forEach(([k, v]) => r.setAttribute(k, v)); r.setAttribute("y", 64 - h / 2); gb.appendChild(r); }
  const gg = $(".g-grid", track);
  if (gg) for (let i = 0; i <= 16; i++) { const l = document.createElementNS(NS, "line"); const x = 20 + i * 10; Object.entries({ x1: x, x2: x, y1: 30, y2: 102, stroke: i % 4 ? "rgba(255,255,255,.12)" : "rgba(255,255,255,.35)", "stroke-width": 1.5 }).forEach(([k, v]) => l.setAttribute(k, v)); gg.appendChild(l); }
  let reelSpan = 0;
  function sizeReel() {
    reelSpan = Math.max(0, track.scrollWidth - innerWidth);
    reel.style.height = (reelSpan + innerHeight) + "px";
  }
  function updReel(p) {
    track.style.transform = `translate3d(${-p * reelSpan}px,0,0)`;
    ghost.style.transform = `translate3d(${-p * reelSpan * .35}px,-50%,0)`;
    const mid = innerWidth / 2;
    glyphs.forEach(g => {
      const r = g.parentElement.getBoundingClientRect();
      const d = (r.left + r.width / 2 - mid) / innerWidth;
      g.style.transform = `translate3d(${d * -60}px,0,0) rotate(${d * -6}deg)`;
    });
  }

  const gf = $(".g-film", track);
  if (gf) for (let i = 0; i < 5; i++) { const r = document.createElementNS(NS, "rect"); Object.entries({ x: 14 + i * 35, y: 16, width: 31, height: 52, rx: 4 }).forEach(([k, v]) => r.setAttribute(k, v)); gf.appendChild(r); const c = document.createElementNS(NS, "circle"); Object.entries({ cx: 29.5 + i * 35, cy: 42, r: 8 + (i % 3) * 3, fill: "rgba(95,231,255," + (.15 + i * .08) + ")" }).forEach(([k, v]) => c.setAttribute(k, v)); gf.appendChild(c); }

  /* ═════════ SCENA · MIXER ═════════ */
  // posizione del fader: scala da mixer, più precisione vicino a 0 dB (−60…+6)
  const dbToPos = db => db <= -60 ? 0 : Math.pow((db + 60) / 66, 2.2) * 100;
  const mixCues = [
    { n: 1, name: "Overture", from: -60, to: 0, live: [0, .45] },
    { n: 2, name: "Rain", from: -60, to: -8.5, live: [.3, 1] },
    { n: 3, name: "Thunder", from: -60, to: 3.5, live: [.55, .8] },
    { n: 4, name: "Curtain call", from: -60, to: -4, live: [.75, 1] }
  ];
  const mxRows = $("#mxRows");
  mxRows.innerHTML = mixCues.map(c => `<div class="mx-row"><span class="n">${c.n}</span><span class="nm">${c.name}<small>&nbsp;</small></span><div class="fader" style="--zero:${dbToPos(0)}%"><div class="f-scale"></div><div class="f-zero"></div><div class="f-fill"></div><div class="f-thumb"></div></div><span class="db">-∞</span></div>`).join("");
  const mxEls = $$(".mx-row", mxRows);
  const mf = $("#mxMasterFader"); mf.style.setProperty("--zero", dbToPos(0) + "%");
  const vuEls = ["L", "R"].map(c => ({ fill: $("#vu" + c), peak: $("#vuP" + c), hold: $("#vuH" + c), db: $("#vuD" + c), h: -90, ht: 0 }));
  const clipEl = $("#clip"); let clipT = 0;
  const dbPct = db => clamp((db + 60) / 60) * 100;
  const dbColor = db => db > -2 ? "#FF4D5E" : db > -6 ? "#FF9F43" : db > -18 ? "#FFD43B" : "#2CE07F";
  let mixP = 0;
  function updMixer(p) {
    mixP = p;
    let liveCount = 0;
    mixCues.forEach((c, i) => {
      const k = easeInOut(map(p, .05 + i * .08, .3 + i * .08));
      const db = lerp(c.from, c.to, k);
      const row = mxEls[i], f = row.querySelector(".fader");
      f.style.setProperty("--pos", dbToPos(db) + "%");
      f.classList.toggle("hot", db > 0);
      row.querySelector(".db").textContent = db <= -59.5 ? "-∞" : (db > 0 ? "+" : "") + db.toFixed(1);
      const live = p >= c.live[0] && p < c.live[1];
      if (live) liveCount++;
      row.classList.toggle("live", live);
      row.querySelector("small").textContent = live ? "● LIVE" : "\u00a0";
    });
    const mdb = lerp(-60, 0, easeOut(map(p, 0, .2)));
    mf.style.setProperty("--pos", dbToPos(mdb) + "%");
    $("#mxMasterDb").textContent = (mdb <= -59.5 ? "-∞" : mdb.toFixed(1)) + " dB";
    mixLive = liveCount;
  }
  let mixLive = 0, mixVisible = false;
  function meterTick(t) {
    if (!mixVisible) return;
    const base = mixLive ? -14 + mixLive * 2.5 : -90;
    const pk = mixP > .62 && mixP < .7;
    vuEls.forEach((v, i) => {
      const ph = i * 1.3;
      let rms = mixLive ? base + 6 * Math.sin(t * .006 + ph) * Math.sin(t * .0021 + ph) + 3 * Math.random() : -90;
      let peak = mixLive ? rms + 4 + 3 * Math.random() : -90;
      if (pk) { peak = -0.2 + Math.random() * .2; rms = -5; }
      if (peak > v.h || t - v.ht > 1500) { v.h = peak; v.ht = t; }
      v.fill.style.width = dbPct(rms) + "%";
      v.peak.style.width = dbPct(peak) + "%";
      const w = dbPct(rms) || 1;
      v.fill.style.setProperty("--w", (100 / w * 100) + "%");
      v.peak.style.setProperty("--w", (100 / (dbPct(peak) || 1) * 100) + "%");
      v.hold.style.left = `calc(${dbPct(v.h)}% - 1px)`;
      v.hold.style.opacity = v.h > -60 ? 1 : 0;
      v.db.textContent = v.h > -60 ? (v.h > 0 ? "+" : "") + v.h.toFixed(1) : "-∞";
      v.db.style.color = v.h > -60 ? dbColor(v.h) : "#8D909C";
      if (peak >= -0.1) clipT = t;
    });
    clipEl.classList.toggle("on", t - clipT < 1200);
  }

  /* ═════════ TASTIERA ═════════ */
  const keys = $$("#keyboard .key"), keySay = $("#keySay"), kbSec = $("#keys");
  const keyText = { "GO": "GO — fires the cue on standby", "PAUSE": "PAUSE — holds every playing cue", "FADE": "FADE — everything fades with the global fade time", "STOP": "STOP — stops the selected cue", "STOP ALL": "STOP ALL — press twice to stop instantly" };
  let kbInView = false, lastUser = 0, demoI = 0, demoT = 0;
  new IntersectionObserver(es => es.forEach(e => kbInView = e.isIntersecting), { threshold: .4 }).observe(kbSec);
  function press(k) {
    k.classList.add("down");
    keySay.textContent = keyText[k.dataset.act];
    setTimeout(() => k.classList.remove("down"), 220);
  }
  keys.forEach(k => k.addEventListener("pointerdown", () => { lastUser = performance.now(); press(k); }));
  addEventListener("keydown", e => {
    if (!kbInView) return;
    const k = keys.find(k => k.dataset.key.toLowerCase() === e.key.toLowerCase());
    if (!k) return;
    e.preventDefault(); lastUser = performance.now(); press(k);
  });
  function keysDemo(t) {
    if (!kbInView || t - lastUser < 4000 || t - demoT < 1300) return;
    demoT = t; press(keys[demoI++ % keys.length]);
  }

  /* ═════════ SCENA · LO SCREENSHOT VERO ═════════ */
  const realStage = $("#realStage"), callouts = $$(".callout", realStage);
  function updReal(p) {
    const e = easeOut(map(p, 0, .36));
    realStage.style.transform = `translate3d(0,${(1 - e) * 80}px,0) rotateX(${(1 - e) * 32}deg) scale(${.72 + .28 * e})`;
    realStage.style.opacity = .2 + .8 * map(p, 0, .15);
    callouts.forEach(c => c.classList.toggle("on", p >= +c.dataset.at && p < .97));
  }

  /* ═════════ GALLERIA: inclinazione e parallasse ═════════ */
  const tilts = $$("[data-tilt] img");
  function updGallery() {
    tilts.forEach((img, i) => {
      const r = img.getBoundingClientRect();
      if (r.bottom < -100 || r.top > innerHeight + 100) return;
      const d = clamp((r.top + r.height / 2 - innerHeight / 2) / innerHeight, -1, 1);
      const side = img.closest(".g-row").classList.contains("flip") ? -1 : 1;
      img.style.transform = `translate3d(0,${d * 60}px,0) rotateY(${d * 14 * side}deg) rotateX(${d * -6}deg) scale(${1 - Math.abs(d) * .06})`;
    });
  }
  const pads = $(".g-pads", track);
  if (pads) for (let r = 0; r < 2; r++) for (let c = 0; c < 4; c++) { const e = document.createElementNS(NS, "rect"); Object.entries({ x: 32 + c * 22, y: 34 + r * 28, width: 16, height: 22, rx: 4 }).forEach(([k, v]) => e.setAttribute(k, v)); if (r === 0 && c === 1) e.setAttribute("style", "fill:#5FE7FF;stroke:#5FE7FF"); pads.appendChild(e); }

  /* ═════════ SCENA · REMOTE ═════════ */
  const rmSec = $(".remote"), qrRects = $$(".qr rect");
  const qrOrder = qrRects.map((_, i) => i).sort(() => Math.random() - .5);
  const qrRank = new Array(qrRects.length); qrOrder.forEach((r, k) => qrRank[r] = k / qrRects.length);
  const ipadScr = $("#rmIpad .scr"), phoneScr = $("#rmPhone .scr");
  const rmSteps = $$("#rmSteps li"), rmDevs = $$("#rmDevs span"), rmDevN = $("#rmDevices");
  const ipadRole = $("#ipadRole"), phoneRole = $("#phoneRole"), pairTxt = $("#pairTxt"), pGo = $(".p-go");
  const rmAt = [0, .17, .33, .5, .66, .82];
  let lastRm = -1;
  function updRemote(p) {
    const q = map(p, .02, .15);
    qrRects.forEach((r, i) => r.classList.toggle("on", qrRank[i] < q));
    let si = 0; rmAt.forEach((v, i) => { if (p >= v) si = i; });
    rmSteps.forEach((li, i) => li.classList.toggle("on", i === si));
    rmSec.classList.toggle("ph-in", p >= .17);
    rmSec.classList.toggle("scanning", p >= .18 && p < .27);
    rmSec.classList.toggle("ip-in", p >= .5);
    phoneScr.classList.toggle("paired", p >= .27);
    phoneScr.classList.toggle("app", p >= .33);
    phoneScr.classList.toggle("operator", p >= .82);
    pairTxt.textContent = p >= .27 ? "Paired — no password" : "Connecting…";
    ipadScr.classList.toggle("stage", p >= .66 && p < .82);
    ipadRole.textContent = p >= .66 && p < .82 ? "STAGE" : "VIEWER";
    ipadRole.classList.toggle("stage", p >= .66 && p < .82);
    phoneRole.textContent = p >= .82 ? "OPERATOR" : "VIEWER";
    phoneRole.classList.toggle("operator", p >= .82);
    const nDev = p < .27 ? 0 : p < .33 ? 1 : Math.min(4, 1 + Math.floor(map(p, .33, .48) * 3.99));
    rmDevs.forEach((d, i) => d.classList.toggle("on", i < nDev));
    rmDevN.textContent = nDev + (nDev === 1 ? " device" : " devices");
    if (si !== lastRm && si === 5) { pGo.classList.add("hit"); setTimeout(() => pGo.classList.remove("hit"), 400); }
    lastRm = si;
  }
  // countdown "live" sugli schermi del remote
  const remEls = $$(".remote [data-rem]"), progEls = $$(".remote [data-prog]"), mkEls = $$(".remote [data-mk]");
  const fmtRem = s => `${Math.floor(s / 60)}:${(s % 60).toFixed(1).padStart(4, "0")}`;
  function remoteTick(t) {
    const r = rmSec.getBoundingClientRect();
    if (r.bottom < 0 || r.top > innerHeight) return;
    const rem = 65 - ((t / 1000) % 60);
    remEls.forEach(e => { e.textContent = fmtRem(rem); e.classList.toggle("warn", rem < 15 && rem >= 5); e.classList.toggle("end", rem < 5); });
    progEls.forEach(e => e.style.width = ((65 - rem) / 65 * 100) + "%");
    mkEls.forEach(e => e.textContent = fmtRem(Math.max(0, rem - 34)));
  }

  /* ═════════ SCENA · GO ═════════ */
  const goKey = $(".go-key"), goPre = $(".go-pre"), goReady = $(".go-ready"), flash = $(".go-flash"), rings = $$(".ring");
  function updGo(p) {
    const k = easeOut(map(p, 0, .45));
    const press = map(p, .48, .53) - map(p, .56, .62);
    const lift = easeOut(map(p, .6, .85));
    goKey.style.transform = `translate3d(0,${press * 22 - lift * innerHeight * .08}px,0) scale(${(0.55 + .45 * k) * (1 - lift * .25)})`;
    goKey.style.boxShadow = `0 ${26 - press * 22}px 0 #0A8FAB, 0 40px ${90 + press * 80}px rgba(95,231,255,${.35 + press * .4})`;
    goPre.style.opacity = map(p, .02, .15) * (1 - map(p, .42, .5));
    flash.style.opacity = Math.max(0, 1 - Math.abs(p - .54) / .08);
    rings.forEach((r, i) => {
      const t = map(p, .52 + i * .05, .9 + i * .05);
      r.style.opacity = t > 0 && t < 1 ? (1 - t) * .8 : 0;
      r.style.transform = `translate3d(0,${-lift * innerHeight * .08}px,0) scale(${1 + t * 2.6})`;
    });
    const rd = easeOut(map(p, .62, .8));
    goReady.style.opacity = rd;
    goReady.style.transform = `translate3d(0,${(1 - rd) * 40}px,0)`;
    goReady.style.filter = `blur(${(1 - rd) * 12}px)`;
  }

  /* ═════════ APERTURA ═════════ */
  const logo = $(".intro-logo"), ghostLA = $(".intro-ghost"), dim = $(".intro-dim"), hint = $(".scroll-hint");
  function updIntro(p) {
    const e = easeInOut(map(p, 0, .7));
    logo.style.transform = `translate3d(0,${-e * innerHeight * .1}px,0) scale(${1 - e * .32})`;
    logo.style.opacity = 1 - map(p, .5, .78);
    logo.style.filter = `blur(${map(p, .5, .78) * 10}px)`;
    ghostLA.style.transform = `translate(-50%,calc(-50% + ${p * 26}vh)) scale(${1 + p * .25})`;
    const dIn = map(p, .42, .6), dOut = map(p, .82, .97);
    dim.style.opacity = dIn * (1 - dOut);
    dim.style.transform = `translate3d(0,${(1 - dIn) * 30 - dOut * 30}px,0)`;
    dim.style.filter = `blur(${(1 - dIn) * 8}px)`;
    hint.style.visibility = p > .04 ? "hidden" : "visible";
  }

  /* ═════════ DOWNLOAD: icona in parallasse + inclinazione ═════════ */
  const icon = $("#dlIcon"), dl = $(".download");
  let tiltX = 0, tiltY = 0;
  dl.addEventListener("pointermove", e => {
    const r = icon.getBoundingClientRect();
    tiltY = clamp((e.clientX - (r.left + r.width / 2)) / 300, -1, 1);
    tiltX = clamp((e.clientY - (r.top + r.height / 2)) / 300, -1, 1);
  });
  dl.addEventListener("pointerleave", () => { tiltX = tiltY = 0; });
  function updDl() {
    const r = dl.getBoundingClientRect();
    const p = clamp((innerHeight - r.top) / (innerHeight + r.height));
    icon.style.transform = `perspective(800px) translate3d(0,${(.5 - p) * 120}px,0) rotateX(${-tiltX * 12}deg) rotateY(${tiltY * 12}deg)`;
  }

  /* ═════════ parallasse generica ═════════ */
  const speeds = $$("[data-speed]").map(e => ({ e, s: +e.dataset.speed, sec: e.closest("section") }));
  function updSpeeds() {
    speeds.forEach(({ e, s, sec }) => {
      const r = sec.getBoundingClientRect();
      const d = r.top + r.height / 2 - innerHeight / 2;
      e.style.transform = `translate3d(0,${d * s}px,0)`;
    });
  }

  /* ═════════ WORKSTATIONS: modi che si alternano ═════════ */
  const wsRemote = $("#wsRemote"), wsMode = $("#wsMode"), wsModes = $$(".ws-mode"), wsRem = $$("[data-wsrem]");
  const WS = ["full", "view", "list", "stage"];
  let wsI = 0, wsVisible = false, wsPinned = 0;
  if (wsRemote) {
    new IntersectionObserver(es => es.forEach(e => wsVisible = e.isIntersecting), { threshold: .2 }).observe(wsRemote);
    const setWs = m => {
      wsRemote.dataset.mode = m; wsMode.textContent = m.toUpperCase();
      wsModes.forEach(c => c.classList.toggle("on", c.dataset.m === m));
    };
    wsModes.forEach(c => c.addEventListener("click", () => { wsPinned = performance.now(); setWs(c.dataset.m); wsI = WS.indexOf(c.dataset.m); }));
    setWs("full");
    setInterval(() => {
      if (!wsVisible || performance.now() - wsPinned < 6000) return;
      wsI = (wsI + 1) % WS.length; setWs(WS[wsI]);
    }, 2600);
    setInterval(() => {
      if (!wsVisible) return;
      const r = 161.6 - ((performance.now() / 1000) % 150);
      wsRem.forEach(e => e.textContent = `${Math.floor(r / 60)}:${(r % 60).toFixed(1).padStart(4, "0")}`);
    }, 100);
  }

  /* ═════════ CONTATTI: invio del modulo ═════════ */
  const ctForm = $("#ctForm");
  if (ctForm) ctForm.addEventListener("submit", async e => {
    e.preventDefault();
    const st = $("#ctStatus"), btn = $("#ctSend");
    if (ctForm._honey.value) return;
    btn.disabled = true; st.className = "ct-status"; st.textContent = "Sending…";
    const data = Object.fromEntries(new FormData(ctForm).entries());
    try {
      const r = await fetch("https://formsubmit.co/ajax/info@lacue.app", {
        method: "POST", headers: { "Content-Type": "application/json", "Accept": "application/json" },
        body: JSON.stringify(data)
      });
      const j = await r.json().catch(() => ({}));
      if (!r.ok || j.success === "false" || j.success === false) throw new Error(j.message || "error");
      ctForm.reset();
      st.className = "ct-status ok"; st.textContent = "Thank you — your message is on its way. I’ll get back to you soon.";
    } catch (err) {
      st.className = "ct-status err";
      st.innerHTML = 'Something went wrong. Please write to <a href="mailto:info@lacue.app">info@lacue.app</a>.';
    }
    btn.disabled = false;
  });

  /* ═════════ copia comando installazione ═════════ */
  const olBtn = $("#olCopy");
  if (olBtn) olBtn.addEventListener("click", async () => {
    try { await navigator.clipboard.writeText($("#olCmd").textContent); olBtn.textContent = "Copied ✓"; }
    catch (e) { const r = document.createRange(); r.selectNodeContents($("#olCmd")); getSelection().removeAllRanges(); getSelection().addRange(r); olBtn.textContent = "Press ⌘C"; }
    setTimeout(() => olBtn.textContent = "Copy", 2000);
  });

  /* ═════════ loop ═════════ */
  const scenes = { intro: updIntro, real: updReal, remote: updRemote, show: updShow, wave: updWave, mixer: updMixer, reel: updReel, go: updGo };
  const sceneEls = $$("[data-scene]");
  const nav = $(".nav"), sbFill = $(".scrollbar-fill"), sbHead = $(".scrollbar-head"), intro = $(".intro");
  function sceneP(s) {
    const r = s.getBoundingClientRect();
    const span = s.offsetHeight - innerHeight;
    return span > 0 ? clamp(-r.top / span) : 0;
  }
  function frame(t) {
    sceneEls.forEach(s => {
      const r = s.getBoundingClientRect();
      if (r.bottom < -50 || r.top > innerHeight + 50) return;
      scenes[s.dataset.scene](sceneP(s));
    });
    const mr = $(".mixer").getBoundingClientRect();
    mixVisible = mr.bottom > 0 && mr.top < innerHeight;
    meterTick(t); keysDemo(t); remoteTick(t);
    updSpeeds(); updDl(); updGallery(); drawSine(t); drawDust(t);
    const docP = clamp(scrollY / (document.documentElement.scrollHeight - innerHeight));
    sbFill.style.width = docP * 100 + "%";
    sbHead.style.left = docP * 100 + "%";
    nav.classList.toggle("on", scrollY > intro.offsetHeight * .55);
    requestAnimationFrame(frame);
  }
  function resize() { sizeDust(); sizeReel(); }
  addEventListener("resize", resize);
  resize();
  (document.fonts ? document.fonts.ready : Promise.resolve()).then(sizeReel);
  updShow(0); updWave(0); updMixer(0);
  requestAnimationFrame(frame);
})();
