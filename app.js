/* ==========================================================================
   SPECIMENS — behavior. Each block is labeled with the pattern it powers.
   Plain ES2020, no dependencies. Everything is guarded so a missing element
   never throws.
   ========================================================================== */
(() => {
  "use strict";
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));
  const reducedMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- Theme toggle (pattern: dark mode w/ persisted preference) ---------- */
  const toggleTheme = () => {
    const html = document.documentElement;
    const current = html.dataset.theme || (matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
    const next = current === "dark" ? "light" : "dark";
    html.dataset.theme = next;
    localStorage.setItem("theme", next);
    toast(`Theme: ${next}`);
  };
  $("#themeBtn")?.addEventListener("click", toggleTheme);
  $$("[data-theme-toggle]").forEach((b) => b.addEventListener("click", toggleTheme));

  /* ---------- Sticky header: hide on scroll down, show on scroll up ---------- */
  const header = $("#siteHeader");
  let lastY = scrollY;
  addEventListener("scroll", () => {
    const y = scrollY;
    if (header) header.classList.toggle("is-hidden", y > lastY && y > 120 && !document.body.classList.contains("drawer-open"));
    lastY = y;
    // pattern: back-to-top visibility
    $("#backToTop")?.classList.toggle("is-visible", y > 600);
  }, { passive: true });
  $("#backToTop")?.addEventListener("click", () => scrollTo({ top: 0, behavior: reducedMotion ? "auto" : "smooth" }));

  /* ---------- Off-canvas drawer (pattern: hamburger nav) ---------- */
  const menuBtn = $("#menuBtn"), scrim = $("#scrim");
  const setDrawer = (open) => {
    document.body.classList.toggle("drawer-open", open);
    menuBtn?.setAttribute("aria-expanded", String(open));
    if (open) $("#search")?.focus(); else menuBtn?.focus({ preventScroll: true });
  };
  menuBtn?.addEventListener("click", () => setDrawer(!document.body.classList.contains("drawer-open")));
  scrim?.addEventListener("click", () => setDrawer(false));
  $("#drawerDemoBtn")?.addEventListener("click", () => {
    if (innerWidth > 900) { toast("Shrink the window below 900px to see the drawer"); return; }
    setDrawer(true);
  });
  addEventListener("keydown", (e) => { if (e.key === "Escape" && document.body.classList.contains("drawer-open")) setDrawer(false); });

  /* ---------- Table of contents: generated from sections + specimens ---------- */
  const toc = $("#toc");
  const sections = $$(".section");
  if (toc) {
    sections.forEach((sec) => {
      const li = document.createElement("li");
      li.innerHTML = `<div class="toc__group">${sec.dataset.section}</div>`;
      const ul = document.createElement("ul"); ul.className = "toc"; ul.style.paddingLeft = "0";
      const specimens = $$(".specimen", sec);
      if (specimens.length === 0) {
        ul.innerHTML = `<li><a href="#${sec.id}" data-target="${sec.id}">${sec.dataset.section}</a></li>`;
      }
      specimens.forEach((sp) => {
        const a = document.createElement("a");
        a.href = `#${sp.id}`; a.dataset.target = sp.id; a.textContent = $("h3", sp).textContent;
        const item = document.createElement("li"); item.append(a); ul.append(item);
      });
      li.append(ul); toc.append(li);
    });
    // close drawer when a TOC link is chosen on mobile
    toc.addEventListener("click", (e) => { if (e.target.closest("a") && innerWidth <= 900) setDrawer(false); });
  }

  /* ---------- Scrollspy (pattern: IntersectionObserver-driven active TOC) ---------- */
  const tocLinks = new Map($$("#toc a").map((a) => [a.dataset.target, a]));
  const setActive = (id) => {
    tocLinks.forEach((a) => a.classList.remove("is-active"));
    const a = tocLinks.get(id);
    if (a) { a.classList.add("is-active"); a.scrollIntoView?.({ block: "nearest" }); }
  };
  if ("IntersectionObserver" in window) {
    const spy = new IntersectionObserver((entries) => {
      entries.forEach((e) => { if (e.isIntersecting) setActive(e.target.id); });
    }, { rootMargin: "-15% 0px -75% 0px", threshold: 0 });
    $$(".specimen, .section#glossary").forEach((el) => spy.observe(el));
  }

  /* ---------- Live filter (pattern: filterable list / instant search) ---------- */
  const search = $("#search"), searchCount = $("#searchCount");
  const allSpecimens = $$(".specimen");
  const updateCount = (n) => { if (searchCount) searchCount.textContent = search?.value ? `${n} of ${allSpecimens.length} specimens` : `${allSpecimens.length} specimens`; };
  updateCount(allSpecimens.length);
  search?.addEventListener("input", () => {
    const q = search.value.trim().toLowerCase();
    let shown = 0;
    allSpecimens.forEach((sp) => {
      const hay = `${$("h3", sp).textContent} ${$(".specimen__aka", sp)?.textContent || ""} ${sp.dataset.terms || ""} ${$(".tag", sp)?.textContent || ""}`.toLowerCase();
      const hit = !q || hay.includes(q);
      sp.hidden = !hit;
      const link = tocLinks.get(sp.id); if (link) link.parentElement.hidden = !hit;
      if (hit) shown++;
    });
    sections.forEach((sec) => {
      const specs = $$(".specimen", sec);
      const anyVisible = specs.length === 0 ? !q : specs.some((s) => !s.hidden);
      sec.hidden = !anyVisible;
      const group = $(`#toc a[data-target="${specs[0]?.id}"]`)?.closest("li")?.parentElement?.previousElementSibling;
      if (group) group.hidden = !anyVisible;
    });
    updateCount(shown);
  });

  /* ---------- Mega menu ---------- */
  const megaBtn = $("#megaBtn"), megaPanel = $("#megaPanel");
  const setMega = (open) => { if (!megaPanel) return; megaPanel.hidden = !open; megaBtn.setAttribute("aria-expanded", String(open)); };
  megaBtn?.addEventListener("click", () => setMega(megaPanel.hidden));
  megaBtn?.parentElement?.addEventListener("mouseenter", () => setMega(true));
  megaBtn?.parentElement?.addEventListener("mouseleave", () => setMega(false));

  /* ---------- Dropdown menu (pattern: menu button, roving focus, light dismiss) ---------- */
  const ddBtn = $("#ddBtn"), ddMenu = $("#ddMenu");
  const setDd = (open) => { if (!ddMenu) return; ddMenu.hidden = !open; ddBtn.setAttribute("aria-expanded", String(open)); if (open) $("[role=menuitem]", ddMenu)?.focus(); };
  ddBtn?.addEventListener("click", () => setDd(ddMenu.hidden));
  ddMenu?.addEventListener("keydown", (e) => {
    const items = $$("[role=menuitem]", ddMenu); const i = items.indexOf(document.activeElement);
    if (e.key === "ArrowDown") { e.preventDefault(); items[(i + 1) % items.length].focus(); }
    if (e.key === "ArrowUp") { e.preventDefault(); items[(i - 1 + items.length) % items.length].focus(); }
    if (e.key === "Escape") { setDd(false); ddBtn.focus(); }
  });
  ddMenu?.addEventListener("click", (e) => { const b = e.target.closest("[role=menuitem]"); if (b) { toast(`Chose "${b.textContent}"`); setDd(false); } });
  document.addEventListener("click", (e) => {
    if (ddMenu && !ddMenu.hidden && !e.target.closest(".dropdown")) setDd(false);
    if (megaPanel && !megaPanel.hidden && !e.target.closest(".mega")) setMega(false);
  });

  /* ---------- Tabs (pattern: ARIA tabs w/ roving tabindex) ---------- */
  $$("[role=tablist]").forEach((list) => {
    const tabs = $$("[role=tab]", list);
    const select = (tab) => {
      tabs.forEach((t) => { const on = t === tab; t.setAttribute("aria-selected", String(on)); t.tabIndex = on ? 0 : -1; const p = document.getElementById(t.getAttribute("aria-controls")); if (p) p.hidden = !on; });
      tab.focus();
    };
    tabs.forEach((t, i) => {
      t.addEventListener("click", () => select(t));
      t.addEventListener("keydown", (e) => {
        if (e.key === "ArrowRight") select(tabs[(i + 1) % tabs.length]);
        if (e.key === "ArrowLeft") select(tabs[(i - 1 + tabs.length) % tabs.length]);
        if (e.key === "Home") select(tabs[0]);
        if (e.key === "End") select(tabs[tabs.length - 1]);
      });
    });
  });

  /* ---------- Modal dialog (native <dialog>) ---------- */
  const modal = $("#demoModal");
  $("#openModal")?.addEventListener("click", () => modal?.showModal());
  modal?.addEventListener("click", (e) => { if (e.target.closest("[data-close]")) modal.close(); else if (e.target === modal) modal.close(); /* backdrop click */ });

  /* ---------- Toasts / snackbar (pattern: transient notification in aria-live region) ---------- */
  const region = $("#toastRegion");
  function toast(msg, action) {
    if (!region) return;
    const el = document.createElement("div"); el.className = "toast";
    el.innerHTML = `<span>${msg}</span>` + (action ? `<button type="button">${action}</button>` : "");
    $("button", el)?.addEventListener("click", () => { toast(`${action} clicked`); dismiss(); });
    region.append(el);
    const dismiss = () => { if (!el.isConnected) return; el.classList.add("is-leaving"); el.addEventListener("animationend", () => el.remove(), { once: true }); if (reducedMotion) el.remove(); };
    setTimeout(dismiss, action ? 5000 : 2800);
  }
  $$("[data-toast]").forEach((b) => b.addEventListener("click", () => toast(b.dataset.toast, b.dataset.toastAction)));

  /* ---------- Loading button + progress bar ---------- */
  $("#loadBtn")?.addEventListener("click", function () {
    this.classList.add("is-loading"); this.disabled = true;
    setTimeout(() => { this.classList.remove("is-loading"); this.disabled = false; toast("Saved"); }, 1500);
  });
  $("#progBtn")?.addEventListener("click", () => {
    const bar = $("#progBar"), wrap = bar?.parentElement; if (!bar) return;
    let v = 0; bar.style.width = "0%";
    const tick = () => { v = Math.min(100, v + 5 + Math.random() * 15); bar.style.width = v + "%"; wrap.setAttribute("aria-valuenow", Math.round(v)); if (v < 100) setTimeout(tick, 200); };
    setTimeout(tick, 50);
  });

  /* ---------- Dismissible alerts & chips ---------- */
  document.addEventListener("click", (e) => {
    const close = e.target.closest(".alert__close"); if (close) close.closest(".alert")?.remove();
    const chipX = e.target.closest(".chip button"); if (chipX) chipX.closest(".chip")?.remove();
  });

  /* ---------- Inline validation (blur) + password strength (live) ---------- */
  const emailIn = $("#emailIn"), emailField = $("#emailField");
  emailIn?.addEventListener("blur", () => { const bad = emailIn.value !== "" && !emailIn.checkValidity(); emailField.classList.toggle("is-invalid", bad); emailIn.setAttribute("aria-invalid", String(bad)); });
  emailIn?.addEventListener("input", () => { if (emailIn.checkValidity()) { emailField.classList.remove("is-invalid"); emailIn.setAttribute("aria-invalid", "false"); } });
  const pwIn = $("#pwIn"), pwMeter = $("#pwMeter"), pwHint = $("#pwHint");
  pwIn?.addEventListener("input", () => {
    const v = pwIn.value; let s = 0;
    if (v.length >= 8) s++; if (/[a-z]/.test(v) && /[A-Z]/.test(v)) s++; if (/\d/.test(v)) s++; if (/[^\w]/.test(v)) s++;
    pwMeter.dataset.score = v ? s : 0;
    pwHint.textContent = !v ? "8+ chars, mixed case, a number, a symbol" : ["Very weak", "Weak", "Okay", "Good", "Strong"][s];
  });

  /* ---------- Number stepper ---------- */
  const numIn = $("#numIn"), numDec = $("#numDec"), numInc = $("#numInc");
  const syncNum = () => { if (!numIn) return; numDec.disabled = +numIn.value <= +numIn.min; numInc.disabled = +numIn.value >= +numIn.max; };
  numDec?.addEventListener("click", () => { numIn.stepDown(); syncNum(); });
  numInc?.addEventListener("click", () => { numIn.stepUp(); syncNum(); });
  numIn?.addEventListener("input", syncNum); syncNum();

  /* ---------- Range + output ---------- */
  $("#rng")?.addEventListener("input", (e) => { $("#rngOut").value = e.target.value; });

  /* ---------- Combobox / autocomplete ---------- */
  const comboIn = $("#comboIn"), comboList = $("#comboList");
  const COUNTRIES = ["Argentina","Australia","Austria","Belgium","Brazil","Canada","Chile","China","Colombia","Croatia","Czechia","Denmark","Egypt","Estonia","Finland","France","Germany","Ghana","Greece","Hungary","Iceland","India","Indonesia","Ireland","Israel","Italy","Japan","Kenya","Latvia","Lithuania","Malaysia","Mexico","Morocco","Netherlands","New Zealand","Nigeria","Norway","Pakistan","Peru","Philippines","Poland","Portugal","Romania","Singapore","Slovakia","Slovenia","South Africa","South Korea","Spain","Sweden","Switzerland","Thailand","Turkey","Ukraine","United Kingdom","United States","Uruguay","Vietnam"];
  if (comboIn && comboList) {
    let idx = -1, matches = [];
    const render = () => {
      const q = comboIn.value.trim().toLowerCase();
      matches = q ? COUNTRIES.filter((c) => c.toLowerCase().includes(q)).slice(0, 8) : [];
      comboList.innerHTML = matches.map((c, i) => { const p = c.toLowerCase().indexOf(q); const hl = c.slice(0, p) + "<mark>" + c.slice(p, p + q.length) + "</mark>" + c.slice(p + q.length); return `<li role="option" id="opt${i}" aria-selected="${i === idx}">${hl}</li>`; }).join("");
      comboList.hidden = matches.length === 0; comboIn.setAttribute("aria-expanded", String(!comboList.hidden));
      comboIn.setAttribute("aria-activedescendant", idx >= 0 ? `opt${idx}` : "");
    };
    const commit = (i) => { if (matches[i] == null) return; comboIn.value = matches[i]; idx = -1; comboList.hidden = true; comboIn.setAttribute("aria-expanded", "false"); comboIn.removeAttribute("aria-activedescendant"); toast(`Selected ${comboIn.value}`); };
    comboIn.addEventListener("input", () => { idx = -1; render(); });
    comboIn.addEventListener("keydown", (e) => {
      if (comboList.hidden) return;
      if (e.key === "ArrowDown") { e.preventDefault(); idx = (idx + 1) % matches.length; render(); }
      else if (e.key === "ArrowUp") { e.preventDefault(); idx = (idx - 1 + matches.length) % matches.length; render(); }
      else if (e.key === "Enter") { e.preventDefault(); commit(idx >= 0 ? idx : 0); }
      else if (e.key === "Escape") { comboList.hidden = true; comboIn.setAttribute("aria-expanded", "false"); }
    });
    comboList.addEventListener("mousedown", (e) => { const li = e.target.closest("li"); if (li) { e.preventDefault(); commit(+li.id.slice(3)); } });
    comboIn.addEventListener("blur", () => setTimeout(() => { comboList.hidden = true; comboIn.setAttribute("aria-expanded", "false"); }, 120));
  }

  /* ---------- Ripple (Material-style micro-interaction) ---------- */
  $("#rippleBtn")?.addEventListener("click", function (e) {
    const r = document.createElement("span"); r.className = "ripple";
    const rect = this.getBoundingClientRect(); const size = Math.max(rect.width, rect.height);
    Object.assign(r.style, { width: size + "px", height: size + "px", left: e.clientX - rect.left - size / 2 + "px", top: e.clientY - rect.top - size / 2 + "px" });
    this.append(r); r.addEventListener("animationend", () => r.remove());
  });

  /* ---------- Easing lab ---------- */
  const easeLab = $("#easeLab");
  $("#easeBtn")?.addEventListener("click", () => {
    const track = $(".track", easeLab); easeLab.style.setProperty("--travel", (track.clientWidth - 20) + "px");
    easeLab.classList.remove("is-playing"); void easeLab.offsetWidth; /* force reflow to restart */
    requestAnimationFrame(() => easeLab.classList.add("is-playing"));
  });

  /* ---------- Staggered reveal (replayable) ---------- */
  const staggerRow = $("#staggerRow");
  const replayStagger = () => { if (!staggerRow) return; staggerRow.classList.remove("is-in"); void staggerRow.offsetWidth; staggerRow.classList.add("is-in"); };
  $("#staggerBtn")?.addEventListener("click", replayStagger);

  /* ---------- Scroll-triggered reveal (IntersectionObserver, run once) ---------- */
  const revealEls = $$(".reveal");
  if ("IntersectionObserver" in window && !reducedMotion) {
    const io = new IntersectionObserver((entries, obs) => {
      entries.forEach((e) => { if (e.isIntersecting) { e.target.classList.add("is-visible"); obs.unobserve(e.target); if (e.target.closest("#stagger") || e.target === staggerRow) replayStagger(); } });
    }, { threshold: .2 });
    revealEls.forEach((el) => io.observe(el));
    if (staggerRow) io.observe(staggerRow);
  } else { revealEls.forEach((el) => el.classList.add("is-visible")); staggerRow?.classList.add("is-in"); }
  $("#revealBtn")?.addEventListener("click", () => { revealEls.forEach((el) => el.classList.remove("is-visible")); void document.body.offsetWidth; setTimeout(() => revealEls.forEach((el) => el.classList.add("is-visible")), 30); });

  /* ---------- Flip card ---------- */
  const flip = $("#flipCard");
  const doFlip = () => { flip.classList.toggle("is-flipped"); flip.setAttribute("aria-pressed", flip.classList.contains("is-flipped")); };
  flip?.addEventListener("click", doFlip);
  flip?.addEventListener("keydown", (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); doFlip(); } });

  /* ---------- Animate to auto height ---------- */
  $("#heightBtn")?.addEventListener("click", function () { const p = $("#heightPanel"); const open = p.classList.toggle("is-open"); this.setAttribute("aria-expanded", String(open)); });

  /* ---------- Reduced-motion status ---------- */
  const rm = $("#rmStatus");
  if (rm) rm.innerHTML = reducedMotion ? "✅ Your OS has <b>Reduce motion</b> on — animations on this page are effectively instant." : "Your OS reports <b>no</b> reduced-motion preference — animations play normally. Turn it on in system accessibility settings and reload to compare.";

  /* ---------- Sortable table ---------- */
  const table = $("#sortTable");
  table?.querySelectorAll("th[data-sort]").forEach((th, col) => {
    th.style.cursor = "pointer"; th.title = "Sort";
    th.addEventListener("click", () => {
      const tbody = $("tbody", table); const rows = $$("tr", tbody);
      const dir = th.dataset.dir === "asc" ? "desc" : "asc"; table.querySelectorAll("th").forEach((h) => { delete h.dataset.dir; h.removeAttribute("aria-sort"); });
      th.dataset.dir = dir; th.setAttribute("aria-sort", dir === "asc" ? "ascending" : "descending");
      const idx = Array.from(th.parentElement.children).indexOf(th);
      const val = (tr) => { const t = tr.children[idx].textContent.trim(); return th.dataset.sort === "num" ? parseFloat(t.replace(/[^\d.-]/g, "").replace("−", "-")) * (t.startsWith("−") ? -1 : 1) : t; };
      rows.sort((a, b) => { const x = val(a), y = val(b); return (x > y ? 1 : x < y ? -1 : 0) * (dir === "asc" ? 1 : -1); });
      rows.forEach((r) => tbody.append(r));
    });
  });

  /* ---------- Kanban drag and drop (native HTML5 DnD) ---------- */
  const kanban = $("#kanbanBoard");
  if (kanban) {
    let dragging = null;
    kanban.addEventListener("dragstart", (e) => { dragging = e.target.closest(".kanban__card"); dragging?.classList.add("dragging"); e.dataTransfer.effectAllowed = "move"; });
    kanban.addEventListener("dragend", () => { dragging?.classList.remove("dragging"); dragging = null; $$(".drag-over", kanban).forEach((c) => c.classList.remove("drag-over")); });
    $$(".kanban__col", kanban).forEach((col) => {
      col.addEventListener("dragover", (e) => { e.preventDefault(); col.classList.add("drag-over"); });
      col.addEventListener("dragleave", () => col.classList.remove("drag-over"));
      col.addEventListener("drop", (e) => { e.preventDefault(); if (dragging) col.append(dragging); col.classList.remove("drag-over"); updateCounts(); });
    });
    const updateCounts = () => $$(".kanban__col", kanban).forEach((c) => { $("h5 span", c).textContent = $$(".kanban__card", c).length; });
  }

  /* ---------- Entrances & Exits ---------- */
  const replay = (el) => { if (!el) return; el.classList.remove("play"); void el.offsetWidth; el.classList.add("play"); };
  const onFirstView = (el, fn) => {
    if (!el) return;
    if (!("IntersectionObserver" in window)) { fn(); return; }
    const io = new IntersectionObserver((es, obs) => es.forEach((en) => { if (en.isIntersecting) { obs.disconnect(); fn(); } }), { threshold: .35 });
    io.observe(el);
  };

  // entrance families: play on first view; replay all; replay one tile on click/Enter
  const entGrid = $("#entGrid");
  onFirstView(entGrid, () => entGrid.classList.add("play"));
  $("#entReplay")?.addEventListener("click", () => replay(entGrid));
  const replayTile = (stage) => {
    entGrid.classList.add("play");
    const box = $(".ent__box", stage);
    box.style.animation = "none"; void box.offsetWidth; box.style.animation = "";
  };
  entGrid?.addEventListener("click", (e) => { const s = e.target.closest(".ent__stage"); if (s) replayTile(s); });
  entGrid?.addEventListener("keydown", (e) => { const s = e.target.closest(".ent__stage"); if (s && (e.key === "Enter" || e.key === " ")) { e.preventDefault(); replayTile(s); } });

  // staggered text reveal (real text stays in aria-label on the container)
  const trEl = $("#textReveal");
  const TR_TEXT = trEl?.textContent || "";
  const splitTr = (byLetter) => {
    trEl.style.setProperty("--tr-delay", byLetter ? "35ms" : "60ms");
    const parts = byLetter ? [...TR_TEXT] : TR_TEXT.split(/(\s+)/).filter(Boolean);
    trEl.innerHTML = parts.map((p, i) => `<span style="--i:${i}" aria-hidden="true">${p}</span>`).join("");
    replay(trEl);
  };
  if (trEl) {
    onFirstView(trEl, () => splitTr(false));
    $("#trWords")?.addEventListener("change", () => splitTr(false));
    $("#trLetters")?.addEventListener("change", () => splitTr(true));
    $("#trReplay")?.addEventListener("click", () => splitTr($("#trLetters").checked));
  }

  // number count-up
  const runCount = (el) => {
    const target = +el.dataset.value, dec = +(el.dataset.decimals || 0), suffix = el.dataset.suffix || "";
    const start = performance.now(), dur = reducedMotion ? 1 : 1200;
    const fmt = (v) => v.toFixed(dec).replace(/\B(?=(\d{3})+(?!\d))/g, ",") + suffix;
    const tick = (now) => {
      const t = Math.min(1, (now - start) / dur);
      el.textContent = fmt(target * (1 - Math.pow(1 - t, 3)));
      if (t < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  };
  const countEls = [$("#countUp1"), $("#countUp2")].filter(Boolean);
  onFirstView(countEls[0], () => countEls.forEach(runCount));
  $("#countReplay")?.addEventListener("click", () => countEls.forEach(runCount));

  // draw-on SVG stroke
  const drawSvg = $("#drawSvg");
  onFirstView(drawSvg, () => drawSvg.classList.add("play"));
  $("#drawReplay")?.addEventListener("click", () => replay(drawSvg));

  // exit asymmetry
  const exitCard = $("#exitCard"), exitToggle = $("#exitToggle");
  exitToggle?.addEventListener("click", () => {
    const showing = !exitCard.hidden && !exitCard.classList.contains("leaving");
    if (showing) {
      exitCard.classList.remove("entering"); exitCard.classList.add("leaving");
      const hide = () => { exitCard.hidden = true; exitCard.classList.remove("leaving"); };
      if (reducedMotion) hide(); else exitCard.addEventListener("animationend", hide, { once: true });
      exitToggle.textContent = "Bring it back"; exitToggle.setAttribute("aria-pressed", "false");
    } else {
      exitCard.hidden = false; exitCard.classList.remove("leaving"); exitCard.classList.add("entering");
      exitToggle.textContent = "Dismiss"; exitToggle.setAttribute("aria-pressed", "true");
    }
  });

  // FLIP removal reflow (Web Animations API)
  const flipList = $("#flipList");
  const FLIP_ITEMS = ["Research", "Wireframe", "Prototype", "Test", "Ship", "Iterate"];
  const renderFlip = () => { if (flipList) flipList.innerHTML = FLIP_ITEMS.map((t) => `<span class="flip-item">${t} <button aria-label="Remove ${t}">×</button></span>`).join(""); };
  renderFlip();
  flipList?.addEventListener("click", (e) => {
    const btn = e.target.closest("button"); if (!btn) return;
    const item = btn.closest(".flip-item");
    const others = $$(".flip-item", flipList).filter((el) => el !== item);
    const first = new Map(others.map((el) => [el, el.getBoundingClientRect()]));
    item.remove();
    others.forEach((el) => {
      const f = first.get(el), l = el.getBoundingClientRect();
      const dx = f.left - l.left, dy = f.top - l.top;
      if (dx || dy) el.animate([{ transform: `translate(${dx}px, ${dy}px)` }, { transform: "none" }], { duration: reducedMotion ? 1 : 300, easing: "cubic-bezier(.16,1,.3,1)" });
    });
  });
  $("#flipRestore")?.addEventListener("click", renderFlip);

  // @starting-style panel
  const ssPanel = $("#ssPanel"), ssToggle = $("#ssToggle");
  ssToggle?.addEventListener("click", () => {
    const show = ssPanel.hidden;
    ssPanel.hidden = !show;
    ssToggle.textContent = show ? "Hide the panel" : "Show the panel";
    ssToggle.setAttribute("aria-expanded", String(show));
  });
  if (ssPanel && !CSS.supports?.("transition-behavior", "allow-discrete")) $("#ssSupport").textContent = "This browser doesn't support allow-discrete yet — the panel snaps instead of animating.";

  // view transitions
  const vtGrid = $("#vtGrid"), vtSupport = $("#vtSupport");
  if (vtSupport) vtSupport.textContent = document.startViewTransition ? "✓ supported in this browser" : "✗ no support here — the shuffle happens instantly";
  $("#vtShuffle")?.addEventListener("click", () => {
    const shuffle = () => $$(".vt-tile", vtGrid).sort(() => Math.random() - .5).forEach((t) => vtGrid.append(t));
    if (document.startViewTransition && !reducedMotion) document.startViewTransition(shuffle); else shuffle();
  });

  // orchestration
  const orchDemo = $("#orchDemo");
  onFirstView(orchDemo, () => orchDemo.classList.add("play"));
  $("#orchReplay")?.addEventListener("click", () => replay(orchDemo));

  /* ---------- Demo controls: generic slider→custom-property + class-toggle bindings ---------- */
  $$("input[data-prop]").forEach((input) => {
    const specimen = input.closest(".specimen");
    const target = specimen?.querySelector(input.dataset.target || ".specimen__demo");
    const out = input.parentElement.querySelector("output");
    const apply = () => {
      const val = input.value + (input.dataset.unit || "");
      target?.style.setProperty(input.dataset.prop, val);
      if (out) out.value = val;
    };
    input.addEventListener("input", apply); apply();
  });
  $$("[data-toggle-class]").forEach((btn) => {
    const target = btn.closest(".specimen")?.querySelector(btn.dataset.target);
    btn.addEventListener("click", () => {
      const on = target?.classList.toggle(btn.dataset.toggleClass);
      btn.setAttribute("aria-pressed", String(!!on));
    });
  });

  /* ---------- RAM grid: auto-fit vs auto-fill ---------- */
  const ramGrid = $(".ram");
  $("#ramFit")?.addEventListener("change", () => ramGrid?.classList.remove("is-fill"));
  $("#ramFill")?.addEventListener("change", () => ramGrid?.classList.add("is-fill"));

  /* ---------- Bento: click a tile to cycle its span ---------- */
  const BENTO_SPANS = [["", "1×1"], ["span-21", "2×1"], ["span-12", "1×2"], ["span-22", "2×2"], ["span-31", "3×1"]];
  $("#bentoGrid")?.addEventListener("click", (e) => {
    const tile = e.target.closest("button.box"); if (!tile) return;
    const i = BENTO_SPANS.findIndex(([cls]) => cls && tile.classList.contains(cls));
    const next = BENTO_SPANS[(i + 1 + (i === -1 ? 1 : 0)) % BENTO_SPANS.length] || BENTO_SPANS[0];
    BENTO_SPANS.forEach(([cls]) => cls && tile.classList.remove(cls));
    if (next[0]) tile.classList.add(next[0]);
    tile.textContent = next[1];
  });

  /* ---------- Full-bleed on/off ---------- */
  $("#bleedToggle")?.addEventListener("change", (e) => $(".bleed-wrap")?.classList.toggle("no-bleed", !e.target.checked));

  /* ---------- Breadcrumbs: click an ancestor to jump up the trail ---------- */
  const crumbTrail = $("#crumbTrail"), crumbReset = $("#crumbReset");
  const crumbHome = crumbTrail?.innerHTML;
  crumbTrail?.addEventListener("click", (e) => {
    const a = e.target.closest("a"); if (!a) return;
    e.preventDefault();
    const li = a.closest("li");
    while (li.nextElementSibling) li.nextElementSibling.remove();
    li.innerHTML = li.textContent; li.setAttribute("aria-current", "page");
    crumbReset.hidden = false;
  });
  crumbReset?.addEventListener("click", () => { crumbTrail.innerHTML = crumbHome; crumbReset.hidden = true; });

  /* ---------- Pagination: a live pager with moving truncation ---------- */
  const pager = $("#pagerDemo");
  if (pager) {
    let page = 2; const total = 12;
    const renderPager = () => {
      const nums = new Set([1, total, page - 1, page, page + 1]);
      const items = [];
      items.push(`<li><a href="#pagination" data-page="${page - 1}" aria-label="Previous" ${page === 1 ? 'aria-disabled="true"' : ""}>‹</a></li>`);
      let prev = 0;
      for (let n = 1; n <= total; n++) {
        if (!nums.has(n)) continue;
        if (n - prev > 1) items.push(`<li><span class="ellipsis">…</span></li>`);
        items.push(`<li><a href="#pagination" data-page="${n}" ${n === page ? 'aria-current="page"' : ""}>${n}</a></li>`);
        prev = n;
      }
      items.push(`<li><a href="#pagination" data-page="${page + 1}" aria-label="Next" ${page === total ? 'aria-disabled="true"' : ""}>›</a></li>`);
      pager.innerHTML = items.join("");
    };
    pager.addEventListener("click", (e) => {
      const a = e.target.closest("a[data-page]"); if (!a) return;
      e.preventDefault();
      const n = +a.dataset.page;
      if (n >= 1 && n <= total) { page = n; renderPager(); }
    });
    renderPager();
  }

  /* ---------- Stepper: back / continue ---------- */
  const stepper = $("#stepperDemo");
  if (stepper) {
    let step = 1; const steps = $$("li", stepper);
    const renderSteps = () => {
      steps.forEach((li, i) => {
        li.className = i < step ? "is-done" : i === step ? "is-current" : "";
        $(".dot", li).textContent = i < step ? "✓" : i + 1;
      });
      $("#stepBack").disabled = step === 0;
      $("#stepNext").disabled = step === steps.length - 1;
    };
    $("#stepBack")?.addEventListener("click", () => { step = Math.max(0, step - 1); renderSteps(); });
    $("#stepNext")?.addEventListener("click", () => { step = Math.min(steps.length - 1, step + 1); renderSteps(); });
    renderSteps();
  }

  /* ---------- Type scale: one ratio generates every size ---------- */
  const scaleDemo = $("#scaleDemo"), scaleRatio = $("#scaleRatio");
  if (scaleDemo && scaleRatio) {
    const NAMED = [[1.125, "major second"], [1.2, "minor third"], [1.25, "major third"], [1.333, "perfect fourth"], [1.414, "aug. fourth"], [1.5, "perfect fifth"], [1.618, "golden ratio"]];
    const renderScale = () => {
      const r = +scaleRatio.value;
      $$("p[data-exp]", scaleDemo).forEach((p) => {
        const size = Math.pow(r, +p.dataset.exp);
        p.style.fontSize = `min(${size}rem, 16vw)`; // cap so the display row can't overflow a phone screen
        $("small", p).textContent = size.toFixed(2) + "rem";
      });
      const named = NAMED.find(([v]) => Math.abs(v - r) < 0.012);
      $("#scaleRatioOut").value = r.toFixed(3) + (named ? " · " + named[1] : "");
    };
    scaleRatio.addEventListener("input", renderScale); renderScale();
  }

  /* ---------- Fluid type: simulate a viewport width through clamp() ---------- */
  const fluidRange = $("#fluidRange");
  if (fluidRange) {
    const renderFluid = () => {
      const w = +fluidRange.value;
      const px = Math.min(Math.max(19.2, 8 + 0.03 * w), 41.6); // clamp(1.2rem, .5rem + 3vw, 2.6rem) at 16px root
      $("#fluidSample").style.fontSize = px + "px";
      $("#fluidOut").value = `${w}px → ${px.toFixed(1)}px`;
    };
    fluidRange.addEventListener("input", renderFluid); renderFluid();
  }

  /* ---------- text-wrap: balance on/off ---------- */
  $("#balanceToggle")?.addEventListener("change", (e) => $("#balanceSample")?.classList.toggle("balance-off", !e.target.checked));

  /* ---------- Skeleton → loaded content ---------- */
  const skelBtn = $("#skelBtn");
  skelBtn?.addEventListener("click", () => {
    const loaded = $("#skelLoaded").hidden;
    $("#skelLoaded").hidden = !loaded; $("#skelLoading").hidden = loaded;
    skelBtn.textContent = loaded ? "Load again" : "Finish loading";
  });

  /* ---------- Empty state ↔ first item ---------- */
  const setEmpty = (empty) => { $("#emptyState").hidden = !empty; $("#emptyFilled").hidden = empty; };
  $("#emptyCreate")?.addEventListener("click", () => setEmpty(false));
  $("#emptyDelete")?.addEventListener("click", () => setEmpty(true));

  /* ---------- Counter badges: click to mark read ---------- */
  $$(".count").forEach((wrap) => {
    const btn = $("button", wrap), n = $(".count__n", wrap);
    if (!btn || !n) return;
    const original = n.textContent;
    btn.addEventListener("click", () => {
      const cleared = !n.hidden;
      n.hidden = cleared;
      if (cleared) toast("Marked as read"); else n.textContent = original;
    });
  });

  /* ---------- Simulate reduced motion ---------- */
  $("#simRm")?.addEventListener("change", (e) => document.body.classList.toggle("sim-reduced-motion", e.target.checked));

  /* ---------- Design tokens: swap --accent live ---------- */
  $$(".accent-swatch").forEach((btn) => btn.addEventListener("click", () => {
    const c = btn.dataset.accent;
    if (c) document.documentElement.style.setProperty("--accent", c);
    else document.documentElement.style.removeProperty("--accent");
    $$(".accent-swatch").forEach((b) => b.setAttribute("aria-pressed", String(b === btn)));
  }));

  /* ---------- Elevation & radius: click a swatch, restyle the sample ---------- */
  $("#shadowSwatches")?.addEventListener("click", (e) => {
    const b = e.target.closest("[data-level]"); if (!b) return;
    $("#shadowSample").style.boxShadow = `var(--shadow-${b.dataset.level})`;
    $("#shadowLabel").textContent = `--shadow-${b.dataset.level}`;
    $$("#shadowSwatches [data-level]").forEach((s) => s.setAttribute("aria-pressed", String(s === b)));
  });
  $("#radiusSwatches")?.addEventListener("click", (e) => {
    const b = e.target.closest("[data-r]"); if (!b) return;
    const r = b.dataset.r;
    $("#radiusSample").style.borderRadius = r;
    $("#radiusBtn").style.borderRadius = r === "999px" ? "999px" : r;
    $("#radiusLabel").textContent = r;
    $$("#radiusSwatches [data-r]").forEach((s) => s.setAttribute("aria-pressed", String(s === b)));
  });

  /* ---------- Contrast checker: lightness slider → live WCAG ratio ---------- */
  const contrastRange = $("#contrastRange");
  if (contrastRange) {
    const lum = (r, g, b) => {
      const f = (v) => { v /= 255; return v <= 0.04045 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); };
      return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
    };
    const renderContrast = () => {
      const L = +contrastRange.value;
      const v = Math.round(L * 2.55);
      const ratio = (1.05) / (lum(v, v, v) + 0.05);
      const chip = $("#contrastChip");
      chip.style.color = `rgb(${v} ${v} ${v})`;
      const grade = ratio >= 7 ? "✓ AAA" : ratio >= 4.5 ? "✓ AA" : ratio >= 3 ? "large text only" : "✗ fail";
      $("#contrastOut").value = `${ratio.toFixed(1)}:1 ${grade}`;
    };
    contrastRange.addEventListener("input", renderContrast); renderContrast();
  }

  /* ---------- Stat tiles: simulate a data refresh with count-up ---------- */
  $("#statsBtn")?.addEventListener("click", () => {
    $$(".stat").forEach((stat) => {
      const valueEl = $(".stat__value", stat), deltaEl = $(".stat__delta", stat), line = $(".sparkline polyline", stat);
      const fmt = valueEl.textContent;
      let target, render;
      if (fmt.includes("k")) { target = 20 + Math.random() * 60; render = (v) => v.toFixed(1) + "k"; }
      else if (fmt.includes("%")) { target = 15 + Math.random() * 40; render = (v) => Math.round(v) + "%"; }
      else { target = 5000 + Math.random() * 8000; render = (v) => "$" + Math.round(v).toLocaleString("en-US"); }
      const delta = (Math.random() * 24 - 10);
      deltaEl.textContent = (delta >= 0 ? "▲ " : "▼ ") + Math.abs(delta).toFixed(1) + "%";
      deltaEl.className = "stat__delta " + (delta >= 0 ? "up" : "down");
      line?.setAttribute("stroke", delta >= 0 ? "var(--success)" : "var(--danger)");
      line?.setAttribute("points", Array.from({ length: 7 }, (_, i) => `${Math.round(i * 100 / 6)},${Math.round(3 + Math.random() * 22)}`).join(" "));
      const start = performance.now(), dur = reducedMotion ? 1 : 500;
      const tick = (now) => {
        const t = Math.min(1, (now - start) / dur);
        valueEl.textContent = render(target * (1 - Math.pow(1 - t, 3)));
        if (t < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    });
  });

  /* ---------- Timeline: prepend an event ---------- */
  const TL_EVENTS = ["Out for delivery — courier assigned.", "Customs cleared — no duty owed.", "Arrived at local depot.", "Delivery attempted — nobody home.", "Delivered — signed by J. Doe."];
  let tlIdx = 0;
  $("#timelineBtn")?.addEventListener("click", () => {
    const li = document.createElement("li");
    const now = new Date();
    const pad = (n) => String(n).padStart(2, "0");
    const msg = TL_EVENTS[tlIdx++ % TL_EVENTS.length].split(" — ");
    li.innerHTML = `<time>${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())} ${pad(now.getHours())}:${pad(now.getMinutes())}</time><strong>${msg[0]}</strong>${msg[1] ? " — " + msg[1] : ""}`;
    li.className = "t-in";
    $("#timelineDemo").prepend(li);
  });

  /* ---------- Avatar stack: overflow into "+N" ---------- */
  const avatarRange = $("#avatarRange");
  if (avatarRange) {
    const POOL = [["AK", "#b3411f"], ["JD", "#6b8fd8"], ["MR", "#2f7d4a"], ["TS", "#b8860b"], ["LC", "#8f3a72"], ["NB", "#2b5fb3"], ["OP", "#b42323"], ["EW", "#4a7d7d"]];
    const renderAvatars = () => {
      const n = +avatarRange.value;
      const shown = Math.min(n, 4);
      let html = POOL.slice(0, shown).map(([init, c]) => `<div class="avatar" style="background:${c}">${init}</div>`).join("");
      if (n > shown) html += `<div class="avatar avatar--more">+${n - shown}</div>`;
      $("#avatarStack").innerHTML = html;
      $("#avatarCount").textContent = `${n} collaborator${n === 1 ? "" : "s"}`;
      avatarRange.parentElement.querySelector("output").value = n;
    };
    avatarRange.addEventListener("input", renderAvatars); renderAvatars();
  }

  /* ---------- Pricing: monthly / yearly toggle ---------- */
  const setBilling = (yearly) => {
    $$(".price__amt").forEach((amt) => { amt.textContent = yearly ? amt.dataset.y : amt.dataset.m; });
    $$(".price__per").forEach((p) => { p.textContent = yearly ? "per year (2 months free)" : "per month"; });
  };
  $("#billM")?.addEventListener("change", () => setBilling(false));
  $("#billY")?.addEventListener("change", () => setBilling(true));

  /* ---------- 2026 styles: kinetic type, dopamine toggle, tilt, intent, adaptive ---------- */
  const kinetic = $("#kineticType");
  if (kinetic) {
    const text = kinetic.textContent;
    kinetic.innerHTML = [...text].map((c, i) => `<span style="--i:${i}" aria-hidden="true">${c}</span>`).join("");
    onFirstView(kinetic, () => kinetic.classList.add("play"));
    $("#kineticReplay")?.addEventListener("click", () => replay(kinetic));
  }

  $("#dopaToggle")?.addEventListener("change", (e) => $("#dopaCard")?.classList.toggle("is-loud", e.target.checked));

  const tiltStage = $("#tiltStage"), tiltCard = $("#tiltCard");
  if (tiltStage && !reducedMotion) {
    tiltStage.classList.add("is-idle");
    tiltStage.addEventListener("pointermove", (e) => {
      if (e.pointerType === "touch") return;
      tiltStage.classList.remove("is-idle");
      const r = tiltCard.getBoundingClientRect();
      const clamp01 = (v) => Math.min(1, Math.max(0, v));
      const x = clamp01((e.clientX - r.left) / r.width), y = clamp01((e.clientY - r.top) / r.height);
      tiltCard.style.setProperty("--ry", ((x - .5) * 16).toFixed(1) + "deg");
      tiltCard.style.setProperty("--rx", ((0.5 - y) * 12).toFixed(1) + "deg");
      tiltCard.style.setProperty("--gx", (x * 100).toFixed(1) + "%");
      tiltCard.style.setProperty("--gy", (y * 100).toFixed(1) + "%");
    });
    tiltStage.addEventListener("pointerleave", () => {
      ["--rx", "--ry", "--gx", "--gy"].forEach((p) => tiltCard.style.removeProperty(p));
      tiltStage.classList.add("is-idle");
    });
  }

  $("#intentToggle")?.addEventListener("change", (e) => $("#intentDemo")?.classList.toggle("is-cluttered", e.target.checked));

  // adaptive surface: time-of-day greeting + visit memory (localStorage)
  const adaptGreeting = $("#adaptGreeting");
  if (adaptGreeting) {
    const renderAdapt = () => {
      const h = new Date().getHours();
      const daypart = h < 5 ? "Up late" : h < 12 ? "Good morning" : h < 18 ? "Good afternoon" : "Good evening";
      let visits = 0;
      try { visits = (+localStorage.getItem("adaptVisits") || 0) + 1; localStorage.setItem("adaptVisits", visits); } catch {}
      adaptGreeting.textContent = `${daypart}.`;
      $("#adaptNote").textContent = visits > 1
        ? `This is load №${visits} of this demo in your browser — a real site could resume where you left off instead of re-pitching you.`
        : "First visit, so you get the introduction. Reload and this line will change.";
    };
    renderAdapt();
    $("#adaptReset")?.addEventListener("click", () => { try { localStorage.removeItem("adaptVisits"); } catch {} $("#adaptNote").textContent = "Memory cleared — reload to be greeted as a stranger again."; toast("Forgotten"); });
  }

  /* ---------- Popover fallback for older browsers ---------- */
  if (!HTMLElement.prototype.hasOwnProperty("popover")) {
    $$("[popovertarget]").forEach((b) => { const p = document.getElementById(b.getAttribute("popovertarget")); if (!p) return; p.style.display = "none"; b.addEventListener("click", () => { p.style.display = p.style.display === "none" ? "block" : "none"; }); });
  }
})();
