/**
 * Wall: a wall panel taken from a Vancouver house, lying on dunnage at the
 * hub, in five layers from the room side up: gypsum, the stud frame with its
 * batts, plywood sheathing nailed along the studs, building wrap, and lap
 * cladding on battens. Pointer x pulls the layers apart; y picks one, which
 * lifts and carries the layers above it. The read-out names the layer with
 * its indicative service life (CMHC 2025 materials guide; no published figure
 * for the frame). At rest the cladding is already lifting: the outer layer is
 * the first to change. The slider is the widest gap, in world units.
 *
 * The pattern: scrub and pick. One spring per layer for the gap, a tween per
 * layer for the lift, a pick read from the target pose, painted bottom to top.
 */
const {
  Cam, clamp, facing, fit, prism, proj, rings, seg, spring, stepS,
  tween, tset, tval, tdone, mk, place, pointer, put, register, disposer, solid,
} = HL;

const L = 96, D = 52, SW = 2.4, PL = 3, LIFT = 7, TOP = 4;
const NAMES = ["gypsum 40y", "frame n/a", "plywood 60y", "wrap 30y", "cladding 60y"];
const T = [1.6, 3.6, 1.2, 0.6, 2.8];
const REST = [0, 0, 1.6, 3.8, 11];
const BASE = T.map((_, i) => T.slice(0, i).reduce((a, b) => a + b, 0));
const STUD = Array.from({ length: 11 }, (_, i) => SW / 2 + (i * (L - SW)) / 10);

/** Every layer as solids {ring, inner, z0, z1}, lines [[x,y,z],[x,y,z]] and dots [x,y,z], relative to its base. */
function layers() {
  const slab = (x0, y0, x1, y1, r, b, z0, z1) => { const [ring, inner] = rings(x0, y0, x1, y1, r, b); return { ring, inner, z0, z1 }; };
  const out = [];
  // 0 gypsum: two sheets, one taped joint across the studs
  out.push({ solids: [slab(0, 0, L, D, 1.4, 0.8, 0, T[0])], lines: [[[L / 2, 0, T[0]], [L / 2, D, T[0]]]], dots: [] });
  // 1 frame: far plate, studs with batts between them, near plate
  const fr = [slab(0, 0, L, PL, 0.8, 0.5, 0, T[1])];
  STUD.forEach((c, i) => {
    fr.push(slab(c - SW / 2, PL, c + SW / 2, D - PL, 0.6, 0.4, 0, T[1]));
    if (i < STUD.length - 1) fr.push(slab(c + SW / 2 + 0.35, PL + 0.35, STUD[i + 1] - SW / 2 - 0.35, D - PL - 0.35, 1.6, 0.9, 0.2, T[1] - 0.5));
  });
  fr.push(slab(0, D - PL, L, D, 0.8, 0.5, 0, T[1]));
  out.push({ solids: fr, lines: [], dots: [] });
  // 2 plywood: two sheets, nailed along every stud
  const nails = [];
  STUD.forEach((c) => { for (let y = 5; y < D - 2; y += 8.4) nails.push([c, y, T[2]]); });
  out.push({ solids: [slab(0, 0, L, D, 1.2, 0.8, 0, T[2])], lines: [[[L / 2, 0, T[2]], [L / 2, D, T[2]]]], dots: nails });
  // 3 wrap: a thin sheet with one lap along its length
  out.push({ solids: [slab(-0.6, -0.6, L + 0.6, D + 0.6, 1.2, 0.5, 0, T[3])], lines: [[[-0.6, D * 0.42, T[3]], [L + 0.6, D * 0.42, T[3]]]], dots: [] });
  // 4 cladding: battens over the studs, then lap boards that overhang them
  const cl = STUD.map((c) => slab(c - 1, 0, c + 1, D, 0.5, 0.3, 0, 1));
  cl.push(slab(-1.5, -1.5, L + 1.5, D + 1.5, 1.2, 0.7, 1, T[4]));
  const laps = [];
  for (let j = 1; j < 8; j++) laps.push([[-1.5, -1.5 + (j * (D + 3)) / 8, T[4]], [L + 1.5, -1.5 + (j * (D + 3)) / 8, T[4]]]);
  out.push({ solids: cl, lines: laps, dots: [] });
  return out;
}

