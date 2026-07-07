# Comparison

**Category:** display  
**Description:** Reveals the difference between two layers with a draggable divider

## When to use

- Showing the difference between two versions of similar content (before/after edits, original vs processed)
- Letting users interactively reveal one image or panel over another
- Side-by-side visual demos where a draggable divider is clearer than two static images

## When NOT to use

- Comparing more than two items — use a layout or table instead
- Non-visual data comparison — use a table or chart
- Static side-by-side images with no need for an interactive reveal

## Anti-patterns

### The divider is a slider; without a label assistive tech announces an unnamed control

**Bad:** `<Comparison before={<Before />} after={<After />} /> with no label`  
**Good:** `<Comparison label="Reveal edited photo" before={<Before />} after={<After />} />`  
**Why:** The divider is a slider; without a label assistive tech announces an unnamed control

## Related components

- **Slider** (alternative): Use Slider for selecting a numeric value rather than revealing layered content
- **Carousel** (alternative): Use Carousel to step through more than two pieces of content

## Accessibility rationale

The divider is a role="slider" with aria-valuemin/max/now and full keyboard support (Arrow/Home/End/PageUp/PageDown); aria-orientation reflects the axis so the value and direction are conveyed without sight

## Props

| Name               | Type                         | Required | Default    | Description                                             |
| ------------------ | ---------------------------- | -------- | ---------- | ------------------------------------------------------- |
| `after`            | `ReactNode`                  | Yes      | —          | Base layer shown underneath                             |
| `before`           | `ReactNode`                  | Yes      | —          | Top layer revealed up to the divider                    |
| `position`         | `number`                     | No       | —          | Divider position 0–100 (controlled)                     |
| `defaultPosition`  | `number`                     | No       | 50         | The initial divider position (0–100) when uncontrolled. |
| `onPositionChange` | `(position: number) => void` | No       | —          | Called with the new divider position when it changes.   |
| `orientation`      | `'horizontal' \| 'vertical'` | No       | horizontal | Layout orientation of the component.                    |
| `keyboardStep`     | `number`                     | No       | 5          | How far the divider moves per arrow-key press.          |
| `label`            | `string`                     | No       | —          | Text label for the control.                             |

## Tokens

- `--cascivo-radius-md`
- `--cascivo-radius-full`
- `--cascivo-color-surface`
- `--cascivo-color-border`
- `--cascivo-color-focus-ring`
- `--cascivo-shadow-sm`
- `--cascivo-target-min-coarse`

## Examples

### Image before/after

```jsx
<Comparison
  before={<img src="/edited.jpg" alt="" />}
  after={<img src="/original.jpg" alt="Original" />}
  label="Reveal edited image"
/>
```

### Vertical

```jsx
<Comparison orientation="vertical" before={<Before />} after={<After />} />
```

### Controlled

```jsx
<Comparison
  position={position}
  onPositionChange={setPosition}
  before={<Before />}
  after={<After />}
/>
```

## Boundaries

| Area        | Level    | Note                                                                 |
| ----------- | -------- | -------------------------------------------------------------------- |
| orientation | flexible | Horizontal or vertical depending on the content                      |
| label       | strict   | Provide a label (or rely on the i18n default) so the slider is named |

## AI context prompt

Copy this into an LLM context bar before editing this component:

```text
I am modifying the cascivo Comparison component (display). Reveals the difference between two layers with a draggable divider

Architecture constraints — follow exactly:
- Signals only (useSignal/useComputed/useSignalEffect from @cascivo/core). Never useState/useEffect/useContext/useReducer.
- Style only through --cascivo-* custom properties. No Tailwind, no inline styles, no CSS-in-JS.
- Responsive via @container queries on the canonical scale (30rem/40rem/64rem/80rem). Do not use global viewport @media breakpoints.
- Visual states (hover/focus/active/disabled) via CSS pseudo-classes, not JS.
- CSS logical properties only (RTL-safe).

Comparison is strictly bound to these tokens — use only these, do not invent token names:
  --cascivo-radius-md, --cascivo-radius-full, --cascivo-color-surface, --cascivo-color-border, --cascivo-color-focus-ring, --cascivo-shadow-sm, --cascivo-target-min-coarse

Accessibility: role "slider", WCAG 2.2-AA, keyboard: ArrowLeft/ArrowRight/ArrowUp/ArrowDown/Home/End/PageUp/PageDown. Keep it AA.

Do not change (strict): label — Provide a label (or rely on the i18n default) so the slider is named
Flexible: orientation.

Do not invent props, tokens, or global viewport media queries.
```
