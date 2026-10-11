# Changelog

## 0.5.1

- **Clear at the heavy corners.** The build measures opening pairs on the outlines the variable
  font draws at Display Black and Caption Black, which no master contains. Every same-script pair
  is now clear at every weight and size (the last ones touched by 3–7 units). ï î ĩ ī ĭ ї now open
  against every capital and ascender, not only T V W Y F P (`Xï` was −88 at Display Black).
- **Greek punctuation.** The ano teleia (·) sits at the x-height, as the colon's upper dot,
  instead of mid-height. ΅ and the polytonic spacing accents no longer overhang their advance.
- Optical sizes re-checked across all scripts: no new outliers.
- Files +1.2 KB.

## 0.5.0

- **Polytonic Greek.** All 233 characters of Greek Extended: breathings, perispomeni, iota
  subscript, and their combinations, built from Unicode decompositions. Also typed as separate
  marks (956 codepoints, from 719).
- **ï no longer collides.** ï î ĩ ī ĭ ї kern open against tall neighbours, as Inter and Plex do.
  At Black, `dï` was -39 units and `Tï` -75. No other pair changed.
- **Smaller files.** Zero variation deltas are stored as absent (lossless), and the delta
  tolerance is 2 units instead of 1 (at most 3.4 units of drift, at the Display Black corner).
  At 0.4.0's character set the full file falls 3.8%, and `Latin[opsz,wght]` 5.5%.

## 0.4.0

- **Greek.** Monotonic Greek with tonos and dialytika: 73 codepoints (719 in all, from 578).
  Capital tonos stands before the letter, as in Inter and Plex. Kerned from the pairs Inter and
  IBM Plex agree on.
- **More Cyrillic.** Kazakh, Uzbek, Tatar, Bashkir, Tajik and Azerbaijani: Ә Ғ Қ Ң Ө Ұ Ү Һ Җ Ҳ
  Ҷ Ҹ Ҙ Ҫ Ҡ Ҝ Ӏ, and Ӑ Ӓ Ӣ Ӧ Ӱ Ӳ and their relatives.
- **Local forms (`locl`).** Bulgarian (`bg`) takes its rounder lowercase, as IBM Plex does.
  Serbian and Macedonian (`sr`, `mk`) take their б, and in the italic their г д п т.
- **Kerning by side shape.** Cyrillic and Greek letters with a matching side share a kerning
  class, so letters no reference kerns (Қ, the Bulgarian forms) are kerned. Latin kerning is
  unchanged.
- The full woff2 files grow to 63.4 and 70.2 KB. The Latin subsets are unchanged in practice
  (+0.1 KB).

## 0.3.0

- **Cyrillic.** Russian, Ukrainian, Belarusian, Bulgarian, Serbian and Macedonian: U+0400-045F
  and Ґ ґ (578 codepoints, from 479). Letters shared with Latin are composites of the Latin glyph.
  The lowercase uses the grotesque small-cap forms. The italic takes the cursive и п т, as
  IBM Plex Italic does. Kerned from Geist's and Inter's pair lists, measured on Cascivo's own
  outlines, as the Latin is ([RESEARCH.md](./RESEARCH.md) section 23).
- **ẞ**, the German capital sharp s.
- **Mark-to-mark positioning (`mkmk`).** Accents typed as separate combining marks now stack as
  the precomposed letters do, Vietnamese included.
- **Fixed:** 0.2.0 shipped `sxHeight` and `sCapHeight` as 0 (CSS `font-size-adjust` reads them).
- The full woff2 files grow by about 13 and 15 KB. The Latin subsets are unchanged.

## 0.2.0

A review of every glyph against Inter, Geist, IBM Plex and a Helvetica design, at Regular, Bold and
Black, upright and italic. Each change is measured; [RESEARCH.md](./RESEARCH.md) sections 11-21
give the numbers.

- **Heavy weights.** Black's stem is 190 units; curved terminals cut toward vertical as weight
  grows, so Bold and Black no longer read as wedges. `a`, `t`, `S`, `s`, `e`, `6`, `9`, `&` and the
  heavy bowls were redrawn where the stroke engine closed or pinched them.
- **The italic.** Heavy terminal cuts are worked out on the unslanted drawing; joins keep the pen's
  own end, so the Black italic `s`, `S`, `3`, `5`, `6`, `J` and `G` have no seams or wedges.
- **Proportions.** Narrower `r`, wider `T`, heavier `A`, `J`, `V`, `X`, `Y` and `M` diagonals, a larger
  `e` eye, a closed-up `C`, a 4 with a larger counter, narrower heavy bowls and an overshoot that
  stops growing past Regular.
- **Spacing and kerning.** Sidebearings fitted pair by pair against the references; the spacing
  unit is 9% tighter, so text sets within 1-2% of Inter's and Geist's length. Closing kerns grow
  with weight. Pairs that only touch at the heavy corners are kerned open in every master, and a
  test keeps every such pair clear at every weight and optical size.
- **Punctuation and symbols.** Period, comma and quotes sized to the references at every weight;
  a solid bullet; larger degree sign, guillemets, hyphen and asterisk; a raised caret and (R);
  larger ordinals; a full-width euro; wider braces.
- **Accents.** Every accent of Latin-1 and Latin Extended-A measured: capital accents larger and
  higher, dots and macrons clear of the letter, a drawn breve, acutes offset as in the references,
  comma accents resized, and the dot restored to `į`.
- **Languages.** Vietnamese, Welsh, Azerbaijani (Ə ə) and the Croatian digraph characters: 479
  codepoints (from 365), with a hook above, horn and dot below, and Vietnamese accent stacking.
- **Files.** Static Regular, Bold, Italic and Bold Italic TTFs for desktop apps, hinted with
  ttfautohint. The Windows clipping extent covers every weight and optical size.

## 0.1.0

The first release: a parametric stroke engine, upright and italic variable fonts with weight
(100-900) and optical size (8-48) axes, 365 codepoints.
