# Resizable

**Category:** layout  
**Description:** Two-pane splitter whose divider can be dragged or keyboard-nudged to reallocate space

## When to use

- Letting users reallocate space between two adjacent regions, e.g. an editor and a preview
- Side panels or inspectors whose width the user should control
- Master/detail layouts where one pane may need more room than the default

## When NOT to use

- Fixed layouts where the split should never change — use plain flex/grid
- More than two siblings need independent resizing — compose nested splitters instead

## Anti-patterns

### A single separator can only mediate one boundary between two panes

**Bad:** `<Resizable> wrapping three panes`  
**Good:** `Nest two Resizable splitters so each divider controls exactly one boundary`  
**Why:** A single separator can only mediate one boundary between two panes

## Related components

- **Slider** (alternative): Use a slider when picking a value, not when allocating layout space

## Accessibility rationale

The divider is a focusable role="separator" with aria-orientation and aria-valuenow/min/max reflecting the percentage split; arrow keys nudge the ratio and Home/End snap to the configured bounds, matching the APG window-splitter pattern.

## Props

| Name            | Type                         | Required | Default    | Description                                      |
| --------------- | ---------------------------- | -------- | ---------- | ------------------------------------------------ |
| `children`      | `ReactNode`                  | Yes      | —          | Exactly two panes                                |
| `orientation`   | `'horizontal' \| 'vertical'` | No       | horizontal | Layout orientation of the component.             |
| `defaultRatio`  | `number`                     | No       | 0.5        | The initial split ratio when uncontrolled.       |
| `ratio`         | `number`                     | No       | —          | Controlled ratio (0–1)                           |
| `minRatio`      | `number`                     | No       | 0.1        | Minimum allowed split ratio.                     |
| `maxRatio`      | `number`                     | No       | 0.9        | Maximum allowed split ratio.                     |
| `onRatioChange` | `(ratio: number) => void`    | No       | —          | Called with the new split ratio when it changes. |

## Tokens

- `--cascivo-color-border`
- `--cascivo-color-border-strong`
- `--cascivo-radius-full`
- `--cascivo-focus-ring`

## Examples

### Horizontal split

```jsx
<Resizable>
  <Editor />
  <Preview />
</Resizable>
```

### Vertical with bounds

```jsx
<Resizable orientation="vertical" defaultRatio={0.3} minRatio={0.2} maxRatio={0.8}>
  <Toolbar />
  <Canvas />
</Resizable>
```

## Boundaries

| Area          | Level    | Note                                                                               |
| ------------- | -------- | ---------------------------------------------------------------------------------- |
| sizing        | strict   | Pane sizes derive from a single --cascivo-resizable-ratio custom property via flex |
| min/max ratio | flexible | Consumer-defined clamp range                                                       |

## AI context prompt

Copy this into an LLM context bar before editing this component:

```text
I am modifying the cascivo Resizable component (layout). Two-pane splitter whose divider can be dragged or keyboard-nudged to reallocate space

Architecture constraints — follow exactly:
- Signals only (useSignal/useComputed/useSignalEffect from @cascivo/core). Never useState/useEffect/useContext/useReducer.
- Style only through --cascivo-* custom properties. No Tailwind, no inline styles, no CSS-in-JS.
- Responsive via @container queries on the canonical scale (30rem/40rem/64rem/80rem). Do not use global viewport @media breakpoints.
- Visual states (hover/focus/active/disabled) via CSS pseudo-classes, not JS.
- CSS logical properties only (RTL-safe).

Resizable is strictly bound to these tokens — use only these, do not invent token names:
  --cascivo-color-border, --cascivo-color-border-strong, --cascivo-radius-full, --cascivo-focus-ring

Accessibility: role "separator", WCAG 2.2-AA, keyboard: ArrowLeft/ArrowRight/ArrowUp/ArrowDown/Home/End. Keep it AA.

Do not change (strict): sizing — Pane sizes derive from a single --cascivo-resizable-ratio custom property via flex
Flexible: min/max ratio.

Do not invent props, tokens, or global viewport media queries.
```
