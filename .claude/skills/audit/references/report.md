# Report skeleton — use as the structure, fill every section

**Scope.** URL · source path · deployed hash matches local (yes/no) · lap (first / second) · mode.

## Ranked findings
One entry per finding, most reader-impact first. Each entry:
- **What the reader hits** (one sentence, plain language).
- **Root cause** with `file:line` and the measured value / API sample / screenshot crop.
- **Fix in a clause** — enough for a fix session to start without re-deriving.
- Optional: which harness assertion now covers it (`paths.json` name).

Group trivia at the end under "Small stuff, in passing" — don't let it dilute the ranking.

## Not tested
Written against `inventory.md`: paths, state axes, devices, data variants you did **not** exercise, and
why (tooling, time, access). Be specific — "did not test trackpad scroll on marquees; iOS Safari; any
translation other than NIV in the dialog" — so the user can decide, not discover.

## Second lap
Assume half was found. Three places to look next and the class of bug each would surface. State which
lap this report is.

## Fix order
Passes grouped so each is independently verifiable on the live URL; note which passes want the primary
model (rewrites, layout logic) vs. a cheaper one (mechanical cleanups), and that verification runs on the
primary model.

## Evidence
Where the shots / paths results / inventory live.
