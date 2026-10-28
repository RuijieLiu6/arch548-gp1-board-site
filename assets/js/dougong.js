/* A Song eight-puzuo bracket set (宋式八铺作斗栱) that unpacks and goes back
   together, beside the Yingxian Pagoda (slide 5). The 111-part model is
   Astra 6's original, unmeasured teaching geometry (figures/astra/
   dougong-bapuzuo-model.js), after the Yingzao Fashi and two Bilibili
   assembly studies; it is not the printed MakerWorld model. Parts lift off
   top tier first and return bottom tier first, in the order Astra's viewer
   uses. The slide's sentence steps drive it: 0 assembled, 1 unpacked,
   2 together again. Drag to turn. Works from disk: three.js r149 as a plain
   script, no modules. */
(() => {
  const host = document.getElementById("dougong");
  if (!host || !window.THREE || !window.createBapuzuoModel) return;
  const T3 = window.THREE, slide = host.closest(".slide"), canvas = host.querySelector("canvas"), tags = host.querySelector(".dg-labels");
  const still = matchMedia("(prefers-reduced-motion: reduce)").matches;

  const renderer = new T3.WebGLRenderer({ canvas, antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  renderer.setClearColor(0x0b0e14, 0);
  const scene = new T3.Scene();
  scene.add(new T3.HemisphereLight(0xfff4de, 0x39475c, 0.85));
  const key = new T3.DirectionalLight(0xfff4de, 1.0);
  key.position.set(90, 160, 110);
  const rim = new T3.DirectionalLight(0xc5dcff, 0.38);
  rim.position.set(-100, 60, -80);
  scene.add(key, rim);

  // the model, turned on a pivot at the centre of its footprint
  const data = window.createBapuzuoModel(T3), parts = data.parts;
  const pivot = new T3.Group();
  scene.add(pivot);
  pivot.add(data.root);

  // explode by structural tier, fanned outward by jump (after Astra's viewer, a little tighter)
  const within = new Map();
  const moving = parts.map((q, i) => ({ q, i })).filter(({ q }) => q.stage > 0).sort((a, b) => a.q.stage - b.q.stage || a.i - b.i);
  moving.forEach(({ q }, rank) => { q.releaseOrder = moving.length - 1 - rank; });
  parts.forEach((q) => {
    q.home = (q.home || q.group.position).clone();
    const w = within.get(q.stage) || 0;
    within.set(q.stage, w + 1);
    // one tier per stage, with at most four sub-steps inside a tier, so 54 small blocks do not make a tower
    q.off = q.stage === 0 ? new T3.Vector3() : new T3.Vector3(q.home.x * 0.3, (q.stage + 1) * 3.2 + (w % 4) * 0.6, Math.sign(q.home.z) * Math.abs(q.jump || 0) * 2.8);
    q.t = 0;
  });
  const clamp = (x) => Math.max(0, Math.min(1, x)), smooth = (x) => x * x * (3 - 2 * x), SPAN = 4.5;
  const localT = (q, p) => (q.stage === 0 ? 0 : smooth(clamp((p * (moving.length + SPAN - 1) - q.releaseOrder) / SPAN)));
  function apply(p) {
    parts.forEach((q) => { q.t = localT(q, p); q.group.position.copy(q.home).addScaledVector(q.off, q.t); });
  }

  // framing: fit the parts where they are, every frame, so nothing leaves the frame while it unpacks
  apply(0);
  data.root.updateMatrixWorld(true);
  const all = new T3.Box3().setFromObject(data.root), c0 = all.getCenter(new T3.Vector3());
  data.root.position.set(-c0.x, 0, -c0.z);
  parts.forEach((q) => {
    const b = new T3.Box3().setFromObject(q.group);
    q.lo = b.min.clone().sub(q.home); q.hi = b.max.clone().sub(q.home);
  });
  const cam = new T3.OrthographicCamera(-1, 1, 1, -1, -500, 500);
  const camDir = new T3.Vector3(Math.cos(Math.PI / 6) * Math.sin(Math.PI / 4), Math.sin(Math.PI / 6), Math.cos(Math.PI / 6) * Math.cos(Math.PI / 4));
  cam.position.copy(camDir).multiplyScalar(200);
  cam.lookAt(0, 0, 0);
  cam.updateMatrixWorld(true);
  const R = new T3.Vector3().setFromMatrixColumn(cam.matrixWorld, 0), U = new T3.Vector3().setFromMatrixColumn(cam.matrixWorld, 1);
  let aspect = 1, view = null;
  const p3 = new T3.Vector3();
  function frame(dt) {
    let r0 = Infinity, r1 = -Infinity, u0 = Infinity, u1 = -Infinity;
    const cs = Math.cos(pivot.rotation.y), sn = Math.sin(pivot.rotation.y);
    parts.forEach((q) => {
      for (const x of [q.lo.x, q.hi.x]) for (const y of [q.lo.y, q.hi.y]) for (const z of [q.lo.z, q.hi.z]) {
        const px = q.group.position.x + x - c0.x, py = q.group.position.y + y, pz = q.group.position.z + z - c0.z;
        p3.set(px * cs + pz * sn, py, -px * sn + pz * cs);
        const a = p3.dot(R), b = p3.dot(U);
        if (a < r0) r0 = a; if (a > r1) r1 = a; if (b < u0) u0 = b; if (b > u1) u1 = b;
      }
    });
    let hh = Math.max((u1 - u0) / 2, (r1 - r0) / 2 / aspect) * 1.1;
    const goal = { cr: (r0 + r1) / 2, cu: (u0 + u1) / 2, hh, half: (r1 - r0) / 2 };
    if (!view || !dt) view = goal;
    else { const k = Math.min(1, dt * 5); for (const key in goal) view[key] += (goal[key] - view[key]) * k; }
    const t = R.clone().multiplyScalar(view.cr).addScaledVector(U, view.cu);
    cam.position.copy(camDir).multiplyScalar(200).add(t);
    cam.left = -view.hh * aspect; cam.right = view.hh * aspect; cam.top = view.hh; cam.bottom = -view.hh;
    cam.updateProjectionMatrix();
    cam.updateMatrixWorld(true);
  }
  function size() {
    const w = host.clientWidth, h = host.clientHeight;
    if (!w || !h) return;
    renderer.setSize(w, h, false);
    aspect = w / h;
  }
  new ResizeObserver(size).observe(host);
  size();

  // labels for the members the script names; shown while the set is apart
  // one label per tier, so labels never stack on each other
  const LABELS = [
    ["ludou", "栌斗", "cap block"], ["huagong-first", "华栱", "projecting arm"], ["outer-first-guazi", "瓜子栱", "short arm"],
    ["ang-second", "下昂", "descending cantilever ×3"], ["outer-terminal-shuatou", "耍头", "beam head"], ["outer-terminal-eave", "橑檐方", "eave beam"],
  ];
  const NS = "http://www.w3.org/2000/svg", leaders = document.createElementNS(NS, "svg");
  leaders.setAttribute("class", "dg-leaders");
  tags.appendChild(leaders);
  const labelled = LABELS.map(([id, cn, en]) => {
    const q = parts.find((x) => x.id === id);
    if (!q) return null;
    const d = document.createElement("div");
    d.className = "dg-tag";
    d.innerHTML = `<b>${cn}</b> ${en}`;
    tags.appendChild(d);
    q.box = new T3.Box3().setFromObject(q.group);
    q.centre = q.box.getCenter(new T3.Vector3()).sub(q.group.position);
    const lead = document.createElementNS(NS, "path");
    leaders.appendChild(lead);
    return [q, d, lead];
  }).filter(Boolean);

  // state: unpacked progress, tweened by GSAP
  const state = { p: 0 };
  let tl = null;
  function go(apart) {
    if (tl) tl.kill();
    tl = gsap.to(state, { p: apart ? 1 : 0, duration: still ? 0 : 6.5, ease: "none" });
  }

  // drag to turn; a slow drift otherwise
  let spin = 0, drag = null;
  const drift = still ? 0 : 0.05;
  canvas.addEventListener("pointerdown", (e) => { drag = e.clientX; canvas.setPointerCapture(e.pointerId); });
  canvas.addEventListener("pointermove", (e) => { if (drag == null) return; spin += (e.clientX - drag) * 0.01; drag = e.clientX; });
  canvas.addEventListener("pointerup", () => { drag = null; });

  const v = new T3.Vector3();
  let last = performance.now();
  function tick(now) {
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    if (drag == null) spin += drift * dt;
    pivot.rotation.y = spin;
    apply(state.p);
    frame(dt);
    renderer.render(scene, cam);
    // labels in a column right of the set, in the order of their parts, with leaders
    const r = canvas.getBoundingClientRect(), hr = host.getBoundingClientRect(), ox = r.left - hr.left, oy = r.top - hr.top;
    const show = state.p > 0.75 ? Math.min(1, (state.p - 0.75) / 0.2) : 0;
    leaders.style.opacity = String(show);
    const marks = labelled.map(([q, d, lead]) => {
      v.copy(q.centre).add(q.group.position);
      q.group.parent.localToWorld(v).project(cam);
      return { d, lead, x: (v.x * 0.5 + 0.5) * r.width + ox, y: (-v.y * 0.5 + 0.5) * r.height + oy };
    }).sort((a, b) => a.y - b.y);
    const colX = Math.min(r.width - 230, r.width / 2 + (view.half / (view.hh * aspect)) * (r.width / 2) + 36) + ox;
    let lastY = -Infinity;
    marks.forEach((m) => {
      const y = Math.max(m.y, lastY + 26);
      lastY = y;
      m.d.style.transform = `translate(${colX}px, ${y}px)`;
      m.d.style.opacity = String(show);
      m.lead.setAttribute("d", `M${m.x},${m.y}L${colX - 22},${y}L${colX - 6},${y}`);
    });
  }

  // render only while the slide is on screen
  new IntersectionObserver((es) => es.forEach((e) => renderer.setAnimationLoop(e.isIntersecting ? tick : null)), { threshold: 0.05 }).observe(host);
  slide.addEventListener("step", (e) => go(e.detail === 1));
  window.DOUGONG = { go, parts: parts.length };
})();
