# Cascivo Sans

Cascivo Sans is a variable grotesque for interfaces. It is generated from a parametric stroke
engine and licensed under the SIL Open Font License 1.1. It comes as two variable fonts, upright
and a drawn italic, each with weight and optical-size axes. It has an unambiguous `Il1`, tabular
and old-style figures on request, and a 23 KB Latin web file.

Version 0.6.1; see [CHANGELOG.md](./CHANGELOG.md). Read [RESEARCH.md](./RESEARCH.md) for why it exists, how it compares with Geist, IBM Plex and
Helvetica, and what it does not do yet.

Try it and download the web and desktop files at [cascivo.com/cascivo-sans](https://cascivo.com/cascivo-sans).

## Files

| File                                              | Axes              | Charset               | Size                       |
| ------------------------------------------------- | ----------------- | --------------------- | -------------------------- |
| `fonts/CascivoSans-Latin[wght].woff2`             | wght              | Latin                 | 22.8 KB                    |
| `fonts/CascivoSans-Latin[opsz,wght].woff2`        | wght, opsz        | Latin                 | 28.9 KB                    |
| `fonts/CascivoSans[opsz,wght].woff2`              | wght, opsz        | full (956 codepoints) | 68.4 KB                    |
| `fonts/CascivoSans[opsz,wght].ttf`                | wght, opsz        | full                  | 236.5 KB (desktop install) |
| `fonts/CascivoSans-Italic-Latin[wght].woff2`      | wght              | Latin                 | 25.2 KB                    |
| `fonts/CascivoSans-Italic-Latin[opsz,wght].woff2` | wght, opsz        | Latin                 | 31.9 KB                    |
| `fonts/CascivoSans-Italic[opsz,wght].woff2`       | wght, opsz        | full                  | 73.6 KB                    |
| `fonts/CascivoSans-Italic[opsz,wght].ttf`         | wght, opsz        | full                  | 240.3 KB (desktop install) |
| `fonts/CascivoSans-Regular.woff2`                 | static 400        | full                  | 23.7 KB                    |
| `fonts/CascivoSans-Regular.ttf`                   | static 400        | full                  | 134.5 KB (desktop, hinted) |
| `fonts/CascivoSans-Bold.ttf`                      | static 700        | full                  | 135.7 KB (desktop, hinted) |
| `fonts/CascivoSans-Italic.ttf`                    | static 400 italic | full                  | 136.5 KB (desktop, hinted) |
| `fonts/CascivoSans-BoldItalic.ttf`                | static 700 italic | full                  | 136.7 KB (desktop, hinted) |

"Latin" means Basic Latin, Latin-1 and common punctuation. The full charset adds Latin
Extended-A, Romanian comma letters, Vietnamese, Cyrillic, Greek and combining marks (stacked by
`mark` and `mkmk`). That covers Western, Central and Northern European languages, Turkish,
Romanian, Vietnamese, Welsh and Azerbaijani, the Croatian digraph characters (Ǆ … ǌ), German's
ẞ, Greek (monotonic and polytonic), and Russian, Ukrainian, Belarusian, Bulgarian, Serbian, Macedonian, Kazakh, Uzbek,
Tatar, Bashkir and Tajik. Set `lang="bg"`, `"sr"` or `"mk"` on the page and Bulgarian, Serbian
and Macedonian text takes its own letterforms.

On the desktop, install the two variable TTFs. Apps that only pair styles by name and style
bits (some word processors) want the four static TTFs instead: Regular, Bold, Italic and Bold
Italic, at optical size 14. These four are hinted with ttfautohint for Windows at 100% scaling.

## Use on the web

Serve only the axes you need. Most sites need only `[wght]`. This example also turns on
optical sizing:

```css
@font-face {
  font-family: 'Cascivo Sans';
  src: url('CascivoSans-Latin[opsz,wght].woff2') format('woff2');
  font-weight: 100 900;
  font-style: normal;
  font-display: swap;
}
@font-face {
  font-family: 'Cascivo Sans';
  src: url('CascivoSans-Italic-Latin[opsz,wght].woff2') format('woff2');
  font-weight: 100 900;
  font-style: italic; /* downloaded only when a page actually uses italic */
  font-display: swap;
}

body {
  font-family: 'Cascivo Sans', system-ui, sans-serif;
  font-optical-sizing: auto; /* the default: opsz follows font-size in px (8-48) */
}
```

The italic is drawn, not slanted. It has a single-storey `a`, an `f` that descends, a `y` with a
curved tail, and stress that follows the 10° angle. Without the second `@font-face` block, the
browser fakes italics by skewing the upright.

## OpenType features

| Feature                | CSS                                        | Effect                                                                                                                                     |
| ---------------------- | ------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------ |
| Proportional figures   | default                                    | Figures sit naturally in running text                                                                                                      |
| `tnum`                 | `font-variant-numeric: tabular-nums`       | All digits share one width, so columns align in tables                                                                                     |
| `zero`                 | `font-variant-numeric: slashed-zero`       | Slashed zero                                                                                                                               |
| `onum` / `lnum`        | `font-variant-numeric: oldstyle-nums`      | Old-style figures (0 1 2 at x-height, 3 4 5 7 9 descend), proportional or tabular                                                          |
| `frac`                 | `font-variant-numeric: diagonal-fractions` | 1/2 → ½                                                                                                                                    |
| `sups` / `sinf`        | `font-variant-position: super / sub`       | Real superior and inferior figures                                                                                                         |
| `ordn`                 | `font-variant-numeric: ordinal`            | 1a → 1ª                                                                                                                                    |
| `case`                 | `font-feature-settings: 'case'`            | Hyphens, parentheses and guillemets centred on capitals                                                                                    |
| `ss01`                 | `font-feature-settings: 'ss01'`            | Dotted zero, proportional or tabular (`zero`, the slashed zero, wins when both are on; with `onum`, `sups` or `frac` the zero is undotted) |
| `ss02`                 | `font-feature-settings: 'ss02'`            | Plain `I` and `l` (as in Helvetica), including every accented form                                                                         |
| `locl`                 | `lang="ro"`                                | Ş ţ → Ș ț (comma below) for Romanian and Moldovan                                                                                          |
| `kern`, `mark`, `ccmp` | default                                    | Class kerning, and accents placed on any base, including decomposed text                                                                   |

## Build

Python 3.11 or later:

```sh
pip install -r requirements.txt
python3 -I src/build.py                    # writes fonts/, takes about 55 s, byte-reproducible
python3 -I -m unittest discover -s src     # outline lint, coverage, features, kerning, budgets, OTS
python3 -I src/lint.py                     # self-intersection check on every stroke, every master, then the Latin quality checks (strict: any failure fails)
```

Font Bakery (`pip install fontbakery`):
`fontbakery check-universal "fonts/CascivoSans[opsz,wght].ttf" "fonts/CascivoSans-Italic[opsz,wght].ttf"` gives 0 fails. The two
warnings are intentional: `post` format 3 drops glyph names to save bytes, and overlapping
contours are standard in variable fonts.

The generator stays in Python although the repository is TypeScript: no TypeScript library can
build a variable TrueType font, compile its features or hint it, and a port would change every
shipped file at once. RESEARCH.md section 36 has the measurements.

### Source layout

| File                            | Role                                                                                               |
| ------------------------------- | -------------------------------------------------------------------------------------------------- |
| `src/params.py`                 | The six masters and every proportion they drive: stems, contrast, x-height, spacing, apertures     |
| `src/geom.py`                   | Stroke expansion: an angle-driven pen, offset fitting, terminal cuts                               |
| `src/glyphs.py`                 | One function per drawn glyph, as centerline strokes                                                |
| `src/composites.py`, `build.py` | Accents, fractions, alternates, master assembly, `varLib`, `avar`, STAT, web builds                |
| `src/kern.py`, `kern_oracle.py` | Kerning: pairs that Geist and Inter both kern, values measured on our outlines with a fitted model |

Drafts of Georgian (Mkhedruli and its Mtavruli capitals, `src/georgian.py`), Armenian
(`src/armenian.py`) and Hebrew (`src/hebrew.py`, with its points) are not in the release; build them
with `CASCIVO_GEORGIAN=1`, `CASCIVO_ARMENIAN=1` and `CASCIVO_HEBREW=1 python3 -I src/build.py`,
alone or together (RESEARCH.md sections 27–35). Their centre lines in `georgian_paths.py`,
`armenian_paths.py` and `hebrew_paths.py` are traced from Noto Sans Georgian, Armenian and Hebrew
(OFL) by `src/trace_noto.py`, and drawn by `src/traced.py`. A build with any of them adds Noto's
copyright notice to the font's, and writes a web slice (`CascivoSans-Georgian[opsz,wght].woff2`,
35 KB; `-Armenian`, 39 KB; `-Hebrew`, 15 KB) to load by unicode-range.

To change a glyph, edit its function in `glyphs.py`, then run the lint, the build and the tests.
One rule keeps the variable font valid: a master parameter may move points, but it must never
change how many strokes or segments a glyph has.

## License

The font is licensed under the SIL Open Font License 1.1 ([OFL.txt](./OFL.txt)). The generator
code is MIT, like the rest of the repository.
