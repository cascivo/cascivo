# Columns

Equal-width multi-column layout that collapses to single column on narrow viewports.

## Install

Copy-paste the source (you own and can edit it):

```bash
npx cascivo add layout/columns
```

_Copy-paste only — this block/layout is not published as an importable package._

## Category

`layout`

## Props

| Prop    | Type                          | Required | Default | Description             |
| ------- | ----------------------------- | -------- | ------- | ----------------------- |
| `count` | `2\|3\|4`                     | no       | —       | Number of equal columns |
| `gap`   | `1\|2\|3\|4\|5\|6\|8\|10\|12` | no       | —       | Spacing token step      |

## Examples

### Three columns

Three equal columns

```tsx
<Columns count={3}>
  <div>A</div>
  <div>B</div>
  <div>C</div>
</Columns>
```

## Design tokens

- `--cascivo-space-*`

## Accessibility

- **WCAG level:** 2.1-AA
- **ARIA role:** `generic`

## Dependencies

- `@cascivo/core`

## Tags

layout, grid, columns

---

_Generated from registry v0.7.1 on 2026-07-20. Docs track `main`; compare with https://cascivo.com/registry.json `.version`._
