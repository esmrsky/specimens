# Roadmap

Work queue for Specimens, in priority order. Owner's brief, captured 2026-08-19.
The nightly routine works through this file: pick the highest-priority unchecked item,
do it completely, verify it, commit, and check it off. Small, complete, verified passes
beat large half-finished ones.

---

## 1 · Drop the "How it's built" snippets  ← do this first

Every specimen currently ends with a `<details class="specimen__code">` toggle containing a CSS/JS
snippet. **Remove all of them.** The owner builds with AI; the code isn't the value. What matters is
the *name*, the *aliases*, the *when to use it*, and the *live demo*.

- Delete the `<details class="specimen__code">` block from every specimen in `index.html`.
- Delete the now-dead `.specimen__code` rules from `styles.css`.
- Where a snippet carried an idea that isn't obvious from the demo (e.g. "auto-fit collapses empty
  tracks, auto-fill keeps them"), fold that sentence into the description or the "Use when" line
  rather than losing it.

**Done when:** zero `specimen__code` occurrences remain and no specimen has lost explanatory value.

## 2 · Everything must be interactive

Any specimen that is currently a static picture should become something the reader can operate —
click, drag, hover, toggle, resize, or replay. Static demos to fix include (audit for more):

- Layout specimens that just show boxes: add a control to switch the layout's key variable
  (column count, `auto-fit` vs `auto-fill`, gap size, breakpoint) and watch it reflow live.
- Type specimens: sliders for scale ratio, measure (`ch`), and leading, with the sample text reflowing.
- Elevation / radius / contrast scales: make the swatches clickable to apply to a sample component.
- Every motion specimen needs a replay control (some already have one; make it universal).

**Done when:** no specimen is a still image of an idea. Each one *does* something.

## 3 · Deeper animation coverage — how things appear

The Motion section is broad but shallow on **entrance and exit choreography**, which is what the
owner most wants to learn. Expand into a fuller treatment, either as a larger Motion section or a
dedicated one:

- Entrance families: fade, rise, scale-in, blur-in, mask/wipe reveal, clip-path reveal, letter/word
  staggered text reveal, number count-up, draw-on SVG stroke.
- Exit and swap: cross-fade, collapse-and-remove, item removal reflow (FLIP technique).
- Orchestration: stagger, sequence, overlap/anticipation, entrance vs exit asymmetry (exits faster).
- Modern APIs worth naming and demoing: View Transitions, `@starting-style` + `transition-behavior:
  allow-discrete` (animating in from `display:none`), scroll-driven animations
  (`animation-timeline: view()`), `interpolate-size: allow-keywords`, the Web Animations API.
- Duration and easing guidance per family — what each entrance *communicates*, not just how it looks.

**Done when:** a reader can name the entrance they want and see it side by side with its alternatives.

## 4 · 2026-era visual styles

The Visual Style section stops at glassmorphism / neumorphism / neo-brutalism. Add what's current,
with the same treatment (name, aliases, what it signals, live demo):

- **Tactile / neo-skeuomorphic** — the owner asked for this specifically. Physical-feeling controls:
  layered inner and outer shadows, subtle bevels and specular highlights, material-like press states
  with real depth, grain/noise texture overlays, chunky knobs and switches that feel pressable.
- Others worth covering: spatial/depth UI, soft 3D, dimensional shadows and lighting models,
  grain and noise, editorial/print-inspired layout, anti-design and maximalist type, dark-first
  palettes, adaptive/ambient color, motion-forward "living" surfaces.

**Done when:** the section reads as current, and tactile/skeuomorphic is a first-class specimen
with a genuinely tactile demo (not a flat mock of one).

## 5 · New: Trends section

A section that places styles in time — what's rising, what's peaking, what's dated and why — so the
reader develops judgment about *when* a look is right, not just what it's called. Keep it honest and
specific (what problem each trend solves, where it fails); avoid trend-listicle filler.

## 6 · Standing quality bar — every pass

Before committing any pass, confirm:

- No overlapping or clipped elements at 375 / 768 / 1280 px, in **both** light and dark themes.
- No horizontal page scroll; wide demos scroll inside their own container.
- Zero console errors; no 404s.
- Every interactive control does what its label says; keyboard reachable; visible focus ring.
- Nothing regressed: the specimen count in the sidebar matches reality, TOC links all resolve,
  no duplicate `id` attributes.

Use the vendored `audit` skill (`.claude/skills/audit/`) for the fine-tooth pass once a batch of new
sections has landed — it is the right tool for "make sure everything works beautifully."

---

## Ideas parked (not scheduled)

- Split into per-section pages if `index.html` gets unwieldy.
- "Quiz mode" that hides the pattern names so the reader has to recall them.
- Publish to GitHub Pages and link from the esmrsky projects page (**owner has NOT asked for this
  yet — do not enable Pages or touch the projects site without being asked**).
