# Grid

CSS grid layout primitive with responsive column collapsing.

## Install

```bash
npx cascade add layout/grid
```

## Category

`layout`

## Props

| Prop   | Type     | Required | Default | Description                 |
| ------ | -------- | -------- | ------- | --------------------------- | --- | --- | --- | --- | --- | --- | --- | ------------------ |
| `cols` | `number` | no       | —       | Number of grid columns      |
| `gap`  | `1       | 2        | 3       | 4                           | 5   | 6   | 8   | 10  | 12` | no  | —   | Spacing token step |
| `span` | `number` | no       | —       | GridItem: column span count |

## Examples

### Basic grid

3-column grid with spanning item

```tsx
<Grid cols={3} gap={4}>
  <GridItem span={1}>A</GridItem>
  <GridItem span={2}>B</GridItem>
</Grid>
```

## Design tokens

- `--cascivo-space-*`

## Accessibility

- **WCAG level:** 2.1-AA
- **ARIA role:** `generic`

## Dependencies

- `@cascade-ui/core`

## Tags

layout, grid, columns
