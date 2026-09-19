# ColorPicker

**Category:** inputs  
**Description:** Interactive color selection widget with saturation/lightness area, hue and alpha sliders

## When to use

- Letting a user choose an arbitrary color via a visual saturation/lightness area plus hue control
- Brand or theme customization UIs where an exact color value (hex) is captured
- Forms that need an optional alpha channel alongside the color

## When NOT to use

- Choosing from a small fixed palette only — use a swatch RadioGroup instead
- A single accent toggle where a few preset chips suffice

## Anti-patterns

### A free-form picker invites off-brand values when only a fixed set is allowed

**Bad:** `<ColorPicker /> with no presets for a brand palette of 4 fixed colors`  
**Good:** `<RadioGroup> of color swatches`  
**Why:** A free-form picker invites off-brand values when only a fixed set is allowed

## Related components

- **Slider** (contains): Hue and alpha channels are range sliders
- **Input** (pairs-with): The hex text field lets users paste an exact value

## Accessibility rationale

The picking area is a role="group" holding one native range input per axis — saturation on x, brightness on y — rather than a single role="slider", which cannot describe two dimensions and in the previous build carried no aria-valuenow at all. Real inputs also mean arrow stepping, Home/End and PageUp/PageDown are the platform's rather than a hand-rolled key switch, and each axis announces its own percentage. Hue and alpha are native range inputs for the same reason. The preset swatches are a labelled role="group" of toggle buttons with roving focus, so the arrows move focus between swatches and Enter or Space selects — the previous build labelled that group "Saturation and lightness" and made the arrows change the value instead. The hex field commits on blur, Enter or a valid paste and rejects anything unparseable, so a half-typed value never reaches onValueChange. A polite live region reports the current colour, mounted before the first change so that change is announced too. Selection and focus each carry a non-colour channel under forced-colors, and every control reaches the coarse-pointer target minimum.

## Props

| Name               | Type                      | Required | Default | Description                                                                                                                                                                                                                                                                                                                                                                                          |
| ------------------ | ------------------------- | -------- | ------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `labels`           | `ColorPickerLabels`       | No       | —       | Overrides for the component’s user-visible strings (i18n).                                                                                                                                                                                                                                                                                                                                           |
| `value`            | `string`                  | No       | —       | Controlled hex color value                                                                                                                                                                                                                                                                                                                                                                           |
| `defaultValue`     | `string`                  | No       | #3b82f6 | The initial value when uncontrolled.                                                                                                                                                                                                                                                                                                                                                                 |
| `onValueChange`    | `(value: string) => void` | No       | —       | Called with the new value when it changes.                                                                                                                                                                                                                                                                                                                                                           |
| `presets`          | `string[]`                | No       | —       | Preset swatch colors                                                                                                                                                                                                                                                                                                                                                                                 |
| `alpha`            | `boolean`                 | No       | true    | When true, enables alpha (opacity) selection.                                                                                                                                                                                                                                                                                                                                                        |
| `format`           | `'hex' \| 'rgb' \| 'hsl'` | No       | 'hex'   | Notation for the emitted value. Alpha is included whenever alpha is on, so the emitted string has a stable width.                                                                                                                                                                                                                                                                                    |
| `name`             | `string`                  | No       | —       | Submitted with a surrounding form — a hidden input carrying the current value.                                                                                                                                                                                                                                                                                                                       |
| `label`            | `string`                  | No       | —       | Text label for the control. Rendered on screen.                                                                                                                                                                                                                                                                                                                                                      |
| `disabled`         | `boolean`                 | No       | false   | When true, disables the control and removes it from the tab order.                                                                                                                                                                                                                                                                                                                                   |
| `size`             | `'sm' \| 'md' \| 'lg'`    | No       | md      | Visual size of the component (e.g. 'sm', 'md', 'lg').                                                                                                                                                                                                                                                                                                                                                |
| `aria-labelledby`  | `string`                  | No       | —       | Wired automatically by a wrapping `Field` — its label id, forwarded to the focusable control so the Field's label names it.                                                                                                                                                                                                                                                                          |
| `aria-describedby` | `string`                  | No       | —       | Wired automatically by a wrapping `Field` — the ids of its hint/error text, forwarded to the focusable control so the supporting text is announced.                                                                                                                                                                                                                                                  |
| `aria-invalid`     | `boolean`                 | No       | —       | Wired automatically by a wrapping `Field` when it is in an error state.                                                                                                                                                                                                                                                                                                                              |
| `id`               | `string`                  | No       | —       | Id for the **focusable control** (not the wrapper), so a `<label for>` names what actually takes focus. `Field` supplies this automatically.                                                                                                                                                                                                                                                         |
| `ariaLabel`        | `string`                  | No       | —       | Invisible accessible name, for when a visible element outside this component already labels it and `label` would render that text a second time. ⚠ `label` on this component is **visible**; `IconButton.label`/`Sparkline.label` are invisible names, which is the prior that costs adopters a duplicated label. The raw DOM `aria-label` still wins over this. Not rendered — screen readers only. |

## Tokens

- `--cascivo-color-accent`
- `--cascivo-color-surface`
- `--cascivo-color-border`
- `--cascivo-color-border-strong`
- `--cascivo-radius-md`
- `--cascivo-radius-full`
- `--cascivo-focus-ring`

## Examples

### Basic

```jsx
<ColorPicker defaultValue="#3b82f6" onValueChange={setColor} />
```

### With presets

```jsx
<ColorPicker presets={['#ef4444', '#3b82f6', '#10b981']} alpha={false} />
```

## Boundaries

| Area          | Level    | Note                                                                                          |
| ------------- | -------- | --------------------------------------------------------------------------------------------- |
| output format | flexible | format switches between hex, rgb() and hsl(); alpha is included whenever the alpha prop is on |
| color model   | flexible | Values are stored as hex; consumers can convert to rgb/hsl/oklch as needed                    |
| token names   | strict   | Surfaces, borders and focus ring must resolve to --cascivo-\* tokens                          |

## AI context prompt

Copy this into an LLM context bar before editing this component:

```text
I am modifying the cascivo ColorPicker component (inputs). Interactive color selection widget with saturation/lightness area, hue and alpha sliders

Architecture constraints — follow exactly:
- Signals only (useSignal/useComputed/useSignalEffect from @cascivo/core). Never useState/useEffect/useContext/useReducer.
- Style only through --cascivo-* custom properties. No Tailwind, no inline styles, no CSS-in-JS.
- Responsive via @container queries on the canonical scale (30rem/40rem/64rem/80rem). Do not use global viewport @media breakpoints.
- @container queries need an ancestor that establishes containment (container-type: inline-size). An element can never be its own query container, so a component whose own rule restyles itself via @container must render an outer wrapper that establishes the container (see Grid/Columns). Section and other layout wrappers already establish one for their descendants.
- Visual states (hover/focus/active/disabled) via CSS pseudo-classes, not JS.
- CSS logical properties only (RTL-safe).

ColorPicker is strictly bound to these tokens — use only these, do not invent token names:
  --cascivo-color-accent, --cascivo-color-surface, --cascivo-color-border, --cascivo-color-border-strong, --cascivo-radius-md, --cascivo-radius-full, --cascivo-focus-ring

Accessibility: role "group", WCAG 2.2-AA, keyboard: ArrowLeft/ArrowRight/ArrowUp/ArrowDown/Home/End/PageUp/PageDown/Enter/Escape. Keep it AA.

Do not change (strict): token names — Surfaces, borders and focus ring must resolve to --cascivo-* tokens
Flexible: output format, color model.

Do not invent props, tokens, or global viewport media queries.
```
