# Tooltip

Contextual label shown on hover or focus

## Install

Copy-paste the source (you own and can edit it):

```bash
npx cascivo add tooltip
```

Or use it from the prebuilt package without copying:

```tsx
import { Tooltip } from '@cascivo/react'
```

## Category

`overlay`

## States

- `hidden`
- `visible`

## Props

| Prop        | Type                                     | Required | Default | Description                                                               |
| ----------- | ---------------------------------------- | -------- | ------- | ------------------------------------------------------------------------- |
| `content`   | `ReactNode`                              | yes      | —       | The tooltip content shown on hover/focus.                                 |
| `placement` | `'top' \| 'right' \| 'bottom' \| 'left'` | no       | `top`   | Side of the trigger the tip opens on: `top`, `right`, `bottom` or `left`. |
| `children`  | `ReactElement`                           | yes      | —       | Content rendered inside the component.                                    |
| `delay`     | `number`                                 | no       | `200`   | Milliseconds to wait before showing                                       |

## Examples

### Basic

```tsx
<Tooltip content="Copy to clipboard">
  <Button>Copy</Button>
</Tooltip>
```

## Client JavaScript

Required. The component's primary job needs client JavaScript, so do not render it from a Server Component without hydrating — even if some or all of its markup appears in the server HTML.

## Design tokens

- `--cascivo-color-text`
- `--cascivo-color-text-on-accent`
- `--cascivo-radius-sm`
- `--cascivo-z-tooltip`

## Accessibility

- **WCAG level:** 2.2-AA
- **ARIA role:** `tooltip`
- **Keyboard:** Tab, Escape

## Dependencies

- `@cascivo/core`

## Tags

overlay, hint, popover

---

_Generated from registry v1.0.0 on 2026-08-26. Docs track `main`; compare with https://cascivo.com/registry.json `.version`._
