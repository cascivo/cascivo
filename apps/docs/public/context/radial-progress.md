# RadialProgress

**Category:** feedback  
**Description:** Circular progress indicator using conic-gradient, with percentage label and variant colors

## When to use

- Dashboard KPI metrics showing completion percentage
- Skill or profile completion meters
- Storage or quota usage displays

## When NOT to use

- Unknown-length operations where completion is not measurable — use Spinner
- Linear progress where a bar is more readable — use Progress or ProgressBar
- Comparing multiple values against each other — use a chart component

## Anti-patterns

### RadialProgress implies a known completion percentage; fake cycling breaks the semantic contract

**Bad:** `<RadialProgress value={indeterminate} /> with a fake cycling value`  
**Good:** `<Spinner /> for indeterminate loading states`  
**Why:** RadialProgress implies a known completion percentage; fake cycling breaks the semantic contract

## Related components

- **Spinner** (alternative): Use for indeterminate loading where total duration is unknown
- **Progress** (alternative): Use when a horizontal bar is more appropriate for the layout
- **ProgressCircle** (alternative): Similar shape but ProgressCircle uses SVG stroke; RadialProgress uses CSS conic-gradient

## Accessibility rationale

Renders a div with role="progressbar", aria-valuenow (clamped 0–100), aria-valuemin=0, aria-valuemax=100. Provide aria-label when no visible label describes the metric being measured.

## Props

| Name | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `value` | `number` | Yes | — | — |
| `size` | `'sm' | 'md' | 'lg'` | No | md | — |
| `variant` | `'primary' | 'info' | 'success' | 'warning' | 'error'` | No | primary | — |
| `children` | `React.ReactNode` | No | — | — |
| `aria-label` | `string` | No | — | — |
| `className` | `string` | No | — | — |

## Tokens

- `--cascivo-color-primary`
- `--cascivo-color-info`
- `--cascivo-color-success`
- `--cascivo-color-warning`
- `--cascivo-color-error`
- `--cascivo-color-surface`
- `--cascivo-color-surface-2`
- `--cascivo-color-text`
- `--cascivo-radius-full`

## Examples

### Default

Primary color, md size, auto percentage label

```jsx
<RadialProgress value={72} />
```

### Success large

Completed state with success color at large size

```jsx
<RadialProgress value={100} size="lg" variant="success" />
```

### Custom label

Override the default percentage label with custom content

```jsx
<RadialProgress value={45} variant="warning">45 GB</RadialProgress>
```

## Boundaries

| Area | Level | Note |
|------|-------|------|
| label | flexible | Default is the percentage string; pass children to override with any content |
| color | strict | Color resolves through --cascivo-color-* semantic tokens via data-variant |
