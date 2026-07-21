# Stat

Displays a key metric with optional delta, trend direction and help text

## Install

Copy-paste the source (you own and can edit it):

```bash
npx cascivo add stat
```

Or use it from the prebuilt package without copying:

```tsx
import { Stat } from '@cascivo/react'
```

## Category

`display`

## Props

| Prop       | Type                       | Required | Default | Description                                                                                                |
| ---------- | -------------------------- | -------- | ------- | ---------------------------------------------------------------------------------------------------------- |
| `label`    | `string`                   | yes      | —       | What the metric measures                                                                                   |
| `value`    | `string \| number`         | yes      | —       | The metric value                                                                                           |
| `delta`    | `string`                   | no       | —       | Change indicator rendered next to the trend arrow                                                          |
| `trend`    | `'up' \| 'down' \| 'flat'` | no       | `flat`  | Direction of the trend indicator ('up' \| 'down' \| 'flat').                                               |
| `helpText` | `string`                   | no       | —       | Fine print below the value (methodology, time range)                                                       |
| `visual`   | `React.ReactNode`          | no       | —       | Trailing decorative visual, e.g. a Sparkline from @cascivo/charts, rendered below the value/delta/helpText |

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

### With a trailing sparkline

Sparkline is from @cascivo/charts

```tsx
<Stat
  label="Requests / min"
  value="1.2k"
  delta="+4.3%"
  trend="up"
  visual={<Sparkline data={requestsPerMinute} label="Requests per minute trend" />}
/>
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

---

_Generated from registry v0.9.0 on 2026-07-21. Docs track `main`; compare with https://cascivo.com/registry.json `.version`._
