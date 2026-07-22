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

| Prop               | Type                         | Required | Default      | Description                                             |
| ------------------ | ---------------------------- | -------- | ------------ | ------------------------------------------------------- |
| `after`            | `ReactNode`                  | yes      | —            | Base layer shown underneath                             |
| `before`           | `ReactNode`                  | yes      | —            | Top layer revealed up to the divider                    |
| `position`         | `number`                     | no       | —            | Divider position 0–100 (controlled)                     |
| `defaultPosition`  | `number`                     | no       | `50`         | The initial divider position (0–100) when uncontrolled. |
| `onPositionChange` | `(position: number) => void` | no       | —            | Called with the new divider position when it changes.   |
| `orientation`      | `'horizontal' \| 'vertical'` | no       | `horizontal` | Layout orientation of the component.                    |
| `keyboardStep`     | `number`                     | no       | `5`          | How far the divider moves per arrow-key press.          |
| `label`            | `string`                     | no       | —            | Text label for the control.                             |

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

_Generated from registry v0.10.0 on 2026-07-22. Docs track `main`; compare with https://cascivo.com/registry.json `.version`._
