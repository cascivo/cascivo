# Dropdown

Menu of actions revealed from a trigger

## Install

Copy-paste the source (you own and can edit it):

```bash
npx cascivo add dropdown
```

Or use it from the prebuilt package without copying:

```tsx
import { Dropdown } from '@cascivo/react'
```

## Category

`overlay`

## States

- `closed`
- `open`

## Props

| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `trigger` | `ReactElement` | yes | — | The element that opens the dropdown when activated. |
| `items` | `({ label: string; value: string; icon?: ReactNode; disabled?: boolean; separator?: boolean } \| { kind: 'separator' })[]` | yes | — | Menu entries. A selectable row is `{ label, value, icon?, disabled? }`; a rule between groups is `{ kind: 'separator' }`, which takes no label or value. ⚠ The legacy `separator: true` flag on a row marks that row AS a rule and DISCARDS its label, value and icon — it does not draw a rule above it. It is deprecated and warns in dev. |
| `onSelect` | `(value: string) => void` | no | — | Called with the selected value. |
| `placement` | `'bottom-start' \| 'bottom-end'` | no | `bottom-start` | Which trigger edge the menu aligns to. `bottom-start` hangs it from the trigger's start edge, `bottom-end` from its end edge — use `bottom-end` for a trigger near the end of the viewport. |
| `open` | `boolean` | no | — | Whether the component is open (controlled). |
| `onOpenChange` | `(open: boolean) => void` | no | — | Called with the next open state when it changes. |

## Object types

### `DropdownMenuItem`

A selectable row in the menu.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `label` | `string` | yes | Visible item text. |
| `value` | `string` | yes | Passed to `onSelect`. |
| `icon` | `ReactNode` | no | Leading icon. |
| `disabled` | `boolean` | no | Skips the item in keyboard navigation and selection. |
| `separator` | `boolean` | no | ⚠ Deprecated and lossy: marks this row AS a rule, discarding its label, value and icon. Use a separate `{ kind: 'separator' }` entry. |

### `DropdownSeparatorItem`

A rule between groups. Carries no data and is skipped by keyboard navigation.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `kind` | `'separator'` | yes | Discriminant. |

## Examples

### Basic

```tsx
<Dropdown trigger={<Button>Actions</Button>} items={[{ label: "Edit", value: "edit" }]} onSelect={handle} />
```

## Client JavaScript

Required. The component's primary job needs client JavaScript, so do not render it from a Server Component without hydrating — even if some or all of its markup appears in the server HTML.

## Design tokens

- `--cascivo-color-surface-overlay`
- `--cascivo-color-border`
- `--cascivo-color-bg-subtle`
- `--cascivo-radius-md`
- `--cascivo-z-dropdown`

## Accessibility

- **WCAG level:** 2.2-AA
- **ARIA role:** `menu`
- **Keyboard:** ArrowDown, ArrowUp, Home, End, Enter, Space, Escape

## Dependencies

- `@cascivo/core`

## Tags

overlay, menu, actions

---

_Generated from registry v0.18.0 on 2026-08-17. Docs track `main`; compare with https://cascivo.com/registry.json `.version`._
