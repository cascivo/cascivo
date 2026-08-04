# Slider

Range input for selecting a value within bounds

## Install

Copy-paste the source (you own and can edit it):

```bash
npx cascivo add slider
```

Or use it from the prebuilt package without copying:

```tsx
import { Slider } from '@cascivo/react'
```

## Category

`inputs`

## Props

| Prop           | Type      | Required | Default | Description                                                        |
| -------------- | --------- | -------- | ------- | ------------------------------------------------------------------ |
| `label`        | `string`  | no       | —       | Text label for the control.                                        |
| `min`          | `number`  | no       | `0`     | Minimum allowed value.                                             |
| `max`          | `number`  | no       | `100`   | Maximum allowed value.                                             |
| `step`         | `number`  | no       | `1`     | Increment between allowed values.                                  |
| `value`        | `number`  | no       | —       | The controlled value.                                              |
| `defaultValue` | `number`  | no       | —       | The initial value when uncontrolled.                               |
| `disabled`     | `boolean` | no       | `false` | When true, disables the control and removes it from the tab order. |

## Examples

### Basic

```tsx
<Slider label="Volume" defaultValue={50} />
```

### Stepped

```tsx
<Slider label="Rating" min={0} max={5} step={1} />
```

## Client JavaScript

None. Renders complete and correct with JavaScript disabled, and can be rendered directly from a React Server Component without hydrating.

## Design tokens

- `--cascivo-color-accent`
- `--cascivo-color-border-strong`
- `--cascivo-color-surface`
- `--cascivo-radius-full`
- `--cascivo-focus-ring`

## Accessibility

- **WCAG level:** 2.2-AA
- **ARIA role:** `slider`
- **Keyboard:** ArrowLeft, ArrowRight, ArrowUp, ArrowDown, Home, End

## Dependencies

- `@cascivo/core`

## Tags

form, range, input

---

_Generated from registry v0.14.0 on 2026-07-31. Docs track `main`; compare with https://cascivo.com/registry.json `.version`._
