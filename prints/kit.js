/* A small kit for the ARCH D prints (24 x 36 in). Each sheet is one SVG drawn
   in a 1100 x 1700 frame, first laid out for 11 x 17 and now centred on a
   2:3 sheet (1133.3 x 1700 units, one unit = 0.0212 in), so 12.5 units of
   type is 19 pt.
   Text is measured with a canvas in the print's own font, so paragraphs and
   labels wrap to exact widths before anything is placed. */
(() => {
  const NS = "http://www.w3.org/2000/svg";
  const INK = "#1A1A1A", MUTED = "#6B6F7A", RULE = "#CFCAC0", PAPER = "#F6F3EC";
  const C = { sun: "#D9A400", sky: "#2F8FD0", orange: "#E8741A", rose: "#D9477E", magenta: "#D6336F", teal: "#189E86", green: "#3E9E4A", lav: "#7A6FD8", cobalt: "#3355D6", ash: "#8A8E9C", red: "#D9442B" };

  function el(tag, attrs = {}, parent) {
    const e = document.createElementNS(NS, tag);
    for (const k in attrs) if (attrs[k] != null) e.setAttribute(k, attrs[k]);
    if (parent) parent.appendChild(e);
    return e;
  }

  const ctx = document.createElement("canvas").getContext("2d");
  function measure(str, size, weight = 400) {
    ctx.font = `${weight} ${size}px Archivo`;
    return ctx.measureText(str).width;
  }

  /** Words into lines no wider than width. */
  function wrap(str, width, size, weight = 400) {
    const out = [];
    let line = "";
    for (const w of String(str).split(/\s+/)) {
      const t = line ? line + " " + w : w;
      if (line && measure(t, size, weight) > width) { out.push(line); line = w; } else line = t;
    }
    if (line) out.push(line);
    return out;
  }

  /** One line of text. o: weight, fill, anchor, ls (letter spacing), italic. */
  function T(parent, x, y, str, size, o = {}) {
    const t = el("text", {
      x, y, "font-size": size, "font-weight": o.weight || 400, fill: o.fill || INK,
      "text-anchor": o.anchor || "start", "letter-spacing": o.ls, "font-style": o.italic ? "italic" : null,
      "font-stretch": o.stretch, opacity: o.opacity,
    }, parent);
    t.textContent = str;
    return t;
  }

  /** A paragraph wrapped to width; returns the y below its last line. */
  function para(parent, x, y, str, width, size, o = {}) {
    const lh = size * (o.lh || 1.32);
    const lines = wrap(str, width, size, o.weight);
    lines.forEach((ln, i) => T(parent, x, y + i * lh, ln, size, o));
    return y + (lines.length - 1) * lh + lh * 0.45;
  }

  function rect(parent, x, y, w, h, o = {}) {
    return el("rect", { x, y, width: w, height: h, rx: o.r ?? 8, fill: o.fill || "none", "fill-opacity": o.fo, stroke: o.stroke, "stroke-width": o.sw ?? (o.stroke ? 1.2 : null), "stroke-dasharray": o.dash, opacity: o.opacity }, parent);
  }

  function line(parent, pts, o = {}) {
    return el("path", { d: "M" + pts.map((p) => p.join(",")).join("L"), fill: "none", stroke: o.stroke || INK, "stroke-width": o.sw || 1, "stroke-dasharray": o.dash, "stroke-linecap": "round", "stroke-linejoin": "round", opacity: o.opacity }, parent);
  }

  /** A smooth S-curve from (x0,y0) to (x1,y1), horizontal ends: the alluvial link. */
  function sCurve(x0, y0, x1, y1) {
    const m = (x0 + x1) / 2;
    return `M${x0},${y0}C${m},${y0} ${m},${y1} ${x1},${y1}`;
  }

  /** The sheet: an SVG in .sheet with the paper ground. */
  function sheet() {
    const host = document.getElementById("sheet");
    const svg = el("svg", { class: "print", viewBox: "-16.67 0 1133.33 1700", preserveAspectRatio: "xMidYMid meet" }, host);
    el("rect", { x: -16.67, y: 0, width: 1133.33, height: 1700, fill: PAPER }, svg);
    return svg;
  }

  /** The common header strip and footer of every print. */
  function frame(svg, o) {
    T(svg, 50, 62, o.kicker || "Temporary Material Configurations · Ruijie Liu · ARCH 548 Graduation Project I · UBC SALA · Progress Review 1, 28 October 2026", 11.5, { fill: MUTED });
    line(svg, [[50, 74], [1050, 74]], { stroke: INK, sw: 1.4 });
    para(svg, 50, 1672, o.foot || "", 860, 10, { fill: MUTED });
    T(svg, 1050, 1672, o.no || "", 10, { fill: MUTED, anchor: "end" });
    line(svg, [[50, 1655], [1050, 1655]], { stroke: RULE, sw: 0.8 });
  }

  async function ready() {
    await document.fonts.ready;
    await Promise.all([300, 400, 600, 700].map((w) => document.fonts.load(`${w} 16px Archivo`)));
  }

  window.KIT = { NS, el, T, para, wrap, measure, rect, line, sCurve, sheet, frame, ready, C, INK, MUTED, RULE, PAPER };
})();
