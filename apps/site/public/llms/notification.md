# Notification

Inline, actionable notification banner that surfaces a titled message with an optional recovery action

## Install

Copy-paste the source (you own and can edit it):

```bash
npx cascivo add notification
```

Or use it from the prebuilt package without copying:

```tsx
import { Notification } from '@cascivo/react'
```

## Category

`feedback`

## Variants

- `info`
- `success`
- `warning`
- `error`

## Props

| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `title` | `ReactNode` | yes | — | Title text for the component. |
| `description` | `ReactNode` | no | — | Supporting description text. |
| `variant` | `'info' \| 'success' \| 'warning' \| 'error'` | no | `info` | Severity tone. Accepts the catalog-wide `Tone` vocabulary (`neutral \| info \| success \| warning \| danger`) plus Notification's historical spellings (`error`, `destructive` → danger). |
| `dismissible` | `boolean` | no | `false` | When true, shows a control to dismiss the component. |
| `onDismiss` | `() => void` | no | — | Called when the component is dismissed. |
| `actions` | `ReactNode` | no | — | Action elements shown in the notification. |
| `icon` | `ReactNode` | no | — | Icon element rendered in the component. |
| `labels` | `{ dismiss?: string }` | no | — | Overrides for the component’s user-visible strings (i18n). |

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
<Notification variant="error" title="Upload failed" description="The connection dropped." actions={<Button onClick={retry}>Retry</Button>} />
```

## Client JavaScript

Enhancement only. The component still does its job with JavaScript disabled — the server-rendered HTML is correct and nothing is unreachable; client JS adds polish on top.

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

---

_Generated from registry v0.18.0 on 2026-08-17. Docs track `main`; compare with https://cascivo.com/registry.json `.version`._
