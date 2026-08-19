# Specimens

A field guide to web design patterns. Every entry is a live, working demo labeled with its
proper name, its aliases, and when to reach for it — so you can learn the vocabulary of layout,
interaction, and visual style, not just copy the code.

**Stack:** three files, no framework, no dependencies, no build step.

| File | What's in it |
|---|---|
| `index.html` | Every specimen, grouped in sections, plus the glossary |
| `styles.css` | Design tokens → base → site chrome → per-pattern demo styles |
| `app.js` | All interactive behavior, each block labeled with the pattern it powers |

Open `index.html` directly, or serve the folder:

```bash
python3 -m http.server 8791
```

The site demonstrates the patterns it teaches: sticky hide-on-scroll header, sticky TOC with
scrollspy, off-canvas drawer, skip link, token-driven dark mode, fluid `clamp()` type, live
filter, back-to-top, and `prefers-reduced-motion` support.

See `ROADMAP.md` for what's being built next.
