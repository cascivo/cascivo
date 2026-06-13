# ProgressCircle

Circular determinate progress indicator rendered as an SVG arc

## Install

```bash
npx cascade add progress-circle
```

## Category

`feedback`

## Sizes

- `sm`
- `md`
- `lg`

## Props

| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `value` | `number` | yes | — | Current value from 0 to max — clamped |
| `max` | `number` | no | `100` | — |
| `size` | `'sm' | 'md' | 'lg'` | no | `md` | — |
| `showValue` | `boolean` | no | `false` | Renders the rounded percentage in the center — pairs best with md and lg |
| `label` | `string` | no | — | Accessible name announced by screen readers |

## Examples

### Default

```tsx
<ProgressCircle value={40} label="Loading" />
```

### With value

```tsx
<ProgressCircle value={72} showValue size="lg" label="Upload progress" />
```

### Custom max

```tsx
<ProgressCircle value={3} max={8} label="Steps completed" />
```

## Design tokens

- `--cascade-color-border`
- `--cascade-color-accent`
- `--cascade-color-text`

## Accessibility

- **WCAG level:** 2.2-AA
- **ARIA role:** `progressbar`

## Dependencies

- `@cascade-ui/core`

## Tags

progress, loading, circle, feedback
