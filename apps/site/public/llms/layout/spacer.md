# Spacer

Fixed-height spacing block using design token steps.

## Install

Copy-paste the source (you own and can edit it):

```bash
npx cascivo add layout/spacer
```

Or use it from the prebuilt package without copying:

```tsx
import { Spacer } from '@cascivo/react'
```

## Category

`layout`

## Props

| Prop   | Type                          | Required | Default | Description        |
| ------ | ----------------------------- | -------- | ------- | ------------------ |
| `size` | `1\|2\|3\|4\|5\|6\|8\|10\|12` | no       | `4`     | Spacing token step |

## Examples

### Spacer

Adds vertical space between elements

```tsx
<Spacer size={8} />
```

## Client JavaScript

None. Renders complete and correct with JavaScript disabled, and can be rendered directly from a React Server Component without hydrating.

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

_Generated from registry v1.0.0 on 2026-08-29. Docs track `main`; compare with https://cascivo.com/registry.json `.version`._
