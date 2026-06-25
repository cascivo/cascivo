# InlineLoading

Compact inline status indicator that pairs a label with a loading, success, or error state

## Install

Copy-paste the source (you own and can edit it):

```bash
npx cascivo add inline-loading
```

Or use it from the prebuilt package without copying:

```tsx
import { InlineLoading } from '@cascivo/react'
```

## Category

`feedback`

## States

- `inactive`
- `active`
- `finished`
- `error`

## Props

| Prop     | Type                                                     | Required | Default    | Description |
| -------- | -------------------------------------------------------- | -------- | ---------- | ----------- | --- | --- | --- |
| `status` | `'inactive'                                              | 'active' | 'finished' | 'error'`    | yes | —   | —   |
| `label`  | `ReactNode`                                              | no       | —          | —           |
| `labels` | `{ active?: string; finished?: string; error?: string }` | no       | —          | —           |

## Examples

### Active

```tsx
<InlineLoading status="active" />
```

### Finished

```tsx
<InlineLoading status="finished" label="Saved" />
```

### Error

```tsx
<InlineLoading status="error" label="Save failed" />
```

## Design tokens

- `--cascivo-color-text`
- `--cascivo-color-text-muted`
- `--cascivo-color-success`
- `--cascivo-color-destructive`
- `--cascivo-motion-enter`

## Accessibility

- **WCAG level:** 2.2-AA
- **ARIA role:** `status`

## Dependencies

- `@cascivo/core`
- `@cascivo/i18n`

## Tags

loading, status, progress, feedback, spinner
