# AutoGrid

Media-query-free responsive grid — columns auto-fill based on available space.

## Install

Copy-paste the source (you own and can edit it):

```bash
npx cascivo add layout/auto-grid
```

_Copy-paste only — this block/layout is not published as an importable package._

## Category

`layout`

## Props

| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `min` | `string` | no | `"16rem"` | Minimum track width before items wrap to fewer columns |
| `gap` | `1\|2\|3\|4\|5\|6\|8\|10\|12` | no | `4` | Spacing token step |

## Examples

### Auto-filling grid

Items fill available space and wrap when narrower than 12rem

```tsx
<AutoGrid min="12rem" gap={4}><div>Card 1</div><div>Card 2</div><div>Card 3</div></AutoGrid>
```

## Design tokens

- `--cascivo-space-*`

## Accessibility

- **WCAG level:** 2.1-AA
- **ARIA role:** `generic`

## Dependencies

- `@cascivo/core`

## Tags

layout, grid, responsive
