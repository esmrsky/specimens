# Roadmap

Work queue for Specimens. Owner's brief captured 2026-08-19; **worked to completion the same day**
in one finishing pass. The site now has 12 sections and 108 specimens across the same three files
(`index.html`, `styles.css`, `app.js`) — still no framework, no dependencies, no build step.

## Completed 2026-08-19

1. ✅ **Dropped the "How it's built" snippets** — all 82 removed; snippet-only insights
   (auto-fit vs auto-fill, rem term in clamp(), bleed techniques, theme-before-paint) folded into
   descriptions.
2. ✅ **Everything interactive** — every formerly static specimen now has a control: layout
   sliders/toggles and resizable demo boxes, live pager and stepper, type-scale ratio + measure +
   leading sliders, clickable elevation/radius/contrast swatches, skeleton/empty-state swaps,
   accent-token swap, stat refresh, pricing billing toggle, and more. Motion demos all have replay.
3. ✅ **Entrances & Exits section** (10 specimens) — entrance families side by side, staggered text
   reveal, count-up, SVG draw-on, exit asymmetry, FLIP removal, `@starting-style`,
   View Transitions, scroll-driven animations, orchestration.
4. ✅ **Page Archetypes section** (7 specimens, researched Aug 2026) — restaurant, local trades,
   portfolio, SaaS, e-commerce PLP/PDP, real estate, legal, as scrollable labeled wireframes with
   conversion action + classic mistake per vertical. Agency/medical/fitness folded into the intro
   as variations.
5. ✅ **Current-era visual styles** (7 specimens, researched) — tactile/textural, organic & soft,
   kinetic type, dopamine color, depth & spatial, intent-first minimalism, adaptive surfaces —
   presented as a spread with no single winner.
6. ✅ **Trends section** — rising/peaking/turned board with solve/break/cost per entry, plus
   "how to judge a trend" and four unresolved industry disagreements.
7. ✅ **Fine-tooth audit** (vendored skill, all six lenses it can run here) — fixed: six demos
   clipping at 375px, mega-menu/tooltip clipping, no-JS invisibility of reveal/stagger, empty
   no-JS pager/FLIP/count-ups, stale counter-badge aria-label, dead CSS. Evidence: 72 section
   screenshots at 375/768/1280 × both themes with zero console errors and no horizontal overflow;
   27/27 functional path assertions; reduced-motion emulation kills every infinite loop; dark-theme
   token parity; no duplicate ids; all TOC links resolve.

## Known gaps / not verified

- **No WebKit/iOS testing** — all browser evidence is headless Chromium. Most fragile on real
  Safari: sticky bands inside the archetype scrollers, `backdrop-filter` (glass, header),
  `-webkit-line-clamp` with a custom property, demo resize handles (no resize affordance on touch —
  they degrade to static boxes).
- Firefox: `@starting-style`/`allow-discrete` and scroll-driven demos fall back to their built-in
  "not supported" notes (by design, untested there).
- Screen-reader behavior unheard (ARIA follows spec); real OS reduced-motion setting emulated only.
- Some demo-internal controls (chip ×, qty steppers) are below the 44px touch floor — they mirror
  real-world pattern sizes; revisit if mobile use matters.

## Standing quality bar — every future pass

- No overlapping or clipped elements at 375 / 768 / 1280 px, in **both** light and dark themes.
- No horizontal page scroll; wide demos scroll inside their own container.
- Zero console errors; no 404s. Every control does what its label says; keyboard reachable;
  visible focus ring. Specimen count, TOC, and ids stay consistent (all generated from the DOM).
- Use the vendored `audit` skill (`.claude/skills/audit/`) for the fine-tooth pass after any batch
  of changes. Mind the harness gotchas in CLAUDE.md before screenshotting.

## Ideas parked (not scheduled)

- iOS Safari lap on a real device (see "Known gaps" for the checklist).
- Split into per-section pages if `index.html` gets unwieldy.
- "Quiz mode" that hides the pattern names so the reader has to recall them.
- Publish to GitHub Pages and link from the esmrsky projects page (**owner has NOT asked for this
  yet — do not enable Pages or touch the projects site without being asked**).
