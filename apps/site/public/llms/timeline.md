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

| Prop          | Type                                                                                                                                           | Required | Default    | Description                          |
| ------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- | -------- | ---------- | ------------------------------------ |
| `items`       | `{ id: string; title: ReactNode; description?: ReactNode; time?: string; icon?: ReactNode; status?: "complete" \| "current" \| "upcoming" }[]` | yes      | —          | The items to render.                 |
| `orientation` | `'vertical' \| 'horizontal'`                                                                                                                   | no       | `vertical` | Layout orientation of the component. |

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

## Design tokens

- `--cascivo-color-border`
- `--cascivo-color-border-strong`
- `--cascivo-color-surface`
- `--cascivo-color-success`
- `--cascivo-color-primary`
- `--cascivo-radius-full`

## Accessibility

- **WCAG level:** 2.2-AA
- **ARIA role:** `list`

## Dependencies

- `@cascivo/core`

## Tags

timeline, steps, history, progress, events

---

_Generated from registry v0.9.0 on 2026-07-22. Docs track `main`; compare with https://cascivo.com/registry.json `.version`._
