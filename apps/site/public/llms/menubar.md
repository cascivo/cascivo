# Menubar

Horizontal application menu bar with keyboard-navigable dropdown menus

## Install

Copy-paste the source (you own and can edit it):

```bash
npx cascivo add menubar
```

Or use it from the prebuilt package without copying:

```tsx
import { Menubar } from '@cascivo/react'
```

## Category

`navigation`

## States

- `closed`
- `open`

## Props

| Prop         | Type            | Required | Default | Description                                              |
| ------------ | --------------- | -------- | ------- | -------------------------------------------------------- |
| `menus`      | `MenubarMenu[]` | yes      | —       | The top-level menus to render.                           |
| `aria-label` | `string`        | yes      | —       | Accessible label used when no visible label is present.  |
| `className`  | `string`        | no       | —       | Additional CSS class names merged onto the root element. |

## Examples

### Basic

```tsx
<Menubar
  aria-label="Main"
  menus={[{ id: 'file', label: 'File', items: [{ id: 'new', label: 'New', onSelect: () => {} }] }]}
/>
```

## Design tokens

- `--cascivo-color-surface`
- `--cascivo-color-bg-subtle`
- `--cascivo-color-text`
- `--cascivo-color-border`
- `--cascivo-focus-ring`
- `--cascivo-motion-enter`
- `--cascivo-motion-exit`

## Accessibility

- **WCAG level:** 2.2-AA
- **ARIA role:** `menubar`
- **Keyboard:** ArrowLeft, ArrowRight, ArrowDown, ArrowUp, Home, End, Enter, Escape

## Dependencies

- `@cascivo/core`

## Tags

navigation, menubar, menu, application

---

_Generated from registry v0.10.0 on 2026-07-23. Docs track `main`; compare with https://cascivo.com/registry.json `.version`._
