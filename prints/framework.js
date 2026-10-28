/* Print 1: the Reuse Decision Framework, after the ARCH 545A report
   (The Constructed Quarry, Sept 2026, pp. 28-35). Every label is the
   report's own wording, shortened only where noted. */
(async () => {
  const { el, T, para, wrap, measure, rect, line, sCurve, sheet, frame, ready, C, INK, MUTED, RULE } = window.KIT;
  await ready();
  const s = sheet();
  frame(s, { foot: "Source: R. Liu, The Constructed Quarry, Sept 2026, pp. 28–35: the outcome of both directed studies, ARCH 545A with Joanne Gates and ARCH 545B with Xun Liu. The framework supports design research; it does not replace engineering, testing, code review or professional judgement.", no: "Print 1 of 5" });

  // header
  T(s, 50, 140, "The Reuse Decision Framework", 58, { weight: 300, ls: -1.2 });
  para(s, 50, 178, "The outcome of both summer directed studies, built from observation on site and the online research database. It does not give a material a score; it asks whether the evidence is enough for one specific use, then what to do next.", 560, 15, { fill: MUTED });
  rect(s, 640, 156, 410, 92, { fill: INK, r: 14 });
  para(s, 660, 186, "Can this particular component perform this particular role in this particular building?", 375, 17.5, { fill: "#F6F3EC", weight: 600, lh: 1.22 });
  T(s, 660, 236, "Suitability cannot be assigned before the next use is known.", 10.5, { fill: "#C9C4BA" });

  // the spine that ties the four stages
  const SX = 72;
  const stage = (n, title, sub, y, col, y1) => {
    line(s, [[SX, y + 20], [SX, y1]], { stroke: col, sw: 6, opacity: 0.85 });
    el("circle", { cx: SX, cy: y, r: 19, fill: col }, s);
    T(s, SX, y + 7, n, 19, { anchor: "middle", fill: "#FFFFFF", weight: 700 });
    T(s, 106, y + 10, title, 30, { weight: 600, fill: col });
    T(s, 106 + measure(title, 30, 600) + 16, y + 9, sub, 13, { fill: MUTED });
  };

  /* 01 identify: the passport ------------------------------------------- */
  stage("1", "Identify", "the material reuse passport: a record that enters the decision", 280, C.sun, 560);
  const fields = (x, y, w, title, rows, col) => {
    rect(s, x, y, w, 232, { fill: "#FFFFFF", stroke: col, sw: 1.4, r: 12 });
    rect(s, x, y, w, 30, { fill: col, fo: 0.16, r: 12 });
    T(s, x + 14, y + 20, title, 13.5, { weight: 600 });
    rows.forEach(([k, v], i) => {
      const yy = y + 46 + i * 13.9;
      if (i) line(s, [[x + 14, yy - 10.5], [x + w - 14, yy - 10.5]], { stroke: RULE, sw: 0.5 });
      T(s, x + 14, yy, k, 10.5, { weight: 600 });
      T(s, x + 150, yy, v, 10.5, { fill: k === "Evidence missing" || k === "Evidence confidence" ? C.magenta : INK });
    });
  };
  fields(106, 300, 462, "Material record: what is known", [
    ["Material ID", "unique reference"], ["Component type", "beam, joist, stud, window, flooring, brick, cladding, fixture"],
    ["Source", "donor building and original location"], ["Original use", "previous architectural role"],
    ["Material", "species, composition or product type"], ["Age", "known or estimated"],
    ["Dimensions", "measured size and variation"], ["Quantity", "available stock"],
    ["Physical condition", "damage, deterioration, previous alterations"], ["Treatment", "known treatment, coating or contamination"],
    ["Recovery status", "in place, recovered, stored, processed, allocated"], ["Documentation", "photographs, scans, drawings, tests, records"],
  ], C.sun);
  fields(588, 300, 462, "Application record: what a proposed use needs", [
    ["Proposed use", "the architectural application being tested"], ["Building system", "structure, envelope, interior, service or site"],
    ["Required performance", "the relevant technical requirements"], ["Evidence available", "inspection, grading, testing, certification"],
    ["Evidence missing", "information still required"], ["Processing required", "clean, repair, cut, grade, modify, test"],
    ["Connection strategy", "relationship to the proposed assembly"], ["Regulation", "requirements and professional review"],
    ["Environmental value", "avoided new material, processing, transport"], ["Labour and logistics", "recovery, storage, fabrication, construction"],
    ["Architectural value", "dimensions, patina, history, irregularity"], ["Future circularity", "reversibility, replaceability, future recovery"],
    ["Evidence confidence", "high, medium, low or unresolved"], ["Decision status", "one of the eight decisions in stage 3"],
  ].slice(0, 14), C.sun);
  para(s, 106, 550, "One component, many application records: if a timber member lacks the evidence for structural reuse, the same record can be tested for secondary framing, a partition, a screen or furniture. Unknowns are recorded, never hidden; they set how much more investigation is needed.", 944, 12, { fill: MUTED });

  /* 02 evaluate: three questions first, then nine ------------------------ */
  stage("2", "Evaluate", "twelve criteria, A to L; their weight changes with material, use, evidence and consequence of failure", 600, C.sky, 1075);
  T(s, 106, 632, "Three questions come first", 13, { weight: 600, fill: C.sky });
  const first = [
    ["A", "Material identity", "What is the component?", ["Material type", "Material subtype", "Original product or component", "Original application", "Age", "Source building", "Provenance", "Known or unknown composition", "Treatment or coating", "Potential contamination"]],
    ["H", "Environmental value", "What value is kept by keeping it in circulation?", ["Avoided disposal", "Avoided production of virgin material", "Embodied carbon implications", "Transportation impact", "Processing impact", "Waste generated through recovery", "Comparison with an equivalent new material", "Potential for another future use"]],
    ["E", "Deconstruction and recovery", "Can it come out in a form that stays useful?", ["Accessibility", "Existing connection type", "Reversibility", "Difficulty of removal", "Risk of damage during removal", "Labour required", "Equipment required", "Recoverable yield", "Ability to separate it from adjacent work"]],
  ];
  first.forEach(([k, name, q, items], i) => {
    const x = 106 + i * 318, y = 642, w = 306;
    rect(s, x, y, w, 176, { fill: "#FFFFFF", stroke: C.sky, sw: 1.6, r: 12 });
    rect(s, x, y, w, 52, { fill: C.sky, fo: 0.14, r: 12 });
    T(s, x + 14, y + 36, k, 30, { weight: 700, fill: C.sky });
    T(s, x + 44, y + 22, name, 14.5, { weight: 600 });
    T(s, x + 44, y + 40, q, 10.5, { fill: MUTED, italic: true });
    items.forEach((it, j) => {
      const col = j < 5 ? 0 : 1, yy = y + 70 + (j % 5) * 21.5;
      el("circle", { cx: x + 18 + col * 146, cy: yy - 4, r: 2.6, fill: C.sky }, s);
      wrap(it, 122, 10).forEach((ln, li) => T(s, x + 26 + col * 146, yy + li * 10.8, ln, 10));
    });
  });
  T(s, 106, 838, "Then nine more questions", 13, { weight: 600, fill: C.sky });
  const nine = [
    ["B", "Physical condition", "Damage, weathering, decay, corrosion, cracking, deformation, moisture, biological damage, old fasteners, remaining service life"],
    ["C", "Geometry and quantity", "Dimensions, thickness, section, length, shape, irregularity, quantity, repeatability, tolerances"],
    ["D", "Technical performance", "Structural, enclosure, thermal, moisture, acoustic, fire, durability, weathering, finish, maintenance"],
    ["F", "Processing", "Cleaning, de-nailing, trimming, cutting, resurfacing, grading, testing, machining, repair, reinforcement"],
    ["J", "Regulation and risk", "Building code, testing, certification, hazardous materials, liability, traceability, documentation"],
    ["G", "Logistics", "Location, transport, storage, handling, timing, availability, sequencing with the construction schedule"],
    ["I", "Economics and labour", "Recovery, processing, testing, transport, storage, fabrication and design labour, against new material"],
    ["K", "Architectural value", "Patina, visible history, cultural significance, dimensional limits, design opportunity, fit with the assembly"],
    ["L", "Future circularity", "Reversibility, adaptable connections, future disassembly, identity, documentation for later users"],
  ];
  nine.forEach(([k, name, q], i) => {
    const x = 106 + (i % 3) * 318, y = 848 + Math.floor(i / 3) * 58, w = 306;
    rect(s, x, y, w, 54, { fill: "#FFFFFF", stroke: C.sky, sw: 0.9, r: 9, opacity: 1 });
    T(s, x + 12, y + 19, k, 15, { weight: 700, fill: C.sky });
    T(s, x + 32, y + 18, name, 12, { weight: 600 });
    wrap(q, 266, 9.2).slice(0, 3).forEach((ln, li) => T(s, x + 32, y + 29 + li * 9.8, ln, 9.2, { fill: MUTED }));
  });
  // five levels of assessment, as a rising stair
  T(s, 106, 1036, "Five levels of assessment", 13, { weight: 600, fill: C.sky });
  T(s, 106 + measure("Five levels of assessment", 13, 600) + 12, 1036, "· evidence confidence is recorded at every level: high, medium, low or unresolved", 11, { fill: MUTED });
  const levels = [["Rapid screening", "worth protecting during deconstruction?"], ["Documentation", "identity, size, quantity, condition, provenance"], ["Technical assessment", "testing, grading, specialist assessment"], ["Design compatibility", "against a role, connection and assembly"], ["Holistic decision", "environment, cost, logistics, design, future"]];
  levels.forEach(([n, p], i) => {
    const x = 106 + i * 190, w = 184, h = 40 + i * 5, y = 1104 - h;
    rect(s, x, y, w, h, { fill: C.sky, fo: 0.1 + i * 0.12, r: 8 });
    T(s, x + 10, y + 17, `${i + 1}  ${n}`, 11.5, { weight: 600 });
    wrap(p, 166, 9.6).slice(0, 2).forEach((ln, li) => T(s, x + 10, y + 30 + li * 11, ln, 9.6, { fill: INK, opacity: 0.8 }));
  });

  /* 03 decide: match, weigh, classify ------------------------------------ */
  stage("3", "Decide", "match the part to a role, weigh evidence against consequence, then classify", 1135, C.orange, 1500);
  // matching: four columns joined by soft links, one example path highlighted
  const cols = [
    ["Material", ["Timber", "Masonry", "Metal", "Glass and openings", "Other products", "Site and landscape"]],
    ["Building system", ["Structure", "Envelope", "Interior", "Services", "Site and landscape"]],
    ["Circular pathway", ["Retain in place", "Reuse directly", "Reuse after processing", "Repurpose", "Remanufacture", "Recycle", "New, if reuse is unreasonable"]],
    ["Performance", ["Gravity load", "Lateral load", "Fire", "Thermal", "Air", "Water", "Vapour", "Acoustic", "Durability", "Weathering", "Finish", "Maintenance"]],
  ];
  const CX = [106, 330, 556, 820], CW = [150, 150, 190, 120], top = 1160, H = 172;
  const pos = cols.map(([, items], c) => items.map((_, i) => top + 26 + (i + 0.5) * (H / items.length)));
  const links = el("g", {}, s);
  for (let c = 0; c < 3; c++) pos[c].forEach((ya) => pos[c + 1].forEach((yb) => el("path", { d: sCurve(CX[c] + CW[c], ya, CX[c + 1], yb), fill: "none", stroke: C.orange, "stroke-width": 0.5, opacity: 0.16 }, links)));
  // the example: a recovered joist, too uncertain for structure, redirected to an interior partition
  const ex = [[0, 0], [1, 2], [2, 2], [3, 2]];
  for (let c = 0; c < 3; c++) el("path", { d: sCurve(CX[c] + CW[c], pos[c][ex[c][1]], CX[c + 1], pos[c + 1][ex[c + 1][1]]), fill: "none", stroke: C.orange, "stroke-width": 3.2, opacity: 0.9 }, s);
  el("path", { d: sCurve(CX[0] + CW[0], pos[0][0], CX[1], pos[1][0]), fill: "none", stroke: C.red, "stroke-width": 2, "stroke-dasharray": "5 4", opacity: 0.9 }, s);
  cols.forEach(([head, items], c) => {
    T(s, CX[c], top + 12, head, 11.5, { weight: 600, fill: C.orange });
    items.forEach((it, i) => {
      const y = pos[c][i], hl = ex[c][1] === i;
      rect(s, CX[c] - 2, y - 6.6, CW[c], 13, { fill: hl ? C.orange : "#FFFFFF", fo: hl ? 0.22 : 1, stroke: hl ? C.orange : RULE, sw: 0.7, r: 4 });
      T(s, CX[c] + 5, y + 3.3, it, 9.4, { weight: hl ? 600 : 400 });
    });
  });
  para(s, 954, top + 30, "Example. A recovered joist lacks grading for structure (dashed), so it is tested again as an interior partition, reused after processing, against fire and finish.", 96, 9.8, { fill: MUTED });

  // evidence against consequence
  const MX = 106, MY = 1384;
  T(s, MX, MY - 8, "Evidence against the consequence of failure", 12, { weight: 600, fill: C.orange });
  const ev = ["limited evidence", "moderate evidence", "strong evidence"], cq = ["low", "moderate", "high"];
  const cellTxt = [["Potential candidate", "Reuse generally credible", "Reuse credible"], ["Further verification required", "Conditional reuse", "Reuse subject to project requirements"], ["Do not proceed", "Testing or professional assessment required", "Potentially suitable, subject to code and review"]];
  const cellCol = [[C.green, C.green, C.green], [C.sun, C.sun, C.green], [C.red, C.orange, C.sun]];
  ev.forEach((e, c) => T(s, MX + 70 + c * 112 + 52, MY + 12, e, 9.6, { anchor: "middle", fill: MUTED }));
  cq.forEach((r, ri) => {
    T(s, MX, MY + 38 + ri * 37, r, 10.5, { fill: MUTED });
    T(s, MX, MY + 49 + ri * 37, "consequence", 8.8, { fill: MUTED });
    for (let c = 0; c < 3; c++) {
      const x = MX + 70 + c * 112, y = MY + 18 + ri * 37;
      rect(s, x, y, 106, 34, { fill: cellCol[ri][c], fo: 0.28, r: 6 });
      wrap(cellTxt[ri][c], 98, 9).slice(0, 3).forEach((ln, li) => T(s, x + 53, y + 13 + li * 9.6, ln, 9, { anchor: "middle" }));
    }
  });
  // eight decisions
  const DX = 520;
  T(s, DX, MY - 8, "Eight decisions, each with the architect's next move", 12, { weight: 600, fill: C.orange });
  const decisions = [
    ["Reuse-ready", C.green, "adequate evidence, feasible recovery, a defined use", "integrate into design"],
    ["Conditional reuse", C.sun, "promising, with unresolved questions", "test, document or prototype"],
    ["Reuse after processing", C.sun, "viable after a defined intervention", "add processing to the workflow"],
    ["Redirect to another use", C.teal, "this use is wrong, another remains viable", "match to a more compatible role"],
    ["Design-dependent", C.lav, "depends on changing assembly, geometry, joint", "redesign around the stock"],
    ["Reserve", C.sky, "viable, but no receiving use yet", "catalogue and store"],
    ["Recycle", C.ash, "the material is recoverable, the component is not", "keep apart from reuse stock"],
    ["Exclude", C.red, "hazard, poor performance or destructive recovery", "treat or dispose appropriately"],
  ];
  decisions.forEach(([name, col, meaning, act], i) => {
    const y = MY + 4 + i * 17.2;
    rect(s, DX, y, 150, 15, { fill: col, fo: 0.25, r: 4 });
    T(s, DX + 7, y + 11, name, 10.2, { weight: 600 });
    T(s, DX + 160, y + 11, meaning, 9.6, { fill: MUTED });
    T(s, 1050, y + 11, act, 9.6, { anchor: "end", weight: 600 });
  });

  /* 04 design: the least transformative path, and the record that travels */
  stage("4", "Design", "take the least transformative path that credibly meets the use", 1548, C.rose, 1645);
  const ladder = [["Direct reuse", "original component and geometry"], ["Preparation", "substantially unchanged"], ["Repair", "most of the component"], ["Modification", "identity kept, geometry changes"], ["Testing or regrading", "geometry kept, confidence rises"], ["Remanufacture", "material kept, form partly lost"], ["Recycle", "material kept, identity lost"], ["Exclude", "no reuse value kept"]];
  ladder.forEach(([n, v], i) => {
    const y = 1566 + i * 10.9, w = 430 - i * 34;
    rect(s, 106, y, w, 10, { fill: C.rose, fo: 0.42 - i * 0.05, r: 3 });
    T(s, 112, y + 8, n, 8.6, { weight: 600 });
    T(s, 112 + 128, y + 8, v, 8.4, { fill: INK, opacity: 0.75 });
  });
  // material and information flows, nine stages
  const stages = ["Existing building", "Component audit", "Deconstruction", "Assessment", "Processing", "Storage", "Design integration", "Second-life building", "Future recovery"];
  const FX0 = 560, FX1 = 1050, fy1 = 1584, fy2 = 1620;
  T(s, FX0, 1572, "material moves", 10, { weight: 600, fill: C.orange });
  T(s, FX0, 1640, "its record moves with it", 10, { weight: 600, fill: C.sky });
  line(s, [[FX0, fy1], [FX1, fy1]], { stroke: C.orange, sw: 3 });
  line(s, [[FX0, fy2], [FX1, fy2]], { stroke: C.sky, sw: 3, dash: "6 4" });
  stages.forEach((st, i) => {
    const x = FX0 + 8 + i * ((FX1 - FX0 - 16) / 8);
    el("circle", { cx: x, cy: fy1, r: 5, fill: "#FFFFFF", stroke: C.orange, "stroke-width": 2 }, s);
    el("circle", { cx: x, cy: fy2, r: 4, fill: "#FFFFFF", stroke: C.sky, "stroke-width": 2 }, s);
    line(s, [[x, fy1 + 5], [x, fy2 - 4]], { stroke: RULE, sw: 0.8 });
    wrap(st, 56, 8.6).slice(0, 2).forEach((ln, li) => T(s, x, fy1 + 15 + li * 9.4, ln, 8.6, { anchor: "middle" }));
  });
  T(s, 1050, 1557, "outputs: inventory · passports · use-matching · uncertainty log · decision tree · flow map · assembly atlas · prototype", 8.6, { anchor: "end", fill: MUTED });

  document.body.dataset.ready = "1";
})();
