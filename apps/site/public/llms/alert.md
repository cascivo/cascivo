# Alert

Highlights a short, important message inline

## Install

Copy-paste the source (you own and can edit it):

```bash
npx cascivo add alert
```

Or use it from the prebuilt package without copying:

```tsx
import { Alert } from '@cascivo/react'
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

| Prop          | Type                                                             | Required | Default   | Description                                                                                                                                                                                                                                                        |
| ------------- | ---------------------------------------------------------------- | -------- | --------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `variant`     | `'default' \| 'info' \| 'success' \| 'warning' \| 'destructive'` | no       | `default` | Severity tone: `default` (neutral), `info`, `success`, `warning` or `destructive`. Sets the icon and the accent colour. Unlike Badge/Tag/Notification this is a private union, not `ToneInput` — the canonical `danger`/`neutral` spellings are not accepted here. |
| `title`       | `string`                                                         | no       | —         | Title text for the component.                                                                                                                                                                                                                                      |
| `icon`        | `ReactNode`                                                      | no       | —         | Icon element rendered in the component.                                                                                                                                                                                                                            |
| `dismissible` | `boolean`                                                        | no       | `false`   | When true, shows a control to dismiss the component.                                                                                                                                                                                                               |
| `onDismiss`   | `() => void`                                                     | no       | —         | Called when the component is dismissed.                                                                                                                                                                                                                            |
| `action`      | `{ label: string; onClick: () => void }`                         | no       | —         | Primary action shown in the component.                                                                                                                                                                                                                             |

## Examples

### Info

```tsx
<Alert variant="info" title="Heads up">
  Your trial ends soon.
</Alert>
```

### Dismissible

```tsx
<Alert variant="success" dismissible title="Saved">
  Changes saved.
</Alert>
```

### Actionable

```tsx
<Alert variant="warning" title="Update available" action={{ label: 'Update now', onClick: update }}>
  A new version is ready.
</Alert>
```

## Client JavaScript

Enhancement only. The component still does its job with JavaScript disabled — the server-rendered HTML is correct and nothing is unreachable; client JS adds polish on top.

## Design tokens

- `--cascivo-color-info`
- `--cascivo-color-success`
- `--cascivo-color-warning`
- `--cascivo-color-destructive`
- `--cascivo-color-border`
- `--cascivo-radius-md`

## Accessibility

- **WCAG level:** 2.2-AA
- **ARIA role:** `alert`

## Dependencies

- `@cascivo/core`
- `@cascivo/i18n`

## Tags

notification, message, feedback

---

_Generated from registry v1.0.0 on 2026-08-29. Docs track `main`; compare with https://cascivo.com/registry.json `.version`._