function mount({ stage, svg, read }, value) {
  const bag = disposer();
  let gmax = value, over = null, act = -2;

  const zMax = BASE[4] + T[4] + 4 * 18 + LIFT;
  const C = Cam(45, 0.5, 2.32);
  fit(C, [[-2, -6, -5], [L + 2, D + 6, -5], [L + 2, -6, -5], [-2, D + 6, -5], [-2, -6, zMax], [L + 2, D + 2, zMax]], 200, 166);
  const P = proj(C), front = facing(C);
  const g = mk("g", {}, svg);

  // dunnage: three timber blocks under the panel, which never move
  for (const x0 of [6, 45, 84]) { const [ring, inner] = rings(x0, -5, x0 + 6, D + 5, 1, 0.6); put(solid(g), prism(P, front, ring, inner, -5, 0)); }

  // Bottom to top, and within a layer far to near, so appending is painting.
  const LAY = layers().map((ly, k) => {
    const grp = mk("g", {}, g);
    return {
      ...ly,
      els: ly.solids.map(() => solid(grp)),
      lp: ly.lines.length ? mk("path", { class: "nf lo" }, grp) : null,
      dp: ly.dots.map(() => mk("circle", { r: 0.9, class: "dot off" }, grp)),
      sp: spring(REST[k], { eps: 0.02 }), lift: tween(0), drawn: NaN,
    };
  });

  /** Layer k's height off the dunnage: its base, its share of the gap, and every lift at or below it. */
  const zOf = (k, now) => BASE[k] + LAY[k].sp.x + LAY.slice(0, k + 1).reduce((a, l) => a + tval(l.lift, now), 0);

  // A layer whose height hasn't changed keeps its paths.
  function drawLayer(ly, z) {
    if (z === ly.drawn) return;
    ly.drawn = z;
    ly.solids.forEach((s, i) => put(ly.els[i], prism(P, front, s.ring, s.inner, z + s.z0, z + s.z1)));
    if (ly.lp) ly.lp.setAttribute("d", ly.lines.map(([a, b]) => seg(P(a[0], a[1], z + a[2]), P(b[0], b[1], z + b[2]))).join(""));
    ly.dp.forEach((el, i) => { const [x, y, dz] = ly.dots[i]; place(el, P(x, y, z + dz)); });
  }

  const B = register(stage, (dt, now) => {
    let m = false;
    LAY.forEach((ly, k) => { if (stepS(ly.sp, dt)) m = true; if (!tdone(ly.lift, now)) m = true; drawLayer(ly, zOf(k, now)); });
    return m;
  });
  bag.add(B.unregister);

  /** The gap the pointer's x asks for: none at the left, the slider's widest at the right. */
  const gapAt = (sx) => gmax * clamp((sx - 110) / 190, 0, 1);
  /** The layer nearest the pointer's y, read from the target pose without lifts, so a lift can't move the pick. */
  function pick([sx, sy]) {
    const gp = gapAt(sx);
    let best = 0, bd = Infinity;
    LAY.forEach((ly, k) => { const d = Math.abs(sy - P(L / 2, D / 2, BASE[k] + k * gp + T[k] / 2)[1]); if (d < bd) { bd = d; best = k; } });
    return best;
  }

  function setActive(a) {
    if (a === act) return;
    const now = performance.now(), from = a >= 0 ? a : Math.max(act, 0);
    act = a;
    LAY.forEach((ly, k) => {
      tset(ly.lift, k === a ? LIFT : 0, now, Math.abs(k - from) * 40);
      const lit = a < 0 ? k === TOP : k === a;
      ly.els.forEach((el) => el.sil.classList.toggle("hi", lit));
    });
    read.textContent = a < 0 ? "rest" : NAMES[a];
  }

  function retarget() {
    const gp = over ? gapAt(over[0]) : 0;
    LAY.forEach((ly, k) => { ly.sp.t = over ? k * gp : REST[k]; });
    setActive(over ? pick(over) : -1);
    B.wake();
  }

  setActive(-1);
  bag.add(pointer(stage, { move: (p) => { over = p; retarget(); }, leave: () => { over = null; retarget(); } }));
  bag.add(() => svg.replaceChildren());

  return {
    set: (v) => { gmax = v; retarget(); },
    destroy: bag.dispose,
  };
}

hairline({
  name: "wall",
  means: "A salvaged wall panel comes apart in its layers; each layer wears out on its own clock.",
  rules: [1, 5, 6, 9],
  range: [6, 12, 18],
  tour: [[150, 120], [250, 175], [300, 235], null],
  mount,
});
