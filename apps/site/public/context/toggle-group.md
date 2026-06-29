# ToggleGroup

**Category:** inputs  
**Description:** A set of toggle buttons for single or multiple selection

## When to use

- Choosing one value from a small, mutually exclusive set that should stay visible (type="single")
- Toggling several independent options in a compact segmented control (type="multiple")

## When NOT to use

- The options are independent actions, not a selection — use ButtonGroup
- There are many options or they need labels and descriptions — use Radio or Checkbox groups

## Anti-patterns

### Single-select used as a controlled value should be driven by value/onValueChange so the source of truth lives with the parent

**Bad:** `<ToggleGroup type="single" items={items} onValueChange={save} />`  
**Good:** `<ToggleGroup type="single" value={align} onValueChange={setAlign} items={items} />`  
**Why:** Single-select used as a controlled value should be driven by value/onValueChange so the source of truth lives with the parent

## Related components

- **ButtonGroup** (alternative): Use when the buttons fire independent actions rather than select a value
- **Toggle** (alternative): Use a single Toggle for one standalone binary option

## Accessibility rationale

Single mode renders role="radiogroup" with role="radio" + aria-checked items; multiple mode uses a plain group of buttons with aria-pressed. Roving tabindex makes the set one tab stop and arrow keys move between items, matching the APG radiogroup/toolbar patterns

## Props

| Name            | Type                                                                              | Required           | Default | Description                                                        |
| --------------- | --------------------------------------------------------------------------------- | ------------------ | ------- | ------------------------------------------------------------------ | -------------------------------------------------------------- | ----------------------------------------------------- |
| `type`          | `'single'                                                                         | 'multiple'`        | Yes     | —                                                                  | Whether one or multiple items can be pressed at once ('single' | 'multiple').                                          |
| `value`         | `string                                                                           | string[]`          | No      | —                                                                  | The controlled value.                                          |
| `defaultValue`  | `string                                                                           | string[]`          | No      | —                                                                  | The initial value when uncontrolled.                           |
| `onValueChange` | `(value: string                                                                   | string[]) => void` | No      | —                                                                  | Called with the new value when it changes.                     |
| `items`         | `{ value: string; label?: string; icon?: React.ReactNode; disabled?: boolean }[]` | Yes                | —       | The items to render.                                               |
| `orientation`   | `'horizontal'                                                                     | 'vertical'`        | No      | horizontal                                                         | Layout orientation of the component.                           |
| `size`          | `'sm'                                                                             | 'md'               | 'lg'`   | No                                                                 | md                                                             | Visual size of the component (e.g. 'sm', 'md', 'lg'). |
| `disabled`      | `boolean`                                                                         | No                 | false   | When true, disables the control and removes it from the tab order. |

## Tokens

- `--cascivo-control-height-sm`
- `--cascivo-control-height-md`
- `--cascivo-control-height-lg`
- `--cascivo-radius-control`
- `--cascivo-radius-item`
- `--cascivo-color-bg-subtle`
- `--cascivo-color-surface`
- `--cascivo-color-text`
- `--cascivo-shadow-sm`
- `--cascivo-focus-ring`

## Examples

### Single selection

```jsx
<ToggleGroup
  type="single"
  defaultValue="left"
  items={[
    { value: 'left', label: 'Left' },
    { value: 'center', label: 'Center' },
    { value: 'right', label: 'Right' },
  ]}
/>
```

### Multiple selection

```jsx
<ToggleGroup
  type="multiple"
  defaultValue={['bold']}
  items={[
    { value: 'bold', label: 'Bold' },
    { value: 'italic', label: 'Italic' },
  ]}
/>
```

## Boundaries

| Area         | Level    | Note                                                                                 |
| ------------ | -------- | ------------------------------------------------------------------------------------ |
| token names  | strict   | Item height must resolve to --cascivo-control-height-\* to align with other controls |
| item content | flexible | Items may use a text label, an icon, or both; consumer owns the icon set             |

## AI context prompt

Copy this into an LLM context bar before editing this component:

```text
I am modifying the cascivo ToggleGroup component (inputs). A set of toggle buttons for single or multiple selection

Architecture constraints — follow exactly:
- Signals only (useSignal/useComputed/useSignalEffect from @cascivo/core). Never useState/useEffect/useContext/useReducer.
- Style only through --cascivo-* custom properties. No Tailwind, no inline styles, no CSS-in-JS.
- Responsive via @container queries on the canonical scale (30rem/40rem/64rem/80rem). Do not use global viewport @media breakpoints.
- Visual states (hover/focus/active/disabled) via CSS pseudo-classes, not JS.
- CSS logical properties only (RTL-safe).

ToggleGroup is strictly bound to these tokens — use only these, do not invent token names:
  --cascivo-control-height-sm, --cascivo-control-height-md, --cascivo-control-height-lg, --cascivo-radius-control, --cascivo-radius-item, --cascivo-color-bg-subtle, --cascivo-color-surface, --cascivo-color-text, --cascivo-shadow-sm, --cascivo-focus-ring

Accessibility: role "radiogroup", WCAG 2.2-AA, keyboard: ArrowRight/ArrowLeft/ArrowUp/ArrowDown/Home/End/Enter/Space. Keep it AA.

Do not change (strict): token names — Item height must resolve to --cascivo-control-height-* to align with other controls
Flexible: item content.

Do not invent props, tokens, or global viewport media queries.
```
