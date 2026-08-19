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
  const themeBtn = $("#themeBtn");
  themeBtn?.addEventListener("click", () => {
    const html = document.documentElement;
    const current = html.dataset.theme || (matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
    const next = current === "dark" ? "light" : "dark";
    html.dataset.theme = next;
    localStorage.setItem("theme", next);
    toast(`Theme: ${next}`);
  });

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

  /* ---------- Popover fallback for older browsers ---------- */
  if (!HTMLElement.prototype.hasOwnProperty("popover")) {
    $$("[popovertarget]").forEach((b) => { const p = document.getElementById(b.getAttribute("popovertarget")); if (!p) return; p.style.display = "none"; b.addEventListener("click", () => { p.style.display = p.style.display === "none" ? "block" : "none"; }); });
  }
})();
