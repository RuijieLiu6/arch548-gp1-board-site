/* Mounts a Hairline figure (figures/*.js) on the board instead of the bench:
   same host contract as the package (a stage, an svg in a 400 x 320 viewBox,
   a read-out), with the board's paper and brick supplied through the
   kernel's own custom properties in board.css. */
(() => {
  const LEVEL = 0.5; // the slider's middle: the figure's default
  window.hairline = (figure) => {
    const stage = document.getElementById("wall-stage"), readEl = document.getElementById("wall-read");
    if (!stage) return;
    HL.inject(document);
    stage.setAttribute("data-hairline", figure.name);
    stage.setAttribute("data-hairline-theme", "dark");
    stage.setAttribute("role", "img");
    stage.setAttribute("aria-label", figure.means);
    // the kernel maps the pointer onto the stage as 400 x 320, so the stage keeps that shape (board.css)
    const svg = HL.mk("svg", { viewBox: "0 0 400 320", "aria-hidden": "true" }, stage);
    const read = { set textContent(v) { readEl.textContent = v == null ? "" : String(v); }, get textContent() { return readEl.textContent; } };
    const [lo, mid, hi] = figure.range;
    const value = LEVEL <= 0.5 ? lo + (LEVEL / 0.5) * (mid - lo) : mid + ((LEVEL - 0.5) / 0.5) * (hi - mid);
    const handle = figure.mount({ stage, svg, read }, value);
    if (!readEl.textContent) read.textContent = "rest";
    let touring = null;
    window.WALL = {
      handle,
      tour() {
        if (touring) { touring.stop(); touring = null; return; }
        touring = HL.tour(stage, figure.tour || HL.LAP, () => {});
      },
    };
  };
})();
