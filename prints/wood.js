/* Print 3: why wood first. One 1930 house in Dunbar, taken apart by hand
   (City of Vancouver case study), drawn as its frame and weighed by
   material and fate; what the region still landfills (Metro Vancouver,
   2022 composition study); the old-growth stock in pre-1940 houses
   (Teshnizi, UBC SEEDS 2015); why no other material leads; what stands in
   the way; and the hub's path for wood, gentlest first. */
(async () => {
  const { el, T, para, rect, line, sheet, frame, ready, C, INK, MUTED, RULE } = window.KIT;
  const ISO = window.ISO;
  await ready();
  const REUSED = C.green, RECYCLED = "#A3A7B3", ENERGY = C.orange, LANDFILL = "#5E6270", WOOD = C.sun;
  const s = sheet();
  frame(s, { foot: "Sources: City of Vancouver, Deconstruction case study: Dunbar (2019); Metro Vancouver, 2022 C&D Waste Composition Study (Dillon, 2023), a visual audit converted to weight; Teshnizi, UBC SEEDS, 2015; Meyboom and Nielsen-Roine, Canadian Architect, April 2025; City of Portland, June 2026; King County. One house is a case, not an average. Drawing: R. Liu.", no: "Print 3 of 5" });

  /* header --------------------------------------------------------------------- */
  T(s, 50, 140, "Why wood first", 58, { weight: 300, ls: -1.2 });
  para(s, 50, 178, "The talk keeps returning to timber, and that is a choice. Of everything a Vancouver house holds, its wood frame is where reuse is possible and not happening: the most material lost, the most value, and typically the same way of building as the multiplexes replacing it. The hub takes everything; its tests, and my joints, start with wood.", 560, 15, { fill: MUTED });
  [["74%", "of one house's lumber was burned for energy"], ["48%", "of the building waste the region throws away is wood"], ["100,000 t", "of salvageable lumber in pre-1940 houses, estimated"]].forEach(([n, l], i) => {
    const x = 650 + i * 136;
    T(s, x, 150, n, 32, { weight: 300, fill: i === 0 ? ENERGY : INK });
    para(s, x, 172, l, 124, 11, { fill: MUTED });
  });

  /* A: one house, its frame and its fates ------------------------------------- */
  const AY = 300;
  T(s, 50, AY, "One house, taken apart by hand", 18, { weight: 600 });
  T(s, 50, AY + 20, "A 1930 house in Dunbar, 17 days in 2019: what each material weighed, and where it went", 11.5, { fill: MUTED });

  // the house as its frame: concrete below, old-growth studs and joists, fir floors, a patch of lath and plaster
  const K = 10, OX = 320, OY = 561;
  const g = el("g", { class: "dwg", transform: `translate(${OX},${OY}) scale(${K})` }, s);
  const W = 24, D = 30, F0 = 3, Z1 = 3.4, Z2 = 12.4, J0 = 12.57, J1 = 13.4, Z3 = 21.9, SP = 4 / 3, ST = 1 / 6, SD = 1 / 3;
  const fr = { outline: false };
  ISO.box(g, 0, 0, 0, W, D, F0, "m-ash");
  ISO.box(g, 0, 0, F0, W, D, Z1, "m-slab", fr);
  ISO.face(g, [[0, 0, Z1], [W, 0, Z1], [W, D, Z1], [0, D, Z1]], "m-sun", "fz");
  for (let x = 0.5; x < W; x += 0.5) ISO.line(g, [[x, 0, Z1], [x, D, Z1]], "lo");
  const studs = (z0, z1) => {
    const list = [];
    for (let x = 0; x <= W - ST; x += SP) list.push([x, 0, z0, x + ST, SD, z1]);
    for (let y = SP; y <= D - ST; y += SP) list.push([0, y, z0, SD, y + ST, z1]);
    list.sort((a, b) => a[0] + a[1] - (b[0] + b[1])).forEach((b) => ISO.box(g, ...b, "m-house", fr));
    ISO.box(g, 0, 0, z1, W, SD, z1 + 0.17, "m-house", fr);
    ISO.box(g, 0, 0, z1, SD, D, z1 + 0.17, "m-house", fr);
  };
  studs(Z1, Z2);
  // lath and plaster still on part of the back wall
  ISO.face(g, [[1.6, SD, Z1], [10.6, SD, Z1], [10.6, SD, Z2], [1.6, SD, Z2]], "m-white", "fy");
  for (let z = Z1 + 0.6; z < Z2; z += 0.6) ISO.line(g, [[1.6, SD, z], [10.6, SD, z]], "lo");
  for (let y = 0; y <= D - ST; y += SP) ISO.box(g, 0, y, J0, W, y + ST, J1, "m-house", fr);
  ISO.face(g, [[0, 0, J1], [W, 0, J1], [W, 10, J1], [0, 10, J1]], "m-sun", "fz");
  for (let x = 0.5; x < W; x += 0.5) ISO.line(g, [[x, 0, J1], [x, 10, J1]], "lo");
  studs(J1, Z3);
  for (let y = 0; y <= 12; y += 2) el("path", { d: ISO.d([[0, y, Z3 + 0.2], [W / 2, y, Z3 + 7.4], [W, y, Z3 + 0.2]], false), fill: "none", stroke: "#B98E1C", "stroke-width": 0.22, "stroke-linejoin": "round" }, g);
  el("path", { d: ISO.d([[W / 2, 0, Z3 + 7.4], [W / 2, 12, Z3 + 7.4]], false), fill: "none", stroke: "#B98E1C", "stroke-width": 0.22 }, g);

  // labels, each by its part
  const at = (x, y, z) => { const [px, py] = ISO.P(x, y, z); return [OX + px * K, OY + py * K]; };
  // tag: a label at (tx, ty) and a short leader from its corner (lx, ly) to the part
  const tag = (pt, tx, ty, lx, ly, head, sub, col) => {
    line(s, [pt, [lx, ly]], { stroke: MUTED, sw: 0.7 });
    el("circle", { cx: pt[0], cy: pt[1], r: 2.2, fill: INK }, s);
    T(s, tx, ty, head, 12.5, { weight: 600, fill: col || INK });
    T(s, tx, ty + 15, sub, 10.5, { fill: MUTED });
  };
  tag(at(0, 20, 20), 50, 372, 120, 392, "lumber, 19.2 t", "framing and boards: 25% reused, 74% burned", ENERGY);
  tag(at(12, 5, J1), 506, 440, 505, 452, "flooring, 5.5 t", "85% reused", REUSED);
  tag(at(6, SD, 8), 506, 600, 505, 596, "lath and plaster, 3.1 t", "recycled into wallboard", INK);
  tag(at(24, 15, 1.5), 430, 776, 428, 762, "concrete foundation, 39.5 t", "crushed for road fill", INK);

  // the weights, by fate (same order as the drawing's labels)
  const BX = 640, BK = 7.2, BY = AY + 70;
  [["reused", REUSED], ["recycled", RECYCLED], ["burned for energy", ENERGY], ["landfill", LANDFILL]].forEach(([l, col], i) => {
    const x = BX + [0, 82, 172, 312][i];
    rect(s, x, BY - 10, 11, 11, { fill: col, r: 2 });
    T(s, x + 16, BY, l, 11, { fill: MUTED });
  });
  const ROWS = [["Concrete", 39.52, [[1, RECYCLED]]], ["Lumber", 19.22, [[0.25, REUSED], [0.74, ENERGY], [0.01, LANDFILL]]], ["Flooring", 5.55, [[0.85, REUSED], [0.15, LANDFILL]]], ["Plaster", 3.09, [[1, RECYCLED]]]];
  let ry = BY + 34;
  ROWS.forEach(([name, t, parts]) => {
    const h = name === "Lumber" ? 30 : 22;
    T(s, BX, ry + h / 2 + 4, name, 12.5, { weight: 600 });
    T(s, BX + 108, ry + h / 2 + 4, `${t.toFixed(1)} t`, 11.5, { anchor: "end", fill: MUTED });
    let x = BX + 118;
    parts.forEach(([f, col]) => { rect(s, x, ry, Math.max(1.5, t * BK * f - 1.5), h, { fill: col, r: 3 }); x += t * BK * f; });
    if (name === "Lumber") {
      T(s, BX + 118, ry + h + 18, "the City notes: pieces under four feet can only be recycled", 11, { fill: INK });
      ry += 26;
    }
    ry += h + 16;
  });
  rect(s, BX + 118, ry + 2, 8, 8, { fill: REUSED, r: 4 });
  T(s, BX + 132, ry + 10, "doors, trim and appliances: all reused, not weighed", 11, { fill: MUTED });
  ry += 46;
  para(s, BX, ry, "Overall, 98% of the house was kept from landfill, but only 21% was reused. The rest counted as diverted, which is how the by-law measures it. Deconstruction cost $34,990, less $6,000 from selling lumber, against $21,000 to $27,000 to demolish.", 410, 11.5, { fill: INK });
  ry += 74;
  para(s, BX, ry, "The lumber is the gap: heavier than everything but the foundation, likely old growth, and mostly burned. Short lengths are one reason the City names; nails, splits and buyers matter too.", 410, 11.5, { weight: 600, fill: INK });

  /* B: the region, and the stock ------------------------------------------------ */
  const BY2 = 830;
  line(s, [[50, BY2 - 26], [1050, BY2 - 26]], { stroke: RULE, sw: 0.8 });
  T(s, 50, BY2, "What the region still throws away", 18, { weight: 600 });
  T(s, 50, BY2 + 20, "Construction and demolition waste disposed of, Metro Vancouver, 2021: about 372,000 t, by weight, from a visual audit", 11.5, { fill: MUTED });
  const LW = 560, LX = 50;
  const REG = [["wood", 48, WOOD], ["plastics", 10, "#B9BDC8"], ["roofing", 6, "#A9ADB9"], ["rubble", 6, "#9A9EAB"], ["drywall, insulation", 6, "#8B8F9C"], ["everything else", 24, "#D6D3CB"]];
  let rx = LX;
  REG.forEach(([l, p, col], i) => {
    const w = (p / 100) * LW;
    rect(s, rx, BY2 + 38, w - 2, 34, { fill: col, r: 3 });
    if (i === 0) T(s, rx + 10, BY2 + 61, "wood of all kinds, 48%", 14, { weight: 700 });
    else T(s, rx + 2, BY2 + 90 + (i % 2) * 14, `${l} ${p}%`, 9.5, { fill: MUTED });
    rx += w;
  });
  // within the wood, at the Vancouver Landfill
  T(s, 50, BY2 + 148, "Within the wood, at the Vancouver Landfill", 12.5, { weight: 600 });
  const WD = [["dimensional lumber, stained or treated", 32, "#C79A00"], ["painted", 8, "#D9AE2A"], ["clean", 9, "#E9C75A"], ["plywood", 21, "#EBD48E"], ["particleboard", 11, "#F0DFA9"], ["fibreboard", 10, "#F3E6BE"], ["other", 9, "#F6EDD2"]];
  rx = LX;
  WD.forEach(([l, p, col], i) => {
    const w = (p / 100) * LW;
    rect(s, rx, BY2 + 160, w - 2, 24, { fill: col, r: 3 });
    rx += w;
  });
  rect(s, LX, BY2 + 156, 0.49 * LW - 2, 32, { stroke: INK, sw: 1.2, r: 4 });
  T(s, LX, BY2 + 206, "dimensional lumber, 49% of the wood", 11.5, { weight: 600 });
  T(s, LX, BY2 + 222, "four fifths of it painted, stained or treated", 10.5, { fill: MUTED });
  T(s, LX + 0.49 * LW + 8, BY2 + 206, "plywood 21%, particleboard 11%, fibreboard 10%", 10.5, { fill: MUTED });
  para(s, 50, BY2 + 258, "Concrete is only 2% of what is thrown away, metals 4%: they already have paths, as aggregate and scrap. Wood is what escapes them. Residential demolition was the largest source the study sampled.", 560, 11.5, { fill: INK });

  // the stock: old growth in pre-1940 houses, and what an old 2x4 really measures
  const SX = 680;
  T(s, SX, BY2, "Old growth in old houses", 18, { weight: 600 });
  T(s, SX, BY2 + 20, "Vancouver's pre-1940 houses, estimated in 2015", 11.5, { fill: MUTED });
  [["135,000 t", "of dimensional lumber"], ["75%", "of it salvageable"], ["1,000–1,500 t", "a year as they come down: framing for 100 to 130 new houses"]].forEach(([n, l], i) => {
    const y = BY2 + 56 + i * 44;
    T(s, SX, y, n, 20, { weight: 300 });
    para(s, SX + 160, y - 6, l, 210, 10.5, { fill: MUTED });
  });
  // a 2x4, then and now, to scale (1 in = 22 units)
  const IN = 20, QY = BY2 + 186;
  rect(s, SX, QY, 2 * IN, 4 * IN, { fill: WOOD, fo: 0.35, stroke: "#9C7A10", sw: 1.4, r: 1 });
  rect(s, SX + 90, QY + 0.5 * IN, 1.5 * IN, 3.5 * IN, { fill: "#EFE6CC", stroke: MUTED, sw: 1.2, r: 1 });
  T(s, SX + IN, QY + 4 * IN + 16, "2 × 4 in", 10.5, { anchor: "middle", weight: 600 });
  T(s, SX + IN, QY + 4 * IN + 30, "before 1930", 9.5, { anchor: "middle", fill: MUTED });
  T(s, SX + 90 + 0.75 * IN, QY + 4 * IN + 16, "1.5 × 3.5 in", 10.5, { anchor: "middle", weight: 600 });
  T(s, SX + 90 + 0.75 * IN, QY + 4 * IN + 30, "today", 9.5, { anchor: "middle", fill: MUTED });
  para(s, SX + 160, QY + 4, "An old 2×4 is a full two by four inches, denser and drier than new stock. It will not drop into today's framing without design: one more reason to design the joints, not just reuse the sticks.", 210, 10.5, { fill: INK });
  para(s, SX, QY + 4 * IN + 50, "The same study's caution: old-house framing is about 1% of the City's wood waste. The case for wood first is value and fit, not tonnage.", 370, 10.5, { fill: MUTED });

  /* C: why not another material first ------------------------------------------- */
  const CY = 1196;
  line(s, [[50, CY - 26], [1050, CY - 26]], { stroke: RULE, sw: 0.8 });
  T(s, 50, CY, "Why not another material first", 18, { weight: 600 });
  const COLS = [[50, 132, "material"], [186, 102, "in the Dunbar house"], [292, 128, "its path today"], [424, 196, "why it does not lead"]];
  COLS.forEach(([x, , h]) => T(s, x, CY + 26, h, 9.5, { fill: MUTED, weight: 600 }));
  const TAB = [
    ["Concrete foundation", "39.5 t, the heaviest", "crushed for road fill", "Cast in place, so it cannot come out as a part; it already has a path."],
    ["Lumber", "19.2 t", "25% reused, 74% burned", "Leads: the most lost, likely old growth, and multiplexes are typically framed the same way."],
    ["Flooring", "5.5 t", "85% reused", "Already finds buyers when floated or nailed."],
    ["Lath and plaster", "3.1 t", "recycled into wallboard", "No reuse path; recycling works."],
    ["Doors, trim, appliances", "not weighed", "resold through ReStores", "A market exists."],
    ["Roofing, plastics, insulation", "not weighed", "landfill, some recycling", "A recycling problem, not a reuse one."],
  ];
  let ty = CY + 34;
  TAB.forEach((r, i) => {
    const pick = i === 1, lh = 13.5;
    const heights = r.map((c, k) => para(el("g"), 0, 0, c, COLS[k][1], 10.5, { lh: 1.25, weight: k === 0 || pick ? 600 : 400 }));
    const h = Math.max(...heights) + 14;
    if (pick) rect(s, 44, ty, 582, h, { fill: WOOD, fo: 0.16, r: 4 });
    r.forEach((c, k) => para(s, COLS[k][0], ty + 16, c, COLS[k][1], 10.5, { lh: 1.25, weight: k === 0 || pick ? 600 : 400, fill: INK }));
    ty += h;
    line(s, [[50, ty], [620, ty]], { stroke: RULE, sw: 0.6 });
  });
  para(s, 50, ty + 30, "What wood first leaves out: the carbon of new concrete foundations, which is a question of how the next buildings stand, not of salvage; and windows, whose reuse turns on energy performance. The hub accepts both; the research starts with wood.", 570, 10.5, { fill: MUTED });

  // what stands in the way
  const OX2 = 680;
  T(s, OX2, CY, "What stands in the way", 18, { weight: 600 });
  const OBS = [
    ["Grading", "Here an engineer must sign off each structural reuse. Oregon has let sound salvaged lumber be designed as Douglas fir-larch No. 2 without a stamp since 2017, and Washington's code allows used sawn lumber."],
    ["Nails and short lengths", "De-nailing is slow, and pieces under four feet are recycled by default."],
    ["Paint and treatment", "Most landfilled lumber is painted, stained or treated; old paint must be tested for lead."],
    ["Sorting and storage", "No place to sort and store wood at scale, as AnnaLisa Meyboom and Kaia Nielsen-Roine note: the hub's job."],
  ];
  let oy = CY + 30;
  OBS.forEach(([h, t]) => {
    T(s, OX2, oy, h, 12, { weight: 600 });
    oy = para(s, OX2, oy + 16, t, 370, 10.5, { fill: INK }) + 12;
  });

  /* D: the hub's path for wood, gentlest first ------------------------------------- */
  const DY = 1502;
  line(s, [[50, DY - 30], [1050, DY - 30]], { stroke: RULE, sw: 0.8 });
  T(s, 50, DY, "Piece by piece: the hub's path for wood, gentlest first", 18, { weight: 600 });
  T(s, 50, DY + 20, "Each piece is tested, then takes the first step it can; today, in Dunbar, a quarter took the first step and three quarters the last", 11.5, { fill: MUTED });
  const STEPS = [
    ["1", "Reuse whole", "tested and graded, back into a frame", REUSED],
    ["2", "Re-mill", "resawn into flooring, siding and trim", "#7DAF3C"],
    ["3", "Re-join", "short pieces joined dry, dowelled, pegged or keyed, into members that come apart: my GP II focus", WOOD],
    ["4", "Remanufacture", "into strand board, cross-laminated tiles, wood fibre insulation", "#C9A63A"],
    ["5", "Energy", "last, when nothing else works", ENERGY],
  ];
  const SW = 190, SG = 12;
  STEPS.forEach(([n, h, t, col], i) => {
    const x = 50 + i * (SW + SG), y = DY + 40, focus = i === 2;
    rect(s, x, y, SW, 104, { fill: focus ? WOOD : "#FFFFFF", fo: focus ? 0.22 : 1, stroke: focus ? "#9C7A10" : RULE, sw: focus ? 1.6 : 0.9, r: 8 });
    el("circle", { cx: x + 18, cy: y + 20, r: 10, fill: col }, s);
    T(s, x + 18, y + 24.5, n, 11, { anchor: "middle", weight: 700, fill: "#FFFFFF" });
    T(s, x + 36, y + 25, h, 13.5, { weight: 600 });
    para(s, x + 12, y + 50, t, SW - 24, 10.5, { fill: INK });
  });
  document.body.dataset.ready = "1";
})();
