# The six lenses — checklists with the traps that have actually bitten

Read once per audit. Each item is here because it was missed at least once; the "why" is attached so
you can recognise the family, not just the instance.

## Static (source vs. browser)

- **Media-query overrides placed before the base rule** lose on source order (media queries add no
  specificity) and silently do nothing. Grep every `@media` block, then check whether the same
  selector+property is re-declared later. Verify with `harness eval` on the live page — the computed
  value is the only proof.
- **Theme tokens defined in one dark path but not the other.** `prefers-color-scheme` block and the
  `[data-theme=dark]` toggle block are separate code paths; a token missing from one gives light-mode
  colours in the toggled theme only. Diff the two blocks token-by-token.
- **Hard-coded colours** (`#d9534f`, `white`) in a tokenised stylesheet — off-palette and theme-blind.
- **Dead code**: classes never emitted by JS/HTML (build a set from the CSS, grep the JS/HTML for each —
  remember dynamically-built class names), features whose UI was removed but whose code stayed (a
  search index with no input), CSS for a component that was replaced (accordion styles when the render
  now emits a filmstrip).
- **Source of truth**: is `index.html` built from `src/`? Then findings point at `src/`, and the live
  bytes must hash-match the built file — otherwise you audited something that isn't deployed.
- **`padding` shorthand on a second class clobbering a layout class's horizontal padding** — but check
  for a compensating margin before calling it a bug; compound selectors (`.a.b`) are the immune pattern.

## Visual (screenshots + measurement, three widths, both themes)

- **Stacked paddings**: section padding + view padding + hero padding = a blank first screen. Measure
  the distance from the sticky header to the first meaningful pixel.
- **Panels locked to an outlier**: any "measure all variants and take the max" sizing (preview cards,
  tab panes) — one long item inflates every view. Measure the actual per-variant heights.
- **Tint/band edges**: section backgrounds inside a max-width wrapper paint a column with visible
  edges; full-bleed needs the section outside the wrap with an inner wrap.
- **SVG labels**: font-size in viewBox units × (rendered width ÷ viewBox width) = real pixels. Diagrams
  that shrink to 325px on mobile turn 8-unit labels into ~2.5px. Look for label overlaps at each width
  (corner refs vs axis labels) and for `paint-order: stroke` halos whose stroke colour matches the
  label colour on some fills (light halo + white-on-dark label = smudge).
- **Type scale sprawl**: list every distinct `font-size` for labels; more than three micro sizes is a
  system that isn't one. Anything under ~11px in a faint token fails AA (compute the ratios; don't guess).
- **Affordance inversion**: non-interactive cards that lift on hover; interactive cards whose only cue
  is hover-revealed (touch never sees it); an interactive component's class reused for static text.
- **Consistency across siblings**: two card types in adjacent sections with different header layouts,
  hover offsets (2 / 2.5 / 4px), transition durations, radius, icon chip sizes.
- **`text-wrap`**: `balance` on headings only misses title-ish `<b>`/`<strong>`; paragraphs and ledes
  want `pretty`; `overflow-wrap: anywhere` breaks mid-word where `break-word` would not.
- **44px floor** on everything interactive — measure, don't assume; nav links, toggles, chips, rail dots.

## Functional (drive every inventory path)

For each control: does it **do** the thing, **show** that it did (on the screen the user is looking
at), and **undo** (Escape, click-away, toggle-off, Back)? Specific traps:

- Popover/tooltip closes when the user interacts with a *related* control (a version picker in the
  header) because the click-away handler only exempts the popover itself.
- A change in a global setting (translation, theme, filter) doesn't refresh what's already open.
- Selection with no deselect; tabs not reflected in the URL; `replaceState` everywhere so Back exits.
- Deep-link on load: `#/section`, `#anchor`, `?tab=` — does the page land there after fonts/layout?
- Keyboard: Escape on every layer, focus visible, hidden duplicates (marquee clones) untabbable.
- Mobile: the *result* of a tap must be visible on the screen the tap happened on; sticky elements
  eat viewport; hover handlers (`mouseenter`, `pointerenter`) fire on tap and then `pointerleave`
  fires immediately — trace what that sequence does.
- Every fetched thing has three states: loading, loaded, failed. Trigger the failed one on purpose
  (offline, 404 variant, unsupported book/locale) and see what the reader gets.

## Data (real content through the real pipeline)

- Curl the API the page calls, with the page's `Origin` header if the worker checks it. Read the raw
  text for several variants — poetry, headings, footnotes, ranges — not just one prose verse.
- Diff the raw text against what the page renders. Watch for: tags stripped to empty string
  (`<br>` → words glued), tag-only stripping that leaks inner text (`<sup>` footnotes become verse
  words), ranges returned as a blob without verse breaks, entities.
- Coverage: which variants lack which content (a translation without four OT books; a locale missing
  a page)? Count how many of the site's own references hit the gap; a fallback is a *design*
  requirement, not a nice-to-have, once the count is double digits.
- Names: does the UI show canonical/full names where the reader needs them (dialog titles, tooltips)
  or the authored abbreviation? Is the authored content itself consistent (`Hos 11:1` vs `Hosea 11:1`),
  and does the linker match both?
- Run every reference/ID in the content through the site's own parser (load the data files in a
  `node vm` context with the parser functions) — list the failures.

## Motion / perf

- Inventory every loop. For each: does it stop when off-screen (IntersectionObserver), when the tab
  is hidden, under reduced-motion? N strips × rAF × `scrollLeft` writes = N layouts per frame.
- `resize` listeners: on phones the URL bar collapsing during scroll fires `resize` — anything that
  rebuilds DOM or resets positions there will visibly flash and jump while the reader scrolls.
- `scrollLeft`/`scrollTop` are rounded to whole (or half) pixels; a slow loop advancing 0.4px/frame
  steps 0,0,1,0,0,1 — never smooth. `transform: translateX()` on the track is sub-pixel and composited.
- Native scroll on an `overflow: auto` element the JS also drives: trackpad/wheel moves it natively
  while paused; on resume the loop writes its stale position back → snap. Either own the position
  fully (transform) or sync from `scrollLeft` on every resume/drag start.
- Drag: pointer capture, threshold before it counts as a drag, click suppression window, touch-action.
- Seams: duplicated groups must be pixel-identical (fonts loaded before measuring); measure the loop
  width after `document.fonts.ready`.
- Real check: `paths` with `wheel` then `hover` off, and `drag` then wait — assert the position didn't
  jump; shoot before/after.

## Device (Safari on a phone)

- Use the iOS Simulator (`mcp__Claude_Code_iOS_Simulator__control`: `open_url` in Safari, screenshot,
  swipe/tap) — the desktop pane and headless Chrome are Chromium and cannot show WebKit behaviour.
- Watch for: URL-bar resize storms (see Motion), `100vh`/`dvh`, sticky inside overflow, `-webkit-`
  masks on scrollers, tap-highlight, `pointerenter`-on-tap, momentum scroll fighting JS, hover-only
  reveals that never happen, `<dialog>` and `backdrop-filter` rendering, font fallback (Iowan/Avenir
  exist on iOS; check the stack anyway).
- If the simulator isn't available, hand the user a ten-line checklist for a real-device lap and mark
  the lens **Not tested** — never mark it done on Chromium evidence.
