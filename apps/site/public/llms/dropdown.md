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
| `items` | `{ label: string; value: string; icon?: ReactNode; disabled?: boolean; separator?: boolean }[]` | yes | — | The items to render. |
| `onSelect` | `(value: string) => void` | no | — | Called with the selected value. |
| `placement` | `'bottom-start' \| 'bottom-end'` | no | `bottom-start` | Placement relative to the trigger. |
| `open` | `boolean` | no | — | Whether the component is open (controlled). |
| `onOpenChange` | `(open: boolean) => void` | no | — | Called with the next open state when it changes. |

## Examples

### Basic

```tsx
<Dropdown trigger={<Button>Actions</Button>} items={[{ label: "Edit", value: "edit" }]} onSelect={handle} />
```

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

_Generated from registry v0.8.0 on 2026-07-21. Docs track `main`; compare with https://cascivo.com/registry.json `.version`._
