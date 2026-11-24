# Plan: Cascivo Mono, Serif, Condensed (v1)

Goal: three siblings of Cascivo Sans from the same parametric engine. Quick v1, not polish.

## Engine sharing (least duplication)

One engine, no copies. `fonts/cascivo-sans/src/family.py` is a hook module; with
`CASCIVO_FAMILY` unset every hook is a no-op and the Sans build is byte-identical (verified by
sha256 of every file in `fonts/cascivo-sans/fonts/`). With `CASCIVO_FAMILY=<name>` it loads
`fonts/cascivo-<name>/src/family.py`, which may define:

| Hook | Called | Use |
| --- | --- | --- |
| `NAME`, `PS`, `VERSION`, `ITALIC` | build.py import | names; `ITALIC=False` in v1 (upright only) |
| `tune(p)` | end of `params.P.__init__` | width factor, contrast, counters, sidebearings, x-height |
| `glyph(g, p, name)` | after each drawing, before spacing | add serif strokes, set `g.sb`, `g.adv_fixed` |
| `master(o)` | after a master is drawn and composed | e.g. centre every glyph in one advance (mono) |
| `fea(text)` | before feature compile | drop or rewrite kerning |
| `@family.override('a')` | at load | redraw a glyph (slab i, l, r; serif a, g) |

Build: `cd fonts/cascivo-sans && CASCIVO_FAMILY=mono python3 -I src/build.py`. Output goes to
`fonts/cascivo-<name>/fonts/`: `Cascivo<Name>[opsz,wght].ttf`, `.woff2`, `-Latin[opsz,wght].woff2`
(`build.save_family`; no statics, no italic in v1). Each family owns only `fonts/cascivo-<name>/`.

## Families

- **Mono** (`tune` + `master` + overrides): one advance for every spacing glyph (600 at Regular,
  held across weights), ink centred; slab i, j, l, r, f, t; m and w narrowed in-stroke (thinner
  middle stem/apexes) rather than overflowing; kerning dropped; dotted or slashed zero. Score refs:
  JetBrains Mono, Geist Mono (variable, fetched from fontsource). IBM Plex Mono only static
  locally, visual only.
- **Serif** (`tune` + `glyph`): higher contrast (H/V lower, heavier at Black), bracketed serifs
  added as a stroke post-process on stem ends at baseline / x-height / cap height (short bar +
  bracket fillet), wider sidebearings. Score ref: Source Serif 4 (variable). Plex Serif static,
  visual only.
- **Condensed** (`tune`, few overrides): width factor about 0.82 on counters (`cn`, `cH`, `cHd`),
  tighter rounds (higher superellipse `k`), sidebearings about 0.9x, figures narrowed. Score refs:
  Inter Tight, Roboto Condensed (variable).

## Gates and deliverables per family

`fonts/cascivo-<name>/src/test_family.py`: font loads, outlines valid (`lint.py` / OTS),
cmap equals Sans's Latin set, masters compatible (the build itself fails otherwise), size budget,
plus one family gate: mono every advance equal; serif ink-to-stem contrast under Sans; condensed
mean advance 0.80-0.90 of Sans. `score.run(font=..., ref_paths=[...])` against the family refs, numbers in
`fonts/cascivo-<name>/NOTES.md`. One specimen PNG `fonts/cascivo-<name>/specimen.png`.
Cascivo Sans's own gates (`test_font.py`) must still pass. No site wiring yet.
