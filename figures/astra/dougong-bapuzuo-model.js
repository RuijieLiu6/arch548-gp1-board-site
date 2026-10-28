/*
 * Original, unmeasured explanatory geometry. No downloaded model or mesh.
 * 八铺作双抄三下昂，里转六铺作三抄，并计心补间铺作。
 * Axes: Y up; X along the facade; +Z towards the eave.
 * The proportions and joint clearances serve this animated explanation;
 * they are not survey dimensions or a fabrication specification.
 */
(function () {
  "use strict";
  window.createBapuzuoModel = function (T) {
    const root = new T.Group();
    root.name = "song-bapuzuo-intercolumn";
    const parts = [];
    const H = 0.8, W = 0.54, SEAT = 0.4, J = 2.5;
    const RISE = H + SEAT, COURSE = RISE * 2, SLOPE = RISE / (2 * J);
    const B0 = 0.96, B2 = B0 + COURSE, B3I = B2 + COURSE;
    const ANG1 = B2 + COURSE - SLOPE * J;
    const ANG2 = ANG1 + COURSE - SLOPE * J;
    const ANG3 = ANG2 + COURSE - SLOPE * J;
    const palette = {
      base: 0xffd23f, block: 0x38c8b5, arm: 0xf5ac66,
      ang: 0xed91b6, beam: 0x8ac7ec
    };
    const materials = {};
    Object.keys(palette).forEach(kind => {
      materials[kind] = new T.MeshStandardMaterial({
        color: palette[kind], roughness: 0.83, metalness: 0,
        flatShading: true, emissive: palette[kind], emissiveIntensity: 0.035
      });
      materials[kind].userData = { role: kind, roleColor: palette[kind] };
    });
    const edgeMat = new T.LineBasicMaterial({ color: 0xfff0d7, transparent: true, opacity: 0.52 });
    const grainMat = new T.LineBasicMaterial({ color: 0x382d32, transparent: true, opacity: 0.26 });
    const endGrainMat = new T.LineBasicMaterial({ color: 0x43363b, transparent: true, opacity: 0.19 });
    const stages = [
      { cn: "栌斗与承座", en: "Bearing block", description: "补间铺作承座与十字开口栌斗；承座仅表示下部支承。" },
      { cn: "第一抄与泥道栱", en: "First projecting arm", description: "第一华栱与泥道栱在同一斗口交叠，互补的上下卯口相扣。" },
      { cn: "第一跳斗座", en: "First-jump bearing seats", description: "华栱跳头安交互斗，泥道栱端安散斗，中心设斗座。" },
      { cn: "第一跳重栱与第二抄", en: "Second projecting arm", description: "瓜子栱上置慢栱；第二华栱与上层慢栱相交，再向内外出跳。" },
      { cn: "第二跳重栱与里转三抄", en: "Inner third projection", description: "第二跳逐跳计心；里转第三华栱形成三抄，外转准备承昂。" },
      { cn: "第一下昂", en: "First descending cantilever", description: "华头子承第一昂，昂尾向内上扬，昂头向外下指，形成第三外跳。" },
      { cn: "第三跳重栱", en: "Third-jump double arms", description: "昂头斗座上逐层安瓜子栱、斗与慢栱，构成下一昂的承位。" },
      { cn: "第二下昂", en: "Second descending cantilever", description: "第二昂向外形成第四跳，内尾与前一昂保持分离。" },
      { cn: "第四跳重栱", en: "Fourth-jump double arms", description: "第四跳继续计心，区分交互斗、齐心斗与端部散斗。" },
      { cn: "第三下昂", en: "Third descending cantilever", description: "第三昂形成第五外跳；两抄加三昂，共五跳，称八铺作。" },
      { cn: "令栱与耍头", en: "Terminal arms and beam heads", description: "外五跳、里三跳各以令栱与耍头交接；中央壁内重栱逐层收束。" },
      { cn: "橑檐方与封顶", en: "Eave beam and capping members", description: "散斗、齐心斗承橑檐方，衬方头与方相交；昂栓贯联三昂。" }
    ];

    function part(id, cn, en, kind, at, stage, jump) {
      const g = new T.Group();
      g.name = id;
      g.position.set(at[0], at[1], at[2]);
      g.userData = { id, cn, en, kind, stage, jump, roleColor: palette[kind] };
      root.add(g);
      const entry = { id, cn, en, group: g, home: g.position.clone(), stage, kind };
      if (jump !== undefined) entry.jump = jump;
      parts.push(entry);
      return g;
    }
    function mesh(g, geometry, kind, edges = true) {
      geometry.computeVertexNormals();
      const m = new T.Mesh(geometry, materials[kind]);
      m.castShadow = true; m.receiveShadow = true;
      m.userData = { role: kind, roleColor: palette[kind] };
      g.add(m);
      if (edges) {
        const lines = new T.LineSegments(new T.EdgesGeometry(geometry, 19), edgeMat);
        lines.userData = { decorative: true, role: "edge" };
        g.add(lines);
      }
      return m;
    }
    function box(g, sx, sy, sz, x, y, z, kind) {
      const geo = new T.BoxGeometry(sx, sy, sz);
      geo.translate(x, y, z);
      return mesh(g, geo, kind);
    }
    function line(g, points, mat = grainMat) {
      if (points.length < 2) return;
      const geo = new T.BufferGeometry().setFromPoints(points.map(p => new T.Vector3(...p)));
      const l = new T.Line(geo, mat);
      l.userData = { decorative: true, role: "grain" };
      g.add(l);
    }
    function inside(poly, x, y) {
      let yes = false;
      for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
        const a = poly[i], b = poly[j];
        if ((a[1] > y) !== (b[1] > y) && x < (b[0] - a[0]) * (y - a[1]) / (b[1] - a[1]) + a[0]) yes = !yes;
      }
      return yes;
    }
    function mapProfile(u, y, side, axis) { return axis === "x" ? [u, y, side] : [-side, y, u]; }
    function prism(g, poly, width, axis, kind, grain = true) {
      const shape = new T.Shape();
      shape.moveTo(poly[0][0], poly[0][1]);
      for (let i = 1; i < poly.length; i++) shape.lineTo(poly[i][0], poly[i][1]);
      shape.closePath();
      const geo = new T.ExtrudeGeometry(shape, { depth: width, steps: 1, bevelEnabled: false, curveSegments: 3 });
      geo.translate(0, 0, -width / 2);
      if (axis === "z") geo.rotateY(-Math.PI / 2);
      mesh(g, geo, kind);
      if (!grain) return;
      const us = poly.map(p => p[0]), ys = poly.map(p => p[1]);
      const lo = Math.min(...us), hi = Math.max(...us), y0 = Math.min(...ys), y1 = Math.max(...ys);
      for (const side of [-1, 1]) for (let k = 1; k <= 3; k++) {
        let run = [];
        for (let n = 0; n <= 54; n++) {
          const u = lo + (hi - lo) * n / 54;
          const y = y0 + (y1 - y0) * (0.25 + k * 0.13) + Math.sin(n * 0.31 + k * 1.7) * 0.017;
          if (inside(poly, u, y)) run.push(mapProfile(u, y, side * (width / 2 + 0.003), axis));
          else { line(g, run); run = []; }
        }
        line(g, run);
      }
    }
    // Closed profiles with slots that open to the top or underside. The slots
    // are geometry, rather than dark rectangles painted over intersecting boxes.
    function profile(lo, hi, top, bottom, topSlots = [], bottomSlots = [], samples = 36) {
      const cuts = [lo, hi];
      for (const s of [...topSlots, ...bottomSlots]) cuts.push(Math.max(lo, s.c - s.w / 2), Math.min(hi, s.c + s.w / 2));
      for (let n = 1; n < samples; n++) cuts.push(lo + (hi - lo) * n / samples);
      const xs = [...new Set(cuts.filter(x => x >= lo && x <= hi).map(x => +x.toFixed(7)))].sort((a, b) => a - b);
      const output = [];
      function edge(fn, slots, reverse, isTop) {
        const ordered = reverse ? xs.slice().reverse() : xs;
        for (let n = 0; n < ordered.length; n++) {
          const u = ordered[n];
          const before = n ? (ordered[n - 1] + u) / 2 : u;
          const after = n + 1 < ordered.length ? (ordered[n + 1] + u) / 2 : u;
          const value = q => {
            const s = slots.find(s => q > s.c - s.w / 2 + 1e-7 && q < s.c + s.w / 2 - 1e-7);
            return fn(u) + (s ? (isTop ? -s.d : s.d) : 0);
          };
          const a = value(before), b = value(after);
          output.push([u, a]);
          if (Math.abs(a - b) > 1e-6) output.push([u, b]);
        }
      }
      edge(top, topSlots, false, true);
      edge(bottom, bottomSlots, true, false);
      return output;
    }
    function arm(id, cn, en, at, length, axis, stage, jump, opts = {}) {
      const g = part(id, cn, en, "arm", at, stage, jump);
      const lo = opts.lo !== undefined ? opts.lo : -length / 2;
      const hi = opts.hi !== undefined ? opts.hi : length / 2;
      const centre = (lo + hi) / 2, half = (hi - lo) / 2;
      const underside = u => {
        if (opts.rootAtHi && u > lo + (hi - lo) * 0.30) return 0;
        const t = Math.abs(u - centre) / half;
        if (t < 0.53) return 0;
        const a = Math.min(1, (t - 0.53) / 0.47);
        // Four successive facets express 卷杀; top bearing seats stay level.
        const stepped = Math.floor(a * 4) / 4;
        return 0.52 * (0.52 * a + 0.48 * stepped);
      };
      const poly = profile(lo, hi, () => H, underside, opts.topSlots || [], opts.bottomSlots || [], 40);
      prism(g, poly, opts.width || W, axis, "arm");
      g.userData.labelOffset = [0, H * 0.7, 0];
      return g;
    }
    function squareBeam(id, cn, en, at, length, width, height, axis, stage, jump, slots = {}) {
      const g = part(id, cn, en, "beam", at, stage, jump);
      const poly = profile(-length / 2, length / 2, () => height, () => 0, slots.top || [], slots.bottom || [], 8);
      prism(g, poly, width, axis, "beam");
      // Visible end rings sit only on the timber's uncut end grain.
      for (const end of [-1, 1]) for (let k = 1; k <= 3; k++) {
        const points = [];
        for (let n = 0; n <= 28; n++) {
          const a = Math.PI * 2 * n / 28;
          const side = Math.cos(a) * width * (0.09 + 0.075 * k);
          const y = height / 2 + Math.sin(a) * height * (0.07 + 0.07 * k);
          points.push(mapProfile(end * (length / 2 + 0.003), y, side, axis));
        }
        line(g, points, endGrainMat);
      }
      return g;
    }
    function clippedRing(w, d, bevel) {
      return [ [-w/2+bevel,-d/2], [w/2-bevel,-d/2], [w/2,-d/2+bevel], [w/2,d/2-bevel],
        [w/2-bevel,d/2], [-w/2+bevel,d/2], [-w/2,d/2-bevel], [-w/2,-d/2+bevel] ];
    }
    function frustum(g, w, d, bottomScale, y0, y1, kind, slope = 0) {
      const lower = clippedRing(w * bottomScale, d * bottomScale, 0.08);
      const upper = clippedRing(w, d, 0.08);
      const pos = [];
      lower.forEach(([x,z]) => pos.push(x, y0 - slope * z, z));
      upper.forEach(([x,z]) => pos.push(x, y1, z));
      const index = [];
      for (let n = 0; n < 8; n++) {
        const m = (n + 1) % 8;
        index.push(n, n + 8, m, m, n + 8, m + 8);
      }
      for (let n = 1; n < 7; n++) index.push(0, n, n + 1, 8, 9 + n, 8 + n);
      const geo = new T.BufferGeometry();
      geo.setAttribute("position", new T.Float32BufferAttribute(pos, 3));
      geo.setIndex(index);
      mesh(g, geo, kind);
    }
    function block(id, cn, en, at, stage, jump, opts = {}) {
      const g = part(id, cn, en, "block", at, stage, jump);
      const w = opts.w || 1.26, d = opts.d || 1.14;
      const seat = opts.cap ? 0.72 : SEAT;
      const ear = opts.cap ? 0.38 : 0.32, slot = opts.cap ? 0.60 : 0.60;
      const lowerH = opts.cap ? 0.48 : 0.27;
      frustum(g, w, d, 0.77, 0, lowerH, "block", opts.slope || 0);
      box(g, w, seat - lowerH, d, 0, lowerH + (seat - lowerH) / 2, 0, "block");
      if (opts.ears === 2) {
        if (opts.axis === "z") {
          const rw = (w - slot) / 2;
          for (const s of [-1,1]) box(g, rw, ear, d, s * (slot / 2 + rw / 2), seat + ear / 2, 0, "block");
        } else {
          const rd = (d - slot) / 2;
          for (const s of [-1,1]) box(g, w, ear, rd, 0, seat + ear / 2, s * (slot / 2 + rd / 2), "block");
        }
      } else {
        const rw = (w - slot) / 2, rd = (d - slot) / 2;
        for (const x of [-1,1]) for (const z of [-1,1])
          box(g, rw, ear, rd, x * (slot / 2 + rw / 2), seat + ear / 2, z * (slot / 2 + rd / 2), "block");
      }
      // Short fibres follow each block's exposed lower face.
      for (const x of [-0.38, -0.17, 0.16, 0.37])
        line(g, [[x * w, lowerH * 0.31, d * 0.425], [x * w * 1.02, lowerH * 0.79, d * 0.48]]);
      g.userData.labelOffset = [0, seat + ear, 0];
      return g;
    }
    function endBlocks(prefix, y, z, span, stage, jump, centre = true) {
      for (const s of [-1, 1]) block(`${prefix}-sandou-${s < 0 ? "l" : "r"}`, "散斗", "end bearing block", [s * span, y, z], stage, jump,
        { ears: 2, axis: "x", w: 1.12, d: 1.0 });
      if (centre) block(`${prefix}-centre`, "齐心斗", "central bearing block", [0, y, z], stage, jump,
        { ears: 2, axis: "x", w: 1.14, d: 1.14 });
    }
    // A complete double-arm unit at one projection: its lower transverse arm
    // stands in the head block; its upper arm stands on two end blocks + centre.
    function doubleUnit(prefix, z, incomingY, stage, jump, opts = {}) {
      block(`${prefix}-jiaohu`, "交互斗", "cross-slot bearing block", [0, incomingY + H, z], stage, jump,
        { slope: opts.incomingSlope || 0 });
      const lowerY = incomingY + RISE;
      arm(`${prefix}-guazi`, "瓜子栱", "lower transverse arm", [0, lowerY, z], 5.0, "x", stage, jump);
      endBlocks(`${prefix}-lower`, lowerY + H, z, 2.04, stage, jump);
      const upperY = incomingY + COURSE;
      arm(`${prefix}-man`, "慢栱", "upper long transverse arm", [0, upperY, z], 7.2, "x", stage, jump,
        { topSlots: opts.cross ? [{ c: 0, w: W + 0.025, d: H / 2 + (opts.angled ? SLOPE * W / 2 : 0) }] : [] });
      // End blocks under the continuous facade-parallel tie keep the upper
      // bow ends legible and give the set its dense repeated bearing rhythm.
      endBlocks(`${prefix}-upper`, upperY + H, z, 3.12, stage, jump, false);
      squareBeam(`${prefix}-sufang`, "素方", "transverse tie", [0, upperY + RISE, z], 7.7, 0.50, 0.36, "x", stage, jump);
      return { lowerY, upperY };
    }
    function ang(id, cn, atHeadZ, headY, innerTail, supportZ, stage, jump) {
      const g = part(id, cn, "descending cantilever", "ang", [0, headY, 0], stage, jump);
      const lo = innerTail, hi = atHeadZ + 0.86;
      const baseline = u => SLOPE * (atHeadZ - u);
      const upper = u => baseline(u) + H;
      const lower = u => {
        const t = Math.max(0, (u - atHeadZ - 0.34) / 0.52);
        return baseline(u) + Math.min(0.66, t * t * 0.66);
      };
      const notches = [{ c: supportZ, w: W + 0.025, d: H / 2 }, { c: 0, w: W + 0.025, d: H / 2 }];
      const poly = profile(lo, hi, upper, lower, [], notches, 60);
      // Composite timber leaves real vertical square bores for the two 昂栓.
      // The outer cheeks are continuous; the narrow centre strip has gaps at
      // the pin positions. This avoids putting an opaque pin through a solid.
      const boreWidth = 0.16, cheekWidth = (W - boreWidth) / 2;
      for (const s of [-1, 1]) {
        const cheek = new T.Group();
        cheek.position.x = s * (W + boreWidth) / 4;
        g.add(cheek);
        prism(cheek, poly, cheekWidth, "z", "ang", false);
      }
      const bores = [2 * J - 0.20, 2 * J + 0.20];
      const ranges = [[lo, bores[0] - boreWidth / 2],
        [bores[0] + boreWidth / 2, bores[1] - boreWidth / 2],
        [bores[1] + boreWidth / 2, hi]];
      for (const [a, b] of ranges) {
        if (b <= a) continue;
        prism(g, profile(a, b, upper, lower, [], notches, 28), boreWidth, "z", "ang", false);
      }
      // Fibres trace the rising tail and descending pointed face.
      for (const side of [-1, 1]) for (const f of [0.57, 0.76]) {
        const points = [];
        for (let n = 0; n <= 46; n++) {
          const u = lo + (hi - lo - 0.12) * n / 46;
          const y = baseline(u) + H * f + Math.sin(n * 0.4 + f * 8) * 0.012;
          if (inside(poly, u, y)) points.push(mapProfile(u, y, side * (W / 2 + 0.003), "z"));
        }
        line(g, points);
      }
      g.userData.labelOffset = [0, H * 0.8, atHeadZ];
      return g;
    }
    function terminal(prefix, z, incomingY, stage, jump, opts = {}) {
      const y = incomingY + RISE;
      block(`${prefix}-head-block`, "交互斗", "terminal cross-slot block", [0, incomingY + H, z], stage, jump,
        { slope: opts.slope || 0 });
      arm(`${prefix}-ling`, "令栱", "terminal transverse arm", [0, y, z], 6.15, "x", stage, jump,
        { topSlots: [{ c: 0, w: W + 0.025, d: H / 2 }] });
      const direction = opts.inner ? -1 : 1;
      const head = arm(`${prefix}-shuatou`, "耍头", "projecting beam head", [0, y, z], 5.0, "z", stage, jump,
        { lo: -3.55, hi: 1.45, bottomSlots: [{ c: 0, w: W + 0.025, d: H / 2 }] });
      if (direction < 0) head.rotation.y = Math.PI;
      endBlocks(`${prefix}-cap`, y + H, z, 2.58, 11, jump);
      const capY = y + RISE;
      const cross = opts.inner ? "平棋方" : "橑檐方";
      squareBeam(`${prefix}-eave`, cross, opts.inner ? "inner ceiling tie" : "eave-support beam", [0, capY, z], opts.inner ? 8.0 : 9.8, 0.62, 0.55, "x", 11, jump,
        { top: [{ c: 0, w: 0.60, d: 0.275 }] });
      const liner = squareBeam(`${prefix}-chenfangtou`, "衬方头", "upper packing head", [0, capY, z], opts.inner ? 3.6 : 4.4, 0.56, 0.55, "z", 11, jump,
        { bottom: [{ c: 0, w: 0.645, d: 0.275 }] });
      // Rear caps point into the room; this shorter upper member leaves the
      // angled tails visible and clear of the separate inner terminal stack.
      if (direction < 0) liner.rotation.y = Math.PI;
      return { y, capY };
    }

    // The small yellow piece indicates the bearing surface below this isolated
    // intercolumn set. It is deliberately not labelled a column or 普拍枋.
    const bearing = part("bearing-context", "承座示意", "schematic bearing surface", "base", [0, 0, 0], 0);
    box(bearing, 3.1, 0.24, 2.7, 0, 0.12, 0, "base");
    for (const z of [-0.9, -0.35, 0.35, 0.9]) line(bearing, [[-1.42,0.243,z],[-0.4,0.243,z+0.02],[0.6,0.243,z-0.015],[1.42,0.243,z]]);
    block("ludou", "栌斗", "principal bearing block", [0, 0.24, 0], 0, 0,
      { cap: true, w: 2.22, d: 2.22 });

    arm("nidaogong", "泥道栱", "arm across the bearing block", [0, B0, 0], 6.0, "x", 1, 0,
      { topSlots: [{ c: 0, w: W + 0.025, d: H / 2 }] });
    arm("huagong-first", "第一抄华栱", "first projecting arm", [0, B0, 0], 2 * J + 1.35, "z", 1, 1,
      { bottomSlots: [{ c: 0, w: W + 0.025, d: H / 2 }] });

    endBlocks("wall-first", B0 + H, 0, 2.5, 2, 0);
    arm("wall-first-mangong", "壁内慢栱", "long arm at the central plane", [0, B0 + RISE, 0], 7.5, "x", 3, 0);
    block("wall-huagong-second-seat", "齐心斗", "central arm seat", [0, B0 + RISE + H, 0], 3, 0,
      { ears: 2, axis: "z" });

    doubleUnit("outer-first", J, B0, 3, 1, { cross: true });
    doubleUnit("inner-first", -J, B0, 3, -1, { cross: true });
    arm("huagong-second", "第二抄华栱", "second projecting arm", [0, B2, 0], 4 * J + 1.35, "z", 3, 2,
      { bottomSlots: [ -J, J ].map(c => ({ c, w: W + 0.025, d: H / 2 })) });

    doubleUnit("outer-second", 2 * J, B2, 4, 2, { cross: true, angled: true });
    doubleUnit("inner-second", -2 * J, B2, 4, -2, { cross: true });
    // The inner branch ends after three level 卷头 projections.
    arm("huagong-inner-third", "里转第三抄华栱", "third inner projecting arm", [0, B3I, 0], 3 * J + 1.3, "z", 4, -3,
      { lo: -3 * J - 0.65, hi: 0.65, rootAtHi: true,
        bottomSlots: [ -2 * J, 0 ].map(c => ({ c, w: W + 0.025, d: H / 2 })) });

    // The central plane receives the three angled members in successively
    // higher cross slots. These members are distinct from the inner branch.
    function wallUnit(prefix, incomingY, stage, crossAng = false, upperCross = false) {
      block(`${prefix}-seat`, "齐心斗", "central bearing block", [0, incomingY + H, 0], stage, 0,
        { ears: 2, axis: "x" });
      const lowerY = incomingY + RISE;
      arm(`${prefix}-guazi`, "壁内瓜子栱", "central lower transverse arm", [0, lowerY, 0], 5.0, "x", stage, 0,
        { topSlots: crossAng ? [{ c: 0, w: W + 0.025, d: H / 2 + SLOPE * W / 2 }] : [] });
      endBlocks(`${prefix}-lower`, lowerY + H, 0, 2.04, stage, 0);
      const upperY = incomingY + COURSE;
      arm(`${prefix}-man`, "壁内慢栱", "central upper long arm", [0, upperY, 0], 7.2, "x", stage, 0,
        { topSlots: upperCross ? [{ c: 0, w: W + 0.025, d: H / 2 }] : [] });
      return { lowerY, upperY };
    }
    wallUnit("wall-second", B2, 4, false, true);
    // This wall arm crosses the end of the inner third projecting arm.
    // Complementary slots are made on those two members as on all crossings.
    const innerThird = parts.find(p => p.id === "huagong-inner-third");
    // Its end stops just beyond the middle plane; the wall unit bears it below.
    innerThird.group.userData.joinery = "rear support at the second inner jump";

    wallUnit("wall-third", B3I, 5, true);
    wallUnit("wall-fourth", B3I + COURSE, 7, true);

    // A short shaped support beneath the first angled member identifies the
    // 华头子 without creating a spurious extra horizontal outward jump.
    const huaHead = part("huatouzi", "华头子", "support under first descending cantilever", "arm", [0, B2 + COURSE, 2 * J], 5, 2);
    prism(huaHead, [[0.57,-0.50],[0.57,-SLOPE*0.57],[0.83,-SLOPE*0.83],[1.17,-SLOPE*1.17],
      [1.20,-0.34],[1.02,-0.40],[0.85,-0.45],[0.72,-0.50]], W, "z", "arm");
    // The first cantilever rests on the second-jump upper cross arm. Its two
    // following cantilevers use the same joint family one projection further.
    ang("ang-first", "第一下昂", 3 * J, ANG1, -4.35, 2 * J, 5, 3);
    doubleUnit("outer-third", 3 * J, ANG1, 6, 3, { incomingSlope: SLOPE, cross: true, angled: true });
    ang("ang-second", "第二下昂", 4 * J, ANG2, -3.25, 3 * J, 7, 4);
    doubleUnit("outer-fourth", 4 * J, ANG2, 8, 4, { incomingSlope: SLOPE, cross: true, angled: true });
    ang("ang-third", "第三下昂", 5 * J, ANG3, -1.8, 4 * J, 9, 5);

    terminal("outer-terminal", 5 * J, ANG3, 10, 5, { slope: SLOPE });
    terminal("inner-terminal", -3 * J, B3I, 10, -3, { inner: true });

    // Final central crossing: third angled member + a transverse 令栱. The
    // centre block beneath it belongs to the central wall stack, not a column.
    const wallTopIncoming = B3I + COURSE * 2;
    block("wall-terminal-seat", "齐心斗", "upper central bearing seat", [0, wallTopIncoming + H, 0], 9, 0,
      { ears: 2, axis: "x" });
    const centralY = wallTopIncoming + RISE;
    arm("wall-terminal-ling", "壁内令栱", "upper central transverse arm", [0, centralY, 0], 6.15, "x", 9, 0,
      { topSlots: [{ c: 0, w: W + 0.025, d: H / 2 + SLOPE * W / 2 }] });
    endBlocks("wall-terminal", centralY + H, 0, 2.58, 11, 0);
    squareBeam("wall-terminal-tie", "壁内素方", "upper central tie", [0, centralY + RISE, 0], 9.0, 0.62, 0.55, "x", 11, 0);

    // Dark, slim pins explain that the three long members form one assembly.
    // They are placed to the side of the main viewing face and do not become
    // a fourth 昂 or an additional projection in the animation.
    for (const [i, z] of [[1, 2 * J - 0.20], [2, 2 * J + 0.20]]) {
      const yBottom = ANG1 + SLOPE * (3 * J - z) + H * 0.62;
      const yTop = ANG3 + SLOPE * (5 * J - z) + H + 0.12;
      const pin = part(`ang-shuan-${i}`, "昂栓示意", "cantilever linking pin (schematic)", "base", [0, yBottom, z], 11, 2);
      box(pin, 0.14, yTop - yBottom, 0.14, 0, (yTop - yBottom) / 2, 0, "base");
      pin.userData.joinery = "square pin in composite-model bores; unmeasured explanatory joinery";
    }

    root.userData = {
      title: "八铺作双抄三下昂 · 里转六铺作三抄 · 重栱计心补间铺作",
      axes: "+Y up; +Z eave; X facade", educational: true
    };
    return {
      root, parts, stages,
      info: {
        title: "宋式八铺作斗栱", subtitle: "双抄三下昂 · 里转六铺作三抄 · 重栱计心补间铺作",
        classification: "补间铺作", outerJumps: 5, innerJumps: 3,
        outerProjectingArms: 2, descendingCantilevers: 3, innerProjectingArms: 3,
        measured: false, units: "relative explanatory proportions", palette,
        sourceVideo: "https://www.bilibili.com/video/BV1WX4y127Pq/",
        sourceVideos: ["https://www.bilibili.com/video/BV1Kg1TYJEDd/", "https://www.bilibili.com/video/BV1WX4y127Pq/"],
        sourceText: "https://zh.wikisource.org/zh-hans/營造法式/第四卷",
        limitations: "Original unmeasured teaching model. The animation shows support dependencies, not a documented historic erection sequence. No roof framing or column is reconstructed."
      }
    };
  };
})();
