# Flex

Flex layout primitive for vertical or horizontal stacking with gap control. ⚠ Unlike CSS `flex-direction`, `direction` defaults to `vertical` — pass `direction="horizontal"` for a row.

## Install

Copy-paste the source (you own and can edit it):

```bash
npx cascivo add layout/flex
```

Or use it from the prebuilt package without copying:

```tsx
import { Flex } from '@cascivo/react'
```

## Category

`layout`

## Props

| Prop        | Type                                      | Required | Default    | Description                                                                                                                                                                                               |
| ----------- | ----------------------------------------- | -------- | ---------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `direction` | `'vertical' \| 'horizontal'`              | no       | `vertical` | Flex direction. ⚠ Defaults to `vertical`, unlike CSS `flex-direction` (and unlike Chakra/MUI/Radix `Flex`, which default to a row) — `<Flex justify="between">` alone produces a centered vertical stack. |
| `gap`       | `1\|2\|3\|4\|5\|6\|8\|10\|12`             | no       | `4`        | Spacing token step                                                                                                                                                                                        |
| `align`     | `'start'\|'center'\|'end'\|'stretch'`     | no       | —          | align-items                                                                                                                                                                                               |
| `justify`   | `'start'\|'center'\|'end'\|'between'`     | no       | —          | justify-content                                                                                                                                                                                           |
| `wrap`      | `boolean`                                 | no       | `false`    | Allow wrapping                                                                                                                                                                                            |
| `size`      | `'auto' \| 'fixed' \| 'grow' \| 'shrink'` | no       | `auto`     | FlexItem: main-axis sizing. 'fixed' (flex: 0 0 auto) is what a fixed-width child like Sparkline needs; 'grow' takes the leftover width without shrinking; 'shrink' gives way but never grows.             |
| `basis`     | `string`                                  | no       | —          | FlexItem: flex-basis — the child's size before free space is distributed. Any CSS length.                                                                                                                 |
| `truncate`  | `boolean`                                 | no       | `false`    | FlexItem: allow the child to shrink below its content width (releases the flex item's `min-width: auto` floor and ellipsizes). Without it a long unbreakable string pushes its siblings out of the row.   |

## Examples

### Vertical

Default vertical stack

```tsx
<Flex gap={4}>
  <div>A</div>
  <div>B</div>
</Flex>
```

### Horizontal

Row layout

```tsx
<Flex direction="horizontal" gap={2}>
  <div>A</div>
  <div>B</div>
</Flex>
```

### Toolbar: one field absorbs the row, the rest keep their width

Without FlexItem the Search takes the whole row and pushes the Select onto the next line

```tsx
<Flex direction="horizontal" gap={2}>
  <FlexItem size="grow" basis="0">
    <Search ariaLabel="Filter deployments" />
  </FlexItem>
  <FlexItem size="fixed">
    <Select options={states} ariaLabel="State" />
  </FlexItem>
</Flex>
```

### Protecting a fixed-width child

Sparkline is fixed-width and will not shrink; `size="fixed"` keeps it out of flex sizing, `truncate` lets the URL beside it ellipsize instead of pushing it out

```tsx
<Flex direction="horizontal" gap={3} align="center">
  <FlexItem truncate>{deployment.url}</FlexItem>
  <FlexItem size="fixed">
    <Sparkline data={points} label="Requests" />
  </FlexItem>
</Flex>
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

layout, flex, stack, spacing

---

_Generated from registry v1.1.0 on 2026-09-07. Docs track `main`; compare with https://cascivo.com/registry.json `.version`._
