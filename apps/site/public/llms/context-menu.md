# ContextMenu

Right-click context menu anchored at pointer coordinates via CSS custom properties

## Install

Copy-paste the source (you own and can edit it):

```bash
npx cascivo add context-menu
```

Or use it from the prebuilt package without copying:

```tsx
import { ContextMenu } from '@cascivo/react'
```

## Category

`overlay`

## States

- `open`
- `closed`

## Props

| Prop       | Type              | Required | Default | Description                                                         |
| ---------- | ----------------- | -------- | ------- | ------------------------------------------------------------------- |
| `children` | `React.ReactNode` | yes      | —       | The right-click target first, followed by ContextMenuItem children. |

## Examples

### Basic

```tsx
<ContextMenu>
  <div>Right-click me</div>
  <ContextMenuItem onSelect={rename}>Rename</ContextMenuItem>
  <ContextMenuItem onSelect={remove}>Delete</ContextMenuItem>
</ContextMenu>
```

### Disabled item

```tsx
<ContextMenu>
  <FileRow file={file} />
  <ContextMenuItem onSelect={copy}>Copy</ContextMenuItem>
  <ContextMenuItem onSelect={paste} disabled>
    Paste
  </ContextMenuItem>
</ContextMenu>
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

overlay, menu, context, right-click
