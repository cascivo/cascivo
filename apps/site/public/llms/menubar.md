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

| Prop         | Type            | Required | Default | Description                                                                                                                                                                                                                                      |
| ------------ | --------------- | -------- | ------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `ariaLabel`  | `string`        | no       | —       | Invisible accessible name for the menubar landmark. The catalog convention; `aria-label` is accepted as an alias for the DOM spelling. Exactly one of the two is required — a menubar with no accessible name is a bug, so the type enforces it. |
| `menus`      | `MenubarMenu[]` | yes      | —       | The top-level menus to render.                                                                                                                                                                                                                   |
| `aria-label` | `string`        | no       | —       | Accessible label used when no visible label is present.                                                                                                                                                                                          |
| `className`  | `string`        | no       | —       | Additional CSS class names merged onto the root element.                                                                                                                                                                                         |

## Examples

### Basic

```tsx
<Menubar
  aria-label="Main"
  menus={[{ id: 'file', label: 'File', items: [{ id: 'new', label: 'New', onSelect: () => {} }] }]}
/>
```

## Client JavaScript

Required. Without client JavaScript this renders nothing useful, or a shell whose content is unreachable.

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

_Generated from registry v0.15.0 on 2026-08-03. Docs track `main`; compare with https://cascivo.com/registry.json `.version`._
