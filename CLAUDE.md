# Specimens — working notes

A self-teaching web design pattern library. Three files, **no framework, no dependencies, no build
step**: `index.html`, `styles.css`, `app.js`. Keep it that way — it must stay openable by
double-clicking `index.html`.

Read `ROADMAP.md` for the work queue.

## Conventions

- **Every specimen** is an `<article class="specimen" id="…" data-terms="…">` containing: an `h3`
  name, a `.specimen__aka` alias line, a `.specimen__desc` paragraph, a `.specimen__demo` live demo,
  and a `.specimen__use` "Use when" line. `data-terms` feeds the sidebar filter — fill it with the
  words someone would actually search for.
- **Sections** are `<section class="section" id="…" data-section="Name">`. The sidebar TOC, the
  scrollspy, and the specimen count are all generated from the DOM at runtime — never hand-maintain
  them.
- **Tokens over literals.** Colors, spacing, radii, shadows, and type sizes come from the custom
  properties at the top of `styles.css`. A hard-coded color is a bug unless the specimen is
  *demonstrating* a fixed palette (neo-brutalism, neumorphism, the contrast examples).
- **Both themes, always.** Any new token needs a value in the `prefers-color-scheme: dark` block
  *and* the `[data-theme="dark"]` block — they are separate code paths.
- `styles.css` and `app.js` are organized in numbered/commented blocks named after the pattern they
  power. Add to the right block; keep the comments accurate.
- Demos must degrade: nothing essential may be invisible if JS fails, and all motion must respect
  `prefers-reduced-motion`.

## Verifying changes (read this before trying to screenshot anything)

Use the CDP harness at `.claude/skills/audit/scripts/harness.mjs` (Node ≥22, no npm deps):

```bash
python3 -m http.server 8791 &
node .claude/skills/audit/scripts/harness.mjs shots http://localhost:8791/ --widths 375,1280 --themes light,dark --at sections --sections ".section" --out shots
node .claude/skills/audit/scripts/harness.mjs paths http://localhost:8791/ --paths paths.json --out paths-out
node .claude/skills/audit/scripts/harness.mjs eval  http://localhost:8791/ --js "JSON.stringify(…)"
```

Hard-won gotchas — do not rediscover these:

1. **`scroll-behavior: smooth` breaks the harness's `paths` mode.** Its `scroll`-then-`click` steps
   read stale coordinates and every assertion after a scroll fails. Test against a temporary copy
   with `scroll-behavior: auto` (write `_t.css` / `_t.html`, run, then delete them). The
   `--reduced-motion` flag does *not* fix this.
2. **Native HTML5 drag-and-drop cannot be driven by synthetic CDP mouse events.** Verify DnD by
   dispatching real `DragEvent`s in-page via the `eval` command.
3. Plain `chrome --headless --screenshot url#anchor` produces blank/offset captures of long pages.
   Use the harness, not raw Chrome flags.
4. If Chrome is missing in the environment, say so plainly in the report rather than claiming
   visual verification that didn't happen. `eval` assertions still work wherever Chrome runs;
   static checks (grep, duplicate ids, token diffing) work with no browser at all.

## Reporting

Claims about "works" or "verified" must be backed by output from this session — an assertion that
passed, a screenshot examined. State what was *not* tested rather than implying full coverage.
