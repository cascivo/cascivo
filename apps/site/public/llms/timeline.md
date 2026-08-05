# Timeline

Ordered sequence of events with status markers and a connector line

## Install

Copy-paste the source (you own and can edit it):

```bash
npx cascivo add timeline
```

Or use it from the prebuilt package without copying:

```tsx
import { Timeline } from '@cascivo/react'
```

## Category

`display`

## Variants

- `vertical`
- `horizontal`

## States

- `complete`
- `current`
- `upcoming`

## Props

| Prop          | Type                                                                                                                                                                                                             | Required | Default    | Description                          |
| ------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------- | ---------- | ------------------------------------ |
| `items`       | `{ id: string; title: ReactNode; description?: ReactNode; time?: string; icon?: ReactNode; status?: "complete" \| "current" \| "upcoming"; tone?: "neutral" \| "info" \| "success" \| "warning" \| "danger" }[]` | yes      | —          | The items to render.                 |
| `orientation` | `'vertical' \| 'horizontal'`                                                                                                                                                                                     | no       | `vertical` | Layout orientation of the component. |

## Examples

### Vertical timeline with statuses

```tsx
<Timeline
  items={[
    { id: '1', title: 'Order placed', time: '09:00', status: 'complete' },
    { id: '2', title: 'Shipped', time: '12:30', status: 'current' },
    { id: '3', title: 'Delivered', status: 'upcoming' },
  ]}
/>
```

### Activity feed coloured by entry type

In a feed every entry is equally done, so `tone` — not `status` — is what separates them. Keep the meaning in the text too; colour alone is not perceivable.

```tsx
<Timeline
  items={[
    {
      id: '1',
      title: 'p99 latency 4.2s',
      description: 'ALERT · monitor',
      time: '14:28',
      tone: 'danger',
    },
    {
      id: '2',
      title: 'Rolling back deploy 4821',
      description: 'NOTE · bo',
      time: '14:49',
      tone: 'neutral',
    },
    {
      id: '3',
      title: 'Status changed to monitoring',
      description: 'STATUS · ana',
      time: '15:12',
      tone: 'info',
    },
    {
      id: '4',
      title: 'Merged 2 edits from kim',
      description: 'MERGE · sync',
      time: '15:14',
      tone: 'success',
    },
  ]}
/>
```

## Client JavaScript

None. Renders complete and correct with JavaScript disabled, and can be rendered directly from a React Server Component without hydrating.

## Design tokens

- `--cascivo-color-border`
- `--cascivo-color-border-strong`
- `--cascivo-color-surface`
- `--cascivo-color-success`
- `--cascivo-color-primary`
- `--cascivo-color-info`
- `--cascivo-color-warning`
- `--cascivo-color-destructive`
- `--cascivo-radius-full`

## Accessibility

- **WCAG level:** 2.2-AA
- **ARIA role:** `list`

## Dependencies

- `@cascivo/core`

## Tags

timeline, steps, history, progress, events

---

_Generated from registry v0.16.0 on 2026-08-05. Docs track `main`; compare with https://cascivo.com/registry.json `.version`._
