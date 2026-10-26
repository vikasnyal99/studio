// Character rig and motion helpers for 2D figure scenes (from the animation lab, videos/_lab-animations).
// Every helper adds steps to one paused GSAP timeline at absolute seconds.
const Lab = (() => {
  const NS = "http://www.w3.org/2000/svg";
  const $$ = (sel) => (typeof sel === "string" ? [...document.querySelectorAll(sel)] : [].concat(sel));

  function el(tag, attrs, parent) {
    const e = document.createElementNS(NS, tag);
    for (const k in attrs) if (attrs[k] != null) e.setAttribute(k, attrs[k]);
    if (parent) parent.appendChild(e);
    return e;
  }

  // A part that turns about (x, y): the outer group sits on the pivot, the inner one rotates.
  function joint(parent, x, y, cls) {
    const outer = el("g", { transform: `translate(${x},${y})` }, parent);
    return el("g", { class: cls }, outer);
  }

  const BASE = { kind: "flat", ink: "#1b1b1b", sw: 26, outline: 0, skin: "#e0a77f", shirt: "#3b82c4", pants: "#2c3e50", hair: "#2b2118", headFill: "none", draw: false };
  const ROUND = { fill: "none", "stroke-linecap": "round", "stroke-linejoin": "round" };
  const call = (fns, g, G) => [].concat(fns || []).forEach((fn) => fn(g, G));

  // Front-facing figure with its feet at (x, y), scaled by s. The look comes from one layer
  // or several stacked layers (e.g. colour fill under marker lines).
  // kind: "flat" (filled shapes), "line" (outlines only), "stick".
  function figure(svg, x, y, s, opts = {}) {
    const layers = (opts.layers || [opts]).map((l, i) => Object.assign({}, BASE, l, { cls: "L" + i }));
    const stick = layers[0].kind === "stick";
    const L = Object.assign({ leg: 170, torso: 175, upper: 78, fore: 70, head: 52, hipX: stick ? 0 : 20, shX: stick ? 0 : 40 }, opts.L);
    const R = L.head, hipY = -L.leg, neckY = -L.leg - L.torso, shY = neckY + (stick ? 18 : 24);
    const top = layers[layers.length - 1];
    const G = { L, R, hipY, neckY, shY, ol: layers[0].outline, ink: layers[0].ink };
    const strokes = [];
    const flat = (l) => l.kind === "flat";

    function line(g, l, d, color, w) {
      if (flat(l) && l.outline) el("path", { d, class: l.cls, stroke: l.ink, "stroke-width": w + 2 * l.outline, ...ROUND }, g);
      const p = el("path", { d, class: l.cls, stroke: flat(l) ? color : l.ink, "stroke-width": flat(l) ? w : l.sw, ...ROUND }, g);
      if (l.draw) strokes.push(p);
    }
    function shape(g, l, tag, attrs, color) {
      const a = { class: l.cls, ...attrs };
      if (flat(l)) { a.fill = color; if (l.outline) { a.stroke = l.ink; a["stroke-width"] = 2 * l.outline; } }
      else { a.fill = l.headFill; a.stroke = l.ink; a["stroke-width"] = l.sw; }
      const e = el(tag, a, g);
      if (l.draw) strokes.push(e);
    }

    const mover = el("g", { class: "mover" }, svg);
    const root = el("g", { transform: `translate(${x},${y}) scale(${opts.flip ? -s : s},${s})`, filter: opts.filter ? `url(#${opts.filter})` : null }, mover);
    if (opts.shadow) el("ellipse", { cx: 0, cy: 4, rx: L.leg * 0.45, ry: L.leg * 0.07, fill: "rgba(0,0,0,0.18)" }, root);
    const body = el("g", { class: "body" }, root);
    call(opts.behind, body, G);

    const legL = joint(body, -L.hipX, hipY, "legL"), legR = joint(body, L.hipX, hipY, "legR");
    const foot = L.leg * 0.09;
    for (const l of layers) {
      line(legL, l, `M0 0 L0 ${L.leg} L${-foot} ${L.leg}`, l.pants, l.sw * 1.15);
      line(legR, l, `M0 0 L0 ${L.leg} L${foot} ${L.leg}`, l.pants, l.sw * 1.15);
    }
    if (opts.dress) {
      const w = L.shX + 6, bottom = hipY + L.leg * (opts.dress.len || 0.7);
      for (const l of layers) shape(body, l, "path", { d: `M${-w} ${hipY - 12} L${w} ${hipY - 12} L${w * 1.7} ${bottom} L${-w * 1.7} ${bottom} Z` }, opts.dress.color);
    }
    for (const l of layers) {
      if (l.kind === "stick") line(body, l, `M0 ${hipY} L0 ${neckY}`, null, l.sw);
      else shape(body, l, "rect", { x: -L.shX - 6, y: neckY - 4, width: 2 * L.shX + 12, height: L.torso + 16, rx: Math.min(34, L.shX) }, l.shirt);
    }
    call(opts.onBody, body, G);

    const armL = joint(body, -L.shX, shY, "armL"), armR = joint(body, L.shX, shY, "armR");
    const foreL = joint(armL, 0, L.upper, "foreL"), foreR = joint(armR, 0, L.upper, "foreR");
    for (const l of layers) for (const [a, f] of [[armL, foreL], [armR, foreR]]) {
      line(a, l, `M0 0 L0 ${L.upper}`, opts.armColor || l.shirt, l.sw * 0.9);
      line(f, l, `M0 0 L0 ${L.fore}`, opts.armColor || l.shirt, l.sw * 0.85);
      if (l.kind !== "stick") shape(f, l, "circle", { cx: 0, cy: L.fore + 4, r: (flat(l) ? l.sw : 24) * 0.55 }, l.skin);
    }
    call(opts.onHandL, foreL, G);
    call(opts.onHandR, foreR, G);

    const head = joint(body, 0, neckY + 2, "fhead");
    const hs = opts.hairStyle || "short";
    for (const l of layers) {
      if (flat(l) && hs === "long") shape(head, l, "path", { d: `M${-R * 1.1} ${-R} Q${-R * 1.15} ${-R * 2.2} 0 ${-R * 2.12} Q${R * 1.15} ${-R * 2.2} ${R * 1.1} ${-R} L${R * 1.15} ${R * 0.15} L${-R * 1.15} ${R * 0.15} Z` }, l.hair);
      if (flat(l)) shape(head, l, "rect", { x: -R * 0.22, y: -R * 0.3, width: R * 0.44, height: R * 0.42 }, l.skin);
      shape(head, l, "circle", { cx: 0, cy: -R, r: R }, l.skin);
      if (!flat(l) || hs === "none") continue;
      if (hs === "bald") {
        for (const sx of [-1, 1]) shape(head, l, "ellipse", { cx: sx * R * 0.9, cy: -R * 1.05, rx: R * 0.17, ry: R * 0.32 }, l.hair);
        continue;
      }
      shape(head, l, "path", { d: `M${-R * 1.03} ${-R * 0.95} A${R * 1.03} ${R * 1.03} 0 0 1 ${R * 1.03} ${-R * 0.95} Q${R * 0.2} ${-R * 1.55} ${-R * 1.03} ${-R * 0.95} Z` }, l.hair);
      if (hs === "bun") shape(head, l, "circle", { cx: 0, cy: -R * 2.05, r: R * 0.36 }, l.hair);
    }

    const face = el("g", { class: "face", opacity: opts.face === false ? 0 : 1 }, head);
    const ink = opts.faceInk || (flat(top) ? "#1b1b1b" : top.ink);
    const eyes = joint(face, 0, -R * 1.02, "eyes");
    for (const sx of [-1, 1]) el("circle", { cx: sx * R * 0.36, cy: 0, r: R * 0.1, fill: ink }, eyes);
    const brows = joint(face, 0, -R * 1.34, "brows");
    el("path", { d: `M${-R * 0.52} ${R * 0.02} L${-R * 0.2} ${-R * 0.04} M${R * 0.2} ${-R * 0.04} L${R * 0.52} ${R * 0.02}`, stroke: ink, "stroke-width": R * 0.07, ...ROUND }, brows);
    if (opts.blush) for (const sx of [-1, 1]) el("ellipse", { cx: sx * R * 0.58, cy: -R * 0.66, rx: R * 0.15, ry: R * 0.08, fill: "#ff8fa3", opacity: 0.7 }, face);
    const mouth = joint(face, 0, -R * 0.52, "mouth");
    const closed = el("path", { d: `M${-R * 0.24} 0 Q0 ${R * 0.17} ${R * 0.24} 0`, stroke: ink, "stroke-width": R * 0.07, ...ROUND }, mouth);
    const open = el("ellipse", { cx: 0, cy: R * 0.05, rx: R * 0.16, ry: R * 0.13, fill: opts.mouthFill || "#7a2630", opacity: 0 }, mouth);
    call(opts.onHead, head, G);

    for (const p of strokes) p.setAttribute("pathLength", 1);
    return { mover, root, body, head, face, eyes, brows, mouth, open, closed, armL, armR, foreL, foreR, legL, legR, strokes: strokes.reverse() };
  }

  // Side-view cartoon figure facing right (flip: true faces left), feet at (x, y): flat colours with a
  // dark outline, like the user's reference (library/custom-source/1.webp). mask: true draws a balaclava
  // with an eye slit; gun: true puts a pistol in the near hand. Same parts as figure(), so walk/point/talk work.
  function side(svg, x, y, s, opts = {}) {
    const o = Object.assign({ ink: "#1d1d22", skin: "#f0c7a0", jacket: "#6b7350", jacketDark: "#555c3f", pants: "#2f3440", pantsDark: "#24282f",
                              shoes: "#1f1f24", hair: "#2b2118", mask: false, gun: false }, opts);
    const st = { stroke: o.ink, "stroke-width": 4, "stroke-linejoin": "round", "stroke-linecap": "round" };
    const mover = el("g", { class: "mover" }, svg);
    const root = el("g", { transform: `translate(${x},${y}) scale(${o.flip ? -s : s},${s})` }, mover);
    if (o.shadow !== false) el("ellipse", { cx: 0, cy: 3, rx: 70, ry: 9, fill: "rgba(0,0,0,0.3)" }, root);
    const body = el("g", { class: "body" }, root);
    const leg = (cls, col) => {
      const g = joint(body, 0, -150, cls);
      el("path", { d: "M-16 0 L-13 146 L13 146 L16 0 Z", fill: col, ...st }, g);
      el("path", { d: "M-15 140 L30 140 Q46 142 46 154 L-15 154 Z", fill: o.shoes, ...st }, g);
      return g;
    };
    const arm = (cls, col) => {
      const a = joint(body, 0, -282, cls);
      el("path", { d: "M-13 -4 L-11 80 L11 80 L13 -4 Z", fill: col, ...st }, a);
      const f = joint(a, 0, 76, cls.replace("arm", "fore"));
      el("path", { d: "M-11 0 L-10 62 L10 62 L11 0 Z", fill: col, ...st }, f);
      el("circle", { cx: 0, cy: 70, r: 13, fill: o.skin, ...st }, f);
      return [a, f];
    };
    const legL = leg("legL", o.pantsDark);
    const [armL, foreL] = arm("armL", o.jacketDark);
    const legR = leg("legR", o.pants);
    el("path", { d: "M-34 -140 L-38 -262 Q-34 -300 0 -304 Q34 -300 36 -262 L32 -140 Q0 -132 -34 -140 Z", fill: o.jacket, ...st }, body);
    el("path", { d: "M16 -294 L17 -146", stroke: o.ink, "stroke-width": 2.5, fill: "none" }, body);
    el("path", { d: "M-34 -152 L32 -152", stroke: o.ink, "stroke-width": 3, fill: "none" }, body);

    const head = joint(body, 6, -300, "fhead");
    const outline = "M-34 -8 Q-44 -60 -10 -84 Q22 -96 40 -70 L44 -50 L52 -40 L44 -35 Q46 -18 30 -8 Z";
    if (o.mask) {
      el("path", { d: "M-34 -6 Q-46 -62 -10 -86 Q24 -98 42 -70 Q50 -46 46 -8 Z", fill: "#3a3a40", ...st }, head);
      el("path", { d: "M-32 -76 Q2 -102 38 -78", stroke: "#26262b", "stroke-width": 7, fill: "none" }, head);
      el("rect", { x: 8, y: -58, width: 38, height: 17, rx: 8, fill: o.skin, ...st, "stroke-width": 3 }, head);
      el("path", { d: "M12 -61 L44 -54", stroke: o.ink, "stroke-width": 3.5 }, head);
      el("circle", { cx: 32, cy: -24, r: 7, fill: o.skin, ...st, "stroke-width": 2.5 }, head);
    } else {
      el("path", { d: outline, fill: o.skin, ...st }, head);
      el("path", { d: "M-36 -18 Q-48 -70 -12 -88 Q24 -100 42 -72 Q28 -78 12 -72 Q-8 -66 -16 -42 Q-22 -26 -36 -18 Z", fill: o.hair, ...st }, head);
      el("circle", { cx: -6, cy: -44, r: 8, fill: o.skin, ...st, "stroke-width": 3 }, head);
      el("path", { d: "M18 -62 L38 -60", stroke: o.ink, "stroke-width": 3.5 }, head);
    }
    const eyes = joint(head, 30, -49, "eyes");
    el("circle", { cx: 0, cy: 0, r: 3.8, fill: o.ink }, eyes);
    const mouth = joint(head, 34, -22, "mouth");
    const closed = el("path", { d: o.mask ? "M-3 0 L3 0" : "M-8 0 L6 1", stroke: o.ink, "stroke-width": 3, fill: "none", "stroke-linecap": "round" }, mouth);
    const open = el("ellipse", { cx: 0, cy: 1, rx: 5, ry: 4, fill: "#5a1e24", opacity: 0 }, mouth);
    const [armR, foreR] = arm("armR", o.jacket);
    if (o.gun) acc.gun("#2a2a30")(foreR, { L: { fore: 62 } });
    return { mover, root, body, head, face: head, eyes, brows: eyes, mouth, open, closed, armL, armR, foreL, foreR, legL, legR, strokes: [] };
  }

  // Costume pieces: each returns fn(group, geometry) for figure()'s onBody / onHead / onHandL / onHandR.
  const filled = (g, G, tag, attrs, color) => el(tag, { ...attrs, fill: color, stroke: G.ol ? G.ink : null, "stroke-width": G.ol ? 2 * G.ol : null }, g);
  const acc = {
    vest: (c) => (g, G) => {
      const w = G.L.shX + 6;
      for (const s of [-1, 1]) filled(g, G, "path", { d: `M${s * w} ${G.neckY + 16} L${s * 10} ${G.neckY + 46} L${s * 10} ${G.hipY + 12} L${s * w} ${G.hipY + 12} Z` }, c);
      for (let i = 0; i < 3; i++) el("circle", { cx: 0, cy: G.neckY + 70 + i * 40, r: 4, fill: "#9ca3af" }, g);
    },
    coat: (c) => (g, G) => {
      const w = G.L.shX + 6, bottom = G.hipY + G.L.leg * 0.42;
      for (const s of [-1, 1]) filled(g, G, "path", { d: `M${s * w} ${G.neckY + 8} L${s * 14} ${G.neckY + 50} L${s * 14} ${bottom} L${s * (w + 10)} ${bottom} Z` }, c);
    },
    tie: (c) => (g, G) => {
      for (const s of [-1, 1]) el("path", { d: `M0 ${G.neckY + 4} L${s * 26} ${G.neckY + 2} L${s * 16} ${G.neckY + 26} Z`, fill: "#ffffff", stroke: "#cbd5e1", "stroke-width": 2 }, g);
      el("path", { d: `M0 ${G.neckY + 10} L-9 ${G.neckY + 24} L0 ${G.neckY + 88} L9 ${G.neckY + 24} Z`, fill: c }, g);
    },
    straps: (c) => (g, G) => {
      for (const s of [-1, 1]) el("rect", { x: s * (G.L.shX - 16) - 7, y: G.neckY + 4, width: 14, height: G.L.torso - 20, rx: 6, fill: c }, g);
    },
    belt: (c) => (g, G) => {
      el("rect", { x: -G.L.shX - 6, y: G.hipY - 8, width: 2 * G.L.shX + 12, height: 16, fill: c }, g);
      el("rect", { x: -10, y: G.hipY - 10, width: 20, height: 20, rx: 3, fill: "#f4c430" }, g);
    },
    stethoscope: () => (g, G) => {
      el("path", { d: `M-16 ${G.neckY + 4} Q-26 ${G.neckY + 80} 0 ${G.neckY + 100} Q26 ${G.neckY + 80} 16 ${G.neckY + 4}`, stroke: "#374151", "stroke-width": 5, fill: "none" }, g);
      el("circle", { cx: 0, cy: G.neckY + 104, r: 9, fill: "#9ca3af", stroke: "#374151", "stroke-width": 3 }, g);
    },
    saree: (c, border) => (g, G) => {
      const w = G.L.shX + 6;
      el("path", { d: `M${-w} ${G.neckY + 14} L${-w + 38} ${G.neckY + 2} L${w + 4} ${G.hipY - 14} L${w + 4} ${G.hipY + 34} Z`, fill: c, stroke: border, "stroke-width": 5, "stroke-linejoin": "round" }, g);
    },
    turban: (c) => (g, G) => {
      const R = G.R;
      filled(g, G, "path", { d: `M${-R * 1.08} ${-R * 1.05} Q${-R * 1.25} ${-R * 2.35} 0 ${-R * 2.3} Q${R * 1.25} ${-R * 2.35} ${R * 1.08} ${-R * 1.05} Q0 ${-R * 1.5} ${-R * 1.08} ${-R * 1.05} Z` }, c);
      for (const k of [0, 1]) el("path", { d: `M${-R * 0.95} ${-R * (1.35 + k * 0.3)} Q0 ${-R * (1.9 + k * 0.25)} ${R * 0.95} ${-R * (1.55 + k * 0.3)}`, stroke: "rgba(0,0,0,0.18)", "stroke-width": R * 0.08, fill: "none" }, g);
    },
    cap: (c) => (g, G) => {
      const R = G.R;
      filled(g, G, "path", { d: `M${-R * 0.98} ${-R * 1.62} L${-R * 1.12} ${-R * 2.12} L${R * 1.12} ${-R * 2.12} L${R * 0.98} ${-R * 1.62} Z` }, c);
      el("rect", { x: -R, y: -R * 1.68, width: R * 2, height: R * 0.3, fill: "#6b5a38" }, g);
      el("ellipse", { cx: 0, cy: -R * 1.38, rx: R * 1.05, ry: R * 0.13, fill: "#2b2118" }, g);
      el("circle", { cx: 0, cy: -R * 1.86, r: R * 0.14, fill: "#f4c430" }, g);
    },
    glasses: () => (g, G) => {
      const R = G.R;
      for (const s of [-1, 1]) el("circle", { cx: s * R * 0.36, cy: -R * 1.02, r: R * 0.22, fill: "rgba(255,255,255,0.18)", stroke: "#1f2937", "stroke-width": R * 0.06 }, g);
      el("path", { d: `M${-R * 0.14} ${-R * 1.04} L${R * 0.14} ${-R * 1.04}`, stroke: "#1f2937", "stroke-width": R * 0.06 }, g);
    },
    mustache: (c) => (g, G) => {
      const R = G.R;
      el("path", { d: `M${-R * 0.3} ${-R * 0.6} Q0 ${-R * 0.8} ${R * 0.3} ${-R * 0.6} Q0 ${-R * 0.66} ${-R * 0.3} ${-R * 0.6} Z`, fill: c }, g);
    },
    cane: (c) => (g, G) => {
      const L = G.L, len = L.leg + L.torso - 24 - L.upper - L.fore;
      el("path", { d: `M-20 ${L.fore - 12} Q0 ${L.fore - 34} 0 ${L.fore} L0 ${L.fore + len}`, stroke: c, "stroke-width": 9, ...ROUND }, g);
    },
    // Hooded head for faceless reconstruction figures (use with hairStyle "none", face false).
    hood: (c) => (g, G) => {
      const R = G.R;
      el("path", { d: `M${-R * 1.25} ${R * 0.2} Q${-R * 1.35} ${-R * 1.6} ${-R * 0.5} ${-R * 2.2} Q0 ${-R * 2.5} ${R * 0.5} ${-R * 2.2} Q${R * 1.35} ${-R * 1.6} ${R * 1.25} ${R * 0.2} Z`, fill: c }, g);
    },
    // Pistol in the hand, with a muzzle flash (class "flash", hidden) for shots.
    gun: (c) => (g, G) => {
      const y = G.L.fore;
      el("rect", { x: -6, y: y - 4, width: 12, height: 52, rx: 3, fill: c }, g);
      el("rect", { x: -6, y: y - 4, width: 30, height: 14, rx: 3, fill: c }, g);
      const pts = [];
      for (let k = 0; k < 14; k++) { const a = (k / 14) * Math.PI * 2, r = k % 2 ? 14 : 40; pts.push(`${Math.sin(a) * r},${y + 92 + Math.cos(a) * r * 1.4}`); }
      el("polygon", { class: "flash", points: pts.join(" "), fill: "#ffd27a", opacity: 0 }, g);
    },
    flag: (c) => (g, G) => {
      const y0 = G.L.fore;
      el("path", { d: `M0 ${y0} L0 ${y0 + 210}`, stroke: c, "stroke-width": 8, "stroke-linecap": "round" }, g);
      el("path", { d: "M0 0 L120 -10 L110 -45 L120 -80 L0 -70 Z", fill: c }, joint(g, 0, y0 + 210, "cloth"));
    },
  };

  // ---- motion ----
  const rot = (tl, g, deg, at, dur = 0.3, ease = "power2.inOut") => tl.to(g, { rotation: deg, svgOrigin: "0 0", duration: dur, ease }, at);

  function walk(tl, f, t0, t1, x0, x1, o = {}) {
    const step = o.step || 0.25, ease = o.ease || "sine.inOut", sw = o.swing || 20;
    tl.fromTo(f.mover, { x: x0 }, { x: x1, duration: t1 - t0, ease: o.moveEase || "none" }, t0);
    const n = Math.max(1, Math.round((t1 - t0) / step));
    for (let i = 0; i < n; i++) {
      const t = t0 + i * step, s = i % 2 ? 1 : -1;
      rot(tl, f.legL, s * sw, t, step, ease); rot(tl, f.legR, -s * sw, t, step, ease);
      rot(tl, f.armL, -s * sw * 0.6, t, step, ease);
      if (!o.holdR) rot(tl, f.armR, s * sw * 0.6, t, step, ease);
      tl.to(f.body, { y: -6, duration: step / 2, ease }, t);
      tl.to(f.body, { y: 0, duration: step / 2, ease }, t + step / 2);
    }
    for (const g of [f.legL, f.legR, f.armL].concat(o.holdR ? [] : [f.armR])) rot(tl, g, 0, t0 + n * step, 0.15, ease);
  }
  function blink(tl, f, at) {
    tl.to(f.eyes, { scaleY: 0.1, svgOrigin: "0 0", duration: 0.05 }, at);
    tl.to(f.eyes, { scaleY: 1, svgOrigin: "0 0", duration: 0.07 }, at + 0.1);
  }
  function talk(tl, f, t0, t1) {
    const gaps = [0.12, 0.16, 0.1, 0.18, 0.14];
    for (let t = t0, i = 0; t < t1; t += gaps[i % 5], i++) {
      tl.set(f.open, { opacity: i % 2 ? 0 : 1 }, t);
      tl.set(f.closed, { opacity: i % 2 ? 1 : 0 }, t);
    }
    tl.set(f.open, { opacity: 0 }, t1);
    tl.set(f.closed, { opacity: 1 }, t1);
  }
  function wave(tl, f, t0, t1, ease = "sine.inOut") {
    rot(tl, f.armR, -150, t0, 0.3, ease);
    for (let t = t0 + 0.3, k = 0; t + 0.22 <= t1 - 0.3; t += 0.22, k++) rot(tl, f.foreR, k % 2 ? 25 : -25, t, 0.22, ease);
    rot(tl, f.foreR, 0, t1 - 0.3, 0.3, ease);
    rot(tl, f.armR, 0, t1 - 0.3, 0.3, ease);
  }
  function point(tl, f, at, dur = 0.35) { rot(tl, f.armR, -80, at, dur); rot(tl, f.foreR, -12, at, dur); }
  function rest(tl, f, at, dur = 0.35) { for (const g of [f.armL, f.armR, f.foreL, f.foreR]) rot(tl, g, 0, at, dur); }
  function shrug(tl, f, at, dur = 0.35) {
    rot(tl, f.armR, -25, at, dur); rot(tl, f.foreR, -95, at, dur);
    rot(tl, f.armL, 25, at, dur); rot(tl, f.foreL, 95, at, dur);
    rot(tl, f.head, 8, at, dur);
  }
  // Gun held up beside the head, as in the reference drawing.
  function raise(tl, f, at, dur = 0.2) { rot(tl, f.armR, -35, at, dur); rot(tl, f.foreR, -125, at, dur); }
  function fist(tl, f, at, dur = 0.25) { rot(tl, f.armR, -172, at, dur); rot(tl, f.foreR, 0, at, dur); }
  function pump(tl, f, t0, t1, period = 0.4) {
    for (let t = t0, k = 0; t + period / 2 <= t1; t += period / 2, k++) {
      rot(tl, f.armR, k % 2 ? -172 : -150, t, period / 2, "sine.inOut");
      rot(tl, f.foreR, k % 2 ? 0 : -25, t, period / 2, "sine.inOut");
    }
  }

  // Pen strokes appearing in order (elements need pathLength="1").
  function drawPaths(tl, sel, t0, dur, per = 0.3) {
    const ps = $$(sel), gap = ps.length > 1 ? Math.max(0, dur - per) / (ps.length - 1) : 0;
    ps.forEach((p, i) => {
      p.style.strokeDasharray = "1 1";
      tl.fromTo(p, { strokeDashoffset: 1 }, { strokeDashoffset: 0, duration: Math.min(per, dur), ease: "power1.inOut" }, t0 + i * gap);
    });
  }
  function drawOn(tl, f, t0, t1) {
    drawPaths(tl, f.strokes, t0, t1 - t0 - 0.2);
    tl.fromTo(f.face, { opacity: 0 }, { opacity: 1, duration: 0.3 }, t1 - 0.3);
  }
  // Hand-drawn "line boil": step the noise seed a few times a second.
  function boil(tl, sel, t0, t1, fps = 8) {
    for (let t = t0, k = 1; t < t1; t += 1 / fps, k++) tl.set(sel, { attr: { seed: (k % 40) + 1 } }, t);
  }

  function show(tl, sel, t0, t1) { tl.set(sel, { autoAlpha: 1 }, t0); tl.set(sel, { autoAlpha: 0 }, t1); }
  function pop(tl, sel, at, dur = 0.35) { tl.fromTo(sel, { opacity: 0, scale: 0.5 }, { opacity: 1, scale: 1, duration: dur, ease: "back.out(2)", transformOrigin: "50% 50%" }, at); }
  function hide(tl, sel, at) { tl.to(sel, { opacity: 0, duration: 0.15 }, at); }
  function rise(tl, sel, at, dur = 0.4) { tl.fromTo(sel, { opacity: 0, y: 24 }, { opacity: 1, y: 0, duration: dur, ease: "power2.out" }, at); }
  function typeOn(tl, sel, at, dur = 0.8) { tl.fromTo(sel, { clipPath: "inset(0 100% 0 0)" }, { clipPath: "inset(0 0% 0 0)", duration: dur, ease: "none" }, at); }
  function counter(tl, sel, at, dur, to, suffix = "", prefix = "") {
    const e = document.querySelector(sel), st = { v: 0 };
    const draw = () => { e.textContent = prefix + Math.round(st.v).toLocaleString("en-IN") + suffix; };
    draw();
    tl.fromTo(st, { v: 0 }, { v: to, duration: dur, ease: "power2.out", onUpdate: draw }, at);
  }

  return { el, joint, figure, side, raise, acc, rot, walk, blink, talk, wave, point, rest, shrug, fist, pump, drawPaths, drawOn, boil, show, pop, hide, rise, typeOn, counter };
})();
