# Spacer

Fixed-height spacing block using design token steps.

## Install

Copy-paste the source (you own and can edit it):

```bash
npx cascivo add layout/spacer
```

_Copy-paste only — this block/layout is not published as an importable package._

## Category

`layout`

## Props

| Prop   | Type                          | Required | Default | Description        |
| ------ | ----------------------------- | -------- | ------- | ------------------ |
| `size` | `1\|2\|3\|4\|5\|6\|8\|10\|12` | no       | —       | Spacing token step |

## Examples

### Spacer

Adds vertical space between elements

```tsx
<Spacer size={8} />
```

## Design tokens

- `--cascivo-space-*`

## Accessibility

- **WCAG level:** 2.1-AA
- **ARIA role:** `none`

## Dependencies

- `@cascivo/core`

## Tags

layout, spacer, spacing

---

_Generated from registry v0.7.1 on 2026-07-20. Docs track `main`; compare with https://cascivo.com/registry.json `.version`._
