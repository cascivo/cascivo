# Center

Horizontally centered container with a configurable max-width.

## Install

Copy-paste the source (you own and can edit it):

```bash
npx cascivo add layout/center
```

Or use it from the prebuilt package without copying:

```tsx
import { Center } from '@cascivo/react'
```

## Category

`layout`

## Props

| Prop       | Type     | Required | Default | Description         |
| ---------- | -------- | -------- | ------- | ------------------- |
| `maxWidth` | `string` | no       | `48rem` | CSS max-width value |

## Examples

### Centered content

Centered container with custom max-width

```tsx
<Center maxWidth="60rem">
  <p>Content</p>
</Center>
```

## Design tokens

- `--cascivo-space-4`

## Accessibility

- **WCAG level:** 2.1-AA
- **ARIA role:** `generic`

## Dependencies

- `@cascivo/core`

## Tags

layout, center, wrapper

---

_Generated from registry v0.11.1 on 2026-07-25. Docs track `main`; compare with https://cascivo.com/registry.json `.version`._
