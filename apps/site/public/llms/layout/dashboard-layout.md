# DashboardLayout

Dashboard page layout with stats strip, main content area, and optional aside.

## Install

Copy-paste the source (you own and can edit it):

```bash
npx cascivo add layout/dashboard-layout
```

Or use it from the prebuilt package without copying:

```tsx
import { DashboardLayout } from '@cascivo/react'
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

## Client JavaScript

None. Renders complete and correct with JavaScript disabled, and can be rendered directly from a React Server Component without hydrating.

## Design tokens

- `--cascivo-space-4`
- `--cascivo-space-6`

## Accessibility

- **WCAG level:** 2.1-AA
- **ARIA role:** `generic`

## Dependencies

- `@cascivo/core`

## Tags

layout, dashboard, page

---

_Generated from registry v1.9.0 on 2026-10-09. Docs track `main`; compare with https://cascivo.com/registry.json `.version`._
