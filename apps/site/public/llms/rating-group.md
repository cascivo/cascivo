# RatingGroup

Star rating input with accessible radio group pattern

## Install

Copy-paste the source (you own and can edit it):

```bash
npx cascivo add rating-group
```

Or use it from the prebuilt package without copying:

```tsx
import { RatingGroup } from '@cascivo/react'
```

## Category

`inputs`

## Sizes

- `sm`
- `md`
- `lg`

## States

- `idle`
- `disabled`
- `readOnly`

## Props

| Prop            | Type                   | Required | Default | Description                                                        |
| --------------- | ---------------------- | -------- | ------- | ------------------------------------------------------------------ |
| `value`         | `number`               | yes      | —       | The controlled value.                                              |
| `onValueChange` | `(v: number) => void`  | no       | —       | Called with the new value when it changes.                         |
| `max`           | `number`               | no       | `5`     | Maximum allowed value.                                             |
| `size`          | `'sm' \| 'md' \| 'lg'` | no       | `md`    | Visual size of the component (e.g. 'sm', 'md', 'lg').              |
| `disabled`      | `boolean`              | no       | `false` | When true, disables the control and removes it from the tab order. |
| `readOnly`      | `boolean`              | no       | `false` | When true, the value is shown but cannot be edited.                |
| `labels`        | `RatingGroupLabels`    | no       | —       | Overrides for the component’s user-visible strings (i18n).         |

## Examples

### Basic

```tsx
<RatingGroup value={3} onValueChange={() => {}} />
```

### Read only

```tsx
<RatingGroup value={4} readOnly />
```

## Design tokens

- `--cascivo-color-warning`
- `--cascivo-color-border-strong`
- `--cascivo-color-accent`
- `--cascivo-radius-sm`

## Accessibility

- **WCAG level:** 2.2-AA
- **ARIA role:** `radiogroup`
- **Keyboard:** Tab, Space, Enter

## Dependencies

- `@cascivo/core`

## Tags

form, rating, stars, input, feedback

---

_Generated from registry v0.8.0 on 2026-07-21. Docs track `main`; compare with https://cascivo.com/registry.json `.version`._
