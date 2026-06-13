# Status

Colored dot with a label communicating the state of a system or entity

## Install

```bash
npx cascade add status
```

## Category

`display`

## Variants

- `success`
- `warning`
- `error`
- `info`
- `neutral`

## Props

| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `status` | `'success' | 'warning' | 'error' | 'info' | 'neutral'` | no | `neutral` | — |
| `pulse` | `boolean` | no | `false` | Pulses the dot — gated behind prefers-reduced-motion: no-preference |

## Examples

### Default

```tsx
<Status>Unknown</Status>
```

### Success

```tsx
<Status status="success">Operational</Status>
```

### Pulsing

The pulse animation respects prefers-reduced-motion

```tsx
<Status status="info" pulse>Deploying</Status>
```

## Design tokens

- `--cascade-color-success`
- `--cascade-color-warning`
- `--cascade-color-error`
- `--cascade-color-info`
- `--cascade-color-text-muted`
- `--cascade-color-text`
- `--cascade-radius-full`

## Accessibility

- **WCAG level:** 2.2-AA
- **ARIA role:** `none`

## Dependencies

- `@cascade-ui/core`

## Tags

status, indicator, dot, badge
