/* Sheet 01: a Vancouver street of 33 ft lots, inhabited and in colour. The
   ground draws itself, the houses arrive, one house comes apart into parts
   that cross the street to the hub, and the hub sends parts back to build a
   multiplex on the same lot. One orchestrated sequence that ends on a still
   frame: no people or vehicles, since the scene runs in accelerated building
   time (Ruijie's correction, via the Astra 6 redraw, 25 Oct 2026). */
(() => {
  const { P, el, poly, line, face, box, tree, dots, zebra, house, onFace, outline, fit, svg: mkSvg } = window.ISO;
  const LOT = 33, DEEP = 122, N = 7, TARGET = 3;
  const WALK = [122, 130], STREET = [130, 160], WALK2 = [160, 166], HUBX = [176, 262], HUBY = [56, 170];

  const HOUSES = [
    { d: 40, w: 23, h: 18, rh: 11, porch: true, chimney: true, x: 52, wall: "m-rose", roof: "m-cobalt", boards: true },
    { d: 46, w: 25, h: 11, rh: 5, porch: false, chimney: false, x: 50, wall: "m-sun", roof: "m-red", boards: true },
    { d: 38, w: 22, h: 19, rh: 12, porch: true, chimney: true, x: 56, wall: "m-sky", roof: "m-navy", boards: true },
    { d: 42, w: 24, h: 18, rh: 11, porch: true, chimney: true, x: 54, wall: "m-butter", roof: "m-roof", boards: false },
    { d: 44, w: 25, h: 12, rh: 4, porch: false, chimney: true, x: 48, wall: "m-purple", roof: "m-cobalt", boards: true },
    { d: 36, w: 22, h: 20, rh: 12, porch: true, chimney: false, x: 58, wall: "m-salmon", roof: "m-navy", boards: true },
    { d: 40, w: 24, h: 17, rh: 10, porch: true, chimney: true, x: 54, wall: "m-teal", roof: "m-red", boards: true },
  ];
  const PART_MATS = ["m-hub", "m-green", "m-lav", "m-carried", "m-sun"]; // structure, skin, services, finishes, fixtures

  function build(host) {
    host.replaceChildren();
    const svg = mkSvg(host, "dwg");
    const root = el("g", {}, svg);
    const yN = N * LOT;

    // ---------- ground ----------
    const ground = el("g", { class: "ground" }, root);
    face(ground, [[-18, -10, 0], [0, -10, 0], [0, yN + 10, 0], [-18, yN + 10, 0]], "g-lane", "");
    for (let i = 0; i < N; i++) face(ground, [[0, i * LOT, 0], [DEEP, i * LOT, 0], [DEEP, (i + 1) * LOT, 0], [0, (i + 1) * LOT, 0]], "g-yard", "");
    face(ground, [[WALK[0], -10, 0], [WALK[1], -10, 0], [WALK[1], yN + 10, 0], [WALK[0], yN + 10, 0]], "g-walk", "");
    face(ground, [[STREET[0], -10, 0], [STREET[1], -10, 0], [STREET[1], yN + 10, 0], [STREET[0], yN + 10, 0]], "g-street", "");
    face(ground, [[WALK2[0], -10, 0], [WALK2[1], -10, 0], [WALK2[1], yN + 10, 0], [WALK2[0], yN + 10, 0]], "g-walk", "");
    const draws = [];
    for (let y = -6; y < yN + 6; y += 9) draws.push(line(ground, [[(STREET[0] + STREET[1]) / 2, y, 0.05], [(STREET[0] + STREET[1]) / 2, y + 4.5, 0.05]], "wl"));
    draws.push(line(ground, [[0, -10, 0], [0, yN + 10, 0]]));
    for (let i = 0; i <= N; i++) draws.push(line(ground, [[0, i * LOT, 0], [DEEP, i * LOT, 0]], "lo"));
    draws.push(line(ground, [[WALK[0], -10, 0], [WALK[0], yN + 10, 0]]));
    draws.push(line(ground, [[STREET[0], -10, 0], [STREET[0], yN + 10, 0]]));
    draws.push(line(ground, [[STREET[1], -10, 0], [STREET[1], yN + 10, 0]]));
    zebra(ground, STREET[0], STREET[1], 30, 5);
    zebra(ground, STREET[0], STREET[1], 196, 5);
    // back-yard trees and street trees
    for (let i = 0; i < N; i++) {
      if (i !== TARGET) tree(ground, 14 + (i % 2) * 8, i * LOT + 10 + (i % 3) * 5, 3.6, i);
      tree(ground, WALK[0] + 4, i * LOT + 16.5, 3.4, i + 1);
    }

    // ---------- houses, back to front; the target lot keeps a slot for the multiplex ----------
    const houses = [];
    let mxSlot = null;
    HOUSES.forEach((o, i) => {
      const slot = el("g", {}, root);
      const hs = house(slot, { ...o, y: i * LOT + (LOT - o.w) / 2 });
      houses.push(hs);
      if (i === TARGET) mxSlot = el("g", { class: "mx" }, root);
    });

    // ---------- the multiplex: a rear and a front block around a courtyard, green roofs ----------
    const y0 = TARGET * LOT + 2, y1 = y0 + LOT - 4, pieces = [], reused = [];
    [[16, 52, "m-sun"], [68, 108, "m-rose"]].forEach(([xa, xb, mat]) => {
      for (let s = 0; s < 3; s++) {
        const z0 = s * 10.5, pc = el("g", {}, mxSlot);
        box(pc, xa, y0, z0, xb, y1, z0 + 10.5, mat);
        const fy = { o: [xa, y1, 0], u: [1, 0, 0], v: [0, 0, 1] }, fx = { o: [xb, y0, 0], u: [0, 1, 0], v: [0, 0, 1] };
        for (let u = 3; u < xb - xa - 4; u += 8) { face(pc, onFace(fy, u, z0 + 3, u + 4.5, z0 + 8), "m-sky", "fy"); line(pc, [[xa + u + 2.25, y1, z0 + 3], [xa + u + 2.25, y1, z0 + 8]], "wl"); }
        for (let u = 3; u < y1 - y0 - 4; u += 7.5) face(pc, onFace(fx, u, z0 + 3, u + 4, z0 + 8), "m-sky", "fx");
        line(pc, [[xa, y1, z0 + 10.5], [xb, y1, z0 + 10.5]], "wl");
        pieces.push(pc);
      }
      const roof = el("g", {}, mxSlot);
      box(roof, xa - 0.6, y0 - 0.6, 31.5, xb + 0.6, y1 + 0.6, 32.6, "m-green");
      tree(roof, xa + 6, y0 + 7, 2.2, 2).setAttribute("transform", `translate(0,${-32.6 * 0.866})`);
      pieces.push(roof);
    });
    // parts that came back from the hub, the last to arrive: the front door and the side stair
    const front = { o: [108, y0, 0], u: [0, 1, 0], v: [0, 0, 1] };
    const r1 = el("g", {}, mxSlot); face(r1, onFace(front, 11.5, 0.2, 15.5, 8.2), "m-carried"); outline(r1);
    const r4 = el("g", {}, mxSlot);
    const st = [];
    for (let k = 0; k <= 5; k++) st.push([58 + k * 1.6, y1 + 0.5, k * 1.5], [58 + (k + 1) * 1.6, y1 + 0.5, k * 1.5]);
    line(r4, st, "ln br thick");
    reused.push(r1, r4);

    // ---------- the hub: a glazed hall with a sawtooth roof, racks, a gantry crane and a plaza ----------
    // Drawn back to front: the far glass and columns, then what stands inside, then the near
    // columns and glass, then the roof. Every pane is clear, so the work inside stays in view.
    const hub = el("g", { class: "hub" }, root);
    const [hx0, hx1] = HUBX, [hy0, hy1] = HUBY, H = 22, TEETH = 5, tw = (hx1 - hx0) / TEETH;
    face(hub, [[STREET[1] + 6, hy0 - 12, 0], [hx1 + 14, hy0 - 12, 0], [hx1 + 14, hy1 + 22, 0], [STREET[1] + 6, hy1 + 22, 0]], "g-mint", "");
    face(hub, [[hx0, hy0, 0.1], [hx1, hy0, 0.1], [hx1, hy1, 0.1], [hx0, hy1, 0.1]], "g-floor", "");
    // a glass wall along x (at y) or along y (at x), with mullions every `step` and a transom at the door head
    const wallX = (g, y, f) => {
      face(g, [[hx0, y, 0], [hx1, y, 0], [hx1, y, H], [hx0, y, H]], "m-glazing", f);
      for (let x = hx0 + tw / 2; x < hx1; x += tw) line(g, [[x, y, 0], [x, y, H]], "mull");
      line(g, [[hx0, y, 8], [hx1, y, 8]], "mull");
    };
    const wallY = (g, x, f) => {
      face(g, [[x, hy0, 0], [x, hy1, 0], [x, hy1, H], [x, hy0, H]], "m-glazing", f);
      for (let y = hy0 + (hy1 - hy0) / 6; y < hy1 - 1; y += (hy1 - hy0) / 6) line(g, [[x, y, 0], [x, y, H]], "mull");
      line(g, [[x, hy0, 8], [x, hy1, 8]], "mull");
    };
    const column = (g, x, y) => line(g, [[x, y, 0], [x, y, H]], "ln thick");
    wallX(hub, hy0, "fy");
    wallY(hub, hx0, "fx");
    for (let k = 0; k <= TEETH; k++) column(hub, hx0 + k * tw, hy0);
    // the gantry crane along the street wall, under the eave: far legs now, the rest in front of the racks
    const gx = hx0 + 2, crane = { x: "crane", y: "crane", z: "crane" }, GH = 19;
    for (const lx of [gx, gx + 12]) box(hub, lx, hy0 + 3, 0, lx + 1.4, hy0 + 4.4, GH, crane);
    // racks of sorted parts, colour-coded by lifespan: a post at each corner, just clear of the
    // stock; the back post goes behind the stock, the others stand at its edges
    const racks = el("g", {}, hub), rackItems = [];
    for (let r = 0; r < 4; r++) {
      const rx = hx0 + 8 + r * 19, ry0 = hy0 + 6, ry1 = hy0 + 30;
      const post = (x, y) => line(racks, [[x, y, 0], [x, y, 16]], "ln thick");
      post(rx - 0.3, ry0 - 0.3);
      for (let lv = 0; lv < 4; lv++) {
        const it = el("g", {}, racks);
        box(it, rx, ry0, lv * 4, rx + 9, ry1, lv * 4 + 2.6, PART_MATS[(r + lv) % 5]);
        rackItems.push(it);
      }
      post(rx + 9.3, ry0 - 0.3); post(rx - 0.3, ry1 + 0.3); post(rx + 9.3, ry1 + 0.3);
    }
    // workbenches
    [[hx0 + 22, hy0 + 52], [hx0 + 46, hy0 + 52], [hx0 + 70, hy0 + 52]].forEach(([bx, by], k) => {
      box(hub, bx, by, 0, bx + 12, by + 5, 3.2, "m-white");
      box(hub, bx + 2, by + 0.8, 3.2, bx + 10, by + 4, 3.9, PART_MATS[k]);
    });
    // a wall panel standing, waiting to be sorted
    box(hub, hx0 + 30, hy0 + 76, 0, hx0 + 31, hy0 + 92, 9, "m-butter");
    // the crane lifts a panel; then its near legs and its beam
    const hook = el("g", {}, hub);
    box(hook, gx + 6, 105, 6, gx + 7, 119, 15, "m-butter");
    line(hook, [[gx + 6.5, 112, 15], [gx + 6.5, 112, GH]], "ln");
    for (const lx of [gx, gx + 12]) box(hub, lx, hy1 - 4.4, 0, lx + 1.4, hy1 - 3, GH, crane);
    box(hub, gx - 0.4, hy0 + 2.6, GH, gx + 13.8, hy1 - 2.6, GH + 1.8, crane);
    // the near glass and columns, and the eave beam
    wallX(hub, hy1, "fy");
    wallY(hub, hx1, "fx");
    for (let k = 0; k <= TEETH; k++) column(hub, hx0 + k * tw, hy1);
    line(hub, [[hx0, hy1, H], [hx1, hy1, H]], "ln thick");
    // the sawtooth roof, glazed: each slope, then its upright clerestory, back to front
    for (let k = 0; k < TEETH; k++) {
      const a = hx0 + k * tw, b = a + tw;
      face(hub, [[a, hy0, H], [b, hy0, H + 9], [b, hy0, H]], "m-glazing", "fy");
      face(hub, [[a, hy0, H], [b, hy0, H + 9], [b, hy1, H + 9], [a, hy1, H]], "m-glazing", "fz");
      face(hub, [[b, hy0, H], [b, hy1, H], [b, hy1, H + 9], [b, hy0, H + 9]], "m-glazing", "fx");
      face(hub, [[a, hy1, H], [b, hy1, H + 9], [b, hy1, H]], "m-glazing", "fy");
      line(hub, [[a, hy0, H], [b, hy0, H + 9], [b, hy0, H]], "cut");
      line(hub, [[a, hy1, H], [b, hy1, H + 9], [b, hy1, H]], "cut");
      line(hub, [[b, hy0, H + 9], [b, hy1, H + 9]], "cut");
    }
    // plaza: halftone dots, umbrella, empty benches
    face(hub, [[hx0 + 4, hy1 + 4, 0.06], [hx1 + 8, hy1 + 4, 0.06], [hx1 + 8, hy1 + 20, 0.06], [hx0 + 4, hy1 + 20, 0.06]], "g-plaza", "");
    dots(hub, hx0 + 6, hy1 + 6, hx1 + 6, hy1 + 18, 2.6, 0.45);
    const um = P(hx0 + 26, hy1 + 12, 9);
    const umb = el("g", {}, hub);
    line(umb, [[hx0 + 26, hy1 + 12, 0], [hx0 + 26, hy1 + 12, 9]]);
    for (let k = 0; k < 8; k++) {
      const a0 = (k / 8) * Math.PI, a1 = ((k + 1) / 8) * Math.PI;
      el("path", { d: `M${um[0]},${um[1] - 2}L${um[0] - 7 * Math.cos(a0)},${um[1] + 1.4 * Math.sin(a0) + 0.6}L${um[0] - 7 * Math.cos(a1)},${um[1] + 1.4 * Math.sin(a1) + 0.6}Z`, class: "f " + (k % 2 ? "m-red fx" : "m-white fx") }, umb);
    }
    outline(umb);
    for (let k = 0; k < 3; k++) box(hub, hx0 + 44 + k * 14, hy1 + 9, 0, hx0 + 52 + k * 14, hy1 + 11, 1.6, "m-teal");
    for (let k = 0; k < 3; k++) tree(hub, hx1 + 4, hy0 + 10 + k * 40, 3.6, k + 2);
    line(hub, [[hx0 - 6, hy1 + 24, 0.2], [hx1 + 12, hy1 + 24, 0.2]], "route-b");

    // ---------- the material route: house to hub and back ----------
    const hy = TARGET * LOT + LOT / 2;
    const out = line(root, [[100, hy - 4, 0.3], [STREET[0], hy - 4, 0.3], [STREET[1] + 6, hy - 4, 0.3], [hx0 + 10, hy - 4, 0.3]], "route");
    const back = line(root, [[hx0 + 10, hy + 5, 0.3], [STREET[1] + 6, hy + 5, 0.3], [STREET[0], hy + 5, 0.3], [108, hy + 5, 0.3]], "route");

    // tokens: components in transit, in their lifespan colours
    const tokens = el("g", {}, root), toks = [];
    for (let k = 0; k < 10; k++) {
      const t = el("g", {}, tokens), m = PART_MATS[k % 5];
      if (k % 3 === 0) box(t, 0, -1, 0, 9, 1, 1.4, m);
      else if (k % 3 === 1) box(t, 0, -3, 0, 1, 3, 6, m);
      else box(t, 0, -2.5, 0, 5, 2.5, 3, m);
      toks.push(t);
    }

    // leave the upper left to the title
    fit(svg, 14, { left: 0.3, top: 0.36 });
    svg.setAttribute("preserveAspectRatio", "xMaxYMax meet");
    return { svg, draws, houses, target: houses[TARGET], pieces, reused, rackItems, out, back, toks, hook, hy, hx0 };
  }

  function animate(s) {
    const tl = gsap.timeline({ defaults: { ease: "power2.out" } });
    const at = (x, y, z = 0) => P(x, y, z);
    // 1. the ground draws itself
    s.draws.forEach((p) => { const L = p.getTotalLength(); gsap.set(p, { strokeDasharray: L, strokeDashoffset: L }); });
    tl.to(s.draws, { strokeDashoffset: 0, duration: 1.2, stagger: 0.02, ease: "power1.inOut", onComplete: () => s.draws.forEach((p) => p.style.removeProperty("stroke-dasharray")) }, 0);
    // 2. the houses arrive, back to front
    s.houses.forEach((h, i) => tl.from(h.g, { autoAlpha: 0, y: 14, duration: 0.7 }, 0.4 + i * 0.1));
    gsap.set(s.pieces.concat(s.reused), { autoAlpha: 0 });
    gsap.set(s.toks, { autoAlpha: 0 });
    gsap.set(s.rackItems, { autoAlpha: 0 });
    gsap.set([s.out, s.back], { autoAlpha: 0 });
    // 3. the target house comes apart in layers
    const T = 2.4, parts = s.target.parts;
    tl.to(parts.roof, { y: -26, duration: 0.9, ease: "power3.out" }, T)
      .to(parts.chimney || {}, { y: -38, duration: 0.9, ease: "power3.out" }, T)
      .to(parts.gable, { x: 14, y: 7, duration: 0.9 }, T + 0.15)
      .to(parts.side, { x: -12, y: 6, duration: 0.9 }, T + 0.15)
      .to(parts.porch || {}, { x: 20, y: 10, duration: 0.9 }, T + 0.25)
      .to(parts.base, { autoAlpha: 0.35, duration: 0.6 }, T + 0.3);
    // 4. it leaves as components along the route to the hub
    const T2 = T + 1.4;
    tl.to(s.out, { autoAlpha: 1, duration: 0.3 }, T2);
    const a = at(100, s.hy - 4, 0.3), mid = at(160, s.hy - 4, 0.3), b = at(s.hx0 + 10, s.hy - 4, 0.3);
    s.toks.forEach((t, k) => {
      tl.set(t, { x: a[0], y: a[1] - 4 }, T2)
        .to(t, { autoAlpha: 1, duration: 0.2 }, T2 + k * 0.1)
        .to(t, { x: mid[0], y: mid[1] - 4, duration: 0.9, ease: "power1.inOut" }, T2 + k * 0.1)
        .to(t, { x: b[0], y: b[1] - 4, autoAlpha: 0, duration: 0.7, ease: "power1.in" }, T2 + 0.9 + k * 0.1);
    });
    tl.to([parts.roof, parts.gable, parts.side, parts.porch, parts.chimney, parts.base].filter(Boolean), { autoAlpha: 0, duration: 0.6 }, T2 + 0.2);
    // 5. the hub sorts them onto its racks
    const T3 = T2 + 2.0;
    tl.to(s.rackItems, { autoAlpha: 1, duration: 0.25, stagger: { each: 0.04, from: "random" } }, T3);
    // 6. parts come back and the multiplex is assembled on the same lot
    const T4 = T3 + 0.8;
    tl.to(s.out, { autoAlpha: 0.3, duration: 0.4 }, T4).to(s.back, { autoAlpha: 1, duration: 0.3 }, T4);
    s.pieces.forEach((pc, k) => tl.fromTo(pc, { autoAlpha: 0, y: -40 }, { autoAlpha: 1, y: 0, duration: 0.6, ease: "power3.out" }, T4 + 0.2 + k * 0.15));
    const T5 = T4 + 0.2 + s.pieces.length * 0.15 + 0.1;
    tl.to(s.reused, { autoAlpha: 1, duration: 0.5, stagger: 0.18 }, T5)
      .to(s.back, { autoAlpha: 0.3, duration: 0.6 }, ">+0.3");
    return tl;
  }

  let tl = null;
  function play() {
    const host = document.getElementById("hero");
    if (!host) return;
    if (tl) tl.kill();
    const s = build(host);
    tl = animate(s);
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) tl.progress(1);
  }
  window.HERO = { play };
})();
