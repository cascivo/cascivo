# Cascivo Sans

Cascivo Sans is a variable grotesque for interfaces. It is generated from a parametric stroke
engine and licensed under the SIL Open Font License 1.1. It has three axes (weight, optical size
and slant), an unambiguous `Il1`, tabular figures on request, and a 22 KB Latin web file.

Read [RESEARCH.md](./RESEARCH.md) for why it exists, how it compares with Geist, IBM Plex and
Helvetica, and what it does not do yet.

## Files

| File                                            | Axes             | Charset               | Size                       |
| ----------------------------------------------- | ---------------- | --------------------- | -------------------------- |
| `fonts/CascivoSans-Latin[wght].woff2`           | wght             | Latin                 | 21.6 KB                    |
| `fonts/CascivoSans-Latin[opsz,wght].woff2`      | wght, opsz       | Latin                 | 28.8 KB                    |
| `fonts/CascivoSans-Latin[opsz,slnt,wght].woff2` | wght, opsz, slnt | Latin                 | 31.9 KB                    |
| `fonts/CascivoSans[opsz,slnt,wght].woff2`       | wght, opsz, slnt | full (365 codepoints) | 38.2 KB                    |
| `fonts/CascivoSans[opsz,slnt,wght].ttf`         | wght, opsz, slnt | full                  | 102.4 KB (desktop install) |
| `fonts/CascivoSans-Regular.woff2`               | static 400       | full                  | 11.9 KB                    |

"Latin" means Basic Latin, Latin-1 and common punctuation. The full charset adds Latin
Extended-A, Romanian comma letters and combining marks. That covers Western, Central and
Northern European languages, Turkish and Romanian.

## Use on the web

Serve only the axes you need. Most sites need only `[wght]`. This example also turns on
optical sizing:

```css
@font-face {
  font-family: 'Cascivo Sans';
  src: url('CascivoSans-Latin[opsz,wght].woff2') format('woff2');
  font-weight: 100 900;
  font-display: swap;
}

body {
  font-family: 'Cascivo Sans', system-ui, sans-serif;
  font-optical-sizing: auto; /* the default: opsz follows font-size in px (8-48) */
}
```

To get the oblique, use the `slnt` file and declare `font-style: oblique 0deg 12deg` in the
`@font-face` block. Then `font-style: oblique 12deg` (or `italic`) selects the axis instead of a
synthesized slant.

## OpenType features

| Feature                | CSS                                        | Effect                                                                   |
| ---------------------- | ------------------------------------------ | ------------------------------------------------------------------------ |
| Proportional figures   | default                                    | Figures sit naturally in running text                                    |
| `tnum`                 | `font-variant-numeric: tabular-nums`       | All digits share one width, so columns align in tables                   |
| `zero`                 | `font-variant-numeric: slashed-zero`       | Slashed zero                                                             |
| `frac`                 | `font-variant-numeric: diagonal-fractions` | 1/2 → ½                                                                  |
| `sups` / `sinf`        | `font-variant-position: super / sub`       | Real superior and inferior figures                                       |
| `ordn`                 | `font-variant-numeric: ordinal`            | 1a → 1ª                                                                  |
| `case`                 | `font-feature-settings: 'case'`            | Hyphens, parentheses and guillemets centred on capitals                  |
| `ss01`                 | `font-feature-settings: 'ss01'`            | Plain `I` and `l` (as in Helvetica), including every accented form       |
| `locl`                 | `lang="ro"`                                | Ş ţ → Ș ț (comma below) for Romanian and Moldovan                        |
| `kern`, `mark`, `ccmp` | default                                    | Class kerning, and accents placed on any base, including decomposed text |

## Build

Python 3.11 or later:

```sh
pip install -r requirements.txt
python3 -I src/build.py                    # writes fonts/, takes about 4 s, byte-reproducible
python3 -I -m unittest discover -s src     # outline lint, coverage, features, kerning, budgets, OTS
python3 -I src/lint.py                     # self-intersection check on every stroke, every master
```

Font Bakery (`pip install fontbakery`):
`fontbakery check-universal "fonts/CascivoSans[opsz,slnt,wght].ttf"` gives 0 fails. The two
warnings are intentional: `post` format 3 drops glyph names to save bytes, and overlapping
contours are standard in variable fonts.

### Source layout

| File                            | Role                                                                                               |
| ------------------------------- | -------------------------------------------------------------------------------------------------- |
| `src/params.py`                 | The six masters and every proportion they drive: stems, contrast, x-height, spacing, apertures     |
| `src/geom.py`                   | Stroke expansion: an angle-driven pen, offset fitting, terminal cuts                               |
| `src/glyphs.py`                 | One function per drawn glyph, as centerline strokes                                                |
| `src/composites.py`, `build.py` | Accents, fractions, alternates, master assembly, `varLib`, `avar`, STAT, web builds                |
| `src/kern.py`, `kern_oracle.py` | Kerning: pairs that Geist and Inter both kern, values measured on our outlines with a fitted model |

To change a glyph, edit its function in `glyphs.py`, then run the lint, the build and the tests.
One rule keeps the variable font valid: a master parameter may move points, but it must never
change how many strokes or segments a glyph has.

## License

The font is licensed under the SIL Open Font License 1.1 ([OFL.txt](./OFL.txt)). The generator
code is MIT, like the rest of the repository.
