/* Print 2: every City of Vancouver demolition permit, 2017 to 2026.
   Map from assets/data/map.js; flows and tallies from prints/data.js
   (build/print_data.py). Counts read from permit text are a floor. */
(async () => {
  const { el, T, para, wrap, measure, rect, line, sCurve, sheet, frame, ready, C, INK, MUTED, RULE } = window.KIT;
  await ready();
  const M = window.MAP, D = window.PRINT, R = window.HUBREACH;
  const fmt = (n) => n.toLocaleString("en-CA");
  const TIER = { "none stated": "#9A9EAB", "75%": "#E58CB0", "90%": C.magenta };
  const s = sheet();
  frame(s, { foot: "Source: City of Vancouver Open Data, issued building permits typed “Demolition / Deconstruction”, fetched 24 Oct 2026; 7,154 of 7,168 have a location. Requirement and method are read from each permit's description, so they are a floor, not a census. Analysis and drawing: R. Liu.", no: "Print 2 of 5" });

  T(s, 50, 140, "Every demolition permit", 58, { weight: 300, ls: -1.2 });
  para(s, 50, 178, `City of Vancouver, ${D.first.slice(0, 4)} to ${D.last.slice(0, 4)}: ${fmt(D.total)} issued permits to take a building down, each read for what came down, what it was asked to recycle, and how it was to be taken down.`, 560, 15, { fill: MUTED });
  const sum = (f) => D.flows.filter(f).reduce((a, r) => a + r[3], 0);
  const stats = [[fmt(D.total), "permits since January 2017"], [fmt(sum((r) => r[0] === "one-family house")), "for one-family houses"], [fmt(sum((r) => r[2] === "by means of deconstruction")), "name deconstruction as the method"]];
  stats.forEach(([n, l], i) => {
    const x = 650 + i * 136;
    T(s, x, 150, n, 34, { weight: 300 });
    para(s, x, 172, l, 124, 11, { fill: MUTED });
  });

  /* the map ---------------------------------------------------------------- */
  const k = 0.86, MX = 550 - (M.w * k) / 2, MY = 250;
  const map = el("g", { transform: `translate(${MX},${MY}) scale(${k})` }, s);
  D.areas.forEach((a) => el("path", { d: a.d, fill: "#ECE7DD", stroke: "#B9B2A6", "stroke-width": 0.8 }, map));
  const order = [0, 1, 2];
  order.forEach((tier) => {
    const g = el("g", { fill: Object.values(TIER)[tier] }, map);
    for (let i = 0; i < M.pts.length; i += 4) if (M.pts[i + 3] === tier) el("circle", { cx: M.pts[i], cy: M.pts[i + 1], r: tier === 2 ? 2.4 : 2 }, g);
  });
  const lab = el("g", {}, map);
  [...map.querySelectorAll("path")].forEach((p, i) => {
    const b = p.getBBox(), name = D.areas[i].name;
    if (b.width < 40) return;
    T(lab, b.x + b.width / 2, b.y + b.height / 2, name, 10.5 / k, { anchor: "middle", fill: INK, opacity: 0.55 });
  });
  const r = M.kmUnits * 1.5;
  // the six rule-based hub sites of print 4 (build/hub_siting.py), so both sheets show the same rings
  (window.SITING ? window.SITING.hubs : M.hubs).forEach((h) => {
    el("circle", { cx: h.x, cy: h.y, r, fill: "none", stroke: C.orange, "stroke-width": 1.6 / k, "stroke-dasharray": "6 5" }, map);
    if (h.order) { el("circle", { cx: h.x, cy: h.y, r: 9 / k, fill: C.orange }, map); T(map, h.x, h.y + 4.5 / k, String(h.order), 11 / k, { anchor: "middle", weight: 700, fill: "#FFFFFF" }); }
  });
  // legend and scale
  const LG = [["no requirement stated", TIER["none stated"]], ["75% by weight stated", TIER["75%"]], ["90% stated (character houses)", TIER["90%"]], ["hub site and 1.5 km ring (print 4)", C.orange]];
  LG.forEach(([t, col], i) => {
    const y = MY + 14 + i * 18;
    if (i < 3) el("circle", { cx: 58, cy: y - 4, r: 5, fill: col }, s);
    else el("circle", { cx: 58, cy: y - 4, r: 6, fill: "none", stroke: col, "stroke-width": 1.6, "stroke-dasharray": "3 2" }, s);
    T(s, 70, y, t, 11);
  });
  const sk = M.kmUnits * k;
  line(s, [[MX + 20, MY + M.h * k - 14], [MX + 20 + 2 * sk, MY + M.h * k - 14]], { sw: 2 });
  T(s, MX + 20, MY + M.h * k - 20, "0", 9, { fill: MUTED }); T(s, MX + 20 + 2 * sk, MY + M.h * k - 20, "2 km", 9, { fill: MUTED, anchor: "middle" });

  /* the flow: what came down, what it was asked to recycle, how ------------- */
  const FY = 968, FH = 290;
  T(s, 50, FY - 40, "From permit to method", 20, { weight: 600 });
  T(s, 50 + measure("From permit to method", 20, 600) + 12, FY - 40, "band width = number of permits", 11.5, { fill: MUTED });
  const kinds = [...new Set(D.flows.map((f) => f[0]))].sort((a, b) => sum((r) => r[0] === b) - sum((r) => r[0] === a));
  const tiers = ["none stated", "75%", "90%"], meths = ["by means of deconstruction", "method not stated"];
  const COLX = [50, 330, 640, 880], NW = 12, GAP = 7;
  const scaleY = (FH - GAP * (kinds.length - 1)) / D.total;
  const place = (names, total, val) => {
    const gaps = GAP * (names.length - 1), k2 = (FH - gaps) / total;
    let y = FY;
    return Object.fromEntries(names.map((n) => { const h = val(n) * k2; const o = { y, h, out: y, in: y }; y += h + GAP; return [n, o]; }));
  };
  const allN = { all: { y: FY, h: D.total * ((FH - GAP * 0) / D.total), out: FY, in: FY } };
  const kN = place(kinds, D.total, (n) => sum((r) => r[0] === n));
  const tN = place(tiers, D.total, (n) => sum((r) => r[1] === n));
  const mN = place(meths, D.total, (n) => sum((r) => r[2] === n));
  const k2 = (FH - GAP * (kinds.length - 1)) / D.total;
  const band = (x0, a, x1, b, v, col, op) => {
    const h = v * k2;
    const y0 = a.out, y1 = b.in;
    a.out += h; b.in += h;
    el("path", { d: `${sCurve(x0, y0, x1, y1)}L${x1},${y1 + h}${sCurve(x1, y1 + h, x0, y0 + h).replace(/^M[^C]+/, "")}Z`, fill: col, "fill-opacity": op }, s);
  };
  const links = el("g", {}, s);
  kinds.forEach((kd) => band(COLX[0] + NW, allN.all, COLX[1], kN[kd], sum((r) => r[0] === kd), INK, 0.12));
  kinds.forEach((kd) => tiers.forEach((t) => { const v = sum((r) => r[0] === kd && r[1] === t); if (v) band(COLX[1] + NW, kN[kd], COLX[2], tN[t], v, TIER[t], 0.55); }));
  tiers.forEach((t) => meths.forEach((m) => { const v = sum((r) => r[1] === t && r[2] === m); if (v) band(COLX[2] + NW, tN[t], COLX[3], mN[m], v, TIER[t], 0.55); }));
  const node = (x, o, label, n, col, right = true) => {
    rect(s, x, o.y, NW, Math.max(o.h, 1.5), { fill: col, r: 2 });
    const lx = right ? x + NW + 8 : x - 8, anchor = right ? "start" : "end";
    if (o.h < 30) {
      const t = T(s, lx, o.y + o.h / 2 + 4, label, 11, { weight: 600, anchor });
      T(s, lx + measure(label, 11, 600) + 6, o.y + o.h / 2 + 4, fmt(n), 10.5, { fill: MUTED });
      return t;
    }
    T(s, lx, o.y + Math.min(o.h / 2, 30) + 4, label, 11.5, { weight: 600, anchor });
    T(s, lx, o.y + Math.min(o.h / 2, 30) + 17, fmt(n), 10.5, { fill: MUTED, anchor });
  };
  node(COLX[0], allN.all, "All permits", D.total, INK);
  kinds.forEach((kd) => { const n = sum((r) => r[0] === kd); if (kN[kd].h > 6) node(COLX[1], kN[kd], kd, n, INK); });
  // the small kinds, listed together
  const small = kinds.filter((kd) => kN[kd].h <= 6);
  if (small.length) {
    const y0 = kN[small[0]].y;
    T(s, COLX[1] + NW + 8, y0 + 12, small.map((kd) => `${kd} ${fmt(sum((r) => r[0] === kd))}`).join(" · "), 9.5, { fill: MUTED });
  }
  tiers.forEach((t) => node(COLX[2], tN[t], t === "none stated" ? "no requirement stated" : `${t} stated`, sum((r) => r[1] === t), TIER[t]));
  meths.forEach((m) => node(COLX[3], mN[m], m === "method not stated" ? "method not stated" : "deconstruction named", sum((r) => r[2] === m), m === "method not stated" ? MUTED : C.green));
  ["permits", "what came down", "recycling requirement stated", "method stated"].forEach((h, i) => T(s, COLX[i], FY - 12, h, 11, { fill: MUTED }));

  /* by year ------------------------------------------------------------------ */
  const YX = 50, YY = 1330, YW = 470, YH = 230;
  T(s, YX, YY - 10, "By year", 16, { weight: 600 });
  T(s, YX + 70, YY - 10, "2026 runs to 22 October", 10.5, { fill: MUTED });
  const years = Object.keys(D.byYear).filter((y) => y >= "2017");
  const maxY = Math.max(...years.map((y) => Object.values(D.byYear[y]).reduce((a, b) => a + b, 0)));
  const bw = YW / years.length;
  [0, 500, 1000].forEach((v) => { const y = YY + YH - (v / maxY) * YH; line(s, [[YX, y], [YX + YW, y]], { stroke: RULE, sw: 0.6 }); T(s, YX + YW + 4, y + 3, fmt(v), 9, { fill: MUTED }); });
  years.forEach((y, i) => {
    let acc = 0;
    tiers.forEach((t) => {
      const v = D.byYear[y][t] || 0, h = (v / maxY) * YH;
      rect(s, YX + i * bw + 4, YY + YH - acc - h, bw - 8, h, { fill: TIER[t], r: 0 });
      acc += h;
    });
    T(s, YX + i * bw + bw / 2, YY + YH + 14, y, 10, { anchor: "middle", fill: MUTED });
    T(s, YX + i * bw + bw / 2, YY + YH - acc - 4, fmt(Object.values(D.byYear[y]).reduce((a, b) => a + b, 0)), 9.5, { anchor: "middle" });
  });

  /* by local area ------------------------------------------------------------ */
  const AX = 580, AY = 1316, AW = 470;
  T(s, AX, AY - 10 + 14, "By local area", 16, { weight: 600 });
  const areas = D.byArea.filter((a) => a[0] !== "unknown").slice(0, 22);
  const maxA = Math.max(...areas.map((a) => Object.values(a[1]).reduce((x, y) => x + y, 0)));
  areas.forEach(([name, c], i) => {
    const y = AY + 16 + i * 13.2, x0 = AX + 150;
    T(s, x0 - 6, y + 8.5, name, 9.6, { anchor: "end" });
    let acc = 0;
    tiers.forEach((t) => { const w = ((c[t] || 0) / maxA) * (AW - 190); rect(s, x0 + acc, y, w, 10, { fill: TIER[t], r: 0 }); acc += w; });
    T(s, x0 + acc + 4, y + 8.5, fmt(Object.values(c).reduce((a, b) => a + b, 0)), 9, { fill: MUTED });
  });

  document.body.dataset.ready = "1";
})();
