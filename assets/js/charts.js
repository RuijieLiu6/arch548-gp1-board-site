/* Graphics for the one-message slides. Every number is traced in its slide's
   source line. Each builder draws into its slide's .art box and returns a
   paused timeline that plays when the slide arrives. Marks glow (#bloom);
   text stays crisp. */
(() => {
  const { P, el, poly, line, face, box, tree, person, house, onFace, outline, fit, svg: isoSvg } = window.ISO;
  const TXT = "#F3EFE6", MUT = "#9AA0AE", DIM = "#3A4152", BG2 = "#151A25";
  const C = { cobalt: "#5B7CFF", red: "#FF5A3D", sun: "#FFD23F", rose: "#FF9FC6", purple: "#A98BFF", teal: "#3FE0C8", green: "#7CDB6A", orange: "#FF9A3D", magenta: "#FF4F9A", lav: "#B9B2FF", sky: "#8ED0FF", ash: "#6B7286" };
  const TIER = [C.ash, C.rose, C.magenta]; // none, 75%, 90%: dim to strong
  const fmt = (n) => n.toLocaleString("en-CA");

  function chart(host, w, h, ar = "xMidYMid meet") {
    host.replaceChildren();
    return el("svg", { class: "dwg", viewBox: `0 0 ${w} ${h}`, preserveAspectRatio: ar }, host);
  }
  const text = (g, x, y, s, cls = "lbl", anchor = "start", extra = {}) => {
    const t = el("text", Object.assign({ x, y, class: cls, "text-anchor": anchor }, extra), g);
    t.textContent = s;
    return t;
  };
  const rect = (g, x, y, w, h, attrs = {}) => el("rect", Object.assign({ x, y, width: Math.max(0, w), height: h }, attrs), g);
  const tip = (node, html) => { node.dataset.tip = html; return node; };
  const glowG = (parent) => el("g", { class: "glow" }, parent);
  // CC0 silhouettes (rawpixel), cut out by build/hub_collage.py: width / height
  const PEOPLE = "figures/hub/cut/people/";
  /** A silhouette's image: embedded (assets/data/people.js), else the file. */
  const silImg = (name) => (window.PEOPLE_IMG && window.PEOPLE_IMG[name]) || PEOPLE + name + ".png";
  /** An open-licensed model rendered in the board camera (assets/data/models.js), its footprint centred on (x, y). */
  const model = (g, name, x, y) => {
    const m = window.MODELS && window.MODELS[name];
    if (!m) return null;
    const [px, py] = P(x, y, 0);
    return el("image", { href: m.src, x: px + m.x0, y: py + m.y0, width: m.w, height: m.h }, g);
  };
  const SIL = { "cyclist-2": 1.052, "walk-054": 0.475, "walk-055": 0.388, "walk-056": 0.263, "walk-057": 0.417, "walk-058": 0.512, "walker-1": 0.517, "walker-2": 0.423, "walker-3": 0.271, "walker-4": 0.392, "walker-5": 0.479, "woman-jogging": 0.525,
    "worker-standing": 0.288, "worker-walking": 0.283, "worker-tool": 0.545, "worker-pointing": 0.533, "worker-signal": 0.395,
    "worker-standing-r": 0.290, "worker-walking-r": 0.340, "worker-tool-r": 0.282, "worker-pointing-r": 0.300, "worker-signal-r": 0.289 };
  /** A softer bloom for axonometrics drawn in feet, where #bloom would spread too far. */
  function footBloom(defs, id) {
    const f = el("filter", { id, x: "-30%", y: "-30%", width: "160%", height: "160%", "color-interpolation-filters": "sRGB" }, defs);
    el("feGaussianBlur", { in: "SourceGraphic", stdDeviation: 0.6, result: "b1" }, f);
    el("feGaussianBlur", { in: "SourceGraphic", stdDeviation: 1.8, result: "b2" }, f);
    el("feColorMatrix", { in: "b2", type: "matrix", values: "1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 0.5 0", result: "b2a" }, f);
    el("feColorMatrix", { in: "b1", type: "matrix", values: "1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 0.55 0", result: "b1a" }, f);
    const m = el("feMerge", {}, f);
    ["b2a", "b1a", "SourceGraphic"].forEach((n) => el("feMergeNode", { in: n }, m));
    return f;
  }

  /** Images from the original sources (assets/data/sources.js): for each step, a shelf over `box` that opens
   *  while that step is lit, each image with its title, author and year beside it. */
  function sourceShelf(s, host, byStep, box, col) {
    const slide = host.closest(".slide"), groups = {};
    Object.entries(byStep || {}).forEach(([k, items]) => {
      const g = el("g", { opacity: 0, "pointer-events": "none" }, s);
      el("rect", { x: box.x, y: box.y, width: box.w, height: box.h, rx: 12, fill: "#0E121B", "fill-opacity": 0.97, stroke: col, "stroke-width": 1.2 }, g);
      const H = box.h - 28, slot = (box.w - 24) / items.length;
      items.forEach((it, i) => {
        const x = box.x + 16 + i * slot, w = Math.min(H * it.w / it.h, slot * 0.55);
        el("image", { href: it.img, x, y: box.y + 14, width: w, height: H, preserveAspectRatio: "xMidYMid meet" }, g);
        const tx = x + w + 16, chars = Math.max(14, Math.floor((slot - w - 34) / 8.6));
        const lines = [], words = it.title.split(" ");
        let ln = "";
        words.forEach((wd) => { if ((ln + " " + wd).trim().length > chars) { lines.push(ln.trim()); ln = wd; } else ln += " " + wd; });
        lines.push(ln.trim());
        lines.slice(0, 3).forEach((t, j) => text(g, tx, box.y + 36 + j * 20, t, "lbl", "start", { style: "font-size:16px;font-weight:600" }));
        const yb = box.y + 36 + Math.min(lines.length, 3) * 20 + 4;
        text(g, tx, yb, it.by.length > chars + 8 ? it.by.slice(0, chars + 6) + "…" : it.by, "lbl-m", "start", { style: "font-size:14px" });
        text(g, tx, yb + 19, [it.year, it.credit].filter(Boolean).join(", "), "lbl-m", "start", { style: `font-size:13px;fill:${col}` });
      });
      groups[k] = g;
    });
    if (slide) slide.addEventListener("step", (e) => Object.entries(groups).forEach(([k, g]) =>
      gsap.to(g, { opacity: +k === e.detail ? 1 : 0, duration: 0.4, delay: +k === e.detail ? 0.15 : 0, ease: "power2.out", overwrite: true })));
  }

  /* ---------- 6: three kinds of building, three rates of change ----------
     After Sim Van der Ryn, in Brand's How Buildings Learn: commercial
     buildings change fast, institutions resist change, homes change
     steadily. Each building moves at its own rate: the shop swaps tenants,
     the institution stays put, the house slowly gains a porch, a dormer and
     a laneway house. A clock above each turns at that rate. */
  function kinds(host) {
    const s = isoSvg(host, "dwg");
    footBloom(el("defs", {}, s), "bloom-kinds");
    const pad = (g, x0, y0, x1, y1, cls) => face(g, [[x0, y0, 0], [x1, y0, 0], [x1, y1, 0], [x0, y1, 0]], cls, "");
    const lit = (g) => el("g", { filter: "url(#bloom-kinds)" }, g);
    const who = (g, name, x, y, flip, ht = 5.8) => {
      const p = P(x, y, 0), h = ht * 0.86603, w = h * SIL[name];
      el("image", { href: silImg(name + (flip ? "-r" : "")), x: p[0] - w / 2, y: p[1] - h, width: w, height: h }, g);
    };
    const clock = (g, cx, col) => {
      const c = [P(cx, -cx, 0)[0], -47];
      el("circle", { cx: c[0], cy: c[1], r: 5, fill: "#121722", stroke: col, "stroke-width": 1.6, "vector-effect": "non-scaling-stroke", filter: "url(#bloom-kinds)" }, g);
      for (let i = 0; i < 12; i++) {
        const a = (i / 12) * Math.PI * 2, r0 = i % 3 ? 4.1 : 3.6;
        el("path", { d: `M${c[0] + Math.sin(a) * r0},${c[1] - Math.cos(a) * r0}L${c[0] + Math.sin(a) * 4.6},${c[1] - Math.cos(a) * 4.6}`, stroke: TXT, "stroke-width": 0.8, "vector-effect": "non-scaling-stroke", opacity: 0.6 }, g);
      }
      const hand = el("path", { d: `M${c[0]},${c[1]}L${c[0]},${c[1] - 3.7}`, stroke: col, "stroke-width": 2, "stroke-linecap": "round", "vector-effect": "non-scaling-stroke" }, g);
      el("circle", { cx: c[0], cy: c[1], r: 0.6, fill: col }, g);
      return { hand, c };
    };
    const label = (g, cx, name, what, col) => {
      const p = P(cx + 22, -cx + 22, 0);
      text(g, p[0], p[1] + 8, name, "lbl", "middle", { style: `font-size:calc(21px * var(--u,1));font-weight:600;fill:${col}` });
      text(g, p[0], p[1] + 12.6, what, "lbl-m", "middle", { style: "font-size:calc(15px * var(--u,1))" });
    };

    // commercial: a shop block whose tenants keep turning over
    const G1 = el("g", { "data-focus": "2" }, s);
    pad(G1, -22, -22, 22, 22, "g-walk");
    const b1 = lit(G1);
    box(b1, -14, -12, 0, 12, 12, 32, "m-cobalt");
    const fx1 = { o: [12, -12, 0], u: [0, 1, 0], v: [0, 0, 1] }, fy1 = { o: [-14, 12, 0], u: [1, 0, 0], v: [0, 0, 1] };
    for (const z of [14, 21, 28]) {
      for (let u = 2.5; u < 21; u += 5) face(b1, onFace(fx1, u, z - 1, u + 3, z + 2.5), "m-glass", "fx");
      for (let u = 2.5; u < 23; u += 5) face(b1, onFace(fy1, u, z - 1, u + 3, z + 2.5), "m-glass", "fy");
    }
    face(b1, onFace(fx1, 1.5, 0.6, 22.5, 7.6), "m-glass", "fx");
    face(b1, onFace(fy1, 1.5, 0.6, 24.5, 7.6), "m-glass", "fy");
    const tenants = ["m-red", "m-sun", "m-teal", "m-rose"].map((m, i) => {
      const t = el("g", {}, b1);
      face(t, onFace(fx1, 0.6, 8.4, 23.4, 10.6), m, "fx");
      face(t, onFace(fy1, 0.6, 8.4, 25.4, 10.6), m, "fy");
      face(t, [[12, -11, 8.2], [12, 11, 8.2], [15.5, 11, 6.6], [15.5, -11, 6.6]], m, "fz");
      face(t, [[-13, 12, 8.2], [12, 12, 8.2], [12, 15.5, 6.6], [-13, 15.5, 6.6]], m, "fz");
      if (i) t.style.visibility = "hidden";
      return t;
    });
    who(G1, "walker-2", 2, 19, 1); who(G1, "walk-055", 18, 4, 0); who(G1, "woman-jogging", 19, 17, 0);
    const k1 = clock(G1, 0, C.cobalt);
    label(G1, 0, "Commercial", "“forever metamorphic”", C.cobalt);

    // institutional: a portico on a podium, built to stay as it is
    const G2 = el("g", { "data-focus": "3" }, s);
    pad(G2, 42, -86, 86, -42, "g-walk");
    const b2 = lit(G2);
    box(b2, 45, -83, 0, 83, -45, 1.4, "m-white");
    box(b2, 47, -81, 1.4, 81, -47, 2.8, "m-white");
    box(b2, 50, -78, 2.8, 78, -55, 24, "m-white");
    const fx2 = { o: [78, -78, 0], u: [0, 1, 0], v: [0, 0, 1] };
    for (let u = 3; u < 22; u += 5) face(b2, onFace(fx2, u, 7, u + 2.2, 19), "m-glass", "fx");
    for (let x = 51.5; x < 78; x += 5.3) box(b2, x - 0.75, -50.8, 2.8, x + 0.75, -49.3, 21, "m-white");
    box(b2, 50, -55, 21, 78, -48.6, 24, "m-white");
    const roof2 = el("g", {}, b2);
    face(roof2, [[64, -78, 30], [64, -48.6, 30], [78, -48.6, 24], [78, -78, 24]], "m-ash", "fx");
    face(roof2, [[50, -48.6, 24], [78, -48.6, 24], [64, -48.6, 30]], "m-white", "fy");
    outline(roof2);
    who(G2, "walk-057", 68, -42.5, 0);
    const k2 = clock(G2, 64, C.ash);
    label(G2, 64, "Institutional", "“designed to prevent change”", "#B9BCCB");

    // domestic: a house that keeps adding to itself
    const G3 = el("g", { "data-focus": "4 5" }, s);
    pad(G3, 106, -150, 150, -106, "g-yard");
    const b3 = lit(G3);
    const lane = el("g", {}, b3);
    box(lane, 108, -119, 0, 118, -108, 10, "m-teal");
    box(lane, 107.5, -119.5, 10, 118.5, -107.5, 10.8, "m-green");
    house(b3, { x: 120, y: -142, d: 22, w: 22, h: 14, rh: 9, chimney: true, wall: "m-sun", roof: "m-cobalt", boards: true });
    const dormer = el("g", {}, b3);
    box(dormer, 126, -130, 16.5, 132, -124, 21.5, "m-salmon");
    box(dormer, 125.6, -130.4, 21.5, 132.4, -123.6, 22.3, "m-cobalt");
    const porch = el("g", {}, b3);
    box(porch, 142, -140, 0, 148, -131, 2.4, "m-white");
    line(porch, [[147.6, -139.8, 2.4], [147.6, -139.8, 10]]);
    line(porch, [[147.6, -131.2, 2.4], [147.6, -131.2, 10]]);
    face(porch, [[141.5, -140.4, 10], [148.4, -140.4, 10], [148.4, -130.6, 10], [141.5, -130.6, 10]], "m-rose", "fz");
    outline(porch);
    const treeG = el("g", {}, b3);
    tree(treeG, 146, -111, 3.6, 2);
    who(G3, "walker-1", 139, -112, 1); who(G3, "walker-3", 134, -109, 0, 5.2);
    const k3 = clock(G3, 128, C.sun);
    label(G3, 128, "Domestic", "“the steadiest changers”", C.sun);

    fit(s, 12);
    const still = matchMedia("(prefers-reduced-motion: reduce)").matches;
    const base = P(146, -111, 0).join(" ");
    // each building at its own rate: tenants every 1.2 s, the house over 14 s, the institution never
    const shop = gsap.timeline({ repeat: -1, paused: true });
    tenants.forEach((t, i) => shop.set(tenants, { visibility: "hidden" }, i * 1.2).set(t, { visibility: "visible" }, i * 1.2));
    shop.set({}, {}, tenants.length * 1.2);
    const home = gsap.timeline({ repeat: -1, paused: true });
    home.set([porch, dormer, lane], { autoAlpha: 0 }, 0).set(treeG, { scale: 0.35, svgOrigin: base }, 0)
      .to(porch, { autoAlpha: 1, duration: 0.8 }, 1.5).to(treeG, { scale: 0.7, svgOrigin: base, duration: 3, ease: "sine.inOut" }, 1.5)
      .to(dormer, { autoAlpha: 1, duration: 0.8 }, 4.5).to(treeG, { scale: 1, svgOrigin: base, duration: 4, ease: "sine.inOut" }, 4.5)
      .to(lane, { autoAlpha: 1, duration: 0.8 }, 8)
      .to([porch, dormer, lane], { autoAlpha: 0, duration: 0.9 }, 13).to(treeG, { scale: 0.35, svgOrigin: base, duration: 0.9 }, 13);
    const spin = ({ hand, c }, period) => gsap.to(hand, { rotation: 360, svgOrigin: c.join(" "), duration: period, ease: "none", repeat: -1, paused: true });
    const loops = [shop, home, spin(k1, 1.2 * tenants.length), spin(k3, 14)];

    const tl = gsap.timeline({ paused: true });
    tl.fromTo([b1, b2, b3], { autoAlpha: 0, y: 3 }, { autoAlpha: 1, y: 0, duration: 0.8, stagger: 0.2, ease: "power3.out", clearProps: "opacity,visibility" })
      .call(() => { if (!still) loops.forEach((l) => l.play()); });
    return tl;
  }

  /* ---------- 17: Brand's shearing layers, redrawn, plus one ----------
     After Stewart Brand, How Buildings Learn (1994): a house as six layers,
     the slowest at the bottom, exploded apart, each with Brand's rate. CMHC
     figures appear on the layers they cover; the seventh layer, Salvage, is
     the project's addition: each layer leaving on its own clock. */
  function shear(host) {
    const s = isoSvg(host, "dwg");
    footBloom(el("defs", {}, s), "bloom-shear");
    const X = 30, Y = 22, GAP = 13;
    const outlineAt = (g) => line(g, [[0, 0, 0], [X, 0, 0], [X, Y, 0], [0, Y, 0], [0, 0, 0]], "hid");
    const layers = [];
    const layer = (name, rate, col, h, focus, draw, cmhc) => {
      const z = layers.length ? layers[layers.length - 1].z + layers[layers.length - 1].h + GAP : 0;
      const G = el("g", { "data-focus": focus }, s);
      const g = el("g", { transform: `translate(0,${(-z * 0.86603).toFixed(2)})` }, G);
      const art = el("g", { filter: "url(#bloom-shear)" }, g);
      draw(art, g);
      layers.push({ name, rate, col, h, z, G, g, cmhc });
      return g;
    };
    // site: the lot, eternal
    layer("Site", "eternal", C.green, 0, "4", (a) => {
      face(a, [[-6, -6, 0], [X + 6, -6, 0], [X + 6, Y + 6, 0], [-6, Y + 6, 0]], "g-yard", "");
      outlineAt(a);
      tree(a, -3, -3, 3, 1); tree(a, X + 3, -3, 2.4, 3);
    });
    // structure: foundation, posts, plates, ridge and rafters
    layer("Structure", "30 to 300 years", C.orange, 18.3, "3 4", (a) => {
      box(a, 0, 0, 0, X, Y, 1.2, "m-ash");
      const posts = [];
      for (const x of [0.5, 10, 20, X - 0.5]) for (const y of [0.5, Y - 0.5]) posts.push([x, y]);
      posts.sort((p, q) => p[0] + p[1] - q[0] - q[1]).forEach(([x, y]) => box(a, x - 0.45, y - 0.45, 1.2, x + 0.45, y + 0.45, 11, "m-slab"));
      box(a, 0, 0, 11, X, 0.8, 11.8, "m-slab"); box(a, 0, 0, 11, 0.8, Y, 11.8, "m-slab");
      box(a, 0, Y - 0.8, 11, X, Y, 11.8, "m-slab"); box(a, X - 0.8, 0, 11, X, Y, 11.8, "m-slab");
      for (let x = 0.5; x <= X; x += 5.8) { line(a, [[x, 0.4, 11.8], [x, Y / 2, 17.5]], "ln thick"); line(a, [[x, Y - 0.4, 11.8], [x, Y / 2, 17.5]], "ln thick"); }
      box(a, 0, Y / 2 - 0.4, 17.5, X, Y / 2 + 0.4, 18.3, "m-slab");
    }, "CMHC: no published figure for the frame");
    // skin: walls, windows and roof
    layer("Skin", "about 20 years", C.sun, 18, "2 4", (a) => {
      house(a, { x: 0, y: 0, d: X, w: Y, h: 11, rh: 7, wall: "m-sun", roof: "m-cobalt", boards: true });
    }, "CMHC: fibre-cement cladding, about 60");
    // services: pipes, duct, heater, panel
    layer("Services", "7 to 15 years", C.sky, 9, "4", (a) => {
      outlineAt(a);
      box(a, 2, 13, 7, X - 2, 16, 9, "m-white");
      box(a, 0, 4, 0.3, X, 4.8, 1.1, "m-sky");
      box(a, 6, 4, 1.1, 7, 5, 9, "m-sky");
      box(a, 23, 16, 0, 27, 20, 6.5, "m-white");
      box(a, X - 0.8, 2, 2.5, X, 5.5, 7, "m-sun");
      line(a, [[X - 0.4, 5.5, 4.5], [X - 0.4, 12, 4.5], [20, 12, 4.5]], "ln dsh");
    });
    // space plan: floor, partitions and their finishes
    layer("Space plan", "3 to 30 years", C.rose, 8.6, "1 4", (a) => {
      box(a, 0, 0, 0, X, Y, 0.6, "m-slab");
      box(a, 0, 8, 0.6, 9, 8.6, 8.6, "m-lav");
      box(a, 12, 0, 0.6, 12.6, 14, 8.6, "m-rose");
      box(a, 12.6, 13.4, 0.6, X, 14, 8.6, "m-rose");
    }, "CMHC: interior paint, about 10");
    // stuff: furniture and boxes
    layer("Stuff", "daily to monthly", C.purple, 5, "4", (a) => {
      outlineAt(a);
      box(a, 2, 15, 0, 5, 18, 3, "m-salmon"); box(a, 2.4, 15.4, 3, 4.6, 17.6, 5, "m-salmon");
      box(a, 16, 3, 0, 24, 9, 1.8, "m-sky"); box(a, 16, 3, 1.8, 17.2, 9, 3.4, "m-sky");
      box(a, 4, 4, 2.4, 10, 8, 2.8, "m-sun");
      [[4.3, 4.3], [9.7, 4.3], [4.3, 7.7], [9.7, 7.7]].forEach(([x, y]) => line(a, [[x, y, 0], [x, y, 2.4]], "ln"));
      box(a, 18, 15, 0, 27, 18, 2.2, "m-red"); box(a, 18, 18, 0, 27, 19.2, 3.6, "m-red");
    });

    // corner guides that tie the layers into one house
    const top = layers[layers.length - 1].z + 5;
    const guides = el("g", {}, s);
    s.insertBefore(guides, s.firstChild.nextSibling);
    [[0, 0], [X, 0], [0, Y], [X, Y]].forEach(([x, y]) => line(guides, [[x, y, 0], [x, y, top]], "hid"));

    // labels on the right: Brand's name and rate, then CMHC where it has a figure
    layers.forEach((L) => {
      const a = P(X, 0, L.z + L.h / 2), lx = P(X + 30, -30, 0)[0];
      line(L.G, [], "lead").setAttribute("d", `M${a[0] + 1.5},${a[1]}H${lx - 1.5}`);
      text(L.G, lx, a[1] - 0.6, L.name, "lbl", "start", { style: `font-size:calc(21px * var(--u,1));font-weight:600;fill:${L.col}` });
      text(L.G, lx, a[1] + 3.6, L.rate, "lbl-m", "start", { style: "font-size:calc(15px * var(--u,1))" });
      if (L.cmhc) text(L.G, lx + 34, a[1] + 1.4, L.cmhc, "lbl", "start", { "data-from": L.focus || "", style: `font-size:calc(15px * var(--u,1));fill:${C.sun}` });
    });
    layers.forEach((L) => { const c = L.G.querySelector("[data-from]"); if (c) c.setAttribute("data-from", L.G.dataset.focus.split(" ")[0]); });

    // the added layer: Salvage, each layer leaving on its own clock
    const sal = el("g", { "data-focus": "4", "data-from": "4" }, s);
    const lx = P(0, Y + 34, 0)[0];
    layers.forEach((L, i) => {
      const a = P(0, Y, L.z + L.h / 2);
      el("path", { d: `M${a[0] - 1.5},${a[1]}H${lx + 2}`, class: "route", "marker-end": "" }, sal);
      el("path", { d: `M${lx + 4},${a[1] - 1.4}L${lx + 1.8},${a[1]}L${lx + 4},${a[1] + 1.4}`, fill: "none", stroke: C.magenta, "stroke-width": 1.8, "vector-effect": "non-scaling-stroke" }, sal);
    });
    const yTop = P(0, Y, top)[1], yBot = P(0, Y, 0)[1];
    el("path", { d: `M${lx},${yTop}V${yBot}`, stroke: C.magenta, "stroke-width": 2.4, "vector-effect": "non-scaling-stroke", class: "glow" }, sal);
    const ym = (yTop + yBot) / 2;
    text(sal, lx - 3, ym - 6, "+ Salvage", "lbl", "end", { style: `font-size:calc(22px * var(--u,1));font-weight:600;fill:${C.magenta}` });
    text(sal, lx - 3, ym - 1.6, "my addition, across all layers:", "lbl-m", "end", { style: "font-size:calc(15px * var(--u,1))" });
    text(sal, lx - 3, ym + 2.4, "each could leave on its own clock,", "lbl-m", "end", { style: "font-size:calc(15px * var(--u,1))" });
    text(sal, lx - 3, ym + 6.4, "for reuse in another building", "lbl-m", "end", { style: "font-size:calc(15px * var(--u,1))" });

    fit(s, 10);
    const tl = gsap.timeline({ paused: true });
    tl.fromTo(layers.map((L) => L.G), { autoAlpha: 0, y: -6 }, { autoAlpha: 1, y: 0, duration: 0.7, stagger: 0.14, ease: "power3.out", clearProps: "opacity,visibility" });
    return tl;
  }

  /* ---------- 6: one number, as a ring ---------- */
  function co2(host) {
    const s = chart(host, 1000, 560);
    const cx = 500, cy = 270, R = 210, W = 34, a = 0.34 * Math.PI * 2;
    el("circle", { cx, cy, r: R, fill: "none", stroke: DIM, "stroke-width": W }, s);
    const g = glowG(s);
    const arc = el("path", { d: `M${cx},${cy - R} A${R},${R} 0 0 1 ${cx + R * Math.sin(a)},${cy - R * Math.cos(a)}`, fill: "none", stroke: C.orange, "stroke-width": W, "stroke-linecap": "butt" }, g);
    tip(arc, "<b>34%</b> of global CO₂: buildings and construction, UNEP / GlobalABC 2024/2025 sector headline");
    const n = text(s, cx, cy + 62, "34", "num", "middle", { style: `font-size:190px;fill:${TXT}` });
    // set against the final "34" (the number counts up from 0, so it is not measured)
    text(s, cx + 70, cy - 26, "%", "lbl", "start", { style: "font-size:44px;font-weight:300" });
    text(s, cx, cy + 112, "of global CO₂", "lbl-m", "middle", { style: "font-size:22px" });
    const L = 2 * Math.PI * R * 0.34;
    const tl = gsap.timeline({ paused: true });
    tl.fromTo(arc, { strokeDasharray: `0 ${L}` }, { strokeDasharray: `${L} 0`, duration: 1.6, ease: "power3.out" })
      .fromTo(n, { textContent: 0 }, { textContent: 34, duration: 1.6, ease: "power3.out", snap: { textContent: 1 } }, 0);
    return tl;
  }

  /* ---------- 8: 2,621 houses, one year, lit as the year passes ---------- */
  function homes(host) {
    const N = 2621, COLS = 81, ROWS = Math.ceil(N / COLS), cw = 12, ch = 12;
    const W = COLS * cw, H = ROWS * ch + 70;
    const s = chart(host, W, H);
    const defs = el("defs", {}, s);
    const sym = el("symbol", { id: "hse", viewBox: "0 0 10 10" }, defs);
    el("path", { d: "M1,5 L5,1.4 L9,5 L9,9.4 L1,9.4 Z" }, sym);
    const g = glowG(s), cells = [];
    for (let i = 0; i < N; i++) {
      const x = (i % COLS) * cw, y = Math.floor(i / COLS) * ch;
      cells.push(el("use", { href: "#hse", x: x + 1, y: y + 1, width: cw - 2, height: ch - 2, fill: DIM }, g));
    }
    const day = text(s, 0, H - 22, "", "lbl", "start", { style: "font-size:26px;font-variant-numeric:tabular-nums" });
    const cnt = text(s, W, H - 22, "", "num", "end", { style: "font-size:46px;fill:" + C.sun });
    const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    const state = { k: 0 };
    let lit = 0;
    const tl = gsap.timeline({ paused: true, onStart: () => { lit = 0; cells.forEach((c) => c.setAttribute("fill", DIM)); } });
    tl.to(state, {
      k: N, duration: 6, ease: "none",
      onUpdate: () => {
        const k = Math.floor(state.k);
        for (let i = lit; i < k; i++) cells[i].setAttribute("fill", C.sun);
        lit = Math.max(lit, k);
        cnt.textContent = fmt(k);
        day.textContent = months[Math.min(11, Math.floor((k / N) * 12))];
      },
    });
    tl.call(() => { day.textContent = "One year of demolitions, Metro Vancouver average 2012–2022"; });
    return tl;
  }

  /* ---------- 9: the permit map, drawn year by year ---------- */
  function permitMap(host, opts = {}) {
    const M = window.MAP;
    const s = chart(host, M.w, M.h);
    const areas = el("g", {}, s);
    M.areas.forEach((a) => {
      const n = (M.byArea.find((b) => b[0] === a.name) || [0, 0])[1];
      tip(el("path", { d: a.d, fill: BG2, stroke: DIM, "stroke-width": 1, "vector-effect": "non-scaling-stroke" }, areas), `<b>${a.name}</b><br>${fmt(n)} demolition permits, 2017–2026`);
    });
    const years = {}, dots = el("g", { "pointer-events": "none", class: opts.faint ? "" : "glow" }, s);
    for (let i = 0; i < M.pts.length; i += 4) {
      const yr = 2000 + M.pts[i + 2], t = M.pts[i + 3];
      if (!years[yr]) years[yr] = el("g", {}, dots);
      el("circle", { cx: M.pts[i], cy: M.pts[i + 1], r: opts.small ? 1.5 : 2.4, fill: opts.mono ? C.sun : TIER[t], "fill-opacity": opts.faint ? 0.3 : 0.9 }, years[yr]);
    }
    // north, clear of the dots: in the open ground south-west of the city
    const nx = 40, ny = M.h - 104;
    el("path", { d: `M${nx},${ny - 32}L${nx + 9},${ny}L${nx},${ny - 8}L${nx - 9},${ny}Z`, fill: TXT }, s);
    text(s, nx, ny + 20, "N", "lbl", "middle");
    const km = M.kmUnits, sx = 40, sy = M.h - 30;
    rect(s, sx, sy, km, 6, { fill: "none", stroke: TXT, "stroke-width": 1, "vector-effect": "non-scaling-stroke" }); rect(s, sx + km, sy, km, 6, { fill: TXT });
    text(s, sx, sy - 8, "0", "lbl-m", "middle"); text(s, sx + km, sy - 8, "1", "lbl-m", "middle"); text(s, sx + 2 * km, sy - 8, "2 km", "lbl-m", "middle");
    const yl = text(s, 40, 70, "", "num", "start", { style: `font-size:72px;fill:${C.sun}` });
    const tl = gsap.timeline({ paused: true });
    const ys = Object.keys(years).sort();
    gsap.set(Object.values(years), { autoAlpha: opts.faint ? 1 : 0 });
    if (!opts.faint) {
      ys.forEach((y, k) => tl.to(years[y], { autoAlpha: 1, duration: 0.4 }, k * 0.36).call(() => { yl.textContent = y; }, null, k * 0.36));
      tl.call(() => { yl.textContent = "2017–2026"; }, null, ys.length * 0.36 + 0.3);
    }
    return { svg: s, tl };
  }

  /* ---------- 10: a hundred squares ---------- */
  function tiers(host) {
    const T = window.MAP.tiers, tot = T.none + T.t75 + T.t90;
    const n90 = Math.round((T.t90 / tot) * 100), n75 = Math.round((T.t75 / tot) * 100), n0 = 100 - n90 - n75;
    const s = chart(host, 1200, 560), cell = 46, gap = 6, x0 = 60, y0 = 30;
    const g = glowG(s), sq = [];
    for (let i = 0; i < 100; i++) {
      const c = i % 10, r = Math.floor(i / 10), t = i < n0 ? 0 : i < n0 + n75 ? 1 : 2;
      const q = rect(g, x0 + c * (cell + gap), y0 + r * (cell + gap), cell, cell, { rx: 4, fill: TIER[t], "data-focus": String(t + 1) });
      tip(q, t === 0 ? `<b>${fmt(T.none)}</b> permits state no recycling threshold (${n0}%)` : t === 1 ? `<b>${fmt(T.t75)}</b> at 75%, pre-1950 (${n75}%)` : `<b>${fmt(T.t90)}</b> at 90%, character houses (${n90}%)`);
      sq.push(q);
    }
    const lx = x0 + 10 * (cell + gap) + 50;
    [[n0, "no threshold stated", T.none, TIER[0]], [n75, "75% reuse or recycling, pre-1950", T.t75, TIER[1]], [n90, "90%, character houses", T.t90, TIER[2]]].forEach(([p, lab, n, col], k) => {
      const yy = y0 + 70 + k * 150, lg = el("g", { "data-focus": String(k + 1) }, s);
      text(lg, lx, yy, `${p}%`, "num", "start", { style: `font-size:96px;fill:${col}` });
      text(lg, lx, yy + 40, `${lab}, ${fmt(n)} permits`, "lbl", "start", { style: "font-size:20px" });
    });
    const tl = gsap.timeline({ paused: true });
    tl.from(sq, { scale: 0, transformOrigin: "50% 50%", duration: 0.35, stagger: { each: 0.012 }, ease: "back.out(2)" });
    return tl;
  }

  /* ---------- 11: diverted versus reused ---------- */
  function reuse(host) {
    const W = 1100, H = 470, X = 330, K = 28; // 28 units per tonne
    const s = chart(host, W, H), marks = [];
    const rows = [
      { y: 40, name: "Portland, deconstruction required", sub: "mean per project, 2016–2025", parts: [[4.37, C.green, "reused"], [19.45, C.ash, "to a recovery facility"]] },
      { y: 190, name: "Portland, 36 homes studied", sub: "Oregon DEQ 2019, mean per home", parts: [[4.8, C.green, "salvaged"], [13.05, "#4B5368", "not salvaged"]] },
      { y: 340, name: "Vancouver", sub: "outcome not published", parts: [] },
    ];
    const svgRoot = s;
    rows.forEach((r, ri, _all, s = el("g", { "data-focus": String(ri + 1) }, svgRoot)) => {
      text(s, 0, r.y + 22, r.name, "lbl", "start", { style: "font-size:20px" });
      text(s, 0, r.y + 46, r.sub, "lbl-m", "start", { style: "font-size:16px" });
      if (!r.parts.length) {
        const m = rect(s, X, r.y, 23.82 * K, 44, { fill: "none", stroke: C.magenta, "stroke-dasharray": "6 6", "stroke-width": 2, rx: 4, class: "glow" });
        tip(m, "<b>Vancouver</b>: no published reuse rate; permits record the obligation, not the destination.");
        text(s, X + 18, r.y + 30, "reuse rate not measured", "lbl", "start", { style: `font-size:20px;fill:${C.magenta}` });
        marks.push(m);
        return;
      }
      let x = X;
      const total = r.parts.reduce((a, p) => a + p[0], 0);
      r.parts.forEach(([t, c, lab], k) => {
        const m = rect(s, x, r.y, t * K - 3, 44, { fill: c, rx: 4, class: k === 0 ? "glow" : "" });
        tip(m, `<b>${t.toFixed(2)} t</b> ${lab} (${Math.round((t / total) * 100)}%)`);
        marks.push(m);
        text(s, k === 0 ? x : x + t * K - 4, r.y + 72, k === 0 ? `${t.toFixed(1)} t ${lab}, ${Math.round((t / total) * 100)}%` : `${t.toFixed(1)} t ${lab}`, "lbl", k === 0 ? "start" : "end", { style: `font-size:17px;fill:${k === 0 ? c : MUT}` });
        x += t * K;
      });
    });
    const tl = gsap.timeline({ paused: true });
    tl.from(marks, { attr: { width: 0 }, duration: 1, stagger: 0.25, ease: "power3.out" });
    return tl;
  }

  /* ---------- why wood first ----------
     One 1930 house in Dunbar, taken apart by hand in 2019 (City of Vancouver
     deconstruction case study): each material's weight and where it went.
     Lit: 1 the materials that already have a path, 2 the frame, 3 what the
     region still landfills (Metro Vancouver, 2022 composition study),
     4 the response: joints that make short pieces work. */
  function woodFirst(host) {
    const s = chart(host, 1500, 640), X = 330, K = 22; // 22 units per tonne
    const REUSED = C.green, RECYCLED = C.ash, ENERGY = C.orange, LANDFILL = "#4B5368";
    const T = (g, x, y, str, size, col = TXT, weight = 400, anchor = "start") => text(g, x, y, str, "lbl", anchor, { style: `font-size:${size}px;font-weight:${weight};fill:${col}` });
    const marks = [];
    T(s, 0, 30, "One 1930 house in Dunbar, taken apart by hand", 24, TXT, 600);
    T(s, 0, 58, "tonnes by material, and where each went", 17, MUT);
    [["reused", REUSED], ["recycled", RECYCLED], ["burned for energy", ENERGY], ["landfill", LANDFILL]].forEach(([lab, col], i) => {
      const x = 760 + i * 182;
      rect(s, x, 38, 16, 16, { fill: col, rx: 3 });
      T(s, x + 24, 52, lab, 16, MUT);
    });
    const ROWS = [
      { name: "Concrete", sub: "foundation", t: 39.52, parts: [[1, RECYCLED]], note: "crushed for road fill", focus: "1" },
      { name: "Lumber", sub: "framing and boards, likely old growth", t: 19.22, parts: [[0.25, REUSED], [0.74, ENERGY], [0.01, LANDFILL]], focus: "2 4" },
      { name: "Flooring", sub: "", t: 5.55, parts: [[0.85, REUSED], [0.15, LANDFILL]], note: "85% reused", focus: "1" },
      { name: "Plaster", sub: "", t: 3.09, parts: [[1, RECYCLED]], note: "into new wallboard", focus: "1" },
    ];
    let y = 104;
    ROWS.forEach((r) => {
      const g = el("g", { "data-focus": r.focus }, s), h = r.name === "Lumber" ? 52 : 40;
      T(g, 0, y + h / 2 + 2, r.name, 21, TXT, 600);
      if (r.sub) T(g, 0, y + h / 2 + 26, r.sub, 15, MUT);
      T(g, X - 16, y + h / 2 + 7, `${r.t.toFixed(1)} t`, 19, TXT, 400, "end");
      let x = X;
      r.parts.forEach(([f, col], k) => {
        const w = r.t * K * f;
        const m = rect(g, x, y, Math.max(2, w - (k < r.parts.length - 1 ? 3 : 0)), h, { fill: col, rx: 4, class: col === RECYCLED || col === LANDFILL ? "" : "glow" });
        tip(m, `<b>${r.name}</b>: ${Math.round(f * 100)}%, about ${(r.t * f).toFixed(1)} t`);
        marks.push(m);
        x += w;
      });
      if (r.note) T(g, X + r.t * K + 16, y + h / 2 + 7, r.note, 17, MUT);
      if (r.name === "Lumber") {
        T(g, X, y + h + 30, "25% reused", 18, REUSED, 600);
        T(g, X + r.t * K * 0.25 + 10, y + h + 30, "74% burned for energy", 18, ENERGY, 600);
        T(g, X, y + h + 56, "the City notes: pieces shorter than four feet can only be recycled", 17, MUT);
        y += 66;
      }
      y += h + 30;
    });
    // fixtures: all reused, no weight recorded
    const gf = el("g", { "data-focus": "1" }, s);
    T(gf, 0, y + 22, "Doors, trim, appliances", 21, TXT, 600);
    el("circle", { cx: X + 8, cy: y + 15, r: 8, fill: REUSED, class: "glow" }, gf);
    T(gf, X + 28, y + 22, "all reused through Habitat for Humanity; weight not recorded", 17, MUT);

    // the region: what building waste still sends to landfill
    const gr = el("g", { "data-focus": "3" }, s), RY = 552, RW = 39.52 * K, wood = 0.48;
    T(gr, 0, RY + 4, "The region's building waste", 21, TXT, 600);
    T(gr, 0, RY + 30, "thrown away in 2021: 372,000 t", 15, MUT);
    const rw = rect(gr, X, RY - 16, RW * wood - 3, 40, { fill: C.sun, rx: 4, class: "glow" });
    const rr = rect(gr, X + RW * wood, RY - 16, RW * (1 - wood), 40, { fill: DIM, rx: 4 });
    tip(rw, "<b>Wood of all kinds</b>: 48% by weight of the C&D waste disposed, about 177,000 t (Metro Vancouver, 2022 study)");
    marks.push(rw, rr);
    T(gr, X + 14, RY + 11, "wood of all kinds, 48%", 19, "#1A1A1A", 600);
    T(gr, X + RW * wood + 14, RY + 11, "plastics, roofing, rubble, metals and the rest", 16, MUT);

    // the response: short offcuts stacked in three courses with staggered butt joints, held by dowels: no glue, so it comes apart
    const gj = el("g", { "data-focus": "4", transform: "translate(880,356)" }, s);
    T(gj, 0, 0, "Start with wood", 24, C.sun, 600);
    T(gj, 0, 30, "joints that make short pieces work, and come apart", 17, MUT);
    const PL = 112, PH = 22, Y0 = 56, LEN = 4 * PL;
    for (let c = 0; c < 3; c++) {
      const off = c === 1 ? PL / 2 : 0, y0 = Y0 + c * (PH + 3);
      for (let x = -off; x < LEN; x += PL) {
        const a = Math.max(0, x), b = Math.min(LEN, x + PL);
        rect(gj, a + 1.5, y0, b - a - 3, PH, { fill: C.sun, "fill-opacity": 0.16, stroke: C.sun, "stroke-width": 2, rx: 3, class: "glow" });
      }
    }
    for (let k = 0; k < 8; k++) {
      const x = PL / 4 + k * (PL / 2);
      el("path", { d: `M${x},${Y0 - 6}V${Y0 + 3 * PH + 12}`, stroke: TXT, "stroke-width": 2.4, "stroke-linecap": "round", opacity: 0.85 }, gj);
    }
    T(gj, 0, Y0 + 3 * PH + 40, "short offcuts, stacked and dowelled, no glue", 15, MUT);

    const tl = gsap.timeline({ paused: true });
    tl.from(marks, { attr: { width: 0 }, duration: 0.9, stagger: 0.12, ease: "power3.out" });
    return tl;
  }

  /* ---------- 12: who is already asking ---------- */
  function timeline(host) {
    const items = [
      [2014, "Green Demolition By-law", "Vancouver: older houses reuse or recycle by weight", 1],
      [2016.8, "Deconstruction ordinance", "Portland: older houses must be taken apart", 0],
      [2020, "Teardown Index", "Dahmen and von Bergmann: a 168-year carbon payback", 1],
      [2022, "Nicholas Lynch", "urban geographer: Vancouver's deconstruction trades", 1],
      [2022.1, "Cornell Circular Construction Lab", "a house unbuilt in five days, then built with", 0],
      [2023.4, "Light House", "Vancouver non-profit: A Blueprint for Change", 1],
      [2023.5, "Unbuilders", "Vancouver deconstruction company", 1],
      [2025.6, "MIT Building Technology", "engineers reading demolition records for reuse", 0],
    ];
    const FOCUS = [1, 1, 2, 3, 3, 4, 4, 5];
    const W = 1500, x0 = 70, x1 = 1440, Y = 300, y = (yr) => x0 + ((yr - 2014) / 12.2) * (x1 - x0);
    const s = chart(host, W, 600);
    line(s, [], "ln").setAttribute("d", `M${x0},${Y}H${x1}`);
    for (let yr = 2014; yr <= 2026; yr++) { line(s, [], "lo").setAttribute("d", `M${y(yr)},${Y - 6}V${Y + 6}`); text(s, y(yr), Y + 30, String(yr), "lbl-m", "middle", { style: "font-size:15px" }); }
    // each label: its two lines, measured, then placed on the nearest tier where its stem crosses no
    // other label and no other stem crosses it (placed right to left; above and below the axis alternate)
    const sides = [-1, 1, -1, 1, -1, -1, -1, 1], TIER = 52, ev = [], g = [];
    items.forEach(([yr, a, b, local], k) => {
      const gx = el("g", { "data-focus": String(FOCUS[k]) }, s), X = y(yr);
      const stem = line(gx, [], "lo");
      el("circle", { cx: X, cy: Y, r: 8, fill: local ? C.magenta : C.sky, class: "glow" }, gx);
      const ta = text(gx, 0, 0, a, "lbl", "start", { style: `font-size:18px;font-weight:600;fill:${local ? C.rose : C.sky}` });
      const tb = text(gx, 0, 0, b, "lbl-m", "start", { style: "font-size:15px" });
      tip(gx, `<b>${a}</b>, ${Math.floor(yr)}<br>${b}`);
      ev.push({ k, X, side: sides[k], gx, stem, ta, tb, w: Math.max(ta.getComputedTextLength(), tb.getComputedTextLength()) || 9 * Math.max(a.length, b.length) });
      g.push(gx);
    });
    const placed = [];
    [...ev].sort((p, q) => q.X - p.X).forEach((e) => {
      const end = e.X + 10 + e.w > W - 10;
      e.x0 = end ? e.X - 10 - e.w : e.X + 10; e.x1 = end ? e.X - 10 : e.X + 10 + e.w;
      let tier = 1;
      for (;;) {
        const clash = placed.some((o) => o.side === e.side && (
          (o.X > e.x0 - 4 && o.X < e.x1 + 4 && o.tier >= tier) ||          // its stem would cross my label
          (e.X > o.x0 - 4 && e.X < o.x1 + 4 && tier >= o.tier) ||          // my stem would cross its label
          (o.tier === tier && o.x0 < e.x1 + 12 && e.x0 < o.x1 + 12)));     // the labels would overlap
        if (!clash) break;
        tier++;
      }
      e.tier = tier;
      placed.push(e);
      const up = e.side < 0, Ly = up ? Y - 50 - (tier - 1) * TIER : Y + 74 + (tier - 1) * TIER, anchor = end ? "end" : "start", tx = end ? e.X - 10 : e.X + 10;
      e.stem.setAttribute("d", `M${e.X},${Y}V${up ? Ly + 8 : Ly - 20}`);
      [[e.ta, Ly], [e.tb, Ly + 20]].forEach(([t, ty]) => { t.setAttribute("x", tx); t.setAttribute("y", ty); t.setAttribute("text-anchor", anchor); });
    });
    text(s, x0, 40, "Vancouver", "lbl", "start", { style: `font-size:16px;fill:${C.rose}` });
    text(s, x0 + 110, 40, "Elsewhere", "lbl", "start", { style: `font-size:16px;fill:${C.sky}` });
    sourceShelf(s, host, (window.SOURCES || {}).s11, { x: x0 - 20, y: 470, w: x1 - x0 + 40, h: 124 }, C.sky);
    const tl = gsap.timeline({ paused: true });
    tl.fromTo(g, { autoAlpha: 0, y: 10 }, { autoAlpha: 1, y: 0, duration: 0.5, stagger: 0.14, clearProps: "opacity,visibility" });
    return tl;
  }

  /* ---------- 13: land against house, drawn to value ---------- */
  function land(host) {
    const svg = isoSvg(host, "dwg");
    footBloom(el("defs", {}, svg), "bloom-land"); // the axonometric is measured in feet
    const g = el("g", {}, svg);
    const L = 33, D = 122, cut = D * 0.925;
    // the lot as a block of value: the land, and the thin slice the house is worth
    const landG = el("g", { filter: "url(#bloom-land)", "data-focus": "-" }, g);
    box(landG, 0, 0, -10, cut, L, 0, "m-sun");
    const houseG = el("g", { filter: "url(#bloom-land)", "data-focus": "1" }, g);
    box(houseG, cut + 1.5, 0, -10, D + 1.5, L, 0, "m-carried");
    const hs = house(g, { x: cut + 2.5, y: 4.5, d: 7, w: 24, h: 10, rh: 6, wall: "m-white", roof: "m-roof" });
    hs.g.setAttribute("data-focus", "1");
    const a = P(cut / 2, L + 4, -10), b = P(cut + 6, L + 4, -10);
    text(g, a[0] - 10, a[1] + 24, "land 92.5%", "lbl", "middle", { style: `font-size:calc(22px * var(--u,1));fill:${C.sun}` });
    text(g, b[0] + 10, b[1] + 24, "house 7.5%", "lbl", "start", { style: `font-size:calc(22px * var(--u,1));fill:${C.magenta}` });
    fit(svg, 20);
    const tl = gsap.timeline({ paused: true });
    tl.fromTo(houseG, { y: -40, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: 0.9, ease: "power3.out", clearProps: "opacity,visibility" }, 0.3);
    return tl;
  }

  /* ---------- 14: one lot, then six to eight homes ---------- */
  function lot(host) {
    const svg = isoSvg(host, "dwg");
    footBloom(el("defs", {}, svg), "bloom-lot"); // the axonometric is measured in feet
    const g = el("g", {}, svg);
    const L = 33, D = 122, gapY = 70;
    const ground = (oy) => face(g, [[0, oy, 0], [D, oy, 0], [D, oy + L, 0], [0, oy + L, 0]], "g-yard", "");
    ground(0); ground(gapY);
    // before 2023 (RS zones): a house, a suite in it, a laneway home at the back
    const a = el("g", { filter: "url(#bloom-lot)", "data-focus": "1 3" }, g), b = el("g", { filter: "url(#bloom-lot)", "data-focus": "2" }, g);
    box(a, 4, 6, 0, 24, 27, 11, "m-teal");
    box(a, 3.5, 5.5, 11, 24.5, 27.5, 11.8, "m-green");
    house(a, { x: 52, y: 4.5, d: 42, w: 24, h: 18, rh: 11, porch: true, chimney: true, wall: "m-sun", roof: "m-cobalt", boards: true });
    face(a, onFace({ o: [52, 28.5, 0], u: [1, 0, 0], v: [0, 0, 1] }, 26, 1.4, 31, 3.4), "m-rose", "fy");
    tree(a, 40, 26, 3.6, 0);
    // since October 2023 (R1-1): a multiplex, new construction
    [[16, 52, "m-teal"], [68, 108, "m-rose"]].forEach(([xa, xb, m]) => {
      for (let st = 0; st < 3; st++) {
        box(b, xa, gapY + 2, st * 10.5, xb, gapY + L - 2, st * 10.5 + 10.5, m);
        const fy = { o: [xa, gapY + L - 2, 0], u: [1, 0, 0], v: [0, 0, 1] };
        for (let u = 3; u < xb - xa - 4; u += 8) face(b, onFace(fy, u, st * 10.5 + 3, u + 4.5, st * 10.5 + 8), "m-glass", "fy");
      }
      box(b, xa - 0.5, gapY + 1.5, 31.5, xb + 0.5, gapY + L - 1.5, 32.6, "m-green");
    });
    // the condition: the old house has to go (arrives with the fourth sentence)
    const down = el("g", { "data-focus": "3", "data-from": "3" }, g);
    const foot = [[51, 3.5, 0], [95, 3.5, 0], [95, 29.5, 0], [51, 29.5, 0]].map((p) => P(...p));
    el("path", { d: `M${foot.join("L")}Z`, fill: "none", stroke: C.red, "stroke-width": 2, "stroke-dasharray": "5 4", "vector-effect": "non-scaling-stroke" }, down);
    const [r0, r1, b0, b1] = [P(50.5, 16.5, 29), P(95.5, 16.5, 29), P(52, 28.5, 0), P(94, 28.5, 0)];
    el("path", { d: `M${r0}L${b1}M${r1}L${b0}`, stroke: C.red, "stroke-width": 2.4, "stroke-linecap": "round", "vector-effect": "non-scaling-stroke", filter: "url(#bloom-lot)" }, down);
    const top = P(73, 16.5, 31);
    text(down, top[0], top[1] - 4, "teardown first", "lbl", "middle", { style: `font-size:calc(17px * var(--u,1));fill:${C.red}` });
    // people: the CC0 silhouettes used across the board
    const who = (parent, name, x, y, flip) => {
      const p = P(x, y, 0), h = 6 * 0.86603, w = h * SIL[name];
      return el("image", { href: silImg(name + (flip ? "-r" : "")), x: p[0] - w / 2, y: p[1] - h, width: w, height: h }, parent);
    };
    const people = [who(a, "walker-1", 104, 22, 1), who(a, "walk-057", 30, 30, 0)];
    ["walk-054", "walker-2", "woman-jogging", "walk-058", "walker-4", "walk-055", "walker-5", "walk-056"].forEach((n, k) => people.push(who(b, n, 112 + (k % 4) * 3.2, gapY + 8 + Math.floor(k / 4) * 9, k % 2)));
    const t1 = P(D + 10, 16, 0), t2 = P(D + 10, gapY + 16, 0);
    const la = el("g", { "data-focus": "1 3" }, g), lb = el("g", { "data-focus": "2" }, g);
    text(la, t1[0] + 8, t1[1] - 2, "before 2023: up to 3 homes", "lbl", "start", { style: "font-size:calc(18px * var(--u,1))" });
    text(la, t1[0] + 8, t1[1] + 4, "a house, a suite, a laneway home · 0.7 FSR", "lbl-m", "start", { style: "font-size:calc(14px * var(--u,1))" });
    text(lb, t2[0] + 8, t2[1] - 2, "since 2023: six to eight homes", "lbl", "start", { style: `font-size:calc(18px * var(--u,1));fill:${C.sun}` });
    text(lb, t2[0] + 8, t2[1] + 4, "R1-1 multiplex, new construction · 1.0 FSR", "lbl-m", "start", { style: "font-size:calc(14px * var(--u,1))" });
    fit(svg, 20);
    const tl = gsap.timeline({ paused: true });
    tl.fromTo(b, { autoAlpha: 0, y: 20 }, { autoAlpha: 1, y: 0, duration: 0.9, ease: "power3.out", clearProps: "opacity,visibility" })
      .fromTo(people.slice(2), { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.3, stagger: 0.08, clearProps: "opacity,visibility" }, "-=0.3");
    return tl;
  }

  /* ---------- 16: labour hours ---------- */
  function labour(host) {
    const X = 250, K = 1.5;
    const s0 = chart(host, 1100, 400), s = el("g", { "data-focus": "1" }, s0), s2 = el("g", { "data-focus": "2" }, s0);
    text(s, 0, 74, "Demolition", "lbl", "start", { style: "font-size:22px" }); text(s, 0, 100, "estimated", "lbl-m", "start", { style: "font-size:16px" });
    const d1 = rect(s, X, 46, 48 * K, 56, { fill: C.ash, rx: 4 });
    tip(d1, "<b>48 h</b> estimated demolition labour");
    text(s, X + 48 * K + 14, 84, "48 h", "lbl", "start", { style: "font-size:26px" });
    text(s2, 0, 214, "Deconstruction", "lbl", "start", { style: "font-size:22px" }); text(s2, 0, 240, "recorded", "lbl-m", "start", { style: "font-size:16px" });
    const g = glowG(s2);
    const d2 = rect(g, X, 186, 447.5 * K - 3, 56, { fill: C.orange, rx: 4 });
    tip(d2, "<b>447.5 h</b> onsite, five working days, up to eight workers");
    const d3 = rect(g, X + 447.5 * K, 186, 96 * K, 56, { fill: C.sun, rx: 4 });
    tip(d3, "<b>96 h</b> offsite processing");
    text(s2, X, 286, "447.5 h onsite, five days", "lbl", "start", { style: `font-size:20px;fill:${C.orange}` });
    text(s2, X + 543.5 * K, 286, "+96 h offsite", "lbl", "end", { style: `font-size:20px;fill:${C.sun}` });
    for (let t = 0; t <= 500; t += 100) { line(s0, [], "lo").setAttribute("d", `M${X + t * K},30V320`); text(s0, X + t * K, 346, `${t} h`, "lbl-m", "middle", { style: "font-size:15px" }); }
    const tl = gsap.timeline({ paused: true });
    tl.from([d1, d2, d3], { attr: { width: 0 }, duration: 1.1, stagger: 0.35, ease: "power3.out" });
    return tl;
  }

  /* ---------- 18: where the work sits ---------- */
  function litMap(host) {
    const s = chart(host, 1200, 560);
    const node = (x, y, w, title, who, col, f) => {
      const g = el("g", { "data-focus": f }, s);
      rect(g, x, y, w, 92, { fill: BG2, stroke: col, "stroke-width": 1.5, rx: 6 });
      text(g, x + 18, y + 38, title, "lbl", "start", { style: `font-size:22px;font-weight:600;fill:${col}` });
      text(g, x + 18, y + 66, who, "lbl-m", "start", { style: "font-size:16px" });
      return g;
    };
    text(s, 0, 24, "what exists", "lbl-m", "start", { style: "font-size:16px" }); text(s, 1200, 24, "what gets built", "lbl-m", "end", { style: "font-size:16px" });
    line(s, [], "ln").setAttribute("d", "M0,40H1192M1180,33L1194,40L1180,47");
    const a = node(0, 70, 1200, "Layers and time", "Stewart Brand, American writer, 1994; CMHC, Canada's housing agency, 2025", C.lav, "-");
    const b = node(0, 190, 560, "Recovery practice", "Nicholas Lynch, urban geographer, 2022", C.sky, "1");
    const c = node(640, 190, 560, "Stock-led design", "Bill Addis, engineer; Mark Gorgolewski, architect", C.green, "3");
    const d = node(0, 310, 560, "Assessment", "Lambec, Bastien-Masse and Fivet, engineers, EPFL, 2025", C.sky, "2");
    const e = node(640, 310, 560, "Design for disassembly", "ISO 20887, 2020; Nielsen-Roine and Meyboom, UBC, 2025", C.green, "4");
    const me = el("g", { class: "glow", "data-focus": "5" }, s);
    rect(me, 330, 440, 540, 100, { fill: "none", stroke: C.magenta, "stroke-width": 3, rx: 8 });
    text(me, 600, 482, "This project", "lbl", "middle", { style: `font-size:26px;font-weight:600;fill:${C.magenta}` });
    text(me, 600, 514, "evidence from a real house, into design", "lbl", "middle", { style: `font-size:18px;fill:${C.rose}` });
    line(me, [], "ln br").setAttribute("d", "M280,402L380,440M920,402L820,440");
    sourceShelf(s, host, (window.SOURCES || {}).s13, { x: 0, y: 414, w: 1200, h: 142 }, C.sky);
    const tl = gsap.timeline({ paused: true });
    tl.fromTo([a, b, c, d, e], { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.4, stagger: 0.1, clearProps: "opacity,visibility" })
      .fromTo(me, { autoAlpha: 0, scale: 0.95, transformOrigin: "50% 50%" }, { autoAlpha: 1, scale: 1, duration: 0.7, clearProps: "opacity,visibility" });
    return tl;
  }

  /* ---------- the hub as a program diagram ----------
     Five program volumes in the order material moves through them, coloured
     by program and numbered on top; above, each action as a vector icon in a
     row, matched to its volume by number and colour. Along the street, the
     public rooms, with one place the classroom could go (first thoughts, not a layout). People are CC0
     silhouettes; the crew wear hard hats. Design space is 1600 x 744 px (the
     shape of the slide's drawing area); the axonometric is drawn in feet and scaled by K. */
  function hubProgram(host) {
    const s = chart(host, 1600, 744);
    const K = 5.2, OX = 540, OY = 322;
    const S = (x, y, z = 0) => { const p = P(x, y, z); return [OX + K * p[0], OY + K * p[1]]; };
    const defs = el("defs", {}, s);
    footBloom(defs, "bloom-hub"); // the axonometric is scaled up by K
    const iso = el("g", { transform: `translate(${OX},${OY}) scale(${K})` }, s);
    const ui = el("g", {}, s);
    const ground = (x0, y0, x1, y1, cls, parent = iso) => face(parent, [[x0, y0, 0], [x1, y0, 0], [x1, y1, 0], [x0, y1, 0]], cls, "");
    const lit = (focus) => el("g", { filter: "url(#bloom-hub)", "data-focus": focus }, iso);

    // ground: the yard, the public band, the pavement and the street
    ground(-46, -6, 168, 32, "g-lane");
    ground(-46, 32, 168, 42, "g-walk");
    ground(-46, 42, 168, 47, "g-lane");
    ground(-46, 47, 168, 56, "g-street");
    for (let x = -42; x < 166; x += 9) line(iso, [[x, 51.5, 0], [x + 4.5, 51.5, 0]], "wl");

    // the truck that brings whole components, then 1 gather: an open yard
    // a lorry backing in with wall panels on an A-frame: an open-licensed model (J-Toastie, CC BY 3.0)
    // rendered in the board camera by build/model_render.mjs, its footprint centred here
    const truck = lit("1");
    model(truck, "panels", -15, 25.6);
    const g1 = lit("1");
    box(g1, 0, 0, 0, 28, 28, 0.8, "m-sun");
    [[1.5, 1.5], [26.5, 1.5], [1.5, 26.5], [26.5, 26.5]].forEach(([x, y]) => box(g1, x - 0.5, y - 0.5, 0.8, x + 0.5, y + 0.5, 17, "m-sun"));
    box(g1, 1, 1, 17, 27, 2.4, 18.4, "m-sun");
    box(g1, 1, 25.6, 17, 27, 27, 18.4, "m-sun");
    box(g1, 4, 4, 0.8, 15, 5.2, 10, "m-house");
    box(g1, 4, 7.5, 0.8, 15, 8.7, 10, "m-house");
    box(g1, 18, 4, 0.8, 19, 10, 7.5, "m-white");
    face(g1, onFace({ o: [19, 4, 0], u: [0, 1, 0], v: [0, 0, 1] }, 0.8, 1.6, 5.2, 6.8), "m-glass", "fx");
    for (let i = 0; i < 5; i++) box(g1, 20, 12 + 2 * i, 0.8, 25, 14 + 2 * i, 0.8 + 1.4 * (5 - i), "m-salmon");
    for (let i = 0; i < 3; i++) box(g1, 3, 17 + 2.6 * i, 0.8, 17, 18.6 + 2.6 * i, 2.4, "m-slab");

    // 2 to 5: one volume each
    const VOL = [
      { k: 1, src: "gather", col: C.sun, name: "Gather", what: "whole components arrive", top: [14, 14, 18.4], g: g1 },
      { k: 2, src: "analyse", x0: 32, x1: 58, y0: 2, y1: 26, h: 22, mat: "m-sky", col: C.sky, name: "Analyse", what: "measure, test, regrade" },
      { k: 3, src: "unbuild", x0: 62, x1: 100, y0: 0, y1: 28, h: 32, mat: "m-hub", col: C.orange, name: "Unbuild", what: "take apart by hand" },
      { k: 4, src: "categorise", x0: 104, x1: 132, y0: 2, y1: 26, h: 26, mat: "m-teal", col: C.teal, name: "Categorise", what: "sort by lifespan and condition" },
      { k: 5, src: "offer", x0: 136, x1: 160, y0: 3, y1: 26, h: 10, mat: "m-rose", col: C.rose, name: "Offer", what: "an open platform for the next project" },
    ];
    VOL.slice(1).forEach((v) => {
      v.g = lit(String(v.k));
      box(v.g, v.x0, v.y0, 0, v.x1, v.y1, v.h, v.mat);
      v.top = [(v.x0 + v.x1) / 2, (v.y0 + v.y1) / 2, v.h];
      tip(v.g, `<b>${v.k} ${v.name}</b>: ${v.what}`);
    });
    tip(g1, "<b>1 Gather</b>: whole components arrive from houses: panels, windows, stairs, beams");

    // the material route, from houses to the next project
    const mat = lit("1 2 3 4 5");
    line(mat, [[-46, 30, 0.2], [166, 30, 0.2]], "route");
    for (let x = -4; x < 166; x += 26) line(mat, [[x - 1.6, 28.6, 0.2], [x + 0.6, 30, 0.2], [x - 1.6, 31.4, 0.2]], "route");

    // the classroom's columns stand behind the shop fronts, so they are drawn before the street band
    const cols = lit("7");
    [43.75, 59.25, 69, 79.25, 95.75, 114.25].forEach((x) => box(cols, x - 0.35, 36.8, 0, x + 0.35, 37.5, 11, "m-lav"));

    // the street band: one block per programme, each its own colour, then the public route
    const pub = lit("6");
    const COMMUNITY = [
      { x0: 29, x1: 43, h: 9.5, mat: "m-butter", name: "café" },
      { x0: 44.5, x1: 58.5, h: 10.2, mat: "m-green", name: "grocery" },
      { x0: 96.5, x1: 113.5, h: 10.6, mat: "m-purple", name: "culture" },
      { x0: 115, x1: 132.5, h: 9.8, mat: "m-white", name: "exhibition" },
    ];
    // plaza: open ground with halftone dots and a tree
    ground(60, 31.5, 78.5, 42, "g-plaza", pub).style.fill = "#163A2C";
    window.ISO.dots(pub, 60, 31.5, 78.5, 42, 2.2, 0.38).querySelectorAll("ellipse").forEach((d) => { d.style.fill = C.green; d.style.opacity = 0.55; });
    // sports: an open court with its lines, running on under the culture room, which is drawn over it
    const court = el("g", {}, pub);
    face(court, [[80, 31.5, 0.05], [102, 31.5, 0.05], [102, 42, 0.05], [80, 42, 0.05]], "m-cobalt", "fz");
    line(court, [[80.8, 32.3, 0.1], [101.2, 32.3, 0.1], [101.2, 41.2, 0.1], [80.8, 41.2, 0.1], [80.8, 32.3, 0.1]], "wl");
    line(court, [[91, 32.3, 0.1], [91, 41.2, 0.1]], "wl");
    tip(court, "<b>Sports</b>: an open court");
    COMMUNITY.forEach((b) => { b.g = el("g", {}, pub); box(b.g, b.x0, 31.5, 0, b.x1, 42, b.h, b.mat); tip(b.g, `<b>${b.name[0].toUpperCase() + b.name.slice(1)}</b>: a public programme of the hub`); });
    tree(pub, 63, 34, 2.4, 0);
    line(pub, [[-46, 44.5, 0.2], [168, 44.5, 0.2]], "route-b");

    // 7 the classroom: a glazed gallery on level 2, on slim columns over the street-front rooms, its
    // back to the work so students and trades can watch the unbuilding across analyse, unbuild and categorise
    const gallery = lit("7");
    const GX0 = 32, GX1 = 132, GY0 = 29, GY1 = 37.6, GZ0 = 11, GZ1 = 19, PZ = GZ0 + 4.2;
    box(gallery, GX0, GY0, GZ0, GX1, GY1, GZ0 + 0.8, "m-lav");
    box(gallery, GX0, GY0, GZ1 - 0.8, GX1, GY1, GZ1, "m-lav");
    face(gallery, [[GX1, GY0, GZ0 + 0.8], [GX1, GY1, GZ0 + 0.8], [GX1, GY1, GZ1 - 0.8], [GX1, GY0, GZ1 - 0.8]], "m-lav", "fx");
    face(gallery, [[GX0, GY1, GZ0 + 0.8], [GX1, GY1, GZ0 + 0.8], [GX1, GY1, PZ], [GX0, GY1, PZ]], "m-lav", "fy");
    face(gallery, [[GX0, GY1, PZ], [GX1, GY1, PZ], [GX1, GY1, GZ1 - 0.8], [GX0, GY1, GZ1 - 0.8]], "m-glass", "fy").setAttribute("fill-opacity", "0.3");
    for (let x = GX0 + 8; x < GX1; x += 8) line(gallery, [[x, GY1, PZ], [x, GY1, GZ1 - 0.8]], "wl");
    tip(gallery, "<b>Classroom</b>: one place it could go, looking into analyse, unbuild and categorise; first thoughts, not a layout");

    // the offer volume opens onto the street under a canopy, with parts on show
    const g5 = lit("5");
    [[137, 39], [165, 39]].forEach(([x, y]) => box(g5, x - 0.4, y - 0.4, 0, x + 0.4, y + 0.4, 12, "m-rose"));
    box(g5, 142, 33, 0, 145, 34.2, 7, "m-cobalt");
    box(g5, 149, 33, 0, 151, 38, 5.2, "m-white");
    face(g5, onFace({ o: [151, 33, 0], u: [0, 1, 0], v: [0, 0, 1] }, 0.7, 0.9, 4.3, 4.5), "m-glass", "fx");
    for (let i = 0; i < 3; i++) box(g5, 155, 32 + 2 * i, 0, 160, 34 + 2 * i, 1.2 * (3 - i), "m-salmon");
    box(g5, 136, 26, 12, 166, 40, 13, "m-rose");

    // names painted on each block's street face, sheared to the facade and sized to fit it
    COMMUNITY.forEach((b) => {
      const p = S(b.x0 + 0.9, 42, Math.min(3, b.h * 0.3)), room = (b.x1 - b.x0 - 1.8) * K * 0.7906;
      const t = text(ui, 0, 0, b.name, "lbl", "start", { "data-focus": "6", transform: `matrix(0.894,0.447,0,1,${p[0].toFixed(1)},${p[1].toFixed(1)})`, style: "font-size:15px;font-weight:600;fill:#211C4A" });
      const w = t.getComputedTextLength();
      if (w > room) t.style.fontSize = (15 * room / w).toFixed(1) + "px";
    });
    // ground labels: along x, lying flat (the floor's two axes), so they read as painted on the plaza and court
    const floorText = (x, y, str, col) => {
      const p = S(x, y, 0.1);
      text(ui, 0, 0, str, "lbl", "start", { "data-focus": "6", transform: `matrix(0.894,0.447,-0.894,0.447,${p[0].toFixed(1)},${p[1].toFixed(1)})`, style: `font-size:13px;font-weight:600;fill:${col}` });
    };
    floorText(61.2, 40.9, "plaza", "#BFE8B4");
    floorText(81, 40.6, "sports", "#FFFFFF");
    // the classroom's name, on the parapet over the plaza, where nothing stands in front of it
    const gl = S(58.5, GY1, GZ0 + 1.6);
    text(ui, 0, 0, "classroom", "lbl", "start", { "data-focus": "7", transform: `matrix(0.894,0.447,0,1,${gl[0].toFixed(1)},${gl[1].toFixed(1)})`, style: "font-size:13px;font-weight:600;fill:#211C4A" });
    const fromP = S(-46, 30, 0), toP = S(166, 30, 0), rp = S(168, 44.5, 0);
    const mlab = el("g", { "data-focus": "1 2 3 4 5" }, ui);
    text(mlab, fromP[0] - 8, fromP[1] + 5, "from houses", "lbl", "end", { style: `font-size:15px;fill:${C.magenta}` });
    text(mlab, toP[0] + 12, toP[1] + 6, "to the next project", "lbl", "start", { style: `font-size:15px;fill:${C.magenta}` });
    text(ui, rp[0] + 12, rp[1] + 6, "public route", "lbl", "start", { "data-focus": "6", style: `font-size:15px;fill:${C.sky}` });
    // what this drawing is: a first take on the programme and its range, not a layout
    text(ui, 1180, 318, "first thoughts on the programme", "lbl", "start", { style: `font-size:19px;font-weight:600;fill:${C.sky}` });
    text(ui, 1180, 344, "what a hub could hold, and how it might range;", "lbl-m", "start", { style: "font-size:15px" });
    text(ui, 1180, 366, "not a layout", "lbl-m", "start", { style: "font-size:15px" });

    // the moments: one vector icon per action, in a row in the order material moves, each tied to its
    // volume by number and colour (a badge on the volume) rather than by a leader across the drawing
    const R = 64, ROW = 128, RING = [0, 1, 2, 3, 4].map((i) => [300 + i * 250, ROW]), cards = [];
    const NUDGE = { gather: [10, 0], analyse: [6, 3], unbuild: [-2, 10], categorise: [0, 0], offer: [0, 1] };
    const ICONS = {
      gather: [
        ["M-50,14H16V22H-50Z", "m"], ["M16,22V-6H32L46,8V22Z", "m"], ["M20,-2H30L40,8H20Z", "w"],
        ["M-46,14V-30H-22V14Z", "p"], ["M-40,-22H-28V-8H-40ZM-34,-22V-8M-40,-15H-28", "w"],
        ["M-16,14V6H-8V-2H0V-10H8V14Z", "p"], ["M-64,-12H-56M-66,-2H-56M-64,8H-58", "t"],
        ["c-36,26,7", "d"], ["c-10,26,7", "d"], ["c32,26,7", "d"],
      ],
      analyse: [
        ["M-48,8H34V28H-48Z", "p"], ["M-42,15C-30,12 -18,19 -6,15S14,12 26,16M-42,22C-26,20 -12,25 6,21S20,20 28,23", "t"],
        ["M-56,-24H-38L-32,-18L-38,-12H-56Z", "m"], ["M-38,-18Q-28,-6 -40,8", "t"], ["c-50,-18,1.8", "w"],
        ["M27,1L43,17", "h"], ["c12,-14,20", "m"], ["M2,-14L9,-7L22,-21", "k"],
      ],
      unbuild: [
        ["M-46,-34h6v66h-6ZM-24,-34h6v66h-6ZM-2,-34h6v66h-6Z", "p"], ["M-50,-34H14M-50,32H14", "w"],
        ["M26,-36h7v68h-7Z", "m", "rotate(18 30 0)"], ["M8,-10L18,-17M16,-21L21,-13", "w"],
        ["M4,-48Q26,-56 38,-42", "m"], ["M38,-42l-8,-1M38,-42l-1,-8", "m"],
      ],
      categorise: [
        ["M-48,-40V40M48,-40V40", "w"], ["M-48,-18H48M-48,8H48M-48,34H48", "w"],
        ["M-42,-28H42V-20H-42Z", "s1"], ["M-42,-2H4V6H-42ZM10,-2H40V6H10Z", "s2"],
        ["M-42,24H-20V32H-42ZM-15,24H6V32H-15ZM11,24H30V32H11Z", "s3"],
      ],
      offer: [
        ["M-50,-42H50L46,-26H-46Z", "m"], ["M-28,-42L-29,-26M-8,-42V-26M12,-42V-26M32,-42L33,-26", "t"],
        ["M-46,-26Q-37,-16 -28,-26Q-19,-16 -10,-26Q-1,-16 8,-26Q17,-16 26,-26Q35,-16 46,-26", "m"],
        ["M-46,-26V40M46,-26V40M-40,26H40M-34,26V40M34,26V40", "w"],
        ["M-32,-8H-12V26H-32Z", "m"], ["c-16,10,1.8", "w"], ["M-2,-4H26V20H-2ZM12,-4V20M-2,8H26", "p"],
        ["M26,-4L34,-12H42V-4L34,4Z", "m"], ["c38,-8,1.6", "d"],
      ],
    };
    const draw = (g, list, col) => list.forEach(([d, kind, tf]) => {
      const st = {
        m: { fill: col, "fill-opacity": 0.22, stroke: col, "stroke-width": 3 },
        p: { fill: TXT, "fill-opacity": 0.08, stroke: TXT, "stroke-width": 1.8 },
        w: { fill: "none", stroke: TXT, "stroke-width": 1.8 },
        t: { fill: "none", stroke: TXT, "stroke-width": 1.2, opacity: 0.7 },
        k: { fill: "none", stroke: TXT, "stroke-width": 3 },
        h: { fill: "none", stroke: col, "stroke-width": 7 },
        d: { fill: "#0B0E14", stroke: col, "stroke-width": 2.6 },
        s1: { fill: col, stroke: col, "stroke-width": 1.5 },
        s2: { fill: col, "fill-opacity": 0.65, stroke: col, "stroke-width": 1.5 },
        s3: { fill: col, "fill-opacity": 0.35, stroke: col, "stroke-width": 1.5 },
      }[kind];
      const a = Object.assign({ "stroke-linecap": "round", "stroke-linejoin": "round", transform: tf }, st);
      if (d[0] === "c") { const [cx, cy, r] = d.slice(1).split(",").map(Number); el("circle", Object.assign({ cx, cy, r }, a), g); }
      else el("path", Object.assign({ d }, a), g);
    });
    VOL.forEach((v, i) => {
      const [cx, cy] = RING[i], g = el("g", { "data-focus": String(v.k) }, ui);
      // the badge: the step's number on top of its volume
      const top = S(...v.top), badge = el("g", { class: "glow" }, g);
      el("circle", { cx: top[0], cy: top[1], r: 12, fill: v.col }, badge);
      text(badge, top[0], top[1] + 5.5, String(v.k), "lbl", "middle", { style: "font-size:15px;font-weight:700;fill:#0B0E14" });
      const card = el("g", {}, g);
      el("circle", { cx, cy, r: R, fill: "#121722" }, card);
      el("circle", { cx, cy, r: R, fill: v.col, opacity: 0.08 }, card);
      el("circle", { cx, cy, r: R, fill: "none", stroke: v.col, "stroke-width": 2, class: "glow" }, card);
      const [nx, ny] = NUDGE[v.src];
      draw(el("g", { class: "glow", transform: `translate(${cx + nx * 0.92},${cy + ny * 0.92}) scale(0.92)` }, card), ICONS[v.src], v.col);
      text(g, cx - R, cy - R - 30, `${v.k} ${v.name}`, "lbl", "start", { style: `font-size:22px;font-weight:600;fill:${v.col}` });
      text(g, cx - R, cy - R - 11, v.what, "lbl-m", "start", { style: "font-size:13.5px" });
      tip(card, `<b>${v.k} ${v.name}</b>: ${v.what}`);
      cards.push(g);
    });

    // people: CC0 silhouettes on the pavement, the plaza and under the canopy
    const crowd = [];
    const who = (name, x, y, flip, focus = "6", ht = 6.6, z = 0) => {
      const file = name + (flip ? "-r" : ""), p = S(x, y, z), h = ht * K * 0.86603, w = h * (SIL[file] || SIL[name]);
      crowd.push(el("image", { href: silImg(file), x: p[0] - w / 2, y: p[1] - h, width: w, height: h, "data-focus": focus }, ui));
    };
    who("walk-055", -30, 44, 0); who("walker-2", -14, 45.5, 1); who("walk-057", 8, 44, 0);
    who("cyclist-2", 30, 50, 0); who("walk-054", 75, 34.5, 0);
    who("walker-1", 74.5, 38.5, 1); who("woman-jogging", 136, 44.5, 0);
    who("walker-4", 146, 37.5, 0, "5 6"); who("walker-3", 153, 38.5, 1, "5 6"); who("walk-056", 166, 44, 0);
    // the crew, in hard hats: one waves the lorry in, two work the yard (Quaternius worker, CC0, rendered in the board camera)
    who("worker-signal", 3, 31.5, 0, "1", 6.2); who("worker-tool", 8, 18, 0, "1", 6.2, 0.8); who("worker-walking", 6, 24, 1, "1", 6.2, 0.8);

    const tl = gsap.timeline({ paused: true });
    const vols = [g1, ...VOL.slice(1).map((v) => v.g), g5];
    tl.fromTo(vols, { autoAlpha: 0, y: 4 }, { autoAlpha: 1, y: 0, duration: 0.7, stagger: 0.12, ease: "power3.out", clearProps: "opacity,visibility" })
      .fromTo([truck, mat, pub], { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.5, stagger: 0.1, clearProps: "opacity,visibility" }, "-=0.4")
      .fromTo(cards, { autoAlpha: 0, y: -14 }, { autoAlpha: 1, y: 0, duration: 0.6, stagger: 0.14, ease: "power2.out", clearProps: "opacity,visibility" }, "-=0.3")
      .fromTo(crowd, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.3, stagger: 0.05, clearProps: "opacity,visibility" }, "-=0.4");
    return tl;
  }

  /* ---------- 23: what it brings to the city ----------
     A corner of a rebuilt multiplex in Vancouver's climate: salvaged timber
     on a raised base, a ventilated rain-screen, a deep eave on stepped
     brackets, and one panel swapped out instead of the building. Lit with
     the script: 1 time, 2 climate, 3 material. Design intentions, not results. */
  function value(host) {
    const s = isoSvg(host, "dwg");
    footBloom(el("defs", {}, s), "bloom-value");
    const lit = (focus) => el("g", { filter: "url(#bloom-value)", "data-focus": focus }, s);
    face(s, [[-8, -8, 0], [36, -8, 0], [36, 26, 0], [-8, 26, 0]], "g-yard", "");
    // rain falls on the roof and drips clear of the wall (climate)
    const rain = el("g", { "data-focus": "2" }, s);
    for (let i = 0; i < 9; i++) { const x = 2 + i * 3.4, y = -1 + (i % 3) * 7; line(rain, [[x, y, 33], [x, y, 23.5]], "route-b"); }
    for (let y = 1; y < 22; y += 4) line(rain, [[31.6, y, 19.6], [31.6, y, 0.3]], "route-b");
    // the raised base keeps timber out of the splash zone (climate)
    const base = lit("2");
    box(base, 0, 0, 0, 24, 16, 2.2, "m-ash");
    // the salvaged frame (material)
    const frame = lit("3");
    const posts = [];
    for (const x of [0.6, 8, 16, 23.4]) for (const y of [0.6, 15.4]) posts.push([x, y]);
    posts.sort((a, b) => a[0] + a[1] - b[0] - b[1]).forEach(([x, y]) => box(frame, x - 0.45, y - 0.45, 2.2, x + 0.45, y + 0.45, 19.8, "m-slab"));
    for (const z of [10.2, 18.9]) {
      box(frame, 0, 0, z, 24, 0.9, z + 0.9, "m-slab");
      box(frame, 0, 15.1, z, 24, 16, z + 0.9, "m-slab");
      box(frame, 23.1, 0, z, 24, 16, z + 0.9, "m-slab");
    }
    // the wall, layer by layer on the street face: membrane, battens, rain-screen (climate)
    const wall = lit("2");
    face(wall, [[24.05, 0, 2.2], [24.05, 13, 2.2], [24.05, 13, 19.8], [24.05, 0, 19.8]], "m-sky", "fx");
    for (const y of [0.4, 3.4, 6.4, 9.4, 12.4]) box(wall, 24.05, y, 2.2, 24.5, y + 0.6, 19.8, "m-slab");
    for (let b = 0; b < 4; b++) if (b !== 2) box(wall, 24.5, b * 2.6, 2.2, 25, b * 2.6 + 2.5, 19.8, "m-teal");
    // one panel swapped, not the building (time)
    const swap = lit("1");
    line(swap, [[25, 5.2, 2.2], [25, 7.7, 2.2], [25, 7.7, 19.8], [25, 5.2, 19.8], [25, 5.2, 2.2]], "hid");
    box(swap, 35, 5.2, 1.5, 35.5, 7.7, 19.1, "m-teal");
    line(swap, [[34.4, 6.4, 10], [25.6, 6.4, 10]], "route");
    line(swap, [[26.6, 5.6, 10.5], [25.6, 6.4, 10], [26.6, 7.2, 9.5]], "route");
    // the deep eave on stepped brackets: sheds rain, shades the summer sun (climate)
    const roof = lit("2");
    for (const y of [0.6, 15.4]) {
      box(roof, 24, y - 0.5, 17.4, 27.2, y + 0.5, 18.7, "m-slab");
      box(roof, 24, y - 0.5, 18.7, 30, y + 0.5, 20, "m-slab");
    }
    box(roof, -1.5, -1.5, 20, 31.5, 22, 21.4, "m-cobalt");
    // size the drawing first, leaving room for its labels, then label it
    fit(s, 10, { left: 0.75, right: 0.8, top: 0.04 });
    const lab = (focus, at, t, col, dx = 1.6, anchor = "start") => {
      const g = el("g", { "data-focus": focus }, s), p = P(...at);
      text(g, p[0] + dx, p[1], t, "lbl", anchor, { style: `font-size:calc(17px * var(--u,1));fill:${col}` });
      line(g, [at, at], "lo");
    };
    lab("2", [31.5, -1.5, 21.4], "deep eave: sheds rain, shades summer sun", C.sky);
    lab("1", [35.5, 7.7, 13], "swap a panel, not the building", C.sun);
    lab("2", [25, 1, 3.5], "ventilated rain-screen dries the wall", C.sky);
    lab("3", [0, 16, 15], "salvaged timber, kept dry, its record kept", C.orange, -1.6, "end");
    lab("2", [0, 16, 1], "raised base keeps timber off the splash zone", C.sky, -1.6, "end");
    const tl = gsap.timeline({ paused: true });
    tl.fromTo([base, frame, wall, roof, swap], { autoAlpha: 0, y: 3 }, { autoAlpha: 1, y: 0, duration: 0.6, stagger: 0.14, ease: "power3.out", clearProps: "opacity,visibility" });
    return tl;
  }

  /* ---------- where hubs go, built one rule at a time ----------
     From build/hub_siting.py: 1 houses coming down, 2 multiplexes going up,
     3 land a workshop could use near a truck route, 4 six sites chosen by
     greedy coverage of both within 1.5 km, 5 why six (a capacity estimate).
     The slide is data-build, so each layer stays once it arrives. */
  const SITE_NAMES = {
    1: ["Kaslo St at Venables St", -1], 2: ["Victoria Dr at E 48th Ave", -1], 3: ["West Blvd at W 39th Ave", 1],
    4: ["Dunbar St at W 17th Ave", -1], 5: ["Main St at E 29th Ave", -1], 6: ["Victoria Dr at the Diversion", -1],
  };
  function siting(host) {
    const M = window.MAP, S = window.SITING, slide = host.closest(".slide");
    host.replaceChildren();
    const s = el("svg", { class: "dwg", viewBox: "-160 -6 1430 752", preserveAspectRatio: "xMidYMid meet" }, host);
    const all = "1 2 3 4 5";
    const base = el("g", { "data-focus": "0 " + all }, s);
    M.areas.forEach((a) => el("path", { d: a.d, fill: BG2, stroke: DIM, "stroke-width": 1, "vector-effect": "non-scaling-stroke" }, base));
    const km = M.kmUnits, sx = -120, sy = 728;
    rect(base, sx, sy, km, 6, { fill: "none", stroke: TXT, "stroke-width": 1, "vector-effect": "non-scaling-stroke" }); rect(base, sx + km, sy, km, 6, { fill: TXT });
    text(base, sx, sy - 8, "0", "lbl-m", "middle"); text(base, sx + 2 * km, sy - 8, "2 km", "lbl-m", "middle");
    el("path", { d: "M-120,628l9,32l-9,-8l-9,8Z", fill: TXT }, base); text(base, -120, 680, "N", "lbl", "middle");

    // 3 land, drawn first so the dots sit on top of it
    const land = el("g", { "data-focus": "3 4 5" }, s);
    el("path", { d: S.trucks, fill: "none", stroke: C.sky, "stroke-width": 1, opacity: 0.35, "vector-effect": "non-scaling-stroke" }, land);
    el("path", { d: S.land.commercial, fill: C.teal, "fill-opacity": 0.42, stroke: "none" }, land);
    el("path", { d: S.land.industrial, fill: C.teal, "fill-opacity": 0.24, stroke: C.teal, "stroke-width": 0.8, "stroke-opacity": 0.5, "vector-effect": "non-scaling-stroke" }, land);
    // 1 houses coming down
    const hs = el("g", { "data-focus": all, class: "glow" }, s);
    for (let i = 0; i < S.houses.length; i += 2) el("circle", { cx: S.houses[i], cy: S.houses[i + 1], r: 1.6, fill: C.sun, "fill-opacity": 0.6 }, hs);
    // 2 multiplexes going up
    const mx = el("g", { "data-focus": "2 3 4 5", class: "glow" }, s);
    for (let i = 0; i < S.multiplexes.length; i += 2) el("circle", { cx: S.multiplexes[i], cy: S.multiplexes[i + 1], r: 3.4, fill: C.magenta, stroke: "#0B0E14", "stroke-width": 0.8 }, mx);

    // 4 the six sites, each with its name and reach beside it
    const r = km * S.radiusKm, rings = [], ringG = el("g", { "data-focus": "4 5" }, s), names = el("g", { "data-focus": "4 5" }, s);
    S.hubs.forEach((h) => {
      const c = el("circle", { cx: h.x, cy: h.y, r, fill: "rgba(255,154,61,.07)", stroke: C.orange, "stroke-width": 2.2, "stroke-dasharray": "8 6", class: "glow" }, ringG);
      rings.push(c);
      el("circle", { cx: h.x, cy: h.y, r: 12, fill: C.orange, class: "glow" }, ringG);
      text(ringG, h.x, h.y + 5, String(h.order), "lbl", "middle", { style: "font-size:15px;font-weight:700;fill:#0B0E14" });
      tip(c, `<b>${h.order}. ${SITE_NAMES[h.order][0]}</b>, ${h.area}<br>zone ${h.zone}, ${h.truckM} m from a truck route<br>within 1.5 km: ${fmt(h.houses)} house demolitions, ${h.multiplexes} multiplexes, about ${fmt(Math.round(h.households / 100) * 100)} households<br>nearest community centre: ${h.nearestCentre[0]}, ${h.nearestCentre[1]} km`);
      // labels sit beside the ring where it has room: right of the eastern sites, above or below the others
      const place = { 1: [r + 16, -6, "start"], 6: [r + 16, -6, "start"], 2: [r + 16, -6, "start"], 5: [0, -r - 34, "middle"], 3: [0, r + 30, "middle"], 4: [0, -r - 34, "middle"] }[h.order];
      const [dx, dy, anchor] = place;
      text(names, h.x + dx, h.y + dy, SITE_NAMES[h.order][0], "lbl", anchor, { style: "font-size:19px;font-weight:600", class: "lbl halo" });
      text(names, h.x + dx, h.y + dy + 21, `${h.area}, ${fmt(Math.round(h.households / 100) * 100)} households`, "lbl", anchor, { style: `font-size:15px;fill:${C.lav}`, class: "lbl halo" });
    });

    // the key, each line arriving with its layer
    const key = (focus, y, draw, label) => {
      const g = el("g", { "data-focus": focus }, s);
      draw(g, 1010, y);
      text(g, 1034, y + 5, label, "lbl", "start", { style: "font-size:16px" });
    };
    key(all, 600, (g, x, y) => el("circle", { cx: x + 8, cy: y, r: 4, fill: C.sun }, g), "houses coming down, 2017–2026");
    key("2 3 4 5", 628, (g, x, y) => el("circle", { cx: x + 8, cy: y, r: 5, fill: C.magenta }, g), "multiplexes going up, since 2024");
    key("3 4 5", 656, (g, x, y) => { rect(g, x, y - 7, 16, 14, { fill: C.teal, "fill-opacity": 0.8 }); }, "land for a workshop, by a truck route");
    key("4 5", 684, (g, x, y) => el("circle", { cx: x + 8, cy: y, r: 8, fill: "none", stroke: C.orange, "stroke-width": 2, "stroke-dasharray": "4 3" }, g), "hub site; ring: a 20-minute walk");

    // why six (the capacity estimate) is on print 4, not on the slide
    // the land steps back once the sites are on it, so the rings and their names lead
    slide.addEventListener("step", (e) => {
      gsap.to(land, { opacity: e.detail >= 4 ? 0.45 : 1, duration: 0.5 });
      if (e.detail === 4) gsap.fromTo(rings, { attr: { r: 0 } }, { attr: { r }, duration: 0.9, stagger: 0.12, ease: "power3.out" });
    });
    return gsap.timeline({ paused: true });
  }

  /* ---------- what kind of building: half workshop, half community centre ----------
     An existing low building, reused, for the slow work (grey, the work inside
     in dashed hidden lines in slide 25's colours), with a new civic front of
     salvaged parts along the street. Lit: 1 the two defaults it is not, 2 the
     reused shed, 3 the civic front, 4 how many such buildings stand near each
     candidate site (assets/data/stock.js, from build/hub_stock.py). In feet. */
  function hubType(host) {
    const s = chart(host, 1600, 744);
    const K = 4.2, OX = 490, OY = 180;
    const S = (x, y, z = 0) => { const p = P(x, y, z); return [OX + K * p[0], OY + K * p[1]]; };
    footBloom(el("defs", {}, s), "bloom-type");
    const iso = el("g", { transform: `translate(${OX},${OY}) scale(${K})` }, s);
    const ui = el("g", {}, s);
    const ground = (x0, y0, x1, y1, cls, parent = iso) => face(parent, [[x0, y0, 0], [x1, y0, 0], [x1, y1, 0], [x0, y1, 0]], cls, "");
    const lit = (focus, parent = iso) => el("g", { filter: "url(#bloom-type)", "data-focus": focus }, parent);

    // ground: the lot, the side yard by the roller door, the pavement, the street
    ground(0, -6, 140, 80, "g-lane");
    ground(140, -6, 180, 110, "g-lane");
    line(iso, [[140, -6, 0], [180, -6, 0], [180, 110, 0]], "hid");
    ground(0, 110, 180, 122, "g-walk");
    ground(0, 122, 180, 146, "g-street");
    for (let x = 3; x < 178; x += 14) line(iso, [[x, 134, 0], [x + 7, 134, 0]], "wl");

    // 2 the building already there: a flat-roofed store or warehouse, as most near the sites are,
    // with a parapet, a roller door on its end and ribbed cladding
    const shed = el("g", { "data-focus": "2 4" }, iso);
    box(shed, 0, 0, 0, 140, 80, 20, "m-ash");
    for (let y = 4; y < 80; y += 4) line(shed, [[140, y, 0.4], [140, y, 19.6]], "hid");
    face(shed, onFace({ o: [140, 0, 0], u: [0, 1, 0], v: [0, 0, 1] }, 22, 0, 46, 14), "m-navy", "fx");
    [[0, 0, 140, 1.2], [0, 78.8, 140, 80], [0, 0, 1.2, 80], [138.8, 0, 140, 80]].forEach(([x0, y0, x1, y1]) => box(shed, x0, y0, 20, x1, y1, 21.5, "m-ash"));
    // the way in from the street, between the grocery and the culture room
    face(shed, onFace({ o: [0, 80, 0], u: [1, 0, 0], v: [0, 0, 1] }, 56, 0, 70, 13), "m-navy", "fy");
    // the slow work inside, as hidden lines in slide 25's colours: test, take apart, sort
    const work = lit("2");
    [[8, 40, 10, C.sky], [46, 92, 14, C.orange], [98, 134, 11, C.teal]].forEach(([x0, x1, h, col]) => {
      const y0 = 6, y1 = 72, z1 = h;
      const hex = [[x0, y0, z1], [x1, y0, z1], [x1, y0, 0], [x1, y1, 0], [x0, y1, 0], [x0, y1, z1], [x0, y0, z1]];
      const ink = { fill: "none", stroke: col, "stroke-width": 1.6, "stroke-dasharray": "6 4", "vector-effect": "non-scaling-stroke" };
      el("path", Object.assign({ d: "M" + hex.map((p) => P(...p).join(",")).join("L") }, ink), work);
      el("path", Object.assign({ d: `M${P(x1, y1, z1)}L${P(x1, y0, z1)}M${P(x1, y1, z1)}L${P(x0, y1, z1)}M${P(x1, y1, z1)}L${P(x1, y1, 0)}` }, ink), work);
    });

    // the lorry backing up to the roller door with wall panels, and the crew in the yard
    const yard = lit("2");
    model(yard, "panelsR", 160, 34);

    // 3 the civic front: one room per programme, clad in salvaged boards, and the classroom over them
    const front = lit("3");
    const ROOMS = [
      { x0: 4, x1: 28, h: 15, mat: "m-butter", name: "café" },
      { x0: 30, x1: 54, h: 16, mat: "m-green", name: "grocery" },
      { x0: 72, x1: 96, h: 16.5, mat: "m-purple", name: "culture" },
      { x0: 98, x1: 120, h: 15.5, mat: "m-white", name: "exhibition" },
      { x0: 122, x1: 140, h: 14, mat: "m-rose", name: "offer" },
    ];
    [8, 42, 63, 84, 110].forEach((x) => box(front, x - 0.6, 94.4, 0, x + 0.6, 95.6, 17, "m-lav"));
    tree(front, 62, 100, 5.5, 0);
    ROOMS.forEach((r) => {
      box(front, r.x0, 80, 0, r.x1, 110, r.h, r.mat);
      for (let x = r.x0 + 2.4; x < r.x1 - 1; x += 2.4) line(front, [[x, 110, 0.4], [x, 110, r.h - 0.4]], "hid");
    });
    const GX0 = 6, GX1 = 118, GY0 = 84, GY1 = 104, GZ0 = 17, GZ1 = 28, PZ = GZ0 + 4;
    box(front, GX0, GY0, GZ0, GX1, GY1, GZ0 + 1.2, "m-lav");
    box(front, GX0, GY0, GZ1 - 1.2, GX1, GY1, GZ1, "m-lav");
    face(front, [[GX1, GY0, GZ0 + 1.2], [GX1, GY1, GZ0 + 1.2], [GX1, GY1, GZ1 - 1.2], [GX1, GY0, GZ1 - 1.2]], "m-lav", "fx");
    face(front, [[GX0, GY1, GZ0 + 1.2], [GX1, GY1, GZ0 + 1.2], [GX1, GY1, PZ], [GX0, GY1, PZ]], "m-lav", "fy");
    face(front, [[GX0, GY1, PZ], [GX1, GY1, PZ], [GX1, GY1, GZ1 - 1.2], [GX0, GY1, GZ1 - 1.2]], "m-glass", "fy").setAttribute("fill-opacity", "0.3");
    for (let x = GX0 + 10; x < GX1; x += 10) line(front, [[x, GY1, PZ], [x, GY1, GZ1 - 1.2]], "wl");
    ROOMS.forEach((r) => {
      const p = S(r.x0 + 2.2, 110, Math.min(4.5, r.h * 0.3)), room = (r.x1 - r.x0 - 4.4) * K * 0.7906;
      const t = text(ui, 0, 0, r.name, "lbl", "start", { "data-focus": "3", transform: `matrix(0.894,0.447,0,1,${p[0].toFixed(1)},${p[1].toFixed(1)})`, style: "font-size:14px;font-weight:600;fill:#211C4A" });
      const w = t.getComputedTextLength();
      if (w > room) t.style.fontSize = (14 * room / w).toFixed(1) + "px";
    });
    const gl = S(GX0 + 3, GY1, GZ0 + 1.9);
    text(ui, 0, 0, "classroom", "lbl", "start", { "data-focus": "3", transform: `matrix(0.894,0.447,0,1,${gl[0].toFixed(1)},${gl[1].toFixed(1)})`, style: "font-size:12px;font-weight:600;fill:#211C4A" });

    // people: the crew in hard hats in the yard, neighbours along the street
    const who = (name, x, y, flip, focus, ht = 6.2) => {
      const file = name + (flip ? "-r" : ""), p = S(x, y), h = ht * K * 0.86603, w = h * (SIL[file] || SIL[name]);
      el("image", { href: silImg(file), x: p[0] - w / 2, y: p[1] - h, width: w, height: h, "data-focus": focus }, ui);
    };
    who("worker-signal-r", 148, 58, 0, "2"); who("worker-tool", 172, 62, 0, "2"); who("worker-walking", 152, 10, 1, "2");
    who("walk-055", 14, 116, 0, "3"); who("walker-2", 40, 118, 1, "3"); who("walk-054", 62, 112, 0, "3");
    who("woman-jogging", 106, 116, 0, "3"); who("cyclist-2", 82, 130, 0, "3", 6.6);

    // the two halves, named where the drawing leaves room: above the roof, and below the street
    const name = (focus, x, y, title, sub, col) => {
      const g = el("g", { "data-focus": focus }, s);
      text(g, x, y, title, "lbl", "start", { style: `font-size:26px;font-weight:600;fill:${col}` });
      sub.forEach((ln, i) => text(g, x, y + 26 + i * 21, ln, "lbl", "start", { style: "font-size:16px" }));
      return g;
    };
    const wk = name("2", 690, 50, "Workshop", ["a low building already there, reused,", "for the slow work: test, take apart, sort"], "#C9CDDA");
    const cc = name("3", 40, 618, "Community centre", ["a civic front of salvaged parts:", "rooms for neighbours, a classroom that sees the work"], C.lav);

    // 1 what it is not, by default: new on a cleared lot, or under new housing
    const alt = el("g", { "data-focus": "1" }, s);
    text(alt, 1130, 58, "not the default", "lbl-m", "start", { style: "font-size:15px" });
    // each drawn at twice the scale of a foot, its lot corner at (x + dx, y + 110)
    const vignette = (x, y, dx, draw, title, sub) => {
      const g = el("g", {}, alt), a = el("g", { transform: `translate(${x + dx},${y + 110}) scale(2)` }, g);
      draw(a);
      text(g, x, y + 214, title, "lbl", "start", { style: "font-size:17px;font-weight:600" });
      text(g, x, y + 235, sub, "lbl-m", "start", { style: "font-size:14px" });
    };
    vignette(1130, 76, 70, (a) => {
      face(a, [[0, 0, 0], [70, 0, 0], [70, 44, 0], [0, 44, 0]], "g-lane", "");
      line(a, [[0, 0, 0], [70, 0, 0], [70, 44, 0], [0, 44, 0], [0, 0, 0]], "hid");
      el("g", { filter: "url(#bloom-type)" }, a).appendChild(box(null, 8, 6, 0, 62, 38, 22, "m-hub"));
    }, "New, on a cleared lot", "new carbon, and land at city prices");
    vignette(1370, 76, 62, (a) => {
      face(a, [[0, 0, 0], [60, 0, 0], [60, 40, 0], [0, 40, 0]], "g-lane", "");
      el("g", { filter: "url(#bloom-type)" }, a).appendChild(box(null, 4, 4, 0, 56, 36, 14, "m-hub"));
      box(a, 4, 4, 14, 56, 36, 62, "m-white");
      for (let z = 24; z < 62; z += 10) line(a, [[56, 4, z], [56, 36, z], [4, 36, z]], "hid");
    }, "Under new housing", "trucks and dust below homes");

    // 4 how many such buildings stand near each candidate site: one square each, bright if a whole
    // hub fits (about 2,800 m2, the size of Portland's ReBuilding Center store)
    const stock = el("g", { "data-focus": "4" }, s), BIG = 2800, X = 1130, Y = 430, CWS = 76, SQ = 12, GAP = 2.5;
    text(stock, X, Y, "Low buildings to reuse, near each site", "lbl", "start", { style: "font-size:19px;font-weight:600" });
    text(stock, X, Y + 22, "600 m² or more, 12 m or less, within 400 m", "lbl-m", "start", { style: "font-size:14px" });
    (window.STOCK || []).forEach((site, i) => {
      const x0 = X + i * CWS, y0 = Y + 44;
      site.areas.forEach((a, k) => rect(stock, x0 + (k % 5) * (SQ + GAP), y0 + Math.floor(k / 5) * (SQ + GAP), SQ, SQ, a >= BIG ? { fill: C.sun, class: "glow", rx: 2 } : { fill: C.sun, "fill-opacity": 0.32, rx: 2 }));
      if (!site.areas.length) {
        rect(stock, x0, y0, 5 * SQ + 4 * GAP, SQ, { fill: "none", stroke: DIM, "stroke-width": 1.4, "stroke-dasharray": "3 3", rx: 2 });
        text(stock, x0, y0 + 32, "none", "lbl-m", "start", { style: "font-size:13px" });
      }
      el("circle", { cx: x0 + 11, cy: y0 + 70, r: 11, fill: C.orange }, stock);
      text(stock, x0 + 11, y0 + 75, String(site.order), "lbl", "middle", { style: "font-size:14px;font-weight:700;fill:#0B0E14" });
    });
    rect(stock, X, Y + 146, SQ, SQ, { fill: C.sun, class: "glow", rx: 2 });
    text(stock, X + 20, Y + 156, "big enough for a whole hub, about 2,800 m²", "lbl-m", "start", { style: "font-size:14px" });
    rect(stock, X, Y + 168, SQ, SQ, { fill: C.sun, "fill-opacity": 0.32, rx: 2 });
    text(stock, X + 20, Y + 178, "smaller: part of a hub, or two together", "lbl-m", "start", { style: "font-size:14px" });

    const tl = gsap.timeline({ paused: true });
    tl.fromTo([shed, work, yard], { autoAlpha: 0, y: 4 }, { autoAlpha: 1, y: 0, duration: 0.6, stagger: 0.12, ease: "power3.out", clearProps: "opacity,visibility,transform" })
      .fromTo([front, wk, cc], { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.5, stagger: 0.12, clearProps: "opacity,visibility" }, "-=0.3");
    return tl;
  }

  /* ---------- who already does part of this, and what nobody does ----------
     From the precedent survey (26 Oct 2026): a filled dot does the step, a
     ring did it once or does part of it. Lit: 1 Vancouver, 2 elsewhere,
     3 the empty column, 4 the proposed hub. */
  function precedents(host) {
    const s = chart(host, 1600, 744);
    const COLS = ["take apart", "test, regrade", "repair, clean", "store", "offer", "design with", "teach"];
    const ROWS = [
      { g: "1 3", name: "Habitat for Humanity ReStores", sub: "Metro Vancouver; none in the city itself", d: [0.5, 0, 0, 1, 1, 0, 0] },
      { g: "1 3", name: "Unbuilders and Heritage Lumber", sub: "Vancouver; mill in Maple Ridge", d: [1, 0, 1, 0, 1, 0, 0] },
      { g: "2 3", name: "ReBuilding Center", sub: "Portland, non-profit, since 1997", d: [0.5, 0, 0, 1, 1, 0, 1] },
      { g: "2 3", name: "Salvage Lumber Warehouse", sub: "Seattle, public, opened 2026", d: [1, 0, 1, 1, 1, 0, 0] },
      { g: "2 3", name: "Rotor DC", sub: "Brussels, cooperative", d: [1, 0, 1, 1, 1, 0, 0] },
      { g: "2 3", name: "Bauteilbörse Basel", sub: "Basel, association, since 1995", d: [1, 0, 1, 1, 1, 0, 1] },
      { g: "2 3", name: "K.118, baubüro in situ", sub: "Winterthur, built 2021", d: [0, 0.5, 0, 0, 0, 1, 0] },
    ];
    const X0 = 560, CW = 146, Y0 = 140, RH = 58;
    const cx = (c) => X0 + c * CW + CW / 2;
    // 3 the column nobody fills, behind everything
    const col = el("g", { "data-focus": "3" }, s);
    rect(col, X0 + CW + 8, 76, CW - 16, Y0 + ROWS.length * RH + 66 - 76, { fill: C.sky, "fill-opacity": 0.08, stroke: C.sky, "stroke-width": 1.4, rx: 12, "stroke-dasharray": "6 5" });
    text(col, cx(1), 36, "no one here regrades", "lbl", "middle", { style: `font-size:15px;fill:${C.sky}` });
    text(col, cx(1), 56, "salvaged wood for load", "lbl", "middle", { style: `font-size:15px;fill:${C.sky}` });
    COLS.forEach((c, i) => text(s, cx(i), Y0 - 40, c, "lbl", "middle", { style: "font-size:18px;font-weight:600" }));
    text(s, 40, Y0 - 40, "who does which step", "lbl-m", "start", { style: "font-size:16px" });
    const group = (y, t) => text(s, 40, y, t, "lbl-m", "start", { style: `font-size:14px;letter-spacing:.04em;fill:${MUT}` });
    group(Y0 + 4, "around Vancouver");
    group(Y0 + 2 * RH + 24, "elsewhere");
    ROWS.forEach((row, k) => {
      const y = Y0 + k * RH + (k >= 2 ? 16 : 0) + 30;
      const g = el("g", { "data-focus": row.g }, s);
      text(g, 40, y, row.name, "lbl", "start", { style: "font-size:19px;font-weight:600" });
      text(g, 40, y + 20, row.sub, "lbl-m", "start", { style: "font-size:14px" });
      const ph = ((window.SOURCES || {}).s25 || { rows: {} }).rows[row.name];
      if (ph) {
        el("image", { href: ph.img, x: 452, y: y - 22, width: 86, height: 50, preserveAspectRatio: "xMidYMid slice" }, g);
        el("rect", { x: 452, y: y - 22, width: 86, height: 50, rx: 4, fill: "none", stroke: "rgba(243,239,230,.3)", "stroke-width": 1 }, g);
      }
      line(g, [], "lo").setAttribute("d", `M${X0},${y + 32}H${X0 + COLS.length * CW}`);
      row.d.forEach((v, i) => {
        if (v === 1) el("circle", { cx: cx(i), cy: y + 4, r: 11, fill: C.sun, class: "glow" }, g);
        else if (v) el("circle", { cx: cx(i), cy: y + 4, r: 10, fill: "none", stroke: C.sun, "stroke-width": 2 }, g);
        else el("circle", { cx: cx(i), cy: y + 4, r: 3, fill: DIM }, g);
      });
    });
    // 4 the hub: every step, in one public place near the houses
    const yH = Y0 + (ROWS.length - 1) * RH + 16 + 30 + 74, hub = el("g", { "data-focus": "4" }, s);
    rect(hub, 24, yH - 30, X0 + COLS.length * CW - 10, 60, { fill: C.orange, "fill-opacity": 0.1, stroke: C.orange, "stroke-width": 1.6, rx: 12 });
    text(hub, 40, yH, "The deconstruction hub, proposed", "lbl", "start", { style: `font-size:19px;font-weight:600;fill:${C.orange}` });
    text(hub, 40, yH + 20, "Vancouver, public, near the houses", "lbl-m", "start", { style: "font-size:14px" });
    COLS.forEach((c, i) => el("circle", { cx: cx(i), cy: yH + 4, r: 11, fill: C.orange, class: "glow" }, hub));
    // the City's own attempt
    const note = el("g", { "data-focus": "4" }, s);
    text(note, 40, yH + 62, "2018: the City backed a deconstruction hub. Today Habitat for Humanity's Rebuild Hub gathers salvage for ReStores outside the city.", "lbl", "start", { style: "font-size:17px" });
    const key = el("g", {}, s);
    el("circle", { cx: 40 + 8, cy: 40, r: 8, fill: C.sun }, key); text(key, 64, 45, "does it", "lbl-m", "start", { style: "font-size:14px" });
    el("circle", { cx: 150, cy: 40, r: 7, fill: "none", stroke: C.sun, "stroke-width": 2 }, key); text(key, 166, 45, "partly, or once", "lbl-m", "start", { style: "font-size:14px" });
    const tl = gsap.timeline({ paused: true });
    tl.fromTo(s.querySelectorAll("[data-focus='1 3'],[data-focus='2 3']"), { autoAlpha: 0, x: -10 }, { autoAlpha: 1, x: 0, duration: 0.5, stagger: 0.08, ease: "power2.out", clearProps: "opacity,visibility,transform" });
    return tl;
  }

  /* ---------- the first directed study: watching and joining ----------
     1 the Materials Lab, weekly: samples donated by local suppliers, sorted by
       work-learn students, who decide what stays, what goes and how to group it;
     2 Material Immersion, as teaching assistant: 25 students, two teams, logs and sawn wood;
     3 tenon joints, tried in both. */
  function immersion(host) {
    const s = chart(host, 760, 640);
    const T = (g, x, y, str, size, col = TXT, weight = 400, anchor = "start") => text(g, x, y, str, "lbl", anchor, { style: `font-size:${size}px;font-weight:${weight};fill:${col}` });
    const arrow = (g, x0, x1, y) => {
      el("path", { d: `M${x0},${y}H${x1}`, stroke: C.sky, "stroke-width": 2, fill: "none" }, g);
      el("path", { d: `M${x1 - 8},${y - 7}l8,7l-8,7`, stroke: C.sky, "stroke-width": 2, fill: "none" }, g);
    };
    // 1 the Materials Lab: samples donated by suppliers, sorted on the rack; the decisions I listened to
    const g1 = el("g", { "data-focus": "1" }, s);
    T(g1, 0, 26, "Materials Lab, every week", 26, C.sky, 600);
    T(g1, 0, 54, "donated samples for exhibition and teaching, sorted by work-learn students", 16, MUT);
    T(g1, 0, 136, "local", 17); T(g1, 0, 158, "suppliers", 17);
    arrow(g1, 84, 126, 142);
    const rack = el("g", { transform: "translate(140,78)" }, g1);
    [0, 1, 2].forEach((r) => {
      const y = r * 44, len = [250, 170, 100][r], col = [C.sun, C.orange, C.teal][r];
      line(rack, [], "ln").setAttribute("d", `M0,${y + 38}H270`);
      for (let k = 0; k < 4; k++) rect(rack, 6 + k * 3, y + 30 - k * 7, len - k * 10, 6, { fill: col, "fill-opacity": 0.85 - k * 0.12, rx: 1.5 });
    });
    el("path", { d: "M0,0V128M270,0V128", stroke: TXT, "stroke-width": 1.4, fill: "none", opacity: 0.6 }, rack);
    T(g1, 275, 226, "samples, some stored for years", 14, MUT, 400, "middle");
    arrow(g1, 424, 466, 142);
    [["what stays", C.green], ["what goes", C.ash], ["how to group it", C.sky]].forEach(([t, col], i) => {
      const y = 112 + i * 32;
      rect(g1, 480, y - 12, 14, 14, { fill: col, rx: 3 });
      T(g1, 502, y, t, 17);
    });
    T(g1, 480, 226, "the decisions I listened to", 14, MUT);

    // 2 Material Immersion: 25 students, two teams, logs and sawn wood
    const g2 = el("g", { "data-focus": "2 3" }, s);
    T(g2, 0, 276, "Material Immersion, as Joanne Gates\u2019s teaching assistant", 26, C.orange, 600);
    const dot = (x, y, col) => el("circle", { cx: x, cy: y, r: 6.5, fill: col }, g2);
    for (let i = 0; i < 25; i++) dot(14 + (i % 5) * 19, 312 + Math.floor(i / 5) * 19, TXT);
    T(g2, 0, 420, "25 students", 15, MUT);
    el("path", { d: "M112,330C160,330 160,318 200,318M112,380C160,380 160,398 200,398", stroke: MUT, "stroke-width": 1.6, fill: "none" }, g2);
    for (let i = 0; i < 13; i++) dot(214 + (i % 5) * 17, 306 + Math.floor(i / 5) * 17, C.orange);
    for (let i = 0; i < 12; i++) dot(214 + (i % 5) * 17, 388 + Math.floor(i / 5) * 17, C.sun);
    // a log: end grain and length; a sawn board: square end and length
    const lx = 340, ly = 330;
    [26, 19, 12, 5].forEach((rr, i) => el("circle", { cx: lx, cy: ly, r: rr, fill: i ? "none" : C.orange, "fill-opacity": 0.15, stroke: C.orange, "stroke-width": i ? 1.1 : 2.4, opacity: i ? 0.7 : 1 }, g2));
    el("path", { d: `M${lx},${ly - 26}H${lx + 150}M${lx},${ly + 26}H${lx + 150}`, stroke: C.orange, "stroke-width": 2.4 }, g2);
    el("path", { d: `M${lx + 150},${ly - 26}A8,26 0 0 1 ${lx + 150},${ly + 26}`, stroke: C.orange, "stroke-width": 2, fill: "none" }, g2);
    T(g2, lx + 176, ly + 6, "logs", 19);
    const by = 398;
    rect(g2, lx - 20, by, 40, 40, { fill: C.sun, "fill-opacity": 0.15, stroke: C.sun, "stroke-width": 2.4 });
    el("path", { d: `M${lx + 20},${by}H${lx + 150}V${by + 40}H${lx + 20}`, stroke: C.sun, "stroke-width": 2.4, fill: "none" }, g2);
    T(g2, lx + 176, by + 26, "sawn wood", 19);

    // 3 tenon joints, drawn as a part pulled from its partner
    const g3 = el("g", { "data-focus": "3" }, s);
    T(g3, 0, 492, "tenon joints, tried by both teams", 22, C.rose, 600);
    const JOINTS = [
      ["through tenon", "M0,16H40V24H58V36H40V44H0Z", "M66,0H90V60H66ZM66,24H90V36H66"],
      ["pegged", "M0,16H40V24H56V36H40V44H0ZM48,30m-3,0a3,3 0 1,0 6,0a3,3 0 1,0 -6,0", "M66,0H90V60H66ZM78,30m-3,0a3,3 0 1,0 6,0a3,3 0 1,0 -6,0"],
      ["wedged", "M0,16H40V22H58V38H40V44H0ZM50,22L54,30L50,38", "M66,0H90V60H66ZM66,22H90V38H66"],
      ["dovetail", "M0,18H36L54,10V50L36,42H0Z", "M66,0H90V60H66ZM90,10L72,18V42L90,50"],
      ["half lap", "M0,18H44V30H58V42H0Z", "M64,18H112V30H64ZM44,18V30"],
    ];
    JOINTS.forEach(([name, a, b2], i) => {
      const g = el("g", { transform: `translate(${i * 150},516)` }, g3);
      el("path", { d: a, fill: C.rose, "fill-opacity": 0.16, stroke: C.rose, "stroke-width": 2, "stroke-linejoin": "round" }, g);
      el("path", { d: b2, fill: "none", stroke: TXT, "stroke-width": 1.6, "stroke-linejoin": "round", opacity: 0.85 }, g);
      T(g, 0, 92, name, 15, MUT);
    });
    const tl = gsap.timeline({ paused: true });
    tl.fromTo([g1, g2, g3], { autoAlpha: 0, y: 10 }, { autoAlpha: 1, y: 0, duration: 0.6, stagger: 0.18, ease: "power3.out", clearProps: "opacity,visibility,transform" });
    return tl;
  }

  /* ---------- the year: what each review will see ----------
     Columns are the course's checkpoints (ARCH 548 syllabus; GP II dates as
     the GP guidelines set them, to confirm). Lit: 1 assessment, 2 design,
     3 the two readings and what each feeds. */
  function plan(host) {
    const s = chart(host, 1600, 744);
    const CK = [["28 Oct", "Review 1", true], ["18 Nov", "Site and program"], ["2 Dec", "Review 2"], ["18 Dec", "GP I booklet"], ["late Feb", "GP II interim"], ["late Apr", "GP II final"]];
    const X0 = 230, CW = 228, top = 92;
    const cx = (i) => X0 + i * CW;
    CK.forEach(([d, n, now], i) => {
      const x = cx(i), col = now ? C.magenta : TXT;
      line(s, [], now ? "ln br thick" : "lo").setAttribute("d", `M${x},${top + 10}V700`);
      text(s, x + 10, top - 24, d, "lbl", "start", { style: `font-size:19px;font-weight:600;fill:${col}` });
      text(s, x + 10, top - 2, now ? n + ", today" : n, "lbl-m", "start", { style: `font-size:15px;${now ? `fill:${C.magenta}` : ""}` });
    });
    line(s, [], "ln").setAttribute("d", `M${cx(4) - 14},${top - 50}V700`);
    text(s, 20, 640, "a working plan,", "lbl-m", "start", { style: `font-size:15px;fill:${C.sun}` });
    text(s, 20, 662, "open until set with my chair", "lbl-m", "start", { style: `font-size:15px;fill:${C.sun}` });
    text(s, cx(0) + 10, 26, "GP I, fall 2026", "lbl-m", "start", { style: "font-size:15px" });
    text(s, cx(4) - 2, 26, "GP II, spring 2027", "lbl-m", "start", { style: "font-size:15px" });
    const lane = (y, name, sub, col) => {
      text(s, 20, y, name, "lbl", "start", { style: `font-size:22px;font-weight:600;fill:${col}` });
      text(s, 20, y + 22, sub, "lbl-m", "start", { style: "font-size:14px" });
    };
    // a deliverable: what it is, and the drawing that shows it
    const card = (g, i, y, title, made, col, done) => {
      const x = cx(i) + 8, w = CW - 18;
      rect(g, x, y, w, 96, { fill: "#0E121B", rx: 10 });
      rect(g, x, y, w, 96, { fill: col, "fill-opacity": done ? 0.28 : 0.1, stroke: col, "stroke-width": 1.4, rx: 10, class: done ? "glow" : "" });
      text(g, x + 14, y + 28, title, "lbl", "start", { style: "font-size:16px;font-weight:600" });
      const words = made.split(" "); let l1 = "", l2 = "";
      words.forEach((w2) => { if ((l1 + " " + w2).trim().length <= 26 && !l2) l1 = (l1 + " " + w2).trim(); else l2 = (l2 + " " + w2).trim(); });
      text(g, x + 14, y + 54, l1, done ? "lbl" : "lbl-m", "start", { style: "font-size:14px" });
      text(g, x + 14, y + 74, l2, done ? "lbl" : "lbl-m", "start", { style: "font-size:14px" });
      if (done) text(g, x + w - 14, y + 28, "done", "lbl", "end", { style: `font-size:14px;fill:${col}` });
    };
    const A = el("g", { "data-focus": "1" }, s), D = el("g", { "data-focus": "2" }, s), R = el("g", { "data-focus": "3" }, s);
    lane(160, "Assess", "what a house can give", C.sun);
    card(A, 0, 128, "Permit atlas, sites", "maps of demolition, multiplexes, hub sites", C.sun, true);
    card(A, 2, 128, "Three houses followed", "time-lapse axonometrics, house to multiplex", C.sun);
    card(A, 3, 128, "One house catalogued", "a passport per part; lumber logged by length", C.sun);
    lane(300, "Design", "what the parts can become", C.orange);
    card(D, 1, 268, "Hub site, programme", "site analysis and an area schedule", C.orange);
    card(D, 2, 268, "Joints for short pieces", "1:5 models and a joint sheet", C.orange);
    card(D, 4, 268, "The hub, designed", "plans, sections, assembly axonometric", C.orange);
    card(D, 5, 268, "Model and AR", "the hub taking in a house, and coming apart", C.orange);
    lane(452, "Read", "what each book feeds", C.sky);
    const book = (y, title, gist, feeds) => {
      rect(R, cx(0) + 8, y, cx(4) - cx(0) - 30, 92, { fill: "#0E121B", rx: 10 });
      rect(R, cx(0) + 8, y, cx(4) - cx(0) - 30, 92, { fill: C.sky, "fill-opacity": 0.08, stroke: C.sky, "stroke-width": 1.2, rx: 10 });
      text(R, cx(0) + 24, y + 30, title, "lbl", "start", { style: `font-size:17px;font-weight:600;fill:${C.sky}` });
      text(R, cx(0) + 24, y + 56, gist, "lbl", "start", { style: "font-size:15px" });
      text(R, cx(0) + 24, y + 78, feeds, "lbl-m", "start", { style: "font-size:14px" });
      const cv = ((window.SOURCES || {}).s30 || { books: {} }).books[title];
      if (cv) { const h = 76, w = h * cv.w / cv.h, x = cx(4) - 22 - w - 14; el("image", { href: cv.img, x, y: y + 8, width: w, height: h }, R); el("rect", { x, y: y + 8, width: w, height: h, fill: "none", stroke: "rgba(243,239,230,.3)", "stroke-width": 1 }, R); }
    };
    book(420, "How Buildings Learn, Stewart Brand", "sort parts by layer and rate of change; plain, low-road buildings adapt best", "feeds the house catalogue, and the hub as a plain shed that can change");
    book(526, "Re-Use in Construction, ZHAW", "reuse turns design around: find the parts first, and give them somewhere to wait", "feeds the hub's programme: intake, storage, the open platform");
    const tl = gsap.timeline({ paused: true });
    tl.fromTo([A, D, R], { autoAlpha: 0, y: 10 }, { autoAlpha: 1, y: 0, duration: 0.6, stagger: 0.18, ease: "power3.out", clearProps: "opacity,visibility,transform" });
    return tl;
  }

  /* ---------- 26: the reuse decision framework, as a way of working ----------
     From the ARCH 545A report (pp. 28-35): identify, evaluate, decide, design.
     Each stage lights with its sentence. */
  function framework(host) {
    const s = chart(host, 1600, 744);
    const chip = (g, x, y, w, label, col, fill = 0.14, size = 17) => {
      el("rect", { x, y, width: w, height: 34, rx: 8, fill: col, "fill-opacity": fill, stroke: col, "stroke-width": 1.4 }, g);
      text(g, x + w / 2, y + 23, label, "lbl", "middle", { style: `font-size:${size}px` });
    };
    const head = (g, x, n, title, col) => {
      text(g, x, 60, n, "num", "start", { style: `font-size:46px;fill:${col}` });
      text(g, x + 62, 54, title, "lbl", "start", { style: `font-size:30px;font-weight:600;fill:${col}` });
    };
    const COL = [40, 430, 820, 1210], W = 350;
    // what it came from: both directed studies
    const src = text(s, 40, 14, "", "lbl-m", "start", { style: "font-size:17px" });
    [["the outcome of both directed studies: ", MUT], ["observation on site", C.sky], [" and ", MUT], ["the online research database", C.sky]].forEach(([t, col]) => {
      const ts = el("tspan", { fill: col }, src); ts.textContent = t;
    });
    // the two flows that run under every stage
    const flow = el("g", {}, s);
    [[640, "material moves", C.orange], [690, "its record moves with it", C.sky]].forEach(([y, t, col]) => {
      el("path", { d: `M40,${y}H1540`, stroke: col, "stroke-width": 2, "stroke-dasharray": "6 6", fill: "none", opacity: 0.7 }, flow);
      el("path", { d: `M1528,${y - 8}L1544,${y}L1528,${y + 8}`, stroke: col, "stroke-width": 2, fill: "none" }, flow);
      text(flow, 40, y - 10, t, "lbl-m", "start", { style: `font-size:16px;fill:${col}` });
    });
    for (let i = 1; i < 4; i++) el("path", { d: `M${COL[i] - 34},330l18,0m-7,-8l8,8l-8,8`, stroke: TXT, "stroke-width": 2, fill: "none", opacity: 0.5 }, s);

    // 01 identify: the passport
    const g1 = el("g", { "data-focus": "1" }, s);
    head(g1, COL[0], "01", "Identify", C.sun);
    el("rect", { x: COL[0], y: 100, width: W, height: 410, rx: 14, fill: "#141A26", stroke: C.sun, "stroke-width": 1.6 }, g1);
    text(g1, COL[0] + 22, 140, "Reuse passport, an example", "lbl", "start", { style: "font-size:21px;font-weight:600" });
    const iso = el("g", { transform: `translate(${COL[0] + 175},215) scale(3.2)` }, g1);
    box(iso, 0, 0, 0, 30, 2, 3.2, "m-slab");
    [["source", "a donor house"], ["use", "floor joist"], ["species", "Douglas fir"], ["size", "2×10, 4.9 m"], ["condition", "nail holes, split end"], ["strength grade", "unknown"]].forEach(([k, v], i) => {
      text(g1, COL[0] + 22, 300 + i * 32, k, "lbl-m", "start", { style: "font-size:16px" });
      text(g1, COL[0] + 170, 300 + i * 32, v, "lbl", "start", { style: `font-size:16px;${v === "unknown" ? `fill:${C.magenta}` : ""}` });
    });
    text(g1, COL[0] + 22, 494, "unknowns stay visible", "lbl", "start", { style: `font-size:16px;fill:${C.magenta}` });

    // 02 evaluate: three questions first, nine after, five levels
    const g2 = el("g", { "data-focus": "2" }, s);
    head(g2, COL[1], "02", "Evaluate", C.sky);
    [["what is it?", "A"], ["what carbon stays?", "H"], ["can it come out whole?", "E"]].forEach(([t, k], i) => {
      el("rect", { x: COL[1], y: 100 + i * 50, width: W, height: 40, rx: 8, fill: C.sky, "fill-opacity": 0.22, stroke: C.sky, "stroke-width": 1.6, class: "glow" }, g2);
      text(g2, COL[1] + 14, 127 + i * 50, k, "num", "start", { style: `font-size:22px;fill:${C.sky}` });
      text(g2, COL[1] + 44, 127 + i * 50, t, "lbl", "start", { style: "font-size:19px" });
    });
    text(g2, COL[1], 282, "then", "lbl-m", "start", { style: "font-size:16px" });
    ["condition", "size, quantity", "performance", "processing", "code, risk", "logistics", "cost, labour", "design value", "future reuse"].forEach((t, i) => chip(g2, COL[1] + (i % 3) * 118, 296 + Math.floor(i / 3) * 44, 110, t, C.sky, 0.08, 15));
    text(g2, COL[1], 450, "five levels, from a quick screen to a full decision", "lbl-m", "start", { style: "font-size:15px" });
    for (let i = 0; i < 5; i++) el("rect", { x: COL[1] + i * 71, y: 466, width: 64, height: 12, rx: 4, fill: C.sky, "fill-opacity": 0.2 + i * 0.18 }, g2);

    // 03 decide: evidence against consequence
    const g3 = el("g", { "data-focus": "3" }, s);
    head(g3, COL[2], "03", "Decide", C.orange);
    const cell = (r, c) => [[C.green, C.green, C.green], [C.sun, C.sun, C.green], [C.red, C.orange, C.sun]][r][c];
    text(g3, COL[2] + 70, 112, "evidence →", "lbl-m", "start", { style: "font-size:15px" });
    text(g3, COL[2], 136, "consequence of failure ↓", "lbl-m", "start", { style: "font-size:15px" });
    ["low", "moderate", "high"].forEach((rl, r) => {
      text(g3, COL[2], 176 + r * 52, rl, "lbl-m", "start", { style: "font-size:15px" });
      for (let c = 0; c < 3; c++) el("rect", { x: COL[2] + 90 + c * 86, y: 150 + r * 52, width: 80, height: 44, rx: 6, fill: cell(r, c), "fill-opacity": 0.55, class: "glow" }, g3);
    });
    text(g3, COL[2], 334, "eight outcomes", "lbl-m", "start", { style: "font-size:16px" });
    [["reuse-ready", C.green], ["conditional", C.sun], ["after processing", C.sun], ["redirect", C.teal], ["design-dependent", C.lav], ["reserve", C.sky], ["recycle", C.ash], ["exclude", C.red]].forEach(([t, col], i) => chip(g3, COL[2] + (i % 2) * 176, 348 + Math.floor(i / 2) * 42, 168, t, col, 0.16, 16));

    // 04 design: the least transformative path, into the next building
    const g4 = el("g", { "data-focus": "4" }, s);
    head(g4, COL[3], "04", "Design", C.rose);
    text(g4, COL[3], 112, "least change first", "lbl-m", "start", { style: "font-size:16px" });
    ["direct reuse", "prepare", "repair", "modify", "test, regrade", "remanufacture", "recycle"].forEach((t, i) => {
      el("rect", { x: COL[3], y: 128 + i * 42, width: W - i * 30, height: 34, rx: 8, fill: C.rose, "fill-opacity": 0.42 - i * 0.05, stroke: C.rose, "stroke-width": 1.2 }, g4);
      text(g4, COL[3] + 14, 151 + i * 42, t, "lbl", "start", { style: "font-size:17px" });
    });
    const hs = el("g", { transform: `translate(${COL[3] + 250},470) scale(2.2)` }, g4);
    house(hs, { x: 0, y: 0, d: 18, w: 14, h: 9, rh: 6, wall: "m-sun", roof: "m-cobalt" });
    text(g4, COL[3] + 250, 545, "the next building", "lbl", "middle", { style: `font-size:17px;fill:${C.rose}` });

    // the expanded view (from print 1): when a stage is lit, its full content opens over the dimmed stages
    const slide = host.closest(".slide");
    const T = (g, x, y, str, size, col = TXT, weight = 400) => text(g, x, y, str, "lbl", "start", { style: `font-size:${size}px;font-weight:${weight};fill:${col}` });
    const panel = (x, w, col, title) => {
      const g = el("g", { opacity: 0, "pointer-events": "none" }, s);
      el("rect", { x, y: 92, width: w, height: 492, rx: 14, fill: "#0E121B", "fill-opacity": 0.97, stroke: col, "stroke-width": 1.4 }, g);
      T(g, x + 26, 130, title, 22, col, 600);
      return g;
    };
    const fields = (g, x, y, head, rows, col) => {
      T(g, x, y, head, 17, col, 600);
      rows.forEach(([k, v], i) => { T(g, x, y + 34 + i * 25.5, k, 15, TXT, 600); T(g, x + 180, y + 34 + i * 25.5, v, 14.5, MUT); });
    };
    const p1 = panel(420, 1140, C.sun, "Identify, in full: a reuse passport");
    fields(p1, 446, 172, "Material record: what is known", [
      ["Material ID", "a unique reference"], ["Component type", "beam, joist, stud, window, flooring"], ["Source", "donor building and original location"],
      ["Original use", "its previous role"], ["Material", "species, composition or product"], ["Age", "known or estimated"],
      ["Dimensions", "measured size and variation"], ["Quantity", "the stock available"], ["Condition", "damage, decay, past alterations"],
      ["Treatment", "coating or contamination"], ["Recovery status", "in place, recovered, stored, allocated"], ["Documentation", "photos, scans, drawings, tests"],
    ], C.sun);
    fields(p1, 1006, 172, "Application record: what a proposed use needs", [
      ["Proposed use", "the role being tested"], ["Building system", "structure, envelope, interior, site"], ["Performance", "the technical requirements"],
      ["Evidence available", "inspection, grading, testing"], ["Evidence missing", "what is still unknown"], ["Processing", "clean, repair, cut, grade, test"],
      ["Connection", "how it joins the new assembly"], ["Regulation", "requirements and review"], ["Environmental value", "new material and carbon avoided"],
      ["Architectural value", "patina, history, irregularity"], ["Future circularity", "reversible, replaceable, recoverable"], ["Decision status", "one of the eight decisions"],
    ], C.sun);
    T(p1, 446, 556, "One component can carry many application records: if a joist lacks the evidence to carry load, it can be tested for a partition or a screen. Unknowns stay visible.", 15, C.rose);

    const p2 = panel(810, 750, C.sky, "Evaluate, in full: twelve criteria, A to L");
    [["A", "Material identity", "what it is, where from, how old", 1], ["H", "Environmental value", "carbon and new material it saves", 1], ["E", "Deconstruction, recovery", "connections, reversibility, yield", 1],
     ["B", "Physical condition", "damage, decay, moisture, old fasteners"], ["C", "Geometry, quantity", "section, length, tolerance, count"], ["D", "Technical performance", "structure, fire, moisture, durability"],
     ["F", "Processing", "de-nailing, trimming, grading, repair"], ["G", "Logistics", "transport, storage, timing"], ["I", "Economics, labour", "its cost against new material"],
     ["J", "Regulation, risk", "code, testing, hazardous materials"], ["K", "Architectural value", "patina, history, design opportunity"], ["L", "Future circularity", "joints that let it move on again"]]
      .forEach(([k, name, q, first], i) => {
        const y = 176 + i * 30.5;
        if (first) el("rect", { x: 828, y: y - 21, width: 714, height: 28, rx: 6, fill: C.sky, "fill-opacity": 0.12 }, p2);
        T(p2, 840, y, k, 18, C.sky, 700); T(p2, 872, y, name, 15.5, TXT, 600); T(p2, 1100, y, q, 14.5, MUT);
      });
    T(p2, 836, 556, "The first three come first; five levels run from a quick screen to a full decision.", 15, C.sky);

    const p3 = panel(40, 760, C.orange, "Decide, in full: eight decisions, each with a next move");
    [["reuse-ready", C.green, "enough evidence, a defined use", "integrate into design"], ["conditional", C.sun, "promising, questions still open", "test or prototype"],
     ["after processing", C.sun, "viable after a defined step", "add it to the workflow"], ["redirect", C.teal, "wrong use, another fits", "match a better role"],
     ["design-dependent", C.lav, "depends on the joint or geometry", "redesign around the stock"], ["reserve", C.sky, "viable, no use yet", "catalogue and store"],
     ["recycle", C.ash, "the material is recoverable, the part is not", "keep apart from reuse stock"], ["exclude", C.red, "hazard or poor performance", "treat or dispose"]]
      .forEach(([name, col, meaning, act], i) => {
        const y = 160 + i * 47;
        el("rect", { x: 66, y, width: 190, height: 36, rx: 8, fill: col, "fill-opacity": 0.18, stroke: col, "stroke-width": 1.2 }, p3);
        T(p3, 80, y + 24, name, 16, TXT, 600); T(p3, 276, y + 15, meaning, 14.5, MUT); T(p3, 276, y + 33, `next: ${act}`, 14.5, TXT, 600);
      });
    T(p3, 66, 556, "Evidence is weighed against what a failure would cost: a high-risk use needs more proof.", 15, C.orange);

    const p4 = panel(40, 1150, C.rose, "Design, in full: the least change first, and the record travels");
    [["direct reuse", "the original part and its geometry"], ["preparation", "substantially unchanged"], ["repair", "most of the part kept"], ["modification", "identity kept, geometry changes"],
     ["testing, regrading", "geometry kept, confidence rises"], ["remanufacture", "material kept, form partly lost"], ["recycle", "material kept, identity lost"], ["exclude", "no reuse value kept"]]
      .forEach(([name, what], i) => {
        const y = 160 + i * 40;
        el("rect", { x: 66, y, width: 520 - i * 34, height: 32, rx: 7, fill: C.rose, "fill-opacity": 0.4 - i * 0.04, stroke: C.rose, "stroke-width": 1.1 }, p4);
        T(p4, 80, y + 22, name, 16, TXT, 600); T(p4, 610, y + 22, what, 15, MUT);
      });
    const steps = ["existing building", "audit", "deconstruction", "assessment", "processing", "storage", "design", "next building", "future recovery"];
    el("path", { d: "M120,532H1110", stroke: C.sky, "stroke-width": 2, "stroke-dasharray": "6 6", fill: "none" }, p4);
    steps.forEach((t, i) => { const x = 120 + i * 123.75; el("circle", { cx: x, cy: 532, r: 6, fill: C.sky }, p4); text(p4, x, 562, t, "lbl", "middle", { style: `font-size:13.5px;fill:${MUT}` }); });
    T(p4, 860, 504, "its record moves with it, stage by stage", 14.5, C.sky);
    if (slide) slide.addEventListener("step", (e) => {
      [p1, p2, p3, p4].forEach((g, k) => gsap.to(g, { opacity: k + 1 === e.detail ? 1 : 0, duration: 0.45, delay: k + 1 === e.detail ? 0.2 : 0, ease: "power2.out", overwrite: true }));
    });

    const tl = gsap.timeline({ paused: true });
    tl.fromTo([g1, g2, g3, g4], { autoAlpha: 0, y: 14 }, { autoAlpha: 1, y: 0, duration: 0.6, stagger: 0.15, ease: "power3.out", clearProps: "opacity,visibility" })
      .fromTo(flow, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.6, clearProps: "opacity,visibility" }, "-=0.2");
    return tl;
  }

  window.CHARTS = { kinds, shear, framework, value, co2, homes, permitMap, tiers, reuse, woodFirst, timeline, land, lot, labour, litMap, hubProgram, hubType, siting, precedents, immersion, plan };
})();
