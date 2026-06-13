# EmptyDashboard

Dashboard page showing an empty state with a call-to-action button.

## Install

```bash
npx cascade add block/empty-dashboard
```

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
