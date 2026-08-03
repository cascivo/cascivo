# StatsCards

Grid of KPI stat cards with trend badges.

## Install

Copy-paste the source (you own and can edit it):

```bash
npx cascivo add block/stats-cards
```

_Copy-paste only — `StatsCards` is not exported from `@cascivo/react`. Run the command above to own the source, or compose it from the exported primitives (`Flex`, `Grid`, `Heading`, …)._

## Category

`display`

## Props

| Prop    | Type     | Required | Default     | Description   |
| ------- | -------- | -------- | ----------- | ------------- |
| `stats` | `Stat[]` | no       | `demoStats` | KPI stat data |

## Examples

### Default

Demo KPI stats

```tsx
<StatsCards />
```

## Client JavaScript

None. Renders complete and correct with JavaScript disabled, and can be rendered directly from a React Server Component without hydrating.

## Accessibility

- **WCAG level:** 2.1-AA
- **ARIA role:** `generic`

## Dependencies

- `@cascivo/react`

## Tags

block, stats, kpi, cards

---

_Generated from registry v0.14.0 on 2026-07-31. Docs track `main`; compare with https://cascivo.com/registry.json `.version`._
