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

The saturation/lightness area is a focusable role="slider" with arrow-key nudging and an aria-valuetext reporting the current hex; hue and alpha are native range inputs that inherit platform slider semantics and announcements.

## Props

| Name            | Type                      | Required | Default | Description                                                        |
| --------------- | ------------------------- | -------- | ------- | ------------------------------------------------------------------ |
| `value`         | `string`                  | No       | —       | Controlled hex color value                                         |
| `defaultValue`  | `string`                  | No       | #3b82f6 | The initial value when uncontrolled.                               |
| `onValueChange` | `(value: string) => void` | No       | —       | Called with the new value when it changes.                         |
| `presets`       | `string[]`                | No       | —       | Preset swatch colors                                               |
| `alpha`         | `boolean`                 | No       | true    | When true, enables alpha (opacity) selection.                      |
| `label`         | `string`                  | No       | —       | Text label for the control.                                        |
| `disabled`      | `boolean`                 | No       | false   | When true, disables the control and removes it from the tab order. |
| `size`          | `'sm' \| 'md' \| 'lg'`    | No       | md      | Visual size of the component (e.g. 'sm', 'md', 'lg').              |

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

| Area        | Level    | Note                                                                       |
| ----------- | -------- | -------------------------------------------------------------------------- |
| color model | flexible | Values are stored as hex; consumers can convert to rgb/hsl/oklch as needed |
| token names | strict   | Surfaces, borders and focus ring must resolve to --cascivo-\* tokens       |

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

Accessibility: role "slider", WCAG 2.2-AA, keyboard: ArrowLeft/ArrowRight/ArrowUp/ArrowDown. Keep it AA.

Do not change (strict): token names — Surfaces, borders and focus ring must resolve to --cascivo-* tokens
Flexible: color model.

Do not invent props, tokens, or global viewport media queries.
```
