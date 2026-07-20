# Flex

Flex layout primitive for vertical or horizontal stacking with gap control.

## Install

Copy-paste the source (you own and can edit it):

```bash
npx cascivo add layout/flex
```

_Copy-paste only — this block/layout is not published as an importable package._

## Category

`layout`

## Props

| Prop        | Type                                  | Required | Default | Description        |
| ----------- | ------------------------------------- | -------- | ------- | ------------------ |
| `direction` | `'vertical' \| 'horizontal'`          | no       | —       | Flex direction     |
| `gap`       | `1\|2\|3\|4\|5\|6\|8\|10\|12`         | no       | —       | Spacing token step |
| `align`     | `'start'\|'center'\|'end'\|'stretch'` | no       | —       | align-items        |
| `justify`   | `'start'\|'center'\|'end'\|'between'` | no       | —       | justify-content    |
| `wrap`      | `boolean`                             | no       | —       | Allow wrapping     |

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

_Generated from registry v0.7.1 on 2026-07-20. Docs track `main`; compare with https://cascivo.com/registry.json `.version`._
