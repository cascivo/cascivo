# Menu

Dropdown menu with keyboard navigation, built on usePopover

## Install

Copy-paste the source (you own and can edit it):

```bash
npx cascivo add menu
```

Or use it from the prebuilt package without copying:

```tsx
import { Menu } from '@cascivo/react'
```

## Category

`overlay`

## States

- `open`
- `closed`

## Props

| Prop       | Type              | Required | Default | Description                                                         |
| ---------- | ----------------- | -------- | ------- | ------------------------------------------------------------------- |
| `children` | `React.ReactNode` | yes      | —       | The MenuTrigger first, followed by MenuItem/MenuSeparator children. |

## Examples

### Basic

```tsx
<Menu>
  <MenuTrigger>Options</MenuTrigger>
  <MenuItem onSelect={rename}>Rename</MenuItem>
  <MenuItem onSelect={duplicate}>Duplicate</MenuItem>
</Menu>
```

### With separator and disabled item

```tsx
<Menu>
  <MenuTrigger aria-label="More actions">…</MenuTrigger>
  <MenuItem onSelect={share}>Share</MenuItem>
  <MenuSeparator />
  <MenuItem onSelect={remove} disabled>
    Delete
  </MenuItem>
</Menu>
```

## Design tokens

- `--cascivo-color-surface`
- `--cascivo-color-border`
- `--cascivo-radius-md`
- `--cascivo-shadow-md`
- `--cascivo-motion-enter`
- `--cascivo-motion-exit`
- `--cascivo-color-bg-subtle`

## Accessibility

- **WCAG level:** 2.2-AA
- **ARIA role:** `menu`
- **Keyboard:** ArrowDown, ArrowUp, Enter, Space, Escape

## Dependencies

- `@cascivo/core`

## Tags

overlay, menu, dropdown, floating
