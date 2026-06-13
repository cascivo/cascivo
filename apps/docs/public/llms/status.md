# Status

Colored dot with a label communicating the state of a system or entity

## Install

```bash
npx cascivo add status
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

| Prop     | Type       | Required  | Default | Description                                                         |
| -------- | ---------- | --------- | ------- | ------------------------------------------------------------------- | ---------- | --- | --------- | --- |
| `status` | `'success' | 'warning' | 'error' | 'info'                                                              | 'neutral'` | no  | `neutral` | —   |
| `pulse`  | `boolean`  | no        | `false` | Pulses the dot — gated behind prefers-reduced-motion: no-preference |

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
<Status status="info" pulse>
  Deploying
</Status>
```

## Design tokens

- `--cascivo-color-success`
- `--cascivo-color-warning`
- `--cascivo-color-error`
- `--cascivo-color-info`
- `--cascivo-color-text-muted`
- `--cascivo-color-text`
- `--cascivo-radius-full`

## Accessibility

- **WCAG level:** 2.2-AA
- **ARIA role:** `none`

## Dependencies

- `@cascivo/core`

## Tags

status, indicator, dot, badge
