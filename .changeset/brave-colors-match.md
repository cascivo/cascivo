---
'@cascivo/react': minor
'@cascivo/i18n': minor
---

`ColorPicker`'s picking area returned a colour different from the one under the pointer. All
existing props keep their shape.

**The area computed in HSL against an HSV gradient.** The CSS paints the classic
`linear-gradient(to top, #000, transparent)` over `linear-gradient(to right, #fff,
transparent)` on a pure-hue ground — saturation on x, _value_ on y. Every calculation used
HSL: the pointer mapped y to lightness, and the thumb was positioned at `100 - hsl.l`. So
clicking the visibly pure hue at the top-right returned `hsl(h, 100%, 100%)`, which is
`#ffffff` for every hue, and the thumb for `#ff0000` sat halfway down the square rather than
on the colour it names. The maths is now HSV throughout and matches what the area draws.

**HSVA is the stored state.** Hex is 8-bit, so the previous hex→HSL→RGB→hex round-trip on
every interaction meant nudging the hue repeatedly bled saturation away. The component keeps
HSVA between edits and derives the output only on the way out.

**The area is no longer an invalid slider.** It was one `role="slider"` with no
`aria-valuenow`, `aria-valuemin` or `aria-valuemax` — a slider cannot describe two dimensions.
It is now a `role="group"` holding one native `<input type="range">` per axis, which carries
real slider semantics and brings arrow stepping, Home/End and PageUp/PageDown with it instead
of the four-arrow hand-rolled switch (the missing Home/End would have failed
`apgPattern: 'slider'`, which is why the manifest could never declare one).

Also fixed:

- **The preset swatches were labelled "Saturation and lightness"** — the group reused the
  colour area's string because no `presets` key existed — and their arrow keys changed the
  _value_ instead of moving focus. They are a correctly named group with roving focus now.
- **`aria-pressed` on a preset used string equality,** so `#FFF` never matched a selected
  `#ffffff`. Comparison resolves both sides to 8-bit RGBA.
- **The hex field committed every keystroke,** and `parseHex` fell back to black on anything
  unparseable, so typing `#3b82f6` fired `onValueChange` with `#`, `#3`, `#3b`… and thrashed
  the area to black in between. It keeps a draft and commits on blur, Enter or a valid paste;
  Escape abandons it; unparseable input is rejected rather than coerced.
- **The eyedropper caused a hydration mismatch.** `window.EyeDropper` was read during render,
  so the server emitted no button and the first client render emitted one. It is detected in
  an effect.
- **Alpha silently vanished at full opacity.** `toHex` dropped the alpha pair whenever
  `a >= 1`, so the emitted string flipped between 7 and 9 characters as the user dragged.
  With `alpha` on the width is now fixed.
- Both range inputs carried a visually-hidden `<label>` _and_ an `aria-label`; the label lost
  and was dead markup.

New: `format` (`'hex' | 'rgb' | 'hsl'`) and `name` for native form submission. A polite live
region reports the current colour, mounted before the first change so that change is
announced too.

Styling: added the `@media (pointer: coarse)` block (there was none — swatches were 24px, the
eyedropper 28px and the tracks 12px) and a reduced-motion block.

`@cascivo/i18n` adds `saturation`, `brightness`, `presets`, `hex` and `value`, and corrects
`colorArea` to "Saturation and brightness" — the axis it has always painted.

Tests go from 3 to 56, including a pure unit suite for the conversion and parsing functions,
which had none at all.
