# Changelog

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
- **Files.** Static Regular, Bold, Italic and Bold Italic TTFs for desktop apps.

## 0.1.0

The first release: a parametric stroke engine, upright and italic variable fonts with weight
(100-900) and optical size (8-48) axes, 365 codepoints.
