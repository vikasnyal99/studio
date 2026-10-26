// Drawn scenes for comic panels (scene type "comic", key "art"). Uses Lab from figures.js.
// Every helper adds steps to the one GSAP timeline at absolute seconds of the video.
const Case = (() => {
  const INK = "#08080a";
  const el = (tag, attrs, parent) => Lab.el(tag, attrs, parent);

  // Side view of a parked car, bottom centre at (x, y); a silhouette sits in the driver's seat.
  function car(g, x, y, s) {
    const c = el("g", { transform: `translate(${x},${y}) scale(${s})` }, g);
    el("path", { d: "M-180 0 L-180 -40 Q-175 -60 -140 -64 L-90 -70 Q-60 -110 -10 -114 L60 -114 Q100 -112 130 -72 L170 -66 Q186 -62 186 -40 L186 0 Z", fill: "#111318", stroke: "#56657a", "stroke-width": 2.5 }, c);
    el("path", { d: "M-80 -72 Q-55 -104 -12 -106 L50 -106 Q85 -104 110 -74 Z", fill: "#27303d" }, c);
    el("circle", { cx: 22, cy: -84, r: 15, fill: INK }, c);
    el("rect", { x: 10, y: -72, width: 26, height: 10, fill: INK }, c);
    for (const wx of [-110, 120]) el("circle", { cx: wx, cy: 0, r: 30, fill: "#050506", stroke: "#3b4554", "stroke-width": 3 }, c);
    el("ellipse", { cx: 196, cy: -46, rx: 16, ry: 8, fill: "#ffe6a6", opacity: 0.85 }, c);
    return c;
  }

  function burst(g, cx, cy, r, fill) {
    const pts = [];
    for (let k = 0; k < 18; k++) { const a = (k / 18) * Math.PI * 2, rr = k % 2 ? r * 0.4 : r; pts.push(`${cx + Math.cos(a) * rr},${cy + Math.sin(a) * rr}`); }
    return el("polygon", { points: pts.join(" "), fill, opacity: 0 }, g);
  }

  const look = { skin: INK, shirt: INK, pants: INK, hair: INK, face: false, hairStyle: "none" };

  // kind: "car" (night car park, car with someone inside), "gunmen" (two hooded figures walking in from the right),
  // "flash" (muzzle flashes popping). w, h are the panel size; at/end the panel's time on screen.
  function art(tl, sel, kind, w, h, at, end) {
    const svg = document.querySelector(sel);
    const ground = h * 0.86;
    if (kind === "car") {
      el("rect", { y: ground, width: w, height: h - ground, fill: "#0d0f13" }, svg);
      for (let i = 0; i < 4; i++) el("rect", { x: i * w / 4 + 30, y: ground + 10, width: w / 8, height: 6, fill: "#3a3f48" }, svg);
      const lamp = el("g", {}, svg);
      el("rect", { x: w * 0.12, y: h * 0.2, width: 8, height: ground - h * 0.2, fill: "#1a1d22" }, lamp);
      el("ellipse", { cx: w * 0.12 + 4, cy: h * 0.2, rx: 120, ry: 60, fill: "rgba(255,220,150,0.18)" }, lamp);
      car(svg, w * 0.55, ground, Math.min(w / 520, h / 230));
    } else if (kind === "gunmen") {
      el("rect", { width: w, height: ground, fill: "#3a4252" }, svg);
      el("ellipse", { cx: w * 0.3, cy: ground, rx: w * 0.55, ry: h * 0.55, fill: "rgba(255,225,170,0.35)" }, svg);
      el("rect", { y: ground, width: w, height: h - ground, fill: INK }, svg);
      const s = h / 640;
      [[w * 1.05, w * 0.62], [w * 1.25, w * 0.8]].forEach(([x0, x1], i) => {
        const f = Lab.side(svg, 0, ground, s * (i ? 0.95 : 1), { mask: true, gun: true, flip: true });
        Lab.raise(tl, f, at, 0.01);
        Lab.walk(tl, f, at, Math.min(end, at + 2.2), x0, x1, { swing: 18, step: 0.32, holdR: true });
      });
    } else if (kind === "stage") {  // the gunmen backdrop without the silhouettes (a cut-out character walks across it)
      el("rect", { width: w, height: ground, fill: "#3a4252" }, svg);
      el("ellipse", { cx: w * 0.45, cy: ground, rx: w * 0.55, ry: h * 0.55, fill: "rgba(255,225,170,0.35)" }, svg);
      el("rect", { y: ground, width: w, height: h - ground, fill: INK }, svg);
    } else if (kind === "melee") {  // a strong silhouette stands his ground while a crowd rushes in and is thrown back (ink on warm paper)
      const g0 = el("linearGradient", { id: sel.slice(1) + "mg", x1: 0, y1: 0, x2: 0, y2: 1 }, el("defs", {}, svg));
      el("stop", { offset: 0, "stop-color": "#f1d9a6" }, g0); el("stop", { offset: 1, "stop-color": "#d98a45" }, g0);
      el("rect", { width: w, height: ground, fill: "url(#" + sel.slice(1) + "mg)" }, svg);
      el("circle", { cx: w * 0.78, cy: h * 0.3, r: h * 0.2, fill: "#f7e8c4", opacity: 0.8 }, svg);
      el("rect", { y: ground, width: w, height: h - ground, fill: "#1b1008" }, svg);
      const sc = h / 690, ink = { kind: "flat", skin: INK, shirt: INK, pants: INK, hair: INK, face: false, hairStyle: "none", outline: 0 };
      const hero = Lab.figure(svg, w / 2, ground + 10, sc * 1.12, { ...ink, sw: 44, L: { shX: 78, hipX: 28, torso: 200, upper: 92, fore: 84, leg: 175, head: 58 } });
      const n = 6, span = Math.max(1.2, (end - at) - 2.4);
      for (let i = 0; i < n; i++) {
        const left = i % 2 === 0, stop = left ? w * 0.28 + (i >> 1) * w * 0.07 : w * 0.72 - (i >> 1) * w * 0.07;
        const a = Lab.figure(svg, 0, ground + 12, sc * 0.95, { ...ink, flip: !left });
        const start = at + 0.2 + (i / n) * span, arrive = start + 0.9, hit = arrive + 0.2 + (i >> 1) * 0.35;
        Lab.walk(tl, a, start, arrive, left ? -w * 0.2 : w * 1.2, stop, { step: 0.2, swing: 22 });
        tl.set(a.mover, { x: stop }, arrive + 0.01);
        const pr = left ? hero.armL : hero.armR, pf = left ? hero.foreL : hero.foreR;
        tl.to(pr, { rotation: left ? 100 : -100, svgOrigin: "0 0", duration: 0.09 }, hit - 0.09); tl.to(pf, { rotation: left ? 10 : -10, svgOrigin: "0 0", duration: 0.09 }, hit - 0.09);
        tl.to(pr, { rotation: 0, svgOrigin: "0 0", duration: 0.25 }, hit + 0.12); tl.to(pf, { rotation: 0, svgOrigin: "0 0", duration: 0.25 }, hit + 0.12);
        tl.to(a.mover, { x: left ? stop - w * 0.7 : stop + w * 0.7, y: -h * 0.3, rotation: left ? -420 : 420, svgOrigin: `${stop} ${ground}`, duration: 0.65, ease: "power2.out" }, hit);
        tl.to(a.mover, { opacity: 0, duration: 0.2 }, hit + 0.45);
        const b = burst(svg, left ? stop + h * 0.12 : stop - h * 0.12, ground - h * 0.42, h * 0.16, "#fff4dc");
        tl.set(b, { opacity: 1 }, hit); tl.set(b, { opacity: 0 }, hit + 0.1);
      }
    } else if (kind === "flash") {
      const g = el("g", {}, svg);
      [[0.35, 0.45, 0], [0.62, 0.38, 0.35], [0.5, 0.6, 0.7]].forEach(([fx, fy, dt]) => {
        const b = burst(g, w * fx, h * fy, h * 0.22, "#ffd27a");
        tl.set(b, { opacity: 1 }, at + 0.15 + dt); tl.set(b, { opacity: 0 }, at + 0.25 + dt);
      });
    }
  }

  return { car, burst, art };
})();
