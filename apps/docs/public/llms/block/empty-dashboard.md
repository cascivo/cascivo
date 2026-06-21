# EmptyDashboard

Dashboard page showing an empty state with a call-to-action button.

## Install

Copy-paste the source (you own and can edit it):

```bash
npx cascivo add block/empty-dashboard
```

_Copy-paste only — this block/layout is not published as an importable package._

## Category

`display`

## Props

| Prop           | Type         | Required | Default | Description                |
| -------------- | ------------ | -------- | ------- | -------------------------- |
| `onCreateItem` | `() => void` | no       | —       | Create item button handler |

## Examples

### Default

Empty dashboard

```tsx
<EmptyDashboard />
```

## Accessibility

- **WCAG level:** 2.1-AA
- **ARIA role:** `generic`

## Dependencies

- `@cascivo/react`
- `layout/dashboard-layout`

## Tags

block, dashboard, empty-state, page
