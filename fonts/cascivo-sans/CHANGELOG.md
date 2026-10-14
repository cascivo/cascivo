# Changelog

## Unreleased

- **A page on cascivo.com.** `/cascivo-sans` shows a specimen and a live type tester (weight,
  optical size, size, italic), and offers the Latin web files, the static TTFs and the licence for
  download. The site serves copies of the build output; `pnpm fonts:site:sync` refreshes them and
  `meta:check` fails when they drift.
- **Georgian draft: capitals and Black.** The Mtavruli capitals are drawn, so the Georgian build
  passes Font Bakery. The heavy weights follow Noto's Black centre lines at the full stem, and
  widths and spacing follow Noto's at each weight. Still not in the release (no native review);
  the shipped files are unchanged.
- **Georgian web slice and round joints.** A Georgian build writes a separate Georgian woff2
  (33 KB, every weight) for unicode-range loading. Strokes that end on each other meet in a round
  joint, which closes the notches at Black.
- **Georgian kerning.** Noto's own kerning for the 749 pairs it kerns at any weight, blended by
  weight and scaled with the letters. Every pair is clear at every weight and size. Heavy
  terminals are cut square (ჯ's and ჟ's feet no longer step), and Ჩ's bowl has no spur.
- **Georgian beside dashes.** At Black, en and em dashes open away from შ and წ and their
  capitals, which met them before. No reference kerns Georgian against punctuation, so nothing
  else changes. Ჩ's leg sits flat on the baseline.
- **Armenian draft.** The 38 capitals, 40 lowercase letters with և, the six marks and the dram
  sign ֏ are traced from Noto Sans Armenian, with Noto's kerning. ։ and ֊ are the colon and
  hyphen. Built only with `CASCIVO_ARMENIAN=1`, with its own web slice (39 KB); not in the release
  until a native reader has reviewed it. The shipped files are unchanged.
- **Georgian at Black, closer to Noto.** The tracer now handles overlapping outlines, corners and
  heavy loops, and runs terminals out to Noto Black's length. Georgian's mean IoU against Noto
  Black rises from 0.813 to 0.841 (measured with overlaps filled; the earlier 0.769 counted them as
  holes). ჩ's leg and შ's top are still not fixed.
- **Hebrew draft.** The 27 letters with their final forms, maqaf, paseq, geresh, gershayim and ₪
  are traced from Noto Sans Hebrew, set as tall above the x-height as Noto sets them, with Noto's
  kerning working right to left. ׃ is the colon and װ ױ ײ are pairs of letters. Built only with
  `CASCIVO_HEBREW=1`, with its own web slice. The shipped files are unchanged.
- **Armenian ligatures** ﬓ ﬔ ﬕ ﬖ ﬗ, as Noto sets them: the two letters side by side.
- **Hebrew points (niqqud).** The vowels, dagesh, rafe and the shin and sin dots, attached where
  Noto attaches them and as light as Noto draws them at every weight. No cantillation marks.
- **Counters at Black.** Traced letters keep at least 60% of each of Noto Black's counters where a
  pen no lighter than 0.75 can (ზ's upper bowl is open again); Ზ keeps 56% and ֆ 18%. შ's stub
  stands upright again, and the opening under it is back.
- **Georgian at Black.** ჩ's leg sits on the baseline, and შ's arch runs on into its stub as Noto's
  does. A notch is left where შ's hook meets the arch at Black.
- **The build stays in Python.** A TypeScript port was weighed and measured: npm has no variable
  TrueType or feature compiler, Google's WOFF2 encoder writes other bytes for the same font, and
  Node and CPython differ in the last bit of `sin`, `atan2` and `hypot`. RESEARCH.md section 36.
  No code or font changes.

## 0.6.1

- **Fractions only around a slash.** With `frac` on (CSS `diagonal-fractions`), every figure
  became a numerator: "7/16 of 100" set the 100 small. Now only the figures either side of a slash
  change, in every figure style (slashed zero, old-style, tabular).
- **Georgian redrawn, still a draft.** The 33 letters' centre lines are traced from Noto Sans
  Georgian, so their structure is Noto's; this font's pen draws them at every weight. Not in the
  release: the Mtavruli capitals are missing and no native reader has reviewed it.

## 0.6.0

- **Old-style figures (`onum`).** 0 1 2 stand at the x-height, 3 4 5 7 9 descend, and 6 8 stay
  lining, as in IBM Plex. Proportional by default and tabular with `tnum`. `lnum` turns them back.
- **Georgian, as a draft only.** `src/georgian.py` draws the 33 Mkhedruli letters, but 13 of them
  are not yet right, so the release does not include them. `CASCIVO_GEORGIAN=1` builds them for
  review.
- A render-proof page for checking small sizes in Safari and on Windows.
- Files +0.4 to +0.9 KB.

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
