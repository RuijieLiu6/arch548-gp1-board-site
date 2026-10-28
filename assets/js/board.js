/* The board as a talk, one sentence at a time.
   Each slide's script is a list of <p> in its notes; each press of → moves to
   the next sentence and lights the part of the slide it speaks about
   (data-focus, spotlights on figures, named groups). Practice mode shows the
   script (S) and the timer (T); present mode (F) shows only the slides and the
   faint chapter bar. With a projector, the Audience button (A) opens a second
   window that shows only the slides and follows this one, click by click. */
(() => {
  gsap.registerPlugin(ScrollTrigger);
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const slides = $$(".slide");
  const spoken = slides.filter((s) => +s.dataset.time > 0);
  const TOTAL = spoken.reduce((a, s) => a + +s.dataset.time, 0);
  const mmss = (t) => `${Math.floor(t / 60)}:${String(Math.floor(t % 60)).padStart(2, "0")}`;
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const NS = "http://www.w3.org/2000/svg";
  const sentences = (s) => $$("aside.notes p", s);
  // delivery cues (<i class="cue">pause</i>) show in the script but are not spoken
  const said = (p) => { const c = p.cloneNode(true); c.querySelectorAll(".cue").forEach((e) => e.remove()); return c.textContent.replace(/\s+/g, " ").trim(); };
  // ?audience=1 is the projector window: it follows the window that opened it (its peer)
  const AUDIENCE = new URLSearchParams(location.search).get("audience") === "1";
  let peer = null, peerSeen = 0;
  let phone = 0; // this window's number with build/serve.py while the phone remote drives it

  /* ---------- drawings, by the box they draw into ---------- */
  const C = window.CHARTS, plays = {};
  const add = (slide, tl) => { (plays[slide.id] = plays[slide.id] || []).push(tl); };
  const build = {
    kinds: (h) => C.kinds(h), shear: (h) => C.shear(h), framework: (h) => C.framework(h), value: (h) => C.value(h), co2: (h) => C.co2(h), homes: (h) => C.homes(h), "permit-map": (h) => C.permitMap(h, { mono: true }).tl, tiers: (h) => C.tiers(h),
    reuse: (h) => C.reuse(h), timeline: (h) => C.timeline(h), land: (h) => C.land(h), lot: (h) => C.lot(h),
    labour: (h) => C.labour(h), litmap: (h) => C.litMap(h), hubprog: (h) => C.hubProgram(h), hubtype: (h) => C.hubType(h), woodfirst: (h) => C.woodFirst(h), siting: (h) => C.siting(h), precedents: (h) => C.precedents(h), immersion: (h) => C.immersion(h), plan: (h) => C.plan(h),
  };
  for (const id in build) {
    const host = document.getElementById(id);
    if (!host) continue;
    try { add(host.closest(".slide"), build[id](host)); } catch (e) { console.error("drawing " + id, e); }
  }

  // Figures drawn as standalone SVG files: inlined from the bundle (works from disk), else fetched, else an <img>.
  $$(".svg-fig[data-src]").forEach((box) => {
    const src = box.dataset.src, slide = box.closest(".slide");
    add(slide, gsap.fromTo(box, { clipPath: "inset(0 100% 0 0)", autoAlpha: 0.2 }, { clipPath: "inset(0 0% 0 0)", autoAlpha: 1, duration: 1.6, ease: "power2.inOut", paused: true }));
    const bundled = window.FIGS && window.FIGS[src];
    (bundled ? Promise.resolve(bundled) : fetch(src).then((r) => (r.ok ? r.text() : Promise.reject(r.status)))).then((t) => {
      // figures share one page: give each figure's own definitions (filters, arrows,
      // symbols) a private id, so two figures' "bloom" never collide; step groups keep theirs
      const ns = src.replace(/^.*\//, "").replace(/\.svg$/, "") + "--";
      new Set([...t.matchAll(/\bid="([^"]+)"/g)].map((m) => m[1]).filter((id) => !id.startsWith("layer-"))).forEach((id) => {
        t = t.split(`id="${id}"`).join(`id="${ns}${id}"`).split(`#${id})`).join(`#${ns}${id})`).split(`"#${id}"`).join(`"#${ns}${id}"`);
      });
      box.innerHTML = t;
      const s = box.querySelector("svg");
      if (!s) return;
      s.removeAttribute("width"); s.removeAttribute("height");
      s.setAttribute("preserveAspectRatio", "xMidYMid meet");
      s.classList.add("astra");
      if (box.dataset.spots) spotlight(box, s);
      apply(slide, step.get(slide) || 0);
    }).catch(() => {
      const img = new Image();
      img.src = src; img.alt = ""; img.style.cssText = "width:100%;height:100%;object-fit:contain";
      img.onerror = () => { box.innerHTML = `<p class="src">Figure not built yet: ${src}</p>`; };
      box.replaceChildren(img);
    });
  });

  /** A dark veil over a figure with holes where the current sentence looks. */
  function spotlight(box, fig) {
    const vb = fig.getAttribute("viewBox") || "0 0 1600 900";
    const o = document.createElementNS(NS, "svg");
    o.setAttribute("class", "spot");
    o.setAttribute("viewBox", vb);
    o.setAttribute("preserveAspectRatio", "xMidYMid meet");
    const id = "veil-" + box.closest(".slide").id;
    o.innerHTML = `<defs><mask id="${id}"><rect x="-2000" y="-2000" width="6000" height="6000" fill="#fff"/><g class="holes"></g></mask></defs><rect x="-2000" y="-2000" width="6000" height="6000" fill="rgba(11,14,20,.76)" mask="url(#${id})"/><g class="rings"></g>`;
    box.appendChild(o);
    box._spot = o;
  }
  function setSpots(box, list) {
    const o = box._spot;
    if (!o) return;
    const holes = $(".holes", o), rings = $(".rings", o);
    while (holes.children.length < list.length) {
      holes.appendChild(document.createElementNS(NS, "ellipse")).setAttribute("fill", "#000");
      const r = rings.appendChild(document.createElementNS(NS, "ellipse"));
      r.setAttribute("fill", "none"); r.setAttribute("stroke", "#FFD23F"); r.setAttribute("stroke-width", "2"); r.setAttribute("stroke-dasharray", "6 6");
    }
    [...holes.children].forEach((h, i) => {
      const sp = list[i], r = rings.children[i];
      if (!sp) { gsap.to([h, r], { attr: { rx: 0, ry: 0 }, duration: 0.4 }); return; }
      const [cx, cy, rx, ry] = sp;
      gsap.to([h, r], { attr: { cx, cy, rx, ry }, duration: reduce ? 0 : 0.7, ease: "power3.inOut" });
    });
    o.classList.toggle("on", list.length > 0);
  }

  /* ---------- steps: which sentence, and what it lights ---------- */
  const step = new Map();
  function apply(slide, k) {
    step.set(slide, k);
    // step 0 shows everything, except on a slide that builds line by line (data-build)
    const focusing = (k > 0 || slide.hasAttribute("data-build")) && $$("[data-focus]", slide).some((e) => e.dataset.focus.split(" ").includes(String(k)));
    slide.classList.toggle("focusing", focusing);
    $$("[data-focus]", slide).forEach((e) => e.classList.toggle("lit", focusing && e.dataset.focus.split(" ").includes(String(k))));
    // notes that arrive at a step and stay (data-from="2": shown from the third sentence on)
    $$("[data-from]", slide).forEach((e) => e.classList.toggle("shown", e.dataset.from !== "" && k >= +e.dataset.from));
    $$(".svg-fig", slide).forEach((box) => {
      if (box.dataset.spots) setSpots(box, JSON.parse(box.dataset.spots)[k] || []);
      if (box.dataset.ids) {
        const ids = JSON.parse(box.dataset.ids)[k] || [], fig = $("svg", box);
        if (!fig) return;
        fig.classList.toggle("focusing", ids.length > 0);
        $$("g[id]", fig).forEach((g) => g.classList.toggle("lit", ids.includes(g.id)));
      }
      // groups that wait for their sentence: data-reveal='{"layer-teardown": 3}'
      if (box.dataset.reveal) {
        const from = JSON.parse(box.dataset.reveal), fig = $("svg", box);
        if (fig) for (const id in from) { const g = fig.querySelector(`[id="${id}"]`); if (g) g.classList.toggle("unrevealed", k < from[id]); }
      }
    });
    slide.dispatchEvent(new CustomEvent("step", { detail: k })); // for figures that move with the script
    if (slide === slides[cur]) { script(); chapters(); sync(); }
  }

  const played = new Set();
  function arrive(slide) {
    if (slide.id === "s01" && !played.has(slide.id)) window.HERO.play();
    if (!played.has(slide.id)) (plays[slide.id] || []).forEach((tl) => (reduce ? tl.progress(1) : tl.play(0)));
    played.add(slide.id);
  }
  $("#replay").addEventListener("click", () => run("hero"));

  /* ---------- where we are ---------- */
  let cur = 0, flying = 0;
  if ("scrollRestoration" in history) history.scrollRestoration = "manual";
  scrollTo(0, 0);
  function enter(i, k = 0) {
    cur = i;
    arrive(slides[i]);
    apply(slides[i], k);
    paint();
  }
  const io = new IntersectionObserver((es) => {
    if (performance.now() < flying) return;
    es.forEach((e) => {
      if (!e.isIntersecting) return;
      const i = slides.indexOf(e.target);
      if (i !== cur) enter(i, 0);
    });
  }, { threshold: 0.55 });
  slides.forEach((s) => io.observe(s));

  function go(i, k = 0) {
    i = Math.max(0, Math.min(slides.length - 1, i));
    flying = performance.now() + 1100;
    enter(i, k);
    scrollTo({ top: slides[i].offsetTop, behavior: reduce ? "auto" : "smooth" });
  }
  function next() {
    const s = slides[cur], k = step.get(s) || 0;
    if (!timer.running && cur === 0) timer.start();
    if (k < sentences(s).length - 1) { apply(s, k + 1); return; }
    go(cur + 1, 0);
  }
  function prev() {
    const s = slides[cur], k = step.get(s) || 0;
    if (k > 0) { apply(s, k - 1); return; }
    if (cur > 0) go(cur - 1, Math.max(0, sentences(slides[cur - 1]).length - 1));
  }

  /* ---------- timer ---------- */
  const clock = $("#clock"), btnTimer = $("#btn-timer");
  const timer = {
    t0: 0, acc: 0, running: false,
    now() { return this.acc + (this.running ? (performance.now() - this.t0) / 1000 : 0); },
    start() { if (!this.running) { this.t0 = performance.now(); this.running = true; } btnTimer.setAttribute("aria-pressed", "true"); phoneState(); },
    stop() { if (this.running) { this.acc = this.now(); this.running = false; } btnTimer.setAttribute("aria-pressed", "false"); phoneState(); },
    toggle() { this.running ? this.stop() : this.start(); },
    reset() { this.acc = 0; this.t0 = performance.now(); phoneState(); },
  };
  clock.addEventListener("click", () => timer.toggle());
  btnTimer.addEventListener("click", () => timer.toggle());

  /* ---------- the time bar (practice only) ---------- */
  const sv = document.createElementNS(NS, "svg");
  sv.setAttribute("viewBox", "0 0 1000 20");
  sv.setAttribute("preserveAspectRatio", "none");
  $("#scale").appendChild(sv);
  const mk = (tag, a) => { const e = document.createElementNS(NS, tag); for (const k in a) e.setAttribute(k, a[k]); sv.appendChild(e); return e; };
  const X = (t) => (t / 660) * 1000; // eleven minutes: the limit
  let acc = 0;
  const segs = spoken.map((s) => {
    const a = acc; acc += +s.dataset.time;
    const r = mk("rect", { x: X(a), y: 7, width: X(+s.dataset.time) - 2, height: 5, rx: 1.5, fill: "#3A4152", style: "cursor:pointer" });
    r.addEventListener("click", () => go(slides.indexOf(s)));
    const t = document.createElementNS(NS, "title"); t.textContent = `${slides.indexOf(s) + 1} ${s.dataset.title}, ${mmss(a)}–${mmss(acc)}`; r.appendChild(t);
    return { s, r, a, b: acc };
  });
  mk("line", { x1: X(540), x2: X(540), y1: 6, y2: 14, stroke: "rgba(243,239,230,.35)", "stroke-width": 1, "vector-effect": "non-scaling-stroke" }); // the written brief: nine minutes
  mk("line", { x1: X(660) - 1, x2: X(660) - 1, y1: 2, y2: 18, stroke: "#FF4F9A", "stroke-width": 2, "vector-effect": "non-scaling-stroke" });
  const head = mk("line", { x1: 0, x2: 0, y1: 2, y2: 18, stroke: "#FFD23F", "stroke-width": 2, "vector-effect": "non-scaling-stroke" });
  function paint() {
    const seg = segs.find((g) => g.s === slides[cur]);
    segs.forEach((g) => g.r.setAttribute("fill", g === seg ? "#FFD23F" : seg && g.b <= seg.a ? "#9AA0AE" : "#3A4152"));
  }
  (function tick() {
    const t = timer.now();
    head.setAttribute("x1", X(Math.min(t, 660))); head.setAttribute("x2", X(Math.min(t, 660)));
    const seg = segs.find((g) => g.s === slides[cur]);
    const late = seg && timer.running && t > seg.b + 8;
    clock.textContent = `${mmss(t)} / ${mmss(TOTAL)}${late ? "  behind" : ""}`;
    clock.classList.toggle("over", t > TOTAL || !!late);
    requestAnimationFrame(tick);
  })();

  /* ---------- the chapter bar (always there, faint) ---------- */
  const chapterNames = [...new Set(spoken.map((s) => s.dataset.chapter))];
  const chapterBar = $("#chapters");
  const chEls = chapterNames.map((name) => {
    const members = spoken.filter((s) => s.dataset.chapter === name);
    const secs = members.reduce((a, s) => a + +s.dataset.time, 0);
    const b = document.createElement("button");
    b.type = "button";
    b.className = "ch";
    b.style.flexGrow = String(secs);
    b.innerHTML = `<span class="ch-name">${name}</span><span class="ch-line"><i></i></span>`;
    b.addEventListener("click", () => go(slides.indexOf(members[0])));
    chapterBar.appendChild(b);
    return { name, members, b, fill: $("i", b) };
  });
  function chapters() {
    const s = slides[cur];
    chapterBar.classList.toggle("hidden", !s.dataset.chapter);
    chEls.forEach((c) => {
      const i = c.members.indexOf(s), here = i >= 0;
      const before = chapterNames.indexOf(c.name) < chapterNames.indexOf(s.dataset.chapter);
      c.b.classList.toggle("here", here);
      c.b.classList.toggle("done", before);
      const n = sentences(s).length, k = step.get(s) || 0;
      c.fill.style.width = here ? `${((i + (k + 1) / Math.max(1, n)) / c.members.length) * 100}%` : before ? "100%" : "0%";
    });
  }

  /* ---------- script, sentence by sentence ---------- */
  const pane = $("#script"), btnScript = $("#btn-script");
  function script() {
    const s = slides[cur], ps = sentences(s), k = step.get(s) || 0, nx = slides[cur + 1];
    const words = ps.reduce((a, p) => a + said(p).split(/\s+/).length, 0);
    $("#script-h").textContent = `${cur + 1} ${s.dataset.title}: ${s.dataset.time} s, ${words} words${ps.length > 1 ? `, sentence ${k + 1} of ${ps.length}` : ""}`;
    $("#script-now").innerHTML = ps.map((p, i) => `<p class="${i === k ? "on" : i < k ? "said" : ""}">${p.innerHTML}</p>`).join("");
    const first = nx && sentences(nx)[0];
    $("#script-next").innerHTML = nx && first ? `<b>Next, ${cur + 2} ${nx.dataset.title}:</b> ${said(first)}` : "";
    const on = $("#script-now p.on");
    if (on && pane.classList.contains("on")) on.scrollIntoView({ block: "nearest" });
  }
  function setScript(on) {
    if (document.body.classList.contains("presenting")) on = false;
    pane.classList.toggle("on", on);
    btnScript.setAttribute("aria-pressed", String(on));
  }
  btnScript.addEventListener("click", () => setScript(!pane.classList.contains("on")));

  /* ---------- present ---------- */
  let hideCursor = 0;
  function present(on) {
    document.body.classList.toggle("presenting", on);
    if (on) {
      setScript(false);
      if (document.documentElement.requestFullscreen && !document.fullscreenElement) document.documentElement.requestFullscreen().catch(() => {});
      go(cur, step.get(slides[cur]) || 0);
    } else if (document.fullscreenElement && document.exitFullscreen) document.exitFullscreen().catch(() => {});
  }
  $("#btn-present").addEventListener("click", () => present(true));
  document.addEventListener("fullscreenchange", () => {
    document.body.classList.toggle("full", !!document.fullscreenElement);
    if (!document.fullscreenElement && !AUDIENCE) document.body.classList.remove("presenting");
  });
  addEventListener("pointermove", () => {
    if (!document.body.classList.contains("presenting")) return;
    document.body.classList.add("cursor");
    clearTimeout(hideCursor);
    hideCursor = setTimeout(() => document.body.classList.remove("cursor"), 1500);
  });

  const help = $("#help");
  const NAV = ["ArrowRight", "ArrowDown", "PageDown", " ", "ArrowLeft", "ArrowUp", "PageUp", "Home", "End"];
  function key(k) {
    if (["ArrowRight", "ArrowDown", "PageDown", " "].includes(k)) next();
    else if (["ArrowLeft", "ArrowUp", "PageUp"].includes(k)) prev();
    else if (k === "Home") go(0);
    else if (k === "End") go(spoken.length - 1);
    else if (k === "s" || k === "S") setScript(!pane.classList.contains("on"));
    else if (k === "f" || k === "F") present(!document.body.classList.contains("presenting"));
    else if (k === "Escape") present(false);
    else if (k === "t" || k === "T") timer.toggle();
    else if (k === "r" || k === "R") timer.reset();
    else if (k === "w" || k === "W") run("wall");
    else if (k === "b" || k === "B") run("build");
    else if (k === "a" || k === "A") openAudience();
    else if (k === "?") help.classList.toggle("on");
  }
  addEventListener("keydown", (e) => {
    if (e.metaKey || e.ctrlKey || e.altKey) return;
    const k = e.key;
    if (NAV.includes(k)) e.preventDefault();
    if (!AUDIENCE) key(k);
    // on the projector, F fills the screen; every other key (a clicker's, say) goes to the laptop
    else if (k === "f" || k === "F") fill();
    else if (k !== "Escape") send({ type: "key", key: k });
  });

  /* ---------- presenter and audience ----------
     The laptop keeps the script, the timer and the time bar; the audience window,
     on the projector, shows only the slides. Every step the laptop takes is sent
     to it, and keys pressed in it come back, so either window can be in front.
     They talk with postMessage, which works from the server and from disk; after
     a reload of the laptop window the audience window finds it again. */
  const run = (name) => {
    if (name === "build") { if (slides[cur].id === "s01") window.HERO.play(); else (plays[slides[cur].id] || []).forEach((tl) => tl.play(0)); }
    else if (name === "wall") window.WALL && window.WALL.tour();
    else if (name === "hero") window.HERO.play();
    if (!AUDIENCE) send({ type: "cmd", name });
  };
  function send(msg) {
    try { if (peer && !peer.closed) peer.postMessage(Object.assign({ gp: 1 }, msg), "*"); } catch (e) { /* the other window is gone */ }
  }
  function sync() { if (!AUDIENCE) { send({ type: "state", i: cur, k: step.get(slides[cur]) || 0 }); phoneState(); } }
  const linked = () => !!peer && !peer.closed && performance.now() - peerSeen < 4000;
  addEventListener("message", (e) => {
    const m = e.data;
    if (!m || m.gp !== 1 || !e.source || e.source === window) return;
    if (!AUDIENCE && !linked()) setScript(true); // the projector (re)connects: the script comes up here
    peer = e.source; peerSeen = performance.now();
    if (AUDIENCE) {
      if (m.type === "state") { if (m.i !== cur) go(m.i, m.k); else if (m.k !== (step.get(slides[cur]) || 0)) apply(slides[cur], m.k); }
      else if (m.type === "cmd") run(m.name);
      status();
    } else {
      if (m.type === "hello") sync();
      else if (m.type === "key" && (NAV.includes(m.key) || "bBwWtTrR".includes(m.key))) key(m.key);
      badge();
    }
  });
  const btnAud = $("#btn-audience");
  function badge() {
    const on = linked();
    btnAud.classList.toggle("on", on);
    btnAud.setAttribute("aria-pressed", String(on));
    btnAud.textContent = on ? "Projector on" : "Audience";
  }
  function openAudience() {
    if (peer && !peer.closed) { peer.focus(); return; }
    const u = new URL(location.href);
    u.search = "?audience=1"; u.hash = "";
    peer = window.open(u.href, "gp-audience", "popup,width=1280,height=720");
    if (!peer) { alert("The browser blocked the audience window. Allow pop-ups for this page, then press Audience again."); return; }
    setScript(true);
    // where the browser allows it (Chrome asks once), put the window on the other screen
    if (window.getScreenDetails) window.getScreenDetails().then((d) => {
      const other = d.screens.find((s) => s !== d.currentScreen);
      if (other && peer && !peer.closed) { peer.moveTo(other.availLeft, other.availTop); peer.resizeTo(other.availWidth, other.availHeight); }
    }).catch(() => {});
  }
  if (btnAud) btnAud.addEventListener("click", openAudience);

  // the audience window: present mode for good, a note until it fills the screen
  const hint = document.createElement("div");
  function fill() { if (!document.fullscreenElement) document.documentElement.requestFullscreen?.().catch(() => {}); }
  function status() {
    const st = $(".st", hint);
    if (!st) return;
    const on = linked();
    st.classList.toggle("ok", on);
    st.textContent = on ? "Linked to your laptop: each click there moves this screen." : "Not linked yet: open this window with the Audience button on your laptop's board.";
  }
  if (AUDIENCE) {
    document.documentElement.classList.add("audience");
    document.body.classList.add("presenting", "audience");
    document.title = "Audience · " + document.title;
    hint.className = "aud-hint";
    hint.innerHTML = "<b>Audience screen</b><p>Drag this window onto the projector, then click anywhere to fill the screen.</p><p class=\"st\"></p>";
    document.body.appendChild(hint);
    addEventListener("click", fill);
    peer = window.opener;
    const hello = () => { send({ type: "hello" }); status(); };
    hello(); setInterval(hello, 1500);
  } else setInterval(badge, 1000);

  /* ---------- the phone remote (build/serve.py; remote.html) ----------
     The phone shows this slide's script large, with Back, Next and the timer.
     Each step here is posted to the server for the phone, and the phone's
     presses come back as keys. Opening the Phone menu hands the phone to this
     window and redraws its code, so the address follows the network. A board
     opened from disk moves to the server, at the same step, when the menu opens. */
  let driving = false;
  function phoneState() {
    if (!phone || !driving) return;
    const s = slides[cur], ps = sentences(s), k = step.get(s) || 0, nx = slides[cur + 1], first = nx && sentences(nx)[0];
    const seg = segs.find((g) => g.s === s);
    fetch(`api/state?b=${phone}`, { method: "POST", keepalive: true, body: JSON.stringify({
      i: cur, k, n: spoken.length, no: cur + 1, title: s.dataset.title, chapter: s.dataset.chapter, secs: +s.dataset.time,
      lines: ps.map((p) => p.innerHTML.trim()), next: nx && first ? { no: cur + 2, title: nx.dataset.title, line: said(first) } : null,
      t: timer.now(), running: timer.running, total: TOTAL, until: seg ? seg.b : null,
      anim: s.id === "s01" || (plays[s.id] || []).length > 0, // whether Replay has something to play
    }) }).catch(() => {});
  }
  const phoneBox = $("#phone");
  if (!AUDIENCE && phoneBox) {
    const menu = $(".menu", phoneBox), SERVER = "http://localhost:8548/";
    const launch = "<p>The phone remote runs from the board's server. In the board folder, double-click <b>Start board.command</b>: it starts the server and opens the board with this menu ready to scan.</p>";
    let phones = 0, url = null;
    const status = (text, on = false) => { phoneBox.classList.toggle("on", on); const st = $(".ph-st", menu); if (st) st.textContent = text; };
    const show = () => driving
      ? status(phones > 0 ? "Phone connected: it drives this window." : "Waiting for your phone.", phones > 0)
      : status("Another board window has the phone. Click in this window to take it.");
    const draw = (info) => {
      phones = info.phones;
      if (!info.url) { url = null; menu.innerHTML = "<p>This laptop is not on a network yet. Join the same Wi-Fi as your phone, or the phone's Personal Hotspot, then open this menu again.</p>"; return; }
      if (info.url !== url) {
        url = info.url;
        const qr = qrcode(0, "M");
        qr.addData(url); qr.make();
        menu.innerHTML = `<p>Scan with your phone's camera. Phone and laptop must be on the same Wi-Fi; if the page will not open on the phone, join the phone's Personal Hotspot from the laptop and reopen this menu.</p><div class="qr">${qr.createSvgTag({ cellSize: 4, margin: 3, scalable: true })}</div><p class="url">${url}</p><p class="ph-st"></p>`;
      }
      show();
    };
    const info = () => fetch("api/info").then((r) => r.json());
    const claim = () => { if (phone) fetch(`api/claim?b=${phone}`, { method: "POST" }).catch(() => {}); };
    const had = () => { try { return sessionStorage.getItem("gp-phone") === "1"; } catch (err) { return false; } };
    const onWeb = location.protocol === "https:" || (location.protocol === "http:" && !/^(localhost|127\.0\.0\.1|\[::1\])$/.test(location.hostname));
    if (onWeb) {
      // a published copy (GitHub Pages): no server here, so no phone
      menu.innerHTML = "<p>The phone remote runs from the board on your laptop: in the board folder, double-click <b>Start board.command</b>. This web copy has everything else.</p>";
    } else if (location.protocol.startsWith("http")) {
      info().then((i) => {
        if (!i.phone) { menu.innerHTML = "<p>This server was started with --local, so phones cannot reach it. Double-click <b>Start board.command</b> instead.</p>"; return; }
        draw(i);
        const es = new EventSource("api/events?role=board");
        // on (re)connecting, take the phone if this is the window in use: its menu is open, it had the
        // phone before a reload or a server restart, or it is the window in front
        es.addEventListener("hello", (e) => {
          phone = +e.data;
          if (phoneBox.open || driving || had() || (document.visibilityState === "visible" && document.hasFocus())) claim();
        });
        es.addEventListener("driver", (e) => {
          driving = JSON.parse(e.data);
          try { driving ? sessionStorage.setItem("gp-phone", "1") : sessionStorage.removeItem("gp-phone"); } catch (err) { /* private mode */ }
          show(); phoneState();
        });
        // the window you click or type in takes the phone; a tab in the background never does
        for (const ev of ["focus", "pointerdown", "keydown"]) addEventListener(ev, () => { if (!driving) claim(); }, true);
        es.onmessage = (e) => { const k = JSON.parse(e.data); if (["ArrowRight", "ArrowLeft", "t", "r", "b"].includes(k)) key(k); };
        setInterval(() => info().then(draw).catch(() => status("The board's server stopped. Double-click Start board.command to restart it.")), 3000);
      }).catch(() => { menu.innerHTML = launch; });
      phoneBox.addEventListener("toggle", () => { if (phoneBox.open) { claim(); info().then(draw).catch(() => {}); } });
    } else {
      // opened from disk: when the menu opens and the server runs, carry on from it at the same step
      menu.innerHTML = launch;
      phoneBox.addEventListener("toggle", () => {
        if (!phoneBox.open) return;
        fetch(SERVER + "api/info", { mode: "no-cors" }).then(() => {
          menu.innerHTML = "<p>Opening the board from its server, at this slide.</p>";
          location.href = `${SERVER}?phone=1&at=${cur}.${step.get(slides[cur]) || 0}`;
        }).catch(() => { menu.innerHTML = launch; });
      });
    }
  }

  /* ---------- tooltips ---------- */
  const tipEl = $("#tip");
  addEventListener("pointermove", (e) => {
    const t = e.target.closest && e.target.closest("[data-tip]");
    if (!t || document.body.classList.contains("presenting")) { tipEl.classList.remove("on"); return; }
    tipEl.innerHTML = t.dataset.tip;
    const w = tipEl.offsetWidth, h = tipEl.offsetHeight;
    tipEl.style.left = Math.min(innerWidth - w - 8, e.clientX + 14) + "px";
    tipEl.style.top = Math.max(8, e.clientY - h - 12) + "px";
    tipEl.classList.add("on");
  });

  document.fonts && document.fonts.ready.then(() => ScrollTrigger.refresh());
  window.BOARD = { plays, played, go, step };
  enter(0);
  // ?at=12.2 opens at slide 13, step 3 (a board moving from disk to its server keeps its place);
  // ?phone=1 opens the Phone menu, ready to scan
  const params = new URLSearchParams(location.search), at = params.get("at");
  if (at) { const [i, k] = at.split(".").map(Number); setTimeout(() => go(i || 0, k || 0), 300); }
  if (params.get("phone") === "1" && phoneBox && !AUDIENCE) phoneBox.open = true;
  // ?script=1 opens in practice mode with the script showing
  if (new URLSearchParams(location.search).get("script") === "1") setScript(true);
})();
