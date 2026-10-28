/* Drawing kit shared by every axonometric on the board.
   The camera matches the Hairline figure (azimuth 45, 2:1): +x runs down to
   the right, +y down to the left, z up. Units are feet. Faces are painted in
   the order they are appended, so callers append far to near.
   Colour comes from material classes in board.css (m-house, m-roof, m-slab,
   m-green, m-hub, m-salmon, m-lav, m-pink, m-carried, m-glass, m-white,
   m-navy), each with a lit top (fz), a base +x face (fx) and a darker +y
   face (fy). Line weight comes from outline(): a thick ink pass under each
   object, so its silhouette reads heavier than its interior edges. */
(() => {
  const NS = "http://www.w3.org/2000/svg";
  const C45 = Math.SQRT1_2, KY = 0.35355, KZ = 0.86603;

  const P = (x, y, z = 0) => [(x - y) * C45, (x + y) * KY - z * KZ];
  const pts = (list) => list.map((p) => P(...p).map((v) => v.toFixed(2)).join(",")).join(" ");
  const d = (list, close = true) => !list.length ? null : "M" + list.map((p) => P(...p).map((v) => v.toFixed(2)).join(",")).join("L") + (close ? "Z" : "");

  function el(tag, attrs = {}, parent) {
    const e = document.createElementNS(NS, tag);
    for (const k in attrs) if (attrs[k] != null) e.setAttribute(k, attrs[k]);
    if (parent) parent.appendChild(e);
    return e;
  }
  const poly = (parent, list, cls) => el("polygon", { points: pts(list), class: cls }, parent);
  const line = (parent, list, cls = "ln") => el("path", { d: d(list, false), class: cls }, parent);
  /** A face in a material: f is "fx", "fy" or "fz". */
  const face = (parent, list, mat, f = "fx") => poly(parent, list, `f ${mat} ${f}`);

  /** The silhouette pass: a thick-stroked copy of an object's faces, painted first. */
  function outline(g) {
    const s = el("g", { class: "sil-pass", "aria-hidden": "true" });
    [...g.children].forEach((c) => { if (c.tagName !== "text" && !(c.classList && c.classList.contains("no-sil"))) s.appendChild(c.cloneNode(true)); });
    g.insertBefore(s, g.firstChild);
    return g;
  }

  /** A rectangle drawn on a face: u along the face, v up it. face: {o:[x,y,z], u:[ux,uy,uz], v:[vx,vy,vz]} (unit vectors). */
  function onFace(fc, u0, v0, u1, v1) {
    const at = (u, v) => [0, 1, 2].map((i) => fc.o[i] + fc.u[i] * u + fc.v[i] * v);
    return [at(u0, v0), at(u1, v0), at(u1, v1), at(u0, v1)];
  }

  /** A box from (x0,y0,z0) to (x1,y1,z1): its three visible faces in one material, outlined. */
  function box(parent, x0, y0, z0, x1, y1, z1, mat = "m-white", opts = {}) {
    const g = el("g", {}, parent);
    if (typeof mat === "object") { // legacy: explicit classes per face
      poly(g, [[x1, y0, z0], [x1, y1, z0], [x1, y1, z1], [x1, y0, z1]], mat.x || "pl");
      poly(g, [[x0, y1, z0], [x1, y1, z0], [x1, y1, z1], [x0, y1, z1]], mat.y || "pl");
      poly(g, [[x0, y0, z1], [x1, y0, z1], [x1, y1, z1], [x0, y1, z1]], mat.z || "pl2");
    } else {
      face(g, [[x1, y0, z0], [x1, y1, z0], [x1, y1, z1], [x1, y0, z1]], mat, "fx");
      face(g, [[x0, y1, z0], [x1, y1, z0], [x1, y1, z1], [x0, y1, z1]], mat, "fy");
      face(g, [[x0, y0, z1], [x1, y0, z1], [x1, y1, z1], [x0, y1, z1]], opts.top || mat, "fz");
    }
    if (opts.outline !== false) outline(g);
    return g;
  }

  /** A lollipop tree in one of four greens. */
  function tree(parent, x, y, r = 5, k = 0) {
    const g = el("g", {}, parent);
    line(g, [[x, y, 0], [x, y, r * 1.6]], "trunk no-sil");
    const c = P(x, y, r * 1.6 + r * 0.7);
    el("ellipse", { cx: c[0], cy: c[1], rx: r * 0.86, ry: r, class: "f " + ["m-teal fx", "tree-b", "m-grass fz", "tree-a"][k % 4] }, g);
    const b = P(x, y, 0);
    el("ellipse", { cx: b[0], cy: b[1], rx: r * 0.5, ry: r * 0.25, class: "hid", style: "stroke-dasharray:none" }, g);
    return outline(g);
  }

  /** A person about 5.6 ft tall in coloured clothes; k picks skin and clothes. pose: "stand", "carry", "arms". */
  function person(parent, x, y, z = 0, k = 0, pose = "stand") {
    const f = P(x, y, z), hp = P(x, y, z + 5.6), hip = P(x, y, z + 2.7);
    const g = el("g", { class: "no-sil person-g" }, parent);
    const cl = "cl-" + "abcdefg"[k % 7], legs = "cl-" + "bgebacd"[(k + 3) % 7];
    el("path", { d: `M${f[0] - 0.55},${f[1]}L${hip[0] - 0.65},${hip[1]}L${hip[0] + 0.65},${hip[1]}L${f[0] + 0.55},${f[1]}Z`, class: "pp " + (k % 3 ? "skin-c" : legs) }, g);
    el("path", { d: `M${hip[0] - 0.8},${hip[1]}L${hp[0] - 0.85},${hp[1] + 1.9}Q${hp[0]},${hp[1] + 1.4} ${hp[0] + 0.85},${hp[1] + 1.9}L${hip[0] + 0.8},${hip[1]}Z`, class: "pp " + cl }, g);
    if (pose === "arms") el("path", { d: `M${hp[0] - 0.8},${hp[1] + 2.2}L${hp[0] - 1.9},${hp[1] + 0.4}M${hp[0] + 0.8},${hp[1] + 2.2}L${hp[0] + 1.9},${hp[1] + 0.4}`, class: "ln" }, g);
    if (pose === "carry") el("path", { d: `M${hp[0] - 0.8},${hp[1] + 2.3}L${hp[0] - 1.6},${hp[1] + 1.2}M${hp[0] + 0.8},${hp[1] + 2.3}L${hp[0] + 1.6},${hp[1] + 1.2}`, class: "ln" }, g);
    el("circle", { cx: hp[0], cy: hp[1] + 0.85, r: 0.85, class: "pp skin-" + "abc"[k % 3] }, g);
    return g;
  }

  /** A cyclist riding along y. */
  function bike(parent, x, y, k = 0, cargo) {
    const g = el("g", { class: "no-sil" }, parent);
    for (const dy of [-1.7, 1.7]) { const c = P(x, y + dy, 1.1); el("ellipse", { cx: c[0], cy: c[1], rx: 0.85, ry: 1.05, class: "wheel" }, g); }
    line(g, [[x, y - 1.7, 1.1], [x, y, 2.4], [x, y + 1.7, 1.1]]);
    if (cargo) box(g, x - 1, y + 1.9, 1, x + 1, y + 4.2, 2.6, cargo);
    person(g, x, y, 1.6, k, "arms");
    return g;
  }

  /** A car or truck parked along y. */
  function car(parent, x, y, mat = "m-sun", len = 13, truck = false) {
    const g = el("g", {}, parent);
    box(g, x - 3, y, 0.6, x + 3, y + len, truck ? 3 : 2.6, mat);
    if (truck) box(g, x - 3, y + len - 4.6, 3, x + 3, y + len, 7.4, mat);
    else box(g, x - 2.6, y + len * 0.28, 2.6, x + 2.6, y + len * 0.72, 4.6, "m-sky");
    for (const yy of [y + 2.5, y + len - 2.5]) { const c = P(x + 3, yy, 0.9); el("ellipse", { cx: c[0], cy: c[1], rx: 0.8, ry: 0.95, class: "f m-navy fx" }, g); }
    return g;
  }

  /** A halftone field of dots over a ground rectangle. */
  function dots(parent, x0, y0, x1, y1, step = 2.2, r = 0.42) {
    const g = el("g", { class: "no-sil" }, parent);
    for (let x = x0 + step / 2; x < x1; x += step) for (let y = y0 + step / 2; y < y1; y += step) {
      const c = P(x, y, 0.05);
      el("ellipse", { cx: c[0], cy: c[1], rx: r, ry: r * 0.55, class: "dot" }, g);
    }
    return g;
  }

  /** Zebra stripes across a street running along y, between x0 and x1, at y. */
  function zebra(parent, x0, x1, y, w = 6) {
    const g = el("g", { class: "no-sil" }, parent);
    for (let x = x0 + 1; x < x1 - 1; x += 2.4) face(g, [[x, y, 0.05], [x + 1.2, y, 0.05], [x + 1.2, y + w, 0.05], [x, y + w, 0.05]], "zebra", "");
    return g;
  }

  /**
   * A detached house on a lot, ridge front-to-back (along x), gable to the
   * street at +x. o: {x, y, d (depth along x), w (width along y), h (eave),
   * rh (ridge rise), porch, chimney}. Returns a group with named, outlined parts.
   */
  function house(parent, o) {
    const { x, y, d: dp, w, h, rh } = o, WALL = o.wall || "m-house", ROOF = o.roof || "m-roof";
    const g = el("g", { class: "house" }, parent);
    const parts = {};
    const x1 = x + dp, y1 = y + w, ym = y + w / 2, ov = 1.5;
    parts.base = box(g, x, y, 0, x1, y1, 1.2, "m-slab");
    // side wall (+y) with its windows
    parts.side = el("g", {}, g);
    face(parts.side, [[x, y1, 1.2], [x1, y1, 1.2], [x1, y1, h], [x, y1, h]], WALL, "fy");
    const sideFace = { o: [x, y1, 0], u: [1, 0, 0], v: [0, 0, 1] };
    if (o.boards) for (let z = 2.4; z < h - 0.6; z += 1.2) line(parts.side, [[x + 0.4, y1, z], [x1 - 0.4, y1, z]], "wl");
    const nWin = Math.max(2, Math.round(dp / 12));
    for (let i = 0; i < nWin; i++) {
      const u = 5 + i * ((dp - 10) / nWin);
      face(parts.side, onFace(sideFace, u, 4, u + 3.4, 8.6), "m-glass", "fy");
      if (h > 15) face(parts.side, onFace(sideFace, u, h - 8, u + 3.4, h - 3.6), "m-glass", "fy");
    }
    // front gable (+x): cedar shingle courses, windows
    parts.gable = el("g", {}, g);
    face(parts.gable, [[x1, y, 1.2], [x1, y1, 1.2], [x1, y1, h], [x1, ym, h + rh], [x1, y, h]], WALL, "fx");
    const front = { o: [x1, y, 0], u: [0, 1, 0], v: [0, 0, 1] };
    for (let z = h + 2; z < h + rh - 1.5; z += 1.6) {
      const t = (z - h) / rh, half = (w / 2) * (1 - t);
      line(parts.gable, [[x1, ym - half + 0.4, z], [x1, ym + half - 0.4, z]], o.boards ? "wl" : "lo");
    }
    face(parts.gable, onFace(front, 3, 4, 9, 9), "m-glass");
    face(parts.gable, onFace(front, w - 9, 4, w - 3, 9), "m-glass");
    if (h > 15) face(parts.gable, onFace(front, w / 2 - 3, h - 8, w / 2 + 3, h - 3.5), "m-glass");
    face(parts.gable, onFace(front, w / 2 - 1.6, h + 2, w / 2 + 1.6, h + 5.2), "m-glass");
    // roof: the far slope, then the near slope
    parts.roof = el("g", {}, g);
    face(parts.roof, [[x - ov, y - ov, h - 0.6], [x1 + ov, y - ov, h - 0.6], [x1 + ov, ym, h + rh], [x - ov, ym, h + rh]], ROOF, "fz");
    face(parts.roof, [[x - ov, ym, h + rh], [x1 + ov, ym, h + rh], [x1 + ov, y1 + ov, h - 0.6], [x - ov, y1 + ov, h - 0.6]], ROOF, "fx");
    if (o.chimney) parts.chimney = box(g, x + dp * 0.35, ym + 1.5, h + rh * 0.5, x + dp * 0.35 + 2.4, ym + 4, h + rh + 3, "m-salmon");
    // front porch with steps
    if (o.porch) {
      parts.porch = el("g", {}, g);
      box(parts.porch, x1, y + 2, 0, x1 + 6, y + w * 0.5, 2.4, "m-white");
      box(parts.porch, x1 + 6, y + 4, 0, x1 + 8, y + 9, 1.2, "m-white");
      face(parts.porch, onFace(front, 4.2, 2.4, 7.6, 9.6), "m-white");
      // four square posts carry the porch roof, drawn back to front
      for (const [px, py] of [[x1 + 0.2, y + 2.1], [x1 + 4.9, y + 2.1], [x1 + 0.2, y + w * 0.5 - 1.1], [x1 + 4.9, y + w * 0.5 - 1.1]]) box(parts.porch, px, py, 2.4, px + 0.9, py + 0.9, 10, "m-white");
      face(parts.porch, [[x1 - 0.5, y + 1.6, 10], [x1 + 6.4, y + 1.6, 10], [x1 + 6.4, y + w * 0.5 + 0.4, 10], [x1 - 0.5, y + w * 0.5 + 0.4, 10]], "m-roof", "fz");
    }
    ["side", "gable", "roof"].forEach((k) => outline(parts[k]));
    if (parts.porch) outline(parts.porch);
    return { g, parts };
  }

  /* Labels in a drawing keep one size on screen however far the drawing is
     scaled: --u is user units per CSS pixel, and board.css multiplies by it. */
  function scaleText(svg) {
    const vb = svg.viewBox.baseVal, r = svg.getBoundingClientRect();
    if (!vb || !vb.width || !r.width || !r.height) return;
    svg.style.setProperty("--u", (1 / Math.min(r.width / vb.width, r.height / vb.height)).toFixed(4));
  }
  const watched = new ResizeObserver((es) => es.forEach((e) => scaleText(e.target)));

  function fit(svg, pad = 10, room = {}) {
    let b;
    for (let pass = 0; pass < 2; pass++) {
      b = svg.getBBox();
      const L = (room.left || 0) * b.width, T = (room.top || 0) * b.height, Rr = (room.right || 0) * b.width;
      svg.setAttribute("viewBox", [b.x - pad - L, b.y - pad - T, b.width + 2 * pad + L + Rr, b.height + 2 * pad + T].map((v) => v.toFixed(1)).join(" "));
      scaleText(svg);
    }
    watched.observe(svg);
    return b;
  }

  function svg(host, cls = "dwg", attrs = {}) {
    const s = el("svg", Object.assign({ class: cls, preserveAspectRatio: "xMidYMid meet" }, attrs));
    host.appendChild(s);
    return s;
  }

  window.ISO = { P, pts, d, el, poly, line, face, box, tree, person, bike, car, dots, zebra, house, onFace, outline, fit, svg };
})();
