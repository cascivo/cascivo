# EmptyDashboard

Dashboard page showing an empty state with a call-to-action button.

## Install

Copy-paste the source (you own and can edit it):

```bash
npx cascivo add block/empty-dashboard
```

_Copy-paste only — `EmptyDashboard` is not exported from `@cascivo/react`. Run the command above to own the source, or compose it from the exported primitives (`Flex`, `Grid`, `Heading`, …)._

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

## Tags

block, dashboard, empty-state, page

---

_Generated from registry v0.17.0 on 2026-08-11. Docs track `main`; compare with https://cascivo.com/registry.json `.version`._
