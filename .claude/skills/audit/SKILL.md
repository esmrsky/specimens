---
name: audit
description: Fine-tooth audit of a finished website — the deep pass that finds the quirks a reader bumps into, not the pre-publish gate (that's preflight). Use whenever the user says "audit", "fine-tooth", "QA pass", "what's wrong with the site", "make sure everything works", "polish/consistency/refinement pass", asks why an interaction feels off (stutter, flash, popup closes, text runs together, tap does nothing), or wants a punch list before a fix session — even if they don't say "audit". Runs an interaction inventory first, then six lenses (static, visual, functional, data, motion/perf, device) with a headless-Chrome harness, and reports evidence per finding plus a mandatory "Not tested" section. Assessment only unless invoked with --fix.
---

# Audit — fine-tooth pass on a finished site

`preflight` asks "does this look generic and will it publish cleanly?" This skill asks "what will a real
reader trip over?" — and the two are found in different ways. Design defects show up standing still
(screenshots, tokens, DOM measurement). **Experience defects only show up in motion and with real data**:
a verse that arrives with `<br>` stripped, a popup that closes when you pick a translation, a filmstrip
that snaps back when the mouse leaves, a tap whose result is a screen below the fold. Past audits that
only did the first kind missed every one of the second kind, and the user found them by hand. This
skill exists so that doesn't happen again: **inventory first, then use the thing, then judge.**

## Mode

Default is **assessment** — the deliverable is the ranked punch list; change nothing. `--fix` (or the
user asking for fixes in the same breath) means fix after reporting, in passes, verified live. If the
site's workspace has its own rules (a `CLAUDE.md`, deploy model, cache-buster habits), read them first —
they usually record traps this skill can't know.

## 0 · Scope in one line

Live URL (audit the deployed bytes — hash them against local; a stale build or a shadowed folder makes
every finding fiction), local source path, and what "done" means for this pass (whole site / one page /
one component). Note the framework and how content reaches the page (static, JS-rendered, remote APIs).

## 1 · Inventory before opinion

Write the inventory down before forming a single judgment. It is the deliverable of this step and it
is what makes the later lenses exhaustive instead of impressionistic — "8 translations × 486 refs ×
tooltip + dialog" is the sentence that finds the footnote leak.

- **Interactive elements**: every control, link class, drag surface, keyboard path, hash/deep-link,
  browser Back. Grep the JS for `addEventListener` and the HTML/CSS for `:hover`, `cursor`, `role`.
- **State axes**: viewport (375 / 1024 / 1280 minimum), light/dark (system *and* toggle — they are
  different code paths), reduced-motion, every data variant (translation, language, filter, tab), the
  loading and error states of anything fetched.
- **Data paths**: what is fetched from where, what the raw response looks like (curl it — with the
  site's `Origin` header if the API checks it), and what the page does to it before render.
- **Motion**: every `requestAnimationFrame`, `setInterval`, CSS `animation`, `scroll`/`resize` listener.

Save it as `inventory.md` in the audit folder; the report's "Not tested" section is written against it.

## 2 · Six lenses, in this order

Detailed checklists with the specific traps live in [references/lenses.md](references/lenses.md) — read
it once per audit; the summary here is only orientation.

| Lens | Question | Main tools |
|---|---|---|
| **Static** | What does the source say that the browser will contradict? Dead CSS/JS, media-query overrides placed before their base rule (they lose on source order and do nothing), tokens missing from one theme block, hard-coded colours, source-of-truth files vs built output. | grep, node |
| **Visual** | What does it look like at each width and theme? Stacked paddings, tint bands with hard edges, panels sized to an outlier, overlapping SVG labels, halo strokes that erase text, illegible type sizes, orphans. | `harness.mjs shots`, DOM measurement |
| **Functional** | Does every path in the inventory do what a reader expects — and undo? Escape, click-away, toggle-off, Back, deep-link on load, keyboard, focus, hidden duplicates. | `harness.mjs paths` |
| **Data** | What does real content look like once it's on the page? Fetch every variant through the site's own pipeline; read the text, not the code's intent. Missing sources need fallbacks; abbreviations need a canonical name table. | curl, node over the site's data files |
| **Motion / perf** | What runs, when, and is it smooth? Loops that never stop, resize handlers that rebuild the DOM (mobile URL bar fires resize on scroll), integer-stepped `scrollLeft`, native scroll fighting a JS loop, `will-change` sprawl. | code read + `paths` with `drag`/`wheel` |
| **Device** | Safari on a phone. Sticky, touch-drag, address-bar resize, `100vh`, hover-only affordances, 44px targets. | iOS Simulator (Safari) or a real device lap the user does with your checklist |

## 3 · The harness

`scripts/harness.mjs` drives real headless Chrome over CDP with no npm install (Node ≥ 22). Real
fonts, real rAF, real CSS animation, real mouse events — unlike the in-app browser pane, which cannot
run scroll events / rAF / transitions and goes blind (`document.hidden === true`, blank screenshots)
without warning. Reach for the harness first; use the pane only for quick DOM pokes.

```bash
H=~/.claude/skills/audit/scripts/harness.mjs
node $H shots  <url> --widths 375,1024,1280 --themes light,dark --out audits/<site>/shots   # every section, every width/theme
node $H eval   <url> --width 375 --js "getComputedStyle(document.querySelector('.nav-link')).padding"
node $H paths  <url> --paths audits/<site>/paths.json --out audits/<site>/paths                # interaction assertions
```

`paths.json` is the site's regression suite — see [assets/paths.example.json](assets/paths.example.json).
Every quirk you confirm becomes one assertion there, so the fix session has a gate and the next audit
starts ahead. Keep the site's `paths.json`, `inventory.md` and shots under an `audits/<site>/`
folder outside any published repo (or wherever the workspace keeps non-shipped files).

Append `?cb=<random>` to the URL when checking CSS after a deploy, or you measure the old stylesheet.

## 4 · Report

Use [references/report.md](references/report.md) verbatim as the skeleton. The rules that matter:

- **Rank by reader impact**, not by lens or by where you found it. A 900px empty box on the first
  mobile screen outranks twenty dead CSS lines.
- **Evidence on every line**: `file:line`, the measured value, the API response, or a screenshot crop.
  "Feels off" is a lead, not a finding — go measure it.
- **Root cause, not symptom**: "words run together" is the symptom; "`cleanBollsText` strips `<br>` to
  empty string, and KJV `<sup>` note text survives tag removal" is the finding. Say what the fix is in
  a clause, so a fix session can start without re-deriving.
- **"Not tested" is mandatory** — written against the inventory: which paths, axes, devices you did
  not exercise and why. This is the section that turns a gap into a decision for the user instead of a
  surprise.
- **"Second lap"**: assume you found half. Name the three places you'd look next and what class of bug
  each would surface. The first pass finds standing-still problems; the second finds motion-and-data
  problems — say which lap this was.
- Offer the fix order (passes grouped so each is verifiable), and which passes want the primary model.

## 5 · If --fix

Fix in the passes you proposed, most-reader-impact first. After each pass: rebuild, deploy, hash the
live URL, re-run `paths` (with `--only` for the touched paths, then the full suite at the end), re-shoot
the affected sections. Verified means the live URL passed, not the local file. Report what shipped,
what the harness says, and anything you deferred — nothing dropped silently.
