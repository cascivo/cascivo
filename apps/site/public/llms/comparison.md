# Comparison

Reveals the difference between two layers with a draggable divider

## Install

Copy-paste the source (you own and can edit it):

```bash
npx cascivo add comparison
```

Or use it from the prebuilt package without copying:

```tsx
import { Comparison } from '@cascivo/react'
```

## Category

`display`

## States

- `default`

## Props

| Prop               | Type                         | Required | Default      | Description                                                                                                                                                  |
| ------------------ | ---------------------------- | -------- | ------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `after`            | `ReactNode`                  | yes      | —            | Base layer shown underneath                                                                                                                                  |
| `before`           | `ReactNode`                  | yes      | —            | Top layer revealed up to the divider                                                                                                                         |
| `position`         | `number`                     | no       | —            | Divider position 0–100 (controlled)                                                                                                                          |
| `defaultPosition`  | `number`                     | no       | `50`         | The initial divider position (0–100) when uncontrolled.                                                                                                      |
| `onPositionChange` | `(position: number) => void` | no       | —            | Called with the new divider position when it changes.                                                                                                        |
| `orientation`      | `'horizontal' \| 'vertical'` | no       | `horizontal` | Axis you drag along. `horizontal` splits the two images left and right with a vertical divider; `vertical` splits them top and bottom with a horizontal one. |
| `keyboardStep`     | `number`                     | no       | `5`          | How far the divider moves per arrow-key press.                                                                                                               |
| `ariaLabel`        | `string`                     | no       | —            | Alias of `label` — the same invisible accessible name under the catalog spelling. Neither is deprecated. Not rendered — screen readers only.                 |
| `label`            | `string`                     | no       | —            | Accessible name for the divider slider. Not rendered — screen readers only.                                                                                  |

## Examples

### Image before/after

```tsx
<Comparison
  before={<img src="/edited.jpg" alt="" />}
  after={<img src="/original.jpg" alt="Original" />}
  label="Reveal edited image"
/>
```

### Vertical

```tsx
<Comparison orientation="vertical" before={<Before />} after={<After />} />
```

### Controlled

```tsx
<Comparison
  position={position}
  onPositionChange={setPosition}
  before={<Before />}
  after={<After />}
/>
```

## Client JavaScript

Required. The component's primary job needs client JavaScript, so do not render it from a Server Component without hydrating — even if some or all of its markup appears in the server HTML.

## Design tokens

- `--cascivo-radius-md`
- `--cascivo-radius-full`
- `--cascivo-color-surface`
- `--cascivo-color-border`
- `--cascivo-color-focus-ring`
- `--cascivo-shadow-sm`
- `--cascivo-target-min-coarse`

## Accessibility

- **WCAG level:** 2.2-AA
- **ARIA role:** `slider`
- **Keyboard:** ArrowLeft, ArrowRight, ArrowUp, ArrowDown, Home, End, PageUp, PageDown

## Dependencies

- `@cascivo/core`
- `@cascivo/i18n`

## Tags

comparison, before-after, image, slider, display

---

_Generated from registry v0.18.0 on 2026-08-17. Docs track `main`; compare with https://cascivo.com/registry.json `.version`._
