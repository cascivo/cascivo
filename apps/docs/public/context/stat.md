# Stat

**Category:** display  
**Description:** Displays a key metric with optional delta, trend direction and help text

## When to use

- Highlighting a single key metric with a clear label
- Showing change over time with a delta and trend direction
- Annotating a metric with methodology or time-range help text

## When NOT to use

- Multiple comparable rows of data — use DataTable
- A non-numeric status label — use Badge or Status

## Anti-patterns

### Stat optimizes for one headline number, not tabular comparison

**Bad:** `A grid of Stats used to fake a data table`  
**Good:** `DataTable when the values are rows to compare and sort`  
**Why:** Stat optimizes for one headline number, not tabular comparison

## Related components

- **Card** (contained-by): Stats commonly sit inside a Card tile on dashboards

## Accessibility rationale

Presentational by role; the label-value pairing is real text so the metric and its meaning are read in order, and trend direction is conveyed by text/glyph, not color alone

## Props

| Name | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `label` | `string` | Yes | — | What the metric measures |
| `value` | `string | number` | Yes | — | The metric value |
| `delta` | `string` | No | — | Change indicator rendered next to the trend arrow |
| `trend` | `'up' | 'down' | 'flat'` | No | flat | — |
| `helpText` | `string` | No | — | Fine print below the value (methodology, time range) |

## Tokens

- `--cascivo-color-text`
- `--cascivo-color-text-subtle`
- `--cascivo-color-text-muted`
- `--cascivo-color-success`
- `--cascivo-color-destructive`

## Examples

### Default

```jsx
<Stat label="Components" value={106} />
```

### With trend

```jsx
<Stat label="Bundle size" value="12.4 kB" delta="-1.2 kB" trend="up" />
```

### With help text

```jsx
<Stat label="Axe violations" value={0} helpText="WCAG 2.1 AA, 4 app states" />
```

## Boundaries

| Area | Level | Note |
|------|-------|------|
| delta and trend | flexible | Optional — include only when change is meaningful |
| token names | strict | Trend colors must resolve to --cascivo-color-success/destructive |
