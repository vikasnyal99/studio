// Story animations in the flat 2D cartoon style, built on the Lab figure rig (figures.js).
// Toon.run(tl, svg, spec, t0, t1) draws one self-contained scene into an <svg viewBox="0 0 1920 1080">
// and adds its motion to the paused GSAP timeline at absolute seconds. kinds: phone, crowd, travel, lift, fight, candle.
// Everything is deterministic (seeded) so a render and a check show the same frame.
const Toon = (() => {
  const L = Lab, el = L.el;
  const SANS = "Inter, sans-serif", SERIF = "'DM Serif Display', serif";
  const rng = (seed) => { let s = seed || 7; return () => (s = (s * 16807) % 2147483647) / 2147483647; };
  const SHIRTS = ["#3b82c4", "#d6402f", "#e8b34b", "#4f9d69", "#8e5bd0", "#e07a3a", "#2a9bb0", "#c2477a"];
  const SKINS = ["#e0a77f", "#c98e63", "#f0c7a0", "#b57c52"];
  const MOODS = {
    day: ["#f4c98a", "#e89a62", "#cf7a4d", "#7a4a35"],
    dusk: ["#2b2f5a", "#8a4a6b", "#e07a4a", "#2a1f2b"],
    night: ["#070a16", "#101a33", "#1c2a4d", "#0d0f18"],
    gym: ["#1a1c22", "#262a33", "#32363f", "#14161b"],
  };

  function text(parent, x, y, str, size, fill, o = {}) {
    const t = el("text", { x, y, "font-family": o.serif ? SERIF : SANS, "font-size": size, "font-weight": o.weight || 700, fill, "text-anchor": o.anchor || "middle",
                           "letter-spacing": o.spacing || 0, opacity: o.opacity == null ? 1 : o.opacity }, parent);
    t.textContent = str;
    return t;
  }

  function stage(svg, id, mood, ground, o = {}) {
    const P = MOODS[mood] || MOODS.day;
    const defs = el("defs", {}, svg);
    const g = el("linearGradient", { id: id + "sky", x1: 0, y1: 0, x2: 0, y2: 1 }, defs);
    el("stop", { offset: 0, "stop-color": P[0] }, g); el("stop", { offset: 0.55, "stop-color": P[1] }, g); el("stop", { offset: 1, "stop-color": P[2] }, g);
    el("rect", { width: 1920, height: 1080, fill: `url(#${id}sky)` }, svg);
    const r = rng(11);
    if (mood === "night" || mood === "dusk") for (let i = 0; i < 50; i++) el("circle", { cx: r() * 1920, cy: r() * ground * 0.6, r: 1 + r() * 2.2, fill: "#fff", opacity: 0.25 + r() * 0.5 }, svg);
    if (o.skyline !== false && mood !== "gym") {   // a row of flat buildings along the horizon
      const dark = mood === "day" ? "#a35f3f" : "#0d1020";
      let x = -40;
      while (x < 1960) { const w = 90 + r() * 130, h = 120 + r() * 260; el("rect", { x, y: ground - h, width: w, height: h, fill: dark, opacity: 0.85 }, svg);
        for (let k = 0; k < 6; k++) if (r() > 0.55) el("rect", { x: x + 14 + (k % 3) * (w / 3.4), y: ground - h + 24 + Math.floor(k / 3) * 46, width: 14, height: 20, fill: mood === "day" ? "#f8dca8" : "#ffd27a", opacity: 0.7 }, svg);
        x += w + 8; }
    }
    el("rect", { y: ground, width: 1920, height: 1080 - ground, fill: P[3] }, svg);
    el("rect", { y: ground, width: 1920, height: 6, fill: "rgba(255,255,255,0.12)" }, svg);
    return P;
  }

  function person(svg, x, y, s, o = {}) {
    return L.figure(svg, x, y, s, { kind: "flat", outline: 3, shadow: true, skin: o.skin || SKINS[0], shirt: o.shirt || SHIRTS[0], pants: o.pants || "#2c3e50",
                                    hair: o.hair || "#1d1712", hairStyle: o.hair_style || "short", sw: o.sw || 26, L: o.L, flip: o.flip, face: o.face });
  }
  const strong = (o = {}) => Object.assign({ sw: 44, L: { shX: 78, hipX: 28, torso: 200, upper: 92, fore: 84, leg: 175, head: 58 }, skin: "#c98e63", shirt: "#d6402f", pants: "#1f2630" }, o);

  // a punchy comic word that pops and fades
  function burst(svg, x, y, word, at, tl, color = "#ffd60a") {
    const g = el("g", { opacity: 0 }, svg);
    const pts = []; for (let i = 0; i < 16; i++) { const a = (i / 16) * Math.PI * 2, r = i % 2 ? 80 : 140; pts.push(`${x + Math.cos(a) * r},${y + Math.sin(a) * r * 0.75}`); }
    el("polygon", { points: pts.join(" "), fill: color, stroke: "#111", "stroke-width": 6, "stroke-linejoin": "round" }, g);
    text(g, x, y + 22, word, 70, "#111", { weight: 900 });
    tl.fromTo(g, { opacity: 0, scale: 0.3, svgOrigin: `${x} ${y}` }, { opacity: 1, scale: 1, svgOrigin: `${x} ${y}`, duration: 0.18, ease: "back.out(3)" }, at);
    tl.to(g, { opacity: 0, duration: 0.25 }, at + 0.55);
  }

  // ---- kinds ----------------------------------------------------------------------------------

  // a figure reacting to news on a big phone whose feed fills with posts
  function phone(tl, svg, o, t0, t1) {
    const ground = 900; stage(svg, o.id, o.mood || "dusk", ground, { skyline: false });
    const px = 1180, py = 130;
    const ph = el("g", { opacity: 0 }, svg);
    el("rect", { x: px, y: py, width: 420, height: 760, rx: 54, fill: "#0d0f14", stroke: "#2e3340", "stroke-width": 8 }, ph);
    el("rect", { x: px + 22, y: py + 60, width: 376, height: 650, rx: 20, fill: "#171a22" }, ph);
    el("rect", { x: px + 150, y: py + 20, width: 120, height: 14, rx: 7, fill: "#2e3340" }, ph);
    tl.fromTo(ph, { opacity: 0, y: 60 }, { opacity: 1, y: 0, duration: 0.45, ease: "power3.out" }, t0);
    const posts = (o.posts || 5);
    for (let i = 0; i < posts; i++) {
      const g = el("g", { opacity: 0 }, ph), yy = py + 90 + i * 120;
      el("rect", { x: px + 36, y: yy, width: 348, height: 100, rx: 14, fill: "#222734" }, g);
      el("circle", { cx: px + 80, cy: yy + 50, r: 26, fill: SHIRTS[i % SHIRTS.length] }, g);
      el("rect", { x: px + 124, y: yy + 28, width: 190 - (i % 3) * 30, height: 14, rx: 7, fill: "#8d93a6" }, g);
      el("rect", { x: px + 124, y: yy + 56, width: 130, height: 12, rx: 6, fill: "#4a5063" }, g);
      L.pop(tl, g, t0 + 1.0 + i * 0.35, 0.3);
    }
    const bn = el("g", { opacity: 0 }, svg);
    el("rect", { x: px + 6, y: py + 76, width: 408, height: 120, rx: 18, fill: "#d9574a" }, bn);
    text(bn, px + 210, py + 122, o.banner || "BREAKING", 38, "#fff", { spacing: 6, weight: 900 });
    text(bn, px + 210, py + 166, o.sub || "ek khabar...", 26, "#ffe1dc", { weight: 500 });
    tl.fromTo(bn, { opacity: 0, y: -50 }, { opacity: 1, y: 0, duration: 0.3, ease: "back.out(2)" }, t0 + 0.7);
    const f = person(svg, 560, ground, 1.6, { shirt: "#3b82c4" });
    tl.fromTo(f.mover, { x: -300 }, { x: 0, duration: 0.6, ease: "power2.out" }, t0);
    L.point(tl, f, t0 + 0.9, 0.3); L.shrug(tl, f, t0 + 1.8, 0.3); L.blink(tl, f, t0 + 1.4);
    tl.set(f.open, { opacity: 1 }, t0 + 2.0); tl.set(f.closed, { opacity: 0 }, t0 + 2.0);
    tl.to(f.head, { rotation: 8, svgOrigin: "0 0", duration: 0.3 }, t0 + 1.8);
  }

  // a crowd of small figures converges on a sign
  function crowd(tl, svg, o, t0, t1) {
    const ground = 900, n = o.n || 26; stage(svg, o.id, o.mood || "dusk", ground);
    const r = rng(o.seed || 5), cx = 960;
    const sign = el("g", { opacity: 0 }, svg);
    el("rect", { x: cx - 330, y: 420, width: 660, height: 380, fill: "#2a2f3d", stroke: "#111", "stroke-width": 5 }, sign);
    el("rect", { x: cx - 330, y: 420, width: 660, height: 70, fill: "#e8b34b" }, sign);
    text(sign, cx, 470, o.sign || "GYM", 44, "#111", { spacing: 6, weight: 900 });
    el("rect", { x: cx - 70, y: 600, width: 140, height: 200, fill: "#14161b" }, sign);
    for (const dx of [-230, 160]) el("rect", { x: cx + dx, y: 540, width: 80, height: 70, fill: "#ffd27a", opacity: 0.8 }, sign);
    tl.fromTo(sign, { opacity: 0, y: 40 }, { opacity: 1, y: 0, duration: 0.5, ease: "power3.out" }, t0);
    const span = Math.max(0.5, (t1 - t0) - 2.2);
    for (let i = 0; i < n; i++) {
      const fromLeft = i % 2 === 0, s = 0.34 + r() * 0.12;
      const target = cx + (r() - 0.5) * 1400, y = ground + 40 + r() * 70;
      const f = person(svg, 0, y, s, { shirt: SHIRTS[Math.floor(r() * SHIRTS.length)], skin: SKINS[Math.floor(r() * SKINS.length)], pants: r() > 0.5 ? "#2c3e50" : "#3b3b45" });
      const x0 = fromLeft ? -150 : 2070, start = t0 + 0.4 + (i / n) * span, dur = 1.3 + r() * 0.9;
      const end = target; f.mover.setAttribute("opacity", 1);
      L.walk(tl, f, start, start + dur, x0, end, { step: 0.2, swing: 22, moveEase: "power1.out" });
      if (r() > 0.6) L.wave(tl, f, start + dur + 0.05, start + dur + 0.9);
      tl.set(f.mover, { x: end }, start + dur + 0.01);
    }
    if (o.big) {   // a big word that grows as people arrive
      const w = text(svg, cx, 250, o.big, 150, "#fff", { serif: true, weight: 400, opacity: 0 });
      tl.fromTo(w, { opacity: 0, scale: 0.6, svgOrigin: `${cx} 250` }, { opacity: 1, scale: 1, svgOrigin: `${cx} 250`, duration: 0.5, ease: "back.out(2)" }, t0 + (o.big_at || 1.4));
    }
  }

  // people travelling long distances to one place: dashed roads, moving dots, distance labels
  function travel(tl, svg, o, t0, t1) {
    const ground = 1080; stage(svg, o.id, "night", 1080, { skyline: false });
    const dest = o.dest || [1100, 540], origins = o.origins || [["Alwar", 300, 800, "200 km"], ["Dusre shehar", 380, 220, "300 km"], ["Door se", 1600, 880, "250 km"]];
    const grid = el("g", { opacity: 0.1 }, svg);
    for (let x = 0; x <= 1920; x += 80) el("line", { x1: x, y1: 0, x2: x, y2: 1080, stroke: "#8fb4ff", "stroke-width": 1 }, grid);
    for (let y = 0; y <= 1080; y += 80) el("line", { x1: 0, y1: y, x2: 1920, y2: y, stroke: "#8fb4ff", "stroke-width": 1 }, grid);
    const pin = el("g", {}, svg);
    el("circle", { cx: dest[0], cy: dest[1], r: 18, fill: "#e8b34b" }, pin);
    const ring = el("circle", { cx: dest[0], cy: dest[1], r: 18, fill: "none", stroke: "#e8b34b", "stroke-width": 4 }, svg);
    text(svg, dest[0], dest[1] - 40, o.dest_name || "Fatehpur Beri", 34, "#fff", { weight: 800 });
    tl.fromTo(ring, { scale: 1, opacity: 0.9, svgOrigin: `${dest[0]} ${dest[1]}` }, { scale: 5, opacity: 0, duration: 1.2, repeat: Math.floor((t1 - t0) / 1.2), svgOrigin: `${dest[0]} ${dest[1]}`, ease: "power1.out" }, t0 + 0.2);
    origins.forEach(([name, ox, oy, dist], i) => {
      const mx = (ox + dest[0]) / 2, my = (oy + dest[1]) / 2 + (i % 2 ? -140 : 140);
      const path = el("path", { d: `M${ox} ${oy} Q${mx} ${my} ${dest[0]} ${dest[1]}`, fill: "none", stroke: "#e8b34b", "stroke-width": 5, "stroke-dasharray": "3 16", "stroke-linecap": "round", opacity: 0.85, pathLength: 1 }, svg);
      const start = t0 + 0.5 + i * 0.7, dur = Math.max(1.5, (t1 - start) - 1.2);
      tl.fromTo(path, { strokeDasharray: "0 1" }, { strokeDasharray: "1 0", duration: dur, ease: "none" }, start);
      const dot = el("g", { opacity: 0 }, svg);
      el("circle", { r: 16, fill: "#fff", stroke: "#111", "stroke-width": 4 }, dot); el("circle", { cy: -26, r: 11, fill: "#fff", stroke: "#111", "stroke-width": 4 }, dot);
      const st = { p: 0 }, len = path.getTotalLength ? path.getTotalLength() : 1000;
      const draw = () => { const pt = path.getPointAtLength(st.p * len); dot.setAttribute("transform", `translate(${pt.x},${pt.y})`); };
      draw();
      tl.set(dot, { opacity: 1 }, start);
      tl.fromTo(st, { p: 0 }, { p: 1, duration: dur, ease: "power1.inOut", onUpdate: draw }, start);
      const lab = el("g", { opacity: 0 }, svg);
      el("rect", { x: ox - 120, y: oy - 74, width: 240, height: 100, rx: 14, fill: "rgba(10,12,20,0.85)", stroke: "#e8b34b", "stroke-width": 3 }, lab);
      text(lab, ox, oy - 34, name, 30, "#fff", { weight: 700 });
      text(lab, ox, oy + 6, dist, 38, "#e8b34b", { weight: 900 });
      L.pop(tl, lab, start - 0.1, 0.35);
    });
  }

  // side view of a bodybuilder on a bench pressing a loaded bar, with a weight counter
  function lift(tl, svg, o, t0, t1) {
    const ground = 880; stage(svg, o.id, "gym", ground, { skyline: false });
    // wall posters (flat plates)
    const r = rng(3);
    for (let i = 0; i < 5; i++) el("rect", { x: 140 + i * 360, y: 160, width: 200, height: 270, fill: "#1f232c", stroke: "#3a3f4c", "stroke-width": 4 }, svg);
    const bx = 760, benchY = 700, chestY = benchY - 36, barRest = chestY - 24, barUp = chestY - 330;
    el("rect", { x: bx - 130, y: benchY, width: 620, height: 34, rx: 10, fill: "#3a3f4c", stroke: "#111", "stroke-width": 4 }, svg);
    for (const lx of [bx - 100, bx + 440]) el("rect", { x: lx, y: benchY + 34, width: 24, height: ground - benchY - 34, fill: "#2a2e38" }, svg);
    // rack uprights
    for (const rx of [bx + 40, bx + 360]) el("rect", { x: rx, y: barUp - 60, width: 22, height: ground - barUp + 60 - 6, fill: "#2a2e38" }, svg);
    // lifter: legs, torso, head (side view, lying)
    const body = el("g", {}, svg);
    el("path", { d: `M${bx + 380} ${benchY - 18} L${bx + 560} ${benchY - 18} L${bx + 600} ${ground - 8}`, fill: "none", stroke: "#1f2630", "stroke-width": 52, "stroke-linecap": "round", "stroke-linejoin": "round" }, body);
    el("rect", { x: bx - 60, y: benchY - 82, width: 470, height: 80, rx: 40, fill: "#c98e63", stroke: "#111", "stroke-width": 4 }, body);
    el("rect", { x: bx + 120, y: benchY - 86, width: 290, height: 86, rx: 30, fill: "#d6402f", stroke: "#111", "stroke-width": 4 }, body);
    el("circle", { cx: bx - 120, cy: benchY - 52, r: 52, fill: "#c98e63", stroke: "#111", "stroke-width": 4 }, body);
    el("path", { d: `M${bx - 168} ${benchY - 78} Q${bx - 120} ${benchY - 130} ${bx - 72} ${benchY - 78}`, fill: "#1d1712" }, body);
    // arms follow the bar: a line from the shoulder to the bar height
    const sh = bx + 120;
    const arm = el("line", { x1: sh, y1: chestY, x2: sh, y2: barRest, stroke: "#c98e63", "stroke-width": 40, "stroke-linecap": "round" }, svg);
    const armEdge = el("line", { x1: sh, y1: chestY, x2: sh, y2: barRest, stroke: "#111", "stroke-width": 48, "stroke-linecap": "round", opacity: 0.35 }, svg);
    svg.insertBefore(armEdge, arm);
    const bar = el("g", {}, svg);
    el("rect", { x: sh - 440, y: -7, width: 880, height: 14, rx: 7, fill: "#aab0bd", stroke: "#111", "stroke-width": 3 }, bar);
    const plates = [["#d6402f", 190, 38], ["#e8b34b", 160, 30], ["#4f9d69", 130, 26]];
    for (const dir of [-1, 1]) { let off = 330; for (const [c, h, w] of plates) { el("rect", { x: sh + dir * off - (dir < 0 ? w : 0), y: -h / 2, width: w, height: h, rx: 6, fill: c, stroke: "#111", "stroke-width": 3 }, bar); off += w + 4; } }
    const set = (y) => { bar.setAttribute("transform", `translate(0,${y})`); arm.setAttribute("y2", y); armEdge.setAttribute("y2", y); };
    set(barRest);
    const st = { y: barRest }, reps = o.reps || 4, per = Math.max(0.8, (t1 - t0 - 1.4) / reps);
    tl.fromTo(svg, { opacity: 0 }, { opacity: 1, duration: 0.25 }, t0);
    for (let k = 0; k < reps; k++) {
      const a = t0 + 0.8 + k * per;
      tl.to(st, { y: barUp, duration: per * 0.45, ease: "power2.out", onUpdate: () => set(st.y) }, a);
      tl.to(st, { y: barRest, duration: per * 0.5, ease: "power2.inOut", onUpdate: () => set(st.y) }, a + per * 0.5);
    }
    const big = text(svg, 1500, 420, "0", 170, "#fff", { weight: 900, serif: false });
    big.id = o.id + "kg"; text(svg, 1500, 480, o.unit || "KG", 44, "#e8b34b", { weight: 800, spacing: 8 });
    L.counter(tl, "#" + o.id + "kg", t0 + 0.8, Math.max(1.2, (t1 - t0) * 0.6), o.to || 220, "", "");
    if (o.label) text(svg, 1500, 560, o.label, 34, "rgba(255,255,255,0.7)", { weight: 600 });
  }

  // one big strong figure and several small attackers who get knocked away (comic, no blood)
  function fight(tl, svg, o, t0, t1) {
    const ground = 880; stage(svg, o.id, o.mood || "dusk", ground);
    const hero = person(svg, 960, ground, 1.35, strong());
    tl.fromTo(hero.mover, { y: -400, opacity: 0 }, { y: 0, opacity: 1, duration: 0.35, ease: "bounce.out" }, t0);
    const n = o.n || 6, r = rng(9);
    for (let i = 0; i < n; i++) {
      const left = i % 2 === 0, s = 0.78 + r() * 0.1, x0 = left ? -200 : 2120, stop = left ? 470 + (i >> 1) * 85 : 1450 - (i >> 1) * 85;
      const a = person(svg, 0, ground + 4, s, { shirt: SHIRTS[(i + 2) % SHIRTS.length], skin: SKINS[i % SKINS.length], flip: !left });
      const start = t0 + 0.5 + i * 0.28, arrive = start + 1.0, hit = arrive + 0.35 + (i >> 1) * 0.55;
      L.walk(tl, a, start, arrive, x0, stop, { step: 0.2, swing: 22 });
      tl.set(a.mover, { x: stop }, arrive + 0.01);
      L.fist(tl, a, arrive + 0.05, 0.2);
      // the hero punches towards that side, the attacker is flung away spinning
      const pr = left ? hero.armL : hero.armR, pf = left ? hero.foreL : hero.foreR;
      tl.to(pr, { rotation: left ? 100 : -100, svgOrigin: "0 0", duration: 0.1 }, hit - 0.1); tl.to(pf, { rotation: left ? 10 : -10, svgOrigin: "0 0", duration: 0.1 }, hit - 0.1);
      tl.to(pr, { rotation: 0, svgOrigin: "0 0", duration: 0.25 }, hit + 0.15); tl.to(pf, { rotation: 0, svgOrigin: "0 0", duration: 0.25 }, hit + 0.15);
      tl.to(a.mover, { x: left ? stop - 900 : stop + 900, y: -260, rotation: left ? -540 : 540, svgOrigin: `${stop} ${ground}`, duration: 0.7, ease: "power2.out" }, hit);
      tl.to(a.mover, { opacity: 0, duration: 0.2 }, hit + 0.5);
      burst(svg, left ? stop + 70 : stop - 70, ground - 320, ["POW!", "BAM!", "THWACK!"][i % 3], hit, tl, i % 2 ? "#ff7a45" : "#ffd60a");
    }
    if (o.big) {
      const w = text(svg, 960, 190, o.big, 120, "#fff", { serif: true, weight: 400, opacity: 0 });
      tl.fromTo(w, { opacity: 0, y: -30 }, { opacity: 1, y: 0, duration: 0.5, ease: "power2.out" }, t0 + 0.2);
    }
  }

  // a candle in the dark and two figures with bowed heads: a quiet, respectful beat
  function candle(tl, svg, o, t0, t1) {
    const ground = 900; stage(svg, o.id, "night", ground, { skyline: o.skyline });
    const cx = 960, base = 820;
    const glow = el("circle", { cx, cy: base - 150, r: 420, fill: "rgba(255,190,100,0.16)" }, svg);
    tl.fromTo(glow, { opacity: 0.5, scale: 1, svgOrigin: `${cx} ${base - 150}` }, { opacity: 1, scale: 1.12, svgOrigin: `${cx} ${base - 150}`, duration: 1.4, ease: "sine.inOut", repeat: Math.floor((t1 - t0) / 1.4), yoyo: true }, t0);
    el("rect", { x: cx - 36, y: base - 170, width: 72, height: 190, rx: 8, fill: "#f2e3b3", stroke: "#111", "stroke-width": 4 }, svg);
    const flame = el("g", {}, svg);
    el("path", { d: `M${cx} ${base - 330} C${cx + 46} ${base - 260} ${cx + 38} ${base - 200} ${cx} ${base - 184} C${cx - 38} ${base - 200} ${cx - 46} ${base - 260} ${cx} ${base - 330} Z`, fill: "#ff9d3a" }, flame);
    el("path", { d: `M${cx} ${base - 290} C${cx + 22} ${base - 250} ${cx + 18} ${base - 214} ${cx} ${base - 202} C${cx - 18} ${base - 214} ${cx - 22} ${base - 250} ${cx} ${base - 290} Z`, fill: "#ffe9a8" }, flame);
    const r = rng(2);
    for (let t = t0; t < t1; t += 0.12) tl.set(flame, { scaleY: 0.92 + r() * 0.2, scaleX: 0.92 + r() * 0.16, rotation: (r() - 0.5) * 6, svgOrigin: `${cx} ${base - 184}` }, t);
    for (const [dx, flip] of [[-330, false], [330, true]]) {
      const f = person(svg, cx + dx, ground, 1.5, { shirt: "#2a2f3d", pants: "#14161b", skin: "#8d6a50", hair: "#0d0b09", flip });
      tl.to(f.head, { rotation: flip ? -30 : 30, svgOrigin: "0 0", duration: 1.0, ease: "power2.inOut" }, t0 + 0.4);
      f.root.setAttribute("opacity", 0.9);
      // tears: slow drops falling from the lowered face
      const hx = cx + dx + (flip ? -38 : 38);
      for (let k = 0, tt = t0 + 1.4; tt < t1 - 0.3; k++, tt += 0.9) {
        const d = el("path", { d: "M0 -12 C9 2 9 12 0 12 C-9 12 -9 2 0 -12 Z", fill: "#9fd0ff", opacity: 0 }, svg);
        tl.fromTo(d, { x: hx + (k % 2) * 8, y: ground - 470, opacity: 0.95 }, { y: ground - 250, opacity: 0, duration: 0.8, ease: "power1.in" }, tt);
      }
    }
    if (o.line) { const w = text(svg, cx, 190, o.line, 84, "#f3efe6", { serif: true, weight: 400, opacity: 0 }); tl.fromTo(w, { opacity: 0 }, { opacity: 1, duration: 1.2 }, t0 + 0.8); }
  }

  // a Facebook-style page mock-up: cover, round avatar, page name, tagline, Like button and a follower count that climbs
  function fbpage(tl, svg, o, t0, t1) {
    el("rect", { x: 0, y: 0, width: 1920, height: 1080, fill: "#e9ebee" }, svg);
    const g = el("g", { opacity: 0 }, svg), x = 330, w = 1260;
    el("rect", { x, y: 70, width: w, height: 880, rx: 18, fill: "#fff", stroke: "#d6d9de", "stroke-width": 2 }, g);
    const cov = el("rect", { x, y: 70, width: w, height: 330, rx: 18, fill: o.cover || "#1d3b5c" }, g);
    el("path", { d: `M${x} 330 L${x + 380} 190 L${x + 640} 290 L${x + 900} 150 L${x + w} 300 L${x + w} 400 L${x} 400 Z`, fill: "rgba(255,255,255,0.10)" }, g);
    el("circle", { cx: x + 190, cy: 400, r: 128, fill: "#fff" }, g);
    el("circle", { cx: x + 190, cy: 400, r: 116, fill: o.avatar || "#0f2740" }, g);
    text(g, x + 190, 428, o.initials || "GR", 92, "#e8b34b", { weight: 900, serif: true });
    text(g, x + 360, 470, o.name || "Gujjar Rule", 74, "#1c1e21", { anchor: "start", weight: 800 });
    text(g, x + 360, 540, o.tagline || "", 32, "#65676b", { anchor: "start", weight: 500 });
    const likes = text(g, x + 360, 610, "", 34, "#65676b", { anchor: "start", weight: 600 });
    const btn = el("g", {}, g);
    el("rect", { x: x + w - 330, y: 440, width: 270, height: 78, rx: 12, fill: "#1877f2" }, btn);
    text(btn, x + w - 195, 492, "Like", 38, "#fff", { weight: 700 });
    for (let i = 0; i < 4; i++) {
      const r = el("rect", { x: x + 60 + i * 290, y: 700, width: 260, height: 190, rx: 12, fill: "#f0f2f5" }, g);
      el("rect", { x: x + 80 + i * 290, y: 790, width: 180 - (i % 2) * 40, height: 14, rx: 7, fill: "#c9ccd1" }, g);
      el("rect", { x: x + 80 + i * 290, y: 820, width: 120, height: 12, rx: 6, fill: "#dcdfe4" }, g);
    }
    tl.fromTo(g, { opacity: 0, y: 70, scale: 0.96, svgOrigin: "960 540" }, { opacity: 1, y: 0, scale: 1, svgOrigin: "960 540", duration: 0.5, ease: "power3.out" }, t0);
    tl.fromTo(btn, { scale: 1, svgOrigin: `${x + w - 195} 480` }, { scale: 1.12, svgOrigin: `${x + w - 195} 480`, duration: 0.15, yoyo: true, repeat: 1 }, t0 + 1.4);
    const state = { n: 0 };
    tl.to(state, { n: 1, duration: Math.max(t1 - t0 - 1.2, 1), ease: "power2.out", onUpdate: () => { likes.textContent = (o.likes_label || "") + Math.round(state.n * (o.likes || 0)).toLocaleString("en-IN") + " log follow karte hain"; } }, t0 + 0.8);
  }

  function run(tl, svg, spec, t0, t1) {
    const o = Object.assign({}, spec);
    ({ phone, crowd, travel, lift, fight, candle, fbpage })[o.kind](tl, svg, o, t0, t1);
  }

  return { run };
})();
