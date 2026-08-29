# Grid

CSS grid layout primitive with responsive column collapsing. Establishes its own containment, so responsive `cols` adapt to the grid’s own slot width with no wrapper or container ancestor required.

## Install

Copy-paste the source (you own and can edit it):

```bash
npx cascivo add layout/grid
```

Or use it from the prebuilt package without copying:

```tsx
import { Grid } from '@cascivo/react'
```

## Category

`layout`

## Props

| Prop        | Type                                                                              | Required | Default | Description                                                                                                                                                                                                                                        |
| ----------- | --------------------------------------------------------------------------------- | -------- | ------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `cols`      | `number \| { base?: number; sm?: number; md?: number; lg?: number; xl?: number }` | no       | `12`    | Column count — a number, or a per-breakpoint object (base/sm/md/lg/xl) for responsive columns                                                                                                                                                      |
| `gap`       | `1\|2\|3\|4\|5\|6\|8\|10\|12`                                                     | no       | `4`     | Spacing token step. Maps to the --cascivo-space-\* scale, which intentionally skips 7/9/11 — use 6 or 8.                                                                                                                                           |
| `align`     | `'start' \| 'center' \| 'end' \| 'stretch'`                                       | no       | —       | Block-axis alignment of items within their cells (align-items); default stretch                                                                                                                                                                    |
| `justify`   | `'start' \| 'center' \| 'end' \| 'stretch'`                                       | no       | —       | Inline-axis alignment of items within their cells (justify-items); default stretch                                                                                                                                                                 |
| `alignRows` | `boolean`                                                                         | no       | `false` | Align the internal bands of adjacent children via CSS subgrid — every CardHeader in a row shares one row track, every CardContent the next, every CardFooter the last. Where subgrid is unsupported the grid renders as it does without this prop. |
| `span`      | `number \| { base?: number; sm?: number; md?: number; lg?: number; xl?: number }` | no       | —       | GridItem: column span — a number, or a per-breakpoint object                                                                                                                                                                                       |

## Examples

### Basic grid

3-column grid with spanning item

```tsx
<Grid cols={3} gap={4}>
  <GridItem span={1}>A</GridItem>
  <GridItem span={2}>B</GridItem>
</Grid>
```

### Row-aligned card grid

Both cards put their content band on the same row track, so the headers align even though one wraps

```tsx
<Grid cols={3} gap={4} alignRows>
  <Card>
    <CardHeader title="A" />
    <CardContent>Short</CardContent>
  </Card>
  <Card>
    <CardHeader title="A much longer title that wraps" />
    <CardContent>Long</CardContent>
  </Card>
</Grid>
```

### Responsive dashboard grid

1 column on mobile, 2 on tablet, 3 on desktop; the first item spans 2 on desktop

```tsx
<Grid cols={{ base: 1, md: 2, lg: 3 }} gap={4}>
  <GridItem span={{ base: 1, lg: 2 }}>Wide</GridItem>
</Grid>
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

_Generated from registry v1.0.0 on 2026-08-26. Docs track `main`; compare with https://cascivo.com/registry.json `.version`._
