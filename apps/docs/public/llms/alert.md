# Alert

Highlights a short, important message inline

## Install

```bash
npx cascade add alert
```

## Category

`display`

## Variants

- `default`
- `info`
- `success`
- `warning`
- `destructive`

## Props

| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `variant` | `'default' | 'info' | 'success' | 'warning' | 'destructive'` | no | `default` | — |
| `title` | `string` | no | — | — |
| `icon` | `ReactNode` | no | — | — |
| `dismissible` | `boolean` | no | `false` | — |
| `onDismiss` | `() => void` | no | — | — |
| `action` | `{ label: string; onClick: () => void }` | no | — | — |

## Examples

### Info

```tsx
<Alert variant="info" title="Heads up">Your trial ends soon.</Alert>
```

### Dismissible

```tsx
<Alert variant="success" dismissible title="Saved">Changes saved.</Alert>
```

### Actionable

```tsx
<Alert variant="warning" title="Update available" action={{ label: 'Update now', onClick: update }}>A new version is ready.</Alert>
```

## Design tokens

- `--cascade-color-info`
- `--cascade-color-success`
- `--cascade-color-warning`
- `--cascade-color-destructive`
- `--cascade-color-border`
- `--cascade-radius-md`

## Accessibility

- **WCAG level:** 2.2-AA
- **ARIA role:** `alert`

## Dependencies

- `@cascade-ui/core`
- `@cascade-ui/i18n`

## Tags

notification, message, feedback
