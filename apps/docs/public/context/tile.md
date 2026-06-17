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
