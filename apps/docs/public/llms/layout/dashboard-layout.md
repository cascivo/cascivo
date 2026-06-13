# DashboardLayout

Dashboard page layout with stats strip, main content area, and optional aside.

## Install

```bash
npx cascade add layout/dashboard-layout
```

## Category

`layout`

## Props

| Prop    | Type        | Required | Default | Description                   |
| ------- | ----------- | -------- | ------- | ----------------------------- |
| `stats` | `ReactNode` | no       | —       | Stats/KPI row (auto-fit grid) |
| `main`  | `ReactNode` | yes      | —       | Main content area             |
| `aside` | `ReactNode` | no       | —       | Optional aside panel (20rem)  |

## Examples

### With stats

Stats + main layout

```tsx
<DashboardLayout stats={<div>KPIs</div>} main={<div>Content</div>} />
```

## Design tokens

- `--cascivo-space-4`
- `--cascivo-space-6`

## Accessibility

- **WCAG level:** 2.1-AA
- **ARIA role:** `generic`

## Dependencies

- `@cascade-ui/core`

## Tags

layout, dashboard, page
