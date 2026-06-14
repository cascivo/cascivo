# Notification

Inline, actionable notification banner that surfaces a titled message with an optional recovery action

## Install

```bash
npx cascivo add notification
```

## Category

`feedback`

## Variants

- `info`
- `success`
- `warning`
- `error`

## Props

| Prop          | Type                   | Required  | Default   | Description |
| ------------- | ---------------------- | --------- | --------- | ----------- | --- | ------ | --- |
| `title`       | `ReactNode`            | yes       | —         | —           |
| `description` | `ReactNode`            | no        | —         | —           |
| `variant`     | `'info'                | 'success' | 'warning' | 'error'`    | no  | `info` | —   |
| `dismissible` | `boolean`              | no        | `false`   | —           |
| `onDismiss`   | `() => void`           | no        | —         | —           |
| `actions`     | `ReactNode`            | no        | —         | —           |
| `icon`        | `ReactNode`            | no        | —         | —           |
| `labels`      | `{ dismiss?: string }` | no        | —         | —           |

## Examples

### Info

```tsx
<Notification variant="info" title="Sync complete" description="Your files are up to date." />
```

### Dismissible

```tsx
<Notification variant="success" title="Saved" dismissible onDismiss={handleDismiss} />
```

### Actionable

```tsx
<Notification
  variant="error"
  title="Upload failed"
  description="The connection dropped."
  actions={<Button onClick={retry}>Retry</Button>}
/>
```

## Design tokens

- `--cascivo-color-info`
- `--cascivo-color-success`
- `--cascivo-color-warning`
- `--cascivo-color-destructive`
- `--cascivo-color-border`
- `--cascivo-color-surface`
- `--cascivo-radius-surface`
- `--cascivo-motion-enter`
- `--cascivo-motion-exit`

## Accessibility

- **WCAG level:** 2.2-AA
- **ARIA role:** `alert`

## Dependencies

- `@cascivo/core`
- `@cascivo/i18n`

## Tags

notification, banner, message, feedback, actionable
