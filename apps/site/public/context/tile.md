# Tile

**Category:** inputs  
**Description:** A selectable card with radio (single) or checkbox (multi) semantics, toggled by click or keyboard

## When to use

- A visually rich, clickable choice card in a single- or multi-select group
- Plan/option pickers where each option needs an icon and supporting content
- A larger touch target than a plain radio or checkbox

## When NOT to use

- A simple inline boolean — use Checkbox or Toggle
- A dense list of text-only options — use RadioGroup or a Select

## Anti-patterns

### Single (radio) tiles cannot be unselected by clicking; use multi for toggleable behavior

**Bad:** `<Tile value="on">Enable</Tile> // used as a standalone on/off control`  
**Good:** `<Tile value="on" selectable="multi">Enable</Tile> // multi allows deselect`  
**Why:** Single (radio) tiles cannot be unselected by clicking; use multi for toggleable behavior

## Related components

- **RadioCard** (alternative): RadioCard wraps a native input in a group; Tile is a standalone ARIA radio/checkbox
- **CheckboxCard** (alternative): Use CheckboxCard when native checkbox form semantics are required

## Accessibility rationale

Exposes role="radio" (single) or role="checkbox" (multi) with aria-checked reflecting selection, is focusable, and toggles on Space/Enter. aria-disabled and a -1 tabindex remove disabled tiles from interaction.

## Props

| Name              | Type                      | Required | Default | Description                                                                                       |
| ----------------- | ------------------------- | -------- | ------- | ------------------------------------------------------------------------------------------------- |
| `value`           | `string`                  | Yes      | —       | Identifies this tile within a group.                                                              |
| `selected`        | `boolean`                 | No       | —       | Controlled selected state.                                                                        |
| `defaultSelected` | `boolean`                 | No       | —       | Initial selected state for uncontrolled use.                                                      |
| `onSelect`        | `(value: string) => void` | No       | —       | Called with this tile's value whenever it is toggled on (or off for multi).                       |
| `selectable`      | `'single' \| 'multi'`     | No       | single  | Single = radio semantics (toggle on); multi = checkbox semantics (toggle on/off).                 |
| `disabled`        | `boolean`                 | No       | —       | When true, disables the control and removes it from the tab order.                                |
| `icon`            | `React.ReactNode`         | No       | —       | Optional leading icon/visual.                                                                     |
| `asChild`         | `boolean`                 | No       | —       | When true, renders the child element as the root via Slot, merging props (polymorphic rendering). |
| `children`        | `React.ReactNode`         | No       | —       | Content rendered inside the component.                                                            |
| `className`       | `string`                  | No       | —       | Additional CSS class names merged onto the root element.                                          |

## Tokens

- `--cascivo-color-bg`
- `--cascivo-color-border`
- `--cascivo-color-border-strong`
- `--cascivo-color-accent`
- `--cascivo-color-text`
- `--cascivo-color-text-muted`
- `--cascivo-radius-surface`
- `--cascivo-focus-ring`

## Examples

### Single-select group

```jsx
<div role="radiogroup" aria-label="Plan">
  <Tile value="starter" selected={plan === 'starter'} onSelect={setPlan}>
    Starter
  </Tile>
  <Tile value="pro" selected={plan === 'pro'} onSelect={setPlan}>
    Pro
  </Tile>
</div>
```

### Multi-select with icon

Multi tiles toggle on and off like a checkbox.

```jsx
<Tile value="notifications" selectable="multi" icon={<BellIcon />} defaultSelected>
  Email notifications
</Tile>
```

## Boundaries

| Area           | Level    | Note                                                             |
| -------------- | -------- | ---------------------------------------------------------------- |
| selectable     | strict   | single (radio, select-only) \| multi (checkbox, toggle)          |
| selected state | flexible | Controlled (selected/onSelect) or uncontrolled (defaultSelected) |
| element        | flexible | asChild renders onto a custom element via Slot                   |

## AI context prompt

Copy this into an LLM context bar before editing this component:

```text
I am modifying the cascivo Tile component (inputs). A selectable card with radio (single) or checkbox (multi) semantics, toggled by click or keyboard

Architecture constraints — follow exactly:
- Signals only (useSignal/useComputed/useSignalEffect from @cascivo/core). Never useState/useEffect/useContext/useReducer.
- Style only through --cascivo-* custom properties. No Tailwind, no inline styles, no CSS-in-JS.
- Responsive via @container queries on the canonical scale (30rem/40rem/64rem/80rem). Do not use global viewport @media breakpoints.
- @container queries need an ancestor that establishes containment (container-type: inline-size). An element can never be its own query container, so a component whose own rule restyles itself via @container must render an outer wrapper that establishes the container (see Grid/Columns). Section and other layout wrappers already establish one for their descendants.
- Visual states (hover/focus/active/disabled) via CSS pseudo-classes, not JS.
- CSS logical properties only (RTL-safe).

Tile is strictly bound to these tokens — use only these, do not invent token names:
  --cascivo-color-bg, --cascivo-color-border, --cascivo-color-border-strong, --cascivo-color-accent, --cascivo-color-text, --cascivo-color-text-muted, --cascivo-radius-surface, --cascivo-focus-ring

Accessibility: role "radio", WCAG 2.2-AA, keyboard: Enter/Space. Keep it AA.

Do not change (strict): selectable — single (radio, select-only) | multi (checkbox, toggle)
Flexible: selected state, element.

Do not invent props, tokens, or global viewport media queries.
```
