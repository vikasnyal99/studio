// Shared animation helpers for documentary scenes. Every helper adds steps to
// the one GSAP timeline passed in, at absolute seconds of the video.
const Doc = (() => {
  const $ = (sel) => (typeof sel === "string" ? document.querySelector(sel) : sel);

  // Show a scene from `start` to `end` (hard cuts), with a small snap-zoom on entry.
  function scene(tl, sel, start, end) {
    tl.set(sel, { autoAlpha: 1 }, start);
    tl.fromTo(sel, { scale: 1.015 }, { scale: 1, duration: 0.6, ease: "power2.out" }, start);
    tl.set(sel, { autoAlpha: 0 }, end);
  }

  // Slow continuous move on a photo so no frame is ever still.
  function drift(tl, sel, start, end, from = 1.08, to = 1.0, x = 0, y = 0) {
    tl.fromTo(sel, { scale: from, xPercent: x, yPercent: y }, { scale: to, xPercent: 0, yPercent: 0, duration: end - start, ease: "none" }, start);
  }

  function rise(tl, sel, at, dur = 0.35, y = 18) {
    tl.fromTo(sel, { opacity: 0, y }, { opacity: 1, y: 0, duration: dur, ease: "power2.out" }, at);
  }

  function popIn(tl, sel, at, dur = 0.3) {
    tl.fromTo(sel, { opacity: 0, scale: 0.94 }, { opacity: 1, scale: 1, duration: dur, ease: "back.out(1.6)" }, at);
  }

  // Marker-pen sweep across a highlighted line.
  function mark(tl, sel, at, dur = 0.45) {
    tl.fromTo(sel, { scaleX: 0 }, { scaleX: 1, duration: dur, ease: "power2.out" }, at);
  }

  // Reveal text left to right, like typing.
  function typeOn(tl, sel, at, dur = 0.8) {
    tl.fromTo(sel, { clipPath: "inset(0 100% 0 0)" }, { clipPath: "inset(0 0% 0 0)", duration: dur, ease: "none" }, at);
  }

  function counter(tl, sel, at, dur, to, decimals = 0, suffix = "", prefix = "") {
    const el = $(sel), state = { v: 0 };
    const show = () => { el.textContent = prefix + state.v.toLocaleString("en-IN", { minimumFractionDigits: decimals, maximumFractionDigits: decimals }) + suffix; };
    show();
    tl.fromTo(state, { v: 0 }, { v: to, duration: dur, ease: "power2.out", onUpdate: show }, at);
  }

  // Draw an SVG line from start to end (path needs pathLength="1").
  function draw(tl, sel, at, dur, ease = "power1.inOut") {
    tl.fromTo(sel, { strokeDasharray: 1, strokeDashoffset: 1 }, { strokeDashoffset: 0, duration: dur, ease }, at);
  }

  // ---- Maps (data from library/maps/south_asia.json, loaded as window.MAP) ----

  function project(lon, lat) {
    const p = window.MAP.projection, rad = Math.PI / 180;
    const my = (v) => Math.log(Math.tan(Math.PI / 4 + (v * rad) / 2));
    return [(lon - p.west) * rad * p.scale, (my(p.north) - my(lat)) * p.scale];
  }

  // Fill an <svg class="map"> with every country; returns the group the camera moves.
  function buildMap(svgSel, focus = []) {
    const svg = $(svgSel), ns = "http://www.w3.org/2000/svg";
    svg.setAttribute("viewBox", "0 0 1920 1080");
    const world = document.createElementNS(ns, "g");
    for (const [code, country] of Object.entries(window.MAP.countries)) {
      const path = document.createElementNS(ns, "path");
      path.setAttribute("d", country.d);
      path.setAttribute("class", "land");
      path.dataset.code = code;
      world.appendChild(path);
    }
    svg.appendChild(world);
    focus.forEach((code) => world.querySelector(`[data-code="${code}"]`)?.classList.add("focus"));
    return world;
  }

  function place(world, view) {
    world.setAttribute("transform", `translate(${960 - view.x * view.zoom} ${540 - view.y * view.zoom}) scale(${view.zoom})`);
  }

  // Move the map camera: `from` and `to` are {x, y, zoom} in map pixels.
  function camera(tl, world, at, dur, from, to, ease = "power2.inOut") {
    const view = { ...from };
    place(world, view);
    tl.fromTo(view, { ...from }, { ...to, duration: dur, ease, onUpdate: () => place(world, view) }, at);
  }

  return { scene, drift, rise, popIn, mark, typeOn, counter, draw, project, buildMap, place, camera };
})();
