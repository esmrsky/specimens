# Roadmap

Work queue for Specimens, in priority order. Owner's brief, captured 2026-08-19.

This is meant to be **finished in one pass** — the site is close to done. Work items 1
through 6 in order, then run the audit. Commit and push after each item so partial
progress survives, and tick items off as they land. Quality over volume: a smaller set of
specimens that all work beautifully beats a larger set with broken ones.

---

## 1 · Drop the "How it's built" snippets  ✅ done

Every specimen currently ends with a `<details class="specimen__code">` toggle containing a CSS/JS
snippet. **Remove all of them.** The owner builds with AI; the code isn't the value. What matters is
the *name*, the *aliases*, the *when to use it*, and the *live demo*.

- Delete the `<details class="specimen__code">` block from every specimen in `index.html`.
- Delete the now-dead `.specimen__code` rules from `styles.css`.
- Where a snippet carried an idea that isn't obvious from the demo (e.g. "auto-fit collapses empty
  tracks, auto-fill keeps them"), fold that sentence into the description or the "Use when" line
  rather than losing it.

**Done when:** zero `specimen__code` occurrences remain and no specimen has lost explanatory value.

## 2 · Everything must be interactive  ✅ done

Any specimen that is currently a static picture should become something the reader can operate —
click, drag, hover, toggle, resize, or replay. Static demos to fix include (audit for more):

- Layout specimens that just show boxes: add a control to switch the layout's key variable
  (column count, `auto-fit` vs `auto-fill`, gap size, breakpoint) and watch it reflow live.
- Type specimens: sliders for scale ratio, measure (`ch`), and leading, with the sample text reflowing.
- Elevation / radius / contrast scales: make the swatches clickable to apply to a sample component.
- Every motion specimen needs a replay control (some already have one; make it universal).

**Done when:** no specimen is a still image of an idea. Each one *does* something.

## 3 · Deeper animation coverage — how things appear  ✅ done

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

## 4 · New: Industry layout archetypes  ✅ done

How different kinds of businesses actually build their sites — the section order, the conventions,
and *why* each one is there. This is about page-level composition, not visual style: the same
archetype can be executed brutalist or corporate. Give each archetype a compact live wireframe the
reader can scan, naming each band and what job it does.

Archetypes worth covering (research what these actually look like now, don't work from memory):

- **Restaurant / hospitality** — photography-led hero, menu as a first-class object, reserve/order
  CTA pinned within reach, hours + location + map, story/atmosphere section, gallery.
- **Local service & trades** (plumbing, HVAC, roofing, construction) — phone number in the header and
  sticky on mobile, service-area coverage, trust signals (licensed, insured, years in business,
  reviews), before/after gallery, quote-request form, emergency/after-hours banner. The most
  conversion-driven archetype on this list and the least written about.
- **Creative portfolio** — work first and chrome last, project index, case-study anatomy
  (problem → process → outcome), oversized type, deliberate slowness.
- **SaaS / product** — hero with one claim, social proof strip, feature grid, how-it-works,
  pricing table, FAQ, closing CTA.
- **E-commerce** — listing page (filters, sort, facets) vs product page (gallery, variants, trust
  row, sticky add-to-cart), cart drawer.
- **Agency / studio, real estate, medical & dental, fitness, legal** — cover the ones with genuinely
  distinct conventions; skip any that are just the SaaS archetype with different photos.

For each: name it, list the bands in order, say what the primary conversion action is, and note the
one mistake sites in that vertical most often make. This section is a favorite of the owner's — give
it real care.

## 5 · 2026-era visual styles  ✅ done

The Visual Style section stops at glassmorphism / neumorphism / neo-brutalism. Bring it current —
but **do not assume any single style leads the year**; an earlier draft of this file asserted
tactile/neo-skeuomorphism was the headline and the owner pushed back on that framing. Research what
is actually current before writing, and present a spread rather than a winner.

The through-line as of mid-2026 is a reaction against flat, sterile, AI-generated sameness — warmth,
texture, and depth coming back. Threads worth covering:

- **Tactile / textural** — grain and noise overlays, material surfaces, physical-feeling controls
  with real press depth, "tactile brutalism". Include it as a genuinely tactile demo, not a flat
  mock of one — but as one specimen among several, not the crown.
- **Organic & soft** — flowing shapes, blobs, soft gradients, curved section breaks.
- **Kinetic typography** — type as motion and as the primary visual element.
- **Saturated / dopamine color** — bright, high-contrast, Y2K-nostalgic palettes.
- **Depth & spatial** — 3D objects, WebGL-ish scenes, layered parallax, dimensional lighting.
- **Intent-first minimalism** — minimal, but organized around one action rather than one aesthetic.
- **Adaptive / personalized surfaces** — content that changes by visitor or behavior.

Say what each style *signals* and where it fails, not just how to make it.

## 6 · New: Trends section  ✅ done

Place styles in time — what's rising, what's peaking, what's dated and why — so the reader develops
judgment about *when* a look is right, not just what it's called. Keep it honest and specific: what
problem each trend solves, where it breaks down, what it costs. No listicle filler, and no
predictions stated as fact. Where a trend has already turned (heavy parallax, extreme minimalism,
neumorphism), say so plainly and say what replaced it.

## 7 · Standing quality bar — every pass

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
