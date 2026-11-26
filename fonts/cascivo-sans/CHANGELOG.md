# Changelog

## Unreleased

- **Engine round 10: Thin A, the bar, Black's Q tail.** Thin's upright `A` is 6% narrower, so the A no longer bends on the weight axis at 400 (`A_THIN`); its AV AY VA YA pairs at Thin are kerned by hand to keep Inter's white (`kern_overrides.py`). The `|` and `¦` take more sidebearing (`BAR_SB`, 80 -> 109 units a side at Regular), so `1|` no longer reads as one mark. Black's `Q` tail stops 112 under the baseline (144; Bold 124 -> 106). Sans only: the siblings keep their outlines. Full upright woff2 89,392 -> 89,132 bytes. Details in JUDGING.md round 10 (engine); specimens in `specimens/round10/`.
- **Polish round 10: punctuation and Black capitals by eye.** The multiplication sign is Inter's size (it was 0.89x at Regular and stood small beside the + in "1.9×"); the Black `?` is 8% narrower (it ran 17% wider than Inter's, a flat cap with a beak, `Q_MARK_HEAVY_W`); Black's `Q` tail is a full stem, not a 0.9-stem stick off the bowl (`Q_HEAVY_WS`); Black's `J` hook runs 8 deg further round, so its end no longer spikes up and left (`J_RUN`). Mono, Serif and Condensed inherit it. Scores: upright 8.74, italic 8.10 (held). Details in JUDGING.md round 10; specimens in `specimens/round-next/`.
- **Cascivo Serif round 4: serif shapes.** Bracketed slabs on diagonals (A K V W X Y k v w x y, skeletons squeezed so widths stay near Source Serif's), wedge serifs on arm ends (E F L T Z z), beaks on C G S c s, ball terminals on a r f j y, a round comma head (and curly quotes), heavier slabs and brackets for text sizes, overshoot growing with weight, thin / and thick \\ diagonals (Z z excepted), a slab floor at Thin, word space fitted to Source Serif's. All in `fonts/cascivo-serif/src/family.py`; no engine edits. Serif score 5.675 -> 5.691. Details in the Serif NOTES.md.
- **Polish round 9: heavy figures.** At 700-900 the 6 and 9 hooks no longer run past the bowl (`SIX_HOOK`): the tabular 6 9 stay inside their advance (they overflowed it by 8-13 units) and the proportional ones set as wide as the others. The full stop and comma take more room at Black (`PERIOD_OPEN`), and Black's x is wider with more sidebearing (`X_WIDER`, `X_SB_HEAVY`), so "78.6" and "1.9x" no longer crowd. Mono, Serif and Condensed inherit it. Scores: upright 8.73 -> 8.74, italic 8.09 -> 8.10. Details in JUDGING.md round 9.
- **Polish round 8: heavy curves in the engine.** At 700-900 closed rounds get oval counters (`OVAL_FILL`, `geom.Stroke` `fill`), C e s S $ 5 6 9 terminals thin into their face (`TERM_THIN`) and C 5 6 9 run further round (`TERM_RUN`), the r's arm ends heavier (`R_KNOB`). Mono, Serif and Condensed inherit it. Upright score 8.724 -> 8.733. Details in JUDGING.md round 8.
- **Polish round 7: drawn heavy curves (upright).** At 700-900 the n m h u shoulders and the b d p q bowls leave their stem as drawn, not stamped: the outer edge comes out of the stem lower (n 0.06 -> 0.16 x-heights under the top, Inter Black 0.26) at a steep angle and turns into a crown that sits further from the stem and reaches the overshoot, so the arch is fuller at top-right and tapers into the stem (`glyphs.drawn_shoulder`, `SHOULDER_*`, `BOWL_KNOBS`; blended by weight, Regular unchanged). Black's e and c terminals run further round (`E_RUN` -8 -> -12, `C_RUN` 12 -> 16). Scores: upright 8.724 (held), italic 8.09 (unchanged). Specimens: `specimens/round7/`. Details in JUDGING.md round 7.
- **Polish round 6, third sitting: redrawn outlines.** Black `D` and `B` have heavier tops and bottoms (upright; `cap_round_H`), counter over ink nearer Inter's. Italic `I` at 800-900 has shorter, thinner slabs and the italic `1` a longer, lower flag (I/1 ambiguity, italic small sizes 7.4 -> 8.5). Scores: upright 8.67 -> 8.72, italic 7.93 -> 8.09. Tried and reverted (gates): heavier `O Q` and `b d p q` bowls, a narrower `0`, `BOLD_ADV_BLEND` with a Bold-drawn `t`. Details in JUDGING.md round 6.
- **Polish round 6: optical sizes and Bold capitals (numeric scorer).** Display (opsz 48) now loses 60 units of x-height instead of 10 (`DISPLAY_XH`), so opsz 32 sits about 30 units under opsz 14 as Inter's does: the scorer's optical-size item goes 2.8 -> 10. Bold capitals take 10% more sidebearing (`CAP_SB_BOLD`; `EH OH MH` read 0.44-0.48 gap/counter against Inter's 0.58-0.62); the italic keeps its spacing (retuning its Bold and Black tightening scored +0.1 but broke six italic gates). The dot accent (and so the `i` and `j` dot, and the dots of `΅`) takes the full stop's size, 105 units at Regular (115). Owner gate changes: 600 may run +2.5% of Regular's width (was +2%), 900 +12% (+10%), the 700 rhythm ceiling is 0.63 (0.59), `COUNTER_MAX['a']` 1.4 (1.3), and the italic `f)` takes the upright's `WHITE_BAND_SHAPE`. Scores (`score.py`): upright 8.14 -> 8.67, italic 7.93 (unchanged). Byte caps rise by under 1.5% (full 76,735 -> 77,600).
- **Polish round 5: heavy apertures, a drawn italic round, lighter punctuation.** Black `S` is rebalanced to Inter's columns (upper counter open, lighter spine, level terminals); the Black `a` bowl has a curved top and a D-shaped counter; the Black `l` tail is one even curve; the Black `r` arm joins firmer. At display sizes the Black `e c g S` terminals cut level, as Inter's do. The comma and quotes have a narrower head (Regular 115 to 100), the full stop is 8% smaller at Regular and the semicolon's dot sits over its comma. The Caption master lifts the `i j` dots 40 units so they clear the stem at 11 px. Thin is tighter (−1.7% of Regular's width), Bold's round letters have more air (`rhythm.py` 0.59 at 700) and Black `o` sets as open as `n`. `f)` at Black keeps 47 units of white (35), quotes around `A` are kerned to Inter's white. Italic: the Black `c` and `e` terminals are redrawn (mouth 166 to 197 and 42 to 68 units), the Black `a` takes the `d`'s bowl, the heavy rounds `o b d p q 6 9 O Q` turn their sides back before the slant so they read drawn, not sheared, the `z Z` bars end along the slant, the `g` bowl closes round on its stem, the Regular `f` tail no longer curls back, and the 700 `l` runs out as a foot. Sizes stay within the owner's round-5 caps (full 76,592 bytes, Latin[wght] 25,672, italic full 82,880). Scores and the open flaws are in JUDGING.md (round 5 result).
- **Polish round 4: heavy weights released, joins, kerning fitted, cycle-3 cleanup.** By the owner's decision a line keeps its width within 2% of Regular from 100 to 600, and may run up to 4% wider at 700 and 10% at 900, so Bold and Black keep open counters and Inter-like spacing (`rhythm.py` 0.55 at 700 and 0.59 at 900; they were 0.47 to 0.53). Black arch and bowl joins are thinner and run round into the stem (`n m h u b d p q µ`). Kerning is fitted to Inter's white from the master outlines. Redrawn at the heavy weights: `a e c g s S f l t k r z Z`, squarer Black `o O Q 0`, a lighter `€`, guillemets, quotes, `%`, brackets and `&`, Black `T V W X Y Z 2 5`; the italic bars and diagonal feet no longer step past their lines. A blind review scored it 7.0 against 5.9 for round 3 and 4.4 for 0.6.1 (JUDGING.md). The size budgets rose by the owner's decision: full 76,600 bytes, Latin[opsz,wght] 32,100, Latin[wght] 25,700, italic full 83,000. Known limits: the italic Black `c` aperture, the Black `a` join and `S`, heavy text punctuation, `f)` at Black.
- **Polish round 3: joins, Black diagonals, punctuation.** `Y`'s arms run into the stem (they were cut flat at the join and stood out as a ledge on both sides, 9 units upright and up to 18 in the italic) and the italic `Z`'s diagonal ends inside its bars (it stood 4 to 9 units out). Black `v w y` are wider with lighter diagonals, so the white between the arms runs 233 units deep in `v` (it was 142). The guillemets are drawn as outlines with pointed tips and flat ends on Inter's geometry (two pen strokes met in a notch and ended in corners). The comma's head is half a dot tall before it tapers, so `, ;` and the curly quotes are lighter at 300 to 600 and Black's are wedges, not blocks; Black's double quotes stand 100 units apart (35). Black `2` starts with a flat cut, not a beak. Black `I` has shorter, thinner slabs. Capital diagonal pairs keep 26 units of white in text Black (16: `AVATAR`, `Kv` read as touching) and 16 to 18 at the corners and Bold. Display spacing is 0.92 of text (0.88), so Black at opsz 32 to 48 no longer sets `ns st ti` a few units apart. The italic Black `l` foot is shorter with more room after it. Thin `V` beside `c e o q g œ` kerns 0.8 to 1.08x Inter's (0.6 to 0.75x). Tests hold each of these. Not done, and why, is in JUDGING.md (round 3 result).
- **Polish round 2: Black counters, italic rhythm, parentheses.** The Black `e` has a lighter bar and its eye is 1.03x Inter's as a share of the x-height (it was 0.78x); the `A` has lighter diagonals and a thinner, lower bar (counter 0.57x to about 0.9x Inter's); `b d p q 6 9` have lighter bowl tops and bottoms. The italic's Black arches (`n h m u r`) are redrawn: the crown leans toward the stem the arch leaves, so the counter still meets both stems round when the body narrows. With that the italic gets the upright's rebalance (counters 20 units narrower at Black, the units back in the sidebearings): the `n` gap over counter is 0.50 at Bold and 0.47 at Black in the italic (0.39 and 0.30 before) and 0.53 at Black upright (0.47). Tests hold 0.50 at Black upright and 0.45 elsewhere. The italic `f` sits closer at 600 to 700 too, and the italic Black `l` has a longer, flatter foot. The parentheses bow (Inter's width; they were nearly straight), `( ) [ ] { }` share Inter's height of 908, and all of them have wider sidebearings, most at Black. Not done: thinner arch joins at Black upright, which the join-angle gate blocks (JUDGING.md, round 2 result).
- **Polish round 1: heavy rhythm.** At 700 to 900 the lowercase counters are narrower (n's by 20 units at Black) and the units go back to the sidebearings at the same advance, so the `n` gap over counter is 0.46 at Bold and 0.47 at Black (it was 0.38 and 0.30; a test holds it at 0.45 or more). `m`, `a` and `K` keep their width and `e` and `g` half of it. The italic `f` sits closer to the letter before it at 600 to 900 (no hole in `ef`, `gef`, `wafting`), the Black `l` tail is shorter and has more room on its right, upright and italic, and Black `Y` kerns a little harder against round letters. The italic counters are not narrowed yet (round 2 in JUDGING.md).
- **The interface brief.** Seven points from a design brief for interface use, each fixed against a measured gate (RESEARCH.md section 38; the QA specimen is at `/cascivo-sans/specimen`). Weights step evenly: the `n` stem steps between named weights are 20 to 22 units (they were 12 to 30), and the Thin master stem is 24 (it was 22). Text keeps its width across weights: the sample lines stay within 2% of Regular from 100 to 700 and within 5% at 800 and 900 (they grew 4.5% at 600 and 11.9% at 900), through a Bold spacing master at 700, tighter heavy sidebearings, and capital counters on their own curves. Lowercase `l k j z` and the pairs LT, To, Wa, V, Y and A are spaced and kerned like Inter's (`z` was 0.35 of the `n` gap, now 0.62 to 0.75; `l` and `k` 0.64 to 0.70). Light holds up at 11 to 13 px: every stem is 6 units heavier at optical size 8 than at 14 (Thin +25%, ExtraLight +14%, Light +9%, Regular +7%, Black +3%), most noticeable in Light, where it is capped at 1.10x. The size budgets rose, by the owner's decision: full 71,500 to 74,500 bytes, Latin[opsz,wght] 30,000 to 31,500, Latin[wght] 23,500 to 25,000, Regular 24,500 to 25,500, italic full 77,000 to 81,500, italic Latin[opsz,wght] 34,000 to 35,000 (the user raised it for the Black diagonal capitals), italic Latin[wght] 26,000 to 28,000. Black capital diagonals (VV, AX, KA, Ax, KT and the like, with their accented, Cyrillic and Greek forms) keep at least 12 units of white at the Black corners and 700/48 and 16 at 900/14, opened by measured kerning. The user accepted Black guillemets at 1.08x Inter's width (italic 1.096x) and italic AW / WA at Regular at 0.47x / 0.60x Inter's. Known limits: Caption Black counters are 1.5 to 5% smaller than Text Black's, Black letter gaps are 0.43x Inter's, some Thin W / V pairs kern under 0.8x Inter's, and `onum`, `sups` or `frac` with `ss01` give an undotted zero.
- **Punctuation sized for interfaces.** The minus keeps the plus's advance but is 8.8% shorter than the en dash (it was 4% at Regular and longer at Black). Quotes, guillemets and the straight `'` `"` are at least 0.9x Inter's ink box at every weight and optical size, upright and italic: the curly quotes sweep further at Thin (the comma's tail, 0.47x Inter's width there), the double marks stand a mark's width apart, and the guillemets are taller and wider. The dot has a floor of 0.05 em at weight 100 (it was 0.041), which `.` `:` `;` `!` `?` `i` `j` and the dotted zero share. The parentheses are 884 tall (828 before; Inter 908), and the `case` forms of `( ) [ ] { }` centre on the cap height (they sat 19 units low). Kerning is re-measured from the new outlines: the pairs that moved are those with a quote, comma, guillemet or, at Thin, a dotted letter.
- **Dotted zero in `ss01`; plain `I` and `l` move to `ss02`.** `ss01` sets a zero with a dot in its counter (the period's dot, narrowed to fit at Black), proportional or, with `tnum`, tabular; `zero` stays the slashed zero and wins when both are on. Stylesheets that used `ss01` for the plain `I` and `l` use `ss02` now. The capitals' counters follow the weight's stem again at Caption and Display, and a wide `i` keeps its 16-unit clearance beside D and B at Display Black. Display's spacing is 0.88 of text (was 0.8) so that Display Black no longer closes round pairs to a few units, and a Cyrillic `т` is its own width again (it had been drawn 34% too wide).
- **The Latin quality pass.** Joins, heavy terminals, Thin hairlines, Black counters and spacing
  are redrawn against Inter at 300 px and 14 px. Bowls flow into the stem with a tangent join;
  Black `a g 6 9 ? S s e æ` end in blunt cuts instead of tongues and wedges; the Thin comma, quotes
  and `t` foot follow the hairline; the Black `a` has a teardrop counter and no beak; `x` and the
  Thin letters have Inter-like sidebearings, and Thin text is as wide as Regular. `quality.py`
  holds the measurements and `lint.py` runs them strictly: 42 failures on the earlier font, none
  now. Composite offsets and the advance deltas are exact in the variable font. The upright
  variable woff2 budget rises from 69,500 to 71,500 bytes and the italic from 75,000 to 77,000.
  Known residue is in RESEARCH.md section 37.
- **The Black `?` hand-over.** The `?`'s tail leaves its arc without a curvature step, which removes the corner on its
  outer edge; the Black tail now falls straight to its foot, as Inter's does, where it slanted before. Regular is
  unchanged. The square `s` counter tips and the `a` mouth stay open (RESEARCH.md section 37).
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
