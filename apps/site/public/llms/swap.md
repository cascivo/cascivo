# Swap

Animated toggle between two icon/content states with rotate or flip transition

## Install

Copy-paste the source (you own and can edit it):

```bash
npx cascivo add swap
```

Or use it from the prebuilt package without copying:

```tsx
import { Swap } from '@cascivo/react'
```

## Category

`inputs`

## Variants

- `rotate`
- `flip`

## States

- `unchecked`
- `checked`

## Props

| Prop            | Type                         | Required | Default  | Description                                                                                                                                       |
| --------------- | ---------------------------- | -------- | -------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| `label`         | `string`                     | no       | —        | Alias of `ariaLabel` — the same invisible accessible name under the other spelling. Neither is deprecated. Not rendered — screen readers only.    |
| `ariaLabel`     | `string`                     | no       | —        | Invisible accessible name. The catalog convention; `aria-label` is accepted as an alias for the DOM spelling. Not rendered — screen readers only. |
| `on`            | `React.ReactNode`            | yes      | —        | Content shown in the active (on) state.                                                                                                           |
| `off`           | `React.ReactNode`            | yes      | —        | Content shown in the inactive (off) state.                                                                                                        |
| `checked`       | `boolean`                    | no       | `false`  | Whether the control is checked (controlled).                                                                                                      |
| `onValueChange` | `(checked: boolean) => void` | no       | —        | Called with the new checked state when the swap is toggled.                                                                                       |
| `mode`          | `'rotate' \| 'flip'`         | no       | `rotate` | Transition between states ('rotate' \| 'flip').                                                                                                   |
| `aria-label`    | `string`                     | no       | —        | Accessible label used when no visible label is present.                                                                                           |
| `className`     | `string`                     | no       | —        | Additional CSS class names merged onto the root element.                                                                                          |

## Examples

### Theme toggle (rotate)

Sun/moon icon that rotates between two states

```tsx
<Swap on={<SunIcon />} off={<MoonIcon />} mode="rotate" aria-label="Toggle theme" />
```

### Flip mode

Heart icon that flips to filled on activation

```tsx
<Swap on={<HeartFilledIcon />} off={<HeartIcon />} mode="flip" aria-label="Favorite" />
```

## Client JavaScript

Required. The component's primary job needs client JavaScript, so do not render it from a Server Component without hydrating — even if some or all of its markup appears in the server HTML.

## Design tokens

- `--cascivo-ring-width`
- `--cascivo-ring-color`
- `--cascivo-radius-control`
- `--cascivo-ease-out`

## Accessibility

- **WCAG level:** 2.2-AA
- **ARIA role:** `switch`
- **Keyboard:** Space, Enter

## Dependencies

- `@cascivo/core`

## Tags

toggle, icon, animate, switch, flip, rotate

---

_Generated from registry v1.0.0 on 2026-08-26. Docs track `main`; compare with https://cascivo.com/registry.json `.version`._
