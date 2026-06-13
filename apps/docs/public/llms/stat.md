# Stat

Displays a key metric with optional delta, trend direction and help text

## Install

```bash
npx cascade add stat
```

## Category

`display`

## Props

| Prop       | Type     | Required | Default | Description                                          |
| ---------- | -------- | -------- | ------- | ---------------------------------------------------- | ---------------- | --- |
| `label`    | `string` | yes      | —       | What the metric measures                             |
| `value`    | `string  | number`  | yes     | —                                                    | The metric value |
| `delta`    | `string` | no       | —       | Change indicator rendered next to the trend arrow    |
| `trend`    | `'up'    | 'down'   | 'flat'` | no                                                   | `flat`           | —   |
| `helpText` | `string` | no       | —       | Fine print below the value (methodology, time range) |

## Examples

### Default

```tsx
<Stat label="Components" value={106} />
```

### With trend

```tsx
<Stat label="Bundle size" value="12.4 kB" delta="-1.2 kB" trend="up" />
```

### With help text

```tsx
<Stat label="Axe violations" value={0} helpText="WCAG 2.1 AA, 4 app states" />
```

## Design tokens

- `--cascivo-color-text`
- `--cascivo-color-text-subtle`
- `--cascivo-color-text-muted`
- `--cascivo-color-success`
- `--cascivo-color-destructive`

## Accessibility

- **WCAG level:** 2.2-AA
- **ARIA role:** `none`

## Dependencies

- `@cascivo/core`

## Tags

stat, kpi, metric, number
