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

## Tokens

- `--cascivo-color-bg`
- `--cascivo-color-border`
- `--cascivo-color-border-strong`
- `--cascivo-color-accent`
- `--cascivo-color-text`
- `--cascivo-color-text-muted`
- `--cascivo-radius-surface`
- `--cascivo-focus-ring`

## Boundaries

| Area           | Level    | Note                                                             |
| -------------- | -------- | ---------------------------------------------------------------- | ------------------------ |
| selectable     | strict   | single (radio, select-only)                                      | multi (checkbox, toggle) |
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
- Visual states (hover/focus/active/disabled) via CSS pseudo-classes, not JS.
- CSS logical properties only (RTL-safe).

Tile is strictly bound to these tokens — use only these, do not invent token names:
  --cascivo-color-bg, --cascivo-color-border, --cascivo-color-border-strong, --cascivo-color-accent, --cascivo-color-text, --cascivo-color-text-muted, --cascivo-radius-surface, --cascivo-focus-ring

Accessibility: role "radio", WCAG 2.2-AA, keyboard: Enter/Space. Keep it AA.

Do not change (strict): selectable — single (radio, select-only) | multi (checkbox, toggle)
Flexible: selected state, element.

Do not invent props, tokens, or global viewport media queries.
```
