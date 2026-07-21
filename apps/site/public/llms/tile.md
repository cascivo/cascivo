# Tile

A selectable card with radio (single) or checkbox (multi) semantics, toggled by click or keyboard

## Install

Copy-paste the source (you own and can edit it):

```bash
npx cascivo add tile
```

Or use it from the prebuilt package without copying:

```tsx
import { Tile } from '@cascivo/react'
```

## Category

`inputs`

## Variants

- `single`
- `multi`

## States

- `default`
- `selected`
- `focus`
- `disabled`

## Props

| Prop              | Type                      | Required | Default  | Description                                                                                       |
| ----------------- | ------------------------- | -------- | -------- | ------------------------------------------------------------------------------------------------- |
| `value`           | `string`                  | yes      | —        | Identifies this tile within a group.                                                              |
| `selected`        | `boolean`                 | no       | —        | Controlled selected state.                                                                        |
| `defaultSelected` | `boolean`                 | no       | —        | Initial selected state for uncontrolled use.                                                      |
| `onSelect`        | `(value: string) => void` | no       | —        | Called with this tile's value whenever it is toggled on (or off for multi).                       |
| `selectable`      | `'single' \| 'multi'`     | no       | `single` | Single = radio semantics (toggle on); multi = checkbox semantics (toggle on/off).                 |
| `disabled`        | `boolean`                 | no       | —        | When true, disables the control and removes it from the tab order.                                |
| `icon`            | `React.ReactNode`         | no       | —        | Optional leading icon/visual.                                                                     |
| `asChild`         | `boolean`                 | no       | —        | When true, renders the child element as the root via Slot, merging props (polymorphic rendering). |
| `children`        | `React.ReactNode`         | no       | —        | Content rendered inside the component.                                                            |
| `className`       | `string`                  | no       | —        | Additional CSS class names merged onto the root element.                                          |

## Examples

### Single-select group

```tsx
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

```tsx
<Tile value="notifications" selectable="multi" icon={<BellIcon />} defaultSelected>
  Email notifications
</Tile>
```

## Design tokens

- `--cascivo-color-bg`
- `--cascivo-color-border`
- `--cascivo-color-border-strong`
- `--cascivo-color-accent`
- `--cascivo-color-text`
- `--cascivo-color-text-muted`
- `--cascivo-radius-surface`
- `--cascivo-focus-ring`

## Accessibility

- **WCAG level:** 2.2-AA
- **ARIA role:** `radio`
- **Keyboard:** Enter, Space

## Dependencies

- `@cascivo/core`

## Tags

inputs, tile, card, selectable, choice

---

_Generated from registry v0.8.0 on 2026-07-21. Docs track `main`; compare with https://cascivo.com/registry.json `.version`._
