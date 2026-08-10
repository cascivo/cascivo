# Columns

Equal-width multi-column layout that collapses to single column on narrow viewports.

## Install

Copy-paste the source (you own and can edit it):

```bash
npx cascivo add layout/columns
```

Or use it from the prebuilt package without copying:

```tsx
import { Columns } from '@cascivo/react'
```

## Category

`layout`

## Props

| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `count` | `2\|3\|4` | no | `2` | Number of equal columns |
| `gap` | `1\|2\|3\|4\|5\|6\|8\|10\|12` | no | `4` | Spacing token step |

## Examples

### Three columns

Three equal columns

```tsx
<Columns count={3}><div>A</div><div>B</div><div>C</div></Columns>
```

## Client JavaScript

None. Renders complete and correct with JavaScript disabled, and can be rendered directly from a React Server Component without hydrating.

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

_Generated from registry v0.16.1 on 2026-08-09. Docs track `main`; compare with https://cascivo.com/registry.json `.version`._
