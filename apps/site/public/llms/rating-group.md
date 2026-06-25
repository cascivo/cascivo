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

| Prop            | Type                  | Required | Default | Description |
| --------------- | --------------------- | -------- | ------- | ----------- | ---- | --- |
| `value`         | `number`              | yes      | —       | —           |
| `onValueChange` | `(v: number) => void` | no       | —       | —           |
| `max`           | `number`              | no       | `5`     | —           |
| `size`          | `'sm'                 | 'md'     | 'lg'`   | no          | `md` | —   |
| `disabled`      | `boolean`             | no       | `false` | —           |
| `readOnly`      | `boolean`             | no       | `false` | —           |
| `labels`        | `RatingGroupLabels`   | no       | —       | —           |

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
