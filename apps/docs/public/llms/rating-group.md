# RatingGroup

Star rating input with accessible radio group pattern

## Install

```bash
npx cascade add rating-group
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

| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `value` | `number` | yes | — | — |
| `onValueChange` | `(v: number) => void` | no | — | — |
| `max` | `number` | no | `5` | — |
| `size` | `'sm' | 'md' | 'lg'` | no | `md` | — |
| `disabled` | `boolean` | no | `false` | — |
| `readOnly` | `boolean` | no | `false` | — |
| `labels` | `RatingGroupLabels` | no | — | — |

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

- `--cascade-color-warning`
- `--cascade-color-border-strong`
- `--cascade-color-accent`
- `--cascade-radius-sm`

## Accessibility

- **WCAG level:** AA
- **ARIA role:** `radiogroup`
- **Keyboard:** Tab, Space, Enter

## Dependencies

- `@cascade-ui/core`

## Tags

form, rating, stars, input, feedback
