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

| Prop        | Type                                  | Required | Default    | Description                                                                                                                                                                                               |
| ----------- | ------------------------------------- | -------- | ---------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `direction` | `'vertical' \| 'horizontal'`          | no       | `vertical` | Flex direction. ⚠ Defaults to `vertical`, unlike CSS `flex-direction` (and unlike Chakra/MUI/Radix `Flex`, which default to a row) — `<Flex justify="between">` alone produces a centered vertical stack. |
| `gap`       | `1\|2\|3\|4\|5\|6\|8\|10\|12`         | no       | `4`        | Spacing token step                                                                                                                                                                                        |
| `align`     | `'start'\|'center'\|'end'\|'stretch'` | no       | —          | align-items                                                                                                                                                                                               |
| `justify`   | `'start'\|'center'\|'end'\|'between'` | no       | —          | justify-content                                                                                                                                                                                           |
| `wrap`      | `boolean`                             | no       | `false`    | Allow wrapping                                                                                                                                                                                            |

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

_Generated from registry v0.16.0 on 2026-08-05. Docs track `main`; compare with https://cascivo.com/registry.json `.version`._
