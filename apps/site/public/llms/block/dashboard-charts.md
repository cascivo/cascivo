# DashboardCharts

Dashboard layout with KPI tiles, line chart, bar chart, and pie chart.

## Install

Copy-paste the source (you own and can edit it):

```bash
npx cascivo add block/dashboard-charts
```

_Copy-paste only — `DashboardCharts` is not exported from `@cascivo/react`. Run the command above to own the source, or compose it from the exported primitives (`Flex`, `Grid`, `Heading`, …)._

## Category

`display`

## Props

| Prop        | Type     | Required | Default | Description                                                              |
| ----------- | -------- | -------- | ------- | ------------------------------------------------------------------------ |
| `className` | `string` | no       | —       | Additional CSS class names merged onto the root DashboardLayout element. |

## Examples

### Default

Charts dashboard demo

```tsx
<DashboardCharts />
```

## Client JavaScript

None. Renders complete and correct with JavaScript disabled, and can be rendered directly from a React Server Component without hydrating.

## Accessibility

- **WCAG level:** 2.1-AA
- **ARIA role:** `generic`

## Dependencies

- `@cascivo/charts`
- `@cascivo/react`

## Tags

block, dashboard, charts, kpi

---

_Generated from registry v1.0.0 on 2026-08-26. Docs track `main`; compare with https://cascivo.com/registry.json `.version`._
